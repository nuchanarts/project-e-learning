import { test, expect } from '@playwright/test';

test.describe('Course & Video Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display course list', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount({ min: 1 });
  });

  test('should show course detail with videos', async ({ page }) => {
    await page.goto('/courses');
    await page.locator('[data-testid="course-card"]').first().click();
    await expect(page.locator('[data-testid="video-list"]')).toBeVisible();
  });

  test('should track video progress', async ({ page }) => {
    await page.goto('/courses');
    await page.locator('[data-testid="course-card"]').first().click();
    await page.locator('[data-testid="video-item"]').first().click();
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    // Verify progress bar is present
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });
});
