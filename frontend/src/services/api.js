import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data
          useAuthStore.getState().setAccessToken(access)

          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (data) => api.post('/auth/logout/', data),
  getCurrentUser: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

// Customer API
export const customerAPI = {
  getProfile: () => api.get('/customer/profile/'),
  updateProfile: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key])
      }
    })
    return api.put('/customer/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updatePhone: (idToken) => api.post('/customer/phone/', { id_token: idToken }),
  
  // Jobs
  getJobs: (status = 'current') => api.get(`/customer/jobs/?status=${status}`),
  getJob: (jobId) => api.get(`/customer/jobs/${jobId}/`),
  cancelJob: (jobId) => api.post(`/customer/jobs/${jobId}/cancel/`),
  getCourierLocation: (jobId) => api.get(`/customer/jobs/${jobId}/courier-location/`),
  
  // Job creation
  getCreatingJob: () => api.get('/customer/job/create/'),
  createJobStep: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key])
      }
    })
    return api.post('/customer/job/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteCreatingJob: () => api.delete('/customer/job/create/'),
  
  // Payment
  getPaymentMethod: () => api.get('/customer/payment-method/'),
  removePaymentMethod: () => api.delete('/customer/payment-method/'),
}

// Courier API
export const courierAPI = {
  getProfile: () => api.get('/courier/profile/'),
  updateProfile: (data) => api.put('/courier/profile/', data),
  
  // Payout
  getPayoutMethod: () => api.get('/courier/payout-method/'),
  updatePayoutMethod: (data) => api.put('/courier/payout-method/', data),
  
  // Jobs
  getAvailableJobs: () => api.get('/courier/jobs/available/'),
  getAvailableJob: (jobId) => api.get(`/courier/jobs/available/${jobId}/`),
  acceptJob: (jobId) => api.post(`/courier/jobs/available/${jobId}/`),
  
  getCurrentJob: () => api.get('/courier/jobs/current/'),
  updateCurrentJob: (jobId, data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key])
      }
    })
    return api.post(`/courier/jobs/current/${jobId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getArchivedJobs: () => api.get('/courier/jobs/archived/'),
  
  // Location
  updateLocation: (data) => api.post('/courier/location/', data),
  
  // FCM
  updateFCMToken: (fcmToken) => api.post('/courier/fcm-token/', { fcm_token: fcmToken }),
  
  // Vehicles
  getVehicles: () => api.get('/courier/vehicles/'),
  addVehicle: (vehicleData) => api.post('/courier/vehicles/', vehicleData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateVehicle: (vehicleId, vehicleData) => api.put(`/courier/vehicles/${vehicleId}/`, vehicleData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteVehicle: (vehicleId) => api.delete(`/courier/vehicles/${vehicleId}/`),
  setActiveVehicle: (vehicleId) => api.post(`/courier/vehicles/${vehicleId}/activate/`),
  
  // Verification
  getVerificationStatus: () => api.get('/courier/verification/'),
  submitVerification: (data) => api.post('/courier/verification/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
}

// Vehicle Types API
export const vehicleAPI = {
  // Get all vehicle types with info
  getTypes: () => api.get('/vehicles/types/'),
  
  // Get pricing for all vehicle types
  getPricing: (data) => api.post('/vehicles/pricing/', data),
  
  // Get available couriers for a vehicle type
  getAvailableCouriers: (vehicleType) => api.get(`/vehicles/available/${vehicleType}/`),
}

// Chat API
export const chatAPI = {
  // Get messages for a job
  getMessages: (jobId) => api.get(`/chat/${jobId}/messages/`),
  
  // Send a message
  sendMessage: (jobId, content, isQuickMessage = false) => 
    api.post(`/chat/${jobId}/messages/`, { content, is_quick_message: isQuickMessage }),
  
  // Get chat info (other party, unread count, etc.)
  getChatInfo: (jobId) => api.get(`/chat/${jobId}/info/`),
  
  // Get unread message count
  getUnreadCount: (jobId) => api.get(`/chat/${jobId}/unread/`),
  
  // Mark all messages as read
  markAsRead: (jobId) => api.post(`/chat/${jobId}/read/`),
  
  // Get masked phone number for calling
  getMaskedPhone: (jobId) => api.get(`/chat/${jobId}/call/`),
  
  // Get quick messages
  getQuickMessages: () => api.get('/chat/quick-messages/'),
}

// Addresses API
export const addressesAPI = {
  // Saved addresses
  getSavedAddresses: () => api.get('/customer/addresses/'),
  getDefaultAddresses: () => api.get('/customer/addresses/defaults/'),
  createSavedAddress: (data) => api.post('/customer/addresses/', data),
  updateSavedAddress: (id, data) => api.put(`/customer/addresses/${id}/`, data),
  deleteSavedAddress: (id) => api.delete(`/customer/addresses/${id}/`),
  useAddress: (id) => api.post(`/customer/addresses/${id}/use/`),
  
  // Recipients / Address Book
  getRecipients: () => api.get('/customer/recipients/'),
  getFrequentRecipients: () => api.get('/customer/recipients/frequent/'),
  createRecipient: (data) => api.post('/customer/recipients/', data),
  updateRecipient: (id, data) => api.put(`/customer/recipients/${id}/`, data),
  deleteRecipient: (id) => api.delete(`/customer/recipients/${id}/`),
  toggleFavoriteRecipient: (id) => api.post(`/customer/recipients/${id}/favorite/`),
}

// Scheduled Deliveries API
export const scheduledAPI = {
  getScheduledDeliveries: () => api.get('/customer/schedules/'),
  getUpcomingDeliveries: () => api.get('/customer/schedules/upcoming/'),
  createScheduledDelivery: (data) => api.post('/customer/schedules/', data),
  updateScheduledDelivery: (id, data) => api.put(`/customer/schedules/${id}/`, data),
  deleteScheduledDelivery: (id) => api.delete(`/customer/schedules/${id}/`),
  pauseScheduledDelivery: (id) => api.post(`/customer/schedules/${id}/pause/`),
  resumeScheduledDelivery: (id) => api.post(`/customer/schedules/${id}/resume/`),
  cancelScheduledDelivery: (id) => api.post(`/customer/schedules/${id}/cancel/`),
  triggerScheduledDelivery: (id) => api.post(`/customer/schedules/${id}/trigger/`),
}

// Ratings API
export const ratingsAPI = {
  createRating: (data) => api.post('/ratings/', data),
  getMyRatings: () => api.get('/ratings/my/'),
  getRating: (id) => api.get(`/ratings/${id}/`),
  getJobRating: (jobId) => api.get(`/ratings/job/${jobId}/`),
  submitJobRating: (jobId, data) => api.post(`/ratings/job/${jobId}/`, data),
  getCourierRatings: (courierId) => api.get(`/ratings/courier/${courierId}/`),
  respondToRating: (ratingId, data) => api.post(`/ratings/${ratingId}/respond/`, data),
}

// Referral API
export const referralAPI = {
  getMyReferralCode: () => api.get('/referral/my-code/'),
  getMyReferrals: () => api.get('/referral/my-referrals/'),
  applyReferralCode: (code) => api.post('/referral/apply/', { code }),
  validateReferralCode: (code) => api.get(`/referral/validate/${code}/`),
  shareReferral: (data) => api.post('/referral/share/', data),
}

// Wallet API
export const walletAPI = {
  getWallet: () => api.get('/wallet/'),
  getTransactions: () => api.get('/wallet/transactions/'),
}

// Tracking API
export const trackingAPI = {
  createTrackingLink: (data) => api.post('/tracking/create/', data),
  getJobTrackingLinks: (jobId) => api.get(`/tracking/job/${jobId}/`),
  shareTracking: (jobId, data) => api.post(`/tracking/share/${jobId}/`, data),
}

// COD API
export const codAPI = {
  getStatus: (jobId) => api.get(`/cod/${jobId}/`),
  collect: (jobId, data) => api.post(`/cod/${jobId}/collect/`, data),
}

// Insurance API
export const insuranceAPI = {
  getTiers: () => api.get('/insurance/tiers/'),
  getQuote: (data) => api.post('/insurance/quote/', data),
  getJobInsurance: (jobId) => api.get(`/insurance/job/${jobId}/`),
  fileClaim: (data) => api.post('/insurance/claim/', data),
  getMyClaims: () => api.get('/insurance/my-claims/'),
}

// Reorder API
export const reorderAPI = {
  reorder: (data) => api.post('/reorder/', data),
  getReorderableJobs: () => api.get('/reorder/jobs/'),
}

// Public API (no auth required)
export const publicAPI = {
  getTracking: (code) => axios.get(`${API_URL}/track/${code}/`),
}

export default api
