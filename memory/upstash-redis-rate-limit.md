---
name: upstash-redis-rate-limit
description: Upstash Redis del rate limiting: cómo está montado y el incidente que tumbó producción al conectarlo
metadata:
  type: project
---

**Montaje (2026-07-13):** recurso `upstash-kv-citrine-zebra` (Upstash for Redis, plan free)
del Marketplace de Vercel, conectado al proyecto **backend**. Inyecta `REDIS_URL`
(`rediss://…:6379`, TCP+TLS) además de `KV_*`/`KV_REST_API_*`.
**`ioredis` necesita la `rediss://`**; las `UPSTASH_REDIS_REST_*` NO sirven.

Provisionar exige aceptar términos legales en el navegador (el CLI no puede):
`vercel integration add upstash/upstash-kv` (el producto Redis es **`upstash-kv`**, no
`upstash-vector`/`qstash`/`search`). Provisionar **no conecta**: hace falta
`vercel integration resource connect <recurso> <proyecto>`, que es lo que inyecta las vars.
Reconectar re-inyecta `REDIS_URL` si se borró.

**INCIDENTE — al conectar Redis, producción se cayó: TODOS los logins → 500.**
Dos bugs en `config/rateLimitStore.js` (arreglados en PR #58):
1. `lazyConnect: true` + `enableOfflineQueue: false` se contradicen: el primer comando (el
   que abre el socket) se rechaza al instante con *"Stream isn't writeable and
   enableOfflineQueue options is false"*. En serverless cada cold start reconecta → casi
   cada request. Arreglo: `enableOfflineQueue: true`.
2. **Un fallo del store mataba la API.** `express-rate-limit` propaga cualquier error del
   store al middleware de errores → un Redis caído tumbaba `/api/auth/login`. Arreglo:
   `withMemoryFallback` degrada a MemoryStore.

**Why:** el rate limiting es una **protección, no una dependencia crítica**. Si Redis falla
debe contar peor, nunca dejar a los usuarios fuera. El módulo **no tenía ni un test**; por
eso ambos bugs llegaron a prod.

**How to apply:**
- Ante una caída al tocar infra: **restaurar primero** (quitar la var + redeploy), depurar
  después. Se hizo así y el servicio volvió en un minuto.
- Verificar que el store es GLOBAL de verdad: el contador `Ratelimit-Remaining` debe
  **continuar** tras un deployment nuevo (con MemoryStore se resetearía).
- La integración instala skills suyas en `backend/.agents/skills/` + `backend/skills-lock.json`.
  Se borraron; no son necesarias. No confundir con el `.agents/` de la raíz (Neon), que sí se usa.
- Ver [[vercel-deploy-reference]] y [[pending-config-tasks]].
