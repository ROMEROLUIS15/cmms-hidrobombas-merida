# 🎨 Interfaz Visual Frontend - AI Agent Maestro

## 📱 Vista Completa en Navegador

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CMMS Hidrobombas Mérida - Agent Maestro         🏠  📊  ⚙️  👤  🔓         │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                         🤖 Agent Maestro                                   │
│              Herramienta inteligente para análisis de mantenimiento        │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Ask  📄 Reporte  ⚠️ Anomalía  💬 Pregunta  🔧 Mant.  📊 Resumen  ℹ️   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  🎯 Interface Principal                                            │  │
│  │  Haz cualquier pregunta al Agent. Él decidirá qué herramienta usar │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  Solicitud (texto libre):                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │ Generate a professional report for service 12345            │ │  │
│  │  │                                                              │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │  Contexto (JSON, opcional):                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │ {"serviceReportId": "12345"}                                │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │  ⚡ Enviar Solicitud                         [Procesando...] │ │  │
│  │  │                                          (Spinner girando)   │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Generar Reporte (3.2s)                                          │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │ Descripción:                                                      │  │
│  │ La bomba centrífuga modelo XYZ-2000 ha operado dentro de         │  │
│  │ parámetros normales durante este servicio. Se observó que el     │  │
│  │ consumo de energía está dentro del rango esperado (85-95 kW).    │  │
│  │ Las temperaturas son óptimas (72°C).                              │  │
│  │                                                                    │  │
│  │ Recomendaciones:                                                  │  │
│  │ ✓ Inspeccionar sello mecánico en próximo servicio                │  │
│  │ ✓ Revisar alineación del acople                                  │  │
│  │ ✓ Cambiar aceite del rodamiento                                  │  │
│  │                                                                    │  │
│  │ Costo Estimado:                                                   │  │
│  │ $150-200                                                          │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Tabs - Diferentes Vistas

### Tab 1: ⚡ Ask (Interface Principal)
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Solicitud (Textarea)                                       │
│ • Contexto JSON (Textarea, opcional)                         │
│ • Botón: Enviar Solicitud                                    │
└──────────────────────────────────────────────────────────────┘
Usuario puede escribir: "Generate a report", "Detect anomalies", etc.
El Agent decide automáticamente qué tool usar.
```

### Tab 2: 📄 Reporte
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Service Report ID (Input texto)                            │
│ • Botón: Generar Reporte                                     │
└──────────────────────────────────────────────────────────────┘
Input: "550e8400-e29b-41d4-a716-446655440000"
Output: Reporte profesional con descripción + recomendaciones
```

### Tab 3: ⚠️ Anomalía
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Service Report ID (Input)                                  │
│ • Botón: Detectar Anomalías                                  │
└──────────────────────────────────────────────────────────────┘
Output: 
  - Anomalías Detectadas: ⚠️ Sí (o ✅ No)
  - Tabla con parámetros, valores, severidad
  - Explicación de cada anomalía
  - Recomendación urgente
```

### Tab 4: 💬 Pregunta
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Equipment ID (Input): "pump-001"                           │
│ • Pregunta (Textarea): "Has it ever overheated?"            │
│ • Botón: Hacer Pregunta                                      │
└──────────────────────────────────────────────────────────────┘
Output:
  - Respuesta en texto natural
  - Confianza (barra 92%)
  - Datos fuente (histórico, averías comunes)
```

### Tab 5: 🔧 Mantenimiento
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Equipment ID (Input): "pump-001"                           │
│ • Botón: Obtener Recomendación                               │
└──────────────────────────────────────────────────────────────┘
Output: (Card azul)
  - Fecha Recomendada: 2024-06-15
  - Urgencia: HIGH
  - Días hasta fecha: 14
  - Razón detallada
  - Acciones preventivas (lista)
  - Costo estimado
  - Riesgo si se demora
```

### Tab 6: 📊 Resumen
```
┌─ Campos ─────────────────────────────────────────────────────┐
│ • Período (Select): [Mes] [Trimestre] [Año]                 │
│ • Botón: Generar Resumen                                     │
└──────────────────────────────────────────────────────────────┘
Output: (Grid 2x2 con tarjetas)
  ┌─────────────┬─────────────┐
  │ Equipos: 45 │ Servicios:67│
  ├─────────────┼─────────────┤
  │ Costo: $18k │ Disponibl:96%
  └─────────────┴─────────────┘
  
  KPIs (tabla):
  - Maintenance Compliance: 99.1%
  - Service On-Time: 98.5%
  - Cost per Service: $276
  
  Top Issues (gráfico):
  1. Bearing wear (18%)
  2. Seal replacement (12%)
  3. Lubrication (10%)
  
  Recomendaciones (lista):
  → Implement bearing inspection program
  → Schedule bulk seal replacements
