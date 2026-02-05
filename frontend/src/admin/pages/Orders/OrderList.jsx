import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import { api } from '../../../config/api';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();

    if (socket) {
      const refreshOrders = () => {
        console.log('📦 Real-time update: Refreshing order list...');
        fetchOrders();
      };

      socket.on('newOrder', refreshOrders);
      socket.on('orderStatusUpdate', refreshOrders);

      return () => {
        socket.off('newOrder', refreshOrders);
        socket.off('orderStatusUpdate', refreshOrders);
      };
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('No admin token found');
        setOrders([]);
        setLoading(false);
        return;
      }

      const response = await fetch(api('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - Admin token may be invalid or expired');
          localStorage.removeItem('adminToken');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Invalid data format received:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Always set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { class: 'status-pending', label: 'Pending' },
      'PROCESSING': { class: 'status-processing', label: 'Processing' },
      'SHIPPED': { class: 'status-shipped', label: 'Shipped' },
      'DELIVERED': { class: 'status-delivered', label: 'Delivered' },
      'CANCELLED': { class: 'status-cancelled', label: 'Cancelled' },
      // Legacy status mapping for backward compatibility
      'CREATED': { class: 'status-pending', label: 'Pending' },
      'PAYMENT_PENDING': { class: 'status-pending', label: 'Pending' },
      'PAID': { class: 'status-processing', label: 'Processing' },
      'CONFIRMED': { class: 'status-processing', label: 'Processing' },
      'COMPLETED': { class: 'status-delivered', label: 'Delivered' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', label: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 className="page-title">Orders</h1>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  {order.orderNumber || `#${order._id.substring(20, 24)}`}
                </td>
                <td>{order.customerName}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>Rs. {order.totalAmount}</td>
                <td>
                  <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod}</span>
                  {order.isPaid ? ' (Paid)' : ''}
                </td>
                <td>{getStatusBadge(order.orderStatus || 'Pending')}</td>
                <td>
                  <Link to={`/admin/orders/${order._id}`} className="admin-btn btn-secondary btn-icon-only">
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center" style={{ textAlign: 'center' }}>No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
