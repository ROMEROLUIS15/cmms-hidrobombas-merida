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

**Actualización 2026-07-13 — LangChain v1 mueve clases de sitio, y los mocks lo ocultan.**
`POST /api/ai/ask` reventaba en prod con `TypeError: MemoryVectorStore is not a constructor`:
el import apuntaba a `@langchain/core/vectorstores`, que solo exporta la clase **base**. En
v1, `MemoryVectorStore` vive en **`@langchain/classic/vectorstores/memory`**.
- Un import así **no falla al cargar el módulo**: revienta en runtime la primera vez que se
  usa el RAG. `/api/health` seguía en verde.
- **La suite no lo cazó porque el test mockeaba el módulo equivocado FABRICANDO la clase que
  no existía.** Un mock que inventa la API que dice verificar no prueba nada. Arreglado en
  PR #56 con un test SIN mocks (`aiVectorStoreImport.unit.test.js`) que carga el módulo real.
- `@langchain/classic` entra hoy como dependencia **transitiva** de `langchain`; el RAG
  depende de ella sin declararla. Declararla explícita toca el lock → cambio aislado y
  verificado en preview (ver [[pending-config-tasks]]).
