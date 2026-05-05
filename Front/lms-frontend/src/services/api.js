import axios from 'axios';
import { tokenManager } from './tokenManager';

// Detect if running on ngrok or localhost
const isNgrok = window.location.hostname.includes('ngrok');

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  },
});

// Cache storage
const apiCache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours default

// List of endpoints that should NEVER be cached
const CACHE_BLACKLIST = [
  '/balance',
  '/notifications',
  '/messages',
  '/profile',
  '/contact-messages',
  '/author/earnings',
  '/author/withdraw-history',
  '/author/withdraw'
];

import { toast } from 'sonner';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Add subscriber to queue when token refresh is in progress
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Request interceptor to attach access token and check cache
api.interceptors.request.use(
  (config) => {
    // 1. Attach token
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Handle Caching (Only for GET)
    if (config.method === 'get') {
      const isBlacklisted = CACHE_BLACKLIST.some(path => config.url.includes(path));
      const skipCache = config.skipCache === true;

      if (!isBlacklisted && !skipCache) {
        const cacheKey = config.url + JSON.stringify(config.params || {});
        const cachedItem = apiCache.get(cacheKey);

        if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
          // Return a resolved promise with the cached data
          // We wrap it in a custom adapter response to satisfy Axios
          config.adapter = () => {
            return Promise.resolve({
              data: cachedItem.data,
              status: 200,
              statusText: 'OK (from cache)',
              headers: config.headers,
              config: config,
              request: {}
            });
          };
        }
        
        // Store key for reference in response interceptor
        config.currentCacheKey = cacheKey;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Store in cache if requested
    const config = response.config;
    if (config.currentCacheKey && response.status === 200) {
      apiCache.set(config.currentCacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh if no token exists (user logged out)
      const oldToken = tokenManager.getToken();
      if (!oldToken) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        }).catch(err => Promise.reject(err));
      }

      // Start refresh process
      isRefreshing = true;

      try {
        const response = await axios.post('/api/refresh-token', {}, {
          headers: {
            Authorization: `Bearer ${oldToken}`
          }
        });

        const { access_token } = response.data;

        // Update token in storage
        tokenManager.setToken(access_token);

        // Update Authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Notify all queued requests
        onRefreshed(access_token);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect
        apiCache.clear();
        if (tokenManager.hasToken()) {
          tokenManager.clearAuth();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { id: 'session_expired' });
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other 401 errors (e.g., no token at all)
    if (error.response && error.response.status === 401) {
      apiCache.clear();
      if (tokenManager.hasToken()) {
        tokenManager.clearAuth();
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { id: 'session_expired' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    
    return Promise.reject(error);
  }
);

// Public method to manually clear cache
api.clearCache = () => {
  apiCache.clear();
};

// Public method to clear cache for specific endpoint pattern
api.clearCacheByPattern = (pattern) => {
  for (const [key] of apiCache) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
};

export default api;