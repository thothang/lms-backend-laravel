import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { catalogService } from '../services/catalogService';
import { adminService } from '../services/adminService';
import { librarianService } from '../services/librarianService';
import { authorService } from '../services/authorService';
import { publicService } from '../services/publicService';
import { authService } from '../services/authService';
import { tokenManager } from '../services/tokenManager';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// ===== HOME PAGE QUERIES =====
export const useHomeData = () => {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => publicService.getHomeData(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== BOOK/EBOOK DETAILS QUERIES =====
export const useBookDetails = (id) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => catalogService.getBookDetails(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useEbookDetails = (id) => {
  return useQuery({
    queryKey: ['ebook', id],
    queryFn: () => catalogService.getEbookDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== CATEGORIES =====
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => publicService.getCategories(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== SEARCH =====
export const useSearch = (params = {}) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => publicService.search(params),
    enabled: Object.keys(params).length > 0 || params.keyword !== undefined,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== PUBLIC BOOKS =====
export const useHotBooks = () => {
  return useQuery({
    queryKey: ['books', 'hot'],
    queryFn: () => publicService.getHotBooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useFeaturedBooks = () => {
  return useQuery({
    queryKey: ['books', 'featured'],
    queryFn: () => publicService.getFeaturedBooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCarouselBooks = () => {
  return useQuery({
    queryKey: ['books', 'carousel'],
    queryFn: () => publicService.getCarouselBooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== PUBLIC EBOOKS =====
export const useHotEbooks = () => {
  return useQuery({
    queryKey: ['ebooks', 'hot'],
    queryFn: () => publicService.getHotEbooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useFeaturedEbooks = () => {
  return useQuery({
    queryKey: ['ebooks', 'featured'],
    queryFn: () => publicService.getFeaturedEbooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCarouselEbooks = () => {
  return useQuery({
    queryKey: ['ebooks', 'carousel'],
    queryFn: () => publicService.getCarouselEbooks(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// ===== AUTH / PUBLIC ACTIONS =====
export const useVerifyEmail = (token) => {
  return useQuery({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () => api.get(`/verify-email/${token}`).then(res => res.data),
    enabled: !!token,
    staleTime: Infinity, // verification tokens are one-time
    retry: false,
  });
};

export const useReadEbook = (id) => {
  return useQuery({
    queryKey: ['ebook', 'read', id],
    queryFn: () => catalogService.readEbook(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCheckEbookAccess = (id) => {
  return useQuery({
    queryKey: ['ebook', 'access', id],
    queryFn: () => catalogService.checkEbookAccess(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEbookPreview = (id) => {
  return useQuery({
    queryKey: ['ebook', 'preview', id],
    queryFn: () => catalogService.previewEbook(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ===== ADMIN QUERIES =====
export const useReportOverview = () => {
  return useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: () => adminService.getReportOverview(),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
    retry: false, // Don't retry on 500 errors
  });
};

export const usePendingEbooks = () => {
  return useQuery({
    queryKey: ['admin', 'pending-ebooks'],
    queryFn: () => adminService.getPendingEbooks(),
    staleTime: 10 * 1000, // Cache for 10 seconds
    refetchOnWindowFocus: true, // Refetch on focus to see updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useWithdrawalRequests = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'withdrawals', params],
    queryFn: () => adminService.getWithdrawalRequests(params),
    staleTime: 10 * 1000, // Cache for 10 seconds
    refetchOnWindowFocus: true, // Refetch on focus to see updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useRevenue = () => {
  return useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: () => adminService.getRevenue(),
    staleTime: 10 * 1000, // Cache for 10 seconds
    refetchOnWindowFocus: true, // Refetch on focus to see updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useTransactions = (params = { limit: 10 }) => {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () => api.get('/admin/transactions', { params }).then(res => res.data?.data || res.data || []),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useBooks = (params = {}) => {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => api.get('/books', { params }).then(res => res.data),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useEbooks = (params = {}) => {
  return useQuery({
    queryKey: ['ebooks', params],
    queryFn: () => api.get('/librarian/ebooks/all', { params: { limit: 1000, ...params } }).then(res => res.data),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.get('/admin/users', { params }).then(res => res.data),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch on focus to see updates
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianPermissions = () => {
  return useQuery({
    queryKey: ['admin', 'librarian-permissions'],
    queryFn: () => adminService.getLibrarianPermissions(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ===== LIBRARIAN QUERIES =====
export const useBorrows = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'borrows', params],
    queryFn: () => api.get('/librarian/borrows', { params }).then(res => res.data),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useSearchBorrows = (keyword = '') => {
  return useQuery({
    queryKey: ['librarian', 'borrows', 'search', keyword],
    queryFn: () => api.get('/librarian/borrows', { params: { keyword, status: 'active' } }).then(res => res.data?.data || res.data || []),
    enabled: !!keyword.trim(),
    staleTime: 10 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['librarian', 'finance-summary'],
    queryFn: () => librarianService.getFinanceSummary(),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useFinanceDeposits = () => {
  return useQuery({
    queryKey: ['librarian', 'finance-deposits'],
    queryFn: () => librarianService.getFinanceDeposits(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useDepositSummary = () => {
  return useQuery({
    queryKey: ['librarian', 'deposit-summary'],
    queryFn: () => librarianService.getDepositSummary(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibraryFees = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'library-fees', params],
    queryFn: () => librarianService.getLibraryFees(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useContactMessageStats = () => {
  return useQuery({
    queryKey: ['librarian', 'contact-messages', 'stats'],
    queryFn: () => librarianService.getContactMessageStats().then(res => res || { pending_count: 0 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useAllTopups = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'topups', params],
    queryFn: () => librarianService.getAllTopups(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianUsers = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'users', params],
    queryFn: () => librarianService.getUsers(params),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianMessages = () => {
  return useQuery({
    queryKey: ['librarian', 'messages'],
    queryFn: () => librarianService.getMessages(),
    staleTime: 15 * 1000, // Cache 15 seconds - messages change frequently
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
};

export const useLibrarianReservations = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'reservations', params],
    queryFn: () => librarianService.getReservations(params).then(res => res?.data || res || []),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useContactMessages = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'contact-messages', params],
    queryFn: () => api.get('/librarian/contact-messages', { params }).then(res => res.data),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useLibrarianBorrowStats = () => {
  return useQuery({
    queryKey: ['librarian', 'reports', 'borrow-stats'],
    queryFn: () => librarianService.getBorrowStats().then(res => res.data || res || {}),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianTopBooks = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'reports', 'top-books', params],
    queryFn: () => librarianService.getTopBooks(params).then(res => res || []),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianCategoryStats = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'reports', 'category-stats', params],
    queryFn: () => librarianService.getCategoryStats(params).then(res => res || []),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

export const useLibrarianReturnStats = (params = {}) => {
  return useQuery({
    queryKey: ['librarian', 'reports', 'return-stats', params],
    queryFn: () => librarianService.getReturnStats(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

// ===== USER QUERIES =====
export const useNotifications = (isAuthenticated = false, isActive = true) => {
  return useQuery({
    queryKey: ['user', 'notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data?.data || res.data || []),
    enabled: isAuthenticated && isActive, // Only fetch when user is authenticated AND active
    refetchInterval: isAuthenticated && isActive ? 60000 : false, // Refetch every 60 seconds if authenticated and active
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent errors after logout
    retry: false, // Don't retry on 401 errors
  });
};

export const usePurchasedEbooks = () => {
  return useQuery({
    queryKey: ['user', 'purchased-ebooks'],
    queryFn: () => api.get('/user/ebooks').then(res => res.data),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUserMessages = () => {
  return useQuery({
    queryKey: ['user', 'messages'],
    queryFn: () => api.get('/messages').then(res => res.data?.data || res.data || []),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

// ===== AUTHOR QUERIES =====
export const useAuthorEarnings = () => {
  return useQuery({
    queryKey: ['author', 'earnings'],
    queryFn: () => api.get('/author/earnings', { params: { t: Date.now() } }).then(res => res.data?.data || res.data || res || {}),
    staleTime: 1 * 60 * 1000, // Cache 1 phút - earnings thay đổi thường xuyên
    refetchOnWindowFocus: true, // Refetch khi tab được focus
  });
};

export const useAuthorEbooks = (params = {}) => {
  return useQuery({
    queryKey: ['author', 'ebooks', params],
    queryFn: () => api.get('/author/ebooks', { params: { ...params, t: Date.now() } }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAuthorWithdrawHistory = (params = {}) => {
  return useQuery({
    queryKey: ['author', 'withdraw-history', params],
    queryFn: () => api.get('/author/withdraw-history', { params: { ...params, t: Date.now() } }).then(res => res.data?.data || res.data || res || []),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAuthorSalesHistory = (params = {}) => {
  return useQuery({
    queryKey: ['author', 'sales-history', params],
    queryFn: () => api.get('/author/earnings-history', { params: { ...params, t: Date.now() } }).then(res => res.data),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ===== USER PROFILE QUERIES =====
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.get('/profile').then(res => res.data?.data || res.data || res || {}),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });
};

export const useUserBalance = () => {
  return useQuery({
    queryKey: ['user', 'balance'],
    queryFn: () => api.get('/balance').then(res => res.data?.data || res.data || res || { balance: '0' }),
    staleTime: 5 * 1000, // Cache 5 giây - balance thay đổi thường xuyên
    refetchOnWindowFocus: true, // Refetch khi tab được focus
    refetchInterval: 30 * 1000, // Refetch mỗi 30 giây để cập nhật số dư
  });
};

export const useUserBorrows = () => {
  return useQuery({
    queryKey: ['user', 'borrows'],
    queryFn: async () => {
      try {
        const res = await api.get('/my-borrows', { params: { t: Date.now() } });
        return res.data?.data || res.data || res || [];
      } catch (error) {
        // Return empty array for unverified users (403)
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // Cache 2 phút
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on errors
  });
};

export const useUserReservations = () => {
  return useQuery({
    queryKey: ['user', 'reservations'],
    queryFn: async () => {
      try {
        const res = await api.get('/my-reservations');
        return res.data?.data || res.data || res || [];
      } catch (error) {
        // Return empty array for unverified users (403)
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on errors
  });
};

// ============================================================
// ==================== MUTATIONS ===========================
// ============================================================

// Helper to invalidate all related caches
// React Query 5.x: invalidateQueries with exact: false matches queries whose key STARTS with the given queryKey
// Since query keys often include params objects, we need to invalidate by parent key
export const invalidateRelatedCaches = (queryClient, patterns) => {
  patterns.forEach(pattern => {
    // 1. Invalidate React Query cache
    const queryKey = Array.isArray(pattern) ? pattern : [pattern];
    queryClient.invalidateQueries({
      queryKey,
      exact: false
    });

    // 2. Clear Axios-level manual cache
    if (typeof api.clearCacheByPattern === 'function') {
      // Convert array keys like ['librarian', 'borrows'] to path-like strings 'librarian/borrows'
      const apiPattern = Array.isArray(pattern) ? pattern.join('/') : pattern;
      api.clearCacheByPattern(apiPattern);
      
      // Auto-handle singular-plural mapping for resource endpoints (e.g. book/1 -> books/1)
      if (apiPattern.startsWith('book/')) {
        api.clearCacheByPattern(apiPattern.replace('book/', 'books/'));
      }
      if (apiPattern.startsWith('ebook/')) {
        api.clearCacheByPattern(apiPattern.replace('ebook/', 'ebooks/'));
      }
    }
  });
};

// ===== BORROW/RESERVATION MUTATIONS =====
export const useBorrowBook = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: ({ bookId, days }) => catalogService.borrowBook(bookId, days),
    onMutate: async ({ bookId }) => {
      await queryClient.cancelQueries({ queryKey: ['books'] });
      
      const queries = queryClient.getQueriesData({ queryKey: ['books'], exact: false });
      const previousData = {};
      
      queries.forEach(([queryKey, oldData]) => {
        previousData[JSON.stringify(queryKey)] = oldData;
        queryClient.setQueryData(queryKey, (old) => {
          if (!old) return old;
          
          // If it's a list
          if (old.data && Array.isArray(old.data)) {
            const newData = old.data.map(item => {
              if (item.id === bookId) {
                return {
                  ...item,
                  available_copies: Math.max(0, item.available_copies - 1)
                };
              }
              return item;
            });
            return { ...old, data: newData };
          }
          
          // If it's a single book detail
          if (old.id === bookId) {
            return {
              ...old,
              available_copies: Math.max(0, old.available_copies - 1)
            };
          }
          
          return old;
        });
      });
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Mượn sách thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'borrows'],
        ['user', 'notifications'],
      ]);
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([keyStr, oldData]) => {
          try { queryClient.setQueryData(JSON.parse(keyStr), oldData); } catch(e) {}
        });
      }
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Không thể mượn sách');
    },
  });
};

export const useReserveBook = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: ({ bookId, days }) => catalogService.reserveBook(bookId, days),
    onSuccess: () => {
      toast.success('Đặt trước thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'reservations'],
        ['user', 'notifications'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Không thể đặt trước');
    },
  });
};

export const usePurchaseEbook = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: (id) => catalogService.purchaseEbook(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['ebook', id] });
      const previousEbook = queryClient.getQueryData(['ebook', id]);
      queryClient.setQueryData(['ebook', id], (old) => ({ ...old, is_purchased: true }));
      return { previousEbook, id };
    },
    onSuccess: (data, variables) => {
      toast.success('Mua ebook thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['ebook', variables],
        ['user', 'ebooks'],
        ['user', 'balance'],
        'home',
        'ebooks',
        'reports',
        'admin',
        ['user', 'notifications'],
      ]);
    },
    onError: (err, variables, context) => {
      toast.error(err.response?.data?.message || 'Không thể mua ebook');
      if (context?.previousEbook) {
        queryClient.setQueryData(['ebook', context.id], context.previousEbook);
      }
    },
    onSettled: (data, error, variables) => {
      invalidateRelatedCaches(queryClient, [['ebook', variables]]);
    },
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: (borrowId) => api.post(`/return/${borrowId}`),
    onSuccess: () => {
      toast.success('Trả sách thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'borrows'],
        ['user', 'notifications'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Không thể trả sách');
    },
  });
};

export const useRenewBook = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: ({ borrowId, days }) => api.post(`/borrow/${borrowId}/renew`, { days }),
    onSuccess: () => {
      toast.success('Gia hạn mượn sách thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['user', 'borrows'],
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        ['user', 'balance'],
        ['user', 'notifications'],
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Không thể gia hạn');
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  return useMutation({
    mutationFn: (id) => api.delete(`/reservation/${id}`),
    onSuccess: () => {
      toast.success('Hủy đặt trước thành công!');
      fetchUser().catch(() => {});
      invalidateRelatedCaches(queryClient, [
        ['user', 'reservations'],
        ['librarian', 'reservations'],
        ['librarian', 'stats'],
        'books',
        'home',
        ['user', 'balance'],
        ['user', 'notifications'],
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể hủy đặt trước');
    },
  });
};

// ===== LIBRARIAN/ADMIN MUTATIONS =====

// --- Book Management ---
export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => librarianService.createBook(formData),
    onSuccess: () => {
      toast.success('Tạo sách mới thành công!');
      invalidateRelatedCaches(queryClient, [
        'books',
        'home',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể tạo sách');
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => librarianService.updateBook(id, formData),
    onSuccess: () => {
      toast.success('Cập nhật sách thành công!');
      invalidateRelatedCaches(queryClient, [
        'books',
        'book',
        'home',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật sách');
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => librarianService.deleteBook(id),
    onSuccess: () => {
      toast.success('Xóa sách thành công.');
      invalidateRelatedCaches(queryClient, [
        'books',
        'book',
        'home',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa sách');
    },
  });
};

export const useAddCopy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, quantity }) => librarianService.addCopy(bookId, quantity),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['book', variables.bookId] });
      const previousBook = queryClient.getQueryData(['book', variables.bookId]);
      if (previousBook) {
        queryClient.setQueryData(['book', variables.bookId], {
          ...previousBook,
          total_copies: (previousBook.total_copies || 0) + Number(variables.quantity),
          available_copies: (previousBook.available_copies || 0) + Number(variables.quantity),
        });
      }
      return { previousBook };
    },
    onSuccess: (data, variables) => {
      toast.success('Thêm bản sao thành công!');
      invalidateRelatedCaches(queryClient, [
        ['book', variables.bookId],
        'books',
        'librarian',
      ]);
    },
    onError: (err, variables, context) => {
      toast.error(err.response?.data?.message || 'Không thể thêm bản sao');
      if (context?.previousBook) {
        queryClient.setQueryData(['book', variables.bookId], context.previousBook);
      }
    },
  });
};

export const useDeleteCopy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (copyId) => librarianService.deleteCopy(copyId),
    onSuccess: () => {
      toast.success('Xóa bản sao thành công.');
      invalidateRelatedCaches(queryClient, [
        'books',
        'book',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa bản sao');
    },
  });
};

// --- Display Management (Admin & Librarian) ---
export const useDisplayItems = () => {
  return useQuery({
    queryKey: ['management', 'display-items'],
    queryFn: () => api.get('/management/display-items').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useToggleDisplayItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/management/display-items/toggle', data).then(res => res.data),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái hiển thị thành công!');
      invalidateRelatedCaches(queryClient, ['management', 'books', 'home']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });
};

export const useReorderDisplayItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/management/display-items/reorder', data).then(res => res.data),
    onSuccess: () => {
      toast.success('Cập nhật thứ tự thành công!');
      invalidateRelatedCaches(queryClient, ['management', 'books', 'home']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thứ tự');
    },
  });
};

// --- Ebook Management ---
export const useUploadEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => librarianService.uploadEbook(formData),
    onSuccess: () => {
      toast.success('Upload ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'ebooks',
        'home',
        'admin',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể upload ebook');
    },
  });
};

export const useUpdateEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => librarianService.updateEbook(id, formData),
    onSuccess: () => {
      toast.success('Cập nhật ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'ebooks',
        'ebook',
        'home',
        'admin',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ebook');
    },
  });
};

export const useDeleteEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/librarian/ebooks/${id}`),
    onSuccess: () => {
      toast.success('Đã chuyển ebook vào thùng rác.');
      invalidateRelatedCaches(queryClient, [
        'ebooks',
        'ebook',
        'home',
        'admin',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa ebook');
    },
  });
};

export const useRestoreEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/librarian/ebooks/${id}/restore`),
    onSuccess: () => {
      toast.success('Khôi phục ebook thành công.');
      invalidateRelatedCaches(queryClient, [
        'ebooks',
        'ebook',
        'home',
        'admin',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể khôi phục ebook');
    },
  });
};

export const useForceDeleteEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/librarian/ebooks/${id}/force`),
    onSuccess: () => {
      toast.success('Xóa vĩnh viễn ebook.');
      invalidateRelatedCaches(queryClient, [
        'ebooks',
        'ebook',
        'home',
        'admin',
        'librarian',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa vĩnh viễn ebook');
    },
  });
};

// --- Ebook Approvals ---
export const useApproveEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.approveEbook(id),
    onSuccess: () => {
      toast.success('Duyệt ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'pending-ebooks',
        'ebooks',
        'ebook',
        'home',
        'reports',
        'admin',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể duyệt ebook');
    },
  });
};

export const useRejectEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminService.rejectEbook(id, reason),
    onSuccess: () => {
      toast.success('Từ chối ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'pending-ebooks',
        'ebooks',
        'ebook',
        'home',
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể từ chối ebook');
    },
  });
};

// --- Borrow Management ---
export const useBorrowOffline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (borrowData) => librarianService.borrowOffline(borrowData),
    onSuccess: () => {
      toast.success('Mượn sách offline thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'borrows'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể mượn sách');
    },
  });
};

export const useReturnOffline = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (borrowId) => librarianService.returnOffline(borrowId),
    onSuccess: () => {
      toast.success('Trả sách offline thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'reservations'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'profile'],
        ['user', 'borrows'],
        ['user', 'reservations'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể trả sách');
    },
  });
};

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/librarian/borrows/${id}/confirm-pickup`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['librarian', 'borrows'] });
      
      const queries = queryClient.getQueriesData({ queryKey: ['librarian', 'borrows'], exact: false });
      const previousData = {};
      
      queries.forEach(([queryKey, oldData]) => {
        previousData[JSON.stringify(queryKey)] = oldData;
        
        queryClient.setQueryData(queryKey, (old) => {
          if (!old) return old;
          const dataArr = Array.isArray(old) ? old : (old.data || []);
          
          const newData = dataArr.map(item => {
            if (item.id === id) {
              return { ...item, status: 'borrowed' };
            }
            return item;
          });
          
          if (Array.isArray(old)) return newData;
          return { ...old, data: newData };
        });
      });
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Xác nhận nhận sách thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'reservations'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'profile'],
        ['user', 'borrows'],
        ['user', 'reservations'],
      ]);
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([keyStr, oldData]) => {
          try { queryClient.setQueryData(JSON.parse(keyStr), oldData); } catch(e) {}
        });
      }
      console.error('Confirm pickup error:', err.response?.data);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Không thể xác nhận');
    },
  });
};

export const useConfirmReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/librarian/borrows/${id}/confirm-return`),
    onSuccess: () => {
      toast.success('Xác nhận trả sách thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'reservations'],
        ['librarian', 'stats'],
        'books',
        'home',
        'reports',
        'admin',
        ['user', 'balance'],
        ['user', 'profile'],
        ['user', 'borrows'],
        ['user', 'reservations'],
      ]);
    },
    onError: (err) => {
      // Show error toast but don't throw - let component handle it
      console.error('Confirm return error:', err.response?.data);
    },
  });
};

export const useCancelPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/librarian/borrows/${id}/cancel-pickup`),
    onSuccess: () => {
      toast.success('Hủy yêu cầu mượn thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'borrows'],
        ['librarian', 'stats'],
        'books',
        'home',
        ['user', 'balance'],
        ['user', 'borrows'],
        'reports',
      ]);
    },
    onError: (err) => {
      console.error('Cancel pickup error:', err.response?.data);
    },
  });
};

// --- Reservation Management ---
export const useConfirmReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => librarianService.confirmReservation(id),
    onSuccess: () => {
      toast.success('Xác nhận đặt trước thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'reservations'],
        ['librarian', 'borrows'],
        'books',
        'home',
        ['user', 'reservations'],
        ['user', 'balance'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xác nhận');
    },
  });
};

// --- Lost Books ---
export const useMarkLost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ copyId, data }) => librarianService.markLost(copyId, data),
    onSuccess: () => {
      toast.success('Đã đánh dấu sách là mất!');
      invalidateRelatedCaches(queryClient, [
        'librarian', 'borrows',
        'books',
        'book',
        'reports',
        'admin',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể đánh dấu mất');
    },
  });
};

// --- User Management ---
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => librarianService.updateUserStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái người dùng thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'users',
        'librarian', 'users',
        ['admin', 'users'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });
};

export const useMakeAuthor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminService.makeAuthor(userId),
    onSuccess: () => {
      toast.success('Phân quyền tác giả thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'users',
        ['admin', 'users'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể phân quyền');
    },
  });
};

export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissions }) => adminService.updatePermissions(userId, permissions),
    onSuccess: () => {
      toast.success('Cập nhật quyền thư viện thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'librarian-permissions',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật quyền');
    },
  });
};

// --- Withdrawal ---
export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }) => adminService.processWithdrawal(id, action, notes),
    onMutate: async ({ id, action, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'withdrawals'] });
      
      // We need to look through all queries that start with ['admin', 'withdrawals']
      // since the query key might include params like { status: 'all' }
      const queries = queryClient.getQueriesData({ queryKey: ['admin', 'withdrawals'], exact: false });
      
      const previousData = {};
      
      queries.forEach(([queryKey, oldData]) => {
        previousData[JSON.stringify(queryKey)] = oldData;
        
        queryClient.setQueryData(queryKey, (old) => {
          if (!old) return old;
          
          const dataArr = Array.isArray(old) ? old : (old.data || []);
          const newData = dataArr.map(item => {
            if (item.id === id) {
              return {
                ...item,
                status: action === 'approve' ? 'completed' : 'rejected',
                notes: notes || item.notes
              };
            }
            return item;
          });
          
          if (Array.isArray(old)) return newData;
          return { ...old, data: newData };
        });
      });
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Xử lý yêu cầu rút tiền thành công!');
      invalidateRelatedCaches(queryClient, [
        'admin', 'withdrawals',
        'admin', 'revenue',
        'admin', 'transactions',
        'reports',
        'author',
      ]);
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([keyStr, oldData]) => {
          try {
            queryClient.setQueryData(JSON.parse(keyStr), oldData);
          } catch(e) {}
        });
      }
      toast.error(err.response?.data?.message || 'Không thể xử lý yêu cầu rút tiền');
    },
  });
};

export const useAuthorWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (withdrawalData) => api.post('/author/withdraw', withdrawalData),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được gửi!');
      invalidateRelatedCaches(queryClient, [
        'author', 'earnings',
        'author', 'withdraw-history',
        'admin', 'withdrawals',
        'admin', 'revenue',
        'admin', 'transactions',
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu rút tiền');
    },
  });
};

// --- Author Ebook Management ---
export const useCreateAuthorEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => authorService.uploadEbook(formData),
    onSuccess: () => {
      toast.success('Tạo ebook mới thành công!');
      invalidateRelatedCaches(queryClient, [
        'author', 'ebooks',
        'home',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể tạo ebook');
    },
  });
};

export const useUpdateAuthorEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => authorService.updateEbook(id, formData),
    onSuccess: () => {
      toast.success('Cập nhật ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'author', 'ebooks',
        'ebook',
        'ebooks',
        'home',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ebook');
    },
  });
};

export const useLibrarianUpdateEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => librarianService.updateEbook(id, formData),
    onSuccess: () => {
      toast.success('Cập nhật ebook thành công!');
      invalidateRelatedCaches(queryClient, [
        'librarian', 'ebooks',
        'ebook',
        'ebooks',
        'home',
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ebook');
    },
  });
};

export const useDeleteAuthorEbook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => authorService.deleteEbook(id),
    onSuccess: () => {
      toast.success('Xóa ebook thành công.');
      invalidateRelatedCaches(queryClient, [
        'author', 'ebooks',
        'ebook',
        'ebooks',
        'home',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa ebook');
    },
  });
};

// --- Settings ---
export const useSettings = () => {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUpdateSettings = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings) => adminService.updateSettings(settings),
    ...options,
    onSuccess: (data, variables, context) => {
      toast.success('Cập nhật cài đặt hệ thống thành công!');
      invalidateRelatedCaches(queryClient, [['admin', 'settings']]);
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (options.onError) {
        options.onError(err, variables, context);
      } else {
        toast.error(err.response?.data?.message || 'Không thể cập nhật cài đặt');
      }
    },
  });
};



// --- Messages ---
export const useSendLibrarianMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => librarianService.sendMessage(data),
    onSuccess: () => {
      toast.success('Gửi tin nhắn thành công!');
      invalidateRelatedCaches(queryClient, [
        'librarian', 'messages',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn');
    },
  });
};

export const useSendUserMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/messages', data),
    onSuccess: () => {
      toast.success('Gửi tin nhắn thành công!');
      invalidateRelatedCaches(queryClient, [
        'user', 'messages',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn');
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, [
        'user', 'notifications',
      ]);
    },
  });
};

export const useMarkMessageRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/messages/${id}/read`),
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, [
        'user', 'messages',
        'librarian', 'messages',
      ]);
    },
  });
};

export const useReplyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }) => api.post(`/librarian/contact-messages/${id}/reply`, { reply_message: reply }),
    onSuccess: () => {
      toast.success('Gửi phản hồi thành công!');
      invalidateRelatedCaches(queryClient, [
        ['librarian', 'contact-messages'],
        ['user', 'messages'],
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi phản hồi');
    },
  });
};

// --- Reviews ---
export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, data }) => catalogService.submitReview(type, id, data),
    onSuccess: (data, variables) => {
      toast.success('Đánh giá thành công!');
      const typeKey = variables.type === 'ebook' ? 'ebook' : 'book';
      invalidateRelatedCaches(queryClient, [
        [typeKey, variables.id],
        'books',
        'ebooks'
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    },
  });
};

// --- User Profile ---
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put('/profile', data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công!');
      invalidateRelatedCaches(queryClient, [
        'user', 'profile',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data) => api.post('/change-password', data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
    },
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount) => api.post('/topup', { amount }),
    onSuccess: () => {
      toast.success('Yêu cầu nạp tiền thành công!');
      invalidateRelatedCaches(queryClient, [
        'user', 'balance',
        'admin', 'transactions',
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể nạp tiền');
    },
  });
};

export const useBuyLibraryTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/buy-library-ticket'),
    onSuccess: () => {
      toast.success('Mua vé thư viện thành công!');
      invalidateRelatedCaches(queryClient, [
        'user', 'balance',
        'admin', 'transactions',
        'reports',
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể mua vé');
    },
  });
};

// --- Auth ---
export const useRegister = () => {
  return useMutation({
    mutationFn: (data) => authService.register(data),
  });
};

// --- Support & Payments ---
export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data) => publicService.submitContact(data),
    onSuccess: () => {
      toast.success('Gửi thư liên hệ thành công!');
    },
  });
};

export const useConfirmTopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, requestId }) => {
      // Use the paymentService for API call
      // We need to import it or use a relative import if it's not exported
      // Since we are in hooks/queries.js, let's use the api directly if needed
      // or assume it's available in services/paymentService
      return api.post('/topup/confirm', { amount, request_id: requestId }).then(res => res.data);
    },
    onSuccess: (data) => {
      invalidateRelatedCaches(queryClient, [
        ['user', 'balance'],
        ['admin', 'transactions'],
        'reports',
      ]);
    },
  });
};

// ===== LOGOUT =====
export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/logout'),
    onSuccess: () => {
      queryClient.clear();
      tokenManager.clearAuth();
      if (typeof api.clearCache === 'function') api.clearCache();
      window.location.href = '/';
    },
  });
};
