---
name: frontend-url-api-absoluta
description: Frontend y backend son dominios Vercel distintos; una ruta relativa /api/... da 405 en producción
metadata:
  type: project
---

**El frontend y el backend son DOS proyectos Vercel con dominios distintos:**
- Frontend (estático): `hidrobombas-merida.vercel.app`
- Backend (API): `cmms-hidrobombas-merida-backend.vercel.app`

Por eso **toda** llamada a la API debe ser **absoluta**, vía
`import.meta.env.VITE_API_URL` (que Vite inyecta en tiempo de build y está seteada en el
proyecto del frontend).

**Una ruta relativa (`/api/...`) va contra el hosting ESTÁTICO del frontend y devuelve
405.** El backend ni se entera.

**Incidente (2026-07-13):** `useAI.js` usaba `const AI_API = '/api/ai'`. El asistente de
IA **estuvo inservible desde el primer día** (`POST api/ai/chat → 405`, "Error al
comunicarse con el asistente"). Lo irónico: todo el backend de IA funcionaba —modelo,
key, embeddings, RAG— pero el frontend **nunca lo llamaba**. Arreglado en PR #67.

`useOfflineQueue.enqueueReport` tenía el mismo default relativo. No rompía nada porque
`ServiceWizard` pasa la URL absoluta, pero el riesgo era peor: **perder los reportes de
un técnico sin conexión**, justo lo que esa cola existe para evitar. Endurecido.

**How to apply:**
- Antes de dar por bueno un fallo de red en el navegador, mirar **a qué dominio** se está
  llamando. Un 405 en un POST casi siempre es esto.
- Comprobar qué URL quedó COMPILADA en el bundle desplegado (Vite inlinea las env vars):
  `curl <frontend>/assets/index-*.js | grep -o 'cmms-hidrobombas-merida-backend[^"]*'`.
- Al ser cross-origin, el backend debe permitir el origen por CORS (`FRONTEND_URL`).
  Verificado: el preflight OPTIONS devuelve `Access-Control-Allow-Origin` correcto.
- El test de `useAI` **codificaba la ruta relativa** como correcta. Ver
  [[tests-verde-produccion-rota]].
