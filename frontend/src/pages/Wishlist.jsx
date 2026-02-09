import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import Button from '../components/common/Button';
import { api, API_URL } from '../config/api';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(api('/api/wishlist'), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setWishlist(data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await fetch(api(`/api/wishlist/${productId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setWishlist(wishlist.filter(item => item.product._id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Heart size={64} color="#e74c3c" style={{ marginBottom: '1rem' }} />
        <h2>Please Login</h2>
        <p>You need to be logged in to view your wishlist.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20">Loading wishlist...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Heart size={32} color="#e74c3c" fill="#e74c3c" />
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>My Wishlist</h1>
        <span style={{ color: '#64748b' }}>({wishlist.length} items)</span>
      </div>

      {wishlist.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Heart size={64} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Your wishlist is empty</h3>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Save products you love to buy them later</p>
          <Button variant="primary" onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {wishlist.map((item) => {
            const product = item.product;
            let productImage = product.image;
            
            if (productImage && (productImage.startsWith('/uploads') || productImage.startsWith('uploads/'))) {
              const cleanPath = productImage.startsWith('/') ? productImage : `/${productImage}`;
              productImage = `${API_URL}${cleanPath}`;
            }
            
            const imagePlaceholder = productImage || `https://via.placeholder.com/300x300/0A74DA/FFFFFF?text=${encodeURIComponent(product.name)}`;

            return (
              <div key={item._id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#e74c3c'
                  }}
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>

                <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    background: '#f8fafc'
                  }}>
                    <img
                      src={imagePlaceholder}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#0f172a',
                    lineHeight: '1.4'
                  }}>
                    {product.name}
                  </h3>
                </Link>

                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#0A74DA',
                  marginBottom: '1rem'
                }}>
                  {formatPrice(product.price)}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: product.stock > 0 ? '#059669' : '#dc2626',
                    fontWeight: '500'
                  }}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </span>
                </div>

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
  );
};

export default Wishlist;