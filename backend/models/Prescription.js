const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  opd_registration_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Dispensed'),
    allowNull: false,
    defaultValue: 'Pending'
  }
}, {
  tableName: 'prescriptions',
  timestamps: true
});

module.exports = Prescription;
