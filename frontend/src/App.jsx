// FILE: ./src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { SquareTerminal } from 'lucide-react';

// Layouts & Pages
import AuthLayout from './pages/Auth/AuthLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotFound from './pages/NotFound';
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';

// --- Admin Pages ---
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminFloorPlanList from './pages/Admin/AdminFloorPlanList'; 
import AdminFloorPlanCreatePage from './pages/Admin/AdminFloorPlanCreatePage'; 
import AdminFloorPlanEditor from './pages/Admin/AdminFloorPlanEditor'; 
import AdminVersionHistory from './pages/Admin/AdminVersionHistory';
import AdminBookingsList from './pages/Admin/AdminBookingsList';
import AdminManageUsers from './pages/Admin/AdminManageUsers'; 

// --- User Pages ---
import UserFloorPlanList from './pages/User/UserFloorPlanList'; 
import UserBookingPage from './pages/User/UserBookingPage';

// Route Protection
import ProtectedRoute from './components/core/ProtectedRoute';
import AdminRoute from './components/core/AdminRoute';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]); 

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-secondary-light">
        <SquareTerminal className="w-12 h-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'font-sans',
          style: {
            border: '1px solid #06B6D4',
            padding: '16px',
            color: '#0F172A',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#ffffff' } },
        }}
      />
      
      {/* App Routes */}
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes (for ALL logged-in users) */}
        <Route element={<ProtectedRoute />}>
          
          {/* --- USER ROUTES (Updated) --- */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<UserFloorPlanList />} />
            <Route path="/dashboard" element={<UserFloorPlanList />} />
            <Route path="/book/:floorPlanId" element={<UserBookingPage />} />
            {/* --- P3 FIX: New Booking List Routes --- */}
            <Route path="/my-bookings/:filter" element={<UserFloorPlanList />} /> 
          </Route>
          
          {/* --- ADMIN ROUTES (Unchanged) --- */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/floorplans" element={<AdminFloorPlanList />} /> 
              <Route path="/admin/floorplan/new" element={<AdminFloorPlanCreatePage />} /> 
              <Route path="/admin/floorplan/:floorPlanId" element={<AdminFloorPlanEditor />} /> 
              <Route path="/admin/bookings" element={<AdminBookingsList />} />
              <Route path="/admin/history/:floorPlanId" element={<AdminVersionHistory />} />
              <Route path="/admin/history" element={<AdminVersionHistory />} /> 
              <Route path="/admin/users" element={<AdminManageUsers />} />
            </Route>
          </Route>
          
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;