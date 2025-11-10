// FILE: ./src/pages/Admin/AdminManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle, Users, UserPlus, Mail, Lock, Shield } from 'lucide-react';

const AdminManageUsers = () => {
  // State for the user list
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the invite form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on component mount
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getCompanyUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast.error('Please fill out all fields.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const newUser = await adminApi.inviteUser({ email, password, role });
      toast.success(`Successfully invited ${newUser.email}`);
      // Add new user to the list and reset form
      setUsers([...users, newUser]);
      setEmail('');
      setPassword('');
      setRole('standard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to invite user.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (isoString) => new Date(isoString).toLocaleDateString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
      {/* --- Invite User Form --- */}
      <div className="md:col-span-1">
        <div className="p-6 bg-brand-light rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand-primary" />
            Invite New User
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-brand-gray absolute left-3 top-2.5" />
                <input
                  type="email" id="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg"
                  placeholder="new.user@company.com" required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="password">Temporary Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-brand-gray absolute left-3 top-2.5" />
                <input
                  type="password" id="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg"
                  placeholder="••••••••" required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="role">Role</label>
              <div className="relative">
                <Shield className="w-5 h-5 text-brand-gray absolute left-3 top-2.5" />
                <select
                  id="role" value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-brand-secondary-dark rounded-lg appearance-none"
                >
                  <option value="standard">Standard Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Invite'}
            </button>
          </form>
        </div>
      </div>

      {/* --- User List --- */}
      <div className="md:col-span-2">
        <h1 className="text-3xl font-bold text-brand-dark mb-6">Manage Users</h1>
        {isLoading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
        ) : error ? (
          <div className="p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>
        ) : (
          <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
            <ul className="divide-y divide-brand-secondary-dark">
              {users.map(user => (
                <li key={user.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-brand-dark">{user.email}</p>
                    <p className="text-sm text-brand-gray">Joined: {formatDate(user.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' 
                    ? 'bg-brand-accent-light text-brand-accent-dark' 
                    : 'bg-brand-secondary text-brand-dark'
                  }`}>
                    {user.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManageUsers;