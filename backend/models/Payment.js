const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  billing_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  payment_mode: {
    type: DataTypes.ENUM('Cash', 'Card', 'UPI', 'NetBanking'),
    allowNull: false,
    defaultValue: 'Cash'
  },
  transaction_reference: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;
