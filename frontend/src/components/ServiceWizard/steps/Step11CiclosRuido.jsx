import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Volume2 } from 'lucide-react';

const Step11CiclosRuido = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.control_peripherals_data;

  const handleChange = (field, value) => updateFormData('control_peripherals_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-sky-100 p-2 rounded-lg">
          <Volume2 className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Control y Periféricos</p>
          <h2 className="text-xl font-bold">Ciclos y Niveles de Ruido</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 bg-slate-100 py-1 px-3 rounded-md inline-block">Bomba 1</h3>
            <div className="space-y-2">
              <Label className="text-slate-600">Tiempo ON (min)</Label>
              <Input type="number" step="0.1" value={data.pump_1_on_minutes} onChange={(e) => handleChange('pump_1_on_minutes', e.target.value)} className="bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Tiempo Reposo (min)</Label>
              <Input type="number" step="0.1" value={data.pump_1_rest_minutes} onChange={(e) => handleChange('pump_1_rest_minutes', e.target.value)} className="bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Ruido (dB)</Label>
              <Input placeholder="Ej. Normal" value={data.pump_1_noise_db} onChange={(e) => handleChange('pump_1_noise_db', e.target.value)} className="bg-white/80" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 bg-slate-100 py-1 px-3 rounded-md inline-block">Bomba 2</h3>
            <div className="space-y-2">
              <Label className="text-slate-600">Tiempo ON (min)</Label>
              <Input type="number" step="0.1" value={data.pump_2_on_minutes} onChange={(e) => handleChange('pump_2_on_minutes', e.target.value)} className="bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Tiempo Reposo (min)</Label>
              <Input type="number" step="0.1" value={data.pump_2_rest_minutes} onChange={(e) => handleChange('pump_2_rest_minutes', e.target.value)} className="bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Ruido (dB)</Label>
              <Input placeholder="Ej. Normal" value={data.pump_2_noise_db} onChange={(e) => handleChange('pump_2_noise_db', e.target.value)} className="bg-white/80" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 bg-slate-100 py-1 px-3 rounded-md inline-block">Compresor (Opcional)</h3>
            <div className="space-y-2">
              <Label className="text-slate-600">Aceite</Label>
              <Input placeholder="OK / Nivel Bajo" value={data.compressor_oil} onChange={(e) => handleChange('compressor_oil', e.target.value)} className="bg-white/80" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600">Correa</Label>
              <Input placeholder="OK / Floja" value={data.compressor_belt} onChange={(e) => handleChange('compressor_belt', e.target.value)} className="bg-white/80" />
            </div>
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

export default Step11CiclosRuido;
