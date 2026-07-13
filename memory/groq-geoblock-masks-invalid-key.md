---
name: groq-geoblock-masks-invalid-key
description: El geo-bloqueo de Groq impide validar la API key desde la red local; verificar siempre desde Vercel
metadata:
  type: project
---

Groq **geo-bloquea por IP** (la red local en Venezuela entre ellas) y responde
`403 Access denied. Please check your network settings` **ANTES de mirar la credencial**.

**Why:** eso significa que desde local es **imposible** saber si una `GROQ_API_KEY` sirve:
se ve el mismo 403 con una key buena que con una revocada. Esto ocultó durante semanas que
la key de producción estaba **muerta** (`401 invalid_api_key`). Solo se descubrió llamando
desde Vercel (IP de EE.UU.), donde Groq sí llega a evaluarla.

**How to apply:**
- **Nunca** validar la key de Groq desde la máquina local; hacerlo desde producción.
- Consultar `GET /api/ai/status` y mirar **`groq_key_status`**, no `groq_configured`
  (este último solo dice que la variable EXISTE — mintió en producción). Añadido en PR #55:
  - `valid` → Groq acepta la key.
  - `invalid` → 401: revocada/errónea. Regenerar en console.groq.com/keys.
  - `unreachable` → 403 geo-bloqueo, timeout o red. **La key puede ser buena**; no se pudo
    comprobar. Confundir esto con `invalid` es el error que costó semanas.
  - `not_configured` → no hay key.
- El chequeo usa `GET /openai/v1/models`, que valida **sin consumir tokens** del LLM.
- No hace falta desactivar el VPN para probar la IA: el backend la valida desde Vercel.
- Mismo patrón que [[smtp-credentials-broken]]: una credencial que "se generó bien" no es
  una credencial que autentique. Generar ≠ autenticar.
