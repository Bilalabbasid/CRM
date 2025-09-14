const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const { authenticate, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// GET /api/inventory - anyone authenticated (staff, manager, admin) can view
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ name: 1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory', err);
    res.status(500).json({ message: 'Failed to fetch inventory.' });
  }
});

// POST /api/inventory - manager or admin
router.post('/', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { name, quantity = 0, unit = '', notes = '', lowStockThreshold = 5 } = req.body;
    const item = new InventoryItem({ name, quantity, unit, notes, lowStockThreshold, createdBy: req.user._id });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating inventory item', err);
    res.status(500).json({ message: 'Failed to create inventory item.' });
  }
});

// PUT /api/inventory/:id - manager or admin
router.put('/:id', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    const updates = ['name', 'quantity', 'unit', 'notes', 'lowStockThreshold'];
    updates.forEach((k) => { if (k in req.body) item[k] = req.body[k]; });

    await item.save();
    res.json(item);
  } catch (err) {
    console.error('Error updating inventory item', err);
    res.status(500).json({ message: 'Failed to update inventory item.' });
  }
});

// DELETE /api/inventory/:id - manager or admin
router.delete('/:id', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error('Error deleting inventory item', err);
    res.status(500).json({ message: 'Failed to delete inventory item.' });
  }
});

// GET /api/inventory/usage/today - manager or admin can view today's usage per menu item
router.get('/usage/today', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);

    // Aggregate orders created today and unwind items
    const pipeline = [
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', qtyOrdered: { $sum: '$items.quantity' } } },
      { $lookup: { from: 'menuitems', localField: '_id', foreignField: '_id', as: 'menu' } },
      { $unwind: { path: '$menu', preserveNullAndEmptyArrays: true } },
      { $project: { menuId: '$_id', name: '$menu.name', qtyOrdered: 1 } },
    ];

    const usage = await Order.aggregate(pipeline);

    // Map menu items to inventory items if names match (best-effort)
    const allInventory = await InventoryItem.find();
    const result = usage.map(u => {
      // try to find inventory item by name containing menu name
      const inv = allInventory.find(i => u.name && i.name && i.name.toLowerCase().includes(u.name.toLowerCase()));
      return {
        menuId: u.menuId,
        menuName: u.name,
        qtyOrdered: u.qtyOrdered,
        inventoryItemId: inv ? inv._id : null,
        inventoryName: inv ? inv.name : null,
        inventoryLeft: inv ? inv.quantity : null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error computing today usage', err);
    res.status(500).json({ message: 'Failed to compute usage.' });
  }
});

  // GET /api/inventory/stock-levels - all stock levels, mark critical
  router.get('/stock-levels', authenticate, authorize('manager', 'admin'), async (req, res) => {
    try {
      const items = await InventoryItem.find().sort({ name: 1 });
      const augmented = items.map(i => ({
        _id: i._id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        lowStockThreshold: i.lowStockThreshold,
        critical: (i.quantity ?? 0) <= (i.lowStockThreshold ?? 5)
      }));
      res.json(augmented);
    } catch (err) {
      console.error('Error fetching stock levels', err);
      res.status(500).json({ message: 'Failed to fetch stock levels.' });
    }
  });

  // GET /api/inventory/low-stock - items below threshold
  router.get('/low-stock', authenticate, authorize('manager', 'admin'), async (req, res) => {
    try {
      const items = await InventoryItem.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).sort({ quantity: 1 });
      res.json(items);
    } catch (err) {
      console.error('Error fetching low stock items', err);
      res.status(500).json({ message: 'Failed to fetch low stock items.' });
    }
  });

  // GET /api/inventory/fast-slow - fast-moving vs slow-moving items (by orders in last X days)
  router.get('/fast-slow', authenticate, authorize('manager', 'admin'), async (req, res) => {
    try {
      const days = Number(req.query.days || 30);
      const since = new Date(); since.setDate(since.getDate() - days);

      // Aggregate order items to compute total quantity sold per menuItem
      const agg = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.menuItem',
            qtySold: { $sum: '$items.quantity' }
          }
        },
        {
          $lookup: {
            from: 'menuitems', localField: '_id', foreignField: '_id', as: 'menuItem'
          }
        },
        { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
        { $project: { menuId: '$_id', name: '$menuItem.name', qtySold: 1 } },
        { $sort: { qtySold: -1 } }
      ]);

      // Map to inventory where possible
      const allInventory = await InventoryItem.find();
      const mapped = agg.map(a => {
        const inv = allInventory.find(i => a.name && i.name && i.name.toLowerCase().includes(a.name.toLowerCase()));
        return { menuId: a.menuId, name: a.name, qtySold: a.qtySold, inventoryItemId: inv ? inv._id : null, inventoryName: inv ? inv.name : null };
      });

      // Fast movers: top 10, slow movers: bottom 10 (with qtySold > 0 for slow movers) or items with zero sales
      const fast = mapped.slice(0, 10);
      const slow = mapped.slice(-10).reverse();

      res.json({ periodDays: days, fast, slow });
    } catch (err) {
      console.error('Error computing fast/slow movers', err);
      res.status(500).json({ message: 'Failed to compute movers.' });
    }
  });

  // GET /api/inventory/wastage - expired or unsold items (best-effort)
  router.get('/wastage', authenticate, authorize('manager', 'admin'), async (req, res) => {
    try {
      // This is best-effort: if InventoryItem has 'expiryDate' or 'status' fields
      const now = new Date();
      const expired = await InventoryItem.find({ expiryDate: { $exists: true, $lte: now } }).sort({ expiryDate: 1 });

      // Unsold items: items with zero sales in last X days (default 30)
      const days = Number(req.query.days || 30);
      const since = new Date(); since.setDate(since.getDate() - days);

      const salesAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.menuItem', qtySold: { $sum: '$items.quantity' } } }
      ]);

      const soldMap = new Map(salesAgg.map(s => [String(s._id), s.qtySold]));
      const allInv = await InventoryItem.find();
      const unsold = allInv.filter(i => {
        // try match by name against menu items mapping via menu collection
        // if inventory has menuItemId field, prefer that
        const soldQty = soldMap.get(String(i.menuItemId || '')) || 0;
        const nameMatchSold = soldMap.size === 0 ? 0 : 0; // fallback: not implemented heavy matching here
        return (soldQty === 0);
      });

      res.json({ expired, unsold, periodDays: days });
    } catch (err) {
      console.error('Error computing wastage', err);
      res.status(500).json({ message: 'Failed to compute wastage.' });
    }
  });

  // GET /api/inventory/suppliers/status - supplier order statuses
  // For now, this is a stub that returns any `supplierOrders` stored in InventoryItem or a SupplierOrder collection if available
  router.get('/suppliers/status', authenticate, authorize('manager', 'admin'), async (req, res) => {
    try {
      // Attempt to read from a SupplierOrder model if present
      let SupplierOrder;
      try { SupplierOrder = require('../models/SupplierOrder'); } catch (e) { SupplierOrder = null; }

      if (SupplierOrder) {
        const orders = await SupplierOrder.find().sort({ createdAt: -1 }).limit(50);
        return res.json({ source: 'supplierOrders', orders });
      }

      // Fallback: check InventoryItem.supplierOrders field
      const items = await InventoryItem.find({ 'supplierOrders.0': { $exists: true } }).select('name supplierOrders');
      res.json({ source: 'inventoryEmbedded', items });
    } catch (err) {
      console.error('Error fetching supplier status', err);
      res.status(500).json({ message: 'Failed to fetch supplier status.' });
    }
  });

module.exports = router;

