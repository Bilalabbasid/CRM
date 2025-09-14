import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Plus, Search, Edit, Trash2, Mail, Phone, Calendar, Star, Users, Eye,
  Filter, Download, RefreshCw, ArrowRight, TrendingUp, DollarSign,
  MapPin, Clock, Award, Activity, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '../constants/design-system';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyalty_points: number;
  visits: number;
  last_visit: string | null;
  created_at: string | null;
  updated_at: string | null;
  address?: string;
  total_spent?: number;
  avg_order?: number;
  status?: 'active' | 'inactive' | 'vip';
  preferred_time?: string;
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'vip'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'points' | 'last_visit'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    loyalty_points: 0,
    address: '',
    preferred_time: ''
  });

  // Interactive handlers
  const handleRefreshData = async () => {
    setLoading(true);
    await fetchCustomers();
  };

  const handleExportData = (format: string) => {
    console.log(`Exporting customers data as ${format}...`);
    alert(`Exporting customer data to ${format.toUpperCase()}...`);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing bulk action: ${action}`);
    alert(`Bulk action: ${action} (not implemented in demo)`);
  };

  const handleSendMarketing = (customerId?: string) => {
    const target = customerId ? 'selected customer' : 'all customers';
    console.log(`Sending marketing campaign to ${target}`);
    alert(`Marketing campaign sent to ${target}!`);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'visits':
          return b.visits - a.visits;
        case 'points':
          return b.loyalty_points - a.loyalty_points;
        case 'last_visit':
          if (!a.last_visit && !b.last_visit) return 0;
          if (!a.last_visit) return 1;
          if (!b.last_visit) return -1;
          return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter, sortBy]);

  const fetchCustomers = async () => {
    try {
      // API call commented out as methods don't exist yet
      // const res = await apiService.getCustomers({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      // const list = res.customers || res || [];
      const list: Customer[] = [];
      
      // Enhanced dummy data with more realistic fields
      const dummy: Customer[] = [
        {
          id: '1',
          name: 'Alice Walker',
          email: 'alice@example.com',
          phone: '555-1234',
          loyalty_points: 1250,
          visits: 28,
          last_visit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          address: '123 Main St, City, ST 12345',
          total_spent: 3420,
          avg_order: 122.14,
          status: 'vip',
          preferred_time: 'evening'
        },
        {
          id: '2',
          name: 'Bob Martin',
          email: 'bob@example.com',
          phone: '555-5678',
          loyalty_points: 540,
          visits: 15,
          last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          address: '456 Oak Ave, City, ST 12345',
          total_spent: 1890,
          avg_order: 126.00,
          status: 'active',
          preferred_time: 'lunch'
        },
        {
          id: '3',
          name: 'Charlie Price',
          email: 'charlie@example.com',
          phone: '555-9012',
          loyalty_points: 85,
          visits: 3,
          last_visit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          address: '789 Pine St, City, ST 12345',
          total_spent: 245,
          avg_order: 81.67,
          status: 'active',
          preferred_time: 'dinner'
        },
        {
          id: '4',
          name: 'Diana Ross',
          email: 'diana@example.com',
          phone: '555-3456',
          loyalty_points: 2100,
          visits: 45,
          last_visit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          address: '321 Elm Dr, City, ST 12345',
          total_spent: 5680,
          avg_order: 126.22,
          status: 'vip',
          preferred_time: 'dinner'
        },
        {
          id: '5',
          name: 'Edward Chen',
          email: 'edward@example.com',
          phone: '555-7890',
          loyalty_points: 45,
          visits: 2,
          last_visit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          address: '654 Maple Ln, City, ST 12345',
          total_spent: 156,
          avg_order: 78.00,
          status: 'inactive',
          preferred_time: 'lunch'
        }
      ];

      const effectiveList = (Array.isArray(list) && list.length > 0) ? list : dummy;
      
      setCustomers(effectiveList);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedCustomer) {
        // Update customer - API endpoint doesn't exist yet, using placeholder
        console.log('Updating customer:', selectedCustomer.id, formData);
        // await apiService.updateCustomer(selectedCustomer.id, { ...formData, updated_at: new Date().toISOString() });
      } else {
        // Create new customer - API endpoint doesn't exist yet, using placeholder  
        console.log('Creating customer:', formData);
        // await apiService.createCustomer(formData);
      }
      
      setIsModalOpen(false);
      resetForm();
      await fetchCustomers();
      alert(selectedCustomer ? 'Customer updated successfully!' : 'Customer added successfully!');
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      // Delete customer - API endpoint doesn't exist yet, using placeholder
      console.log('Deleting customer:', customerId);
      // await apiService.deleteCustomer(customerId);
      
      // Remove from local state for demo
      setCustomers(customers.filter(c => c.id !== customerId));
      alert('Customer deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer. Please try again.');
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyalty_points: customer.loyalty_points,
        address: customer.address || '',
        preferred_time: customer.preferred_time || ''
      });
    } else {
      setSelectedCustomer(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      loyalty_points: 0,
      address: '',
      preferred_time: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'vip':
        return <span className="status-badge status-vip">VIP</span>;
      case 'active':
        return <span className="status-badge status-success">Active</span>;
      case 'inactive':
        return <span className="status-badge status-warning">Inactive</span>;
      default:
        return <span className="status-badge status-secondary">Unknown</span>;
    }
  };

  const getCustomerAvatar = (name: string, status?: string) => {
    const initial = name.charAt(0).toUpperCase();
    const isVip = status === 'vip';
    
    return (
      <div className={`relative h-10 w-10 rounded-full flex items-center justify-center font-medium text-white ${
        isVip ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'
      }`}>
        {initial}
        {isVip && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <Star className="h-2.5 w-2.5 text-yellow-800 fill-current" />
          </div>
        )}
      </div>
    );
  };

  // Calculate summary stats
  const summaryStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.status === 'vip').length,
    newThisMonth: customers.filter(c => 
      c.created_at && new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    avgLoyaltyPoints: customers.length > 0 ? customers.reduce((sum, c) => sum + c.loyalty_points, 0) / customers.length : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
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
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            Customer Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Manage relationships and track customer engagement
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
            variant="secondary" 
            size="sm" 
            icon={<Mail className="w-4 h-4" />}
            onClick={() => handleSendMarketing()}
          >
            Send Campaign
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => openModal()}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(summaryStats.total)}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(summaryStats.active)}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">VIP Members</p>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(summaryStats.vip)}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">New This Month</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(summaryStats.newThisMonth)}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalSpent)}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Loyalty Pts</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(Math.round(summaryStats.avgLoyaltyPoints))}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'vip')}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'visits' | 'points' | 'last_visit')}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="visits">Sort by Visits</option>
                <option value="points">Sort by Points</option>
                <option value="last_visit">Sort by Last Visit</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Filter className="w-4 h-4" />}
                onClick={() => handleBulkAction('filter')}
              >
                More Filters
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {formatNumber(filteredCustomers.length)} of {formatNumber(customers.length)} customers
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Customer Directory
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkAction('select-all')}
              >
                Select All
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => alert('Advanced customer analytics coming soon!')}
              >
                Analytics
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
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact & Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Spending
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {getCustomerAvatar(customer.name, customer.status)}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Since {customer.created_at ? format(new Date(customer.created_at), 'MMM yyyy') : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-48">{customer.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.address && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate max-w-40">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.visits} visits
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatNumber(customer.loyalty_points)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          Last: {customer.last_visit ? format(new Date(customer.last_visit), 'MMM dd') : 'Never'}
                        </div>
                        {customer.preferred_time && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                            Prefers {customer.preferred_time}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(customer.total_spent || 0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Avg: {formatCurrency(customer.avg_order || 0)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(customer.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(customer)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendMarketing(customer.id)}
                          title="Send Message"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(customer)}
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'Start building your customer base by adding your first customer.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button
                    variant="primary"
                    onClick={() => openModal()}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add First Customer
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter customer name"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              required
              placeholder="customer@example.com"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              required
              placeholder="+1 (555) 123-4567"
            />
            <Input
              label="Loyalty Points"
              name="loyalty_points"
              type="number"
              value={formData.loyalty_points}
              onChange={handleFormChange}
              min="0"
              placeholder="0"
            />
          </div>
          
          <Input
            label="Address (Optional)"
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            placeholder="123 Main St, City, State 12345"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Dining Time
              </label>
              <select
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleFormChange}
                className="form-input-modern w-full"
              >
                <option value="">No preference</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={selectedCustomer ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Customer Profile"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                {getCustomerAvatar(selectedCustomer.name, selectedCustomer.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCustomer.name}
                  </h3>
                  {getStatusBadge(selectedCustomer.status)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Customer since {selectedCustomer.created_at ? format(new Date(selectedCustomer.created_at), 'MMMM dd, yyyy') : 'unknown'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedCustomer.total_spent || 0)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCustomer.visits}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loyalty Points</p>
                      <p className="text-xl font-bold text-yellow-600">{formatNumber(selectedCustomer.loyalty_points)}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(selectedCustomer.avg_order || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences & Activity</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Visit:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {selectedCustomer.last_visit ? format(new Date(selectedCustomer.last_visit), 'MMM dd, yyyy') : 'Never'}
                    </span>
                  </div>
                  {selectedCustomer.preferred_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Preferred Time:</span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">
                        {selectedCustomer.preferred_time}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Customer Type:</span>
                    <span className="font-medium">
                      {selectedCustomer.visits >= 20 ? 'Loyal Customer' :
                       selectedCustomer.visits >= 10 ? 'Regular Customer' :
                       selectedCustomer.visits >= 5 ? 'Returning Customer' : 'New Customer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    icon={<Mail className="h-4 w-4" />}
                    onClick={() => handleSendMarketing(selectedCustomer.id)}
                  >
                    Send Message
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Star className="h-4 w-4" />}
                    onClick={() => alert('Loyalty program features coming soon!')}
                  >
                    Manage Loyalty
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    icon={<Edit className="h-4 w-4" />}
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openModal(selectedCustomer);
                    }}
                  >
                    Edit Customer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};