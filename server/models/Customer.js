const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  dateOfBirth: {
    type: Date
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  visits: {
    type: Number,
    default: 0,
    min: 0
  },
  lastVisit: {
    type: Date
  },
  preferences: {
    dietaryRestrictions: [String],
    favoriteItems: [String],
    seatingPreference: {
      type: String,
      enum: ['window', 'booth', 'bar', 'patio', 'no-preference'],
      default: 'no-preference'
    }
  },
  feedback: [{
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'vip', 'blacklisted'],
    default: 'active'
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for better performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ loyaltyPoints: -1 });
customerSchema.index({ totalSpent: -1 });

// Virtual for customer tier based on total spent
customerSchema.virtual('tier').get(function() {
  if (this.totalSpent >= 1000) return 'VIP';
  if (this.totalSpent >= 500) return 'Gold';
  if (this.totalSpent >= 200) return 'Silver';
  return 'Bronze';
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);