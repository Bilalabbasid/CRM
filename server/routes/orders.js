const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/orders
// @desc    Get all orders with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']),
  query('orderType').optional().isIn(['dine-in', 'takeout', 'delivery']),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'refunded', 'failed']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('customerId').optional().isMongoId(),
  query('staffId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.status) query.status = req.query.status;
    if (req.query.orderType) query.orderType = req.query.orderType;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
    if (req.query.customerId) query.customer = req.query.customerId;
    if (req.query.staffId) query.staff = req.query.staffId;
    
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
    }

    // Execute query with population
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('staff', 'name email')
      .populate('items.menuItem', 'name category price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('staff', 'name email')
      .populate('items.menuItem', 'name category price description');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('orderType').isIn(['dine-in', 'takeout', 'delivery']).withMessage('Invalid order type'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItem').isMongoId().withMessage('Valid menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('tableNumber').optional().isInt({ min: 1 }),
  body('estimatedTime').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, orderType, items, tableNumber, estimatedTime, notes } = req.body;

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Verify all menu items exist and are available
    const menuItemIds = items.map(item => item.menuItem);
    const menuItems = await MenuItem.find({ 
      _id: { $in: menuItemIds }, 
      isAvailable: true 
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: 'Some menu items are not available' });
    }

    // Calculate totals
    let subtotal = 0;
    const validatedItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItem);
      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;
      
      return {
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions
      };
    });

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    // Create order
    const order = new Order({
      customer,
      staff: req.user._id,
      orderType,
      items: validatedItems,
      subtotal,
      tax,
      total,
      tableNumber,
      estimatedTime,
      notes
    });

    await order.save();

    // Update customer stats
    customerDoc.visits += 1;
    customerDoc.totalSpent += total;
    customerDoc.lastVisit = new Date();
    customerDoc.loyaltyPoints += Math.floor(total); // 1 point per dollar
    await customerDoc.save();

    // Update menu item order counts
    for (const item of items) {
      await MenuItem.findByIdAndUpdate(
        item.menuItem,
        { $inc: { timesOrdered: item.quantity } }
      );
    }

    // Populate the order before sending response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('staff', 'name email')
      .populate('items.menuItem', 'name category price');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('actualTime').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = req.body.status;
    if (req.body.actualTime) {
      order.actualTime = req.body.actualTime;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('staff', 'name email')
      .populate('items.menuItem', 'name category price');

    res.json({
      message: 'Order status updated successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', [
  body('paymentStatus').isIn(['pending', 'paid', 'refunded', 'failed']).withMessage('Invalid payment status'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'digital-wallet', 'gift-card', 'loyalty-points']),
  body('tip').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = req.body.paymentStatus;
    if (req.body.paymentMethod) order.paymentMethod = req.body.paymentMethod;
    if (req.body.tip !== undefined) {
      order.tip = req.body.tip;
      order.total = order.subtotal + order.tax + order.tip - order.discount.amount;
    }

    await order.save();

    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/feedback
// @desc    Add feedback to order
// @access  Private
router.post('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.feedback = {
      rating: req.body.rating,
      comment: req.body.comment,
      date: new Date()
    };

    await order.save();

    // Also add feedback to customer
    const customer = await Customer.findById(order.customer);
    if (customer) {
      customer.feedback.push({
        rating: req.body.rating,
        comment: req.body.comment,
        orderId: order._id,
        date: new Date()
      });
      await customer.save();
    }

    res.json({
      message: 'Feedback added successfully',
      order
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Order.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                averageOrderValue: { $avg: '$total' },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                pendingOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                }
              }
            }
          ],
          today: [
            {
              $match: {
                createdAt: { $gte: today, $lt: tomorrow }
              }
            },
            {
              $group: {
                _id: null,
                todayOrders: { $sum: 1 },
                todayRevenue: { $sum: '$total' }
              }
            }
          ],
          byType: [
            {
              $group: {
                _id: '$orderType',
                count: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      ...stats[0].overall[0] || {},
      ...stats[0].today[0] || { todayOrders: 0, todayRevenue: 0 },
      orderTypes: stats[0].byType
    };

    res.json(result);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;