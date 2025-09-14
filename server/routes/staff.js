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

// Additional Staff & Operations endpoints

// @route   GET /api/staff/attendance
// @desc    Get staff attendance / check-ins (best-effort: uses `checkins` field on User if present)
// @access  Private (Admin/Manager)
router.get('/attendance', authorize('admin', 'manager'), async (req, res) => {
  try {
    // support filtering by date (ISO)
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    end.setHours(23,59,59,999);

    // If User has `checkins` array with timestamps, aggregate them; otherwise return empty.
    const staffWithCheckins = await User.find({ role: 'staff' }).select('name role checkins isActive');

    const attendance = (staffWithCheckins || []).map(u => {
      const todays = (u.checkins || []).filter(ts => {
        const d = new Date(ts);
        return d >= start && d <= end;
      });
      return {
        id: u._id,
        name: u.name,
        isActive: u.isActive,
        checkins: todays,
        checkedIn: (todays.length > 0)
      };
    });

    res.json({ date: start.toISOString().slice(0,10), attendance });
  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/performance/top
// @desc    Get waiter/chef performance stats (orders served, avg speed)
// @access  Private (Admin/Manager)
router.get('/performance/top', authorize('admin', 'manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const perf = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'completed', staff: { $exists: true, $ne: null } } },
      { $group: { _id: '$staff', ordersServed: { $sum: 1 }, avgCompletion: { $avg: '$actualTime' }, totalRevenue: { $sum: '$total' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
      { $unwind: '$staff' },
      { $project: { staffId: '$_id', name: '$staff.name', role: '$staff.role', ordersServed: 1, avgCompletion: 1, totalRevenue: 1 } },
      { $sort: { ordersServed: -1 } },
      { $limit: 10 }
    ]);

    res.json(perf);
  } catch (error) {
    console.error('Get top performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/pending-tasks
// @desc    Get pending tasks (kitchen prep, stock updates) - best-effort using Orders and Inventory
// @access  Private (Admin/Manager)
router.get('/pending-tasks', authorize('admin', 'manager'), async (req, res) => {
  try {
    // Pending kitchen tasks: orders with status 'pending' or 'preparing'
    const kitchen = await Order.find({ status: { $in: ['pending', 'preparing'] } })
      .select('orderNumber items status placedAt table assignedTo')
      .limit(100)
      .lean();

    // Low stock items as tasks
    const lowStock = await require('./../models/InventoryItem').find({ quantity: { $lte: 5 } }).select('name quantity');

    res.json({ kitchenTasks: kitchen, lowStockTasks: lowStock });
  } catch (error) {
    console.error('Get pending tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/staff/shift-overview
// @desc    Get current shift overview (who's on shift, shift times) - best-effort
// @access  Private (Admin/Manager)
router.get('/shift-overview', authorize('admin', 'manager'), async (req, res) => {
  try {
    const now = new Date();

    // Support a common schedule field on User: shifts: [{ start, end, role }]
    const staff = await User.find({ role: 'staff' }).select('name shifts isActive role');

    const onShift = [];
    (staff || []).forEach(u => {
      const shifts = u.shifts || [];
      for (const s of shifts) {
        try {
          const start = new Date(s.start);
          const end = new Date(s.end);
          if (start <= now && end >= now) {
            onShift.push({ id: u._id, name: u.name, role: u.role, shift: s });
            break;
          }
        } catch (e) {
          // ignore malformed shift
        }
      }
    });

    res.json({ now: now.toISOString(), onShift });
  } catch (error) {
    console.error('Get shift overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Staff-facing endpoints
// @route GET /api/staff/assigned-orders
// @desc Orders assigned to the current staff member (or by staffId for managers/admins)
// @access Private (staff, manager, admin)
router.get('/assigned-orders', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const staffId = (req.user && req.user._id) || req.query.staffId;
    if (!staffId) return res.status(400).json({ message: 'No staff id available' });

    const q = { $or: [ { assignedTo: staffId }, { staff: staffId } ] };
    // optional filters: status
    if (req.query.status) q.status = req.query.status;

    const orders = await Order.find(q).select('orderNumber items status placedAt table deliveryDetails specialInstructions priority customer assignedTo').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ orders });
  } catch (err) {
    console.error('assigned orders error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PATCH /api/staff/assigned-orders/:id/status
// @desc Update order status by staff (must be assigned or manager/admin)
// @access Private (staff, manager, admin)
router.patch('/assigned-orders/:id/status', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'preparing', 'in-progress', 'ready', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // staff can only update if assigned
    if (req.user.role === 'staff' && String(order.assignedTo) !== String(req.user._id) && String(order.staff) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    if (status === 'completed') order.completedAt = new Date();
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('update assigned order status error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/staff/inventory-tasks
// @desc Inventory tasks visible to staff (low stock, prep tasks)
// @access Private (staff, manager, admin)
router.get('/inventory-tasks', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const InventoryItem = require('../models/InventoryItem');
    const low = await InventoryItem.find({ quantity: { $lte: 5 } }).select('name quantity unit lowStockThreshold').limit(100).lean();

    // Prep tasks from a `PrepTask` model if present
    let prepTasks = [];
    try {
      const PrepTask = require('../models/PrepTask');
      prepTasks = await PrepTask.find({ completed: { $ne: true } }).limit(100).lean();
    } catch (e) {
      prepTasks = [];
    }

    res.json({ lowStock: low, prepTasks });
  } catch (err) {
    console.error('inventory tasks error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/staff/messages
// @desc Retrieve staff messages / announcements (best-effort; requires Message model)
// @access Private (staff, manager, admin)
router.get('/messages', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    try {
      const Message = require('../models/Message');
      const msgs = await Message.find({ $or: [{ to: null }, { to: req.user._id }] }).sort({ createdAt: -1 }).limit(200).lean();
      return res.json({ messages: msgs });
    } catch (e) {
      // fallback: return some static announcements
      const announcements = [
        { id: 'a1', text: 'Team meeting at 6 PM in the back room', createdAt: new Date(), from: 'manager' },
        { id: 'a2', text: 'VIP guest at table 5', createdAt: new Date(), from: 'manager' }
      ];
      return res.json({ messages: announcements });
    }
  } catch (err) {
    console.error('messages error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/staff/messages
// @desc Post a message/announcement (staff -> manager or manager -> staff). Best-effort.
// @access Private (staff, manager, admin)
router.post('/messages', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    try {
      const Message = require('../models/Message');
      const m = new Message({ from: req.user._id, to: to || null, text });
      await m.save();
      return res.status(201).json({ message: 'Message sent', m });
    } catch (e) {
      // fallback: echo back
      return res.status(201).json({ message: 'Message received (no persistence available)', messageObj: { from: req.user.name, to: to || null, text, createdAt: new Date() } });
    }
  } catch (err) {
    console.error('post message error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/staff/reservations
// @desc Get upcoming reservations relevant to staff (hosts/servers)
// @access Private (staff, manager, admin)
router.get('/reservations', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    try {
      const Reservation = require('../models/Reservation');
      const since = new Date();
      const until = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const q = { date: { $gte: since, $lte: until } };
      // allow filtering by staff assignment
      if (req.query.staffId) q.assignedTo = req.query.staffId;
      const reservations = await Reservation.find(q).sort({ date: 1 }).limit(200).lean();
      return res.json({ reservations });
    } catch (e) {
      return res.json({ reservations: [] });
    }
  } catch (err) {
    console.error('reservations for staff error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/staff/training
// @desc Training modules / checklists for staff. Best-effort.
// @access Private (staff, manager, admin)
router.get('/training', authorize('staff', 'manager', 'admin'), async (req, res) => {
  try {
    try {
      const Training = require('../models/Training');
      const modules = await Training.find({ active: true }).limit(200).lean();
      return res.json({ modules });
    } catch (e) {
      const modules = [
        { id: 't1', title: 'Opening Checklist', type: 'checklist', items: ['Count cash', 'Prepare station', 'Stock condiments'] },
        { id: 't2', title: 'Food Safety (short)', type: 'video', url: 'https://example.com/food-safety' }
      ];
      return res.json({ modules });
    }
  } catch (err) {
    console.error('training error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/staff/availability
// @desc Staff post availability or shift swap request (best-effort persistence)
// @access Private (staff)
router.post('/availability', authorize('staff'), async (req, res) => {
  try {
    const { dateFrom, dateTo, note } = req.body;
    if (!dateFrom || !dateTo) return res.status(400).json({ message: 'dateFrom and dateTo required' });
    try {
      const Availability = require('../models/Availability');
      const a = new Availability({ staff: req.user._id, dateFrom, dateTo, note });
      await a.save();
      return res.status(201).json({ message: 'Availability saved', a });
    } catch (e) {
      return res.status(201).json({ message: 'Availability received (no persistence available)', availability: { staff: req.user._id, dateFrom, dateTo, note } });
    }
  } catch (err) {
    console.error('availability error', err);
    res.status(500).json({ message: 'Server error' });
  }
});