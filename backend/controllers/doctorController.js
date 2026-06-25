const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const getDoctors = async (req, res, next) => {
  try {
    const { Doctor, User, Department } = req.dbModels;
    const { page = 1, limit = 10, search = '', departmentId, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (departmentId) where.department_id = departmentId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Doctor.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'status'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true, count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      doctors: rows
    });
  } catch (error) { next(error); }
};

const getDepartments = async (req, res, next) => {
  try {
    const { Department } = req.dbModels;
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.status(200).json({ success: true, departments });
  } catch (error) { next(error); }
};

const createDoctor = async (req, res, next) => {
  try {
    const { Doctor, User, Role } = req.dbModels;
    const { name, department_id, qualification, specialization, consultation_fee, phone, email, status = 'Active', username, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const emailExists = await Doctor.findOne({ where: { email } });
    if (emailExists) return res.status(400).json({ success: false, message: 'Doctor email already exists' });

    const finalUsername = username || email.split('@')[0];
    const finalPassword = password || 'doctor123';

    const userExists = await User.findOne({ where: { username: finalUsername } });
    if (userExists) return res.status(400).json({ success: false, message: 'Username already taken' });

    // Find Doctor role
    const docRole = await Role.findOne({ where: { name: 'Doctor' } });

    const salt = await bcrypt.genSalt(10);
    const user = await User.create({
      username: finalUsername,
      email,
      password: await bcrypt.hash(finalPassword, salt),
      role_id: docRole.id,
      status
    });

    const doctor = await Doctor.create({ user_id: user.id, name, department_id, qualification, specialization, consultation_fee, phone, email, status });
    res.status(201).json({ success: true, message: 'Doctor created successfully', doctor });
  } catch (error) { next(error); }
};

const updateDoctor = async (req, res, next) => {
  try {
    const { Doctor, User } = req.dbModels;
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const { name, department_id, qualification, specialization, consultation_fee, phone, email, status } = req.body;
    await doctor.update({ name, department_id, qualification, specialization, consultation_fee, phone, email, status });

    if (doctor.user_id) {
      const user = await User.findByPk(doctor.user_id);
      if (user) await user.update({ email: email || user.email, status: status || user.status });
    }

    res.status(200).json({ success: true, message: 'Doctor updated successfully', doctor });
  } catch (error) { next(error); }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const { Doctor, User } = req.dbModels;
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    await doctor.update({ status: 'Inactive' });
    if (doctor.user_id) {
      const user = await User.findByPk(doctor.user_id);
      if (user) await user.update({ status: 'Inactive' });
    }

    res.status(200).json({ success: true, message: 'Doctor deactivated successfully' });
  } catch (error) { next(error); }
};

module.exports = { getDoctors, getDepartments, createDoctor, updateDoctor, deleteDoctor };
