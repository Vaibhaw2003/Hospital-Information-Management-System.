const express = require('express');
const { getMedicines, createMedicine, updateMedicine, adjustStock, getStockHistory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMedicines);
router.post('/', protect, authorize('Admin', 'Pharmacist'), createMedicine);
router.put('/:id', protect, authorize('Admin', 'Pharmacist'), updateMedicine);
router.post('/:id/stock', protect, authorize('Admin', 'Pharmacist'), adjustStock);
router.get('/:id/history', protect, authorize('Admin', 'Pharmacist'), getStockHistory);

module.exports = router;
