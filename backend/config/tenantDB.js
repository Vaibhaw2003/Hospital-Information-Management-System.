/**
 * TENANT DB MANAGER
 * Manages per-hospital Sequelize connections (cached in memory).
 * Each hospital gets their own database: hims_<hospital_code>
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Cache: { hospital_code -> { sequelize, models } }
const tenantCache = {};

/**
 * Build all models + associations on a given Sequelize instance
 */
function buildModels(sequelize) {
  const { DataTypes } = Sequelize;

  // ── Role ──
  const Role = sequelize.define('Role', {
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true }
  }, { tableName: 'roles', timestamps: true });

  // ── User ──
  const User = sequelize.define('User', {
    username:    { type: DataTypes.STRING(100), allowNull: false, unique: true },
    email:       { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password:    { type: DataTypes.STRING(255), allowNull: false },
    role_id:     { type: DataTypes.INTEGER, allowNull: false },
    status:      { type: DataTypes.ENUM('Active','Inactive'), defaultValue: 'Active' },
    profile_pic: { type: DataTypes.STRING(255), defaultValue: null }
  }, { tableName: 'users', timestamps: true });

  // ── Department ──
  const Department = sequelize.define('Department', {
    name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, defaultValue: null }
  }, { tableName: 'departments', timestamps: true });

  // ── Doctor ──
  const Doctor = sequelize.define('Doctor', {
    name:             { type: DataTypes.STRING(150), allowNull: false },
    email:            { type: DataTypes.STRING(150), unique: true },
    phone:            { type: DataTypes.STRING(20) },
    specialization:   { type: DataTypes.STRING(100) },
    qualification:    { type: DataTypes.STRING(255) },
    department_id:    { type: DataTypes.INTEGER },
    user_id:          { type: DataTypes.INTEGER },
    consultation_fee: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    status:           { type: DataTypes.ENUM('Active','Inactive'), defaultValue: 'Active' }
  }, { tableName: 'doctors', timestamps: true });

  // ── Patient ──
  const Patient = sequelize.define('Patient', {
    patient_id:       { type: DataTypes.STRING(20), unique: true },
    name:             { type: DataTypes.STRING(150), allowNull: false },
    dob:              { type: DataTypes.DATEONLY },
    gender:           { type: DataTypes.ENUM('Male','Female','Other') },
    blood_group:      { type: DataTypes.STRING(5) },
    phone:            { type: DataTypes.STRING(20) },
    email:            { type: DataTypes.STRING(150) },
    address:          { type: DataTypes.TEXT },
    emergency_contact:{ type: DataTypes.STRING(20) },
    medical_history:  { type: DataTypes.TEXT }
  }, { tableName: 'patients', timestamps: true });

  // ── Appointment ──
  const Appointment = sequelize.define('Appointment', {
    patient_id:   { type: DataTypes.INTEGER },
    doctor_id:    { type: DataTypes.INTEGER },
    date:         { type: DataTypes.DATEONLY },
    time:         { type: DataTypes.TIME },
    type:         { type: DataTypes.STRING(50) },
    status:       { type: DataTypes.ENUM('Scheduled','Completed','Cancelled'), defaultValue: 'Scheduled' },
    notes:        { type: DataTypes.TEXT }
  }, { tableName: 'appointments', timestamps: true });

  // ── OPD Registration ──
  const OpdRegistration = sequelize.define('OpdRegistration', {
    patient_id:       { type: DataTypes.INTEGER },
    doctor_id:        { type: DataTypes.INTEGER },
    department_id:    { type: DataTypes.INTEGER },
    token_number:     { type: DataTypes.INTEGER },
    visit_date:       { type: DataTypes.DATEONLY },
    chief_complaint:  { type: DataTypes.TEXT },
    status:           { type: DataTypes.ENUM('Active','Completed','Cancelled'), defaultValue: 'Active' },
    notes:            { type: DataTypes.TEXT }
  }, { tableName: 'opd_registrations', timestamps: true });

  // ── Prescription ──
  const Prescription = sequelize.define('Prescription', {
    opd_registration_id: { type: DataTypes.INTEGER, unique: true },
    doctor_id:           { type: DataTypes.INTEGER },
    patient_id:          { type: DataTypes.INTEGER },
    diagnosis:           { type: DataTypes.TEXT },
    notes:               { type: DataTypes.TEXT },
    status:              { type: DataTypes.ENUM('Pending','Dispensed'), defaultValue: 'Pending' }
  }, { tableName: 'prescriptions', timestamps: true });

  // ── PrescriptionItem ──
  const PrescriptionItem = sequelize.define('PrescriptionItem', {
    prescription_id: { type: DataTypes.INTEGER },
    medicine_id:     { type: DataTypes.INTEGER },
    dosage:          { type: DataTypes.STRING(100) },
    frequency:       { type: DataTypes.STRING(100) },
    duration:        { type: DataTypes.STRING(100) },
    quantity:        { type: DataTypes.INTEGER, defaultValue: 1 },
    instructions:    { type: DataTypes.TEXT }
  }, { tableName: 'prescription_items', timestamps: true });

  // ── Medicine ──
  const Medicine = sequelize.define('Medicine', {
    name:            { type: DataTypes.STRING(150), allowNull: false },
    generic_name:    { type: DataTypes.STRING(150) },
    category:        { type: DataTypes.STRING(100) },
    unit:            { type: DataTypes.STRING(30) },
    price:           { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    quantity:        { type: DataTypes.INTEGER, defaultValue: 0 },
    min_stock_level: { type: DataTypes.INTEGER, defaultValue: 10 },
    batch_number:    { type: DataTypes.STRING(50) },
    expiry_date:     { type: DataTypes.DATEONLY },
    manufacturer:    { type: DataTypes.STRING(150) },
    status:          { type: DataTypes.ENUM('Active','Inactive'), defaultValue: 'Active' }
  }, { tableName: 'medicines', timestamps: true });

  // ── MedicineStock ──
  const MedicineStock = sequelize.define('MedicineStock', {
    medicine_id:    { type: DataTypes.INTEGER },
    type:           { type: DataTypes.ENUM('IN','OUT') },
    quantity:       { type: DataTypes.INTEGER },
    reason:         { type: DataTypes.STRING(255) },
    performed_by:   { type: DataTypes.INTEGER },
    reference_id:   { type: DataTypes.INTEGER }
  }, { tableName: 'medicine_stock', timestamps: true });

  // ── Billing ──
  const Billing = sequelize.define('Billing', {
    patient_id:          { type: DataTypes.INTEGER },
    opd_registration_id: { type: DataTypes.INTEGER },
    invoice_number:      { type: DataTypes.STRING(30), unique: true },
    consultation_fee:    { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    medicine_charges:    { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    lab_charges:         { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    other_charges:       { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    discount:            { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    total_amount:        { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    paid_amount:         { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    status:              { type: DataTypes.ENUM('Pending','Partial','Paid'), defaultValue: 'Pending' },
    notes:               { type: DataTypes.TEXT }
  }, { tableName: 'billings', timestamps: true });

  // ── Payment ──
  const Payment = sequelize.define('Payment', {
    billing_id:     { type: DataTypes.INTEGER },
    amount:         { type: DataTypes.DECIMAL(10,2) },
    payment_method: { type: DataTypes.ENUM('Cash','Card','UPI','Bank Transfer','Other') },
    transaction_id: { type: DataTypes.STRING(100) },
    notes:          { type: DataTypes.TEXT }
  }, { tableName: 'payments', timestamps: true });

  // ── Associations ──
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

  Department.hasMany(Doctor, { foreignKey: 'department_id', as: 'doctors' });
  Doctor.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

  User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
  Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
  Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

  Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
  Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

  Patient.hasMany(OpdRegistration, { foreignKey: 'patient_id', as: 'opdRegistrations' });
  OpdRegistration.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

  Department.hasMany(OpdRegistration, { foreignKey: 'department_id', as: 'opdRegistrations' });
  OpdRegistration.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

  Doctor.hasMany(OpdRegistration, { foreignKey: 'doctor_id', as: 'opdRegistrations' });
  OpdRegistration.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

  OpdRegistration.hasOne(Prescription, { foreignKey: 'opd_registration_id', as: 'prescription' });
  Prescription.belongsTo(OpdRegistration, { foreignKey: 'opd_registration_id', as: 'opdRegistration' });

  Doctor.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'prescriptions' });
  Prescription.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

  Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions' });
  Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

  Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id', as: 'items' });
  PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

  Medicine.hasMany(PrescriptionItem, { foreignKey: 'medicine_id', as: 'prescriptionItems' });
  PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicine_id', as: 'medicine' });

  Medicine.hasMany(MedicineStock, { foreignKey: 'medicine_id', as: 'stockMovements' });
  MedicineStock.belongsTo(Medicine, { foreignKey: 'medicine_id', as: 'medicine' });

  OpdRegistration.hasOne(Billing, { foreignKey: 'opd_registration_id', as: 'billing' });
  Billing.belongsTo(OpdRegistration, { foreignKey: 'opd_registration_id', as: 'opdRegistration' });

  Patient.hasMany(Billing, { foreignKey: 'patient_id', as: 'billings' });
  Billing.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

  Billing.hasMany(Payment, { foreignKey: 'billing_id', as: 'payments' });
  Payment.belongsTo(Billing, { foreignKey: 'billing_id', as: 'billing' });

  return { Role, User, Department, Doctor, Patient, Appointment, OpdRegistration, Prescription, PrescriptionItem, Medicine, MedicineStock, Billing, Payment };
}

/**
 * Get (or create) a Sequelize instance for the given hospital database name.
 * Connections are cached per hospital_code.
 */
async function getTenantDB(hospitalCode, dbName) {
  if (tenantCache[hospitalCode]) {
    return tenantCache[hospitalCode];
  }

  const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
    }
  );

  await sequelize.authenticate();
  const models = buildModels(sequelize);
  await sequelize.sync({ force: false });

  tenantCache[hospitalCode] = { sequelize, models };
  return tenantCache[hospitalCode];
}

/**
 * Create a new database for a hospital and initialize its schema + seed data.
 */
async function createTenantDB(hospitalCode, dbName, hospitalName) {
  const { Sequelize: Sq } = require('sequelize');

  // Connect without a DB to create it
  const rootConn = new Sq(
    null,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );

  await rootConn.authenticate();
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.close();

  // Now connect to the new DB, build schema, and seed
  const tenant = await getTenantDB(hospitalCode, dbName);
  await seedTenant(tenant.models, hospitalName);

  return tenant;
}

/**
 * Seed a fresh hospital database with default roles, admin user, departments, medicines
 */
async function seedTenant(models, hospitalName) {
  const bcrypt = require('bcryptjs');
  const { Role, User, Department, Medicine } = models;

  const roleCount = await Role.count();
  if (roleCount > 0) return; // Already seeded

  // Roles
  const [adminRole]    = await Role.findOrCreate({ where: { name: 'Admin' } });
  const [docRole]      = await Role.findOrCreate({ where: { name: 'Doctor' } });
  const [recepRole]    = await Role.findOrCreate({ where: { name: 'Receptionist' } });
  const [pharmaRole]   = await Role.findOrCreate({ where: { name: 'Pharmacist' } });

  // Default admin user
  const salt = await bcrypt.genSalt(10);
  await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      email: `admin@${hospitalName.toLowerCase().replace(/\s+/g,'-')}.com`,
      password: await bcrypt.hash('admin123', salt),
      role_id: adminRole.id,
      status: 'Active'
    }
  });
  await User.findOrCreate({
    where: { username: 'doctor' },
    defaults: {
      email: `doctor@${hospitalName.toLowerCase().replace(/\s+/g,'-')}.com`,
      password: await bcrypt.hash('doctor123', salt),
      role_id: docRole.id, status: 'Active'
    }
  });
  await User.findOrCreate({
    where: { username: 'receptionist' },
    defaults: {
      email: `receptionist@${hospitalName.toLowerCase().replace(/\s+/g,'-')}.com`,
      password: await bcrypt.hash('recep123', salt),
      role_id: recepRole.id, status: 'Active'
    }
  });
  await User.findOrCreate({
    where: { username: 'pharmacist' },
    defaults: {
      email: `pharmacist@${hospitalName.toLowerCase().replace(/\s+/g,'-')}.com`,
      password: await bcrypt.hash('pharma123', salt),
      role_id: pharmaRole.id, status: 'Active'
    }
  });

  // Departments
  const departments = ['General Medicine','Cardiology','Orthopedics','Pediatrics','Neurology','Gynecology','Dermatology','ENT'];
  for (const name of departments) {
    await Department.findOrCreate({ where: { name } });
  }

  // Sample Medicines
  const medicines = [
    { name: 'Paracetamol 500mg', generic_name: 'Paracetamol', category: 'Analgesic', unit: 'Tablet', price: 2.50, quantity: 500, min_stock_level: 50, batch_number: 'B001', expiry_date: '2027-06-30' },
    { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin',  category: 'Antibiotic', unit: 'Capsule', price: 8.00, quantity: 200, min_stock_level: 30, batch_number: 'B002', expiry_date: '2026-12-31' },
    { name: 'Ibuprofen 400mg',   generic_name: 'Ibuprofen',    category: 'NSAID',      unit: 'Tablet', price: 5.00, quantity: 300, min_stock_level: 40, batch_number: 'B003', expiry_date: '2027-03-31' },
    { name: 'Cetirizine 10mg',   generic_name: 'Cetirizine',   category: 'Antihistamine', unit: 'Tablet', price: 3.00, quantity: 150, min_stock_level: 20, batch_number: 'B004', expiry_date: '2026-09-30' },
    { name: 'Omeprazole 20mg',   generic_name: 'Omeprazole',   category: 'Antacid',    unit: 'Capsule', price: 6.00, quantity: 180, min_stock_level: 25, batch_number: 'B005', expiry_date: '2027-01-31' },
    { name: 'Metformin 500mg',   generic_name: 'Metformin',    category: 'Antidiabetic', unit: 'Tablet', price: 4.00, quantity: 250, min_stock_level: 30, batch_number: 'B006', expiry_date: '2026-11-30' },
  ];
  for (const med of medicines) {
    await Medicine.findOrCreate({ where: { name: med.name }, defaults: med });
  }

  console.log(`✅ Tenant DB seeded for hospital: ${hospitalName}`);
}

module.exports = { getTenantDB, createTenantDB, buildModels };
