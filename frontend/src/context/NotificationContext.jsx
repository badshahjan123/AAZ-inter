import { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/common/Notification';
import '../components/common/Notification.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('user_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newNotif = { id, message, type, duration, timestamp: new Date(), read: false };
    
    // Toast notification
    setNotifications(prev => [...prev, newNotif]);
    
    // Persistent history
    setHistory(prev => {
      const updated = [newNotif, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem('user_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAsRead = useCallback(() => {
    setHistory(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('user_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('user_notifications');
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      history, 
      unreadCount: history.filter(n => !n.read).length,
      markAsRead,
      clearHistory 
    }}>
      {children}
      <div className="notification-container">
        {notifications.map(n => (
          <Notification
            key={n.id}
            message={n.message}
            type={n.type}
            duration={n.duration}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
