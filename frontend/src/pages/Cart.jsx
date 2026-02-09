import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield, Truck, CreditCard, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, products } from '../data/products';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ProductCard from '../components/product/ProductCard';
import './Cart.css';
import { API_URL } from '../config/api';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Get 4 random products for "You Might Also Like"
  // In a real app, this would be based on category or recommendation engine
  const suggestedProducts = products
    .filter(p => !cartItems.find(item => item.id === p.id))
    .slice(0, 4);

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <ShoppingBag size={64} />
            <h2>Your cart is empty</h2>
            <p>Add some products to get started</p>
            <Button
              variant="primary"
              size="large"
              icon={<ArrowRight size={20} />}
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" style={{marginBottom: '2rem'}}>
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span className="current-crumb">Shopping Cart</span>
        </nav>

        <h1 className="cart-title">Shopping Cart ({getCartCount()} items)</h1>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <Card key={`cart-item-${item.id || item._id || index}`} className="cart-item" padding="medium">
                <div className="cart-item-image">
                  <img
                    src={(() => {
                      if (!item.image) return `https://via.placeholder.com/150x150/0A74DA/FFFFFF?text=${encodeURIComponent(item.name.substring(0, 10))}`;
                      if (item.image.startsWith('/uploads') || item.image.startsWith('uploads/')) {
                        const normalizedSrc = item.image.replace(/\\/g, '/');
                        const cleanPath = normalizedSrc.startsWith('/') ? normalizedSrc : `/${normalizedSrc}`;
                        return `${API_URL}${cleanPath}`;
                      }
                      return item.image;
                    })()}
                    alt={item.name}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Img'}
                  />
                </div>

                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-sku">SKU: {item.sku}</p>
                  <p className="cart-item-price">{formatPrice(item.price)}</p>
                </div>

                <div className="cart-item-quantity">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="quantity-btn"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="quantity-btn"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-item-total">
                  <p className="item-total-price">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-wrapper">
            <Card className="cart-summary" padding="large">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal ({getCartCount()} items)</span>
                <span className="summary-value">{formatPrice(getCartTotal())}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span className="summary-value success-text">Free</span>
              </div>
              
              <div className="summary-row">
                <span>Tax</span>
                <span className="summary-value">Calculated at checkout</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Total</span>
                <span className="summary-total-value">{formatPrice(getCartTotal())}</span>
              </div>

              <Button
                variant="primary"
                size="large"
                fullWidth
                icon={<ArrowRight size={20} />}
                onClick={handleCheckout}
                className="checkout-btn-pulse"
              >
                Proceed to Checkout
              </Button>

              <div className="cart-trust-badges">
                {[
                  { key: 'secure', icon: <Shield size={16} />, text: 'Secure Checkout' },
                  { key: 'shipping', icon: <Truck size={16} />, text: 'Fast Shipping' },
                  { key: 'payment', icon: <CreditCard size={16} />, text: 'Encrypted Payment' }
                ].map(badge => (
                  <div key={badge.key} className="cart-trust-item">
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="medium"
                fullWidth
                onClick={() => navigate('/products')}
                className="continue-shopping-btn"
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
        
        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="cart-suggestions-section">
            <h2 className="section-title">You Might Also Like</h2>
            <div className="products-grid">
              {suggestedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
