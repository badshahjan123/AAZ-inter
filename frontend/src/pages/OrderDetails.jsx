import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatPrice } from "../data/products";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
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
    // WhatsApp confirmation is handled via direct link if needed for COD
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
        `http://localhost:5000/api/orders/${orderId}`,
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
        `http://localhost:5000/api/manual-payments/whatsapp-confirm/${orderId}`,
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
    return statusMap[status] || status;
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
        return <CheckCircle className="status-icon status-success" size={20} />;
      case "PAYMENT_PENDING":
        return <Clock className="status-icon status-warning" size={20} />;
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
        return "Payment Verified ✓";
      case "PAYMENT_PENDING":
        return "Waiting for Verification";
      case "FAILED":
        return "Payment Rejected";
      default:
        return "Payment Pending";
    }
  };

  // Removed bank transfer visual conditions

  return (
    <div className="order-details-page">
      <div className="container">
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

        {/* ORDER PROGRESS STEPPER - Uses order.orderStatus as single source of truth */}
        <div className="order-stepper">
          <div className="step-item completed">
            <div className="step-circle">
              <CheckCircle size={20} />
            </div>
            <span>Ordered</span>
          </div>

          <div
            className={`step-item ${["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? "completed" : order.orderStatus === "PAYMENT_PENDING" ? "active" : ""}`}
          >
            <div className="step-circle">
              {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? (
                <CheckCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <span>Payment</span>
          </div>

          <div
            className={`step-item ${["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? "completed" : order.orderStatus === "PROCESSING" ? "active" : ""}`}
          >
            <div className="step-circle">
              {["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? (
                <CheckCircle size={20} />
              ) : (
                <Package size={20} />
              )}
            </div>
            <span>Processing</span>
          </div>

          <div
            className={`step-item ${["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? "completed" : order.orderStatus === "SHIPPED" ? "active" : ""}`}
          >
            <div className="step-circle">
              {["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.orderStatus) ? (
                <Truck size={20} />
              ) : (
                <Truck size={20} style={{ opacity: 0.5 }} />
              )}
            </div>
            <span>Shipped</span>
          </div>

          <div
            className={`step-item ${["DELIVERED", "COMPLETED"].includes(order.orderStatus) ? "completed" : ""}`}
          >
            <div className="step-circle">
              {["DELIVERED", "COMPLETED"].includes(order.orderStatus) ? (
                <CheckCircle size={20} />
              ) : (
                <CheckCircle size={20} style={{ opacity: 0.5 }} />
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

                  {order.paymentMethod === "bank" && order.paymentProof && (
                    <div className="payment-proof-display">
                      <strong>Payment Proof Uploaded:</strong>
                      <div className="proof-preview">
                        <img
                          src={`http://localhost:5000/${order.paymentProof}`}
                          alt="Payment Proof"
                          className="proof-image"
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
              </div>
            </Card>

            {/* WhatsApp Inquiry Button */}
            <Card className="whatsapp-inquiry-card" padding="large">
              <div className="inquiry-header">
                <MessageCircle size={24} className="text-success" />
                <h3>Need Help with Your Order?</h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Have questions about your order? Contact our support team on WhatsApp for quick assistance.
              </p>
              <Button
                variant="primary"
                icon={<MessageCircle size={18} />}
                onClick={() => {
                  const whatsappNumber = '923001234567'; // From .env
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
