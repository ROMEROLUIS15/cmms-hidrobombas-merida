import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { ArrowLeft, CheckCircle2, Eraser, PenTool } from 'lucide-react';

const Step12ObservacionesFirma = ({ onSubmit, isSubmitting }) => {
  const { formData, updateFormData, prevStep } = useWizard();
  const sigCanvas = useRef({});
  const [sigCleared, setSigCleared] = useState(!formData.signature_base64);

  const clearSignature = () => {
    sigCanvas.current.clear();
    updateFormData(null, 'signature_base64', '');
    setSigCleared(true);
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    updateFormData(null, 'signature_base64', dataUrl);
    setSigCleared(false);
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
          <h4 className="font-semibold text-slate-800">Observaciones Generales</h4>
          <Textarea 
            placeholder="Ingrese repuestos requeridos o recomendaciones (Opcional)..."
            value={formData.observations}
            onChange={(e) => updateFormData(null, 'observations', e.target.value)}
            className="flex-grow min-h-[200px] resize-none bg-white/80"
          />
        </div>

        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
          <h4 className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Firma de Conformidad</span>
            {formData.signature_base64 && !sigCleared && (
              <span className="text-emerald-600 text-sm flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Firma capturada
              </span>
            )}
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de quien recibe el trabajo *</Label>
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

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/50">
        <Button variant="outline" onClick={prevStep} className="bg-white hover:bg-slate-50" disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting || !formData.signature_base64 || !formData.client_signature_name}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
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
