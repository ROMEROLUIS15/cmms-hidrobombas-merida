require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User, Client, Equipment, ServiceReport } = require('./src/models');

const checkData = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.\n');

    console.log('👥 USUARIOS REGISTRADOS:');
    const users = await User.findAll({ attributes: ['id', 'username', 'email', 'role'] });
    if (users.length === 0) {
      console.log('   (No hay usuarios registrados)');
    } else {
      users.forEach(u => {
        console.log(`   - [${u.role.toUpperCase()}] ${u.username} (${u.email})`);
      });
    }

    console.log('\n🏢 CLIENTES:');
    const clients = await Client.findAll({ attributes: ['id', 'name'] });
    if (clients.length === 0) {
      console.log('   (No hay clientes registrados)');
    } else {
      clients.forEach(c => console.log(`   - ${c.name}`));
    }

    console.log('\n⚙️  EQUIPOS (Total):', await Equipment.count());
    console.log('📋 REPORTES (Total):', await ServiceReport.count());

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error.message);
    process.exit(1);
  }
};

checkData();
