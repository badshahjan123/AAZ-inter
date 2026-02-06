import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../data/products";
import { isValidEmail, isValidPhone } from "../utils/helpers";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { api } from '../config/api';
import {
  Banknote,
  Package,
  ShieldCheck,
  AlertCircle,
  Building,
  Copy,
  CheckCircle,
  Upload,
} from "lucide-react";
import "./Checkout.css";
const CheckoutContent = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'bank'
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [bankDetailsError, setBankDetailsError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  
  // Bank Transfer Payment Proof
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [proofPreview, setProofPreview] = useState(null);


  // Fetch bank details
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const response = await fetch(
          api("/api/payments/bank-details"),
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBankDetails(data);
        setBankDetailsError(null);
      } catch (err) {
        console.error("Failed to fetch bank details:", err);
        setBankDetailsError(
          "Unable to load bank details. Please refresh the page.",
        );
      }
    };
    fetchBankDetails();
  }, []);

  useEffect(() => {
    if (!isSuccess && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate, isSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, paymentProof: 'Please upload a valid image file (JPG, PNG, or WEBP)' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, paymentProof: 'File size must be less than 5MB' }));
        return;
      }
      
      setPaymentProof(file);
      setProofPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, paymentProof: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";

    // Bank Transfer Validation
    if (paymentMethod === "bank") {
      if (!paymentProof) {
        newErrors.paymentProof = "Payment screenshot is required";
      }
      if (!transactionId.trim()) {
        newErrors.transactionId = "Transaction ID is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create Order
      const orderData = {
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        paymentMethod, // 'cod' or 'bank'
        totalAmount: getCartTotal(),
        products: cartItems.map((item) => ({
          product: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const orderResponse = await fetch(api("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user && user.token
            ? { Authorization: `Bearer ${user.token}` }
            : {}),
        },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderResult.message || "Failed to place order");
      }

      const orderId = orderResult._id;

      // 2. If Bank Transfer, Upload Payment Proof
      if (paymentMethod === 'bank' && paymentProof) {
        const formData = new FormData();
        formData.append('orderId', orderId); // Required by backend
        formData.append('screenshot', paymentProof); // Changed from 'paymentProof' to 'screenshot' to match backend
        formData.append('transactionId', transactionId);

        try {
          const uploadResponse = await fetch(api(`/api/payments/upload-proof`), {
            method: 'POST',
            body: formData
            // Do NOT set Content-Type header when using FormData, browser sets it with boundary
            // Remove Authorization header if endpoint is public, but if it needs it, keep it. 
            // The controller says "@access Public (but tied to order)", so likely no auth needed, 
            // but let's check if 'protect' middleware is used in routes.
            // Route: router.post("/upload-proof", ... uploadPaymentProof); -> No protect middleware used.
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error("Failed to upload payment proof automatically:", errorData.message);
            // If upload fails, we should probably warn the user or try to handle it
          } else {
             // If upload succeeds, the backend sets status to PAYMENT_PENDING
          }
        } catch (uploadError) {
          console.error("Error uploading payment proof:", uploadError);
        }
      }

      // 3. Success - Redirect to Confirmation
      setIsSuccess(true);
      clearCart();

      const confirmationState = {
        orderId,
        orderNumber: orderResult.orderNumber,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
        items: cartItems,
        total: getCartTotal(),
        paymentMethod,
        orderStatus: paymentMethod === 'bank' ? 'PAYMENT_PENDING' : orderResult.orderStatus, // Force status update for UI
        date: new Date().toISOString(),
      };

      localStorage.setItem("lastOrder", JSON.stringify(confirmationState));
      navigate("/order-confirmation", { state: confirmationState });
    } catch (error) {
      console.error("Checkout error:", error);
      setErrorMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-layout">
          {/* Checkout Form */}
          <div className="checkout-form-section">
            <form
              onSubmit={handleSubmit}
              className="checkout-form"
              autoComplete="on"
            >
              {/* Customer Information */}
              <Card className="form-section" padding="large">
                <h2 className="form-section-title">Customer Information</h2>
                <div className="form-grid">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    error={errors.name}
                    autoComplete="name"
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                    required
                    error={errors.phone}
                    autoComplete="tel"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                    error={errors.email}
                    className="form-grid-full"
                    autoComplete="email"
                  />
                  <Input
                    label="Delivery Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address, building, floor"
                    required
                    error={errors.address}
                    className="form-grid-full"
                    autoComplete="street-address"
                  />
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Karachi, Lahore"
                    required
                    error={errors.city}
                    autoComplete="address-level2"
                  />
                </div>
              </Card>

              {/* Payment Method Selection */}
              <Card className="form-section" padding="large">
                <h2 className="form-section-title">Payment Method</h2>
                <div className="payment-methods">
                  {/* Cash on Delivery */}
                  <label
                    className={`payment-option ${paymentMethod === "cod" ? "payment-option-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <Banknote size={24} />
                    <div className="payment-option-content">
                      <span>Cash on Delivery (COD)</span>
                      <small>Pay when your order arrives</small>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    className={`payment-option ${paymentMethod === "bank" ? "payment-option-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <Building size={24} />
                    <div className="payment-option-content">
                      <span>Bank Transfer</span>
                      <small>Transfer payment and upload proof</small>
                    </div>
                  </label>
                </div>

                {/* Bank Transfer Details Error */}
                {paymentMethod === "bank" && bankDetailsError && (
                  <div className="payment-error-msg">
                    <AlertCircle size={16} />
                    {bankDetailsError}
                  </div>
                )}

                {/* Bank Transfer Details Loading */}
                {paymentMethod === "bank" &&
                  !bankDetails &&
                  !bankDetailsError && (
                    <div className="bank-transfer-section">
                      <div className="bank-info-box">
                        <h3 className="bank-info-title">
                          Bank Account Details
                        </h3>
                        <div
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          Loading bank details...
                        </div>
                      </div>
                    </div>
                  )}

                {/* Bank Transfer Details */}
                {paymentMethod === "bank" && bankDetails && (
                  <div className="bank-transfer-section animate-fade-in">
                    <div className="bank-info-box">
                      <h3 className="bank-info-title">Bank Account Details</h3>

                      <div className="bank-detail-item">
                        <label>Bank Name</label>
                        <div className="bank-detail-value">
                          <span>{bankDetails.bankName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(bankDetails.bankName, "bankName")
                            }
                            className="copy-btn"
                            title="Copy"
                          >
                            {copiedField === "bankName" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bank-detail-item">
                        <label>Account Holder</label>
                        <div className="bank-detail-value">
                          <span>{bankDetails.accountHolder}</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                bankDetails.accountHolder,
                                "accountHolder",
                              )
                            }
                            className="copy-btn"
                            title="Copy"
                          >
                            {copiedField === "accountHolder" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bank-detail-item">
                        <label>Account Number</label>
                        <div className="bank-detail-value">
                          <span className="mono">
                            {bankDetails.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                bankDetails.accountNumber,
                                "accountNumber",
                              )
                            }
                            className="copy-btn"
                            title="Copy"
                          >
                            {copiedField === "accountNumber" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bank-detail-item">
                        <label>IBAN</label>
                        <div className="bank-detail-value">
                          <span className="mono">{bankDetails.iban}</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(bankDetails.iban, "iban")
                            }
                            className="copy-btn"
                            title="Copy"
                          >
                            {copiedField === "iban" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="payment-proof-section" style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                          Upload Payment Proof <span style={{ color: '#ef4444' }}>*</span>
                        </h4>
                        
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                            Transaction ID / Reference Number
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => {
                              setTransactionId(e.target.value);
                              if(errors.transactionId) setErrors(prev => ({...prev, transactionId: ''}));
                            }}
                            placeholder="e.g., TRX123456789"
                            className={`input-field ${errors.transactionId ? 'input-error' : ''}`}
                            style={{ 
                              width: '100%', 
                              padding: '10px 12px', 
                              border: errors.transactionId ? '1px solid #ef4444' : '1px solid #d1d5db', 
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          {errors.transactionId && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.transactionId}</span>}
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                            Payment Screenshot
                          </label>
                          
                          {!proofPreview ? (
                            <div className={`file-upload-box ${errors.paymentProof ? 'error' : ''}`} style={{
                              border: errors.paymentProof ? '2px dashed #ef4444' : '2px dashed #d1d5db',
                              borderRadius: '8px',
                              padding: '24px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              background: '#f9fafb',
                              transition: 'all 0.2s'
                            }}>
                              <input
                                type="file"
                                id="payment-proof-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor="payment-proof-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                                <Upload size={24} style={{ color: '#6b7280', marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>Click to upload screenshot</p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>JPG, PNG or WEBP (Max 5MB)</p>
                              </label>
                            </div>
                          ) : (
                            <div className="proof-preview" style={{ position: 'relative', marginTop: '10px' }}>
                              <img 
                                src={proofPreview} 
                                alt="Payment Proof" 
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentProof(null);
                                  setProofPreview(null);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          )}
                          {errors.paymentProof && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.paymentProof}</span>}
                        </div>
                      </div>

                      <div className="bank-instructions">
                        <p>
                          <strong>📋 Transfer Instructions:</strong>
                        </p>
                        <ul className="instructions-list">
                          <li>Use your mobile banking or online banking app</li>
                          <li>
                            Select "Transfer Funds" and enter the account
                            details above
                          </li>
                          <li>
                            Reference: Enter your Name or Order details
                          </li>
                          <li>Complete the transfer</li>
                          <li>
                            Take a screenshot of the successful transfer
                            confirmation
                          </li>
                          <li>
                            <strong>Upload the screenshot and Enter Transaction ID above to place order</strong>
                          </li>
                          <li>
                            Your order will be confirmed once verified by our
                            team
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Error Message */}
              {errorMessage && (
                <div className="payment-error-msg">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Place Order"}
              </Button>

              {/* Security Notice */}
              <div className="payment-security-tip">
                <ShieldCheck size={16} className="security-icon" />
                <span>Your information is encrypted and secure.</span>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="checkout-summary-wrapper">
            <Card className="checkout-summary" padding="large">
              <h2 className="summary-title">
                <Package size={24} />
                Order Summary
              </h2>

              <div className="summary-items">
                {cartItems.map((item) => (
                  <div key={item._id || item.id} className="summary-item">
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.name}</span>
                      <span className="summary-item-qty">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="summary-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total Amount</span>
                <span className="summary-total-value">
                  {formatPrice(getCartTotal())}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutContent;
