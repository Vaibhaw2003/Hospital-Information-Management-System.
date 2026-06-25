const express = require('express');
const { getPrescriptions, getPrescriptionById, createPrescription, dispensePrescription } = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.post('/', protect, authorize('Admin', 'Doctor'), createPrescription);
router.post('/:id/dispense', protect, authorize('Admin', 'Pharmacist'), dispensePrescription);

module.exports = router;
