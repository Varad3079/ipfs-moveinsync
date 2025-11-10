// FILE: ./src/components/core/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// This component protects routes that require any authenticated user
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore((state) => state);

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Render the child route
};

export default ProtectedRoute;