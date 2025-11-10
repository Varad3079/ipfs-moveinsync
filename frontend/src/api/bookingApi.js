// FILE: ./src/api/bookingApi.js
import apiClient from './apiClient';

export const bookingApi = {
  /**
   * Fetches room recommendations based on user criteria.
   * @param {object} payload - { start_time, end_time, participants }
   * @returns {Promise<Array>} List of recommended rooms
   */
  getRecommendedRooms: async (payload) => {
    const { data } = await apiClient.post('/meetings/rooms/recommend', payload);
    return data;
  },

  /**
   * Books a specific room.
   * @param {object} payload - { room_id, start_time, end_time, participants }
   * @returns {Promise<object>} The new booking object
   */
  bookRoom: async (payload) => {
    const { data } = await apiClient.post('/meetings/book', payload);
    return data;
  },
  
  /**
   * Fetches all current and future bookings for the logged-in user.
   * @returns {Promise<Array>} List of booking objects
   */
  getMyBookings: async () => {
    const { data } = await apiClient.get('/meetings/my-bookings');
    return data;
  },

  /**
   * Fetches a LIST of all floor plans for the user's company.
   * @returns {Promise<Array>} A list of floor plan objects
   */
  getFloorPlans: async () => {
    // --- UPDATED: Call the new user-safe endpoint ---
    const { data } = await apiClient.get('/meetings/floorplans');
    return data;
  },

  /**
   * NEW: Fetches a SINGLE floor plan with its LIVE booking status.
   * @param {string} floorPlanId - The UUID of the floor plan
   * @returns {Promise<object>} The floor plan with rooms annotated with booking status
   */
  getFloorPlanStatus: async (floorPlanId) => {
    // --- UPDATED: Call the new user-safe endpoint ---
    const { data } = await apiClient.get(`/meetings/floorplans/${floorPlanId}/status`);
    return data;
  },
};