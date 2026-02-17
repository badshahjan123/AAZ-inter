const validator = require('validator');

/**
 * INPUT VALIDATION & SANITIZATION MIDDLEWARE
 * Defense against injection attacks, XSS, and malicious input
 */

/**
 * Validate and sanitize registration input
 */
const validateRegistration = (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string') {
      errors.push('Full Name is required');
    } else {
      const trimmedName = name.trim();
      // Only allow letters, spaces, and dots/hyphens (Professional medical names)
      // Must start with a letter and be 2-60 characters
      const nameRegex = /^[a-zA-Z][a-zA-Z\s.\-']{1,59}$/;
      
      if (trimmedName.length < 3) {
        errors.push('Name is too short (min 3 characters)');
      } else if (!nameRegex.test(trimmedName)) {
        errors.push('Name must start with a letter and contain only letters, spaces, dots, or hyphens');
      } else if (/^[.\-\s]+$/.test(trimmedName)) {
        errors.push('Name cannot consist only of special characters');
      }
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      errors.push('Valid work email is required');
    } else if (!validator.isEmail(email)) {
      errors.push('Please enter a professional email format');
    } else if (email.length > 80) {
      errors.push('Email is too long');
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      errors.push('Security password is required');
    } else {
      // Modern Strict Requirements: Min 8 chars
      if (password.length < 8) {
        errors.push('Security password must be at least 8 characters long');
      }
      
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        errors.push('Password must include Uppercase, Lowercase, Number and Special Character');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0], // Primary message for UI
        error: 'Validation failed',
        details: errors
      });
    }

    // Sanitize inputs
    req.body.name = validator.escape(name.trim());
    req.body.email = validator.normalizeEmail(email.toLowerCase().trim());
    
    // Only allow these specific fields (prevent mass assignment)
    req.body = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    next();
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: 'Invalid request data',
      error: 'Invalid request data' 
    });
  }
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 6 || password.length > 100) {
      errors.push('Invalid password length');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Sanitize
    req.body.email = validator.normalizeEmail(email.toLowerCase().trim());
    
    // Only allow specific fields
    req.body = {
      email: req.body.email,
      password: req.body.password
    };

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // Check if it matches MongoDB ObjectId pattern (simple validation)
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({ 
        error: 'Invalid ID format' 
      });
    }
    
    next();
  };
};

/**
 * Validate product creation/update
 */
const validateProduct = (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;
    const errors = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 200) {
        errors.push('Product name must be between 3 and 200 characters');
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length > 2000) {
        errors.push('Description too long (max 2000 characters)');
      }
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0 || numPrice > 1000000) {
        errors.push('Invalid price (must be between 0 and 1,000,000)');
      }
    }

    if (category !== undefined) {
      const objectIdRegex = /^[a-fA-F0-9]{24}$/;
      if (!objectIdRegex.test(category)) {
        errors.push('Invalid category ID');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Sanitize strings
    if (name) req.body.name = validator.escape(name.trim());
    if (description) req.body.description = validator.escape(description.trim());

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
};

/**
 * Sanitize query parameters (prevent NoSQL injection)
 */
const sanitizeQuery = (req, res, next) => {
  try {
    // Remove any MongoDB operators from query params
    const cleanQuery = {};
    
    for (const key in req.query) {
      // Only allow alphanumeric keys (simple validation)
      const keyRegex = /^[a-zA-Z0-9_]+$/;
      if (keyRegex.test(key)) {
        const value = req.query[key];
        
        // Only allow primitive types
        if (typeof value === 'string' || typeof value === 'number') {
          // Escape string values
          cleanQuery[key] = typeof value === 'string' 
            ? validator.escape(value.toString())
            : value;
        }
      }
    }
    
    req.query = cleanQuery;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid query parameters' });
  }
};

/**
 * Prevent mass assignment attacks
 * Only allow specified fields
 */
const allowOnly = (allowedFields) => {
  return (req, res, next) => {
    const filtered = {};
    
    allowedFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        filtered[field] = req.body[field];
      }
    });
    
    req.body = filtered;
    next();
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateObjectId,
  validateProduct,
  sanitizeQuery,
  allowOnly
};
