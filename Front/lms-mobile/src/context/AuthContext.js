import React, { createContext, useState, useEffect, useContext } from 'react';
import { DeviceEventEmitter } from 'react-native';
import tokenManager from '../api/tokenManager';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize token manager and load user
    const initAuth = async () => {
      const { user: savedUser } = await tokenManager.init();
      if (savedUser) {
        setUser(savedUser);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for session expiry from api interceptor
    const subscription = DeviceEventEmitter.addListener('session_expired', () => {
      setUser(null);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
    await tokenManager.clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
