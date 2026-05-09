import React, { useState } from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { ArrowRight, ArrowLeft, Settings, ThermometerSun } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

const Step2Motors = () => {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const [activeTab, setActiveTab] = useState('motor_1');

  const handleChange = (motorKey, field, value) => {
    updateFormData(motorKey, field, value);
  };

  const renderMotorForm = (motorNum) => {
    const motorKey = `motor_${motorNum}_data`;
    const data = formData[motorKey];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {/* Consumo y Contactor */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-green-600" /> Consumo y Contactor
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">HP</Label>
              <Input type="number" step="0.1" placeholder="1.5"
                value={data.motor_hp} onChange={(e) => handleChange(motorKey, 'motor_hp', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">In (A nominal)</Label>
              <Input type="number" step="0.1" placeholder="7.2"
                value={data.amperage} onChange={(e) => handleChange(motorKey, 'amperage', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-slate-500 font-medium mb-2">Corrientes de Fase (A)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">R</Label>
                <Input type="number" step="0.1" placeholder="7.0" value={data.phase_r} onChange={(e) => handleChange(motorKey, 'phase_r', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">S</Label>
                <Input type="number" step="0.1" placeholder="7.1" value={data.phase_s} onChange={(e) => handleChange(motorKey, 'phase_s', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">T</Label>
                <Input type="number" step="0.1" placeholder="7.0" value={data.phase_t} onChange={(e) => handleChange(motorKey, 'phase_t', e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-500 font-medium mb-2">Contactor</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Bobina</Label>
                <Input placeholder="OK / Falla" value={data.bobina_value} onChange={(e) => handleChange(motorKey, 'bobina_value', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contactos</Label>
                <Input placeholder="OK / Falla" value={data.contactos_value} onChange={(e) => handleChange(motorKey, 'contactos_value', e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Datos Térmicos */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <ThermometerSun className="w-4 h-4 mr-2 text-red-500" /> Datos Térmicos
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Térmico Amp</Label>
              <Input type="number" step="0.1" placeholder="8.0"
                value={data.thermal_amp} onChange={(e) => handleChange(motorKey, 'thermal_amp', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`${motorKey}_nc`} 
                  checked={data.thermal_nc} 
                  onCheckedChange={(c) => handleChange(motorKey, 'thermal_nc', c)} 
                />
                <Label htmlFor={`${motorKey}_nc`} className="text-sm font-medium">N/C</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`${motorKey}_no`} 
                  checked={data.thermal_no} 
                  onCheckedChange={(c) => handleChange(motorKey, 'thermal_no', c)} 
                />
                <Label htmlFor={`${motorKey}_no`} className="text-sm font-medium">N/O</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Temperaturas */}
        <div className="bg-white/50 p-5 rounded-2xl border border-white/60 shadow-sm space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center">
            <ThermometerSun className="w-4 h-4 mr-2 text-orange-500" /> Temperaturas (°C)
          </h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Motor</Label>
              <Input type="number" step="0.1" placeholder="45"
                value={data.motor_temp} onChange={(e) => handleChange(motorKey, 'motor_temp', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Voluta</Label>
              <Input type="number" step="0.1" placeholder="50"
                value={data.voluta_temp} onChange={(e) => handleChange(motorKey, 'voluta_temp', e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Térmico</Label>
              <Input type="number" step="0.1" placeholder="40"
                value={data.thermal_temp} onChange={(e) => handleChange(motorKey, 'thermal_temp', e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-200/50 pb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold">Bloque de Potencia: Motores</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/40 p-1 rounded-xl mb-6">
          <TabsTrigger value="motor_1" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Motor 1</TabsTrigger>
          <TabsTrigger value="motor_2" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Motor 2</TabsTrigger>
          <TabsTrigger value="motor_3" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">Motor 3</TabsTrigger>
        </TabsList>
        <TabsContent value="motor_1">{renderMotorForm(1)}</TabsContent>
        <TabsContent value="motor_2">{renderMotorForm(2)}</TabsContent>
        <TabsContent value="motor_3">{renderMotorForm(3)}</TabsContent>
      </Tabs>

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

export default Step2Motors;
