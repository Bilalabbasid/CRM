const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_crm';

async function createDemoUsers() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const demoUsers = [
    { name: 'Admin User', email: 'admin@restaurant.com', password: 'admin123', role: 'admin', phone: '+1-555-0001' },
    { name: 'Manager Smith', email: 'manager@restaurant.com', password: 'manager123', role: 'manager', phone: '+1-555-0002' },
    { name: 'Staff Johnson', email: 'staff@restaurant.com', password: 'staff123', role: 'staff', phone: '+1-555-0003' },
  ];

  try {
    for (const u of demoUsers) {
      const existing = await User.findOne({ email: u.email }).select('+password');
      if (existing) {
        existing.name = u.name;
        existing.role = u.role;
        existing.phone = u.phone;
        existing.password = u.password; // ensure password is marked modified so pre-save hashes it
        existing.markModified('password');
        existing.isActive = true;
        await existing.save();
        console.log(`Updated user: ${u.email}`);
      } else {
        const user = new User(u);
        await user.save();
        console.log(`Created user: ${u.email}`);
      }
    }

    console.log('✅ Demo users created/updated');
  } catch (err) {
    console.error('❌ Error creating demo users:', err);
  } finally {
    await mongoose.connection.close();
  }
}

createDemoUsers();
