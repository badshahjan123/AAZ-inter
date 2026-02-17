const Admin = require('../models/Admin');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Admin Login Attempt: ${email}`);

    // Use case-insensitive search for email
    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (admin && (await admin.matchPassword(password))) {
      console.log(`✅ Login Successful for: ${email}`);
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id)
      });
    } else {
      console.log(`❌ Login Failed for: ${email}. ${!admin ? 'Admin not found.' : 'Password incorrect.'}`);
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Strict Email Format Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and include 1 uppercase letter, 1 number, and 1 special character.');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      emailVerificationExpire: verificationExpire,
      accountStatus: 'active'
    });

    if (user) {
       // Attempt to send email but don't block registration
       try {
         const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
         
         const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 16px 40px; background-color: #1976D2; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }
    .link-box { word-break: break-all; background: #f4f4f4; padding: 12px; border-radius: 4px; font-size: 14px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Welcome to AAZ International</h1>
      <p>Medical Equipment & Supplies</p>
    </div>
    <div class="content">
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering with AAZ International Medical Solutions. To complete your registration and start ordering medical equipment, please verify your email address.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button" style="color: #ffffff; text-decoration: none;">Verify Email Address</a>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <div class="link-box">
        <a href="${verificationUrl}" style="color: #1976D2; word-break: break-all;">${verificationUrl}</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This link will expire in <strong>24 hours</strong></li>
          <li>For security, this is a one-time use link</li>
          <li>If you didn't create this account, please ignore this email</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated email from AAZ International Enterprises Pvt. Ltd.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
         `;
         
         await sendEmail({
           email: user.email,
           subject: 'AAZ Medical - Verify Your Account',
           html: htmlContent
         });
         
         console.log(`✅ Verification email sent to: ${user.email}`);
       } catch (err) {
         console.error('❌ Email sending failed (Non-blocking):', err.message);
         // Do not throw error - registration should succeed even if email fails
       }

       res.status(201).json({
         message: 'Registration successful! Please check your email for verification link.',
         email: user.email,
         isVerified: false
       });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private (must be logged in but unverified)
