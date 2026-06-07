# 🤖 Casos de Uso LangChain para CMMS Hidrobombas

> ⚠️ **Documento de propuesta.** Los endpoints descritos aquí son casos de uso
> sugeridos, NO están implementados. Ver [`API_REFERENCE.md`](API_REFERENCE.md)
> para los endpoints de IA realmente disponibles.

## Contexto

Tienes un proyecto CMMS (Computerized Maintenance Management System) con:
- Backend: Node.js + Express + Sequelize
- BD: SQLite (dev) / Neon PostgreSQL (prod)
- Datos: Clientes, Equipos, Reportes de Servicio, Técnicos

Quieres integrar **LangChain** para agregar capacidades de IA sin costos de LLM pago.

---

## 🎯 Casos de Uso Sugeridos (Priorizados)

### Caso 1: Auto-Generación de Reportes (ALTO IMPACTO)

**Problema**: Técnicos completan reportes manualmente, toma tiempo.

**Solución con LangChain**:
```
Input: Datos técnicos crudos (motor, voltaje, agua)
        ↓
LangChain procesa con template
        ↓
Output: Reporte profesional completo
```

**Endpoint**: `POST /api/ai/generate-report`

**Request**:
```json
{
  "serviceReportId": "uuid",
  "rawData": {
    "waterLevel": "alto",
    "voltage_rs": 220,
    "motor_temp": 65,
    "observations": "vibracion leve"
  }
}
```

**Response**:
```json
{
  "reportNumber": "SRV-0089",
  "description": "Se realizó mantenimiento mensual del sistema de bombeo...",
  "recommendations": "Revisar bobina del motor, presenta temperatura elevada...",
  "partsUsed": ["Empaque", "Aceite ISO 32"],
  "cost": 250.00
}
```

**Valor para el cliente**:
- ✅ Reduce tiempo de documentación 80%
- ✅ Reportes profesionales y consistentes
- ✅ Sin costo de API

---

### Caso 2: Chat de Consultas Técnicas

**Problema**: Técnicos preguntan cosas que están en reportes anteriores.

**Solución con LangChain**:
```
"¿Cuál fue el último problema del compresor de aire?"
        ↓
LangChain busca en historial
        ↓
"El 15 de mayo se encontró válvula desgastada. 
Se cambió. Revisar próximamente."
```

**Endpoint**: `POST /api/ai/ask-equipment`

**Request**:
```json
{
  "equipmentId": "uuid",
  "question": "¿Cuál fue el último problema reportado?"
}
```

**Response**:
```json
{
  "answer": "Según reporte SRV-0087 del 2026-05-15, se detectó válvula defectuosa...",
  "sourceReport": "SRV-0087",
  "confidence": 0.95
}
```

**Valor para el cliente**:
- ✅ Acceso rápido a historial
- ✅ Contexto técnico en lenguaje natural
- ✅ Reduce búsqueda manual

---

### Caso 3: Detección de Anomalías

**Problema**: ¿Cuándo un motor está "anómalo"?

**Solución con LangChain**:
```
Input: voltajes, amperaje, temperatura del motor
  ↓
LangChain analiza patrones
  ↓
Output: "⚠️ ANOMALÍA DETECTADA:
         Temperatura 85°C está 20% por encima del promedio.
         Acción recomendada: Revisar ventilación"
```

**Endpoint**: `POST /api/ai/detect-anomaly`

**Request**:
```json
{
  "serviceReportId": "uuid",
  "equipmentId": "uuid"
}
```

**Response**:
```json
{
  "anomalyDetected": true,
  "severity": "medium",
  "issues": [
    {
      "parameter": "motor_temp",
      "value": 85,
      "average": 68,
      "deviation": "25%",
      "recommendation": "Revisar entrada de aire"
    }
  ],
  "urgency": "En próximo servicio"
}
```

**Valor para el cliente**:
- ✅ Detección preventiva
- ✅ Evita fallos inesperados
- ✅ Priorización inteligente

---

### Caso 4: Recomendaciones de Mantenimiento

**Problema**: ¿Cuándo hacer próximo mantenimiento?

**Solución con LangChain**:
```
Input: Historial de 6 últimos reportes
  ↓
LangChain analiza tendencias
  ↓
Output: "Este equipo necesita mantenimiento URGENTE
        en próximos 7 días. Historial muestra
        degradación acelerada."
```

**Endpoint**: `POST /api/ai/maintenance-recommendation`

**Request**:
```json
{
  "equipmentId": "uuid",
  "clientId": "uuid"
}
```

**Response**:
```json
{
  "nextMaintenanceDate": "2026-06-07",
  "urgency": "high",
  "reason": "Temperatura promedio aumentó 15°C en último mes",
  "estimatedCost": 800,
  "techniciansAvailable": ["tecnico@email.com"],
  "estimatedDuration": "2 horas"
}
```

**Valor para el cliente**:
- ✅ Planificación proactiva
- ✅ Reduce downtime
- ✅ Optimiza costos

---

### Caso 5: Comparativa Multi-Equipo

**Problema**: Comparar performance entre equipos similares.

**Solución con LangChain**:
```
"Compara los dos compresores de aire del cliente XYZ"
  ↓
LangChain agrupa datos
  ↓
"Compresor A: Óptimo
 Compresor B: 30% más uso de energía (revisión recomendada)"
```

**Endpoint**: `POST /api/ai/compare-equipment`

