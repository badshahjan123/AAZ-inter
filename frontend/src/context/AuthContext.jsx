import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useInactivityLogout from '../hooks/useInactivityLogout';
import { api } from '../config/api';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customAuthCheck = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        try {
          const res = await fetch(api('/api/auth/me'), {
            headers: { Authorization: `Bearer ${parsedUser.token}` }
          });
          if (res.ok) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('aaz-cart');
            setUser(null);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    };
    customAuthCheck();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return { success: true };
      }
      return { success: false, message: data.message || data.error || 'Login failed' };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        // If backend auto-verified (e.g. SMTP issue), log user in immediately
        if (data.isVerified && data.token) {
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        }
        return { success: true, email: data.email, isVerified: data.isVerified };
      }
      return { success: false, message: data.message || data.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Server connection error. Please try again later.' };
    }
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    try {
      const response = await fetch(api('/api/auth/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        }
        return { success: true };
      }
      return { success: false, message: data.message || data.error || 'Verification failed' };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('aaz-cart');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  const updateProfile = useCallback((updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [user]);

  useInactivityLogout(logout, 10 * 60 * 1000, !!user);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    verifyEmail,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }), [user, loading, login, signup, verifyEmail, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

