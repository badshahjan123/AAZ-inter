import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Package, Tags, ArrowUpRight, Calendar, Bell, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../config/api';

const Dashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalCustomers: 0,
    analytics: []
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchStats();

    if (socket) {
      console.log('Admin Dashboard listener attached to Global Socket');

      // Listen for analytics refresh triggers
      const handleAnalyticsUpdate = () => {
        console.log('🔄 Analytics Update Received - Refreshing dashboard...');
        fetchStats();
      };

      // Listen for New Order Notifications
      const handleNewOrder = (order) => {
        console.log('🔔 New Order Notification:', order);
        setNotification({
          id: order.orderId,
          title: 'New Order Received!',
          message: `${order.customerName} placed an order for Rs. ${order.totalAmount.toLocaleString()}`,
          time: new Date().toLocaleTimeString()
        });
        // Auto-hide notification after 10 seconds
        setTimeout(() => setNotification(null), 10000);
        fetchStats(); // Refresh stats for new order
      };

      socket.on('analyticsUpdate', handleAnalyticsUpdate);
      socket.on('newOrder', handleNewOrder);

      return () => {
        socket.off('analyticsUpdate', handleAnalyticsUpdate);
        socket.off('newOrder', handleNewOrder);
      };
    }
  }, [socket]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('No admin token found');
        setLoading(false);
        return;
      }

      const response = await fetch(api('/api/orders/stats'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fix: Only set stats if we have successful data to avoid setting state to error objects
      if (data && typeof data.totalProducts !== 'undefined') {
        setStats(data);
      } else {
        console.error('Invalid stats data received:', data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: `Rs. ${(stats.totalSales || 0).toLocaleString()}`, 
      icon: <DollarSign size={28} />,
      bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      color: 'white'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders || 0, 
      icon: <ShoppingBag size={28} />,
      bg: 'white',
      color: '#4338ca',
      iconBg: '#e0e7ff'
    },
    { 
      title: 'Total Customers', 
      value: stats.totalCustomers || 0, 
      icon: <ArrowUpRight size={28} />,
      bg: 'white',
      color: '#0ea5e9',
      iconBg: '#e0f2fe'
    },
    { 
      title: 'Active Products', 
      value: stats.totalProducts || 0, 
      icon: <Package size={28} />,
      bg: 'white',
      color: '#f59e0b',
      iconBg: '#fef3c7'
    },
  ];

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div style={{ position: 'relative' }}>
      {/* REAL-TIME NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: 'white',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          borderLeft: '5px solid var(--admin-primary)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
          minWidth: '320px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ background: 'var(--admin-primary-bg)', color: 'var(--admin-primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <Bell size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.95rem' }}>{notification.title}</h4>
            <p style={{ margin: 0, color: 'var(--admin-text-sub)', fontSize: '0.85rem' }}>{notification.message}</p>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem', display: 'block' }}>{notification.time}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex-between">
        <div>
           <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Dashboard Overview</h1>
           <p className="text-muted">Welcome back, get up to date with your store's performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={fetchStats}
            className="admin-btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            Refresh Stats
          </button>
          <div className="status-pill text-muted">
            <Calendar size={14} style={{ marginRight: '0.5rem' }} /> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card" 
            style={{ 
              background: stat.bg, 
              color: stat.bg !== 'white' ? 'white' : undefined 
            }}
          >
            <div className="stat-info">
              <h3 style={{ color: stat.bg !== 'white' ? 'rgba(255,255,255,0.8)' : undefined }}>
                {stat.title}
              </h3>
              <p className="stat-value" style={{ color: stat.bg !== 'white' ? 'white' : undefined }}>
                {stat.value}
              </p>
            </div>
            <div 
              className="stat-icon" 
              style={{ 
                background: stat.iconBg || 'rgba(255,255,255,0.2)', 
                color: stat.color 
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Sales Analytics Chart */}
      <div className="table-container" style={{ padding: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Sales Analytics (Last 7 Days)</h2>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total Weekly: Rs. {stats.analytics?.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
        </div>
        
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: '2rem', 
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative'
        }}>
          {/* Real Data Bar Chart */}
          {(stats.analytics || []).map((day, i) => {
            const maxVal = Math.max(...(stats.analytics?.map(d => d.amount) || [100]), 100);
            const heightPercentage = day.amount > 0 ? (day.amount / maxVal) * 100 : 5; // Min 5% for visibility if 0 but labeled
            
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div 
                  title={`Rs. ${day.amount.toLocaleString()} (${day.count} orders)`}
                  style={{ 
                    width: '100%', 
                    height: `${heightPercentage}%`, 
                    background: day.amount > 0 ? 'var(--admin-primary)' : '#f1f5f9', 
                    borderRadius: '8px 8px 0 0',
                    transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {day.amount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: 'var(--admin-primary)'
                    }}>
                      {day.amount > 1000 ? `${(day.amount/1000).toFixed(1)}k` : day.amount}
                    </div>
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
