const sequelize = require('../config/db');
const Role = require('./Role');
const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const OpdRegistration = require('./OpdRegistration');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Medicine = require('./Medicine');
const MedicineStock = require('./MedicineStock');
const Billing = require('./Billing');
const Payment = require('./Payment');

// Roles & Users
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Departments & Doctors
Department.hasMany(Doctor, { foreignKey: 'department_id', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Users & Doctors (Optional Profile Link)
User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Patients & Appointments
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Doctors & Appointments
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// Patients & OPD Registrations
Patient.hasMany(OpdRegistration, { foreignKey: 'patient_id', as: 'opdRegistrations' });
OpdRegistration.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Departments & OPD Registrations
Department.hasMany(OpdRegistration, { foreignKey: 'department_id', as: 'opdRegistrations' });
OpdRegistration.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Doctors & OPD Registrations
Doctor.hasMany(OpdRegistration, { foreignKey: 'doctor_id', as: 'opdRegistrations' });
OpdRegistration.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// OPD & Prescriptions
OpdRegistration.hasOne(Prescription, { foreignKey: 'opd_registration_id', as: 'prescription' });
Prescription.belongsTo(OpdRegistration, { foreignKey: 'opd_registration_id', as: 'opdRegistration' });

// Doctor & Prescriptions
Doctor.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'prescriptions' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// Patient & Prescriptions
Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions' });
Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Prescription & Items
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id', as: 'items' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

// Medicine & PrescriptionItems
Medicine.hasMany(PrescriptionItem, { foreignKey: 'medicine_id', as: 'prescriptionItems' });
PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicine_id', as: 'medicine' });

// Medicine & Stock Movements
Medicine.hasMany(MedicineStock, { foreignKey: 'medicine_id', as: 'stockMovements' });
MedicineStock.belongsTo(Medicine, { foreignKey: 'medicine_id', as: 'medicine' });

// OPD & Billings
OpdRegistration.hasOne(Billing, { foreignKey: 'opd_registration_id', as: 'billing' });
Billing.belongsTo(OpdRegistration, { foreignKey: 'opd_registration_id', as: 'opdRegistration' });

// Patient & Billings
Patient.hasMany(Billing, { foreignKey: 'patient_id', as: 'billings' });
Billing.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Billing & Payments
Billing.hasMany(Payment, { foreignKey: 'billing_id', as: 'payments' });
Payment.belongsTo(Billing, { foreignKey: 'billing_id', as: 'billing' });

module.exports = {
  sequelize,
  Role,
  User,
  Department,
  Doctor,
  Patient,
  Appointment,
  OpdRegistration,
  Prescription,
  PrescriptionItem,
  Medicine,
  MedicineStock,
  Billing,
  Payment
};
