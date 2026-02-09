import { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuth';
import { useSocket } from '../../../context/SocketContext';

const Header = ({ onMenuClick }) => {
  const { admin } = useAdminAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (socket) {
      const handleNewOrder = (order) => {
        const newNotif = {
          id: Date.now(),
          title: 'New Order',
          message: `${order.customerName} placed an order of Rs. ${order.totalAmount}`,
          time: 'Just now',
          type: 'order'
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 5));
        setUnreadCount(prev => prev + 1);
      };

      socket.on('newOrder', handleNewOrder);

      return () => {
        socket.off('newOrder', handleNewOrder);
      };
    }
  }, [socket]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) setUnreadCount(0);
  };

  return (
    <header className="admin-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuClick}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={24} color="var(--admin-text-sub)" />
        </button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>
          Welcome back, {admin?.name || 'Admin'}
        </h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={toggleDropdown}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              padding: '8px', 
              borderRadius: '50%',
              backgroundColor: showDropdown ? '#f1f5f9' : 'transparent'
            }}
          >
            <Bell size={22} color="var(--admin-text-sub)" />
            {unreadCount > 0 && (
              <span className="notification-dot" style={{ top: '6px', right: '6px' }}></span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: '320px',
              background: 'white',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginTop: '10px',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Notifications</span>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-sub)' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>{n.time}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontWeight: 600, textDecoration: 'none' }} onClick={() => setShowDropdown(false)}>
                  View all orders
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }} className="admin-user-info">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-light) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }} className="admin-user-text">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text-main)', lineHeight: 1.2 }}>
              {admin?.name || 'Admin'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-sub)' }}>Master Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
