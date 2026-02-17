import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield, Truck, CreditCard, ChevronRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, products } from '../data/products';
import Button from '../components/common/Button';
import ProductCard from '../components/product/ProductCard';
import './Cart.css';
import { API_URL } from '../config/api';

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const fromProfile = location.state?.from === 'profile';

  const suggestedProducts = products
    .filter(p => !cartItems.find(item => item._id === p._id))
    .slice(0, 4);

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Breadcrumbs & Back Button */}
        <div className="cart-nav-header">
          <button className="back-nav-btn" onClick={() => navigate(-1)}>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
            <span>Go Back</span>
          </button>
          <nav className="breadcrumbs">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            {fromProfile && (
              <>
                <Link to="/profile">Profile</Link>
                <ChevronRight size={14} />
              </>
            )}
            <span className="current-crumb">Shopping Cart</span>
          </nav>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty-medical">
            <div className="cart-empty-card">
              <div className="medical-icon-pulse">
                <ShoppingBag size={48} className="base-icon" />
              </div>
              <h2>Your medical cart is empty</h2>
              <p>You haven't added any professional medical equipment or surgical supplies yet.</p>
              <div className="cart-empty-actions">
                <Button
                  variant="primary"
                  size="large"
                  icon={<ArrowRight size={20} />}
                  onClick={() => navigate('/products')}
                >
                  Go to Equipment Catalog
                </Button>
              </div>
            </div>

            <div className="medical-quick-shop">
              <h3 className="quick-shop-title">Quick Shop By Category</h3>
              <div className="quick-shop-grid">
                {[
                  { name: 'Hospital Furniture', icon: <Package size={24} />, color: '#0ea5e9' },
                  { name: 'Surgical Instruments', icon: <Plus size={24} />, color: '#06b6d4' },
                  { name: 'Clinical Supplies', icon: <Shield size={24} />, color: '#10b981' },
                  { name: 'Diagnostics', icon: <Minus size={24} />, color: '#3b82f6' }
                ].map((cat, i) => (
                  <div key={i} className="quick-cat-card" onClick={() => navigate('/products')}>
                    <div className="cat-icon" style={{ color: cat.color }}>{cat.icon}</div>
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="cart-header-modern">
              <div className="title-group-modern">
                <h1 className="cart-title-modern">Shopping Cart</h1>
                <span className="cart-subtitle-modern">Procurement Inventory</span>
              </div>
              <div className="cart-status-badge">
                <div className="status-dot"></div>
                {getCartCount()} Items Selected
              </div>
            </div>

            <div className="cart-frame-modern">
              <div className="cart-scroll-area">
                {cartItems.map((item, index) => (
                  <div key={`cart-item-${item._id || index}`} className="cart-item-modern">
                    <div className="item-image-box">
                      <img
                        src={(() => {
                          let imgSrc = item.image;
                          if (!imgSrc) return `https://placehold.co/150x150/0A74DA/FFFFFF?text=${encodeURIComponent(item.name.substring(0, 10))}`;
                          imgSrc = imgSrc.replace(/\\/g, '/');
                          if (imgSrc.includes('localhost')) {
                            const pathPart = imgSrc.split(/localhost:\d+/)[1] || imgSrc;
                            return `${API_URL}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
                          }
                          if (imgSrc.startsWith('/uploads') || imgSrc.startsWith('uploads/')) {
                            const cleanPath = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
                            return `${API_URL}${cleanPath}`;
                          }
                          return imgSrc;
                        })()}
                        alt={item.name}
                      />
                    </div>

                    <div className="item-info-box">
                      <div className="item-main-details">
                        <span className="item-cat-label">Medical Supply</span>
                        <h3 className="item-name-modern">{item.name}</h3>
                        <span className="item-sku-modern">ID: {item.sku || 'N/A'}</span>
                      </div>

                      <div className="item-interaction-grid">
                        <div className="item-pricing-box">
                          <span className="unit-price-label">Unit Price</span>
                          <span className="unit-price-value">{formatPrice(item.price)}</span>
                        </div>

                        <div className="item-qty-selector">
                          <button onClick={() => updateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1} className="qty-act-btn">
                            <Minus size={14} />
                          </button>
                          <span className="qty-val-display">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="qty-act-btn">
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="item-sub-box">
                          <span className="sub-label-modern">Subtotal</span>
                          <span className="sub-amount-modern">{formatPrice(item.price * item.quantity)}</span>
                        </div>

                        <button onClick={() => removeFromCart(item._id)} className="item-delete-btn" title="Remove Item">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary-frame">
                <div className="summary-card-modern">
                  <div className="summary-header">
                    <h2 className="summary-title-modern">Order Summary</h2>
                    <div className="id-badge">ID: AAZ-{Math.floor(1000 + Math.random() * 9000)}</div>
                  </div>

                  <div className="summary-stats-grid">
                    <div className="stat-row">
                      <span className="stat-label">Subtotal</span>
                      <span className="stat-value">{formatPrice(getCartTotal())}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Shipping</span>
                      <span className="stat-value highlight-success">Free</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Taxes</span>
                      <span className="stat-value">Included</span>
                    </div>
                  </div>

                  <div className="grand-total-section">
                    <div className="total-meta">Final Amount Payable</div>
                    <div className="total-value-modern">{formatPrice(getCartTotal())}</div>
                  </div>

                  <div className="cart-action-group">
                    <button className="primary-checkout-btn" onClick={handleCheckout}>
                      <span>Proceed to Final Checkout</span>
                      <ArrowRight size={20} />
                    </button>
                    <button className="secondary-continue-btn" onClick={() => navigate('/products')}>
                      Add More Items
                    </button>
                  </div>

                  <div className="trust-meter-modern">
                    <div className="trust-item">
                      <Shield size={14} />
                      <span>Verified Secure Checkout</span>
                    </div>
                    <div className="trust-item">
                      <Truck size={14} />
                      <span>Expedited Medical Delivery</span>
                    </div>
                  </div>
                </div>

                <div className="clinical-assistance-card">
                  <div className="assistance-icon">
                    <Plus size={20} />
                  </div>
                  <div className="assistance-content">
                    <h4>Clinical Assistance</h4>
                    <p>Support available 24/7 for health equipment queries.</p>
                    <Link to="/contact">Chat with Expert</Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Sticky Checkout Bar */}
            <div className="mobile-checkout-bar">
              <div className="mobile-total-info">
                <span className="mobile-total-label">Final Total</span>
                <span className="mobile-total-price">{formatPrice(getCartTotal())}</span>
              </div>
              <button className="mobile-checkout-btn" onClick={handleCheckout}>
                Checkout Now
              </button>
            </div>
          </>
        )}
        
        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="cart-suggestions-section">
            <h2 className="cart-section-title">You Might Also Like</h2>
            <div className="cart-products-grid">
              {suggestedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
