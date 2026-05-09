import React from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { ArrowRight, ArrowLeft, Droplets, Zap, Gauge } from 'lucide-react';

const Step1EnergyWater = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const data = formData.water_energy_data;

  const handleChange = (field, value) => {
    updateFormData('water_energy_data', field, value);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-200/50 pb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Droplets className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold">Bloque de Servicios: Agua y Energía</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Voltaje de Red */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amber-500" /> Voltaje de Red
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase R-S (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="220" 
                value={data.voltage_r_s} onChange={(e) => handleChange('voltage_r_s', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase R-N (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="127" 
                value={data.voltage_r_n} onChange={(e) => handleChange('voltage_r_n', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase S-T (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="220" 
                value={data.voltage_s_t} onChange={(e) => handleChange('voltage_s_t', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase S-N (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="127" 
                value={data.voltage_s_n} onChange={(e) => handleChange('voltage_s_n', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase T-R (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="220" 
                value={data.voltage_t_r} onChange={(e) => handleChange('voltage_t_r', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Fase T-N (V)</Label>
              <Input 
                type="number" step="0.1" placeholder="127" 
                value={data.voltage_t_n} onChange={(e) => handleChange('voltage_t_n', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Nivel de Agua */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Droplets className="w-4 h-4 mr-2 text-cyan-600" /> Nivel de Agua
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Estado del Tanque</Label>
              <Select value={data.water_level} onValueChange={(v) => handleChange('water_level', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Lleno</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="empty">Vacío</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Contacto Flotante N/A #1</Label>
              <Input 
                placeholder="OK / Falla" 
                value={data.float_contact_na} onChange={(e) => handleChange('float_contact_na', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Contacto Flotante N/A #2</Label>
              <Input 
                placeholder="OK / Falla" 
                value={data.float_contact_na_2} onChange={(e) => handleChange('float_contact_na_2', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">LED Tanque Vacío</Label>
              <Input 
                placeholder="OK / Falla" 
                value={data.led_empty_tank === true ? 'OK' : data.led_empty_tank === false ? '' : data.led_empty_tank} 
                onChange={(e) => handleChange('led_empty_tank', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Supervisor de Voltaje */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Gauge className="w-4 h-4 mr-2 text-purple-600" /> Supervisor de Voltaje
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Volts Mínimo</Label>
              <Input 
                type="number" step="0.1" placeholder="180" 
                value={data.volts_min} onChange={(e) => handleChange('volts_min', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Volts Máximo</Label>
              <Input 
                type="number" step="0.1" placeholder="250" 
                value={data.volts_max} onChange={(e) => handleChange('volts_max', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Tiempo 1 (seg)</Label>
              <Input 
                type="number" step="0.1" placeholder="5" 
                value={data.time_1} onChange={(e) => handleChange('time_1', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Tiempo 2 (seg)</Label>
              <Input 
                type="number" step="0.1" placeholder="10" 
                value={data.time_2} onChange={(e) => handleChange('time_2', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-slate-200/50">
        <Button 
          variant="outline" 
          onClick={prevStep}
          className="bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
        </Button>
        <Button 
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
        >
          Siguiente <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step1EnergyWater;
