const { Medicine, MedicineStock } = require('../models');

// @desc    Get all medicines (with search, pagination, and stock status filters)
// @route   GET /api/inventory
// @access  Private (Admin/Pharmacist/Doctor)
const getMedicines = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', filter = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (filter === 'low-stock') {
      where.quantity = {
        [Medicine.sequelize.Sequelize.Op.lte]: Medicine.sequelize.col('min_stock_level')
      };
    } else if (filter === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      where.expiry_date = {
        [Medicine.sequelize.Sequelize.Op.lt]: today
      };
    }

    if (search) {
      where[Medicine.sequelize.Sequelize.Op.or] = [
        { name: { [Medicine.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { batch_number: { [Medicine.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Medicine.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      medicines: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new medicine (Initial Stock In)
// @route   POST /api/inventory
// @access  Private (Admin/Pharmacist)
const createMedicine = async (req, res, next) => {
  const transaction = await Medicine.sequelize.transaction();
  try {
    const { name, batch_number, quantity = 0, expiry_date, purchase_price, selling_price, min_stock_level = 10 } = req.body;

    const batchExists = await Medicine.findOne({ where: { batch_number } });
    if (batchExists) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Medicine with this batch number already exists' });
    }

    const medicine = await Medicine.create({
      name,
      batch_number,
      quantity,
      expiry_date,
      purchase_price,
      selling_price,
      min_stock_level
    }, { transaction });

    if (quantity > 0) {
      await MedicineStock.create({
        medicine_id: medicine.id,
        transaction_type: 'IN',
        quantity,
        notes: 'Initial stock load'
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ success: true, message: 'Medicine added to inventory successfully', medicine });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Update medicine details
// @route   PUT /api/inventory/:id
// @access  Private (Admin/Pharmacist)
const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const { name, expiry_date, purchase_price, selling_price, min_stock_level } = req.body;

    await medicine.update({
      name,
      expiry_date,
      purchase_price,
      selling_price,
      min_stock_level
    });

    res.status(200).json({ success: true, message: 'Medicine updated successfully', medicine });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Stock In / Stock Out (Restock or Manual adjustment)
// @route   POST /api/inventory/:id/stock
// @access  Private (Admin/Pharmacist)
const adjustStock = async (req, res, next) => {
  const transaction = await Medicine.sequelize.transaction();
  try {
    const medicine = await Medicine.findByPk(req.params.id, { transaction });
    if (!medicine) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const { transaction_type, quantity, notes } = req.body;

    if (!['IN', 'OUT'].includes(transaction_type)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Transaction type must be IN or OUT' });
    }

    if (!quantity || parseInt(quantity) <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    let newQty = medicine.quantity;
    if (transaction_type === 'IN') {
      newQty += parseInt(quantity);
    } else {
      if (medicine.quantity < parseInt(quantity)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Available: ${medicine.quantity}, requested deduction: ${quantity}`
        });
      }
      newQty -= parseInt(quantity);
    }

    await medicine.update({ quantity: newQty }, { transaction });

    const movement = await MedicineStock.create({
      medicine_id: medicine.id,
      transaction_type,
      quantity,
      notes: notes || `Manual stock adjustment (${transaction_type})`
    }, { transaction });

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: `Stock adjusted successfully. New balance: ${newQty}`,
      medicine,
      movement
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Get inventory stock movement history for a specific medicine
// @route   GET /api/inventory/:id/history
// @access  Private (Admin/Pharmacist)
const getStockHistory = async (req, res, next) => {
  try {
    const history = await MedicineStock.findAll({
      where: { medicine_id: req.params.id },
      order: [['id', 'DESC']]
    });
    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  createMedicine,
  updateMedicine,
  adjustStock,
  getStockHistory
};
