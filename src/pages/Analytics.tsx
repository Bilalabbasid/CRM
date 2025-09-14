import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart3, TrendingUp, Users, DollarSign, ShoppingBag, Clock,
  RefreshCw, Download, Star, Award,
  Activity, Target
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { formatCurrency, formatNumber } from '../constants/design-system';
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart as RechartsLine, Line, ComposedChart 
} from 'recharts';
import { chartColorSets } from '../utils/chartThemes';

interface AnalyticsData {
  revenue: {
    daily: Array<{ date: string; revenue: number; orders: number; avgOrderValue: number; profit: number }>;
    monthly: Array<{ month: string; revenue: number; orders: number; customers: number; profit: number }>;
    yearly: Array<{ year: string; revenue: number; growth: number }>;
  };
  customers: {
    acquisition: Array<{ date: string; new: number; returning: number; total: number }>;
    retention: { rate: number; segments: Array<{ segment: string; count: number; value: number }> };
    demographics: Array<{ ageGroup: string; count: number; percentage: number }>;
    loyalty: Array<{ tier: string; customers: number; avgSpend: number; lifetime: number }>;
  };
  menu: {
    topItems: Array<{ 
      name: string; 
      category: string; 
      orders: number; 
      revenue: number; 
      profit: number;
      rating: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    categoryPerformance: Array<{ category: string; orders: number; revenue: number; profit: number }>;
    seasonal: Array<{ month: string; category: string; performance: number }>;
  };
  operations: {
    orderTrends: Array<{ hour: number; orders: number; avgWaitTime: number; satisfaction: number }>;
    paymentMethods: Array<{ method: string; transactions: number; amount: number; percentage: number }>;
    peakHours: Array<{ hour: string; orders: number; revenue: number; staffing: number }>;
  };
  financial: {
    profitability: Array<{ category: string; revenue: number; costs: number; profit: number; margin: number }>;
    expenses: Array<{ category: string; amount: number; percentage: number; trend: number }>;
    forecasting: Array<{ period: string; predicted: number; actual?: number; confidence: number }>;
  };
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'customers' | 'menu' | 'operations' | 'financial'>('overview');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const { success, error, info } = useToast();

  // Interactive handlers
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      info('Refreshing analytics data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchAnalytics();
      success('Analytics data refreshed successfully!');
    } catch (err) {
      console.error('Failed to refresh analytics data', err);
      error('Failed to refresh analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: string, section?: string) => {
    try {
      info(`Preparing ${format.toUpperCase()} export...`);
      const exportData = section ? analyticsData?.[section as keyof AnalyticsData] : analyticsData;
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${section || 'complete'}_${format}.json`;
      link.click();
      URL.revokeObjectURL(url);
      success(`Analytics data exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Failed to export analytics data', err);
      error('Failed to export analytics data');
    }
  };

  const handleKPIClick = (kpiType: string, data?: Record<string, unknown>) => {
    let modalData: Record<string, unknown> = {};
    let title = '';

    switch (kpiType) {
      case 'revenue':
        title = 'Revenue Analysis';
        modalData = {
          totalRevenue: analyticsData?.revenue.daily.reduce((sum, day) => sum + day.revenue, 0),
          averageDailyRevenue: analyticsData?.revenue.daily.reduce((sum, day) => sum + day.revenue, 0)! / analyticsData?.revenue.daily.length!,
          highestDay: analyticsData?.revenue.daily.reduce((max, day) => day.revenue > max.revenue ? day : max),
          lowestDay: analyticsData?.revenue.daily.reduce((min, day) => day.revenue < min.revenue ? day : min),
          revenueBreakdown: analyticsData?.menu.categoryPerformance.map(cat => ({
            category: cat.category,
            revenue: cat.revenue,
            percentage: ((cat.revenue / analyticsData?.revenue.daily.reduce((sum, day) => sum + day.revenue, 0)!) * 100).toFixed(1) + '%'
          })),
          monthlyTrend: analyticsData?.revenue.monthly.slice(-6)
        };
        break;

      case 'orders':
        title = 'Order Analysis';
        modalData = {
          totalOrders: analyticsData?.revenue.daily.reduce((sum, day) => sum + day.orders, 0),
          averageDailyOrders: analyticsData?.revenue.daily.reduce((sum, day) => sum + day.orders, 0)! / analyticsData?.revenue.daily.length!,
          peakOrderDay: analyticsData?.revenue.daily.reduce((max, day) => day.orders > max.orders ? day : max),
          ordersByCategory: analyticsData?.menu.categoryPerformance,
          hourlyDistribution: analyticsData?.operations.orderTrends.slice(0, 24),
          paymentMethods: analyticsData?.operations.paymentMethods
        };
        break;

      case 'customers':
        title = 'Customer Analysis';
        modalData = {
          totalCustomers: analyticsData?.customers.retention.segments.reduce((sum, seg) => sum + seg.count, 0),
          customerSegments: analyticsData?.customers.retention.segments,
          retentionRate: analyticsData?.customers.retention.rate,
          newCustomers: analyticsData?.customers.acquisition.reduce((sum, day) => sum + day.new, 0),
          returningCustomers: analyticsData?.customers.acquisition.reduce((sum, day) => sum + day.returning, 0),
          loyaltyTiers: analyticsData?.customers.loyalty,
          demographics: analyticsData?.customers.demographics
        };
        break;

      case 'profit':
        title = 'Profitability Analysis';
        modalData = {
          totalProfit: analyticsData?.revenue.daily.reduce((sum, day) => sum + day.profit, 0),
          profitMargin: ((analyticsData?.revenue.daily.reduce((sum, day) => sum + day.profit, 0)! / analyticsData?.revenue.daily.reduce((sum, day) => sum + day.revenue, 0)!) * 100).toFixed(1) + '%',
          profitByCategory: analyticsData?.financial.profitability,
          expenseBreakdown: analyticsData?.financial.expenses,
          monthlyProfitTrend: analyticsData?.revenue.monthly.map(month => ({
            month: month.month,
            profit: month.profit,
            margin: ((month.profit / month.revenue) * 100).toFixed(1) + '%'
          }))
        };
        break;

      default:
        title = 'Analytics Details';
        modalData = data || { message: 'Detailed analytics information' };
    }

    setDetailTitle(title);
    setDetailData(modalData);
    setDetailModalOpen(true);
    info(`Opening ${title.toLowerCase()}...`);
  };



  // Generate comprehensive dummy analytics data
  const generateDummyAnalytics = (): AnalyticsData => {
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    
    // Revenue data
    const dailyRevenue = Array.from({ length: daysBack }, (_, i) => {
      const date = subDays(now, daysBack - i - 1);
      const baseRevenue = 2000 + Math.random() * 1500;
      const orders = Math.floor(25 + Math.random() * 35);
      const avgOrderValue = baseRevenue / orders;
      const profit = baseRevenue * (0.25 + Math.random() * 0.15);
      
      return {
        date: format(date, 'MMM dd'),
        revenue: Math.round(baseRevenue),
        orders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        profit: Math.round(profit)
      };
    });

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const baseRevenue = 45000 + Math.random() * 25000;
      const orders = Math.floor(800 + Math.random() * 400);
      const customers = Math.floor(300 + Math.random() * 200);
      
      return {
        month: format(new Date(2024, i), 'MMM'),
        revenue: Math.round(baseRevenue),
        orders,
        customers,
        profit: Math.round(baseRevenue * (0.22 + Math.random() * 0.18))
      };
    });

    // Customer data
    const customerAcquisition = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i);
      const newCustomers = Math.floor(5 + Math.random() * 15);
      const returningCustomers = Math.floor(15 + Math.random() * 25);
      
