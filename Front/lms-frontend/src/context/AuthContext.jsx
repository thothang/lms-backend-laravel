import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { publicService } from '../services/publicService';
import { tokenManager } from '../services/tokenManager';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalanceState] = useState(0);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Prefetch data silently to populate the global API Cache for instant navigation
  const prefetchRoleData = useCallback((role, userStatus = 'active') => {
    // Only prefetch for verified/active users
    if (userStatus === 'unverified') {
      return;
    }
    
    // Run in background without awaiting.
    // The api.js interceptor will automatically trap these responses and save them to RAM
    setTimeout(() => {
      try {
        if (role === 'admin' || role === 'librarian') {
          publicService.getCategories().catch(() => {});
          // Skip reports/overview prefetch to avoid 500 errors
          if(role === 'librarian') api.get('/librarian/finance/summary').catch(() => {});
          if(role === 'admin') api.get('/admin/revenue').catch(() => {});
        } else if (role === 'author') {
          api.get('/author/earnings').catch(() => {});
          api.get('/author/ebooks').catch(() => {});
        } else if (role === 'user') {
          api.get('/my-borrows').catch(() => {});
          api.get('/my-reservations').catch(() => {});
        }
      } catch (e) {
        // Ignore prefetch errors silently
      }
    }, 500); // 500ms delay to ensure login API completes fully first
  }, []);

  // Fetch current user from API
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/profile');
      const userData = response.data;
      setUser(userData);
      tokenManager.setUser(userData);
      if (userData.balance !== undefined) {
        setBalanceState(userData.balance);
        tokenManager.setBalance(userData.balance);
      }
      return userData;
    } catch {
      return null;
    }
  }, []);

  // Load user from tokenManager on mount and handle verify redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isVerified = params.get('verified') === '1';
    const newToken = params.get('token');
    
    if (isVerified && newToken) {
      tokenManager.setToken(newToken);
      toast.success('Xác thực email thành công! Bạn đã có thể sử dụng tất cả tính năng.', { id: 'email_verified' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('verified') === '0') {
      toast.error('Link xác thực không hợp lệ hoặc đã hết hạn.', { id: 'email_verify_failed' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = tokenManager.getToken();
    const storedUser = tokenManager.getUser();
    const storedBalance = tokenManager.getBalance();
    
    if (token && storedUser) {
      setUser(storedUser);
      setBalanceState(storedBalance);
      
      // Show warning for unverified users
      if (storedUser.status === 'unverified') {
        toast.info('Vui lòng xác thực email để sử dụng đầy đủ tính năng của thư viện.', { 
          id: 'unverified_warning',
          duration: 10000 
        });
      }
      
      // Auto fetch fresh data if they just verified
      if (isVerified || storedUser.status === 'unverified') {
         fetchUser();
      }
      
      // Prefetch dashboard data to RAM (only for active users)
      prefetchRoleData(storedUser.role, storedUser.status);
    }
    setLoading(false);
  }, [fetchUser, prefetchRoleData]);

  // fetchUser moved above

  // Login
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      tokenManager.updateAuth(access_token, userData, userData.balance);
      setUser(userData);
      setBalanceState(userData.balance || 0);

      // Show warning for unverified users
      if (userData.status === 'unverified') {
        toast.info('Vui lòng xác thực email để sử dụng đầy đủ tính năng của thư viện.', { 
          id: 'unverified_warning',
          duration: 10000 
        });
      }

      // Instantly trigger background prefetching for this role's dashboard (only for active users)
      prefetchRoleData(userData.role, userData.status);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Đăng nhập thất bại';
      return { success: false, error: message };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Ignore logout API errors
    } finally {
      // Set user to null FIRST to disable all queries that depend on authentication
      setUser(null);
      setBalanceState(0);
      // Clear all React Query queries to stop any pending requests
      queryClient.clear();
      // Clear API cache
      if (typeof api.clearCache === 'function') api.clearCache();
      // Clear auth state
      tokenManager.clearAuth();
      // Force full page reload to completely reset app state
      window.location.reload();
    }
  }, [queryClient]);

  // Update balance in state and storage
  const updateBalance = useCallback((newBalance) => {
    setBalanceState(newBalance);
    tokenManager.setBalance(newBalance);
  }, []);

  // Sync localStorage state with AuthContext on mount
  const syncFromStorage = useCallback(() => {
    const token = tokenManager.getToken();
    const storedUser = tokenManager.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setBalanceState(tokenManager.getBalance());
    }
  }, []);

  // Note: 401 handling is done in api.js interceptor to avoid duplication

  const value = {
    user,
    balance,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    fetchUser,
    updateBalance,
    syncFromStorage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;