const { Op } = require('sequelize');

const getPrescriptions = async (req, res, next) => {
  try {
    const { Prescription, PrescriptionItem, Medicine, Patient, Doctor, OpdRegistration } = req.dbModels;
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    if (req.user.role.name === 'Doctor') {
      const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
      if (doctorProfile) where.doctor_id = doctorProfile.id;
    }

    const patientWhere = {};
    if (search) {
      patientWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Prescription.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { model: Patient, as: 'patient', where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined, attributes: ['id', 'patient_id', 'name', 'phone'], required: Object.keys(patientWhere).length > 0 },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
        { model: OpdRegistration, as: 'opdRegistration', attributes: ['id', 'token_number', 'visit_date'] },
        { model: PrescriptionItem, as: 'items', include: [{ model: Medicine, as: 'medicine', attributes: ['id', 'name', 'unit'] }] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / parseInt(limit)), currentPage: parseInt(page), prescriptions: rows });
  } catch (error) { next(error); }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const { Prescription, PrescriptionItem, Medicine, Patient, Doctor, OpdRegistration } = req.dbModels;
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor' },
        { model: OpdRegistration, as: 'opdRegistration' },
        { model: PrescriptionItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] }
      ]
    });
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.status(200).json({ success: true, prescription });
  } catch (error) { next(error); }
};

const createPrescription = async (req, res, next) => {
  const t = await req.db.transaction();
  try {
    const { Prescription, PrescriptionItem, Doctor, OpdRegistration } = req.dbModels;
    const { opd_registration_id, patient_id, diagnosis, notes, items = [] } = req.body;

    const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id }, transaction: t });
    if (!doctorProfile) { await t.rollback(); return res.status(403).json({ success: false, message: 'Only doctors can create prescriptions' }); }

    const existing = await Prescription.findOne({ where: { opd_registration_id }, transaction: t });
    if (existing) { await t.rollback(); return res.status(400).json({ success: false, message: 'Prescription already exists for this OPD visit' }); }

    const prescription = await Prescription.create({
      opd_registration_id, patient_id,
      doctor_id: doctorProfile.id,
      diagnosis, notes, status: 'Pending'
    }, { transaction: t });

    for (const item of items) {
      await PrescriptionItem.create({
        prescription_id: prescription.id,
        medicine_id: item.medicine_id,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity || 1,
        instructions: item.instructions
      }, { transaction: t });
    }

    await OpdRegistration.update({ status: 'Completed' }, { where: { id: opd_registration_id }, transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Prescription created', prescription });
  } catch (error) { await t.rollback(); next(error); }
};

const dispensePrescription = async (req, res, next) => {
  const t = await req.db.transaction();
  try {
    const { Prescription, PrescriptionItem, Medicine, MedicineStock, Billing } = req.dbModels;

    const prescription = await Prescription.findByPk(req.params.id, {
      include: [{ model: PrescriptionItem, as: 'items', include: [{ model: Medicine, as: 'medicine' }] }],
      transaction: t
    });

    if (!prescription) { await t.rollback(); return res.status(404).json({ success: false, message: 'Prescription not found' }); }
    if (prescription.status === 'Dispensed') { await t.rollback(); return res.status(400).json({ success: false, message: 'Already dispensed' }); }

    let medicineCharges = 0;

    for (const item of prescription.items) {
      const medicine = item.medicine;
      if (!medicine) continue;

      const needed = item.quantity;
      if (medicine.quantity < needed) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}` });
      }

      await medicine.update({ quantity: medicine.quantity - needed }, { transaction: t });
      await MedicineStock.create({ medicine_id: medicine.id, type: 'OUT', quantity: needed, reason: `Dispensed: Prescription #${prescription.id}`, performed_by: req.user.id, reference_id: prescription.id }, { transaction: t });

      medicineCharges += parseFloat(medicine.price || 0) * needed;
    }

    await prescription.update({ status: 'Dispensed' }, { transaction: t });

    // Update billing medicine charges
    const billing = await Billing.findOne({ where: { opd_registration_id: prescription.opd_registration_id }, transaction: t });
    if (billing) {
      const newMedCharges = parseFloat(billing.medicine_charges) + medicineCharges;
      const newTotal = parseFloat(billing.consultation_fee) + newMedCharges + parseFloat(billing.lab_charges) + parseFloat(billing.other_charges) - parseFloat(billing.discount);
      await billing.update({ medicine_charges: newMedCharges, total_amount: Math.max(0, newTotal) }, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ success: true, message: 'Prescription dispensed and stock updated' });
  } catch (error) { await t.rollback(); next(error); }
};

module.exports = { getPrescriptions, getPrescriptionById, createPrescription, dispensePrescription };
