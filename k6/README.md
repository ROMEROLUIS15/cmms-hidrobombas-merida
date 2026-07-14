# Pruebas de carga y rendimiento (k6)

Miden el **backend** (la API), no el frontend: el frontend es hosting estático y
su rendimiento es un problema de bundle y de CDN, no de concurrencia. Todo lo que
se cae bajo carga en este sistema está detrás de `/api`.

## Antes de nada: dos cosas que invalidan la medición

**1. Con los limitadores activos no mides la API, mides el 429.**
El limitador `api` corta en **100 peticiones / 15 min por IP**, y k6 lanzado desde
una máquina es una sola IP. A partir de la petición 101 todo son rechazos, y las
latencias salen espectaculares porque Express corta *antes* de tocar la base de
datos. Por eso el backend hay que arrancarlo con `RATE_LIMIT_DISABLED=true`, y por
eso los escenarios se niegan a arrancar si detectan el limitador puesto
(`assertRateLimitDisabled`, en `lib/setup.js`).

Esa variable **se ignora en producción a propósito** — ver
[`backend/src/utils/rateLimitSkip.js`](../backend/src/utils/rateLimitSkip.js).

**2. Con SQLite no mides nada que se parezca a producción.**
SQLite serializa las escrituras con un lock de fichero: un escenario de escritura
contra SQLite mide el lock, no el sistema. Producción es **Postgres** (Neon). Mide
contra Postgres o no midas.

## Puesta en marcha

Instalar k6 (es un binario de Go, no un paquete de npm):

```powershell
winget install k6            # Windows
# brew install k6            # macOS
# https://grafana.com/docs/k6/latest/set-up/install-k6/
```

Levantar un Postgres desechable y apuntar el backend a él:

Se publica en el **5433**, no en el 5432, para no chocar con un Postgres que ya
tengas corriendo:

```powershell
docker run -d --name cmms-load -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cmms_load -p 5433:5432 postgres:16-alpine
```

