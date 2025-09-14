const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      Reservation.deleteMany({})
    ]);

    console.log('🗑️  Cleared existing data');

    // Create Users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@restaurant.com',
        password: 'admin123',
        role: 'admin',
        phone: '+1-555-0001'
      },
      {
        name: 'Manager Smith',
        email: 'manager@restaurant.com',
        password: 'manager123',
        role: 'manager',
        phone: '+1-555-0002'
      },
      {
        name: 'Staff Johnson',
        email: 'staff@restaurant.com',
        password: 'staff123',
        role: 'staff',
        phone: '+1-555-0003'
      },
      {
        name: 'Alice Cooper',
        email: 'alice@restaurant.com',
        password: 'staff123',
        role: 'staff',
        phone: '+1-555-0004'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@restaurant.com',
        password: 'staff123',
        role: 'staff',
        phone: '+1-555-0005'
      }
    ];

    // Hash passwords because insertMany bypasses pre-save middleware
    const usersWithHashed = await Promise.all(users.map(async u => {
      const salt = await bcrypt.genSalt(12);
      return { ...u, password: await bcrypt.hash(u.password, salt) };
    }));
    const createdUsers = await User.insertMany(usersWithHashed);
    console.log('👥 Created users');

    // Create Customers
    const customers = [
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-1001',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        loyaltyPoints: 150,
        totalSpent: 450.75,
        visits: 8,
        lastVisit: new Date('2024-01-15'),
        status: 'vip',
        preferences: {
          dietaryRestrictions: ['gluten-free'],
          favoriteItems: ['Grilled Salmon', 'Caesar Salad'],
          seatingPreference: 'window'
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1-555-1002',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        loyaltyPoints: 75,
        totalSpent: 225.50,
        visits: 4,
        lastVisit: new Date('2024-01-10'),
        status: 'active',
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          favoriteItems: ['Margherita Pizza'],
          seatingPreference: 'booth'
        }
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com',
        phone: '+1-555-1003',
        loyaltyPoints: 200,
        totalSpent: 680.25,
        visits: 12,
        lastVisit: new Date('2024-01-18'),
        status: 'vip'
      },
      {
        name: 'Sarah Williams',
        email: 'sarah.williams@email.com',
        phone: '+1-555-1004',
        loyaltyPoints: 45,
        totalSpent: 125.00,
        visits: 2,
        lastVisit: new Date('2024-01-05'),
        status: 'active'
      },
      {
        name: 'David Brown',
        email: 'david.brown@email.com',
        phone: '+1-555-1005',
        loyaltyPoints: 320,
        totalSpent: 890.75,
        visits: 15,
        lastVisit: new Date('2024-01-20'),
        status: 'vip'
      }
    ];

    // Add more customers
    for (let i = 6; i <= 50; i++) {
      customers.push({
        name: `Customer ${i}`,
        email: `customer${i}@email.com`,
        phone: `+1-555-${1000 + i}`,
        loyaltyPoints: Math.floor(Math.random() * 500),
        totalSpent: Math.floor(Math.random() * 1000),
        visits: Math.floor(Math.random() * 20) + 1,
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: ['active', 'vip', 'inactive'][Math.floor(Math.random() * 3)]
      });
    }

    const createdCustomers = await Customer.insertMany(customers);
    console.log('👤 Created customers');

    // Create Menu Items
    const menuItems = [
      // Appetizers
      {
        name: 'Buffalo Wings',
        description: 'Crispy chicken wings tossed in spicy buffalo sauce',
        category: 'appetizers',
        price: 12.99,
        cost: 4.50,
        ingredients: ['chicken wings', 'buffalo sauce', 'celery', 'blue cheese'],
        allergens: ['dairy'],
        preparationTime: 15,
        isAvailable: true,
        timesOrdered: 145,
        spiceLevel: 'hot'
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Golden fried mozzarella with marinara sauce',
        category: 'appetizers',
        price: 9.99,
        cost: 3.25,
        ingredients: ['mozzarella', 'breadcrumbs', 'marinara sauce'],
        allergens: ['dairy', 'gluten'],
        preparationTime: 10,
        isAvailable: true,
        timesOrdered: 98,
        isVegetarian: true
      },
      {
        name: 'Calamari Rings',
        description: 'Crispy fried squid rings with spicy aioli',
        category: 'appetizers',
        price: 14.99,
        cost: 5.75,
        ingredients: ['squid', 'flour', 'spices', 'aioli'],
        allergens: ['shellfish', 'gluten'],
        preparationTime: 12,
        isAvailable: true,
        timesOrdered: 67
      },

      // Salads
      {
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan and croutons',
        category: 'salads',
        price: 11.99,
        cost: 3.50,
        ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
        allergens: ['dairy', 'gluten'],
        preparationTime: 8,
        isAvailable: true,
        isVegetarian: true,
        timesOrdered: 156
      },
      {
        name: 'Greek Salad',
        description: 'Fresh vegetables with feta cheese and olives',
        category: 'salads',
        price: 13.99,
        cost: 4.25,
        ingredients: ['mixed greens', 'feta cheese', 'olives', 'tomatoes', 'cucumber'],
        allergens: ['dairy'],
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: true,
        timesOrdered: 89
      },

      // Mains
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with lemon herb butter',
        category: 'mains',
        price: 24.99,
        cost: 12.50,
        ingredients: ['salmon fillet', 'lemon', 'herbs', 'butter'],
        allergens: ['fish', 'dairy'],
        preparationTime: 20,
        isAvailable: true,
        timesOrdered: 234,
        isGlutenFree: true
      },
      {
        name: 'Ribeye Steak',
        description: '12oz prime ribeye with garlic mashed potatoes',
        category: 'mains',
        price: 32.99,
        cost: 18.75,
        ingredients: ['ribeye steak', 'potatoes', 'garlic', 'butter'],
        allergens: ['dairy'],
        preparationTime: 25,
        isAvailable: true,
        timesOrdered: 187,
        isGlutenFree: true
      },
      {
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomatoes, and basil',
        category: 'mains',
        price: 16.99,
        cost: 6.25,
        ingredients: ['pizza dough', 'mozzarella', 'tomatoes', 'basil'],
        allergens: ['dairy', 'gluten'],
        preparationTime: 18,
        isAvailable: true,
        isVegetarian: true,
        timesOrdered: 298
      },
      {
        name: 'Chicken Parmesan',
        description: 'Breaded chicken breast with marinara and mozzarella',
        category: 'mains',
        price: 19.99,
        cost: 8.50,
        ingredients: ['chicken breast', 'breadcrumbs', 'marinara', 'mozzarella'],
        allergens: ['dairy', 'gluten'],
        preparationTime: 22,
        isAvailable: true,
        timesOrdered: 176
      },

      // Desserts
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center',
        category: 'desserts',
        price: 8.99,
        cost: 2.75,
        ingredients: ['chocolate', 'flour', 'eggs', 'butter'],
        allergens: ['dairy', 'eggs', 'gluten'],
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: true,
        timesOrdered: 123
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        category: 'desserts',
        price: 7.99,
        cost: 3.25,
        ingredients: ['mascarpone', 'coffee', 'ladyfingers', 'cocoa'],
        allergens: ['dairy', 'eggs', 'gluten'],
        preparationTime: 5,
        isAvailable: true,
        isVegetarian: true,
        timesOrdered: 87
      },

      // Beverages
      {
        name: 'Craft Beer Selection',
        description: 'Local craft beer on tap',
        category: 'beverages',
        price: 6.99,
        cost: 2.25,
        preparationTime: 2,
        isAvailable: true,
        timesOrdered: 267
      },
      {
        name: 'House Wine',
        description: 'Red or white wine by the glass',
        category: 'beverages',
        price: 8.99,
        cost: 3.50,
        preparationTime: 2,
        isAvailable: true,
        timesOrdered: 198
      },
      {
        name: 'Fresh Lemonade',
        description: 'Freshly squeezed lemonade',
        category: 'beverages',
        price: 4.99,
        cost: 1.25,
        preparationTime: 3,
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
        timesOrdered: 145
      }
    ];

    const createdMenuItems = await MenuItem.insertMany(menuItems);
    console.log('🍽️  Created menu items');

    // Create Orders
    const orders = [];
    const staffMembers = createdUsers.filter(user => user.role === 'staff' || user.role === 'manager');
    
    for (let i = 0; i < 100; i++) {
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
      const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Select random menu items
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedItems = [];
      const usedItems = new Set();
      
      for (let j = 0; j < numItems; j++) {
        let menuItem;
        do {
          menuItem = createdMenuItems[Math.floor(Math.random() * createdMenuItems.length)];
        } while (usedItems.has(menuItem._id.toString()));
        
        usedItems.add(menuItem._id.toString());
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        selectedItems.push({
          menuItem: menuItem._id,
          quantity,
          price: menuItem.price
        });
      }
      
      const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08;
      const tip = Math.random() > 0.3 ? subtotal * (0.15 + Math.random() * 0.1) : 0;
      const total = subtotal + tax + tip;
      
      orders.push({
        customer: customer._id,
        staff: staff._id,
        items: selectedItems,
        orderType: ['dine-in', 'takeout', 'delivery'][Math.floor(Math.random() * 3)],
        status: ['completed', 'completed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
        paymentStatus: 'paid',
        paymentMethod: ['cash', 'card', 'digital-wallet'][Math.floor(Math.random() * 3)],
        subtotal,
        tax,
        tip,
        total,
        tableNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : undefined,
        createdAt: orderDate,
        updatedAt: orderDate,
        orderNumber: `ORD-${Date.now().toString().slice(-6)}-${i}`
      });
    }

    const createdOrders = [];
    for (const ord of orders) {
      const orderDoc = new Order(ord);
      await orderDoc.save();
      createdOrders.push(orderDoc);
    }
    console.log('🛒 Created orders');

    // Create Reservations
    const reservations = [];
    const timeSlots = ['11:00', '12:00', '13:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    
    for (let i = 0; i < 50; i++) {
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const reservationDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      reservations.push({
        customer: customer._id,
        date: reservationDate,
        time,
        partySize: Math.floor(Math.random() * 8) + 1,
        tableNumber: Math.floor(Math.random() * 20) + 1,
        status: ['pending', 'confirmed', 'confirmed', 'confirmed'][Math.floor(Math.random() * 4)],
        contactPhone: customer.phone,
        contactEmail: customer.email,
        occasion: ['birthday', 'anniversary', 'business', 'date', 'family', 'other'][Math.floor(Math.random() * 6)],
        seatingPreference: ['window', 'booth', 'bar', 'patio', 'no-preference'][Math.floor(Math.random() * 5)],
        createdBy: createdUsers[0]._id
      });
    }

    await Reservation.insertMany(reservations);
    console.log('📅 Created reservations');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`👤 Customers: ${createdCustomers.length}`);
    console.log(`🍽️  Menu Items: ${createdMenuItems.length}`);
    console.log(`🛒 Orders: ${createdOrders.length}`);
    console.log(`📅 Reservations: ${reservations.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@restaurant.com / admin123');
    console.log('Manager: manager@restaurant.com / manager123');
    console.log('Staff: staff@restaurant.com / staff123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedData();