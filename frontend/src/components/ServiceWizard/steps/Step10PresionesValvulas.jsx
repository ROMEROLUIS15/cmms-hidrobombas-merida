import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Gauge, Check, X } from 'lucide-react';

const Step10PresionesValvulas = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.control_peripherals_data;

  const handleChange = (field, value) => updateFormData('control_peripherals_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Gauge className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Control y Periféricos</p>
          <h2 className="text-xl font-bold">Presiones y Válvulas</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Manómetro (PSI)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 60" value={data.manometer} onChange={(e) => handleChange('manometer', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Presión ON (PSI)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 40" value={data.pressure_on} onChange={(e) => handleChange('pressure_on', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Presión OFF (PSI)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 60" value={data.pressure_off} onChange={(e) => handleChange('pressure_off', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Válvula de Seguridad</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange('safety_valve', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.safety_valve === true ? 'bg-green-500 text-white shadow-md ring-2 ring-green-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange('safety_valve', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.safety_valve === false ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Electrodos C/Nivel</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange('electrode_level', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.electrode_level === true ? 'bg-green-500 text-white shadow-md ring-2 ring-green-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange('electrode_level', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.electrode_level === false ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-bold text-sm">Válvula/Tubo Nivel</Label>
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-md border border-input h-11">
              <span className="text-sm font-normal text-slate-400 truncate pr-2">Estado</span>
              <div className="flex items-center gap-2 shrink-0 h-full">
                <button 
                  type="button"
                  onClick={() => handleChange('valve_level', true)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.valve_level === true ? 'bg-green-500 text-white shadow-md ring-2 ring-green-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => handleChange('valve_level', false)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${data.valve_level === false ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
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

export default Step10PresionesValvulas;
