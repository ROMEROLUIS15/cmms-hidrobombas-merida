---
name: resend-planned-email
description: La dependencia `resend` en el backend está prevista para uso futuro; no eliminar
metadata:
  type: project
---

La dependencia `resend` (en `backend/package.json`) aún NO se importa en `src/` (el único sistema de email activo es Nodemailer en `emailService.js`), pero el usuario confirmó que **sí se va a usar** para una migración de email planificada.

**Why:** Parece dependencia muerta desde el código, pero es intencional.
**How to apply:** No proponer eliminarla en auditorías/limpiezas de dependencias. Si se trabaja en email, considerar Resend como destino previsto.
