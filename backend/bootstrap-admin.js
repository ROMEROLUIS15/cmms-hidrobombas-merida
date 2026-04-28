require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function bootstrap() {
  console.log('\n======================================================');
  console.log('🚀 CONFIGURACIÓN INICIAL DEL ADMINISTRADOR');
  console.log('   Use este script solo para crear el primer acceso.');
  console.log('======================================================\n');

  try {
    await sequelize.authenticate();
    
    const username = await question('1. Nombre completo del Administrador: ');
    const email = await question('2. Correo electrónico (ej: admin@gmail.com): ');
    const password = await question('3. Contraseña segura: ');
    
    console.log('\nCreando cuenta de Administrador...');
    
    await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isActive: true
    });

    console.log('\n✅ ¡ADMINISTRADOR CREADO EXITOSAMENTE!');
    console.log('Ya puede cerrar esta terminal e ingresar desde la web.');
    
  } catch (e) {
    console.error('\n❌ ERROR:', e.message);
  }
  process.exit(0);
}

bootstrap();
