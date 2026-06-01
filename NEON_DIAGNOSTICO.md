# 🔴 Diagnóstico de Conexión Neon

## Error Encontrado
```
Unable to connect to database: read ECONNRESET
```

El servidor **no puede conectarse a Neon** pero hace fallback a SQLite correctamente.

---

## Causas Posibles

### 1. ❌ Credenciales Expiradas/Incorrectas
- La contraseña de Neon puede haber sido reestablecida
- La URL de conexión de la pooler puede haber cambiado

**Solución:**
- Ve a [Neon Console](https://console.neon.tech)
- Copia la CONNECTION STRING completa nuevamente
- Reemplaza la `DATABASE_URL` en `.env`

### 2. ❌ Pool de Conexiones Cerrada
- Neon cierra conexiones inactivas después de un tiempo

**Solución:**
- Actualizar `.env` con nuevas credenciales

### 3. ❌ Configuración SSL Incorrecta
- El parámetro `channel_binding=require` puede estar causando problemas

**Solución:**
- Cambiar a `sslmode=require` sin `channel_binding`

### 4. ❌ Problema de Red/Firewall
- Bloqueo de puertos 5432 o 6432 (Neon pooler)

**Solución:**
- Revisar si otros servicios pueden conectar a Neon
- Probar: `ping ep-still-math-angfe9ah-pooler.c-6.us-east-1.aws.neon.tech`

---

## 🔧 Pasos para Reparar

### Opción 1: Regenerar Credenciales desde Neon Dashboard

1. Abre [https://console.neon.tech](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a **Connection String**
4. Copia la URL completa (con credenciales)
5. Pega en `backend/.env` como `DATABASE_URL=...`
6. Reinicia el servidor: `npm run dev`

### Opción 2: Simplificar la URL (remover `channel_binding`)

Si Neon te da:
```
postgresql://neondb_owner:npg_xxxxx@ep-xxxx-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Prueba sin `channel_binding`:
```
postgresql://neondb_owner:npg_xxxxx@ep-xxxx-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Opción 3: Usar SQLite Temporalmente (para desarrollo local)

Comentar/remover la línea de `DATABASE_URL` en `.env`:
```bash
# DATABASE_URL=postgresql://...
```

El servidor detectará que no hay DB URL y usará SQLite automáticamente.

---

## ✅ Verificar la Conexión

Después de actualizar, ejecuta:

```bash
cd backend
npm run dev
```

Busca los logs:
- ✅ `Database connection established successfully` = Postgres OK
- ✅ `Fallback a SQLite para desarrollo local` = Usando SQLite (normal en dev sin DATABASE_URL)

---

## 📋 URL de DATABASE_URL Actual

```
postgresql://neondb_owner:npg_zfo63LmcBxvg@ep-still-math-angfe9ah-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**⚠️ Estado**: El host `ep-still-math-angfe9ah-pooler` puede estar inactivo o las credenciales expiraron.

---

## 🚀 Recomendaciones

1. **Para producción (Vercel)**: Tener DATABASE_URL válida
2. **Para desarrollo local**: Es OK usar SQLite, solo comentar DATABASE_URL
3. **Para testing**: Los tests no usan DATABASE_URL por defecto (usan SQLite)

---

Generado: 2026-05-31
