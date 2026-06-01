/**
 * 📖 EJEMPLO DE INTEGRACIÓN - Cómo usar AIAgentMaestro en tu app
 * 
 * Este archivo muestra 3 formas de integrar el componente
 */

// ═══════════════════════════════════════════════════════════════════════════
// OPCIÓN 1: Usar componente completo (RECOMENDADO - Más fácil)
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { AIAgentMaestro } from '@/components/AIAgentMaestro';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardPageWithAI() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenido principal con Agent Maestro */}
      <main className="flex-1 overflow-auto">
        <AIAgentMaestro />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPCIÓN 2: Usar hook en un componente personalizado (AVANZADO)
// ═══════════════════════════════════════════════════════════════════════════

import { useAIAgent } from '@/hooks/useAIAgent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function QuickReportGenerator({ serviceReportId }) {
  const { generateReport, loading, result, error, executionTime } = useAIAgent();

  const handleClick = async () => {
    try {
      await generateReport(serviceReportId);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Generar Reporte Rápido</h3>

      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? 'Generando...' : 'Generar Reporte'}
      </Button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-4 bg-green-50 p-4 rounded">
          <p className="font-semibold">✅ Reporte Generado ({executionTime}s)</p>
          <p className="text-sm mt-2">{result.description}</p>
          {result.estimatedCost && <p className="text-sm mt-2">💰 {result.estimatedCost}</p>}
        </div>
      )}
    </Card>
  );
}

// Uso:
// <QuickReportGenerator serviceReportId="12345" />

// ═══════════════════════════════════════════════════════════════════════════
// OPCIÓN 3: Panel en Dashboard existente (INTEGRACIÓN MÍNIMA)
// ═══════════════════════════════════════════════════════════════════════════

