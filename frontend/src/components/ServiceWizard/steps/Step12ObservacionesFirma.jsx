import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { ArrowLeft, CheckCircle2, Eraser, PenTool } from 'lucide-react';
import { toast } from 'sonner';

const Step12ObservacionesFirma = ({ onSubmit, isSubmitting }) => {
  const { formData, updateFormData, prevStep } = useWizard();
  const sigCanvas = useRef({});
  const [sigCleared, setSigCleared] = useState(!formData.signature_base64);

  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
    updateFormData(null, 'signature_base64', '');
    setSigCleared(true);
  };

  const saveSignature = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
    updateFormData(null, 'signature_base64', dataUrl);
    setSigCleared(false);
  };

  const isReady = Boolean(formData.signature_base64) && Boolean(formData.client_signature_name && formData.client_signature_name.trim().length > 0);

  const handleSaveClick = () => {
    // Force capture signature just in case onEnd didn't fire
    let currentSignature = formData.signature_base64;
    if (!currentSignature && sigCanvas.current && !sigCanvas.current.isEmpty()) {
      currentSignature = sigCanvas.current.getCanvas().toDataURL('image/png');
      updateFormData(null, 'signature_base64', currentSignature);
      setSigCleared(false);
    }

    if (!formData.client_signature_name || formData.client_signature_name.trim().length === 0) {
      toast.error('Falta información: Por favor ingrese el nombre de la persona encargada.');
      return;
    }
    if (!currentSignature) {
      toast.error('Falta información: Por favor registre la firma de conformidad en el recuadro.');
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-200/50 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <PenTool className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cierre</p>
          <h2 className="text-xl font-bold">Observaciones y Firma</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm flex flex-col">
          <h4 className="font-bold text-slate-900">Observaciones Generales</h4>
          <Textarea 
            placeholder="Ingrese repuestos requeridos o recomendaciones (Opcional)..."
            value={formData.observations}
            onChange={(e) => updateFormData(null, 'observations', e.target.value)}
            className="flex-grow min-h-[200px] resize-none bg-white/80"
          />
        </div>

        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
          <h4 className="font-bold text-slate-900 flex items-center justify-between">
            <span>Firma de Conformidad</span>
            {formData.signature_base64 && !sigCleared && (
              <span className="text-emerald-600 text-sm flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Firma capturada
              </span>
            )}
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 font-bold text-sm">Nombre de persona encargada *</Label>
              <Input 
                placeholder="Nombre y Apellido"
                value={formData.client_signature_name}
                onChange={(e) => updateFormData(null, 'client_signature_name', e.target.value)}
                className="bg-white/80"
              />
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden relative touch-none">
              <SignatureCanvas 
                ref={sigCanvas}
                onEnd={saveSignature}
                penColor="black"
                canvasProps={{ className: 'w-full h-48 sm:h-64 cursor-crosshair' }}
              />
              {!formData.signature_base64 && sigCleared && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300">
                  <span>Firme aquí</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearSignature} className="text-slate-500 hover:text-red-600" type="button">
                <Eraser className="w-4 h-4 mr-2" /> Borrar Firma
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 pt-6 border-t border-slate-200/50 gap-4">
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto bg-white hover:bg-slate-50" disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
        </Button>
        <Button 
          onClick={handleSaveClick}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 rounded-xl shadow-lg transition-all hover:scale-105 text-white ${
            isReady 
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' 
            : 'bg-emerald-300 hover:bg-emerald-400 cursor-pointer shadow-none'
          }`}
        >
          {isSubmitting ? 'Guardando...' : (
            <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> Guardar y Finalizar</span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step12ObservacionesFirma;
