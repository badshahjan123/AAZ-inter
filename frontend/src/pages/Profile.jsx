import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { User, Mail, LogOut, Save, Package, ShoppingCart, ArrowRight, Building, Phone, MapPin, CreditCard } from 'lucide-react';
import Button from '../components/common/Button';
import './Profile.css';
import { api } from '../config/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { getCartCount } = useCart();
  const { socket, isConnected } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [success, setSuccess] = useState('');
  const [orderCount, setOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch order data
  useEffect(() => {
    if (user && user.token) {
      fetchOrders();
    }
  }, [user]);

  // Real-time order updates
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data) => {
      console.log('📦 Profile: Real-time order update', data);
      fetchOrders(); // Refresh orders when status changes
    };

    socket.on('orderStatusUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderStatusUpdate', handleOrderUpdate);
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(api('/api/orders/myorders'), {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderCount(data.length);
        setRecentOrders(data.slice(0, 3)); // Get 3 most recent
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSuccess('Profile updated successfully!');
    setIsEditing(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar Navigation */}
          <div className="profile-sidebar">
            <div className="account-nav-card">
              <div className="account-brief">
                 <div className="business-avatar">
                   <Building size={24} />
                 </div>
                 <div className="brief-info">
                   <h3>{user.name}</h3>
                   <p className="account-type">Business Account</p>
                   <p className="account-email">{user.email}</p>
                 </div>
              </div>
              
              <nav className="account-menu">
                <button className="menu-link active">
                  <User size={18} /> Account Information
                </button>
                <button className="menu-link" onClick={() => navigate('/my-orders')}>
                  <Package size={18} /> Order History
                </button>
                <button className="menu-link" onClick={() => navigate('/cart')}>
                  <ShoppingCart size={18} /> Shopping Cart
                </button>
                <button className="menu-link logout" onClick={handleLogout}>
                  <LogOut size={18} /> Sign Out
                </button>
              </nav>

              <div className="account-quick-stats">
                 <div className="q-stat">
                   <span className="q-val">{orderCount}</span>
                   <span className="q-lab">Total Orders</span>
                 </div>
                 <div className="q-stat">
                   <span className="q-val">{getCartCount()}</span>
                   <span className="q-lab">Cart Items</span>
                 </div>
              </div>
            </div>
            
            <div className="support-card-mini">
               <h4>Customer Support</h4>
               <p>Need help with medical equipment orders or technical specifications?</p>
               <Button variant="outline" size="small" fullWidth onClick={() => navigate('/contact')}>Contact Support</Button>
            </div>
          </div>

          {/* Profile Main Content */}
          <div className="profile-main">
            <div className="profile-section">
              <div className="section-header-compact">
                <div className="h-text">
                  <h2>Account Information</h2>
                  <p>Manage your business account details and contact information</p>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="small" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {success && (
                <div className="profile-success">
                  {success}
                </div>
              )}

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="name">Contact Person / Business Name</label>
                    <div className="input-wrapper">
                      <User size={18} className="field-icon" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        placeholder="Enter full name or business name"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">Business Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        placeholder="business@company.com"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <Button type="submit" variant="primary" icon={<Save size={18} />}>
                      Save Changes
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name,
                          email: user.email
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </div>

            {/* Order History Section */}
            <div className="profile-section">
              <div className="section-header-compact">
                <div className="h-text">
                  <h2>Order History</h2>
                  <p>Track your medical equipment purchases and order status</p>
                </div>
                {recentOrders.length > 0 && (
                  <Button variant="outline" size="small" onClick={() => navigate('/my-orders')}>
                    View All Activity
                  </Button>
                )}
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} />
                  <p>No orders yet</p>
                  <Button variant="primary" onClick={() => navigate('/products')}>
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="recent-orders-list">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="procurement-item" onClick={() => navigate(`/order-details/${order._id}`)}>
                      <div className="proc-main">
                        <div className="proc-id">
                          <span className="ref">REF: {order._id.substring(order._id.length - 8).toUpperCase()}</span>
                          <span className="date">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="proc-status">
                          <span className={`status-tag ${order.orderStatus.toLowerCase()}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <div className="proc-amount">
                          PKR {order.totalAmount?.toLocaleString()}
                        </div>
                        <div className="proc-action">
                          <Button variant="ghost" size="small"><ArrowRight size={16} /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
