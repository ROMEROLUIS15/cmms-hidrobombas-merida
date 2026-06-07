# 🏗️ Arquitectura Técnica — CMMS Hidrobombas Mérida

Documento de referencia para desarrolladores que trabajen en este proyecto. Describe las decisiones de diseño, patrones usados y consideraciones técnicas clave.

---

## 1. Visión General del Monorepo

El proyecto está organizado como un **monorepo npm workspaces** con dos workspaces independientes:

```
cmms-hidrobombas-merida/   ← Raíz (orquestación + CI/CD)
├── backend/               ← Workspace: API REST
└── frontend/              ← Workspace: SPA React
```

La raíz únicamente orquesta el arranque y las herramientas de calidad (Husky, lint-staged). Cada workspace tiene sus propias dependencias, scripts y configuración de tests.

---

## 2. Backend — Decisiones de Diseño

### 2.1 ORM: Sequelize con estrategia dual de BD

El backend soporta **dos bases de datos** transparentemente:

```
DATABASE_URL definida → PostgreSQL (producción/Neon)
DATABASE_URL ausente  → SQLite   (desarrollo/tests)
```

**¿Por qué?** Permite a los desarrolladores trabajar localmente sin instalar Postgres, mientras que producción usa una BD robusta. Los tests de CI también usan SQLite en memoria para máxima velocidad y aislamiento.

El modelo `ServiceReport` almacena los bloques de datos técnicos como **JSON en columnas TEXT** en lugar de tablas relacionales separadas:

```js
// En vez de: tabla motors con columnas phase_r, phase_s, phase_t...
motorsData: DataTypes.TEXT  // "[{phase_r: '8.1', ...}, {phase_r: '7.9', ...}]"
```

**Justificación:** La estructura de cada paso del wizard puede variar por tipo de equipo. Almacenar como JSON ofrece máxima flexibilidad sin migraciones de esquema.

### 2.2 Modelos y Relaciones Many-to-Many

El sistema implementa relaciones **many-to-many** entre entidades mediante tablas intermedias:

| Modelo | Tabla | Propósito |
|--------|-------|-----------|
| `AdminTechnician` | `admin_technicians` | Admin/Supervisor gestiona técnicos |
| `TechnicianClient` | `technician_clients` | Técnico asignado a clientes |
| `TechnicianEquipment` | `technician_equipment` | Técnico responsable de equipos |

Estas tablas permiten que:
- Un cliente sea atendido por múltiples técnicos
- Un equipo tenga múltiples técnicos responsables
- Un admin supervise múltiples técnicos

### 2.3 Arquitectura de capas

```
Request HTTP
    ↓
Routes (authRoutes.js, etc.)       ← Solo define verbos y paths
    ↓
Middleware (authMiddleware, Zod)    ← Valida JWT y esquema del body
    ↓
Controller (authController.js)     ← Lógica de negocio
    ↓
Model (Sequelize)                  ← Acceso a datos
    ↓
Response HTTP
```

### 2.3 Seguridad implementada

| Capa | Mecanismo | Archivo |
|------|-----------|---------|
| Headers HTTP | Helmet.js | `app.js` |
| Autenticación | JWT Bearer Token | `authMiddleware.js` |
| Validación de entrada | Zod schemas | `zodMiddleware.js` + `validators/` |
| Contraseñas | bcrypt (10 rounds) | `models/User.js` → hook `beforeSave` |
| CORS | Whitelist de orígenes | `app.js` |
| Reset tokens | Crypto `randomBytes(32)`, TTL 1h | `passwordController.js` |
| Asignaciones | Rutas `/api/assignments/*` con rol admin/supervisor | `assignmentRoutes.js` + `assignmentController.js` |

### 2.3.1 Endpoints de Asignaciones

Rutas disponibles en `/api/assignments` (requieren rol `admin` o `supervisor`):

```
Admin ↔ Technician:
  GET    /admin/:adminId/technicians
  GET    /technician/:technicianId/admins
  POST   /admin-technician          { adminId, technicianId }
  DELETE /admin/:adminId/technician/:technicianId

Technician ↔ Client:
  GET    /technician/:technicianId/clients
  GET    /client/:clientId/technicians
  POST   /technician-client         { technicianId, clientId }
  DELETE /technician/:technicianId/client/:clientId
  GET    /technician-clients

Technician ↔ Equipment:
  GET    /technician/:technicianId/equipment
  GET    /equipment/:equipmentId/technicians
  POST   /technician-equipment      { technicianId, equipmentId }
  DELETE /technician/:technicianId/equipment/:equipmentId
  GET    /technician-equipment
```

### 2.4 Manejo de errores

Todos los errores no capturados se centralizan en `middleware/errorHandler.js`. En producción, **nunca se expone el stack trace** al cliente. Solo se retorna un mensaje genérico.

