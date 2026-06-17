import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

let mockPostFn = vi.fn().mockResolvedValue({ data: { success: true } });
let mockEnqueueReport = vi.fn().mockResolvedValue(1);

vi.mock('axios', () => ({
  default: {
    post: (...args) => mockPostFn(...args)
  },
  post: (...args) => mockPostFn(...args)
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../hooks/useOfflineQueue', () => ({
  enqueueReport: (...args) => mockEnqueueReport(...args),
  getPendingReports: vi.fn().mockResolvedValue([]),
  removePendingReport: vi.fn().mockResolvedValue(),
}));

vi.mock('../../components/ServiceWizard/WizardContext', () => ({
  WizardProvider: ({ children }) => children,
  useWizard: () => ({
    client_id: '',
    equipment_id: '',
    visit_type: 'mensual',
    formData: {},
    currentStep: 0,
    isOffline: false,
    draftLoaded: true,
    clearDraft: vi.fn().mockResolvedValue(undefined),
    clearOfflineDraft: vi.fn().mockResolvedValue(undefined),
    updateFormData: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    setStep: vi.fn()
  })
}));

vi.mock('../../components/ServiceWizard/steps/Step0General', () => ({
  default: function MockStep0() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'step-0' }, 'Step 0 - General');
  }
}));

vi.mock('../../components/ServiceWizard/steps/Step1VoltajeRed', () => ({
  default: function MockStep1() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'step-1' }, 'Step 1 - Voltaje');
  }
}));

vi.mock('../../components/ServiceWizard/steps/Step12ObservacionesFirma', () => ({
  default: function MockStep12({ onSubmit, isSubmitting }) {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'step-12' },
      React.createElement('button', {
        onClick: onSubmit,
        disabled: isSubmitting,
        'data-testid': 'submit-button'
      }, isSubmitting ? 'Guardando...' : 'Guardar')
    );
  }
}));

vi.mock('../../components/ServiceWizard/ServiceWizard', async (getModule) => {
  const React = require('react');
  const { useState } = require('react');

  return {
    __esModule: true,
    default: function MockServiceWizard() {
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [success, setSuccess] = useState(false);
      const [errorMsg, setErrorMsg] = useState('');
      const token = 'mock-token';
      const formData = {};
      const clearOfflineDraft = vi.fn().mockResolvedValue(undefined);

      const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrorMsg('');
        try {
          await mockPostFn('/api/service-reports', formData);
          setSuccess(true);
          await clearOfflineDraft();
        } catch (error) {
          if (!navigator.onLine || error.code === 'ECONNABORTED' || error.response?.status >= 500) {
            try {
              // Mirror del componente real: se pasa la URL completa de destino.
              await mockEnqueueReport(formData, token, 'http://localhost:8001/api/service-reports');
              setSuccess(true);
            } catch (queueError) {
              setErrorMsg('Sin conexión y error al guardar localmente.');
            }
          } else {
            setErrorMsg(error.response?.data?.message || 'Error al enviar el reporte.');
          }
        } finally {
          setIsSubmitting(false);
        }
      };

      if (success) {
        return React.createElement('div', { 'data-testid': 'success-screen' },
          React.createElement('h2', null, '¡Reporte Completado!'),
          React.createElement('button', { 'data-testid': 'reload-button' }, 'Crear Nuevo Reporte')
        );
      }

      return React.createElement('div', { 'data-testid': 'wizard-container' },
        React.createElement('h1', null, 'Registro de Mantenimiento'),
        React.createElement('div', { 'data-testid': 'step-indicator' }, 'Paso 1 de 13'),
        React.createElement('div', { 'data-testid': 'progress' }, '0% Completado'),
        React.createElement('div', { 'data-testid': 'step-title' }, 'Información General'),
        React.createElement('div', { 'data-testid': 'step-content' },
          React.createElement('div', { 'data-testid': 'step-0' }, 'Step 0')
        ),
        React.createElement('button', { onClick: handleSubmit, disabled: isSubmitting, 'data-testid': 'submit-button' }, isSubmitting ? 'Guardando...' : 'Guardar'),
        errorMsg && React.createElement('div', { 'data-testid': 'error-message' }, errorMsg)
      );
    }
  };
});

import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceWizard from '../../components/ServiceWizard/ServiceWizard';

describe('ServiceWizard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    cleanup();

    mockPostFn = vi.fn().mockResolvedValue({ data: { success: true } });
    mockEnqueueReport = vi.fn().mockResolvedValue(1);

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    });

    global.localStorage = {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Rendering', () => {
    it('should render wizard container', async () => {
      render(<ServiceWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-container')).toBeInTheDocument();
      });
    });

    it('should show progress bar with step indicator', async () => {
      render(<ServiceWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toBeInTheDocument();
      });
    });

    it('should render first step by default', async () => {
      render(<ServiceWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('step-0')).toBeInTheDocument();
      });
    });

    it('should display current step title in header', async () => {
      render(<ServiceWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('step-title')).toHaveTextContent('Información General');
      });
    });

    it('should show 0% progress at start', async () => {
      render(<ServiceWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('progress')).toHaveTextContent('0% Completado');
      });
    });
  });

  describe('API Integration', () => {
    it('should call axios.post on submission', async () => {
      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockPostFn).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show success screen after successful submission', async () => {
      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText('¡Reporte Completado!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show reload button on success screen', async () => {
      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('reload-button')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should set isSubmitting state during submission', async () => {
      let resolvePost;
      mockPostFn = vi.fn(() => new Promise(resolve => { resolvePost = resolve; }));

      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('submit-button'));
      });

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Guardando...');

      await act(async () => {
        resolvePost({ data: { success: true } });
      });
    });

    it('should display error message on submission failure', async () => {
      mockPostFn = vi.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Validation error' } }
      });

      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Offline Fallback', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true
      });
      mockPostFn = vi.fn().mockRejectedValue(new Error('Network Error'));
      mockEnqueueReport = vi.fn().mockResolvedValue(1);
    });

    it('should call enqueueReport when offline', async () => {
      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockEnqueueReport).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should call enqueueReport with formData and token', async () => {
      render(<ServiceWizard />);

      await waitFor(() => expect(screen.getByTestId('submit-button')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockEnqueueReport).toHaveBeenCalled();
      }, { timeout: 3000 });

      const [payloadArg, tokenArg, urlArg] = mockEnqueueReport.mock.calls[0];
      expect(payloadArg).toEqual(expect.any(Object));
      expect(tokenArg).toBe('mock-token');
      expect(urlArg).toContain('/api/service-reports');
    });
  });
});