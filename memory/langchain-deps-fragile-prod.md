---
name: langchain-deps-fragile-prod
description: Actualizar el ecosistema langchain / npm audit fix puede tumbar producción aunque los tests pasen
metadata:
  type: project
---

`npm audit fix` y los bumps del ecosistema `@langchain/*` (langgraph, langgraph-checkpoint, openai, y transitivos como `uuid`) son **peligrosos en este repo**:

- **Tests (Jest, CommonJS):** versiones nuevas solo-ESM rompen con `Unexpected token 'export'`. Se puede mitigar con babel-jest + `transformIgnorePatterns`, PERO eso solo arregla los tests.
- **Producción (Vercel, node):** un `npm audit fix` que bumpeó langchain/uuid causó **`FUNCTION_INVOCATION_FAILED` (HTTP 500)** al arrancar, aunque TODOS los tests (323 backend + 72 frontend) y el CI estaban en verde, y aunque `node` local (v24) cargaba `app.js` sin error. La causa exacta no se aisló (posible edge del runtime de Vercel).

**Why:** Tests verdes ≠ producción funciona, para bumps de langchain.
**How to apply:**
- NO mergear a `main`/producción bumps del ecosistema langchain ni `npm audit fix` sin **verificar el arranque real en un deployment de Vercel** (preview) primero.
- Las vulnerabilidades restantes de Dependabot son dev/build-time/transitivas, 0 high reales, runtime sin riesgo (uuid v4) → aceptables; ver análisis previo.
- Se revirtió el intento (PRs #20/#21) con `git revert -m 1`; el estado bueno de referencia fue el commit `67f93a6`.
- Para probar cambios que tocan dependencias: usar la URL del **preview deployment** del PR (Vercel la genera) y hacer `curl` a `/api/health` ANTES de mergear a main.
