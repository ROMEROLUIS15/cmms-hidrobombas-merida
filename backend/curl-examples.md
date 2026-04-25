# Ejemplos CURL para Testing

## 🔐 REGISTRO DE USUARIO

```bash
curl -X POST https://cmms-hydro-1.preview.emergentagent.com/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "fullName": "Juan Pérez",
  "email": "juan@hidrobombas.com",
  "password": "password123",
  "role": "technician"
}'
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "Juan Pérez",
    "email": "juan@hidrobombas.com",
    "role": "technician",
    "isActive": true,
    "createdAt": "2025-01-02T10:30:00.000Z",
    "updatedAt": "2025-01-02T10:30:00.000Z"
  }
}
```

## 🚪 LOGIN DE USUARIO

```bash
curl -X POST https://cmms-hydro-1.preview.emergentagent.com/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "juan@hidrobombas.com",
  "password": "password123"
}'
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "Juan Pérez",
    "email": "juan@hidrobombas.com",
    "role": "technician",
    "isActive": true,
    "lastLogin": "2025-01-02T10:35:00.000Z"
  }
}
```

## 👤 PERFIL DE USUARIO (Protegido)

```bash
curl -X GET https://cmms-hydro-1.preview.emergentagent.com/api/auth/profile \
-H "Authorization: Bearer TU_TOKEN_JWT_AQUI"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-del-usuario",
    "username": "Juan Pérez",
    "email": "juan@hidrobombas.com",
    "role": "technician",
    "isActive": true,
    "lastLogin": "2025-01-02T10:35:00.000Z"
  }
}
```

## ❌ EJEMPLOS DE ERRORES

### Registro con datos faltantes (400):
```json
{
  "success": false,
  "message": "Full name, email, and password are required"
}
```

### Login con credenciales incorrectas (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Acceso sin token (401):
```json
{
  "success": false,
  "message": "Access denied. Authorization token required"
}
```

### Email ya registrado (400):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

## 🏥 HEALTH CHECK

```bash
curl -X GET https://cmms-hydro-1.preview.emergentagent.com/api/auth/health
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Auth service is running",
  "timestamp": "2025-01-02T10:40:00.000Z"
}
```