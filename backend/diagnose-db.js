#!/usr/bin/env node

/**
 * 🔍 Script para diagnosticar conexión a base de datos
 * 
 * Uso:
 *   node diagnose-db.js
 * 
 * Verifica:
 * - Disponibilidad de DATABASE_URL
 * - Conectividad a Neon
 * - Fallback a SQLite
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function diagnoseDatabase() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       🔍 DATABASE CONNECTION DIAGNOSTIC                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check environment
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isVercel = process.env.VERCEL === '1';

  console.log('📋 Environment Info:');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   VERCEL: ${isVercel ? 'Yes' : 'No'}`);
  console.log(`   DATABASE_URL: ${databaseUrl ? '✅ Present' : '❌ Missing'}`);
  
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      console.log(`   DB Host: ${url.hostname}`);
      console.log(`   DB Port: ${url.port || 5432}`);
      console.log(`   DB Name: ${url.pathname.replace(/^\//, '')}`);
      console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'default'}`);
    } catch (e) {
      console.log('   ⚠️ DATABASE_URL format appears invalid');
    }
  }

  console.log('\n🔗 Testing Connection...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database Connection: SUCCESS');
    console.log(`   Dialect: ${sequelize.options.dialect.toUpperCase()}`);
    
    if (sequelize.options.dialect === 'postgres') {
      console.log('   Type: PostgreSQL (Neon)');
    } else if (sequelize.options.dialect === 'sqlite') {
      console.log(`   Type: SQLite`);
      console.log(`   Storage: ${sequelize.options.storage}`);
    }
    
    console.log('\n✅ All checks passed! Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Connection: FAILED');
    console.error(`   Error: ${error.message}`);
    
    if (databaseUrl && error.message.includes('ECONNRESET')) {
      console.error('\n⚠️  ECONNRESET detected:');
      console.error('   - Credentials may have expired');
      console.error('   - Connection pool may be closed');
      console.error('   - Network connectivity issue\n');
      console.error('🔧 Solutions:');
      console.error('   1. Regenerate DATABASE_URL from Neon Console');
      console.error('   2. Remove channel_binding=require from URL');
      console.error('   3. For local dev, comment out DATABASE_URL in .env\n');
    }
    
    process.exit(1);
  }
}

diagnoseDatabase();
