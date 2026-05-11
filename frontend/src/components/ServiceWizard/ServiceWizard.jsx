import React, { useState } from 'react';
import { WizardProvider, useWizard } from './WizardContext';
import axios from 'axios';
import { toast } from 'sonner';
import { enqueueReport } from '../../hooks/useOfflineQueue';

/** Generates a simple UUID v4 — same helper as useOfflineQueue */
const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// Steps
import Step0General from './steps/Step0General';
import Step1VoltajeRed from './steps/Step1VoltajeRed';
import Step2NivelAgua from './steps/Step2NivelAgua';
import Step3SupervisorVoltaje from './steps/Step3SupervisorVoltaje';
import Step4InterruptorFlotante from './steps/Step4InterruptorFlotante';
import Step5ConsumoEnergia from './steps/Step5ConsumoEnergia';
import Step6Contactores from './steps/Step6Contactores';
import Step7Termicos from './steps/Step7Termicos';
import Step8Temperaturas from './steps/Step8Temperaturas';
import Step9BreakersReles from './steps/Step9BreakersReles';
import Step10PresionesValvulas from './steps/Step10PresionesValvulas';
import Step11CiclosRuido from './steps/Step11CiclosRuido';
import Step12ObservacionesFirma from './steps/Step12ObservacionesFirma';

import { CheckCircle2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const ServiceWizardContent = () => {
  const { currentStep, formData, clearOfflineDraft } = useWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    // Guard: prevent double-submit if already in progress
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');
    const token = localStorage.getItem('token');

    // Generate ONE idempotency key for this submission attempt.
    // It travels with the request (online) and with the queue entry (offline)
    // so the backend and the queue can both detect duplicates.
    const clientRequestId = uuidv4();
    const reportPayload = { ...formData, _clientRequestId: clientRequestId };

    try {
      await axios.post(`${BACKEND_URL}/api/service-reports`, reportPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': clientRequestId,
        }
      });
      setSuccess(true);
      await clearOfflineDraft();
    } catch (error) {
      const isNetworkError =
        !navigator.onLine ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        (error.response?.status ?? 0) >= 500;

      if (isNetworkError) {
        try {
          // enqueueReport is idempotent: passing _clientRequestId prevents
          // double-enqueue if this block is reached more than once.
          await enqueueReport(reportPayload, token);
          setSuccess(true);
          toast.success('Sin conexión. El reporte se sincronizará automáticamente al reconectar.');
          await clearOfflineDraft();
        } catch {
          setErrorMsg('Sin conexión y no se pudo guardar localmente. Intente de nuevo.');
        }
      } else {
        setErrorMsg(error.response?.data?.message || 'Error al enviar el reporte.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
        <div className="bg-emerald-100 p-4 rounded-full mb-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Reporte Completado!</h2>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          El mantenimiento ha sido registrado exitosamente y el PDF ha sido generado con la firma del cliente.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg transition-all"
        >
          Crear Nuevo Reporte
        </button>
      </div>
    );
  }

  const stepsList = [
    { id: 0, title: 'Información General' },
    { id: 1, title: 'Voltaje de Red' },
    { id: 2, title: 'Nivel de Agua' },
    { id: 3, title: 'Supervisor Voltaje' },
    { id: 4, title: 'Interruptor Flotante' },
    { id: 5, title: 'Consumo Energía' },
    { id: 6, title: 'Contactores' },
    { id: 7, title: 'Térmicos' },
    { id: 8, title: 'Temperaturas' },
    { id: 9, title: 'Breakers y Relés' },
    { id: 10, title: 'Presiones/Válvulas' },
    { id: 11, title: 'Ciclos y Ruido' },
    { id: 12, title: 'Cierre' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step0General />;
      case 1: return <Step1VoltajeRed />;
      case 2: return <Step2NivelAgua />;
      case 3: return <Step3SupervisorVoltaje />;
      case 4: return <Step4InterruptorFlotante />;
      case 5: return <Step5ConsumoEnergia />;
      case 6: return <Step6Contactores />;
      case 7: return <Step7Termicos />;
      case 8: return <Step8Temperaturas />;
      case 9: return <Step9BreakersReles />;
      case 10: return <Step10PresionesValvulas />;
      case 11: return <Step11CiclosRuido />;
      case 12: return <Step12ObservacionesFirma onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default: return <Step0General />;
    }
  };

  const progressPercentage = (currentStep / (stepsList.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-6 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registro de Mantenimiento</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Complete las mediciones paso a paso. El progreso se guarda localmente.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg mb-6 shadow-sm">
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Progress Bar Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Paso {currentStep + 1} de {stepsList.length}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {Math.round(progressPercentage)}% Completado
              </span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <h3 className="text-slate-800 font-semibold">{stepsList[currentStep].title}</h3>
          </div>

          <div className="p-6 sm:p-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceWizard = () => {
  return (
    <WizardProvider>
      <ServiceWizardContent />
    </WizardProvider>
  );
};

export default ServiceWizard;
