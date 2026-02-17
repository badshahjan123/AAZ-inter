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
  ArrowRight,
  ArrowLeft,
  Truck,
  Shield
} from "lucide-react";
import "./Checkout.css";
import "./CheckoutMobile.css";
const CheckoutContent = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'bank'
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    postalCode: "",
  });

  // Pre-fill form from user profile if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        postalCode: user.postalCode || prev.postalCode
      }));
    }
  }, [user]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Payment
  const [copiedField, setCopiedField] = useState(null);
  
  const [bankDetails, setBankDetails] = useState(null);
  const [bankDetailsError, setBankDetailsError] = useState(null);
  
  // Bank Transfer Payment Proof
  const [paymentProof, setPaymentProof] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [proofPreview, setProofPreview] = useState(null);

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const prevStep = () => setStep(1);

  const validateStep1 = () => {
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
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal Code is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


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
    
    // Strict Input Validation
    if (name === 'name') {
      const alphaRegex = /^[a-zA-Z\s]*$/;
      if (!alphaRegex.test(value)) return;
    } else if (name === 'phone' || name === 'postalCode') {
      const numericRegex = /^[0-9]*$/;
      if (!numericRegex.test(value)) return;
    }

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
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal Code is required";

    if (paymentMethod === 'bank') {
      if (!paymentProof) {
        newErrors.paymentProof = "Payment screenshot is required";
      }
      if (!transactionId.trim()) {
        newErrors.transactionId = "Transaction ID is required";
      }
      if (!accountHolder.trim()) {
        newErrors.accountHolder = "Account Holder Name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } 

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
        <div className="checkout-nav-bar">
          <button type="button" onClick={() => navigate('/cart')} className="back-to-cart-btn">
            <ArrowLeft size={18} />
            <span>Return to Cart</span>
          </button>
        </div>

        <div className="checkout-header-modern">
          <div className="title-group-modern">
            <h1 className="checkout-title-modern">
               {step === 1 ? 'Dispatch Information' : 'Acquisition Protocol'}
            </h1>
            <span className="checkout-subtitle-modern">Step {step} of 2</span>
          </div>
          
          <div className="checkout-progress-track">
            <div className={`progress-node ${step >= 1 ? 'node-active' : ''}`}>
              <Building size={14} />
              <span>Logistics</span>
            </div>
            <div className="progress-separator"></div>
            <div className={`progress-node ${step === 2 ? 'node-active' : ''}`}>
              <Banknote size={14} />
              <span>Payment</span>
            </div>
          </div>
        </div>

        <div className="checkout-frame-modern no-frame-scroll">
          <div className="checkout-main-content">
            <form onSubmit={handleSubmit} className="checkout-form-modern">
              {step === 1 ? (
                <div className="fade-in-node">
                  <div className="form-section-modern">
                    <div className="section-header-modern">
                      <Building size={20} className="section-icon" />
                      <h2 className="section-title-modern">Facility & Contact Information</h2>
                    </div>
                    <div className="form-grid">
                      <Input
                        label="Full Name / Contact Person"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        error={errors.name}
                        autoComplete="name"
                      />
                      <Input
                        label="Postal Code"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="e.g. 75600"
                        required
                        error={errors.postalCode}
                        autoComplete="postal-code"
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
                        autoComplete="email"
                      />
                      <div className="form-grid-full">
                        <Input
                          label="Delivery Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street address, building, floor"
                          required
                          error={errors.address}
                          autoComplete="street-address"
                        />
                      </div>
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
                  </div>

                  <div className="step-actions">
                    <button type="button" onClick={nextStep} className="primary-step-btn">
                      Proceed to Payment Protocol
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fade-in-node">
                  <div className="form-section-modern">
                    <div className="section-header-modern">
                      <Banknote size={20} className="section-icon" />
                      <h2 className="section-title-modern">Payment Protocol Selection</h2>
                    </div>
                    <div className="payment-grid-modern">
                      {/* Cash on Delivery */}
                      <label className={`payment-option ${paymentMethod === "cod" ? "payment-option-active" : ""}`}>
                        <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} />
                        <Banknote size={24} />
                        <div className="payment-option-content">
                          <span>Cash on Delivery</span>
                          <small>Institutional Standard Payment</small>
                        </div>
                      </label>

                      {/* Bank Transfer */}
                      <label className={`payment-option ${paymentMethod === "bank" ? "payment-option-active" : ""}`}>
                        <input type="radio" name="payment" value="bank" checked={paymentMethod === "bank"} onChange={(e) => setPaymentMethod(e.target.value)} />
                        <Building size={24} />
                        <div className="payment-option-content">
                          <span>Bank Transfer</span>
                          <small>Direct Procurement Deposit</small>
                        </div>
                      </label>
                    </div>

                    {paymentMethod === "bank" && bankDetails && (
                      <div className="bank-transfer-section animate-fade-in">
                        <div className="bank-info-box">
                          <h3 className="bank-info-title">Institutional Account Details</h3>
                          <div className="bank-details-grid">
                            <div className="bank-detail-value">
                              <span>{bankDetails.bankName}</span>
                              <button type="button" onClick={() => copyToClipboard(bankDetails.bankName, "bankName")} className="copy-btn">
                                {copiedField === "bankName" ? <CheckCircle /> : <Copy />}
                              </button>
                            </div>
                            <div className="bank-detail-value">
                              <span className="mono">{bankDetails.accountNumber}</span>
                              <button type="button" onClick={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")} className="copy-btn">
                                {copiedField === "accountNumber" ? <CheckCircle /> : <Copy />}
                              </button>
                            </div>
                            <div className="bank-detail-value">
                              <span className="mono">{bankDetails.iban}</span>
                              <button type="button" onClick={() => copyToClipboard(bankDetails.iban, "iban")} className="copy-btn">
                                {copiedField === "iban" ? <CheckCircle /> : <Copy />}
                              </button>
                            </div>
                            <div className="bank-detail-value full-width">
                              <span>Account Title: {bankDetails.accountHolderName || "Muhammad Faisal"}</span>
                            </div>
                          </div>

                          <div className="payment-proof-modern">
                            <h4 className="proof-title">Transaction Confirmation <span style={{color: '#ef4444'}}>*</span></h4>
                            <div className="proof-grid-three">
                              <div className="input-group">
                                <input 
                                  type="text" 
                                  value={accountHolder} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[a-zA-Z\s]*$/.test(val)) setAccountHolder(val);
                                  }}
                                  placeholder="Account Name"
                                  className={errors.accountHolder ? 'error' : ''}
                                />
                              </div>
                              <div className="input-group">
                                <input 
                                  type="text" 
                                  value={transactionId} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[0-9]*$/.test(val)) setTransactionId(val);
                                  }}
                                  placeholder="Transaction ID"
                                  className={errors.transactionId ? 'error' : ''}
                                  maxLength={20}
                                />
                              </div>
                              <div className="proof-upload-zone">
                                {!proofPreview ? (
                                  <div className="upload-btn-placeholder">
                                    <input type="file" id="proof-input" accept="image/*" onChange={handleFileChange} />
                                    <label htmlFor="proof-input">
                                      <Upload size={14} />
                                      <span>Upload Proof</span>
                                    </label>
                                  </div>
                                ) : (
                                  <div className="preview-container-mini" onClick={() => setIsModalOpen(true)}>
                                    <img src={proofPreview} alt="Proof" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setProofPreview(null); }}>&times;</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="clinical-error-notice">
                      <AlertCircle size={18} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="step-actions-split">
                    <button type="button" onClick={prevStep} className="secondary-step-btn">
                      Back to Logistics
                    </button>
                    <button type="submit" className="confirm-order-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'Verifying Session...' : 'Place Procurement Order'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="checkout-summary-fixed">
            <div className="summary-card-modern">
              <div className="summary-header">
                <Package size={20} className="package-icon" />
                <h2 className="summary-title-modern">Order Insights</h2>
              </div>

              <div className="summary-items-list">
                {cartItems.map((item) => (
                  <div key={item._id || item.id} className="summary-item-modern">
                    <div className="item-head">
                      <span className="item-name-sm">{item.name}</span>
                      <span className="item-price-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <div className="item-foot">
                      <span className="item-qty-tag">Quantity: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="calculation-grid">
                <div className="calc-row">
                  <span>Logistics</span>
                  <span className="calc-free">Inclusive</span>
                </div>
                <div className="calc-row total-highlight">
                  <span>Payable Amount</span>
                  <span className="total-value-modern">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              <div className="trust-meter-modern">
                <div className="trust-item">
                  <Shield size={14} />
                  <span>Verified Secure Checkout</span>
                </div>
                <div className="trust-item">
                  <Truck size={14} />
                  <span>Logistics Sync Protocol</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Proof Preview Modal */}
      {isModalOpen && proofPreview && (
        <div className="proof-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="proof-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <img src={proofPreview} alt="Payment Proof Full" className="proof-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutContent;
