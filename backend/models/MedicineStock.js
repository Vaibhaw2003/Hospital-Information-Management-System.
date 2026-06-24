const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MedicineStock = sequelize.define('MedicineStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicine_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'medicine_stock',
  timestamps: true
});

module.exports = MedicineStock;
