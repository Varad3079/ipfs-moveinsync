import apiClient from './apiClient';

export const adminApi = {
  /**
   * Fetches a LIST of all floor plans for the admin's company.
   * @returns {Promise<Array>} A list of floor plan objects
   */
  getAllFloorPlans: async () => {
    const { data } = await apiClient.get('/admin/floorplans');
    return data;
  },

  /**
   * Fetches a SINGLE floor plan by its ID.
   * @param {string} floorPlanId - The UUID of the floor plan
   * @returns {Promise<object>} The full floor plan object with rooms
   */
  getFloorPlanById: async (floorPlanId) => {
    const { data } = await apiClient.get(`/admin/floorplans/${floorPlanId}`);
    return data;
  },

  /**
   * Fetches a SINGLE floor plan with its LIVE booking status.
   * @param {string} floorPlanId - The UUID of the floor plan
   * @returns {Promise<object>} The floor plan with rooms annotated with booking status
   */
  getFloorPlanStatus: async (floorPlanId) => {
    const { data } = await apiClient.get(`/admin/floorplans/${floorPlanId}/status`);
    return data;
  },

  /**
   * Uploads a new floor plan.
   * @param {object} payload - FloorPlanCreate schema (name, width, height, rooms)
   * @returns {Promise<object>} The newly created floor plan
   */
  uploadInitialFloorPlan: async (payload) => {
    const { data } = await apiClient.post('/admin/floorplans/upload', payload);
    return data;
  },

  /**
   * Sends a batch of updates for conflict resolution.
   * @param {object} payload - AdminUpdatePayload schema
   * @returns {Promise<object>} The updated floor plan
   */
  updateFloorPlan: async (payload) => {
    const { data } = await apiClient.post('/admin/floorplans/update', payload);
    return data;
  },

  /**
   * Lists all historical versions of a floor plan.
   * @param {string} floorPlanId - The UUID of the floor plan
   * @returns {Promise<Array>} A list of version objects
   */
  getFloorPlanVersions: async (floorPlanId) => {
    const { data } = await apiClient.get(`/admin/floorplans/${floorPlanId}/versions`);
    return data;
  },

  /**
   * Restores the most recent backup snapshot of a floor plan.
   * @param {string} floorPlanId - The UUID of the floor plan
   * @returns {Promise<object>} The restored floor plan
   */
  restoreFloorPlan: async (floorPlanId) => {
    const { data } = await apiClient.post(`/admin/floorplans/${floorPlanId}/restore`);
    return data;
  },

  /**
   * Fetches ALL upcoming bookings for the admin's company.
   * @returns {Promise<Array>} A list of booking objects
   */
  getAllBookings: async () => {
    const { data } = await apiClient.get('/admin/bookings');
    return data;
  },

  /**
   * Syncs offline changes. This is an alias for the update endpoint.
   * @param {object} payload - AdminUpdatePayload schema
   * @returns {Promise<object>} The updated floor plan
   */
  syncOfflineChanges: async (payload) => {
    const { data } = await apiClient.post('/sync/commit-changes', payload);
    return data;
  },

  // --- NEW: Get all users for the admin's company ---
  /**
   * Fetches all users for the admin's company.
   * @returns {Promise<Array>} A list of UserResponse objects
   */
  getCompanyUsers: async () => {
    const { data } = await apiClient.get('/admin/users');
    return data;
  },

  // --- NEW: Invite a new user to the admin's company ---
  /**
   * Creates a new user (admin or standard) in the admin's company.
   * @param {object} payload - UserCreate schema (email, password, role)
   * @returns {Promise<object>} The new UserResponse object
   */
  inviteUser: async (payload) => {
    const { data } = await apiClient.post('/admin/invite-user', payload);
    return data;
  },
};