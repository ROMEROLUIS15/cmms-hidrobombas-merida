# Deuda Técnica — CMMS Hidrobombas Mérida

Registro de limitaciones conocidas y trabajo pendiente. Última verificación: **2026-06-24**.

---

## 1. IA (agente) — no verificable localmente, sí en producción

**Qué es:** El asistente/diagnóstico usa:
- **LLM:** Groq `llama3-70b-8192` (`@langchain/groq`) — ver `backend/src/ai/config.js`.
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2`.
- **Orquestación:** LangGraph — `assistantGraph.js` (agente con tools), `diagnosticGraph.js` (grafo multinodo), `ragChain.js` (RAG). Endpoints en `backend/src/routes/aiRoutes.js`.

**El flujo del agente NO se puede verificar desde la red local (Venezuela):**
- **Groq** geo-bloquea por IP. Devuelve `403 Access denied. Please check your network settings` aunque la API key sea válida.
  Verificado 2026-06-06: `POST /api/ai/chat` → `500` (el agente llega a Groq y este rechaza).
  → **Funciona en producción** porque Vercel ejecuta desde US (IP permitida). No hay arreglo de código.
- **HuggingFace** (embeddings): el token actual NO tiene el permiso *"Inference Providers"*.
  → Arreglo (no es código): regenerar el token en `hf.co/settings/tokens` activando **"Make calls to Inference Providers"**.

**Deuda real:**
- No hay test de integración que ejercite el LLM real; los tests mockean el LLM vía el contenedor de inyección de dependencias (`backend/src/ai/container.js`). La capa IA solo se valida de verdad en el deployment.
- Para verificar IA en local: VPN a una región permitida por Groq + token de HF con permiso de inference. Si no, validar solo vía el preview/producción de Vercel.

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

**Actualización 2026-06-24 — verificación en vivo realizada: SMTP RECHAZADO.**
Se probó `transporter.verify()` contra Gmail con las credenciales del `.env`
(`hidrobombasmerida@gmail.com` + la App Password actual). Resultado: **`535-5.7.8
Username and Password not accepted`**. Reproducido con la App Password **con
espacios** (19 chars) y **sin espacios** (16 chars) → ambas rechazadas, así que
NO es problema de formato: la App Password está **inválida/expirada/revocada**.
- **Impacto:** con `SMTP_USER`/`SMTP_PASS` presentes, el servicio usa SMTP y
  **no** cae a Resend si la auth falla (modelo "el primero configurado gana").
  Aunque `RESEND_API_KEY` está puesta, hoy los correos de reporte/reset **fallan**.
- **El código es correcto** (14 tests de email/PDF + 347 backend en verde); el
  fallo es 100% de credencial.
- **No verificado en Vercel:** las env vars de producción son independientes del
  `.env` local; no se pudo comprobar desde aquí.
- **Arreglo (NO es código):** regenerar la App Password en
  `myaccount.google.com/apppasswords` (con verificación en 2 pasos activa) y
  setearla en `.env` y en Vercel. Alternativa: activar Resend quitando
  `SMTP_USER`/`SMTP_PASS` (pero sin dominio propio solo envía al dueño de la cuenta).

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

## 4. Campos huérfanos del wizard de mantenimiento — decidir limpiar o crear UI

**Qué pasa (2026-06-17):** Hay campos definidos en `initialData` de `frontend/src/components/ServiceWizard/WizardContext.jsx` que **ningún paso del wizard captura** (no tienen UI) y el PDF no muestra. Quedan siempre vacíos:

- En `control_peripherals_data`: `preset_work`, `preset_emergency`, `preset_compressor`, `valve_vents` (válvula venteo), `pilot_lights` (luces piloto), `switches` (interruptores), `timer` (temporizador).
- En `motor_X_data`: `contactor_working` (estado del contactor).

**Decisión pendiente (requiere mirar la planilla física de Hidrobombas):**
- Si el ítem **sí está** en la hoja de papel → es funcionalidad pendiente: crear UI en el paso correspondiente del wizard **y** mostrarlo en `backend/src/services/pdfService.js`.
- Si **no está** → es campo muerto: eliminarlo de `initialData` (más limpio; reversible por git).

**Contexto relacionado:** el `pdfService.js` ya soporta hasta **3 bombas**, pero `initialData` solo define `pump_1` y `pump_2` (falta `pump_3_on_minutes`/`_rest_minutes`/`_noise_db` + su UI en `Step11CiclosRuido.jsx`). Mismo criterio: agregar la 3ª bomba si la planilla la contempla.

**Nota:** no es pérdida de datos (los campos nunca se llenan), es deuda de consistencia entre el formulario, el modelo y el PDF. Verificado por inspección del wizard, controller y render real del PDF el 2026-06-17.
