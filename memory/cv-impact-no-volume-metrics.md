---
name: cv-impact-no-volume-metrics
description: How to frame "impact" on the user's CV for bespoke/small-user-base projects
metadata:
  type: feedback
---

For bespoke/internal software with a small user base (e.g. a CMMS built for ONE company with ~3-5 technicians + 1-2 admins), do NOT push for volume/scale impact metrics (users, reports/month, requests). They are unrealistic for the project and pushing them feels like inventing numbers.

**Why:** The user pushed back hard — "how am I going to have 300 reports/month on a custom tool for one small company?" Chasing scale metrics on a bespoke tool is dishonest and misreads the project's value.

**How to apply:** Frame impact QUALITATIVELY, not numerically:
- End-to-end sole ownership (DB, backend, AI, frontend, CI/CD, deploy) delivered to production for a real company.
- Engineering depth disproportionate to the ask (they asked to digitize a paper form; he delivered RAG + LLM agents + offline idempotent sync + token rotation/revocation).
- Domain fit as the real "impact" (e.g. offline-first PWA because field technicians report from pump houses/basements with no signal — not gold-plating, a field requirement).
Leave a `[métrica]` placeholder ONLY where a real, modest number could exist (e.g. # of technicians). Never invent scale. Verify from code first, then write. Related: [[resend-planned-email]].
