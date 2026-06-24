const express = require('express');
const { getDoctors, getDepartments, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getDoctors);
router.get('/departments', protect, getDepartments);
router.post('/', protect, authorize('Admin'), createDoctor);
router.put('/:id', protect, authorize('Admin', 'Doctor'), updateDoctor);
router.delete('/:id', protect, authorize('Admin'), deleteDoctor);

module.exports = router;
