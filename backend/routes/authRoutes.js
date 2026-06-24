const express = require('express');
const { login, changePassword, forgotPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;
