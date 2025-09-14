import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import {
  Utensils, Search, Download, RefreshCw, Eye, Edit, Trash2,
  Plus, DollarSign, TrendingUp, Star, Clock,
  Image, Tag, BarChart3, ArrowUp, ArrowDown, Award,
  AlertTriangle, CheckCircle, XCircle, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '../constants/design-system';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { chartColorSets } from '../utils/chartThemes';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  imageUrl?: string;
  availability: 'available' | 'unavailable' | 'limited';
  preparationTime: number; // in minutes
  calories?: number;
  allergens: string[];
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  popularity: number; // 1-5 scale
  timesOrdered: number;
  revenue: number;
  profitMargin: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  nutritionalInfo?: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable' | 'limited'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popularity' | 'revenue' | 'orders'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { success, error, info } = useToast();

  const categories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Salads', 'Pizza', 'Pasta', 'Grilled', 'Seafood'];

  // Interactive handlers
  const handleRefreshData = async () => {
    setLoading(true);
    try {
      showInfo('Refreshing menu data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchMenu();
      showSuccess('Menu data refreshed successfully!');
    } catch (error) {
      showError('Failed to refresh menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format: string) => {
    try {
      showInfo(`Preparing ${format.toUpperCase()} export...`);
      const dataStr = JSON.stringify(filteredItems, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu_export_${format}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess(`Menu exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      showError('Failed to export menu data');
    }
  };

  const handleUpdateAvailability = (itemId: string, availability: MenuItem['availability']) => {
    try {
      setMenuItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, availability, updated_at: new Date().toISOString() }
          : item
      ));
      showSuccess(`Item availability updated to ${availability}`);
    } catch (error) {
      showError('Failed to update item availability');
    }
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, availability, updated_at: new Date().toISOString() }
        : item
    ));
    alert(`Item availability updated to ${availability}`);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    alert('Menu item deleted successfully');
  };

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, updated_at: new Date().toISOString() }
        : item
    ));
    alert(`Price updated to ${formatCurrency(newPrice)}`);
  };

  const handleBulkAction = (action: string, selectedIds: string[] = []) => {
    console.log(`Performing bulk action: ${action} on items:`, selectedIds);
    alert(`Bulk action: ${action} (feature in development)`);
  };

  // Generate comprehensive dummy menu data
  const generateDummyMenu = (): MenuItem[] => {
    const dummyItems = [
      {
        name: 'Grilled Salmon Fillet',
        description: 'Fresh Atlantic salmon grilled to perfection, served with lemon butter sauce and seasonal vegetables',
        category: 'Seafood',
        price: 28.99,
        cost: 12.50,
        preparationTime: 20,
        calories: 380,
        allergens: ['Fish'],
        ingredients: ['Salmon', 'Lemon', 'Butter', 'Herbs', 'Vegetables'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isSpicy: false,
        popularity: 5,
        timesOrdered: 245,
        tags: ['Popular', 'Healthy', 'Protein Rich']
      },
      {
        name: 'Chicken Biryani Deluxe',
        description: 'Aromatic basmati rice layered with tender chicken, spices, and saffron, served with raita and pickle',
        category: 'Main Courses',
        price: 22.99,
        cost: 8.75,
        preparationTime: 35,
        calories: 650,
        allergens: ['Dairy'],
        ingredients: ['Basmati Rice', 'Chicken', 'Yogurt', 'Spices', 'Saffron'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isSpicy: true,
        popularity: 5,
        timesOrdered: 412,
        tags: ['Signature', 'Spicy', 'Traditional']
      },
      {
        name: 'Margherita Pizza',
        description: 'Classic wood-fired pizza with fresh mozzarella, tomato sauce, and basil',
        category: 'Pizza',
        price: 18.99,
        cost: 4.25,
        preparationTime: 15,
        calories: 520,
        allergens: ['Gluten', 'Dairy'],
        ingredients: ['Pizza Dough', 'Mozzarella', 'Tomato Sauce', 'Basil'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        popularity: 4,
        timesOrdered: 328,
        tags: ['Classic', 'Vegetarian', 'Popular']
      },
      {
        name: 'Mediterranean Quinoa Salad',
        description: 'Protein-packed quinoa with fresh vegetables, feta cheese, and olive oil dressing',
        category: 'Salads',
        price: 16.99,
        cost: 5.50,
        preparationTime: 10,
        calories: 420,
        allergens: ['Dairy'],
        ingredients: ['Quinoa', 'Cucumber', 'Tomatoes', 'Feta', 'Olive Oil'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        isSpicy: false,
        popularity: 4,
        timesOrdered: 189,
        tags: ['Healthy', 'Vegetarian', 'Light']
      },
      {
        name: 'Beef Rendang',
        description: 'Slow-cooked Indonesian beef curry with coconut and aromatic spices',
        category: 'Main Courses',
        price: 26.99,
        cost: 11.25,
        preparationTime: 45,
        calories: 580,
        allergens: [],
        ingredients: ['Beef', 'Coconut Milk', 'Lemongrass', 'Galangal', 'Chili'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isSpicy: true,
        popularity: 4,
        timesOrdered: 156,
        tags: ['Spicy', 'Traditional', 'Exotic']
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        category: 'Desserts',
        price: 12.99,
        cost: 3.20,
        preparationTime: 12,
        calories: 450,
        allergens: ['Gluten', 'Dairy', 'Eggs'],
        ingredients: ['Dark Chocolate', 'Butter', 'Eggs', 'Flour', 'Sugar'],
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        popularity: 5,
        timesOrdered: 298,
        tags: ['Dessert', 'Popular', 'Indulgent']
      },
      {
        name: 'Vegan Buddha Bowl',
        description: 'Nutrient-dense bowl with roasted vegetables, quinoa, avocado, and tahini dressing',
        category: 'Salads',
        price: 19.99,
        cost: 6.75,
        preparationTime: 15,
        calories: 480,
        allergens: ['Sesame'],
        ingredients: ['Quinoa', 'Roasted Vegetables', 'Avocado', 'Tahini', 'Seeds'],
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        isSpicy: false,
        popularity: 4,
        timesOrdered: 142,
        tags: ['Vegan', 'Healthy', 'Gluten-Free']
      },
      {
        name: 'Fish & Chips Classic',
        description: 'Beer-battered cod with hand-cut chips and mushy peas',
        category: 'Main Courses',
        price: 21.99,
        cost: 8.50,
        preparationTime: 18,
        calories: 720,
        allergens: ['Fish', 'Gluten'],
        ingredients: ['Cod', 'Potatoes', 'Batter', 'Peas', 'Oil'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        popularity: 4,
        timesOrdered: 267,
        tags: ['Classic', 'British', 'Comfort Food']
      },
      {
        name: 'Artisan Coffee Blend',
        description: 'Single-origin Ethiopian coffee blend with notes of chocolate and berries',
        category: 'Beverages',
        price: 4.99,
        cost: 1.20,
        preparationTime: 5,
        calories: 5,
        allergens: [],
        ingredients: ['Coffee Beans', 'Water'],
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        isSpicy: false,
        popularity: 5,
        timesOrdered: 445,
        tags: ['Artisan', 'Coffee', 'Popular']
      },
      {
        name: 'Lobster Thermidor',
        description: 'Luxurious lobster in creamy cognac sauce with cheese gratin topping',
        category: 'Seafood',
        price: 45.99,
        cost: 22.00,
        preparationTime: 30,
        calories: 520,
        allergens: ['Shellfish', 'Dairy'],
        ingredients: ['Lobster', 'Cream', 'Cognac', 'Cheese', 'Herbs'],
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isSpicy: false,
        popularity: 3,
        timesOrdered: 67,
        tags: ['Luxury', 'Premium', 'Special']
      }
    ];

    return dummyItems.map((item, index) => ({
      id: `menu-${index + 1}`,
      ...item,
      revenue: item.timesOrdered * item.price,
      profitMargin: ((item.price - item.cost) / item.price) * 100,
      availability: Math.random() > 0.9 ? (Math.random() > 0.5 ? 'unavailable' : 'limited') : 'available',
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      nutritionalInfo: {
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 50) + 20,
        fat: Math.floor(Math.random() * 25) + 5,
        fiber: Math.floor(Math.random() * 15) + 2
      }
    }));
  };

  const fetchMenu = async () => {
    try {
      // Simulate API call with dummy data
      const dummyMenu = generateDummyMenu();
      setMenuItems(dummyMenu);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesAvailability = availabilityFilter === 'all' || item.availability === availabilityFilter;
      
      return matchesSearch && matchesCategory && matchesAvailability;
    });

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'popularity':
          aVal = a.popularity;
          bVal = b.popularity;
          break;
        case 'revenue':
          aVal = a.revenue;
          bVal = b.revenue;
          break;
        case 'orders':
          aVal = a.timesOrdered;
          bVal = b.timesOrdered;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });

    setFilteredItems(sorted);
  }, [menuItems, searchTerm, categoryFilter, availabilityFilter, sortBy, sortOrder]);

  const getAvailabilityBadge = (availability: MenuItem['availability']) => {
    switch (availability) {
      case 'available':
        return <span className="status-badge status-success">Available</span>;
      case 'limited':
        return <span className="status-badge status-warning">Limited</span>;
      case 'unavailable':
        return <span className="status-badge status-error">Unavailable</span>;
      default:
        return <span className="status-badge status-secondary">Unknown</span>;
    }
  };

  const getAvailabilityIcon = (availability: MenuItem['availability']) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDietaryTags = (item: MenuItem) => {
    const tags = [];
    if (item.isVegetarian) tags.push('Vegetarian');
    if (item.isVegan) tags.push('Vegan');
    if (item.isGlutenFree) tags.push('Gluten-Free');
    if (item.isSpicy) tags.push('Spicy');
    return tags;
  };

  const getPopularityStars = (popularity: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  // Calculate summary statistics
  const summaryStats = {
    total: menuItems.length,
    available: menuItems.filter(item => item.availability === 'available').length,
    unavailable: menuItems.filter(item => item.availability === 'unavailable').length,
    limited: menuItems.filter(item => item.availability === 'limited').length,
    totalRevenue: menuItems.reduce((sum, item) => sum + item.revenue, 0),
    avgPrice: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0,
    avgProfitMargin: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.profitMargin, 0) / menuItems.length : 0,
    topCategory: categories.reduce((top, category) => {
      const count = menuItems.filter(item => item.category === category).length;
      return count > (menuItems.filter(item => item.category === top).length || 0) ? category : top;
    }, categories[0])
  };

  // Chart data
  const categoryData = categories.map(category => ({
    name: category,
    count: menuItems.filter(item => item.category === category).length,
    revenue: menuItems.filter(item => item.category === category).reduce((sum, item) => sum + item.revenue, 0)
  })).filter(item => item.count > 0);

  const availabilityData = [
    { name: 'Available', value: summaryStats.available, color: chartColorSets.status[2] },
    { name: 'Limited', value: summaryStats.limited, color: chartColorSets.status[1] },
    { name: 'Unavailable', value: summaryStats.unavailable, color: chartColorSets.status[0] }
  ].filter(item => item.value > 0);

  const topItems = [...menuItems]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (loading && menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading menu...</p>
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
            <Utensils className="h-8 w-8 text-blue-500 mr-3" />
            Menu Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Manage menu items, pricing, and availability
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
            Export Menu
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => alert('Add new menu item functionality coming soon!')}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Menu Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <KPICard
          title="Total Items"
          value={summaryStats.total}
          format="number"
          change={8.5}
          trend="up"
          icon={<Utensils className="w-6 h-6" />}
          onClick={() => alert('Viewing all menu items')}
          subtitle="in menu"
        />

        <KPICard
          title="Available"
          value={summaryStats.available}
          format="number"
          change={5.2}
          trend="up"
          icon={<CheckCircle className="w-6 h-6" />}
          onClick={() => setAvailabilityFilter('available')}
          subtitle="ready to order"
        />

        <KPICard
          title="Revenue"
          value={summaryStats.totalRevenue}
          format="currency"
          change={12.3}
          trend="up"
          icon={<DollarSign className="w-6 h-6" />}
          onClick={() => alert('Revenue breakdown coming soon!')}
          subtitle="from menu items"
        />

        <KPICard
          title="Avg Price"
          value={summaryStats.avgPrice}
          format="currency"
          change={-2.1}
          trend="down"
          icon={<Tag className="w-6 h-6" />}
          onClick={() => alert('Price analysis coming soon!')}
          subtitle="per item"
        />

        <KPICard
          title="Profit Margin"
          value={summaryStats.avgProfitMargin}
          format="percentage"
          change={4.7}
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          onClick={() => alert('Profit analysis coming soon!')}
          subtitle="average"
        />

        <KPICard
          title="Top Category"
          value={summaryStats.topCategory}
          format="text"
          change={0}
          trend="neutral"
          icon={<Award className="w-6 h-6" />}
          onClick={() => setCategoryFilter(summaryStats.topCategory)}
          subtitle="most items"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Items by Category"
          subtitle="Distribution of menu items across categories"
          exportable
          onExport={() => handleExportData('category-chart')}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill={chartColorSets.categories[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Availability Status"
          subtitle="Current availability distribution"
          exportable
          onExport={() => handleExportData('availability-chart')}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={availabilityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({name, value}) => `${name}: ${value}`}
              >
                {availabilityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Top Performing Items */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performing Items
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => alert('Detailed performance analytics coming soon!')}
            >
              View Analytics
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex">
                    {getPopularityStars(item.popularity)}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.category}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                    <span className="font-medium text-green-600">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Orders:</span>
                    <span className="font-medium">{formatNumber(item.timesOrdered)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search menu items, descriptions, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="unavailable">Unavailable</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="form-input-modern px-3 py-2 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="orders">Sort by Orders</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBulkAction('update-prices')}
              >
                Bulk Update
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {formatNumber(filteredItems.length)} of {formatNumber(menuItems.length)} items
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Table */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blue-500" />
              Menu Items
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<BarChart3 className="w-4 h-4" />}
                onClick={() => alert('Menu analytics dashboard coming soon!')}
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
                    Item Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category & Tags
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pricing & Profit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                          {item.imageUrl ? (
                            <Image className="h-6 w-6 text-gray-400" />
                          ) : (
                            <Utensils className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-64">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{item.preparationTime} mins</span>
                            {item.calories && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{item.calories} cal</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {item.category}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getDietaryTags(item).map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                              +{item.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.price)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Cost: {formatCurrency(item.cost)}
                        </div>
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">
                          {item.profitMargin.toFixed(1)}% margin
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {getPopularityStars(item.popularity)}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatNumber(item.timesOrdered)} orders
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          {formatCurrency(item.revenue)} revenue
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getAvailabilityIcon(item.availability)}
                        {getAvailabilityBadge(item.availability)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Updated {format(new Date(item.updated_at), 'MMM dd')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <select
                          value={item.availability}
                          onChange={(e) => handleUpdateAvailability(item.id, e.target.value as MenuItem['availability'])}
                          className="form-input-modern text-xs px-2 py-1"
                        >
                          <option value="available">Available</option>
                          <option value="limited">Limited</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const newPrice = prompt(`Enter new price for ${item.name}:`, item.price.toString());
                            if (newPrice && !isNaN(Number(newPrice))) {
                              handleUpdatePrice(item.id, Number(newPrice));
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                  <Utensils className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No menu items found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Start building your menu by adding your first item.'
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={() => alert('Add new menu item functionality coming soon!')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add First Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Menu Item Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Menu Item Details - ${selectedItem.name}`}
          size="xl"
        >
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                {selectedItem.imageUrl ? (
                  <Image className="h-12 w-12 text-gray-400" />
                ) : (
                  <Utensils className="h-12 w-12 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedItem.name}
                  </h3>
                  {getAvailabilityBadge(selectedItem.availability)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {selectedItem.description}
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex">
                    {getPopularityStars(selectedItem.popularity)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedItem.popularity}/5 stars
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getDietaryTags(selectedItem).map((tag, index) => (
                    <span key={index} className="inline-block px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {selectedItem.tags.map((tag, index) => (
                    <span key={index} className="inline-block px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedItem.price)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cost: {formatCurrency(selectedItem.cost)}
                </div>
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                  {selectedItem.profitMargin.toFixed(1)}% profit
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Times Ordered</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(selectedItem.timesOrdered)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(selectedItem.revenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Prep Time</p>
                      <p className="text-xl font-bold text-orange-600">{selectedItem.preparationTime}m</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Item Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedItem.calories || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Preparation Time:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedItem.preparationTime} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Profit Margin:</span>
                    <span className="text-green-600 font-medium">{selectedItem.profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ingredients & Allergens</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Main Ingredients:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.ingredients.map((ingredient, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedItem.allergens.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Allergens:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.allergens.map((allergen, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedItem.nutritionalInfo && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nutritional Information (per serving)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem.nutritionalInfo.protein}g</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem.nutritionalInfo.carbs}g</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem.nutritionalInfo.fat}g</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem.nutritionalInfo.fiber}g</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fiber</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Created: {format(new Date(selectedItem.created_at), 'MMMM dd, yyyy')}</p>
                  <p>Last Updated: {format(new Date(selectedItem.updated_at), 'MMMM dd, yyyy')}</p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => alert('Menu item analytics coming soon!')}
                  >
                    View Analytics
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={() => alert('Edit menu item functionality coming soon!')}
                    icon={<Edit className="h-4 w-4" />}
                  >
                    Edit Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MenuPage;