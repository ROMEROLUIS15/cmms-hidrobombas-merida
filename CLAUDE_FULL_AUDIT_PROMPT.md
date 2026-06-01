# CLAUDE — Auditoría Completa del Proyecto CMMS Hidrobombas Mérida

> **IMPORTANTE:** Debes leer PRIMERO el código fuente y verificar su funcionalidad. Los archivos `.md` son secundarios. Solo después de auditar el código, verifica los `.md` y corrígelos si no reflejan la realidad del código.

---

## 1. VERIFICACIÓN FUNCIONAL — De Pie a Cabeza

### 1.1 Autenticación y Usuarios
- [ ] `POST /api/auth/login` — login con email+password, devuelve token + refreshToken
- [ ] `POST /api/auth/register` — registro con validación Zod
- [ ] `POST /api/auth/logout` — limpia cookies
- [ ] `POST /api/auth/refresh` — refresca token vía refreshToken
- [ ] `GET /api/auth/profile` — perfil del usuario autenticado
- [ ] `GET /api/users` — solo admin, lista usuarios sin password
- [ ] `PUT /api/users/:id/status` — activar/desactivar usuario
- [ ] `PUT /api/users/:id/role` — cambiar rol
- [ ] `DELETE /api/users/:id` — eliminar usuario
- [ ] Middleware `protect` — verifica JWT, adjunta `req.user` con `id` + `userId`
- [ ] Middleware `authorize` — restringe por rol
- [ ] Middleware `optional` — auth opcional

### 1.2 Clientes (CRUD)
- [ ] `GET /api/clients` — lista todos
- [ ] `GET /api/clients/:id` — cliente por ID
- [ ] `POST /api/clients` — crear cliente
- [ ] `PUT /api/clients/:id` — actualizar (whitelist de campos: name, email, phone, address, contactPerson, rif)
- [ ] `DELETE /api/clients/:id` — eliminar
- [ ] Validación UUID en todos los parámetros ID
- [ ] No hay mass assignment (req.body filtrado)

### 1.3 Equipos (CRUD)
- [ ] `GET /api/equipment` — lista con filtro por clientId
- [ ] `GET /api/equipment/:id` — equipo por ID con reportes recientes
- [ ] `POST /api/equipment` — crear
- [ ] `PUT /api/equipment/:id` — actualizar (whitelist: name, type, model, serialNumber, location, clientId, status, notes, brand)
- [ ] `DELETE /api/equipment/:id` — eliminar

### 1.4 Reportes de Servicio
- [ ] `GET /api/service-reports` — lista todos
- [ ] `GET /api/service-reports/:id` — detalle
- [ ] `POST /api/service-reports` — crear con campos JSON parseados
- [ ] `PUT /api/service-reports/:id` — actualizar
- [ ] `DELETE /api/service-reports/:id` — eliminar
- [ ] `GET /api/service-reports/:id/pdf` — generar PDF
- [ ] `POST /api/service-reports/:id/email` — enviar por email
- [ ] **`userId: req.user?.userId || req.user?.id || null`** — debe funcionar con authMiddleware

### 1.5 Asignaciones
- [ ] `GET /admin/:adminId/technicians` — técnicos por admin
- [ ] `GET /technician/:technicianId/admins` — admins por técnico
- [ ] `POST /admin-technician` — asignar técnico a admin
- [ ] `DELETE /admin/:adminId/technician/:technicianId` — desasignar
- [ ] `GET /technician/:technicianId/clients` — clientes por técnico (técnicos pueden leer)
- [ ] `GET /client/:clientId/technicians` — técnicos por cliente
- [ ] `POST /technician-client` — asignar cliente a técnico (solo admin/supervisor)
- [ ] `DELETE /technician/:technicianId/client/:clientId` — desasignar
- [ ] `GET /technician-clients` — todas las asignaciones
- [ ] `GET /technician/:technicianId/equipment` — equipos por técnico
- [ ] `GET /equipment/:equipmentId/technicians` — técnicos por equipo
- [ ] `POST /technician-equipment` — asignar equipo
- [ ] `DELETE /technician/:technicianId/equipment/:equipmentId` — desasignar
- [ ] `GET /technician-equipment` — todas las asignaciones

