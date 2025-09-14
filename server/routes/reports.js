const express = require('express');
const { query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/reports/sales
// @desc    Get sales reports with date filtering
// @access  Private (Admin/Manager only)
router.get('/sales', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month']),
  query('orderType').optional().isIn(['dine-in', 'takeout', 'delivery'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
    const groupBy = req.query.groupBy || 'day';
    const orderType = req.query.orderType;

    // Build match stage
    let matchStage = {
      createdAt: { $gte: dateFrom, $lte: dateTo },
      status: 'completed'
    };

    if (orderType) {
  // @route   GET /api/reports/branch-comparisons
  // @desc    Compare branches (requires `branch` field on Orders/Reservations)
  // @access  Private (Admin/Manager)
  router.get('/branch-comparisons', authorize('admin', 'manager'), async (req, res) => {
    try {
      // Best-effort: aggregate orders by `branch` field
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

      const byBranch = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' } },
        { $group: { _id: '$branch', totalOrders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } }
      ]);

      res.json({ period: { from: dateFrom, to: dateTo }, byBranch });
    } catch (err) {
      console.error('branch comparisons error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/customer-demographics
  // @desc    Customer demographics (age groups, locations) - best-effort
  // @access  Private (Admin/Manager)
  router.get('/customer-demographics', authorize('admin', 'manager'), async (req, res) => {
    try {
      // Age buckets
      const ageBuckets = await Customer.aggregate([
        {
          $bucket: {
            groupBy: '$age',
            boundaries: [0, 18, 25, 35, 45, 60, 200],
            default: 'unknown',
            output: { count: { $sum: 1 } }
          }
        }
      ]);

      // Locations: assume `location` or `city` field
      const locations = await Customer.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]);

      res.json({ ageBuckets, locations });
    } catch (err) {
      console.error('customer demographics error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/marketing-impact
  // @desc    Basic marketing campaign impact (ads -> orders) - best-effort using `utm` or `campaign` fields on Order
  // @access  Private (Admin/Manager)
  router.get('/marketing-impact', authorize('admin', 'manager'), async (req, res) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

      const campaigns = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed', $or: [{ campaign: { $exists: true } }, { utm_source: { $exists: true } }] } },
        { $group: { _id: { campaign: '$campaign', utm: '$utm_source' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } }
      ]);

      res.json({ period: { from: dateFrom, to: dateTo }, campaigns });
    } catch (err) {
      console.error('marketing impact error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/profitability-category
  // @desc    Profitability per category (drinks, desserts, mains)
  // @access  Private (Admin/Manager)
  router.get('/profitability-category', authorize('admin', 'manager'), async (req, res) => {
    try {
      // Reuse categoryPerformance from earlier but compute margin by category
      const profitability = await Order.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'menuitems',
            localField: 'items.menuItem',
            foreignField: '_id',
            as: 'menuItem'
          }
        },
        { $unwind: '$menuItem' },
        {
          $group: {
            _id: '$menuItem.category',
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            cost: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$menuItem.cost', 0] }] } },
            itemsSold: { $sum: '$items.quantity' }
          }
        },
        {
          $project: {
            category: '$_id',
            revenue: 1,
            cost: 1,
            profit: { $subtract: ['$revenue', '$cost'] },
            marginPercent: { $cond: [{ $gt: ['$revenue', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] }, 100] }, 0] },
            itemsSold: 1
          }
        },
        { $sort: { profit: -1 } }
      ]);

      res.json({ profitability });
    } catch (err) {
      console.error('profitability category error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/recent-activity
  // @desc    Recent activity feed: orders placed, customer signups, refunds/cancellations
  // @access  Private (Admin/Manager)
  router.get('/recent-activity', authorize('admin', 'manager'), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;

      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(limit).select('orderNumber customer status total createdAt').populate('customer', 'name');
      const recentSignups = await Customer.find().sort({ createdAt: -1 }).limit(limit).select('name email createdAt');

      // Refunds / cancellations: orders with status 'refunded' or 'cancelled'
      const refunds = await Order.find({ status: { $in: ['refunded', 'cancelled'] } }).sort({ updatedAt: -1 }).limit(limit).select('orderNumber status total updatedAt reason');

      res.json({ recentOrders, recentSignups, refunds });
    } catch (err) {
      console.error('recent activity error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/supplier-alerts
  // @desc    Supplier alerts & notifications (best-effort: uses InventoryItem supplier fields)
  // @access  Private (Admin/Manager)
  router.get('/supplier-alerts', authorize('admin', 'manager'), async (req, res) => {
    try {
      const InventoryItem = require('../models/InventoryItem');
      // Low inventory warnings
      const lowInventory = await InventoryItem.find({ quantity: { $lte: 5 } }).select('name quantity supplier');

      // Supplier statuses: group by supplier and show recent orders or missing contact
      const suppliers = await InventoryItem.aggregate([
        { $match: { supplier: { $exists: true, $ne: null } } },
        { $group: { _id: '$supplier', itemsLow: { $sum: { $cond: [{ $lte: ['$quantity', 5] }, 1, 0] } }, totalItems: { $sum: 1 } } },
        { $sort: { itemsLow: -1 } }
      ]);

      res.json({ lowInventory, suppliers });
    } catch (err) {
      console.error('supplier alerts error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/reservation-conflicts
  // @desc    Find reservation conflicts (overlapping reservations for same table/time)
  // @access  Private (Admin/Manager)
  router.get('/reservation-conflicts', authorize('admin', 'manager'), async (req, res) => {
    try {
      // Best-effort: naive O(n^2) check for overlapping reservations within next 7 days
      const from = new Date();
      const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const reservations = await Reservation.find({ date: { $gte: from, $lte: to }, tableNumber: { $exists: true } }).sort({ date: 1, time: 1 }).lean();

      const conflicts = [];
      for (let i = 0; i < reservations.length; i++) {
        for (let j = i + 1; j < reservations.length; j++) {
          const a = reservations[i];
          const b = reservations[j];
          if (String(a.tableNumber) !== String(b.tableNumber)) continue;
          const aStart = new Date(a.date);
          const aEnd = new Date(a.date);
          aEnd.setHours(aEnd.getHours() + 2); // assume 2-hour slot if not specified
          const bStart = new Date(b.date);
          const bEnd = new Date(b.date);
          bEnd.setHours(bEnd.getHours() + 2);
          if (aStart < bEnd && bStart < aEnd) {
            conflicts.push({ a, b });
          }
        }
      }

      res.json({ conflicts });
    } catch (err) {
      console.error('reservation conflicts error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/customer-complaints
  // @desc    Customer complaints / escalations (best-effort: looks for `complaints` collection or order feedback)
  // @access  Private (Admin/Manager)
  router.get('/customer-complaints', authorize('admin', 'manager'), async (req, res) => {
    try {
      let complaints = [];
      try {
        const Complaint = require('../models/Complaint');
        complaints = await Complaint.find().sort({ createdAt: -1 }).limit(50).lean();
      } catch (e) {
        // fallback: check orders feedback or customer feedback endpoints
        complaints = await Order.find({ feedback: { $exists: true } }).sort({ updatedAt: -1 }).limit(50).select('orderNumber customer feedback updatedAt').populate('customer', 'name');
      }

      res.json({ complaints });
    } catch (err) {
      console.error('customer complaints error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route   GET /api/reports/delayed-orders
  // @desc    Alert for delayed orders (orders that are taking longer than expected)
  // @access  Private (Admin/Manager)
  router.get('/delayed-orders', authorize('admin', 'manager'), async (req, res) => {
    try {
      const thresholdMinutes = parseInt(req.query.threshold) || 30;
      const now = new Date();

      const delayed = await Order.aggregate([
        { $match: { status: { $in: ['preparing', 'ready'] }, createdAt: { $exists: true } } },
        { $project: { orderNumber: 1, staff: 1, status: 1, createdAt: 1, elapsedMinutes: { $divide: [{ $subtract: [now, '$createdAt'] }, 1000 * 60] } } },
        { $match: { elapsedMinutes: { $gt: thresholdMinutes } } },
        { $limit: 100 }
      ]);

      res.json({ thresholdMinutes, delayed });
    } catch (err) {
      console.error('delayed orders error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Owner / Executive endpoints
  // @route GET /api/reports/owner/overview
  // @desc Executive snapshot: revenue, top branch, top menu item, key alerts
  // @access Private (Admin/Owner)
  router.get('/owner/overview', authorize('admin', 'manager'), async (req, res) => {
    try {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [revenueTodayAgg, revenueThisWeekAgg, revenueThisMonthAgg] = await Promise.all([
        Order.aggregate([{ $match: { createdAt: { $gte: new Date(today.setHours(0,0,0,0)) }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
        Order.aggregate([{ $match: { createdAt: { $gte: monthStart }, status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }])
      ]);

      // Top branch (by revenue last 30 days)
      const since30 = new Date(Date.now() - 30*24*60*60*1000);
      const branches = await Order.aggregate([{ $match: { createdAt: { $gte: since30 }, status: 'completed', branch: { $exists: true } } }, { $group: { _id: '$branch', revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]);

      // Top menu item by profit (requires cost on MenuItem)
      const topMenuProfit = await Order.aggregate([
        { $match: { createdAt: { $gte: since30 }, status: 'completed' } },
        { $unwind: '$items' },
        { $lookup: { from: 'menuitems', localField: 'items.menuItem', foreignField: '_id', as: 'menu' } },
        { $unwind: '$menu' },
        { $project: { menuId: '$menu._id', name: '$menu.name', revenue: { $multiply: ['$items.quantity', '$items.price'] }, cost: { $multiply: ['$items.quantity', { $ifNull: ['$menu.cost', 0] }] } } },
        { $group: { _id: '$menuId', name: { $first: '$name' }, revenue: { $sum: '$revenue' }, cost: { $sum: '$cost' }, profit: { $sum: { $subtract: ['$revenue', '$cost'] } } } },
        { $sort: { profit: -1 } }, { $limit: 1 }
      ]);

      // Key alerts: top issues (delayed orders, low inventory count >0)
      const delayed = await Order.countDocuments({ status: { $in: ['preparing', 'ready'] }, createdAt: { $lte: new Date(Date.now() - 30*60*1000) } });
      const InventoryItem = require('../models/InventoryItem');
      const lowInventoryCount = await InventoryItem.countDocuments({ quantity: { $lte: 5 } });

      res.json({
        today: revenueTodayAgg[0] || { revenue: 0, orders: 0 },
        week: revenueThisWeekAgg[0] || { revenue: 0, orders: 0 },
        month: revenueThisMonthAgg[0] || { revenue: 0, orders: 0 },
        topBranches: branches,
        topMenuProfit: topMenuProfit[0] || null,
        keyAlerts: { delayedOrders: delayed, lowInventoryCount }
      });
    } catch (err) {
      console.error('owner overview error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/branches
  // @desc Branch & Manager performance overview
  // @access Private
  router.get('/owner/branches', authorize('admin', 'manager'), async (req, res) => {
    try {
      const since = new Date(Date.now() - 30*24*60*60*1000);
      const branchAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $group: { _id: '$branch', revenue: { $sum: '$total' }, orders: { $sum: 1 }, avgOrderValue: { $avg: '$total' } } },
        { $sort: { revenue: -1 } }
      ]);

      // top managers by revenue
      const managers = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed', staff: { $exists: true } } },
        { $group: { _id: '$staff', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
        { $unwind: '$staff' },
        { $project: { name: '$staff.name', role: '$staff.role', revenue: 1, orders: 1 } },
        { $sort: { revenue: -1 } }, { $limit: 10 }
      ]);

      res.json({ branchAgg, topManagers: managers });
    } catch (err) {
      console.error('owner branches error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/financials
  // @desc Financial analytics (expense breakdown, refunds, cash flow) - best-effort
  // @access Private
  router.get('/owner/financials', authorize('admin', 'manager'), async (req, res) => {
    try {
      // Best-effort: expenses may not be modeled; check for an `Expense` model
      let expenses = [];
      try {
        const Expense = require('../models/Expense');
        expenses = await Expense.aggregate([{ $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]);
      } catch (e) {
        expenses = [];
      }

      const refunds = await Order.aggregate([{ $match: { status: { $in: ['refunded', 'cancelled'] } } }, { $group: { _id: null, count: { $sum: 1 }, totalRefunded: { $sum: '$total' } } }]);

      // Outstanding vendor payments - best-effort via Supplier/PurchaseOrder model
      let outstanding = [];
      try {
        const Purchase = require('../models/PurchaseOrder');
        outstanding = await Purchase.find({ status: 'pending' }).limit(20).lean();
      } catch (e) {
        outstanding = [];
      }

      res.json({ expenses, refunds: refunds[0] || { count: 0, totalRefunded: 0 }, outstanding });
    } catch (err) {
      console.error('owner financials error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/customers
  // @desc Customer analytics (acquisition, retention, CLV, demographics)
  // @access Private
  router.get('/owner/customers', authorize('admin', 'manager'), async (req, res) => {
    try {
      const since = new Date(Date.now() - 90*24*60*60*1000);
      const acquisition = await Customer.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

      const clv = await Order.aggregate([{ $group: { _id: '$customerId', totalSpent: { $sum: '$total' }, orders: { $sum: 1 } } }, { $sort: { totalSpent: -1 } }, { $limit: 20 }]);

      // demographics reuse customer-demographics
      const demographics = await Customer.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]);

      res.json({ acquisition, clv, demographics });
    } catch (err) {
      console.error('owner customers error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/menu-insights
  // @desc Menu & product insights (profitability, loss-making items, category share)
  // @access Private
  router.get('/owner/menu-insights', authorize('admin', 'manager'), async (req, res) => {
    try {
      const since = new Date(Date.now() - 90*24*60*60*1000);
      const profitability = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $unwind: '$items' },
        { $lookup: { from: 'menuitems', localField: 'items.menuItem', foreignField: '_id', as: 'menu' } },
        { $unwind: '$menu' },
        { $group: { _id: '$menu._id', name: { $first: '$menu.name' }, category: { $first: '$menu.category' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }, cost: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$menu.cost', 0] }] } } } },
        { $project: { name: 1, category: 1, revenue: 1, cost: 1, profit: { $subtract: ['$revenue', '$cost'] }, marginPercent: { $cond: [{ $gt: ['$revenue', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$revenue', '$cost'] }, '$revenue'] }, 100] }, 0] } } },
        { $sort: { profit: -1 } }
      ]);

      // category share
      const categoryShare = await Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: 'completed' } },
        { $unwind: '$items' },
        { $lookup: { from: 'menuitems', localField: 'items.menuItem', foreignField: '_id', as: 'menu' } },
        { $unwind: '$menu' },
        { $group: { _id: '$menu.category', revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }, itemsSold: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } }
      ]);

      res.json({ profitability, categoryShare });
    } catch (err) {
      console.error('owner menu insights error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/marketing
  // @desc Marketing and growth metrics (campaign ROI, source breakdown, promotions)
  // @access Private
  router.get('/owner/marketing', authorize('admin', 'manager'), async (req, res) => {
    try {
      const since = new Date(Date.now() - 90*24*60*60*1000);
      const campaigns = await Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'completed', $or: [{ campaign: { $exists: true } }, { utm_source: { $exists: true } }] } }, { $group: { _id: { campaign: '$campaign', utm: '$utm_source' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }, { $sort: { revenue: -1 } }]);

      // Repeat customers after promotions - best-effort if promotion applied
      const repeatAfterPromo = await Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'completed', promotionCode: { $exists: true } } }, { $group: { _id: '$customerId', count: { $sum: 1 } } }, { $match: { count: { $gte: 2 } } }, { $count: 'repeatCount' }]);

      res.json({ campaigns, repeatAfterPromo: repeatAfterPromo[0]?.repeatCount || 0 });
    } catch (err) {
      console.error('owner marketing error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/staff
  // @desc Staff & HR overview (staffing cost, top employees, attrition) - best-effort
  // @access Private
  router.get('/owner/staff', authorize('admin', 'manager'), async (req, res) => {
    try {
      // staffing costs: sum salaries if on User or Employee model
      let staffCosts = 0;
      try {
        const emp = await User.find({ role: 'staff' }).select('salary isActive updatedAt');
        staffCosts = emp.reduce((s, e) => s + (Number(e.salary) || 0), 0);
      } catch (e) {
        staffCosts = 0;
      }

      // top performing employees: reuse staff stats aggregation
      const top = await Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$staff', revenue: { $sum: '$total' }, orders: { $sum: 1 } } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } }, { $unwind: '$staff' }, { $project: { name: '$staff.name', revenue: 1, orders: 1 } }, { $sort: { revenue: -1 } }, { $limit: 10 }]);

      // attrition rate: best-effort by checking user created/removed dates (if tracked)
      res.json({ staffCosts, topPerformers: top, attritionRate: null });
    } catch (err) {
      console.error('owner staff error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/risk
  // @desc Risk & compliance alerts
  // @access Private
  router.get('/owner/risk', authorize('admin', 'manager'), async (req, res) => {
    try {
      // pending tax / licenses - best-effort via Alerts model if present
      let alerts = [];
      try {
        const Alert = require('../models/Alert');
        alerts = await Alert.find({ severity: { $in: ['high', 'critical'] } }).limit(50).lean();
      } catch (e) {
        alerts = [];
      }

      res.json({ alerts });
    } catch (err) {
      console.error('owner risk error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // @route GET /api/reports/owner/forecasts
  // @desc Forecasting endpoints (sales, inventory, profitability) - simple linear projections
  // @access Private
  router.get('/owner/forecasts', authorize('admin', 'manager'), async (req, res) => {
    try {
      // naive forecast: average daily revenue * next 30 days
      const since = new Date(Date.now() - 90*24*60*60*1000);
      const daily = await Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'completed' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } }, { $sort: { '_id': 1 } }]);
      const avgDaily = daily.length ? (daily.reduce((s, d) => s + (d.revenue || 0), 0) / daily.length) : 0;
      const next30 = Array.from({ length: 30 }).map((_, i) => ({ day: i+1, forecast: Math.round(avgDaily) }));

      res.json({ avgDaily, next30 });
    } catch (err) {
      console.error('owner forecasts error', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
      matchStage.orderType = orderType;
    }

    // Build group stage based on groupBy parameter
    let groupStage;
    switch (groupBy) {
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          date: { $first: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } } }
        };
        break;
      case 'month':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }
        };
        break;
      default: // day
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }
        };
    }

    // Add aggregation fields
    groupStage.totalOrders = { $sum: 1 };
    groupStage.totalRevenue = { $sum: '$total' };
    groupStage.totalTax = { $sum: '$tax' };
    groupStage.totalTips = { $sum: '$tip' };
    groupStage.averageOrderValue = { $avg: '$total' };
    groupStage.orderTypes = {
      $push: {
        type: '$orderType',
        amount: '$total'
      }
    };

    const salesData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Get summary statistics
    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          totalTips: { $sum: '$tip' },
          averageOrderValue: { $avg: '$total' },
          maxOrderValue: { $max: '$total' },
          minOrderValue: { $min: '$total' }
        }
      }
    ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      groupBy,
      summary: summary[0] || {},
      data: salesData
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/customers
// @desc    Get customer analytics
// @access  Private (Admin/Manager only)
router.get('/customers', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

    // Customer acquisition over time
    const customerAcquisition = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom, $lte: dateTo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Customer segmentation by spending
    const customerSegmentation = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 100, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' },
            totalSpent: { $sum: '$totalSpent' }
          }
        }
      }
    ]);

    // Top customers by spending
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name email totalSpent visits loyaltyPoints status');

    // Customer retention (customers with multiple visits)
    const retentionStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          returningCustomers: {
            $sum: { $cond: [{ $gt: ['$visits', 1] }, 1, 0] }
          },
          oneTimeCustomers: {
            $sum: { $cond: [{ $eq: ['$visits', 1] }, 1, 0] }
          },
          averageVisits: { $avg: '$visits' },
          averageSpent: { $avg: '$totalSpent' },
          totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
        }
      }
    ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      acquisition: customerAcquisition,
      segmentation: customerSegmentation,
      topCustomers,
      retention: retentionStats[0] || {}
    });
  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/customers/insights
// @desc    Get quick customer insights: total today, new vs returning, recent feedback, loyalty and CLV flags
// @access  Private (Admin/Manager only)
router.get('/customers/insights', authorize('admin', 'manager'), async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    // Total unique customers who placed orders today
    const totalTodayAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: 'completed' } },
      { $group: { _id: '$customerId' } },
      { $count: 'total' }
    ]);
    const totalCustomersToday = (totalTodayAgg[0] && totalTodayAgg[0].total) || 0;

    // New customers created today
    const newCustomersToday = await Customer.countDocuments({ createdAt: { $gte: todayStart } });
    const returningCustomers = Math.max(0, totalCustomersToday - newCustomersToday);

    // Recent feedback: best-effort try to fetch reviews if model exists
    let recentFeedback = [];
    try {
      // lazy require to avoid missing model errors
      const Review = require('../models/Review');
      if (Review && Review.find) {
        recentFeedback = await Review.find().sort({ createdAt: -1 }).limit(8).select('customer rating comment createdAt').lean();
      }
    } catch (e) {
      // no review model present — ignore
      recentFeedback = [];
    }

    // Loyalty activity: recent members with points changes
    const loyaltyActive = await Customer.find({ loyaltyPoints: { $exists: true, $gt: 0 } }).sort({ updatedAt: -1 }).limit(10).select('name email loyaltyPoints updatedAt').lean();

    // CLV heuristic: aggregate total spent and flag top N as VIPs
    const clvAgg = await Order.aggregate([
      { $group: { _id: '$customerId', totalSpent: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 50 }
    ]);

    const topSpenders = [];
    for (const row of clvAgg.slice(0, 20)) {
      const cust = await Customer.findById(row._id).select('name email').lean();
      topSpenders.push({ customerId: row._id, totalSpent: row.totalSpent, orders: row.orders, name: cust?.name || 'Unknown', email: cust?.email || null });
    }

    const vipFlags = topSpenders.slice(0, 5).map(t => ({ customerId: t.customerId, name: t.name, totalSpent: t.totalSpent }));

    res.json({ totalCustomersToday, newCustomersToday, returningCustomers, recentFeedback, loyaltyActive, topSpenders, vipFlags });
  } catch (err) {
    console.error('customers insights error', err);
    res.status(500).json({ message: 'Failed to compute customer insights' });
  }
});

// @route   GET /api/reports/menu
// @desc    Get menu item performance analytics
// @access  Private (Admin/Manager only)
router.get('/menu', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('category').optional().isIn(['appetizers', 'salads', 'soups', 'mains', 'desserts', 'beverages', 'specials'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
    const category = req.query.category;

    // Build match stage for orders
    let orderMatchStage = {
      createdAt: { $gte: dateFrom, $lte: dateTo },
      status: 'completed'
    };

    // Top selling items
    const topSellingItems = await Order.aggregate([
      { $match: orderMatchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      ...(category ? [{ $match: { 'menuItem.category': category } }] : []),
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$menuItem.name' },
          category: { $first: '$menuItem.category' },
          price: { $first: '$menuItem.price' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 20 }
    ]);

    // Category performance
    const categoryPerformance = await Order.aggregate([
      { $match: orderMatchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem.category',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          uniqueItems: { $addToSet: '$items.menuItem' },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $addFields: {
          uniqueItemCount: { $size: '$uniqueItems' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Menu item profitability (if cost data is available)
    const profitabilityAnalysis = await MenuItem.aggregate([
      {
        $match: {
          cost: { $exists: true, $gt: 0 },
          ...(category ? { category } : {})
        }
      },
      {
        $addFields: {
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ['$price', '$cost'] }, '$price'] },
              100
            ]
          },
          profitPerItem: { $subtract: ['$price', '$cost'] }
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          cost: 1,
          profitMargin: 1,
          profitPerItem: 1,
          timesOrdered: 1,
          totalProfit: { $multiply: ['$profitPerItem', '$timesOrdered'] }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 20 }
    ]);

    // Low performing items
    const lowPerformingItems = await MenuItem.find({
      timesOrdered: { $lt: 5 },
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Older than 1 week
      ...(category ? { category } : {})
    })
      .sort({ timesOrdered: 1 })
      .limit(10)
      .select('name category price timesOrdered createdAt');

    res.json({
      period: { from: dateFrom, to: dateTo },
      category: category || 'all',
      topSelling: topSellingItems,
      categoryPerformance,
      profitability: profitabilityAnalysis,
      lowPerforming: lowPerformingItems
    });
  } catch (error) {
    console.error('Get menu report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/reservations
// @desc    Get reservation analytics
// @access  Private (Admin/Manager only)
router.get('/reservations', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

    // Reservation trends over time
    const reservationTrends = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: dateFrom, $lte: dateTo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          totalReservations: { $sum: 1 },
          confirmedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShowReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
          },
          averagePartySize: { $avg: '$partySize' },
          totalGuests: { $sum: '$partySize' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Peak hours analysis
    const peakHours = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: dateFrom, $lte: dateTo },
          status: { $in: ['confirmed', 'completed', 'seated'] }
        }
      },
      {
        $group: {
          _id: '$time',
          reservationCount: { $sum: 1 },
          averagePartySize: { $avg: '$partySize' },
          totalGuests: { $sum: '$partySize' }
        }
      },
      { $sort: { reservationCount: -1 } }
    ]);

    // Table utilization
    const tableUtilization = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: dateFrom, $lte: dateTo },
          status: { $in: ['confirmed', 'completed', 'seated'] },
          tableNumber: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$tableNumber',
          reservationCount: { $sum: 1 },
          totalGuests: { $sum: '$partySize' },
          averagePartySize: { $avg: '$partySize' }
        }
      },
      { $sort: { reservationCount: -1 } }
    ]);

    // Summary statistics
    const summary = await Reservation.aggregate([
      {
        $match: {
          date: { $gte: dateFrom, $lte: dateTo }
        }
      },
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          confirmedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShowReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
          },
          averagePartySize: { $avg: '$partySize' },
          totalGuests: { $sum: '$partySize' }
        }
      }
    ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      trends: reservationTrends,
      peakHours,
      tableUtilization,
      summary: summary[0] || {}
    });
  } catch (error) {
    console.error('Get reservation report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Today's stats
    const todayStats = await Promise.all([
      Order.countDocuments({ 
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'completed'
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      Reservation.countDocuments({
        date: { $gte: today, $lt: tomorrow }
      }),
      Order.countDocuments({
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      })
    ]);

    // This month's stats
    const monthStats = await Promise.all([
      Customer.countDocuments({
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thisMonth, $lt: nextMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalOrders: { $sum: 1 }
          }
        }
      ])
    ]);

    // Popular menu items (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const popularItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$menuItem.name' },
          category: { $first: '$menuItem.category' },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customer status total createdAt');

    const recentReservations = await Reservation.find()
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customer date time partySize status');

    res.json({
      today: {
        orders: todayStats[0],
        revenue: todayStats[1][0]?.totalRevenue || 0,
        reservations: todayStats[2],
        pendingOrders: todayStats[3]
      },
      month: {
        newCustomers: monthStats[0],
        revenue: monthStats[1][0]?.totalRevenue || 0,
        orders: monthStats[1][0]?.totalOrders || 0
      },
      popularItems,
      recentActivity: {
        orders: recentOrders,
        reservations: recentReservations
      }
    });
  } catch (error) {
    console.error('Get dashboard report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/top-performers
// @desc    Get top selling items and least selling (potential wastage)
// @access  Private (Admin/Manager)
router.get('/top-performers', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
    const limit = Number(req.query.limit || 10);

    const matchStage = { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' };

    // Top selling items by quantity
    const topSelling = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
      { $sort: { quantitySold: -1 } },
      { $limit: limit }
    ]);

    // Least selling / potential wastage items: low quantity sold but existing stock or recently added menu
    const leastSelling = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
      { $sort: { quantitySold: 1 } },
      { $limit: limit }
    ]);

    res.json({ period: { from: dateFrom, to: dateTo }, topSelling, leastSelling });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/trends
// @desc    Sales by time of day (lunch vs dinner) and promotions performance
// @access  Private (Admin/Manager)
router.get('/trends', authorize('admin', 'manager'), [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

    // Sales by hour buckets (0-23)
    const salesByHour = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' } },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          total: 1,
          items: 1,
          promotions: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          totalRevenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Lunch vs Dinner buckets (common: lunch 11-15, dinner 17-22)
    const lunchHours = [11, 12, 13, 14, 15];
    const dinnerHours = [17, 18, 19, 20, 21, 22];

    const lunchAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' } },
      { $project: { hour: { $hour: '$createdAt' }, total: 1 } },
      { $match: { hour: { $in: lunchHours } } },
      { $group: { _id: 'lunch', totalRevenue: { $sum: '$total' }, orders: { $sum: 1 } } }
    ]);

    const dinnerAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' } },
      { $project: { hour: { $hour: '$createdAt' }, total: 1 } },
      { $match: { hour: { $in: dinnerHours } } },
      { $group: { _id: 'dinner', totalRevenue: { $sum: '$total' }, orders: { $sum: 1 } } }
    ]);

    // Promotions performance: orders that applied promotions or discounts
    // Assuming orders have `discount`, `promotionCode`, or `promotions` fields
    const promotionsPerf = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed', $or: [{ discount: { $exists: true, $gt: 0 } }, { promotionCode: { $exists: true } }, { promotions: { $exists: true } }] } },
      {
        $group: {
          _id: '$promotionCode',
          uses: { $sum: 1 },
          totalDiscount: { $sum: '$discount' },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { uses: -1 } }
    ]);

    res.json({ period: { from: dateFrom, to: dateTo }, salesByHour, lunch: lunchAgg[0] || { _id: 'lunch', totalRevenue: 0, orders: 0 }, dinner: dinnerAgg[0] || { _id: 'dinner', totalRevenue: 0, orders: 0 }, promotions: promotionsPerf });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

  // @route   GET /api/reports/orders-overview
  // @desc    Upcoming reservations, pending/ongoing/completed orders, delivery vs dine-in split, avg completion time
  // @access  Private (Admin/Manager)
  router.get('/orders-overview', authorize('admin', 'manager'), async (req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);

      // Upcoming reservations (next 48 hours)
      const upcoming = await Reservation.find({ date: { $gte: now, $lt: new Date(Date.now() + 48 * 60 * 60 * 1000) }, status: { $in: ['confirmed', 'pending'] } })
        .populate('customer', 'name')
        .sort({ date: 1, time: 1 })
        .limit(50)
        .lean();

      // Orders counts
      const pendingCount = await Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } });
      const ongoingCount = await Order.countDocuments({ status: { $in: ['preparing', 'ready', 'ongoing'] } });
      const completedToday = await Order.countDocuments({ status: 'completed', createdAt: { $gte: todayStart, $lt: tomorrow } });

      // Delivery vs dine-in split (today)
      const splitAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lt: tomorrow }, status: 'completed' } },
        { $group: { _id: '$orderType', count: { $sum: 1 }, revenue: { $sum: '$total' } } }
      ]);

      // Average completion time (completed orders) in minutes (best-effort: uses preparedAt / completedAt fields or createdAt -> updatedAt)
      const timeAgg = await Order.aggregate([
        { $match: { status: 'completed', completedAt: { $exists: true } } },
        { $project: { diffMinutes: { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000 * 60] } } },
        { $group: { _id: null, avgMinutes: { $avg: '$diffMinutes' }, medianMinutes: { $avg: '$diffMinutes' } } }
      ]);

      res.json({ upcomingReservations: upcoming, pendingCount, ongoingCount, completedToday, split: splitAgg, avgCompletionMinutes: timeAgg[0]?.avgMinutes || null });
    } catch (err) {
      console.error('orders overview error', err);
      res.status(500).json({ message: 'Failed to compute orders overview' });
    }
  });

module.exports = router;
