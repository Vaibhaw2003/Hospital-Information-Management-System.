/**
 * MASTER DATABASE CONNECTION
 * hims_master — stores hospital registry (which hospital → which DB)
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

const masterSequelize = new Sequelize(
  'hims_master',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

module.exports = masterSequelize;
