import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hims_user');
    const storedToken = localStorage.getItem('hims_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await api.post('/auth/login', { usernameOrEmail, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('hims_token', token);
      localStorage.setItem('hims_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('hims_token');
    localStorage.removeItem('hims_user');
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password.';
      return { success: false, message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process forgot password request.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, forgotPassword, loading }}>
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
