const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/staff
// @desc    Get all staff members
// @access  Private (Admin/Manager only)
router.get('/', authorize('admin', 'manager'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'manager', 'staff']),
  query('isActive').optional().isBoolean(),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role;
    const isActive = req.query.isActive;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Execute query
    const staff = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      staff,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/:id
// @desc    Get staff member by ID
// @access  Private (Admin/Manager only)
router.get('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Get performance stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const performanceStats = await Order.aggregate([
      {
        $match: {
          staff: staff._id,
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTips: { $sum: '$tip' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    res.json({
      staff,
      performance: performanceStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalTips: 0,
        averageOrderValue: 0
      }
    });
  } catch (error) {
    console.error('Get staff member error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/staff
// @desc    Create new staff member
// @access  Private (Admin only)
router.post('/', authorize('admin'), [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'staff']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  body('permissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const staff = new User(req.body);
    await staff.save();

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        isActive: staff.isActive,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/staff/:id
// @desc    Update staff member
// @access  Private (Admin only, or Manager for staff role)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'manager', 'staff']),
  body('phone').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('permissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const staff = await User.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check permissions
    if (req.user.role === 'manager' && (staff.role === 'admin' || req.body.role === 'admin')) {
      return res.status(403).json({ message: 'Managers cannot modify admin accounts' });
    }

    // Check for duplicate email if email is being updated
    if (req.body.email && req.body.email !== staff.email) {
      const duplicate = await User.findOne({
        _id: { $ne: req.params.id },
        email: req.body.email
      });
      
      if (duplicate) {
        return res.status(400).json({ 
          message: 'Another user already exists with this email' 
        });
      }
    }

    Object.assign(staff, req.body);
    await staff.save();

    res.json({
      message: 'Staff member updated successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        isActive: staff.isActive,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/staff/:id
// @desc    Delete staff member
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Prevent deleting the last admin
    if (staff.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last active admin account' 
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/:id/performance
// @desc    Get staff performance metrics
// @access  Private (Admin/Manager only)
router.get('/:id/performance', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const staff = await User.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

    // Performance metrics
    const performance = await Order.aggregate([
      {
        $match: {
          staff: staff._id,
          createdAt: { $gte: dateFrom, $lte: dateTo }
        }
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                totalRevenue: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] }
                },
                totalTips: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$tip', 0] }
                },
                averageOrderValue: {
                  $avg: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', null] }
                },
                averageOrderTime: {
                  $avg: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $gt: ['$actualTime', 0] }] }, '$actualTime', null] }
                }
              }
            }
          ],
          daily: [
            {
              $match: { status: 'completed' }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
                orders: { $sum: 1 },
                revenue: { $sum: '$total' },
                tips: { $sum: '$tip' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]
        }
      }
    ]);

    const result = {
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      },
      period: { from: dateFrom, to: dateTo },
      metrics: performance[0].overall[0] || {
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalTips: 0,
        averageOrderValue: 0,
        averageOrderTime: 0
      },
      dailyPerformance: performance[0].daily
    };

    res.json(result);
  } catch (error) {
    console.error('Get staff performance error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/stats/overview
// @desc    Get staff overview statistics
// @access  Private (Admin/Manager only)
router.get('/stats/overview', authorize('admin', 'manager'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalStaff: { $sum: 1 },
          activeStaff: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          adminCount: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          managerCount: {
            $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] }
          },
          staffCount: {
            $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] }
          }
        }
      }
    ]);

    // Top performers (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topPerformers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$staff',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTips: { $sum: '$tip' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $project: {
          name: '$staff.name',
          role: '$staff.role',
          totalOrders: 1,
          totalRevenue: 1,
          totalTips: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const result = {
      ...stats[0] || {
        totalStaff: 0,
        activeStaff: 0,
        adminCount: 0,
        managerCount: 0,
        staffCount: 0
      },
      topPerformers
    };

    res.json(result);
  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;