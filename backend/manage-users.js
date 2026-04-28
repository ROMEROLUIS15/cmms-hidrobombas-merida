require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Función para validar formato de email
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function main() {
  console.log('\n======================================================');
  console.log('🛡️  SISTEMA DE SEGURIDAD Y GESTIÓN DE USUARIOS');
  console.log('   HIDROBOMBAS MÉRIDA - ASISTENTE ADMINISTRATIVO');
  console.log('======================================================\n');

  console.log('Seleccione la acción que desea realizar:');
  console.log('1. 📋 VER LISTA: Ver quiénes tienen acceso y si están activos.');
  console.log('2. ➕ CREAR NUEVO: Registrar un nuevo administrador o técnico.');
  console.log('3. ✅ DAR ACCESO: Activar a un usuario que se registró en la web.');
  console.log('4. 🚫 QUITAR ACCESO: Desactivar a un usuario temporal o permanentemente.');
  console.log('5. 🚪 SALIR');

  const opcion = await question('\nEscriba el número de su opción (1-5): ');

  switch (opcion) {
    case '1': await listarUsuarios(); break;
    case '2': await crearUsuario(); break;
    case '3': await cambiarEstado(true); break;
    case '4': await cambiarEstado(false); break;
    case '5': process.exit(0); break;
    default:
      console.log('\n❌ Opción no válida. Por favor, intente de nuevo.');
      process.exit(0);
  }
}

async function listarUsuarios() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ order: [['username', 'ASC']] });
    console.log('\n--- 👥 USUARIOS REGISTRADOS EN EL SISTEMA ---');
    if (users.length === 0) {
      console.log('No hay usuarios registrados aún.');
    } else {
      console.table(users.map(u => ({
        'Nombre Completo': u.username,
        'Correo Electrónico': u.email,
        'Rol asignado': u.role.toUpperCase(),
        'Estado de Acceso': u.isActive ? 'ACTIVO (Puede entrar) ✅' : 'INACTIVO (Bloqueado) ❌'
      })));
    }
  } catch (e) { console.error('\n❌ Error de conexión:', e.message); }
  process.exit(0);
}

async function crearUsuario() {
  try {
    console.log('\n--- ➕ REGISTRO DE NUEVO USUARIO ---');
    
    const username = await question('1. Escriba el nombre completo del usuario: ');

    // Validación de Email con doble entrada
    let email, emailConfirm;
    while (true) {
      email = await question('2. Escriba el correo electrónico: ');
      if (!validarEmail(email)) {
        console.log('   ⚠️ Error: El formato del correo no es válido. Intente de nuevo.');
        continue;
      }
      emailConfirm = await question('3. Confirme el correo electrónico (escríbalo de nuevo): ');
      if (email.toLowerCase() !== emailConfirm.toLowerCase()) {
        console.log('   ⚠️ Error: Los correos no coinciden. Verifique bien los datos.');
        continue;
      }
      break;
    }

    // Validación de Contraseña con doble entrada
    let password, passwordConfirm;
    while (true) {
      password = await question('4. Escriba la contraseña de acceso: ');
      if (password.length < 6) {
        console.log('   ⚠️ Error: La contraseña debe tener al menos 6 caracteres por seguridad.');
        continue;
      }
      passwordConfirm = await question('5. Confirme la contraseña (escríbala de nuevo): ');
      if (password !== passwordConfirm) {
        console.log('   ⚠️ Error: Las contraseñas no coinciden. Intente de nuevo.');
        continue;
      }
      break;
    }

    console.log('\nRoles: admin (Control total), technician (Solo reportes), supervisor (Reportes + Edición)');
    const role = await question('6. Seleccione el rol (presione Enter para "technician"): ') || 'technician';

    await sequelize.authenticate();
    await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role,
      isActive: true
    });
    
    console.log('\n======================================================');
    console.log('✅ ¡USUARIO CREADO CON ÉXITO!');
    console.log(`El usuario ${email} ya puede ingresar al sistema.`);
    console.log('======================================================');
  } catch (e) { 
    console.error('\n❌ ERROR AL CREAR USUARIO:', e.message); 
  }
  process.exit(0);
}

async function cambiarEstado(nuevoEstado) {
  try {
    const accion = nuevoEstado ? 'ACTIVAR (DAR ACCESO)' : 'DESACTIVAR (QUITAR ACCESO)';
    console.log(`\n--- 🛡️  PROCEDIMIENTO PARA ${accion} ---`);
    
    const email = await question('Escriba el correo electrónico del usuario: ');
    
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      console.log('\n❌ ERROR: No se encontró ningún usuario con ese correo.');
      process.exit(0);
    }

    console.log(`\nUsuario encontrado: ${user.username} (${user.role})`);
    const confirmar = await question(`¿Está seguro que desea ${nuevoEstado ? 'darle' : 'quitarle'} el acceso? (s/n): `);

    if (confirmar.toLowerCase() === 's') {
      await user.update({ isActive: nuevoEstado });
      console.log(`\n✅ ¡LISTO! El acceso de ${email} ha sido ${nuevoEstado ? 'HABILITADO' : 'REVOCADO'}.`);
    } else {
      console.log('\nOperación cancelada por el administrador.');
    }
  } catch (e) { console.error('\n❌ Error:', e.message); }
  process.exit(0);
}

main();
