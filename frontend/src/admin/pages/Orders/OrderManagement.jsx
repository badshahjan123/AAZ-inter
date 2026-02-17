import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Package, CheckCircle, XCircle, Clock, Loader, Truck } from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import { api } from '../../../config/api';
import './OrderManagement.css';

const OrderManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState({
    all: [],
    approved: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    all: 0,
    approved: 0,
    rejected: 0
  });
  const { socket } = useSocket();

  useEffect(() => {
    fetchAllOrders();

    if (socket) {
      const refreshOrders = () => {
        console.log('📦 Real-time update: Refreshing order management...');
        fetchAllOrders();
      };

      socket.on('newOrder', refreshOrders);
      socket.on('orderStatusUpdate', refreshOrders);
      socket.on('paymentApproved', refreshOrders);
      socket.on('paymentRejected', refreshOrders);

      return () => {
        socket.off('newOrder', refreshOrders);
        socket.off('orderStatusUpdate', refreshOrders);
        socket.off('paymentApproved', refreshOrders);
        socket.off('paymentRejected', refreshOrders);
      };
    }
  }, [socket]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('No admin token found');
        setLoading(false);
        return;
      }

      // Fetch ALL orders (no filtering by status)
      const response = await fetch(api('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      const allOrders = Array.isArray(data) ? data : [];
      console.log('✅ All Orders API Response:', allOrders);

      // Categorize orders with legacy status support
      const pending = allOrders.filter(o => 
        o.orderStatus?.toLowerCase() === 'pending' || 
        o.orderStatus?.toLowerCase() === 'created' ||
        o.orderStatus?.toLowerCase() === 'payment_pending'
      );
      
      const approved = allOrders.filter(o => {
        const pStatus = o.paymentStatus?.toLowerCase();
        const oStatus = o.orderStatus?.toLowerCase();
        // Modern: paymentStatus is approved/paid
        // Legacy: orderStatus is approved/paid
        return pStatus === 'approved' || pStatus === 'paid' || 
               oStatus === 'approved' || oStatus === 'paid';
      });
      
      const rejected = allOrders.filter(o => {
        const pStatus = o.paymentStatus?.toLowerCase();
        const oStatus = o.orderStatus?.toLowerCase();
        // Modern: paymentStatus is rejected/failed
        // Legacy: orderStatus is rejected/failed
        return pStatus === 'rejected' || pStatus === 'failed' || 
               oStatus === 'rejected' || oStatus === 'failed';
      });

      console.log('📊 Stats:', {
        allVisible: allOrders.filter(o => {
          const pStatus = o.paymentStatus?.toLowerCase();
          const oStatus = o.orderStatus?.toLowerCase();
          return !(pStatus === 'rejected' || pStatus === 'failed' || 
                   oStatus === 'rejected' || oStatus === 'failed');
        }).length,
        approved: approved.length,
        rejected: rejected.length
      });

      setOrders({
        all: allOrders.filter(o => {
          const pStatus = o.paymentStatus?.toLowerCase();
          const oStatus = o.orderStatus?.toLowerCase();
          return !(pStatus === 'rejected' || pStatus === 'failed' || 
                   oStatus === 'rejected' || oStatus === 'failed');
        }),
        approved,
        rejected
      });

      setCounts({
        all: allOrders.filter(o => {
          const pStatus = o.paymentStatus?.toLowerCase();
          const oStatus = o.orderStatus?.toLowerCase();
          return !(pStatus === 'rejected' || pStatus === 'failed' || 
                   oStatus === 'rejected' || oStatus === 'failed');
        }).length,
        approved: approved.length,
        rejected: rejected.length
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders({ all: [], pending: [], approved: [], rejected: [] });
      setCounts({ all: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pending', icon: Clock },
      processing: { class: 'status-processing', label: 'Processing', icon: Loader },
      shipped: { class: 'status-shipped', label: 'Shipped', icon: Truck },
      delivered: { class: 'status-delivered', label: 'Delivered', icon: CheckCircle },
      cancelled: { class: 'status-cancelled', label: 'Cancelled', icon: XCircle },
      // Legacy support
      approved: { class: 'status-approved', label: 'Approved', icon: CheckCircle },
      rejected: { class: 'status-rejected', label: 'Rejected', icon: XCircle }
    };
    
    // Normalize status to lowercase for lookup
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-${normalizedStatus}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { class: 'payment-pending', label: 'Payment Pending' },
      approved: { class: 'payment-approved', label: 'Payment Approved' },
      rejected: { class: 'payment-rejected', label: 'Payment Rejected' },
      paid: { class: 'payment-paid', label: 'Paid' },
      failed: { class: 'payment-failed', label: 'Failed' },
      refunded: { class: 'payment-rejected', label: 'Refunded' }
    };
    
    const normalizedStatus = paymentStatus?.toLowerCase() || 'pending';
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    
    return (
      <span className={`payment-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const renderOrderTable = (orderList, status) => {
    if (loading) {
      return (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Loading {status} orders...</p>
        </div>
      );
    }

    if (orderList.length === 0) {
      return (
        <div className="empty-state">
          <Package size={64} className="empty-icon" />
          <h3>No {status} orders</h3>
          <p>There are currently no orders with {status} status.</p>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderList.map((order) => (
              <tr key={order._id}>
                <td className="order-id">
                  {order.orderNumber || `#${order._id.substring(20, 24)}`}
                </td>
                <td>
                  <div className="customer-info">
                    <strong>{order.customerName}</strong>
                    <small>{order.email}</small>
                  </div>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="amount">PKR {order.totalAmount.toLocaleString()}</td>
                <td>
                  <span className="payment-method">
                    {order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash on Delivery'}
                  </span>
                </td>
                <td>{getPaymentBadge(order.paymentStatus)}</td>
                <td>{getStatusBadge(order.orderStatus)}</td>
                <td>
                  <Link 
                    to={`/admin/orders/${order._id}`} 
                    className="admin-btn btn-secondary btn-icon-only"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="order-management-page">
      <div className="page-header">
        <h1 className="page-title">Order Management</h1>
        <p className="page-subtitle">Manage and track all orders by status</p>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Package size={18} />
          <span>All Orders</span>
          <span className="tab-badge" style={{ background: '#64748b' }}>{counts.all}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle size={18} />
          <span>Payment Approved</span>
          {counts.approved > 0 && (
            <span className="tab-badge approved">{counts.approved}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <XCircle size={18} />
          <span>Payment Rejected</span>
          {counts.rejected > 0 && (
            <span className="tab-badge rejected">{counts.rejected}</span>
          )}
        </button>
      </div>

      {/* Order Content */}
      <div className="tab-content">
        {activeTab === 'all' && renderOrderTable(orders.all, 'all')}
        {activeTab === 'approved' && renderOrderTable(orders.approved, 'approved')}
        {activeTab === 'rejected' && renderOrderTable(orders.rejected, 'rejected')}
      </div>
    </div>
  );
};

export default OrderManagement;
