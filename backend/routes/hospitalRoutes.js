const express = require('express');
const router = express.Router();
const { registerHospital, getHospitals, getHospitalByCode } = require('../controllers/hospitalController');

// Public routes
router.post('/register', registerHospital);
router.get('/', getHospitals);
router.get('/:code', getHospitalByCode);

module.exports = router;
