# 🔒 Seguridad — CMMS Hidrobombas Mérida

Este documento describe el modelo de seguridad del sistema y los requisitos de configuración para un despliegue seguro.

---

## Autenticación

- **JWT** de acceso (header `Authorization: Bearer` o cookie `httpOnly`) con expiración configurable (`JWT_EXPIRES_IN`).
- **Refresh token** independiente con su propio secreto. El endpoint `POST /api/auth/refresh` **rota** ambos tokens en cada uso.
- Cookies con `httpOnly`, `SameSite=strict` y `secure` en producción → mitiga XSS-robo-de-token y CSRF.
- Contraseñas con `bcrypt` (`BCRYPT_ROUNDS` configurable).

### Secretos obligatorios

| Variable | Requisito |
|----------|-----------|
| `JWT_SECRET` | Obligatorio. Cadena larga y aleatoria. |
| `REFRESH_TOKEN_SECRET` | **Obligatorio en producción y DISTINTO de `JWT_SECRET`.** El backend aborta el arranque si falta, para no derivar un secreto predecible. |

Genera secretos robustos, por ejemplo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Autorización (roles + ownership)

El acceso se controla en dos capas:

1. **Rol** (middleware `authorize` / `authorizeSelfOrAdmin` en las rutas).
2. **Ownership** (helpers en `backend/src/utils/ownership.js`) aplicado en los controladores: filtra listas y devuelve `403` ante acceso directo no autorizado.

| Rol | Alcance |
|-----|---------|
| `admin` / `supervisor` | Acceso total. Únicos que gestionan el maestro de clientes y equipos y las asignaciones. |
| `technician` | Solo sus reportes o los de equipos asignados; solo clientes/equipos asignados. No gestiona el maestro. |
| `client` | (Futuro) Solo lectura de sus propios equipos. |

Regla de ownership de un reporte: **admin/supervisor siempre**; un técnico accede si lo creó (`userId`) o si el equipo del reporte le está asignado (`TechnicianEquipment`).

---

## Endurecimiento adicional

- **Helmet** para headers HTTP seguros y **CORS** restringido a orígenes en `FRONTEND_URL`.
- **Rate limiting** por área: autenticación (15/15 min), API general (100/15 min) e **IA** (`AI_RATE_LIMIT_MAX`, por defecto 30/15 min, más estricto por el costo de tokens del LLM).
- **SSL** hacia PostgreSQL. En Neon se usa `rejectUnauthorized:false`; en otros proveedores, configurar el CA correcto.
- **Seed destructivo bloqueado**: `seed-dummy-data.js` usa `sync({ force:true })` y se niega a ejecutarse en producción salvo `ALLOW_DESTRUCTIVE_SEED=true`.
- **IA**: todos los endpoints `/api/ai/*` requieren autenticación (incluido `GET /api/ai/agent/tools`).

---

## Checklist previo al despliegue

- [ ] `JWT_SECRET` y `REFRESH_TOKEN_SECRET` definidos, largos y **distintos entre sí**.
- [ ] `DATABASE_URL` apuntando a la BD de producción correcta.
- [ ] `FRONTEND_URL` con el/los dominio(s) reales (sin `*`).
- [ ] `NODE_ENV=production`.
- [ ] `ALLOW_DESTRUCTIVE_SEED` **no** definido en producción.
- [ ] `npm audit` revisado (stage no bloqueante en CI).

---

## Pendientes de seguridad conocidos

Mejoras planificadas (ver auditoría del proyecto):

- Revocación server-side de refresh tokens (denylist) — hoy son JWT stateless.
- Sistema de migraciones formal (reemplazar `sequelize.sync()` en arranque).
- Logging estructurado + monitoreo de errores (Sentry) + correlation IDs.

---

## Reportar una vulnerabilidad

Es un sistema de uso interno. Reporta cualquier hallazgo de seguridad directamente al responsable técnico del proyecto, sin abrir un issue público.
