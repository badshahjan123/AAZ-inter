const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  loginUser, 
  registerUser, 
  getMe, 
  updateUserProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  verify2FALogin
} = require('../controllers/authController');
const { protect, protectAllowUnverified } = require('../middleware/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// ============================================
// SECURE AUTHENTICATION ROUTES
// ============================================

// Get current user (protected, allows unverified users to access profile)
router.get('/me', protectAllowUnverified, getMe);

// Update profile
router.put('/profile', protectAllowUnverified, updateUserProfile);

// Admin login (rate limited + validated)
router.post('/admin/login', 
  authLimiter,           // 5 attempts per 15 min
  validateLogin,         // Input validation
  loginAdmin
);

// User login (rate limited + validated)
router.post('/login', 
  authLimiter,           // 5 attempts per 15 min
  validateLogin,         // Input validation
  loginUser
);

// User registration (rate limited + validated)
router.post('/register', 
  authLimiter,           // Prevent spam registrations
  validateRegistration,  // Input validation & sanitization
  registerUser
);

// Email verification via link (token in URL)
router.get('/verify-email/:token', 
  authLimiter,
  verifyEmail
);

// Resend verification email (for logged in but unverified users)
router.post('/resend-verification',
  authLimiter,
  protectAllowUnverified,  // Must be logged in (but can be unverified)
  resendVerificationEmail
);

// Forgot password - Step 1: Request reset link
router.post('/forgot-password', 
  passwordResetLimiter,
  forgotPassword
);

// Forgot password - Step 2: Reset using token
router.post('/reset-password/:token', 
  passwordResetLimiter,
  resetPassword
);


// 2FA Routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/login-verify', authLimiter, verify2FALogin);

module.exports = router;
