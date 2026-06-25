const bcrypt = require('bcryptjs');
const Hospital = require('../models/Hospital');
const { createTenantDB } = require('../config/tenantDB');

/**
 * @desc  Register a new hospital (creates its own MySQL DB + seeds it)
 * @route POST /api/hospitals/register
 * @access Public
 */
const registerHospital = async (req, res, next) => {
  try {
    const { name, code, address, city, phone, email, admin_name } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Hospital name and code are required' });
    }

    // Sanitize code: uppercase, only alphanumeric
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Hospital code must be alphanumeric' });
    }

    // Check if code already exists
    const existing = await Hospital.findOne({ where: { code: cleanCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Hospital code '${cleanCode}' is already taken. Choose a different code.` });
    }

    // DB name: hims_<code_lowercase>
    const dbName = `hims_${cleanCode.toLowerCase()}`;

    // Create the hospital DB and seed it
    console.log(`🏥 Creating database '${dbName}' for hospital '${name}'...`);
    await createTenantDB(cleanCode, dbName, name);

    // Save to master registry
    const hospital = await Hospital.create({
      name,
      code: cleanCode,
      db_name: dbName,
      address: address || null,
      city: city || null,
      phone: phone || null,
      email: email || null,
      admin_name: admin_name || null,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: `Hospital '${name}' registered successfully! Database '${dbName}' has been created.`,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        code: hospital.code,
        db_name: hospital.db_name,
        city: hospital.city,
        status: hospital.status
      },
      defaultCredentials: {
        note: 'These default accounts have been created in your hospital database.',
        accounts: [
          { role: 'Admin',        username: 'admin',        password: 'admin123' },
          { role: 'Doctor',       username: 'doctor',       password: 'doctor123' },
          { role: 'Receptionist', username: 'receptionist', password: 'recep123' },
          { role: 'Pharmacist',   username: 'pharmacist',   password: 'pharma123' }
        ]
      }
    });
  } catch (error) {
    console.error('Hospital registration error:', error);
    next(error);
  }
};

/**
 * @desc  Get all registered hospitals (for the login page dropdown)
 * @route GET /api/hospitals
 * @access Public
 */
const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'name', 'code', 'city', 'logo_url', 'status'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({ success: true, hospitals });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get hospital details by code
 * @route GET /api/hospitals/:code
 * @access Public
 */
const getHospitalByCode = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({
      where: { code: req.params.code.toUpperCase(), status: 'Active' },
      attributes: ['id', 'name', 'code', 'city', 'address', 'phone', 'email', 'logo_url', 'status']
    });

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found with this code' });
    }

    res.status(200).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerHospital, getHospitals, getHospitalByCode };
