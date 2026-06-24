const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  token_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'CheckedIn', 'Cancelled', 'Completed'),
    allowNull: false,
    defaultValue: 'Scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

module.exports = Appointment;
