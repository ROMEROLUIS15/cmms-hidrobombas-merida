---
name: pending-config-tasks
description: Ajustes de configuración pendientes tras la auditoría general (junio 2026)
metadata:
  type: project
---

Estado al 2026-06-24, tras una auditoría general del proyecto. Lo MERGEADO a `main`
esta semana: nodemailer 9 (#40), limpieza Jest 27 + fix jsdom (#41), saneo higiene
M2/M3/B1/B2 (#42), TLS de Neon M1 (#43), doc SMTP (#44), rate-limit con store Redis
opcional A1 (#45).

**Pendiente de CONFIGURACIÓN (no es código):**
1. **REDIS_URL (A1, en curso):** el código del rate-limit compartido ya está en prod
   pero **inerte** hasta provisionar Redis. Falta: crear un Upstash Redis (free) y
   conectarlo al proyecto backend en Vercel (pestaña Storage), o setear `REDIS_URL`
   (`rediss://…` TCP, para `ioredis`) por CLI. Luego redeploy y verificar. Ver
   [[vercel-deploy-reference]].
2. **SMTP:** regenerar la App Password de Gmail (la del `.env` local está rechazada)
   y confirmar/actualizar las `SMTP_*` de prod. Ver [[smtp-credentials-broken]].

**Pendiente de CÓDIGO (hallazgos de auditoría no aplicados, requieren decisión):**
- **A2/A3 — token hardening (FE+BE):** el frontend usa `localStorage` + `Bearer`
  (no las cookies httpOnly que el backend ya emite); el interceptor de 401 no
  auto-refresca. Para acortar el access token (hoy 24h) hay que cablear primero el
  refresh en el frontend. Cambio coordinado, con tests.
- **A4 — política de password:** Zod solo exige min 8; añadir complejidad (bajo valor).
- **A5 — purga programada** de `RevokedToken`/`PasswordResetToken` (cron/pg_cron).
- **Deuda funcional wizard** (`TECH_DEBT.md` #4): campos huérfanos; requiere ver la
  planilla física de Hidrobombas para decidir limpiar vs. crear UI.

Las 3 notas de memoria de la sesión y estas se mantuvieron sin commitear por
preferencia del usuario. Auditar vulns con [[npm-audit-no-safe-fix]]; no borrar el
lock ([[clean-install-eresolve]]).
