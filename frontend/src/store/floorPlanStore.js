// FILE: ./src/store/floorPlanStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { adminApi } from '../api/adminApi';

export const useFloorPlanStore = create(
  persist(
    (set, get) => ({
      floorPlans: [],
      currentPlan: null,
      isLoadingList: false,
      isLoadingPlan: false,
      offlineQueue: [],
      error: null,

      fetchFloorPlanList: async () => {
        set({ isLoadingList: true, error: null });
        try {
          const data = await adminApi.getAllFloorPlans();
          set({ floorPlans: data, isLoadingList: false });
          return true;
        } catch {
          set({ error: 'Failed to fetch floor plans', isLoadingList: false });
          return false;
        }
      },

      fetchFloorPlanById: async (id) => {
        set({ isLoadingPlan: true, error: null });
        try {
          const data = await adminApi.getFloorPlanById(id);
          set({ currentPlan: data, isLoadingPlan: false });
          return true;
        } catch {
          set({ error: 'Failed to fetch floor plan', isLoadingPlan: false });
          return false;
        }
      },

      // --- FIX: Renamed 'updateRoom' to 'saveFloorPlanLayout' ---
      // This action now accepts the *entire* payload from the editor
      saveFloorPlanLayout: async (payload) => {
        // We don't do an optimistic update here because the
        // backend is the source of truth for conflicts.

        if (!navigator.onLine) {
          // This is a simple implementation.
          // A real offline mode would queue the *entire* payload.
          set((state) => ({
            offlineQueue: [...state.offlineQueue, ...payload.room_updates],
          }));
          return 'offline';
        }

        try {
          // The payload is already in the correct format
          const updated = await adminApi.updateFloorPlan(payload);

          // Success: update our state with the new, confirmed data
          set((state) => ({
            currentPlan: {
              ...state.currentPlan,
              last_modified_at: updated.last_modified_at,
            },
            error: null,
          }));

          return 'success';
        } catch (err) {
          const status = err.response?.status;
          
          // On any error (especially conflict), we MUST refetch
          // to get the server's version.
          await get().fetchFloorPlanById(get().currentPlan.id);

          return status === 409 ? 'conflict' : 'error';
        }
      },
      // --- END OF FIX ---

      clearOfflineQueue: () => set({ offlineQueue: [] }),

      setFloorPlanData: (data) =>
        set({
          currentPlan: data,
          floorPlans: [...get().floorPlans, data],
        }),
    }),
    {
      name: 'floorplan-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ offlineQueue: s.offlineQueue }),
    }
  )
);