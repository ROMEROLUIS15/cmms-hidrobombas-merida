const { test, expect } = require('@playwright/test');

// Credenciales del admin activo sembrado en e2e/global-setup.cjs
const E2E_EMAIL = 'e2e.admin@hidrobombas.test';
const E2E_PASSWORD = 'E2ePass123!';

test.describe('Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should load login page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hidrobombas Mérida' })).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid@test.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login'), { timeout: 15000 }),
      page.getByTestId('submit-button').click(),
    ]);
    expect(resp.status()).toBe(401);
    // El login fallido muestra el error en el formulario y NO sale del login.
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByTestId('email-input').fill(E2E_EMAIL);
    await page.getByTestId('password-input').fill(E2E_PASSWORD);
    await page.getByTestId('submit-button').click();
    // Tras el login, la app redirige al dashboard y monta la navegacion.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('API Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('http://localhost:8001/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should require auth for protected routes', async ({ request }) => {
    const response = await request.get('http://localhost:8001/api/clients');
    expect(response.status()).toBe(401);
  });
});
