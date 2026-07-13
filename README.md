# 🔧 CMMS Hidrobombas Mérida

**Sistema de Gestión de Mantenimiento Computarizado (CMMS)** diseñado para **Hidrobombas Mérida**, empresa venezolana especializada en el mantenimiento preventivo y correctivo de sistemas hidroneumáticos, bombas centrífugas, motores eléctricos y equipos industriales de agua.

[![Node.js](https://img.shields.io/badge/Backend-Node.js%2020+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Vite](https://img.shields.io/badge/Build-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

---

## 📋 Tabla de Contenidos

- [¿Para quién es este sistema?](#-para-quién-es-este-sistema)
- [Funcionalidades principales](#-funcionalidades-principales)
- [Arquitectura del sistema](#-arquitectura-del-sistema)
- [Stack tecnológico](#-stack-tecnológico)
- [Configuración e instalación](#-configuración-e-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Cómo correr el proyecto](#-cómo-correr-el-proyecto)
- [API REST — Endpoints](#-api-rest--endpoints)
- [Roles y permisos](#-roles-y-permisos)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Documentación adicional](#-documentación-adicional)
- [Contribuir](#-contribuir)

---

## 👥 ¿Para quién es este sistema?

Este CMMS digitaliza la **hoja física de inspección de Hidrobombas Mérida**, eliminando el papel y centralizando la información con acceso seguro desde cualquier dispositivo. Está pensado para:

- **Técnicos de campo** que registran datos técnicos durante una visita (voltajes, amperajes, temperaturas, estados de componentes).
- **Administradores** que gestionan clientes, equipos, asignaciones, historial de reportes y documentación PDF.
- **Supervisores** que requieren visibilidad del estado de la flota y el historial de intervenciones.

---

## ✨ Funcionalidades principales

### 🔐 Autenticación y Seguridad
- Login con JWT (access + refresh token) con expiración configurable.
- Cookies `httpOnly` + `SameSite=strict` y headers seguros vía Helmet.
- Control de cuentas activas/inactivas y recuperación de contraseña por token de un solo uso.
- **Autorización por ownership**: cada usuario solo accede a los recursos que le corresponden (ver [Roles y permisos](#-roles-y-permisos)).
- Rate limiting por área (auth, API general y un límite específico más estricto para IA).

### 📋 Wizard de Reporte de Servicio (13 pasos)
Guía al técnico paso a paso para capturar toda la información técnica de una inspección:

| Paso | Nombre | Datos capturados |
|------|--------|-----------------|
| 0 | Información General | Cliente, equipo, tipo de visita, fecha, sistema |
| 1 | Voltaje de Red / Energía | Voltajes R-S, S-T, T-R, nivel de agua |
| 2 | Nivel de Agua | Estado del depósito y flotadores |
| 3 | Supervisor de Voltaje | Voltajes mínimo y máximo configurados |
| 4 | Interruptor Flotante | Contactos NA/NC del flotador |
| 5 | Consumo de Energía | Amperaje por fase por motor (hasta 3 motores) |
| 6 | Contactores | Estado de bobinas y contactos por motor |
| 7 | Térmicos | Calibración y estado de los relés térmicos |
| 8 | Temperaturas | Temperatura de motor, voluta y térmico |
| 9 | Breakers y Relés | Estado de disyuntores y relé alternador |
| 10 | Presiones y Válvulas | Manómetro, presostato ON/OFF |
| 11 | Ciclos y Ruido | Tiempo de bombeo, descanso y nivel de ruido (dB) |
| 12 | Observaciones y Firma | Recomendaciones, firma digital del cliente |

### 🏢 Gestión de Clientes y ⚙️ Equipos
- CRUD de clientes y equipos (gestión del maestro restringida a admin/supervisor).
- Asociación equipo → cliente e historial de reportes.
- Asignación de técnicos a clientes y equipos.

### 📊 Dashboard, 👤 Usuarios y 📄 PDF
- Métricas de la flota y últimos reportes.
- Gestión de usuarios y roles (admin).
- Exportación de reportes a PDF y envío por email.

### 🤖 Asistencia con IA (LangChain + Groq)
- RAG sobre el historial de reportes y diagnóstico asistido.
- Endpoints bajo `/api/ai` (requieren autenticación). Ver [`API_REFERENCE.md`](API_REFERENCE.md) y [`AGENT_MAESTRO_GUIDE.md`](AGENT_MAESTRO_GUIDE.md).

### 📶 Modo Offline (PWA)
- Detección de pérdida de red, cola de operaciones pendientes en IndexedDB y Service Worker con Background Sync.

---

## 🏛️ Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                       │
│              React 19 + Vite 6 + TailwindCSS                 │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP / REST (Axios) — Bearer <JWT>
┌──────────────────────▼──────────────────────────────────────┐
│                   Backend (Node.js)                          │
│   Express 5 + Sequelize 6                                    │
│   Routes → Middleware (JWT/Zod/ownership) → Controllers →    │
│   Models                                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │   Base de Datos  │
              │  PostgreSQL (Neon) — Producción
              │  SQLite — Desarrollo / Tests
              └──────────────────┘
```

Para decisiones de diseño detalladas ver [`ARCHITECTURE.md`](ARCHITECTURE.md). Estructura completa de carpetas: el backend vive en `backend/src/` (config, models, controllers, routes, middleware, services, validators, utils) y el frontend en `frontend/src/` (components, hooks, lib).

---

## 🛠️ Stack tecnológico

**Backend:** Node.js 20+, Express ^5.1, Sequelize ^6.37, PostgreSQL/SQLite, JWT ^9, bcryptjs ^3, Zod ^4, Helmet ^8, Morgan ^1.10, PDFKit ^0.18, LangChain + Groq, Jest ^29, Supertest ^7.

**Frontend:** React ^19, Vite ^6, React Router ^7, TailwindCSS ^3.4, Radix UI / shadcn, React Hook Form ^7, Zod ^4, Axios ^1, Sonner ^2, idb-keyval ^6, Vitest ^4, Testing Library ^16.

---

## ⚙️ Configuración e instalación

### Requisitos
- **Node.js** v20+ y **npm** v9+
- **Git**
- (Opcional) **PostgreSQL** — sin él, el sistema usa SQLite automáticamente.

### Pasos

```bash
git clone https://github.com/ROMEROLUIS15/cmms-hidrobombas-merida.git
cd cmms-hidrobombas-merida

# Instala raíz + backend + frontend
npm install

# Configura variables del backend
cd backend
cp .env.example .env   # edita los valores

# Aplica las migraciones de esquema
npm run migrate        # 'npm run migrate:status' para ver el estado

# (Opcional) Pobla la BD con datos de prueba (DESTRUCTIVO: borra y recrea)
npm run seed:dummy
```

### Migraciones de esquema

El esquema se gestiona con migraciones versionadas en `backend/migrations/`
(runner propio, sin dependencias). El arranque del servidor aplica las
pendientes automáticamente; ya **no** se usa `sequelize.sync()` implícito en
producción. Para añadir un cambio de esquema, crea un nuevo archivo
`000X-descripcion.js` que exporte `up({ queryInterface, sequelize, DataTypes })`
y `down(...)`.

---

## 🔑 Variables de entorno

Crea `backend/.env` basándote en `backend/.env.example`:

```env
# Servidor
PORT=8001
NODE_ENV=development

# Base de datos
# Opción A: PostgreSQL (producción / Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
# Opción B: SQLite (desarrollo) — no requiere DATABASE_URL
DB_STORAGE=./database.sqlite

# Autenticación
JWT_SECRET=tu_secreto_super_seguro
# OBLIGATORIO en producción y DISTINTO de JWT_SECRET
REFRESH_TOKEN_SECRET=otro_secreto_distinto
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# CORS
FRONTEND_URL=http://localhost:5000

# Rate limiting (opcional, pero MUY recomendado en serverless)
# Sin REDIS_URL el conteo es por-instancia (cada lambda tiene su memoria) y el
# límite real es mucho más débil de lo que sugiere la config.
REDIS_URL=rediss://default:TOKEN@tu-endpoint.upstash.io:6379

# IA (opcional)
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
AI_RATE_LIMIT_MAX=30
HUGGINGFACEHUB_API_KEY=hf_...
# "memory" (RAM, se pierde en cada cold start) | "pgvector" (persistente en Postgres)
# En PRODUCCIÓN se usa pgvector: requiere `CREATE EXTENSION vector` en la BD.
VECTOR_STORE_PROVIDER=pgvector

# Seed (npm run seed:dummy)
SEED_ADMIN_EMAIL=admin@hidrobombasmerida.com
SEED_ADMIN_PASSWORD=...
SEED_TECH_EMAIL=tecnico@hidrobombasmerida.com
SEED_TECH_PASSWORD=...
```

El **frontend** tiene su propia variable (Vite la inyecta en tiempo de build):

```env
# frontend/.env — DEBE apuntar al backend: son dominios distintos en producción.
VITE_API_URL=https://tu-backend.vercel.app
```

> Si `DATABASE_URL` está presente se usa PostgreSQL; si no, SQLite.
>
> ⚠️ **Producción:** `REFRESH_TOKEN_SECRET` es obligatorio. El backend **aborta el arranque** si falta (evita derivar un secreto predecible de `JWT_SECRET`).
>
> ⚠️ **Nunca uses rutas relativas (`/api/...`) en el frontend.** El frontend es un hosting
> estático en otro dominio: un `POST` relativo va contra sí mismo y devuelve **405**. Eso
> dejó el asistente de IA inservible hasta que se detectó.

---

## 🚀 Cómo correr el proyecto

```bash
# Backend + frontend en paralelo (desde la raíz)
npm run dev          # Frontend :5000  |  Backend :8001/api

# Por separado
npm run dev:backend
npm run dev:frontend

# Crear un administrador inicial (interactivo)
cd backend && node bootstrap-admin.js
```

---

## 📡 API REST — Endpoints

Todas las rutas (salvo login/registro/recuperación y health) requieren `Authorization: Bearer <JWT>`. La columna **Acceso** indica restricciones de rol/ownership.

### Autenticación — `/api/auth`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/login` | Iniciar sesión | Público |
| `POST` | `/register` | Registrar técnico (queda **pendiente**; requiere aprobación de un admin). **Devuelve 409 si aún no existe ningún admin** — ver abajo | Público |
| `GET` | `/bootstrap-status` | `{ needsBootstrap, registrationOpen }` — si el sistema está inicializado | Público |
| `GET` | `/profile` | Perfil actual | Autenticado |
| `POST` | `/refresh` | Renovar tokens (rota access + refresh) | Cookie refresh |
| `POST` | `/forgot-password` · `/reset-password` | Recuperación de contraseña | Público |

> **El primer admin NO se crea por la web.** El auto-registro siempre produce técnicos
> *pendientes de aprobación*, y solo un admin puede aprobarlos: con cero admins, cada
> registro nace bloqueado y nadie puede desbloquearlo. Por eso `/register` responde **409
> `SYSTEM_NOT_INITIALIZED`** mientras no exista un admin activo.
> El primer admin se crea con `cd backend && node bootstrap-admin.js` (exige acceso a la BD).
> Deliberadamente **no** se auto-promueve al primer registrado: en un deploy público,
> cualquiera que llegue antes que el dueño se quedaría de administrador.

### Clientes — `/api/clients` · Equipos — `/api/equipment`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/` · `/:id` | Listar / obtener | Autenticado — el técnico solo ve los **asignados** |
| `POST` `PUT` `DELETE` | `/` · `/:id` | Crear / actualizar / eliminar | **admin · supervisor** |

### Reportes de Servicio — `/api/service-reports`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/` · `/:id` | Listar / obtener | Autenticado — el técnico solo ve **propios o de equipos asignados** |
| `POST` | `/` | Crear (auto-numeración) | Autenticado |
| `PUT` `DELETE` | `/:id` | Actualizar / eliminar | Owner o admin/supervisor (403 si no) |
| `GET` | `/:id/pdf` · `POST /:id/email` | PDF / email | Owner o admin/supervisor |

### Asignaciones — `/api/assignments`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/technician/:id/(equipment\|clients\|admins)` | Recursos del técnico | El propio técnico o admin/supervisor |
| `GET` | listados globales y reverse-lookups | — | **admin · supervisor** |
| `POST` `DELETE` | asignar / desasignar | — | **admin · supervisor** |

### Otros
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/api/dashboard` | Métricas | Autenticado |
| `*` | `/api/ai/*` | Asistencia IA | Autenticado (rate-limit estricto) |
| `GET` | `/api/users` … | Gestión de usuarios | admin |
| `GET` | `/` · `/api/health` | Health check | Público |

---

## 🔒 Roles y permisos

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: usuarios, clientes, equipos, asignaciones y todos los reportes. |
| `supervisor` | Lectura total y gestión del maestro de clientes/equipos; ve todos los reportes. |
| `technician` | Crea/edita sus reportes; ve **solo** clientes/equipos asignados y reportes propios o de equipos asignados. No gestiona el maestro. |
| `client` | (Futuro) Solo lectura de reportes de sus equipos. |

La lógica de ownership vive en `backend/src/utils/ownership.js` y se aplica en controladores (filtrado de listas, 403 en acceso directo) y en rutas (restricción de escritura por rol).

---

## 🧪 Testing

```bash
# Backend (Jest + Supertest)
cd backend && npm test                 # 385 tests (unit + integración)
cd backend && npm run test:coverage    # con cobertura

# Frontend (Vitest + Testing Library)
cd frontend && npm run test:run        # 77 tests
```

### ⚠️ La suite corre contra DOS bases de datos, y no es un capricho

El CI (`.github/workflows/ci.yml`) ejecuta la suite del backend **dos veces**:

| Job | BD | Papel |
|-----|----|-------|
| `Backend Tests (Jest)` | SQLite en memoria | Rápido (~48s), feedback inmediato |
| `Backend Tests (Jest + PostgreSQL)` | `postgres:16` real | **Red de seguridad** (~1m13s) |

**SQLite NO valida ENUM ni UUID; Postgres sí.** Correr solo contra SQLite dejó llegar a
producción bugs que la suite daba por buenos, entre ellos uno crítico: **crear un equipo
fallaba siempre**, y sin equipos no hay reportes. Ver [`TECH_DEBT.md`](TECH_DEBT.md) #3.5.

Si tocas el job de Postgres, ten presente que `src/__tests__/setup.js` hace
`DROP SCHEMA public CASCADE` y **se niega a hacerlo si el nombre de la base no contiene
`test`** — esa salvaguarda evita borrar producción por un `DATABASE_URL` mal puesto. No la quites.

Además, el CI corre lint y `npm audit` sobre ambos workspaces.

---

## 🌐 Despliegue

El backend detecta el entorno Vercel vía `process.env.VERCEL` y **fuerza PostgreSQL** (falla si falta `DATABASE_URL`).

Variables mínimas a configurar en la plataforma:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...        # OBLIGATORIO y distinto de JWT_SECRET
FRONTEND_URL=https://tu-dominio
NODE_ENV=production
```

> El seed destructivo (`force:true`) está bloqueado en producción salvo que se defina explícitamente `ALLOW_DESTRUCTIVE_SEED=true`.

Build del frontend: `cd frontend && npm run build` (salida en `frontend/build/`).

---

## 📚 Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Decisiones de diseño del monorepo, BD dual y patrones. |
| [`API_REFERENCE.md`](API_REFERENCE.md) | Referencia de endpoints de IA (Agent Maestro). |
| [`AGENT_MAESTRO_GUIDE.md`](AGENT_MAESTRO_GUIDE.md) | Guía del orquestador de IA. |
| [`LANGCHAIN_CASOS_USO.md`](LANGCHAIN_CASOS_USO.md) | Casos de uso de LangChain. |
| [`NEON_KEEP_ALIVE_GUIDE.md`](NEON_KEEP_ALIVE_GUIDE.md) | Mantener viva la conexión Neon (plan free). |

---

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/nombre`
2. Asegúrate de que pasen los tests y el lint: `npm test` y `npm run lint`
3. Commit con [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: ..."`
4. Abre un Pull Request contra `develop`.

> Los hooks de Husky (`pre-commit`, `pre-push`) ejecutan lint y tests. **No los omitas** (`--no-verify`): el objetivo es que solo llegue código verde a GitHub y Vercel.

---

## 📄 Licencia

**CMMS Hidrobombas Mérida** — Sistema de uso interno. © 2026 Hidrobombas Mérida. Todos los derechos reservados.