Los controllers usan `express-async-handler` para evitar el boilerplate de try/catch en cada handler async.

---

## 3. Frontend — Decisiones de Diseño

### 3.1 Wizard de Reporte: Arquitectura de Estado

El wizard de 13 pasos usa **React Context** (`WizardContext.jsx`) para:
- Mantener el estado del formulario completo centralizado
- Permitir que cada step acceda y actualice `formData` sin prop drilling
- Persistir borradores en IndexedDB vía idb-keyval

```jsx
// WizardContext provee:
const {
  formData, setFormData, updateFormData,
  currentStep, setStep, nextStep, prevStep,
  isOffline, clearDraft, clearOfflineDraft
} = useWizard();
```

### 3.2 Modo Offline

El sistema tiene capacidad offline mediante dos hooks personalizados:

**`useNetworkStatus`:** Detecta cambios de conectividad usando los eventos nativos `online`/`offline` del navegador.

**`useOfflineQueue`:** Cuando el técnico está sin conexión y guarda un reporte, la acción se encola en **IndexedDB** via `idb-keyval` (v6.2.2). Al recuperar la conexión, la cola se procesa automáticamente.

```
Técnico sin conexión
    → intenta guardar reporte
    → useOfflineQueue.enqueueReport(reporte, token)
    → persiste en IndexedDB con clientRequestId único

Conexión recuperada
    → useNetworkStatus detecta evento "online"
    → se puede llamar replayQueue(submitFn) manualmente
      o el Service Worker Background Sync lo dispara automáticamente
    → itera la cola y hace POST /api/service-reports
    → elimina de la cola SOLO si el submit fue exitoso
    → si falla, el reporte permanece en cola para reintentarse
```

### 3.2.1 Garantía de Idempotencia en el Flujo Offline

El mayor riesgo de un sistema offline es la **creación de reportes duplicados**. Esto ocurre cuando:
- El técnico toca "Enviar" dos veces rápido
- La conexión vuelve y la cola se procesa mientras el técnico reintenta manualmente
- Un error de red transitorio hace que el POST llegue al servidor pero el ACK no regrese al cliente

La solución implementada es un **`clientRequestId`** (UUID v4) que se genera una sola vez por intento de envío:

```
Técnico toca "Enviar"
    ↓
1. Se genera clientRequestId = uuidv4()  ← una sola vez
2. Se intenta POST online:
   Headers: { 'X-Idempotency-Key': clientRequestId }
   Body:    { ...formData, _clientRequestId: clientRequestId }

   Si tiene éxito → ✅ done
   Si falla por red:
       ↓
3. Se llama enqueueReport(reportPayload, token)
   → verifica en IndexedDB si ya existe una entrada
     con ese mismo clientRequestId
   → si existe: devuelve la entrada existente (no duplica)
   → si no existe: crea nueva entrada
```

**Triple protección contra duplicados:**

| Capa | Mecanismo | Cobertura |
|------|-----------|----------|
| Frontend — UI | `if (isSubmitting) return` en `handleSubmit` | Doble toque en el botón |
| Frontend — Cola | Deduplicación por `clientRequestId` en `enqueueReport` | Retries manuales del técnico |
| Backend — API | Header `X-Idempotency-Key` para implementación futura | Requests duplicados a nivel HTTP |

### 3.3 Alias de paths

Vite está configurado con el alias `@` apuntando a `./src`:

```js
// Importar así (limpio):
import { utils } from '@/lib/utils';

// En lugar de (frágil):
import { utils } from '../../../lib/utils';
```

### 3.4 Componentes UI

Los componentes primitivos (botones, inputs, dialogs, etc.) son de **Radix UI**, que provee accesibilidad WAI-ARIA out-of-the-box sin estilos predefinidos. Los estilos son aplicados con TailwindCSS + `class-variance-authority` para variantes.

### 3.5 Firma Digital

La captura de firmas utiliza **`react-signature-canvas`** (v1.1.0-alpha.2), un wrapper de `signature_pad`:

```jsx
import SignatureCanvas from 'react-signature-canvas';

<SignatureCanvas
  penColor="black"
  backgroundColor="rgba(255,255,255,1)"
  canvasProps={{
    style: { height: '320px', touchAction: 'none' }
  }}
  onEnd={handleCanvasEnd}
/>
```

**Consideraciones implementadas:**
- `touchAction: 'none'` — Previene scroll mientras el usuario firma
- `backgroundColor` explícito — Evita fondos transparentes que distorsionan la imagen
- Reconstrucción del canvas — Al entrar al paso de firma se recrea para evitar conflictos con el teclado del móvil
- Protección contra Backspace — Previene que el botón de retour del hardware borre la firma accidentalmente

---

## 4. Testing — Estrategia

### Frontend (Vitest)

Los tests del frontend corren con `jsdom` simulando el DOM del navegador.

