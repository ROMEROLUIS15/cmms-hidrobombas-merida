require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

const addTechnician = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();

    const email = 'lueduar15@gmail.com';
    const password = 'tecnico123';
    const username = 'Luis Eduardo (Técnico)';

    console.log(`👤 Buscando si el usuario ${email} ya existe...`);
    let user = await User.findOne({ where: { email } });

    if (user) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña y rol...');
      user.password = password;
      user.role = 'technician';
      user.username = username;
      await user.save();
      console.log('✅ Usuario actualizado con éxito.');
    } else {
      console.log('✨ Creando nuevo técnico...');
      user = await User.create({
        username,
        email,
        password,
        role: 'technician'
      });
      console.log('✅ Usuario creado con éxito.');
    }

    console.log('\n🔑 Datos de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addTechnician();
