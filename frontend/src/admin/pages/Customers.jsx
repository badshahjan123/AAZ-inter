import { useState, useEffect } from 'react';
import { Mail, Trash2, Calendar, Search } from 'lucide-react';
import { api } from '../../config/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.error('No admin token found');
        setCustomers([]);
        setLoading(false);
        return;
      }

      const response = await fetch(api('/api/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - Admin token may be invalid or expired');
          localStorage.removeItem('adminToken');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error('Invalid customers data:', data);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // ...delete logic same...
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(api(`/api/users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setCustomers(customers.filter(c => c._id !== id));
      }
    } catch (error) {
       console.error(error);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between">
        <h1 className="page-title">Customers</h1>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            className="search-input" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Avatar</th>
              <th>Customer Name</th>
              <th>Contact</th>
              <th>Date Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c._id}>
                <td>
                  <div className="avatar-circle">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>#{c._id.slice(-6)}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} className="text-muted" />
                    {c.email}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} className="text-muted" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <span className="status-pill pill-active">Active</span>
                </td>
                <td>
                  <button onClick={() => handleDelete(c._id)} 
                          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
             {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No result found for "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
