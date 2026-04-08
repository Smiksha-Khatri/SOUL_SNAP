import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not authenticated
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, name },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(false);
  };

  const googleLogin = async (code, redirectUri) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/google`,
        { code, redirect_uri: redirectUri },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message 
      };
    }
  };

  const refreshToken = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
      await checkAuth();
      return true;
    } catch {
      setUser(false);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    googleLogin,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
