# 🔌 Agent Maestro - API Endpoints Reference

## 📊 Resumen Rápido

| Endpoint | Método | Auth | Función |
|----------|--------|------|---------|
| `/api/ai/agent/tools` | GET | ✅ | Listar 6 herramientas disponibles |
| `/api/ai/agent/ask` | POST | ✅ | Interface principal (cualquier solicitud) |
| `/api/ai/agent/report` | POST | ✅ | Generar reporte profesional |
| `/api/ai/agent/anomaly` | POST | ✅ | Detectar anomalías |
| `/api/ai/agent/question` | POST | ✅ | Hacer preguntas sobre equipo |
| `/api/ai/agent/maintenance` | POST | ✅ | Recomendar próximo mantenimiento |
| `/api/ai/agent/summary` | POST | ✅ | Resumen ejecutivo del período |

---

## 🌐 Endpoint 1: GET /api/ai/agent/tools
**Requiere autenticación** - Lista todas las herramientas disponibles

### Request
```http
GET /api/ai/agent/tools HTTP/1.1
Host: localhost:5000
Authorization: Bearer <JWT>
```

### Response (200 OK)
```json
{
  "success": true,
  "count": 6,
  "tools": [
    {
      "name": "generate_report",
      "description": "Genera un reporte profesional de mantenimiento basado en datos técnicos"
    },
    {
      "name": "ask_equipment",
      "description": "Responde preguntas técnicas sobre equipos basándose en historial"
    },
    {
      "name": "detect_anomaly",
      "description": "Detecta anomalías comparando datos actuales vs histórico"
    },
    {
      "name": "recommend_maintenance",
      "description": "Recomienda próxima fecha de mantenimiento preventivo"
    },
    {
      "name": "compare_equipment",
      "description": "Compara performance entre dos equipos"
    },
    {
      "name": "create_summary",
      "description": "Crea resumen ejecutivo del período"
    }
  ]
}
```

### Ejemplo cURL
```bash
curl -X GET http://localhost:5000/api/ai/agent/tools
```

---

## 🌐 Endpoint 2: POST /api/ai/agent/ask
**Protegida** - Interface principal del Agent (acepta cualquier solicitud natural)

### Request
```http
POST /api/ai/agent/ask HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "request": "Generate a professional maintenance report for service 12345",
  "context": {
    "serviceReportId": "12345"
  }
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "generate_report",
  "result": {
    "description": "El equipo bomba centrífuga modelo XYZ-2000 ha operado dentro de parámetros normales durante este servicio...",
    "recommendations": [
      "Inspeccionar sello mecánico en próximo servicio",
      "Revisar alineación del acople",
      "Cambiar aceite del rodamiento"
    ],
    "estimatedCost": "$150-200",
    "nextServiceDate": "2024-07-15"
  },
  "executionTime": "2.3s",
  "timestamp": "2024-06-01T10:30:45Z"
}
```

### Parámetros
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `request` | string | ✅ Sí | Solicitud en lenguaje natural (ej: "Generate a report") |
| `context` | object | ❌ No | Contexto adicional (IDs de recursos) |
| `context.serviceReportId` | string | Depende | ID del reporte de servicio (para reportes) |
| `context.equipmentId` | string | Depende | ID del equipo (para preguntas) |

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/ask \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Generate a maintenance report",
    "context": {"serviceReportId": "12345"}
  }'
```

---

## 🌐 Endpoint 3: POST /api/ai/agent/report
**Protegida** - Generar reporte profesional (atajo directo)

### Request
```http
POST /api/ai/agent/report HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "serviceReportId": "12345"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "generate_report",
  "result": {
    "description": "Reporte profesional generado por IA...",
    "recommendations": [...],
    "estimatedCost": "$150-200",
    "nextServiceDate": "2024-07-15"
  }
}
```

### Flujo Interno
```
1. Controller valida serviceReportId
2. Llama agent.invoke("Generate a professional maintenance report", { serviceReportId })
3. Agent decide usar generateReportTool
4. Tool carga ServiceReport + últimos 6 meses
5. LLM Groq analiza datos + crea reporte
6. Retorna JSON con estructura profesional
```

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/report \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceReportId": "12345"}'
```

---

## 🌐 Endpoint 4: POST /api/ai/agent/anomaly
**Protegida** - Detectar anomalías en servicio

### Request
```http
POST /api/ai/agent/anomaly HTTP/1.1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "serviceReportId": "12345"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "detect_anomaly",
  "result": {
    "anomaliesDetected": true,
    "anomalies": [
      {
        "parameter": "temperature",
        "currentValue": 85,
        "historicalAverage": 72,
        "deviation": "+13°C",
        "severity": "high",
        "explanation": "Temperature is 13°C above normal. May indicate bearing wear or insufficient lubrication."
      },
      {
        "parameter": "vibration",
        "currentValue": 4.2,
        "historicalAverage": 2.1,
        "deviation": "+2.1 mm/s",
        "severity": "medium",
        "explanation": "Slight increase in vibration levels. Monitor closely."
      }
    ],
    "overallSeverity": "high",
    "recommendation": "Schedule urgent maintenance within 48 hours"
  }
}
```

