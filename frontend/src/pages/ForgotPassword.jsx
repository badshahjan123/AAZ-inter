import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';
import './Login.css';
import { api } from '../config/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(api('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-centered-box">
        {success ? (
          <div className="animate-fade-in">
            <div className="auth-header-minimal">
              <CheckCircle size={48} style={{ color: 'var(--user-secondary)', marginBottom: '1rem' }} />
              <h1>Check Your Email</h1>
              <p>We've sent recovery instructions to <strong>{email}</strong></p>
            </div>
            <p style={{ color: 'var(--user-text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Please check your inbox and follow the link to reset your security credentials.
            </p>
            <Button variant="outline" fullWidth onClick={() => setSuccess(false)}>
              Try a different email
            </Button>
          </div>
        ) : (
          <>
            <div className="auth-header-minimal">
              <h1>Recover Access</h1>
              <p>Enter your email to receive recovery instructions</p>
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
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" fullWidth disabled={loading} className="auth-submit-btn">
                {loading ? 'Processing...' : 'Send Recovery Link'}
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

export default ForgotPassword;