import { useAIAgent } from '@/hooks/useAIAgent';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export function ServiceReportRow({ report }) {
  const { generateReport, loading, result, error } = useAIAgent();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleGenerateAIReport = async () => {
    try {
      await generateReport(report.id);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">{report.equipmentName}</td>
      <td className="px-4 py-2">{report.createdAt}</td>
      <td className="px-4 py-2">{report.status}</td>

      {/* Botón para generar reporte con IA */}
      <td className="px-4 py-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={report.hasAIReport}>
              {report.hasAIReport ? '✅ IA Report' : '🤖 Generate with AI'}
            </Button>
          </DialogTrigger>

          <DialogContent>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Generar Reporte con IA</h2>

              {!result && !error && (
                <Button onClick={handleGenerateAIReport} disabled={loading} className="w-full">
                  {loading ? 'Procesando...' : 'Generar Ahora'}
                </Button>
              )}

              {error && <p className="text-red-600">❌ Error: {error}</p>}

              {result && (
                <div className="bg-green-50 p-4 rounded space-y-3">
                  <p className="font-semibold text-green-900">✅ Reporte Generado</p>
                  <p className="text-sm">{result.description}</p>
                  {result.recommendations && (
                    <div>
                      <p className="text-sm font-semibold mt-2">Recomendaciones:</p>
                      <ul className="text-sm space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}

// Uso en tabla:
// <table>
//   <tbody>
//     {reports.map(report => <ServiceReportRow key={report.id} report={report} />)}
//   </tbody>
// </table>

// ═══════════════════════════════════════════════════════════════════════════
// CÓMO INTEGRARLO EN RUTAS EXISTENTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * En tu router principal (App.jsx o Router.jsx)
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AIAgentMaestro } from '@/components/AIAgentMaestro';

export function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Rutas existentes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />

        {/* ✅ Nueva ruta para Agent Maestro */}
        <Route path="/ai-agent" element={<AIAgentMaestro />} />

        {/* O si quieres en tab del dashboard */}
        <Route path="/dashboard/ai" element={<AIAgentMaestro />} />
      </Routes>
    </Router>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE VARIABLES DE ENTORNO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crear archivo: frontend/.env
 */

// Para desarrollo local
REACT_APP_API_URL=http://localhost:5000/api

// Para producción
# REACT_APP_API_URL=https://tu-api.com/api

/**
 * El hook automáticamente usa:
 * const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
 */

// ═══════════════════════════════════════════════════════════════════════════
// TESTING DEL HOOK CON MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAIAgent } from '@/hooks/useAIAgent';
import axios from 'axios';

jest.mock('axios');

test('generateReport debería funcionar correctamente', async () => {
  // Mock de respuesta exitosa
  axios.post.mockResolvedValueOnce({
    data: {
      success: true,
      toolUsed: 'generate_report',
      result: {
        description: 'La bomba funciona bien',
        recommendations: ['Cambiar aceite', 'Revisar sello'],
        estimatedCost: '$150-200',
      },
      executionTime: '2.3s',
    },
  });

  // Renderizar componente que usa el hook
  const { result } = renderHook(() => useAIAgent());

  // Llamar función
  await act(async () => {
    await result.current.generateReport('test-id');
  });

  // Verificaciones
  expect(result.current.result).toBeDefined();
  expect(result.current.result.description).toBe('La bomba funciona bien');
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS Y PERSONALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * El componente usa Tailwind CSS + Shadcn/ui
 * 
 * Si quieres personalizarlo, puedes:
 * 1. Modificar colores en tailwind.config.js
 * 2. Extender componentes de Shadcn/ui
 * 3. Crear un wrapper del componente
 */

export function CustomAIAgent() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-8">
      {/* Wrapper personalizado */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">🤖 Mi Agent Maestro</h1>
          <p className="text-blue-600">Herramienta inteligente personalizada</p>
        </div>

        {/* Componente */}
        <AIAgentMaestro />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEXTJS - SI ESTÁS USANDO NEXTJS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * frontend/app/ai-agent/page.jsx
 */

'use client'; // ← Necesario en NextJS 13+

import { AIAgentMaestro } from '@/components/AIAgentMaestro';

export default function AIAgentPage() {
  return (
    <div>
      <AIAgentMaestro />
    </div>
  );
}

// Acceso: http://localhost:3000/ai-agent

// ═══════════════════════════════════════════════════════════════════════════
// PASOS PARA INSTALACIÓN RÁPIDA (5 minutos)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. Copia los archivos al proyecto
 * 
 *    cp src/hooks/useAIAgent.js frontend/src/hooks/
 *    cp src/components/AIAgentMaestro.jsx frontend/src/components/
 * 
 * 2. Crea .env (si no existe)
 * 
 *    echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
 * 
 * 3. En App.jsx, importa y usa:
 * 
 *    import { AIAgentMaestro } from '@/components/AIAgentMaestro';
 * 
 *    export function App() {
 *      return <AIAgentMaestro />;
 *    }
 * 
 * 4. Inicia frontend y backend
 * 
 *    Terminal 1: npm run dev (en frontend)
 *    Terminal 2: npm run dev (en backend)
 * 
 * 5. Abre http://localhost:5173 y ve a tab "Generar Reporte"
 * 
 * 6. Ingresa un Service Report ID válido y haz clic
 * 
 * ✅ ¡Debería funcionar!
 */

// ═══════════════════════════════════════════════════════════════════════════
// TROUBLESHOOTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ❌ "Module not found: @/components/ui/card"
 * → Necesitas tener Shadcn/ui instalado
 * → npx shadcn-ui@latest add card
 * 
 * ❌ "Cannot POST /api/ai/agent/report"
 * → Backend no está corriendo
 * → Ejecuta: cd backend && npm run dev
 * 
 * ❌ "No token provided"
 * → No hay token guardado en localStorage
 * → Primero haz login para obtener token
 * → localStorage.getItem('authToken') debería retornar algo
 * 
 * ❌ "CORS error"
 * → Backend debe tener CORS habilitado
 * → En backend/src/app.js: app.use(cors())
 * 
 * ❌ "LLM took too long"
 * → Groq está lento o token alcanzó límite (30 req/min)
 * → Espera 1 minuto o aumenta timeout a 20s
 */

export default DashboardPageWithAI;
