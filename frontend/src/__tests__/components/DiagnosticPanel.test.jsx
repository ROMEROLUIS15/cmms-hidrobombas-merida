import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../../hooks/useAI', () => ({
  useAIDiagnose: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Wrench: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-wrench' }),
  Loader2: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-loader' }),
  AlertTriangle: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-alert' }),
  CheckCircle: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-check' }),
  ArrowRight: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-arrow' }),
}));

import { useAIDiagnose } from '../../hooks/useAI';
import DiagnosticPanel from '../../components/AIAssistant/DiagnosticPanel';

describe('DiagnosticPanel', () => {
  const mockDiagnose = vi.fn().mockResolvedValue({
    diagnosis: 'Diagnóstico de prueba',
    recommendations: 'Recomendaciones de prueba',
    followUpQuestion: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAIDiagnose.mockReturnValue({
      result: null,
      loading: false,
      error: null,
      diagnose: mockDiagnose,
    });
  });

  it('should render the form with empty state', () => {
    render(React.createElement(DiagnosticPanel));

    expect(screen.getByText('Diagnóstico de Fallas')).toBeDefined();
    expect(screen.getByPlaceholderText('Nombre del equipo (opcional)')).toBeDefined();
    expect(screen.getByPlaceholderText('Describe los síntomas del equipo...')).toBeDefined();
    expect(screen.getByText('Describe los síntomas del equipo')).toBeDefined();
    expect(screen.getByText('para obtener un diagnóstico')).toBeDefined();
  });

  it('should call diagnose when form is submitted', () => {
    render(React.createElement(DiagnosticPanel));

    const symptomsInput = screen.getByPlaceholderText('Describe los síntomas del equipo...');
    fireEvent.change(symptomsInput, { target: { value: 'Vibration and noise' } });

    fireEvent.click(screen.getByText('Diagnosticar'));

    expect(mockDiagnose).toHaveBeenCalledWith({
      equipment_name: undefined,
      symptoms: 'Vibration and noise',
    });
  });

  it('should include equipment name when provided', () => {
    render(React.createElement(DiagnosticPanel));

    const equipInput = screen.getByPlaceholderText('Nombre del equipo (opcional)');
    fireEvent.change(equipInput, { target: { value: 'Bomba Centrífuga' } });

    const symptomsInput = screen.getByPlaceholderText('Describe los síntomas del equipo...');
    fireEvent.change(symptomsInput, { target: { value: 'Overheating' } });

    fireEvent.click(screen.getByText('Diagnosticar'));

    expect(mockDiagnose).toHaveBeenCalledWith({
      equipment_name: 'Bomba Centrífuga',
      symptoms: 'Overheating',
    });
  });

  it('should not call diagnose with empty symptoms', () => {
    render(React.createElement(DiagnosticPanel));

    fireEvent.click(screen.getByText('Diagnosticar'));

    expect(mockDiagnose).not.toHaveBeenCalled();
  });

  it('should display error when present', () => {
    useAIDiagnose.mockReturnValue({
      result: null,
      loading: false,
      error: 'Error de conexión',
      diagnose: mockDiagnose,
    });

    render(React.createElement(DiagnosticPanel));

    expect(screen.getByText('Error de conexión')).toBeDefined();
  });

  it('should display diagnosis result with recommendations', () => {
    useAIDiagnose.mockReturnValue({
      result: {
        diagnosis: 'Fallo en rodamiento',
        recommendations: 'Reemplazar rodamiento 6205',
        followUpQuestion: null,
      },
      loading: false,
      error: null,
      diagnose: mockDiagnose,
    });

    render(React.createElement(DiagnosticPanel));

    expect(screen.getByText('Diagnóstico')).toBeDefined();
    expect(screen.getByText('Fallo en rodamiento')).toBeDefined();
    expect(screen.getByText('Recomendaciones')).toBeDefined();
    expect(screen.getByText('Reemplazar rodamiento 6205')).toBeDefined();
  });

  it('should display follow-up question when present', () => {
    useAIDiagnose.mockReturnValue({
      result: {
        diagnosis: 'Diagnóstico',
        recommendations: 'Recomendación',
        followUpQuestion: '¿Has medido la corriente?',
      },
      loading: false,
      error: null,
      diagnose: mockDiagnose,
    });

    render(React.createElement(DiagnosticPanel));

    expect(screen.getByText('Pregunta adicional:')).toBeDefined();
    expect(screen.getByText('¿Has medido la corriente?')).toBeDefined();
  });

  it('should show loading state during diagnosis', () => {
    useAIDiagnose.mockReturnValue({
      result: null,
      loading: true,
      error: null,
      diagnose: mockDiagnose,
    });

    render(React.createElement(DiagnosticPanel));

    expect(screen.getByTestId('icon-loader')).toBeDefined();
    expect(screen.getByText('Diagnosticar')).toBeDefined();
  });

  it('should disable the submit button while loading', () => {
    useAIDiagnose.mockReturnValue({
      result: null,
      loading: true,
      error: null,
      diagnose: mockDiagnose,
    });

    render(React.createElement(DiagnosticPanel));

    const symptomsInput = screen.getByPlaceholderText('Describe los síntomas del equipo...');
    fireEvent.change(symptomsInput, { target: { value: 'test' } });

    const diagnoseBtn = screen.getByText('Diagnosticar').closest('button');
    expect(diagnoseBtn.disabled).toBe(true);
  });
});
