import React, { useState } from 'react';
import { Wrench, Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIDiagnose } from '@/hooks/useAI';

export default function DiagnosticPanel() {
  const [symptoms, setSymptoms] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const { result, loading, error, diagnose } = useAIDiagnose();

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    await diagnose({ equipment_name: equipmentName.trim() || undefined, symptoms: symptoms.trim() });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[400px]">
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
        <Wrench className="h-4 w-4" />
        <span className="font-medium">Diagnóstico de Fallas</span>
      </div>

      <form onSubmit={handleDiagnose} className="space-y-2">
        <Input
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          placeholder="Nombre del equipo (opcional)"
          className="text-sm"
          disabled={loading}
        />
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe los síntomas del equipo..."
          className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 min-h-[80px]"
          disabled={loading}
          rows={3}
        />
        <Button type="submit" disabled={loading || !symptoms.trim()} className="w-full text-sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          Diagnosticar
        </Button>
      </form>

      {error && (
        <div className="flex gap-2 text-sm p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Diagnóstico
            </h4>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{result.diagnosis}</p>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Recomendaciones
            </h4>
            <p className="text-sm text-green-900 whitespace-pre-wrap">{result.recommendations}</p>
          </div>

          {result.followUpQuestion && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 whitespace-pre-wrap">
                <span className="font-semibold">Pregunta adicional:</span>{' '}
                {result.followUpQuestion}
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !error && (
        <div className="text-center text-slate-400 text-sm py-6">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Describe los síntomas del equipo</p>
          <p>para obtener un diagnóstico</p>
        </div>
      )}
    </div>
  );
}
