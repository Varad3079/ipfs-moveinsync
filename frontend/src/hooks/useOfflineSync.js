// FILE: ./src/hooks/useOfflineSync.js
import { useState, useEffect } from 'react';
import { useFloorPlanStore } from '../store/floorPlanStore';
import { adminApi } from '../api/adminApi';
import toast from 'react-hot-toast';

export const useOfflineSync = () => {
  // --- FIX: Select state individually ---
  const offlineQueue = useFloorPlanStore((state) => state.offlineQueue);
  const currentPlan = useFloorPlanStore((state) => state.currentPlan); // Use new state
  const clearOfflineQueue = useFloorPlanStore((state) => state.clearOfflineQueue);
  const fetchFloorPlanById = useFloorPlanStore((state) => state.fetchFloorPlanById);
  // --- END FIX ---

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. You are now offline.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const syncQueue = async () => {
      // --- FIX: Use 'currentPlan' ---
      if (isOnline && offlineQueue.length > 0 && currentPlan && currentPlan.id && currentPlan.last_modified_at) {
        
        console.log(`Syncing ${offlineQueue.length} offline changes...`);
        const syncToast = toast.loading(`Syncing ${offlineQueue.length} offline changes...`);
        
        const payload = {
          floor_plan_id: currentPlan.id,
          client_last_modified_at: currentPlan.last_modified_at, 
          room_updates: offlineQueue,
        };
        // --- END FIX ---

        try {
          await adminApi.syncOfflineChanges(payload);

          toast.dismiss(syncToast);
          toast.success('Offline changes synced successfully!');
          clearOfflineQueue(); 
          fetchFloorPlanById(currentPlan.id); // Refetch the plan

        } catch (err) {
          toast.dismiss(syncToast);
          if (err.response && err.response.status === 409) {
            toast.error('Sync Conflict: Please review the updated plan.', { duration: 8000 });
          } else {
            toast.error('Sync Failed.', { duration: 8000 });
          }
          clearOfflineQueue();
          fetchFloorPlanById(currentPlan.id); 
        }
      }
    };
    
    syncQueue();
    
  }, [isOnline, offlineQueue, currentPlan, clearOfflineQueue, fetchFloorPlanById]);

  return isOnline;
};