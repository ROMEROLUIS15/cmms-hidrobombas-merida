# 🔄 Neon Keep-Alive: Guía Completa

## ¿Qué Problema Resuelve?

**Neon cierra conexiones después de ~15 minutos de inactividad** en el plan gratuito.

Esto significa que si tu aplicación no usa la BD durante 15 minutos, la próxima query fallará con una conexión rechazada.

**Solución implementada**: Enviar queries simples cada X minutos para mantener la conexión **"despierta"**.

---

## ✅ Implementación Actual

### 1. Servicio de Keep-Alive Automático

**Archivo**: `backend/src/services/neonKeepAlive.js`

El servidor ejecuta automáticamente:
- Un health check cada 10 minutos (por defecto)
- Queries simples que no afectan datos
- Logs para monitoreo

### 2. Endpoint de Health Check Público

**URL**: `GET /health` o `GET /api/health`

**Respuesta**:
```json
{
  "success": true,
  "status": "operational",
  "timestamp": "2026-05-31T15:30:00.000Z",
  "database": {
    "status": "connected",
    "dialect": "postgresql"
  },
  "server": {
    "uptime": 3600,
    "environment": "development",
    "version": "2.0.0"
  },
  "performance": {
    "responseTimeMs": 45
  }
}
```

### 3. Configuración en `.env`

```env
# Habilitar/Deshabilitar keep-alive
NEON_KEEP_ALIVE_ENABLED=true

# Intervalo en milisegundos (10 minutos = 600000 ms)
NEON_KEEP_ALIVE_INTERVAL=600000
```

---

## 🎯 Estrategias Combinadas (Recomendadas)

### Estrategia 1: Keep-Alive Automático (Actual)
- ✅ Se ejecuta automáticamente cada 10 minutos
- ✅ No requiere configuración adicional
- ✅ Ideal para desarrollo y producción

**Uso**: Activado por defecto si `DATABASE_URL` está configurada

---

### Estrategia 2: Monitoreo Externo con UptimeRobot (RECOMENDADO)

Usa un servicio gratuito para "despertar" Neon desde fuera:

