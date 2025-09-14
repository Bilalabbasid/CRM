import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import {
  ShoppingCart, Clock, Search, Download, RefreshCw, Eye, Trash2,
  Plus, Calendar, DollarSign, Users, TrendingUp, Package,
  ChefHat, Utensils, MapPin, Phone, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '../constants/design-system';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { chartColorSets } from '../utils/chartThemes';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category: string;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  type: 'dine-in' | 'takeout' | 'delivery';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  tableNumber?: number;
  deliveryAddress?: string;
  estimatedTime?: string;
  actualTime?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  assignedChef?: string;
  priority: 'low' | 'medium' | 'high';
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dine-in' | 'takeout' | 'delivery'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { success, error, info } = useToast();

  // Interactive handlers
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      info('Refreshing orders data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchOrders();
      success('Orders data refreshed successfully!');
    } catch (err) {
      error('Failed to refresh orders data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: string) => {
    try {
      info(`Preparing ${format.toUpperCase()} export...`);
      const dataStr = JSON.stringify(filteredOrders, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_export_${format}.json`;
      link.click();
      URL.revokeObjectURL(url);
      success(`Orders exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      error('Failed to export orders data');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
      success(`Order status updated to ${newStatus}`);
    } catch (err) {
      error('Failed to update order status');
    }
  };

  const handleAssignChef = (orderId: string, chef: string) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, assignedChef: chef, updated_at: new Date().toISOString() }
          : order
      ));
      success(`Chef ${chef} assigned to order ${orderId}`);
    } catch (err) {
      error('Failed to assign chef to order');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      success('Order deleted successfully');
    } catch (err) {
      error('Failed to delete order');
    }
  };

  const handlePrintReceipt = (orderId: string) => {
    try {
      info(`Printing receipt for order ${orderId}...`);
      // Simulate printing delay
      setTimeout(() => {
        success(`Receipt printed for order ${orderId}`);
      }, 1000);
    } catch (err) {
      error('Failed to print receipt');
    }
  };

  // Generate comprehensive dummy data
  const generateDummyOrders = (): Order[] => {
    const statuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const types: Order['type'][] = ['dine-in', 'takeout', 'delivery'];
    const priorities: Order['priority'][] = ['low', 'medium', 'high'];
    const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment'];
    const chefs = ['Chef Ahmed', 'Chef Sarah', 'Chef Ali', 'Chef Fatima'];
    
    const menuItems = [
      { name: 'Chicken Biryani', price: 18.99, category: 'Main Course' },
      { name: 'Beef Karahi', price: 22.50, category: 'Main Course' },
      { name: 'Fish & Chips', price: 16.99, category: 'Main Course' },
      { name: 'Vegetable Curry', price: 14.99, category: 'Main Course' },
      { name: 'Grilled Salmon', price: 24.99, category: 'Main Course' },
      { name: 'Caesar Salad', price: 12.99, category: 'Salads' },
      { name: 'Margherita Pizza', price: 19.99, category: 'Pizza' },
      { name: 'Chicken Tikka', price: 15.99, category: 'Appetizers' },
      { name: 'Mango Lassi', price: 4.99, category: 'Beverages' },
      { name: 'Gulab Jamun', price: 6.99, category: 'Desserts' }
    ];

    const customers = [
      { name: 'Ahmed Hassan', phone: '+1 555-0101' },
      { name: 'Sarah Khan', phone: '+1 555-0102' },
      { name: 'Ali Raza', phone: '+1 555-0103' },
      { name: 'Fatima Sheikh', phone: '+1 555-0104' },
      { name: 'Omar Malik', phone: '+1 555-0105' },
      { name: 'Ayesha Ahmed', phone: '+1 555-0106' },
      { name: 'Hassan Ali', phone: '+1 555-0107' },
      { name: 'Zara Hussain', phone: '+1 555-0108' }
    ];

    return Array.from({ length: 25 }, (_, index) => {
      const customer = customers[index % customers.length];
      const orderDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = item.price * quantity;
        
        orderItems.push({
          id: `item-${index}-${i}`,
          name: item.name,
          quantity,
          price: item.price,
          total: itemTotal,
          category: item.category,
          notes: Math.random() > 0.8 ? 'Extra spicy' : undefined
        });
        
        subtotal += itemTotal;
      }

      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      return {
        id: `order-${1000 + index}`,
        orderNumber: `#${1000 + index}`,
        customerId: `customer-${index % customers.length}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        status,
        type,
        items: orderItems,
        subtotal,
        tax,
        total,
        paymentStatus: status === 'delivered' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
        paymentMethod: Math.random() > 0.5 ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : undefined,
        tableNumber: type === 'dine-in' ? Math.floor(Math.random() * 20) + 1 : undefined,
        deliveryAddress: type === 'delivery' ? '123 Main St, City, ST 12345' : undefined,
        estimatedTime: `${Math.floor(Math.random() * 30) + 15} mins`,
        actualTime: status === 'delivered' ? `${Math.floor(Math.random() * 45) + 20} mins` : undefined,
        notes: Math.random() > 0.7 ? 'Customer requested no onions' : undefined,
        created_at: orderDate.toISOString(),
        updated_at: new Date(orderDate.getTime() + Math.random() * 60 * 60 * 1000).toISOString(),
        assignedChef: status !== 'pending' ? chefs[Math.floor(Math.random() * chefs.length)] : undefined,
        priority
      };
    });
  };

  const fetchOrders = async () => {
    try {
      // Simulate API call with dummy data
      const dummyOrders = generateDummyOrders();
      setOrders(dummyOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.type === typeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, typeFilter, dateFilter]);

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { class: 'status-badge status-warning', text: 'Pending' },
      confirmed: { class: 'status-badge status-info', text: 'Confirmed' },
      preparing: { class: 'status-badge status-primary', text: 'Preparing' },
      ready: { class: 'status-badge status-success', text: 'Ready' },
      delivered: { class: 'status-badge status-success', text: 'Delivered' },
      cancelled: { class: 'status-badge status-error', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={config.class}>{config.text}</span>;
  };

  const getTypeIcon = (type: Order['type']) => {
    switch (type) {
      case 'dine-in':
        return <Utensils className="h-4 w-4" />;
      case 'takeout':
        return <Package className="h-4 w-4" />;
      case 'delivery':
        return <MapPin className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    preparing: filteredOrders.filter(o => o.status === 'preparing').length,
    ready: filteredOrders.filter(o => o.status === 'ready').length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    avgOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length : 0,
    todayOrders: orders.filter(o => {
      const orderDate = new Date(o.created_at);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length
  };

  // Chart data
  const ordersByStatus = [
    { name: 'Pending', value: summaryStats.pending, color: chartColorSets.status[0] },
    { name: 'Preparing', value: summaryStats.preparing, color: chartColorSets.status[1] },
    { name: 'Ready', value: summaryStats.ready, color: chartColorSets.status[2] },
    { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length, color: chartColorSets.status[3] }
  ];

  const ordersByType = [
    { name: 'Dine-in', value: filteredOrders.filter(o => o.type === 'dine-in').length, color: chartColorSets.categories[0] },
    { name: 'Takeout', value: filteredOrders.filter(o => o.type === 'takeout').length, color: chartColorSets.categories[1] },
    { name: 'Delivery', value: filteredOrders.filter(o => o.type === 'delivery').length, color: chartColorSets.categories[2] }
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
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
            <ShoppingCart className="h-8 w-8 text-blue-500 mr-3" />
            Order Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Track and manage customer orders in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
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
            Export
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => alert('Add new order functionality coming soon!')}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* Order Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <KPICard
          title="Total Orders"
          value={summaryStats.total}
          format="number"
          change={12.5}
          trend="up"
          icon={<ShoppingCart className="w-6 h-6" />}
          onClick={() => alert('Viewing all orders')}
          subtitle="all time"
        />

        <KPICard
          title="Today's Orders"
          value={summaryStats.todayOrders}
          format="number"
          change={8.3}
          trend="up"
          icon={<Calendar className="w-6 h-6" />}
          onClick={() => setDateFilter('today')}
          subtitle="so far today"
        />

        <KPICard
          title="Pending"
          value={summaryStats.pending}
          format="number"
          change={-5.2}
          trend="down"
          icon={<Clock className="w-6 h-6" />}
          onClick={() => setStatusFilter('pending')}
          subtitle="awaiting confirmation"
        />

        <KPICard
          title="Preparing"
          value={summaryStats.preparing}
          format="number"
          change={15.7}
          trend="up"
          icon={<ChefHat className="w-6 h-6" />}
          onClick={() => setStatusFilter('preparing')}
          subtitle="in kitchen"
        />

        <KPICard
          title="Total Revenue"
          value={summaryStats.totalRevenue}
          format="currency"
          change={22.1}
          trend="up"
          icon={<DollarSign className="w-6 h-6" />}
          onClick={() => alert('Revenue breakdown coming soon!')}
          subtitle="from orders"
        />

        <KPICard
          title="Avg Order Value"
          value={summaryStats.avgOrderValue}
          format="currency"
          change={3.4}
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          onClick={() => alert('Order value analysis coming soon!')}
          subtitle="per order"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Orders by Status"
          subtitle="Current distribution of order statuses"
          exportable
          onExport={() => handleExportData('status-chart')}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ordersByStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({name, value}) => `${name}: ${value}`}
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Orders by Type"
          subtitle="Distribution across service types"
          exportable
          onExport={() => handleExportData('type-chart')}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {ordersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search orders, customers, items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="dine-in">Dine-in</option>
                <option value="takeout">Takeout</option>
                <option value="delivery">Delivery</option>
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {formatNumber(filteredOrders.length)} of {formatNumber(orders.length)} orders
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Recent Orders
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => alert('Kitchen display view coming soon!')}
              >
                Kitchen View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items & Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getPriorityColor(order.priority)}`}>
                          {getTypeIcon(order.type)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {order.orderNumber}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                          </div>
                          {order.tableNumber && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Table {order.tableNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            {order.customerPhone}
                          </div>
                        )}
                        {order.deliveryAddress && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-32">{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getStatusBadge(order.status)}
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          Est: {order.estimatedTime}
                        </div>
                        {order.actualTime && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Actual: {order.actualTime}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        {order.assignedChef ? (
                          <div className="flex items-center gap-1">
                            <ChefHat className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {order.assignedChef}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignChef(order.id, 'Chef Ahmed')}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePrintReceipt(order.id)}
                        >
                          Print
                        </Button>
                        
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="form-input-modern text-xs px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No orders found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'New orders will appear here when customers place them.'
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={() => alert('Add new order functionality coming soon!')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Create New Order
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Order Details - ${selectedOrder.orderNumber}`}
          size="xl"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${getPriorityColor(selectedOrder.priority)}`}>
                  {getTypeIcon(selectedOrder.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {format(new Date(selectedOrder.created_at), 'MMMM dd, yyyy at HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedOrder.status)}
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(selectedOrder.total)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedOrder.customerName}</span>
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedOrder.deliveryAddress}</span>
                    </div>
                  )}
                  {selectedOrder.tableNumber && (
                    <div className="flex items-center gap-3">
                      <Utensils className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Table {selectedOrder.tableNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Order Type:</span>
                    <span className="text-gray-900 dark:text-white capitalize font-medium">{selectedOrder.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className={`capitalize font-medium ${
                      selectedOrder.priority === 'high' ? 'text-red-600' :
                      selectedOrder.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>{selectedOrder.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estimated Time:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedOrder.estimatedTime}</span>
                  </div>
                  {selectedOrder.actualTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Actual Time:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{selectedOrder.actualTime}</span>
                    </div>
                  )}
                  {selectedOrder.assignedChef && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Assigned Chef:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{selectedOrder.assignedChef}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category} • {formatCurrency(item.price)} each
                      </div>
                      {item.notes && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 italic">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.quantity}x {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Special Notes</h4>
                <p className="text-gray-700 dark:text-gray-300 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handlePrintReceipt(selectedOrder.id)}
                  >
                    Print Receipt
                  </Button>
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <Button
                      variant="secondary"
                      onClick={() => alert('Order editing functionality coming soon!')}
                    >
                      Edit Order
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        const nextStatus = selectedOrder.status === 'pending' ? 'confirmed' :
                                         selectedOrder.status === 'confirmed' ? 'preparing' :
                                         selectedOrder.status === 'preparing' ? 'ready' : 'delivered';
                        handleUpdateOrderStatus(selectedOrder.id, nextStatus);
                        setIsViewModalOpen(false);
                      }}
                    >
                      Mark as {selectedOrder.status === 'pending' ? 'Confirmed' :
                               selectedOrder.status === 'confirmed' ? 'Preparing' :
                               selectedOrder.status === 'preparing' ? 'Ready' : 'Delivered'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;