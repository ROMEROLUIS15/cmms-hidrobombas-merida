# 🚀 Frontend React - Cómo Funciona con Agent Maestro

## 📊 Flujo Completo: Frontend → Backend → LLM

```
┌─────────────────────────────────────────────────────────────────────────┐
│ USUARIO EN NAVEGADOR (React)                                            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ AIAgentMaestro.jsx                                                  │ │
│ │ - 7 pestañas (Tabs) con diferentes interfaces                      │ │
│ │ - Formularios para input de datos                                  │ │
│ │ - Botones para enviar solicitudes                                  │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │ onClick → handleGenerateReport()
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ CUSTOM HOOK (useAIAgent.js)                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ const { generateReport, loading, result, error } = useAIAgent()   │ │
│ │                                                                     │ │
│ │ Funciona: axios interceptor + localStorage token + error handling  │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │ generateReport(serviceReportId)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ HTTP REQUEST (axios)                                                    │
│                                                                         │
│ POST /api/ai/agent/report                                              │
│ Headers: {                                                              │
│   Authorization: "Bearer TOKEN_DEL_USUARIO",                           │
│   Content-Type: "application/json"                                     │
│ }                                                                       │
│ Body: { "serviceReportId": "12345" }                                   │
│ Timeout: 15 segundos (porque LLM puede tardar)                         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ HTTP POST (localhost:5000)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ EXPRESS BACKEND (backend/src)                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ aiRoutes.js → POST /api/ai/agent/report                           │ │
│ │ ├─ Verifica autenticación (JWT)                                   │ │
│ │ └─ Llama: agentGenerateReport(req, res)                           │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
│ ┌──────────────────────────▼──────────────────────────────────────────┐ │
│ │ aiController.js → agentGenerateReport()                           │ │
│ │ ├─ Valida: serviceReportId existe y es válido                     │ │
│ │ └─ Llama: agent.invoke("Generate report", context)               │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
│ ┌──────────────────────────▼──────────────────────────────────────────┐ │
│ │ aiAgent.js → AIAgentMaestro.invoke()                              │ │
│ │ ├─ Prepara prompt con 6 tools disponibles                         │ │
│ │ ├─ Llama LLM (Groq): "Qué tool debo usar?"                        │ │
│ │ └─ LLM retorna: "generate_report"                                 │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
│ ┌──────────────────────────▼──────────────────────────────────────────┐ │
│ │ aiAgent.js → executeTool("generate_report", params)              │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ AI TOOLS (backend/src/services/aiTools.js)                              │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ generateReportTool.execute({ serviceReportId: "12345" })          │ │
│ │                                                                     │ │
│ │ 1. Carga ServiceReport.findByPk("12345")                           │ │
│ │    └─ Obtiene: waterEnergyData, motorsData, controlData            │ │
│ │                                                                     │ │
│ │ 2. Consulta histórico: últimos 6 meses                            │ │
│ │    └─ Calcula: promedios, tendencias                              │ │
│ │                                                                     │ │
│ │ 3. Prepara datos + prompt especializado                           │ │
│ │    └─ Llama: callLLM(GENERATE_REPORT_PROMPT, datos)              │ │
│ └──────────────────────────┬──────────────────────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ GROQ LLM API (mixtral-8x7b-32768)                                       │
│                                                                         │
│ Request:                                                                │
│ - Prompt especializado para generar reportes                           │
│ - Datos técnicos del equipo                                            │
│ - Historial de mantenimiento                                           │
│                                                                         │
│ Processing (2-3 segundos):                                             │
│ - Analiza datos                                                        │
│ - Genera recomendaciones                                               │
│ - Formatea como JSON                                                   │
│                                                                         │
│ Response:                                                              │
│ {                                                                       │
│   "description": "La bomba operó dentro de parámetros...",            │
│   "recommendations": ["Revisar sello...", "Cambiar aceite..."],       │
│   "estimatedCost": "$150-200"                                          │
│ }                                                                       │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                                      │
│ ├─ Extrae JSON de respuesta LLM                                        │
│ ├─ Valida estructura                                                   │
│ ├─ Retorna a controller                                               │
│ └─ Express HTTP Response 200 OK                                       │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼ JSON Response
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (useAIAgent hook)                                              │
│ ├─ Recibe respuesta                                                    │
│ ├─ Extrae: result, toolUsed, executionTime                            │
│ ├─ Actualiza estado React (setResult, setLoading(false))             │
│ └─ Re-renderiza componente                                            │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ COMPONENTE React (AIAgentMaestro.jsx)                                   │
│ ├─ renderResult() dibuja Card con resultado                           │
│ ├─ Muestra: descripción, recomendaciones, costo                       │
│ ├─ Tiempo de ejecución: 2.3s                                          │
│ └─ Usuario ve respuesta en pantalla                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ejemplo en Código: Generar Reporte

### 1️⃣ Usuario hace clic en "Generar Reporte"

```jsx
// frontend/src/components/AIAgentMaestro.jsx
<Button onClick={handleGenerateReport} disabled={loading}>
  {loading ? "Generando..." : "Generar Reporte"}
