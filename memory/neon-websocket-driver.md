---
name: neon-websocket-driver
description: La red local del usuario bloquea Postgres TCP/5432; Sequelize conecta a Neon vía driver WebSocket serverless
metadata:
  type: project
---

La red de desarrollo del usuario bloquea conexiones Postgres directas (TCP puerto
5432) y las corta con `ECONNRESET`. El driver `@neondatabase/serverless` (WebSocket
sobre 443) sí pasa.

Por eso `backend/src/config/database.js` usa `dialectModule: @neondatabase/serverless`
con `neonConfig.webSocketConstructor` para TODas las conexiones Postgres (dev y prod).
No volver a `pg` sobre TCP — no conecta desde su red.

**Por qué:** antes el `database.js` caía a SQLite en silencio cuando el 5432 fallaba,
ocultando el problema y rompiendo la paridad con producción.

**How to apply:** dev usa el branch `dev` de Neon (proyecto `noisy-fog-06869960`),
prod usa el branch `production` (configurado en Vercel). El fallback a SQLite ahora es
opt-in con `ALLOW_SQLITE_FALLBACK=true`; por defecto el arranque falla visible si la DB
no conecta. Tests siguen en SQLite in-memory (`DATABASE_URL=''`). Ver [[langchain-deps-fragile-prod]]
para el patrón de verificar prod/Vercel antes de mergear.
