const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OpdRegistration = sequelize.define('OpdRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  opd_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  registration_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  visit_type: {
    type: DataTypes.ENUM('First Visit', 'Follow Up'),
    allowNull: false,
    defaultValue: 'First Visit'
  },
  token_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  chief_complaint: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  next_visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed'),
    allowNull: false,
    defaultValue: 'Active'
  }
}, {
  tableName: 'opd_registrations',
  timestamps: true,
  hooks: {
    beforeValidate: async (opd) => {
      if (!opd.opd_number) {
        const year = new Date().getFullYear();
        const lastOpd = await OpdRegistration.findOne({
          order: [['id', 'DESC']]
        });
        
        let nextNum = 1;
        if (lastOpd && lastOpd.opd_number.startsWith(`OPD-${year}-`)) {
          const parts = lastOpd.opd_number.split('-');
          const lastNum = parseInt(parts[2], 10);
          nextNum = lastNum + 1;
        }
        
        opd.opd_number = `OPD-${year}-${String(nextNum).padStart(4, '0')}`;
      }
    }
  }
});

module.exports = OpdRegistration;
