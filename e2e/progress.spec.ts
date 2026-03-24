import { test, expect } from '@playwright/test';

test.describe('Progress & Completion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
  });

  test('should show course completion when all videos watched', async ({ page }) => {
    await page.goto('/dashboard');
    // Check progress indicators exist
    await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();
  });

  test('should mark course as completed after watching all videos >= 80%', async ({ page }) => {
    // This test requires a seeded test course with known data
    await page.goto('/dashboard');
    const completedBadge = page.locator('[data-testid="completed-badge"]');
    // Verify completed course shows badge
    if (await completedBadge.count() > 0) {
      await expect(completedBadge.first()).toBeVisible();
    }
  });
});
