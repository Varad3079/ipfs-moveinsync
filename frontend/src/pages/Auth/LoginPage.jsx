// FILE: ./src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('admin-a@alphacorp.com'); // Default to our test admin
  const [password, setPassword] = useState('password123'); // Default to test password
  const [isLoading, setIsLoading] = useState(false);
  
  // --- FIX: Select state individually ---
  const login = useAuthStore((state) => state.login);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    
    setIsLoading(false);

    if (success) {
      toast.success('Logged in successfully!');
      
      // Navigate to the correct dashboard based on role
      const role = useAuthStore.getState().user.role;
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(useAuthStore.getState().error || 'Login Failed');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-brand-dark mb-2">
        Welcome Back!
      </h2>
      <p className="text-center text-brand-gray mb-6">
        Log in to manage your workspace.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="email">
            Email
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <p className="text-sm text-center text-brand-gray mt-6">
        No company yet?{' '}
        <Link to="/register" className="font-medium text-brand-primary hover:underline">
          Register one
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;