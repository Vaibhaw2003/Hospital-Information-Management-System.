const bcrypt = require('bcryptjs');
const { Role, Department, User, Doctor, Patient, Medicine, MedicineStock, OpdRegistration, Billing, Payment } = require('../models');

const seedDatabase = async () => {
  try {
    const roleCount = await Role.count();
    if (roleCount > 0) {
      console.log('Database already has data. Skipping seeder.');
      return;
    }

    console.log('Seeding database with default HIMS data...');

    // 1. Seed Roles
    await Role.bulkCreate([
      { id: 1, name: 'Admin', description: 'Administrator with full system privileges' },
      { id: 2, name: 'Receptionist', description: 'Staff responsible for registration and billing' },
      { id: 3, name: 'Doctor', description: 'Medical practitioners' },
      { id: 4, name: 'Pharmacist', description: 'Pharmacy inventory manager' }
    ]);

    // 2. Seed Departments
    await Department.bulkCreate([
      { id: 1, name: 'Cardiology', description: 'Heart and vascular care' },
      { id: 2, name: 'Pediatrics', description: 'Child and adolescent care' },
      { id: 3, name: 'Neurology', description: 'Brain and nervous system disorders' },
      { id: 4, name: 'Orthopedics', description: 'Bones, joints, ligaments and muscles' },
      { id: 5, name: 'General Medicine', description: 'Primary comprehensive care' },
      { id: 6, name: 'Dermatology', description: 'Skin, hair and nail conditions' }
    ]);

    // 3. Seed Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const recepPassword = await bcrypt.hash('recep123', salt);
    const docPassword = await bcrypt.hash('doctor123', salt);
    const pharmaPassword = await bcrypt.hash('pharma123', salt);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@hims.com',
      password: adminPassword,
      role_id: 1,
      status: 'Active'
    });

    const recepUser = await User.create({
      username: 'receptionist',
      email: 'receptionist@hims.com',
      password: recepPassword,
      role_id: 2,
      status: 'Active'
    });

    const docUser = await User.create({
      username: 'doctor',
      email: 'doctor@hims.com',
      password: docPassword,
      role_id: 3,
      status: 'Active'
    });

    const pharmaUser = await User.create({
      username: 'pharmacist',
      email: 'pharmacist@hims.com',
      password: pharmaPassword,
      role_id: 4,
      status: 'Active'
    });

    // 4. Seed Doctors
    const doctorProfile = await Doctor.create({
      user_id: docUser.id,
      name: 'Dr. John Doe',
      department_id: 5, // General Medicine
      qualification: 'MBBS, MD',
      specialty: 'Internal Medicine',
      registration_number: 'MC12345',
      consultation_fee: 500.00,
      phone: '9876543210',
      email: 'doctor@hims.com',
      status: 'Active'
    });

    // 5. Seed Patients
    const patient1 = await Patient.create({
      name: 'Alice Smith',
      age: 28,
      gender: 'Female',
      phone: '8765432109',
      address: '123 Main St, New York',
      blood_group: 'O+',
      emergency_contact: 'Bob Smith (9876543211)'
    });

    const patient2 = await Patient.create({
      name: 'Bob Johnson',
      age: 45,
      gender: 'Male',
      phone: '7654321098',
      address: '456 Elm St, San Francisco',
      blood_group: 'A-',
      emergency_contact: 'Carol Johnson (8765432101)'
    });

    // 6. Seed Medicines
    const med1 = await Medicine.create({
      name: 'Paracetamol 650mg',
      batch_number: 'PM8812',
      quantity: 150,
      expiry_date: '2027-12-31',
      purchase_price: 1.50,
      selling_price: 3.00,
      min_stock_level: 20
    });

    const med2 = await Medicine.create({
      name: 'Amoxicillin 500mg',
      batch_number: 'AX9904',
      quantity: 8,
      expiry_date: '2027-11-30',
      purchase_price: 5.00,
      selling_price: 10.00,
      min_stock_level: 15
    });

    const med3 = await Medicine.create({
      name: 'Ibuprofen 400mg',
      batch_number: 'IB4402',
      quantity: 80,
      expiry_date: '2027-04-15',
      purchase_price: 2.00,
      selling_price: 4.50,
      min_stock_level: 25
    });

    // 7. Seed MedicineStock
    await MedicineStock.create({
      medicine_id: med1.id,
      transaction_type: 'IN',
      quantity: 150,
      notes: 'Initial Stocking'
    });

    await MedicineStock.create({
      medicine_id: med2.id,
      transaction_type: 'IN',
      quantity: 8,
      notes: 'Initial Stocking'
    });

    await MedicineStock.create({
      medicine_id: med3.id,
      transaction_type: 'IN',
      quantity: 80,
      notes: 'Initial Stocking'
    });

    // 8. Seed OPD Registrations & Bills
    const opd1 = await OpdRegistration.create({
      registration_date: new Date().toISOString().split('T')[0],
      patient_id: patient1.id,
      department_id: 5,
      doctor_id: doctorProfile.id,
      visit_type: 'First Visit',
      token_number: 1,
      chief_complaint: 'Fever and cold since 3 days',
      symptoms: 'High body temperature, sneezing, headache',
      diagnosis: 'Common Flu',
      consultation_fee: 500.00,
      follow_up_required: true,
      next_visit_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Completed'
    });

    const bill1 = await Billing.create({
      opd_registration_id: opd1.id,
      patient_id: patient1.id,
      consultation_fee: 500.00,
      lab_charges: 0.00,
      medicine_charges: 60.00,
      discount: 10.00,
      tax: 25.00,
      total_amount: 575.00,
      payment_status: 'Paid'
    });

    await Payment.create({
      billing_id: bill1.id,
      amount_paid: 575.00,
      payment_mode: 'Cash',
      transaction_reference: 'CASH-001'
    });

    const opd2 = await OpdRegistration.create({
      registration_date: new Date().toISOString().split('T')[0],
      patient_id: patient2.id,
      department_id: 5,
      doctor_id: doctorProfile.id,
      visit_type: 'First Visit',
      token_number: 2,
      chief_complaint: 'Severe body aches and general fatigue',
      symptoms: 'Muscle soreness, tiredness',
      consultation_fee: 500.00,
      status: 'Active'
    });

    await Billing.create({
      opd_registration_id: opd2.id,
      patient_id: patient2.id,
      consultation_fee: 500.00,
      lab_charges: 150.00,
      medicine_charges: 0.00,
      discount: 0.00,
      tax: 32.50,
      total_amount: 682.50,
      payment_status: 'Pending'
    });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
