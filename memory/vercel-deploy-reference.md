---
name: vercel-deploy-reference
description: Proyectos Vercel del CMMS, CLI linkeado y variables de entorno de prod presentes
metadata:
  type: reference
---

Despliegue en Vercel (cuenta `romeroluis15` / scope `luis-romeros-projects`):
- **Backend (API):** proyecto `cmms-hidrobombas-merida-backend` → https://cmms-hidrobombas-merida-backend.vercel.app (`backend/vercel.json`, `@vercel/node` sobre `src/server.js`).
- **Frontend:** proyecto `hidrobombas-merida` → https://hidrobombas-merida.vercel.app.
- **Solo existen esos dos proyectos.** Hubo un tercero huérfano `cmms-hidrobombas-merida` (origen desconocido) cuyo Framework Preset quedó en "Services" y fallaba en cada push a `main` con `Project framework is set to "services"`; se **eliminó** el 2026-06-24 vía `npx vercel project rm`. No recrearlo.

**CLI:** no está en el PATH de Bash/PowerShell; usar **`npx vercel ...`** (v54.x). El
directorio raíz quedó **linkeado** al proyecto backend (`.vercel/`, gitignored).
`vercel env ls production` funciona desde la raíz.

**Env vars de producción** (backend, valores cifrados): `JWT_SECRET`, `REFRESH_TOKEN_SECRET`,
`DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV`, `BCRYPT_ROUNDS`, `JWT_EXPIRES_IN`, `PORT`,
`DB_STORAGE`, todas las `SMTP_*` y varias `SEED_*`. Añadidas el 2026-07-12/13:
**`GROQ_API_KEY`** (rotada; la vieja estaba revocada) y **`HUGGINGFACEHUB_API_KEY`**.
`GROQ_MODEL` NO existe a propósito: así manda el default del código (`openai/gpt-oss-120b`).
**NO existe `REDIS_URL`** todavía (ver [[pending-config-tasks]]).

⚠️ `DATABASE_URL` estuvo apuntando a una **BD vacía y equivocada** hasta el 2026-07-12;
corregida en Production y Preview. Ver [[prod-neon-database]].

Para setear una var: `echo "valor" | npx vercel env add NOMBRE production` (idem preview).
Ojo: `vercel env rm NOMBRE production` **borra la var de TODOS los entornos** si la entrada
cubría varios; re-añadirla en cada uno.

**Redeploy sin subir el árbol local:** `npx vercel redeploy <url-del-deployment>` reconstruye
el commit ya desplegado con las env vars actuales. **NO usar `vercel --prod`** desde local:
sube el working tree (que hoy tiene deps sin commitear). Los cambios de env solo entran con
un deploy nuevo.

Gate de cualquier cambio que toque la DB/arranque = el **preview de Vercel**.
Los logs reales de runtime: `npx vercel logs <url> --json` (la API solo devuelve
"Internal server error" + `correlationId`).
