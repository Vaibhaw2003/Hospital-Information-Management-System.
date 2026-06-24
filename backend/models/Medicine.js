const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  batch_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  min_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  }
}, {
  tableName: 'medicines',
  timestamps: true
});

module.exports = Medicine;
