import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../../hooks/useAI', () => ({
  useAIChat: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  MessageCircle: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-message-circle' }),
  X: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-x' }),
  Send: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-send' }),
  Bot: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-bot' }),
  User: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-user' }),
  Loader2: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-loader' }),
  Wrench: ({ className }) =>
    React.createElement('svg', { className, 'data-testid': 'icon-wrench' }),
}));

vi.mock('../../components/AIAssistant/DiagnosticPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'diagnostic-panel' }),
}));

import { useAIChat } from '../../hooks/useAI';
import AIChatBubble from '../../components/AIAssistant/AIChatBubble';

describe('AIChatBubble', () => {
  const mockSendMessage = vi.fn().mockResolvedValue('response');
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAIChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });
  });

  it('should render the floating button initially', () => {
    const { container } = render(React.createElement(AIChatBubble));

    expect(container.querySelector('[class*="fixed bottom-4"]')).toBeDefined();
    expect(screen.queryByText('Asistente de Mantenimiento')).toBeNull();
  });

  it('should open the chat panel when the button is clicked', () => {
    render(React.createElement(AIChatBubble));

    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Asistente de Mantenimiento')).toBeDefined();
    expect(screen.getByPlaceholderText('Escribe tu pregunta...')).toBeDefined();
  });

  it('should display the empty state with instructions', () => {
    render(React.createElement(AIChatBubble));

    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Pregúntame sobre equipos,')).toBeDefined();
  });

  it('should display messages from the chat', () => {
    useAIChat.mockReturnValue({
      messages: [
        { role: 'user', content: 'What is a pump?' },
        { role: 'assistant', content: 'A pump moves fluids.' },
      ],
      loading: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    expect(screen.getByText('What is a pump?')).toBeDefined();
    expect(screen.getByText('A pump moves fluids.')).toBeDefined();
  });

  it('should call sendMessage when form is submitted', () => {
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test message' } });

    const submitBtn = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="icon-send"]')
    );
    fireEvent.click(submitBtn);

    expect(mockSendMessage).toHaveBeenCalledWith('test message');
  });

  it('should show loading spinner when loading', () => {
    useAIChat.mockReturnValue({
      messages: [],
      loading: true,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    const loaders = screen.getAllByTestId('icon-loader');
    expect(loaders.length).toBeGreaterThanOrEqual(1);
  });

  it('should switch to diagnostic tab', () => {
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    const diagnoseBtn = screen.getByTitle('Diagnóstico');
    fireEvent.click(diagnoseBtn);

    expect(screen.getByTestId('diagnostic-panel')).toBeDefined();
  });

  it('should close the panel when close button is clicked', () => {
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Asistente de Mantenimiento')).toBeDefined();

    const allButtons = screen.getAllByRole('button');
    const xIconBtn = allButtons.find((btn) =>
      btn.querySelector('[data-testid="icon-x"]')
    );
    fireEvent.click(xIconBtn);

    expect(screen.queryByText('Asistente de Mantenimiento')).toBeNull();
  });
});
