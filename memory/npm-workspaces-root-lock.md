---
name: npm-workspaces-root-lock
description: Monorepo npm workspaces; el único package-lock que cuenta es el raíz, audita ahí
metadata:
  type: project
---

El repo es un monorepo **npm workspaces** (`workspaces: ["frontend","backend"]` en
el `package.json` raíz). El único lock que npm, CI y Vercel usan es el
`package-lock.json` **raíz**. CI corre `npm ci` en la raíz y los tests con
`-w frontend` / `-w backend`.

**Por qué importa:** Dependabot escanea CUALQUIER `package-lock.json` commiteado, así
que sub-locks vestigiales inflan las alertas con falsos positivos. En jun-2026 había
56 alertas pero el árbol real (lock raíz) solo tenía 30. Se borraron
`frontend/package-lock.json` y `backend/package-lock.json` (vestigios pre-workspace,
con react-scripts/CRA aunque el front ya es Vite) → ~26 alertas fantasma menos.

**How to apply:** para ver vulnerabilidades REALES usar `npm audit` en la raíz, no la
lista de Dependabot. Preferir `npm audit fix` SIN `--force` (el --force degradaba
sequelize a 3.x y bumpeaba nodemailer a 9.x breaking). No regenerar el lock del
backend a lo bruto por [[langchain-deps-fragile-prod]]; tocar solo paquetes
vulnerables nombrados. La red local obliga a [[neon-websocket-driver]].
