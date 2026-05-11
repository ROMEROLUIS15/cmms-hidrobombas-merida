import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial online state from navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should return false for isOnline when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('should update isOnline when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });

    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('should update isOnline to false and set wasOffline when offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});