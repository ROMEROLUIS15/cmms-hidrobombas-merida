# Memory Index

- [Resend planned email](resend-planned-email.md) — `resend` dep no se usa aún pero es intencional; no eliminar
- [Langchain deps frágiles en prod](langchain-deps-fragile-prod.md) — npm audit fix / bumps de langchain tumban producción aunque los tests pasen; verificar preview de Vercel antes de mergear
- [CV: impacto sin métricas de volumen](cv-impact-no-volume-metrics.md) — en proyectos a la medida de pocos usuarios, NO empujar métricas de escala; enmarcar impacto cualitativamente
- [Neon vía WebSocket](neon-websocket-driver.md) — la red local bloquea Postgres TCP/5432; Sequelize usa el driver serverless de Neon (WS/443), no volver a `pg` TCP
- [npm workspaces: lock raíz](npm-workspaces-root-lock.md) — monorepo workspaces; el único lock que cuenta es el raíz; auditar con `npm audit` ahí, no por la lista de Dependabot
- [npm audit sin fix seguro](npm-audit-no-safe-fix.md) — las ~28 vulns son dev-only / LangChain / sequelize→uuid no explotable; NO correr `audit fix --force`
- [Clean install falla con ERESOLVE](clean-install-eresolve.md) — no borrar el lock para reinstalar; un install desde cero se cae por peer-deps; usar `--legacy-peer-deps` si hace falta
- [SMTP local roto](smtp-credentials-broken.md) — la App Password de Gmail del .env está rechazada (535); prod tiene SMTP_* propias sin verificar; regenerar
- [Referencia de deploy Vercel](vercel-deploy-reference.md) — proyectos (backend=cmms-hidrobombas-merida-backend), `npx vercel` linkeado, env vars de prod; sin REDIS_URL aún
- [Tareas de config pendientes](pending-config-tasks.md) — roadmap post-auditoría: REDIS_URL/Upstash, SMTP, y hallazgos A2-A5 sin aplicar
