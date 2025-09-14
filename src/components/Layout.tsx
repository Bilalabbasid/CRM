import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LucideIcon } from 'lucide-react';
import {
  Users,
  Calendar,
  ShoppingBag,
  Menu as MenuIcon,
  Box,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  Search,
  X,
  ChefHat,
  ClipboardList,
  TrendingUp,
  FileText,
  Shield,
  Clock,
  Target,
  Utensils,
  Building2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  section?: string;
}

const ROLE_NAV: Record<string, Array<NavItem>> = {
  admin: [
    // Core Management
    { name: 'Admin Dashboard', href: '/', icon: Shield, section: 'Administration' },
    { name: 'Owner Dashboard', href: '/owner', icon: Building2 },
    { name: 'Manager Dashboard', href: '/manager', icon: Target },
    
    // Operations
    { name: 'Orders', href: '/orders', icon: ShoppingBag, section: 'Operations' },
    { name: 'Reservations', href: '/reservations', icon: Calendar },
    { name: 'Menu Management', href: '/menu', icon: Utensils },
    { name: 'Inventory', href: '/inventory', icon: Box },
    
    // People & Analytics
    { name: 'Customers', href: '/customers', icon: Users, section: 'Management' },
    { name: 'Staff Management', href: '/staff', icon: UserCheck },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
    
    // Settings
    { name: 'Settings', href: '/settings', icon: Settings, section: 'System' }
  ],
  
  owner: [
    // Executive Overview
    { name: 'Owner Dashboard', href: '/owner', icon: Building2, section: 'Executive' },
    { name: 'Business Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Financial Reports', href: '/reports', icon: FileText },
    
    // High-Level Management
    { name: 'Customer Insights', href: '/customers', icon: Users, section: 'Insights' },
    { name: 'Staff Overview', href: '/staff', icon: UserCheck },
    { name: 'Menu Performance', href: '/menu', icon: Utensils },
    
    // Configuration
    { name: 'System Settings', href: '/settings', icon: Settings, section: 'Configuration' }
  ],
  
  manager: [
    // Daily Operations
    { name: 'Manager Dashboard', href: '/manager', icon: Target, section: 'Operations' },
    { name: 'Orders', href: '/orders', icon: ShoppingBag, badge: '12' },
    { name: 'Reservations', href: '/reservations', icon: Calendar, badge: '5' },
    { name: 'Kitchen Orders', href: '/kitchen', icon: ChefHat },
    
    // Inventory & Menu
    { name: 'Inventory', href: '/inventory', icon: Box, section: 'Resources' },
    { name: 'Menu Items', href: '/menu', icon: Utensils },
    
    // Team & Analytics  
    { name: 'Staff Shifts', href: '/staff', icon: UserCheck, section: 'Team' },
    { name: 'Customer Service', href: '/customers', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Daily Reports', href: '/reports', icon: ClipboardList },
    
    // Settings
    { name: 'Settings', href: '/settings', icon: Settings, section: 'Configuration' }
  ],
  
  staff: [
    // My Work
    { name: 'My Dashboard', href: '/staff/dashboard', icon: UserCheck, section: 'My Work' },
    { name: 'My Shift', href: '/staff/shift', icon: Clock },
    { name: 'Assigned Orders', href: '/orders?assigned=me', icon: ShoppingBag, badge: '3' },
    
    // Daily Tasks
    { name: 'Today\'s Reservations', href: '/reservations', icon: Calendar, section: 'Tasks' },
    { name: 'Menu Items', href: '/menu', icon: Utensils },
    { name: 'Inventory Check', href: '/inventory', icon: Box },
    
    // Support
    { name: 'Customer Service', href: '/customers', icon: Users, section: 'Support' },
    { name: 'Help & Training', href: '/staff/help', icon: FileText },
    { name: 'My Settings', href: '/settings', icon: Settings }
  ]
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const roleKey = (profile?.role || 'staff').toLowerCase();
  const filteredNavigation = ROLE_NAV[roleKey] || ROLE_NAV.staff;

  // Group navigation items by section
  const groupedNavigation = filteredNavigation.reduce((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex lg:flex-col transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
              <div className="flex items-center">
                <MenuIcon className="h-8 w-8 text-white" />
                <div className="ml-3">
                  <span className="text-xl font-bold text-white">RestaurantCRM</span>
                  <div className="text-xs text-blue-100 capitalize">{profile?.role || 'User'} Portal</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-blue-100 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              {Object.entries(groupedNavigation).map(([section, items]) => (
                <div key={section} className="mb-6">
                  {section !== 'Main' && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">
                        {section}
                      </h3>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* User Profile & Sign Out */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <div className="flex items-center mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {profile?.name || 'User Name'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                    {profile?.role || 'Staff'} • {profile?.email || 'No email'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 flex-shrink-0">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <MenuIcon className="h-6 w-6" />
                  </button>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders, customers, menu..."
                      className="pl-10 pr-4 py-2.5 w-64 lg:w-80 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Quick Actions based on role */}
                  {(profile?.role === 'manager' || profile?.role === 'admin') && (
                    <button className="hidden sm:flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      New Order
                    </button>
                  )}
                  
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  
                  <button 
                    className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                  </button>

                  {/* User Avatar for larger screens */}
                  <div className="hidden sm:flex items-center">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};