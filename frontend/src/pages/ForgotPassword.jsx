import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Lock } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Login.css';
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || 'Unable to process request. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-centered-box">
        <div className="auth-header-minimal">
          <h1>Recover Access</h1>
          <p>
            {success 
              ? 'Check your inbox for password reset instructions' 
              : 'Enter your email to receive a secure reset link'}
          </p>
        </div>

        {success ? (
          <div className="auth-success-state">
            <div className="auth-success-flat">
               A reset link has been sent to <strong>{email}</strong> if it exists in our system. The link will expire in 30 minutes.
            </div>
            <Button variant="outline" fullWidth onClick={() => navigate('/login')}>
               Return to Sign In
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error-flat">{error}</div>}
            <div className="form-group-modern">
              <label htmlFor="email">Work Email</label>
              <div className="input-modern-group">
                <Mail size={18} className="input-icon-modern" />
                <input
                  type="email"
                  id="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading} className="auth-submit-btn">
              Send Reset Link
            </Button>
          </form>
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

export default ForgotPassword;
