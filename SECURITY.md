# 🔒 Seguridad — CMMS Hidrobombas Mérida

Este documento describe el modelo de seguridad del sistema y los requisitos de configuración para un despliegue seguro.

---

## Autenticación

- **JWT** de acceso (header `Authorization: Bearer` o cookie `httpOnly`) con expiración configurable (`JWT_EXPIRES_IN`).
- **Refresh token** independiente con su propio secreto. El endpoint `POST /api/auth/refresh` **rota** ambos tokens en cada uso.
- Cookies con `httpOnly`, `SameSite=strict` y `secure` en producción.
- Contraseñas con `bcrypt` (`BCRYPT_ROUNDS` configurable).

> ⚠️ **La mitigación de XSS por cookies httpOnly NO está activa hoy.** El backend las emite,
> pero **el frontend guarda el token en `localStorage`** y lo manda como `Bearer`
> (`App.jsx:25`), que es precisamente lo que un XSS puede leer. Además, el interceptor de 401
> **cierra la sesión** en vez de refrescar, así que el access token no se puede acortar (hoy
> 24h) mientras no se cablee el refresh en el frontend. Ver `PENDING_TASKS.md`.

### El primer administrador

El auto-registro crea **técnicos pendientes** y solo un admin puede aprobarlos: con cero
admins, cada registro nace bloqueado y nadie puede desbloquearlo. Por eso `/api/auth/register`
devuelve **409 `SYSTEM_NOT_INITIALIZED`** mientras no exista un admin activo, y el primer
admin se crea con `bootstrap-admin.js` (exige acceso a la BD).

**No se auto-promueve al primer registrado**: en un deploy público, quien descubra la URL
antes que el dueño se quedaría de administrador.

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
- **IA**: todos los endpoints `/api/ai/*` requieren autenticación (`/status`, `/ask`, `/chat`, `/diagnose`, `/reindex`, `/stream-chat`, `/stream-ask`).

---

## ⚠️ `RATE_LIMIT_DISABLED` — el interruptor que apaga el rate limiting

Existe una variable capaz de **desactivar los tres limitadores**. Está documentada
aquí, y no escondida, porque una defensa con interruptor solo es segura si todo el
mundo sabe que el interruptor existe.

**Por qué existe.** Sin ella no se pueden hacer pruebas de carga: el limitador corta
a las 100 req/15 min **por IP**, y una herramienta de carga lanzada desde una máquina
es una sola IP. A partir de la petición 101 la API responde `429` sin tocar la base de
datos, así que no se mide el sistema, se mide el rechazo.

**Por qué es segura.** `backend/src/utils/rateLimitSkip.js` la acota por tres lados:

1. **Se ignora en producción**, esté puesta o no. En Vercel eso se decide por
   `VERCEL_ENV` (no por `NODE_ENV`, que vale `production` **también en los previews**);
   fuera de Vercel, por `NODE_ENV`.
2. **Exige el string `'true'` exacto.** Un `1`, un `yes` o un `false` no desactivan
   nada: desarmar una protección debe ser un acto deliberado, nunca el efecto
   colateral de un valor mal escrito.
3. **Hay un test de regresión que lo vigila**: `k6/scenarios/rate-limit.js` **falla si
   no aparece ningún `429`**. Si alguien deja el interruptor puesto donde no debe, esa
   prueba lo caza.

Los 8 tests de `rateLimitSkip.unit.test.js` cubren cada caso, incluido el que de
verdad importa: `VERCEL_ENV=production` + `RATE_LIMIT_DISABLED=true` → **el límite
sigue activo**.

### Si levantas un entorno con el interruptor puesto

Un entorno sin rate limiting **no tiene defensa contra la fuerza bruta**. Solo es
aceptable si está aislado de producción **por construcción, no por confianza**:

- **Base de datos propia y sin datos reales.** Si copias la BD de producción, sus
  usuarios reales viajan con sus contraseñas: la fuerza bruta contra ese entorno *es*
  fuerza bruta contra las cuentas de producción.
- **`JWT_SECRET` y `REFRESH_TOKEN_SECRET` propios.** Si los compartes, un token
  emitido allí **vale en producción**.
- **Sin `REDIS_URL` compartido**, para no mezclar los contadores del limitador.
- **No público**: en Vercel, deja activa la protección de despliegue y entra con un
  secreto de bypass (`x-vercel-protection-bypass`).

El procedimiento completo (y cómo desmontarlo) está en [`k6/README.md`](k6/README.md).

---

## Checklist previo al despliegue

- [ ] `JWT_SECRET` y `REFRESH_TOKEN_SECRET` definidos, largos y **distintos entre sí**.
- [ ] `DATABASE_URL` apuntando a la BD de producción correcta.
- [ ] `FRONTEND_URL` con el/los dominio(s) reales (sin `*`).
- [ ] `NODE_ENV=production`.
- [ ] `ALLOW_DESTRUCTIVE_SEED` **no** definido en producción.
- [ ] `RATE_LIMIT_DISABLED` **no** definido en producción. (El código lo ignora ahí de
      todos modos, pero una variable así no debe estar puesta ni "por si acaso": el día
      que alguien toque esa lógica, sería la única línea entre tener rate limiting y no
      tenerlo.)
- [ ] `npm audit` revisado (stage no bloqueante en CI).

---

## Pendientes de seguridad conocidos

Mejoras planificadas (ver auditoría del proyecto):

- Integración de monitoreo de errores externo (Sentry/Datadog) sobre el logger ya existente.
- Persistencia/escalado del vector store de IA (pgvector) en lugar de memoria.

Ya implementado: revocación server-side de refresh tokens (denylist), logging
estructurado + correlation IDs, y migraciones versionadas (ver `npm run migrate`).

---

## Reportar una vulnerabilidad

Es un sistema de uso interno. Reporta cualquier hallazgo de seguridad directamente al responsable técnico del proyecto, sin abrir un issue público.
