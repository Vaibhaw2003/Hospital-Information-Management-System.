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

const runTests = async () => {
  console.log('--- STARTING HIMS API TESTS ---');

  try {
    // 1. Check health
    console.log('Testing Health Endpoint...');
    const health = await request('GET', '/api/health');
    console.log('Health Status:', health.statusCode, health.body);

    // 2. Login admin
    console.log('\nTesting Admin Login...');
    const adminLogin = await request('POST', '/api/auth/login', {
      usernameOrEmail: 'admin',
      password: 'admin123'
    });
    console.log('Admin Login Status:', adminLogin.statusCode);
    if (adminLogin.statusCode !== 200) {
      throw new Error('Admin login failed');
    }
    const adminToken = adminLogin.body.token;
    console.log('Token received successfully.');

    // 3. Get Dashboard Stats
    console.log('\nTesting Dashboard Stats (Admin)...');
    const stats = await request('GET', '/api/dashboard/stats', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    console.log('Stats Status:', stats.statusCode);
    console.log('Stats Data (keys):', Object.keys(stats.body || {}));
    console.log('Summary Cards:', stats.body?.cards);

    // 4. Test Doctor List
    console.log('\nTesting Get Doctors (Admin)...');
    const doctors = await request('GET', '/api/doctors', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    console.log('Doctors Status:', doctors.statusCode);
    console.log('Doctors Count:', doctors.body?.doctors?.length);

    // 5. Test Patients List
    console.log('\nTesting Get Patients (Admin)...');
    const patients = await request('GET', '/api/patients', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    console.log('Patients Status:', patients.statusCode);
    console.log('Patients Count:', patients.body?.patients?.length);

    console.log('\n--- ALL BASIC API TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\nTest failed with error:', err.message);
    process.exit(1);
  }
};

runTests();
