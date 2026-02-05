import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useInactivityLogout from '../../hooks/useInactivityLogout';
import { api } from '../../config/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminToken');
    if (storedAdmin) {
       // Ideally verify token with backend here
       // For now, assuming existence implies session
       try {
           const adminData = JSON.parse(localStorage.getItem('adminData'));
           setAdmin(adminData);
       } catch (e) {
           localStorage.removeItem('adminToken');
           localStorage.removeItem('adminData');
       }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(api('/api/auth/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify({ name: data.name, email: data.email }));
      setAdmin(data);
      navigate('/admin/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    navigate('/admin/login');
  };

  // ⏱️ Auto-logout admin after 10 minutes of inactivity
  useInactivityLogout(logout, 10 * 60 * 1000, !!admin);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

