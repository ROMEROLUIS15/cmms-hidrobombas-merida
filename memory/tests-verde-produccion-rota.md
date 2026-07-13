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

**How to apply:**
- **Verificar contra PRODUCCIÓN, no contra la suite.** Todos estos bugs aparecieron al
  ejercitar el flujo real (login → cliente → equipo → reporte → PDF → email → IA).
  Ninguno lo detectó el CI.
- Ante un test que falla al arreglar algo: preguntarse si el test estaba **codificando
  el bug** antes de "arreglar" el código para que pase.
- **Pendiente de decisión:** correr los tests de integración contra Postgres en el CI
  (p. ej. un servicio postgres en GitHub Actions). La paridad SQLite es cómoda pero
  esconde justo esta clase de fallos. Ver [[pending-config-tasks]].
- Enums: el **modelo** es la única fuente de verdad; controladores y validadores Zod
  deben importar sus valores, nunca redeclararlos.
