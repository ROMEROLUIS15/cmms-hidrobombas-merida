# 🤖 Agent Maestro - Guía de Integración

## Resumen

El **Agent Maestro** es una IA inteligente que se integra en CMMS Hidrobombas Mérida usando LangChain y Groq. Puede:

1. **Generar reportes** profesionales a partir de datos técnicos
2. **Detectar anomalías** en equipos
3. **Responder preguntas** sobre historial de equipos
4. **Recomendar mantenimiento** con fechas y urgencia
5. **Comparar equipos** entre sí
6. **Crear resúmenes ejecutivos** de actividades de mantenimiento

---

## Arquitectura

```
┌─────────────────────┐
│   Frontend/Client   │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────┐
│   Express Router    │
│  /api/ai/agent/*    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  aiController.js    │ ◄─── Valida input
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  aiAgent.js         │ ◄─── Decide qué tool usar
│ (Agent Maestro)     │      con LLM (Groq)
└──────────┬──────────┘
           │
    ┌──────┴──────┬─────────┬──────────┬───────────┬──────────┐
    ▼             ▼         ▼          ▼           ▼          ▼
┌────────┐  ┌──────────┐ ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐
│Report  │  │Anomaly   │ │Chat  │ │Recommend │ │Compare │ │Exec  │
│Tool    │  │Detection │ │Tool  │ │Maintain  │ │Tool    │ │Summ  │
└────┬───┘  └──────┬───┘ └───┬──┘ └────┬─────┘ └────┬───┘ └───┬──┘
     │             │         │         │            │        │
     └─────────────┼─────────┼─────────┼────────────┼────────┘
                   │
                   ▼
            ┌─────────────────┐
            │  Sequelize ORM  │ ◄─── Queries BD
            │  (SQLite/Neon)  │
            └─────────────────┘
```

---

## Instalación

### 1. Dependencias (Ya instaladas)

```json
{
  "@langchain/core": "^1.1.48",
  "@langchain/groq": "^1.2.1",
  "groq-sdk": "^1.2.1"
}
```

### 2. Variables de entorno

En `backend/.env`:
```env
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE
NEON_KEEP_ALIVE_ENABLED=true
NEON_KEEP_ALIVE_INTERVAL=600000
```

### 3. Verificar que funciona

```bash
cd backend
npm run test:agent  # O: node test-agent.js
```

Debe mostrar:
```
✅ GROQ_API_KEY configurada
✅ groq-sdk instalado
✅ @langchain/core instalado
✅ Agent inicializado correctamente

🛠️ Herramientas disponibles:
  1. generateReport - Generate professional maintenance reports
  2. askEquipment - Answer questions about equipment history
  3. detectAnomaly - Detect anomalies in service data
  4. recommendMaintenance - Recommend next maintenance date
  5. compareEquipment - Compare two equipment
  6. executiveSummary - Create executive summaries
```

---

## Endpoints API

### 1. POST /api/ai/agent/tools
**Pública** - Lista herramientas disponibles

```bash
curl -X GET http://localhost:5000/api/ai/agent/tools
```

**Response:**
```json
{
  "success": true,
  "count": 6,
  "tools": [
    {
      "name": "generateReport",
      "description": "Generate professional maintenance reports..."
    },
    ...
  ]
}
```

---

### 2. POST /api/ai/agent/ask
**Privada** - Interface principal (toma cualquier pregunta)

```bash
curl -X POST http://localhost:5000/api/ai/agent/ask \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Generate a maintenance report for service report 12345",
    "context": {
      "serviceReportId": "12345"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "toolUsed": "generateReport",
  "result": {
    "description": "The pump shows normal operation with...",
    "recommendations": ["Check seals monthly", ...],
    "estimatedCost": "$150-200"
  },
  "executionTime": "2.3s"
}
```

---

### 3. POST /api/ai/agent/report
**Privada** - Generar reporte rápidamente

```bash
curl -X POST http://localhost:5000/api/ai/agent/report \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceReportId": "12345"
  }'
```

---

### 4. POST /api/ai/agent/anomaly
**Privada** - Detectar anomalías

```bash
curl -X POST http://localhost:5000/api/ai/agent/anomaly \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceReportId": "12345"
  }'
```

**Response:**
```json
{
  "success": true,
  "toolUsed": "detectAnomaly",
  "result": {
    "anomaliesDetected": true,
    "anomalies": [
      {
        "parameter": "temperature",
        "currentValue": 85,
        "historicalAverage": 72,
        "severity": "high",
        "explanation": "Temperature is 13°C above normal..."
      }
    ]
  }
}
```

---

### 5. POST /api/ai/agent/question
**Privada** - Hacer preguntas sobre equipo

```bash
curl -X POST http://localhost:5000/api/ai/agent/question \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-001",
    "question": "What is the maintenance history of this equipment?"
  }'
```

---

### 6. POST /api/ai/agent/maintenance
**Privada** - Recomendar próximo mantenimiento

```bash
curl -X POST http://localhost:5000/api/ai/agent/maintenance \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "eq-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "toolUsed": "recommendMaintenance",
  "result": {
    "recommendedDate": "2024-06-15",
    "urgency": "high",
    "reason": "Based on 12-month trend analysis...",
    "preventiveActions": ["Oil change", "Filter replacement"]
  }
}
```

