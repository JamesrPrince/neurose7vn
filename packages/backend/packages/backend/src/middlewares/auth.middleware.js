const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. No token provided.'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. No token provided.'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user by ID
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please log in again.'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has a specific role
 * @param {string|string[]} roles - Required role(s) to access the resource
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    // verifyToken middleware should be called before this
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }
    
    // Convert single role to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource.'
      });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
};

