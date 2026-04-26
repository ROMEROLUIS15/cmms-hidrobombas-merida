require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User, Client, Equipment, ServiceReport } = require('./src/models');

const seedData = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();

    // Validar variables de entorno críticas antes de proceder
    const requiredEnv = [
      'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD',
      'SEED_TECH_EMAIL', 'SEED_TECH_PASSWORD'
    ];
    const missing = requiredEnv.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno críticas para el seed: ${missing.join(', ')}. Por favor, configúralas en el archivo .env`);
    }

    console.log('🔄 Sincronizando modelos (reset completo)...');
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada desde cero.\n');

    // ─── 1. USUARIOS ─────────────────────────────────────────────────────────
    console.log('👤 Creando usuarios...');
    const admin = await User.create({
      username: process.env.SEED_ADMIN_NAME     || 'Administrador',
      email:    process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: 'admin'
    });

    const tecnico = await User.create({
      username: process.env.SEED_TECH_NAME     || 'Técnico Hidrobombas',
      email:    process.env.SEED_TECH_EMAIL,
      password: process.env.SEED_TECH_PASSWORD,
      role: 'technician'
    });
    console.log(`  ✅ Admin: ${admin.email}`);
    console.log(`  ✅ Técnico: ${tecnico.email}\n`);

    // ─── 2. CLIENTES ─────────────────────────────────────────────────────────
    console.log('🏢 Creando clientes...');
    const clienteA = await Client.create({
      name: 'Constructora Los Andes C.A.',
      email: 'contacto@losandes.com',
      phone: '+58 212 555-1001',
      address: 'Av. Principal, Torre Norte, Piso 3, Caracas'
    });
    const clienteB = await Client.create({
      name: 'Hotel Mérida Gran Colonial',
      email: 'mantenimiento@grancolonial.com',
      phone: '+58 274 555-2002',
      address: 'Calle 25, Centro Histórico, Mérida'
    });
    const clienteC = await Client.create({
      name: 'Planta Procesadora Táchira S.A.',
      email: 'ops@pptachira.com',
      phone: '+58 276 555-3003',
      address: 'Zona Industrial, San Cristóbal, Táchira'
    });
    console.log(`  ✅ ${clienteA.name}`);
    console.log(`  ✅ ${clienteB.name}`);
    console.log(`  ✅ ${clienteC.name}\n`);

    // ─── 3. EQUIPOS ──────────────────────────────────────────────────────────
    console.log('⚙️  Creando equipos...');
    const equipos = await Equipment.bulkCreate([
      { name: 'Bomba Centrífuga Principal',     type: 'Bomba Centrífuga',       serialNumber: 'BC-001-2022',  brand: 'Grundfos',          status: 'Operativo',          clientId: clienteA.id },
      { name: 'Bomba de Presión Secundaria',    type: 'Bomba de Presión',       serialNumber: 'BP-002-2021',  brand: 'Pedrollo',          status: 'En Mantenimiento',   clientId: clienteA.id },
      { name: 'Motor Eléctrico 15HP',           type: 'Motor Eléctrico',        serialNumber: 'ME-003-2020',  brand: 'WEG',               status: 'Operativo',          clientId: clienteA.id },
      { name: 'Sistema Hidroneumático Hotel',   type: 'Sistema Hidroneumático', serialNumber: 'SH-004-2023',  brand: 'Espa',              status: 'Operativo',          clientId: clienteB.id },
      { name: 'Bomba Sumergible Pozo Profundo', type: 'Bomba Sumergible',       serialNumber: 'BSP-005-2019', brand: 'Grundfos',          status: 'Dañado',             clientId: clienteB.id },
      { name: 'Tablero de Control ATS',         type: 'Tablero Eléctrico',      serialNumber: 'TC-006-2022',  brand: 'Schneider Electric',status: 'Operativo',          clientId: clienteB.id },
      { name: 'Bomba Centrífuga Industrial',    type: 'Bomba Centrífuga',       serialNumber: 'BCI-007-2021', brand: 'Lowara',            status: 'Operativo',          clientId: clienteC.id },
      { name: 'Motor Trifásico 30HP',           type: 'Motor Eléctrico',        serialNumber: 'MT-008-2020',  brand: 'Siemens',           status: 'En Mantenimiento',   clientId: clienteC.id }
    ], { returning: true });
    console.log(`  ✅ ${equipos.length} equipos creados.\n`);

    // ─── 4. REPORTES DE SERVICIO ──────────────────────────────────────────────
    console.log('📋 Creando reportes de servicio...');
    await ServiceReport.bulkCreate([
      {
        reportNumber: 'SRV-0001',
        visitType: 'mensual',
        reportDate: '2025-01-15',
        systemName: 'Sistema Hidroneumático Torre A',
        description: 'Mantenimiento preventivo mensual completo.',
        observations: 'Sistema operando dentro de parámetros. Se lubricaron partes móviles.',
        technicianName: 'Carlos Pérez',
        clientSignatureName: 'Ing. Rafael Molina',
        waterEnergyData: JSON.stringify({
          voltage_r_s:'207', voltage_r_n:'120', voltage_s_t:'209', voltage_s_n:'121',
          voltage_t_r:'208', voltage_t_n:'120', water_level:'full',
          float_contact_na:'OK', float_contact_na_2:'OK', led_empty_tank:'OK',
          volts_min:'195', volts_max:'225', time_1:'5', time_2:'8'
        }),
        motorsData: JSON.stringify([{
          motor_hp:'5', amperage:'8.2', phase_r:'8.1', phase_s:'8.2', phase_t:'8.0',
          bobina_value:'OK', contactos_value:'OK', thermal_amp:'9',
          thermal_nc:true, thermal_no:false,
          motor_temp:'45', voluta_temp:'42', thermal_temp:'38'
        }]),
        controlData: JSON.stringify({
          breaker_tripolar_1:'OK', breaker_control:'OK',
          relay_alternator:'OK', relay_control_level:'OK',
          manometer:'40', pressure_on:'30', pressure_off:'50',
          pump_1_on_minutes:'15', pump_1_rest_minutes:'45', pump_1_noise_db:'68'
        }),
        cost: 350.00,
        equipmentId: equipos[0].id,
        userId: tecnico.id
      },
      {
        reportNumber: 'SRV-0002',
        visitType: 'eventual',
        reportDate: '2025-02-20',
        systemName: 'Bomba Secundaria — Planta Baja',
        description: 'Falla en sello mecánico. Reemplazo y prueba hidrostática.',
        observations: 'Bomba en período de observación por 2 semanas. Monitorear fugas.',
        technicianName: 'Carlos Pérez',
        clientSignatureName: 'Sra. María González',
        waterEnergyData: JSON.stringify({
          voltage_r_s:'210', voltage_s_t:'211', voltage_t_r:'209', water_level:'medium',
          float_contact_na:'Falla', float_contact_na_2:'OK'
        }),
        motorsData: JSON.stringify([{
          motor_hp:'3', amperage:'5.8', phase_r:'5.7', phase_s:'5.9', phase_t:'5.8',
          motor_temp:'48', voluta_temp:'44', thermal_temp:'40'
        }]),
        cost: 520.00,
        equipmentId: equipos[1].id,
        userId: tecnico.id
      },
      {
        reportNumber: 'SRV-0003',
        visitType: 'mensual',
        reportDate: '2025-03-10',
        systemName: 'Sala de Máquinas — Motor Principal',
        description: 'Revisión de motores eléctricos. Medición Megger y corrientes de fase.',
        observations: 'Motores en buen estado. Valores dentro del rango nominal.',
        technicianName: 'Carlos Pérez',
        waterEnergyData: JSON.stringify({
          voltage_r_s:'205', voltage_s_t:'206', voltage_t_r:'204', water_level:'full',
          volts_min:'195', volts_max:'230'
        }),
        motorsData: JSON.stringify([
          {
            motor_hp:'10', amperage:'16.5', phase_r:'16.3', phase_s:'16.5', phase_t:'16.4',
            bobina_value:'OK', contactos_value:'OK', thermal_amp:'18',
            motor_temp:'52', voluta_temp:'49', thermal_temp:'44'
          },
          {
            motor_hp:'10', amperage:'16.2', phase_r:'16.0', phase_s:'16.3', phase_t:'16.2',
            bobina_value:'OK', contactos_value:'Revisar',
            motor_temp:'50', voluta_temp:'47', thermal_temp:'42'
          }
        ]),
        controlData: JSON.stringify({
          breaker_tripolar_1:'OK', breaker_tripolar_2:'OK', breaker_control:'OK',
          relay_alternator:'OK', manometer:'38', pressure_on:'28', pressure_off:'48'
        }),
        cost: 180.00,
        equipmentId: equipos[2].id,
        userId: tecnico.id
      },
      {
        reportNumber: 'SRV-0004',
        visitType: 'eventual',
        reportDate: '2025-03-25',
        systemName: 'Pozo Profundo #3 — Bomba Sumergible',
        description: 'Diagnóstico. Impulsor desgastado y cable dañado por corrosión.',
        observations: 'Requiere reemplazo urgente de impulsor y cable sumergible. Presupuesto pendiente.',
        technicianName: 'Luis Romero',
        cost: 200.00,
        equipmentId: equipos[4].id,
        userId: admin.id
      },
      {
        reportNumber: 'SRV-0005',
        visitType: 'mensual',
        reportDate: '2025-04-05',
        systemName: 'Sistema Hidroneumático Hotel Mérida',
        description: 'Mantenimiento preventivo. Presión tanque membrana, presostato y filtros.',
        observations: 'Sistema OK. Reemplazar tanque membrana en próximo mantenimiento anual.',
        technicianName: 'Carlos Pérez',
        clientSignatureName: 'Gerencia Hotel Mérida Gran Colonial',
        waterEnergyData: JSON.stringify({
          voltage_r_s:'208', voltage_s_t:'209', voltage_t_r:'207',
          water_level:'full', volts_min:'195', volts_max:'230',
          float_contact_na:'OK', float_contact_na_2:'OK', led_empty_tank:'OK'
        }),
        motorsData: JSON.stringify([{
          motor_hp:'7.5', amperage:'12.1', phase_r:'12.0', phase_s:'12.2', phase_t:'12.1',
          bobina_value:'OK', contactos_value:'OK',
          motor_temp:'47', voluta_temp:'44', thermal_temp:'39'
        }]),
        controlData: JSON.stringify({
          breaker_tripolar_1:'OK', breaker_tripolar_2:'OK', breaker_control:'OK',
          relay_alternator:'OK', relay_control_level:'OK',
          manometer:'45', pressure_on:'30', pressure_off:'50',
          compressor_oil:'OK', compressor_belt:'OK',
          pump_1_on_minutes:'12', pump_1_rest_minutes:'48', pump_1_noise_db:'65',
          pump_2_on_minutes:'10', pump_2_rest_minutes:'50', pump_2_noise_db:'64'
        }),
        cost: 290.00,
        equipmentId: equipos[3].id,
        userId: admin.id
      }
    ]);
    console.log(`  ✅ 5 reportes de servicio creados.\n`);

    console.log('🎉 ¡Base de datos cargada exitosamente con datos de prueba!');
    console.log('──────────────────────────────────────────────────');
    console.log('📊 Resumen:');
    console.log('   👤 2 Usuarios (1 Admin, 1 Técnico)');
    console.log('   🏢 3 Clientes');
    console.log('   ⚙️  8 Equipos');
    console.log('   📋 5 Reportes de Servicio (con datos técnicos completos)');
    console.log('──────────────────────────────────────────────────');
    console.log('🔑 Credenciales de acceso configuradas en .env (variables SEED_*)');
    console.log('──────────────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
};

seedData();