const resendVerificationEmail = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = verificationExpire;
    await user.save();

    // Send email (non-blocking)
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 16px 40px; background-color: #1976D2; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }
    .link-box { word-break: break-all; background: #f4f4f4; padding: 12px; border-radius: 4px; font-size: 14px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 AAZ International</h1>
      <p>Email Verification</p>
    </div>
    <div class="content">
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>You requested a new verification email. Please click the button below to verify your email address.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="button" style="color: #ffffff; text-decoration: none;">Verify Email Address</a>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <div class="link-box">
        <a href="${verificationUrl}" style="color: #1976D2; word-break: break-all;">${verificationUrl}</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This link will expire in <strong>24 hours</strong></li>
          <li>For security, this is a one-time use link</li>
          <li>Your previous verification link is now invalid</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated email from AAZ International Enterprises Pvt. Ltd.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;
      
      await sendEmail({
        email: user.email,
        subject: 'AAZ Medical - Verify Your Account',
        html: htmlContent
      });
      
      console.log(`✅ Verification email resent to: ${user.email}`);
    } catch (err) {
      console.error('❌ Email sending failed (Non-blocking):', err.message);
      // Don't throw - still return success
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Normalize email for search
    const searchEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: searchEmail });

    if (user && (await user.matchPassword(password))) {
      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        return res.json({
          twoFactorRequired: true,
          email: user.email,
          userId: user._id
        });
      }
      // NOTE: We allow unverified users to login so they can access their profile
      // and resend verification email. They will be blocked from:
      // - Placing orders (checked in orderController)
      // - Accessing other protected routes (checked in middleware)
      
      // if (!user.isVerified) {
      //   res.status(401);
      //   throw new Error('Please verify your email address first. Check your inbox for the verification link.');
      // }


      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        hospitalName: user.hospitalName || '',
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        twoFactorEnabled: !!user.twoFactorEnabled,
        hasTwoFactorSecret: !!user.twoFactorSecret,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send reset link to email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // For security, don't reveal if user exists. 
      // Always return 200 so hackers can't "probe" emails.
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a reset link shortly.'
      });
    }

    // Generate Reset Token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Send Email
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: #1976D2; color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px; }
    .button-container { text-align: center; margin: 35px 0; }
    .button { display: inline-block; padding: 18px 45px; background-color: #1976D2; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s; }
    .footer { background: #f9f9f9; padding: 25px; text-align: center; color: #666; font-size: 13px; border-top: 1px solid #eee; }
    .expiry-note { color: #d32f2f; font-weight: 600; margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">AAZ International</h2>
      <p style="margin:10px 0 0 0; opacity:0.9;">Password Recovery System</p>
    </div>
    <div class="content">
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received a request to reset the password for your medical portal account. Please use the button below to choose a new password:</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button" style="color:white; text-decoration:none;">Reset My Password</a>
      </div>
      
      <p style="color: #666; font-size: 14px; text-align: center;">Or copy this link to your browser:</p>
      <div style="background:#f4f4f4; padding:15px; border-radius:6px; font-size:13px; word-break:break-all; text-align:center;">
        <a href="${resetUrl}" style="color:#1976D2;">${resetUrl}</a>
      </div>
      
      <p class="expiry-note">⏱️ This link is valid for 30 minutes only.</p>
      
      <p style="margin-top:30px; font-size:14px; color:#888;">If you did not request this password change, please ignore this email. Your account is still secure.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AAZ International Enterprises Pvt. Ltd. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - AAZ International',
        html: htmlContent
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      res.status(500);
      throw new Error('Email could not be sent. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password via Token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    const { password, token: otpToken } = req.body;

    // Check if 2FA is enabled for the user
    if (user.twoFactorEnabled) {
      if (!otpToken) {
        return res.json({
          twoFactorRequired: true,
          message: 'Please provide your 2FA verification code'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otpToken
      });

      if (!verified) {
        res.status(400);
        throw new Error('Invalid authenticator code');
      }
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and include uppercase, number, and special character.');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.city = req.body.city || user.city;
      user.hospitalName = req.body.hospitalName || user.hospitalName;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        hospitalName: updatedUser.hospitalName,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user || req.admin;
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        hospitalName: user.hospitalName || '',
        isAdmin: !!req.admin,
        isVerified: user.isVerified,
        twoFactorEnabled: !!user.twoFactorEnabled,
        hasTwoFactorSecret: !!user.twoFactorSecret
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Setup 2FA - Generate QR Code
// @route   POST /api/auth/2fa/setup
// @access  Private
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let secret;
    if (user.twoFactorSecret) {
      // Reuse existing secret
      secret = {
        base32: user.twoFactorSecret,
        otpauth_url: speakeasy.otpauthURL({
          secret: user.twoFactorSecret,
          label: `AAZ Medical (${user.email})`,
          encoding: 'base32'
        })
      };
    } else {
      // Generate new secret
      secret = speakeasy.generateSecret({
        name: `AAZ Medical (${user.email})`
      });
      user.twoFactorSecret = secret.base32;
      await user.save();
    }

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32,
      exists: !!user.twoFactorSecret
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA & Enable
// @route   POST /api/auth/2fa/verify
// @access  Private
const verify2FA = async (req, res, next) => {
  try {
    const { token, quickToggle } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Quick toggle ON if the user already has a secret
    if (quickToggle && user.twoFactorSecret) {
      user.twoFactorEnabled = true;
      await user.save();
      return res.json({ success: true, message: '2FA Enabled' });
    }

    // Normal verification flow
    if (!token) {
      res.status(400);
      throw new Error('Verification token required');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
      res.json({ success: true, message: '2FA Enabled Successfully' });
    } else {
      res.status(400);
      throw new Error('Invalid verification code');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = false;
    // user.twoFactorSecret = undefined; // KEEP SECRET FOR REUSE
    await user.save();
    res.json({ success: true, message: '2FA Disabled' });
  } catch (error) {
    next(error);
  }
};

// @desc    Login Verify 2FA
// @route   POST /api/auth/2fa/login-verify
// @access  Public
const verify2FALogin = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        twoFactorEnabled: !!user.twoFactorEnabled,
        hasTwoFactorSecret: !!user.twoFactorSecret,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid authentication code');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  loginAdmin, 
  registerUser, 
  loginUser, 
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
};

