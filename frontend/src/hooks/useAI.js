import { useState, useCallback } from 'react';
import axios from 'axios';

// Debe apuntar al BACKEND, igual que el resto de componentes. Con la ruta
// relativa ('/api/ai'), en producción el navegador hacía POST contra el propio
// frontend (hosting estático) y recibía un 405: el backend ni se enteraba.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const AI_API = `${BACKEND_URL}/api/ai`;

export function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (content) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const { data } = await axios.post(`${AI_API}/chat`, { message: content });
      const response = data.data.response;
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      return response;
    } catch {
      const errorMsg = 'Error al comunicarse con el asistente. Intenta de nuevo.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, sendMessage, clearMessages };
}

export function useAIDiagnose() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const diagnose = useCallback(async ({ equipment_id, equipment_name, symptoms }) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${AI_API}/diagnose`, {
        equipment_id,
        equipment_name,
        symptoms,
      });
      setResult(data.data);
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al realizar diagnóstico.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, diagnose };
}

export function useAIStreamChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendStreamMessage = useCallback(async (content) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/stream-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                accumulated += parsed.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
              if (parsed.done) break;
              if (parsed.error) throw new Error(parsed.error);
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      }

      return accumulated;
    } catch {
      const errorMsg = 'Error al comunicarse con el asistente. Intenta de nuevo.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, sendStreamMessage, clearMessages };
}

export function useAIAsk() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async (question) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${AI_API}/ask`, { question });
      setAnswer(data.data.answer);
      return data.data.answer;
    } catch {
      setAnswer('Error al procesar la pregunta.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { answer, loading, ask };
}
