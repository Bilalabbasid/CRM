import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import KPICard from '../components/ui/KPICard';
import ChartWrapper from '../components/ui/ChartWrapper';
import { Clock, MessageSquare, Clipboard, ShoppingCart, Box, Calendar, Menu, BookOpen, Users, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StaffDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [shiftOverview, setShiftOverview] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [inventoryTasks, setInventoryTasks] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Rich dummy data for Staff dashboard
  const dummyAssignedOrders = [
    { _id: 'ord_1', orderNumber: 'ORD-001', table: 'Table 12', status: 'preparing', specialInstructions: 'No onions on the burger', totalAmount: 42.50, items: ['Burger', 'Fries', 'Coke'], estimatedTime: '15 min' },
    { _id: 'ord_2', orderNumber: 'ORD-002', table: 'Table 7', status: 'ready', specialInstructions: 'Extra sauce please', totalAmount: 28.75, items: ['Pizza Margherita', 'Garlic Bread'], estimatedTime: '5 min' },
    { _id: 'ord_3', orderNumber: 'ORD-003', deliveryDetails: { address: '123 Main St' }, status: 'preparing', specialInstructions: '', totalAmount: 35.00, items: ['Caesar Salad', 'Grilled Chicken'], estimatedTime: '20 min' },
    { _id: 'ord_4', orderNumber: 'ORD-004', table: 'Table 15', status: 'serving', specialInstructions: 'Birthday celebration - add candle', totalAmount: 67.25, items: ['Pasta', 'Wine', 'Tiramisu'], estimatedTime: '2 min' }
  ];

  const dummyShiftOverview = {
    onShift: [
      { id: 1, name: 'Sarah Johnson', role: 'Waitress', shift: { start: '2024-01-15T14:00:00Z', end: '2024-01-15T22:00:00Z' }, status: 'active' },
      { id: 2, name: 'Mike Chen', role: 'Chef', shift: { start: '2024-01-15T13:00:00Z', end: '2024-01-15T21:00:00Z' }, status: 'active' },
      { id: 3, name: 'Emily Davis', role: 'Bartender', shift: { start: '2024-01-15T16:00:00Z', end: '2024-01-16T00:00:00Z' }, status: 'break' },
      { id: 4, name: 'Carlos Rodriguez', role: 'Server', shift: { start: '2024-01-15T12:00:00Z', end: '2024-01-15T20:00:00Z' }, status: 'active' }
    ],
    myShift: { start: '2024-01-15T15:00:00Z', end: '2024-01-15T23:00:00Z', breakTime: '18:30', hoursWorked: 5.5 },
    upcomingShifts: [
      { date: '2024-01-16', start: '15:00', end: '23:00', role: 'Server' },
      { date: '2024-01-17', start: '14:00', end: '22:00', role: 'Server' },
      { date: '2024-01-19', start: '16:00', end: '24:00', role: 'Server' }
    ]
  };

  const dummyPerformance = {
    metrics: {
      totalOrders: 23,
      averageOrderTime: 12,
      totalTips: 145.50,
      customerRating: 4.8,
      tasksCompleted: 18,
      punctualityScore: 98
    },
    weeklyStats: [
      { day: 'Mon', orders: 15, tips: 120, rating: 4.7 },
      { day: 'Tue', orders: 18, tips: 135, rating: 4.9 },
      { day: 'Wed', orders: 22, tips: 165, rating: 4.6 },
      { day: 'Thu', orders: 20, tips: 145, rating: 4.8 },
      { day: 'Fri', orders: 25, tips: 180, rating: 4.9 },
      { day: 'Sat', orders: 28, tips: 195, rating: 4.7 },
      { day: 'Sun', orders: 23, tips: 145, rating: 4.8 }
    ],
    achievements: [
      { title: 'Speed Demon', description: 'Served 20+ orders in under 15 mins average', earned: true },
      { title: 'Customer Favorite', description: 'Maintained 4.8+ rating for a week', earned: true },
      { title: 'Team Player', description: 'Helped colleagues during rush hour', earned: false }
    ]
  };

  const dummyInventoryTasks = {
    lowStock: [
      { _id: 'inv_1', name: 'Tomatoes', quantity: 3, unit: 'kg', lowStockThreshold: 5, urgency: 'high' },
      { _id: 'inv_2', name: 'Mozzarella Cheese', quantity: 2, unit: 'blocks', lowStockThreshold: 4, urgency: 'medium' },
      { _id: 'inv_3', name: 'Olive Oil', quantity: 1, unit: 'bottles', lowStockThreshold: 3, urgency: 'high' },
      { _id: 'inv_4', name: 'Bread Rolls', quantity: 12, unit: 'pieces', lowStockThreshold: 20, urgency: 'low' }
    ],
    prepTasks: [
      { _id: 'prep_1', title: 'Prep Caesar Salad Mix', note: 'For dinner rush', priority: 'high', estimatedTime: '15 min' },
      { _id: 'prep_2', title: 'Slice vegetables', note: 'Onions, peppers, mushrooms', priority: 'medium', estimatedTime: '20 min' },
      { _id: 'prep_3', title: 'Marinate chicken', note: 'For tomorrow\'s specials', priority: 'low', estimatedTime: '10 min' }
    ],
    alerts: [
      { type: 'urgent', message: 'Tomatoes critically low - order today!' },
      { type: 'info', message: '5 items expiring within 2 days' }
    ]
  };

  const dummyMessages = [
    { _id: 'msg_1', from: 'Manager Sarah', fromName: 'Sarah Wilson', text: 'Great job on the rush today team! Customer feedback has been excellent.', createdAt: '2024-01-15T10:30:00Z', type: 'praise' },
    { _id: 'msg_2', from: 'Chef Mike', fromName: 'Mike Thompson', text: 'New special today: Grilled Salmon with herbs. Please inform customers about this option.', createdAt: '2024-01-15T09:15:00Z', type: 'announcement' },
    { _id: 'msg_3', from: 'HR', fromName: 'HR Department', text: 'Reminder: Staff meeting tomorrow at 2 PM. Attendance mandatory.', createdAt: '2024-01-15T08:00:00Z', type: 'reminder' },
    { _id: 'msg_4', from: 'Team Lead', fromName: 'Alex Johnson', text: 'Table 8 has dietary restrictions - please check with kitchen before serving.', createdAt: '2024-01-15T16:45:00Z', type: 'alert' }
  ];

  const dummyReservations = [
    { _id: 'res_1', customerName: 'John Smith', date: '2024-01-15T19:00:00Z', table: 'Table 10', partySize: 4, notes: 'Anniversary dinner - prepare surprise dessert', status: 'confirmed' },
    { _id: 'res_2', customer: { name: 'Maria Garcia' }, date: '2024-01-15T20:30:00Z', table: 'Table 5', partySize: 2, notes: 'First date - quiet table preferred', status: 'confirmed' },
    { _id: 'res_3', customerName: 'Robert Wilson', date: '2024-01-15T18:15:00Z', table: 'Table 12', partySize: 6, notes: 'Business dinner - separate checks', status: 'seated' },
    { _id: 'res_4', customerName: 'Lisa Chen', date: '2024-01-15T21:00:00Z', table: 'Table 3', partySize: 3, notes: 'Vegetarian meal requests', status: 'pending' }
  ];

  const dummyTraining = [
    { _id: 'tr_1', title: 'Food Safety Checklist', type: 'checklist', status: 'completed', items: ['Wash hands before handling food', 'Check food temperatures', 'Store ingredients properly', 'Clean surfaces regularly'], dueDate: '2024-01-20' },
    { _id: 'tr_2', title: 'Customer Service Excellence', type: 'module', status: 'in-progress', progress: 75, description: 'Learn advanced customer interaction techniques', dueDate: '2024-01-25' },
    { _id: 'tr_3', title: 'Wine Pairing Basics', type: 'module', status: 'not-started', progress: 0, description: 'Understanding wine and food combinations', dueDate: '2024-02-01' },
    { _id: 'tr_4', title: 'Emergency Procedures', type: 'checklist', status: 'completed', items: ['Know fire exits', 'First aid kit location', 'Emergency contact numbers', 'Evacuation procedures'], dueDate: '2024-01-18' }
  ];

  const dummyMenuItems = [
    { _id: 'menu_1', name: 'Margherita Pizza', category: 'Pizza', price: 18.99, ingredients: ['Tomato sauce', 'Mozzarella', 'Basil'], available: true, allergies: ['Gluten', 'Dairy'] },
    { _id: 'menu_2', name: 'Caesar Salad', category: 'Salads', price: 12.99, ingredients: ['Romaine lettuce', 'Parmesan', 'Croutons', 'Caesar dressing'], available: true, allergies: ['Gluten', 'Dairy'] },
    { _id: 'menu_3', name: 'Grilled Salmon', category: 'Mains', price: 26.99, ingredients: ['Fresh salmon', 'Herbs', 'Lemon', 'Vegetables'], available: true, allergies: ['Fish'] },
    { _id: 'menu_4', name: 'Chocolate Brownie', category: 'Desserts', price: 8.99, ingredients: ['Chocolate', 'Flour', 'Eggs', 'Butter'], available: false, allergies: ['Gluten', 'Dairy', 'Eggs'] },
    { _id: 'menu_5', name: 'Craft Beer', category: 'Beverages', price: 6.99, description: 'Local brewery selection', available: true, allergies: ['Gluten'] }
  ];

  const markComplete = async (orderId: string) => {
    try {
      const svc = api as any;
      if (svc.updateAssignedOrderStatus) await svc.updateAssignedOrderStatus(orderId, { status: 'completed' });
      setAssignedOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
    } catch (err) {
      console.warn('could not mark complete', err);
    }
  };

  const [messageText, setMessageText] = useState('');
  const postMessage = async () => {
    if (!messageText.trim()) return;
    try {
      const svc = api as any;
      const resp = svc.postMessage ? await svc.postMessage({ text: messageText }) : null;
      const newMsg = resp?.data || resp || { text: messageText, fromName: profile?.name || 'You', createdAt: new Date().toISOString() };
      setMessages(prev => [newMsg, ...prev]);
      setMessageText('');
    } catch (err) {
      console.warn('post message err', err);
    }
  };

  const [availability, setAvailability] = useState({ date: '', start: '', end: '', note: '' });
  const submitAvailability = async () => {
    try {
      const svc = api as any;
      if (svc.submitAvailability) await svc.submitAvailability(availability);
      setMessages(prev => [{ text: `Availability submitted for ${availability.date}`, fromName: profile?.name || 'You', createdAt: new Date().toISOString() }, ...prev]);
      setAvailability({ date: '', start: '', end: '', note: '' });
    } catch (err) {
      console.warn('availability submit err', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      try {
        const staffId = profile._id;
        // Try to load real data, fallback to dummy data
        const [ordersRes, shiftRes, perfRes, invRes, msgsRes, resvRes, trRes, menuRes] = await Promise.allSettled([
          (api as any).getAssignedOrders ? (api as any).getAssignedOrders({ staffId }) : Promise.resolve(null),
          (api as any).getShiftOverview ? (api as any).getShiftOverview() : Promise.resolve(null),
          (api as any).getStaffPerformance ? (api as any).getStaffPerformance(staffId) : Promise.resolve(null),
          (api as any).getInventoryTasks ? (api as any).getInventoryTasks() : Promise.resolve(null),
          (api as any).getMessages ? (api as any).getMessages() : Promise.resolve(null),
          (api as any).getReservationsForStaff ? (api as any).getReservationsForStaff({ staffId }) : Promise.resolve(null),
          (api as any).getTrainingModules ? (api as any).getTrainingModules() : Promise.resolve(null),
          api.getMenu ? api.getMenu() : Promise.resolve(null)
        ]);

        // Set data with fallbacks to dummy data
        setAssignedOrders(ordersRes.status === 'fulfilled' && ordersRes.value ? (ordersRes.value.orders || ordersRes.value || []) : dummyAssignedOrders);
        setShiftOverview(shiftRes.status === 'fulfilled' && shiftRes.value ? shiftRes.value : dummyShiftOverview);
        setPerformance(perfRes.status === 'fulfilled' && perfRes.value ? perfRes.value : dummyPerformance);
        setInventoryTasks(invRes.status === 'fulfilled' && invRes.value ? invRes.value : dummyInventoryTasks);
        setMessages(msgsRes.status === 'fulfilled' && msgsRes.value ? (msgsRes.value.messages || msgsRes.value || []) : dummyMessages);
        setReservations(resvRes.status === 'fulfilled' && resvRes.value ? (resvRes.value.reservations || resvRes.value || []) : dummyReservations);
        setTraining(trRes.status === 'fulfilled' && trRes.value ? (trRes.value.modules || trRes.value || []) : dummyTraining);
        setMenuItems(menuRes.status === 'fulfilled' && menuRes.value ? (menuRes.value.items || menuRes.value || []) : dummyMenuItems);
      } catch (err) {
        console.warn('staff dashboard load error', err);
        // Use all dummy data on error
        setAssignedOrders(dummyAssignedOrders);
        setShiftOverview(dummyShiftOverview);
        setPerformance(dummyPerformance);
        setInventoryTasks(dummyInventoryTasks);
        setMessages(dummyMessages);
        setReservations(dummyReservations);
        setTraining(dummyTraining);
        setMenuItems(dummyMenuItems);
      }
    };
    load();
  }, [profile]);

  if (!profile) return <div className="p-6">Please login</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'serving': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.name}! 👋</h1>
          <p className="text-lg text-gray-600">Staff Dashboard — Your daily workspace for orders, shifts, and tasks</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Current Time</div>
          <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard title="Active Orders" value={assignedOrders.filter(o => o.status !== 'completed').length} subtitle="assigned to you" color="bg-blue-50" />
        <KPICard title="Today's Tips" value={`$${performance?.metrics?.totalTips || 145.50}`} subtitle="earned so far" color="bg-green-50" />
        <KPICard title="Avg Service Time" value={`${performance?.metrics?.averageOrderTime || 12} min`} subtitle="per order" color="bg-purple-50" />
        <KPICard title="Customer Rating" value={`${performance?.metrics?.customerRating || 4.8} ⭐`} subtitle="this week" color="bg-yellow-50" />
        <KPICard title="Hours Today" value={`${shiftOverview?.myShift?.hoursWorked || 5.5}h`} subtitle="shift progress" color="bg-indigo-50" />
        <KPICard title="Tasks Done" value={performance?.metrics?.tasksCompleted || 18} subtitle="completed today" color="bg-pink-50" />
      </div>

      {/* Section 1: Orders & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">🛎️ Active Orders</h3>
                <p className="text-sm text-gray-500">Orders assigned to you - {assignedOrders.filter(o => o.status !== 'completed').length} active</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {assignedOrders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">#{order.orderNumber}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.table || order.deliveryDetails?.address || 'Takeout'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Items: {order.items?.join(', ') || 'N/A'} • ${order.totalAmount}
                      </div>
                      {order.specialInstructions && (
                        <div className="text-xs text-orange-600 mt-1 bg-orange-50 p-1 rounded">
                          📝 {order.specialInstructions}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">ETA: {order.estimatedTime}</div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {order.status !== 'completed' && (
                        <button onClick={() => markComplete(order._id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          ✓ Complete
                        </button>
                      )}
                      <button onClick={() => navigator.clipboard?.writeText(order.orderNumber)} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {assignedOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No orders assigned yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">📊 Today's Performance</h3>
                <p className="text-sm text-gray-500">Your achievements and metrics</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Performance metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-700">{performance?.metrics?.totalOrders || 23}</div>
                  <div className="text-xs text-blue-600">Orders Served</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-2xl font-bold text-green-700">{performance?.metrics?.punctualityScore || 98}%</div>
                  <div className="text-xs text-green-600">Punctuality</div>
                </div>
              </div>
              
              {/* Achievements */}
              <div>
                <div className="text-sm font-medium mb-2">🏆 Achievements</div>
                <div className="space-y-2">
                  {performance?.achievements?.map((achievement: any, idx: number) => (
                    <div key={idx} className={`text-xs p-2 rounded ${achievement.earned ? 'bg-yellow-50 text-yellow-800' : 'bg-gray-50 text-gray-600'}`}>
                      <div className="flex items-center">
                        {achievement.earned ? '🏅' : '⚪'} <span className="ml-1 font-medium">{achievement.title}</span>
                      </div>
                      <div className="text-xs mt-1">{achievement.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Weekly performance chart */}
              <ChartWrapper title="Weekly Tips Trend">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={performance?.weeklyStats || []}>
                    <XAxis dataKey="day" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="tips" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Shift & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">⏰ Current Shift & Schedule</h3>
                <p className="text-sm text-gray-500">Your shift details and upcoming schedule</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current shift info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Current Shift</div>
                <div className="text-lg font-bold text-blue-900">
                  {shiftOverview?.myShift ? 
                    `${new Date(shiftOverview.myShift.start).toLocaleTimeString()} - ${new Date(shiftOverview.myShift.end).toLocaleTimeString()}` : 
                    '3:00 PM - 11:00 PM'
                  }
                </div>
                <div className="text-sm text-blue-600">Break at: {shiftOverview?.myShift?.breakTime || '6:30 PM'}</div>
                <div className="text-xs text-blue-500 mt-1">Hours worked: {shiftOverview?.myShift?.hoursWorked || 5.5}h</div>
              </div>

              {/* Team on shift */}
              <div>
                <div className="text-sm font-medium mb-2">👥 Team Currently On Shift</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {shiftOverview?.onShift?.map((staff: any) => (
                    <div key={staff.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-gray-500 ml-2">{staff.role}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${staff.status === 'active' ? 'bg-green-500' : staff.status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                        <span className="text-xs">{staff.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming shifts */}
              <div>
                <div className="text-sm font-medium mb-2">📅 Upcoming Shifts</div>
                <div className="space-y-1">
                  {shiftOverview?.upcomingShifts?.map((shift: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{shift.date}</span>
                      <span className="text-gray-500">{shift.start} - {shift.end}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">🗂️ Shift Availability</h3>
                <p className="text-sm text-gray-500">Request time off or swap shifts</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <input 
                  type="date" 
                  value={availability.date} 
                  onChange={e=>setAvailability(s=>({...s,date:e.target.value}))} 
                  className="p-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="time" 
                    value={availability.start} 
                    onChange={e=>setAvailability(s=>({...s,start:e.target.value}))} 
                    placeholder="Start time" 
                    className="p-2 border rounded"
                  />
                  <input 
                    type="time" 
                    value={availability.end} 
                    onChange={e=>setAvailability(s=>({...s,end:e.target.value}))} 
                    placeholder="End time" 
                    className="p-2 border rounded"
                  />
                </div>
                <textarea 
                  value={availability.note} 
                  onChange={e=>setAvailability(s=>({...s,note:e.target.value}))} 
                  placeholder="Reason for request (optional)" 
                  className="p-2 border rounded"
                  rows={2}
                />
                <button 
                  onClick={submitAvailability} 
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Inventory & Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">📦 Inventory & Tasks</h3>
              <p className="text-sm text-gray-500">Low stock alerts and prep tasks</p>
            </div>
            <Box className="h-8 w-8 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Low Stock Alerts */}
            <div>
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-700">Low Stock Items</span>
              </div>
              <div className="space-y-2">
                {inventoryTasks?.lowStock?.map((item: any) => (
                  <div key={item._id} className="border rounded p-2 bg-red-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className={`text-sm font-bold ${item.urgency === 'high' ? 'text-red-600' : item.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">Threshold: {item.lowStockThreshold} {item.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep Tasks */}
            <div>
              <div className="flex items-center mb-3">
                <Clipboard className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-700">Prep Tasks</span>
              </div>
              <div className="space-y-2">
                {inventoryTasks?.prepTasks?.map((task: any) => (
                  <div key={task._id} className="border rounded p-2 bg-blue-50">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-600">{task.note}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                      <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div>
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-700">System Alerts</span>
              </div>
              <div className="space-y-2">
                {inventoryTasks?.alerts?.map((alert: any, idx: number) => (
                  <div key={idx} className={`border rounded p-2 ${alert.type === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`text-sm ${alert.type === 'urgent' ? 'text-red-700' : 'text-blue-700'}`}>
                      {alert.type === 'urgent' ? '🚨' : 'ℹ️'} {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Menu Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">🍽️ Menu Reference</h3>
              <p className="text-sm text-gray-500">Quick access to menu items and specials</p>
            </div>
            <Menu className="h-8 w-8 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item: any) => (
              <div key={item._id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 mb-1">{item.category}</div>
                    <div className="text-lg font-bold text-green-600">${item.price}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${item.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
                {item.ingredients && (
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Ingredients:</span> {item.ingredients.join(', ')}
                  </div>
                )}
                {item.allergies && item.allergies.length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    <span className="font-medium">⚠️ Allergies:</span> {item.allergies.join(', ')}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Communication & Messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">💬 Team Communication</h3>
              <p className="text-sm text-gray-500">Messages and announcements</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message feed */}
            <div>
              <div className="text-sm font-medium mb-3">Recent Messages</div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((message: any) => (
                  <div key={message._id} className={`border rounded p-3 ${
                    message.type === 'praise' ? 'bg-green-50 border-green-200' :
                    message.type === 'alert' ? 'bg-red-50 border-red-200' :
                    message.type === 'reminder' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{message.fromName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm mt-1">{message.text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.type === 'praise' ? '🎉 Praise' :
                       message.type === 'alert' ? '⚠️ Alert' :
                       message.type === 'reminder' ? '⏰ Reminder' :
                       '📢 Announcement'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post message */}
            <div>
              <div className="text-sm font-medium mb-3">Send Message to Team</div>
              <div className="space-y-3">
                <textarea 
                  value={messageText} 
                  onChange={e=>setMessageText(e.target.value)} 
                  className="w-full p-3 border rounded" 
                  placeholder="Write a message to the team..." 
                  rows={4}
                />
                <button 
                  onClick={postMessage} 
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📤 Send Message
                </button>
              </div>

              {/* Quick message templates */}
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-600 mb-2">Quick Templates:</div>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    "Need help with Table X",
                    "Running low on [item]",
                    "Customer has special request",
                    "Break time - back in 15 mins"
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessageText(template)}
                      className="text-left text-xs p-2 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">📅 Reservations Management</h3>
              <p className="text-sm text-gray-500">Upcoming reservations assigned to you</p>
            </div>
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's reservations */}
            <div>
              <div className="text-sm font-medium mb-3">Today's Reservations</div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reservations.map((reservation: any) => (
                  <div key={reservation._id} className={`border rounded-lg p-3 ${
                    reservation.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                    reservation.status === 'seated' ? 'bg-blue-50 border-blue-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm">
                          {reservation.customer?.name || reservation.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Party of {reservation.partySize} • {reservation.table}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(reservation.date).toLocaleTimeString()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          reservation.status === 'seated' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reservation.status}
                        </div>
                      </div>
                    </div>
                    {reservation.notes && (
                      <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded">
                        📝 {reservation.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reservation timeline */}
            <div>
              <div className="text-sm font-medium mb-3">Timeline View</div>
              <div className="space-y-2">
                <ChartWrapper title="Today's Reservation Schedule">
                  <div className="space-y-2">
                    {reservations
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((res, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="text-xs text-gray-500 w-16">
                            {new Date(res.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex-1 h-2 bg-gray-200 rounded relative">
                            <div className={`absolute left-0 h-full rounded ${
                              res.status === 'confirmed' ? 'bg-green-400' :
                              res.status === 'seated' ? 'bg-blue-400' :
                              'bg-yellow-400'
                            }`} style={{ width: '60%' }}></div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {res.customer?.name || res.customerName}
                          </div>
                        </div>
                      ))}
                  </div>
                </ChartWrapper>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Training & Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">🎓 Training & Compliance</h3>
              <p className="text-sm text-gray-500">Required training and certification tracking</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training modules */}
            <div>
              <div className="text-sm font-medium mb-3">Training Modules</div>
              <div className="space-y-3">
                {training.map((module: any) => (
                  <div key={module._id} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{module.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {new Date(module.dueDate).toLocaleDateString()}
                        </div>
                        {module.description && (
                          <div className="text-xs text-gray-600 mt-1">{module.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${
                          module.status === 'completed' ? 'bg-green-100 text-green-700' :
                          module.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {module.status === 'completed' ? '✅' : module.status === 'in-progress' ? '🔄' : '⏳'} {module.status}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for modules */}
                    {module.type === 'module' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{module.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${module.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Checklist items */}
                    {module.type === 'checklist' && module.items && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-600 mb-2">Checklist Items:</div>
                        <ul className="space-y-1">
                          {module.items.map((item: string, idx: number) => (
                            <li key={idx} className="text-xs flex items-center">
                              <span className="text-green-500 mr-2">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance summary */}
            <div>
              <div className="text-sm font-medium mb-3">Compliance Overview</div>
              <div className="space-y-4">
                {/* Completion stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((training.filter(t => t.status === 'completed').length / training.length) * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">Training Complete</div>
                  </div>
                </div>

                {/* Training stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-lg font-bold text-green-700">
                      {training.filter(t => t.status === 'completed').length}
                    </div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-lg font-bold text-blue-700">
                      {training.filter(t => t.status === 'in-progress').length}
                    </div>
                    <div className="text-xs text-blue-600">In Progress</div>
                  </div>
                </div>

                {/* Upcoming deadlines */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">⚠️ Upcoming Deadlines</div>
                  <div className="space-y-1">
                    {training
                      .filter(t => t.status !== 'completed')
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 3)
                      .map((module, idx) => (
                        <div key={idx} className="text-xs flex justify-between">
                          <span>{module.title}</span>
                          <span className="text-red-600">{new Date(module.dueDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboard;
