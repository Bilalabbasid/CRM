# Restaurant CRM (Local)

This repository is a local copy of the Restaurant CRM frontend + backend. The frontend is a Vite + React app and the backend is a Node/Express API using MongoDB (Mongoose).

**Quick Goal:** show a working UI locally even when backend data is not present. Some pages include static *development dummy data* fallbacks so you can see the UI/layout and flows immediately. The API client (`src/services/api.js`) is unchanged — dummy data is only used inside certain page components.

**How to Run (dev)**
- **Backend:**
  - `cd project/server`
  - `npm install` (if you haven't already)
  - `npm run dev` (starts with `nodemon`, default port `5000`)
- **Frontend:**
  - `cd project`
  - `npm install` (if you haven't already)
  - `npm run dev` (Vite dev server, default port `5173`)

**Environment / Seeds**
- Backend environment variables live in `project/server/.env` (use `MONGODB_URI`, `JWT_SECRET`, etc.).
- Demo accounts were created by script `project/server/scripts/createDemoUsers.js`.
- Demo credentials (dev):
  - Admin: `admin@restaurant.com` / `admin123`
  - Manager: `manager@restaurant.com` / `manager123`
  - Staff: `staff@restaurant.com` / `staff123`

**Functionalities (pages & features)**
- **Dashboard** (`src/pages/Dashboard.tsx`): shows sales chart, top menu items, recent activity, and stat cards.
- **Customers** (`src/pages/Customers.tsx`): list, create, update, delete customers (wired to `apiService` but shows dummy rows if API empty).
- **Reservations** (`src/pages/Reservations.tsx`): list of reservations and quick details.
- **Orders** (`src/pages/Orders.tsx`): recent orders list.
- **Menu** (`src/pages/Menu.tsx`): menu items listing.
- **Staff** (`src/pages/Staff.tsx`): team members list.
- **Auth**: login/register handled with `src/hooks/useAuth.jsx` and `src/services/api.js` (JWT stored in `localStorage`).

**Where Dummy Data Is Used (development-only fallbacks)**
- `src/pages/Customers.tsx` — fallback `dummy` array used if API returns empty.
- `src/pages/Reservations.tsx` — fallback `dummy` array used if API returns empty.
- `src/pages/Orders.tsx` — fallback `dummy` array used if API returns empty.
- `src/pages/Menu.tsx` — fallback `dummy` array used if API returns empty.
- `src/pages/Dashboard.tsx` — dummy stats, dummy sales chart data and dummy top-menu items used when API responses are missing or empty.

These fallbacks live inside the page files as local `const dummy = [...]` arrays and are selected only when the API returns no items.

Why this approach: it keeps all `apiService` calls intact so switching to real backend data is just a matter of running the API and/or removing the fallback arrays — no client API logic is changed.

How to remove the dummy data (make UI rely only on live API):
1. Ensure the backend is running and seeded with data.
2. Open the frontend page files listed above and locate the `dummy` arrays (they are near the top of the `fetch...` functions).
3. Replace code like:

```js
const list = res.items || res || [];
const dummy = [ /* ... */ ];
const effective = (Array.isArray(list) && list.length > 0) ? list : dummy;
setItems(effective);
```

with simply:

```js
const list = res.items || res || [];
setItems(Array.isArray(list) ? list : []);
```

4. Save files and reload the dev server. The UI will now reflect whatever the API returns.

Alternative: add a single config flag (e.g. `VITE_USE_DUMMY=true`) and guard fallbacks with that flag — this is easy to add if you want (I can implement it).

**Notes / Known Issues**
- There are a couple of development warnings from Mongoose about duplicate indexes; these do not prevent running but should be cleaned up in models.
- TypeScript/TSX linting can be strict — I used local types in pages to keep the UI working; for production you should replace `any`/`unknown` usages with precise interfaces.

**How to overwrite the GitHub repository (optional)**
If you want to overwrite the remote repository `https://github.com/Bilalabbasid/CRM` with the local workspace, run these commands from your project root (PowerShell):

```powershell
# 1) Initialize git repo (if not already)
git init
git add -A
git commit -m "Sync local changes: add dummy UI and README"

# 2) Add remote (replace if necessary)
git remote remove origin -ErrorAction SilentlyContinue
git remote add origin https://github.com/Bilalabbasid/CRM.git

# 3) Force-push local main branch to overwrite remote (CAUTION: this will replace the remote history)
git branch -M main
git push -u origin main --force
```

Only run the force-push if you're sure you want to overwrite the GitHub repository. If you prefer, I can prepare a branch and open instructions instead of force pushing.

**Files I changed for local dev dummy data and UX**
- `src/pages/Customers.tsx`
- `src/pages/Reservations.tsx`
- `src/pages/Orders.tsx`
- `src/pages/Menu.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Staff.tsx` (typing fixes)
- `src/services/api.d.ts` (light declaration for TS)

If you want I can:
- Add a single `VITE_USE_DUMMY` toggle and update pages to read `import.meta.env.VITE_USE_DUMMY` so you can flip dummy data on/off at build-time.
- Create a small admin route that seeds demo data into MongoDB (instead of local dummy arrays).

---

If you'd like, I can now: (choose one)
- implement the `VITE_USE_DUMMY` toggle and wire all pages to it;
- run the frontend dev server here, confirm the UI renders and take targeted screenshots; or
- prepare a branch and push instructions, or run the force-push for you (I will not push without explicit confirmation).
# Restaurant CRM Dashboard

A comprehensive Restaurant Customer Relationship Management (CRM) Dashboard built with React frontend and Node.js/Express backend using MongoDB database.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Manager, Staff)
- **Customer Management**: Complete CRM with customer profiles, visit history, loyalty points, and feedback
- **Reservations**: Table booking system with availability checking and conflict prevention
- **Order Management**: POS integration with order tracking, payment processing, and status updates
- **Menu Management**: Dynamic menu with categories, pricing, availability, and popularity tracking
- **Staff Management**: Employee profiles, performance tracking, and role management
- **Analytics & Reports**: Comprehensive reporting with charts and data visualization
- **Dashboard**: Real-time KPIs and business metrics

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching capability
- **Real-time Updates**: Live data synchronization
- **Data Export**: PDF/CSV export functionality
- **Search & Filtering**: Advanced search across all modules
- **Pagination**: Efficient data loading with pagination
- **Error Handling**: Comprehensive error management
- **Security**: Input validation, rate limiting, and secure headers

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization and charts
- **Lucide React** - Beautiful icons
- **Date-fns** - Date manipulation library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **MongoDB** - Database with replica set support

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-crm-dashboard
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Update the following variables in .env:
   MONGODB_URI=mongodb://localhost:27017/restaurant_crm
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

5. **Seed the database**
   ```bash
   cd server
   npm run seed
   cd ..
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Docker Setup

1. **Using Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

2. **Access the application**
   - Application: http://localhost (via Nginx)
   - Direct Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔐 Default Login Credentials

After seeding the database, use these credentials:

- **Admin**: admin@restaurant.com / admin123
- **Manager**: manager@restaurant.com / manager123
- **Staff**: staff@restaurant.com / staff123

## 📊 Database Schema

### Collections Overview
- **users** - Staff and admin accounts
- **customers** - Customer profiles and data
- **menuitems** - Restaurant menu with categories
- **orders** - Order management and tracking
- **reservations** - Table booking system

### Key Relationships
- Orders → Customers (customer_id)
- Orders → Users (staff_id)
- Orders → MenuItems (items array)
- Reservations → Customers (customer_id)

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/feedback` - Add feedback

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/payment` - Update payment

### Menu
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `GET /api/reservations/availability/:date` - Check availability

### Reports
- `GET /api/reports/sales` - Sales analytics
- `GET /api/reports/customers` - Customer analytics
- `GET /api/reports/menu` - Menu performance
- `GET /api/reports/dashboard` - Dashboard data

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/restaurant_crm

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

3. **Start the backend**
   ```bash
   cd server
   npm start
   ```

### Docker Production

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📈 Performance & Monitoring

### Database Indexes
- Customer email and phone indexes
- Order date and status indexes
- Menu category and availability indexes
- Reservation date and table indexes

### Caching Strategy
- API response caching
- Static asset caching
- Database query optimization

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Changelog

### Version 1.0.0
- Initial release with full CRM functionality
- Complete authentication and authorization
- Customer, order, and reservation management
- Menu management with analytics
- Staff management and performance tracking
- Comprehensive reporting and dashboard
- Docker deployment support