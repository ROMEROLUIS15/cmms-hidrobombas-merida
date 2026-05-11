import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, ThermometerSun } from 'lucide-react';

const Step8Temperaturas = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();

  const handleChange = (motorNum, field, value) => updateFormData(`motor_${motorNum}_data`, field, value);

  const renderMotorRow = (num) => {
    const data = formData[`motor_${num}_data`];
    return (
      <div key={num} className="bg-white/40 sm:bg-transparent p-4 sm:p-0 rounded-xl mb-6 sm:mb-4">
        <div className="font-semibold text-white bg-slate-900 py-2 px-4 rounded-md text-center mb-4 sm:hidden">
          Motor {num}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="hidden sm:block font-semibold text-white bg-slate-900 py-2 px-4 rounded-md text-center">
            M{num}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">T° Motor (°C)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 45" value={data.motor_temp} onChange={(e) => handleChange(num, 'motor_temp', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">T° Voluta (°C)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 50" value={data.voluta_temp} onChange={(e) => handleChange(num, 'voluta_temp', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">T° Térmico (°C)</Label>
            <Input type="number" step="0.1" placeholder="Ej. 40" value={data.thermal_temp} onChange={(e) => handleChange(num, 'thermal_temp', e.target.value)} className="bg-white/80" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-orange-100 p-2 rounded-lg">
          <ThermometerSun className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque de Potencia</p>
          <h2 className="text-xl font-bold">Temperaturas (°C)</h2>
        </div>
      </div>

      <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="hidden sm:grid grid-cols-4 gap-4 mb-4 px-2">
          <div className="text-xs font-bold text-slate-900 text-center">Equipo</div>
          <div className="text-xs font-bold text-slate-900">T° Motor</div>
          <div className="text-xs font-bold text-slate-900">T° Voluta</div>
          <div className="text-xs font-bold text-slate-900">T° Térmico</div>
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

export default Step8Temperaturas;
