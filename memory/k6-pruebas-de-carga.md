---
name: k6-pruebas-de-carga
description: Con los limitadores activos una prueba de carga mide el 429, no la API; y el bloqueo del contador de reportes tiene techo ~70/s, así que NO hay que optimizarlo
metadata:
  type: project
---

Suite de carga con **k6** en `k6/` (añadida el 2026-07-13). Los cinco escenarios
—`smoke`, `load`, `write-flow`, `stress`, `rate-limit`— se ejecutaron de verdad
contra un PostgreSQL real, no solo se escribieron. Línea base y comandos en
[`k6/README.md`](../k6/README.md).

## 1. La trampa: con los limitadores puestos NO mides la API, mides el 429

`apiLimiter` corta a las **100 req / 15 min POR IP**, y k6 lanzado desde una máquina
es **una sola IP**. A partir de la petición 101, Express responde 429 **sin llegar a
tocar la base de datos**: las latencias salen espectaculares y el informe entero es
basura. Es un fallo silencioso — nada avisa de que estás midiendo el rechazo.

Por eso existe `RATE_LIMIT_DISABLED=true` (`backend/src/utils/rateLimitSkip.js`), que
**se ignora a propósito en producción**: allí el límite es la defensa real contra la
fuerza bruta en `/login` y contra el gasto de tokens del LLM en `/ai`, y un `.env`
copiado no puede desarmarla en silencio.

Dos salvaguardas, porque un interruptor que apaga una defensa necesita vigilancia:
- `k6/lib/setup.js` **se niega a arrancar** si detecta el limitador activo (lo detecta
  por la cabecera `RateLimit-Limit`, que express-rate-limit solo emite cuando cuenta).
- `k6/scenarios/rate-limit.js` **falla si NO aparece ningún 429**: es el test de
  regresión que caza el día que alguien deje el interruptor puesto.

## 2. El bloqueo del contador de reportes NO es un problema real

`utils/reportNumber.js` abre una transacción y bloquea con `SELECT … FOR UPDATE` **la
misma fila** del contador en cada alta, así que **todas las altas se serializan**. Es
el sospechoso obvio y es tentador "arreglarlo".

**Medido: el techo son ~70 altas/s** (Postgres local), y al pasarse **degrada
encolando, no fallando** (latencia hasta 1 s, cero errores). Con unos pocos técnicos
haciendo unos pocos reportes al día, sobra por varios órdenes de magnitud.

**Why:** es un cuello de botella *teórico*. Quitar el bloqueo devolvería los números
`SRV-XXXX` duplicados o reutilizados tras un borrado — la cura sería peor que la
enfermedad, y estaríamos pagándola por un problema que no existe.

**How to apply:**
- **No optimices `reportNumber.js`.** Si algún día apretara de verdad, la respuesta no
  es quitar el lock: es acortar la transacción o pasar a una secuencia nativa de
  Postgres.
- Antes de afirmar que algo "no escala", **mídelo**. Aquí la intuición señalaba el
  sitio correcto y la conclusión equivocada.
- Mide contra **Postgres**, nunca contra SQLite (serializa las escrituras con un lock
  de fichero: medirías el lock). Misma familia de trampa que
  [[tests-verde-produccion-rota]].
- Ver [[prod-neon-database]] y [[upstash-redis-rate-limit]].

## 3. El pool de conexiones de Neon NO es el cuello de botella (medido en staging)

Sospechábamos que las lambdas, al multiplicarse bajo carga, agotarían las conexiones
del Neon gratuito y la API se colgaría esperando. **Se montó un staging real (Vercel +
branch de Neon) para comprobarlo y la hipótesis es FALSA:** con 200 VUs concurrentes y
~90 escrituras/s → **cero 5xx, cero timeouts, cero errores**.

La razón: Neon se alcanza por el **driver serverless sobre WebSocket/443**, que no
mantiene una conexión TCP viva por lambda como un `pg` clásico. Es justo la pieza que
`ARCHITECTURE.md` manda no "simplificar" — y ahora sabemos que además es lo que hace
que esto escale. Ver [[neon-websocket-driver]].

Datos: el techo de escritura desplegado (~90/s) es **MÁS ALTO que en local** (~70/s);
Vercel levanta más instancias en paralelo que una sola máquina. Lo único que la nube
empeora es la **latencia**, ×5 y de forma uniforme (19 → 231 ms en lecturas): es red y
arranque de lambda, no contención.

**How to apply:** el staging es efímero y está aislado por construcción (BD vaciada sin
datos reales, `JWT_SECRET` propio, sin `REDIS_URL`, protegido con bypass de Vercel).
Cómo montarlo y cómo desmontarlo, en `k6/README.md`. **No des por hecho que la nube
escala peor que tu portátil: mídelo.**
