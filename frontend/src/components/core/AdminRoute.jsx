// FILE: ./src/components/core/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// This component protects routes that require an ADMIN user
// It should be nested inside a <ProtectedRoute>
const AdminRoute = () => {
  const { user } = useAuthStore((state) => state);

  if (user?.role !== 'admin') {
    // Redirect them to their normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // Render the child route
};

export default AdminRoute;