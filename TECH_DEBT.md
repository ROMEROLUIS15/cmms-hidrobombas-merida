# Deuda Técnica — CMMS Hidrobombas Mérida

Registro de limitaciones conocidas y trabajo pendiente. Última verificación: **2026-06-06**.

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

## 2. Email — migrado a Resend; falta verificar dominio para enviar a clientes

**Estado (2026-06-06):** `emailService.js` migrado de nodemailer/SMTP a **Resend**. Verificado en vivo: envío real **exitoso** (Resend devolvió `messageId`) a la dirección dueña de la cuenta. Contrato de retorno intacto (`{simulated}` / `{success, messageId}` / `{success:false, error}`), por lo que `pdfController` y `passwordController` siguen funcionando. Si `RESEND_API_KEY` no está en el entorno, el envío se **simula** (no falla) — así los tests y CI no envían correos.

**Pendiente de configuración (NO es código):**
- `RESEND_DEV_OVERRIDE_TO` está como `tu_email@gmail.com` (placeholder). Ponerlo en una dirección real para pruebas, o vaciarlo en producción.
- La cuenta Resend está en **modo test**: con el remitente `onboarding@resend.dev` solo se puede enviar al correo dueño de la cuenta (`romeroluis.dev@gmail.com`). Para enviar a **clientes reales** hay que **verificar un dominio** en `resend.com/domains` y poner `RESEND_FROM_EMAIL` con ese dominio (ej. `Hidrobombas <reportes@tudominio.com>`).

**Limpieza menor:** `nodemailer` quedó como dependencia sin uso; quitarla en un cambio aparte (evitar churn del lockfile — ver item 3).

---

## 3. Dependencias / vulnerabilidades — no aplicar `npm audit fix` a ciegas

**Qué pasa:** Bumps del ecosistema `@langchain/*` (y transitivos como `uuid`) **rompen el build y han tumbado producción** (`FUNCTION_INVOCATION_FAILED`) aunque los tests estén en verde.
- Verificado 2026-06-06: `npm audit fix` subió `@langchain/langgraph-checkpoint` a una versión **ESM-only** → `SyntaxError: Unexpected token 'export'` en Jest (y rompería el backend CommonJS en prod). Incluso el fix "seguro" de `ws` arrastró 700+ líneas de churn con deps opcionales de langchain.

**Estado real:** `npm audit` muestra **0 high / 0 critical**. Las moderate son una sola advisory de `uuid` (bounds de buffer en v3/v5/v6 *al pasar un `buf`*) que la app no dispara (usa `UUIDV4` sin `buf`). Las low son tooling de dev/test (jsdom, eslint, jest, brace-expansion) que no se envía a producción.

**Deuda real:** limpiar las alertas de Dependabot **una a una**, verificando el **preview de Vercel** + `curl /api/health` ANTES de mergear a `main`. Nunca con `npm audit fix` masivo.
