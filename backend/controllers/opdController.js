const { OpdRegistration, Patient, Doctor, Department, Billing } = require('../models');

// @desc    Get all OPD registrations (with search, filter, pagination)
// @route   GET /api/opd
// @access  Private (Admin/Receptionist/Doctor)
const getOpdRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', doctorId, departmentId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (doctorId) {
      where.doctor_id = doctorId;
    }
    if (departmentId) {
      where.department_id = departmentId;
    }

    const patientWhere = {};
    if (search) {
      patientWhere[Patient.sequelize.Sequelize.Op.or] = [
        { name: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { phone: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await OpdRegistration.findAndCountAll({
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
        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'consultation_fee'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      opdRegistrations: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single OPD registration details
// @route   GET /api/opd/:id
// @access  Private
const getOpdById = async (req, res, next) => {
  try {
    const opd = await OpdRegistration.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor', include: [{ model: Department, as: 'department' }] },
        { model: Department, as: 'department' },
        { model: Billing, as: 'billing' }
      ]
    });

    if (!opd) {
      return res.status(404).json({ success: false, message: 'OPD record not found' });
    }

    res.status(200).json({ success: true, opd });
  } catch (error) {
    next(error);
  }
};

// @desc    Create OPD entry
// @route   POST /api/opd
// @access  Private (Admin/Receptionist)
const createOpdRegistration = async (req, res, next) => {
  try {
    const {
      patient_id,
      department_id,
      doctor_id,
      visit_type = 'First Visit',
      chief_complaint,
      symptoms,
      diagnosis,
      consultation_fee
    } = req.body;

    const doctor = await Doctor.findByPk(doctor_id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const finalFee = consultation_fee !== undefined ? parseFloat(consultation_fee) : parseFloat(doctor.consultation_fee);

    const today = new Date().toISOString().split('T')[0];
    const todayCount = await OpdRegistration.count({
      where: {
        doctor_id,
        registration_date: today
      }
    });
    const token_number = todayCount + 1;

    const opd = await OpdRegistration.create({
      patient_id,
      department_id,
      doctor_id,
      visit_type,
      token_number,
      chief_complaint,
      symptoms,
      diagnosis,
      consultation_fee: finalFee,
      status: 'Active'
    });

    const tax = parseFloat((finalFee * 0.05).toFixed(2));
    const total_amount = parseFloat((finalFee + tax).toFixed(2));

    await Billing.create({
      opd_registration_id: opd.id,
      patient_id,
      consultation_fee: finalFee,
      lab_charges: 0.00,
      medicine_charges: 0.00,
      discount: 0.00,
      tax,
      total_amount,
      payment_status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'OPD entry and bill generated successfully',
      opd
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update OPD entry (diagnosis, follow-up, etc.)
// @route   PUT /api/opd/:id
// @access  Private (Admin/Doctor/Receptionist)
const updateOpdRegistration = async (req, res, next) => {
  try {
    const opd = await OpdRegistration.findByPk(req.params.id);
    if (!opd) {
      return res.status(404).json({ success: false, message: 'OPD record not found' });
    }

    const {
      chief_complaint,
      symptoms,
      diagnosis,
      follow_up_required,
      next_visit_date,
      status
    } = req.body;

    await opd.update({
      chief_complaint: chief_complaint !== undefined ? chief_complaint : opd.chief_complaint,
      symptoms: symptoms !== undefined ? symptoms : opd.symptoms,
      diagnosis: diagnosis !== undefined ? diagnosis : opd.diagnosis,
      follow_up_required: follow_up_required !== undefined ? follow_up_required : opd.follow_up_required,
      next_visit_date: next_visit_date !== undefined ? next_visit_date : opd.next_visit_date,
      status: status !== undefined ? status : opd.status
    });

    res.status(200).json({
      success: true,
      message: 'OPD record updated successfully',
      opd
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOpdRegistrations,
  getOpdById,
  createOpdRegistration,
  updateOpdRegistration
};
