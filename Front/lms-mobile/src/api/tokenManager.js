import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lms_access_token';
const USER_KEY = 'lms_user';

// In-memory cache for synchronous access in Axios interceptors
let memoryToken = null;
let memoryUser = null;

export const tokenManager = {
  // Initialize from storage (call this on app startup)
  init: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      
      memoryToken = token;
      memoryUser = userStr ? JSON.parse(userStr) : null;
      
      return { token: memoryToken, user: memoryUser };
    } catch (e) {
      console.error('Error initializing token manager', e);
      return { token: null, user: null };
    }
  },

  // Synchronous getters
  getToken: () => memoryToken,
  getUser: () => memoryUser,
  hasToken: () => !!memoryToken,

  // Async setters
  setToken: async (token) => {
    try {
      memoryToken = token;
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error setting token', e);
    }
  },

  setUser: async (user) => {
    try {
      memoryUser = user;
      if (user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      console.error('Error setting user', e);
    }
  },

  updateAuth: async (token, user) => {
    await tokenManager.setToken(token);
    await tokenManager.setUser(user);
  },

  clearAuth: async () => {
    await tokenManager.setToken(null);
    await tokenManager.setUser(null);
  }
};

export default tokenManager;
