import { createContext, useContext, useState, useEffect } from 'react';
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

  // Check for stored user on mount
  useEffect(() => {
    const customAuthCheck = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
         // Verify token validity
        try {
          const res = await fetch(api('/api/auth/me'), {
            headers: { Authorization: `Bearer ${parsedUser.token}` }
          });
          if (res.ok) {
            setUser(parsedUser);
          } else {
            console.log('Token invalid or user deleted');
            localStorage.removeItem('user');
            localStorage.removeItem('aaz-cart'); // Clear cart
            setUser(null);
          }
        } catch (err) {
           // On network error, maybe keep user logged in or not? 
           // Safer to keep logged in until definitive failure, but here we assume validation fails.
           console.error(err);
        }
      }
      setLoading(false);
    };

    customAuthCheck();
  }, []);

  const login = async (email, password) => {
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
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Do not auto login after signup
        return { success: true, email: data.email };
      } else {
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup Error:', error);
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  const verifyEmail = async (email, otp) => {
      try {
        const response = await fetch(api('/api/auth/verify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Store user and token if verification returns them (auto-login)
          if (data.token) {
              localStorage.setItem('user', JSON.stringify(data));
              setUser(data);
          }
          return { success: true };
        } else {
          return { success: false, message: data.message || 'Verification failed' };
        }
      } catch (error) {
        console.error('Verification Error:', error);
        return { success: false, message: 'Server error. Please try again later.' };
      }
    };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('aaz-cart'); // Clear cart on logout
    // Redirect to login (using window.location since we can't use useNavigate in Provider)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  // Optional: Function to update local profile state
  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ⏱️ Auto-logout after 10 minutes of inactivity
  useInactivityLogout(logout, 10 * 60 * 1000, !!user);

  const value = {
    user,
    loading,
    login,
    signup,
    verifyEmail,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