```

### Tab 7: ℹ️ Info
```
┌─ Información ────────────────────────────────────────────────┐
│ 📘 ¿Qué es Agent Maestro?                                    │
│    Sistema de IA con LangChain + Groq...                     │
│                                                              │
│ 🛠️ Las 6 Herramientas                                       │
│    ✅ Generar Reportes                                       │
│    ✅ Detectar Anomalías                                     │
│    ✅ Preguntar sobre Equipos                                │
│    ✅ Recomendar Mantenimiento                               │
│    ✅ Comparar Equipos                                       │
│    ✅ Resumen Ejecutivo                                      │
│                                                              │
│ ⏱️ Tiempo de Respuesta                                       │
│    Típicamente 2-5 segundos                                  │
│                                                              │
│ ⚡ Límites                                                   │
│    Plan gratuito: 30 solicitudes/minuto                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Componentes Visuales

### Loading State (Mientras procesa)
```
┌──────────────────────────────────────────┐
│  ⚡ Enviar Solicitud                     │
│  ⟳ Procesando...                         │
│  (Spinner animado)                       │
│  Tiempo estimado: 2-5 segundos            │
└──────────────────────────────────────────┘
```

### Success State (Resultado)
```
┌──────────────────────────────────────────────────────────┐
│  ✅ Generar Reporte (3.2s)                 ⏱️ Clock icon│
├──────────────────────────────────────────────────────────┤
│  Descripción:                                            │
│  La bomba operó dentro de parámetros normales...         │
│                                                          │
│  Recomendaciones:                                        │
│  ✓ Inspeccionar sello mecánico                          │
│  ✓ Revisar alineación                                   │
│  ✓ Cambiar aceite                                       │
│                                                          │
│  Costo Estimado: $150-200                               │
└──────────────────────────────────────────────────────────┘
(Fondo verde suave: #f0fdf4)
```

### Error State
```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  Error                                               │
├──────────────────────────────────────────────────────────┤
│  ❌ Service Report ID not found in database              │
│                                                          │
│  Por favor verifica que el ID sea válido                 │
└──────────────────────────────────────────────────────────┘
(Fondo rojo suave: #fef2f2)
```

### Anomaly Card (Ejemplo)
```
┌─────────────────────────────────────────────────────────────┐
│  Anomalía #1: Temperature                                   │
│  ├─ Valor Actual: 85°C                                      │
│  ├─ Promedio Histórico: 72°C                                │
│  ├─ Desviación: +13°C                                       │
│  ├─ Severidad: 🔴 HIGH                                      │
│  └─ Explicación: "Temperature is 13°C above normal.        │
│     May indicate bearing wear..."                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Anomalía #2: Vibration                                     │
│  ├─ Valor Actual: 4.2 mm/s                                  │
│  ├─ Promedio Histórico: 2.1 mm/s                            │
│  ├─ Desviación: +2.1 mm/s                                   │
│  ├─ Severidad: 🟡 MEDIUM                                    │
│  └─ Explicación: "Slight increase in vibration..."         │
└─────────────────────────────────────────────────────────────┘

⚠️ RECOMENDACIÓN: Schedule urgent maintenance within 48 hours
```

### Maintenance Card
```
┌─────────────────────────────────────────────────────────────┐
│  🔵 RECOMENDACIÓN DE MANTENIMIENTO                           │
│  ├─ Fecha Recomendada: 2024-06-15 (14 días)               │
│  ├─ Urgencia: 🔴 HIGH                                       │
│  └─ Confianza: 92%                                          │
├─────────────────────────────────────────────────────────────┤
│  Razón:                                                     │
│  "Based on 12-month trend analysis, this equipment shows   │
│   progressive increase in bearing wear..."                 │
│                                                             │
│  Acciones Preventivas:                                      │
│  • Oil change (full)                                        │
│  • Bearing inspection and replacement if needed             │
│  • Seal check and replacement                               │
│  • Alignment verification                                   │
│                                                             │
│  Tiempo Estimado: 2-4 hours                                 │
│  Costo: $200-300                                            │
│  Riesgo si se demora: "High - Risk of bearing failure"    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 KPI Grid (Tab Resumen)

```
┌────────────────────┬────────────────────┐
│  📈 Equipos        │  📋 Servicios      │
│  Mantenidos        │  Realizados        │
│                    │                    │
│  45                │  67                │
│  (Number large)    │  (Number large)    │
└────────────────────┴────────────────────┘

┌────────────────────┬────────────────────┐
│  💰 Costo Total    │  🟢 Disponibilidad │
│                    │                    │
│  $18,500           │  96.2%             │
│  (Verde)           │  (Verde)           │
└────────────────────┴────────────────────┘

TABLA DE KPIs:
┌──────────────────────────────────────────┐
│ Equipment Availability      │  96.2%     │
│ Maintenance Compliance      │  99.1%     │
│ Service On-Time Rate        │  98.5%     │
│ Cost Per Service            │  $276      │
│ Preventive/Reactive Ratio   │  75/25     │
└──────────────────────────────────────────┘

