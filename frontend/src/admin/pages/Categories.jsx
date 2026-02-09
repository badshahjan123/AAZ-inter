import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Tag } from 'lucide-react';
import { api } from '../../config/api';
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(api('/api/categories'));
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const url = editingId 
      ? api(`/api/categories/${editingId}`)
      : api('/api/categories');
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchCategories();
        setFormData({ name: '', description: '' });
        setEditingId(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setFormData({ 
      name: cat.name || '', 
      description: cat.description || ''
    });
    setEditingId(cat._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(api(`/api/categories/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1 className="page-title">Category Management</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Form Card */}
        <div className="table-container" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
          <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <Tag size={20} className="mr-2 text-primary" style={{ marginRight: '0.5rem', color: 'var(--admin-primary)' }} />
            {editingId ? 'Edit Category' : 'Create Category'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
              <input 
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="e.g. Diagnostics"
              />
            </div>
            
            <div className="mb-4">
               <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
               <textarea
                 className="admin-input"
                 rows="3"
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
                 placeholder="Category description (optional)..."
                 style={{ resize: 'vertical' }}
               />
            </div>
            
            <button className="admin-nav-item active" style={{ width: '100%', justifyContent: 'center', background: 'var(--admin-primary)', color: 'white' }} disabled={loading}>
              {loading ? 'Processing...' : (editingId ? 'Update Category' : 'Add Category')}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                className="admin-nav-item" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', border: '1px solid #e2e8f0' }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '' });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* List Card */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name & Description</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                   <td>
                     <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{cat.name}</div>
                     <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{cat.description || 'No description provided.'}</div>
                   </td>
                   <td>
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button onClick={() => handleEdit(cat)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white' }}>
                         <Edit size={16} color="#64748b" />
                       </button>
                       <button onClick={() => handleDelete(cat._id)} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#fee2e2', cursor: 'pointer' }}>
                         <Trash2 size={16} color="#ef4444" />
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                   <td colSpan="2" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                     No categories found. Start by adding one.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;
