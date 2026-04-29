import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Calendar,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientList = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    contact_person: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/clients`);
      setClients(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    
    if (!newClient.name || !newClient.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    
    setCreateLoading(true);
    
    try {
      const response = await axios.post(`${API}/clients`, newClient);
      const createdClient = response.data?.data || response.data;
      setClients([...clients, createdClient]);
      setNewClient({
        name: '',
        address: '',
        phone: '',
        email: '',
        contact_person: ''
      });
      setIsCreateDialogOpen(false);
      toast.success('Cliente creado exitosamente');
    } catch (error) {
      console.error('Error creating client:', error);
      const message = error.response?.data?.detail || 'Error al crear el cliente';
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check permissions
  const canCreateClients = ['admin', 'supervisor'].includes(user?.role);

  if (!canCreateClients) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-slate-600">
            No tienes permisos para acceder a la gestión de clientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in" data-testid="client-list">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Clientes
          </h1>
          <p className="text-slate-600">
            Administra la información de tus clientes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="create-client-button">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" data-testid="create-client-dialog">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingresa la información del nuevo cliente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Empresa *</Label>
                  <Input
                    id="name"
                    placeholder="Empresa ABC S.A."
                    value={newClient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    data-testid="client-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Persona de Contacto</Label>
                  <Input
                    id="contact_person"
                    placeholder="Juan Pérez"
                    value={newClient.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    data-testid="contact-person-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle Principal #123, Ciudad"
                  value={newClient.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  data-testid="address-input"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 890"
                    value={newClient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    data-testid="phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={newClient.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="cancel-create-button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={createLoading}
                  data-testid="submit-create-button"
                >
                  {createLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </div>
                  ) : (
                    'Crear Cliente'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="clients-grid">
          {filteredClients.map((client) => (
            <Card key={client.id} className="technical-card hover-card" data-testid={`client-card-${client.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-900 leading-tight">
                        {client.name}
                      </CardTitle>
                      {client.contact_person && (
                        <CardDescription className="flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {client.contact_person}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  {client.address && (
                    <div className="flex items-start space-x-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                </div>
                
                {/* Meta Information */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Creado {formatDate(client.created_at)}</span>
                    </div>
                    <span className="status-active">
                      Activo
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="pt-3">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      data-testid={`view-equipment-${client.id}`}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Ver Equipos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      data-testid={`view-reports-${client.id}`}
                    >
                      <Building2 className="w-3 h-3 mr-1" />
                      Reportes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="no-clients-message">
          {searchTerm ? (
            <>
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No se encontraron clientes
              </h3>
              <p className="text-slate-600 mb-4">
                No hay clientes que coincidan con "{searchTerm}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                data-testid="clear-search-button"
              >
                Limpiar búsqueda
              </Button>
            </>
          ) : (
            <>
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-slate-600 mb-6">
                Comienza agregando tu primer cliente al sistema
              </p>
              <Button 
                className="btn-primary" 
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="create-first-client-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Cliente
              </Button>
            </>
          )}
        </div>
      )}

      {/* Stats Footer */}
      {clients.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 rounded-lg" data-testid="clients-stats">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Mostrando {filteredClients.length} de {clients.length} clientes
            </span>
            <span>
              Total de clientes activos: {clients.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;