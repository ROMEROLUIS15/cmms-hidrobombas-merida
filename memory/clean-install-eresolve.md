---
name: clean-install-eresolve
description: Un npm install desde cero (sin lock) falla con ERESOLVE; usar el lock existente o --legacy-peer-deps
metadata:
  type: project
---

Un `npm install` **desde cero** (borrando `package-lock.json` + `node_modules`) falla con **ERESOLVE** (conflicto de peer dependencies). El lock del repo se generó en algún momento con peer-deps relajados, así que solo los installs **incrementales** (respetando el lock existente) resuelven limpio.

**Why:** Si alguien borra el lock para "regenerarlo limpio", el install se cae y parece que el repo está roto, cuando en realidad el flujo normal (con lock) funciona.
**How to apply:** No borres `package-lock.json` para reinstalar. Si necesitas un resolve desde cero, usa `npm install --legacy-peer-deps`. Audita/instala siempre contra el lock raíz — ver [[npm-workspaces-root-lock]] y [[npm-audit-no-safe-fix]].

Relacionado: vitest del frontend dependía por accidente del `jsdom@16` que LangChain hoisteaba a la raíz; se fijó añadiendo `jsdom@^26.1.0` a las devDependencies de la raíz (PR #41).
