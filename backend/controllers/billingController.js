const { Billing, Payment, Patient, OpdRegistration, Doctor } = require('../models');

// @desc    Get all bills (with search, filter, pagination)
// @route   GET /api/billing
// @access  Private (Admin/Receptionist/Doctor)
const getBillings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', paymentStatus } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (paymentStatus) {
      where.payment_status = paymentStatus;
    }

    const patientWhere = {};
    if (search) {
      patientWhere[Patient.sequelize.Sequelize.Op.or] = [
        { name: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { phone: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Billing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { 
          model: Patient, 
          as: 'patient', 
          where: Object.keys(patientWhere).length > 0 ? patientWhere : null, 
          attributes: ['id', 'patient_id', 'name', 'phone'] 
        },
        { model: OpdRegistration, as: 'opdRegistration', attributes: ['id', 'opd_number'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      billings: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bill details with payment logs
// @route   GET /api/billing/:id
// @access  Private
const getBillingById = async (req, res, next) => {
  try {
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { 
          model: OpdRegistration, 
          as: 'opdRegistration', 
          include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name'] }] 
        },
        { model: Payment, as: 'payments' }
      ]
    });

    if (!billing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, billing });
  } catch (error) {
    next(error);
  }
};

// @desc    Update billing charges (add lab charges, discount, etc.)
// @route   PUT /api/billing/:id
// @access  Private (Admin/Receptionist)
const updateBillingCharges = async (req, res, next) => {
  try {
    const billing = await Billing.findByPk(req.params.id);
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (billing.payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot edit charges for an already paid invoice' });
    }

    const { lab_charges, discount } = req.body;

    const finalLab = lab_charges !== undefined ? parseFloat(lab_charges) : parseFloat(billing.lab_charges);
    const finalDiscount = discount !== undefined ? parseFloat(discount) : parseFloat(billing.discount);

    const subtotal = parseFloat(billing.consultation_fee) + finalLab + parseFloat(billing.medicine_charges);
    const tax = parseFloat(((subtotal - finalDiscount) * 0.05).toFixed(2));
    const total = parseFloat((subtotal - finalDiscount + tax).toFixed(2));

    await billing.update({
      lab_charges: finalLab,
      discount: finalDiscount,
      tax,
      total_amount: total
    });

    res.status(200).json({ success: true, message: 'Charges updated successfully', billing });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a payment to a bill
// @route   POST /api/billing/:id/payments
// @access  Private (Admin/Receptionist)
const collectPayment = async (req, res, next) => {
  const transaction = await Billing.sequelize.transaction();
  try {
    const billing = await Billing.findByPk(req.params.id, {
      include: [{ model: Payment, as: 'payments' }],
      transaction
    });

    if (!billing) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (billing.payment_status === 'Paid') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
    }

    const { amount_paid, payment_mode = 'Cash', transaction_reference } = req.body;

    if (!amount_paid || parseFloat(amount_paid) <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
    }

    const currentPaidSum = billing.payments.reduce((acc, pay) => acc + parseFloat(pay.amount_paid), 0);
    const remainingBalance = parseFloat((parseFloat(billing.total_amount) - currentPaidSum).toFixed(2));

    if (parseFloat(amount_paid) > remainingBalance) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount_paid}) exceeds remaining balance (${remainingBalance})`
      });
    }

    await Payment.create({
      billing_id: billing.id,
      amount_paid: parseFloat(amount_paid),
      payment_mode,
      transaction_reference
    }, { transaction });

    const newPaidSum = parseFloat((currentPaidSum + parseFloat(amount_paid)).toFixed(2));
    let status = 'PartiallyPaid';
    if (newPaidSum >= parseFloat(billing.total_amount)) {
      status = 'Paid';
    }

    await billing.update({ payment_status: status }, { transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Payment collected successfully', billing });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getBillings,
  getBillingById,
  updateBillingCharges,
  collectPayment
};
