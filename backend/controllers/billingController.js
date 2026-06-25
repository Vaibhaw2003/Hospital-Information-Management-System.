const { Op } = require('sequelize');

const getBillings = async (req, res, next) => {
  try {
    const { Billing, Payment, Patient, OpdRegistration } = req.dbModels;
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const patientWhere = {};
    if (search) {
      patientWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Billing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { model: Patient, as: 'patient', where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined, attributes: ['id', 'patient_id', 'name', 'phone'], required: Object.keys(patientWhere).length > 0 },
        { model: OpdRegistration, as: 'opdRegistration', attributes: ['id', 'token_number', 'visit_date'] },
        { model: Payment, as: 'payments', attributes: ['id', 'amount', 'payment_method'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / parseInt(limit)), currentPage: parseInt(page), billings: rows });
  } catch (error) { next(error); }
};

const getBillingById = async (req, res, next) => {
  try {
    const { Billing, Payment, Patient, OpdRegistration, Doctor } = req.dbModels;
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: OpdRegistration, as: 'opdRegistration', include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }] },
        { model: Payment, as: 'payments' }
      ]
    });
    if (!billing) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, billing });
  } catch (error) { next(error); }
};

const updateBillingCharges = async (req, res, next) => {
  try {
    const { Billing } = req.dbModels;
    const billing = await Billing.findByPk(req.params.id);
    if (!billing) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (billing.status === 'Paid') return res.status(400).json({ success: false, message: 'Cannot edit a paid invoice' });

    const { lab_charges, other_charges, discount, notes } = req.body;
    const finalLab = lab_charges !== undefined ? parseFloat(lab_charges) : parseFloat(billing.lab_charges);
    const finalOther = other_charges !== undefined ? parseFloat(other_charges) : parseFloat(billing.other_charges);
    const finalDiscount = discount !== undefined ? parseFloat(discount) : parseFloat(billing.discount);

    const total = parseFloat(billing.consultation_fee) + parseFloat(billing.medicine_charges) + finalLab + finalOther - finalDiscount;

    await billing.update({ lab_charges: finalLab, other_charges: finalOther, discount: finalDiscount, total_amount: Math.max(0, total), notes: notes ?? billing.notes });
    res.status(200).json({ success: true, message: 'Charges updated', billing });
  } catch (error) { next(error); }
};

const collectPayment = async (req, res, next) => {
  const { Billing, Payment } = req.dbModels;
  const t = await req.db.transaction();
  try {
    const billing = await Billing.findByPk(req.params.id, {
      include: [{ model: Payment, as: 'payments' }],
      transaction: t
    });
    if (!billing) { await t.rollback(); return res.status(404).json({ success: false, message: 'Invoice not found' }); }
    if (billing.status === 'Paid') { await t.rollback(); return res.status(400).json({ success: false, message: 'Already fully paid' }); }

    const { amount, payment_method = 'Cash', transaction_id, notes } = req.body;
    if (!amount || parseFloat(amount) <= 0) { await t.rollback(); return res.status(400).json({ success: false, message: 'Valid amount required' }); }

    const paidSoFar = billing.payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const remaining = parseFloat(billing.total_amount) - paidSoFar;

    if (parseFloat(amount) > remaining + 0.01) { await t.rollback(); return res.status(400).json({ success: false, message: `Amount exceeds remaining balance (₹${remaining.toFixed(2)})` }); }

    await Payment.create({ billing_id: billing.id, amount: parseFloat(amount), payment_method, transaction_id, notes }, { transaction: t });

    const newPaid = paidSoFar + parseFloat(amount);
    const newStatus = newPaid >= parseFloat(billing.total_amount) - 0.01 ? 'Paid' : 'Partial';
    await billing.update({ paid_amount: newPaid, status: newStatus }, { transaction: t });

    await t.commit();
    res.status(200).json({ success: true, message: 'Payment recorded successfully' });
  } catch (error) { await t.rollback(); next(error); }
};

module.exports = { getBillings, getBillingById, updateBillingCharges, collectPayment };
