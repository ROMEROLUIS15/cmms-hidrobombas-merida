import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Settings, Check, X } from 'lucide-react';

const Step6Contactores = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();

  const handleChange = (motorNum, field, value) => updateFormData(`motor_${motorNum}_data`, field, value);

  const renderMotorRow = (num) => {
    const data = formData[`motor_${num}_data`];
    return (
      <div key={num} className="bg-white/40 sm:bg-transparent p-4 sm:p-0 rounded-xl mb-6 sm:mb-4">
        <div className="font-bold text-white bg-slate-800 py-2 px-4 rounded-lg text-center mb-4 sm:hidden shadow-sm tracking-wide">
          Motor {num}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="hidden sm:block font-bold text-white bg-slate-800 py-2 px-4 rounded-lg text-center shadow-sm tracking-wide">
            M{num}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">Bobina</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange(num, 'bobina_value', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.bobina_value === true ? 'bg-green-500 text-white shadow-md ring-2 ring-green-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange(num, 'bobina_value', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.bobina_value === false ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">Contactos</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange(num, 'contactos_value', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.contactos_value === true ? 'bg-green-500 text-white shadow-md ring-2 ring-green-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange(num, 'contactos_value', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.contactos_value === false ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <Settings className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Potencia</p>
          <h2 className="text-xl font-bold">Contactores</h2>
        </div>
      </div>

      <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="hidden sm:grid grid-cols-3 gap-4 mb-4 px-2">
          <div className="text-xs font-bold text-slate-900 text-center">Equipo</div>
          <div className="text-xs font-bold text-slate-900">Bobina</div>
          <div className="text-xs font-bold text-slate-900">Contactos</div>
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map(renderMotorRow)}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 pt-6 border-t border-slate-200/50 gap-3">
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto bg-white hover:bg-slate-50"><ArrowLeft className="w-4 h-4 mr-2" /> Atrás</Button>
        <Button onClick={nextStep} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">Siguiente <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};

export default Step6Contactores;