</Button>
```

### 2️⃣ Handler valida y llama hook

```jsx
const handleGenerateReport = async (e) => {
  e.preventDefault();
  if (!reportForm.serviceReportId.trim()) {
    alert('Por favor ingresa un Service Report ID');
    return;
  }
  // ✅ Llama el hook
  await generateReport(reportForm.serviceReportId);
};
```

### 3️⃣ Hook makeRequest con axios

```javascript
// frontend/src/hooks/useAIAgent.js
const generateReport = useCallback(async (serviceReportId) => {
  try {
    setLoading(true); // ⏳ Muestra spinner
    setError(null);

    const startTime = performance.now();

    // 🌐 Llamada HTTP
    const response = await apiClient.post('/ai/agent/report', {
      serviceReportId,
    });

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // ✅ Almacena resultado
    setResult(response.data.result);
    setToolUsed('generate_report');
    setExecutionTime(duration);

    return response.data;
  } catch (err) {
    // ❌ Maneja error
    const errorMessage = err.response?.data?.error || err.message;
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false); // ⏹️ Oculta spinner
  }
}, []);
```

### 4️⃣ Axios interceptor agrega token

```javascript
// En useAIAgent.js
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // ✅ Agrega: Authorization: Bearer TOKEN
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 5️⃣ Request HTTP real

```http
POST http://localhost:5000/api/ai/agent/report
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "serviceReportId": "12345"
}

TIMEOUT: 15 segundos (porque LLM tarda 2-5s)
```

### 6️⃣ Backend procesa

```javascript
// backend/src/controllers/aiController.js
const agentGenerateReport = asyncHandler(async (req, res) => {
  const { serviceReportId } = req.body;

  if (!serviceReportId) {
    return res.status(400).json({ success: false, error: 'serviceReportId required' });
  }

  const agent = await getAgent();
  const result = await agent.invoke('Generate a professional maintenance report', {
    serviceReportId
  });

  res.status(200).json({ success: true, ...result });
});
```

### 7️⃣ Agent decide tool

```javascript
// backend/src/services/aiAgent.js
const result = await agent.invoke(
  'Generate a professional maintenance report',
  { serviceReportId: '12345' }
);

// LLM (Groq) analiza:
// "Generate" + "maintenance" + "report" = generateReportTool ✅
```

### 8️⃣ Tool ejecuta

```javascript
// backend/src/services/aiTools.js
generateReportTool.execute = async (input) => {
  // 1. Carga ServiceReport
  const report = await ServiceReport.findByPk(input.serviceReportId);

  // 2. Obtiene datos técnicos
  const data = {
    waterEnergyData: JSON.parse(report.waterEnergyData),
    motorsData: JSON.parse(report.motorsData),
    controlData: JSON.parse(report.controlData),
  };

  // 3. Consulta histórico
  const historical = await getHistoricalAverage(report.equipmentId, 6);

  // 4. Llama LLM con prompt
  const llmResponse = await callLLM(
    GENERATE_REPORT_PROMPT(data, historical),
    groqClient
  );

  // 5. Parsea y retorna
  return parseJSONResponse(llmResponse);
};
```

### 9️⃣ LLM responde

```
Groq API (2-3 segundos)

Response:
{
  "description": "La bomba centrífuga modelo XYZ-2000 ha operado dentro de parámetros normales...",
  "recommendations": [
    "Inspeccionar sello mecánico",
    "Revisar alineación del acople",
    "Cambiar aceite del rodamiento"
  ],
  "estimatedCost": "$150-200"
}
```

### 🔟 Frontend recibe y renderiza

```jsx
// El hook actualiza estado
setResult({
  description: "La bomba...",
  recommendations: [...],
  estimatedCost: "$150-200"
});

// El componente re-renderiza
<Card className="border-green-500">
  <CardContent>
    <p>{result.description}</p>
    <ul>
      {result.recommendations.map(rec => <li>{rec}</li>)}
    </ul>
    <p>💰 {result.estimatedCost}</p>
  </CardContent>
</Card>
```

---

## 📊 Timing Real

