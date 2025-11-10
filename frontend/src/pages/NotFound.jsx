// FILE: ./src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-secondary-light">
      <div className="text-center">
        <AlertTriangle className="w-24 h-24 text-brand-warning mx-auto" />
        <h1 className="mt-6 text-6xl font-bold text-brand-dark">404</h1>
        <p className="mt-4 text-2xl text-brand-gray">Page Not Found</p>
        <p className="mt-2 text-brand-gray">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-all duration-200"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;