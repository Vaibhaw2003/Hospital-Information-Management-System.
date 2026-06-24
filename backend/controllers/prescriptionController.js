const { Prescription, PrescriptionItem, Medicine, MedicineStock, Patient, Doctor, OpdRegistration, Billing } = require('../models');

// @desc    Get all prescriptions (with pagination & search)
// @route   GET /api/prescriptions
// @access  Private (Admin/Doctor/Pharmacist/Receptionist)
const getPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    if (req.user.role.name === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
      if (doctorProfile) {
        where.doctor_id = doctorProfile.id;
      }
    }

    const patientWhere = {};
    if (search) {
      patientWhere[Patient.sequelize.Sequelize.Op.or] = [
        { name: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { phone: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Prescription.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { 
          model: Patient, 
          as: 'patient', 
          where: Object.keys(patientWhere).length > 0 ? patientWhere : null, 
          attributes: ['id', 'patient_id', 'name', 'age', 'gender', 'phone'] 
        },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
        { model: OpdRegistration, as: 'opdRegistration', attributes: ['id', 'opd_number'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      prescriptions: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialty', 'registration_number'] },
        { model: OpdRegistration, as: 'opdRegistration', attributes: ['id', 'opd_number', 'registration_date', 'diagnosis'] },
        {
          model: PrescriptionItem,
          as: 'items',
          include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'batch_number', 'selling_price'] }]
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescription by OPD Registration ID
// @route   GET /api/prescriptions/opd/:opd_registration_id
// @access  Private
const getPrescriptionByOpdId = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      where: { opd_registration_id: req.params.opd_registration_id },
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialty', 'registration_number'] },
        {
          model: PrescriptionItem,
          as: 'items',
          include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'batch_number', 'selling_price'] }]
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'No prescription found for this OPD registration' });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Create prescription (with multiple items)
// @route   POST /api/prescriptions
// @access  Private (Doctor/Admin)
const createPrescription = async (req, res, next) => {
  try {
    const { opd_registration_id, patient_id, notes, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Prescription must contain at least one medicine' });
    }

    let doctor_id;
    if (req.user.role.name === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
      if (!doctorProfile) {
        return res.status(403).json({ success: false, message: 'Doctor profile not found for logged in user' });
      }
      doctor_id = doctorProfile.id;
    } else {
      if (!req.body.doctor_id) {
        return res.status(400).json({ success: false, message: 'Please specify doctor_id' });
      }
      doctor_id = req.body.doctor_id;
    }

    const opd = await OpdRegistration.findByPk(opd_registration_id);
    if (!opd) {
      return res.status(404).json({ success: false, message: 'OPD registration record not found' });
    }

    const prescription = await Prescription.create({
      opd_registration_id,
      doctor_id,
      patient_id,
      notes,
      status: 'Pending'
    });

    const prescriptionItemsData = items.map((item) => ({
      prescription_id: prescription.id,
      medicine_id: item.medicine_id,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity || 10
    }));

    await PrescriptionItem.bulkCreate(prescriptionItemsData);

    res.status(201).json({
      success: true,
      message: 'Prescription generated successfully',
      prescription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispense prescription (Pharmacist only - deducts inventory and updates billing)
// @route   POST /api/prescriptions/:id/dispense
// @access  Private (Pharmacist/Admin)
const dispensePrescription = async (req, res, next) => {
  const transaction = await Prescription.sequelize.transaction();
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        {
          model: PrescriptionItem,
          as: 'items',
          include: [{ model: Medicine, as: 'medicine' }]
        }
      ]
    });

    if (!prescription) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.status === 'Dispensed') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Prescription is already dispensed' });
    }

    for (const item of prescription.items) {
      const medicine = item.medicine;
      if (!medicine) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Medicine not found in system database` });
      }

      if (medicine.quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Required: ${item.quantity}`
        });
      }
    }

    let medicineChargesSum = 0;

    for (const item of prescription.items) {
      const medicine = item.medicine;
      
      const newQty = medicine.quantity - item.quantity;
      await medicine.update({ quantity: newQty }, { transaction });

      await MedicineStock.create({
        medicine_id: medicine.id,
        transaction_type: 'OUT',
        quantity: item.quantity,
        notes: `Dispensed for Rx#${prescription.id} (OPD Ref: ${prescription.opd_registration_id})`
      }, { transaction });

      medicineChargesSum += parseFloat(medicine.selling_price) * item.quantity;
    }

    await prescription.update({ status: 'Dispensed' }, { transaction });

    const billing = await Billing.findOne({
      where: { opd_registration_id: prescription.opd_registration_id }
    });

    if (billing) {
      const subtotal = parseFloat(billing.consultation_fee) + parseFloat(billing.lab_charges) + medicineChargesSum;
      const discount = parseFloat(billing.discount);
      const tax = parseFloat(((subtotal - discount) * 0.05).toFixed(2));
      const total = parseFloat((subtotal - discount + tax).toFixed(2));

      await billing.update({
        medicine_charges: medicineChargesSum,
        tax: tax,
        total_amount: total
      }, { transaction });
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: 'Prescription dispensed. Inventory updated, charges added to invoice successfully.'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  getPrescriptionByOpdId,
  createPrescription,
  dispensePrescription
};
