const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');

// Utility function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('client', 'service_provider').required(),
  bio: Joi.string().allow('', null),
  profileImage: Joi.string().allow('', null),
  skills: Joi.when('role', {
    is: 'service_provider',
    then: Joi.array().items(Joi.string()).min(1).required()
      .messages({ 'array.min': 'Service providers must specify at least one skill' }),
    otherwise: Joi.array().items(Joi.string()).optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  firstName: Joi.string(),
  lastName: Joi.string(),
  bio: Joi.string().allow('', null),
  profileImage: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string())
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'New passwords do not match' })
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ where: { email: value.email } });
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already registered'
      });
    }

    const existingUsername = await User.findOne({ where: { username: value.username } });
    if (existingUsername) {
      return res.status(400).json({
        status: 'error',
        message: 'Username is already taken'
      });
    }

    // Remove confirmPassword from user data (we don't store this)
    const { confirmPassword, ...userData } = value;

    // Create the user
    const user = await User.create(userData);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: value.email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(value.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by the verifyToken middleware
    const user = req.user;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PATCH /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Check if username is being updated and is already taken
    if (value.username && value.username !== req.user.username) {
      const existingUsername = await User.findOne({ where: { username: value.username } });
      if (existingUsername) {
        return res.status(400).json({
          status: 'error',
          message: 'Username is already taken'
        });
      }
    }

    // If updating skills and user is a service provider, ensure at least one skill
    if (req.user.role === 'service_provider' && 
        value.skills && Array.isArray(value.skills) && value.skills.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Service providers must specify at least one skill'
      });
    }

    // Update user
    await req.user.update(value);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Change user password
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(value.currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = value.newPassword;
    await req.user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword
};