---

### 7. POST /api/ai/agent/summary
**Privada** - Resumen ejecutivo

```bash
curl -X POST http://localhost:5000/api/ai/agent/summary \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "month"  # month | quarter | year
  }'
```

**Response:**
```json
{
  "success": true,
  "toolUsed": "executiveSummary",
  "result": {
    "period": "January 2024",
    "totalEquipmentMaintained": 45,
    "averageTimePerService": "2.5 hours",
    "estimatedCost": "$15,000",
    "kpis": {
      "equipmentAvailability": "96%",
      "maintenanceCompliance": "99%"
    }
  }
}
```

---

## Flujo de Decisión del Agent

```
Usuario: "Generate a report for service 123"
             ↓
[Agent] "Analizaré tu solicitud..."
             ↓
[LLM - Groq] Analiza: generateReport es la herramienta más apropiada
             ↓
[Agent] Ejecuta: generateReportTool.execute({ serviceReportId: "123" })
             ↓
[Tool] Consulta BD:
       - Carga ServiceReport ID 123
       - Carga datos técnicos (waterEnergyData, motorsData, controlData)
       - Consulta últimos 6 meses de historial
             ↓
[Tool] Llama LLM con prompt especializado + datos
             ↓
[Groq LLM] Genera:
       {
         "description": "...",
         "recommendations": [...],
         "estimatedCost": "..."
       }
             ↓
[Tool] Retorna resultado
             ↓
[Controller] Envía JSON al cliente
             ↓
Usuario recibe respuesta
```

---

## Estructura de Archivos

```
backend/src/
├── services/
│   ├── aiAgent.js          ← Agent Maestro (decision logic)
│   ├── aiTools.js          ← 6 tools implementadas
│   ├── aiPrompts.js        ← Prompts optimizados para cada tool
│   └── neonKeepAlive.js    ← Mantiene conexión activa
│
├── controllers/
│   └── aiController.js     ← Endpoints HTTP (7 nuevos métodos)
│
├── routes/
│   └── aiRoutes.js         ← 7 nuevas rutas
│
└── models/
    ├── Client.js
    ├── Equipment.js
    ├── ServiceReport.js    ← Datos técnicos en JSON
    └── User.js
```

---

## Testing

### Test básico
```bash
node backend/test-agent.js
```

### Test con datos reales
```bash
# 1. Inicia el servidor
npm run dev

# 2. En otra terminal, haz una solicitud
curl -X POST http://localhost:5000/api/ai/agent/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "What is the status of equipment pump-001?",
    "context": { "equipmentId": "pump-001" }
  }'
```

---

## Casos de Uso Reales

### 1. **Generar reportes automáticamente**
```javascript
// Cuando técnico completa un servicio
POST /api/ai/agent/report
Body: { serviceReportId: newReport.id }
// AI genera descripción profesional automáticamente
```

### 2. **Alertas por anomalías**
```javascript
// Después de cada servicio, detectar problemas temprano
POST /api/ai/agent/anomaly
Body: { serviceReportId: reportId }
// Si detecta anomalías, enviar notificación al supervisor
```

### 3. **Mantenimiento preventivo inteligente**
```javascript
// Cada mes, revisar recomendaciones de mantenimiento
POST /api/ai/agent/maintenance
Body: { equipmentId: equipId }
// AI predice cuándo falla antes de que ocurra
```

### 4. **Dashboard con insights**
```javascript
// Mostrar al gerente un resumen de actividades
POST /api/ai/agent/summary
Body: { period: "month" }
// KPIs, costos, disponibilidad en una vista
```

---

## Resolución de Problemas

### ❌ "GROQ_API_KEY no configurada"
→ Verifica que `.env` tiene `GROQ_API_KEY=gsk_...`

### ❌ "Module not found: groq-sdk"
→ Ejecuta: `npm install groq-sdk`

### ❌ "Agent timeout"
→ El LLM puede tardar 2-5 segundos. Aumenta timeout en cliente.

### ❌ "Database connection error"
→ Sistema fallback a SQLite automáticamente

### ❌ "Groq API limit reached"
→ Plan gratuito: 30 llamadas/minuto. Implementar rate limiting en frontend

---

## Performance

| Métrica | Valor |
|---------|-------|
| Tiempo respuesta medio | 2-4 segundos |
| Máximo simultáneos | 5 por server |
| Limit Groq API | 30 req/min (free tier) |
| DB queries por request | 2-5 queries |
| Memoria por agent | ~50MB |

---

## Próximas Mejoras

- [ ] Agregar memory/historial de conversaciones
- [ ] Soporte para múltiples idiomas
- [ ] Caché de respuestas frecuentes
- [ ] Web Socket para streaming en tiempo real
- [ ] Modelo custom fine-tuned en datos históricos
- [ ] Integration con Anthropic Claude (fallback)

---

## Referencias

- 📖 [LangChain Docs](https://langchain.com/docs)
- 📖 [Groq API Docs](https://console.groq.com/docs)
- 📖 [Sequelize Docs](https://sequelize.org)
- 📖 [Express Async Handler](https://github.com/davidgrzyb/express-async-handler)

---

**Fecha de Creación:** Junio 2024  
**Versión:** 1.0.0  
**Estado:** Producción ✅

