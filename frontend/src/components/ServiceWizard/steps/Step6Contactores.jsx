import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Settings } from 'lucide-react';

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
            <Input placeholder="OK / Falla" value={data.bobina_value} onChange={(e) => handleChange(num, 'bobina_value', e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-900 font-bold sm:hidden">Contactos</Label>
            <Input placeholder="OK / Falla" value={data.contactos_value} onChange={(e) => handleChange(num, 'contactos_value', e.target.value)} className="bg-white/80" />
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

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/50">
        <Button variant="outline" onClick={prevStep} className="bg-white hover:bg-slate-50"><ArrowLeft className="w-4 h-4 mr-2" /> Atrás</Button>
        <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">Siguiente <ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};

export default Step6Contactores;
