import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../data/products';
import Button from '../components/common/Button';
import { API_URL } from '../config/api';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems: wishlist, loading, removeFromWishlist } = useWishlist();

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  if (!user) {
    return (
      <div className="container wishlist-page text-center">
        <div className="wishlist-empty">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your wishlist.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>Login Now</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20">Loading wishlist...</div>;
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <span className="wishlist-count">({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})</span>
        </div>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h3>Your wishlist is empty</h3>
            <p>Save medical equipment you love to compare and purchase later.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>Explore All Products</Button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const product = item.product;
              let productImage = product.image;
              
              if (productImage) {
                productImage = productImage.replace(/\\/g, '/');
                if (productImage.includes('localhost')) {
                  const pathPart = productImage.split(/localhost:\d+/)[1] || productImage;
                  productImage = `${API_URL}${pathPart.startsWith('/') ? pathPart : '/' + pathPart}`;
                } else if (productImage.startsWith('/uploads') || productImage.startsWith('uploads/')) {
                  const cleanPath = productImage.startsWith('/') ? productImage : `/${productImage}`;
                  productImage = `${API_URL}${cleanPath}`;
                }
              }
              
              const imagePlaceholder = productImage || `https://via.placeholder.com/300x300/0A74DA/FFFFFF?text=${encodeURIComponent(product.name)}`;

              return (
                <div key={item._id} className="wishlist-item">
                  <button
                    className="wishlist-remove-btn"
                    onClick={() => handleRemove(product._id)}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>

                  <Link to={`/products/${product._id}`} className="wishlist-link">
                    <div className="wishlist-img-wrapper">
                      <img src={imagePlaceholder} alt={product.name} />
                    </div>
                    
                    <div className="wishlist-item-info">
                      <h3 className="wishlist-item-name">{product.name}</h3>
                      
                      {product.description && (
                        <p className="wishlist-item-description">{product.description}</p>
                      )}
                      
                      <div className="wishlist-item-price">
                        {formatPrice(product.price)}
                      </div>
                      
                      <div className={`wishlist-stock-status ${product.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </div>
                    </div>
                  </Link>

                  <Button
                    variant="primary"
                    fullWidth
                    icon={<ShoppingCart size={16} />}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    Add to Cart
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;