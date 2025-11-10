// FILE: ./src/components/layout/UserLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, SquareTerminal, Map, Calendar, LayoutDashboard } from 'lucide-react'; // Added Map, Calendar

const UserLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const SidebarLink = ({ to, icon, children }) => (
    <NavLink
      to={to}
      end 
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
          isActive
            ? 'bg-brand-primary text-white'
            : 'text-brand-gray hover:text-brand-dark'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );

  return (
    // --- P2 FIX: New Grid Layout ---
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-brand-secondary-light">
      
      {/* --- Sidebar --- */}
      <div className="hidden border-r bg-brand-light md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <SquareTerminal className="h-6 w-6 text-brand-primary" />
              <span className="text-brand-dark">IFPMS Portal</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <SidebarLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </SidebarLink>
              <SidebarLink to="/" icon={<Map className="h-4 w-4" />}>
                Book Room
              </SidebarLink>
              {/* This route is currently only accessible on the UserFloorPlanList page */}
              {/* <SidebarLink to="/my-bookings" icon={<Calendar className="h-4 w-4" />}>
                My Bookings
              </SidebarLink> */}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="text-sm font-medium text-brand-dark mb-2">Welcome, {user?.email}</div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-brand-gray transition-all hover:text-brand-dark hover:bg-brand-secondary"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
      
      {/* --- Main Content (Header is now simpler) --- */}
      <div className="flex flex-col">
        {/* Simplified Header for consistency */}
        <header className="flex h-14 items-center gap-4 border-b bg-brand-light px-4 lg:h-[60px] lg:px-6 md:hidden">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <SquareTerminal className="h-6 w-6 text-brand-primary" />
              <span className="text-brand-dark">IFPMS Portal</span>
            </NavLink>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-brand-secondary-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;