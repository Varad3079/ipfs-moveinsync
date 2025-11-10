import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
// --- NEW: Import toast and Bell icon ---
import toast from 'react-hot-toast';
import { LayoutDashboard, Map, LogOut, SquareTerminal, Wifi, WifiOff, History, Calendar, Users, Bell } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
// --- NEW: Import the WebSocket hook ---
import { useWebSocket } from '../../hooks/useWebSocket';

const AdminLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const isOnline = useOfflineSync();

  // --- NEW: WebSocket Notification Logic ---
  const handleWebSocketMessage = (event) => {
    if (event === 'BOOKING_CHANGED') {
      toast.success('A new booking was just made in your company!', {
        icon: <Bell className="w-5 h-5 text-brand-primary" />,
        position: 'bottom-right',
      });
    }
  };

  // Connect to the company-wide feed as an admin
  useWebSocket("company", handleWebSocketMessage, "admin");
  // --- END NEW ---

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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Sidebar (Unchanged) --- */}
      <div className="hidden border-r bg-brand-light md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/admin" className="flex items-center gap-2 font-semibold">
              <SquareTerminal className="h-6 w-6 text-brand-primary" />
              <span className="text-brand-dark">IFPMS Admin</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <SidebarLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </SidebarLink>
              <SidebarLink to="/admin/floorplans" icon={<Map className="h-4 w-4" />}>
                Floor Plans
              </SidebarLink>
              <SidebarLink to="/admin/bookings" icon={<Calendar className="h-4 w-4" />}>
                Bookings
              </SidebarLink>
              <SidebarLink to="/admin/history" icon={<History className="h-4 w-4" />}>
                Version History
              </SidebarLink>
              <SidebarLink to="/admin/users" icon={<Users className="h-4 w-4" />}>
                Manage Users
              </SidebarLink>
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
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
      
      {/* --- Main Content (Unchanged) --- */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-brand-light px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-2 text-sm text-brand-success">
                <Wifi className="h-4 w-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-brand-error">
                <WifiOff className="h-4 w-4" /> Offline
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 bg-brand-secondary-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;