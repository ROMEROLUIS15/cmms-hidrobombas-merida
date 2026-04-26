import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Settings, 
  Plus, 
  Search, 
  MapPin, 
  Calendar,
  Wrench,
  QrCode,
  FileText,
  Building2,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EquipmentList = ({ user }) => {
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    client_id: '',
    name: '',
    equipment_type: 'hydropneumatic',
    brand: '',
    model: '',
    serial_number: '',
    location: '',
    installation_date: '',
    specifications: {}
  });

  useEffect(() => {
    loadEquipmentAndClients();
  }, []);

  const loadEquipmentAndClients = async () => {
    try {
      setLoading(true);
      const [equipmentResponse, clientsResponse] = await Promise.all([
        axios.get(`${API}/equipment`),
        axios.get(`${API}/clients`)
      ]);
      setEquipment(equipmentResponse.data);
      setClients(clientsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    
    if (!newEquipment.client_id || !newEquipment.name || !newEquipment.location) {
      toast.error('Cliente, nombre y ubicación son requeridos');
      return;
    }
    
    setCreateLoading(true);
    
    try {
      const equipmentData = {
        ...newEquipment,
        installation_date: newEquipment.installation_date ? new Date(newEquipment.installation_date).toISOString() : null
      };
      
      const response = await axios.post(`${API}/equipment`, equipmentData);
      setEquipment([...equipment, response.data]);
      setNewEquipment({
        client_id: '',
        name: '',
        equipment_type: 'hydropneumatic',
        brand: '',
        model: '',
        serial_number: '',
        location: '',
        installation_date: '',
        specifications: {}
      });
      setIsCreateDialogOpen(false);
      toast.success('Equipo registrado exitosamente');
    } catch (error) {
      console.error('Error creating equipment:', error);
      const message = error.response?.data?.detail || 'Error al registrar el equipo';
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewEquipment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente desconocido';
  };

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.brand && eq.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (eq.model && eq.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    getClientName(eq.client_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEquipmentIcon = (type) => {
    switch (type) {
      case 'hydropneumatic':
        return <Wrench className="w-6 h-6 text-white" />;
      case 'pump':
        return <Zap className="w-6 h-6 text-white" />;
      default:
        return <Settings className="w-6 h-6 text-white" />;
    }
  };

  const getEquipmentTypeLabel = (type) => {
    const labels = {
      hydropneumatic: 'Hidroneumático',
      pump: 'Bomba',
      motor: 'Motor',
      control: 'Control'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check permissions
  const canManageEquipment = ['admin', 'supervisor', 'technician'].includes(user?.role);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in" data-testid="equipment-list">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-gradient">
            Gestión de Equipos
          </h1>
          <p className="text-slate-600">
            {user?.role === 'client' 
              ? 'Equipos registrados en tu cuenta'
              : 'Administra los equipos hidráulicos del sistema'
            }
          </p>
        </div>
        
        {canManageEquipment && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-equipment-button">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Equipo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]" data-testid="create-equipment-dialog">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Equipo</DialogTitle>
                <DialogDescription>
                  Ingresa la información del equipo hidráulico
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEquipment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Cliente *</Label>
                    <Select
                      value={newEquipment.client_id}
                      onValueChange={(value) => handleInputChange('client_id', value)}
                      data-testid="equipment-client-select"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipment_type">Tipo de Equipo</Label>
                    <Select
                      value={newEquipment.equipment_type}
                      onValueChange={(value) => handleInputChange('equipment_type', value)}
                      data-testid="equipment-type-select"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hydropneumatic">Hidroneumático</SelectItem>
                        <SelectItem value="pump">Bomba</SelectItem>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="control">Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Equipo *</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Sistema Principal A1"
                      value={newEquipment.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      data-testid="equipment-name-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación *</Label>
                    <Input
                      id="location"
                      placeholder="Ej: Edificio Principal, Sótano"
                      value={newEquipment.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                      data-testid="equipment-location-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      placeholder="Ej: Grundfos"
                      value={newEquipment.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      data-testid="equipment-brand-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      placeholder="Ej: CR64-3-1"
                      value={newEquipment.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      data-testid="equipment-model-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Número de Serie</Label>
                    <Input
                      id="serial_number"
                      placeholder="Ej: GF2023001"
                      value={newEquipment.serial_number}
                      onChange={(e) => handleInputChange('serial_number', e.target.value)}
                      data-testid="equipment-serial-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installation_date">Fecha de Instalación</Label>
                  <Input
                    id="installation_date"
                    type="date"
                    value={newEquipment.installation_date}
                    onChange={(e) => handleInputChange('installation_date', e.target.value)}
                    data-testid="equipment-installation-date-input"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="cancel-equipment-button"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={createLoading}
                    data-testid="submit-equipment-button"
                  >
                    {createLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registrando...
                      </div>
                    ) : (
                      'Registrar Equipo'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="equipment-search-input"
          />
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="equipment-grid">
          {filteredEquipment.map((eq) => (
            <Card key={eq.id} className="technical-card hover-card" data-testid={`equipment-card-${eq.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      {getEquipmentIcon(eq.equipment_type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-900 leading-tight">
                        {eq.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getEquipmentTypeLabel(eq.equipment_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <QrCode className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-mono">
                      {eq.qr_code.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Basic Information */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{getClientName(eq.client_id)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-2">{eq.location}</span>
                  </div>
                  
                  {(eq.brand || eq.model) && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{[eq.brand, eq.model].filter(Boolean).join(' - ')}</span>
                    </div>
                  )}
                  
                  {eq.serial_number && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <span className="text-slate-400 font-medium">S/N:</span>
                      <span className="font-mono">{eq.serial_number}</span>
                    </div>
                  )}
                </div>
                
                {/* Installation Date */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Instalado: {formatDate(eq.installation_date)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    {canManageEquipment && (
                      <Link to={`/service-form/${eq.id}`} className="flex-1">
                        <Button 
                          size="sm" 
                          className="w-full btn-primary text-xs"
                          data-testid={`new-service-${eq.id}`}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Nuevo Servicio
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`${canManageEquipment ? 'flex-1' : 'w-full'} text-xs`}
                      data-testid={`view-history-${eq.id}`}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Historial
                    </Button>
                  </div>
                  
                  {/* QR Code Action */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    data-testid={`view-qr-${eq.id}`}
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    Ver Código QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="no-equipment-message">
          {searchTerm ? (
            <>
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No se encontraron equipos
              </h3>
              <p className="text-slate-600 mb-4">
                No hay equipos que coincidan con "{searchTerm}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                data-testid="clear-equipment-search-button"
              >
                Limpiar búsqueda
              </Button>
            </>
          ) : (
            <>
              <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {user?.role === 'client' 
                  ? 'No tienes equipos registrados'
                  : 'No hay equipos registrados'
                }
              </h3>
              <p className="text-slate-600 mb-6">
                {user?.role === 'client'
                  ? 'Contacta a tu proveedor de mantenimiento para registrar tus equipos'
                  : 'Comienza registrando el primer equipo hidráulico'
                }
              </p>
              {canManageEquipment && (
                <Button 
                  className="btn-primary" 
                  onClick={() => setIsCreateDialogOpen(true)}
                  data-testid="create-first-equipment-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primer Equipo
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats Footer */}
      {equipment.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 rounded-lg" data-testid="equipment-stats">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Mostrando {filteredEquipment.length} de {equipment.length} equipos
            </span>
            <div className="flex items-center space-x-4">
              <span>
                Hidroneumáticos: {equipment.filter(eq => eq.equipment_type === 'hydropneumatic').length}
              </span>
              <span>
                Otros: {equipment.filter(eq => eq.equipment_type !== 'hydropneumatic').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;