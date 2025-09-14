import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target,
  Building, AlertTriangle, Crown, Briefcase, Activity
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

const OwnerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [businessData, setBusinessData] = useState<any>(null);
  const [branchPerformance, setBranchPerformance] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [menuInsights, setMenuInsights] = useState<any>(null);
  const [marketingData, setMarketingData] = useState<any>(null);
  const [hrData, setHrData] = useState<any>(null);
  const [riskAlerts, setRiskAlerts] = useState<any>(null);
  const [forecasting, setForecasting] = useState<any>(null);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);

  // Rich dummy data for Owner dashboard
  const dummyBusinessData = {
    revenue: {
      today: 12500,
      week: 87500,
      month: 350000,
      year: 4200000,
      lastYear: 3800000
    },
    profit: {
      today: 3750,
      week: 26250,
      month: 105000,
      year: 1260000,
      margin: 30
    },
    expenses: {
      today: 8750,
      week: 61250,
      month: 245000,
      year: 2940000
    },
    targets: {
      monthlyRevenue: 400000,
      monthlyProfit: 120000,
      yearlyGrowth: 15
    },
    dailyRevenueTrend: [
      { date: 'Jan', revenue: 320000, profit: 96000, target: 350000 },
      { date: 'Feb', revenue: 285000, profit: 85500, target: 350000 },
      { date: 'Mar', revenue: 410000, profit: 123000, target: 350000 },
      { date: 'Apr', revenue: 380000, profit: 114000, target: 350000 },
      { date: 'May', revenue: 420000, profit: 126000, target: 350000 },
      { date: 'Jun', revenue: 350000, profit: 105000, target: 350000 },
      { date: 'Jul', revenue: 390000, profit: 117000, target: 350000 },
      { date: 'Aug', revenue: 440000, profit: 132000, target: 350000 },
      { date: 'Sep', revenue: 350000, profit: 105000, target: 350000 },
      { date: 'Oct', revenue: 0, profit: 0, target: 350000 },
      { date: 'Nov', revenue: 0, profit: 0, target: 350000 },
      { date: 'Dec', revenue: 0, profit: 0, target: 350000 }
    ]
  };

  const dummyBranchPerformance = {
    branches: [
      { 
        id: 'branch_1', name: 'Downtown Karachi', revenue: 1800000, profit: 540000, 
        orders: 2340, avgOrderTime: 18, complaints: 5, wastageRate: 3.2, efficiency: 92,
        manager: 'Ahmed Hassan', managerRating: 4.8
      },
      { 
        id: 'branch_2', name: 'DHA Lahore', revenue: 1650000, profit: 495000, 
        orders: 2190, avgOrderTime: 15, complaints: 3, wastageRate: 2.8, efficiency: 95,
        manager: 'Sarah Khan', managerRating: 4.9
      },
      { 
        id: 'branch_3', name: 'F-7 Islamabad', revenue: 1200000, profit: 360000, 
        orders: 1680, avgOrderTime: 22, complaints: 8, wastageRate: 4.1, efficiency: 88,
        manager: 'Ali Raza', managerRating: 4.5
      },
      { 
        id: 'branch_4', name: 'Gulshan Karachi', revenue: 950000, profit: 285000, 
        orders: 1420, avgOrderTime: 20, complaints: 6, wastageRate: 3.7, efficiency: 90,
        manager: 'Fatima Sheikh', managerRating: 4.6
      }
    ],
    comparisonMetrics: [
      { branch: 'Downtown KHI', revenue: 1800000, profit: 540000, efficiency: 92 },
      { branch: 'DHA LHE', revenue: 1650000, profit: 495000, efficiency: 95 },
      { branch: 'F-7 ISB', revenue: 1200000, profit: 360000, efficiency: 88 },
      { branch: 'Gulshan KHI', revenue: 950000, profit: 285000, efficiency: 90 }
    ]
  };

  const dummyFinancialData = {
    cashFlow: {
      inflow: 4200000,
      outflow: 2940000,
      netFlow: 1260000
    },
    expenseBreakdown: [
      { category: 'Salaries', amount: 1200000, percentage: 40.8 },
      { category: 'Rent', amount: 600000, percentage: 20.4 },
      { category: 'Inventory', amount: 540000, percentage: 18.4 },
      { category: 'Utilities', amount: 300000, percentage: 10.2 },
      { category: 'Marketing', amount: 180000, percentage: 6.1 },
      { category: 'Other', amount: 120000, percentage: 4.1 }
    ],
    vendorPayments: [
      { vendor: 'Fresh Foods Supplier', amount: 45000, dueDate: '2025-09-20', status: 'pending' },
      { vendor: 'Metro Wholesale', amount: 32000, dueDate: '2025-09-18', status: 'overdue' },
      { vendor: 'Green Valley Farms', amount: 28000, dueDate: '2025-09-25', status: 'pending' },
      { vendor: 'City Gas Company', amount: 15000, dueDate: '2025-09-15', status: 'paid' }
    ],
    grossMargin: [
      { category: 'Mains', revenue: 2100000, cost: 840000, margin: 60 },
      { category: 'Drinks', revenue: 1260000, cost: 378000, margin: 70 },
      { category: 'Desserts', revenue: 630000, cost: 252000, margin: 60 },
      { category: 'Appetizers', revenue: 420000, cost: 147000, margin: 65 }
    ]
  };

  const dummyCustomerAnalytics = {
    acquisition: {
      newCustomers: 285,
      returningCustomers: 1240,
      retentionRate: 67.5,
      acquisitionRate: 18.7
    },
    loyaltyProgram: {
      totalMembers: 3420,
      activeMembers: 2180,
      pointsRedeemed: 45600,
      topMembers: [
        { name: 'Hassan Ali', points: 8500, visits: 45, clv: 12500 },
        { name: 'Ayesha Khan', points: 7200, visits: 38, clv: 11200 },
        { name: 'Omar Sheikh', points: 6800, visits: 42, clv: 10800 }
      ]
    },
    feedback: {
      totalReviews: 1245,
      averageRating: 4.6,
      positiveReviews: 89.2,
      negativeReviews: 10.8,
      sentimentTrend: [
        { month: 'Jan', positive: 87, negative: 13, neutral: 5 },
        { month: 'Feb', positive: 89, negative: 11, neutral: 6 },
        { month: 'Mar', positive: 91, negative: 9, neutral: 4 },
        { month: 'Apr', positive: 88, negative: 12, neutral: 5 },
        { month: 'May', positive: 92, negative: 8, neutral: 3 },
        { month: 'Jun', positive: 89, negative: 11, neutral: 4 }
      ]
    },
    demographics: {
      ageGroups: [
        { range: '18-25', percentage: 28, count: 956 },
        { range: '26-35', percentage: 35, count: 1197 },
        { range: '36-45', percentage: 22, count: 752 },
        { range: '46-60', percentage: 12, count: 410 },
        { range: '60+', percentage: 3, count: 105 }
      ],
      customerLifetimeValue: {
        average: 850,
        vipCustomers: 245,
        vipThreshold: 2500
      }
    }
  };

  const dummyMenuInsights = {
    profitableItems: [
      { name: 'Grilled Salmon', profit: 28500, margin: 68, orders: 340 },
      { name: 'Beef Tenderloin', profit: 26800, margin: 65, orders: 285 },
      { name: 'Truffle Pasta', profit: 22400, margin: 62, orders: 380 },
      { name: 'Craft Cocktails', profit: 18900, margin: 75, orders: 450 },
      { name: 'Chocolate Soufflé', profit: 15600, margin: 70, orders: 220 }
    ],
    lossItems: [
      { name: 'Seafood Platter', profit: -2400, margin: -15, orders: 45 },
      { name: 'Exotic Fruit Bowl', profit: -1800, margin: -12, orders: 38 },
      { name: 'Wagyu Steak', profit: -1200, margin: -8, orders: 25 }
    ],
    categoryShare: [
      { category: 'Mains', revenue: 2100000, percentage: 50, profit: 1260000 },
      { category: 'Drinks', revenue: 1260000, percentage: 30, profit: 882000 },
      { category: 'Desserts', revenue: 630000, percentage: 15, profit: 378000 },
      { category: 'Appetizers', revenue: 210000, percentage: 5, profit: 136500 }
    ],
    seasonalImpact: [
      { item: 'Ice Cream Specials', season: 'Summer', impact: '+45%' },
      { item: 'Hot Chocolate', season: 'Winter', impact: '+60%' },
      { item: 'BBQ Items', season: 'Summer', impact: '+35%' }
    ]
  };

  const dummyMarketingData = {
    campaigns: [
      { name: 'Summer Special', roi: 320, spent: 45000, revenue: 189000, impressions: 285000 },
      { name: 'Loyalty Weekend', roi: 280, spent: 32000, revenue: 122400, impressions: 195000 },
      { name: 'New Menu Launch', roi: 150, spent: 68000, revenue: 170000, impressions: 420000 }
    ],
    customerSource: [
      { source: 'Walk-in', percentage: 45, orders: 1890 },
      { source: 'Online Orders', percentage: 35, orders: 1470 },
      { source: 'Delivery Apps', percentage: 15, orders: 630 },
      { source: 'Reservations', percentage: 5, orders: 210 }
    ],
    repeatCustomerRate: {
      afterPromotion: 78.5,
      baseline: 67.5,
      improvement: 11
    },
    reservationTrends: [
      { month: 'Jan', reservations: 420, growth: 5 },
      { month: 'Feb', reservations: 465, growth: 10.7 },
      { month: 'Mar', reservations: 520, growth: 11.8 },
      { month: 'Apr', reservations: 485, growth: -6.7 },
      { month: 'May', reservations: 580, growth: 19.6 },
      { month: 'Jun', reservations: 640, growth: 10.3 }
    ]
  };

  const dummyHrData = {
    staffingCosts: {
      total: 1200000,
      revenueContribution: 4200000,
      efficiency: 28.6
    },
    topPerformers: [
      { name: 'Sarah Khan', role: 'Manager', branch: 'DHA Lahore', rating: 4.9, revenue: 185000 },
      { name: 'Ahmed Hassan', role: 'Manager', branch: 'Downtown Karachi', rating: 4.8, revenue: 195000 },
      { name: 'Ali Raza', role: 'Chef', branch: 'F-7 Islamabad', rating: 4.7, revenue: 125000 },
      { name: 'Fatima Sheikh', role: 'Server', branch: 'Gulshan Karachi', rating: 4.8, revenue: 89000 }
    ],
    attrition: {
      rate: 12.5,
      industry: 18.2,
      cost: 145000,
      newHires: 25
    },
    satisfaction: {
      overall: 4.3,
      workEnvironment: 4.5,
      compensation: 4.1,
      management: 4.4
    }
  };

  const dummyRiskAlerts = {
    compliance: [
      { type: 'Tax Filing', priority: 'high', dueDate: '2025-09-20', status: 'pending' },
      { type: 'Health Inspection', priority: 'medium', dueDate: '2025-10-15', status: 'scheduled' },
      { type: 'License Renewal', priority: 'low', dueDate: '2025-11-30', status: 'pending' }
    ],
    financial: [
      { alert: 'Unusual expense spike in Utilities', amount: 45000, increase: '25%' },
      { alert: 'Late vendor payments', count: 3, amount: 95000 }
    ],
    operational: [
      { alert: 'Customer complaints increased', branch: 'F-7 Islamabad', increase: '15%' },
      { alert: 'Inventory wastage above threshold', branch: 'Gulshan Karachi', percentage: 4.1 }
    ]
  };

  const dummyForecasting = {
    salesForecast: [
      { period: 'Oct 2025', forecast: 380000, confidence: 85 },
      { period: 'Nov 2025', forecast: 420000, confidence: 82 },
      { period: 'Dec 2025', forecast: 485000, confidence: 78 },
      { period: 'Q1 2026', forecast: 1350000, confidence: 75 }
    ],
    inventoryForecast: [
      { item: 'Chicken Breast', daysLeft: 3, reorderSuggested: true },
      { item: 'Fresh Vegetables', daysLeft: 5, reorderSuggested: true },
      { item: 'Wine Bottles', daysLeft: 12, reorderSuggested: false }
    ],
    aiOptimizations: [
      'Remove "Seafood Platter" - consistent losses for 3 months',
      'Increase "Craft Cocktail" promotion - 75% margin opportunity',
      'Add evening staff to Downtown branch - 20% demand increase after 7 PM',
      'Launch breakfast menu in DHA Lahore - market gap identified'
    ]
  };

  const dummyExecutiveSummary = {
    yesterday: { revenue: 12500, growth: 5.2 },
    thisWeek: { revenue: 87500, growth: 8.7 },
    thisMonth: { revenue: 350000, growth: 12.3 },
    topBranch: { name: 'Downtown Karachi', revenue: 1800000 },
    topMenuItem: { name: 'Grilled Salmon', profit: 28500 },
    keyAlert: 'F-7 Islamabad complaints up 15% this week',
    pendingApprovals: [
      { item: 'New Equipment Purchase', amount: 85000, department: 'Kitchen' },
      { item: 'Marketing Campaign Budget', amount: 65000, department: 'Marketing' },
      { item: 'Branch Manager Hire', amount: 75000, department: 'HR' }
    ]
  };

  useEffect(() => {
    const load = async () => {
      if (!profile || !(profile.role === 'admin' || profile.role === 'owner')) return;
      
      try {
        // Try to load real data from APIs with fallbacks to dummy data
        const svc: any = api;
        const [business, branches, financial, customer, menu, marketing, hr, risk, forecast, summary] = await Promise.allSettled([
          svc.getBusinessOverview ? svc.getBusinessOverview() : Promise.resolve(null),
          svc.getBranchPerformance ? svc.getBranchPerformance() : Promise.resolve(null),
          svc.getFinancialAnalytics ? svc.getFinancialAnalytics() : Promise.resolve(null),
          svc.getCustomerAnalytics ? svc.getCustomerAnalytics() : Promise.resolve(null),
          svc.getMenuInsights ? svc.getMenuInsights() : Promise.resolve(null),
          svc.getMarketingData ? svc.getMarketingData() : Promise.resolve(null),
          svc.getHrData ? svc.getHrData() : Promise.resolve(null),
          svc.getRiskAlerts ? svc.getRiskAlerts() : Promise.resolve(null),
          svc.getForecasting ? svc.getForecasting() : Promise.resolve(null),
          svc.getExecutiveSummary ? svc.getExecutiveSummary() : Promise.resolve(null)
        ]);

        // Set data with fallbacks to comprehensive dummy data
        setBusinessData(business.status === 'fulfilled' && business.value ? business.value : dummyBusinessData);
        setBranchPerformance(branches.status === 'fulfilled' && branches.value ? branches.value : dummyBranchPerformance);
        setFinancialData(financial.status === 'fulfilled' && financial.value ? financial.value : dummyFinancialData);
        setCustomerAnalytics(customer.status === 'fulfilled' && customer.value ? customer.value : dummyCustomerAnalytics);
        setMenuInsights(menu.status === 'fulfilled' && menu.value ? menu.value : dummyMenuInsights);
        setMarketingData(marketing.status === 'fulfilled' && marketing.value ? marketing.value : dummyMarketingData);
        setHrData(hr.status === 'fulfilled' && hr.value ? hr.value : dummyHrData);
        setRiskAlerts(risk.status === 'fulfilled' && risk.value ? risk.value : dummyRiskAlerts);
        setForecasting(forecast.status === 'fulfilled' && forecast.value ? forecast.value : dummyForecasting);
        setExecutiveSummary(summary.status === 'fulfilled' && summary.value ? summary.value : dummyExecutiveSummary);
      } catch (err) {
        console.warn('Owner dashboard load error', err);
        // Use all dummy data on error
        setBusinessData(dummyBusinessData);
        setBranchPerformance(dummyBranchPerformance);
        setFinancialData(dummyFinancialData);
        setCustomerAnalytics(dummyCustomerAnalytics);
        setMenuInsights(dummyMenuInsights);
        setMarketingData(dummyMarketingData);
        setHrData(dummyHrData);
        setRiskAlerts(dummyRiskAlerts);
        setForecasting(dummyForecasting);
        setExecutiveSummary(dummyExecutiveSummary);
      }
    };
    load();
  }, [profile]);

  if (!profile || !(profile.role === 'admin' || profile.role === 'owner')) {
    return <div className="p-6">Access denied - Owner/Admin role required</div>;
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            Executive Dashboard
          </h1>
          <p className="text-lg text-gray-600 mt-1">Strategic overview and business intelligence</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="text-lg font-semibold">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Executive Summary - Quick Snapshot */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Activity className="h-6 w-6 text-blue-500 mr-2" />
            Executive Summary
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600">Yesterday Revenue</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ${executiveSummary?.yesterday?.revenue?.toLocaleString() || '12,500'}
                  </div>
                  <div className="text-xs text-blue-700 flex items-center mt-1">
                    {getGrowthIcon(executiveSummary?.yesterday?.growth || 5.2)}
                    <span className="ml-1">{executiveSummary?.yesterday?.growth || 5.2}%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600">This Month</div>
                  <div className="text-2xl font-bold text-green-900">
                    ${executiveSummary?.thisMonth?.revenue?.toLocaleString() || '350,000'}
                  </div>
                  <div className="text-xs text-green-700 flex items-center mt-1">
                    {getGrowthIcon(executiveSummary?.thisMonth?.growth || 12.3)}
                    <span className="ml-1">{executiveSummary?.thisMonth?.growth || 12.3}%</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-600">Top Branch</div>
                  <div className="text-lg font-bold text-purple-900">
                    {executiveSummary?.topBranch?.name || 'Downtown Karachi'}
                  </div>
                  <div className="text-xs text-purple-700">
                    ${executiveSummary?.topBranch?.revenue?.toLocaleString() || '1,800,000'}
                  </div>
                </div>
                <Building className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-orange-600">Key Alert</div>
                  <div className="text-sm font-medium text-orange-900">
                    {executiveSummary?.keyAlert || 'F-7 Islamabad complaints up 15%'}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Requires attention</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
          
          {/* Pending Approvals */}
          {executiveSummary?.pendingApprovals && executiveSummary.pendingApprovals.length > 0 && (
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-semibold text-yellow-800 mb-2">🔔 Pending Your Approval</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {executiveSummary.pendingApprovals.map((approval: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="font-medium text-sm">{approval.item}</div>
                    <div className="text-xs text-gray-600">{approval.department}</div>
                    <div className="text-lg font-bold text-green-600">${approval.amount?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 1: Business Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          title="Annual Revenue" 
          value={`$${businessData?.revenue?.year?.toLocaleString() || '4,200,000'}`} 
          subtitle={`YoY Growth: ${((businessData?.revenue?.year || 4200000) - (businessData?.revenue?.lastYear || 3800000)) / (businessData?.revenue?.lastYear || 3800000) * 100}%`}
          color="bg-blue-50" 
        />
        <KPICard 
          title="Net Profit Margin" 
          value={`${businessData?.profit?.margin || 30}%`} 
          subtitle={`$${businessData?.profit?.year?.toLocaleString() || '1,260,000'} profit`}
          color="bg-green-50" 
        />
        <KPICard 
          title="Monthly Target" 
          value={`${Math.round(((businessData?.revenue?.month || 350000) / (businessData?.targets?.monthlyRevenue || 400000)) * 100)}%`} 
          subtitle={`$${businessData?.revenue?.month?.toLocaleString() || '350,000'} / $${businessData?.targets?.monthlyRevenue?.toLocaleString() || '400,000'}`}
          color="bg-purple-50" 
        />
        <KPICard 
          title="Growth Target" 
          value={`${businessData?.targets?.yearlyGrowth || 15}%`} 
          subtitle="Annual growth goal"
          color="bg-orange-50" 
        />
      </div>

      {/* Revenue Trend and Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="📈 Revenue & Profit Trend (Monthly)">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={businessData?.dailyRevenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
              <Area type="monotone" dataKey="target" fill="#e5e7eb" stroke="#9ca3af" />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="🏢 Branch Performance Leaderboard">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={branchPerformance?.branches || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" fontSize={12} width={100} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Bar dataKey="profit" fill="#10B981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-green-700">Best Efficiency</div>
              <div>{branchPerformance?.branches?.reduce((prev: any, current: any) => (prev.efficiency > current.efficiency) ? prev : current)?.name || 'DHA Lahore'}</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700">Highest Revenue</div>
              <div>{branchPerformance?.branches?.[0]?.name || 'Downtown Karachi'}</div>
            </div>
          </div>
        </ChartWrapper>
      </div>

      {/* Section 3: Financial Analytics */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <DollarSign className="h-6 w-6 text-green-500 mr-2" />
            Financial Analytics & Cash Flow
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Breakdown */}
            <div>
              <div className="font-medium mb-3">💰 Expense Breakdown</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={financialData?.expenseBreakdown || []}
                    dataKey="amount"
                    nameKey="category"
                    outerRadius={80}
                    fill="#8884d8"
                    label={(entry: any) => `${entry.category}: ${entry.percentage}%`}
                  >
                    {(financialData?.expenseBreakdown || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Cash Flow */}
            <div>
              <div className="font-medium mb-3">💸 Cash Flow Overview</div>
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Total Inflow</div>
                  <div className="text-xl font-bold text-green-800">
                    ${financialData?.cashFlow?.inflow?.toLocaleString() || '4,200,000'}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-red-600">Total Outflow</div>
                  <div className="text-xl font-bold text-red-800">
                    ${financialData?.cashFlow?.outflow?.toLocaleString() || '2,940,000'}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Net Cash Flow</div>
                  <div className="text-xl font-bold text-blue-800">
                    ${financialData?.cashFlow?.netFlow?.toLocaleString() || '1,260,000'}
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Payments */}
            <div>
              <div className="font-medium mb-3">🏪 Outstanding Vendor Payments</div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(financialData?.vendorPayments || []).map((payment: any, idx: number) => (
                  <div key={idx} className={`p-2 rounded text-sm border ${payment.status === 'overdue' ? 'bg-red-50 border-red-200' : payment.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="font-medium">{payment.vendor}</div>
                    <div className="flex justify-between items-center">
                      <span>${payment.amount?.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Customer Analytics */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="h-6 w-6 text-purple-500 mr-2" />
            Customer Analytics & Insights
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Customer Acquisition */}
            <div>
              <div className="font-medium mb-3">👥 Customer Base</div>
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">New Customers</div>
                  <div className="text-2xl font-bold text-blue-800">{customerAnalytics?.acquisition?.newCustomers || 285}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Returning</div>
                  <div className="text-2xl font-bold text-green-800">{customerAnalytics?.acquisition?.returningCustomers || 1240}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">Retention Rate</div>
                  <div className="text-xl font-bold text-purple-800">{customerAnalytics?.acquisition?.retentionRate || 67.5}%</div>
                </div>
              </div>
            </div>

            {/* Loyalty Program */}
            <div>
              <div className="font-medium mb-3">⭐ Loyalty Program</div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Total Members:</span> 
                  <span className="font-bold ml-1">{customerAnalytics?.loyaltyProgram?.totalMembers?.toLocaleString() || '3,420'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Active Members:</span> 
                  <span className="font-bold ml-1">{customerAnalytics?.loyaltyProgram?.activeMembers?.toLocaleString() || '2,180'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Points Redeemed:</span> 
                  <span className="font-bold ml-1">{customerAnalytics?.loyaltyProgram?.pointsRedeemed?.toLocaleString() || '45,600'}</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">Top VIP Members:</div>
                  {(customerAnalytics?.loyaltyProgram?.topMembers || []).slice(0, 3).map((member: any, idx: number) => (
                    <div key={idx} className="text-xs bg-yellow-50 p-2 rounded mb-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-gray-600">{member.points} pts • CLV: ${member.clv?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Feedback */}
            <div>
              <div className="font-medium mb-3">📝 Customer Feedback</div>
              <div className="space-y-3">
                <div className="text-center bg-yellow-50 p-3 rounded">
                  <div className="text-3xl font-bold text-yellow-600">{customerAnalytics?.feedback?.averageRating || 4.6} ⭐</div>
                  <div className="text-sm text-yellow-700">Average Rating</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-bold text-green-700">{customerAnalytics?.feedback?.positiveReviews || 89.2}%</div>
                    <div className="text-green-600">Positive</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-bold text-red-700">{customerAnalytics?.feedback?.negativeReviews || 10.8}%</div>
                    <div className="text-red-600">Negative</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Reviews:</span> 
                  <span className="font-bold ml-1">{customerAnalytics?.feedback?.totalReviews?.toLocaleString() || '1,245'}</span>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div>
              <div className="font-medium mb-3">👨‍👩‍👧‍👦 Demographics</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={customerAnalytics?.demographics?.ageGroups || []}>
                  <XAxis dataKey="range" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-sm">
                <div>Avg CLV: <span className="font-bold">${customerAnalytics?.demographics?.customerLifetimeValue?.average || 850}</span></div>
                <div>VIP Customers: <span className="font-bold">{customerAnalytics?.demographics?.customerLifetimeValue?.vipCustomers || 245}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue with remaining sections... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="🍽️ Menu Category Performance">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={menuInsights?.categoryShare || []}
                dataKey="revenue"
                nameKey="category"
                outerRadius={100}
                fill="#8884d8"
                label={(entry: any) => `${entry.category}: ${entry.percentage}%`}
              >
                {(menuInsights?.categoryShare || []).map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="📊 AI Forecasting & Insights">
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">🔮 Sales Forecast</div>
              <div className="space-y-2">
                {(forecasting?.salesForecast || []).map((forecast: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                    <span>{forecast.period}</span>
                    <span className="font-bold">${forecast.forecast?.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{forecast.confidence}% confidence</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">🤖 AI Recommendations</div>
              <div className="space-y-1 text-sm">
                {(forecasting?.aiOptimizations || []).slice(0, 3).map((recommendation: string, idx: number) => (
                  <div key={idx} className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartWrapper>
      </div>

      {/* Risk & Compliance Alerts + HR Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Risk & Compliance Alerts
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Compliance Issues */}
              <div>
                <div className="font-medium mb-2">🏛️ Compliance & Legal</div>
                <div className="space-y-2">
                  {(riskAlerts?.compliance || []).map((item: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded border-l-4 ${getPriorityColor(item.priority)}`}>
                      <div className="font-medium text-sm">{item.type}</div>
                      <div className="text-xs text-gray-600">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                      <div className="text-xs">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Financial Risks */}
              <div>
                <div className="font-medium mb-2">💸 Financial Risks</div>
                <div className="space-y-2">
                  {(riskAlerts?.financial || []).map((alert: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="font-medium text-sm text-red-800">{alert.alert}</div>
                      {alert.amount && <div className="text-xs text-red-600">Amount: ${alert.amount?.toLocaleString()}</div>}
                      {alert.increase && <div className="text-xs text-red-600">Increase: {alert.increase}</div>}
                      {alert.count && <div className="text-xs text-red-600">Count: {alert.count} vendors</div>}
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
              <Briefcase className="h-5 w-5 text-blue-500 mr-2" />
              HR Overview & Performance
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Staffing Costs */}
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-600">Staffing Efficiency</div>
                <div className="text-lg font-bold text-blue-800">{hrData?.staffingCosts?.efficiency || 28.6}%</div>
                <div className="text-xs text-blue-700">
                  ${hrData?.staffingCosts?.total?.toLocaleString() || '1,200,000'} cost vs ${hrData?.staffingCosts?.revenueContribution?.toLocaleString() || '4,200,000'} revenue
                </div>
              </div>
              
              {/* Top Performers */}
              <div>
                <div className="font-medium mb-2">⭐ Top Performers</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(hrData?.topPerformers || []).slice(0, 4).map((performer: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-yellow-50 p-2 rounded">
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-xs text-gray-600">{performer.role} • {performer.branch}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{performer.rating} ⭐</div>
                        <div className="text-xs">${performer.revenue?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Attrition & Satisfaction */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="text-sm text-green-600">Attrition Rate</div>
                  <div className="font-bold text-green-800">{hrData?.attrition?.rate || 12.5}%</div>
                  <div className="text-xs text-gray-500">vs {hrData?.attrition?.industry || 18.2}% industry</div>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="text-sm text-purple-600">Satisfaction</div>
                  <div className="font-bold text-purple-800">{hrData?.satisfaction?.overall || 4.3}/5</div>
                  <div className="text-xs text-gray-500">Overall rating</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing & Growth Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Target className="h-6 w-6 text-green-500 mr-2" />
            Marketing Performance & Growth
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Campaign ROI */}
            <div>
              <div className="font-medium mb-3">📊 Campaign ROI</div>
              <div className="space-y-2">
                {(marketingData?.campaigns || []).map((campaign: any, idx: number) => (
                  <div key={idx} className="bg-green-50 p-3 rounded border">
                    <div className="font-medium text-sm">{campaign.name}</div>
                    <div className="text-lg font-bold text-green-700">{campaign.roi}% ROI</div>
                    <div className="text-xs text-gray-600">
                      ${campaign.revenue?.toLocaleString()} revenue from ${campaign.spent?.toLocaleString()} spend
                    </div>
                    <div className="text-xs text-gray-500">{campaign.impressions?.toLocaleString()} impressions</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Sources */}
            <div>
              <div className="font-medium mb-3">🎯 Customer Sources</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={marketingData?.customerSource || []}
                    dataKey="percentage"
                    nameKey="source"
                    outerRadius={70}
                    fill="#8884d8"
                    label={(entry: any) => `${entry.source}: ${entry.percentage}%`}
                  >
                    {(marketingData?.customerSource || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Repeat Customer Impact */}
            <div>
              <div className="font-medium mb-3">🔁 Promotion Impact</div>
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Repeat Rate After Promotion</div>
                  <div className="text-2xl font-bold text-blue-800">{marketingData?.repeatCustomerRate?.afterPromotion || 78.5}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Baseline Rate</div>
                  <div className="text-xl font-bold text-gray-800">{marketingData?.repeatCustomerRate?.baseline || 67.5}%</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-sm text-green-600">Improvement</div>
                  <div className="text-lg font-bold text-green-700">+{marketingData?.repeatCustomerRate?.improvement || 11}%</div>
                </div>
              </div>
            </div>

            {/* Reservation Growth */}
            <div>
              <div className="font-medium mb-3">📈 Reservation Trends</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={marketingData?.reservationTrends || []}>
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="reservations" fill="#10B981" />
                  <Bar dataKey="growth" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
