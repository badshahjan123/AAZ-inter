import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ClipboardCheck, Globe } from 'lucide-react';
import Button from '../components/common/Button';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verify2FALogin, isAuthenticated } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2FA States
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otpToken, setOtpToken] = useState('');
  

  if (isAuthenticated) {
    const destination = location.state?.from || '/';
    return <Navigate to={destination} replace />;
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
    
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      if (result.twoFactorRequired) {
        setTwoFactorStep(true);
        setUserId(result.userId);
      } else {
        const destination = location.state?.from || '/';
        navigate(destination);
      }
    } else {
      setError(result.message);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    const result = await verify2FALogin(userId, otpToken);
    setLoading(false);

    if (result.success) {
      const destination = location.state?.from || '/';
      navigate(destination);
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

        {/* Right: Form Side */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            {!twoFactorStep ? (
              <>
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
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
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
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
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
                    <Link to="/forgot-password" title="Recover Access" className="auth-forgot-link">
                      Forgot Password?
                    </Link>
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={loading} className="auth-submit-btn">
                    Sign In
                  </Button>
                </form>

                <div className="auth-footer-minimal">
                  <p>
                    New partner? 
                    <Link to="/signup" className="auth-link-bold">Create Account</Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="auth-header-minimal">
                  <h1>Two-Factor Auth</h1>
                  <p>Enter the 6-digit code from your authenticator app</p>
                </div>

                <form className="auth-form" onSubmit={handle2FAVerify}>
                  {error && <div className="auth-error-flat">{error}</div>}

                  <div className="form-group-modern">
                    <label htmlFor="otp">Verification Code</label>
                    <div className="input-modern-group">
                      <ShieldCheck size={18} className="input-icon-modern" />
                      <input
                        type="text"
                        id="otp"
                        placeholder="000000"
                        maxLength="6"
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                        className="otp-input-elite"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={loading} className="auth-submit-btn">
                    Verify & Login
                  </Button>

                  <button 
                    type="button" 
                    className="auth-link-bold" 
                    style={{ background: 'none', border: 'none', width: '100%', marginTop: '15px', cursor: 'pointer' }}
                    onClick={() => setTwoFactorStep(false)}
                  >
                    Back to Login
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
