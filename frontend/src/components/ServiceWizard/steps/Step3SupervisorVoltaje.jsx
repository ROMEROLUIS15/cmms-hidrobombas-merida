import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Gauge } from 'lucide-react';

const Step3SupervisorVoltaje = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.water_energy_data;

  const handleChange = (field, value) => updateFormData('water_energy_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Gauge className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Servicios</p>
          <h2 className="text-xl font-bold">Supervisor de Voltaje</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Volts Mínimo</Label>
            <Input type="number" step="0.1" placeholder="180" value={data.volts_min} onChange={(e) => handleChange('volts_min', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Volts Máximo</Label>
            <Input type="number" step="0.1" placeholder="250" value={data.volts_max} onChange={(e) => handleChange('volts_max', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Tiempo 1 (seg)</Label>
            <Input type="number" step="0.1" placeholder="5" value={data.time_1} onChange={(e) => handleChange('time_1', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Tiempo 2 (seg)</Label>
            <Input type="number" step="0.1" placeholder="10" value={data.time_2} onChange={(e) => handleChange('time_2', e.target.value)} className="bg-white/80" />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/50">
        <Button variant="outline" onClick={prevStep} className="bg-white hover:bg-slate-50"><ArrowLeft className="w-4 h-4 mr-2" /> Atrás</Button>
        <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">Siguiente <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};

export default Step3SupervisorVoltaje;
