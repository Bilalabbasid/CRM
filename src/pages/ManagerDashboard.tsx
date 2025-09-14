import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Line, CartesianGrid, ComposedChart
} from 'recharts';
import { 
  TrendingUp, DollarSign, Users, ShoppingCart,
  AlertTriangle, Package, Activity,
  Bell, BarChart3, Award, Download, Filter, RefreshCw, 
  ArrowRight, Eye, Settings, Star
} from 'lucide-react';
import { chartColorSets } from '../utils/chartThemes';

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Interactive handlers
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Refreshing dashboard data...');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (section: string) => {
    console.log(`Exporting ${section} data...`);
    alert(`Exporting ${section} data to CSV...`);
  };

  const handleViewDetails = (section: string, id?: string) => {
    console.log(`Navigating to ${section} details`, id);
    alert(`Opening detailed view for ${section}`);
  };

  const handleFilterData = (section: string) => {
    console.log(`Opening filter dialog for ${section}`);
    alert(`Opening filters for ${section}`);
  };

  // Enhanced dummy data for Manager Dashboard
  const salesRevenue = {
    dailySales: 4750,
    weeklySales: 28500,
    monthlySales: 142000,
    targetDaily: 5000,
    targetWeekly: 30000,
    targetMonthly: 150000,
    avgOrderValue: 42.50,
    dailyTrend: [
      { day: 'Mon', sales: 4200, target: 5000, orders: 98 },
      { day: 'Tue', sales: 4600, target: 5000, orders: 108 },
      { day: 'Wed', sales: 4800, target: 5000, orders: 112 },
      { day: 'Thu', sales: 5200, target: 5000, orders: 122 },
      { day: 'Fri', sales: 6400, target: 5000, orders: 150 },
      { day: 'Sat', sales: 7200, target: 5000, orders: 168 },
      { day: 'Sun', sales: 6800, target: 5000, orders: 159 }
    ]
  };

  const topPerformers = {
    menuItems: [
      { name: 'Grilled Salmon', sales: 28500, orders: 450, profit: 18525, margin: 65 },
      { name: 'Chicken Karahi', sales: 24200, orders: 520, profit: 14036, margin: 58 },
      { name: 'Beef Biryani', sales: 22100, orders: 380, profit: 13702, margin: 62 },
      { name: 'Mutton Tikka', sales: 19800, orders: 285, profit: 11880, margin: 60 }
    ],
    staff: [
      { name: 'Ahmed Hassan', role: 'Head Chef', sales: 85000, rating: 4.9 },
      { name: 'Sarah Khan', role: 'Server', sales: 72000, rating: 4.8 },
      { name: 'Ali Raza', role: 'Manager', sales: 68000, rating: 4.7 }
    ]
  };

  const inventoryStock = {
    lowStock: [
      { item: 'Chicken Breast', current: 15, minimum: 50, status: 'critical' },
      { item: 'Fresh Vegetables', current: 25, minimum: 40, status: 'low' },
      { item: 'Rice Basmati', current: 80, minimum: 100, status: 'low' }
    ],
    categories: [
      { category: 'Meat & Poultry', value: 45, status: 'good' },
      { category: 'Vegetables', value: 30, status: 'low' },
      { category: 'Grains & Rice', value: 75, status: 'good' },
      { category: 'Dairy', value: 60, status: 'good' }
    ]
  };

  const customerInsights = {
    totalOrders: 2340,
    newCustomers: 125,
    repeatCustomers: 890,
    avgRating: 4.6,
    feedback: [
      { aspect: 'Food Quality', rating: 4.8, count: 234 },
      { aspect: 'Service Speed', rating: 4.5, count: 228 },
      { aspect: 'Cleanliness', rating: 4.7, count: 195 },
      { aspect: 'Value for Money', rating: 4.4, count: 189 }
    ],
    demographics: [
      { age: '18-25', percentage: 22 },
      { age: '26-35', percentage: 35 },
      { age: '36-45', percentage: 28 },
      { age: '46+', percentage: 15 }
    ]
  };

  const recentActivity = [
    { time: '5 mins ago', action: 'New order #1234', amount: 125, type: 'order' },
    { time: '12 mins ago', action: 'Payment received', amount: 89, type: 'payment' },
    { time: '18 mins ago', action: 'Table 12 seated', amount: null, type: 'seating' },
    { time: '25 mins ago', action: 'Order #1230 completed', amount: 156, type: 'completion' },
    { time: '32 mins ago', action: 'Inventory alert: Low stock', amount: null, type: 'alert' }
  ];

  const alerts = [
    { type: 'critical', message: 'Kitchen equipment maintenance due', priority: 'high', time: '2 hours ago' },
    { type: 'warning', message: 'Peak hour approaching - check staffing', priority: 'medium', time: '30 mins ago' },
    { type: 'info', message: 'Daily sales target 95% achieved', priority: 'low', time: '1 hour ago' }
  ];

  if (!profile || !(profile.role === 'admin' || profile.role === 'manager' || profile.role === 'owner')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Manager role or higher required</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            Manager Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Operational overview and real-time insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Filter className="w-4 h-4" />}
            onClick={() => handleFilterData('dashboard')}
          >
            Filters
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefreshData}
            loading={loading}
          >
            Refresh
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExportData('manager-report')}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Sales & Revenue Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Sales & Revenue Overview
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleViewDetails('sales-overview')}
          >
            View Details
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Today's Sales"
            value={salesRevenue.dailySales}
            format="currency"
            change={((salesRevenue.dailySales - 4200) / 4200 * 100)}
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleViewDetails('daily-sales')}
            subtitle={`Target: $${salesRevenue.targetDaily.toLocaleString()}`}
          />
          
          <KPICard
            title="Weekly Sales"
            value={salesRevenue.weeklySales}
            format="currency"
            change={8.5}
            trend="up"
            icon={<BarChart3 className="w-6 h-6" />}
            onClick={() => handleViewDetails('weekly-sales')}
            subtitle={`Target: $${salesRevenue.targetWeekly.toLocaleString()}`}
          />
          
          <KPICard
            title="Average Order"
            value={salesRevenue.avgOrderValue}
            format="currency"
            change={3.2}
            trend="up"
            icon={<ShoppingCart className="w-6 h-6" />}
            onClick={() => handleViewDetails('order-value')}
            subtitle="per transaction"
          />
          
          <KPICard
            title="Total Orders"
            value={customerInsights.totalOrders}
            format="number"
            change={12.8}
            trend="up"
            icon={<Users className="w-6 h-6" />}
            onClick={() => handleViewDetails('orders')}
            subtitle="this month"
          />
        </div>
        
        <ChartWrapper 
          title="Daily Sales Trend" 
          subtitle="Sales performance over the past week"
          refreshable
          exportable
          expandable
          onRefresh={() => handleRefreshData()}
          onExport={() => handleExportData('sales-trend')}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={salesRevenue.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`$${value?.toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="sales" fill={chartColorSets.revenue[0]} radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={chartColorSets.revenue[2]} 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Top Performers & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Menu Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Performing Items
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => handleViewDetails('top-items')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.menuItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails('menu-item', item.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.orders} orders • {item.margin}% margin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${item.sales.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">${item.profit.toLocaleString()} profit</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Inventory Status
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Settings className="w-4 h-4" />}
                onClick={() => handleViewDetails('inventory')}
              >
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Low Stock Alerts</div>
                <div className="space-y-2">
                  {inventoryStock.lowStock.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(item.status)}`}
                    >
                      <div>
                        <div className="font-medium">{item.item}</div>
                        <div className="text-sm">Current: {item.current} • Min: {item.minimum}</div>
                      </div>
                      <div className="text-sm font-bold uppercase">
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category Status</div>
                <div className="grid grid-cols-2 gap-2">
                  {inventoryStock.categories.map((cat, index) => (
                    <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">{cat.category}</div>
                      <div className={`text-lg font-bold ${cat.status === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {cat.value}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-500" />
            Customer Insights
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => handleViewDetails('customer-insights')}
          >
            View Analytics
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="New Customers"
            value={customerInsights.newCustomers}
            format="number"
            change={15.3}
            trend="up"
            icon={<Users className="w-6 h-6" />}
            onClick={() => handleViewDetails('new-customers')}
            subtitle="this month"
          />
          
          <KPICard
            title="Repeat Customers"
            value={customerInsights.repeatCustomers}
            format="number"
            change={8.7}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => handleViewDetails('repeat-customers')}
            subtitle="returning"
          />
          
          <KPICard
            title="Average Rating"
            value={customerInsights.avgRating}
            format="number"
            change={0.2}
            trend="up"
            icon={<Star className="w-6 h-6" />}
            onClick={() => handleViewDetails('ratings')}
            subtitle="out of 5.0"
          />
          
          <KPICard
            title="Customer Satisfaction"
            value={92}
            format="percentage"
            change={5.1}
            trend="up"
            icon={<Activity className="w-6 h-6" />}
            onClick={() => handleViewDetails('satisfaction')}
            subtitle="satisfied customers"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper 
            title="Customer Feedback"
            subtitle="Ratings by service aspect"
            exportable
            onExport={() => handleExportData('feedback')}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerInsights.feedback}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="aspect" fontSize={12} />
                <YAxis domain={[0, 5]} fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [`${value}/5`, 'Rating']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="rating" fill={chartColorSets.performance[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
          
          <ChartWrapper 
            title="Customer Demographics"
            subtitle="Age distribution of customers"
            exportable
            onExport={() => handleExportData('demographics')}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerInsights.demographics}
                  dataKey="percentage"
                  nameKey="age"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {customerInsights.demographics.map((entry: { age: string; percentage: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartColorSets.categories[index % chartColorSets.categories.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Activity
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewDetails('activity-log')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-l-4 border-blue-200 bg-blue-50/50 rounded-r-lg">
                  <div>
                    <div className="font-medium text-gray-900">{activity.action}</div>
                    <div className="text-sm text-gray-600">{activity.time}</div>
                  </div>
                  {activity.amount && (
                    <div className="text-lg font-bold text-green-600">
                      ${activity.amount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                Alerts & Notifications
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewDetails('notifications')}
              >
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm mt-1 opacity-80">{alert.time}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-700' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.priority}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;