import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, DollarSign, Archive, Tag } from 'lucide-react';
import { api, API_URL } from '../../../config/api';
const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id && id !== 'new'; // Safe check

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: '',
    stock: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(api('/api/categories'));
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Categories API returned non-array:', data);
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(api(`/api/products/${id}`));
      if (!response.ok) {
         setError('Product not found');
         return;
      }
      const data = await response.json();
      setFormData({
        name: data.name || '',
        price: data.price || '',
        description: data.description || '',
        image: data.image || '',
        category: data.category?._id || data.category || '',
        stock: data.stock || ''
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load product');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setUploading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        setUploading(false);
        return;
      }

      const res = await fetch(api('/api/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload,
      });

      const data = await res.json();
      
      if (res.ok) {
        // Convert relative path to full URL
        let imageUrl = data.image;
        if (!imageUrl.startsWith('http')) {
          const normalizedSrc = imageUrl.replace(/\\/g, '/');
          const cleanPath = normalizedSrc.startsWith('/') ? normalizedSrc : `/${normalizedSrc}`;
          imageUrl = `${API_URL}${cleanPath}`;
        }
        
        setFormData(prev => ({ ...prev, image: imageUrl }));
      } else {
        alert(data.message || data.error || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const url = isEditMode 
        ? api(`/api/products/${id}`) 
        : api('/api/products');
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/admin/products');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save product');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/admin/products')} 
        className="admin-nav-item" 
        style={{ width: 'fit-content', marginBottom: '1.5rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}
      >
        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back
      </button>

      <div className="flex-between">
         <h1 className="page-title" style={{ margin: 0 }}>{isEditMode ? 'Edit Product' : 'Create New Product'}</h1>
         <button onClick={handleSubmit} className="admin-nav-item active" style={{ display: 'inline-flex', background: 'var(--admin-primary)', color: 'white', padding: '0.75rem 2rem' }} disabled={loading}>
           <Save size={18} style={{ marginRight: '0.5rem' }} /> {loading ? 'Saving...' : 'Save Product'}
         </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Info */}
        <div className="table-container" style={{ padding: '2rem', height: 'fit-content' }}>
           {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem' }}>{error}</div>}
           
           <div className="mb-4">
             <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Product Name</label>
             <input type="text" name="name" className="admin-input" value={formData.name} onChange={handleChange} required placeholder="e.g. Surgical Mask 50pcs" />
           </div>

           <div className="mb-4">
             <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
             <textarea name="description" className="admin-input" rows="8" value={formData.description} onChange={handleChange} required placeholder="Detailed description..." style={{ resize: 'vertical' }}></textarea>
           </div>
        </div>

        {/* Side Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {/* Pricing & Stock */}
           <div className="table-container" style={{ padding: '2rem' }}>
              <h3 className="section-title" style={{ fontSize: '1rem' }}>Pricing & Inventory</h3>
              
              <div className="mb-4">
                 <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price (PKR)</label>
                 <div style={{ position: 'relative' }}>
                   <DollarSign size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                   <input type="number" name="price" className="admin-input" value={formData.price} onChange={handleChange} required style={{ paddingLeft: '2.25rem' }} />
                 </div>
              </div>

              <div className="mb-4">
                 <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Stock Count</label>
                 <div style={{ position: 'relative' }}>
                   <Archive size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                   <input type="number" name="stock" className="admin-input" value={formData.stock} onChange={handleChange} required style={{ paddingLeft: '2.25rem' }} />
                 </div>
              </div>
           </div>

           {/* Category & Image */}
           <div className="table-container" style={{ padding: '2rem' }}>
              <h3 className="section-title" style={{ fontSize: '1rem' }}>Organization</h3>
              
              <div className="mb-4">
                 <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                 <div style={{ position: 'relative' }}>
                   <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                   <select name="category" className="admin-input" value={formData.category} onChange={handleChange} required style={{ paddingLeft: '2.25rem', appearance: 'none' }}>
                     <option value="">Select Category</option>
                      {Array.isArray(categories) && categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                   </select>
                 </div>
              </div>

               <div className="mb-4">
                 <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Product Image</label>
                 
                 {formData.image ? (
                   <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                     <img src={formData.image} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                     <button type="button" onClick={() => setFormData({...formData, image: ''})} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: 4, border: 'none', cursor: 'pointer' }}>
                       <X size={16} />
                     </button>
                   </div>
                 ) : (
                   <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', marginBottom: '1rem', background: '#f8fafc' }}>
                     <div className="text-muted" style={{ marginBottom: '0.5rem' }}>No image selected</div>
                   </div>
                 )}

                 <label className="admin-nav-item" style={{ justifyContent: 'center', background: '#f1f5f9', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                   <Upload size={18} style={{ marginRight: '0.5rem' }} />
                   {uploading ? 'Uploading...' : 'Upload Image'}
                   <input type="file" onChange={handleUploadFile} style={{ display: 'none' }} accept="image/*" />
                 </label>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