      return {
        date: format(date, 'MMM dd'),
        new: newCustomers,
        returning: returningCustomers,
        total: newCustomers + returningCustomers
      };
    });

    const customerSegments = [
      { segment: 'VIP', count: 45, value: 2500 },
      { segment: 'Regular', count: 234, value: 850 },
      { segment: 'Occasional', count: 432, value: 320 },
      { segment: 'New', count: 178, value: 150 }
    ];

    const loyaltyTiers = [
      { tier: 'Diamond', customers: 12, avgSpend: 125, lifetime: 5200 },
      { tier: 'Gold', customers: 67, avgSpend: 85, lifetime: 2800 },
      { tier: 'Silver', customers: 234, avgSpend: 45, lifetime: 980 },
      { tier: 'Bronze', customers: 456, avgSpend: 25, lifetime: 340 }
    ];

    // Menu performance
    const topItems = [
      { name: 'Grilled Salmon', category: 'Seafood', orders: 245, revenue: 7105, profit: 3835, rating: 4.8, trend: 'up' as const },
      { name: 'Chicken Biryani', category: 'Main Courses', orders: 412, revenue: 9468, profit: 5234, rating: 4.9, trend: 'up' as const },
      { name: 'Margherita Pizza', category: 'Pizza', orders: 328, revenue: 6231, profit: 4685, rating: 4.6, trend: 'stable' as const },
      { name: 'Beef Rendang', category: 'Main Courses', orders: 156, revenue: 4210, profit: 2456, rating: 4.7, trend: 'down' as const },
      { name: 'Chocolate Cake', category: 'Desserts', orders: 298, revenue: 3868, profit: 2934, rating: 4.9, trend: 'up' as const }
    ];

    const categoryPerformance = [
      { category: 'Main Courses', orders: 1245, revenue: 32450, profit: 15680 },
      { category: 'Pizza', orders: 892, revenue: 18940, profit: 13580 },
      { category: 'Appetizers', orders: 756, revenue: 12340, profit: 8920 },
      { category: 'Desserts', orders: 634, revenue: 9820, profit: 7240 },
      { category: 'Beverages', orders: 1834, revenue: 8234, profit: 6890 },
      { category: 'Salads', orders: 432, revenue: 7890, profit: 4960 }
    ];

    // Operations data
    const orderTrends = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: Math.floor(2 + Math.random() * 15 + (hour >= 11 && hour <= 14 ? 20 : 0) + (hour >= 18 && hour <= 21 ? 25 : 0)),
      avgWaitTime: Math.floor(8 + Math.random() * 12 + (hour >= 12 && hour <= 13 ? 8 : 0)),
      satisfaction: 3.5 + Math.random() * 1.3 + (hour >= 15 && hour <= 17 ? 0.3 : 0)
    }));

    const paymentMethods = [
      { method: 'Credit Card', transactions: 1245, amount: 43250, percentage: 65.2 },
      { method: 'Cash', transactions: 432, amount: 12840, percentage: 19.4 },
      { method: 'Digital Wallet', transactions: 234, amount: 8920, percentage: 13.5 },
      { method: 'Bank Transfer', transactions: 45, amount: 1890, percentage: 1.9 }
    ];

    return {
      revenue: {
        daily: dailyRevenue,
        monthly: monthlyRevenue,
        yearly: [
          { year: '2022', revenue: 445000, growth: 0 },
          { year: '2023', revenue: 578000, growth: 29.9 },
          { year: '2024', revenue: 720000, growth: 24.6 }
        ]
      },
      customers: {
        acquisition: customerAcquisition,
        retention: { rate: 68.5, segments: customerSegments },
        demographics: [
          { ageGroup: '18-25', count: 234, percentage: 22.1 },
          { ageGroup: '26-35', count: 456, percentage: 43.2 },
          { ageGroup: '36-45', count: 234, percentage: 22.1 },
          { ageGroup: '46-55', count: 89, percentage: 8.4 },
          { ageGroup: '55+', count: 43, percentage: 4.2 }
        ],
        loyalty: loyaltyTiers
      },
      menu: {
        topItems: topItems,
        categoryPerformance,
        seasonal: Array.from({ length: 12 }, (_, i) => ({
          month: format(new Date(2024, i), 'MMM'),
          category: categoryPerformance[i % categoryPerformance.length].category,
          performance: 70 + Math.random() * 60
        }))
      },
      operations: {
        orderTrends,
        paymentMethods,
        peakHours: [
          { hour: '12:00-13:00', orders: 45, revenue: 1890, staffing: 8 },
          { hour: '13:00-14:00', orders: 52, revenue: 2340, staffing: 9 },
          { hour: '19:00-20:00', orders: 67, revenue: 3240, staffing: 12 },
          { hour: '20:00-21:00', orders: 71, revenue: 3890, staffing: 12 }
        ]
      },
      financial: {
        profitability: categoryPerformance.map(cat => ({
          ...cat,
          costs: cat.revenue - cat.profit,
          margin: (cat.profit / cat.revenue) * 100
        })),
        expenses: [
          { category: 'Food Costs', amount: 28500, percentage: 42.3, trend: -2.4 },
          { category: 'Labor', amount: 18200, percentage: 27.1, trend: 1.8 },
          { category: 'Rent', amount: 8500, percentage: 12.6, trend: 0 },
          { category: 'Utilities', amount: 3400, percentage: 5.1, trend: 3.2 },
          { category: 'Marketing', amount: 2800, percentage: 4.2, trend: 12.5 },
          { category: 'Other', amount: 5900, percentage: 8.7, trend: -0.8 }
        ],
        forecasting: Array.from({ length: 6 }, (_, i) => ({
          period: format(new Date(2024, new Date().getMonth() + i + 1), 'MMM yyyy'),
          predicted: 58000 + Math.random() * 15000,
          actual: i < 2 ? 55000 + Math.random() * 18000 : undefined,
          confidence: 75 + Math.random() * 20
        }))
      }
    };
  };

  const fetchAnalytics = async () => {
    try {
      // Simulate API call with comprehensive dummy data
      const dummyData = generateDummyAnalytics();
      setAnalyticsData(dummyData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const currentPeriodRevenue = analyticsData.revenue.daily.reduce((sum, day) => sum + day.revenue, 0);
  const currentPeriodOrders = analyticsData.revenue.daily.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = currentPeriodRevenue / currentPeriodOrders;
  const totalCustomers = analyticsData.customers.retention.segments.reduce((sum, seg) => sum + seg.count, 0);
  const totalProfit = analyticsData.revenue.daily.reduce((sum, day) => sum + day.profit, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            Business Analytics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive business intelligence and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="form-input-modern px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button 
            variant="outline" 
            size="sm" 
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefreshData}
            loading={loading}
          >
            Refresh
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExportData('csv')}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'customers', label: 'Customers', icon: Users },
              { key: 'menu', label: 'Menu Performance', icon: Star },
              { key: 'operations', label: 'Operations', icon: Activity },
              { key: 'financial', label: 'Financial', icon: DollarSign }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedView === key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedView(key as typeof selectedView)}
                icon={<Icon className="w-4 h-4" />}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Section */}
      {selectedView === 'overview' && (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <KPICard
              title="Total Revenue"
              value={currentPeriodRevenue}
              format="currency"
              change={12.5}
              trend="up"
              icon={<DollarSign className="w-6 h-6" />}
              onClick={() => handleKPIClick('revenue')}
              subtitle={`${dateRange} period`}
            />

            <KPICard
              title="Total Orders"
              value={currentPeriodOrders}
              format="number"
              change={8.3}
              trend="up"
              icon={<ShoppingBag className="w-6 h-6" />}
              onClick={() => handleKPIClick('orders')}
              subtitle="completed"
            />

            <KPICard
              title="Avg Order Value"
              value={avgOrderValue}
              format="currency"
              change={4.7}
              trend="up"
              icon={<Target className="w-6 h-6" />}
              onClick={() => handleKPIClick('aov')}
              subtitle="per order"
            />

            <KPICard
              title="Active Customers"
              value={totalCustomers}
              format="number"
              change={15.2}
              trend="up"
              icon={<Users className="w-6 h-6" />}
              onClick={() => handleKPIClick('customers')}
              subtitle="total base"
            />

            <KPICard
              title="Profit Margin"
              value={(totalProfit / currentPeriodRevenue) * 100}
              format="percentage"
              change={-1.2}
              trend="down"
              icon={<TrendingUp className="w-6 h-6" />}
              onClick={() => handleKPIClick('profit')}
              subtitle="net margin"
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper
              title="Revenue Trend"
              subtitle={`Daily revenue over ${dateRange}`}
              exportable
              onExport={() => handleExportData('csv', 'revenue')}
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.revenue.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: unknown, name?: unknown) => [formatCurrency(Number(value as any)), String(name as any)]} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={chartColorSets.revenue[0]} 
                    fill={chartColorSets.revenue[0]} 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper
              title="Customer Acquisition"
              subtitle="New vs returning customers"
              exportable
              onExport={() => handleExportData('csv', 'customers')}
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.customers.acquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="new" 
                    stackId="1" 
                    stroke={chartColorSets.revenue[0]} 
                    fill={chartColorSets.revenue[0]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="returning" 
                    stackId="1" 
                    stroke={chartColorSets.revenue[1]} 
                    fill={chartColorSets.revenue[1]} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

          {/* Category Performance */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Performing Categories
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportData('csv', 'menu')}
                >
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.menu.categoryPerformance.slice(0, 6).map((category, index) => (
                  <div key={category.category} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{category.category}</h3>
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                        <span className="font-medium text-green-600">{formatCurrency(category.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orders:</span>
                        <span className="font-medium">{formatNumber(category.orders)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Profit:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(category.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Menu Performance Analytics */}
      {selectedView === 'menu' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Top Performing Item"
              value={analyticsData.menu.topItems[0]?.name || 'N/A'}
              format="text"
              change={analyticsData.menu.topItems[0]?.orders || 0}
              trend="up"
              icon={<Star className="w-6 h-6" />}
              onClick={() => handleKPIClick('top-item', {
                item: analyticsData.menu.topItems[0],
                performance: analyticsData.menu.topItems.slice(0, 5)
              })}
              subtitle={`${analyticsData.menu.topItems[0]?.orders} orders`}
            />

            <KPICard
              title="Best Category"
              value={analyticsData.menu.categoryPerformance[0]?.category || 'N/A'}
              format="text"
              change={(analyticsData.menu.categoryPerformance[0]?.revenue || 0)}
              trend="up"
              icon={<Award className="w-6 h-6" />}
              onClick={() => handleKPIClick('best-category', {
                category: analyticsData.menu.categoryPerformance[0],
                comparison: analyticsData.menu.categoryPerformance
              })}
              subtitle={formatCurrency(analyticsData.menu.categoryPerformance[0]?.revenue || 0)}
            />

            <KPICard
              title="Menu Items"
              value={analyticsData.menu.topItems.length}
              format="number"
              change={12.3}
              trend="up"
              icon={<ShoppingBag className="w-6 h-6" />}
              onClick={() => handleKPIClick('menu-items', {
                totalItems: analyticsData.menu.topItems.length,
                byCategory: analyticsData.menu.categoryPerformance
              })}
              subtitle="active items"
            />

            <KPICard
              title="Avg Item Rating"
              value={analyticsData.menu.topItems.reduce((sum, item) => sum + item.rating, 0) / analyticsData.menu.topItems.length}
              format="number"
              change={0.2}
              trend="up"
              icon={<Star className="w-6 h-6" />}
              onClick={() => handleKPIClick('ratings', {
                averageRating: analyticsData.menu.topItems.reduce((sum, item) => sum + item.rating, 0) / analyticsData.menu.topItems.length,
                ratingsBreakdown: analyticsData.menu.topItems.map(item => ({
                  name: item.name,
                  rating: item.rating,
                  orders: item.orders
                }))
              })}
              subtitle="customer rating"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper
              title="Top Menu Items"
              subtitle="Performance by orders and revenue"
              exportable
              onExport={() => handleExportData('csv', 'menu')}
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.menu.topItems.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="orders" fill={chartColorSets.revenue[0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper
              title="Category Performance"
              subtitle="Revenue distribution by category"
              exportable
              onExport={() => handleExportData('csv', 'categories')}
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={analyticsData.menu.categoryPerformance}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: unknown) => {
                      const p = props as any;
                      return `${p.name || p.category || ''}: ${formatCurrency(p.value ?? p.revenue ?? 0)}`;
                    }}
                  >
                    {analyticsData.menu.categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColorSets.categories[index % chartColorSets.categories.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

          {/* Top Items Detail Grid */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Performing Menu Items
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportData('csv', 'topItems')}
                >
                  Export Items
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.menu.topItems.slice(0, 9).map((item, index) => (
                  <div 
                    key={item.name} 
                    className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleKPIClick('menu-item-detail', {
                      item,
                      ranking: index + 1,
                      categoryRanking: analyticsData.menu.categoryPerformance.find(cat => cat.category === item.category),
                      trendAnalysis: {
                        trend: item.trend,
                        profitMargin: ((item.profit / item.revenue) * 100).toFixed(1) + '%',
                        orderFrequency: (item.orders / 30).toFixed(1) + ' orders/day'
                      }
                    })}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-xs">
                          #{index + 1}
                        </div>
                        {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {item.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="font-medium text-blue-600">{item.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orders:</span>
                        <span className="font-medium">{formatNumber(item.orders)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                        <span className="font-medium text-green-600">{formatCurrency(item.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                          <span className="font-medium">{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {selectedView === 'customers' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Customer Base"
              value={totalCustomers}
              format="number"
              change={15.2}
              trend="up"
              icon={<Users className="w-6 h-6" />}
              onClick={() => handleKPIClick('customer-base')}
              subtitle="active customers"
            />

            <KPICard
              title="Retention Rate"
              value={analyticsData.customers.retention.rate}
              format="percentage"
              change={3.8}
              trend="up"
              icon={<Target className="w-6 h-6" />}
              onClick={() => handleKPIClick('retention')}
              subtitle="customer retention"
            />

            <KPICard
              title="New Acquisitions"
              value={analyticsData.customers.acquisition.reduce((sum, day) => sum + day.new, 0)}
              format="number"
              change={22.4}
              trend="up"
              icon={<TrendingUp className="w-6 h-6" />}
              onClick={() => handleKPIClick('acquisitions')}
              subtitle="this period"
            />

            <KPICard
              title="Avg Customer Value"
              value={analyticsData.customers.retention.segments.reduce((sum, seg) => sum + seg.value, 0) / analyticsData.customers.retention.segments.length}
              format="currency"
              change={8.7}
              trend="up"
              icon={<DollarSign className="w-6 h-6" />}
              onClick={() => handleKPIClick('customer-value')}
              subtitle="lifetime value"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper
              title="Customer Segments"
              subtitle="Distribution by value and behavior"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={analyticsData.customers.retention.segments}
                    dataKey="count"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({segment, count}) => `${segment}: ${count}`}
                  >
                    {analyticsData.customers.retention.segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColorSets.categories[index % chartColorSets.categories.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper
              title="Age Demographics"
              subtitle="Customer distribution by age group"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.customers.demographics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="ageGroup" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill={chartColorSets.revenue[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
        </>
      )}

      {/* Operations Analytics */}
      {selectedView === 'operations' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper
              title="Hourly Order Distribution"
              subtitle="Order volume and wait times by hour"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData.operations.orderTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="orders" fill={chartColorSets.revenue[0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgWaitTime" stroke={chartColorSets.trends[0]} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper
              title="Payment Methods"
              subtitle="Transaction distribution by payment type"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={analyticsData.operations.paymentMethods}
                    dataKey="percentage"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({method, percentage}) => `${method}: ${percentage}%`}
                  >
                    {analyticsData.operations.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColorSets.status[index % chartColorSets.status.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

          {/* Peak Hours Analysis */}
          <Card className="card-elevated">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Peak Hours Performance
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.operations.peakHours.map((period) => (
                  <div key={period.hour} className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{period.hour}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Orders:</span>
                        <span className="font-medium">{period.orders}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                        <span className="font-medium text-green-600">{formatCurrency(period.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Staff:</span>
                        <span className="font-medium">{period.staffing} people</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Financial Analytics */}
      {selectedView === 'financial' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper
              title="Profitability by Category"
              subtitle="Revenue vs profit analysis"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.financial.profitability}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill={chartColorSets.revenue[0]} name="Revenue" />
                  <Bar dataKey="profit" fill={chartColorSets.revenue[1]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>

            <ChartWrapper
              title="Expense Breakdown"
              subtitle="Cost distribution analysis"
              exportable
              height={350}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={analyticsData.financial.expenses}
                    dataKey="percentage"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({category, percentage}) => `${category}: ${percentage}%`}
                  >
                    {analyticsData.financial.expenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColorSets.categories[index % chartColorSets.categories.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

          {/* Forecasting */}
          <ChartWrapper
            title="Revenue Forecasting"
            subtitle="Predicted vs actual revenue trends"
            exportable
            height={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={analyticsData.financial.forecasting}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={chartColorSets.primary[0]} 
                  strokeWidth={2}
                  name="Predicted"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={chartColorSets.accent[0]} 
                  strokeWidth={2}
                  name="Actual"
                />
              </RechartsLine>
            </ResponsiveContainer>
          </ChartWrapper>
        </>
      )}

      {/* Enhanced Detail Modal */}
      {detailModalOpen && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={detailTitle}
          size="xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {detailData && typeof detailData === 'object' && (
              <div className="space-y-4">
                {Object.entries(detailData).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    
                    {Array.isArray(value) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {value.slice(0, 12).map((item: Record<string, unknown>, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            {typeof item === 'object' && item !== null ? (
                              <div className="space-y-1">
                                {Object.entries(item).slice(0, 4).map(([itemKey, itemValue]) => (
                                  <div key={itemKey} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                                      {itemKey.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {typeof itemValue === 'number' 
                                        ? itemKey.includes('revenue') || itemKey.includes('amount') || itemKey.includes('value') 
                                          ? formatCurrency(itemValue)
                                          : itemKey.includes('percentage') || itemKey.includes('rate') || itemKey.includes('margin')
                                          ? `${itemValue}%`
                                          : formatNumber(itemValue)
                                        : String(itemValue)
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {String(item)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                          <div key={subKey} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize mb-2">
                              {subKey.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {typeof subValue === 'number'
                                ? subKey.includes('revenue') || subKey.includes('amount') || subKey.includes('value')
                                  ? formatCurrency(subValue)
                                  : subKey.includes('percentage') || subKey.includes('rate') || subKey.includes('margin')
                                  ? `${subValue}%`
                                  : formatNumber(subValue)
                                : String(subValue)
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          {typeof value === 'number'
                            ? key.includes('revenue') || key.includes('amount') || key.includes('value')
                              ? formatCurrency(value)
                              : key.includes('percentage') || key.includes('rate') || key.includes('margin')
                              ? `${value}%`
                              : formatNumber(value)
                            : String(value)
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  handleExportData('json', detailTitle.toLowerCase().replace(/\s+/g, '_'));
                }}
              >
                Export Data
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnalyticsPage;