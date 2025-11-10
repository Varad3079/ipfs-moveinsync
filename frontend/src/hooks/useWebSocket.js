import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * @param {string} floorPlanId The ID of the floor plan, or "company" for a company-wide feed
 * @param {function} onMessageCallback A callback function that will receive the event type (e.g., "BOOKING_CHANGED")
 * @param {string} role The role of the user, 'user' or 'admin'. Defaults to 'user'.
 */
export const useWebSocket = (floorPlanId, onMessageCallback, role = 'user') => {
  const ws = useRef(null);
  const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    //const host = window.location.hostname;
    const host = import.meta.env.VITE_WEBSOCKET_HOST || window.location.hostname;
    let url;
    if (floorPlanId === 'company') {
      url = `${proto}://${host}:8000/ws/admin/live-feed/company?token=${token}`;
    } else if (floorPlanId) {
      url = `${proto}://${host}:8000/ws/live-feed/${role}/${floorPlanId}?token=${token}`;
    } else {
      return;
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log(`WebSocket connected for ${role} on ${floorPlanId || 'company'}`);
      setIsConnected(true);
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event) {
        onMessageCallback(data.event);
      }
    };

    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setIsConnected(false);

    return () => {
      if (!ws.current) return;
      
      // --- THIS IS THE FIX ---
      // Only set handlers to null and close if the socket is not already closing or closed.
      // This prevents the "closed before connection is established" error in Strict Mode.
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onclose = null;
        ws.current.onerror = null;
        try {
          ws.current.close();
        } catch {}
      }
      // --- END OF FIX ---
    };
  }, [floorPlanId, token, onMessageCallback, role]);

  return isConnected;
};