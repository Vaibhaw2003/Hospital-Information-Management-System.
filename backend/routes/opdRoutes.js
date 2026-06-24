const express = require('express');
const { getOpdRegistrations, getOpdById, createOpdRegistration, updateOpdRegistration } = require('../controllers/opdController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getOpdRegistrations);
router.get('/:id', protect, getOpdById);
router.post('/', protect, authorize('Admin', 'Receptionist'), createOpdRegistration);
router.put('/:id', protect, authorize('Admin', 'Doctor', 'Receptionist'), updateOpdRegistration);

module.exports = router;
