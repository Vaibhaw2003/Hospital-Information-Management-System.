const { Op } = require('sequelize');

const getOpdRegistrations = async (req, res, next) => {
  try {
    const { OpdRegistration, Patient, Doctor, Department, Billing } = req.dbModels;
    const { page = 1, limit = 10, search = '', doctorId, departmentId, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (doctorId) where.doctor_id = doctorId;
    if (departmentId) where.department_id = departmentId;

    const patientWhere = {};
    if (search) {
      patientWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await OpdRegistration.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { model: Patient, as: 'patient', where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined, attributes: ['id', 'patient_id', 'name', 'gender', 'phone'], required: Object.keys(patientWhere).length > 0 },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'consultation_fee'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({ success: true, count, totalPages: Math.ceil(count / parseInt(limit)), currentPage: parseInt(page), opdRegistrations: rows });
  } catch (error) { next(error); }
};

const getOpdById = async (req, res, next) => {
  try {
    const { OpdRegistration, Patient, Doctor, Department, Billing } = req.dbModels;
    const opd = await OpdRegistration.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor', include: [{ model: Department, as: 'department' }] },
        { model: Department, as: 'department' },
        { model: Billing, as: 'billing' }
      ]
    });
    if (!opd) return res.status(404).json({ success: false, message: 'OPD record not found' });
    res.status(200).json({ success: true, opd });
  } catch (error) { next(error); }
};

const createOpdRegistration = async (req, res, next) => {
  try {
    const { OpdRegistration, Doctor, Billing } = req.dbModels;
    const { patient_id, department_id, doctor_id, chief_complaint, notes, consultation_fee } = req.body;

    const doctor = await Doctor.findByPk(doctor_id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const finalFee = consultation_fee !== undefined ? parseFloat(consultation_fee) : parseFloat(doctor.consultation_fee || 0);
    const today = new Date().toISOString().split('T')[0];

    const todayCount = await OpdRegistration.count({ where: { doctor_id, visit_date: today } });
    const token_number = todayCount + 1;

    const opd = await OpdRegistration.create({ patient_id, department_id, doctor_id, token_number, visit_date: today, chief_complaint, notes, status: 'Active' });

    const invoiceNumber = 'INV' + Date.now().toString().slice(-8);
    await Billing.create({
      opd_registration_id: opd.id,
      patient_id,
      invoice_number: invoiceNumber,
      consultation_fee: finalFee,
      medicine_charges: 0,
      lab_charges: 0,
      other_charges: 0,
      discount: 0,
      total_amount: finalFee,
      paid_amount: 0,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'OPD registered and invoice created', opd });
  } catch (error) { next(error); }
};

const updateOpdRegistration = async (req, res, next) => {
  try {
    const { OpdRegistration } = req.dbModels;
    const opd = await OpdRegistration.findByPk(req.params.id);
    if (!opd) return res.status(404).json({ success: false, message: 'OPD record not found' });

    const { chief_complaint, notes, status } = req.body;
    await opd.update({
      chief_complaint: chief_complaint ?? opd.chief_complaint,
      notes: notes ?? opd.notes,
      status: status ?? opd.status
    });

    res.status(200).json({ success: true, message: 'OPD updated', opd });
  } catch (error) { next(error); }
};

module.exports = { getOpdRegistrations, getOpdById, createOpdRegistration, updateOpdRegistration };
