const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  blood_group: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true,
  hooks: {
    beforeValidate: async (patient) => {
      if (!patient.patient_id) {
        const year = new Date().getFullYear();
        // Find the last patient with standard regex matching PAT-year-XXXX
        const lastPatient = await Patient.findOne({
          order: [['id', 'DESC']]
        });
        
        let nextNum = 1;
        if (lastPatient && lastPatient.patient_id.startsWith(`PAT-${year}-`)) {
          const parts = lastPatient.patient_id.split('-');
          const lastNum = parseInt(parts[2], 10);
          nextNum = lastNum + 1;
        }
        
        patient.patient_id = `PAT-${year}-${String(nextNum).padStart(4, '0')}`;
      }
    }
  }
});

module.exports = Patient;
