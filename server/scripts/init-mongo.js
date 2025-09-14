// MongoDB initialization script
db = db.getSiblingDB('restaurant_crm');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.createCollection('customers');
db.customers.createIndex({ "email": 1 });
db.customers.createIndex({ "phone": 1 });
db.customers.createIndex({ "loyaltyPoints": -1 });
db.customers.createIndex({ "totalSpent": -1 });

db.createCollection('menuitems');
db.menuitems.createIndex({ "category": 1, "isAvailable": 1 });
db.menuitems.createIndex({ "timesOrdered": -1 });

db.createCollection('orders');
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "customer": 1, "createdAt": -1 });
db.orders.createIndex({ "staff": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "createdAt": -1 });

db.createCollection('reservations');
db.reservations.createIndex({ "date": 1, "time": 1 });
db.reservations.createIndex({ "customer": 1, "date": -1 });
db.reservations.createIndex({ "status": 1, "date": 1 });
db.reservations.createIndex({ "tableNumber": 1, "date": 1, "time": 1 });

print('Database initialized with collections and indexes');