---
name: smtp-credentials-broken
description: La App Password de Gmail del .env local está rechazada (535); prod tiene SMTP_* propias sin verificar
metadata:
  type: project
---

Verificado en vivo el 2026-06-24: `transporter.verify()` contra Gmail con las
credenciales de `backend/.env` (`hidrobombasmerida@gmail.com` + App Password)
devuelve **`535-5.7.8 Username and Password not accepted`**. Reproducido con la
App Password **con espacios** (19 chars) y **sin espacios** (16 chars) → no es
formato: la credencial está **inválida/expirada/revocada**.

- El **código de email es correcto** (14 tests email/PDF + 347 backend en verde);
  el fallo es 100% de credencial.
- **No hay failover**: con `SMTP_USER`/`SMTP_PASS` presentes el servicio usa SMTP
  y NO cae a Resend si la auth falla (modelo "el primero configurado gana").
- **Producción es independiente**: el proyecto Vercel `cmms-hidrobombas-merida-backend`
  tiene `SMTP_*` propias (puestas ~2026-06-23, distintas del .env local). No se
  pueden leer (cifradas), así que el email de prod **podría** funcionar aunque el
  local no — sin verificar todavía.

**Arreglo (NO es código):** regenerar App Password en `myaccount.google.com/apppasswords`
(con 2FA) y setearla en `.env` y en Vercel. Documentado en `TECH_DEBT.md` #2.
Relacionado: [[resend-planned-email]], [[pending-config-tasks]].
