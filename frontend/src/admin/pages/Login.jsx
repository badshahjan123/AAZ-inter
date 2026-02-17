import { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuth';
import { Lock, Mail, Shield, UserCheck } from 'lucide-react';
import './Login.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAdminAuth();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const result = await login(email, password);
        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-container">
                {/* Enterprise Card */}
                <div className="admin-login-card">
                    <div className="card-top-branding">
                        <div className="admin-logo-badge">
                            <Shield size={28} />
                        </div>
                        <h1 className="admin-brand-name">AAZ INTERNATIONAL</h1>
                    </div>

                    <div className="card-header-section">
                        <h2>Administrator Portal</h2>
                        <p className="card-subtitle">Secure Administrative Access</p>
                    </div>

                    {error && (
                        <div className="admin-login-error">
                            <Lock size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="admin-field-group">
                            <label htmlFor="email">Work Email</label>
                            <div className="admin-input-wrapper">
                                <Mail size={18} className="admin-input-icon" />
                                <input 
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="admin-field-group">
                            <label htmlFor="password">Security Password</label>
                            <div className="admin-input-wrapper">
                                <Lock size={18} className="admin-input-icon" />
                                <input 
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className={`admin-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Verifying Credentials...' : 'Sign In'}
                        </button>

                        <div className="admin-trust-indicator">
                            <UserCheck size={14} />
                            <span>Restricted to authorized administrators</span>
                        </div>
                    </form>
                </div>

                <div className="admin-login-footer">
                    <p>© {new Date().getFullYear()} AAZ International Enterprises Pvt. Ltd.</p>
                    <p className="legal-text">System access is monitored for security and compliance purposes.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
