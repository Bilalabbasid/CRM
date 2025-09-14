const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Customer = require('../models/Customer');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/customers
// @desc    Get all customers with pagination and search
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'vip', 'blacklisted']),
  query('sortBy').optional().isIn(['name', 'email', 'totalSpent', 'visits', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    // Execute query
    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('loyaltyPoints').optional().isInt({ min: 0 }).withMessage('Loyalty points must be a non-negative integer'),
  body('status').optional().isIn(['active', 'inactive', 'vip', 'blacklisted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ 
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        message: 'Customer already exists with this email or phone number' 
      });
    }

    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ min: 10 }),
  body('loyaltyPoints').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'vip', 'blacklisted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check for duplicate email/phone if they're being updated
    if (req.body.email || req.body.phone) {
      const duplicateQuery = {
        _id: { $ne: req.params.id },
        $or: []
      };
      
      if (req.body.email) duplicateQuery.$or.push({ email: req.body.email });
      if (req.body.phone) duplicateQuery.$or.push({ phone: req.body.phone });
      
      const duplicate = await Customer.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(400).json({ 
          message: 'Another customer already exists with this email or phone number' 
        });
      }
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin/Manager only)
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers/:id/feedback
// @desc    Add feedback for customer
// @access  Private
router.post('/:id/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  body('orderId').optional().isMongoId().withMessage('Invalid order ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.feedback.push({
      rating: req.body.rating,
      comment: req.body.comment,
      orderId: req.body.orderId,
      date: new Date()
    });

    await customer.save();

    res.json({
      message: 'Feedback added successfully',
      customer
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/stats/overview
// @desc    Get customer statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          vipCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'vip'] }, 1, 0] }
          },
          totalLoyaltyPoints: { $sum: '$loyaltyPoints' },
          totalSpent: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' },
          totalVisits: { $sum: '$visits' }
        }
      }
    ]);

    const result = stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      vipCustomers: 0,
      totalLoyaltyPoints: 0,
      totalSpent: 0,
      averageSpent: 0,
      totalVisits: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;