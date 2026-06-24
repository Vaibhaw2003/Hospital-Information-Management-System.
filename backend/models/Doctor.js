const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registration_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    allowNull: false,
    defaultValue: 'Active'
  }
}, {
  tableName: 'doctors',
  timestamps: true
});

module.exports = Doctor;
