import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import './Login.css'; // Reuse Login styles for consistency

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get email from query params
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email provided, maybe redirect back to login or stay empty
      // navigate('/login');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyEmail(email, otp);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Optional: Delay redirect to show success message
      setTimeout(() => {
        navigate('/login?verified=true'); // Or dashboard if auto-logged in
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-split-container centered-single-col">
          <div className="auth-form-container success-container">
            <div className="success-icon-wrapper">
              <ShieldCheck size={64} className="text-green-500" />
            </div>
            <h1>Email Verified!</h1>
            <p>Your account has been successfully verified.</p>
            <Button 
                onClick={() => navigate('/login')}
                variant="primary"
                className="mt-4"
            >
                Continue to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-split-container">
         {/* Left: Brand Panel (reuse from Signup/Login) */}
         <div className="auth-brand-panel login-variant">
          <div className="brand-content">
            <span className="section-label">SECURITY</span>
            <h1>Verify Account</h1>
            <p className="tagline">Enter the code sent to your email to activate your account.</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header-minimal">
              <h1>Verification Code</h1>
              <p>We sent a code to <span className="font-semibold text-primary">{email}</span></p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error-flat">{error}</div>}

              <div className="form-group-modern">
                <label htmlFor="otp">Enter 6-Digit Code</label>
                <div className="input-modern-group">
                  <Mail size={18} className="input-icon-modern" />
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="tracking-widest text-center text-lg font-bold"
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
                Verify Email <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>

            <div className="auth-footer-minimal">
              <p>
                Didn't receive the code? 
                <button className="text-primary hover:underline ml-1 font-medium bg-transparent border-none cursor-pointer">
                  Resend
                </button>
              </p>
               <div className="mt-4">
                <Link to="/signup" className="text-sm text-gray-500 hover:text-gray-700"> Back to Signup</Link>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