### 1.6 Dashboard
- [ ] `GET /api/dashboard/stats` — estadísticas (total_clients, total_equipment, total_reports, total_technicians)
- [ ] Últimos reportes
- [ ] Próximas citas/mantenimientos
- [ ] Frontend Dashboard.jsx — renderiza stats sin valores hardcodeados

### 1.7 Citas / Agendamiento (si existe)
- [ ] Crear cita
- [ ] Cancelar cita
- [ ] Reagendar cita
- [ ] Citas del día
- [ ] Citas por fecha
- [ ] Última vez que se atendió un cliente

### 1.8 AI — Agentes Internos
- [ ] `POST /api/ai/ask` — pregunta general
- [ ] `POST /api/ai/chat` — chat contextual
- [ ] `POST /api/ai/diagnose` — diagnóstico
- [ ] `POST /api/ai/reindex` — reindexar vector store
- [ ] `GET /api/ai/status` — estado del AI
- [ ] `POST /api/ai/stream-chat` — chat con streaming SSE
- [ ] `POST /api/ai/stream-ask` — pregunta con streaming SSE
- [ ] `POST /api/ai/agent/ask` — Agent Maestro
- [ ] `POST /api/ai/agent/tools` — herramientas disponibles
- [ ] `POST /api/ai/agent/generate-report` — generar reporte
- [ ] `POST /api/ai/agent/detect-anomaly` — detectar anomalía
- [ ] `POST /api/ai/agent/ask-question` — preguntar
- [ ] `POST /api/ai/agent/recommend-maintenance` — recomendar mantenimiento
- [ ] `POST /api/ai/agent/summary` — resumen ejecutivo
- [ ] RAG Chain funciona con vector store
- [ ] Diagnostic Graph (LangGraph) — diagnóstico paso a paso
- [ ] Streaming — Server-Sent Events
- [ ] DI Container — `container.createLLM()`, `container.createEmbeddings()`
- [ ] Vector Store Provider — `getOrCreateVectorStore()`, `searchSimilarReports()`
- [ ] Capa anti-alucinación — validación de respuestas, grounding en datos reales

### 1.9 Asistente Frontend (AIChatBubble)
- [ ] Widget flotante de chat
- [ ] Pestaña de diagnóstico
- [ ] Streaming de respuestas
- [ ] Se integra en App.jsx correctamente

---

## 2. SEGURIDAD — Auditoría Total

### 2.1 Credenciales y Secrets
- [ ] **Buscar API keys hardcodeadas** en backend y frontend
- [ ] **Buscar tokens JWT hardcodeados**
- [ ] **Buscar passwords en texto plano**
- [ ] **Verificar que `.env` no se commitearon** — revisar `.gitignore`
- [ ] **Buscar en commits históricos** si se fugaron credenciales
- [ ] **Verificar headers de seguridad** — Helmet configurado
- [ ] **`SMTP_PASS`, `RESEND_API_KEY`, `GROQ_API_KEY`, `HUGGINGFACEHUB_API_KEY`** — solo en variables de entorno

### 2.2 Autenticación y Autorización
- [ ] JWT con expiración (24h access, 7d refresh)
- [ ] Refresh token rotation
- [ ] Password hashing con bcrypt
- [ ] Protección contra email enumeration (passwordController)
- [ ] Rate limiting implementado
- [ ] **No hay mass assignment** en ningún controller
- [ ] **No hay fugas de password hash** en respuestas
- [ ] Middleware CORS configurado
- [ ] Cookie flags: httpOnly, secure (producción), sameSite

### 2.3 Validación de Entrada
- [ ] Zod schemas para auth (register, login)
- [ ] UUID validation en todos los params ID
- [ ] **Faltan Zod schemas** para service-reports, clients, equipment
- [ ] SQL injection — Sequelize usado correctamente (no raw queries)
- [ ] XSS — Helmet activo, respuesta JSON escapada

