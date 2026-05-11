# 🔧 CMMS Hidrobombas Mérida

**Sistema de Gestión de Mantenimiento Computarizado (CMMS)** diseñado específicamente para **Hidrobombas Mérida**, empresa venezolana especializada en el mantenimiento preventivo y correctivo de sistemas hidroneumáticos, bombas centrífugas, motores eléctricos y equipos industriales de agua.

[![Node.js](https://img.shields.io/badge/Backend-Node.js%2020+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Vite](https://img.shields.io/badge/Build-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20%7C%20Jest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

---

## 📋 Tabla de Contenidos

- [¿Para quién es este sistema?](#-para-quién-es-este-sistema)
- [Funcionalidades principales](#-funcionalidades-principales)
- [Arquitectura del sistema](#-arquitectura-del-sistema)
- [Estructura de archivos](#-estructura-de-archivos)
- [Stack tecnológico](#-stack-tecnológico)
- [Requisitos previos](#-requisitos-previos)
- [Configuración e instalación](#-configuración-e-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Cómo correr el proyecto](#-cómo-correr-el-proyecto)
- [Base de datos](#-base-de-datos)
- [API REST — Endpoints](#-api-rest--endpoints)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Roles y permisos](#-roles-y-permisos)
- [Contribuir](#-contribuir)

---

## 👥 ¿Para quién es este sistema?

Este CMMS está pensado para **empresas de servicio técnico de equipos industriales**, específicamente:

- **Técnicos de campo** que necesitan registrar datos técnicos precisos durante una visita de mantenimiento (voltajes, amperajes, temperaturas, estados de componentes).
- **Administradores** que necesitan gestionar clientes, equipos asignados, historial de reportes y generar documentación PDF.
- **Supervisores** que requieren visibilidad del estado operativo de la flota de equipos y el historial de intervenciones.

El sistema digitaliza y reemplaza la **hoja física de inspección de Hidrobombas Mérida**, eliminando el papel y centralizando la información en una base de datos con acceso seguro desde cualquier dispositivo.

---

## ✨ Funcionalidades principales

### 🔐 Autenticación y Seguridad
- Login con JWT (JSON Web Tokens) con expiración configurable
- Control de cuentas activas/inactivas por el administrador
- Recuperación de contraseña por token de un solo uso (1 hora de validez)
- Headers HTTP seguros vía Helmet.js
- CORS restringido a orígenes configurados explícitamente

### 📋 Wizard de Reporte de Servicio (13 pasos)
El corazón del sistema. Guía al técnico paso a paso para capturar toda la información técnica de una inspección:

| Paso | Nombre | Datos capturados |
|------|--------|-----------------|
| 0 | Información General | Cliente, equipo, tipo de visita, fecha, nombre del sistema |
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

### 🏢 Gestión de Clientes
- Registro completo: nombre, email, teléfono, dirección
- Vista de equipos asociados por cliente
- Historial de reportes por cliente

### ⚙️ Gestión de Equipos
- Catálogo de equipos con: nombre, tipo, número de serie, marca, estado operativo
- Estados: `Operativo`, `En Mantenimiento`, `Dañado`, `Dado de baja`
- Asociación equipo → cliente

### 📊 Dashboard
- Vista general del estado de la flota
- Últimos reportes de servicio
- Métricas de equipos por estado

### 👤 Gestión de Usuarios (Admin)
- Crear, activar/desactivar y gestionar técnicos
- Roles: `admin`, `supervisor`, `technician`, `client`

### 📄 Generación de PDF
- Exportación del reporte de servicio completo a PDF
- Formato profesional con todos los datos técnicos capturados

### 📶 Modo Offline (PWA-ready)
- Detección automática de pérdida de red con `useNetworkStatus`
- Cola de operaciones pendientes con `useOfflineQueue` (persistida en IndexedDB via `idb-keyval`)
- Banner de estado offline/online para el técnico en campo

---

## 🏛️ Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                       │
│              React 19 + Vite 6 + TailwindCSS                │
│                    Puerto: 5000                              │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP / REST API (Axios)
                       │  Authorization: Bearer <JWT>
┌──────────────────────▼──────────────────────────────────────┐
│                   Backend (Node.js)                         │
│              Express 5 + Sequelize 6                        │
│                    Puerto: 8001                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→ │Middleware│→ │Controllers│→ │  Models  │   │
│  │  /api/*  │  │JWT/Zod   │  │ Business │  │Sequelize │   │
│  └──────────┘  └──────────┘  │  Logic   │  └────┬─────┘   │
│                               └──────────┘       │         │
└──────────────────────────────────────────────────┼─────────┘
                                                   │
                          ┌────────────────────────▼──────────┐
                          │         Base de Datos             │
                          │                                   │
                          │  🌐 PostgreSQL (Neon) — Producción│
                          │  💾 SQLite — Desarrollo / Tests   │
                          └───────────────────────────────────┘
```

---

## 📁 Estructura de archivos

```
cmms-hidrobombas-merida/                   ← Raíz del monorepo
├── package.json                           ← Scripts y workspaces npm
├── package-lock.json
├── .gitignore
├── .gitconfig
├── .gitattributes
├── .lintstagedrc
├── eslint.config.mjs                      ← ESLint raíz
├── ARCHITECTURE.md                        ← Documentación de arquitectura
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml                         ← GitHub Actions CI
├── .husky/                                ← Git hooks
│   ├── pre-commit
│   └── pre-push
│
├── e2e/                                 ← Tests E2E Playwright
│   └── auth.spec.js                    ← Tests de autenticación
├── playwright.config.js               ← Configuración de Playwright
│
├── backend/                               ← API REST Node.js
│   ├── package.json
│   ├── package-lock.json
│   ├── jest.config.js
│   ├── jest.setupEnv.js
│   ├── eslint.config.js
│   ├── vercel.json                       ← Config Vercel
│   ├── bootstrap-admin.js                ← Creación interactiva de admin
│   ├── manage-users.js                   ← Gestión de usuarios CLI
│   ├── seed-dummy-data.js                ← Poblado completo de la BD
│   ├── database.sqlite                   ← BD SQLite desarrollo
│   ├── .env                              ← Variables de entorno
│   ├── .env.example                      ← Plantilla de variables
│   ├── .gitignore
│   ├── src/
│   │   ├── server.js                     ← Punto de entrada
│   │   ├── app.js                        ← Express + middlewares globales
│   │   ├── config/
│   │   │   └── database.js               ← Conexión Sequelize (Postgres/SQLite)
│   │   ├── models/
│   │   │   ├── index.js                  ← Asociaciones entre modelos
│   │   │   ├── User.js                   ← Usuario del sistema
│   │   │   ├── Client.js                 ← Cliente de Hidrobombas
│   │   │   ├── Equipment.js              ← Equipo (bomba, motor, etc.)
│   │   │   ├── ServiceReport.js          ← Reporte de mantenimiento
│   │   │   ├── PasswordResetToken.js     ← Token de recuperación de contraseña
│   │   │   ├── AdminTechnician.js        ← Relación admin-técnico
│   │   │   ├── TechnicianClient.js       ← Relación técnico-cliente
│   │   │   ├── TechnicianEquipment.js    ← Relación técnico-equipo
│   │   │   └── IdempotencyKey.js         ← Keys para idempotencia
│   │   ├── controllers/
│   │   │   ├── authController.js         ← Login, registro, perfil, logout, refresh
│   │   │   ├── passwordController.js     ← Forgot/reset password
│   │   │   ├── clientController.js       ← CRUD clientes
│   │   │   ├── equipmentController.js    ← CRUD equipos
│   │   │   ├── serviceReportController.js ← CRUD reportes + auto-numeración
│   │   │   ├── userController.js         ← Gestión de usuarios (admin)
│   │   │   ├── dashboardController.js    ← Métricas del dashboard
│   │   │   ├── pdfController.js          ← PDF + email de reportes
│   │   │   └── assignmentController.js   ← Asignaciones técnico-equipo-cliente
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clientRoutes.js
│   │   │   ├── equipmentRoutes.js
│   │   │   ├── serviceReportRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── assignmentRoutes.js       ← Rutas de asignaciones
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         ← Verificación JWT (header + cookies)
│   │   │   ├── errorHandler.js           ← Manejador global de errores
│   │   │   ├── zodMiddleware.js          ← Validación de esquemas Zod
│   │   │   └── idempotencyMiddleware.js  ← Middleware de idempotencia
│   │   ├── services/
│   │   │   ├── pdfService.js             ← Generación de PDF con PDFKit
│   │   │   └── emailService.js           ← Envío de emails (nodemailer)
│   │   ├── validators/
│   │   │   └── authValidators.js         ← Esquemas Zod para auth
│   │   ├── utils/
│   │   │   ├── jwt.js                    ← Helpers de JWT (token + refresh)
│   │   │   ├── cookie.js                 ← Helpers de cookies httpOnly
│   │   │   └── pagination.js             ← Helper de paginación
│   │   └── __tests__/                    ← Tests (unitarios + integración) - 160 tests
│   │       ├── setup.js
│   │       ├── testAuthHelper.js
│   │       ├── authController.unit.test.js
│   │       ├── authMiddleware.unit.test.js
│   │       ├── authValidators.unit.test.js
│   │       ├── clientController.unit.test.js
│   │       ├── clientModel.test.js
│   │       ├── clientRoutes.integration.test.js
│   │       ├── dashboardController.unit.test.js
│   │       ├── dashboardRoutes.integration.test.js
│   │       ├── equipmentController.unit.test.js
│   │       ├── equipmentRoutes.integration.test.js
│   │       ├── errorHandler.unit.test.js
│   │       ├── jwt.unit.test.js
│   │       ├── passwordController.unit.test.js
│   │       ├── pdfController.unit.test.js
│   │       ├── pdfService.unit.test.js
│   │       ├── serviceReportController.unit.test.js
│   │       ├── serviceReportRoutes.integration.test.js
│   │       ├── userRoutes.integration.test.js
│   │       ├── zodMiddleware.unit.test.js
│   │       └── e2eExample.test.js
│   └── tests/
│       └── health.test.js                ← Test health endpoint
│
└── frontend/                              ← SPA React
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js                     ← Config Vite + Vitest + alias @/
    ├── tailwind.config.js
    ├── postcss.config.cjs
    ├── eslint.config.js
    ├── jest.config.js
    ├── jsconfig.json                      ← Config JS paths
    ├── components.json                    ← Config shadcn/ui
    ├── index.html                         ← Punto de entrada HTML (Vite)
    ├── .env                               ← Variables de entorno
    ├── .env.example                       ← Plantilla de variables
    ├── .gitignore
    ├── build/                             ← Build de producción
    │   ├── index.html
    │   ├── manifest.json
    │   ├── sw.js
    │   ├── offline.html
    │   └── assets/
    ├── coverage/                          ← Reporte de cobertura tests
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js
    │   ├── offline.html
    │   └── logo.jpg
    ├── __mocks__/                         ← Mocks para tests
    │   ├── axios.js
    │   ├── react-router-dom.js
    │   ├── sonner.js
    │   └── styleMock.js
    ├── src/
    │   ├── index.jsx                     ← Punto de entrada React
    │   ├── index.css                     ← Estilos globales Tailwind
    │   ├── App.jsx                       ← Router principal
    │   ├── App.css                       ← Estilos adicionales
    │   ├── setupTests.js                 ← Config tests
    │   ├── components/
    │   │   ├── Login.jsx                ← Pantalla de inicio de sesión
    │   │   ├── Dashboard.jsx            ← Vista principal post-login
    │   │   ├── Navigation.jsx           ← Barra de navegación
    │   │   ├── ClientList.jsx           ← Gestión de clientes
    │   │   ├── EquipmentList.jsx        ← Catálogo de equipos
    │   │   ├── ServiceReports.jsx       ← Historial de reportes
    │   │   ├── UserManagement.jsx       ← Admin de usuarios
    │   │   ├── OfflineBanner.jsx        ← Indicador de modo offline
    │   │   ├── ServiceForm.old.txt      ← Formulario legacy (deprecated)
    │   │   ├── ServiceWizard/
    │   │   │   ├── ServiceWizard.jsx    ← Shell del wizard multi-paso
    │   │   │   ├── WizardContext.jsx    ← Estado global del formulario
    │   │   │   └── steps/               ← 13+ pasos del reporte técnico
    │   │   │       ├── Step0General.jsx
    │   │   │       ├── Step1EnergyWater.jsx
    │   │   │       ├── Step1VoltajeRed.jsx
    │   │   │       ├── Step2Motors.jsx
    │   │   │       ├── Step2NivelAgua.jsx
    │   │   │       ├── Step3Peripherals.jsx
    │   │   │       ├── Step3SupervisorVoltaje.jsx
    │   │   │       ├── Step4InterruptorFlotante.jsx
    │   │   │       ├── Step4Signature.jsx
    │   │   │       ├── Step5ConsumoEnergia.jsx
    │   │   │       ├── Step6Contactores.jsx
    │   │   │       ├── Step7Termicos.jsx
    │   │   │       ├── Step8Temperaturas.jsx
    │   │   │       ├── Step9BreakersReles.jsx
    │   │   │       ├── Step10PresionesValvulas.jsx
    │   │   │       ├── Step11CiclosRuido.jsx
    │   │   │       └── Step12ObservacionesFirma.jsx
    │   │   ├── auth/                    ← Componentes de autenticación
    │   │   │   ├── ForgotPassword.jsx
    │   │   │   ├── ResetPassword.jsx
    │   │   │   └── VerifyEmail.jsx
    │   │   └── ui/                      ← Componentes shadcn/ui (40+ componentes)
    │   │       ├── button.jsx
    │   │       ├── input.jsx
    │   │       ├── ... (select, dialog, drawer, etc.)
    │   │       ├── sonner.jsx
    │   │       ├── toast.jsx
    │   │       └── toaster.jsx
    │   ├── hooks/
    │   │   ├── useNetworkStatus.jsx     ← Detecta online/offline
    │   │   ├── useOfflineQueue.jsx       ← Cola de reportes pendientes (IndexedDB)
    │   │   └── use-toast.jsx             ← Notificaciones toast
    │   ├── lib/
    │   │   └── utils.jsx                ← Helper clsx/tailwind-merge
    │   └── __tests__/                   ← Tests unitarios (Vitest)
    │       ├── components/
    │       │   ├── Login.test.jsx
    │       │   └── ServiceWizard.test.jsx
    │       └── hooks/
    │           ├── useNetworkStatus.test.js
    │           └── useOfflineQueue.test.js
```
cmms-hidrobombas-merida/                   ← Raíz del monorepo
├── package.json                           ← Scripts y workspaces npm
├── .gitignore
├── README.md
│
├── backend/                               ← API REST Node.js
│   ├── src/
│   │   ├── server.js                      ← Punto de entrada
│   │   ├── app.js                         ← Express + middlewares globales
│   │   ├── config/
│   │   │   └── database.js                ← Conexión Sequelize (Postgres/SQLite)
│   │   ├── models/
│   │   │   ├── index.js                   ← Asociaciones entre modelos
│   │   │   ├── User.js                    ← Usuario del sistema
│   │   │   ├── Client.js                  ← Cliente de Hidrobombas
│   │   │   ├── Equipment.js               ← Equipo (bomba, motor, etc.)
│   │   │   ├── ServiceReport.js           ← Reporte de mantenimiento
│   │   │   └── PasswordResetToken.js      ← Token de recuperación de contraseña
│   │   ├── controllers/
│   │   │   ├── authController.js          ← Login, registro, perfil
│   │   │   ├── passwordController.js      ← Forgot/reset password
│   │   │   ├── clientController.js        ← CRUD clientes
│   │   │   ├── equipmentController.js     ← CRUD equipos
│   │   │   ├── serviceReportController.js ← CRUD reportes + auto-numeración
│   │   │   ├── userController.js          ← Gestión de usuarios (admin)
│   │   │   ├── dashboardController.js     ← Métricas del dashboard
│   │   │   └── pdfController.js           ← Generación de PDF
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clientRoutes.js
│   │   │   ├── equipmentRoutes.js
│   │   │   ├── serviceReportRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js          ← Verificación JWT
│   │   │   ├── errorHandler.js            ← Manejador global de errores
│   │   │   └── zodMiddleware.js           ← Validación de esquemas Zod
│   │   ├── services/
│   │   │   └── pdfService.js              ← Generación de PDF con PDFKit
│   │   ├── validators/
│   │   │   └── authValidators.js          ← Esquemas Zod para auth
│   │   └── utils/
│   │       └── jwt.js                     ← Helpers de generación de tokens
│   ├── __tests__/                         ← Tests de integración E2E
│   │   └── health.test.js
│   ├── jest.config.js
│   ├── jest.setupEnv.js
│   ├── .env.example                       ← Plantilla de variables de entorno
│   ├── seed-dummy-data.js                 ← Poblado completo de la BD
│   ├── bootstrap-admin.js                 ← Creación interactiva de admin
│   └── package.json
│
└── frontend/                              ← SPA React
    ├── index.html                         ← Punto de entrada HTML (Vite)
    ├── vite.config.js                     ← Config Vite + Vitest + alias @/
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── eslint.config.js
    ├── src/
    │   ├── index.jsx                      ← Punto de entrada React
    │   ├── App.jsx                        ← Router principal
    │   ├── components/
    │   │   ├── Login.jsx                  ← Pantalla de inicio de sesión
    │   │   ├── Dashboard.jsx              ← Vista principal post-login
    │   │   ├── Navigation.jsx             ← Barra de navegación
    │   │   ├── ClientList.jsx             ← Gestión de clientes
    │   │   ├── EquipmentList.jsx          ← Catálogo de equipos
    │   │   ├── ServiceReports.jsx         ← Historial de reportes
    │   │   ├── UserManagement.jsx         ← Admin de usuarios
    │   │   ├── OfflineBanner.jsx          ← Indicador de modo offline
    │   │   ├── ServiceWizard/
    │   │   │   ├── ServiceWizard.jsx      ← Shell del wizard multi-paso
    │   │   │   ├── WizardContext.jsx      ← Estado global del formulario
    │   │   │   └── steps/                 ← 13 pasos del reporte técnico
    │   │   │       ├── Step0General.jsx
    │   │   │       ├── Step1VoltajeRed.jsx
    │   │   │       ├── Step2NivelAgua.jsx
    │   │   │       ├── Step3SupervisorVoltaje.jsx
    │   │   │       ├── Step4InterruptorFlotante.jsx
    │   │   │       ├── Step5ConsumoEnergia.jsx
    │   │   │       ├── Step6Contactores.jsx
    │   │   │       ├── Step7Termicos.jsx
    │   │   │       ├── Step8Temperaturas.jsx
    │   │   │       ├── Step9BreakersReles.jsx
    │   │   │       ├── Step10PresionesValvulas.jsx
    │   │   │       ├── Step11CiclosRuido.jsx
    │   │   │       └── Step12ObservacionesFirma.jsx
    │   │   ├── auth/                      ← Componentes de protección de rutas
    │   │   └── ui/                        ← Componentes Radix UI / shadcn
    │   ├── hooks/
    │   │   ├── useNetworkStatus.jsx       ← Detecta online/offline
    │   │   ├── useOfflineQueue.jsx        ← Cola de reportes pendientes (IndexedDB)
    │   │   └── use-toast.jsx             ← Notificaciones toast
    │   ├── lib/
    │   │   └── utils.jsx                  ← Helper clsx/tailwind-merge
    │   └── __tests__/                     ← Tests unitarios (Vitest)
    │       ├── components/
    │       │   ├── Login.test.jsx
    │       │   └── ServiceWizard.test.jsx
    │       └── hooks/
    │           ├── useNetworkStatus.test.js
    │           └── useOfflineQueue.test.js
    └── package.json
```

---

## 🛠️ Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 20+ | Runtime |
| Express | ^5.1.0 | Framework HTTP |
| Sequelize | ^6.37 | ORM |
| PostgreSQL / SQLite | — | Base de datos |
| JSON Web Tokens | ^9.0 | Autenticación |
| bcryptjs | ^3.0 | Hash de contraseñas |
| Zod | ^4.3 | Validación de esquemas |
| Helmet | ^8.1 | Headers de seguridad HTTP |
| Morgan | ^1.10 | Logging de requests |
| PDFKit | ^0.18 | Generación de PDFs |
| Nodemon | ^3.1 | Hot reload en desarrollo |
| Jest | ^29.7 | Testing |
| Supertest | ^7.0 | Tests de integración HTTP |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | ^19.0 | Framework UI |
| Vite | ^6.4 | Bundler y dev server |
| React Router DOM | ^7.5 | Enrutamiento SPA |
| TailwindCSS | ^3.4 | Estilos utility-first |
| Radix UI | múltiples | Componentes accesibles headless |
| React Hook Form | ^7.63 | Manejo de formularios |
| Zod | ^4.1 | Validación frontend |
| Axios | ^1.8 | Cliente HTTP |
| Sonner | ^2.0 | Notificaciones toast |
| idb-keyval | ^6.2 | Persistencia IndexedDB (offline) |
| lucide-react | ^0.544 | Íconos |
| Vitest | ^3.2 | Testing unitario |
| Testing Library | ^16.3 | Utilidades de tests React |

---

## ✅ Requisitos previos

Asegúrate de tener instalado:

- **Node.js** v20 o superior → [nodejs.org](https://nodejs.org)
- **npm** v9 o superior (viene con Node.js)
- **Git**
- (Opcional) Una base de datos **PostgreSQL** — el sistema puede correr con SQLite sin configuración adicional

---

## ⚙️ Configuración e instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/ROMEROLUIS15/cmms-hidrobombas-merida.git
cd cmms-hidrobombas-merida
```

### 2. Instalar dependencias

Desde la raíz del monorepo, instala todo con un solo comando:

```bash
npm run install:all
```

Esto instala las dependencias de la raíz, el backend y el frontend en secuencia.

### 3. Configurar variables de entorno del Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus valores. Ver la sección [Variables de entorno](#-variables-de-entorno) para más detalles.

### 4. Poblar la base de datos (primera vez)

```bash
cd backend
npm run seed:dummy
```

Esto crea el esquema de tablas y carga datos de prueba incluyendo 3 usuarios, 3 clientes, 8 equipos y 5 reportes de servicio.

---

## 🔑 Variables de entorno

Crea el archivo `backend/.env` basándote en `backend/.env.example`:

```env
# ── Servidor ──────────────────────────────────────────────
PORT=8001
NODE_ENV=development

# ── Base de Datos ──────────────────────────────────────────
# Opción A: PostgreSQL (producción / Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Opción B: SQLite (desarrollo local, no se necesita DATABASE_URL)
DB_STORAGE=./database.sqlite

# ── Autenticación ──────────────────────────────────────────
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# ── CORS ───────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5000

# ── Datos de Seed (para npm run seed:dummy) ────────────────
SEED_ADMIN_NAME="Luis Romero"
SEED_ADMIN_EMAIL=admin@hidrobombasmerida.com
SEED_ADMIN_PASSWORD=tu_password_aqui

SEED_TECH_NAME="Carlos Pérez"
SEED_TECH_EMAIL=tecnico@hidrobombasmerida.com
SEED_TECH_PASSWORD=tu_password_aqui
```

> **Nota:** Si `DATABASE_URL` está presente, el sistema usa PostgreSQL. Si no está, usa SQLite automáticamente. Esto permite trabajar en local sin instalar Postgres.

---

## 🚀 Cómo correr el proyecto

### Desarrollo (backend + frontend simultáneo)

Desde la raíz del monorepo:

```bash
npm run dev
```

Esto levanta ambos servidores en paralelo con `concurrently`:
- **Frontend:** `http://localhost:5000`
- **Backend API:** `http://localhost:8001/api`

### Solo el backend

```bash
npm run dev:backend
# o desde la carpeta backend:
cd backend && npm run dev
```

### Solo el frontend

```bash
npm run dev:frontend
# o desde la carpeta frontend:
cd frontend && npm start
```

### Crear un administrador inicial (forma interactiva)

Si no quieres usar el seed completo:

```bash
cd backend
node bootstrap-admin.js
```

---

## 🗄️ Base de datos

### Modelos / Entidades

```
User ──────┐
           ├── ServiceReport
Equipment ─┘
    │
    └── Client
```

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `User` | `users` | Técnicos y administradores del sistema |
| `Client` | `clients` | Clientes empresa de Hidrobombas |
| `Equipment` | `equipment` | Equipos instalados en los clientes |
| `ServiceReport` | `service_reports` | Reportes de mantenimiento |
| `PasswordResetToken` | `password_reset_tokens` | Tokens temporales de recuperación |

### Estrategia dual (Postgres + SQLite)

El sistema detecta automáticamente qué base de datos usar:

```
Si DATABASE_URL está definida → PostgreSQL (Neon/producción)
Si no                         → SQLite (archivo local, desarrollo)
```

### Scripts de base de datos

```bash
# Poblar BD con datos completos de prueba (borra y recrea todo)
npm run seed:dummy

# Crear un usuario administrador de forma interactiva
node bootstrap-admin.js
```

---

## 📡 API REST — Endpoints

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/login` | Iniciar sesión | ❌ |
| `POST` | `/api/auth/register` | Registrar usuario | ❌ |
| `GET` | `/api/auth/profile` | Perfil del usuario actual | ✅ |
| `POST` | `/api/auth/forgot-password` | Solicitar recuperación de contraseña | ❌ |
| `GET` | `/api/auth/validate-token/:token` | Validar token de reset | ❌ |
| `POST` | `/api/auth/reset-password` | Cambiar contraseña con token | ❌ |

### Clientes — `/api/clients`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/clients` | Listar todos los clientes | ✅ |
| `POST` | `/api/clients` | Crear cliente | ✅ |
| `GET` | `/api/clients/:id` | Obtener cliente por ID | ✅ |
| `PUT` | `/api/clients/:id` | Actualizar cliente | ✅ |
| `DELETE` | `/api/clients/:id` | Eliminar cliente | ✅ |

### Equipos — `/api/equipment`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/equipment` | Listar equipos | ✅ |
| `POST` | `/api/equipment` | Crear equipo | ✅ |
| `GET` | `/api/equipment/:id` | Obtener equipo por ID | ✅ |
| `PUT` | `/api/equipment/:id` | Actualizar equipo | ✅ |
| `DELETE` | `/api/equipment/:id` | Eliminar equipo | ✅ |

### Reportes de Servicio — `/api/service-reports`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/service-reports` | Listar reportes | ✅ |
| `POST` | `/api/service-reports` | Crear reporte (auto-numeración) | ✅ |
| `GET` | `/api/service-reports/:id` | Obtener reporte por ID | ✅ |
| `PUT` | `/api/service-reports/:id` | Actualizar reporte | ✅ |
| `DELETE` | `/api/service-reports/:id` | Eliminar reporte | ✅ |
| `GET` | `/api/service-reports/:id/pdf` | Generar PDF del reporte | ✅ |

### Usuarios — `/api/users`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/users` | Listar usuarios | ✅ Admin |
| `PUT` | `/api/users/:id` | Actualizar usuario | ✅ Admin |
| `DELETE` | `/api/users/:id` | Eliminar usuario | ✅ Admin |

### Dashboard — `/api/dashboard`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/dashboard` | Métricas y estadísticas | ✅ |

### Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Estado general de la API |
| `GET` | `/api/health` | Health check para monitoreo |

---

## 🧪 Testing

### Correr todos los tests

```bash
# Frontend (Vitest)
cd frontend
npm run test:run

# Backend (Jest)
cd backend
npm test
```

### Cobertura de tests

```bash
# Frontend
cd frontend
npx vitest run --coverage

# Backend
cd backend
npm run test:coverage
```

### Estado actual de los tests

| Suite | Tests | Framework |
|-------|-------|-----------|
| Frontend — Componentes y Hooks | 43 | Vitest + Testing Library |
| Backend — Unitarios (modelos, controllers, utils) | 90+ | Jest |
| Backend — Integración (rutas HTTP) | 70+ | Jest + Supertest |
| **Total** | **203** | |

### Arquitectura de tests del Backend

Los tests de integración del backend se ejecutan contra una base de datos **SQLite en memoria** para:
- Aislamiento total (no afectan la BD de producción)
- Velocidad máxima (sin I/O de red)
- Reproducibilidad en cualquier entorno

---

## 🌐 Despliegue

### Frontend → Vercel

El frontend puede desplegarse directamente en Vercel apuntando a la carpeta `frontend/`:

```bash
# Comando de build
cd frontend && npm run build
# Output: frontend/build/
```

### Backend → Vercel (Serverless) o cualquier VPS

El backend detecta automáticamente el entorno Vercel via `process.env.VERCEL` y ajusta su comportamiento.

Configura las siguientes variables de entorno en tu plataforma de despliegue:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production
```

---

## 🔒 Roles y permisos

| Rol | Descripción | Permisos |
|-----|-------------|---------|
| `admin` | Administrador del sistema | Acceso total. Gestión de usuarios, clientes, equipos y reportes. |
| `supervisor` | Supervisor de técnicos | Lectura de todos los reportes. Puede actualizar, no eliminar. |
| `technician` | Técnico de campo | Crear y editar sus propios reportes. Ver clientes y equipos asignados. |
| `client` | Usuario cliente (futuro) | Solo lectura de reportes de sus equipos. |

---

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nombre-de-la-feature`
3. Realiza tus cambios y asegúrate de que los tests pasen: `npm test`
4. Haz commit siguiendo [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: agregar X funcionalidad"`
5. Abre un Pull Request contra `develop`

---

## 📄 Licencia

**CMMS Hidrobombas Mérida** — Sistema de uso interno. © 2026 Hidrobombas Mérida. Todos los derechos reservados.
