import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  Star,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Redirect users to role-specific dashboards
  useEffect(() => {
    if (!profile) return;
    const role = (profile.role || '').toLowerCase();
    if (role === 'admin' || role === 'owner') {
      navigate('/owner', { replace: true });
      return;
    }
    if (role === 'manager') {
      navigate('/manager', { replace: true });
      return;
    }
    if (role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
      return;
    }
  }, [profile, navigate]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalReservations: 0,
    dailySales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  type TopPerformer = { _id?: string; menuItem?: { name?: string }; name?: string; quantitySold?: number; totalQuantity?: number; revenue?: number };
  type Trends = { salesByHour?: Array<{ _id: number; totalRevenue: number; orders: number }>; lunch?: { _id: string; totalRevenue: number; orders: number } | null; dinner?: { _id: string; totalRevenue: number; orders: number } | null; promotions?: Array<{ _id?: string; uses?: number; totalDiscount?: number; revenue?: number }> };
  type TopMenuItem = { id?: string; _id?: string; name?: string; category?: string; times_ordered?: number; timesOrdered?: number; totalQuantity?: number };
  const [topPerformers, setTopPerformers] = useState<{ topSelling: TopPerformer[]; leastSelling: TopPerformer[] }>({ topSelling: [], leastSelling: [] });
  const [topMenuItems, setTopMenuItems] = useState<TopMenuItem[]>([]);
  const [trends, setTrends] = useState<Trends>({ salesByHour: [], lunch: null, dinner: null, promotions: [] });
  const [recentActivities, setRecentActivities] = useState<Array<{ type: string; message: string; time: string; icon: React.ElementType }>>([]);
  type InventoryItem = { _id?: string; name: string; quantity?: number; unit?: string; lowStockThreshold?: number };
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
   const [paymentSplit, setPaymentSplit] = useState<Record<string, number>>({});
  
  type Order = {
    status?: string;
    created_at?: string;
    createdAt?: string;
    total_amount?: number;
    total?: number;
    paymentMethod?: string;
    payment_method?: string;
    branch?: string;
    location?: string;
    store?: string;
  };

  type SalesRes = {
    data?: Array<{ date?: string; _id?: string; totalRevenue?: number }>;
    summary?: { totalRevenue?: number; averageOrderValue?: number };
  };
  const [salesRange, setSalesRange] = useState<'day'|'week'|'month'>('day');
  type SalesSummary = { totalRevenue?: number; averageOrderValue?: number };
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({});
  const revenueTarget = Number(import.meta.env.VITE_REVENUE_TARGET || 20000);
  const [branchSales, setBranchSales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  type CustomerInsightVIP = { customerId?: string; name?: string; totalSpent?: number };
  type CustomerInsightReview = { customer?: { name?: string }; customerName?: string; rating?: number; comment?: string; createdAt?: string };
  type CustomerInsightLoyal = { name?: string; email?: string; loyaltyPoints?: number; updatedAt?: string };
  type CustomerInsights = { totalCustomersToday?: number; newCustomersToday?: number; returningCustomers?: number; recentFeedback?: CustomerInsightReview[]; loyaltyActive?: CustomerInsightLoyal[]; topSpenders?: CustomerInsightVIP[]; vipFlags?: CustomerInsightVIP[] } | null;
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights>(null);
  
  type ReservationShort = { _id?: string; date?: string; time?: string; customer?: { name?: string }; customerName?: string; partySize?: number; status?: string };
  type SplitItem = { _id?: string; count?: number; revenue?: number };
  type OrdersOverview = { upcomingReservations?: ReservationShort[]; pendingCount?: number; ongoingCount?: number; completedToday?: number; split?: SplitItem[]; avgCompletionMinutes?: number } | null;
  const [ordersOverview, setOrdersOverview] = useState<OrdersOverview>(null);
  const [ownerOverview, setOwnerOverview] = useState<any>(null);
  const [ownerForecasts, setOwnerForecasts] = useState<any>(null);
  const fetchDashboardData = useCallback(async (overrideRange?: 'day'|'week'|'month') => {
    const effectiveRange = overrideRange || salesRange;
    try {
      // Fetch statistics
      const [customersStats, reservationsList, ordersList, inventoryList] = await Promise.all([
        apiService.getCustomerStats(),
        apiService.getReservations(),
        apiService.getOrders(),
        apiService.getInventory()
      ]);

      const orders: Order[] = (ordersList && (ordersList.orders || ordersList)) || [];
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const todayStart = startOfDay(new Date()).toISOString();
      const dailySales = orders
        .filter(order => {
          const created = (order.created_at || order.createdAt || '') as string;
          return created >= todayStart && order.status === 'completed';
        })
        .reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
      const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);

      const dummyStats = {
        totalCustomers: 50,
        totalReservations: 6,
        dailySales: 120,
        pendingOrders: 2,
        completedOrders: 20,
        totalRevenue: 2560
      };

      setStats({
        totalCustomers: (customersStats && (customersStats.totalCustomers ?? customersStats.total)) || dummyStats.totalCustomers,
        totalReservations: (reservationsList && (reservationsList.pagination ? reservationsList.pagination.total : (reservationsList.length || 0))) || dummyStats.totalReservations,
        dailySales: dailySales || dummyStats.dailySales,
        pendingOrders: pendingOrders || dummyStats.pendingOrders,
        completedOrders: completedOrders || dummyStats.completedOrders,
        totalRevenue: totalRevenue || dummyStats.totalRevenue
      });

      // Fetch sales report for the current range
      try {
        const group = effectiveRange === 'day' ? 'day' : effectiveRange === 'week' ? 'week' : 'month';
        const salesRes = await apiService.getSalesReport({ groupBy: group }) as SalesRes;
        const chartData = Array.isArray(salesRes.data) ? salesRes.data.map((d) => ({ date: d.date || d._id, revenue: d.totalRevenue || 0 })) : [];
        setSalesData(chartData.length ? chartData : []);
        setSalesSummary(salesRes.summary || {});
      } catch (err) {
        console.warn('Error fetching sales report', err);
        const dummySales = Array.from({ length: 7 }).map((_, idx) => ({ date: format(subDays(new Date(), 6 - idx), 'MMM dd'), revenue: Math.round(Math.random() * 400), orders: Math.round(Math.random() * 10) }));
        setSalesData(dummySales);
      }

      // Fetch top menu items
      const menuRes = await apiService.getMenuItems({ limit: 5, sortBy: 'timesOrdered', sortOrder: 'desc' });
      const menuItemsEffective = (menuRes.menuItems || menuRes.menu || menuRes.items || menuRes || []);
      const dummyMenu = [
        { id: 'm1', name: 'Margherita Pizza', category: 'mains', times_ordered: 120 },
        { id: 'm2', name: 'Craft Beer Selection', category: 'beverages', times_ordered: 90 },
        { id: 'm3', name: 'Grilled Salmon', category: 'mains', times_ordered: 75 }
      ];
      setTopMenuItems((Array.isArray(menuItemsEffective) && menuItemsEffective.length > 0) ? menuItemsEffective : dummyMenu);

      // Inventory
      const inventory = Array.isArray(inventoryList) ? inventoryList : (inventoryList.items || []);
      setInventoryItems(inventory);
      const low = inventory.filter((it: InventoryItem) => (it.quantity ?? 0) <= (it.lowStockThreshold ?? 5));
      setLowStock(low);

      // Payment method split - compute from recent 30 days orders
      try {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const orders30 = await apiService.getOrders({ dateFrom: since.toISOString(), dateTo: new Date().toISOString(), limit: 1000 });
        const flatOrders = (Array.isArray(orders30) ? orders30 : (orders30.orders || orders30.data || [])) as Order[];
        const split: Record<string, number> = {};
        flatOrders.forEach((o: Order) => {
          const method = (o.paymentMethod || o.payment_method || 'unknown') as string;
          const amt = Number(o.total || o.total_amount || 0);
          split[method] = (split[method] || 0) + amt;
        });
        setPaymentSplit(split);
      } catch (err) {
        console.warn('Could not compute payment split', err);
      }

      // Branch-wise sales (best-effort) - aggregate orders by branch field if present
      try {
        const since = new Date(); since.setDate(since.getDate() - 30);
        const ords = await apiService.getOrders({ dateFrom: since.toISOString(), dateTo: new Date().toISOString(), limit: 2000 });
        const allOrders = (Array.isArray(ords) ? ords : (ords.orders || ords.data || [])) as Order[];
        const branches: Record<string, number> = {};
        allOrders.forEach((o: Order) => {
          const branch = (o.branch || o.location || o.store || 'main') as string;
          const amt = Number(o.total || o.total_amount || 0);
          branches[branch] = (branches[branch] || 0) + amt;
        });
        setBranchSales(branches);
      } catch (err) {
        console.warn('Error aggregating branch sales', err);
        setBranchSales({});
      }

      // Generate recent activities
      const activities = [
        { type: 'reservation', message: 'New reservation for Table 5', time: '2 minutes ago', icon: Calendar },
        { type: 'order', message: 'Order #1234 completed', time: '5 minutes ago', icon: ShoppingBag },
        { type: 'customer', message: 'New customer registered: John Doe', time: '10 minutes ago', icon: Users },
        { type: 'alert', message: 'Table 8 reservation in 30 minutes', time: '15 minutes ago', icon: AlertTriangle }
      ];
      setRecentActivities(activities.length ? activities : []);

      // Top performers & trends
      try {
        const perf = await apiService.getTopPerformers({ limit: 6 });
        setTopPerformers({ topSelling: perf.topSelling || [], leastSelling: perf.leastSelling || [] });
      } catch (err) {
        console.warn('Could not load top performers', err);
      }

      try {
        const t = await apiService.getTrends();
        setTrends(t || { salesByHour: [], lunch: null, dinner: null, promotions: [] });
      } catch (err) {
        console.warn('Could not load trends', err);
      }

      // Customer insights
      try {
        if (apiService.getCustomerInsights) {
          const ci = await apiService.getCustomerInsights();
          setCustomerInsights(ci || null);
        }
      } catch (err) {
        console.warn('Could not load customer insights', err);
      }

      // Orders overview
      try {
        if (apiService.getOrdersOverview) {
          const ov = await apiService.getOrdersOverview();
          setOrdersOverview(ov || null);
        }
      } catch (err) {
        console.warn('Could not load orders overview', err);
      }

      // Owner-only data (load defensively)
      try {
        if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
          const [ovRes, fcRes] = await Promise.allSettled([
            apiService.getOwnerOverview(),
            apiService.getOwnerForecasts()
          ]);
          if (ovRes.status === 'fulfilled') setOwnerOverview(ovRes.value.data || ovRes.value);
          if (fcRes.status === 'fulfilled') setOwnerForecasts(fcRes.value.data || fcRes.value);
        }
      } catch (err) {
        console.warn('owner data load error', err);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [salesRange, setTopMenuItems, setOrdersOverview, profile]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  type StatCardProps = {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: string; positive: boolean };
    color?: string;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend && (
              <p className={`text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening at your restaurant today.
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Owner Executive Summary */}
      {profile && (profile.role === 'admin' || profile.role === 'owner') && (
        <div className="mt-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Executive Summary</h2>
                  <p className="text-sm text-gray-600">High level business snapshot</p>
                </div>
                <div className="text-sm text-gray-600">
                  {/* small placeholder for potential controls */}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Today Revenue</div>
                  <div className="text-xl font-bold">${ownerOverview?.today?.revenue ?? '—'}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Month Revenue</div>
                  <div className="text-xl font-bold">${ownerOverview?.month?.revenue ?? '—'}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Top Branch</div>
                  <div className="text-xl font-bold">{ownerOverview?.topBranches?.[0]?._id ?? '—'}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-gray-500">Delayed Orders</div>
                  <div className="text-xl font-bold">{ownerOverview?.keyAlerts?.delayedOrders ?? '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={Users}
          trend={{ value: '+12%', positive: true }}
          color="bg-blue-500"
        />
        <StatCard
          title="Reservations"
          value={stats.totalReservations.toLocaleString()}
          icon={Calendar}
          trend={{ value: '+8%', positive: true }}
          color="bg-green-500"
        />
        <StatCard
          title="Daily Sales"
          value={`$${stats.dailySales.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: '+15%', positive: true }}
          color="bg-yellow-500"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toLocaleString()}
          icon={Clock}
          color="bg-red-500"
        />
      </div>

      {/* Sales & Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Daily / Weekly / Monthly</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className={`px-3 py-1 rounded ${salesRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => { setSalesRange('day'); fetchDashboardData('day'); }}>Day</button>
                <button className={`px-3 py-1 rounded ${salesRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => { setSalesRange('week'); fetchDashboardData('week'); }}>Week</button>
                <button className={`px-3 py-1 rounded ${salesRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => { setSalesRange('month'); fetchDashboardData('month'); }}>Month</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-bold">${(salesSummary?.totalRevenue || stats.totalRevenue).toLocaleString?.() ?? (salesSummary?.totalRevenue || stats.totalRevenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</p>
                  <p className="text-lg font-semibold">${((salesSummary?.averageOrderValue) || (stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders) : 0)).toFixed ? ((salesSummary?.averageOrderValue) || (stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders) : 0)).toFixed(2) : (salesSummary?.averageOrderValue || 0)}</p>
                    {(() => {
                      const avg = Number(salesSummary?.averageOrderValue ?? (stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders) : 0));
                      return <p className="text-lg font-semibold">${avg.toFixed(2)}</p>;
                    })()}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue vs Target</p>
                <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden mt-2">
                  {(() => {
                    const revenue = Number(salesSummary?.totalRevenue || stats.totalRevenue || 0);
                    const pct = Math.min(100, Math.round((revenue / revenueTarget) * 100));
                    return <div className="h-4 bg-green-500" style={{ width: `${pct}%` }} />;
                  })()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Target: ${revenueTarget.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Split (30d)</p>
                  <div className="space-y-1 mt-2">
                    {Object.entries(paymentSplit).length === 0 ? <div className="text-xs text-gray-500">No data</div> : Object.entries(paymentSplit).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <div className="capitalize">{k}</div>
                        <div className="font-semibold">${Number(v).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Branch Sales (30d)</p>
                  <div className="space-y-1 mt-2">
                    {Object.entries(branchSales).length === 0 ? <div className="text-xs text-gray-500">No branch data</div> : Object.entries(branchSales).map(([b, v]) => (
                      <div key={b} className="flex items-center justify-between text-sm">
                        <div className="capitalize">{b}</div>
                        <div className="font-semibold">${Number(v).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 days revenue</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value}` : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Menu Items */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Menu Items</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Most ordered items</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMenuItems.map((item, index) => (
                <div key={String(item._id || item.id || index)} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{(item.times_ordered ?? item.timesOrdered ?? item.totalQuantity) || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Top Performers & Trends */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers & Trends</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Top selling, low performers, and time-of-day split</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Selling Items</h3>
                <div className="mt-2 space-y-2">
                  {topPerformers.topSelling.length === 0 ? (
                    <div className="text-xs text-gray-500">No data</div>
                  ) : (
                    topPerformers.topSelling.map((it, idx) => (
                      <div key={String(it._id || idx)} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">{idx + 1}</div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{it.menuItem?.name || it.name || it._id}</div>
                            <div className="text-xs text-gray-500">{it.quantitySold ?? it.totalQuantity ?? 0} sold</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold">${Number(it.revenue || 0).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Least Selling / Wastage</h3>
                <div className="mt-2 space-y-2">
                  {topPerformers.leastSelling.length === 0 ? (
                    <div className="text-xs text-gray-500">No data</div>
                  ) : (
                    topPerformers.leastSelling.map((it, idx) => (
                      <div key={String(it._id || idx)} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{it.menuItem?.name || it.name || it._id}</div>
                          <div className="text-xs text-gray-500">{it.quantitySold ?? 0} sold</div>
                        </div>
                        <div className="text-sm text-red-600">Low</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales by Time of Day</h3>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>Lunch: ${Number(trends.lunch?.totalRevenue || 0).toLocaleString()} ({trends.lunch?.orders || 0} orders)</div>
                  <div>Dinner: ${Number(trends.dinner?.totalRevenue || 0).toLocaleString()} ({trends.dinner?.orders || 0} orders)</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Promotions Performance</h3>
                <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {Array.isArray(trends.promotions) && trends.promotions.length > 0 ? trends.promotions.slice(0,5).map((p: { _id?: string; promotionCode?: string; uses?: number }, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="truncate">{p._id || p.promotionCode || 'promo'}</div>
                      <div className="font-semibold">Uses: {p.uses || 0}</div>
                    </div>
                  )) : <div className="text-xs text-gray-500">No promotion data</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Items</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Items below threshold</p>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="text-sm text-gray-500">No low stock alerts</div>
            ) : (
              <div className="space-y-2">
                {lowStock.map((it) => (
                  <div key={it._id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-500">{it.quantity} {it.unit}</div>
                    </div>
                    <div className="text-sm text-red-600">Threshold: {it.lowStockThreshold}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment split */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 days split</p>
          </CardHeader>
          <CardContent>
            {Object.keys(paymentSplit).length === 0 ? (
              <div className="text-sm text-gray-500">No payment data</div>
            ) : (
              <div className="space-y-2">
                    {Object.entries(paymentSplit).map(([method, amt]: [string, number]) => (
                      <div key={method} className="flex items-center justify-between">
                        <div className="capitalize text-sm">{method}</div>
                        <div className="text-sm font-semibold">${Number(amt).toLocaleString()}</div>
                      </div>
                    ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory quick peek */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Snapshot</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Critical items and fast movers</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                    {inventoryItems.slice(0,5).map((it) => (
                <div key={it._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.unit}</div>
                  </div>
                  <div className={`text-sm font-semibold ${ (it.quantity ?? 0) <= (it.lowStockThreshold ?? 5) ? 'text-red-600' : ''}`}>{it.quantity}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights (Manager) */}
      {profile && (profile.role === 'manager' || profile.role === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Insights</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overview of today's customers and loyalty</p>
            </CardHeader>
            <CardContent>
              {customerInsights ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Total Customers Today</div>
                    <div className="font-semibold">{customerInsights.totalCustomersToday ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">New Customers</div>
                    <div className="font-semibold">{customerInsights.newCustomersToday ?? 0}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Returning Customers</div>
                    <div className="font-semibold">{customerInsights.returningCustomers ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">VIPs</div>
                    <div className="mt-2 space-y-1">
                      {(customerInsights.vipFlags || []).slice(0,5).map((v: CustomerInsightVIP, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div>{v.name}</div>
                          <div className="font-semibold">${Number(v.totalSpent).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No customer insights available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Feedback</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest reviews and ratings</p>
            </CardHeader>
            <CardContent>
              {customerInsights && Array.isArray(customerInsights.recentFeedback) && customerInsights.recentFeedback.length > 0 ? (
                <div className="space-y-2">
                  {customerInsights.recentFeedback.map((r: CustomerInsightReview, i: number) => (
                    <div key={i} className="p-2 border rounded">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{r.customer?.name || r.customerName || 'Anonymous'}</div>
                        <div className="text-sm text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">Rating: {r.rating ?? '—'}</div>
                      {r.comment && <div className="text-sm text-gray-600 mt-1">{r.comment}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No recent feedback</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loyalty Activity</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent members and points</p>
            </CardHeader>
            <CardContent>
              {customerInsights && Array.isArray(customerInsights.loyaltyActive) && customerInsights.loyaltyActive.length > 0 ? (
                <div className="space-y-2">
                  {customerInsights.loyaltyActive.map((c: CustomerInsightLoyal, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>{c.name}</div>
                      <div className="text-sm font-semibold">{c.loyaltyPoints}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No loyalty activity</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders & Reservations (Manager) */}
      {profile && (profile.role === 'manager' || profile.role === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Reservations</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next 48 hours</p>
            </CardHeader>
            <CardContent>
              {ordersOverview && Array.isArray(ordersOverview.upcomingReservations) && ordersOverview.upcomingReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="p-2">Time</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2">Party Size</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersOverview.upcomingReservations.map((r: ReservationShort, i: number) => (
                        <tr key={r._id || i} className="border-t">
                          <td className="p-2">{new Date(r.date).toLocaleString()} {r.time || ''}</td>
                          <td className="p-2">{r.customer?.name || r.customerName || 'Guest'}</td>
                          <td className="p-2">{r.partySize || '-'}</td>
                          <td className="p-2">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No upcoming reservations</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Orders Overview</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending / Ongoing / Delivery mix</p>
            </CardHeader>
            <CardContent>
              {ordersOverview ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><div>Pending / Preparing</div><div className="font-semibold">{ordersOverview.pendingCount ?? 0}</div></div>
                  <div className="flex items-center justify-between"><div>Ongoing</div><div className="font-semibold">{ordersOverview.ongoingCount ?? 0}</div></div>
                  <div className="flex items-center justify-between"><div>Completed Today</div><div className="font-semibold">{ordersOverview.completedToday ?? 0}</div></div>
                  <div>
                    <div className="text-xs text-gray-500">Delivery vs Dine-in (today)</div>
                    <div className="mt-2 space-y-1">
                      {Array.isArray(ordersOverview.split) && ordersOverview.split.map((s: SplitItem) => (
                        <div key={s._id} className="flex items-center justify-between text-sm">
                          <div className="capitalize">{s._id || 'unknown'}</div>
                          <div className="font-semibold">{s.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Average Completion Time: <span className="font-semibold">{ordersOverview.avgCompletionMinutes ? `${Math.round(ordersOverview.avgCompletionMinutes)} min` : '—'}</span></div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No orders overview data</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'reservation' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'order' ? 'bg-green-100 text-green-600' :
                    activity.type === 'customer' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed Orders</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.completedOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Order</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${stats.completedOrders > 0 ? (stats.totalRevenue / stats.completedOrders).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white ml-1">4.8</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};