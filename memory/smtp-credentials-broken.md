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

**Re-verificado el 2026-06-24:** el usuario estaba seguro de que la clave
(`axsv jrwd quym fakx`) era nueva (generada el 23/06) y funcionaba, y pensaba que
los espacios podían ser el problema. Re-probado en vivo con un script que carga el
`.env` igual que la app: dotenv parsea bien la clave (`"axsv jrwd quym fakx"`, 19
chars, espacios conservados, comentario inline descartado) y `verify()` da **535 con
espacios (19) Y sin espacios (16)**. Los espacios quedan **descartados como causa**.
Al preguntar, el usuario confirmó que **nunca la había probado enviando** — asumió
que funcionaba porque el sistema la generó sin error (generar ≠ autenticar). Nota:
el `.env` tiene dos líneas `SMTP_PASS` (l.85 con espacios activa, l.86 sin espacios
comentada); dejar solo una al actualizar.

**Arreglo (NO es código):** 1) confirmar que la verificación en 2 pasos está
realmente ACTIVA en `hidrobombasmerida@gmail.com` (causa #1 de 535 tras generar);
2) regenerar App Password en `myaccount.google.com/apppasswords` y copiar los 16
chars completos (un carácter mal copiado = 535); 3) setearla en `.env` y Vercel;
4) re-verificar en vivo hasta ver `AUTH OK` antes de darla por buena. Falta también
probar las `SMTP_*` de prod (Vercel) con un envío real. Documentado en `TECH_DEBT.md`
#2. Relacionado: [[resend-planned-email]], [[pending-config-tasks]].
