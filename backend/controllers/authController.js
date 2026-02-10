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
    const { name, email, password, securityQuestion, securityAnswer } = req.body;

    if (!securityQuestion || !securityAnswer) {
      res.status(400);
      throw new Error('Please provide both a security question and an answer');
    }

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
      securityQuestion,
      securityAnswer,
      isVerified: false,
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      emailVerificationExpire: verificationExpire,
      accountStatus: 'active'
    });

    if (user) {
       // Attempt to send email but don't block registration
       try {
         const verificationUrl = `${process.env.FRONTEND_URL || 'https://aaz-international.vercel.app'}/verify-email/${verificationToken}`;
         
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
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://aaz-international.vercel.app'}/verify-email/${verificationToken}`;
      
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
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
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

// @desc    Get user's security question
// @route   POST /api/auth/forgot-password/question
// @access  Public
const getSecurityQuestion = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const searchEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: searchEmail });

    if (!user) {
      console.warn(`🔍 Security Question lookup failed. User not found: ${searchEmail}`);
      res.status(404);
      throw new Error('Invalid request'); // Generic for security
    }

    res.status(200).json({
      question: user.securityQuestion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify security answer
// @route   POST /api/auth/forgot-password/verify-answer
// @access  Public
const verifySecurityAnswer = async (req, res, next) => {
  try {
    const { email, answer } = req.body;
    const searchEmail = email.toLowerCase().trim();
    const normalizedAnswer = answer.trim().toLowerCase(); // Normalize to match registration
    const user = await User.findOne({ email: searchEmail });

    if (!user) {
      console.warn(`🔍 Security answer verification: User not found: ${searchEmail}`);
      res.status(401);
      throw new Error('Invalid answer');
    }

    // Check if user has a security question set
    if (!user.securityQuestion || !user.securityAnswer) {
      console.warn(`⚠️ User ${searchEmail} does not have security questions set up`);
      res.status(400);
      throw new Error('This account was created before security questions were implemented. Please contact support to reset your password.');
    }

    const isMatch = await user.matchSecurityAnswer(normalizedAnswer);
    
    if (!isMatch) {
      console.warn(`🔒 Security answer verification failed for: ${searchEmail}`);
      res.status(401);
      throw new Error('Invalid answer');
    }

    // Generate a temporary reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    res.status(200).json({
      message: 'Answer verified',
      resetToken: resetToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using security question token
// @route   POST /api/auth/forgot-password/reset
// @access  Public
const resetPasswordWithSecurity = async (req, res, next) => {
  try {
    const { resetToken, password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long and include 1 uppercase letter, 1 number, and 1 special character.');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
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

module.exports = { 
  loginAdmin, 
  registerUser, 
  loginUser, 
  getMe, 
  verifyEmail,
  resendVerificationEmail,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPasswordWithSecurity
};

