const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password' });
    }

    const user = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
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
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
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
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please enter old and new passwords' });
    }

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

// @desc    Forgot password (Mock Reset)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('Reset123', salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to registered email. For testing purposes, your password has been reset to "Reset123"!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, changePassword, forgotPassword, getMe };
