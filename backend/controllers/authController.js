const Admin = require('../models/Admin');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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
      throw new Error('Please enter a valid and reachable email address');
    }

    // Block Disposable Domains
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'mailinator.com', 'throwawaymail.com'];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      res.status(400);
      throw new Error('Disposable email addresses are not allowed. Please use a permanent email.');
    }

    // Strict Domain Check (Basic DNS resolve is better done via a dedicated library, 
    // but here we enforce format strongly. For 'badshah@gmail.com' existence check, 
    // only OTP email proves it.)

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and include 1 uppercase letter, 1 number, and 1 special character.');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (!userExists.isVerified) {
         // Resend OTP if user exists but not verified?
         // For security, maybe delete old unverified user and recreate, or update OTP.
         // Let's create new OTP.
         const otp = Math.floor(100000 + Math.random() * 900000).toString();
         console.log(`[DEV MODE] Resend OTP for ${email}: ${otp}`);
         userExists.name = name;
         userExists.password = password; // Will be hashed by pre-save
         userExists.otp = otp;
         userExists.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
         
          await userExists.save();

          // Check if SMTP is configured
          if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
             console.warn('⚠️ SMTP not configured. Auto-verifying existing user.');
             userExists.isVerified = true;
             userExists.otp = undefined;
             userExists.otpExpire = undefined;
             await userExists.save();
             
             res.status(200).json({
               message: 'Registration successful. Email verification skipped (SMTP not configured).',
               email: userExists.email,
               isVerified: true,
               token: generateToken(userExists._id)
             });
             return;
          }

          try {
            const sendEmailPromise = sendEmail({
              email: userExists.email,
              subject: 'AAZ Medical - Verify Your Email',
              message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
              html: `<h1>Email Verification</h1><p>Your verification code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`
            });
            
            const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error('Email sending timed out')), 10000)
            );
            
            await Promise.race([sendEmailPromise, timeoutPromise]);

            res.status(200).json({
              message: 'Verification email sent. Please verify your account.',
              email: userExists.email,
              isVerified: false,
              ...(process.env.NODE_ENV === 'development' && { otp })
            });
            return;
          } catch (err) {
            console.error('Email sending failed:', err.message);
            
            console.log('⚠️ Email failed in production (Resend). Auto-verifying to allow access.');
            userExists.isVerified = true;
            userExists.otp = undefined;
            userExists.otpExpire = undefined;
            await userExists.save();
            
            res.status(200).json({
              message: 'Registration successful. Email verification skipped due to server timeout.',
              email: userExists.email,
              isVerified: true,
              token: generateToken(userExists._id),
              warning: 'Email verification could not be completed.'
            });
            return;
          }
      }

      res.status(400);
      throw new Error('User already exists');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV MODE] Verification OTP for ${email}: ${otp}`);

    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpire: Date.now() + 10 * 60 * 1000,
      isVerified: false
    });

    if (user) {
       // Check if SMTP is configured
       if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL) {
         console.warn('⚠️ SMTP not configured. Auto-verifying user for signup success.');
         user.isVerified = true;
         user.otp = undefined;
         user.otpExpire = undefined;
         await user.save();
         
         res.status(201).json({
           message: 'Registration successful. Email verification skipped (SMTP not configured).',
           email: user.email,
           isVerified: true,
           token: generateToken(user._id)
         });
         return;
       }

       try {
         // Send email with 10s timeout to prevent hanging
         const sendEmailPromise = sendEmail({
           email: user.email,
           subject: 'AAZ Medical - Verify Your Email',
           message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
           html: `<h1>Email Verification</h1><p>Your verification code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`
         });
         
         const timeoutPromise = new Promise((_, reject) => 
           setTimeout(() => reject(new Error('Email sending timed out')), 10000)
         );
         
         await Promise.race([sendEmailPromise, timeoutPromise]);
         
         res.status(201).json({
           message: 'Verification email sent. Please verify your account.',
           email: user.email,
           isVerified: false,
           ...(process.env.NODE_ENV === 'development' && { otp })
         });
       } catch (err) {
         console.error('Email sending failed:', err.message);
         
         // In production, instead of failing, we will enable the user but warn them
         // This prevents "signup not working" if SMTP is down
         console.log('⚠️ Email failed in production. Auto-verifying to allow access.');
         user.isVerified = true;
         user.otp = undefined;
         user.otpExpire = undefined;
         await user.save();
         
         res.status(201).json({
           message: 'Registration successful. Email verification skipped due to server timeout.',
           email: user.email,
           isVerified: true,
           token: generateToken(user._id),
           warning: 'Email verification could not be completed.'
         });
       }
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
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(200).json({ message: 'Email already verified. Please login.' });
      return;
    }

    if (user.otp === otp && user.otpExpire > Date.now()) {
      user.isVerified = true;
      user.accountStatus = 'active';
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }
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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(401);
        throw new Error('Please verify your email address to login');
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
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
        isAdmin: !!req.admin
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide your email address');
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if email exists or not
      res.status(200).json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
      return;
    }

    // Check if user is verified
    if (!user.isVerified) {
      res.status(400);
      throw new Error('Please verify your email address first');
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Email template
    const message = `You are receiving this email because you (or someone else) has requested to reset your password.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 32px; background: #1976D2; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>AAZ International Enterprises</p>
          </div>
          <div class="content">
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in <strong>30 minutes</strong></li>
                <li>For security, this is a one-time use link</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            <p>If you're having trouble clicking the button, copy and paste the URL into your web browser.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from AAZ International Enterprises Pvt. Ltd.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'AAZ Medical - Password Reset Request',
        message,
        html: htmlMessage
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (err) {
      console.error('Email sending error:', err);
      
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error('Email could not be sent. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
      res.status(400);
      throw new Error('Please provide a new password');
    }

    // Password strength validation
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must include at least 1 uppercase letter, 1 number, and 1 special character');
    }

    // Hash token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token. Please request a new password reset.');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    const confirmationMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 12px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Reset Successful</h1>
            <p>AAZ International Enterprises</p>
          </div>
          <div class="content">
            <p>Hello <strong>${user.name}</strong>,</p>
            <div class="success-box">
              <strong>Your password has been successfully reset!</strong>
            </div>
            <p>You can now log in to your account using your new password.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p><strong>Security Reminder:</strong></p>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated email from AAZ International Enterprises Pvt. Ltd.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'AAZ Medical - Password Reset Successful',
        message: `Your password has been successfully reset. You can now login with your new password.`,
        html: confirmationMessage
      });
    } catch (err) {
      console.error('Confirmation email failed:', err);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  loginAdmin, 
  registerUser, 
  loginUser, 
  getMe, 
  verifyEmail,
  forgotPassword,
  resetPassword
};

