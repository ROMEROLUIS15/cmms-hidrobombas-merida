import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Wrench, Gauge, Volume2 } from 'lucide-react';

const Step3Peripherals = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.control_peripherals_data;

  const handleChange = (field, value) => {
    updateFormData('control_peripherals_data', field, value);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-200/50 pb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Wrench className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold">Bloque de Control y Periféricos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Breakers / Relés */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Wrench className="w-4 h-4 mr-2 text-blue-600" /> Breakers y Relés
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3].map(num => (
                <div key={num} className="space-y-1">
                  <Label className="text-xs text-slate-500">Breaker Tri {num}</Label>
                  <Input placeholder="OK / Falla" value={data[`breaker_tripolar_${num}`]} onChange={(e) => handleChange(`breaker_tripolar_${num}`, e.target.value)} className="bg-white text-sm" />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Breaker Ctrl</Label>
                <Input placeholder="OK / Falla" value={data.breaker_control} onChange={(e) => handleChange('breaker_control', e.target.value)} className="bg-white text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Relé Alternador</Label>
              <Input placeholder="OK / Falla" value={data.relay_alternator} onChange={(e) => handleChange('relay_alternator', e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Relé Control Nivel</Label>
              <Input placeholder="OK / Falla" value={data.relay_control_level} onChange={(e) => handleChange('relay_control_level', e.target.value)} className="bg-white" />
            </div>
          </div>
        </div>

        {/* Presiones / Válvulas */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Gauge className="w-4 h-4 mr-2 text-purple-600" /> Presiones y Válvulas
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Manómetro</Label>
                <Input placeholder="PSI" value={data.manometer} onChange={(e) => handleChange('manometer', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Válvula Seg</Label>
                <Input placeholder="Estado" value={data.safety_valve} onChange={(e) => handleChange('safety_valve', e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Presión ON</Label>
                <Input placeholder="PSI" value={data.pressure_on} onChange={(e) => handleChange('pressure_on', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Presión OFF</Label>
                <Input placeholder="PSI" value={data.pressure_off} onChange={(e) => handleChange('pressure_off', e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Electrodos C/Nivel</Label>
              <Input placeholder="Estado" value={data.electrode_level} onChange={(e) => handleChange('electrode_level', e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Válvula/Tubo Nivel</Label>
              <Input placeholder="Estado" value={data.valve_level} onChange={(e) => handleChange('valve_level', e.target.value)} className="bg-white" />
            </div>
          </div>
        </div>

        {/* Ciclos y Compresor */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Volume2 className="w-4 h-4 mr-2 text-green-600" /> Ciclos y Ruido
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Bomba 1 ON (min)</Label>
                <Input type="number" step="0.1" value={data.pump_1_on_minutes} onChange={(e) => handleChange('pump_1_on_minutes', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Bomba 1 Reposo</Label>
                <Input type="number" step="0.1" value={data.pump_1_rest_minutes} onChange={(e) => handleChange('pump_1_rest_minutes', e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Bomba 2 ON (min)</Label>
                <Input type="number" step="0.1" value={data.pump_2_on_minutes} onChange={(e) => handleChange('pump_2_on_minutes', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Bomba 2 Reposo</Label>
                <Input type="number" step="0.1" value={data.pump_2_rest_minutes} onChange={(e) => handleChange('pump_2_rest_minutes', e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Ruido Bomba 1</Label>
                <Input placeholder="dB / Nivel" value={data.pump_1_noise_db} onChange={(e) => handleChange('pump_1_noise_db', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Ruido Bomba 2</Label>
                <Input placeholder="dB / Nivel" value={data.pump_2_noise_db} onChange={(e) => handleChange('pump_2_noise_db', e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/50">
        <Button variant="outline" onClick={prevStep} className="bg-white hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
        </Button>
        <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
          Siguiente <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step3Peripherals;
