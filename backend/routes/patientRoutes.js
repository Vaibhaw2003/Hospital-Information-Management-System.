const express = require('express');
const { getPatients, getPatientById, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getPatients);
router.get('/:id', protect, getPatientById);
router.post('/', protect, authorize('Admin', 'Receptionist'), createPatient);
router.put('/:id', protect, authorize('Admin', 'Receptionist'), updatePatient);
router.delete('/:id', protect, authorize('Admin'), deletePatient);

module.exports = router;
