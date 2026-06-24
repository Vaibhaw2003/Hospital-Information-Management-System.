const express = require('express');
const { getPrescriptions, getPrescriptionById, getPrescriptionByOpdId, createPrescription, dispensePrescription } = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);
router.get('/opd/:opd_registration_id', protect, getPrescriptionByOpdId);
router.post('/', protect, authorize('Admin', 'Doctor'), createPrescription);
router.post('/:id/dispense', protect, authorize('Admin', 'Pharmacist'), dispensePrescription);

module.exports = router;
