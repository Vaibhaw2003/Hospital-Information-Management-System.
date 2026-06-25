const { Op } = require('sequelize');

const getMedicines = async (req, res, next) => {
  try {
    const { Medicine } = req.dbModels;
    const { page = 1, limit = 10, search = '', filter = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'Active' };

    if (filter === 'expired') {
      const today = new Date().toISOString().split('T')[0];
      where.expiry_date = { [Op.lt]: today };
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { batch_number: { [Op.like]: `%${search}%` } },
        { generic_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Medicine.findAndCountAll({
      where, limit: parseInt(limit), offset, order: [['id', 'DESC']]
    });

    // For low-stock filter, do in-memory (quantity <= min_stock_level)
    let medicines = rows;
    if (filter === 'low-stock') {
      medicines = rows.filter(m => m.quantity <= m.min_stock_level);
    }

    res.status(200).json({
      success: true, count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      medicines
    });
  } catch (error) { next(error); }
};

const createMedicine = async (req, res, next) => {
  const { Medicine, MedicineStock } = req.dbModels;
  const db = req.db;
  const t = await db.transaction();
  try {
    const { name, generic_name, category, unit, price, quantity = 0, min_stock_level = 10, batch_number, expiry_date, manufacturer } = req.body;

    const medicine = await Medicine.create({ name, generic_name, category, unit, price, quantity, min_stock_level, batch_number, expiry_date, manufacturer, status: 'Active' }, { transaction: t });

    if (quantity > 0) {
      await MedicineStock.create({ medicine_id: medicine.id, type: 'IN', quantity, reason: 'Initial stock', performed_by: req.user.id }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, message: 'Medicine added to inventory', medicine });
  } catch (error) { await t.rollback(); next(error); }
};

const updateMedicine = async (req, res, next) => {
  try {
    const { Medicine } = req.dbModels;
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const { name, generic_name, category, unit, price, min_stock_level, expiry_date, manufacturer } = req.body;
    await medicine.update({ name, generic_name, category, unit, price, min_stock_level, expiry_date, manufacturer });
    res.status(200).json({ success: true, message: 'Medicine updated', medicine });
  } catch (error) { next(error); }
};

const adjustStock = async (req, res, next) => {
  const { Medicine, MedicineStock } = req.dbModels;
  const db = req.db;
  const t = await db.transaction();
  try {
    const medicine = await Medicine.findByPk(req.params.id, { transaction: t });
    if (!medicine) { await t.rollback(); return res.status(404).json({ success: false, message: 'Medicine not found' }); }

    const { type, quantity, reason } = req.body;
    if (!['IN', 'OUT'].includes(type)) { await t.rollback(); return res.status(400).json({ success: false, message: 'type must be IN or OUT' }); }

    let newQty = medicine.quantity;
    if (type === 'IN') {
      newQty += parseInt(quantity);
    } else {
      if (medicine.quantity < parseInt(quantity)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${medicine.quantity}` });
      }
      newQty -= parseInt(quantity);
    }

    await medicine.update({ quantity: newQty }, { transaction: t });
    const movement = await MedicineStock.create({ medicine_id: medicine.id, type, quantity: parseInt(quantity), reason: reason || `Manual ${type}`, performed_by: req.user.id }, { transaction: t });

    await t.commit();
    res.status(200).json({ success: true, message: `Stock updated. New balance: ${newQty}`, medicine, movement });
  } catch (error) { await t.rollback(); next(error); }
};

const getStockHistory = async (req, res, next) => {
  try {
    const { MedicineStock } = req.dbModels;
    const history = await MedicineStock.findAll({ where: { medicine_id: req.params.id }, order: [['id', 'DESC']] });
    res.status(200).json({ success: true, history });
  } catch (error) { next(error); }
};

module.exports = { getMedicines, createMedicine, updateMedicine, adjustStock, getStockHistory };
