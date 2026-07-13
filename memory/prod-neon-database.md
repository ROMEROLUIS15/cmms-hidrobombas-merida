---
name: prod-neon-database
description: Cuál es la Neon buena de producción y por qué Vercel apuntaba a una vacía
metadata:
  type: project
---

**La BD de producción es la misma que la de `backend/.env`:** host
`ep-damp-hat-ai7kklbs.c-4.us-east-1.aws.neon.tech`, base `neondb`, user `neondb_owner`.

**Incidente (2026-07-12):** la `DATABASE_URL` de Vercel apuntaba a **otra** base, sin
tablas. `POST /api/auth/login` devolvía 500 con `relation "users" does not exist` — nadie
podía entrar. Corregido: se reemplazó `DATABASE_URL` en Vercel (Production **y** Preview)
por la buena.

**Why:** el fallo no se auto-reparaba y era invisible. `/api/health` decía `connected`
(la conexión SÍ funcionaba), y `initializeDatabase()` completaba sin error porque el
runner de migraciones veía `SequelizeMeta` con 0001/0002 ya registradas y no creaba nada.
Conexión OK + migraciones "al día" + cero tablas.

**How to apply:**
- Ante un 500 raro en prod, mirar `npx vercel logs <url> --json`: el mensaje real va ahí,
  la API solo devuelve "Internal server error" + `correlationId`.
- **No se puede leer `DATABASE_URL` de Vercel**: está marcada como *Sensitive*, y
  `vercel env pull` la trae **vacía**. No es que esté vacía en runtime — es que no se
  puede recuperar. Para compararla, hay que inferir por comportamiento.
- `vercel env rm NOMBRE production` **borra la variable de TODOS los entornos** si la
  entrada cubría varios (Production+Preview). Tras un `rm`, re-añadir en ambos.
- No se perdió ningún dato en el cambio: **ninguna de las dos bases tenía datos**. El
  sistema nunca se había usado en producción.
- El `JWT_SECRET` de `backend/.env` **es el mismo de producción** (se verificó firmando un
  token local que prod aceptó) → ese archivo abre prod. Rotar. Ver [[pending-config-tasks]].
