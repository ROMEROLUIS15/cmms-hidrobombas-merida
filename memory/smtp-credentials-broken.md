---
name: smtp-credentials-broken
description: RESUELTO — el 535 de Gmail no era la App Password, era SMTP_USER apuntando a otra cuenta
metadata:
  type: project
---

**RESUELTO el 2026-07-13. El email funciona en producción** (envío real verificado:
`password reset email enviado, provider: smtp, messageId: <…@gmail.com>`).

**La causa NO era la credencial.** Durante semanas se dio por hecho que la App Password
estaba revocada, porque Gmail devolvía `535-5.7.8 Username and Password not accepted`
(`?p=BadCredentials`). Falso: **la clave siempre fue válida**.

El fallo real: **`SMTP_USER` apuntaba a `hidrobombasmerida@gmail.com`** (sin punto, sin
1948) mientras la App Password pertenecía a **`hidrobombas.merida1948@gmail.com`** — otra
cuenta. Corregido `SMTP_USER`/`SMTP_FROM` en `backend/.env` y en Vercel (Production+Preview),
con la MISMA contraseña de siempre → `AUTH OK`.

**Why:** `535 BadCredentials` suena a "contraseña incorrecta", pero significa "esta
COMBINACIÓN de usuario y contraseña no autentica". Al leerlo como problema de la clave,
toda la investigación se fue a hipótesis falsas: el formato con/sin espacios (irrelevante:
autentica de las dos formas), si el 2FA estaba activo, y si Google había cambiado su
política (**no lo ha hecho**: las App Passwords con 2FA siguen siendo válidas para SMTP).
Nadie miró el `SMTP_USER`.

**How to apply:**
- Ante un 535, **verificar primero la CUENTA, no la clave**. Probar la misma contraseña
  contra los usuarios candidatos antes de regenerar nada.
- Ojo con las dos cuentas de la empresa; la buena es **`hidrobombas.merida1948@gmail.com`**
  (es también la del admin del CMMS).
- La App Password funciona con espacios (19 chars) y sin ellos (16). No es una pista.
- No hay failover: con `SMTP_USER`/`SMTP_PASS` presentes el servicio usa SMTP y NO cae a
  Resend si la auth falla ("el primero configurado gana"). Ver [[resend-planned-email]].
- Las `SMTP_*` de Vercel son *Sensitive*: `vercel env pull` las trae **vacías**, no se
  pueden leer para compararlas. Hay que sobrescribirlas a ciegas.
- Probar el envío de verdad con `POST /api/auth/forgot-password` y mirar los logs; la API
  responde un mensaje ambiguo a propósito ("si ese email está registrado…").
- Generar una credencial ≠ que autentique. Mismo patrón que [[groq-geoblock-masks-invalid-key]].