### 2.4 Acceso a Datos
- [ ] Técnicos solo ven sus asignaciones
- [ ] Admin no puede cambiar su propio rol (UserManagement)
- [ ] Admin no puede eliminarse a sí mismo

---

## 3. PRINCIPIOS SOLID

### 3.1 Single Responsibility
- [ ] Cada controller maneja un solo recurso
- [ ] Los modelos solo definen esquemas
- [ ] `assignmentController.js` define 3 controladores en 1 archivo — violación leve
- [ ] `aiController.js` mezcla AI + Agent Maestro en 1 archivo
- [ ] Middleware tiene responsabilidad única

### 3.2 Open/Closed
- [ ] Agregar nuevo tipo de asignación requiere modificar `assignmentController.js`
- [ ] Nuevo tipo de email requiere modificar `emailService.js`
- [ ] Extensiones vía DI container en módulos AI

### 3.3 Liskov Substitution
- [ ] `VectorStoreProvider` — interfaz abstracta implementada por `memory` provider
- [ ] Los tests pueden sustituir dependencias vía DI container

### 3.4 Interface Segregation
- [ ] Interfaces pequeñas y específicas

### 3.5 Dependency Inversion
- [ ] Módulos AI dependen de `container.js` (abstracción), no de `config.js` directo
- [ ] Controladores dependen directamente de modelos Sequelize — NO invertido
- [ ] Servicios de email dependen directamente de nodemailer

---

## 4. ANTIALUCINACIÓN (AI Agents)

- [ ] **Grounding en datos reales** — RAG busca en reportes existentes antes de responder
- [ ] **Validación de herramientas** — las herramientas solo acceden a datos del sistema
- [ ] **Fallback cuando no hay datos** — responde "no encontré información" en lugar de alucinar
- [ ] **Streaming** envía chunks de respuesta en tiempo real
- [ ] **DI Container** permite mockear LLM en tests para evitar llamadas reales
- [ ] **Vector store** usa `memory` provider por defecto (sin dependencias externas)
- [ ] **Prompts como constantes** en `prompts.js` con placeholders para inyección controlada

---

## 5. CÓDIGO MUERTO / FUNCIONES HUÉRFANAS

- [ ] Buscar funciones exportadas pero nunca importadas
- [ ] Buscar archivos no referenciados en `require()`/`import`
- [ ] Buscar variables/estados definidos pero nunca usados
- [ ] Buscar componentes frontend no renderizados
- [ ] Buscar hooks no utilizados
- [ ] **Especial atención a:**
  - `UserManagement.jsx:107` — segundo `if (loading)` inalcanzable (dead code confirmado)
  - `Login.jsx:93-105` — `checkEmailExists` es no-op (nunca consulta al servidor)
  - `frontend/src/components/ServiceForm.old.txt` — archivo legacy
  - Dependencias no usadas en `package.json`
  - Componentes frontend sin test

---

## 6. CONSISTENCIA DE NOTIFICACIONES

- [ ] **Toasts** — ¿usan todas `sonner` toast() consistente?
- [ ] **Errores** — ¿todos siguen `{ success: false, message: '...' }`?
- [ ] **Éxito** — ¿todos siguen `{ success: true, data: ... }`?
- [ ] **Mensajes de error en español** consistentes
- [ ] **Códigos HTTP** correctos (200, 201, 400, 401, 403, 404, 500)
- [ ] **assignmentController** — ahora usa `{ success: true, data: ... }` (verificar consistencia)
- [ ] **userController** — ahora usa `{ success: true, data: ... }` (verificar)
- [ ] **authController** — usa `{ success: true/false, ... }` (verificar)

---

## 7. INTEGRIDAD DE LA CADENA DE ERRORES

