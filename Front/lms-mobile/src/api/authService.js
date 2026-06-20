import api from './api';
import tokenManager from './tokenManager';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.access_token) {
      await tokenManager.updateAuth(response.data.access_token, response.data.user);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/register?source=mobile', userData);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // Silently ignore logout errors
    } finally {
      await tokenManager.clearAuth();
    }
  },

  getCurrentUser: () => {
    return tokenManager.getUser();
  }
};
