const http = require('http');

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runIntegrationTest = async () => {
  console.log('--- STARTING HIMS E2E INTEGRATION TEST ---');

  try {
    // 1. LOGIN RECEPTIONIST
    console.log('\n[Step 1] Logging in as Receptionist...');
    const recepLogin = await request('POST', '/api/auth/login', {
      usernameOrEmail: 'receptionist',
      password: 'recep123'
    });
    if (recepLogin.statusCode !== 200) {
      throw new Error(`Receptionist login failed: ${JSON.stringify(recepLogin.body)}`);
    }
    const recepToken = recepLogin.body.token;
    console.log('Receptionist logged in successfully.');

    // 2. REGISTER A PATIENT
    console.log('\n[Step 2] Registering a new patient...');
    const patientData = {
      name: 'Integration Test Patient',
      age: 30,
      gender: 'Male',
      phone: '9999988888',
      address: '789 Testing Lane, Silicon Valley',
      blood_group: 'AB+',
      emergency_contact: 'Jane Test (9999977777)'
    };
    const regPatient = await request('POST', '/api/patients', patientData, {
      'Authorization': `Bearer ${recepToken}`
    });
    if (regPatient.statusCode !== 201) {
      throw new Error(`Patient registration failed: ${JSON.stringify(regPatient.body)}`);
    }
    const patient = regPatient.body.patient;
    console.log(`Registered Patient. ID: ${patient.id}, Custom ID: ${patient.patient_id}`);

    // 3. CREATE OPD REGISTRATION
    console.log('\n[Step 3] Registering patient in OPD Queue...');
    const opdData = {
      patient_id: patient.id,
      department_id: 5, // General Medicine
      doctor_id: 1, // Dr. John Doe
      visit_type: 'First Visit',
      chief_complaint: 'Dry cough and sore throat for 5 days',
      symptoms: 'Mild fever, throat pain',
      consultation_fee: 500.00
    };
    const regOpd = await request('POST', '/api/opd', opdData, {
      'Authorization': `Bearer ${recepToken}`
    });
    if (regOpd.statusCode !== 201) {
      throw new Error(`OPD registration failed: ${JSON.stringify(regOpd.body)}`);
    }
    const opd = regOpd.body.opd;
    console.log(`Registered OPD entry. ID: ${opd.id}, OPD Num: ${opd.opd_number}, Token: ${opd.token_number}`);

    // 4. LOGIN DOCTOR
    console.log('\n[Step 4] Logging in as Doctor...');
    const docLogin = await request('POST', '/api/auth/login', {
      usernameOrEmail: 'doctor',
      password: 'doctor123'
    });
    if (docLogin.statusCode !== 200) {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLogin.body)}`);
    }
    const docToken = docLogin.body.token;
    console.log('Doctor logged in successfully.');

    // 5. DOCTOR PRESCRIBES MEDICINE
    console.log('\n[Step 5] Creating prescription as Doctor...');
    const prescriptionData = {
      opd_registration_id: opd.id,
      patient_id: patient.id,
      notes: 'Take medicines after meals. Warm water gargles.',
      items: [
        {
          medicine_id: 1, // Paracetamol 650mg
          dosage: '1 tablet',
          frequency: 'Three times a day',
          duration: '5 days',
          quantity: 10
        },
        {
          medicine_id: 3, // Ibuprofen 400mg
          dosage: '1 tablet',
          frequency: 'Twice a day',
          duration: '3 days',
          quantity: 5
        }
      ]
    };
    const makePrescription = await request('POST', '/api/prescriptions', prescriptionData, {
      'Authorization': `Bearer ${docToken}`
    });
    if (makePrescription.statusCode !== 201) {
      throw new Error(`Prescription creation failed: ${JSON.stringify(makePrescription.body)}`);
    }
    const prescription = makePrescription.body.prescription;
    console.log(`Prescription created. ID: ${prescription.id}`);

    // 6. LOGIN PHARMACIST
    console.log('\n[Step 6] Logging in as Pharmacist...');
    const pharmaLogin = await request('POST', '/api/auth/login', {
      usernameOrEmail: 'pharmacist',
      password: 'pharma123'
    });
    if (pharmaLogin.statusCode !== 200) {
      throw new Error(`Pharmacist login failed: ${JSON.stringify(pharmaLogin.body)}`);
    }
    const pharmaToken = pharmaLogin.body.token;
    console.log('Pharmacist logged in successfully.');

    // 7. PHARMACIST DISPENSES PRESCRIPTION
    console.log('\n[Step 7] Dispensing medicines as Pharmacist...');
    const dispense = await request('POST', `/api/prescriptions/${prescription.id}/dispense`, null, {
      'Authorization': `Bearer ${pharmaToken}`
    });
    if (dispense.statusCode !== 200) {
      throw new Error(`Prescription dispense failed: ${JSON.stringify(dispense.body)}`);
    }
    console.log('Medicines dispensed successfully. Inventory and billing updated.');

    // 8. LOGIN RECEPTIONIST & GET BILLING FOR OPD
    console.log('\n[Step 8] Receptionist reviews and updates billing...');
    // Find the bill generated for the OPD entry
    const opdDetails = await request('GET', `/api/opd/${opd.id}`, null, {
      'Authorization': `Bearer ${recepToken}`
    });
    if (opdDetails.statusCode !== 200) {
      throw new Error(`Failed to fetch OPD details: ${JSON.stringify(opdDetails.body)}`);
    }
    const bill = opdDetails.body.opd.billing;
    console.log(`Found billing. ID: ${bill.id}, Consultation Fee: ${bill.consultation_fee}, Medicine Charges: ${bill.medicine_charges}, Total: ${bill.total_amount}, Status: ${bill.payment_status}`);

    // Update billing: add lab charges and apply discount
    console.log('Updating charges (Adding Lab Charges = 150.00, Discount = 30.00)...');
    const updateBill = await request('PUT', `/api/billing/${bill.id}`, {
      lab_charges: 150.00,
      discount: 30.00
    }, {
      'Authorization': `Bearer ${recepToken}`
    });
    if (updateBill.statusCode !== 200) {
      throw new Error(`Billing update failed: ${JSON.stringify(updateBill.body)}`);
    }
    const updatedInvoice = updateBill.body.billing;
    console.log(`Updated Invoice. New Total: ${updatedInvoice.total_amount}`);

    // Collect full payment
    console.log(`Collecting full payment of ${updatedInvoice.total_amount}...`);
    const collectPay = await request('POST', `/api/billing/${bill.id}/payments`, {
      amount_paid: updatedInvoice.total_amount,
      payment_mode: 'Card',
      transaction_reference: 'TXN-INTEG-999'
    }, {
      'Authorization': `Bearer ${recepToken}`
    });
    if (collectPay.statusCode !== 200) {
      throw new Error(`Payment collection failed: ${JSON.stringify(collectPay.body)}`);
    }
    console.log('Payment collected. Invoice status updated to:', collectPay.body.billing.payment_status);

    // 9. VERIFY INVENTORY LEVELS
    console.log('\n[Step 9] Verifying medicine inventory levels...');
    const inventory = await request('GET', '/api/inventory', null, {
      'Authorization': `Bearer ${pharmaToken}`
    });
    if (inventory.statusCode !== 200) {
      throw new Error(`Failed to fetch inventory: ${JSON.stringify(inventory.body)}`);
    }
    const medicines = inventory.body.medicines;
    const paracetamol = medicines.find(m => m.id === 1);
    const ibuprofen = medicines.find(m => m.id === 3);

    console.log(`Paracetamol stock count: ${paracetamol.quantity} (Expected: 140)`);
    console.log(`Ibuprofen stock count: ${ibuprofen.quantity} (Expected: 75)`);

    if (paracetamol.quantity !== 140 || ibuprofen.quantity !== 75) {
      throw new Error('Inventory deduction does not match expected values.');
    }

    console.log('\n--- ALL E2E INTEGRATION FLOW STEPS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\nE2E Integration Test failed with error:', error.message);
    process.exit(1);
  }
};

runIntegrationTest();
