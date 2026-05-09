import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react';

const Step1VoltajeRed = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.water_energy_data;

  const handleChange = (field, value) => updateFormData('water_energy_data', field, value);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-amber-100 p-2 rounded-lg">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Servicios</p>
          <h2 className="text-xl font-bold">Voltaje de Red</h2>
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase R-S (V)</Label>
            <Input type="number" step="0.1" placeholder="220" value={data.voltage_r_s} onChange={(e) => handleChange('voltage_r_s', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase R-N (V)</Label>
            <Input type="number" step="0.1" placeholder="127" value={data.voltage_r_n} onChange={(e) => handleChange('voltage_r_n', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase S-T (V)</Label>
            <Input type="number" step="0.1" placeholder="220" value={data.voltage_s_t} onChange={(e) => handleChange('voltage_s_t', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase S-N (V)</Label>
            <Input type="number" step="0.1" placeholder="127" value={data.voltage_s_n} onChange={(e) => handleChange('voltage_s_n', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase T-R (V)</Label>
            <Input type="number" step="0.1" placeholder="220" value={data.voltage_t_r} onChange={(e) => handleChange('voltage_t_r', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">Fase T-N (V)</Label>
            <Input type="number" step="0.1" placeholder="127" value={data.voltage_t_n} onChange={(e) => handleChange('voltage_t_n', e.target.value)} className="bg-white/80" />
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

export default Step1VoltajeRed;
