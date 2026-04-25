const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'cmms_user',
    password: 'cmms_pass',
    database: 'cmms_db',
  });

  try {
    await client.connect();
    console.log('✅ Connection successful');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query result:', result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();