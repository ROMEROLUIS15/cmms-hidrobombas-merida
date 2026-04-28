# 🔧 CMMS Hidrobombas Mérida

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-Sequelize-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)

**Sistema de Gestión de Mantenimiento (CMMS) diseñado para digitalizar los reportes físicos de mantenimiento de equipos de bombeo de Hidrobombas Mérida C.A.**

_Monorepo · REST API · Mobile-First PWA · Generación de PDF · Offline-Ready_

</div>

---

## 📋 Tabla de Contenido

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Modelo de Datos](#-modelo-de-datos)
- [API Reference](#-api-reference)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [PWA y Funcionalidad Offline](#-pwa-y-funcionalidad-offline)
- [Generación de PDF](#-generación-de-pdf)
- [Roles y Seguridad](#-roles-y-seguridad)
- [Roadmap](#-roadmap)

---

## 📌 Descripción del Proyecto

Hidrobombas Mérida C.A. realiza mantenimientos mensuales y eventuales a sistemas de bombeo en edificios, hoteles e instalaciones industriales en Venezuela. Antes de este sistema, todos los técnicos llevaban los datos en **hojas físicas de 60+ campos** que luego se archivaban manualmente.

Este CMMS digitaliza ese proceso de extremo a extremo:

- ✅ El técnico llena el formulario en su **teléfono** (funciona sin conexión)
- ✅ Los datos se sincronizan automáticamente al reconectar
- ✅ El supervisor genera un **PDF idéntico** a la hoja física con un clic
- ✅ El historial completo queda disponible con filtros y búsqueda

---

## ✨ Características Principales

| Módulo                             | Funcionalidad                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🔐 **Autenticación**               | JWT con refresh tokens, roles granulares, recuperación de contraseña por email                                 |
| 📋 **Formulario de Mantenimiento** | 60+ campos técnicos organizados en wizard mobile-first (Agua/Energía, Motores ×3, Control/Periféricos, Firmas) |
| 📊 **Historial de Reportes**       | Búsqueda, filtros por tipo de visita, estadísticas en tiempo real                                              |
| 🖨️ **Generación de PDF**           | Replicación fiel del formato físico (cabecera, tablas técnicas, firmas) con PDFKit                             |
| 📴 **Modo Offline**                | Service Worker + IndexedDB + Background Sync — funciona en campo sin red                                       |
| 🏢 **Gestión de Clientes**         | CRUD completo con historial de equipos asociados                                                               |
| ⚙️ **Gestión de Equipos**          | Catálogo técnico por cliente con estados y número de serie                                                     |
| 📈 **Dashboard**                   | KPIs de mantenimientos realizados, equipos activos, servicios pendientes                                       |

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología          | Uso                                   |
| ------------------- | ------------------------------------- |
| **Node.js 18+**     | Runtime                               |
| **Express.js**      | Framework HTTP                        |
| **Sequelize ORM**   | Abstracción de base de datos          |
| **SQLite 3**        | Base de datos embebida (zero-config)  |
| **JSON Web Tokens** | Autenticación stateless               |
| **PDFKit**          | Generación de PDFs en memoria         |
| **Helmet**          | Headers de seguridad HTTP             |
| **Morgan**          | Logging de requests                   |
| **bcryptjs**        | Hash de contraseñas                   |
| **Nodemailer**      | Envío de emails (reset de contraseña) |
| **Zod**             | Validación estricta de esquemas HTTP  |
| **ESLint + JSDoc**  | Calidad de código y tipado simulado   |
### Frontend

| Tecnología          | Uso                                 |
| ------------------- | ----------------------------------- |
| **React 18**        | UI Library                          |
| **React Router v6** | Navegación SPA                      |
| **Axios**           | Cliente HTTP con interceptores      |
| **Sonner**          | Notificaciones toast                |
| **Lucide React**    | Iconografía                         |
| **Service Worker**  | Cache y funcionamiento offline      |
| **IndexedDB**       | Cola de reportes pendientes offline |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser/Mobile)              │
│                                                          │
│   React SPA ←→ Service Worker ←→ IndexedDB (offline)    │
│        │                                                 │
│        │  Bearer JWT                                     │
│        ▼                                                 │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (Express)                     │
│                                                          │
│  authMiddleware → Router → Controller → Service/Model   │
│                                   │                     │
│                              Sequelize ORM              │
│                                   │                     │
│                              SQLite 3                   │
├─────────────────────────────────────────────────────────┤
│                    OFFLINE FLOW                          │
│                                                          │
│  Sin red → enqueueReport() → IndexedDB                  │
│  Con red → Background Sync → POST /api/service-reports  │
└─────────────────────────────────────────────────────────┘
```

### Estrategias de Caché (Service Worker)

| Tipo de recurso                 | Estrategia                                       |
| ------------------------------- | ------------------------------------------------ |
| Assets estáticos (JS/CSS/fonts) | **Cache First** — carga instantánea              |
| Llamadas a la API               | **Network First** con fallback a caché           |
| Navegación HTML                 | **Network First** con `offline.html` de respaldo |
| Reportes sin conexión           | **IndexedDB Queue** + Background Sync            |

---

## 📁 Estructura del Proyecto

```
cmms-hidrobombas-merida/          ← Monorepo raíz
├── package.json                  ← Scripts concurrently (dev, install:all)
├── .gitignore
├── .gitconfig
│
├── backend/                      ← API REST Node.js + Express
│   ├── package.json
│   ├── eslint.config.js          ← Reglas estrictas de linter
│   ├── .env                      ← Variables de entorno (NO se sube a git)
│   ├── .env.example
│   ├── seed-dummy-data.js        ← Poblador de BD para desarrollo
│   └── src/
│       ├── server.js             ← Punto de entrada HTTP
│       ├── app.js                ← Configuración Express (cors, helmet, rutas)
│       ├── config/
│       │   └── database.js       ← Conexión Sequelize + SQLite
│       ├── models/
│       │   ├── index.js          ← Asociaciones entre modelos
│       │   ├── User.js           ← Usuario (admin / technician)
│       │   ├── Client.js         ← Cliente (empresa)
│       │   ├── Equipment.js      ← Equipo de bombeo
│       │   ├── ServiceReport.js  ← Reporte de mantenimiento (JSON columns)
│       │   └── PasswordResetToken.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── clientController.js
│       │   ├── dashboardController.js
│       │   ├── equipmentController.js
│       │   ├── passwordController.js
│       │   ├── pdfController.js  ← Stream PDF al cliente
│       │   └── serviceReportController.js
│       ├── services/
│       │   └── pdfService.js     ← Motor de generación PDF (PDFKit)
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── clientRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── equipmentRoutes.js
│       │   └── serviceReportRoutes.js  ← incluye GET /:id/pdf
│       ├── middleware/
│       │   ├── authMiddleware.js       ← protect / authorize / optional
│       │   ├── errorHandler.js
│       │   └── zodMiddleware.js        ← Interceptor de errores Zod
│       ├── validators/
│       │   └── authValidators.js       ← Esquemas Zod (registro/login)
│       └── utils/
│           └── jwt.js
│
└── frontend/                     ← React 18 SPA / PWA
    ├── package.json
    ├── eslint.config.js          ← Reglas estrictas de linter
    ├── .env
    ├── public/
    │   ├── index.html            ← Meta PWA, manifest link
    │   ├── manifest.json         ← PWA: name, icons, shortcuts, theme
    │   ├── sw.js                 ← Service Worker (Cache + Sync)
    │   └── offline.html          ← Página de fallback sin conexión
    └── src/
        ├── index.js              ← ReactDOM + registro Service Worker
        ├── App.js                ← Router, auth state, OfflineBanner
        ├── App.css
        ├── index.css
        ├── components/
        │   ├── Login.js          ← Login / Register con animaciones
        │   ├── Dashboard.js      ← KPIs y métricas
        │   ├── Navigation.js     ← Navbar responsive mobile-first
        │   ├── ServiceForm.js    ← Formulario técnico 60+ campos
        │   ├── ServiceReports.js ← Historial, filtros, modal detalles
        │   ├── ClientList.js     ← CRUD clientes
        │   ├── EquipmentList.js  ← CRUD equipos
        │   ├── OfflineBanner.js  ← Banner estado de conexión
        │   ├── auth/
        │   │   ├── ForgotPassword.js
        │   │   ├── ResetPassword.js
        │   │   └── VerifyEmail.js
        │   └── ui/               ← Design system (Card, Button, Badge…)
        ├── hooks/
        │   ├── use-toast.js
        │   ├── useNetworkStatus.js   ← online/offline + trigger sync
        │   └── useOfflineQueue.js    ← IndexedDB CRUD + replayQueue()
        └── lib/
```

---

## 🗄️ Modelo de Datos

### `ServiceReport` — núcleo del sistema

El modelo replica fielmente los **60+ campos** de la hoja física usando columnas JSON para los bloques técnicos, evitando múltiples tablas y migraciones complejas.

```
ServiceReport
├── id                  UUID PK
├── reportNumber        SRV-XXXX (generado server-side)
├── reportDate          DATE
├── visitType           ENUM('mensual','eventual','technical')
├── systemName          STRING  ← "Sistema Hidroneumático Torre A"
│
├── waterEnergyData     JSON {
│     voltage_r_s, voltage_r_n, voltage_s_t, voltage_s_n,
│     voltage_t_r, voltage_t_n, water_level,
│     float_contact_na, float_contact_na_2, led_empty_tank,
│     volts_min, volts_max, time_1, time_2
│   }
│
├── motorsData          JSON [{     ← array hasta 3 motores
│     motor_hp, amperage,
│     phase_r, phase_s, phase_t,
│     bobina_value, contactos_value,
│     thermal_amp, thermal_nc, thermal_no,
│     motor_temp, voluta_temp, thermal_temp
│   }]
│
├── controlData         JSON {
│     breaker_tripolar_1/2/3, breaker_control,
│     relay_alternator, relay_control_level,
│     manometer, pressure_on, pressure_off,
│     compressor_oil, compressor_belt,
│     pump_1/2/3_on_minutes, _rest_minutes, _noise_db
│   }
│
├── observations        TEXT
├── technicianName      STRING
├── clientSignatureName STRING
│
├── equipmentId         FK → Equipment
└── userId              FK → User
```

### Relaciones

```
User ──< ServiceReport >── Equipment >── Client
```

---

## 🌐 API Reference

Base URL: `http://localhost:8001/api`

### Autenticación

| Método | Endpoint                      | Descripción                         |
| ------ | ----------------------------- | ----------------------------------- |
| `POST` | `/auth/login`                 | Login → devuelve JWT + refreshToken |
| `POST` | `/auth/register`              | Registro de usuario                 |
| `POST` | `/auth/refresh`               | Renovar access token                |
| `POST` | `/auth/forgot-password`       | Envía email de recuperación         |
| `POST` | `/auth/reset-password/:token` | Resetear contraseña                 |

### Reportes de Servicio `🔒 JWT requerido`

| Método   | Endpoint                   | Descripción                |
| -------- | -------------------------- | -------------------------- |
| `GET`    | `/service-reports`         | Listar todos los reportes  |
| `GET`    | `/service-reports/:id`     | Detalle de un reporte      |
| `GET`    | `/service-reports/:id/pdf` | **Descargar PDF** (stream) |
| `POST`   | `/service-reports`         | Crear nuevo reporte        |
| `PUT`    | `/service-reports/:id`     | Actualizar reporte         |
| `DELETE` | `/service-reports/:id`     | Eliminar reporte           |

### Clientes y Equipos `🔒 JWT requerido`

| Método           | Endpoint         | Descripción            |
| ---------------- | ---------------- | ---------------------- |
| `GET/POST`       | `/clients`       | Listar / Crear cliente |
| `GET/PUT/DELETE` | `/clients/:id`   | CRUD individual        |
| `GET/POST`       | `/equipment`     | Listar / Crear equipo  |
| `GET/PUT/DELETE` | `/equipment/:id` | CRUD individual        |

### Utilidades

| Método | Endpoint         | Descripción              |
| ------ | ---------------- | ------------------------ |
| `GET`  | `/`              | Health check             |
| `GET`  | `/api/health`    | Estado del servidor y DB |
| `GET`  | `/api/dashboard` | KPIs generales `🔒`      |

---

## 🚀 Instalación y Configuración

### Prerequisitos

- Node.js `>= 18.x`
- npm `>= 9.x`
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/ROMEROLUIS15/cmms-hidrobombas-merida.git
cd cmms-hidrobombas-merida
```

### 2. Instalar todas las dependencias (monorepo)

```bash
npm run install:all
```

### 3. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores (ver sección Variables de Entorno)
```

### 4. Inicializar la base de datos con datos de prueba

```bash
cd backend
node seed-dummy-data.js
```

### 5. Iniciar en modo desarrollo

```bash
# Desde la raíz — inicia backend (8001) y frontend (5000) simultáneamente
npm run dev
```

Abre [http://localhost:5000](http://localhost:5000) en el navegador.

---

## 👥 Gestión de Usuarios

Para un entorno profesional, existen dos formas de gestionar los accesos:

### 1. Gestión de Usuarios (Asistente Seguro) 🛡️
Hemos creado un asistente inteligente que le guiará paso a paso para evitar errores. Este sistema valida que los correos sean reales y que las contraseñas coincidan antes de guardarlas.

**Para usarlo:**
1.  Abra su terminal.
2.  Escriba: `cd backend`
3.  Escriba: `npm run user:manage`
4.  **Siga las instrucciones en pantalla:**
    *   **Opción 1 (VER LISTA):** Muestra una tabla con todos los técnicos y si pueden entrar o no.
    *   **Opción 2 (CREAR NUEVO):** Le pedirá el nombre, el correo (dos veces para verificar) y la clave (dos veces para verificar).
    *   **Opción 3 (DAR ACCESO):** Use esto para autorizar a un técnico que se acaba de registrar en la web.
    *   **Opción 4 (QUITAR ACCESO):** Bloquea el acceso a cualquier usuario de forma inmediata.

**Nota de seguridad:** Al escribir la clave, asegúrese de que nadie esté mirando su pantalla. El sistema le pedirá confirmación antes de cualquier cambio importante.

---

## ⚙️ Variables de Entorno

### `backend/.env`

```env
# ── Servidor ──────────────────────────────────────────
NODE_ENV=development
PORT=8001
FRONTEND_URL=http://localhost:5000

# ── Base de datos ──────────────────────────────────────
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# ── Seguridad JWT ──────────────────────────────────────
JWT_SECRET=tu_secreto_muy_seguro_aqui
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=otro_secreto_seguro
REFRESH_TOKEN_EXPIRES_IN=30d

# ── Email (recuperación de contraseña) ────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# ── Seed (credenciales — NO exponer en logs) ──────────
SEED_ADMIN_EMAIL=admin@empresa.com
SEED_ADMIN_PASSWORD=TuPasswordSeguro123!
SEED_TECH_EMAIL=tecnico@empresa.com
SEED_TECH_PASSWORD=OtroPasswordSeguro123!
```

### `frontend/.env`

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 📜 Scripts Disponibles

### Raíz del monorepo

```bash
npm run dev          # Inicia backend + frontend simultáneamente
npm run dev:backend  # Solo backend (puerto 8001)
npm run dev:frontend # Solo frontend (puerto 5000)
npm run install:all  # Instala deps en raíz, backend y frontend
```

### Backend (`/backend`)

```bash
npm run dev          # Nodemon con hot-reload
npm start            # Producción
node seed-dummy-data.js  # Resetear y poblar BD de desarrollo
```

### Frontend (`/frontend`)

```bash
npm start            # Dev server (puerto 5000)
npm run build        # Build de producción optimizado
```

---

## 📱 PWA y Funcionalidad Offline

La app cumple todos los criterios de una **Progressive Web App** instalable en Android e iOS:

### Instalación

- **Android/Chrome**: Aparece el banner "Añadir a pantalla de inicio" automáticamente
- **iOS/Safari**: Menú compartir → "Añadir a pantalla de inicio"
- **Desktop/Chrome**: Icono de instalación en la barra de direcciones

### Flujo Offline

```
Técnico en campo sin señal
         │
         ▼
   Llena el formulario
         │
         ▼
  useOfflineQueue.enqueueReport()
         │
         ▼
   Guardado en IndexedDB
         │
   (recupera conexión)
         │
         ▼
  Background Sync → sw.js
         │
         ▼
  POST /api/service-reports
         │
         ▼
  Sincronizado ✅ + notificación
```

### Hooks personalizados

| Hook               | Responsabilidad                                       |
| ------------------ | ----------------------------------------------------- |
| `useNetworkStatus` | Detecta online/offline, dispara Background Sync       |
| `useOfflineQueue`  | CRUD IndexedDB + `replayQueue()` para fallback manual |

---

## 🖨️ Generación de PDF

El endpoint `GET /api/service-reports/:id/pdf` genera y **streamea** un PDF en memoria (sin tocar disco) que replica el formato oficial de la empresa.

### Secciones del PDF generado

1. **Cabecera** — Logo empresa, datos de contacto, número de reporte, fecha
2. **Barra de tipo** — Color codificado por tipo de visita (verde/naranja/azul)
3. **Información General** — Cliente, equipo, técnico, sistema, ubicación
4. **Voltaje de Red** — Tabla con 6 mediciones trifásicas + Vmin/Vmax
5. **Estado del Sistema** — Nivel de agua, contactos flotantes, LED
6. **Motores** — Tabla dinámica para 1-3 motores con 11 columnas técnicas
7. **Control y Periféricos** — Breakers, relés, presostatos, ciclos de bombas
8. **Observaciones** — Caja de texto con borde
9. **Firmas** — Dos cajas (Técnico / Cliente) con línea y nombre

---

## 🔐 Roles y Seguridad

### Roles de usuario

| Rol          | Permisos                                                        |
| ------------ | --------------------------------------------------------------- |
| `admin`      | Acceso total. Gestión de usuarios, clientes, equipos y reportes |
| `technician` | Crear y ver reportes. Sin acceso a administración               |

### Medidas de seguridad implementadas

- 🔒 **JWT + Refresh Tokens** con expiración configurable
- 🛡️ **Helmet** — 15 headers de seguridad HTTP automáticos
- 🔑 **bcryptjs** — Hash de contraseñas con salt rounds
- 🌐 **CORS** configurado por allowlist (no `*`)
- ✅ **Validación Estricta** de inputs con `Zod` (schemas inferibles) y sanitización.
- 🚫 **Tokens de reset** de un solo uso con expiración
- 📵 **Rutas protegidas** — Todo requiere JWT válido salvo `/auth/*`

---

## 🧪 Pruebas Unitarias y Calidad de Código

El backend cuenta con una sólida suite de pruebas unitarias implementada con **Jest**. Se cubre el 100% de la lógica central, incluyendo:

- **Modelos:** Validaciones de base de datos, métodos de instancia y hooks (ej. encriptación de contraseñas).
- **Controladores:** Pruebas CRUD aisladas con _mocking_ de la base de datos para manejar flujos exitosos y errores (400, 404, 500).
- **Middlewares:** Comprobación del manejador global de errores, autenticación y validación estricta de esquemas (Zod).
- **Servicios:** Pruebas del generador de PDF (PDFKit).

### Ejecutar las pruebas

Desde el directorio `/backend`:

```bash
npm test            # Ejecutar todas las pruebas (100+ tests)
npm run test:watch  # Ejecutar en modo watch para desarrollo
```

---

## 🗺️ Roadmap

- [x] **v1.0** — Backend CRUD completo (Users, Clients, Equipment, Reports)
- [x] **v1.1** — Formulario técnico 60+ campos (fiel a la hoja física)
- [x] **v1.2** — Refactorización UI/UX del historial de reportes
- [x] **v2.0** — Generación de PDF con PDFKit (stream en memoria)
- [x] **v2.0** — PWA completa: SW, IndexedDB, Background Sync, offline.html
- [x] **v2.1** — Calidad de Código: Validación Zod, Linting Estricto y JSDoc
- [x] **v2.2** — Pruebas Unitarias (Jest) con 100% cobertura de la lógica de negocio
- [ ] **v2.3** — Firma digital en canvas (tablet)
- [ ] **v2.4** — QR en equipos para acceso rápido al formulario
- [ ] **v2.5** — Notificaciones push para recordatorios de mantenimiento mensual
- [ ] **v3.0** — Multi-empresa (tenant isolation)

---

## 👤 Autor

**Luis Romero**
Desarrollador Full Stack · Venezuela

[![GitHub](https://img.shields.io/badge/GitHub-ROMEROLUIS15-181717?style=flat-square&logo=github)](https://github.com/ROMEROLUIS15)

---

## ⚖️ Licencia y Uso

Este software es de uso **exclusivo y propietario** de Hidrobombas Mérida C.A.  
Queda prohibida su reproducción, distribución o uso comercial sin autorización expresa por escrito del autor.

© 2026 Luis Romero — Todos los derechos reservados.
