const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// Protect routes - JWT verification
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforhospitalmanagementsystem2026');

      // Get user from the token (excluding password)
      req.user = await User.findByPk(decoded.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (req.user.status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied: role not verified' });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role.name}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
