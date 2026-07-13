# Memory Index

- [Resend planned email](resend-planned-email.md) — `resend` dep no se usa aún pero es intencional; no eliminar
- [Langchain deps frágiles en prod](langchain-deps-fragile-prod.md) — npm audit fix / bumps de langchain tumban producción aunque los tests pasen; verificar preview de Vercel antes de mergear
- [CV: impacto sin métricas de volumen](cv-impact-no-volume-metrics.md) — en proyectos a la medida de pocos usuarios, NO empujar métricas de escala; enmarcar impacto cualitativamente
- [Neon vía WebSocket](neon-websocket-driver.md) — la red local bloquea Postgres TCP/5432; Sequelize usa el driver serverless de Neon (WS/443), no volver a `pg` TCP
- [npm workspaces: lock raíz](npm-workspaces-root-lock.md) — monorepo workspaces; el único lock que cuenta es el raíz; auditar con `npm audit` ahí, no por la lista de Dependabot
- [npm audit sin fix seguro](npm-audit-no-safe-fix.md) — las ~28 vulns son dev-only / LangChain / sequelize→uuid no explotable; NO correr `audit fix --force`
- [Clean install falla con ERESOLVE](clean-install-eresolve.md) — no borrar el lock para reinstalar; un install desde cero se cae por peer-deps; usar `--legacy-peer-deps` si hace falta
- [SMTP: el 535 no era la clave](smtp-credentials-broken.md) — RESUELTO; la App Password siempre fue válida, `SMTP_USER` apuntaba a otra cuenta. Ante un 535, mirar la CUENTA antes que la clave
- [Referencia de deploy Vercel](vercel-deploy-reference.md) — proyectos (backend=cmms-hidrobombas-merida-backend), `npx vercel` linkeado, env vars de prod; usar `vercel redeploy`, nunca `--prod` desde local
- [Tareas de config pendientes](pending-config-tasks.md) — estado tras poner prod en marcha (2026-07-13); ya solo queda el SMTP
- [Upstash Redis (rate limiting)](upstash-redis-rate-limit.md) — cómo está montado; conectarlo tumbó producción (500 en todos los logins): un fallo del store NO debe matar la API
- [BD de producción (Neon)](prod-neon-database.md) — cuál es la Neon buena; Vercel apuntó a una vacía y el login daba 500 con "relation users does not exist"
- [El geo-bloqueo de Groq oculta keys muertas](groq-geoblock-masks-invalid-key.md) — desde local nunca sabrás si la API key sirve; mirar `groq_key_status`, no `groq_configured`
