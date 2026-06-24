const express = require('express');
const { getBillings, getBillingById, updateBillingCharges, collectPayment } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getBillings);
router.get('/:id', protect, getBillingById);
router.put('/:id', protect, authorize('Admin', 'Receptionist'), updateBillingCharges);
router.post('/:id/payments', protect, authorize('Admin', 'Receptionist'), collectPayment);

module.exports = router;
