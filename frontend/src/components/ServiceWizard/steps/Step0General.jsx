import React, { useEffect, useState } from 'react';
import { useWizard } from '../WizardContext';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const Step0General = () => {
  const { formData, updateFormData, nextStep } = useWizard();
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eqRes, clRes] = await Promise.all([
          axios.get(`${API}/equipment`),
          axios.get(`${API}/clients`)
        ]);
        setEquipment(eqRes.data?.data || eqRes.data || []);
        setClients(clRes.data?.data || clRes.data || []);
      } catch (error) {
        console.error('Error loading initial data:', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEquipmentChange = (val) => {
    updateFormData(null, 'equipment_id', val);
    const eq = equipment.find(e => e.id === val);
    if (eq && (eq.clientId || eq.client_id)) {
      updateFormData(null, 'client_id', eq.clientId || eq.client_id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold">Información General</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
        
        <div className="space-y-2">
          <Label htmlFor="client" className="text-slate-900 font-bold text-sm">Cliente *</Label>
          <Select 
            value={formData.client_id} 
            onValueChange={(val) => {
              updateFormData(null, 'client_id', val);
              updateFormData(null, 'equipment_id', ''); // Reset equipment when client changes
            }} 
            disabled={loading}
          >
            <SelectTrigger className="bg-white/80 backdrop-blur border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder={loading ? 'Cargando...' : 'Seleccionar cliente...'} />
            </SelectTrigger>
            <SelectContent>
              {clients.map(cl => (
                <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipment" className="text-slate-900 font-bold text-sm">Equipo a Evaluar *</Label>
          <Select 
            value={formData.equipment_id} 
            onValueChange={handleEquipmentChange} 
            disabled={loading || !formData.client_id}
          >
            <SelectTrigger className="bg-white/80 backdrop-blur border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder={!formData.client_id ? 'Primero seleccione un cliente...' : (loading ? 'Cargando...' : 'Seleccionar equipo...')} />
            </SelectTrigger>
            <SelectContent>
              {equipment
                .filter(eq => eq.clientId === formData.client_id || eq.client_id === formData.client_id)
                .map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visit_type" className="text-slate-900 font-bold text-sm">Tipo de Visita *</Label>
          <Select value={formData.visit_type} onValueChange={(v) => updateFormData(null, 'visit_type', v)}>
            <SelectTrigger className="bg-white/80 backdrop-blur border-slate-200">
              <SelectValue placeholder="Seleccionar tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="eventual">Eventual</SelectItem>
              <SelectItem value="technical">Técnica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_name" className="text-slate-900 font-bold text-sm">Sistema / Instalación</Label>
          <Input id="system_name" placeholder="Ej: Sistema Hidroneumático..." value={formData.system_name} onChange={(e) => updateFormData(null, 'system_name', e.target.value)} className="bg-white/80 backdrop-blur border-slate-200" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="report_date" className="text-slate-900 font-bold text-sm">Fecha del Reporte *</Label>
          <Input id="report_date" type="date" value={formData.report_date} onChange={(e) => updateFormData(null, 'report_date', e.target.value)} className="bg-white/80 backdrop-blur border-slate-200 w-full md:w-1/2" />
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-6 border-t border-slate-200/50">
        <Button onClick={nextStep} disabled={!formData.equipment_id} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105">
          Siguiente <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step0General;
