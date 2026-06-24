import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import OpdQueue from './pages/OpdQueue';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';

// ProtectedRoute checks authentication and optionally verifies role-based permissions
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--brand-muted)', borderTopColor: 'var(--brand)' }}></div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Loading HIMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// PublicOnlyRoute prevents logged in users from seeing login / forgot-password
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Private Routes (Inside DashboardLayout) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="change-password"
              element={<ChangePassword />}
            />
            <Route
              path="doctors"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                  <Doctors />
                </ProtectedRoute>
              }
            />
            <Route
              path="patients"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="opd"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Doctor']}>
                  <OpdQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="prescriptions"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Pharmacist']}>
                  <Prescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="billing"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Pharmacist']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
