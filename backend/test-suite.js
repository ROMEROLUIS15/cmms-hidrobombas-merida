/**
 * CMMS Testing Suite - JavaScript Only
 * Reemplaza completamente el testing de Python
 */

const axios = require('axios');

const BASE_URL = 'https://cmms-hydro-1.preview.emergentagent.com/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class CMSSTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
    this.testToken = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async test(name, testFn) {
    this.total++;
    try {
      this.log(`\n🧪 Testing: ${name}`, 'blue');
      await testFn();
      this.passed++;
      this.log(`✅ PASSED: ${name}`, 'green');
    } catch (error) {
      this.failed++;
      this.log(`❌ FAILED: ${name}`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
    }
  }

  async runAllTests() {
    this.log('\n🚀 CMMS Backend Testing Suite - JavaScript Only', 'bold');
    this.log('================================================', 'bold');

    // Test 1: Health Check
    await this.test('Health Check', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      if (response.status !== 200) throw new Error('Health check failed');
      if (!response.data.success) throw new Error('Health check returned error');
      this.log(`   📊 Response: ${response.data.message}`, 'blue');
    });

    // Test 2: User Registration
    await this.test('User Registration', async () => {
      const testEmail = `test${Date.now()}@example.com`;
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        email: testEmail,
        password: 'testpassword123',
        role: 'technician'
      });
      
      if (response.status !== 201) throw new Error('Registration failed');
      if (!response.data.success) throw new Error('Registration returned error');
      if (!response.data.token) throw new Error('No token returned');
      if (!response.data.user) throw new Error('No user data returned');
      
      this.testToken = response.data.token;
      this.testEmail = testEmail;
      this.log(`   👤 User created: ${testEmail}`, 'blue');
      this.log(`   🎫 Token received: ${response.data.token.substring(0, 20)}...`, 'blue');
    });

    // Test 3: User Login
    await this.test('User Login', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: this.testEmail,
        password: 'testpassword123'
      });
      
      if (response.status !== 200) throw new Error('Login failed');
      if (!response.data.success) throw new Error('Login returned error');
      if (!response.data.token) throw new Error('No token returned');
      if (!response.data.user.full_name) throw new Error('No full_name in user data');
      
      this.log(`   👤 Logged in as: ${response.data.user.full_name}`, 'blue');
      this.log(`   🎫 Token: ${response.data.token.substring(0, 20)}...`, 'blue');
    });

    // Test 4: Login with Wrong Password
    await this.test('Login with Wrong Password', async () => {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          email: this.testEmail,
          password: 'wrongpassword'
        });
        throw new Error('Should have failed with wrong password');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.log(`   🔒 Correctly rejected wrong password`, 'blue');
        } else {
          throw error;
        }
      }
    });

    // Test 5: Login with Non-existent User
    await this.test('Login with Non-existent User', async () => {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'password123'
        });
        throw new Error('Should have failed with non-existent user');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.log(`   👻 Correctly rejected non-existent user`, 'blue');
        } else {
          throw error;
        }
      }
    });

    // Test 6: Token Validation
    await this.test('Token Validation', async () => {
      const response = await axios.get(`${BASE_URL}/auth/check`, {
        headers: {
          'Authorization': `Bearer ${this.testToken}`
        }
      });
      
      if (response.status !== 200) throw new Error('Token validation failed');
      if (!response.data.success) throw new Error('Token validation returned error');
      if (!response.data.user) throw new Error('No user data returned');
      
      this.log(`   🎫 Token is valid for: ${response.data.user.email}`, 'blue');
    });

    // Test 7: Forgot Password
    await this.test('Forgot Password', async () => {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: this.testEmail
      });
      
      if (response.status !== 200) throw new Error('Forgot password failed');
      if (!response.data.success) throw new Error('Forgot password returned error');
      
      this.resetToken = response.data.resetToken; // Solo en desarrollo
      this.log(`   📧 Password reset requested for: ${this.testEmail}`, 'blue');
      if (this.resetToken) {
        this.log(`   🎫 Reset token: ${this.resetToken.substring(0, 20)}...`, 'blue');
      }
    });

    // Test 8: Reset Password (si tenemos token)
    if (this.resetToken) {
      await this.test('Reset Password', async () => {
        const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
          token: this.resetToken,
          newPassword: 'newpassword123'
        });
        
        if (response.status !== 200) throw new Error('Password reset failed');
        if (!response.data.success) throw new Error('Password reset returned error');
        
        this.log(`   🔑 Password reset successful`, 'blue');
      });

      // Test 9: Login with New Password
      await this.test('Login with New Password', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: this.testEmail,
          password: 'newpassword123'
        });
        
        if (response.status !== 200) throw new Error('Login with new password failed');
        if (!response.data.success) throw new Error('Login returned error');
        
        this.log(`   🔑 Login successful with new password`, 'blue');
      });
    }

    // Test 10: Dashboard Stats
    await this.test('Dashboard Stats', async () => {
      const response = await axios.get(`${BASE_URL}/dashboard/stats`);
      
      if (response.status !== 200) throw new Error('Dashboard stats failed');
      if (!response.data.success) throw new Error('Dashboard stats returned error');
      if (typeof response.data.stats.totalUsers !== 'number') throw new Error('Invalid stats format');
      
      this.log(`   📊 Total users: ${response.data.stats.totalUsers}`, 'blue');
    });

    // Final Results
    this.log('\n📊 TESTING RESULTS', 'bold');
    this.log('==================', 'bold');
    this.log(`✅ Passed: ${this.passed}`, 'green');
    this.log(`❌ Failed: ${this.failed}`, 'red');
    this.log(`📊 Total:  ${this.total}`, 'blue');
    
    const percentage = Math.round((this.passed / this.total) * 100);
    const color = percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red';
    this.log(`🎯 Success Rate: ${percentage}%`, color);

    if (this.failed === 0) {
      this.log('\n🎉 ALL TESTS PASSED! Backend is working perfectly!', 'green');
    } else {
      this.log(`\n⚠️  ${this.failed} test(s) failed. Check the errors above.`, 'yellow');
    }
  }
}

// Ejecutar tests
const tester = new CMSSTester();
tester.runAllTests().catch(error => {
  console.error('❌ Testing suite failed:', error);
  process.exit(1);
});