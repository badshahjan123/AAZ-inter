import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ClipboardCheck, Globe } from 'lucide-react';
import Button from '../components/common/Button';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-container">
        {/* Left: Professional Brand Panel */}
        <div className="auth-brand-panel login-variant">
          <div className="brand-content">
            <span className="section-label">PARTNER PORTAL</span>
            <h1>AAZ</h1>
            <p className="tagline">Global Excellence in Healthcare Logistics & Medical Infrastructure.</p>
            
            <div className="trust-points">
              <div className="trust-item">
                <div className="point-icon"><ShieldCheck size={20} /></div>
                <span>Secured B2B Gateway</span>
              </div>
              <div className="trust-item">
                <div className="point-icon"><Globe size={20} /></div>
                <span>Direct Global Supply Chain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Minimal Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header-minimal">
              <h1>Sign In</h1>
              <p>Access your medical procurement account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error-flat">{error}</div>}

              <div className="form-group-modern">
                <label htmlFor="email">Work Email</label>
                <div className="input-modern-group">
                  <Mail size={18} className="input-icon-modern" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@organization.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label htmlFor="password">Security Password</label>
                <div className="input-modern-group">
                  <Lock size={18} className="input-icon-modern" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-modern"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options-minimal">
                <Link to="/forgot-password" style={{ color: '#78909c', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" variant="primary" fullWidth className="auth-submit-btn">
                Sign In
              </Button>
            </form>

            <div className="auth-footer-minimal">
              <p>
                New partner? 
                <Link to="/signup" className="auth-link-bold">Create Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
