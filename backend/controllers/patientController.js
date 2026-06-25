const { Op } = require('sequelize');

const getPatients = async (req, res, next) => {
  try {
    const { Patient } = req.dbModels;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { patient_id: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where, limit: parseInt(limit), offset, order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true, count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      patients: rows
    });
  } catch (error) { next(error); }
};

const getPatientById = async (req, res, next) => {
  try {
    const { Patient } = req.dbModels;
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.status(200).json({ success: true, patient });
  } catch (error) { next(error); }
};

const createPatient = async (req, res, next) => {
  try {
    const { Patient } = req.dbModels;
    const { name, dob, gender, phone, email, address, blood_group, emergency_contact, medical_history } = req.body;

    // Generate patient_id: PT + timestamp
    const patient_id = 'PT' + Date.now().toString().slice(-8);

    const patient = await Patient.create({ patient_id, name, dob, gender, phone, email, address, blood_group, emergency_contact, medical_history });
    res.status(201).json({ success: true, message: 'Patient created successfully', patient });
  } catch (error) { next(error); }
};

const updatePatient = async (req, res, next) => {
  try {
    const { Patient } = req.dbModels;
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const { name, dob, gender, phone, email, address, blood_group, emergency_contact, medical_history } = req.body;
    await patient.update({ name, dob, gender, phone, email, address, blood_group, emergency_contact, medical_history });
    res.status(200).json({ success: true, message: 'Patient updated', patient });
  } catch (error) { next(error); }
};

const deletePatient = async (req, res, next) => {
  try {
    const { Patient } = req.dbModels;
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    await patient.destroy();
    res.status(200).json({ success: true, message: 'Patient deleted' });
  } catch (error) { next(error); }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient };
