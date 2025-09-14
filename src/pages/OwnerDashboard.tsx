import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target,
  Building, AlertTriangle, Crown, Briefcase, Activity,
  Download, Filter, RefreshCw, ArrowRight, Eye,
  BarChart3, Bell, Calendar
} from 'lucide-react';
import { chartColorSets } from '../utils/chartThemes';

const OwnerDashboard: React.FC = () => {
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

  // Dummy data for demo
  const executiveSummary = {
    yesterday: { revenue: 12500, growth: 5.2 },
    thisWeek: { revenue: 87500, growth: 8.7 },
    thisMonth: { revenue: 350000, growth: 12.3 },
    pendingApprovals: [
      { item: 'New Equipment', amount: 85000, department: 'Kitchen' },
      { item: 'Marketing Budget', amount: 65000, department: 'Marketing' }
    ]
  };

  const businessData = {
    revenue: { year: 4200000, month: 350000 },
    profit: { margin: 30 },
    dailyRevenueTrend: [
      { date: 'Jan', revenue: 320000, profit: 96000, target: 350000 },
      { date: 'Feb', revenue: 285000, profit: 85500, target: 350000 },
      { date: 'Mar', revenue: 410000, profit: 123000, target: 350000 },
      { date: 'Apr', revenue: 380000, profit: 114000, target: 350000 },
      { date: 'May', revenue: 420000, profit: 126000, target: 350000 },
      { date: 'Jun', revenue: 350000, profit: 105000, target: 350000 }
    ]
  };

  const branchPerformance = {
    branches: [
      { name: 'Downtown KHI', revenue: 1800000, profit: 540000, efficiency: 92 },
      { name: 'DHA LHE', revenue: 1650000, profit: 495000, efficiency: 95 },
      { name: 'F-7 ISB', revenue: 1200000, profit: 360000, efficiency: 88 },
      { name: 'Gulshan KHI', revenue: 950000, profit: 285000, efficiency: 90 }
    ]
  };

  const customerAnalytics = {
    totalCustomers: 45230,
    newCustomers: 1250,
    loyaltyMembers: 15600,
    avgOrderValue: 42.50,
    demographics: [
      { segment: '25-34', percentage: 35, count: 15830 },
      { segment: '35-44', percentage: 28, count: 12664 },
      { segment: '18-24', percentage: 22, count: 9951 },
      { segment: '45+', percentage: 15, count: 6785 }
    ],
    satisfactionScore: 4.6,
    repeatCustomerRate: 72
  };

  const menuInsights = {
    topItems: [
      { name: 'Grilled Salmon', revenue: 28500, orders: 450, margin: 65 },
      { name: 'Chicken Karahi', revenue: 24200, orders: 520, margin: 58 },
      { name: 'Beef Biryani', revenue: 22100, orders: 380, margin: 62 }
    ],
    categoryPerformance: [
      { category: 'Main Courses', percentage: 45, revenue: 1890000 },
      { category: 'Appetizers', percentage: 20, revenue: 840000 },
      { category: 'Desserts', percentage: 15, revenue: 630000 },
      { category: 'Beverages', percentage: 20, revenue: 840000 }
    ]
  };

  if (!profile || !(profile.role === 'admin' || profile.role === 'owner')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Owner/Admin role required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            Executive Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Strategic overview and business intelligence</p>
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
            onClick={() => handleExportData('executive-summary')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Executive Summary
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleViewDetails('executive-summary')}
          >
            View Details
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Yesterday Revenue"
            value={executiveSummary.yesterday.revenue}
            format="currency"
            change={executiveSummary.yesterday.growth}
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleViewDetails('revenue', 'yesterday')}
            subtitle="vs previous day"
          />
          
          <KPICard
            title="Weekly Revenue"
            value={executiveSummary.thisWeek.revenue}
            format="currency"
            change={executiveSummary.thisWeek.growth}
            trend="up"
            icon={<BarChart3 className="w-6 h-6" />}
            onClick={() => handleViewDetails('revenue', 'weekly')}
            subtitle="vs last week"
          />
          
          <KPICard
            title="Monthly Revenue"
            value={executiveSummary.thisMonth.revenue}
            format="currency"
            change={executiveSummary.thisMonth.growth}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => handleViewDetails('revenue', 'monthly')}
            subtitle="vs last month"
          />
          
          <KPICard
            title="Pending Approvals"
            value={executiveSummary.pendingApprovals.length}
            format="number"
            trend="neutral"
            icon={<Bell className="w-6 h-6" />}
            onClick={() => handleViewDetails('approvals')}
            subtitle="requiring attention"
          />
        </div>
      </div>

      {/* Business Performance Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-500" />
            Business Performance
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => handleViewDetails('business-performance')}
          >
            View All Metrics
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Annual Revenue" 
            value={businessData.revenue.year}
            format="currency"
            change={10.5}
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleViewDetails('revenue-analysis')}
            subtitle="vs last year"
          />
          
          <KPICard 
            title="Profit Margin" 
            value={businessData.profit.margin}
            format="percentage"
            change={2.1}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => handleViewDetails('profit-analysis')}
            subtitle="overall margin"
          />
          
          <KPICard 
            title="Active Branches" 
            value={branchPerformance.branches.length}
            format="number"
            trend="neutral"
            icon={<Building className="w-6 h-6" />}
            onClick={() => handleViewDetails('branch-overview')}
            subtitle="locations"
          />
          
          <KPICard 
            title="Monthly Target" 
            value={87.5}
            format="percentage"
            change={5.2}
            trend="up"
            icon={<Target className="w-6 h-6" />}
            onClick={() => handleViewDetails('monthly-targets')}
            subtitle="of target achieved"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper 
            title="Revenue & Profit Trend" 
            subtitle="Monthly performance over time"
            refreshable
            exportable
            expandable
            onRefresh={() => handleRefreshData()}
            onExport={() => handleExportData('revenue-trend')}
            height={350}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={businessData.dailyRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill={chartColorSets.revenue[0]} radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={chartColorSets.revenue[1]} 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
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
          
          <ChartWrapper 
            title="Branch Performance"
            subtitle="Revenue and efficiency by location"
            refreshable
            exportable
            onRefresh={() => handleRefreshData()}
            onExport={() => handleExportData('branch-performance')}
            height={350}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPerformance.branches}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill={chartColorSets.performance[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill={chartColorSets.performance[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      {/* Customer Analytics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-500" />
            Customer Analytics
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => handleViewDetails('customer-analytics')}
          >
            View Details
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Total Customers" 
            value={customerAnalytics.totalCustomers}
            format="number"
            change={8.2}
            trend="up"
            icon={<Users className="w-6 h-6" />}
            onClick={() => handleViewDetails('customer-base')}
            subtitle="registered users"
          />
          
          <KPICard 
            title="New Customers" 
            value={customerAnalytics.newCustomers}
            format="number"
            change={12.5}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => handleViewDetails('new-customers')}
            subtitle="this month"
          />
          
          <KPICard 
            title="Avg Order Value" 
            value={customerAnalytics.avgOrderValue}
            format="currency"
            change={3.8}
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
            onClick={() => handleViewDetails('order-value')}
            subtitle="per transaction"
          />
          
          <KPICard 
            title="Satisfaction Score" 
            value={customerAnalytics.satisfactionScore}
            format="number"
            change={0.2}
            trend="up"
            icon={<Activity className="w-6 h-6" />}
            onClick={() => handleViewDetails('satisfaction')}
            subtitle="out of 5.0"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper 
            title="Customer Demographics"
            subtitle="Age distribution of customer base"
            exportable
            onExport={() => handleExportData('demographics')}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerAnalytics.demographics}
                  dataKey="percentage"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => `${entry.segment}: ${entry.percentage}%`}
                >
                  {customerAnalytics.demographics.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartColorSets.categories[index % chartColorSets.categories.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
          
          <ChartWrapper 
            title="Menu Category Performance"
            subtitle="Revenue by food category"
            exportable
            onExport={() => handleExportData('menu-performance')}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuInsights.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill={chartColorSets.categories[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      {/* Top Menu Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Top Performing Menu Items
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewDetails('menu-items')}
            >
              View All Items
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {menuInsights.topItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleViewDetails('menu-item', item.name)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.orders} orders • {item.margin}% margin</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${item.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;