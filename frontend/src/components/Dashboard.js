import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Building2,
  ClipboardList
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await axios.get(`${API}/dashboard/stats`);
      setStats(statsResponse.data);
      
      // Load recent service reports
      const reportsResponse = await axios.get(`${API}/service-reports`);
      setRecentReports(reportsResponse.data?.data?.slice(0, 5) || []);
      
      // Load recent equipment
      const equipmentResponse = await axios.get(`${API}/equipment`);
      setRecentEquipment(equipmentResponse.data?.data?.slice(0, 5) || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  const getRoleBasedStats = () => {
    if (user?.role === 'client') {
      return [
        {
          title: 'Mis Equipos',
          value: stats?.total_equipment || 0,
          icon: Settings,
          color: 'from-blue-500 to-indigo-600',
          change: '+0%',
          testId: 'client-equipment-stat'
        },
        {
          title: 'Servicios Realizados',
          value: stats?.total_reports || 0,
          icon: CheckCircle,
          color: 'from-green-500 to-emerald-600',
          change: '+0%',
          testId: 'client-reports-stat'
        },
        {
          title: 'Mantenimientos Pendientes',
          value: stats?.pending_maintenance || 0,
          icon: Clock,
          color: 'from-orange-500 to-amber-600',
          change: '0%',
          testId: 'client-pending-stat'
        }
      ];
    }
    
    return [
      {
        title: 'Total Clientes',
        value: stats?.total_clients || 0,
        icon: Building2,
        color: 'from-primary to-secondary',
        change: '+12%',
        testId: 'total-clients-stat'
      },
      {
        title: 'Equipos Registrados',
        value: stats?.total_equipment || 0,
        icon: Settings,
        color: 'from-secondary to-primary',
        change: '+8%',
        testId: 'total-equipment-stat'
      },
      {
        title: 'Servicios Completados',
        value: stats?.total_reports || 0,
        icon: CheckCircle,
        color: 'from-purple-500 to-violet-600',
        change: '+15%',
        testId: 'total-reports-stat'
      },
      {
        title: 'Técnicos Activos',
        value: stats?.total_technicians || 0,
        icon: Users,
        color: 'from-orange-500 to-amber-600',
        change: '+2%',
        testId: 'total-technicians-stat'
      }
    ];
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

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in" data-testid="dashboard">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 break-words" data-testid="welcome-message">
              {getWelcomeMessage()} {user?.full_name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {user?.role === 'client' 
                ? 'Gestiona el mantenimiento de tus equipos hidráulicos' 
                : 'Resumen de actividades del sistema CMMS'
              }
            </p>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            {user?.role !== 'client' && (
              <Link to="/service-form" className="w-full sm:w-auto">
                <Button className="btn-primary w-full sm:w-auto" data-testid="new-service-button">
                  <FileText className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getRoleBasedStats().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="technical-card hover-card" data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1 truncate">
                      {stat.title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-green-600 font-medium mt-1 truncate">
                      {stat.change} vs mes anterior
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-primary/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Service Reports */}
        <Card className="technical-card" data-testid="recent-reports-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
              Servicios Recientes
            </CardTitle>
            <CardDescription>
              Últimos reportes de mantenimiento realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <span className="font-medium text-slate-900 text-sm truncate">
                          {report.report_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVisitTypeBadge(report.visit_type)}`}>
                          {getVisitTypeLabel(report.visit_type)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(report.service_date)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="status-active text-xs">
                        {report.status === 'completed' ? 'Completado' : report.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link to="/reports">
                    <Button variant="outline" size="sm" className="w-full" data-testid="view-all-reports-button">
                      Ver todos los reportes
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No hay servicios registrados</p>
                {user?.role !== 'client' && (
                  <Link to="/service-form" className="mt-2 inline-block">
                    <Button size="sm" className="btn-primary">
                      Crear primer servicio
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Equipment */}
        <Card className="technical-card" data-testid="recent-equipment-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              Equipos Registrados
            </CardTitle>
            <CardDescription>
              Sistemas hidráulicos en gestión
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEquipment.length > 0 ? (
              <div className="space-y-4">
                {recentEquipment.map((equipment) => (
                  <div key={equipment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {equipment.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {equipment.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">
                        {equipment.equipment_type}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link to="/equipment">
                    <Button variant="outline" size="sm" className="w-full" data-testid="view-all-equipment-button">
                      Ver todos los equipos
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No hay equipos registrados</p>
                {user?.role !== 'client' && (
                  <Link to="/equipment" className="mt-2 inline-block">
                    <Button size="sm" className="btn-primary">
                      Registrar primer equipo
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {user?.role !== 'client' && (
        <Card className="technical-card mt-6" data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Herramientas frecuentemente utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/service-form">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2" data-testid="quick-new-service">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">Nuevo Servicio</span>
                </Button>
              </Link>
              
              <Link to="/clients">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2" data-testid="quick-manage-clients">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm">Gestionar Clientes</span>
                </Button>
              </Link>
              
              <Link to="/equipment">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2" data-testid="quick-manage-equipment">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Gestionar Equipos</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;