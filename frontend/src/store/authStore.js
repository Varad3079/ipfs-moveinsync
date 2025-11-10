// FILE: ./src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../api/apiClient';

// Helper function to decode JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null, // Will be { id, email, role, companyId }
      isAuthenticated: false,
      isLoading: true, // For initial auth check
      error: null,

      // --- UPDATED: Login Action ---
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post('/auth/token', {
            username: email,
            password: password,
          }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          
          const token = data.access_token;
          const decoded = parseJwt(token);
          
          // --- NEW: Store all data from the multi-tenant token ---
          const user = {
            id: decoded.user_id,
            role: decoded.role,
            companyId: decoded.company_id,
            email: email, 
          };

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ token, user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (err) {
          const errorMsg = err.response?.data?.detail || "An error occurred. Please try again.";
          set({ error: errorMsg, isLoading: false });
          return false;
        }
      },

      // --- UPDATED: Register Company Action ---
      registerCompany: async (companyName, email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Calls the new backend endpoint
          await apiClient.post('/auth/register-company', {
            company_name: companyName,
            email: email,
            password: password,
          });
          
          set({ isLoading: false, error: null });
          return true; // Registration was successful
        } catch (err) {
          const errorMsg = err.response?.data?.detail || "Registration failed. Please try again.";
          set({ error: errorMsg, isLoading: false });
          return false; // Registration failed
        }
      },

      // --- Action to log out ---
      logout: () => {
        delete apiClient.defaults.headers.common['Authorization'];
        set({ token: null, user: null, isAuthenticated: false, error: null });
      },

      // --- UPDATED: Auth Initialization ---
      initializeAuth: () => {
        const token = get().token;
        if (token) {
          const decoded = parseJwt(token);
          // Check for new token structure and expiration
          if (decoded && decoded.exp * 1000 > Date.now() && decoded.company_id) {
            const user = {
              id: decoded.user_id,
              role: decoded.role,
              companyId: decoded.company_id,
              // Note: email is not in the token, but we have the essentials
            };
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            get().logout();
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({ token: state.token }), 
    }
  )
);