**Convenciones de mocks:**
- Variables de módulo mockeadas deben tener prefijo `mock` (requerimiento de Vitest/Jest)
- Los módulos CSS se mapean a `styleMock.js`
- `axios`, `react-router-dom` y `sonner` tienen mocks dedicados en `__mocks__/`

**`useOfflineQueue` — Estrategia con `fake-indexeddb`:**

Los tests de `useOfflineQueue` usan `fake-indexeddb/auto` en lugar de mockear el módulo completo. Esto permite ejercitar la lógica **real** de IndexedDB en Node.js, validando comportamientos que un mock nunca podría capturar:

```js
import 'fake-indexeddb/auto';
// El hook usa indexedDB real (en memoria) durante el test

// Test de idempotencia real:
const first  = await enqueueReport({ _clientRequestId: 'id-001' }, 'token');
const second = await enqueueReport({ _clientRequestId: 'id-001' }, 'token');
expect(first.id).toBe(second.id);          // mismo ID de IDB
const q = await getPendingReports();
expect(q).toHaveLength(1);                 // solo 1 entrada
```

Casos de prueba cubiertos:
- Encolar un reporte genera `id` y `clientRequestId` válidos
- **Idempotencia**: llamadas repetidas con mismo `clientRequestId` no duplican la entrada
- Reportes distintos se encolan como entradas separadas
- `replayQueue` elimina de la cola solo los que tuvieron éxito
- `replayQueue` mantiene en cola los que fallaron (para reintento seguro)
- Cola mixta (éxitos + fallos) se procesa correctamente

```js
// 1. Seed: crear usuario y obtener token dinámicamente
const { token, userId } = await loginAndGetToken();

// 2. Usar IDs dinámicos (nunca hardcodeados)
const res = await request(app)
  .get(`/api/clients/${clientId}`)  // ← ID obtenido dinámicamente
  .set('Authorization', `Bearer ${token}`);
```

**Regla de oro:** Nunca usar IDs estáticos en tests de integración. Siempre crear los recursos en el `beforeEach` y usar los IDs retornados.

---

## 5. Flujo de Datos — Reporte de Servicio

```
Técnico abre wizard
    ↓
Step 0: selecciona cliente → fetchs /api/clients
Step 0: selecciona equipo → fetchs /api/equipment?clientId=X
    ↓
Steps 1-11: captura datos técnicos (local state en WizardContext)
    ↓
Step 12: observaciones + firma digital (canvas → base64)
    ↓
Submit → POST /api/service-reports
         Body: { equipmentId, userId, waterEnergyData, motorsData,
                 controlData, observations, clientSignature, ... }
    ↓
Backend: auto-genera reportNumber (SRV-XXXX)
Backend: persiste en BD
Backend: retorna el reporte creado
    ↓
Frontend: muestra éxito y redirige al historial
Técnico: puede descargar PDF → GET /api/service-reports/:id/pdf
```

---

## 6. Convenciones de Código

### Nombrado de archivos
- **Componentes React:** PascalCase `.jsx` → `ServiceWizard.jsx`
- **Hooks:** camelCase con prefijo `use` `.jsx` → `useNetworkStatus.jsx`
- **Backend:** camelCase `.js` → `authController.js`

### Commits
Seguir [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: agregar exportación de reportes a Excel
fix: corregir validación de voltaje en Step3
docs: actualizar README con nuevos endpoints
refactor: extraer lógica de PDF a pdfService
test: agregar tests para userRoutes
chore: actualizar dependencias de seguridad
```

### Variables de entorno
- **Nunca** hardcodear credenciales, IPs o secrets en el código
- Toda configuración sensible va en `.env` (ignorado por Git)
- Documentar en `.env.example` con valores de ejemplo

---

## 7. Deuda Técnica Conocida

✅ **Todo resuelto** - La deuda técnica ha sido implementada:

| Item | Prioridad | Estado | Implementación |
|------|-----------|--------|----------------|
| Email en reset password | 🔴 Alta | ✅ Resuelto | `src/services/emailService.js` usa nodemailer con SMTP configurable |
| JWT en httpOnly cookies | 🟡 Media | ✅ Resuelto | Backend acepta JWT via cookie o header Authorization. Incluye refresh tokens de 7 días |
| Idempotencia backend | 🟡 Media | ✅ Resuelto | Middleware `idempotencyMiddleware.js` crea tabla `idempotency_keys` con TTL 24h |
| Tests E2E | 🟡 Media | ✅ Resuelto | Playwright configurado con tests en `e2e/auth.spec.js`. Ejecutar `npm run test:e2e` |
| Paginación | 🟢 Baja | ✅ Resuelto | Endpoints `/api/clients`, `/api/equipment`, `/api/service-reports` ahora aceptan `?page=1&limit=10` |

---

*Última actualización: Mayo 2026*
