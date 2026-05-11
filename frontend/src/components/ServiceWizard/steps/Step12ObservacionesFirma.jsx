import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, Eraser, PenTool } from 'lucide-react';
import { toast } from 'sonner';

const Step12ObservacionesFirma = ({ onSubmit, isSubmitting }) => {
  const { formData, updateFormData, prevStep } = useWizard();
  const sigCanvas = useRef(null);
  const [sigCleared, setSigCleared] = useState(!formData.signature_base64);
  const [canvasKey, setCanvasKey] = useState(0);

  // 0 = Observaciones, 1 = Firma
  const [subStep, setSubStep] = useState(0);

  // Reconstruir canvas cuando cambia el subStep para evitar problemas de teclado
  useEffect(() => {
    if (subStep === 1) {
      setCanvasKey(prev => prev + 1);
    }
  }, [subStep]);

  // Prevenir que el botón back del hardware del móvil afecte la firma
  // Usamos una variable de estado para evitar problemas con el ref en el closure
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Solo prevenir si hay una firma activa y estamos en el paso de firma
        if (subStep === 1 && hasSignature) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [subStep, hasSignature]);

  // Actualizar el estado de la firma cuando cambie
  useEffect(() => {
    setHasSignature(!!formData.signature_base64 && !sigCleared);
  }, [formData.signature_base64, sigCleared]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    updateFormData(null, 'signature_base64', '');
    setSigCleared(true);
  };

  const saveSignature = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
    updateFormData(null, 'signature_base64', dataUrl);
    setSigCleared(false);
  };

  const handleCanvasEnd = () => {
    saveSignature();
  };

  const isReady =
    Boolean(formData.signature_base64) &&
    Boolean(formData.client_signature_name && formData.client_signature_name.trim().length > 0);

  const handleSaveClick = () => {
    // Force capture in case onEnd didn't fire
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

  // ─── HEADER compartido ────────────────────────────────────────────────────
  const Header = ({ subtitle }) => (
    <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-200/50 pb-4 mb-6">
      <div className="bg-emerald-100 p-2 rounded-lg">
        <PenTool className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cierre</p>
        <h2 className="text-xl font-bold">{subtitle}</h2>
      </div>
    </div>
  );

  // ─── SUB-PASO 0: Observaciones ────────────────────────────────────────────
  if (subStep === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <Header subtitle="Observaciones Generales" />

        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm flex flex-col space-y-3">
          <p className="text-xs text-slate-500 font-medium text-center">Opcional — repuestos requeridos, recomendaciones, etc.</p>
          <Textarea
            placeholder="Ingrese repuestos requeridos o recomendaciones (Opcional)..."
            value={formData.observations}
            onChange={(e) => updateFormData(null, 'observations', e.target.value)}
            className="min-h-[220px] resize-none bg-white/80 text-slate-900 text-center placeholder:text-center"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between pt-6 border-t border-slate-200/50 gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            className="w-full sm:w-auto bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
          <Button
            onClick={() => setSubStep(1)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            Continuar a Firma <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── SUB-PASO 1: Firma ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <Header subtitle="Firma de Conformidad" />

{/* Nombre */}
        <div className="space-y-2">
          <Label className="text-slate-900 font-bold text-sm">Nombre de persona encargada *</Label>
          <Input
            placeholder="Nombre y Apellido"
            value={formData.client_signature_name}
            onChange={(e) => updateFormData(null, 'client_signature_name', e.target.value)}
            className="bg-white/80 text-base"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck="false"
            inputMode="text"
          />
        </div>

{/* Canvas de firma */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-900 font-bold text-sm">Firma *</Label>
            {formData.signature_base64 && !sigCleared && (
              <span className="text-emerald-600 text-sm flex items-center bg-emerald-50 px-3 py-1 rounded-full font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Firma capturada
              </span>
            )}
          </div>

          <div 
            className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden relative shadow-inner"
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => e.preventDefault()}
          >
            <SignatureCanvas
              key={canvasKey}
              ref={sigCanvas}
              penColor="black"
              backgroundColor="rgba(255,255,255,1)"
              canvasProps={{
                className: 'w-full',
                style: { 
                  height: '320px',
                  touchAction: 'none',
                },
                onTouchStart: (e) => e.preventDefault(),
              }}
              onEnd={handleCanvasEnd}
            />
            {(!formData.signature_base64 || sigCleared) && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 text-slate-300">
                <PenTool className="w-10 h-10" />
                <span className="text-sm font-medium">Firme aquí con el dedo</span>
              </div>
            )}
          </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="text-slate-500 hover:text-red-600 hover:border-red-300"
            type="button"
          >
            <Eraser className="w-4 h-4 mr-2" /> Borrar Firma
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row justify-between pt-6 border-t border-slate-200/50 gap-3">
        <Button
          variant="outline"
          onClick={() => setSubStep(0)}
          className="w-full sm:w-auto bg-white hover:bg-slate-50"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Observaciones
        </Button>
        <Button
          onClick={handleSaveClick}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 rounded-xl shadow-lg transition-all hover:scale-105 text-white font-semibold ${
            isReady
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
              : 'bg-emerald-300 hover:bg-emerald-400 cursor-pointer shadow-none'
          }`}
        >
          {isSubmitting ? (
            'Guardando...'
          ) : (
            <span className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Guardar y Finalizar
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step12ObservacionesFirma;
