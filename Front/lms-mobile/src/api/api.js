import axios from 'axios';
import { tokenManager } from './tokenManager';
import { API_BASE_URL } from './config';
import { Alert, DeviceEventEmitter } from 'react-native';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

api.interceptors.request.use(
  (config) => {
    // In React Native, we read from memory token synchronously
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const oldToken = tokenManager.getToken();
      if (!oldToken) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        }).catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/refresh-token`, {}, {
          headers: {
            Authorization: `Bearer ${oldToken}`
          }
        });

        const { access_token } = response.data;
        await tokenManager.setToken(access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        onRefreshed(access_token);

        return api(originalRequest);
      } catch (refreshError) {
        await tokenManager.clearAuth();
        DeviceEventEmitter.emit('session_expired');
        Alert.alert('Phiên hết hạn', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // App's context/navigation will handle redirect based on tokenManager state
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (error.response && error.response.status === 401) {
      await tokenManager.clearAuth();
      DeviceEventEmitter.emit('session_expired');
      Alert.alert('Phiên hết hạn', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
