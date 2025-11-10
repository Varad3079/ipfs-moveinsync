// FILE: ./src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Building, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get new action from the store
  const registerCompany = useAuthStore((state) => state.registerCompany);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await registerCompany(companyName, email, password);
    
    setIsLoading(false);

    if (success) {
      toast.success('Company registered! Please log in as the new admin.');
      navigate('/login'); // Redirect to login
    } else {
      toast.error(useAuthStore.getState().error || 'Registration failed.');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-brand-dark mb-2">
        Create Your Company
      </h2>
      <p className="text-center text-brand-gray mb-6">
        Get started by creating your company and admin account.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name Field */}
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="companyName">
            Company Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Building className="w-5 h-5 text-brand-gray" />
            </span>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="Your Company Inc."
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="email">
            Admin Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="w-5 h-5 text-brand-gray" />
            </span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="you@company.com"
              required
            />
          </div>
        </div>
        
        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="w-5 h-5 text-brand-gray" />
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : null}
          {isLoading ? 'Creating Company...' : 'Register'}
        </button>
      </form>
      
      <p className="text-sm text-center text-brand-gray mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-primary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;