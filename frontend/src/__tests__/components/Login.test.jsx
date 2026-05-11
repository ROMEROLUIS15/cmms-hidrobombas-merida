import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/Login';

vi.mock('axios');

const mockOnLogin = vi.fn();

const renderLogin = (props = {}) => {
  return render(
    <BrowserRouter>
      <Login onLogin={mockOnLogin} {...props} />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.toast = { success: vi.fn(), error: vi.fn() };
  });

  describe('Initial Rendering', () => {
    it('should render login form with email and password fields', () => {
      renderLogin();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should show "Iniciar Sesión" as the default submit button text', () => {
      renderLogin();
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Iniciar Sesión');
    });

    it('should have a forgot password link', () => {
      renderLogin();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update email input value', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'test@example.com');
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'password123');
      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByTestId('toggle-password-visibility');
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
    });
  });

  describe('Mode Switching', () => {
    it('should switch to registration mode when clicking toggle button', async () => {
      const user = userEvent.setup();
      renderLogin();

      const toggleButton = screen.getByTestId('toggle-mode-button');
      await user.click(toggleButton);

      expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
      expect(screen.getByTestId('full-name-input')).toBeInTheDocument();
    });

    it('should show registration fields when in register mode', async () => {
      const user = userEvent.setup();
      renderLogin({ isRegisterMode: true });

      expect(screen.getByTestId('full-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('role-select')).toBeInTheDocument();
    });

    it('should clear form when switching modes', async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('toggle-mode-button'));

      expect(screen.getByTestId('email-input').value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show password strength meter during registration', async () => {
      const user = userEvent.setup();
      renderLogin({ isRegisterMode: true });

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'StrongPass1');

      expect(screen.getByText('Seguridad:')).toBeInTheDocument();
    });

    it('should show password requirements during registration', async () => {
      const user = userEvent.setup();
      renderLogin({ isRegisterMode: true });

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'WeakPass');

      expect(screen.getByText('8+ caracteres')).toBeInTheDocument();
      expect(screen.getByText('Mayúscula')).toBeInTheDocument();
    });
  });

  describe('Remember Me', () => {
    it('should show remember me checkbox in login mode', () => {
      renderLogin();
      expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
    });

    it('should not show remember me checkbox in registration mode', () => {
      renderLogin({ isRegisterMode: true });
      expect(screen.queryByTestId('remember-me-checkbox')).not.toBeInTheDocument();
    });
  });
});