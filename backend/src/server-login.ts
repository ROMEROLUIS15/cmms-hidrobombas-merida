import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

const app = express();

// Middlewares
app.use(cors({
  origin: ['https://cmms-hydro-1.preview.emergentagent.com', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Database connection
const dbClient = new Client({
  host: 'localhost',
  port: 5432,
  user: 'cmms_user',
  password: 'cmms_pass',
  database: 'cmms_db',
});

// JWT Secret
const JWT_SECRET = 'cmms-super-secret-jwt-key-hidrobombas-2024';

// Connect to database
dbClient.connect()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => console.error('❌ PostgreSQL connection failed:', err));

// Validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Hash password helper for testing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password helper
async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Generate JWT token
function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CMMS Backend - Login Fixed',
    timestamp: new Date().toISOString(),
    database: 'postgresql',
  });
});

// ENDPOINT LOGIN CORREGIDO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. VALIDACIONES DE INPUT
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido',
        code: 'EMAIL_REQUIRED'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Contraseña es requerida',
        code: 'PASSWORD_REQUIRED'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    console.log(`🔍 Login attempt for: ${email}`);

    // 2. BUSCAR USUARIO EN BASE DE DATOS
    const userQuery = 'SELECT id, email, password_hash, full_name, role, is_email_verified, is_active FROM users WHERE email = $1';
    const userResult = await dbClient.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'Usuario no registrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // 3. VERIFICAR USUARIO ACTIVO
    if (!user.is_active) {
      console.log(`❌ User inactive: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacta al administrador',
        code: 'USER_INACTIVE'
      });
    }

    // 4. VERIFICAR EMAIL VERIFICADO
    if (!user.is_email_verified) {
      console.log(`❌ User email not verified: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Usuario no verificado. Verifica tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // 5. VERIFICAR CONTRASEÑA
    console.log(`🔐 Comparing password for: ${email}`);
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta',
        code: 'INVALID_PASSWORD'
      });
    }

    // 6. GENERAR JWT TOKEN
    const token = generateToken(user.id, user.email, user.role);

    // 7. ACTUALIZAR ÚLTIMO LOGIN
    await dbClient.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    console.log(`✅ Login successful for: ${email}`);

    // 8. RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name, // Campo correcto para el frontend
        fullName: user.full_name,  // Ambos formatos por compatibilidad
        role: user.role,
        is_active: user.is_active,
        isActive: user.is_active,
        is_email_verified: user.is_email_verified,
        isEmailVerified: user.is_email_verified,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ENDPOINT REGISTRO - AGREGADO URGENTE
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    // 1. VALIDACIONES DE INPUT - Username generado automáticamente del email

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido',
        code: 'EMAIL_REQUIRED'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña debe tener al menos 8 caracteres',
        code: 'INVALID_PASSWORD'
      });
    }

    // fullName es opcional, si no se envía, usar el email como nombre
    const userName = fullName || email.split('@')[0];

    console.log(`🔍 Registration attempt for: ${email}`);
    console.log(`📝 Data received:`, { email, password: '***', fullName, role, userName });

    // 2. VERIFICAR SI USUARIO YA EXISTE
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingResult = await dbClient.query(existingUserQuery, [email]);

    if (existingResult.rows.length > 0) {
      console.log(`❌ User already exists: ${email}`);
      return res.status(409).json({
        success: false,
        message: 'Usuario ya registrado con ese email',
        code: 'USER_EXISTS'
      });
    }

    // 3. HASHEAR CONTRASEÑA
    const hashedPassword = await hashPassword(password);

    // 4. INSERTAR USUARIO
    const insertQuery = `
      INSERT INTO users (email, password_hash, full_name, role, is_email_verified, is_active) 
      VALUES ($1, $2, $3, $4, true, true) 
      RETURNING id, email, full_name, role, is_email_verified, is_active
    `;
    
    const userRole = role || 'technician';
    const result = await dbClient.query(insertQuery, [email, hashedPassword, userName, userRole]);
    const newUser = result.rows[0];

    console.log(`✅ User registered: ${email}`);

    // 4.5. GUARDAR EMAIL DE BIENVENIDA EN BASE DE DATOS
    const welcomeEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Bienvenido a CMMS Hidrobombas!</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Te has registrado exitosamente en nuestro sistema CMMS.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Datos de tu cuenta:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Rol:</strong> ${userRole}</p>
        </div>
        <p>¡Ya puedes comenzar a usar la plataforma!</p>
        <p>Saludos,<br>Equipo CMMS Hidrobombas</p>
      </div>
    `;
    
    await dbClient.query(
      'INSERT INTO email_queue (to_email, subject, html_content, email_type) VALUES ($1, $2, $3, $4)',
      [email, '¡Bienvenido a CMMS Hidrobombas!', welcomeEmailHTML, 'welcome']
    );
    
    console.log(`📧 Welcome email queued for: ${email}`);

    // 5. GENERAR TOKEN AUTOMÁTICAMENTE
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // 6. RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        isActive: newUser.is_active,
        isEmailVerified: newUser.is_email_verified
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ENDPOINT PARA VERIFICAR TOKEN
app.get('/api/auth/check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Verificar que el usuario aún existe y está activo
      const userQuery = 'SELECT id, email, full_name, role, is_active, is_email_verified FROM users WHERE id = $1';
      const userResult = await dbClient.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];

      if (!user.is_active || !user.is_email_verified) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo o no verificado',
          code: 'USER_INACTIVE'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token válido',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          isEmailVerified: user.is_email_verified
        }
      });

    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

  } catch (error) {
    console.error('❌ Check token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ENDPOINT PARA CREAR USUARIO DE PRUEBA (SOLO DESARROLLO)
app.post('/api/dev/create-test-user', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    const hashedPassword = await hashPassword(password);
    
    const insertQuery = `
      INSERT INTO users (username, email, password, full_name, role, is_email_verified, is_active) 
      VALUES ($1, $2, $3, $4, 'technician', true, true) 
      RETURNING id, username, email, full_name, role
    `;
    
    const result = await dbClient.query(insertQuery, [username, email, hashedPassword, fullName]);
    
    res.status(201).json({
      success: true,
      message: 'Usuario de prueba creado',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Create test user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario de prueba'
    });
  }
});

// ENDPOINT FORGOT PASSWORD - AGREGADO URGENTE
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email válido es requerido',
        code: 'INVALID_EMAIL'
      });
    }

    console.log(`🔍 Password reset request for: ${email}`);

    // Buscar usuario
    const userQuery = 'SELECT id, email, full_name FROM users WHERE email = $1';
    const userResult = await dbClient.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      // Por seguridad, siempre respondemos igual
      console.log(`❌ Password reset - user not found: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    const user = userResult.rows[0];

    // Generar token de reset (simple por ahora)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en base de datos
    await dbClient.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // GUARDAR EMAIL DE RECUPERACIÓN EN BASE DE DATOS
    const resetUrl = `https://cmms-hydro-1.preview.emergentagent.com/reset-password?token=${resetToken}`;
    
    const resetEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Recuperación de Contraseña</h2>
        <p>Hola <strong>${user.full_name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>O copia este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
        <p><strong>Este enlace expira en 1 hora.</strong></p>
        <p>Si no solicitaste este cambio, ignora este email.</p>
        <p>Saludos,<br>Equipo CMMS Hidrobombas</p>
      </div>
    `;
    
    await dbClient.query(
      'INSERT INTO email_queue (to_email, subject, html_content, email_type) VALUES ($1, $2, $3, $4)',
      [email, 'Recuperación de Contraseña - CMMS Hidrobombas', resetEmailHTML, 'password_reset']
    );
    
    console.log(`📧 Password reset email queued for: ${email}`);

    console.log(`✅ Password reset email "sent" to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      // Solo en desarrollo, mostrar el token
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT RESET PASSWORD - AGREGADO URGENTE
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Nueva contraseña debe tener al menos 8 caracteres',
        code: 'INVALID_PASSWORD'
      });
    }

    console.log(`🔍 Password reset attempt with token: ${token.substring(0, 10)}...`);

    // Buscar usuario por token válido
    const userQuery = `
      SELECT id, email, full_name, reset_token_expires 
      FROM users 
      WHERE reset_token = $1
    `;
    const userResult = await dbClient.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      console.log(`❌ Invalid reset token: ${token.substring(0, 10)}...`);
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    const user = userResult.rows[0];

    // Verificar si el token ha expirado
    if (new Date() > new Date(user.reset_token_expires)) {
      console.log(`❌ Expired reset token for: ${user.email}`);
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicita un nuevo enlace de recuperación',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña y limpiar token
    await dbClient.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log(`✅ Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT VALIDATE RESET TOKEN - AGREGADO URGENTE
app.get('/api/auth/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const userQuery = `
      SELECT id, email, reset_token_expires 
      FROM users 
      WHERE reset_token = $1
    `;
    const userResult = await dbClient.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    const user = userResult.rows[0];

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      email: user.email
    });

  } catch (error) {
    console.error('❌ Validate token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT PARA VER EMAILS ENVIADOS (SISTEMA TEMPORAL)
app.get('/api/emails/sent', async (req, res) => {
  try {
    const result = await dbClient.query(
      'SELECT id, to_email, subject, email_type, created_at FROM email_queue ORDER BY created_at DESC LIMIT 20'
    );
    
    res.status(200).json({
      success: true,
      emails: result.rows,
      message: 'Sistema temporal: emails guardados en base de datos'
    });
  } catch (error) {
    console.error('❌ Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading emails'
    });
  }
});

// ENDPOINT PARA VER CONTENIDO DE EMAIL ESPECÍFICO
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbClient.query(
      'SELECT * FROM email_queue WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email no encontrado'
      });
    }
    
    const email = result.rows[0];
    
    // Devolver HTML para visualizar el email
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${email.subject}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .email-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .email-header { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
          .email-meta { font-size: 12px; color: #666; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="email-meta">Para: ${email.to_email}</div>
            <div class="email-meta">Asunto: ${email.subject}</div>
            <div class="email-meta">Tipo: ${email.email_type}</div>
            <div class="email-meta">Fecha: ${new Date(email.created_at).toLocaleString()}</div>
          </div>
          ${email.html_content}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Get email content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading email content'
    });
  }
});

// ============= ENDPOINTS DE CLIENTES =============

// CREAR CLIENTE
app.post('/api/clients', async (req, res) => {
  try {
    const { name, contact_person, address, phone, email } = req.body;

    // Validaciones básicas
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Nombre de la empresa es requerido',
        code: 'NAME_REQUIRED'
      });
    }

    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email válido es requerido',
        code: 'INVALID_EMAIL'
      });
    }

    console.log(`🏢 Creating client: ${name}`);

    // Verificar si ya existe un cliente con el mismo email
    const existingClient = await dbClient.query(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );

    if (existingClient.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un cliente con ese email',
        code: 'CLIENT_EXISTS'
      });
    }

    // Crear cliente
    const result = await dbClient.query(
      `INSERT INTO clients (name, contact_person, address, phone, email) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, contact_person || null, address || null, phone || null, email]
    );

    const newClient = result.rows[0];

    console.log(`✅ Client created: ${newClient.name}`);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: {
        id: newClient.id,
        name: newClient.name,
        contactPerson: newClient.contact_person,
        address: newClient.address,
        phone: newClient.phone,
        email: newClient.email,
        createdAt: newClient.created_at
      }
    });

  } catch (error) {
    console.error('❌ Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// LISTAR CLIENTES
app.get('/api/clients', async (req, res) => {
  try {
    const result = await dbClient.query(
      'SELECT * FROM clients ORDER BY created_at DESC'
    );

    const clients = result.rows.map(client => ({
      id: client.id,
      name: client.name,
      contactPerson: client.contact_person,
      address: client.address,
      phone: client.phone,
      email: client.email,
      createdAt: client.created_at
    }));

    res.status(200).json({
      success: true,
      clients,
      total: clients.length
    });

  } catch (error) {
    console.error('❌ Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// OBTENER CLIENTE POR ID
app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbClient.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const client = result.rows[0];

    res.status(200).json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        contactPerson: client.contact_person,
        address: client.address,
        phone: client.phone,
        email: client.email,
        createdAt: client.created_at
      }
    });

  } catch (error) {
    console.error('❌ Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ACTUALIZAR CLIENTE
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, address, phone, email } = req.body;

    // Validaciones
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const result = await dbClient.query(
      `UPDATE clients 
       SET name = $1, contact_person = $2, address = $3, phone = $4, email = $5, updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [name, contact_person, address, phone, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const updatedClient = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        contactPerson: updatedClient.contact_person,
        address: updatedClient.address,
        phone: updatedClient.phone,
        email: updatedClient.email,
        createdAt: updatedClient.created_at
      }
    });

  } catch (error) {
    console.error('❌ Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ELIMINAR CLIENTE
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbClient.query(
      'DELETE FROM clients WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ENDPOINT DASHBOARD STATS - AGREGADO URGENTE
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Stats básicos actualizados
    const usersCount = await dbClient.query('SELECT COUNT(*) as count FROM users');
    const emailsCount = await dbClient.query('SELECT COUNT(*) as count FROM email_queue');
    const clientsCount = await dbClient.query('SELECT COUNT(*) as count FROM clients');
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalClients: parseInt(clientsCount.rows[0].count),
        totalEquipment: 0,
        totalReports: 0,
        pendingMaintenance: 0,
        emailsSent: parseInt(emailsCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard stats'
    });
  }
});

app.listen(8001, '0.0.0.0', () => {
  console.log('🚀 CMMS Login Server running on port 8001');
  console.log('📱 Environment: development');
  console.log('🔗 Login endpoint: POST /api/auth/login');
  console.log('🔗 Check endpoint: GET /api/auth/check');
});