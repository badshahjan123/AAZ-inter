import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Globe, User } from 'lucide-react';
import Button from '../components/common/Button';
import './Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signup(formData.name, formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      if (result.isVerified) {
        // If backend returns verified (e.g. SMTP issue fallback), skip verification page
        navigate('/');
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-container">
        {/* Left: Professional Brand Panel */}
        <div className="auth-brand-panel signup-variant">
          <div className="brand-content">
            <span className="section-label">PARTNER REGISTRATION</span>
            <h1>Join AAZ</h1>
            <p className="tagline">Become part of our global medical supply network today.</p>
            
            <div className="trust-points">
              <div className="trust-item">
                <div className="point-icon"><ShieldCheck size={20} /></div>
                <span>Verified Supplier Network</span>
              </div>
              <div className="trust-item">
                <div className="point-icon"><Globe size={20} /></div>
                <span>International Delivery Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Minimal Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header-minimal">
              <h1>Create Account</h1>
              <p>Register your medical organization or personal account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error-flat">{error}</div>}

              <div className="form-group-modern">
                <label htmlFor="name">Full Name / Organization</label>
                <div className="input-modern-group">
                  <User size={18} className="input-icon-modern" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Dr. Smith / City Hospital"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                <label htmlFor="password">Password</label>
                <div className="input-modern-group">
                  <Lock size={18} className="input-icon-modern" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Create a strong password"
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

              <div className="form-group-modern">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-modern-group">
                  <Lock size={18} className="input-icon-modern" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                className="auth-submit-btn"
                loading={loading}
              >
                Sign Up
              </Button>
            </form>

            <div className="auth-footer-minimal">
              <p>
                Already have an account? 
                <Link to="/login" className="auth-link-bold">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
