import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Clock,
  AlertTriangle, Package, Calendar, ChefHat, Activity,
  Bell, BarChart3, Award
} from 'lucide-react';

// Chart colors for consistency
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  
  // State management for all dashboard sections
  const [salesRevenue, setSalesRevenue] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any>(null);
  const [inventoryStock, setInventoryStock] = useState<any>(null);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [reservationsOrders, setReservationsOrders] = useState<any>(null);
  const [menuManagement, setMenuManagement] = useState<any>(null);
  const [staffOperations, setStaffOperations] = useState<any>(null);
  const [analyticsReports, setAnalyticsReports] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);

  // Comprehensive dummy data for Manager Dashboard
  const dummySalesRevenue = {
    dailySales: 4750,
    weeklySales: 28500,
    monthlySales: 142000,
    targetDaily: 5000,
    targetWeekly: 30000,
    targetMonthly: 150000,
    avgOrderValue: 42.50,
    paymentMethods: [
      { method: 'Card', amount: 2850, percentage: 60 },
      { method: 'Cash', amount: 1425, percentage: 30 },
      { method: 'Digital Wallet', amount: 332.5, percentage: 7 },
      { method: 'Online', amount: 142.5, percentage: 3 }
    ],
    branchSales: [
      { branch: 'Downtown', sales: 1900, target: 2000, performance: 95 },
      { branch: 'Mall Branch', sales: 1650, target: 1800, performance: 92 },
      { branch: 'Airport', sales: 1200, target: 1200, performance: 100 }
    ],
    hourlySales: Array.from({ length: 12 }, (_, i) => ({
      hour: `${i + 8}:00`,
      sales: Math.round(200 + Math.random() * 600),
      orders: Math.round(8 + Math.random() * 25)
    }))
  };

  const dummyTopPerformers = {
    topMenuItems: [
      { name: 'Grilled Chicken', quantity: 145, revenue: 2175, trend: 'up' },
      { name: 'Margherita Pizza', quantity: 128, revenue: 1920, trend: 'up' },
      { name: 'Caesar Salad', quantity: 98, revenue: 1176, trend: 'stable' },
      { name: 'Fish & Chips', quantity: 76, revenue: 1216, trend: 'down' },
      { name: 'Pasta Carbonara', quantity: 65, revenue: 1040, trend: 'up' }
    ],
    leastSelling: [
      { name: 'Mushroom Risotto', quantity: 8, revenue: 144, wastage: 3 },
      { name: 'Vegan Burger', quantity: 12, revenue: 192, wastage: 2 },
      { name: 'Seafood Platter', quantity: 15, revenue: 450, wastage: 1 }
    ],
    salesByTime: [
      { timeSlot: 'Breakfast (8-11)', orders: 45, revenue: 675 },
      { timeSlot: 'Lunch (12-15)', orders: 125, revenue: 2500 },
      { timeSlot: 'Dinner (18-22)', orders: 98, revenue: 2450 },
      { timeSlot: 'Late Night (22-24)', orders: 22, revenue: 330 }
    ],
    promotions: [
      { name: 'Happy Hour 50%', impact: '+35%', ordersIncrease: 67, revenueImpact: 890 },
      { name: 'Family Combo Deal', impact: '+22%', ordersIncrease: 43, revenueImpact: 645 },
      { name: 'Student Discount', impact: '+18%', ordersIncrease: 28, revenueImpact: 420 }
    ]
  };

  const dummyInventoryStock = {
    currentStock: [
      { item: 'Chicken Breast', current: 45, minimum: 50, status: 'critical', supplier: 'Fresh Farms' },
      { item: 'Tomatoes', current: 8, minimum: 25, status: 'critical', supplier: 'Garden Fresh' },
      { item: 'Cheese', current: 78, minimum: 30, status: 'good', supplier: 'Dairy Co' },
      { item: 'Flour', current: 120, minimum: 40, status: 'good', supplier: 'Mill Direct' },
      { item: 'Salmon', current: 12, minimum: 15, status: 'low', supplier: 'Ocean Catch' }
    ],
    lowStockAlerts: 5,
    fastMovingItems: [
      { item: 'Chicken Breast', dailyUsage: 25, daysLeft: 1.8 },
      { item: 'Mozzarella', dailyUsage: 18, daysLeft: 2.1 },
      { item: 'Lettuce', dailyUsage: 22, daysLeft: 2.5 }
    ],
    wastageReport: {
      totalWastage: 285.50,
      items: [
        { item: 'Bread Rolls', wasted: 15, value: 45, reason: 'Expired' },
        { item: 'Leafy Greens', wasted: 8, value: 32, reason: 'Wilted' },
        { item: 'Dairy Products', wasted: 12, value: 84, reason: 'Near expiry' }
      ]
    },
    supplierOrders: [
      { supplier: 'Fresh Farms', orderDate: '2025-09-14', status: 'In Transit', expectedDelivery: '2025-09-15' },
      { supplier: 'Garden Fresh', orderDate: '2025-09-13', status: 'Delivered', deliveryDate: '2025-09-14' },
      { supplier: 'Ocean Catch', orderDate: '2025-09-12', status: 'Pending', expectedDelivery: '2025-09-16' }
    ]
  };

  const dummyCustomerInsights = {
    totalCustomersToday: 142,
    repeatCustomers: 89,
    newCustomers: 53,
    repeatRate: 62.7,
    customerFeedback: {
      averageRating: 4.3,
      totalReviews: 156,
      recentReviews: [
        { customer: 'Sarah M.', rating: 5, comment: 'Excellent service and food quality!', time: '2 hours ago' },
        { customer: 'John D.', rating: 4, comment: 'Great atmosphere, slightly slow service', time: '4 hours ago' },
        { customer: 'Lisa K.', rating: 5, comment: 'Best pizza in town!', time: '6 hours ago' }
      ]
    },
    loyaltyProgram: {
      activeMembers: 1247,
      pointsIssued: 3456,
      pointsRedeemed: 1234,
      memberOrderValue: 52.30,
      nonMemberOrderValue: 38.20
    },
    customerLifetimeValue: {
      average: 245,
      vipCustomers: [
        { name: 'Ahmed Ali', clv: 1250, visits: 45, lastVisit: '2025-09-13' },
        { name: 'Fatima Khan', clv: 980, visits: 38, lastVisit: '2025-09-14' },
        { name: 'Omar Hassan', clv: 876, visits: 32, lastVisit: '2025-09-12' }
      ]
    }
  };

  const dummyReservationsOrders = {
    upcomingReservations: [
      { id: 1, customer: 'Aisha Rahman', time: '19:30', table: 'T12', guests: 4, phone: '+971-555-0123' },
      { id: 2, customer: 'Mohammed Al-Rashid', time: '20:00', table: 'T8', guests: 2, phone: '+971-555-0124' },
      { id: 3, customer: 'Nadia Qureshi', time: '20:30', table: 'T15', guests: 6, phone: '+971-555-0125' },
      { id: 4, customer: 'Hassan Ahmad', time: '21:00', table: 'T3', guests: 3, phone: '+971-555-0126' }
    ],
    orderStatus: {
      pending: 12,
      ongoing: 18,
      completed: 127,
      cancelled: 3
    },
    orderTypes: [
      { type: 'Dine-in', count: 89, percentage: 62 },
      { type: 'Takeaway', count: 34, percentage: 24 },
      { type: 'Delivery', count: 20, percentage: 14 }
    ],
    averageWaitTime: 18.5,
    averageCompletionTime: 22.3,
    peakHours: [
      { hour: '12:00-13:00', orders: 35 },
      { hour: '13:00-14:00', orders: 42 },
      { hour: '19:00-20:00', orders: 38 },
      { hour: '20:00-21:00', orders: 29 }
    ]
  };

  const dummyMenuManagement = {
    activeItems: 145,
    outOfStockItems: [
      { name: 'Grilled Salmon', reason: 'Ingredient shortage', estimatedReturn: '2025-09-16' },
      { name: 'Mushroom Risotto', reason: 'Seasonal unavailable', estimatedReturn: '2025-09-20' }
    ],
    seasonalSpecials: [
      { name: 'Autumn Harvest Salad', price: 24, ordersToday: 18, status: 'active' },
      { name: 'Pumpkin Spice Latte', price: 12, ordersToday: 45, status: 'popular' },
      { name: 'Roasted Turkey Special', price: 32, ordersToday: 12, status: 'new' }
    ],
    menuPerformance: [
      { category: 'Appetizers', items: 23, avgPrice: 18, orderCount: 156, revenue: 2808 },
      { category: 'Main Courses', items: 45, avgPrice: 28, orderCount: 198, revenue: 5544 },
      { category: 'Desserts', items: 18, avgPrice: 15, orderCount: 87, revenue: 1305 },
      { category: 'Beverages', items: 32, avgPrice: 8, orderCount: 234, revenue: 1872 }
    ]
  };

  const dummyStaffOperations = {
    attendance: {
      present: 18,
      total: 22,
      rate: 81.8,
      lateArrivals: 3
    },
    staffPerformance: [
      { name: 'Ahmed Hassan', role: 'Waiter', ordersServed: 45, avgServiceTime: 8.2, rating: 4.8 },
      { name: 'Noor Al-Zahra', role: 'Chef', dishesCompleted: 78, avgPrepTime: 12.5, rating: 4.9 },
      { name: 'Omar Farouk', role: 'Waiter', ordersServed: 38, avgServiceTime: 9.1, rating: 4.6 },
      { name: 'Layla Ibrahim', role: 'Cashier', transactionsHandled: 156, avgTransactionTime: 2.3, rating: 4.7 }
    ],
    pendingTasks: [
      { task: 'Inventory count - Dry goods', assignedTo: 'Khalid Mansour', dueTime: '16:00', priority: 'high' },
      { task: 'Deep clean kitchen equipment', assignedTo: 'Sara Ahmed', dueTime: '18:00', priority: 'medium' },
      { task: 'Update menu board specials', assignedTo: 'Yusuf Ali', dueTime: '17:30', priority: 'low' }
    ],
    shiftOverview: {
      morning: { staff: 8, coverage: 'full' },
      afternoon: { staff: 12, coverage: 'full' },
      evening: { staff: 15, coverage: 'optimal' },
      night: { staff: 6, coverage: 'minimal' }
    }
  };

  const dummyAnalyticsReports = {
    branchComparison: [
      { branch: 'Downtown', revenue: 1900, customers: 89, avgOrder: 41.2, satisfaction: 4.3 },
      { branch: 'Mall', revenue: 1650, customers: 76, avgOrder: 38.5, satisfaction: 4.1 },
      { branch: 'Airport', revenue: 1200, customers: 52, avgOrder: 45.8, satisfaction: 4.5 }
    ],
    customerDemographics: [
      { ageGroup: '18-25', percentage: 25, orderPreference: 'Fast Food' },
      { ageGroup: '26-35', percentage: 35, orderPreference: 'Premium' },
      { ageGroup: '36-45', percentage: 28, orderPreference: 'Family Meals' },
      { ageGroup: '46+', percentage: 12, orderPreference: 'Traditional' }
    ],
    marketingImpact: [
      { campaign: 'Social Media Ads', orders: 45, revenue: 1260, roi: 4.2 },
      { campaign: 'Email Newsletter', orders: 23, revenue: 690, roi: 5.8 },
      { campaign: 'Local Radio', orders: 18, revenue: 540, roi: 2.1 }
    ],
    profitabilityByCategory: [
      { category: 'Beverages', revenue: 1872, cost: 468, profit: 1404, margin: 75 },
      { category: 'Main Courses', revenue: 5544, cost: 2217.6, profit: 3326.4, margin: 60 },
      { category: 'Desserts', revenue: 1305, cost: 456.75, profit: 848.25, margin: 65 },
      { category: 'Appetizers', revenue: 2808, cost: 1123.2, profit: 1684.8, margin: 60 }
    ]
  };

  const dummyRecentActivity = {
    recentOrders: [
      { id: '#1234', customer: 'Ali Mahmoud', amount: 65, time: '5 mins ago', status: 'completed' },
      { id: '#1235', customer: 'Maryam Hassan', amount: 42, time: '12 mins ago', status: 'preparing' },
      { id: '#1236', customer: 'Ahmed Al-Rashid', amount: 78, time: '18 mins ago', status: 'delivered' }
    ],
    customerSignups: [
      { name: 'Nadia Qureshi', email: 'nadia.q@email.com', time: '1 hour ago', source: 'Website' },
      { name: 'Omar Khalil', email: 'omar.k@email.com', time: '2 hours ago', source: 'App' }
    ],
    refundsCancellations: [
      { orderId: '#1220', reason: 'Food quality issue', amount: 35, time: '3 hours ago' },
      { orderId: '#1218', reason: 'Order cancelled by customer', amount: 28, time: '4 hours ago' }
    ],
    supplierDeliveries: [
      { supplier: 'Fresh Farms', items: 'Chicken, Vegetables', time: '2 hours ago', status: 'received' },
      { supplier: 'Dairy Co', items: 'Cheese, Milk products', time: '4 hours ago', status: 'received' }
    ]
  };

  const dummyAlerts = {
    lowInventory: [
      { item: 'Chicken Breast', current: 45, minimum: 50, urgency: 'high' },
      { item: 'Tomatoes', current: 8, minimum: 25, urgency: 'critical' }
    ],
    reservationConflicts: [
      { table: 'T12', time: '20:00', issue: 'Double booking detected', customers: ['Ahmed Ali', 'Sara Hassan'] }
    ],
    customerComplaints: [
      { customer: 'Omar Farouk', issue: 'Cold food served', time: '2 hours ago', status: 'escalated' },
      { customer: 'Layla Ahmed', issue: 'Long wait time', time: '1 hour ago', status: 'resolved' }
    ],
    delayedOrders: [
      { orderId: '#1240', customer: 'Hassan Al-Rashid', delay: 25, expectedTime: '45 mins', reason: 'Kitchen backlog' }
    ]
  };

  // Helper function for priority colors
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': case 'critical': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getStockStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'good': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // API calls would go here - for now using dummy data
        const svc: any = api;
        
        // In a real app, these would be actual API calls
        // setSalesRevenue(await svc.getSalesRevenue());
        // setTopPerformers(await svc.getTopPerformers());
        // etc...
        
        // Using dummy data as fallback
        setSalesRevenue(dummySalesRevenue);
        setTopPerformers(dummyTopPerformers);
        setInventoryStock(dummyInventoryStock);
        setCustomerInsights(dummyCustomerInsights);
        setReservationsOrders(dummyReservationsOrders);
        setMenuManagement(dummyMenuManagement);
        setStaffOperations(dummyStaffOperations);
        setAnalyticsReports(dummyAnalyticsReports);
        setRecentActivity(dummyRecentActivity);
        setAlerts(dummyAlerts);
        
      } catch (error) {
        console.warn('Error loading dashboard data:', error);
        // Set dummy data on error
        setSalesRevenue(dummySalesRevenue);
        setTopPerformers(dummyTopPerformers);
        setInventoryStock(dummyInventoryStock);
        setCustomerInsights(dummyCustomerInsights);
        setReservationsOrders(dummyReservationsOrders);
        setMenuManagement(dummyMenuManagement);
        setStaffOperations(dummyStaffOperations);
        setAnalyticsReports(dummyAnalyticsReports);
        setRecentActivity(dummyRecentActivity);
        setAlerts(dummyAlerts);
      }
    };

    if (profile) {
      loadData();
    }
  }, [profile]);

  if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">This dashboard is only accessible to Managers and Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive restaurant operations management</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Welcome, {profile.name || profile.email}</div>
          <div>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}</div>
        </div>
      </div>

      {/* 1. Sales & Revenue Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <DollarSign className="h-6 w-6 text-green-500 mr-2" />
            Sales & Revenue Overview
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* KPIs */}
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border">
                <div className="text-sm text-green-600">Daily Sales</div>
                <div className="text-2xl font-bold text-green-800">${salesRevenue?.dailySales?.toLocaleString() || '4,750'}</div>
                <div className="text-xs text-gray-500">Target: ${salesRevenue?.targetDaily?.toLocaleString() || '5,000'}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, ((salesRevenue?.dailySales || 4750) / (salesRevenue?.targetDaily || 5000)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="text-sm text-blue-600">Weekly Sales</div>
                <div className="text-xl font-bold text-blue-800">${salesRevenue?.weeklySales?.toLocaleString() || '28,500'}</div>
                <div className="text-xs text-gray-500">Target: ${salesRevenue?.targetWeekly?.toLocaleString() || '30,000'}</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border">
                <div className="text-sm text-purple-600">Avg Order Value</div>
                <div className="text-xl font-bold text-purple-800">${salesRevenue?.avgOrderValue?.toFixed(2) || '42.50'}</div>
                <div className="text-xs text-gray-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.2% vs yesterday
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h3 className="font-medium mb-3">💳 Payment Methods Split</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={salesRevenue?.paymentMethods || []}
                    dataKey="percentage"
                    nameKey="method"
                    outerRadius={80}
                    fill="#8884d8"
                    label={(entry: any) => `${entry.method}: ${entry.percentage}%`}
                  >
                    {(salesRevenue?.paymentMethods || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Branch Performance */}
            <div>
              <h3 className="font-medium mb-3">🏢 Branch Performance</h3>
              <div className="space-y-3">
                {(salesRevenue?.branchSales || []).map((branch: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{branch.branch}</div>
                      <div className="text-sm text-gray-600">{branch.performance}%</div>
                    </div>
                    <div className="text-lg font-bold">${branch.sales?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Target: ${branch.target?.toLocaleString()}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${branch.performance >= 100 ? 'bg-green-500' : branch.performance >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, branch.performance)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Sales Trend */}
            <div>
              <h3 className="font-medium mb-3">📊 Hourly Sales Today</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesRevenue?.hourlySales || []}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" fontSize={10} />
                  <YAxis fontSize={10} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Top Performers & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Award className="h-5 w-5 text-yellow-500 mr-2" />
              Top Performers & Trends
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">🏆 Top Selling Menu Items</h4>
                <div className="space-y-2">
                  {(topPerformers?.topMenuItems || []).slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-600">Qty: {item.quantity} | Revenue: ${item.revenue}</div>
                      </div>
                      <div className="flex items-center">
                        {item.trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : 
                         item.trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> : 
                         <div className="h-4 w-4 bg-gray-400 rounded-full"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">📉 Least Selling Items</h4>
                <div className="space-y-2">
                  {(topPerformers?.leastSelling || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-red-600">Sold: {item.quantity} | Waste: {item.wastage}</div>
                      </div>
                      <div className="text-sm">${item.revenue}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              Sales by Time & Promotions
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">⏰ Sales by Time of Day</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={topPerformers?.salesByTime || []}>
                    <XAxis dataKey="timeSlot" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🎯 Promotion Performance</h4>
                <div className="space-y-2">
                  {(topPerformers?.promotions || []).map((promo: any, idx: number) => (
                    <div key={idx} className="bg-green-50 p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm">{promo.name}</div>
                        <div className="text-green-600 font-bold">{promo.impact}</div>
                      </div>
                      <div className="text-xs text-gray-600">+{promo.ordersIncrease} orders | +${promo.revenueImpact} revenue</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Inventory & Stock Management */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Package className="h-6 w-6 text-orange-500 mr-2" />
            Inventory & Stock Management
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-3">📦 Current Stock Levels</h3>
              <div className="space-y-2">
                {(inventoryStock?.currentStock || []).map((item: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded border ${getStockStatusColor(item.status)}`}>
                    <div className="font-medium text-sm">{item.item}</div>
                    <div className="text-lg font-bold">{item.current}</div>
                    <div className="text-xs">Min: {item.minimum} | {item.supplier}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">⚠️ Low Stock Alerts</h3>
              <div className="bg-red-50 p-3 rounded border border-red-200 mb-3">
                <div className="text-2xl font-bold text-red-600">{inventoryStock?.lowStockAlerts || 5}</div>
                <div className="text-sm text-red-700">Items need restocking</div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">🚀 Fast Moving Items</h4>
                <div className="space-y-2">
                  {(inventoryStock?.fastMovingItems || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 p-2 rounded text-xs">
                      <div className="font-medium">{item.item}</div>
                      <div className="text-gray-600">{item.daysLeft} days left</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">🗑️ Wastage Report</h3>
              <div className="bg-red-50 p-3 rounded border border-red-200 mb-3">
                <div className="text-lg font-bold text-red-600">${inventoryStock?.wastageReport?.totalWastage || 285.50}</div>
                <div className="text-sm text-red-700">Total Wastage Today</div>
              </div>
              <div className="space-y-2">
                {(inventoryStock?.wastageReport?.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-2 rounded border text-xs">
                    <div className="font-medium">{item.item}</div>
                    <div className="text-gray-600">Qty: {item.wasted} | ${item.value}</div>
                    <div className="text-red-600">{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">🚛 Supplier Orders</h3>
              <div className="space-y-2">
                {(inventoryStock?.supplierOrders || []).map((order: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">{order.supplier}</div>
                    <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {order.expectedDelivery || order.deliveryDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Customer Insights & 5. Reservations & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-2" />
              Customer Insights
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-xl font-bold text-blue-600">{customerInsights?.totalCustomersToday || 142}</div>
                  <div className="text-xs text-blue-700">Total Today</div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-xl font-bold text-green-600">{customerInsights?.repeatCustomers || 89}</div>
                  <div className="text-xs text-green-700">Repeat ({customerInsights?.repeatRate || 62.7}%)</div>
                </div>
                <div className="bg-purple-50 p-3 rounded text-center">
                  <div className="text-xl font-bold text-purple-600">{customerInsights?.newCustomers || 53}</div>
                  <div className="text-xs text-purple-700">New Customers</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">⭐ Customer Feedback</h4>
                <div className="bg-yellow-50 p-3 rounded border mb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">{customerInsights?.customerFeedback?.averageRating || 4.3}/5</div>
                    <div className="text-sm text-gray-600">{customerInsights?.customerFeedback?.totalReviews || 156} reviews</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {(customerInsights?.customerFeedback?.recentReviews || []).slice(0, 2).map((review: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded border text-xs">
                      <div className="flex justify-between">
                        <div className="font-medium">{review.customer}</div>
                        <div className="text-yellow-600">{'⭐'.repeat(review.rating)}</div>
                      </div>
                      <div className="text-gray-600">{review.comment}</div>
                      <div className="text-gray-400">{review.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">💎 VIP Customers</h4>
                <div className="space-y-2">
                  {(customerInsights?.customerLifetimeValue?.vipCustomers || []).slice(0, 3).map((vip: any, idx: number) => (
                    <div key={idx} className="bg-purple-50 p-2 rounded border text-sm">
                      <div className="flex justify-between">
                        <div className="font-medium">{vip.name}</div>
                        <div className="text-purple-600">${vip.clv}</div>
                      </div>
                      <div className="text-xs text-gray-600">{vip.visits} visits | Last: {vip.lastVisit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
              Reservations & Orders
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">📅 Upcoming Reservations</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(reservationsOrders?.upcomingReservations || []).map((res: any, idx: number) => (
                    <div key={idx} className="bg-blue-50 p-2 rounded border text-sm">
                      <div className="flex justify-between">
                        <div className="font-medium">{res.customer}</div>
                        <div className="text-blue-600">{res.time}</div>
                      </div>
                      <div className="text-xs text-gray-600">Table {res.table} | {res.guests} guests</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="font-medium mb-2 text-sm">📊 Order Status</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Pending</span>
                      <span className="font-bold text-yellow-600">{reservationsOrders?.orderStatus?.pending || 12}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Ongoing</span>
                      <span className="font-bold text-blue-600">{reservationsOrders?.orderStatus?.ongoing || 18}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Completed</span>
                      <span className="font-bold text-green-600">{reservationsOrders?.orderStatus?.completed || 127}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">🍽️ Order Types</h4>
                  <ResponsiveContainer width="100%" height={80}>
                    <PieChart>
                      <Pie
                        data={reservationsOrders?.orderTypes || []}
                        dataKey="percentage"
                        nameKey="type"
                        outerRadius={30}
                        fill="#8884d8"
                      >
                        {(reservationsOrders?.orderTypes || []).map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="text-sm text-green-600">Avg Wait Time</div>
                  <div className="font-bold text-green-700">{reservationsOrders?.averageWaitTime || 18.5} min</div>
                </div>
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-sm text-blue-600">Completion Time</div>
                  <div className="font-bold text-blue-700">{reservationsOrders?.averageCompletionTime || 22.3} min</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue with remaining sections... */}
      {/* 6. Menu Management & 7. Staff Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="h-5 w-5 text-green-500 mr-2" />
              Menu Management
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-xl font-bold text-green-600">{menuManagement?.activeItems || 145}</div>
                  <div className="text-xs text-green-700">Active Items</div>
                </div>
                <div className="bg-red-50 p-3 rounded text-center">
                  <div className="text-xl font-bold text-red-600">{menuManagement?.outOfStockItems?.length || 2}</div>
                  <div className="text-xs text-red-700">Out of Stock</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">🚫 Out of Stock Items</h4>
                <div className="space-y-2">
                  {(menuManagement?.outOfStockItems || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-red-50 p-2 rounded border border-red-200 text-sm">
                      <div className="font-medium text-red-700">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.reason}</div>
                      <div className="text-xs text-blue-600">Return: {item.estimatedReturn}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">🎯 Seasonal Specials</h4>
                <div className="space-y-2">
                  {(menuManagement?.seasonalSpecials || []).map((special: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 p-2 rounded border text-sm">
                      <div className="flex justify-between">
                        <div className="font-medium">{special.name}</div>
                        <div className="text-green-600">${special.price}</div>
                      </div>
                      <div className="text-xs text-gray-600">Orders today: {special.ordersToday}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <ChefHat className="h-5 w-5 text-orange-500 mr-2" />
              Staff & Operations
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">Staff Attendance Today</div>
                <div className="text-xl font-bold text-blue-800">
                  {staffOperations?.attendance?.present || 18}/{staffOperations?.attendance?.total || 22} 
                  <span className="text-sm ml-2">({staffOperations?.attendance?.rate || 81.8}%)</span>
                </div>
                <div className="text-xs text-red-600">Late arrivals: {staffOperations?.attendance?.lateArrivals || 3}</div>
              </div>

              <div>
                <h4 className="font-medium mb-2">⭐ Top Staff Performance</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(staffOperations?.staffPerformance || []).slice(0, 3).map((staff: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded border text-sm">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-gray-600">{staff.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-600">{staff.rating} ⭐</div>
                          <div className="text-xs text-gray-600">
                            {staff.ordersServed ? `${staff.ordersServed} orders` : `${staff.dishesCompleted} dishes`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">📋 Pending Tasks</h4>
                <div className="space-y-2">
                  {(staffOperations?.pendingTasks || []).map((task: any, idx: number) => (
                    <div key={idx} className={`p-2 rounded border text-xs ${getPriorityColor(task.priority)}`}>
                      <div className="font-medium">{task.task}</div>
                      <div className="text-gray-600">Assigned: {task.assignedTo}</div>
                      <div className="text-gray-600">Due: {task.dueTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8. Analytics & Reports */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="h-6 w-6 text-indigo-500 mr-2" />
            Analytics & Reports
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-3">🏢 Branch Comparison</h3>
              <div className="space-y-2">
                {(analyticsReports?.branchComparison || []).map((branch: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">{branch.branch}</div>
                    <div className="text-lg font-bold">${branch.revenue?.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">
                      {branch.customers} customers | Avg: ${branch.avgOrder}
                    </div>
                    <div className="text-xs text-yellow-600">Rating: {branch.satisfaction}/5</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">👥 Customer Demographics</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analyticsReports?.customerDemographics || []}
                    dataKey="percentage"
                    nameKey="ageGroup"
                    outerRadius={70}
                    fill="#8884d8"
                    label={(entry: any) => `${entry.ageGroup}: ${entry.percentage}%`}
                  >
                    {(analyticsReports?.customerDemographics || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="font-medium mb-3">📢 Marketing Impact</h3>
              <div className="space-y-2">
                {(analyticsReports?.marketingImpact || []).map((campaign: any, idx: number) => (
                  <div key={idx} className="bg-green-50 p-2 rounded border">
                    <div className="font-medium text-sm">{campaign.campaign}</div>
                    <div className="text-sm">{campaign.orders} orders | ${campaign.revenue}</div>
                    <div className="text-xs text-green-600">ROI: {campaign.roi}x</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">💰 Profitability by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsReports?.profitabilityByCategory || []}>
                  <XAxis dataKey="category" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                  <Bar dataKey="profit" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 9. Recent Activity Feed & 10. Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-2" />
              Recent Activity Feed
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">🛍️ Recent Orders</h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {(recentActivity?.recentOrders || []).map((order: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{order.id}</span>
                        <span className="text-gray-600 ml-2">{order.customer}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${order.amount}</div>
                        <div className="text-xs text-gray-500">{order.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">👤 New Signups</h4>
                <div className="space-y-1">
                  {(recentActivity?.customerSignups || []).map((signup: any, idx: number) => (
                    <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                      <div className="font-medium">{signup.name}</div>
                      <div className="text-xs text-gray-600">{signup.source} • {signup.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">🚛 Supplier Deliveries</h4>
                <div className="space-y-1">
                  {(recentActivity?.supplierDeliveries || []).map((delivery: any, idx: number) => (
                    <div key={idx} className="text-sm bg-purple-50 p-2 rounded">
                      <div className="font-medium">{delivery.supplier}</div>
                      <div className="text-xs text-gray-600">{delivery.items} • {delivery.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Bell className="h-5 w-5 text-red-500 mr-2" />
              Alerts & Notifications
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                  Critical Alerts
                </h4>
                <div className="space-y-2">
                  {(alerts?.lowInventory || []).map((item: any, idx: number) => (
                    <div key={idx} className={`p-2 rounded border text-sm ${getPriorityColor(item.urgency)}`}>
                      <div className="font-medium">Low Stock: {item.item}</div>
                      <div className="text-xs">Current: {item.current} | Min: {item.minimum}</div>
                    </div>
                  ))}
                  
                  {(alerts?.reservationConflicts || []).map((conflict: any, idx: number) => (
                    <div key={idx} className="p-2 rounded border border-red-500 bg-red-50 text-sm">
                      <div className="font-medium text-red-700">Reservation Conflict</div>
                      <div className="text-xs text-red-600">{conflict.table} at {conflict.time}</div>
                      <div className="text-xs text-gray-600">{conflict.customers.join(' vs ')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">📞 Customer Complaints</h4>
                <div className="space-y-2">
                  {(alerts?.customerComplaints || []).map((complaint: any, idx: number) => (
                    <div key={idx} className="bg-orange-50 p-2 rounded border border-orange-200 text-sm">
                      <div className="font-medium">{complaint.customer}</div>
                      <div className="text-xs text-orange-700">{complaint.issue}</div>
                      <div className="text-xs text-gray-600">{complaint.time} • {complaint.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">⏰ Delayed Orders</h4>
                <div className="space-y-2">
                  {(alerts?.delayedOrders || []).map((delay: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 p-2 rounded border border-yellow-200 text-sm">
                      <div className="font-medium">{delay.orderId} - {delay.customer}</div>
                      <div className="text-xs text-yellow-700">Delayed by {delay.delay} minutes</div>
                      <div className="text-xs text-gray-600">{delay.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
