import api from './api';

const hubAPI = {
  // Hub Management
  getHubs: () => api.get('/hubs/'),
  createHub: (data) => api.post('/hubs/', data),
  getHub: (id) => api.get(`/hubs/${id}/`),
  updateHub: (id, data) => api.patch(`/hubs/${id}/`, data),
  deleteHub: (id) => api.delete(`/hubs/${id}/`),
  
  // Hub Discovery
  getNearbyHubs: (lat, lng, radius = 5) => api.get('/hubs/nearby/', {
    params: { lat, lng, radius }
  }),
  
  // Hub Dashboard
  getHubDashboard: (id) => api.get(`/hubs/${id}/dashboard/`),
  verifyPickup: (id, pickupCode) => api.post(`/hubs/${id}/verify-pickup/`, {
    pickup_code: pickupCode
  }),
  
  // Hub Deliveries
  getHubDeliveries: () => api.get('/hub-deliveries/'),
  createHubDelivery: (data) => api.post('/hub-deliveries/', data),
  getHubDelivery: (id) => api.get(`/hub-deliveries/${id}/`),
  markArrived: (id) => api.post(`/hub-deliveries/${id}/mark-arrived/`),
  getMyDeliveries: (phone) => api.get('/hub-deliveries/my-deliveries/', {
    params: { phone }
  }),
  
  // Hub Transactions
  getHubTransactions: () => api.get('/hub-transactions/'),
  getHubTransaction: (id) => api.get(`/hub-transactions/${id}/`),
  
  // Hub Ratings
  getHubRatings: (hubId) => api.get('/hub-ratings/', {
    params: { hub_id: hubId }
  }),
  submitHubRating: (data) => api.post('/hub-ratings/', data),
  
  // Hub Payouts
  getHubPayouts: () => api.get('/hub-payouts/'),
  getHubPayout: (id) => api.get(`/hub-payouts/${id}/`),
};

export default hubAPI;