- [ ] **asyncHandler** envuelve todos los handlers — ¿alguno se queda sin wrapper?
- [ ] **`getUserById`** en `userController.js` — ¿sigue sin `asyncHandler`? (se removió)
- [ ] **Probar error path:** handler lanza → asyncHandler captura → `next(error)` → errorHandler → respuesta JSON
- [ ] **Errores de Sequelize** — ¿el errorHandler los traduce a respuestas legibles?
- [ ] **Errores de validación Zod** — ¿el middleware devuelve errores formateados?
- [ ] **Errores de red** en frontend — ¿tienen manejo con `try/catch`?
- [ ] **Errores de Idempotency** — `JSON.parse` ahora tiene try/catch (confirmar)
- [ ] **Errores de PDF** — `buildReportPDF` puede devolver null, `doc.pipe(res)` protegido
- [ ] **Errores de Email** — `emailService.js` siempre devuelve `{ success, error, simulated }`
- [ ] **Errores de AI** — `aiController.js` maneja errores de streaming y agentes

---

## 8. ARQUITECTURA Y ESCALABILIDAD

### 8.1 Backend
- [ ] Separación en capas: routes → controllers → services → models
- [ ] Middleware reutilizable (auth, idempotency, error, pagination, validation)
- [ ] SQLite para dev, PostgreSQL/Neon para producción
- [ ] Fallback automático a SQLite si PostgreSQL falla
- [ ] Pool de conexiones configurado (`max: 5`, `acquire: 60000`)
- [ ] Paginación en listas
- [ ] `family: 4` para forzar IPv4 en conexiones Neon

### 8.2 Frontend
- [ ] Componentes React con estados de carga/error/vacío
- [ ] Offline queue con IndexedDB
- [ ] Network status detection
- [ ] PWA installable
- [ ] Service Wizard con 13 pasos + persistencia en IndexedDB
- [ ] **Dual BrowserRouter** — ¡corregido! Verificar que ahora hay solo 1

### 8.3 AI
- [ ] DI Container para testabilidad
- [ ] Vector Store Provider intercambiable (memory → pgvector)
- [ ] LangGraph para flujos de diagnóstico
- [ ] RAG para grounding
- [ ] Streaming SSE
- [ ] Prompts externalizados como constantes

---

## 9. VERIFICACIÓN DE ARCHIVOS .md

Después de auditar el código, **lee y corrige** estos archivos:

- [ ] `ARCHITECTURE.md` — ¿refleja la arquitectura actual? Corregir si desactualizado
- [ ] `README.md` — ¿features listadas existen? ¿tests count correcto?
- [ ] `IMPROVEMENTS.md` o similar — ¿los improvements están implementados?
- [ ] `CLAUDE_FULL_AUDIT_PROMPT.md` — este archivo, verificar que las instrucciones sean correctas
- [ ] Cualquier otro `.md` en la raíz — verificar contra código real

---

## 10. VERIFICACIÓN DE TESTS

- [ ] **Backend:** 36 suites, 285 tests — todos deben pasar
- [ ] **Frontend:** 7 suites, 72 tests — todos deben pasar
- [ ] **¿Hay tests que no prueban nada real?** (mocks vacíos, assertions triviales)
- [ ] **¿Cobertura de integration tests?** — routes, controllers, middleware
- [ ] **¿Cobertura de AI?** — streaming, DI container, edge cases
- [ ] **¿Cobertura de frontend?** — componentes principales sin test: Dashboard, ClientList, EquipmentList, UserManagement, Navigation, OfflineBanner

---

## 11. FORMATO DEL REPORTE FINAL

Devuelve un reporte estructurado así:

```markdown
# Auditoría CMMS — [FECHA]

## Resumen Ejecutivo
- Tests: ✅/❌ X pasan de Y
- Bugs críticos: X
- Bugs funcionales: X
- Seguridad: X hallazgos
- SOLID: X incumplimientos
- Código muerto: X hallazgos
- Archivos .md: X corregidos

## 🔴 Crítico (arreglar YA)
- [ ] Item 1 (archivo:línea) — descripción
- [ ] Item 2

## 🟡 Alto (arreglar pronto)
- [ ] Item

## 🟢 Medio/Bajo
- [ ] Item

## Archivos .md corregidos
- `ARCHITECTURE.md`: cambio realizado

## Tests
- Estado actual
- Recomendaciones de cobertura
```

---

**IMPORTANTE:** No alucines. Si no encuentras un archivo o funcionalidad, dilo explícitamente. Si un test falla, reporta el error exacto. No inventes conclusiones. Basa todo en el código real en disco.
