const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prescription_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  medicine_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  }
}, {
  tableName: 'prescription_items',
  timestamps: true
});

module.exports = PrescriptionItem;