### Lógica
```
1. Carga ServiceReport actual
2. Obtiene promedio histórico (6 meses)
3. Compara: current vs average
4. LLM detecta patrones anómalos
5. Retorna severidad + recomendaciones
```

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/anomaly \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceReportId": "12345"}'
```

---

## 🌐 Endpoint 5: POST /api/ai/agent/question
**Protegida** - Hacer preguntas sobre historial de equipo

### Request
```http
POST /api/ai/agent/question HTTP/1.1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "equipmentId": "pump-001",
  "question": "What is the maintenance history of this equipment?"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "ask_equipment",
  "result": {
    "answer": "This pump has been in service since 2022. It has undergone 12 maintenance cycles with an average interval of 3 months. Most common issues: bearing wear (5 times), seal replacement (3 times), lubrication maintenance (12 times). Overall reliability: 94%. Last service: 2024-05-15.",
    "confidence": 0.92,
    "sourceData": {
      "totalServices": 12,
      "averageInterval": "3 months",
      "commonIssues": ["bearing_wear", "seal_replacement", "lubrication"],
      "lastService": "2024-05-15",
      "reliability": "94%"
    }
  }
}
```

### Parámetros
| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| `equipmentId` | string | ✅ | "pump-001" |
| `question` | string | ✅ | "Has this equipment ever overheated?" |

### Preguntas Ejemplo
- "What is the maintenance history?"
- "Has this equipment had problems with the motor?"
- "When was the last major repair?"
- "What is the average downtime?"
- "Is this equipment reliable?"

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/question \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "pump-001",
    "question": "Has this equipment ever overheated?"
  }'
```

---

## 🌐 Endpoint 6: POST /api/ai/agent/maintenance
**Protegida** - Recomendar próximo mantenimiento

### Request
```http
POST /api/ai/agent/maintenance HTTP/1.1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "equipmentId": "pump-001"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "recommend_maintenance",
  "result": {
    "recommendedDate": "2024-06-15",
    "urgency": "high",
    "daysUntilExpected": 14,
    "reason": "Based on 12-month trend analysis, this equipment shows progressive increase in bearing wear. Historical pattern suggests maintenance is due around mid-June.",
    "preventiveActions": [
      "Oil change (full)",
      "Bearing inspection and replacement if needed",
      "Seal check and replacement",
      "Alignment verification"
    ],
    "estimatedDowntime": "2-4 hours",
    "estimatedCost": "$200-300",
    "riskIfDelayed": "High - Risk of bearing failure and consequent major damage"
  }
}
```

### Flujo de Análisis
```
1. Carga Equipment + 12 meses de historial
2. Analiza tendencias:
   - Intervalos entre servicios
   - Tipos de fallos
   - Frecuencia de problemas
3. LLM predice próxima fecha
4. Retorna: fecha, urgencia, acciones preventivas
```

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/maintenance \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"equipmentId": "pump-001"}'
```

---

## 🌐 Endpoint 7: POST /api/ai/agent/summary
**Protegida** - Resumen ejecutivo del período

### Request
```http
POST /api/ai/agent/summary HTTP/1.1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "period": "month"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "toolUsed": "create_summary",
  "result": {
    "period": "June 2024",
    "totalEquipmentMaintained": 45,
    "totalServices": 67,
    "totalDowntime": "156 hours",
    "totalCost": "$18,500",
    "averageTimePerService": "2.3 hours",
    "kpis": {
      "equipmentAvailability": "96.2%",
      "maintenanceCompliance": "99.1%",
      "serviceOnTimeRate": "98.5%",
      "costPerService": "$276",
      "preventiveToReactiveRatio": "75/25"
    },
    "topIssues": [
      {
        "issue": "Bearing wear",
        "count": 12,
        "percentage": "18%"
      },
      {
        "issue": "Seal replacement",
        "count": 8,
        "percentage": "12%"
      },
      {
        "issue": "Lubrication maintenance",
        "count": 7,
        "percentage": "10%"
      }
    ],
    "recommendations": [
      "Implement preventive bearing inspection program",
      "Schedule bulk seal replacements",
      "Increase lubrication maintenance frequency"
    ],
    "trend": "Performance improving. Equipment availability up 2% from last month."
  }
}
```

### Parámetro Periodo
| Valor | Descripción |
|-------|-------------|
| `month` | Último mes completo |
| `quarter` | Último trimestre |
| `year` | Último año completo |

### Ejemplo cURL
```bash
curl -X POST http://localhost:5000/api/ai/agent/summary \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period": "month"}'
```

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren token JWT en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtener Token
```bash
# 1. Registrarse
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response contiene:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }
```

---

## ⚠️ Errores Posibles

### 400 Bad Request
```json
{
  "success": false,
  "error": "serviceReportId required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message from server"
}
```

---

## 📊 Response Structure

Todos los endpoints retornan esta estructura:

```typescript
{
  success: boolean,           // true si OK, false si error
  toolUsed?: string,          // nombre de la tool usada
  result?: object,            // datos retornados
  executionTime?: string,     // tiempo de ejecución
  error?: string,             // mensaje de error (si aplica)
  timestamp?: string          // ISO 8601 timestamp
}
```

---

## 🚦 Rate Limiting

- **Groq API**: 30 requests/minute (free tier)
- **Local**: Sin límite
- **Recomendación**: Implementar rate limiting en frontend

```javascript
// Ejemplo: máximo 5 solicitudes por minuto por usuario
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5 // 5 requests
});
```

---

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| Tiempo respuesta p50 | 2-3s |
| Tiempo respuesta p95 | 4-5s |
| Máximo simultáneos | 5 |
| Memoria por request | ~50MB |
| DB queries | 2-5 por request |

---

## 🔗 Rutas Relacionadas

- **Auth**: `/api/auth/*` (login, register, logout)
- **Health**: `/api/health` (status del servidor)
- **Service Reports**: `/api/service-reports` (CRUD)
- **Equipment**: `/api/equipment` (CRUD)
- **Clients**: `/api/clients` (CRUD)

---

**Última actualización:** Junio 2024
**Versión:** 1.0.0
**Autor:** CMMS AI Team
