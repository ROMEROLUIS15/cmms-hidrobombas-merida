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

**Env vars de producción ya presentes** (backend, valores cifrados): `JWT_SECRET`,
`REFRESH_TOKEN_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV`, `BCRYPT_ROUNDS`,
`JWT_EXPIRES_IN`, `PORT`, `DB_STORAGE`, todas las `SMTP_*` (~2026-06-23) y varias
`SEED_*`. **NO existe `REDIS_URL`** todavía (ver [[pending-config-tasks]]).

Para setear una var: `echo "valor" | npx vercel env add NOMBRE production` (idem preview).
Gate de cualquier cambio que toque la DB/arranque = el **preview de Vercel**.
