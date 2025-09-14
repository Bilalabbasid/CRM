const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Reservation = require('../models/Reservation');
const Customer = require('../models/Customer');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/reservations
// @desc    Get all reservations with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show']),
  query('date').optional().isISO8601(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('customerId').optional().isMongoId(),
  query('tableNumber').optional().isInt({ min: 1 })
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
    if (req.query.customerId) query.customer = req.query.customerId;
    if (req.query.tableNumber) query.tableNumber = req.query.tableNumber;
    
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: date, $lt: nextDay };
    } else if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) query.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.date.$lte = new Date(req.query.dateTo);
    }

    // Execute query with population
    const reservations = await Reservation.find(query)
      .populate('customer', 'name email phone status')
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      reservations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reservations/:id
// @desc    Get reservation by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('customer', 'name email phone address preferences')
      .populate('createdBy', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Get reservation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reservations
// @desc    Create new reservation
// @access  Private
router.post('/', [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('partySize').isInt({ min: 1, max: 20 }).withMessage('Party size must be between 1 and 20'),
  body('contactPhone').isMobilePhone().withMessage('Valid phone number is required'),
  body('contactEmail').isEmail().withMessage('Valid email is required'),
  body('tableNumber').optional().isInt({ min: 1 }),
  body('specialRequests').optional().isLength({ max: 500 }),
  body('occasion').optional().isIn(['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other']),
  body('seatingPreference').optional().isIn(['window', 'booth', 'bar', 'patio', 'private', 'no-preference'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, date, time, partySize, tableNumber } = req.body;

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Check for conflicts if table number is specified
    if (tableNumber) {
      const conflictingReservation = await Reservation.findOne({
        date: new Date(date),
        tableNumber,
        status: { $in: ['pending', 'confirmed', 'seated'] },
        $or: [
          { time: time },
          // Check for overlapping times (assuming 2-hour slots)
          {
            $expr: {
              $and: [
                { $lte: [{ $abs: { $subtract: [{ $toInt: { $substr: ['$time', 0, 2] } }, { $toInt: { $substr: [time, 0, 2] } }] } }, 2] },
                { $lte: [{ $abs: { $subtract: [{ $toInt: { $substr: ['$time', 3, 2] } }, { $toInt: { $substr: [time, 3, 2] } }] } }, 30] }
              ]
            }
          }
        ]
      });

      if (conflictingReservation) {
        return res.status(400).json({ 
          message: 'Table is already reserved for this time slot' 
        });
      }
    }

    // Create reservation
    const reservation = new Reservation({
      ...req.body,
      createdBy: req.user._id
    });

    await reservation.save();

    // Populate the reservation before sending response
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: populatedReservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reservations/:id
// @desc    Update reservation
// @access  Private
router.put('/:id', [
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('partySize').optional().isInt({ min: 1, max: 20 }),
  body('tableNumber').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show']),
  body('specialRequests').optional().isLength({ max: 500 }),
  body('occasion').optional().isIn(['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other']),
  body('seatingPreference').optional().isIn(['window', 'booth', 'bar', 'patio', 'private', 'no-preference'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check for conflicts if date, time, or table number is being updated
    if ((req.body.date || req.body.time || req.body.tableNumber) && req.body.status !== 'cancelled') {
      const checkDate = req.body.date ? new Date(req.body.date) : reservation.date;
      const checkTime = req.body.time || reservation.time;
      const checkTable = req.body.tableNumber || reservation.tableNumber;

      if (checkTable) {
        const conflictingReservation = await Reservation.findOne({
          _id: { $ne: req.params.id },
          date: checkDate,
          tableNumber: checkTable,
          status: { $in: ['pending', 'confirmed', 'seated'] },
          time: checkTime
        });

        if (conflictingReservation) {
          return res.status(400).json({ 
            message: 'Table is already reserved for this time slot' 
          });
        }
      }
    }

    // Update arrival/departure times based on status
    if (req.body.status === 'seated' && !reservation.arrivalTime) {
      req.body.arrivalTime = new Date();
    } else if (req.body.status === 'completed' && !reservation.departureTime) {
      req.body.departureTime = new Date();
      if (reservation.arrivalTime) {
        req.body.actualDuration = Math.round((new Date() - reservation.arrivalTime) / (1000 * 60));
      }
    }

    Object.assign(reservation, req.body);
    await reservation.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Reservation updated successfully',
      reservation: populatedReservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete reservation
// @access  Private (Admin/Manager only)
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid reservation ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reservations/availability/:date
// @desc    Check table availability for a specific date
// @access  Private
router.get('/availability/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const reservations = await Reservation.find({
      date: { $gte: date, $lt: nextDay },
      status: { $in: ['pending', 'confirmed', 'seated'] }
    }).select('time tableNumber partySize');

    // Assuming tables 1-20 exist
    const totalTables = 20;
    const timeSlots = [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
    ];

    const availability = timeSlots.map(time => {
      const reservedTables = reservations
        .filter(r => r.time === time)
        .map(r => r.tableNumber)
        .filter(Boolean);

      const availableTables = [];
      for (let i = 1; i <= totalTables; i++) {
        if (!reservedTables.includes(i)) {
          availableTables.push(i);
        }
      }

      return {
        time,
        availableTables,
        totalAvailable: availableTables.length,
        totalReserved: reservedTables.length
      };
    });

    res.json({
      date: req.params.date,
      availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reservations/stats/overview
// @desc    Get reservation statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Reservation.aggregate([
      {
        $facet: {
          overall: [
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
                averagePartySize: { $avg: '$partySize' }
              }
            }
          ],
          today: [
            {
              $match: {
                date: { $gte: today, $lt: tomorrow }
              }
            },
            {
              $group: {
                _id: null,
                todayReservations: { $sum: 1 },
                todayConfirmed: {
                  $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      ...stats[0].overall[0] || {},
      ...stats[0].today[0] || { todayReservations: 0, todayConfirmed: 0 }
    };

    res.json(result);
  } catch (error) {
    console.error('Get reservation stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;