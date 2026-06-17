import React, { useState } from 'react';
import { CheckCircle2, Printer, Mail, LogOut, X, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// ── Email Modal ──────────────────────────────────────────────────────────────
const EmailModal = ({ reportId, clientEmail, onClose }) => {
  const [email, setEmail] = useState(clientEmail || '');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un email válido');
      return;
    }
    setSending(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/service-reports/${reportId}/email`,
        { recipientEmail: email, recipientName: name },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(`Reporte enviado a ${email}`);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar el email';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Enviar al Cliente</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Se enviará un correo con un enlace para ver el reporte completo.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold text-sm">
              Email del destinatario *
            </Label>
            <Input
              type="email"
              placeholder="cliente@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border-slate-200"
              autoFocus
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold text-sm">
              Nombre del destinatario <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border-slate-200"
              autoComplete="name"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="w-4 h-4" /> Enviar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Success Screen ──────────────────────────────────────────────────────
const WizardSuccessScreen = ({ reportId, clientEmail }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const isOffline = !reportId;

  const handlePrint = () => {
    if (!reportId) return;
    const pdfUrl = `${BACKEND_URL}/api/service-reports/${reportId}/pdf`;
    const token = localStorage.getItem('token');

    fetch(pdfUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
          win.addEventListener('load', () => win.print());
        } else {
          toast.error('Activa las ventanas emergentes para imprimir');
        }
      })
      .catch(() => toast.error('No se pudo cargar el PDF para imprimir'));
  };

  const handleExit = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Success Card */}
      <div className="flex flex-col items-center justify-center py-12 px-6 animate-in zoom-in duration-500">

        {/* Icon */}
        <div className="bg-emerald-100 p-5 rounded-full mb-6 shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        </div>

        {/* Title & description */}
        <h2 className="text-3xl font-bold text-slate-800 mb-3 text-center">
          ¡Reporte Completado!
        </h2>
        <p className="text-slate-500 mb-10 max-w-sm text-center text-sm sm:text-base leading-relaxed">
          El mantenimiento ha sido registrado exitosamente con la firma del cliente.
          {isOffline
            ? ' Se guardó localmente y se sincronizará cuando haya conexión.'
            : ' Puedes imprimir el reporte, enviarlo por correo o salir.'}
        </p>

        {/* Action buttons */}
        <div className="w-full max-w-xs space-y-3">

          {/* Print */}
          <Button
            onClick={handlePrint}
            disabled={isOffline}
            title={isOffline ? 'Disponible al sincronizar con el servidor' : 'Imprimir reporte en PDF'}
            className="w-full h-12 gap-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte
          </Button>

          {/* Send email */}
          <Button
            onClick={() => setShowEmailModal(true)}
            disabled={isOffline}
            title={isOffline ? 'Disponible al sincronizar con el servidor' : 'Enviar reporte por correo'}
            className="w-full h-12 gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Mail className="w-4 h-4" />
            Enviar al Cliente
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">o</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Exit — outlined, less prominent */}
          <Button
            variant="outline"
            onClick={handleExit}
            className="w-full h-11 gap-3 border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-sm rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Salir sin enviar
          </Button>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          El envío de correo y la impresión son opcionales
        </p>
      </div>

      {/* Email modal */}
      {showEmailModal && (
        <EmailModal
          reportId={reportId}
          clientEmail={clientEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
};

export default WizardSuccessScreen;
