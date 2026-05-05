import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/change-password', data);
    return response.data;
  },

  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data;
  },

  getMyBorrows: async () => {
    const response = await api.get('/my-borrows', { params: { t: Date.now() } });
    return response.data;
  },

  returnBook: async (borrowId) => {
    const response = await api.post(`/borrow/${borrowId}/return`);
    return response.data;
  },

  renewBook: async (borrowId, days) => {
    const response = await api.post(`/borrow/${borrowId}/renew`, { days });
    return response.data;
  },

  getMyReservations: async () => {
    const response = await api.get('/my-reservations');
    return response.data;
  },

  cancelReservation: async (id) => {
    const response = await api.delete(`/reservation/${id}`);
    return response.data;
  },

  getMyEbooks: async () => {
    const response = await api.get('/my-ebooks');
    return response.data;
  },

  deposit: async (amount) => {
    const response = await api.post('/deposit', { amount });
    return response.data;
  },

  refreshBalance: async () => {
    const response = await api.get('/balance');
    if (response.data.balance) {
      localStorage.setItem('balance', response.data.balance);
    }
    return response.data;
  }
};
