import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Login.css';
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 2FA States
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    const result = await resetPassword(token, formData.password, otpToken);
    setLoading(false);

    if (result.success) {
      if (result.twoFactorRequired) {
        setTwoFactorRequired(true);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError(result.message || 'Link expired or invalid. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-centered-box">
        {success ? (
          <div className="animate-fade-in">
            <div className="auth-header-minimal">
              <CheckCircle size={48} style={{ color: 'var(--user-secondary)', marginBottom: '1rem' }} />
              <h1>Access Restored</h1>
              <p>Your security credentials have been successfully updated.</p>
            </div>
            <p style={{ color: 'var(--user-text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Redirecting you to the secure login gateway...
            </p>
            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
              Sign In Now
            </Button>
          </div>
        ) : (
          <>
            <div className="auth-header-minimal">
              <h1>Update Credentials</h1>
              <p>Reset your security password for your medical portal</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error-flat">{error}</div>}
              <div className="form-group-modern">
                <label htmlFor="password">New Password</label>
                <div className="input-modern-group">
                  <Lock size={18} className="input-icon-modern" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    disabled={loading}
                  />
                  <button type="button" className="password-toggle-modern" onClick={() => setShowPassword(!showPassword)}>
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
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {twoFactorRequired && (
                <div className="form-group-modern animate-fade-in" style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label htmlFor="otp" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#1e293b' }}>Authenticator Code</label>
                  <div className="input-modern-group">
                    <CheckCircle size={18} className="input-icon-modern" />
                    <input
                      type="text"
                      id="otp"
                      placeholder="000000"
                      maxLength="6"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
                      disabled={loading}
                    />
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>Enter the 6-digit code from your app to confirm.</p>
                </div>
              )}
              <Button type="submit" variant="primary" fullWidth disabled={loading} className="auth-submit-btn">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </>
        )}
        <div className="auth-footer-minimal">
          <Link to="/login" className="auth-link-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowLeft size={18} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