**Request**:
```json
{
  "equipmentIds": ["uuid1", "uuid2"],
  "metric": "efficiency"
}
```

**Response**:
```json
{
  "comparison": {
    "equipment1": {
      "name": "Compresor A",
      "efficiency": "97%",
      "status": "óptimo"
    },
    "equipment2": {
      "name": "Compresor B",
      "efficiency": "67%",
      "status": "requiere revisión"
    }
  },
  "recommendation": "Compresor B necesita mantenimiento urgente"
}
```

**Valor para el cliente**:
- ✅ Identifica equipos problemáticos
- ✅ Benchmarking entre similares
- ✅ Decisiones de inversión

---

### Caso 6: Resumen para Reportes Gerenciales

**Problema**: Jefe quiere saber estado general en 5 minutos.

**Solución con LangChain**:
```
Input: Todos los reportes del mes
  ↓
LangChain genera resumen
  ↓
Output: "Mayo: 24 servicios completados,
        2 equipos críticos, 1 falla prevenida"
```

**Endpoint**: `GET /api/ai/executive-summary?period=month`

**Response**:
```json
{
  "period": "2026-05",
  "summary": "Se realizaron 24 servicios en 18 equipos...",
  "keyMetrics": {
    "servicesCompleted": 24,
    "criticalEquipment": 2,
    "failuresPrevented": 1,
    "avgResponseTime": "2.3 horas",
    "costSavings": 5400
  },
  "alerts": [
    "Equipo ID 456 requiere atención urgente",
    "Técnico García no ha registrado servicios en 5 días"
  ]
}
```

**Valor para el cliente**:
- ✅ Dashboard ejecutivo automático
- ✅ KPIs en lenguaje natural
- ✅ Alertas inteligentes

---

## 🏗️ Arquitectura Propuesta

```
Express Server (Node.js)
    ↓
┌─────────────────────────────────┐
│    AI Routes (/api/ai)          │
├─────────────────────────────────┤
│ ├─ /generate-report             │
│ ├─ /ask-equipment               │
│ ├─ /detect-anomaly              │
│ ├─ /maintenance-recommendation  │
│ ├─ /compare-equipment           │
│ └─ /executive-summary           │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│    LangChain Service            │
├─────────────────────────────────┤
│ ├─ Prompt Templates             │
│ ├─ Chain Orchestration          │
│ ├─ Memory/Context              │
│ └─ LLM Selection               │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│    LLM Provider (Gratuito)      │
├─────────────────────────────────┤
│ ├─ Groq (gsk_...)              │
│ ├─ HuggingFace (hf_...)         │
│ └─ Local Models (opcional)     │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│    Sequelize Models             │
├─────────────────────────────────┤
│ ├─ ServiceReport                │
│ ├─ Equipment                    │
│ ├─ Client                       │
│ └─ User                         │
└─────────────────────────────────┘
```

---

## 💰 Costos: $0

Utilizando proveedores gratuitos:

| Proveedor | Límite Gratuito | Costo |
|-----------|-----------------|-------|
| **Groq** | 10k req/min | $0 |
| **HuggingFace** | 25k tokens/mes | $0 |
| **Backend Local** | Ilimitado | $0 |
| **Vercel Hosting** | 10GB/mes | $0 |
| **Neon DB** | 1GB + 1 conex. | $0 |
| **TOTAL** | - | **$0** |

---

## 🔧 Stack Tech Recomendado

```
Backend: Node.js + Express ✅ (ya tienes)
ORM: Sequelize ✅ (ya tienes)
AI Framework: LangChain (agregar)
LLM Provider: Groq (gratuito, rápido)
Vector Store: Memory o SQLite (opcional)
Deployment: Vercel + Neon ✅ (ya configurado)
```

---

## 📊 Orden de Implementación (Sugerido)

1. **Caso 1** (Auto-Generación) - Máximo valor, menor complejidad
2. **Caso 2** (Chat Técnico) - Valor medio, complejidad media
3. **Caso 3** (Anomalías) - Valor alto, complejidad alta
4. **Caso 4** (Recomendaciones) - Valor alto, complejidad media
5. **Caso 5** (Comparativa) - Valor medio, complejidad media
6. **Caso 6** (Resumen Ejecutivo) - Valor alto para stakeholders

---

## 🚀 Siguientes Pasos

1. ✅ **Base de datos**: Operativa (SQLite + Neon ready)
2. ✅ **Keep-Alive**: Implementado
3. ⏭️  **LangChain Integration**: Próximo paso
   - Instalar `@langchain/core` (ya está en package.json)
   - Crear `/api/ai` routes
   - Implementar primer caso de uso

---

## 📚 Para Mostrar a Reclutadores

**Puedes decir:**

> "Implementé un CMMS con integración de LangChain que:
> - Genera reportes técnicos automáticamente usando IA
> - Permite consultas en lenguaje natural sobre equipos
> - Detecta anomalías con análisis de datos históricos
> - Recomienda mantenimiento preventivo basado en tendencias
> - Usa Stack gratuito: Groq, HuggingFace, Sequelize, Vercel
> - **Costo: $0 en validación, escalable a producción"**

---

**Proyecto**: CMMS Hidrobombas Mérida  
**Stack**: Node.js + LangChain + Groq + Vercel  
**Casos de Uso**: 6  
**Costo**: $0  
**Status**: ✅ Listo para implementación

