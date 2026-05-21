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
        // 1. Common User Profile data loaded for ALL roles: user, author, librarian, admin
        queryClient.prefetchQuery({
          queryKey: ['user', 'profile'],
          queryFn: () => api.get('/profile').then(res => res.data?.data || res.data || res || {}),
          staleTime: 30 * 1000,
        }).catch(() => {});

        queryClient.prefetchQuery({
          queryKey: ['user', 'balance'],
          queryFn: () => api.get('/balance').then(res => res.data?.data || res.data || res || { balance: '0' }),
          staleTime: 5 * 1000,
        }).catch(() => {});

        queryClient.prefetchQuery({
          queryKey: ['user', 'borrows'],
          queryFn: () => api.get('/my-borrows', { params: { t: Date.now() } }).then(res => res.data?.data || res.data || res || []),
          staleTime: 5 * 1000,
        }).catch(() => {});

        queryClient.prefetchQuery({
          queryKey: ['user', 'reservations'],
          queryFn: () => api.get('/my-reservations').then(res => res.data?.data || res.data || res || []),
          staleTime: 5 * 1000,
        }).catch(() => {});

        queryClient.prefetchQuery({
          queryKey: ['user', 'ebooks'],
          queryFn: () => api.get('/my-ebooks').then(res => res.data?.data || res.data || res || []),
          staleTime: 5 * 1000,
        }).catch(() => {});

        // 2. Role-specific dashboard prefetching
        if (role === 'librarian') {
          publicService.getCategories().catch(() => {});

          // Prefetch librarian dashboard metrics
          queryClient.prefetchQuery({
            queryKey: ['books', { limit: 200 }],
            queryFn: () => api.get('/books', { params: { limit: 200 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'reservations', { status: 'pending', limit: 10 }],
            queryFn: () => api.get('/librarian/reservations', { params: { status: 'pending', limit: 10 } }).then(res => res.data?.data || res.data || []),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['ebooks', { status: 'pending', limit: 100 }],
            queryFn: () => api.get('/librarian/ebooks/all', { params: { limit: 1000, status: 'pending', limit: 100 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['ebooks', { limit: 1000 }],
            queryFn: () => api.get('/librarian/ebooks/all', { params: { limit: 1000 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'borrows', { limit: 10 }],
            queryFn: () => api.get('/librarian/borrows', { params: { limit: 10 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'borrows', { status: 'active', limit: 200 }],
            queryFn: () => api.get('/librarian/borrows', { params: { status: 'active', limit: 200 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'contact-messages', 'stats'],
            queryFn: () => api.get('/librarian/contact-messages/stats').then(res => res.data || { pending_count: 0 }),
            staleTime: 5 * 60 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'finance-summary'],
            queryFn: () => api.get('/librarian/finance/summary').then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['management', 'display-items'],
            queryFn: () => api.get('/management/display-items').then(res => res.data),
            staleTime: 5 * 60 * 1000,
          }).catch(() => {});

          // Preload Librarian React Components (JS chunks)
          import('../pages/Management/LibrarianDashboard').catch(() => {});
          import('../pages/Management/ManageBooks').catch(() => {});
          import('../pages/Management/ManageAdminEbooks').catch(() => {});
          import('../pages/Management/LibrarianUploadEbook').catch(() => {});
          import('../pages/Management/ManageBorrows').catch(() => {});
          import('../pages/Management/OfflineBorrow').catch(() => {});
          import('../pages/Management/ManageReservations').catch(() => {});
          import('../pages/Management/ManageLostBooks').catch(() => {});
          import('../pages/Management/LibrarianFinance').catch(() => {});
          import('../pages/Management/LibrarianUsers').catch(() => {});
          import('../pages/Management/LibrarianReports').catch(() => {});
          import('../pages/Management/LibrarianMessages').catch(() => {});
          import('../pages/Management/DisplayManager').catch(() => {});
        } else if (role === 'admin') {
          publicService.getCategories().catch(() => {});

          // Prefetch admin dashboard metrics
          queryClient.prefetchQuery({
            queryKey: ['admin', 'pending-ebooks'],
            queryFn: () => api.get('/management/ebooks/pending').then(res => res.data),
            staleTime: 10 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['admin', 'withdrawals', { status: 'pending' }],
            queryFn: () => api.get('/admin/withdraw-requests', { params: { status: 'pending' } }).then(res => res.data),
            staleTime: 10 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['admin', 'audit-logs'],
            queryFn: () => api.get('/admin/audit-logs').then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['admin', 'revenue'],
            queryFn: () => api.get('/admin/revenue').then(res => res.data),
            staleTime: 10 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['admin', 'transactions', { limit: 10 }],
            queryFn: () => api.get('/admin/transactions', { params: { limit: 10 } }).then(res => res.data?.data || res.data || []),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['librarian', 'borrows', { limit: 10 }],
            queryFn: () => api.get('/librarian/borrows', { params: { limit: 10 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['books', { limit: 200 }],
            queryFn: () => api.get('/books', { params: { limit: 200 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['ebooks', { limit: 100 }],
            queryFn: () => api.get('/librarian/ebooks/all', { params: { limit: 1000, limit: 100 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['admin', 'users', { limit: 100 }],
            queryFn: () => api.get('/admin/users', { params: { limit: 100 } }).then(res => res.data),
            staleTime: 30 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['management', 'display-items'],
            queryFn: () => api.get('/management/display-items').then(res => res.data),
            staleTime: 5 * 60 * 1000,
          }).catch(() => {});

          // Preload Admin React Components (JS chunks)
          import('../pages/Management/DisplayManager').catch(() => {});
        } else if (role === 'author') {
          // Prefetch author dashboard and workspace details
          queryClient.prefetchQuery({
            queryKey: ['author', 'earnings'],
            queryFn: () => api.get('/author/earnings', { params: { t: Date.now() } }).then(res => res.data?.data || res.data || res || {}),
            staleTime: 1 * 60 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['author', 'ebooks', {}],
            queryFn: () => api.get('/author/ebooks', { params: { t: Date.now() } }).then(res => res.data),
            staleTime: 5 * 60 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['author', 'sales-history', {}],
            queryFn: () => api.get('/author/earnings-history', { params: { t: Date.now() } }).then(res => res.data),
            staleTime: 2 * 60 * 1000,
          }).catch(() => {});

          queryClient.prefetchQuery({
            queryKey: ['author', 'withdraw-history', {}],
            queryFn: () => api.get('/author/withdraw-history', { params: { t: Date.now() } }).then(res => res.data?.data || res.data || res || []),
            staleTime: 2 * 60 * 1000,
          }).catch(() => {});
          // Preload Author React Components (JS chunks)
          import('../pages/Management/AuthorDashboard').catch(() => {});
          import('../pages/Management/MyEbooks').catch(() => {});
          import('../pages/Management/AuthorEarnings').catch(() => {});
          import('../pages/Management/UploadEbook').catch(() => {});
        }
      } catch (e) {
        // Ignore prefetch errors silently
      }
    }, 500); // 500ms delay to ensure login API completes fully first
  }, [queryClient]);

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
    
    const initializeAuth = async () => {
      if (isVerified && newToken) {
        tokenManager.setToken(newToken);
        toast.success('Xác thực email thành công! Bạn đã có thể sử dụng tất cả tính năng.', { id: 'email_verified' });
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch fresh user details with the new token
        const userData = await fetchUser();
        if (userData) {
          prefetchRoleData(userData.role, userData.status);
        }
        setLoading(false);
        return;
      }
      
      if (params.get('verified') === '0') {
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
        
        // Auto fetch fresh data to sync state with backend
        fetchUser();
        
        // Prefetch dashboard data to RAM (only for active users)
        prefetchRoleData(storedUser.role, storedUser.status);
      }
      setLoading(false);
    };

    initializeAuth();
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

      // Clear only user-specific or sensitive queries, keeping general books, ebooks and categories cache intact
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      allQueries.forEach(query => {
        const queryKey = query.queryKey;
        const firstKey = queryKey[0];
        const userSpecificRoles = ['user', 'author', 'librarian', 'admin'];
        if (userSpecificRoles.includes(firstKey)) {
          queryClient.removeQueries({ queryKey });
        }
      });

      // Clear user-private API cache while keeping books/ebooks
      if (typeof api.clearCache === 'function') api.clearCache();
      // Clear auth state
      tokenManager.clearAuth();
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