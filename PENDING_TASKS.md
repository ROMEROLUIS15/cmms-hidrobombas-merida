# 📋 Tareas Pendientes — CMMS Hidrobombas Mérida

Checklist accionable de deuda técnica **verificada contra el código** el 2026-07-13.
El *porqué* detallado de cada punto vive en [`TECH_DEBT.md`](TECH_DEBT.md); aquí solo está
el *qué hay que hacer*.

> Cada punto lleva la **evidencia** (archivo:línea) con la que se confirmó. Si vuelves a
> auditar, empieza por ahí en vez de fiarte de este documento.

---

## 🔴 Seguridad

- [ ] **Purgar los tokens caducados — no hay ninguna tarea programada.**
  `purgeExpiredRevokedTokens()` existe en `backend/src/utils/tokenRevocation.js:40` pero
  **nadie la llama**: es una función muerta. La tabla `revoked_tokens` crece sin límite.
  `password_reset_tokens` solo se limpia para el usuario que pide un reset
  (`passwordController.js:34`), nunca los caducados de otros.
  → Opciones: `pg_cron` en Neon, un cron de Vercel, o purgar de forma oportunista en el login.

- [ ] **JWT en `localStorage` + sin auto-refresh** (A2/A3).
  El backend **ya emite cookies httpOnly**, pero el frontend guarda el token en
  `localStorage` (`App.jsx:25,52`) y lo manda como `Bearer`. Además, el interceptor de 401
  **cierra la sesión** (`App.jsx:52-54`) en vez de intentar refrescar con el refresh token.
  → Mientras no se cablee el refresh en el frontend, el access token no se puede acortar
  (hoy dura 24h). Cambio coordinado FE+BE, con tests.

- [ ] **Política de contraseñas débil.**
  `authValidators.js:7` solo exige `min(8)`. Sin complejidad, sin lista de contraseñas
  comunes. *(Valor bajo para un sistema interno de pocos usuarios: priorizar por debajo de
  lo anterior.)*

---

## 🟡 Robustez

- [ ] **`emailService` no tiene failover.**
  Es multi-proveedor pero **el primero configurado gana** (`emailService.js:115`): si SMTP
  está configurado y falla, devuelve error y **NO intenta** Brevo ni Resend.
  → Esto ya nos mordió: con la credencial SMTP mal apuntada, todos los correos fallaban
  aunque `RESEND_API_KEY` estuviera puesta. Ver `TECH_DEBT.md` #2.

- [ ] **`@langchain/classic` es dependencia TRANSITIVA.**
  El RAG depende de ella (`vectorStoreProvider.js` importa
  `@langchain/classic/vectorstores/memory`) pero **no está en `backend/package.json`**.
  Hoy funciona porque `langchain` la arrastra; un bump podría dejarnos sin ella.
  → Declararla explícita **toca el lockfile**, y este repo ya se ha caído por churn de deps
  de LangChain con los tests en verde. Hacerlo **aislado y verificando el preview de Vercel**.

---

## 🟢 Funcional

- [ ] **Campos huérfanos del wizard — decidir: eliminar o crear UI.**
  Definidos en `WizardContext.jsx` pero **sin ningún paso que los capture** (verificado):
  `preset_work`, `valve_vents`, `pilot_lights`, `switches`, `timer`, `contactor_working`.
  Se guardan siempre vacíos y el PDF no los muestra.
  → **Requiere mirar la planilla física de Hidrobombas.** Si el dato está en el papel, es
  funcionalidad pendiente (UI + PDF). Si no está, es campo muerto: eliminarlo.
  → Relacionado: `pdfService.js` ya soporta 3 bombas, pero `initialData` solo define 2.

---

## ✅ Ya NO son deuda (verificado el 2026-07-13)

Dos puntos que se daban por pendientes **ya están resueltos**. Se dejan anotados para que
nadie los "arregle" otra vez:

- **RAG con `MemoryVectorStore`** → **RESUELTO.** `VECTOR_STORE_PROVIDER=pgvector` está
  activo en Production y Preview; los embeddings persisten en Neon (tabla
  `ai_report_embeddings`, extensión `vector 0.8.1`). Ya no se pierde el índice en cada cold
  start: verificado 5/5 en producción.
  ⚠️ **Matiz:** el *default del código* sigue siendo `'memory'`
  (`vectorStoreProvider.js:195`). Si algún día desaparece la env var, vuelve silenciosamente
  al store en RAM.

- **Deps de Swagger sin usar** → **RESUELTO.** `openspec`, `swagger-jsdoc` y
  `swagger-ui-express` **ya no están** en `backend/package.json`: se revirtieron al no
  haber ningún archivo que las importara. Se reinstalarán junto con el código que las use.
