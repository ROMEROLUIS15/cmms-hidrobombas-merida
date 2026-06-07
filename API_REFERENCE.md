# API — Endpoints de IA

Endpoints bajo `/api/ai/*`. Todos requieren autenticación JWT (`Authorization: Bearer <token>`).

---

## GET /api/ai/status

Estado del servicio de IA: proveedor LLM, embeddings, vector store.

```http
GET /api/ai/status HTTP/1.1
Authorization: Bearer <JWT>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groq_configured": true,
    "huggingface_configured": true,
    "llm_provider": "Groq (llama3-70b-8192)",
    "embeddings_provider": "HuggingFace (all-MiniLM-L6-v2)",
    "vector_store": "memory",
    "langgraph_agents": ["assistantGraph", "diagnosticGraph"]
  }
}
```

---

## POST /api/ai/ask

Consulta RAG sobre el historial de reportes de servicio. El LLM responde basándose en los reportes indexados en el vector store.

```http
POST /api/ai/ask HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{ "question": "¿Qué equipos han tenido problemas de sobrecalentamiento?" }
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "answer": "Respuesta generada por IA basada en los reportes..."
  }
}
```

---

## POST /api/ai/chat

Chat con el asistente LangGraph (Agent Maestro). Usa herramientas dinámicas para consultar BD.

```http
POST /api/ai/chat HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{ "message": "Dame información del equipo ABC-123" }
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "response": "Respuesta del asistente..."
  }
}
```

---

## POST /api/ai/diagnose

Diagnóstico basado en síntomas descritos. Opcionalmente recibe `equipment_id` o `equipment_name`.

```http
POST /api/ai/diagnose HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "symptoms": "El motor hace ruido y vibra al arrancar",
  "equipment_id": "uuid-del-equipo"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "diagnosis": "...",
    "recommendations": "...",
    "followUpQuestion": "..."
  }
}
```

---

## POST /api/ai/reindex

Reconstruye el vector store desde cero (borra y reindexa todos los reportes).

```http
POST /api/ai/reindex HTTP/1.1
Authorization: Bearer <JWT>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Reportes reindexados correctamente en el vector store."
}
```

---

## POST /api/ai/stream-chat · POST /api/ai/stream-ask

Versiones SSE (Server-Sent Events) de `chat` y `ask`. Emiten tokens conforme se generan.

```http
POST /api/ai/stream-chat HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{ "message": "¿Qué dice el historial?" }
```

**Response (SSE stream):**

```
data: {"token":"Respuesta "}
data: {"token":"generada "}
data: {"token":"token "}
data: {"token":"por "}
data: {"token":"token..."}
data: {"done":true}
```

---

## Herramientas del agente (LangChain Dynamic Tools)

| Nombre | Descripción |
|--------|-------------|
| `get_equipment_info` | Información detallada de un equipo por ID, nombre o serie |
| `get_client_history` | Historial completo de cliente con equipos y reportes |
| `get_recent_reports_by_equipment` | Últimos 10 reportes de un equipo |
| `search_reports_by_text` | Búsqueda textual en observaciones/recomendaciones |

---

## Rate Limiting

- `/api/ai/*`: 30 requests por ventana de 15 minutos (configurable vía `AI_RATE_LIMIT_MAX`).

---

## Autenticación

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'

# Usar el token devuelto:
curl -X POST http://localhost:8001/api/ai/ask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuántos reportes hay del equipo X?"}'
```

---

**Última actualización:** Junio 2026
