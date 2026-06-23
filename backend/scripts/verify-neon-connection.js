/**
 * Script temporal para verificar la conexión a Neon Postgres.
 * Usa @neondatabase/serverless (WebSocket/HTTPS) — funciona con VPN/firewalls.
 */
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Leer DATABASE_URL desde .env.local
const envLocalPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const match = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (!match) {
  console.error('No se encontró DATABASE_URL en .env.local');
  process.exit(1);
}
const databaseUrl = match[1];

const parsedUrl = new URL(databaseUrl);
console.log('Conectando vía WebSocket a:', parsedUrl.hostname);

(async () => {
  try {
    const sql = neon(databaseUrl);
    const result = await sql`SELECT 1 AS ok, version() AS pg_version`;
    console.log('✅ Conexión exitosa a Neon Postgres!');
    console.log('   ok:', result[0].ok);
    console.log('   pg_version:', result[0].pg_version);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
