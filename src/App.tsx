import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './layouts/AppLayout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Customers } from './pages/Customers.js';
import { CustomerDetail } from './pages/CustomerDetail.js';
import { Applications } from './pages/Applications.js';
import { ApplicationDetail } from './pages/ApplicationDetail.js';
import { Documents } from './pages/Documents.js';
import { Payments } from './pages/Payments.js';
import { Invoices } from './pages/Invoices.js';
import { InvoiceDetail } from './pages/InvoiceDetail.js';
import { Services } from './pages/Services.js';
import { Employees } from './pages/Employees.js';
import { Tasks } from './pages/Tasks.js';
import { Notifications } from './pages/Notifications.js';
import { Reports } from './pages/Reports.js';
import { Settings } from './pages/Settings.js';
import { Profile } from './pages/Profile.js';
import { PublicTracking } from './pages/PublicTracking.js';
import { UserRole } from './types/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#31B8C1] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#0B2541] font-semibold">BizLink OMS Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 m-8 max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-[#0B2541]">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2">
          Your account role (<strong className="capitalize">{user.role}</strong>) does not have authorization to view this section.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-[#0B2541] text-white text-xs font-semibold rounded-xl"
        >
          Return to Previous
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Public Customer Tracking */}
          <Route path="/track" element={<PublicTracking />} />
          <Route path="/track/:trackingNumber" element={<PublicTracking />} />

          {/* Internal Operations Management Portal (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Applications */}
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />

            {/* Documents */}
            <Route path="/documents" element={<Documents />} />

            {/* Payments */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* Invoices */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />

            {/* Services */}
            <Route path="/services" element={<Services />} />

            {/* Tasks */}
            <Route path="/tasks" element={<Tasks />} />

            {/* Employees */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Notifications */}
            <Route path="/notifications" element={<Notifications />} />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
