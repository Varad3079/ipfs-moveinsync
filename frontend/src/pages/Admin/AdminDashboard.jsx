// FILE: ./src/pages/Admin/AdminDashboard.jsx
import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="animate-fade-in p-6 bg-brand-light rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-brand-dark">Admin Dashboard</h1>
      <p className="mt-2 text-xl text-brand-gray">Welcome back, {user?.email}!</p>
      <p className="mt-4 text-brand-dark">
        From here you can manage all aspects of the workspace.
      </p>
      
      <div className="mt-6 border-t pt-6">
        <h2 className="text-xl font-semibold text-brand-dark">Quick Actions</h2>
        <div className="mt-4">
          <Link
            to="/admin/floorplans" // --- FIX: Changed from '/admin/floorplan'
            className="inline-block bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-brand-primary-dark transition-all"
          >
            Manage Floor Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;