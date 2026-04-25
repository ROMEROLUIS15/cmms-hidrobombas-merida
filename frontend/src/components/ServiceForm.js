import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { 
  FileText, 
  Zap, 
  Settings, 
  Wrench, 
  Save,
  ArrowLeft,
  Droplets,
  Gauge,
  ThermometerSun,
  Volume2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServiceForm = ({ user }) => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    client_id: '',
    equipment_id: equipmentId || '',
    visit_type: 'technical',
    observations: '',
    
    // Water/Energy data
    water_energy_data: {
      voltage_r_s: '',
      voltage_s_t: '',
      voltage_t_r: '',
      voltage_r_n: '',
      voltage_s_n: '',
      voltage_t_n: '',
      water_level: 'empty',
      volts_min: '',
      volts_max: '',
      time_1: '',
      time_2: '',
      float_contact_na: '',
      led_empty_tank: false
    },
    
    // Motor data (3 motors)
    motor_1_data: {
      motor_hp: '',
      amperage: '',
      resistance_coil: '',
      temperature_coil: '',
      contactor_working: false,
      thermal_amp: '',
      thermal_nc: false,
      thermal_no: false,
      motor_temp: '',
      coil_temp: '',
      thermal_temp: ''
    },
    
    motor_2_data: {
      motor_hp: '',
      amperage: '',
      resistance_coil: '',
      temperature_coil: '',
      contactor_working: false,
      thermal_amp: '',
      thermal_nc: false,
      thermal_no: false,
      motor_temp: '',
      coil_temp: '',
      thermal_temp: ''
    },
    
    motor_3_data: {
      motor_hp: '',
      amperage: '',
      resistance_coil: '',
      temperature_coil: '',
      contactor_working: false,
      thermal_amp: '',
      thermal_nc: false,
      thermal_no: false,
      motor_temp: '',
      coil_temp: '',
      thermal_temp: ''
    },
    
    // Control/Peripherals data
    control_peripherals_data: {
      breaker_tripolar_1: false,
      breaker_tripolar_2: false,
      breaker_tripolar_3: false,
      breaker_control: false,
      relay_alternator: false,
      preset_work: false,
      preset_emergency: false,
      preset_compressor: false,
      electrode_level: false,
      valve_level: false,
      safety_valve: false,
      manometer: '',
      work_pressure: '',
      emergency_pressure: '',
      compressor_oil: '',
      compressor_belt: '',
      pilot_lights: false,
      switches: false,
      timer: false,
      valve_vents: false,
      pump_1_on_minutes: '',
      pump_1_rest_minutes: '',
      pump_2_on_minutes: '',
      pump_2_rest_minutes: '',
      pump_1_noise_db: '',
      pump_2_noise_db: ''
    }
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (equipmentId) {
      loadEquipmentDetails(equipmentId);
    }
  }, [equipmentId]);

  const loadInitialData = async () => {
    try {
      const [clientsResponse, equipmentResponse] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/equipment`)
      ]);
      
      setClients(clientsResponse.data);
      setEquipment(equipmentResponse.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos iniciales');
    }
  };

  const loadEquipmentDetails = async (id) => {
    try {
      const response = await axios.get(`${API}/equipment/${id}`);
      const eq = response.data;
      setSelectedEquipment(eq);
      setFormData(prev => ({
        ...prev,
        client_id: eq.client_id,
        equipment_id: id
      }));
    } catch (error) {
      console.error('Error loading equipment details:', error);
      toast.error('Error al cargar detalles del equipo');
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEquipmentSelect = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (eq) {
      setSelectedEquipment(eq);
      setFormData(prev => ({
        ...prev,
        client_id: eq.client_id,
        equipment_id: equipmentId
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.equipment_id) {
      toast.error('Por favor selecciona cliente y equipo');
      return;
    }
    
    setLoading(true);
    
    try {
      // Clean empty values and convert strings to numbers where needed
      const cleanData = {
        ...formData,
        water_energy_data: cleanNumericFields(formData.water_energy_data),
        motor_1_data: cleanNumericFields(formData.motor_1_data),
        motor_2_data: cleanNumericFields(formData.motor_2_data),
        motor_3_data: cleanNumericFields(formData.motor_3_data),
        control_peripherals_data: cleanNumericFields(formData.control_peripherals_data)
      };
      
      await axios.post(`${API}/service-reports`, cleanData);
      toast.success('Reporte de servicio creado exitosamente');
      navigate('/reports');
    } catch (error) {
      console.error('Error creating service report:', error);
      toast.error('Error al crear el reporte de servicio');
    } finally {
      setLoading(false);
    }
  };

  const cleanNumericFields = (data) => {
    const cleaned = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string' && value.trim() === '') {
        cleaned[key] = null;
      } else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        cleaned[key] = parseFloat(value);
      } else {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente desconocido';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in" data-testid="service-form">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Nuevo Reporte de Servicio
            </h1>
            <p className="text-slate-600">
              Formulario digital para mantenimiento hidroneumático
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <Card className="form-section" data-testid="general-info-section">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Información General
            </CardTitle>
            <CardDescription>
              Datos básicos del servicio y equipo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipo *</Label>
                <Select
                  value={formData.equipment_id}
                  onValueChange={(value) => handleEquipmentSelect(value)}
                  data-testid="equipment-select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} - {eq.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visit_type">Tipo de Visita *</Label>
                <Select
                  value={formData.visit_type}
                  onValueChange={(value) => handleInputChange(null, 'visit_type', value)}
                  data-testid="visit-type-select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Técnica</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="eventual">Eventual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedEquipment && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Equipo Seleccionado</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Cliente:</span>
                    <p className="text-blue-600">{getClientName(selectedEquipment.client_id)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Equipo:</span>
                    <p className="text-blue-600">{selectedEquipment.name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Ubicación:</span>
                    <p className="text-blue-600">{selectedEquipment.location}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Data Tabs */}
        <Card className="form-section" data-testid="technical-data-section">
          <CardHeader>
            <CardTitle>Datos Técnicos del Mantenimiento</CardTitle>
            <CardDescription>
              Registra todas las mediciones y observaciones técnicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="water-energy" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="water-energy" className="flex items-center space-x-2" data-testid="water-energy-tab">
                  <Droplets className="w-4 h-4" />
                  <span className="hidden sm:inline">Agua/Energía</span>
                </TabsTrigger>
                <TabsTrigger value="motor-1" className="flex items-center space-x-2" data-testid="motor-1-tab">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Motor 1</span>
                </TabsTrigger>
                <TabsTrigger value="motor-2" className="flex items-center space-x-2" data-testid="motor-2-tab">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Motor 2</span>
                </TabsTrigger>
                <TabsTrigger value="motor-3" className="flex items-center space-x-2" data-testid="motor-3-tab">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Motor 3</span>
                </TabsTrigger>
                <TabsTrigger value="control" className="flex items-center space-x-2" data-testid="control-tab">
                  <Wrench className="w-4 h-4" />
                  <span className="hidden sm:inline">Control</span>
                </TabsTrigger>
              </TabsList>

              {/* Water/Energy Tab */}
              <TabsContent value="water-energy" className="space-y-6" data-testid="water-energy-content">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Voltage Measurements */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                      Voltaje de Red
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="voltage_r_s" className="text-sm">Fase R-S (V)</Label>
                          <Input
                            id="voltage_r_s"
                            type="number"
                            step="0.1"
                            placeholder="220"
                            value={formData.water_energy_data.voltage_r_s}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_r_s', e.target.value)}
                            data-testid="voltage-r-s-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="voltage_r_n" className="text-sm">Fase R-N (V)</Label>
                          <Input
                            id="voltage_r_n"
                            type="number"
                            step="0.1"
                            placeholder="127"
                            value={formData.water_energy_data.voltage_r_n}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_r_n', e.target.value)}
                            data-testid="voltage-r-n-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="voltage_s_t" className="text-sm">Fase S-T (V)</Label>
                          <Input
                            id="voltage_s_t"
                            type="number"
                            step="0.1"
                            placeholder="220"
                            value={formData.water_energy_data.voltage_s_t}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_s_t', e.target.value)}
                            data-testid="voltage-s-t-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="voltage_s_n" className="text-sm">Fase S-N (V)</Label>
                          <Input
                            id="voltage_s_n"
                            type="number"
                            step="0.1"
                            placeholder="127"
                            value={formData.water_energy_data.voltage_s_n}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_s_n', e.target.value)}
                            data-testid="voltage-s-n-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="voltage_t_r" className="text-sm">Fase T-R (V)</Label>
                          <Input
                            id="voltage_t_r"
                            type="number"
                            step="0.1"
                            placeholder="220"
                            value={formData.water_energy_data.voltage_t_r}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_t_r', e.target.value)}
                            data-testid="voltage-t-r-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="voltage_t_n" className="text-sm">Fase T-N (V)</Label>
                          <Input
                            id="voltage_t_n"
                            type="number"
                            step="0.1"
                            placeholder="127"
                            value={formData.water_energy_data.voltage_t_n}
                            onChange={(e) => handleInputChange('water_energy_data', 'voltage_t_n', e.target.value)}
                            data-testid="voltage-t-n-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Water Level */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Droplets className="w-4 h-4 mr-2 text-blue-600" />
                      Nivel de Agua
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="water_level">Estado del Tanque</Label>
                        <Select
                          value={formData.water_energy_data.water_level}
                          onValueChange={(value) => handleInputChange('water_energy_data', 'water_level', value)}
                          data-testid="water-level-select"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Lleno</SelectItem>
                            <SelectItem value="medium">Medio</SelectItem>
                            <SelectItem value="empty">Vacío</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="float_contact_na" className="text-sm">Contacto Flotante N/A</Label>
                        <Input
                          id="float_contact_na"
                          placeholder="Estado del contacto"
                          value={formData.water_energy_data.float_contact_na}
                          onChange={(e) => handleInputChange('water_energy_data', 'float_contact_na', e.target.value)}
                          data-testid="float-contact-input"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="led_empty_tank"
                          checked={formData.water_energy_data.led_empty_tank}
                          onCheckedChange={(checked) => handleInputChange('water_energy_data', 'led_empty_tank', checked)}
                          data-testid="led-empty-tank-checkbox"
                        />
                        <Label htmlFor="led_empty_tank" className="text-sm">LED Tanque Vacío</Label>
                      </div>
                    </div>
                  </div>

                  {/* Voltage Supervisor */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Gauge className="w-4 h-4 mr-2 text-purple-600" />
                      Supervisor de Voltaje
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="volts_min" className="text-sm">Volts Mínimo</Label>
                          <Input
                            id="volts_min"
                            type="number"
                            step="0.1"
                            placeholder="180"
                            value={formData.water_energy_data.volts_min}
                            onChange={(e) => handleInputChange('water_energy_data', 'volts_min', e.target.value)}
                            data-testid="volts-min-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="volts_max" className="text-sm">Volts Máximo</Label>
                          <Input
                            id="volts_max"
                            type="number"
                            step="0.1"
                            placeholder="250"
                            value={formData.water_energy_data.volts_max}
                            onChange={(e) => handleInputChange('water_energy_data', 'volts_max', e.target.value)}
                            data-testid="volts-max-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="time_1" className="text-sm">Tiempo 1 (seg)</Label>
                          <Input
                            id="time_1"
                            type="number"
                            step="0.1"
                            placeholder="5"
                            value={formData.water_energy_data.time_1}
                            onChange={(e) => handleInputChange('water_energy_data', 'time_1', e.target.value)}
                            data-testid="time-1-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="time_2" className="text-sm">Tiempo 2 (seg)</Label>
                          <Input
                            id="time_2"
                            type="number"
                            step="0.1"
                            placeholder="10"
                            value={formData.water_energy_data.time_2}
                            onChange={(e) => handleInputChange('water_energy_data', 'time_2', e.target.value)}
                            data-testid="time-2-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Motor Tabs (1, 2, 3) */}
              {[1, 2, 3].map(motorNum => (
                <TabsContent key={motorNum} value={`motor-${motorNum}`} className="space-y-6" data-testid={`motor-${motorNum}-content`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Motor Basic Data */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-green-600" />
                        Motor {motorNum} - Datos Básicos
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`motor_${motorNum}_hp`} className="text-sm">HP del Motor</Label>
                          <Input
                            id={`motor_${motorNum}_hp`}
                            type="number"
                            step="0.1"
                            placeholder="1.5"
                            value={formData[`motor_${motorNum}_data`].motor_hp}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'motor_hp', e.target.value)}
                            data-testid={`motor-${motorNum}-hp-input`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`motor_${motorNum}_amperage`} className="text-sm">Amperaje (A)</Label>
                          <Input
                            id={`motor_${motorNum}_amperage`}
                            type="number"
                            step="0.1"
                            placeholder="7.2"
                            value={formData[`motor_${motorNum}_data`].amperage}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'amperage', e.target.value)}
                            data-testid={`motor-${motorNum}-amperage-input`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`motor_${motorNum}_resistance`} className="text-sm">Resistencia Bobina (Ω)</Label>
                          <Input
                            id={`motor_${motorNum}_resistance`}
                            type="number"
                            step="0.1"
                            placeholder="5.5"
                            value={formData[`motor_${motorNum}_data`].resistance_coil}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'resistance_coil', e.target.value)}
                            data-testid={`motor-${motorNum}-resistance-input`}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`motor_${motorNum}_contactor`}
                            checked={formData[`motor_${motorNum}_data`].contactor_working}
                            onCheckedChange={(checked) => handleInputChange(`motor_${motorNum}_data`, 'contactor_working', checked)}
                            data-testid={`motor-${motorNum}-contactor-checkbox`}
                          />
                          <Label htmlFor={`motor_${motorNum}_contactor`} className="text-sm">Contactor Funcionando</Label>
                        </div>
                      </div>
                    </div>

                    {/* Thermal Data */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 flex items-center">
                        <ThermometerSun className="w-4 h-4 mr-2 text-red-600" />
                        Datos Térmicos
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`motor_${motorNum}_thermal_amp`} className="text-sm">Térmico Amp</Label>
                          <Input
                            id={`motor_${motorNum}_thermal_amp`}
                            type="number"
                            step="0.1"
                            placeholder="8.0"
                            value={formData[`motor_${motorNum}_data`].thermal_amp}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'thermal_amp', e.target.value)}
                            data-testid={`motor-${motorNum}-thermal-amp-input`}
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`motor_${motorNum}_thermal_nc`}
                              checked={formData[`motor_${motorNum}_data`].thermal_nc}
                              onCheckedChange={(checked) => handleInputChange(`motor_${motorNum}_data`, 'thermal_nc', checked)}
                              data-testid={`motor-${motorNum}-thermal-nc-checkbox`}
                            />
                            <Label htmlFor={`motor_${motorNum}_thermal_nc`} className="text-sm">N/C</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`motor_${motorNum}_thermal_no`}
                              checked={formData[`motor_${motorNum}_data`].thermal_no}
                              onCheckedChange={(checked) => handleInputChange(`motor_${motorNum}_data`, 'thermal_no', checked)}
                              data-testid={`motor-${motorNum}-thermal-no-checkbox`}
                            />
                            <Label htmlFor={`motor_${motorNum}_thermal_no`} className="text-sm">N/O</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Temperature Measurements */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 flex items-center">
                        <ThermometerSun className="w-4 h-4 mr-2 text-orange-600" />
                        Temperaturas (°C)
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`motor_${motorNum}_motor_temp`} className="text-sm">Temperatura Motor</Label>
                          <Input
                            id={`motor_${motorNum}_motor_temp`}
                            type="number"
                            step="0.1"
                            placeholder="45"
                            value={formData[`motor_${motorNum}_data`].motor_temp}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'motor_temp', e.target.value)}
                            data-testid={`motor-${motorNum}-motor-temp-input`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`motor_${motorNum}_coil_temp`} className="text-sm">Temperatura Bobina</Label>
                          <Input
                            id={`motor_${motorNum}_coil_temp`}
                            type="number"
                            step="0.1"
                            placeholder="50"
                            value={formData[`motor_${motorNum}_data`].coil_temp}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'coil_temp', e.target.value)}
                            data-testid={`motor-${motorNum}-coil-temp-input`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`motor_${motorNum}_thermal_temp`} className="text-sm">Temperatura Térmico</Label>
                          <Input
                            id={`motor_${motorNum}_thermal_temp`}
                            type="number"
                            step="0.1"
                            placeholder="40"
                            value={formData[`motor_${motorNum}_data`].thermal_temp}
                            onChange={(e) => handleInputChange(`motor_${motorNum}_data`, 'thermal_temp', e.target.value)}
                            data-testid={`motor-${motorNum}-thermal-temp-input`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}

              {/* Control/Peripherals Tab */}
              <TabsContent value="control" className="space-y-6" data-testid="control-content">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Breakers */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                      Breakers
                    </h4>
                    <div className="space-y-3">
                      {[1, 2, 3].map(num => (
                        <div key={num} className="flex items-center space-x-2">
                          <Checkbox
                            id={`breaker_tripolar_${num}`}
                            checked={formData.control_peripherals_data[`breaker_tripolar_${num}`]}
                            onCheckedChange={(checked) => handleInputChange('control_peripherals_data', `breaker_tripolar_${num}`, checked)}
                            data-testid={`breaker-tripolar-${num}-checkbox`}
                          />
                          <Label htmlFor={`breaker_tripolar_${num}`} className="text-sm">Breaker Tripolar {num}</Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="breaker_control"
                          checked={formData.control_peripherals_data.breaker_control}
                          onCheckedChange={(checked) => handleInputChange('control_peripherals_data', 'breaker_control', checked)}
                          data-testid="breaker-control-checkbox"
                        />
                        <Label htmlFor="breaker_control" className="text-sm">Breaker Control</Label>
                      </div>
                    </div>
                  </div>

                  {/* Pressures */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Gauge className="w-4 h-4 mr-2 text-purple-600" />
                      Presiones (PSI)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="manometer" className="text-sm">Manómetro</Label>
                        <Input
                          id="manometer"
                          type="number"
                          step="0.1"
                          placeholder="40"
                          value={formData.control_peripherals_data.manometer}
                          onChange={(e) => handleInputChange('control_peripherals_data', 'manometer', e.target.value)}
                          data-testid="manometer-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work_pressure" className="text-sm">Presión Trabajo</Label>
                        <Input
                          id="work_pressure"
                          type="number"
                          step="0.1"
                          placeholder="30"
                          value={formData.control_peripherals_data.work_pressure}
                          onChange={(e) => handleInputChange('control_peripherals_data', 'work_pressure', e.target.value)}
                          data-testid="work-pressure-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_pressure" className="text-sm">Presión Emergencia</Label>
                        <Input
                          id="emergency_pressure"
                          type="number"
                          step="0.1"
                          placeholder="50"
                          value={formData.control_peripherals_data.emergency_pressure}
                          onChange={(e) => handleInputChange('control_peripherals_data', 'emergency_pressure', e.target.value)}
                          data-testid="emergency-pressure-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pump Cycles and Noise */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center">
                      <Volume2 className="w-4 h-4 mr-2 text-green-600" />
                      Ciclos y Ruido
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="pump_1_on" className="text-sm">Bomba 1 On (min)</Label>
                          <Input
                            id="pump_1_on"
                            type="number"
                            step="0.1"
                            placeholder="15"
                            value={formData.control_peripherals_data.pump_1_on_minutes}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_1_on_minutes', e.target.value)}
                            data-testid="pump-1-on-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pump_1_rest" className="text-sm">Bomba 1 Reposo (min)</Label>
                          <Input
                            id="pump_1_rest"
                            type="number"
                            step="0.1"
                            placeholder="45"
                            value={formData.control_peripherals_data.pump_1_rest_minutes}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_1_rest_minutes', e.target.value)}
                            data-testid="pump-1-rest-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="pump_2_on" className="text-sm">Bomba 2 On (min)</Label>
                          <Input
                            id="pump_2_on"
                            type="number"
                            step="0.1"
                            placeholder="15"
                            value={formData.control_peripherals_data.pump_2_on_minutes}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_2_on_minutes', e.target.value)}
                            data-testid="pump-2-on-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pump_2_rest" className="text-sm">Bomba 2 Reposo (min)</Label>
                          <Input
                            id="pump_2_rest"
                            type="number"
                            step="0.1"
                            placeholder="45"
                            value={formData.control_peripherals_data.pump_2_rest_minutes}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_2_rest_minutes', e.target.value)}
                            data-testid="pump-2-rest-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="pump_1_noise" className="text-sm">Ruido Bomba 1 (dB)</Label>
                          <Input
                            id="pump_1_noise"
                            type="number"
                            step="0.1"
                            placeholder="65"
                            value={formData.control_peripherals_data.pump_1_noise_db}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_1_noise_db', e.target.value)}
                            data-testid="pump-1-noise-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pump_2_noise" className="text-sm">Ruido Bomba 2 (dB)</Label>
                          <Input
                            id="pump_2_noise"
                            type="number"
                            step="0.1"
                            placeholder="65"
                            value={formData.control_peripherals_data.pump_2_noise_db}
                            onChange={(e) => handleInputChange('control_peripherals_data', 'pump_2_noise_db', e.target.value)}
                            data-testid="pump-2-noise-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Observations */}
        <Card className="form-section" data-testid="observations-section">
          <CardHeader>
            <CardTitle>Observaciones Técnicas</CardTitle>
            <CardDescription>
              Notas adicionales, anomalías encontradas, recomendaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Detalles del mantenimiento realizado, componentes revisados, anomalías encontradas, recomendaciones para el cliente..."
              value={formData.observations}
              onChange={(e) => handleInputChange(null, 'observations', e.target.value)}
              className="min-h-[120px] resize-none"
              data-testid="observations-textarea"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
            data-testid="cancel-button"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !formData.client_id || !formData.equipment_id}
            data-testid="submit-report-button"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Guardar Reporte
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;