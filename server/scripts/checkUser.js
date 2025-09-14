const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_crm');
    const admin = await User.findOne({ email: 'admin@restaurant.com' }).select('+password');
    console.log('Admin record:', admin);
    const manager = await User.findOne({ email: 'manager@restaurant.com' }).select('+password');
    console.log('Manager record:', manager);
    const staff = await User.findOne({ email: 'staff@restaurant.com' }).select('+password');
    console.log('Staff record:', staff);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
})();
