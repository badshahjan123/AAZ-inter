import { useState, useEffect } from "react";
import { api, API_URL } from "../../config/api";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  Check,
  X,
} from "lucide-react";
import { getAssetUrl } from "../../utils/helpers";
import "../styles/PaymentVerification.css";
const PaymentVerification = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending payments
  useEffect(() => {
    fetchPendingPayments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");

      console.log("🔍 Fetching pending payments...");
      console.log("📋 Admin Token:", token ? "✓ Present" : "✗ Missing");
      const response = await fetch(api("/api/payments/pending"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending payments");
      }

      const data = await response.json();
      console.log("✅ Pending payments received:", data.count);
      console.log("Orders data:", data.orders);
      setPendingPayments(data.orders || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching pending payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedOrder) return;

    setApproving(true);
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(api("/api/payments/approve"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: selectedOrder._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve payment");
      }

      // Refresh and close modal
      fetchPendingPayments();
      setShowModal(false);
      setSelectedOrder(null);
      alert("Payment approved successfully!");
    } catch (err) {
      alert("Error: " + err.message);
      console.error("Error approving payment:", err);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder) return;

    setRejecting(true);
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(api("/api/payments/reject"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          reason: rejectionReason || "No reason provided",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject payment");
      }

      // Refresh and close modal
      fetchPendingPayments();
      setShowModal(false);
      setSelectedOrder(null);
      setRejectionReason("");
      alert("Payment rejected. User will be notified to upload again.");
    } catch (err) {
      alert("Error: " + err.message);
      console.error("Error rejecting payment:", err);
    } finally {
      setRejecting(false);
    }
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setRejectionReason("");
  };

  return (
    <div className="payment-verification-page">
      <div className="pv-header">
        <h1>Payment Verification</h1>
        <p>Review and verify bank transfer payment proofs</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Loading pending payments...</p>
        </div>
      )}

      {!loading && pendingPayments.length === 0 && (
        <div className="empty-state">
          <CheckCircle size={64} />
          <h2>No Pending Payments</h2>
          <p>All payment proofs have been verified!</p>
        </div>
      )}

      {!loading && pendingPayments.length > 0 && (
        <div className="payments-list">
          <div className="payments-count">
            <span className="badge">{pendingPayments.length} Pending</span>
          </div>

          <div className="payments-grid">
            {pendingPayments.map((payment) => (
              <div key={payment._id} className="payment-card">
                <div className="card-header">
                  <div className="order-info">
                    <h3>Order #{payment.orderNumber}</h3>
                    <p className="customer-name">{payment.customerName}</p>
                  </div>
                  <span className="status-badge pending">
                    <AlertCircle size={16} />
                    Pending
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <label>Amount</label>
                    <span className="amount">
                      PKR {payment.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="info-row">
                    <label>Transaction ID</label>
                    <span className="mono">{payment.transactionId}</span>
                  </div>

                  <div className="info-row">
                    <label>Email</label>
                    <span>{payment.email}</span>
                  </div>

                  <div className="info-row">
                    <label>Phone</label>
                    <span>{payment.phone}</span>
                  </div>

                  <div className="info-row">
                    <label>Submitted</label>
                    <span>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {payment.paymentProof && (
                    <div className="payment-proof-preview">
                      <p className="proof-label">Payment Proof Screenshot:</p>
                      <img
                        src={getAssetUrl(payment.paymentProof, API_URL)}
                        alt="Payment Proof"
                        className="proof-thumbnail"
                        onError={(e) => {
                          console.error('Failed to load payment proof:', {
                            originalPath: payment.paymentProof,
                            constructedUrl: getAssetUrl(payment.paymentProof, API_URL),
                            apiUrl: API_URL
                          });
                          e.target.style.border = '2px solid red';
                        }}
                        onLoad={() => {
                          console.log('Payment proof loaded successfully:', payment.paymentProof);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn btn-primary"
                    onClick={() => openModal(payment)}
                  >
                    <Eye size={16} />
                    Review & Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify Payment</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Order Details */}
              <div className="section">
                <h3>Order Details</h3>
                <div className="detail-grid">
                  <div>
                    <label>Order Number</label>
                    <p>#{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label>Amount</label>
                    <p className="amount">
                      PKR {selectedOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label>Customer</label>
                    <p>{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label>Email</label>
                    <p>{selectedOrder.email}</p>
                  </div>
                  <div>
                    <label>Phone</label>
                    <p>{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <label>Address</label>
                    <p>
                      {selectedOrder.address}, {selectedOrder.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              <div className="section">
                <h3>Payment Proof</h3>
                {selectedOrder.paymentProof ? (
                  <div className="payment-proof-full">
                    <img
                      src={getAssetUrl(selectedOrder.paymentProof, API_URL)}
                      alt="Payment Proof"
                      className="proof-image"
                      onError={(e) => {
                        console.error('Failed to load modal payment proof:', {
                          originalPath: selectedOrder.paymentProof,
                          constructedUrl: getAssetUrl(selectedOrder.paymentProof, API_URL),
                          apiUrl: API_URL
                        });
                        e.target.style.border = '2px solid red';
                      }}
                      onLoad={() => {
                        console.log('Modal payment proof loaded successfully:', selectedOrder.paymentProof);
                      }}
                    />
                  </div>
                ) : (
                  <div className="no-proof-message">
                    <AlertCircle size={32} />
                    <p>No payment proof uploaded</p>
                  </div>
                )}
              </div>

              {/* Transaction Details */}
              <div className="section">
                <h3>Transaction Details</h3>
                {selectedOrder.transactionId ? (
                  <div className="detail-box">
                    <label>Transaction ID</label>
                    <p className="mono transaction-id">
                      {selectedOrder.transactionId}
                    </p>
                  </div>
                ) : (
                  <div className="no-proof-message">
                    <AlertCircle size={32} />
                    <p>No transaction ID provided</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason (if visible) */}
              <div className="section">
                <label className="section-label">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  className="rejection-textarea"
                  placeholder="Provide a reason if rejecting this payment..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <small className="help-text">
                  This reason will be sent to the customer via email
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={approving || rejecting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectPayment}
                disabled={approving || rejecting}
              >
                {rejecting ? (
                  <>
                    <Loader size={16} className="spinner-small" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X size={16} />
                    Reject
                  </>
                )}
              </button>
              <button
                className="btn btn-success"
                onClick={handleApprovePayment}
                disabled={approving || rejecting}
              >
                {approving ? (
                  <>
                    <Loader size={16} className="spinner-small" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
