@@ .. @@
 import React from 'react';
 import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
-import { AuthProvider } from './components/AuthProvider';
-import { ProtectedRoute } from './components/ProtectedRoute';
+import { AuthProvider } from './hooks/useAuth';
+import ProtectedRoute from './components/ProtectedRoute';
 import { Layout } from './components/Layout';
-import { LoginForm } from './components/auth/LoginForm';
-import { RegisterForm } from './components/auth/RegisterForm';
+import LoginForm from './components/auth/LoginForm';
+import RegisterForm from './components/auth/RegisterForm';
 import { Dashboard } from './pages/Dashboard';
 import { Customers } from './pages/Customers';
+import { Orders } from './pages/Orders';
+import { Menu } from './pages/Menu';
+import { Reservations } from './pages/Reservations';
+import { Analytics } from './pages/Analytics';
+import { Staff } from './pages/Staff';
+import { Settings } from './pages/Settings';
 
 function App() {
   return (
   )
 }
@@ -25,12 +31,12 @@ function App() {
                   <Routes>
                     <Route path="/" element={<Dashboard />} />
                     <Route path="/customers" element={<Customers />} />
-                    <Route path="/reservations" element={<div className="p-8 text-center text-gray-500">Reservations page coming soon...</div>} />
-                    <Route path="/orders" element={<div className="p-8 text-center text-gray-500">Orders page coming soon...</div>} />
-                    <Route path="/menu" element={<div className="p-8 text-center text-gray-500">Menu page coming soon...</div>} />
-                    <Route path="/analytics" element={<div className="p-8 text-center text-gray-500">Analytics page coming soon...</div>} />
-                    <Route path="/staff" element={<div className="p-8 text-center text-gray-500">Staff page coming soon...</div>} />
-                    <Route path="/settings" element={<div className="p-8 text-center text-gray-500">Settings page coming soon...</div>} />
+                    <Route path="/reservations" element={<Reservations />} />
+                    <Route path="/orders" element={<Orders />} />
+                    <Route path="/menu" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><Menu /></ProtectedRoute>} />
+                    <Route path="/analytics" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><Analytics /></ProtectedRoute>} />
+                    <Route path="/staff" element={<ProtectedRoute requiredRoles={['admin']}><Staff /></ProtectedRoute>} />
+                    <Route path="/settings" element={<Settings />} />
                     <Route path="*" element={<Navigate to="/" replace />} />
                   </Routes>
                 </Layout>
}