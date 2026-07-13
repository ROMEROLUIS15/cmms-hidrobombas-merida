# Deuda Técnica — CMMS Hidrobombas Mérida

Registro de limitaciones conocidas y trabajo pendiente. Última verificación: **2026-06-24**.

---

## 1. IA (agente) — ✅ FUNCIONANDO en producción (verificado 2026-07-13)

**Estado:** chat, diagnóstico y RAG responden en producción. Se verificó end-to-end con
llamadas reales. Lo que hizo falta:
- `GROQ_API_KEY`: no existía en Vercel, **y la del `.env` estaba revocada**. Rotada y
  seteada. `/api/ai/status` expone ahora `groq_key_status` (validación REAL contra Groq);
  `groq_configured` solo dice que la variable existe y llegó a mentir.
- `HUGGINGFACEHUB_API_KEY`: seteada en Vercel (permiso *"Make calls to Inference
  Providers"*).
- **`VECTOR_STORE_PROVIDER=pgvector`**: los embeddings persisten en Neon (tabla
  `ai_report_embeddings`, extensión `vector 0.8.1`). Con el `MemoryVectorStore` anterior el
  índice vivía en la RAM de cada lambda y un reporte recién creado podía **no verse**.
- **`useAI.js` llamaba a una ruta RELATIVA** (`/api/ai`) → el navegador hacía POST contra
  el hosting estático del frontend y recibía **405**. El asistente estuvo inservible desde
  el día uno pese a que el backend funcionaba. Corregido (PR #67).

**Qué es:** El asistente/diagnóstico usa:
- **LLM:** Groq `openai/gpt-oss-120b` (`@langchain/groq`) — ver `backend/src/ai/config.js`. Migrado desde `llama3-70b-8192` el 2026-07-12: Groq retiró esa familia Llama y anunció la baja de `llama-3.3-70b-versatile` y `llama-3.1-8b-instant` (dejan de servirse el **2026-08-16**). GPT-OSS 120B es el reemplazo recomendado por Groq para la gama 70B; `openai/gpt-oss-20b` es la opción barata. El modelo se cambia sin tocar código vía `GROQ_MODEL`.
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2`.
- **Orquestación:** LangGraph — `assistantGraph.js` (agente con tools), `diagnosticGraph.js` (grafo multinodo), `ragChain.js` (RAG). Endpoints en `backend/src/routes/aiRoutes.js`.

**El flujo del agente NO se puede verificar desde la red local (Venezuela):**
- **Groq** geo-bloquea por IP. Devuelve `403 Access denied. Please check your network settings` aunque la API key sea válida.
  Verificado 2026-06-06: `POST /api/ai/chat` → `500` (el agente llega a Groq y este rechaza).
  → La IP de Vercel (US) **sí** está permitida, así que el geo-bloqueo no aplica allí. No hay arreglo de código.
  → ⚠️ **El geo-bloqueo OCULTA si la key sirve:** el 403 llega ANTES de validar la credencial, así que desde local una key buena y una revocada se ven idénticas. Eso escondió durante semanas que la key estaba muerta. **No validar la key desde local; mirar `groq_key_status` en `/api/ai/status`,** que lo comprueba desde Vercel sin gastar tokens.
- **HuggingFace** (embeddings): resuelto. El token necesita el permiso *"Make calls to Inference Providers"* (fine-grained); ya está seteado en Vercel.

**Deuda real:**
- No hay test de integración que ejercite el LLM real; los tests mockean el LLM vía el contenedor de inyección de dependencias (`backend/src/ai/container.js`). La capa IA solo se valida de verdad en el deployment — y eso permitió que el bug del 405 del frontend pasara desapercibido.
- Para verificar IA en local: VPN a una región permitida por Groq. Si no, validar solo vía el preview/producción de Vercel.

---

## 2. Email — multi-proveedor (SMTP / Brevo / Resend / simulado); falta configurar credenciales

**Estado (2026-06-06):** `emailService.js` es un servicio **multi-proveedor** que elige según lo configurado: **SMTP** (elegido) → Brevo → Resend → simulado. Contrato de retorno intacto (`{simulated}` / `{success, messageId}` / `{success:false, error}`), por lo que `pdfController` y `passwordController` no cambian. Sin ninguna config, **simula** (no falla) — tests/CI no envían.

**Por qué SMTP (Gmail):** gratis, **sin dominio y sin registro nuevo** (usa una cuenta Gmail existente). Razón del cambio: **Brevo no se pudo usar** (bloquea el registro desde Venezuela y exige verificación por SMS que no llega a un número de Colombia). SendGrid/Twilio tienen el mismo problema de teléfono. Resend funciona (verificado envío real) pero sin dominio solo envía al dueño de la cuenta. Gmail SMTP no está geo-bloqueado y envía a cualquier destinatario (~500/día).

**Pendiente de configuración (NO es código):**
- En la cuenta Gmail: activar **verificación en 2 pasos** y generar una **App Password** (`myaccount.google.com/apppasswords`).
- Setear en `.env` (y en Vercel): `SMTP_USER` (el gmail), `SMTP_PASS` (la App Password de 16 caracteres), `SMTP_FROM`.
- Opcional dev: `EMAIL_DEV_OVERRIDE_TO` para redirigir todos los correos a una dirección de prueba.
- Falta la **verificación en vivo con SMTP** (no se hizo porque aún no hay App Password en el `.env`); con Resend sí se verificó envío real.

**Limpieza menor:** ahora `nodemailer` SÍ se usa (proveedor SMTP). Si en el futuro se fija un único proveedor, eliminar los no usados (`resend` y/o `nodemailer`) en un cambio aparte (evitar churn del lockfile — ver item 3).

**✅ RESUELTO el 2026-07-13 — y la causa NO era la que se creía.**

Durante semanas se dio por hecho que la App Password estaba **revocada**, porque Gmail
devolvía `535-5.7.8 Username and Password not accepted` (`?p=BadCredentials`).
**Era falso: la clave siempre fue válida.**

El fallo real: **`SMTP_USER` apuntaba a `hidrobombasmerida@gmail.com`** (sin punto, sin
1948), mientras la App Password pertenecía a **`hidrobombas.merida1948@gmail.com`** — otra
cuenta. Con la MISMA contraseña de siempre y el usuario correcto: `AUTH OK`.

Corregidos `SMTP_USER`/`SMTP_FROM` en `backend/.env` y en Vercel (Production y Preview).
**Verificado con un envío real desde producción**: `POST /api/auth/forgot-password` → log
`password reset email enviado, provider: smtp, messageId: <…@gmail.com>`. Los correos de
reporte en PDF y de reset de contraseña funcionan.

**Por qué costó tanto (lecciones):**
- `535 BadCredentials` suena a "contraseña incorrecta", pero significa "esta
  **combinación** de usuario y contraseña no autentica". Al leerlo como un problema de la
  clave, la investigación se fue tras hipótesis falsas: el formato con/sin espacios
  (irrelevante — **autentica de las dos formas**), si el 2FA estaba activo, y si Google
  había cambiado su política (**no la ha cambiado**: las App Passwords con 2FA siguen
  siendo el mecanismo válido para SMTP). Nadie miró el `SMTP_USER`.
- **Ante un 535: verificar primero la CUENTA, no la clave.**
- El código de email siempre fue correcto (14 tests de email/PDF en verde); el fallo era
  100% de configuración.

**Sigue vigente:** no hay failover — con `SMTP_USER`/`SMTP_PASS` presentes el servicio usa
SMTP y **no** cae a Resend si la auth falla ("el primero configurado gana"). Las `SMTP_*`
de Vercel son *Sensitive*: no se pueden leer, solo sobrescribir.

---

## 3. Dependencias / vulnerabilidades — no aplicar `npm audit fix` a ciegas

**Qué pasa:** Bumps del ecosistema `@langchain/*` (y transitivos como `uuid`) **rompen el build y han tumbado producción** (`FUNCTION_INVOCATION_FAILED`) aunque los tests estén en verde.
- Verificado 2026-06-06: `npm audit fix` subió `@langchain/langgraph-checkpoint` a una versión **ESM-only** → `SyntaxError: Unexpected token 'export'` en Jest (y rompería el backend CommonJS en prod). Incluso el fix "seguro" de `ws` arrastró 700+ líneas de churn con deps opcionales de langchain.

**Estado real:** `npm audit` muestra **0 high / 0 critical**. Las moderate son una sola advisory de `uuid` (bounds de buffer en v3/v5/v6 *al pasar un `buf`*) que la app no dispara (usa `UUIDV4` sin `buf`). Las low son tooling de dev/test (jsdom, eslint, jest, brace-expansion) que no se envía a producción.

**Deuda real:** limpiar las alertas de Dependabot **una a una**, verificando el **preview de Vercel** + `curl /api/health` ANTES de mergear a `main`. Nunca con `npm audit fix` masivo.

**Actualización 2026-06-16 (rama `chore/security-deps`):**
- Se aplicó `npm audit fix` **sin `--force`** (solo cambia el lockfile; `package.json` intacto). Resultado:
  - **Backend:** 32 → 25 vulnerabilidades. Eliminadas las **2 high** (`ws`, `form-data`, transitivas de `@langchain/community` → `jsdom@16`). Verificado: suite completa (338 tests) en verde, y `require('./src/app')` + grafos IA (`assistantGraph`/`diagnosticGraph`/`ragChain`) cargan sin error ESM. Churn del lockfile ~1099 líneas (el riesgo conocido) → **gate final = preview de Vercel**.
  - **Frontend:** 11 → 8 vulnerabilidades. `npm run build` + 76 tests en verde.
- **Pendientes (requieren `--force` / breaking, NO aplicados):**
  - Backend `uuid` (20 moderate): `audit fix --force` quiere **degradar `sequelize` a 3.30.0** (rompe el ORM). La app usa `UUIDV4` sin `buf`, así que **no dispara** la advisory (GHSA-w5hq-g745-h8pq). Se deja.
  - Frontend 3 high restantes: requieren bump **mayor de `vite`** (rompería el build). Tooling de dev, no llega al usuario. Se deja para un bump deliberado de Vite.

---

## 3.5 ✅ La suite pasaba en verde con producción rota — RESUELTO (CI contra Postgres)

**Qué pasó (2026-07-13):** con **384 tests en verde**, ejercitar el flujo real contra
producción destapó ~6 bugs, uno de ellos crítico: **crear un equipo fallaba SIEMPRE**
(`invalid input value for enum enum_equipment_status: "active"`). Sin equipos no hay
reportes: el CMMS no servía para su función principal.

**Dos causas estructurales:**

**a) La trampa SQLite/Postgres.** Los tests corren contra SQLite, que **no valida ENUM ni
UUID**; Postgres sí. Todo lo que dependa de eso pasa el CI y revienta solo en producción:
- enum de `status` en Equipment (500 en cada alta),
- `visit_type` sin validar (500 en vez de 400),
- `:id` malformado → `invalid input syntax for type uuid` (500 en vez de 404).

**b) Los tests CODIFICAN el bug.** Cuatro casos reales en una sola sesión:
- `aiVectorStore.unit` mockeaba `@langchain/core/vectorstores` **fabricando una clase que
  ese módulo nunca exportó** → ocultó un import roto que reventaba el RAG.
- `equipmentRoutes.integration`: `expect(status).toBe('active')` ← el valor inválido.
- `serviceReportRoutes.integration`: enviaba `visit_type:'semestral'` (inexistente) y
  esperaba 200.
- `useAI.test`: `toHaveBeenCalledWith('/api/ai/chat')` ← la ruta relativa que daba 405.

Un test que afirma lo que el código **hace** (en vez de lo que **debería** hacer) no prueba
nada: convierte el bug en contrato y lo blinda contra el arreglo.

**✅ RESUELTO (PR #69):** el CI corre ahora la suite **también contra un PostgreSQL real**
(job `backend-tests-postgres`, servicio `postgres:16`). Se **mantiene** el job de SQLite
(48s, feedback rápido); el de Postgres (1m13s) es la red de seguridad.

**Cazó un bug a la primera:** `updateUserRole` hacía `user.role = req.body.role || ...`
**sin validar** → cualquier string llegaba a la BD y Postgres devolvía un 500 en vez de un
400. Y los tests usaban `role: 'user'`, un rol que **ni existe** (el enum es
`admin|supervisor|technician|client`); uno afirmaba `expect(role).toBe('user')`.

**Lo que hubo que destrabar** (estaba todo en contra):
1. `jest.setupEnv.js` forzaba `DATABASE_URL=''` → era IMPOSIBLE apuntar la suite a Postgres.
2. `config/database.js` inyectaba el driver WebSocket de Neon + TLS obligatorio, que un
   Postgres local no puede dar. Ahora detecta el host local y usa `pg` estándar.
3. `sync({force:true})` recrea las tablas pero **deja los tipos ENUM** → `type "..." does
   not exist`. Se parte de un schema vacío (`DROP SCHEMA public CASCADE`).
   ⚠️ Ese DROP borra la base entera: `setup.js` se **niega** a ejecutarlo si el nombre de la
   base no contiene `test` (evita cargarse producción por un `DATABASE_URL` mal puesto).
4. `--runInBand` obligatorio: los workers comparten la única BD y se borrarían las tablas
   entre ellos (con SQLite en memoria cada worker tiene la suya).

**Mitigación estructural:** los enums tienen ya una **única fuente de verdad en el modelo**
(`EQUIPMENT_STATUSES`, `VISIT_TYPES`, `USER_ROLES`), que controladores y validadores Zod
importan en vez de redeclarar.

**Sigue vigente:** un test que afirma lo que el código **hace** (en vez de lo que **debería**
hacer) no prueba nada. Ante un test que falla al arreglar algo, preguntarse siempre si el
test estaba **codificando el bug**.

---

## 4. Campos huérfanos del wizard de mantenimiento — decidir limpiar o crear UI

**Qué pasa (2026-06-17):** Hay campos definidos en `initialData` de `frontend/src/components/ServiceWizard/WizardContext.jsx` que **ningún paso del wizard captura** (no tienen UI) y el PDF no muestra. Quedan siempre vacíos:

- En `control_peripherals_data`: `preset_work`, `preset_emergency`, `preset_compressor`, `valve_vents` (válvula venteo), `pilot_lights` (luces piloto), `switches` (interruptores), `timer` (temporizador).
- En `motor_X_data`: `contactor_working` (estado del contactor).

**Decisión pendiente (requiere mirar la planilla física de Hidrobombas):**
- Si el ítem **sí está** en la hoja de papel → es funcionalidad pendiente: crear UI en el paso correspondiente del wizard **y** mostrarlo en `backend/src/services/pdfService.js`.
- Si **no está** → es campo muerto: eliminarlo de `initialData` (más limpio; reversible por git).

**Contexto relacionado:** el `pdfService.js` ya soporta hasta **3 bombas**, pero `initialData` solo define `pump_1` y `pump_2` (falta `pump_3_on_minutes`/`_rest_minutes`/`_noise_db` + su UI en `Step11CiclosRuido.jsx`). Mismo criterio: agregar la 3ª bomba si la planilla la contempla.

**Nota:** no es pérdida de datos (los campos nunca se llenan), es deuda de consistencia entre el formulario, el modelo y el PDF. Verificado por inspección del wizard, controller y render real del PDF el 2026-06-17.
