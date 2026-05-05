/**
 * Token Manager - Centralized storage for auth tokens
 * Use this instead of direct localStorage for better security
 */

// Token keys
const TOKEN_KEY = 'lms_access_token';
const USER_KEY = 'lms_user';
const BALANCE_KEY = 'lms_balance';

export const tokenManager = {
  // Get token
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // Set token
  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Silent fail - localStorage not available
    }
  },

  // Remove token
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Silent fail
    }
  },

  // Check if token exists
  hasToken: () => {
    return !!tokenManager.getToken();
  },

  // Get user
  getUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Set user
  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Silent fail
    }
  },

  // Remove user
  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Silent fail
    }
  },

  // Get balance
  getBalance: () => {
    try {
      const balance = localStorage.getItem(BALANCE_KEY);
      return balance ? parseFloat(balance) : 0;
    } catch {
      return 0;
    }
  },

  // Set balance
  setBalance: (balance) => {
    try {
      if (balance !== undefined && balance !== null) {
        localStorage.setItem(BALANCE_KEY, balance.toString());
      } else {
        localStorage.removeItem(BALANCE_KEY);
      }
    } catch {
      // Silent fail
    }
  },

  // Remove balance
  removeBalance: () => {
    try {
      localStorage.removeItem(BALANCE_KEY);
    } catch {
      // Silent fail
    }
  },

  // Clear all auth data
  clearAll: () => {
    tokenManager.removeToken();
    tokenManager.removeUser();
    tokenManager.removeBalance();
  },

  // Update user and balance together (atomic operation)
  updateAuth: (token, user, balance) => {
    tokenManager.setToken(token);
    tokenManager.setUser(user);
    if (balance !== undefined) {
      tokenManager.setBalance(balance);
    }
  },

  // Clear auth (logout)
  clearAuth: () => {
    tokenManager.clearAll();
  }
};

export default tokenManager;