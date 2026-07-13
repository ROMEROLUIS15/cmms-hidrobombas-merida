---
name: email-sin-failover
description: emailService es multi-proveedor pero "el primero configurado gana"; si falla, NO intenta los demás
metadata:
  type: project
---

`backend/src/services/emailService.js:115`:

```js
const provider = hasSMTP ? 'smtp' : hasBrevo ? 'brevo' : 'resend';
```

**El primero configurado gana, y si falla NO se intenta ningún otro.** El diseño
multi-proveedor (SMTP → Brevo → Resend → simulado) solo *elige* uno al arrancar; no aporta
ninguna redundancia.

**Why:** esto ya costó semanas de correos perdidos. Con `SMTP_USER` apuntando a una cuenta
de Gmail equivocada, **todos** los envíos fallaban con 535 — pese a que `RESEND_API_KEY`
estaba configurada y habría funcionado. Ver [[smtp-credentials-broken]].

**How to apply:**
- Al depurar un fallo de email, no basta con mirar el proveedor "configurado": mirar cuál se
  está **eligiendo** y por qué. Sin `SMTP_USER`/`SMTP_PASS` no se llega nunca a Resend.
- Sin ningún proveedor configurado, el servicio **simula** el envío (no falla). En tests/CI
  eso es lo que queremos, pero en producción un fallo silencioso pasa desapercibido.
- Arreglo pendiente (ver `PENDING_TASKS.md`): cascada real ante fallos de ENVÍO (no de
  configuración), logueando cada intento. Ojo con no reintentar errores permanentes
  (destinatario inválido): solo tiene sentido ante fallos del proveedor.
