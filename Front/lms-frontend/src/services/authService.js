import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // Silently ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};
