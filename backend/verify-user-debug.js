require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

const verifyUser = async () => {
  try {
    await sequelize.authenticate();
    const email = 'lueduar15@gmail.com';
    const rawPassword = 'tecnico123';

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ Usuario no encontrado en la DB');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(rawPassword, user.password);
    console.log(`🔍 Usuario: ${user.email}`);
    console.log(`🔍 Rol: ${user.role}`);
    console.log(`🔍 ¿Contraseña válida?: ${isValid ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`🔍 Hash en DB: ${user.password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyUser();
