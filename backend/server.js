const express = require('express');
const cors = require('cors');
require('dotenv').config();

const masterSequelize = require('./config/masterDB');
const Hospital = require('./models/Hospital');

const hospitalRoutes      = require('./routes/hospitalRoutes');
const authRoutes          = require('./routes/authRoutes');
const dashboardRoutes     = require('./routes/dashboardRoutes');
const doctorRoutes        = require('./routes/doctorRoutes');
const patientRoutes       = require('./routes/patientRoutes');
const opdRoutes           = require('./routes/opdRoutes');
const prescriptionRoutes  = require('./routes/prescriptionRoutes');
const billingRoutes       = require('./routes/billingRoutes');
const inventoryRoutes     = require('./routes/inventoryRoutes');

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get('/api/health', async (req, res) => {
  try {
    await masterSequelize.authenticate();
    res.status(200).json({ success: true, database: 'Master DB Connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, database: 'Disconnected', error: error.message });
  }
});

// ── Routes ──
app.use('/api/hospitals',     hospitalRoutes);       // Public: register / list hospitals
app.use('/api/auth',          authRoutes);            // Public: login (with hospitalCode)
app.use('/api/dashboard',     dashboardRoutes);       // Protected: tenant-specific
app.use('/api/doctors',       doctorRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/opd',           opdRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/inventory',     inventoryRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔌 Connecting to Master database (hims_master)...');

    // Create master DB if it doesn't exist
    const { Sequelize } = require('sequelize');
    const rootConn = new Sequelize(null, process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    });
    await rootConn.authenticate();
    await rootConn.query('CREATE DATABASE IF NOT EXISTS `hims_master` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await rootConn.close();

    await masterSequelize.authenticate();
    await masterSequelize.sync({ force: false }); // Creates 'hospitals' table if not exists
    console.log('✅ Master database ready.');

    // Pre-warm tenant connections for all active hospitals
    const { getTenantDB } = require('./config/tenantDB');
    const hospitals = await Hospital.findAll({ where: { status: 'Active' } });
    for (const h of hospitals) {
      try {
        await getTenantDB(h.code, h.db_name);
        console.log(`   ↪ Tenant DB loaded: ${h.name} (${h.db_name})`);
      } catch (e) {
        console.warn(`   ⚠ Could not connect to tenant DB for ${h.name}: ${e.message}`);
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 HIMS Multi-Tenant Server running on port ${PORT}`);
      console.log(`   Registered hospitals: ${hospitals.length}`);
      console.log(`   API: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
