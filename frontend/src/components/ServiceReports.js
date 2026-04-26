import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  ClipboardList, Search, Calendar, User, Building2,
  Settings, FileText, Filter, Eye, Download, Wrench
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServiceReports = ({ user }) => {
  const [reports, setReports]                       = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [searchTerm, setSearchTerm]                 = useState('');
  const [filterType, setFilterType]                 = useState('all');
  const [showDetailsModal, setShowDetailsModal]     = useState(false);
  const [selectedReport, setSelectedReport]         = useState(null);

  useEffect(() => { loadReports(); }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/service-reports`);
      const raw = res.data?.data || res.data || [];

      const parse = (v) => {
        if (!v) return null;
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
        return v;
      };

      const parsed = raw.map(r => ({
        ...r,
        waterEnergyData: parse(r.waterEnergyData),
        motorsData:      parse(r.motorsData),
        controlData:     parse(r.controlData),
      }));

      setReports(parsed);
    } catch (err) {
      console.error('Error loading reports:', err);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      const res = await axios.get(`${API}/service-reports/${reportId}`);
      const raw = res.data?.data || res.data;

      // SQLite stores JSON columns as strings — parse them if needed
      const parse = (v) => {
        if (!v) return null;
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
        return v;
      };

      setSelectedReport({
        ...raw,
        waterEnergyData: parse(raw.waterEnergyData),
        motorsData:      parse(raw.motorsData),
        controlData:     parse(raw.controlData),
      });
      setShowDetailsModal(true);
    } catch (err) {
      toast.error('Error al cargar los detalles del reporte');
    }
  };

  const handleDownloadPDF = async (reportId, reportNumber) => {
    const toastId = toast.loading('Generando PDF...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/service-reports/${reportId}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });

      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `reporte_${reportNumber || reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF descargado exitosamente', { id: toastId });
    } catch (err) {
      console.error('Error PDF:', err);
      toast.error('Error al generar el PDF', { id: toastId });
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const visitLabel = { mensual: 'Mensual', eventual: 'Eventual', technical: 'Técnica' };
  const visitColor = {
    mensual:   'bg-green-100 text-green-800 border-green-200',
    eventual:  'bg-orange-100 text-orange-800 border-orange-200',
    technical: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = reports.filter(r => {
    const clientName = r.equipment?.client?.name || '';
    const equipName  = r.equipment?.name || '';
    const num        = r.reportNumber || '';
    const obs        = r.observations || '';
    const matchSearch = [num, clientName, equipName, obs]
      .some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === 'all' || r.visitType === filterType;
    return matchSearch && matchType;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt)
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in" data-testid="service-reports">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Reportes de Servicio</h1>
          <p className="text-slate-600">Historial completo de mantenimientos realizados</p>
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

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por N°, cliente, equipo u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="reports-search-input"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Tipo:</span>
          {[
            { value: 'all',       label: 'Todos'    },
            { value: 'mensual',   label: 'Mensual'  },
            { value: 'eventual',  label: 'Eventual' },
            { value: 'technical', label: 'Técnica'  },
          ].map(f => (
            <Button
              key={f.value}
              variant={filterType === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(f.value)}
              className="text-xs"
              data-testid={`filter-type-${f.value}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {reports.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg" data-testid="reports-stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
            <div>
              <p className="font-bold text-slate-900 text-lg">{reports.length}</p>
              <p className="text-slate-500">Total</p>
            </div>
            <div>
              <p className="font-bold text-green-600 text-lg">
                {reports.filter(r => r.visitType === 'mensual').length}
              </p>
              <p className="text-slate-500">Mensuales</p>
            </div>
            <div>
              <p className="font-bold text-orange-600 text-lg">
                {reports.filter(r => r.visitType === 'eventual').length}
              </p>
              <p className="text-slate-500">Eventuales</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 text-lg">
                {reports.filter(r => r.visitType === 'technical').length}
              </p>
              <p className="text-slate-500">Técnicas</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      {sorted.length > 0 ? (
        <div className="space-y-4" data-testid="reports-list">
          {sorted.map((report) => (
            <Card key={report.id} className="technical-card hover-card" data-testid={`report-card-${report.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">

                  {/* Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {report.reportNumber || 'SRV-????'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${visitColor[report.visitType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {visitLabel[report.visitType] || report.visitType}
                      </span>
                      {report.systemName && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                          {report.systemName}
                        </span>
                      )}
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Cliente</p>
                          <p className="text-sm font-medium text-slate-800">
                            {report.equipment?.client?.name || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Equipo</p>
                          <p className="text-sm font-medium text-slate-800">
                            {report.equipment?.name || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Fecha</p>
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(report.reportDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {report.waterEnergyData && (
                        <Badge variant="outline" className="text-xs">
                          <Wrench className="w-3 h-3 mr-1" />Agua/Energía
                        </Badge>
                      )}
                      {report.motorsData && report.motorsData.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Settings className="w-3 h-3 mr-1" />{report.motorsData.length} Motor(es)
                        </Badge>
                      )}
                      {report.controlData && (
                        <Badge variant="outline" className="text-xs">
                          <Wrench className="w-3 h-3 mr-1" />Control
                        </Badge>
                      )}
                    </div>

                    {/* Observations preview */}
                    {report.observations && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{report.observations}</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline" size="sm" className="text-xs"
                        onClick={() => handleViewDetails(report.id)}
                        data-testid={`view-report-${report.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />Ver Detalles
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs"
                        onClick={() => handleDownloadPDF(report.id, report.reportNumber)}
                        data-testid={`download-report-${report.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" />PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16" data-testid="no-reports-message">
          {searchTerm || filterType !== 'all' ? (
            <>
              <Search className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Sin resultados</h3>
              <p className="text-slate-500 mb-4">No hay reportes que coincidan con los filtros</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                data-testid="clear-filters-button"
              >
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <ClipboardList className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay reportes registrados</h3>
              <p className="text-slate-500 mb-6">Crea el primer reporte de mantenimiento</p>
              <Link to="/service-form">
                <Button className="btn-primary" data-testid="create-first-report-button">
                  <FileText className="w-4 h-4 mr-2" />Crear Primer Reporte
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Detalles del Reporte
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.reportNumber} · {formatDate(selectedReport?.reportDate)}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 mt-2">

              {/* Información General */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">Información General</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-slate-400 text-xs">N° Reporte</p><p className="font-semibold">{selectedReport.reportNumber || '—'}</p></div>
                  <div><p className="text-slate-400 text-xs">Fecha</p><p className="font-semibold">{formatDate(selectedReport.reportDate)}</p></div>
                  <div><p className="text-slate-400 text-xs">Tipo</p><p className="font-semibold">{visitLabel[selectedReport.visitType] || selectedReport.visitType}</p></div>
                  <div><p className="text-slate-400 text-xs">Sistema</p><p className="font-semibold">{selectedReport.systemName || '—'}</p></div>
                </div>
              </div>

              {/* Equipo / Cliente */}
              {selectedReport.equipment && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Equipo / Cliente</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-slate-400 text-xs">Equipo</p><p className="font-semibold">{selectedReport.equipment.name}</p></div>
                    <div><p className="text-slate-400 text-xs">Cliente</p><p className="font-semibold">{selectedReport.equipment.client?.name || '—'}</p></div>
                    <div>
                      <p className="text-slate-400 text-xs">Técnico</p>
                      <p className="font-semibold">
                        {selectedReport.technician?.username || selectedReport.technicianName || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agua / Energía */}
              {selectedReport.waterEnergyData && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Agua / Energía</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    {[
                      ['R-S', selectedReport.waterEnergyData.voltage_r_s],
                      ['R-N', selectedReport.waterEnergyData.voltage_r_n],
                      ['S-T', selectedReport.waterEnergyData.voltage_s_t],
                      ['S-N', selectedReport.waterEnergyData.voltage_s_n],
                      ['T-R', selectedReport.waterEnergyData.voltage_t_r],
                      ['T-N', selectedReport.waterEnergyData.voltage_t_n],
                    ].map(([lbl, val]) => val ? (
                      <div key={lbl}>
                        <p className="text-slate-400 text-xs">Voltaje {lbl}</p>
                        <p className="font-semibold">{val} V</p>
                      </div>
                    ) : null)}
                    <div>
                      <p className="text-slate-400 text-xs">Nivel Agua</p>
                      <p className="font-semibold capitalize">{selectedReport.waterEnergyData.water_level || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Motores */}
              {selectedReport.motorsData && selectedReport.motorsData.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Motores</h3>
                  <div className="space-y-3">
                    {selectedReport.motorsData.map((motor, i) => (
                      <div key={i}>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Motor {i + 1}</p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                          {motor.motor_hp  && <div><p className="text-slate-400 text-xs">HP</p><p className="font-semibold">{motor.motor_hp}</p></div>}
                          {motor.amperage  && <div><p className="text-slate-400 text-xs">In (A)</p><p className="font-semibold">{motor.amperage}</p></div>}
                          {motor.phase_r   && <div><p className="text-slate-400 text-xs">R (A)</p><p className="font-semibold">{motor.phase_r}</p></div>}
                          {motor.phase_s   && <div><p className="text-slate-400 text-xs">S (A)</p><p className="font-semibold">{motor.phase_s}</p></div>}
                          {motor.phase_t   && <div><p className="text-slate-400 text-xs">T (A)</p><p className="font-semibold">{motor.phase_t}</p></div>}
                          {motor.motor_temp && <div><p className="text-slate-400 text-xs">T° Motor</p><p className="font-semibold">{motor.motor_temp}°C</p></div>}
                          {motor.voluta_temp && <div><p className="text-slate-400 text-xs">T° Voluta</p><p className="font-semibold">{motor.voluta_temp}°C</p></div>}
                          {motor.bobina_value && <div><p className="text-slate-400 text-xs">Bobina</p><p className="font-semibold">{motor.bobina_value}</p></div>}
                          {motor.contactos_value && <div><p className="text-slate-400 text-xs">Contactos</p><p className="font-semibold">{motor.contactos_value}</p></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedReport.observations && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">Observaciones</h3>
                  <p className="text-slate-700 text-sm">{selectedReport.observations}</p>
                </div>
              )}

              {/* Firmas */}
              {(selectedReport.technicianName || selectedReport.clientSignatureName) && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Firmas</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Técnico</p>
                      <p className="font-semibold">{selectedReport.technicianName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Cliente</p>
                      <p className="font-semibold">{selectedReport.clientSignatureName || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end pt-2 border-t">
                <Button
                  onClick={() => handleDownloadPDF(selectedReport.id, selectedReport.reportNumber)}
                  className="btn-primary"
                >
                  <Download className="w-4 h-4 mr-2" />Descargar PDF
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