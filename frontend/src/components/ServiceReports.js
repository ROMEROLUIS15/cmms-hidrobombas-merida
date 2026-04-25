import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  ClipboardList, 
  Search, 
  Calendar, 
  User, 
  Building2,
  Settings,
  FileText,
  Filter,
  Eye,
  Download,
  Wrench
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServiceReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, technical, monthly, eventual
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReportDetails, setSelectedReportDetails] = useState(null);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [reportsResponse, clientsResponse, equipmentResponse] = await Promise.all([
        axios.get(`${API}/service-reports`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/equipment`)
      ]);
      
      setReports(reportsResponse.data);
      setClients(clientsResponse.data);
      setEquipment(equipmentResponse.data);
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      const response = await axios.get(`${API}/reports/${reportId}/details`);
      setSelectedReportDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading report details:', error);
      toast.error('Error al cargar los detalles del reporte');
    }
  };

  const handleDownloadPDF = async (reportId, reportNumber) => {
    try {
      toast.info('Generando PDF...');
      const response = await axios.get(`${API}/reports/${reportId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${reportNumber || reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente desconocido';
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Equipo desconocido';
  };

  const getEquipmentLocation = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.location : '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVisitTypeLabel = (type) => {
    const labels = {
      technical: 'Técnica',
      monthly: 'Mensual',
      eventual: 'Eventual'
    };
    return labels[type] || type;
  };

  const getVisitTypeBadge = (type) => {
    const badges = {
      technical: 'bg-blue-100 text-blue-800 border-blue-200',
      monthly: 'bg-green-100 text-green-800 border-green-200',
      eventual: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return badges[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'status-active',
      pending: 'status-pending',
      cancelled: 'status-inactive'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completado',
      pending: 'Pendiente',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.report_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(report.client_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEquipmentName(report.equipment_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.observations && report.observations.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || report.visit_type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort reports by date (newest first)
  const sortedReports = filteredReports.sort((a, b) => 
    new Date(b.service_date) - new Date(a.service_date)
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in" data-testid="service-reports">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Reportes de Servicio
          </h1>
          <p className="text-slate-600">
            {user?.role === 'client' 
              ? 'Historial de mantenimientos de tus equipos'
              : 'Historial completo de servicios realizados'
            }
          </p>
        </div>
        
        {['admin', 'supervisor', 'technician'].includes(user?.role) && (
          <Link to="/service-form">
            <Button className="btn-primary" data-testid="new-report-button">
              <FileText className="w-4 h-4 mr-2" />
              Nuevo Reporte
            </Button>
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="reports-search-input"
            />
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Tipo:</span>
            <div className="flex space-x-1">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'technical', label: 'Técnica' },
                { value: 'monthly', label: 'Mensual' },
                { value: 'eventual', label: 'Eventual' }
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterType === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(filter.value)}
                  className="text-xs"
                  data-testid={`filter-type-${filter.value}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Estado:</span>
            <div className="flex space-x-1">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'completed', label: 'Completados' },
                { value: 'pending', label: 'Pendientes' }
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterStatus === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(filter.value)}
                  className="text-xs"
                  data-testid={`filter-status-${filter.value}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {sortedReports.length > 0 ? (
        <div className="space-y-4" data-testid="reports-list">
          {sortedReports.map((report) => (
            <Card key={report.id} className="technical-card hover-card" data-testid={`report-card-${report.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {report.report_number}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVisitTypeBadge(report.visit_type)}`}>
                              {getVisitTypeLabel(report.visit_type)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                              {getStatusLabel(report.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(report.service_date)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Cliente</p>
                          <p className="text-sm font-medium text-slate-900">
                            {getClientName(report.client_id)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Settings className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Equipo</p>
                          <p className="text-sm font-medium text-slate-900">
                            {getEquipmentName(report.equipment_id)}
                          </p>
                          {getEquipmentLocation(report.equipment_id) && (
                            <p className="text-xs text-slate-500">
                              {getEquipmentLocation(report.equipment_id)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Técnico</p>
                          <p className="text-sm font-medium text-slate-900">
                            {report.technician_id === user?.id ? 'Tú' : 'Técnico'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Observations Preview */}
                    {report.observations && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Observaciones</p>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {report.observations}
                        </p>
                      </div>
                    )}
                    
                    {/* Technical Data Summary */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Datos Registrados</p>
                      <div className="flex flex-wrap gap-2">
                        {report.water_energy_data && (
                          <Badge variant="outline" className="text-xs">
                            <Wrench className="w-3 h-3 mr-1" />
                            Agua/Energía
                          </Badge>
                        )}
                        {report.motor_1_data && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            Motor 1
                          </Badge>
                        )}
                        {report.motor_2_data && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            Motor 2
                          </Badge>
                        )}
                        {report.motor_3_data && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            Motor 3
                          </Badge>
                        )}
                        {report.control_peripherals_data && (
                          <Badge variant="outline" className="text-xs">
                            <Wrench className="w-3 h-3 mr-1" />
                            Control
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewDetails(report.id)}
                        data-testid={`view-report-${report.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => handleDownloadPDF(report.id, report.report_number)}
                        data-testid={`download-report-${report.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="no-reports-message">
          {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? (
            <>
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No se encontraron reportes
              </h3>
              <p className="text-slate-600 mb-4">
                No hay reportes que coincidan con los filtros aplicados
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                data-testid="clear-filters-button"
              >
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {user?.role === 'client' 
                  ? 'No tienes reportes de servicio'
                  : 'No hay reportes registrados'
                }
              </h3>
              <p className="text-slate-600 mb-6">
                {user?.role === 'client'
                  ? 'Los reportes de mantenimiento aparecerán aquí cuando se realicen servicios'
                  : 'Comienza creando el primer reporte de servicio'
                }
              </p>
              {['admin', 'supervisor', 'technician'].includes(user?.role) && (
                <Link to="/service-form">
                  <Button className="btn-primary" data-testid="create-first-report-button">
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Primer Reporte
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats Footer */}
      {reports.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 rounded-lg" data-testid="reports-stats">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="font-semibold text-slate-900">{reports.length}</p>
              <p className="text-slate-600">Total Reportes</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-green-600">
                {reports.filter(r => r.status === 'completed').length}
              </p>
              <p className="text-slate-600">Completados</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-blue-600">
                {reports.filter(r => r.visit_type === 'technical').length}
              </p>
              <p className="text-slate-600">Técnicos</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-purple-600">
                {reports.filter(r => r.visit_type === 'monthly').length}
              </p>
              <p className="text-slate-600">Mensuales</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Reporte */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Detalles del Reporte
            </DialogTitle>
            <DialogDescription>
              Información completa del reporte de servicio
            </DialogDescription>
          </DialogHeader>
          
          {selectedReportDetails && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Número de Reporte</p>
                    <p className="font-semibold">{selectedReportDetails.report.report_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Fecha de Servicio</p>
                    <p className="font-semibold">
                      {new Date(selectedReportDetails.report.service_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Estado</p>
                    <Badge variant={selectedReportDetails.report.status === 'completed' ? 'success' : 'warning'}>
                      {selectedReportDetails.report.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tipo de Visita</p>
                    <p className="font-semibold capitalize">{selectedReportDetails.report.visit_type}</p>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              {selectedReportDetails.client && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Nombre</p>
                      <p className="font-semibold">{selectedReportDetails.client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold">{selectedReportDetails.client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Teléfono</p>
                      <p className="font-semibold">{selectedReportDetails.client.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Dirección</p>
                      <p className="font-semibold">{selectedReportDetails.client.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Equipo */}
              {selectedReportDetails.equipment && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Equipo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Nombre</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tipo</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.equipment_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Marca</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Modelo</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Ubicación</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Código QR</p>
                      <p className="font-semibold">{selectedReportDetails.equipment.qr_code}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Técnico */}
              {selectedReportDetails.technician && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Técnico Responsable</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Nombre</p>
                      <p className="font-semibold">{selectedReportDetails.technician.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-semibold">{selectedReportDetails.technician.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Rol</p>
                      <Badge>{selectedReportDetails.technician.role}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos Técnicos */}
              {selectedReportDetails.report.water_energy_data && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Datos de Agua y Energía</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Voltaje R-S</p>
                      <p className="font-semibold">
                        {selectedReportDetails.report.water_energy_data.voltage_r_s || 'N/A'} V
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Voltaje S-T</p>
                      <p className="font-semibold">
                        {selectedReportDetails.report.water_energy_data.voltage_s_t || 'N/A'} V
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Voltaje T-R</p>
                      <p className="font-semibold">
                        {selectedReportDetails.report.water_energy_data.voltage_t_r || 'N/A'} V
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Nivel de Agua</p>
                      <Badge variant={
                        selectedReportDetails.report.water_energy_data.water_level === 'full' ? 'success' :
                        selectedReportDetails.report.water_energy_data.water_level === 'medium' ? 'warning' : 'destructive'
                      }>
                        {selectedReportDetails.report.water_energy_data.water_level}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedReportDetails.report.observations && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Observaciones</h3>
                  <p className="text-slate-700">{selectedReportDetails.report.observations}</p>
                </div>
              )}

              {/* Botón para generar PDF desde el modal */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleDownloadPDF(selectedReportDetails.report.id, selectedReportDetails.report.report_number)}
                  className="btn-primary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceReports;