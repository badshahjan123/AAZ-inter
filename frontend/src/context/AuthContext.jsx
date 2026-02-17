import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useInactivityLogout from '../hooks/useInactivityLogout';
import { api, cachedFetch } from '../config/api';
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
        try {
          const parsedUser = JSON.parse(storedUser);
          
          const res = await cachedFetch(api('/api/auth/me'), {
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
          localStorage.removeItem('user');
          localStorage.removeItem('aaz-cart');
          setUser(null);
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
        if (data.twoFactorRequired) {
          return { success: true, twoFactorRequired: true, userId: data.userId };
        }
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return { success: true };
      }
      return { success: false, message: data.message || data.error || 'Login failed' };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, []);

  const setup2FA = useCallback(async () => {
    try {
      if (!user) return { success: false, message: 'Not authenticated' };
      const response = await fetch(api('/api/auth/2fa/setup'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to setup 2FA' };
    }
  }, [user]);

  const verify2FA = useCallback(async (token = null) => {
    try {
      if (!user) return { success: false, message: 'Not authenticated' };
      const isQuickToggle = token === null;
      const response = await fetch(api('/api/auth/2fa/verify'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token, 
          quickToggle: isQuickToggle 
        })
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, twoFactorEnabled: true, hasTwoFactorSecret: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, message: data.message || 'Verification failed' };
    } catch (error) {
      return { success: false, message: 'Verification failed' };
    }
  }, [user]);

  const disable2FA = useCallback(async () => {
    try {
      if (!user) return { success: false, message: 'Not authenticated' };
      const response = await fetch(api('/api/auth/2fa/disable'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, twoFactorEnabled: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to disable 2FA' };
    } catch (error) {
      return { success: false, message: 'Failed to disable 2FA' };
    }
  }, [user]);

  const verify2FALogin = useCallback(async (userId, token) => {
    try {
      const response = await fetch(api('/api/auth/2fa/login-verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return { success: true };
      }
      return { success: false, message: data.message || '2FA verification failed' };
    } catch (error) {
      return { success: false, message: 'Server error' };
    }
  }, []);


  const signup = useCallback(async (userData) => {
    try {
      const response = await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, email: data.email, isVerified: data.isVerified };
      }
      return { success: false, message: data.message || data.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Server connection error. Please try again later.' };
    }
  }, []);

  const verifyEmailByToken = useCallback(async (token) => {
    try {
      const response = await fetch(api(`/api/auth/verify-email/${token}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Verification failed' };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await fetch(api('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Error processing request' };
    } catch (error) {
      return { success: false, message: 'Server error' };
    }
  }, []);

  const resetPassword = useCallback(async (token, password, otpToken = null) => {
    try {
      const response = await fetch(api(`/api/auth/reset-password/${token}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token: otpToken }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.twoFactorRequired) {
          return { success: true, twoFactorRequired: true };
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Reset failed' };
    } catch (error) {
      return { success: false, message: 'Server error' };
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

  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user || !user.token) return { success: false, message: 'Not authenticated' };

      const response = await fetch(api('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, message: data.message || 'Update failed' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Server connection error' };
    }
  }, [user]);

  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!user || !user.token) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await fetch(api('/api/auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message || 'Verification email sent!' };
      }
      
      return { success: false, message: data.message || 'Failed to send verification email' };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  }, [user]);

  useInactivityLogout(logout, 10 * 60 * 1000, !!user);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    verifyEmailByToken,
    forgotPassword,
    resetPassword,
    setup2FA,
    verify2FA,
    disable2FA,
    verify2FALogin,
    logout,
    updateProfile,
    resendVerificationEmail,
    isAuthenticated: !!user
  }), [user, loading, login, signup, verifyEmailByToken, forgotPassword, resetPassword, setup2FA, verify2FA, disable2FA, verify2FALogin, logout, updateProfile, resendVerificationEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

