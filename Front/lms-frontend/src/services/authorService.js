import api from './api';

export const authorService = {
  // Ebooks
  getEbooks: async () => {
    const response = await api.get('/author/ebooks');
    return response.data;
  },

  uploadEbook: async (formData) => {
    // Note: formData should be an instance of FormData for file uploads
    const response = await api.post('/author/ebooks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateEbook: async (id, formData) => {
    const response = await api.put(`/author/ebooks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteEbook: async (id) => {
    const response = await api.delete(`/author/ebooks/${id}`);
    return response.data;
  },

  // Earnings
  getEarnings: async () => {
    const response = await api.get('/author/earnings', { params: { t: Date.now() } });
    return response.data;
  },

  // Withdrawals
  withdraw: async (withdrawalData) => {
    const response = await api.post('/author/withdraw', withdrawalData);
    return response.data;
  },

  getWithdrawHistory: async (params = {}) => {
    const response = await api.get('/author/withdraw-history', { params: { ...params, t: Date.now() } });
    return response.data;
  },

  getSalesHistory: async (params = {}) => {
    const response = await api.get('/author/earnings-history', { params });
    return response.data;
  }
};
