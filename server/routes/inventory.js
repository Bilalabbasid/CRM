const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;
