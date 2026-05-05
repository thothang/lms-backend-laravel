import api from './api';

export const adminService = {
  // Users
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  makeAuthor: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/make-author`);
    return response.data;
  },

  // Permissions
  getLibrarianPermissions: async () => {
    const response = await api.get('/admin/permissions/librarians');
    return response.data;
  },

  updatePermissions: async (userId, permissions) => {
    const response = await api.put(`/admin/permissions/librarian/${userId}`, { permissions });
    return response.data;
  },

  // Ebook Approvals
  getPendingEbooks: async () => {
    const response = await api.get('/admin/ebooks/pending');
    return response.data;
  },

  approveEbook: async (id) => {
    const response = await api.post(`/admin/ebooks/${id}/approve`);
    return response.data;
  },

  rejectEbook: async (id, reason) => {
    const response = await api.post(`/admin/ebooks/${id}/reject`, { reason });
    return response.data;
  },

  uploadEbook: async (formData) => {
    const response = await api.post('/admin/ebooks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Finance & Withdrawals
  getWithdrawalRequests: async (params) => {
    const response = await api.get('/admin/withdraw-requests', { params });
    return response.data;
  },

  processWithdrawal: async (id, action, notes) => {
    const response = await api.post(`/admin/withdraw-requests/${id}/process`, { action, notes });
    return response.data;
  },

  // Revenue
  getRevenue: async () => {
    const response = await api.get('/admin/revenue');
    return response.data;
  },

  // Settings & Reports
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  getReportOverview: async (params) => {
    const response = await api.get('/admin/reports/overview', { params });
    return response.data;
  },

  getAuditLogs: async (params) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  // Ebook Earnings
  getEbookEarnings: async (params) => {
    const response = await api.get('/admin/ebook-earnings', { params });
    return response.data;
  },

  getAuthorEarnings: async () => {
    const response = await api.get('/admin/author-earnings');
    return response.data;
  },

};
