import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { formatPrice } from '../data/products';
import { formatDate } from '../utils/helpers';
import './MyOrders.css';
import { api } from '../config/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Real-time updates listener
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data) => {
      console.log('📦 Real-time order update:', data);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { 
                ...order, 
                orderStatus: data.status,
                isDelivered: data.isDelivered,
                deliveredAt: data.deliveredAt
              }
            : order
        )
      );
    };

    socket.on('orderStatusUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderStatusUpdate', handleOrderUpdate);
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      if (!user || !user.token) {
        setLoading(false);
        return;
      }

      const response = await fetch(api('/api/orders/myorders'), {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'status-delivered';
      case 'SHIPPED':
        return 'status-shipped';
      case 'PROCESSING':
        return 'status-processing';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'PENDING':
        return 'status-pending';
      // Legacy status mapping
      case 'COMPLETED': return 'status-delivered';
      case 'PAID': case 'CONFIRMED': return 'status-processing';
      case 'CREATED': case 'PAYMENT_PENDING': return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle size={16} />;
      case 'SHIPPED': return <Truck size={16} />;
      case 'PROCESSING': return <Package size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      case 'PENDING': return <Clock size={16} />;
      // Legacy mapping
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'PAID': case 'CONFIRMED': return <Package size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'PROCESSING': 'Processing',
      'SHIPPED': 'Shipped',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      // Legacy mapping
      'CREATED': 'Pending',
      'PAYMENT_PENDING': 'Pending',
      'PAID': 'Processing',
      'CONFIRMED': 'Processing',
      'COMPLETED': 'Delivered'
    };
    return statusMap[status] || status;
  };

  if (loading) return <div className="page-loader"><div className="loader"></div></div>;

  return (
    <div className="my-orders-page">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>My Orders</h1>
              <p>Track your order history and status</p>
            </div>
            {isConnected && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                backgroundColor: '#d1fae5', 
                color: '#065f46',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#10b981', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                Live Updates Active
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {orders.length === 0 ? (
          <div className="empty-orders">
            <Package size={64} />
            <h2>No orders found</h2>
            <p>You haven't placed any orders yet.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="orders-table-container">
            <div className="orders-table">
              <div className="table-header">
                <div className="col-order">Order</div>
                <div className="col-date">Date</div>
                <div className="col-status">Status</div>
                <div className="col-items">Items</div>
                <div className="col-total">Total</div>
                <div className="col-actions">Actions</div>
              </div>
              
              {orders.map((order) => (
                <div key={order._id} className="table-row">
                  <div className="col-order">
                    <div className="order-info">
                      <span className="order-id">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                      <span className="payment-method">{order.paymentMethod === 'card' ? 'Card' : 'COD'}</span>
                    </div>
                  </div>
                  
                  <div className="col-date">
                    <span className="date-text">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="col-status">
                    <span className={`status-badge ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>
                  
                  <div className="col-items">
                    <div className="items-info">
                      <span className="items-count">{order.products.length} items</span>
                      <span className="items-preview">
                        {order.products.slice(0, 2).map(p => p.product?.name).filter(Boolean).join(', ')}
                        {order.products.length > 2 && '...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-total">
                    <span className="total-amount">{formatPrice(order.totalAmount)}</span>
                  </div>
                  
                  <div className="col-actions">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => navigate(`/order-details/${order._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
