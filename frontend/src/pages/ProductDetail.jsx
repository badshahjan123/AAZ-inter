import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Check, 
  MessageCircle, 
  Star, 
  Truck, 
  Shield, 
  Award,
  ChevronRight,
  Heart,
  Share2,
  Send
} from 'lucide-react';
import { formatPrice } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { sendWhatsAppMessage, whatsappMessages, getAssetUrl } from '../utils/helpers';
import Button from '../components/common/Button';
import ProductCard from '../components/product/ProductCard';
import { api, API_URL } from '../config/api';
import './ProductDetail.css';
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Reset scroll and state when ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setActiveTab('description');
    
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(api(`/api/products/${id}`));
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);

        // Fetch related products (all products, then filter)
        // Optimization: Create /api/products?category=ID endpoint technically better, 
        // but filtering clientside is okay for now.
        const allRes = await fetch(api('/api/products'));
        const allData = await allRes.json();
        const related = allData
          .filter(p => p.category?._id === data.category?._id && p._id !== data._id)
          .slice(0, 4);
        setRelatedProducts(related);

        // Fetch reviews and stats
        fetchReviews(data._id);
        fetchReviewStats(data._id);
        
        // Check wishlist status if user is logged in
        if (user) {
          checkWishlistStatus(data._id);
        }

      } catch (err) {
        console.error(err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const fetchReviews = async (productId) => {
    try {
      const res = await fetch(api(`/api/reviews/${productId}`));
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const fetchReviewStats = async (productId) => {
    try {
      const res = await fetch(api(`/api/reviews/${productId}/stats`));
      const data = await res.json();
      setReviewStats(data);
    } catch (err) {
      console.error('Failed to fetch review stats:', err);
    }
  };

  const checkWishlistStatus = async (productId) => {
    try {
      const res = await fetch(api(`/api/wishlist/check/${productId}`), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setIsInWishlist(data.inWishlist);
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await fetch(api(`/api/wishlist/${product._id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        setIsInWishlist(false);
      } else {
        await fetch(api('/api/wishlist'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ productId: product._id })
        });
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out ${product.name} - ${formatPrice(product.price)}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: text,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Product link copied to clipboard!');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(api('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          product: product._id,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      if (res.ok) {
        setNewReview({ rating: 5, comment: '' });
        fetchReviews(product._id);
        fetchReviewStats(product._id);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Button onClick={() => navigate('/products')} variant="primary">
          Back to Products
        </Button>
      </div>
    );
  }

  const category = product.category || { name: 'Category' };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  const handleWhatsAppInquiry = () => {
    sendWhatsAppMessage(whatsappMessages.productInquiry(product.name));
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Determine image source
  const mainImage = getAssetUrl(product.image, API_URL);
  
  // Fallback to placeholder if no image
  const imagePlaceholder = mainImage || `https://via.placeholder.com/800x800/0A74DA/FFFFFF?text=${encodeURIComponent(product.name)}`;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products">Products</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${category?.slug}`}>{category?.name || 'Category'}</Link>
          <ChevronRight size={14} />
          <span className="current-crumb">{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          {/* Product Image Section */}
          <div className="product-gallery-section">
            <div className="product-detail-image">
              <img src={imagePlaceholder} alt={product.name} />
              {product.stock > 0 ? (
                <span className="detail-badge detail-badge-success">
                  <Check size={16} />
                  In Stock ({product.stock})
                </span>
              ) : (
                <span className="detail-badge detail-badge-error">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="product-detail-info">
            <div className="product-detail-header">
              <span className="product-category-label">{category?.name}</span>
              <h1 className="product-detail-title">{product.name}</h1>
              <div className="product-meta-row">
                <div className="product-rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={16} 
                        fill={star <= Math.round(reviewStats.averageRating || 0) ? "#FFC107" : "none"} 
                        color="#FFC107" 
                      />
                    ))}
                  </div>
                  <span className="rating-text">
                    ({(reviewStats.averageRating || 0).toFixed(1)}/5.0 based on {reviewStats.totalReviews} reviews)
                  </span>
                </div>
                <span className="product-sku">SKU: {product.sku}</span>
              </div>
            </div>

            <div className="product-price-section">
              <span className="detail-price">{formatPrice(product.price)}</span>
              <span className="price-label">Excl. Tax</span>
            </div>

            <div className="product-short-desc">
              <p>{product.description}</p>
            </div>

            {/* Quantity and Actions */}
            <div className="product-actions-wrapper">
              <div className="product-quantity">
                <label htmlFor="quantity">Quantity</label>
                <div className="quantity-controls">
                  <button onClick={decrementQuantity} className="quantity-btn" aria-label="Decrease quantity">−</button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="quantity-input"
                  />
                  <button onClick={incrementQuantity} className="quantity-btn" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div className="action-buttons">
                <Button
                  variant="primary"
                  size="large"
                  className="add-to-cart-btn"
                  icon={<ShoppingCart size={20} />}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  Add to Cart
                </Button>
                <button 
                  className={`wishlist-btn ${isInWishlist ? 'active' : ''}`} 
                  title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <Heart size={20} fill={isInWishlist ? '#e74c3c' : 'none'} color={isInWishlist ? '#e74c3c' : '#64748b'} />
                </button>
                <button className="share-btn" title="Share Product" onClick={handleShare}>
                  <Share2 size={20} />
                </button>
              </div>
              
              <Button
                variant="secondary"
                size="large"
                fullWidth
                icon={<MessageCircle size={20} />}
                onClick={handleWhatsAppInquiry}
                className="whatsapp-btn"
              >
                Inquire on WhatsApp
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges-grid">
              <div className="trust-badge">
                <div className="trust-icon"><Award size={24} /></div>
                <div className="trust-text">
                  <strong>Genuine Product</strong>
                  <span>100% Authentic</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-icon"><Truck size={24} /></div>
                <div className="trust-text">
                  <strong>Fast Delivery</strong>
                  <span>Nationwide Shipping</span>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-icon"><Shield size={24} /></div>
                <div className="trust-text">
                  <strong>Secure Payment</strong>
                  <span>100% Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs (Description, Features, Reviews) */}
        <div className="product-tabs-section">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Specifications
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({reviewStats.totalReviews})
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-content">
                <h3>Product Overview</h3>
                <p>{product.description}</p>
                <p>
                  This premium medical equipment meets the highest industry standards. Designed for durability and reliability,
                  it offers exceptional performance in clinical settings. The {product.name} is trusted by healthcare
                  professionals nationwide.
                </p>
                <p>
                  <strong>Key Highlights:</strong>
                </p>
                <ul>
                  {product.features?.slice(0, 3).map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {activeTab === 'features' && (
              <div className="features-content">
                <h3>Technical Specifications</h3>
                <div className="specs-table">
                  {product.features?.map((feature, index) => (
                    <div className="spec-row" key={index}>
                      <span className="spec-label">Feature {index + 1}</span>
                      <span className="spec-value">{feature}</span>
                    </div>
                  ))}
                  <div className="spec-row">
                    <span className="spec-label">Manufacturer</span>
                    <span className="spec-value">AAZ Medical</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">SKU</span>
                    <span className="spec-value">{product.sku}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Category</span>
                    <span className="spec-value">{category?.name}</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <div className="review-summary">
                  <div className="big-rating">{(reviewStats.averageRating || 0).toFixed(1)}</div>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={20} 
                        fill={star <= Math.round(reviewStats.averageRating || 0) ? "#FFC107" : "none"} 
                        color="#FFC107" 
                      />
                    ))}
                  </div>
                  <p>Based on {reviewStats.totalReviews} verified reviews</p>
                </div>

                {/* Add Review Form */}
                {user ? (
                  <div className="add-review-section">
                    <h4>Write a Review</h4>
                    <form onSubmit={handleSubmitReview} className="review-form">
                      <div className="rating-input">
                        <label>Rating:</label>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={24}
                              fill={star <= newReview.rating ? "#FFC107" : "none"}
                              color="#FFC107"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="comment-input">
                        <label>Comment:</label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="Share your experience with this product..."
                          required
                          maxLength={500}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        icon={<Send size={16} />}
                        loading={submittingReview}
                        disabled={!newReview.comment.trim()}
                      >
                        Submit Review
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="login-prompt">
                    <p>Please <Link to="/login">login</Link> to write a review.</p>
                  </div>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                  {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <strong>{review.user.name}</strong>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={14} 
                              fill={star <= review.rating ? "#FFC107" : "none"} 
                              color="#FFC107" 
                            />
                          ))}
                        </div>
                        <p className="review-text">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="section-title">Related Products</h2>
            <div className="products-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
