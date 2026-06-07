# Asistencia con IA — Arquitectura y uso

## Resumen

El sistema integra IA vía LangChain + Groq para:
1. Responder preguntas sobre el historial de reportes (RAG)
2. Diagnosticar problemas basados en síntomas
3. Chatear con un asistente que consulta la BD
4. Reindexar el vector store cuando se agregan reportes

---

## Arquitectura

```
Cliente → POST /api/ai/ask|chat|diagnose
              ↓
        aiController.js    ← validación de entrada
              ↓
        ai/index.js        ← orquestador
         ┌────┴────┐
         ↓         ↓
    ragChain.js  assistantGraph.js / diagnosticGraph.js
         ↓         ↓
    vectorStore   DynamicTools (4)
    (memory /     ┌─────────────────┐
     pgvector)    │ get_equipment_info
                  │ get_client_history
                  │ get_recent_reports_by_equipment
                  │ search_reports_by_text
                  └─────────────────┘
```

## Componentes

### RAG Chain (`backend/src/ai/ragChain.js`)
- Indexa reportes de servicio en un vector store de memoria (o pgvector en producción).
- Embeddings vía HuggingFace (`all-MiniLM-L6-v2`).
- Responde preguntas sobre el contenido de los reportes.

### Assistant Graph (`backend/src/ai/assistantGraph.js`)
- Agente LangGraph con acceso a 4 DynamicTools.
- Puede consultar equipos, clientes, historial de reportes y buscar por texto.

### Diagnostic Graph (`backend/src/ai/diagnosticGraph.js`)
- Analiza síntomas y devuelve diagnóstico, recomendaciones y pregunta de seguimiento.

### Streaming (`backend/src/ai/streaming.js`)
- Soporte SSE para `chat` y `ask`.

---

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/ai/status` | Sí | Estado del servicio IA |
| `POST` | `/api/ai/ask` | Sí | Pregunta RAG sobre reportes |
| `POST` | `/api/ai/chat` | Sí | Chat con asistente LangGraph |
| `POST` | `/api/ai/diagnose` | Sí | Diagnóstico por síntomas |
| `POST` | `/api/ai/reindex` | Sí | Reconstruir vector store |
| `POST` | `/api/ai/stream-chat` | Sí | Chat con streaming SSE |
| `POST` | `/api/ai/stream-ask` | Sí | Pregunta con streaming SSE |

Ver `API_REFERENCE.md` para detalles de cada endpoint.

---

## Variables de entorno

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
HUGGINGFACEHUB_API_KEY=hf_...
VECTOR_STORE_PROVIDER=memory       # memory | pgvector
AI_RATE_LIMIT_MAX=30
```

---

## Herramientas del agente

| Tool | Propósito |
|------|-----------|
| `get_equipment_info` | Busca equipo por ID, nombre o serie; incluye cliente y últimos 5 reportes |
| `get_client_history` | Busca cliente por ID o nombre; devuelve equipos con hasta 20 reportes c/u |
| `get_recent_reports_by_equipment` | Últimos 10 reportes de un equipo |
| `search_reports_by_text` | Búsqueda textual en observaciones, recomendaciones, descripción |

---

## Testing

```bash
# Verificar conectividad con Groq
node backend/test-agent.js

# Tests unitarios del módulo AI
cd backend && npm test -- --testPathPattern=ai
```

---

## Última actualización

Junio 2026
