const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const { getTenantDB } = require('../config/tenantDB');

/**
 * Protect routes — verifies JWT and injects tenant DB models into req
 * JWT now carries: { id, hospitalCode }
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforhospitalmanagementsystem2026');

      const { id, hospitalCode } = decoded;

      // Look up hospital in master DB
      const hospital = await Hospital.findOne({ where: { code: hospitalCode, status: 'Active' } });
      if (!hospital) {
        return res.status(401).json({ success: false, message: 'Hospital not found or suspended' });
      }

      // Get tenant DB for this hospital
      const tenant = await getTenantDB(hospital.code, hospital.db_name);
      const { User, Role } = tenant.models;

      // Fetch user from hospital-specific DB
      const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      // Inject into request
      req.user        = user;
      req.hospital    = hospital;
      req.db          = tenant.sequelize;
      req.dbModels    = tenant.models;

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Grant access to specific roles
 */
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
