# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CMMS (maintenance management system) for Hidrobombas Mérida: technicians fill a 13-step service-report wizard in the field, admins/supervisors manage clients, equipment and assignments. npm-workspaces monorepo: `backend/` (Express 5 + Sequelize, CommonJS) and `frontend/` (React 19 + Vite 6, ESM). **Docs, code comments and commit messages are in Spanish** — match that when editing.

## Commands

All from the repo root unless noted.

```bash
npm install              # installs root + both workspaces
npm run dev              # frontend :5000 + backend :8001/api concurrently
npm run dev:backend      # nodemon backend only
npm run dev:frontend     # vite only

npm test                 # both workspaces
npm run test:backend     # jest
npm run test:frontend    # vitest run
npm run test:e2e         # playwright (boots `npm run dev` itself)

npm run lint -w backend  # eslint, --max-warnings=0
npm run lint -w frontend
npx eslint . --max-warnings=0   # what CI actually runs (root eslint.config.mjs)
```

Single test:

```bash
npm test -w backend -- src/__tests__/authFlow.integration.test.js
npm test -w backend -- -t "nombre del test"
npm run test:run -w frontend -- src/__tests__/hooks/useOfflineQueue.test.jsx
```

Backend-only utilities (run inside `backend/`):

```bash
npm run migrate          # apply pending migrations
npm run migrate:status
npm run seed:dummy       # DESTRUCTIVE: drops and recreates
node bootstrap-admin.js  # interactive: create the first admin
npm run diagnose:db
```

## Architecture

### Dual database, chosen at import time

`backend/src/config/database.js` picks the dialect from env: `DATABASE_URL` present → PostgreSQL (Neon), absent → SQLite. On Vercel (`process.env.VERCEL`) Postgres is **forced** and a missing `DATABASE_URL` throws at startup.

Two non-obvious consequences:

- Postgres connects through the **Neon serverless driver over WebSocket/443**, injected as Sequelize's `dialectModule`, not plain `pg` over TCP/5432 — the local network blocks 5432. Don't "simplify" this back to `pg`.
- If Postgres fails to connect there is **no silent fallback** to SQLite; the error propagates and the server exits. Opt in with `ALLOW_SQLITE_FALLBACK=true` only for deliberate offline work.

### Schema is migration-driven, except in tests

Schema lives in versioned files under `backend/migrations/` (`000X-descripcion.js` exporting `up({ queryInterface, sequelize, DataTypes })` / `down(...)`), applied by a dependency-free runner (`src/config/migrator.js`) that tracks state in a `SequelizeMeta` table. Server startup applies pending migrations automatically. **There is no implicit `sequelize.sync()` in production** — a schema change means a new migration file.

Tests are the exception: `src/__tests__/setup.js` does `sequelize.sync({ force: true })` against in-memory SQLite (`jest.setupEnv.js` sets `DB_STORAGE=':memory:'`, clears `DATABASE_URL`/`VERCEL`). So a model change can pass tests while breaking a real Postgres deploy if you forget the migration.

### Request pipeline

`Route → protect/authorize → validateRequest(zodSchema) → controller → Sequelize model`

- `middleware/authMiddleware.js` — `protect` reads the JWT from the `Authorization: Bearer` header **or** the `token` cookie, and re-checks the user still exists and `isActive`. `authorize(...roles)` gates by role; `authorizeSelfOrAdmin(param)` lets a technician hit only their own `:id`.
- `middleware/zodMiddleware.js` + `validators/*.js` — body validation; schemas live per-resource.
- Controllers use `express-async-handler`; all errors land in `middleware/errorHandler.js`, which never leaks stack traces in production.
- `middleware/idempotencyMiddleware.js` is global and keys off `X-Idempotency-Key` (backed by the `idempotency_keys` table, 24h TTL) — this is what makes the offline replay safe.

### Authorization is two-layered

Role gating happens in routes; **ownership** gating happens in controllers via `backend/src/utils/ownership.js`. `admin`/`supervisor` are privileged and bypass it. A `technician` sees only assigned clients/equipment and reports they authored or whose equipment is assigned to them. Note `canAccessReport` (read: author *or* assigned equipment) is deliberately looser than `canModifyReport` (write: author only). Any new list endpoint must filter through these helpers, not just return `findAll()`.

Assignments are three many-to-many join models: `AdminTechnician`, `TechnicianClient`, `TechnicianEquipment` (see `models/index.js` for all associations).

### ServiceReport stores wizard data as JSON in TEXT columns

`waterEnergyData`, `motorsData`, `controlData`, etc. are JSON strings, not relational tables — the wizard's shape varies by equipment type. Report numbers (`SRV-0042`) come from `utils/reportNumber.js`, which uses a row-locked `Counter` inside a transaction; it never reuses a number after a delete. Don't generate them with `count() + 1`.

### Rate limiting

Three limiters in `app.js` (auth 15/15min, api 100/15min, ai `AI_RATE_LIMIT_MAX` default 30/15min), all with `skip: NODE_ENV === 'test'`. Each uses a Redis store when `REDIS_URL` is set (`config/rateLimitStore.js`), otherwise a per-instance MemoryStore — which on serverless means the real limit is weaker than it looks.

### AI layer

`backend/src/ai/` (LangChain + Groq + LangGraph) behind `/api/ai`. `container.js` is a tiny DI seam — tests swap the LLM and embeddings factories via `setCreateLLM`/`setCreateEmbeddings` rather than mocking LangChain modules. See `API_REFERENCE.md` and `AGENT_MAESTRO_GUIDE.md`.

**LangChain dependencies are fragile in production:** bumping them (or running `npm audit fix`) has broken the Vercel deploy while all tests stayed green. Verify a Vercel preview before merging any change to those packages.

### Frontend

- `WizardContext.jsx` holds the whole 13-step form state; steps read/write `formData` through `useWizard()`, drafts persist to IndexedDB.
- Offline: `useNetworkStatus` (online/offline events) + `useOfflineQueue` (idb-keyval queue). Every submit carries a `clientRequestId` (UUID) sent as `X-Idempotency-Key` and `_clientRequestId`; the queue dedupes on it, and entries are removed **only** on a successful replay. Its tests use `fake-indexeddb/auto` against the real IndexedDB logic — don't replace that with a module mock.
- `@` is aliased to `frontend/src`. Build output is `frontend/build/` (not `dist/`).
- Manual Vitest mocks for `axios` and `sonner` live in `frontend/__mocks__/`; Vitest picks them up on a bare `vi.mock('axios')` (no factory). They must stay Vitest-native ESM (`vi.fn()`, real `export`s) — Jest idioms like `module.exports` + `jest.fn()` or `jest.requireActual` do not work there. CSS imports need no mock; Vite no-ops them in tests.

## Conventions and gotchas

- **npm workspaces:** the only lockfile that counts is the root `package-lock.json`. Audit there, not per-workspace. A clean install from scratch fails on peer deps (ERESOLVE) — don't delete the lock to "fix" things; use `--legacy-peer-deps` if you must.
- **Husky hooks:** `pre-commit` lints both workspaces, `pre-push` runs both test suites. Do not bypass with `--no-verify`.
- Conventional Commits; PRs target `develop`.
- Integration tests must create their fixtures in `beforeEach` and use the returned IDs — never hardcode IDs.
- Design decisions and known debt are in `ARCHITECTURE.md` and `TECH_DEBT.md`; `memory/MEMORY.md` indexes gotchas learned the hard way (deploy refs, dependency traps).
