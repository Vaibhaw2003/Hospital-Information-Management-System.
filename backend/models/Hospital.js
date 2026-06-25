/**
 * Hospital model — stored in hims_master
 * Each row represents one registered hospital with its own DB.
 */
const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDB');

const Hospital = masterSequelize.define('Hospital', {
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Short unique code: e.g. APOLLO, AIIMS, MAX01'
  },
  db_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'MySQL database name for this hospital'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  city: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING(20),
    defaultValue: null
  },
  email: {
    type: DataTypes.STRING(150),
    defaultValue: null
  },
  logo_url: {
    type: DataTypes.STRING(255),
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active'
  },
  admin_name: {
    type: DataTypes.STRING(150),
    comment: 'Hospital administrator name'
  },
  subscription_plan: {
    type: DataTypes.ENUM('Free', 'Basic', 'Premium'),
    defaultValue: 'Free'
  }
}, {
  tableName: 'hospitals',
  timestamps: true
});

module.exports = Hospital;
