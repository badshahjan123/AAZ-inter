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
        `http://localhost:5000/api/orders/${orderId}`,
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
            {/* SUCCESS BANNER */}
            <Card className="success-banner" padding="large">
              <div className="success-icon-wrapper">
                <CheckCircle size={56} className="text-success" />
              </div>
              <h1>🎉 Order Successfully Placed!</h1>
              <p className="order-id">
                Order ID: {orderData.orderNumber || `#${orderData.orderId.slice(-8)}`}
              </p>
              <div className="success-message">
                <p className="success-text">
                  Thank you for your order! We've received your request and will begin processing it shortly.
                </p>
                {orderData.paymentMethod === 'bank' && orderData.orderStatus === 'PAYMENT_PENDING' && (
                  <p className="payment-reminder" style={{ borderLeftColor: '#3b82f6', color: '#1e40af' }}>
                    <strong>⏳ Payment Proof Received:</strong> Your payment verification is in progress. We will notify you once approved.
                  </p>
                )}
                {orderData.paymentMethod === 'cod' && (
                  <p className="cod-message">
                    <strong>✓ Cash on Delivery:</strong> Your order will be delivered to your address. Please keep the exact amount ready.
                  </p>
                )}
                {orderData.paymentMethod === 'card' && !['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderData.orderStatus) && (
                  <p className="card-reminder">
                    <strong>💳 Card Payment:</strong> Please complete your payment below to process your order.
                  </p>
                )}
              </div>
              <div className="tracking-info">
                <div className="tracking-box">
                  <Package size={24} className="tracking-icon" />
                  <div>
                    <h3>Track Your Order</h3>
                    <p>You can track your order status anytime from the "My Orders" page.</p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/my-orders')}
                  style={{ marginTop: '1rem' }}
                >
                  View My Orders
                </Button>
              </div>
            </Card>

            {/* STRIPE CARD PAYMENT SECTION */}
            {orderData.paymentMethod === "card" && (
              <Card
                className="payment-action-card highlight-card"
                padding="large"
              >
                <div className="card-header">
                  <div
                    className={`status-badge ${["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus) ? "success" : "warning"}`}
                  >
                    {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus)
                      ? "Payment Verified"
                      : "Action Required"}
                  </div>
                  <h2>
                    {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus)
                      ? "Payment Completed"
                      : "Pay via Credit/Debit Card"}
                  </h2>
                </div>

                {["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(orderData?.orderStatus) ? (
                  <div className="upload-success-msg">
                    <CheckCircle size={48} className="text-success" />
                    <h3>Payment Successful!</h3>
                    <p>
                      Thank you for your payment. Your order is now being
                      processed.
                    </p>
                  </div>
                ) : (
                  <div className="stripe-container">
                    <p style={{ marginBottom: "1.5rem", color: "#4b5563" }}>
                      Please enter your card details below to complete your
                      order.
                    </p>
                    <StripePayment
                      order={orderData}
                      onPaymentSuccess={() => {
                        // Fetch latest order status after payment
                        fetchOrderStatus(orderData.orderId);
                      }}
                    />
                  </div>
                )}
              </Card>
            )}

            {/* BANK TRANSFER CONFIRMATION SECTION */}
            {orderData.paymentMethod === "bank" && (
              <Card
                className="payment-action-card highlight-card"
                padding="large"
              >
                <div className="card-header">
                  <div className="status-badge info">Verification Pending</div>
                  <h2>Payment Proof Submitted</h2>
                </div>
                <div className="bank-payment-section">
                  <div className="upload-success-msg">
                    <Clock size={48} className="text-primary" style={{ color: '#3b82f6' }} />
                    <h3 style={{ color: '#1e40af' }}>Pending Verification</h3>
                    <p>
                      We have received your payment proof and transaction details. 
                      Our team will verify the payment shortly.
                    </p>
                    <p style={{ marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      Once verified, your order status will be updated automatically.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* CASH ON DELIVERY SECTION */}
            {orderData.paymentMethod === "cod" && (
              <Card className="cod-info-card highlight-card" padding="large">
                <div className="card-header">
                  <div className="status-badge info">Cash on Delivery</div>
                  <h2>What's Next?</h2>
                </div>
                <div className="steps-list">
                  <div className="step-line">
                    <div className="dot">1</div>
                    <p>
                      Our team will call you at{" "}
                      <strong>{orderData.customer.phone}</strong> to confirm the
                      order.
                    </p>
                  </div>
                  <div className="step-line">
                    <div className="dot">2</div>
                    <p>
                      Once confirmed, we will ship your medical supplies
                      immediately.
                    </p>
                  </div>
                  <div className="step-line">
                    <div className="dot">3</div>
                    <p>Pay cash when your order reaches your doorstep.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="confirmation-sidebar">
            <Card className="order-summary-mini" padding="large">
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
                  <Package size={16} /> Delivery To:
                </h4>
                <p>{orderData.customer.name}</p>
                <p>
                  {orderData.customer.address}, {orderData.customer.city}
                </p>
              </div>
            </Card>

            <div className="nav-buttons">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate("/products")}
              >
                Continue Shopping
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate("/my-orders")}
              >
                Track All Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
