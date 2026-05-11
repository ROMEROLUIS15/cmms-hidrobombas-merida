import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, GitCommit, Check, X } from 'lucide-react';

const Step4InterruptorFlotante = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.water_energy_data;

  const handleChange = (field, value) => updateFormData('water_energy_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <GitCommit className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Servicios</p>
          <h2 className="text-xl font-bold">Interruptor Flotante</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Contacto N/A #1</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange('float_contact_na', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.float_contact_na === true ? 'bg-green-100 text-green-700 shadow-inner ring-1 ring-green-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange('float_contact_na', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.float_contact_na === false ? 'bg-red-100 text-red-700 shadow-inner ring-1 ring-red-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Contacto N/A #2</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-medium text-slate-500 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange('float_contact_na_2', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.float_contact_na_2 === true ? 'bg-green-100 text-green-700 shadow-inner ring-1 ring-green-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange('float_contact_na_2', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.float_contact_na_2 === false ? 'bg-red-100 text-red-700 shadow-inner ring-1 ring-red-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 pt-6 border-t border-slate-200/50 gap-3">
        <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto bg-white hover:bg-slate-50"><ArrowLeft className="w-4 h-4 mr-2" /> Atrás</Button>
        <Button onClick={nextStep} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">Siguiente <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};

export default Step4InterruptorFlotante;
