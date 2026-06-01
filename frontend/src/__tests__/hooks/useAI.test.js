import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import { useAIChat, useAIDiagnose, useAIAsk } from '../../hooks/useAI';

vi.mock('axios');

describe('useAIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with empty messages and not loading', () => {
    const { result } = renderHook(() => useAIChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should add user message and then assistant response on successful send', async () => {
    axios.post.mockResolvedValue({
      data: { data: { response: 'I can help with that!' } },
    });

    const { result } = renderHook(() => useAIChat());

    let returnedResponse;
    await act(async () => {
      returnedResponse = await result.current.sendMessage('What is a pump?');
    });

    expect(axios.post).toHaveBeenCalledWith('/api/ai/chat', { message: 'What is a pump?' });
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'What is a pump?' },
      { role: 'assistant', content: 'I can help with that!' },
    ]);
    expect(result.current.loading).toBe(false);
    expect(returnedResponse).toBe('I can help with that!');
  });

  it('should add error message when API call fails', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAIChat());

    let returnedResponse;
    await act(async () => {
      returnedResponse = await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Error al comunicarse con el asistente. Intenta de nuevo.' },
    ]);
    expect(result.current.loading).toBe(false);
    expect(returnedResponse).toBe('Error al comunicarse con el asistente. Intenta de nuevo.');
  });

  it('should clear all messages', () => {
    const { result } = renderHook(() => useAIChat());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });
});

describe('useAIDiagnose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with null result, not loading, null error', () => {
    const { result } = renderHook(() => useAIDiagnose());

    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set result on successful diagnosis', async () => {
    const mockResult = {
      diagnosis: 'Motor bearing failure',
      recommendations: 'Replace bearing 6205',
      followUpQuestion: null,
    };
    axios.post.mockResolvedValue({
      data: { data: mockResult },
    });

    const { result } = renderHook(() => useAIDiagnose());

    let returnedResult;
    await act(async () => {
      returnedResult = await result.current.diagnose({
        equipment_id: 'eq-1',
        equipment_name: 'Motor',
        symptoms: 'Vibration',
      });
    });

    expect(axios.post).toHaveBeenCalledWith('/api/ai/diagnose', {
      equipment_id: 'eq-1',
      equipment_name: 'Motor',
      symptoms: 'Vibration',
    });
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedResult).toEqual(mockResult);
  });

  it('should set error on API failure', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'Diagnóstico falló' } },
    });

    const { result } = renderHook(() => useAIDiagnose());

    let returnedResult;
    await act(async () => {
      returnedResult = await result.current.diagnose({ symptoms: 'test' });
    });

    expect(result.current.error).toBe('Diagnóstico falló');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(returnedResult).toBeNull();
  });

  it('should use default error message when API response has no message', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAIDiagnose());

    await act(async () => {
      await result.current.diagnose({ symptoms: 'test' });
    });

    expect(result.current.error).toBe('Error al realizar diagnóstico.');
  });

  it('should clear previous error on new diagnosis', async () => {
    axios.post
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ data: { data: { diagnosis: 'OK' } } });

    const { result } = renderHook(() => useAIDiagnose());

    await act(async () => {
      await result.current.diagnose({ symptoms: 'first' });
    });
    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.diagnose({ symptoms: 'second' });
    });
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual({ diagnosis: 'OK' });
  });
});

describe('useAIAsk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with null answer and not loading', () => {
    const { result } = renderHook(() => useAIAsk());

    expect(result.current.answer).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should set answer on successful ask', async () => {
    axios.post.mockResolvedValue({
      data: { data: { answer: 'A pump moves fluids.' } },
    });

    const { result } = renderHook(() => useAIAsk());

    let returnedAnswer;
    await act(async () => {
      returnedAnswer = await result.current.ask('What is a pump?');
    });

    expect(axios.post).toHaveBeenCalledWith('/api/ai/ask', { question: 'What is a pump?' });
    expect(result.current.answer).toBe('A pump moves fluids.');
    expect(returnedAnswer).toBe('A pump moves fluids.');
  });

  it('should set error message on API failure', async () => {
    axios.post.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useAIAsk());

    let returnedAnswer;
    await act(async () => {
      returnedAnswer = await result.current.ask('test');
    });

    expect(result.current.answer).toBe('Error al procesar la pregunta.');
    expect(returnedAnswer).toBeNull();
  });
});
