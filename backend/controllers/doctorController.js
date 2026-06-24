const { Doctor, User, Department, Role } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get all doctors (with search, filter, pagination)
// @route   GET /api/doctors
// @access  Private (Admin/Receptionist/Doctor/Pharmacist)
const getDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (departmentId) {
      where.department_id = departmentId;
    }

    if (search) {
      where[Doctor.sequelize.Sequelize.Op.or] = [
        { name: { [Doctor.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { specialty: { [Doctor.sequelize.Sequelize.Op.like]: `%${search}%` } },
        { registration_number: { [Doctor.sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Doctor.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'status'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      doctors: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all departments (for filters/dropdowns)
// @route   GET /api/doctors/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a doctor (and create their user login)
// @route   POST /api/doctors
// @access  Private (Admin only)
const createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      department_id,
      qualification,
      specialty,
      registration_number,
      consultation_fee,
      phone,
      email,
      status = 'Active',
      username,
      password
    } = req.body;

    const regExists = await Doctor.findOne({ where: { registration_number } });
    if (regExists) {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }

    const emailExists = await Doctor.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Doctor email already exists' });
    }

    let userId = null;
    const finalUsername = username || email.split('@')[0];
    const finalPassword = password || 'doctor123';

    const userExists = await User.findOne({ where: { username: finalUsername } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(finalPassword, salt);

    const user = await User.create({
      username: finalUsername,
      email: email,
      password: hashedPassword,
      role_id: 3,
      status: status
    });
    userId = user.id;

    const doctor = await Doctor.create({
      user_id: userId,
      name,
      department_id,
      qualification,
      specialty,
      registration_number,
      consultation_fee,
      phone,
      email,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Doctor profile and login user created successfully',
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin/Doctor)
const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (req.user.role.name === 'Doctor') {
      const selfDoctor = await Doctor.findOne({ where: { user_id: req.user.id } });
      if (!selfDoctor || selfDoctor.id !== parseInt(req.params.id)) {
        return res.status(403).json({ success: false, message: 'Access denied: you can only update your own profile' });
      }
    }

    const {
      name,
      department_id,
      qualification,
      specialty,
      consultation_fee,
      phone,
      email,
      status
    } = req.body;

    await doctor.update({
      name,
      department_id,
      qualification,
      specialty,
      consultation_fee,
      phone,
      email,
      status
    });

    if (doctor.user_id) {
      const user = await User.findByPk(doctor.user_id);
      if (user) {
        await user.update({
          email: email || user.email,
          status: status || user.status
        });
      }
    }

    res.status(200).json({ success: true, message: 'Doctor profile updated successfully', doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin only)
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    await doctor.update({ status: 'Inactive' });

    if (doctor.user_id) {
      const user = await User.findByPk(doctor.user_id);
      if (user) {
        await user.update({ status: 'Inactive' });
      }
    }

    res.status(200).json({ success: true, message: 'Doctor profile deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDepartments,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
