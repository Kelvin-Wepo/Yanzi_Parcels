import api from './api';

const businessAPI = {
  // Business Accounts
  getAccounts: () => api.get('/business/accounts/'),
  createAccount: (data) => api.post('/business/accounts/', data),
  getAccount: (id) => api.get(`/business/accounts/${id}/`),
  updateAccount: (id, data) => api.patch(`/business/accounts/${id}/`, data),
  
  // Dashboard & Analytics
  getDashboard: (id) => api.get(`/business/accounts/${id}/dashboard/`),
  getAnalytics: (id) => api.get(`/business/accounts/${id}/analytics/`),
  regenerateAPIKey: (id) => api.post(`/business/accounts/${id}/regenerate-api-key/`),
  
  // Bulk Orders
  getBulkOrders: () => api.get('/business/bulk-orders/'),
  createBulkOrder: (data) => api.post('/business/bulk-orders/', data),
  getBulkOrder: (id) => api.get(`/business/bulk-orders/${id}/`),
  updateBulkOrder: (id, data) => api.patch(`/business/bulk-orders/${id}/`, data),
  
  // CSV Upload & Processing
  uploadCSV: (formData) => api.post('/business/bulk-orders/upload-csv/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Courier Assignment
  assignCouriers: (id) => api.post(`/business/bulk-orders/${id}/assign-couriers/`),
  
  // Business Credits
  getCredits: () => api.get('/business/credits/'),
  getCreditDetails: (id) => api.get(`/business/credits/${id}/`),
  purchaseCredit: (id, amount) => api.post(`/business/credits/${id}/purchase/`, { amount }),
  getCreditTransactions: (id) => api.get(`/business/credits/${id}/transactions/`),
  
  // Invoices
  getInvoices: () => api.get('/business/invoices/'),
  getInvoice: (id) => api.get(`/business/invoices/${id}/`),
  markInvoicePaid: (id, paymentMethod) => api.post(`/business/invoices/${id}/mark-paid/`, {
    payment_method: paymentMethod
  }),
};

export default businessAPI;
