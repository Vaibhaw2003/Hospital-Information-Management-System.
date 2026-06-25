const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const { getTenantDB } = require('../config/tenantDB');
const { Op } = require('sequelize');

/**
 * @desc  Login user (with hospital code)
 * @route POST /api/auth/login
 * @body  { hospitalCode, usernameOrEmail, password }
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { hospitalCode, usernameOrEmail, password } = req.body;

    if (!hospitalCode || !usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide hospital code, username/email, and password' });
    }

    // Find hospital in master DB
    const hospital = await Hospital.findOne({ where: { code: hospitalCode.toUpperCase(), status: 'Active' } });
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found. Please check the hospital code.' });
    }

    // Connect to hospital-specific DB
    const tenant = await getTenantDB(hospital.code, hospital.db_name);
    const { User, Role } = tenant.models;

    // Find user in hospital DB
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact your hospital admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // JWT now carries both userId and hospitalCode
    const token = jwt.sign(
      { id: user.id, hospitalCode: hospital.code },
      process.env.JWT_SECRET || 'supersecretkeyforhospitalmanagementsystem2026',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        profile_pic: user.profile_pic
      },
      hospital: {
        id: hospital.id,
        name: hospital.name,
        code: hospital.code,
        city: hospital.city,
        logo_url: hospital.logo_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc  Change password
 * @route POST /api/auth/change-password
 * @access Private (tenant-aware via req.dbModels)
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please enter old and new passwords' });
    }

    const { User } = req.dbModels;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Forgot password (mock reset)
 * @route POST /api/auth/forgot-password
 * @body  { hospitalCode, email }
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { hospitalCode, email } = req.body;

    if (!hospitalCode || !email) {
      return res.status(400).json({ success: false, message: 'Please enter hospital code and email' });
    }

    const hospital = await Hospital.findOne({ where: { code: hospitalCode.toUpperCase(), status: 'Active' } });
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const tenant = await getTenantDB(hospital.code, hospital.db_name);
    const { User } = tenant.models;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('Reset123', salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset to "Reset123". Please login and change it immediately.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get current user details
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    const { User, Role } = req.dbModels;
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        profile_pic: user.profile_pic
      },
      hospital: {
        id: req.hospital.id,
        name: req.hospital.name,
        code: req.hospital.code,
        city: req.hospital.city
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, changePassword, forgotPassword, getMe };
