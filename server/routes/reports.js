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

module.exports = router;