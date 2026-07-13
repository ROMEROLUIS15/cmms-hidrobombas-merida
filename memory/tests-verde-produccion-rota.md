---
name: tests-verde-produccion-rota
description: La suite pasa en verde y producción está rota; los tests codifican los bugs y SQLite oculta lo que Postgres rechaza
metadata:
  type: project
---

**El 2026-07-13, con 384 tests en verde, producción tenía ~6 bugs que la hacían
inutilizable.** No es mala suerte: hay dos fallos estructurales en cómo se valida.

## 1. La trampa SQLite/Postgres

Los tests corren contra **SQLite, que NO valida ENUM ni UUID**. Postgres sí. Todo lo
que dependa de eso pasa en verde y revienta solo en producción:
- `enum_equipment_status`: el controlador ponía `'active'`, inexistente → **crear un
  equipo fallaba SIEMPRE** (500). Sin equipos no hay reportes: el CMMS no servía.
- `visit_type`: el validador aceptaba cualquier string → un valor inválido llegaba a
  la BD → 500 en vez de 400.
- Un `:id` malformado llegaba a `findByPk` → `invalid input syntax for type uuid` → 500.

## 2. Los tests CODIFICAN el bug (peor que no tenerlos)

Cuatro casos reales en una sola sesión:
- `aiVectorStore.unit`: mockeaba `@langchain/core/vectorstores` **fabricando un
  `MemoryVectorStore` que ese módulo nunca exportó** → ocultó un import roto que
  reventaba el RAG en runtime.
- `equipmentRoutes.integration`: `expect(status).toBe('active')` ← el valor que
  Postgres rechaza.
- `serviceReportRoutes.integration`: enviaba `visit_type:'semestral'` (inexistente) y
  esperaba 200.
- `useAI.test`: `expect(axios.post).toHaveBeenCalledWith('/api/ai/chat')` ← la ruta
  relativa que en producción daba 405.

**Why:** un test que afirma lo que el código HACE (en vez de lo que DEBERÍA hacer) no
prueba nada; convierte el bug en contrato y lo blinda contra el arreglo. Un mock que
inventa la API que dice verificar, tampoco.

## ✅ Arreglado: el CI corre también contra Postgres (PR #69)

Job `backend-tests-postgres` (servicio `postgres:16`, `--runInBand`). Se **mantiene** el de
SQLite (48s, feedback rápido); el de Postgres (1m13s) es la red de seguridad.
**Cazó un bug a la primera:** `updateUserRole` no validaba el rol → 500 en vez de 400, y los
tests usaban `role: 'user'`, que ni existe (`admin|supervisor|technician|client`).

Correr la suite contra Postgres exigió destrabar tres cosas, por si hay que tocarlo:
1. `jest.setupEnv.js` forzaba `DATABASE_URL=''` → imposible apuntar a Postgres. Ahora
   respeta la del entorno.
2. `config/database.js` inyectaba el driver **WebSocket de Neon** + TLS obligatorio, que un
   Postgres local no da. Detecta host local (`localhost`/`127.0.0.1`) → `pg` estándar sin TLS.
3. `sync({force:true})` recrea las tablas pero **deja los tipos ENUM** (`type "..." does not
   exist`). `setup.js` parte de un schema vacío con `DROP SCHEMA public CASCADE`.
   ⚠️ **Ese DROP borra la base entera:** hay una salvaguarda que se NIEGA a ejecutarlo si el
   nombre de la base no contiene `test`. No quitarla.

Nota: **validar esto en local contra Neon no funciona** (lentísimo y usa el driver WS, que no
es lo que corre el CI). Usar el propio PR como banco de pruebas.

**How to apply:**
- **Verificar contra PRODUCCIÓN, no solo contra la suite.** Los bugs aparecieron al ejercitar
  el flujo real (login → cliente → equipo → reporte → PDF → email → IA).
- Ante un test que falla al arreglar algo: preguntarse si el test estaba **codificando el
  bug** antes de "arreglar" el código para que pase.
- Enums: el **modelo** es la única fuente de verdad (`EQUIPMENT_STATUSES`, `VISIT_TYPES`,
  `USER_ROLES`); controladores y validadores Zod los importan, nunca los redeclaran.
