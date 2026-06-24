const { Patient } = require('../models');

// @desc    Get all patients (with search and pagination)
// @route   GET /api/patients
// @access  Private (Admin/Receptionist/Doctor)
const getPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Patient.sequelize.Sequelize.Op.or] = [
        { name: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { patient_id: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { phone: { [Patient.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
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
      patients: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient details
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a patient
// @route   POST /api/patients
// @access  Private (Admin/Receptionist)
const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, phone, address, blood_group, emergency_contact } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      address,
      blood_group,
      emergency_contact
    });

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private (Admin/Receptionist)
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const { name, age, gender, phone, address, blood_group, emergency_contact } = req.body;

    await patient.update({
      name,
      age,
      gender,
      phone,
      address,
      blood_group,
      emergency_contact
    });

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    await patient.destroy();
    res.status(200).json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
