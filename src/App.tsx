import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { Dashboard } from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import { Customers } from './pages/Customers';
import Reservations from './pages/Reservations';
import Orders from './pages/Orders';
import MenuPage from './pages/Menu';
import Analytics from './pages/Analytics';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/customers" element={<ProtectedRoute requiredRoles={[ 'admin', 'manager' ]}><Customers /></ProtectedRoute>} />
                      <Route path="/reservations" element={<ProtectedRoute requiredRoles={[ 'staff', 'manager', 'admin' ]}><Reservations /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute requiredRoles={[ 'staff', 'manager', 'admin' ]}><Orders /></ProtectedRoute>} />
                      <Route path="/menu" element={<ProtectedRoute requiredRoles={[ 'admin', 'manager' ]}><MenuPage /></ProtectedRoute>} />
                      <Route path="/inventory" element={<ProtectedRoute requiredRoles={[ 'staff', 'manager', 'admin' ]}><Inventory /></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute requiredRoles={[ 'admin', 'manager' ]}><Analytics /></ProtectedRoute>} />
                      <Route path="/owner" element={<ProtectedRoute requiredRoles={[ 'admin', 'owner' ]}><OwnerDashboard /></ProtectedRoute>} />
                      <Route path="/manager" element={<ProtectedRoute requiredRoles={[ 'admin', 'manager' ]}><ManagerDashboard /></ProtectedRoute>} />
                      <Route path="/staff" element={<ProtectedRoute requiredRoles={[ 'admin', 'manager', 'staff' ]}><Staff /></ProtectedRoute>} />
                      <Route path="/staff/dashboard" element={<ProtectedRoute requiredRoles={[ 'staff', 'manager', 'admin' ]}><StaffDashboard /></ProtectedRoute>} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;