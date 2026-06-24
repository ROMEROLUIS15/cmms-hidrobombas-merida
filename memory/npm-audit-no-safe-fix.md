---
name: npm-audit-no-safe-fix
description: Las ~28 vulnerabilidades de npm audit no tienen arreglo seguro; no correr audit fix --force ni bajar sequelize
metadata:
  type: project
---

`npm audit` en el lock raíz reporta ~28 vulns (6 low, 22 moderate, 0 high/critical). Tras analizar las cadenas (2026-06-23), **ninguna se debe arreglar**; caen en tres cubos:

1. **Tooling de test (dev-only, ~22):** jest 27.x, @jest/*, babel-jest, babel-plugin-istanbul, `js-yaml@3.14.2`. Solo corre en CI/local, nunca en el servidor. Se resolverían subiendo Jest 27→30 (tarea aparte, opcional).
2. **Árbol de LangChain:** `js-yaml@4.2.0` y `@tootallnate/once` (vía `jsdom`→`http-proxy-agent`) cuelgan de `@langchain/community`. No se pueden tocar sin bumpear LangChain, que tumba prod — ver [[langchain-deps-fragile-prod]].
3. **`uuid@8.3.2` ← `sequelize@6.37.8`:** el único "fix" que ofrece npm es **downgrade de sequelize a 3.30.0** (rompería el ORM entero). Además NO es explotable: el advisory (GHSA-w5hq-g745-h8pq) afecta a uuid v3/v5/v6 *cuando se pasa `buf`*, y Sequelize genera UUID v1/v4 sin `buf`.

**Why:** Evitar que cada `npm audit` o PR de Dependabot dispare falsa alarma y se "arregle" rompiendo producción.
**How to apply:** NO correr `npm audit fix --force`. `npm audit fix` sin force no instala nada (verificado con --dry-run). Auditar siempre en el lock raíz, no por la lista de Dependabot — ver [[npm-workspaces-root-lock]].