| Etapa | Tiempo |
|-------|--------|
| 1. Usuario click → Request HTTP | 100ms |
| 2. Validación backend | 50ms |
| 3. Carga BD (ServiceReport) | 100ms |
| 4. Consulta histórico | 200ms |
| 5. Groq LLM procesando | 2000-3000ms ⏳ |
| 6. Parseo JSON | 50ms |
| 7. Response HTTP → Frontend | 100ms |
| 8. Re-render React | 50ms |
| **TOTAL** | **2.5-3.5s** |

---

## 🎯 Estados del Componente Durante Llamada

```
0s - Usuario hace click
├─ loading = false
├─ error = null
├─ result = null
└─ Button texto: "Generar Reporte"

0.1s - Request enviada
├─ loading = true ⏳
├─ error = null
├─ result = null
└─ Button texto: "Generando..." + Spinner

2.5s - Esperando Groq LLM
├─ loading = true ⏳
├─ error = null
├─ result = null
└─ Button texto: "Generando..." + Spinner (todavía)

3.2s - Respuesta recibida
├─ loading = false ✅
├─ error = null
├─ result = {...} ✅
├─ toolUsed = "generate_report" ✅
├─ executionTime = "3.2s" ⏱️
└─ Renderiza Card verde con resultado

3.5s - Usuario ve resultado final
```

---

## 🔐 Manejo de Autenticación

```
1. Usuario hace login
   ├─ POST /api/auth/login
   └─ Recibe: { token: "eyJ...", user: {...} }

2. Frontend guarda token
   └─ localStorage.setItem('authToken', token)

3. Cada request al Agent
   ├─ axios interceptor lee: const token = localStorage.getItem('authToken')
   ├─ Agrega header: Authorization: Bearer TOKEN
   └─ Backend verifica: req.headers.authorization

4. Si token inválido/expirado
   ├─ Backend retorna: 401 Unauthorized
   └─ Frontend debería redirigir a login
```

---

## 💥 Manejo de Errores

```javascript
// En useAIAgent.js
try {
  const response = await apiClient.post('/ai/agent/report', { ... });
  setResult(response.data.result); // ✅ Éxito
} catch (err) {
  // ❌ Error
  const errorMessage = err.response?.data?.error || err.message;
  setError(errorMessage);
  
  // Ejemplos:
  // "serviceReportId not found"
  // "No token provided"
  // "LLM API limit reached"
  // "Database connection error"
}
```

---

## 🚀 Cómo Usar en Producción

### 1. Variables de entorno frontend

**`.env` (frontend)**
```env
REACT_APP_API_URL=http://tu-servidor-prod.com/api
# O para desarrollo local:
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Importar componente

```jsx
// frontend/src/App.jsx
import { AIAgentMaestro } from './components/AIAgentMaestro';

export function App() {
  return (
    <div>
      <AIAgentMaestro />
    </div>
  );
}
```

### 3. Asegurar token en localStorage

```jsx
// Después de login
const { token } = response.data;
localStorage.setItem('authToken', token);

// El hook automáticamente lo usará
```

### 4. Manejo de expiración

```javascript
// En apiClient interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado
      localStorage.removeItem('authToken');
      window.location.href = '/login'; // Redirigir a login
    }
    return Promise.reject(error);
  }
);
```

---

## 📱 Responsive Design

El componente usa Tailwind + Shadcn/ui, por lo que:

- ✅ Funciona en desktop (1920px)
- ✅ Funciona en tablet (768px)
- ✅ Funciona en mobile (375px)
- ✅ Los tabs se colapsan en mobile
- ✅ Los inputs se hacen full-width

---

## 🎓 Lessons Learned

1. **Timeouts**: LLM tarda 2-5s, nunca 500ms
2. **Tokens**: Guardar en localStorage es simple pero seguro para SPA
3. **Interceptors**: axios interceptors hacen código más limpio
4. **State Management**: useAIAgent maneja todo (loading, error, result, time)
5. **Componentes**: Separar Hook + Component = reutilizable
6. **Error Handling**: Siempre mostrar errorMessage al usuario

---

## 🔗 Relación con Backend

```
Frontend (React)
    ↓
useAIAgent Hook
    ↓
axios HTTP
    ↓
Backend Express
    ↓
aiController
    ↓
aiAgent (AIAgentMaestro)
    ↓
aiTools (6 herramientas)
    ↓
Groq LLM + BD Sequelize
    ↓
JSON Response
    ↓
Frontend renderiza resultado
```

---

**Conclusión**: El frontend está completamente separado del backend. Puedes usar la misma API desde:
- React web ✅
- React Native app ✅
- Flutter app ✅
- Scripts Python ✅
- Cualquier cliente HTTP ✅
