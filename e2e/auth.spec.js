const { test, expect } = require('@playwright/test');

test.describe('Authentication E2E', () => {
  const BACKEND_URL = 'http://localhost:8001';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load login page', async ({ page }) => {
    await expect(page.locator('text=CMMS')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@hidrobombasmerida.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
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