import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { User, Mail, LogOut, Save, Package, ShoppingCart, ArrowRight, Building, Phone, MapPin, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import { api } from '../config/api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, resendVerificationEmail, setup2FA, verify2FA, disable2FA } = useAuth();
  const { getCartCount } = useCart();
  const { socket } = useSocket();
  
  // Active Tab State
  const [activeTab, setActiveTab] = useState('account');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    hospitalName: user?.hospitalName || '',
    address: user?.address || '',
    city: user?.city || ''
  });

  const [success, setSuccess] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  // 2FA States
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

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
      fetchOrders();
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
        setRecentOrders(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    const result = await setup2FA();
    if (result.qrCode) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setIsSettingUp2FA(true);
    }
    setTwoFactorLoading(false);
  };

  const handleVerify2FA = async () => {
    if (otpToken.length !== 6) return;
    setTwoFactorLoading(true);
    const result = await verify2FA(otpToken);
    setTwoFactorLoading(false);
    if (result.success) {
      setSuccess('2FA Enabled Successfully!');
      setIsSettingUp2FA(false);
      setQrCode('');
      setSecret('');
      setOtpToken('');
    } else {
      setVerificationMessage('❌ ' + result.message);
    }
  };

  const handleToggle2FA = async () => {
    if (twoFactorLoading) return;
    
    if (user.twoFactorEnabled) {
      setTwoFactorLoading(true);
      const result = await disable2FA();
      setTwoFactorLoading(false);
      if (result.success) setSuccess('2FA Disabled Successfully');
    } else if (user.hasTwoFactorSecret) {
      setTwoFactorLoading(true);
      const result = await verify2FA();
      setTwoFactorLoading(false);
      if (result.success) setSuccess('2FA Enabled Successfully');
    } else {
      handleSetup2FA();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result.success) {
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setSuccess('Failed to update profile: ' + result.message);
    }
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
    <div className="profile-page-modern">
      <div className="profile-container-modern">
        <div className="profile-main-card">
          {/* Profile Header with User Info */}
          <div className="profile-header-modern">
            <div className="profile-user-info">
              <div className="user-avatar-modern">
                <Building size={32} />
              </div>
              <div className="user-details-modern">
                <h1>{user.name}</h1>
                <p className="user-email">{user.email}</p>
                <span className="account-badge">Business Account</span>
              </div>
            </div>
            <div className="profile-actions">
              <Button variant="outline" icon={<LogOut size={18} />} onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs-modern">
            <button 
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <User size={18} />
              <span className="tab-text">Account</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldCheck size={18} />
              <span className="tab-text">Security</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} />
              <span className="tab-text">Orders</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
              onClick={() => navigate('/cart', { state: { from: 'profile' } })}
            >
              <ShoppingCart size={18} />
              <span className="tab-text">Cart</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-content-modern">
          {/* Account Details Tab */}
          {activeTab === 'account' && (
            <div className="tab-content">
              <div className="content-header">
                <div>
                  <h2>Account Information</h2>
                  <p>Manage your business account details and contact information</p>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="small" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>

              {success && (
                <div className="alert-modern" style={{
                  background: success.startsWith('Failed') ? '#fee2e2' : '#dcfce7',
                  color: success.startsWith('Failed') ? '#991b1b' : '#15803d',
                  borderColor: success.startsWith('Failed') ? '#fecaca' : '#bbf7d0'
                }}>
                  {success}
                </div>
              )}

              <form className="profile-form-modern" onSubmit={handleSubmit}>
                <div className="form-grid-modern">
                  <div className="form-field-modern">
                    <label htmlFor="name">Contact Person</label>
                    <div className="input-wrapper-modern">
                      <User size={18} className="field-icon" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        placeholder="Contact person name"
                      />
                    </div>
                  </div>

                  <div className="form-field-modern">
                    <label htmlFor="hospitalName">Hospital / Clinic Name</label>
                    <div className="input-wrapper-modern">
                      <Building size={18} className="field-icon" />
                      <input
                        type="text"
                        id="hospitalName"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g. City Hospital"
                      />
                    </div>
                  </div>

                  <div className="form-field-modern">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-wrapper-modern">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={true}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field-modern">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper-modern">
                      <Phone size={18} className="field-icon" />
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>

                  <div className="form-field-modern full-width">
                    <label htmlFor="address">Default Shipping Address</label>
                    <div className="input-wrapper-modern">
                      <MapPin size={18} className="field-icon" />
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Full street address, building, floor"
                      />
                    </div>
                  </div>

                  <div className="form-field-modern">
                    <label htmlFor="city">City</label>
                    <div className="input-wrapper-modern">
                      <MapPin size={18} className="field-icon" />
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g. Karachi"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions-modern">
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
                          email: user.email,
                          phone: user.phone || '',
                          hospitalName: user.hospitalName || '',
                          address: user.address || '',
                          city: user.city || ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <div className="content-header">
                <div>
                  <h2>Security Settings</h2>
                  <p>Manage your account security, email verification, and two-factor authentication</p>
                </div>
              </div>

              {success && (
                <div className="alert-modern success">
                  {success}
                </div>
              )}

              {/* Email Verification Section */}
              {!user.isVerified && (
                <div className="security-card-modern">
                  <div className="security-card-header">
                    <Mail size={24} />
                    <div>
                      <h3>Email Verification</h3>
                      <p>Verify your email to secure your account</p>
                    </div>
                  </div>
                  <div className="security-card-body">
                    <p className="verify-text">
                      Your email address <strong>{user.email}</strong> has not been verified yet. 
                      Click below to resend the verification email.
                    </p>
                    <Button 
                      variant="primary" 
                      size="small"
                      loading={isResending}
                      onClick={async () => {
                        setIsResending(true);
                        setVerificationMessage('');
                        const result = await resendVerificationEmail();
                        setIsResending(false);
                        if (result.success) {
                          setVerificationMessage('✅ Verification email sent! Check your inbox.');
                        } else {
                          setVerificationMessage('❌ ' + result.message);
                        }
                        setTimeout(() => setVerificationMessage(''), 5000);
                      }}
                    >
                      {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                    {verificationMessage && (
                      <p className={`verify-message ${verificationMessage.startsWith('✅') ? 'success' : 'error'}`}>
                        {verificationMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 2FA Section */}
              <div className="security-card-modern">
                <div className="security-card-header">
                  <ShieldCheck size={24} />
                  <div>
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security with Google Authenticator</p>
                  </div>
                  <div className="tfa-toggle" onClick={handleToggle2FA}>
                    <div className={`toggle-switch ${user.twoFactorEnabled ? 'active' : ''}`}>
                      <div className="toggle-knob"></div>
                    </div>
                    <span className={`toggle-label ${user.twoFactorEnabled ? 'active' : ''}`}>
                      {user.twoFactorEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
                <div className="security-card-body">
                  {!user.twoFactorEnabled && isSettingUp2FA && qrCode && (
                    <div className="tfa-setup">
                      <h4>Scan QR Code</h4>
                      <p>Scan this with your authenticator app using  your email <strong>{user.email}</strong></p>
                      <div className="qr-code-container">
                        <img src={qrCode} alt="2FA QR Code" />
                      </div>
                      <div className="otp-input-container">
                        <label>Enter 6-Digit Code:</label>
                        <input 
                          type="text" 
                          maxLength="6"
                          className="otp-input"
                          placeholder="000000"
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <div className="tfa-actions">
                        <Button variant="primary" onClick={handleVerify2FA} loading={twoFactorLoading}>
                          Confirm & Enable
                        </Button>
                        <Button variant="outline" onClick={() => { setIsSettingUp2FA(false); setQrCode(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {user.twoFactorEnabled && (
                    <p className="tfa-status active">
                      ✓ Two-factor authentication is currently enabled and protecting your account
                    </p>
                  )}
                  {!user.twoFactorEnabled && !isSettingUp2FA && (
                    <p className="tfa-status inactive">
                      Two-factor authentication is currently disabled. Enable it to add an extra layer of security.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-content">
              <div className="content-header">
                <div>
                  <h2>Order History</h2>
                  <p>Track your medical equipment purchases and order status</p>
                </div>
                {recentOrders.length > 0 && (
                  <Button variant="outline" size="small" onClick={() => navigate('/my-orders')}>
                    View All Orders
                  </Button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div className="empty-state-modern">
                  <Package size={64} />
                  <h3>No orders yet</h3>
                  <p>Start shopping for medical equipment</p>
                  <Button variant="primary" onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="orders-list-modern">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="order-item-modern" onClick={() => navigate(`/order-details/${order._id}`)}>
                      <div className="order-info">
                        <div className="order-id">
                          <span className="label">Order ID:</span>
                          <span className="value">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="order- amount">
                        PKR {order.totalAmount?.toLocaleString()}
                      </div>
                      <div className="order-action">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default Profile;
