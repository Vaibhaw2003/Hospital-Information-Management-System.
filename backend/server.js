const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const seedDatabase = require('./config/seed');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const opdRoutes = require('./routes/opdRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const billingRoutes = require('./routes/billingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ success: true, database: 'Connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, database: 'Disconnected', error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Synchronizing database models...');
    await sequelize.sync({ force: false });
    console.log('Database tables synchronized.');

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Please ensure your MySQL server is running and the credentials in backend/.env are correct.');
    console.log('Server is shutting down...');
    process.exit(1);
  }
};

startServer();
