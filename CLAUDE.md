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

npm run load:smoke       # k6: ¿responde todo? empieza siempre por aquí
npm run load:test        # k6: carga sostenida (lecturas, la mezcla real)
npm run load:write       # k6: alta de reporte + PDF (donde está el cuello de botella)
npm run load:stress      # k6: hasta romperlo
npm run load:rate-limit  # k6: verifica que el limitador sigue cortando
```

Single test:

```bash
npm test -w backend -- src/__tests__/authFlow.integration.test.js
npm test -w backend -- -t "nombre del test"
npm run test:run -w frontend -- src/__tests__/hooks/useOfflineQueue.test.jsx
```

`npm test -w backend` runs against **SQLite** (385 tests). The CI *also* runs the same suite against a real **Postgres** service — that second job is the one that catches enum/UUID bugs, and it needs `--runInBand` because the Jest workers share one database. To reproduce it you need a Postgres whose database name contains `test` (see the DROP SCHEMA guard below).

Backend-only utilities (run inside `backend/`):

```bash
npm run migrate          # apply pending migrations
npm run migrate:status
npm run seed:dummy       # DESTRUCTIVE: drops and recreates
node bootstrap-admin.js  # interactive: create the first admin
npm run diagnose:db
```

## ⚠️ Read this first — lessons paid for in production (2026-07-13)

A full end-to-end run against production found ~6 bugs **while all 384 tests were green**, including one that made the app useless: **creating a piece of equipment failed every time**, and without equipment there are no service reports. Internalize these or you will reintroduce them.

**A green suite is not evidence.** Two structural reasons:

1. **SQLite validates neither ENUM nor UUID. Postgres does.** The suite ran only against SQLite, so bad enum values and malformed UUIDs sailed through and blew up (500) only in production. The CI now also runs the suite against **real Postgres** — that job is the safety net, not the SQLite one.
2. **Tests were encoding the bugs.** A mock that fabricated a `MemoryVectorStore` the module never exported; `expect(status).toBe('active')` for a value the DB rejects; `visit_type: 'semestral'`, which doesn't exist; `toHaveBeenCalledWith('/api/ai/chat')` for a relative URL that 405s in production. **A test that asserts what the code *does* — rather than what it *should* do — turns the bug into a contract.** When a test fails after your fix, first ask whether the test was wrong.

**Enums have a single source of truth: the model.** `EQUIPMENT_STATUSES`, `VISIT_TYPES`, `USER_ROLES` are exported from `models/` and **imported** by controllers and Zod validators. Never redeclare them — three of the bugs came from duplicated, divergent lists.

**Rate limiting is a protection, not a critical dependency.** Wiring up Redis took production down (500 on every login) because `express-rate-limit` propagates store errors. `config/rateLimitStore.js` now degrades to an in-memory store when Redis fails.

**The frontend and backend are different domains.** Every API call must be absolute via `import.meta.env.VITE_API_URL`. A relative `/api/...` hits the frontend's own static hosting and returns **405** — that left the AI assistant dead from day one while the entire AI backend worked fine.

**Verify against production, not against the suite.** All of the above surfaced by exercising the real flow (login → client → equipment → report → PDF → email → AI).

## Architecture

### Dual database, chosen at import time

`backend/src/config/database.js` picks the dialect from env: `DATABASE_URL` present → PostgreSQL, absent → SQLite. On Vercel (`process.env.VERCEL`) Postgres is **forced** and a missing `DATABASE_URL` throws at startup.

Three non-obvious consequences:

- Against **Neon**, Postgres connects through the **serverless driver over WebSocket/443**, injected as Sequelize's `dialectModule`, not plain `pg` over TCP/5432 — the local network blocks 5432. Don't "simplify" this back to `pg`.
- Against a **local** Postgres (`localhost`/`127.0.0.1`, i.e. the CI service), that driver is skipped and TLS is disabled: a local server speaks neither WebSocket nor TLS.
- If Postgres fails to connect there is **no silent fallback** to SQLite; the error propagates and the server exits. Opt in with `ALLOW_SQLITE_FALLBACK=true` only for deliberate offline work.

### Schema is migration-driven, except in tests

Schema lives in versioned files under `backend/migrations/` (`000X-descripcion.js` exporting `up({ queryInterface, sequelize, DataTypes })` / `down(...)`), applied by a dependency-free runner (`src/config/migrator.js`) that tracks state in a `SequelizeMeta` table. Server startup applies pending migrations automatically. **There is no implicit `sequelize.sync()` in production** — a schema change means a new migration file.

Tests are the exception: `src/__tests__/setup.js` does `sequelize.sync({ force: true })`. Against Postgres, `sync` recreates tables but **leaves ENUM types behind**, so the setup first wipes the schema (`DROP SCHEMA public CASCADE`).

> 🛑 That DROP destroys the whole database. `setup.js` **refuses to run it unless the database name contains `test`** — the guard exists so that a misaimed `DATABASE_URL` can't wipe production. Do not remove it.

### Request pipeline

`Route → protect/authorize → validateRequest(zodSchema) → controller → Sequelize model`

- `middleware/authMiddleware.js` — `protect` reads the JWT from the `Authorization: Bearer` header **or** the `token` cookie, and re-checks the user still exists and `isActive`. `authorize(...roles)` gates by role; `authorizeSelfOrAdmin(param)` lets a technician hit only their own `:id`.
- `middleware/zodMiddleware.js` + `validators/*.js` — body validation; schemas live per-resource. Zod schemas that cover an enum column **must import its values from the model** (see the lessons above).
- `middleware/validateUuidParam.js` — guards `:id` routes. Without it a malformed id reaches `findByPk` and Postgres answers `invalid input syntax for type uuid` → a 500 instead of a 404.
- Controllers use `express-async-handler`; all errors land in `middleware/errorHandler.js`, which never leaks stack traces in production.
- `middleware/idempotencyMiddleware.js` is global and keys off `X-Idempotency-Key` (backed by the `idempotency_keys` table, 24h TTL) — this is what makes the offline replay safe.
- `app.set('trust proxy', …)` via `utils/trustProxy.js`: on Vercel the client IP only arrives in `X-Forwarded-For`. Trusted **only** on Vercel — off-platform, trusting that header would let anyone forge it and rotate IPs past the rate limit.

### The first admin cannot be created through the web

Self-registration always creates **pending** technicians (`isActive: false`), and only an admin can approve them. With zero admins every signup is born locked and nobody can unlock it — this happened in production. `POST /api/auth/register` therefore returns **409 `SYSTEM_NOT_INITIALIZED`** while no active admin exists (`utils/bootstrap.js`), and `GET /api/auth/bootstrap-status` lets the frontend explain why.

The first admin comes from `backend/bootstrap-admin.js`, which requires DB access. The first registrant is **deliberately not** auto-promoted: on a public deploy, whoever finds the URL before the owner would become the administrator.

### Authorization is two-layered

Role gating happens in routes; **ownership** gating happens in controllers via `backend/src/utils/ownership.js`. `admin`/`supervisor` are privileged and bypass it. A `technician` sees only assigned clients/equipment and reports they authored or whose equipment is assigned to them. Note `canAccessReport` (read: author *or* assigned equipment) is deliberately looser than `canModifyReport` (write: author only). Any new list endpoint must filter through these helpers, not just return `findAll()`.

Assignments are three many-to-many join models: `AdminTechnician`, `TechnicianClient`, `TechnicianEquipment` (see `models/index.js` for all associations).

### ServiceReport stores wizard data as JSON in TEXT columns

`waterEnergyData`, `motorsData`, `controlData`, etc. are JSON strings, not relational tables — the wizard's shape varies by equipment type. Report numbers (`SRV-0042`) come from `utils/reportNumber.js`, which uses a row-locked `Counter` inside a transaction; it never reuses a number after a delete. Don't generate them with `count() + 1`.

### Rate limiting

Three limiters in `app.js` (auth 15/15min, api 100/15min, ai `AI_RATE_LIMIT_MAX` default 30/15min), all with `skip: NODE_ENV === 'test'`. With `REDIS_URL` set (Upstash, in production) the count is **global**; without it, each lambda keeps its own memory and the real limit is far weaker than it looks.

`config/rateLimitStore.js` wraps the Redis store in `withMemoryFallback`: if Redis errors, it degrades to an in-process store instead of failing the request. Two bugs here already took production down — see the lessons above. Note `lazyConnect` **requires** `enableOfflineQueue: true`, or the very first command is rejected with *"Stream isn't writeable"*.

### AI layer

`backend/src/ai/` (LangChain + Groq + LangGraph) behind `/api/ai`. `container.js` is a tiny DI seam — tests swap the LLM and embeddings factories via `setCreateLLM`/`setCreateEmbeddings` rather than mocking LangChain modules. See `API_REFERENCE.md` and `AGENT_MAESTRO_GUIDE.md`.

- **`groq_configured` in `/api/ai/status` only means the env var exists — it lied in production while Groq rejected every call.** The honest field is **`groq_key_status`** (`ai/health.js`), which validates the key against Groq without spending tokens. It deliberately separates `invalid` (401: revoked key) from `unreachable` (403 geo-block, timeout): Groq geo-blocks some IPs and answers 403 **before** looking at the credential, so from the local network a good key and a dead one look identical. **Never validate the Groq key locally.**
- **Vector store:** production sets `VECTOR_STORE_PROVIDER=pgvector`, so embeddings persist in Postgres (`ai_report_embeddings`). The code **default is still `memory`**, which in serverless means each lambda holds its own index and a freshly created report may be invisible to the RAG. If the env var ever disappears, it silently falls back.
- `MemoryVectorStore` lives in **`@langchain/classic/vectorstores/memory`**, not in `@langchain/core/vectorstores` (which only exports the base class). Importing it from the wrong place does not fail at load — it explodes at runtime the first time anyone uses the RAG.

**LangChain dependencies are fragile in production:** bumping them (or running `npm audit fix`) has broken the Vercel deploy while all tests stayed green. Verify a Vercel preview before merging any change to those packages.

### Load testing (k6)

Scripts live in `k6/` (see [`k6/README.md`](k6/README.md)). Two things invalidate any measurement here:

- **The rate limiters must be off, or you measure the 429 and not the API.** `apiLimiter` cuts at 100 req/15min *per IP*, and k6 from one machine is one IP; past request 101 Express short-circuits before touching the DB and the latencies look fantastic. Start the backend with `RATE_LIMIT_DISABLED=true` — `utils/rateLimitSkip.js` honours it **only outside production**, and `k6/lib/setup.js` refuses to run if it detects the limiter still counting. The one exception is `k6/scenarios/rate-limit.js`, which asserts the limiter *does* engage (a `429` count of zero fails the run) — that's the regression test guarding the kill switch.
- **Measure against Postgres, never SQLite.** SQLite serialises writes on a file lock, so a write scenario against it measures the lock.

The suspected bottleneck is `utils/reportNumber.js`: every report creation opens a transaction and `SELECT … FOR UPDATE`s **the same counter row**, so report creation is globally serialised. **Measured, that ceiling is ~70 reports/s** (local Postgres), and past it the system degrades by queueing — latency climbs to ~1s, zero errors. For a handful of technicians filing a few reports a day that is orders of magnitude of headroom: it is a *theoretical* bottleneck, **don't optimise it**. Removing the lock would bring back duplicated report numbers. Baseline figures for every scenario are in `k6/README.md` — reproduce them before claiming a perf regression.

### Services: PDF, email, Neon keep-alive

`backend/src/services/` holds the three side-effecting pieces of the report flow.

- `pdfService.js` (pdfkit) renders the report; the company header (RIF, phone, contact email, signature holder) is real data printed on every report — several commits exist just to fix it. Don't invent placeholder values there.
- `emailService.js` tries providers **in order and stops at the first one configured**: SMTP (`SMTP_USER`+`SMTP_PASS`) → Brevo (`BREVO_API_KEY`) → Resend (`RESEND_API_KEY`) → **simulated** when none is set, which is what keeps tests and CI from sending real mail. Every path returns the same contract (`{simulated}` | `{success:true, messageId?}` | `{success:false, error}`), so callers must never branch on the provider. In development, `EMAIL_DEV_OVERRIDE_TO` (or `RESEND_DEV_OVERRIDE_TO`) redirects **all** mail to a test address — real clients are on the other side of these addresses.
- `neonKeepAlive.js` pings the DB every `NEON_KEEP_ALIVE_INTERVAL` (default 10 min) because Neon's free tier drops idle connections at ~15 min. Disable with `NEON_KEEP_ALIVE_ENABLED=false`. See `NEON_KEEP_ALIVE_GUIDE.md`.

### Frontend

- **Every API call must be absolute**, built from `import.meta.env.VITE_API_URL`. The frontend is static hosting on a *different* Vercel domain than the backend: a relative `/api/...` POSTs to itself and gets a **405**. This is not hypothetical — it silently killed the AI assistant.
- `WizardContext.jsx` holds the whole 13-step form state; steps read/write `formData` through `useWizard()`, drafts persist to IndexedDB.
- Offline: `useNetworkStatus` (online/offline events) + `useOfflineQueue` (idb-keyval queue). Every submit carries a `clientRequestId` (UUID) sent as `X-Idempotency-Key` and `_clientRequestId`; the queue dedupes on it, and entries are removed **only** on a successful replay. Its tests use `fake-indexeddb/auto` against the real IndexedDB logic — don't replace that with a module mock.
- `@` is aliased to `frontend/src`. Build output is `frontend/build/` (not `dist/`).
- Manual Vitest mocks for `axios` and `sonner` live in `frontend/__mocks__/`; Vitest picks them up on a bare `vi.mock('axios')` (no factory). They must stay Vitest-native ESM (`vi.fn()`, real `export`s) — Jest idioms like `module.exports` + `jest.fn()` or `jest.requireActual` do not work there. CSS imports need no mock; Vite no-ops them in tests.

## Conventions and gotchas

- **npm workspaces:** the only lockfile that counts is the root `package-lock.json`. Audit there, not per-workspace. A clean install from scratch fails on peer deps (ERESOLVE) — don't delete the lock to "fix" things; use `--legacy-peer-deps` if you must. Ignore the stale `"packageManager": "yarn@1.22.22"` left in `frontend/package.json` by the original CRA scaffold: the project is npm-only, nothing reads it today, and "fixing" it by actually running yarn would fork the lockfile.
- **CI (`.github/workflows/ci.yml`) is five jobs:** root lint (blocking), `npm audit --audit-level=high` (**non**-blocking on purpose — the dependency tree isn't clean yet), frontend Vitest, backend Jest on SQLite (via `test:coverage`), and backend Jest on real Postgres. Only the last one validates enums and UUIDs.
- **Husky hooks:** `pre-commit` lints both workspaces, `pre-push` runs both test suites. Do not bypass with `--no-verify`.
- Conventional Commits. PRs in practice merge to `main` (the README still says `develop`).
- Integration tests must create their fixtures in `beforeEach` and use the returned IDs — never hardcode IDs.
- **Deploying/observing production:** `npx vercel redeploy <url>` rebuilds the deployed commit with the current env vars. Do **not** run `vercel --prod` from a local checkout — it uploads the working tree. Real runtime errors only show up in `npx vercel logs <url> --json`; the API just returns `Internal server error` plus a `correlationId`. Some env vars (`DATABASE_URL`, `SMTP_*`) are *Sensitive*: `vercel env pull` returns them **empty**, which does not mean they are unset.
- **Where things are written down:** [`PENDING_TASKS.md`](PENDING_TASKS.md) is the actionable checklist (with file:line evidence); [`TECH_DEBT.md`](TECH_DEBT.md) explains the *why*; `ARCHITECTURE.md` §8 holds the lessons from the production incidents; `memory/MEMORY.md` indexes the traps (deploy refs, dependency traps, the SQLite/Postgres trap, the Groq geo-block).
