---
name: pending-config-tasks
description: Ajustes de configuración pendientes; estado tras poner producción en marcha (2026-07-13)
metadata:
  type: project
---

**Sesión del 2026-07-12/13: producción pasó de rota a funcional.** Antes de esto el
CMMS nunca había llegado a usarse de verdad. Mergeado a `main`: migración del LLM de
Groq (#49), config muerta de Vitest (#50), trust proxy (#53), gate de bootstrap del
admin (#54), validación real de la API key de Groq (#55), import de MemoryVectorStore
(#56).

**RESUELTO en esta sesión (ya no hace falta tocarlo):**
- `DATABASE_URL` de Vercel apuntaba a una BD **vacía y equivocada** → corregida. Ver
  [[prod-neon-database]].
- Primer admin creado (no existía ninguno; el registro web dejaba cuentas muertas).
- `GROQ_API_KEY`: la vieja estaba **revocada**; rotada y ya en Vercel (Production).
- `HUGGINGFACEHUB_API_KEY`: seteada en Vercel (Production). Permiso necesario en el
  token fine-grained: **solo "Make calls to Inference Providers"**.
- IA verificada end-to-end en prod: chat, diagnóstico y RAG responden.
- **`REDIS_URL`**: Upstash provisionado y conectado; rate limiting ya es **global**.
  Conectarlo tumbó producción y hubo que arreglar el store (PR #58). Ver
  [[upstash-redis-rate-limit]].
- **`JWT_SECRET` y `REFRESH_TOKEN_SECRET` rotados** (Production+Preview, 64 bytes
  aleatorios, distintos entre sí, generados sin imprimirlos). El `backend/.env` local
  **ya NO abre producción** (verificado: un token firmado en local da "Invalid token").
  Efecto colateral: desde local ya no se pueden firmar tokens para probar endpoints
  autenticados de prod — hay que loguearse en la web.

- **SMTP**: resuelto. No era la App Password (siempre fue válida): `SMTP_USER` apuntaba a
  otra cuenta de Gmail. Corregido en `.env` y Vercel; envío real verificado desde
  producción. Ver [[smtp-credentials-broken]].

**Pendiente de CONFIGURACIÓN: nada.** Toda la configuración de producción está resuelta y
verificada en vivo (BD, admin, IA, rate limiting, secretos, email).

**Pendiente de CÓDIGO (requieren decisión):**
- **`@langchain/classic` es dependencia TRANSITIVA**, no declarada en `package.json`,
  y de ella depende el RAG (`MemoryVectorStore`). Declararla explícita toca el lock →
  hacerlo aislado y verificado en preview. Ver [[langchain-deps-fragile-prod]].
- **Deps de swagger sin commitear:** `backend/package.json` + `package-lock.json` tienen
  `openspec`, `swagger-jsdoc` y `swagger-ui-express` añadidas pero **ningún archivo las
  importa**. Se decidió NO mergearlas hasta que exista el código que las use.
- **Vector store en RAM:** `MemoryVectorStore` se reconstruye en cada cold start.
  Con volumen, pasar a `VECTOR_STORE_PROVIDER=pgvector` (ya soportado).
- **A2/A3 — token hardening (FE+BE):** el frontend usa `localStorage` + `Bearer` (no las
  cookies httpOnly que el backend ya emite); el interceptor de 401 no auto-refresca.
- **A4 — política de password:** Zod solo exige min 8 (bajo valor).
- **A5 — purga programada** de `RevokedToken`/`PasswordResetToken`.
- **Deuda funcional wizard** (`TECH_DEBT.md` #4): campos huérfanos; requiere ver la
  planilla física de Hidrobombas.

Auditar vulns con [[npm-audit-no-safe-fix]]; no borrar el lock ([[clean-install-eresolve]]).
