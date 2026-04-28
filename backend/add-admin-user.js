require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

const addAdmin = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();

    const email = 'hidrobombasmerida@gmail.com';
    const password = 'admin123';
    const username = 'Admin Hidrobombas';

    console.log(`👤 Buscando si el usuario ${email} ya existe...`);
    let user = await User.findOne({ where: { email } });

    if (user) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña y rol...');
      user.password = password;
      user.role = 'admin';
      user.username = username;
      await user.save();
      console.log('✅ Usuario actualizado con éxito.');
    } else {
      console.log('✨ Creando nuevo usuario administrador...');
      user = await User.create({
        username,
        email,
        password,
        role: 'admin'
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

addAdmin();
