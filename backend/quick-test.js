/**
 * Quick Test Script - CMMS Backend
 * Prueba rápida de todas las funcionalidades críticas
 */

const axios = require('axios');

const BASE_URL = 'https://cmms-hydro-1.preview.emergentagent.com/api';

async function quickTest() {
  console.log('🚀 QUICK TEST - CMMS Backend\n');

  try {
    // 1. Health Check
    console.log('1. Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ Health: ${health.data.message}\n`);

    // 2. Registration
    console.log('2. Testing Registration...');
    const testEmail = `quicktest${Date.now()}@example.com`;
    const register = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'quicktest123',
      role: 'technician'
    });
    console.log(`   ✅ User registered: ${testEmail}`);
    console.log(`   ✅ User name: ${register.data.user.fullName}\n`);

    // 3. Login
    console.log('3. Testing Login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'quicktest123'
    });
    console.log(`   ✅ Login successful: ${login.data.user.full_name}`);
    console.log(`   ✅ Token received: ${login.data.token.substring(0, 20)}...\n`);

    // 4. Forgot Password
    console.log('4. Testing Forgot Password...');
    const forgot = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail
    });
    console.log(`   ✅ Password reset requested`);
    
    // 5. Token Check
    console.log('5. Testing Token Validation...');
    const check = await axios.get(`${BASE_URL}/auth/check`, {
      headers: { 'Authorization': `Bearer ${login.data.token}` }
    });
    console.log(`   ✅ Token valid for: ${check.data.user.email}\n`);

    console.log('🎉 ALL QUICK TESTS PASSED!\n');
    console.log('📧 Check server logs for simulated emails:');
    console.log('   cd /app/backend && tail -n 20 login-server.log\n');

  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

quickTest();