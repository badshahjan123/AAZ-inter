import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Mail,
  Phone,
  ArrowRight,
  Upload,
  Clock,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  Building,
  CreditCard as CardIcon,
} from "lucide-react";
import { formatPrice } from "../data/products";
import { formatDate } from "../utils/helpers";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import PaymentProofUpload from "../components/payment/PaymentProofUpload";
import { useAuth } from "../context/AuthContext";
import StripePayment from "../components/payment/StripePayment";
import { api } from "../config/api";
import "./OrderConfirmation.css";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");

  useEffect(() => {
    if (location.state) {
      setOrderData(location.state);
      fetchWhatsAppLink(location.state.orderId);
      // Fetch latest order status from server
      fetchOrderStatus(location.state.orderId);
    } else {
      const lastOrder = localStorage.getItem("lastOrder");
      if (lastOrder) {
        const parsed = JSON.parse(lastOrder);
        setOrderData(parsed);
        fetchWhatsAppLink(parsed.orderId);
        // Fetch latest order status from server
        fetchOrderStatus(parsed.orderId);
      } else {
        navigate("/");
      }
    }
  }, [navigate, location]);

  // Poll for order status updates every 5 seconds
  useEffect(() => {
    if (!orderData?.orderId) return;

    const interval = setInterval(() => {
      fetchOrderStatus(orderData.orderId);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [orderData?.orderId]);

  const fetchOrderStatus = async (orderId) => {
    try {
      const response = await fetch(
        api(`/api/orders/${orderId}`),
        {
          headers: {
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update order data with latest status
        setOrderData((prev) => ({
          ...prev,
          orderStatus: data.orderStatus,
          paymentStatus: data.paymentStatus,
          verificationStatus: data.verificationStatus,
        }));

        // Update uploadSuccess based on orderStatus
        if (data.orderStatus === "PAID" || data.orderStatus === "PROCESSING" || data.orderStatus === "SHIPPED" || data.orderStatus === "DELIVERED") {
          setUploadSuccess(true);
        }
      }
    } catch (error) {
      console.error("Error fetching order status:", error);
    }
  };

  const fetchWhatsAppLink = async (id) => {
    // WhatsApp link functionality removed as it's not needed for COD/Card payments
    // This function is kept for compatibility but does nothing
    return;
  };

  if (!orderData) return null;

  return (
    <div className="order-confirmation-page">
      <div className="container">
        {/* PROGRESS TRACKER - Uses orderStatus as single source of truth */}
        <div className="order-stepper">
          <div className="step-item completed">
            <div className="step-circle">
              <CheckCircle size={20} />
            </div>
            <span>Ordered</span>
          </div>
          <div
            className={`step-item ${
              ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus)
                ? "completed"
                : orderData?.orderStatus === "PAYMENT_PENDING"
                  ? "active"
                  : orderData?.paymentMethod === "cod"
                    ? "completed"
                    : "active"
            }`}
          >
            <div className="step-circle">
              {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus) ||
              orderData?.paymentMethod === "cod" ? (
                <CheckCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <span>Payment</span>
          </div>
          <div
            className={`step-item ${
              ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus)
                ? "active"
                : ""
            }`}
          >
            <div className="step-circle">
              <AlertCircle size={20} />
            </div>
            <span>Verification</span>
          </div>
          <div
            className={`step-item ${
              ["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus)
                ? "active"
                : ""
            }`}
          >
            <div className="step-circle">
              <Package size={20} />
            </div>
            <span>Shipping</span>
          </div>
        </div>

        <div className="confirmation-grid">
          {/* LEFT COLUMN: ACTIONS */}
          <div className="confirmation-main">
            {/* UNIFIED SUCCESS & ACTION CARD */}
            <div className="unified-card">
              <div className="success-header-compact">
                <div className="success-icon-wrapper-mini">
                  <CheckCircle size={32} strokeWidth={3} />
                </div>
                <div className="header-text">
                  <h1>Order Successfully Placed</h1>
                  <p className="order-id-text">Order ID: {orderData.orderNumber || `#${orderData.orderId.slice(-8)}`}</p>
                </div>
              </div>

              <div className="status-divider"></div>

              <div className="action-content">
                {/* DYNAMIC CONTENT BASED ON PAYMENT METHOD */}
                
                {/* 1. BANK TRANSFER PENDING */}
                {orderData.paymentMethod === 'bank' && orderData.orderStatus === 'PAYMENT_PENDING' && (
                  <div className="status-message-box info">
                    <Clock size={20} />
                    <div>
                      <h3>Payment Verification in Progress</h3>
                      <p>We have received your proof. Your order will be processed automatically once verified.</p>
                    </div>
                  </div>
                )}

                {/* 2. CASH ON DELIVERY */}
                {orderData.paymentMethod === 'cod' && (
                  <div className="status-message-box success">
                    <Package size={20} />
                    <div>
                      <h3>Order Confirmed</h3>
                      <p>We will contact you at <strong>{orderData.customer.phone}</strong> shortly. Please have exact cash ready.</p>
                    </div>
                  </div>
                )}

                {/* 3. CARD PAYMENT PENDING */}
                {orderData.paymentMethod === 'card' && !['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderData.orderStatus) && (
                   <div className="stripe-container-compact">
                    <h3>Complete Your Payment</h3>
                    <StripePayment
                      order={orderData}
                      onPaymentSuccess={() => fetchOrderStatus(orderData.orderId)}
                    />
                   </div>
                )}

                {/* 4. GENERIC SUCCESS (PAID/VERIFIED) */}
                {['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderData.orderStatus) && (
                  <div className="status-message-box success">
                    <CheckCircle size={20} />
                    <div>
                      <h3>Payment Verified</h3>
                      <p>Your order is confirmed and is being processed for shipping.</p>
                    </div>
                  </div>
                )}

                <div className="action-buttons-row">
                  <button className="track-btn-primary" onClick={() => navigate('/my-orders')}>
                    Track My Order
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="confirmation-sidebar">
            <div className="order-summary-mini">
              <h3>Order Summary</h3>
              <div className="summary-list">
                {orderData.items.map((item, index) => (
                  <div
                    className="summary-item"
                    key={item.id || item._id || index}
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <strong>{formatPrice(orderData.total)}</strong>
              </div>

              <div className="delivery-info-mini">
                <h4>
                  <Package size={14} /> Delivery To:
                </h4>
                <p>{orderData.customer.name}</p>
                <p>
                  {orderData.customer.address}, {orderData.customer.city}
                </p>
              </div>
            </div>

            <div className="nav-buttons">
              <button
                type="button"
                onClick={() => navigate("/products")}
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-orders")}
              >
                Track All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
