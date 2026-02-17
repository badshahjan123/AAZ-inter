import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatPrice } from "../data/products";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { formatDate, getAssetUrl } from "../utils/helpers";
import { api, API_URL } from "../config/api";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Truck,
} from "lucide-react";
import "./OrderDetails.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [whatsappLink, setWhatsappLink] = useState("");

  useEffect(() => {
    fetchOrderDetails();
    
    // Fallback polling every 60 seconds in case socket fails
    const interval = setInterval(fetchOrderDetails, 60000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Real-time update listener
  useEffect(() => {
    if (socket) {
      const handleUpdate = (data) => {
        if (data.orderId === orderId) {
          console.log("🔄 Order Status updated via socket:", data.status);
          fetchOrderDetails(); // Re-fetch all data to be sure
        }
      };

      const handlePaymentApproved = (data) => {
        if (data.orderId === orderId) {
          console.log("✅ Payment Approved via socket");
          fetchOrderDetails();
        }
      };

      const handlePaymentRejected = (data) => {
        if (data.orderId === orderId) {
          console.log("❌ Payment Rejected via socket:", data.reason);
          fetchOrderDetails();
        }
      };

      socket.on("orderStatusUpdate", handleUpdate);
      socket.on("paymentApproved", handlePaymentApproved);
      socket.on("paymentRejected", handlePaymentRejected);

      return () => {
        socket.off("orderStatusUpdate", handleUpdate);
        socket.off("paymentApproved", handlePaymentApproved);
        socket.off("paymentRejected", handlePaymentRejected);
      };
    }
  }, [socket, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(
        api(`/api/orders/${orderId}`),
        {
          headers: {
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        alert("Order not found");
        navigate("/my-orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      alert("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // Removed manual payment functions (bank transfer)

  const handleWhatsAppConfirm = async () => {
    if (!whatsappLink) return;

    try {
      await fetch(
        api(`/api/manual-payments/whatsapp-confirm/${orderId}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      window.open(whatsappLink, "_blank");
    } catch (error) {
      console.error("WhatsApp confirm error:", error);
      window.open(whatsappLink, "_blank");
    }
  };

  const formatStatus = (status) => {
    const s = status?.toUpperCase() || 'PENDING';
    const statusMap = {
      // New professional statuses
      PENDING: "Pending",
      PROCESSING: "Processing",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
      // Legacy statuses
      CREATED: "Pending",
      PAYMENT_PENDING: "Processing Payment",
      PAID: "Paid",
      CONFIRMED: "Processing",
      COMPLETED: "Delivered",
    };
    return statusMap[s] || s;
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusIcon = () => {
    const status = (order.paymentStatus || "PENDING").toUpperCase();
    switch (status) {
      case "PAID":
      case "APPROVED":
        return <CheckCircle className="status-icon status-success" size={20} />;
      case "PAYMENT_PENDING":
      case "PENDING":
        return <Clock className="status-icon status-warning" size={20} />;
      case "REJECTED":
      case "FAILED":
        return <XCircle className="status-icon status-error" size={20} />;
      default:
        return <Clock className="status-icon status-info" size={20} />;
    }
  };

  const getStatusText = () => {
    const status = (order.paymentStatus || "PENDING").toUpperCase();
    switch (status) {
      case "PAID":
      case "APPROVED":
        return "Payment Verified ✓";
      case "PAYMENT_PENDING":
      case "PENDING":
        return "Waiting for Verification";
      case "REJECTED":
      case "FAILED":
        return "Payment Rejected";
      default:
        return "Payment Pending";
    }
  };

  // Removed bank transfer visual conditions

  return (
    <div className="order-details-page">
      <div className="order-details-container">
        <div className="page-header">
          <Button
            variant="ghost"
            icon={<ArrowLeft size={20} />}
            onClick={() => navigate("/my-orders")}
          >
            Back to Orders
          </Button>
          <h1 className="page-title">Order Details</h1>
        </div>

        {/* ORDER PROGRESS STEPPER - Optimized for separate Payment and Order status tracking */}
        <div className="order-stepper">
          {/* 1. Ordered */}
          <div className="step-item completed">
            <div className="step-circle">
              <CheckCircle className="stepper-icon" size={24} />
            </div>
            <span>Ordered</span>
          </div>

          {/* 2. Payment */}
          <div
            className={`step-item ${
              order.paymentMethod === 'cod' || 
              ['approved', 'paid', 'APPROVED', 'PAID'].includes(order.paymentStatus) || 
              ['processing', 'shipped', 'delivered', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus)
                ? "completed" 
                : (!order.paymentStatus || order.paymentStatus?.toLowerCase() === 'pending' || order.orderStatus?.toLowerCase() === 'payment_pending')
                ? "active" 
                : ""
            }`}
          >
            <div className="step-circle">
              {order.paymentMethod === 'cod' || 
               ['approved', 'paid', 'APPROVED', 'PAID'].includes(order.paymentStatus) || 
               ['processing', 'shipped', 'delivered', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus) ? (
                <CheckCircle className="stepper-icon" size={24} />
              ) : (
                <Clock className="stepper-icon" size={24} />
              )}
            </div>
            <span>{order.paymentMethod === 'cod' ? 'Payment (COD)' : 'Payment'}</span>
          </div>

          {/* 3. Processing */}
          <div
            className={`step-item ${
              ['processing', 'shipped', 'delivered', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus)
                ? "completed" 
                : order.orderStatus?.toLowerCase() === 'processing'
                ? "active" 
                : ""
            }`}
          >
            <div className="step-circle">
              {['processing', 'shipped', 'delivered', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus) ? (
                <CheckCircle className="stepper-icon" size={24} />
              ) : (
                <Package className="stepper-icon" size={24} />
              )}
            </div>
            <span>Processing</span>
          </div>

          {/* 4. Shipped */}
          <div
            className={`step-item ${
              ['shipped', 'delivered', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus)
                ? "completed" 
                : order.orderStatus?.toLowerCase() === 'shipped'
                ? "active" 
                : ""
            }`}
          >
            <div className="step-circle">
              {['shipped', 'delivered', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus) ? (
                <Truck className="stepper-icon" size={24} />
              ) : (
                <Truck className="stepper-icon" size={24} style={{ opacity: 0.5 }} />
              )}
            </div>
            <span>Shipped</span>
          </div>

          {/* 5. Delivered */}
          <div
            className={`step-item ${
              ['delivered', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus)
                ? "completed" 
                : ""
            }`}
          >
            <div className="step-circle">
              {['delivered', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus) ? (
                <CheckCircle className="stepper-icon" size={24} />
              ) : (
                <CheckCircle className="stepper-icon" size={24} style={{ opacity: 0.5 }} />
              )}
            </div>
            <span>Delivered</span>
          </div>
        </div>

        <div className="order-details-layout">
          {/* Order Information */}
          <div className="order-details-main">
            <Card className="order-info-card" padding="large">
              <div className="order-header">
                <div>
                  <h2>Order #{order._id.slice(-8)}</h2>
                  <p className="order-date">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status-badge">
                  <span
                    className={`badge badge-${order.orderStatus.toLowerCase().replace(/_/g, "-")}`}
                  >
                    {formatStatus(order.orderStatus)}
                  </span>
                </div>
              </div>

              <div className="order-section">
                <h3>
                  <MapPin size={18} /> Delivery Information
                </h3>
                <div className="info-grid">
                  <div>
                    <strong>Name:</strong> {order.customerName}
                  </div>
                  <div>
                    <strong>Phone:</strong> {order.phone}
                  </div>
                  <div className="info-full">
                    <strong>Email:</strong> {order.email}
                  </div>
                  <div className="info-full">
                    <strong>Address:</strong> {order.address}, {order.city}
                  </div>
                </div>
              </div>

              <div className="order-section">
                <h3>
                  <Package size={18} /> Order Items
                </h3>
                <div className="order-items">
                  {order.products?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <span className="item-name">
                          {item.product?.name || "Product"}
                        </span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>Total Amount:</span>
                  <span className="total-value">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="order-section">
                <h3>
                  <CreditCard size={18} /> Payment Information
                </h3>
                <div className="payment-info">
                  <div className="payment-row">
                    <span>Payment Method:</span>
                    <span className="capitalize">
                      {order.paymentMethod === "card"
                        ? "Credit / Debit Card"
                        : order.paymentMethod === "bank"
                          ? "Bank Transfer"
                          : "Cash on Delivery"}
                    </span>
                  </div>

                  <div className="payment-row">
                    <span>Order Status:</span>
                    <span
                      className={`status-badge status-${order.orderStatus.toLowerCase()}`}
                    >
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>

                  {order.orderStatus === "PAYMENT_PENDING" && (
                    <div className="payment-row">
                      <span>Verification Status:</span>
                      <span className="verification-badge pending">
                        ⏳ Waiting for Admin Review
                      </span>
                    </div>
                  )}

                  {order.verificationStatus === "APPROVED" && (
                    <div className="payment-row">
                      <span>Verification Status:</span>
                      <span className="verification-badge approved">
                        <CheckCircle size={16} />
                        Payment Approved ✓
                      </span>
                    </div>
                  )}

                  {order.verificationStatus === "REJECTED" && (
                    <div className="payment-row">
                      <span>Verification Status:</span>
                      <span className="verification-badge rejected">
                        <XCircle size={16} />
                        Payment Rejected
                      </span>
                    </div>
                  )}

                  {order.rejectionReason && (
                    <div className="rejection-details">
                      <strong>Rejection Reason:</strong>
                      <p className="rejection-message">
                        {order.rejectionReason}
                      </p>
                      <small className="rejection-note">
                        Please upload payment proof again with correct details
                      </small>
                    </div>
                  )}

                  {order.paymentMethod === "bank" && order.transactionId && (
                    <div className="payment-row">
                      <span>Transaction ID:</span>
                      <span className="mono transaction-id">
                        {order.transactionId}
                      </span>
                    </div>
                  )}

                  {order.paymentProof && (
                    <div className="payment-proof-display">
                      <strong>Payment Proof Uploaded:</strong>
                      <div className="proof-preview">
                        <img
                          src={getAssetUrl(order.paymentProof, API_URL)}
                          alt="Payment Proof"
                          className="proof-image"
                          onClick={() => window.open(getAssetUrl(order.paymentProof, API_URL), '_blank')}
                          title="Click to view full size"
                        />
                      </div>
                    </div>
                  )}

                  {order.paidAt && (
                    <div className="payment-row">
                      <span>Payment Verified At:</span>
                      <span>{new Date(order.paidAt).toLocaleString()}</span>
                    </div>
                  )}

                  {order.adminNotes && (
                    <div className="admin-notes">
                      <strong>Admin Notes:</strong>
                      <p>{order.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* WhatsApp Action Button */}
                <div className="whatsapp-action">
                  <h4>Need Help with Your Order?</h4>
                  <button
                    onClick={() => {
                      const whatsappNumber = '923453450644'; 
                      const message = `Hello! I need help with my order.\\n\\nOrder ID: ${order._id.slice(-8)}\\nOrder Number: ${order.orderNumber || 'N/A'}\\nStatus: ${formatStatus(order.orderStatus)}\\n\\nMy inquiry: `;
                      const encodedMessage = encodeURIComponent(message);
                      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                  >
                    <MessageCircle size={20} />
                    Contact Support on WhatsApp
                  </button>
                </div>
              </div>
            </Card>

            <Card className="whatsapp-inquiry-card" padding="large">
              <div className="inquiry-header">
                <MessageCircle size={20} className="text-success" />
                <h3>Need Help?</h3>
              </div>
              <p style={{ color: '#065f46', marginBottom: '1rem', fontSize: '13px', lineHeight: '1.6' }}>
                Contact our support team on WhatsApp for quick assistance.
              </p>
              <Button
                variant="primary"
                icon={<MessageCircle size={18} />}
                onClick={() => {
                  const whatsappNumber = '923453450644'; 
                  const message = `Hello! I need help with my order.\n\nOrder ID: ${order._id.slice(-8)}\nOrder Number: ${order.orderNumber || 'N/A'}\nStatus: ${formatStatus(order.orderStatus)}\n\nMy inquiry: `;
                  const encodedMessage = encodeURIComponent(message);
                  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
                  window.open(whatsappUrl, '_blank');
                }}
                fullWidth
              >
                Inquire on WhatsApp
              </Button>
            </Card>
          </div>

          {/* Payment Actions Sidebar */}
          {/* Sidebar clean */}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