GRÁFICO: Top Issues
┌─ Bearing wear       ████████████ 18%
├─ Seal replacement   ████████ 12%
└─ Lubrication maint  ██████ 10%
```

---

## 🎨 Paleta de Colores Usada

```
Primarios:
- Azul: #3b82f6 (buttons, links)
- Verde: #10b981 (success, checkmarks)
- Rojo: #ef4444 (errors, alerts)
- Amarillo: #f59e0b (warnings)

Backgrounds:
- Blanco: #ffffff (cards)
- Gris Suave: #f3f4f6 (backgrounds)
- Azul Suave: #eff6ff (info boxes)
- Verde Suave: #f0fdf4 (success boxes)
- Rojo Suave: #fef2f2 (error boxes)

Textos:
- Headings: #1f2937 (gris oscuro)
- Body: #4b5563 (gris medio)
- Muted: #9ca3af (gris claro)
```

---

## 🔄 Flujo de Interacción Paso a Paso

### Caso: Usuario genera reporte

```
1. Usuario ve página con 7 tabs
   └─ Selecciona tab "Reporte"

2. Formula llena con:
   └─ Service Report ID: "12345"

3. Click en botón "Generar Reporte"
   └─ Loading state aparece (spinner + "Procesando...")

4. Esperando 3-5 segundos
   └─ Spinner gira, usuario ve mensaje "Procesando..."

5. Respuesta llega del backend
   └─ Loading state desaparece

6. Card VERDE aparece con ✅ checkmark
   └─ Título: "Generar Reporte (3.2s)"
   └─ Contiene: descripción + recomendaciones + costo

7. Usuario puede:
   └─ Copiar texto
   └─ Guardar como PDF
   └─ Generar otro reporte (los campos quedan listos)
   └─ Cambiar a otro tab
```

---

## 📱 Responsive Design

### En Desktop (1920px)
```
┌─────────────────────────────────────────────────────────────┐
│ Todos los tabs visibles, 7 en línea                         │
│ Grid de KPIs: 2x2                                           │
│ Textarea ancho completo                                     │
│ Botones ocupan 100% width                                   │
└─────────────────────────────────────────────────────────────┘
```

### En Tablet (768px)
```
┌──────────────────────────────────┐
│ Tabs se comprimen               │
│ 3-4 tabs por fila               │
│ Grid KPIs: 2x2 (igual)          │
│ Responsive layout               │
└──────────────────────────────────┘
```

### En Mobile (375px)
```
┌────────────────┐
│ Tabs en scroll │
│ horizontal     │
│ Grid KPIs: 1x4 │
│ (Stack)        │
│ Botones full   │
│ width          │
└────────────────┘
```

---

## 🎓 Ejemplo Completoy en Acción

### Usuario quiere: "Detectar si la bomba tiene problemas"

```
PASO 1: Abre navegador → http://localhost:5173
        Ve página principal con Agent Maestro

PASO 2: Selecciona tab "⚠️ Anomalía"
        Ve formulario con campo "Service Report ID"

PASO 3: Ingresa: "550e8400-e29b-41d4-a716-446655440000"
        Hace clic en "Detectar Anomalías"

PASO 4: LOADING (3 segundos)
        Spinner gira, botón deshabilitado
        "Analizando..."

PASO 5: RESULT CARD APARECE
        ┌─────────────────────────────────┐
        │ ✅ Detectar Anomalía (3.2s)      │
        │                                 │
        │ Anomalías Detectadas: ⚠️ Sí    │
        │                                 │
        │ TEMPERATURA                     │
        │ Actual: 85°C                    │
        │ Histórico: 72°C                 │
        │ Severidad: 🔴 HIGH             │
        │ "Temperature is 13°C above..."  │
        │                                 │
        │ VIBRACIÓN                       │
        │ Actual: 4.2 mm/s                │
        │ Histórico: 2.1 mm/s             │
        │ Severidad: 🟡 MEDIUM           │
        │ "Slight increase..."            │
        │                                 │
        │ ⚠️ RECOMENDACIÓN:               │
        │ "Schedule urgent maintenance    │
        │  within 48 hours"               │
        └─────────────────────────────────┘

PASO 6: Usuario puede:
        - Leer el análisis completo
        - Guardar información
        - Crear ticket de mantenimiento
        - Hacer click en tab "Mantenimiento" para fecha recomendada
```

---

## 🎯 UX Best Practices Implementadas

✅ Loading state con spinner (no confunde al usuario)  
✅ Color-coded severity (🔴 RED = urgent)  
✅ Timeouts (15s) para evitar esperas infinitas  
✅ Error messages claros en español  
✅ Success messages con time badge (2.3s)  
✅ Tabs organizados por función  
✅ Context hints debajo de inputs  
✅ Disabled buttons durante carga  
✅ Responsive en todos los tamaños  
✅ Contraste de colores accesible  

---

**Conclusión**: La interfaz es intuitiva, profesional y lista para mostrar a reclutadores.