1. Ve a [UptimeRobot.com](https://uptimerobot.com)
2. Crea una cuenta gratuita
3. Configura un nuevo "Monitor":
   - Tipo: HTTP(s)
   - URL: `https://tu-app.vercel.app/health`
   - Intervalo: cada 5 minutos
   - Alertas: Deshabilitadas (es solo para mantener vivo)

**Ventajas**:
- ✅ Monitoreo real del uptime
- ✅ Alertas si el servidor cae
- ✅ Estadísticas históricas

---

### Estrategia 3: Health Check desde Frontend

Llamar al endpoint `/health` periódicamente desde React:

```javascript
// React Hook para keep-alive
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch('/api/health');
      console.log('Health check OK:', res.status);
    } catch (e) {
      console.warn('Health check failed:', e);
    }
  }, 5 * 60 * 1000); // Cada 5 minutos

  return () => clearInterval(interval);
}, []);
```

**Ventajas**:
- ✅ Se ejecuta mientras el usuario está activo
- ✅ No necesita servicio externo

**Desventajas**:
- ❌ No funciona si la app está cerrada

---

### Estrategia 4: Connection Pooling (Neon Plan Pago)

Neon tiene un plan con PgBouncer (connection pooling):
- Mantiene conexiones vivas automáticamente
- Costo: ~$150/mes en producción

**Recomendación**: No necesario para MVP/validación

---

## 🛠️ Configuración Avanzada

### Cambiar Intervalo de Keep-Alive

En `backend/.env`:

```env
# 5 minutos
NEON_KEEP_ALIVE_INTERVAL=300000

# 10 minutos (default)
NEON_KEEP_ALIVE_INTERVAL=600000

# 15 minutos (máximo seguro)
NEON_KEEP_ALIVE_INTERVAL=900000
```

### Deshabilitar Keep-Alive

```env
# Desactivar el servicio automático
NEON_KEEP_ALIVE_ENABLED=false
```

---

## 📊 Logs de Keep-Alive

Cuando el servidor está corriendo, verás logs como:

```
✅ Database connection established successfully
🔄 Neon Keep-Alive: Iniciando (intervalo: 10 minutos)
🔄 Neon Keep-Alive: ✅ Connection refreshed (15:30:45)
🔄 Neon Keep-Alive: ✅ Connection refreshed (15:40:45)
🔄 Neon Keep-Alive: ✅ Connection refreshed (15:50:45)
```

---

## 🧪 Pruebas Manuales

### Test 1: Verificar Keep-Alive en Logs

```bash
cd backend
npm run dev
```

Espera 10 minutos y confirma que ves logs de "Connection refreshed".

### Test 2: Llamar Health Check Manualmente

```bash
curl http://localhost:8001/health
```

Respuesta:
```json
{
  "success": true,
  "status": "operational",
  "database": {
    "status": "connected",
    "dialect": "postgresql"
  },
  ...
}
```

### Test 3: Verificar Conectividad Neon

```bash
cd backend
npm run diagnose:db
```

---

## ⚠️ Limitaciones Conocidas

### 1. SQLite No Tiene Keep-Alive
- Keep-Alive solo se ejecuta si usas PostgreSQL
- Con SQLite (local), no hay necesidad

### 2. Vercel Serverless
- En Vercel, las funciones se duermen
- Solución: usar UptimeRobot para despertar

### 3. Plan Gratuito de Neon
- Límite de 15 min de inactividad
- Límite de 3 conexiones simultáneas
- Límite de 1 GB de almacenamiento

---

## 🚀 Recomendación para Producción

### Configuración Óptima
1. ✅ Activar Keep-Alive automático (default)
   ```env
   NEON_KEEP_ALIVE_ENABLED=true
   NEON_KEEP_ALIVE_INTERVAL=600000
   ```

2. ✅ Configurar UptimeRobot para monitoreo adicional
   - URL: `https://tu-app.vercel.app/health`
   - Intervalo: cada 5 minutos

3. ✅ Monitorear logs en Vercel/servidor
   - Busca "Keep-Alive" para confirmar funcionamiento

### Costos
- Keep-Alive automático: **$0** ✅
- UptimeRobot gratuito: **$0** ✅
- Neon gratuito: **$0** ✅
- **Total: $0** 🎉

---

## 📝 Archivos Creados/Modificados

```
backend/
├─ src/
│  ├─ services/
│  │  └─ neonKeepAlive.js (NUEVO)
│  ├─ controllers/
│  │  └─ healthController.js (NUEVO)
│  ├─ routes/
│  │  └─ healthRoutes.js (NUEVO)
│  ├─ server.js (✏️ ACTUALIZADO)
│  └─ app.js (✏️ ACTUALIZADO)
├─ .env (✏️ ACTUALIZADO)
└─ diagnose-db.js (existente)
```

---

## 🎯 Checklist de Configuración

- [x] Servicio de Keep-Alive implementado
- [x] Endpoint de health check creado
- [x] Variables de .env configuradas
- [x] Servidor actualizado para iniciar keep-alive
- [x] Logs configurados
- [ ] (Opcional) UptimeRobot configurado
- [ ] (Opcional) Frontend hook de keep-alive agregado

---

## 📞 Soporte Rápido

**¿Neon sigue desconectando?**
- Verifica que DATABASE_URL está correcta
- Ejecuta `npm run diagnose:db`
- Aumenta NEON_KEEP_ALIVE_INTERVAL a 300000 (5 min)

**¿Logs de keep-alive no aparecen?**
- Confirma NEON_KEEP_ALIVE_ENABLED=true
- Verifica que DATABASE_URL está configurada
- Reinicia servidor: `npm run dev`

**¿Cómo monitorear en producción?**
- Configura UptimeRobot: https://uptimerobot.com
- URL: `https://tu-app.vercel.app/health`
- Recibe alertas si el servidor cae

---

**Implementación**: 2026-05-31  
**Estado**: ✅ Operativo  
**Próximo paso**: (Opcional) Configurar UptimeRobot para monitoreo externo

