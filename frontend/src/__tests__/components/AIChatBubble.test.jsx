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
    // Arrange & Act
    render(React.createElement(AIChatBubble));

    // Assert
    expect(screen.getByTestId('ai-chat-toggle')).toBeInTheDocument();
    expect(screen.queryByText('Asistente de Mantenimiento')).toBeNull();
  });

  it('should open the chat panel when the button is clicked', () => {
    // Arrange
    render(React.createElement(AIChatBubble));

    // Act
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Assert
    expect(screen.getByText('Asistente de Mantenimiento')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe tu pregunta...')).toBeInTheDocument();
  });

  it('should display the empty state with instructions', () => {
    // Arrange
    render(React.createElement(AIChatBubble));

    // Act
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Assert
    expect(screen.getByText('Pregúntame sobre equipos,')).toBeInTheDocument();
  });

  it('should display messages from the chat', () => {
    // Arrange
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

    // Act
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Assert
    expect(screen.getByText('What is a pump?')).toBeInTheDocument();
    expect(screen.getByText('A pump moves fluids.')).toBeInTheDocument();
  });

  it('should call sendMessage when form is submitted', () => {
    // Arrange
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Act
    const input = screen.getByPlaceholderText('Escribe tu pregunta...');
    fireEvent.change(input, { target: { value: 'test message' } });

    const submitBtn = screen.getByTestId('ai-chat-submit');
    fireEvent.click(submitBtn);

    // Assert
    expect(mockSendMessage).toHaveBeenCalledWith('test message');
  });

  it('should show loading spinner when loading', () => {
    // Arrange
    useAIChat.mockReturnValue({
      messages: [],
      loading: true,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(React.createElement(AIChatBubble));

    // Act
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Assert
    const loaders = screen.getAllByTestId('icon-loader');
    expect(loaders.length).toBeGreaterThanOrEqual(1);
  });

  it('should switch to diagnostic tab', () => {
    // Arrange
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    // Act
    const diagnoseBtn = screen.getByTitle('Diagnóstico');
    fireEvent.click(diagnoseBtn);

    // Assert
    expect(screen.getByTestId('diagnostic-panel')).toBeInTheDocument();
  });

  it('should close the panel when close button is clicked', () => {
    // Arrange
    render(React.createElement(AIChatBubble));
    const toggleBtn = screen.getByTestId('ai-chat-toggle');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Asistente de Mantenimiento')).toBeInTheDocument();

    // Act
    const xIconBtn = screen.getByTestId('ai-chat-close');
    fireEvent.click(xIconBtn);

    // Assert
    expect(screen.queryByText('Asistente de Mantenimiento')).toBeNull();
  });
});
