import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, Package, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../../config/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(api('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Invalid data format received:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Always set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(api(`/api/products/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/48?text=No+Img';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads') || imagePath.startsWith('uploads/')) {
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:5000${cleanPath}`;
    }
    return imagePath;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between">
        <h1 className="page-title">Products Inventory</h1>
        <Link to="/admin/products/new" className="admin-nav-item active" style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', background: 'var(--admin-primary)', color: 'white' }}>
          <Plus size={18} className="mr-2" /> Add Product
        </Link>
      </div>

      <div className="admin-content-card" style={{ marginBottom: '2rem' }}>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td>
                  <div style={{ width: 48, height: 48, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <img 
                      src={getImageUrl(product.image)} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => e.target.src = 'https://via.placeholder.com/48?text=No+Img'}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{product.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>ID: {product._id.substring(20,24)}</div>
                </td>
                <td>
                  <span className="status-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                    {product.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>Rs. {product.price}</td>
                <td>
                   {product.stock > 0 ? (
                     <span className="status-pill pill-active">
                        <CheckCircle size={12} style={{ marginRight: 4 }} /> In Stock ({product.stock})
                     </span>
                   ) : (
                     <span className="status-pill pill-inactive">
                        <XCircle size={12} style={{ marginRight: 4 }} /> Out of Stock
                     </span>
                   )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/admin/products/edit/${product._id}`} 
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569', display: 'flex' }}>
                      <Edit size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Package size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
