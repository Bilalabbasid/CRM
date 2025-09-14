const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Reservation date is required']
  },
  time: {
    type: String,
    required: [true, 'Reservation time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  partySize: {
    type: Number,
    required: [true, 'Party size is required'],
    min: [1, 'Party size must be at least 1'],
    max: [20, 'Party size cannot exceed 20']
  },
  tableNumber: {
    type: Number,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  occasion: {
    type: String,
    enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'celebration', 'other'],
    default: 'other'
  },
  seatingPreference: {
    type: String,
    enum: ['window', 'booth', 'bar', 'patio', 'private', 'no-preference'],
    default: 'no-preference'
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 90
  },
  actualDuration: {
    type: Number // in minutes
  },
  arrivalTime: Date,
  departureTime: Date,
  notes: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for date and time queries
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ customer: 1, date: -1 });
reservationSchema.index({ status: 1, date: 1 });
reservationSchema.index({ tableNumber: 1, date: 1, time: 1 });

// Virtual for full datetime
reservationSchema.virtual('datetime').get(function() {
  const [hours, minutes] = this.time.split(':');
  const datetime = new Date(this.date);
  datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return datetime;
});

// Ensure virtual fields are serialized
reservationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Reservation', reservationSchema);