Aplicar las migraciones y crear el primer admin (**no se puede crear por la web**,
ver `CLAUDE.md`). El esquema no existe hasta que corren las migraciones, así que
este orden importa:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5433/cmms_load npm run migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5433/cmms_load node bootstrap-admin.js
```

Arrancar el backend contra la base desechable y sin limitadores:

```powershell
# PowerShell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5433/cmms_load"
$env:RATE_LIMIT_DISABLED="true"
npm run dev:backend
```

```bash
# bash / Git Bash
DATABASE_URL=postgres://postgres:postgres@localhost:5433/cmms_load \
RATE_LIMIT_DISABLED=true npm run dev:backend
```

> `dotenv` **no pisa** las variables que ya existen en el entorno, así que este
> `DATABASE_URL` gana sobre el de `backend/.env` (que apunta a Neon). Aun así,
> comprueba en el arranque que el log dice `postgresql` y que las migraciones se
> aplican **desde cero**: si no lo hacen, estás apuntando a una base ya poblada.

## Correr los escenarios

```bash
npm run load:smoke        # ¿funciona? 1 VU, 1 iteración. Empieza SIEMPRE por aquí.
npm run load:test         # carga sostenida: 20 técnicos concurrentes, mezcla real
npm run load:write        # el camino de escritura: alta de reporte + PDF
npm run load:stress       # hasta romperlo: ¿dónde cede y cómo?
npm run load:rate-limit   # verifica que el limitador protege (backend SIN la variable)
```

Credenciales y destino se pasan por variables de k6:

```bash
k6 run k6/scenarios/load.js -e ADMIN_EMAIL=admin@tuya.com -e ADMIN_PASSWORD=... -e BASE_URL=http://localhost:8001
```

## Qué mide cada escenario, y por qué

| Escenario | Pregunta que responde |
|---|---|
| `smoke` | ¿Responden todos los endpoints, y sigue rechazando a quien no lleva token? |
| `load` | Con ~20 técnicos concurrentes, ¿aguanta el p95 por debajo de 500 ms? |
| `write-flow` | ¿Cuántos reportes por segundo admite el sistema de verdad? |
| `stress` | ¿Dónde rompe, y devuelve errores limpios o se queda colgado? |
| `rate-limit` | ¿El limitador sigue cortando, o alguien dejó puesto el interruptor? |

## Línea base medida (2026-07-13)

Medido en local (Docker Postgres 16, backend en `node`, k6 en la misma máquina).
Son números **de referencia para detectar regresiones**, no una predicción de
producción: en Vercel las lambdas son más lentas y Neon tiene muchas menos
conexiones. Reproduce esta línea base antes de dar por bueno un cambio de
rendimiento.

| Escenario | Resultado |
|---|---|
| `load` (20 VUs, lecturas) | p95 **19 ms**, 0 fallos en 4246 peticiones |
| `stress` (hasta 200 VUs) | p95 **41 ms**, 153 req/s, **0 errores, ningún 5xx** |
| `write-flow` (5 altas/s) | p95 alta **44 ms**, PDF **18 ms**, 0 errores |
| `write-flow` (60 altas/s) | sostiene **59,7/s**, p95 **67 ms**, 1 iteración descartada |
| `write-flow` (150 altas/s) | **techo: ~70/s**, p95 **1,06 s**, 2316 descartadas, 0 errores |
| `rate-limit` | corta exactamente en **100**: 99 servidas + 21 × `429` |

## Los dos cuellos de botella conocidos

No hacía falta una prueba para sospecharlos. La prueba sirvió para **cuantificarlos**,
y el resultado cambia la conclusión.

**El número de reporte serializa TODAS las altas — pero el techo está en ~70/s.**
[`utils/reportNumber.js`](../backend/src/utils/reportNumber.js) abre una transacción
y bloquea con `SELECT … FOR UPDATE` **la misma fila** del contador en cada alta. Es
un punto de serialización global y es correcto que lo sea: garantiza que `SRV-0042`
no se repite ni se reutiliza tras un borrado.

Medido: el sistema sostiene ~70 altas/s y a partir de ahí **degrada encolando**, no
fallando (latencia hasta 1 s, cero errores). Con una plantilla de técnicos que hace
unos pocos reportes al día, ese techo sobra por varios órdenes de magnitud. **Es un
cuello de botella teórico, no un problema real: no lo optimices.** Si algún día
apretara de verdad, la respuesta no es quitar el bloqueo (volverían los números
duplicados), sino acortar la transacción o pasar a una secuencia nativa de Postgres.

**El PDF es CPU en el mismo proceso.**
`pdfService.js` (pdfkit) genera el documento en memoria dentro del request: 12 ms de
media en local, pero sube a 413 ms cuando el sistema va saturado (150 altas/s). En
una lambda compite con todo lo demás. `write-flow.js` lo mide aparte
(`pdf_duration`) para poder decidir con datos, y no por intuición, si algún día hay
que sacarlo del camino síncrono.

**Lo que estas pruebas NO dicen.** En local no se rompió nada ni con 200 VUs. Eso
mide la máquina, no producción: allí el sospechoso es el **pool de conexiones** de
Neon (plan gratuito, pocas conexiones), que no se puede reproducir aquí. Un `stress`
verde en local no autoriza a prometer nada sobre producción.

## Cómo leer los resultados

- **`http_req_duration` p95** es la métrica de cabecera; la media miente (una cola
  larga se esconde detrás de un promedio decente).
- **`http_req_failed`** por encima del 1% significa que la carga ya rompe cosas.
- En `stress`, lo interesante **no es el número de VUs que aguanta**, sino la
  forma en que cede. El sospechoso habitual es el **pool de conexiones**: cuando se
  agota, la API no devuelve un 503 limpio, se queda esperando — así que el síntoma
  es una latencia que crece sin techo, no un error.
- Un umbral incumplido hace que k6 **salga con código ≠ 0**. Eso es lo que
  convierte esto en una prueba y no en un informe bonito que nadie mira.

## Los datos de prueba no se borran

Los escenarios de escritura crean clientes, equipos y reportes, y **no los limpian**.
Es deliberado: el contador de reportes nunca reutiliza un número, así que borrar las
filas no devolvería el sistema a su estado anterior; solo daría una falsa sensación
de limpieza. **Corre esto contra una base de datos desechable**, y tírala al acabar:

```powershell
docker rm -f cmms-load
```

Por el mismo motivo, `lib/config.js` **aborta si `BASE_URL` apunta a un entorno
remoto** (Vercel/Neon). Saltárselo requiere `-e I_KNOW_THIS_IS_PROD=true`, y hacerlo
significa agotar las conexiones de un Neon gratuito y dejar basura en la base de
datos de la empresa.
