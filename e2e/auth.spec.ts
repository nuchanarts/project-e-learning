import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected page without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Then logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });
});
