// FILE: ./src/pages/Auth/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SquareTerminal } from 'lucide-react';

// This layout centers the Login/Register forms on the page
const AuthLayout = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-secondary-light">
      <div className="mb-6 flex items-center space-x-2 text-brand-primary">
        <SquareTerminal className="w-10 h-10" />
        <span className="text-3xl font-bold text-brand-dark">IFPMS</span>
      </div>
      <div className="w-full max-w-md p-8 bg-brand-light shadow-xl rounded-2xl">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;