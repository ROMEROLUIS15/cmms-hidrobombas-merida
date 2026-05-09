import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Wrench } from 'lucide-react';

const Step9BreakersReles = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.control_peripherals_data;

  const handleChange = (field, value) => updateFormData('control_peripherals_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-slate-200 p-2 rounded-lg">
          <Wrench className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Control y Periféricos</p>
          <h2 className="text-xl font-bold">Breakers y Relés</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Breaker Tripolar 1</Label>
            <Input placeholder="OK / Falla / Amperaje" value={data.breaker_tripolar_1} onChange={(e) => handleChange('breaker_tripolar_1', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Breaker Tripolar 2</Label>
            <Input placeholder="OK / Falla / Amperaje" value={data.breaker_tripolar_2} onChange={(e) => handleChange('breaker_tripolar_2', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Breaker Tripolar 3</Label>
            <Input placeholder="OK / Falla / Amperaje" value={data.breaker_tripolar_3} onChange={(e) => handleChange('breaker_tripolar_3', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Breaker Control</Label>
            <Input placeholder="OK / Falla" value={data.breaker_control} onChange={(e) => handleChange('breaker_control', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Relé Alternador</Label>
            <Input placeholder="OK / Falla" value={data.relay_alternator} onChange={(e) => handleChange('relay_alternator', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Relé Control Nivel</Label>
            <Input placeholder="OK / Falla" value={data.relay_control_level} onChange={(e) => handleChange('relay_control_level', e.target.value)} className="bg-white/80" />
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

export default Step9BreakersReles;
