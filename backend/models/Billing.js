const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Billing = sequelize.define('Billing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  opd_registration_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  lab_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  medicine_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  payment_status: {
    type: DataTypes.ENUM('Paid', 'Pending', 'PartiallyPaid'),
    allowNull: false,
    defaultValue: 'Pending'
  }
}, {
  tableName: 'billings',
  timestamps: true
});

module.exports = Billing;
