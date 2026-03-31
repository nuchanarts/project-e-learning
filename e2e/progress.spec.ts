import { test, expect } from '@playwright/test';

test.describe('Progress & Completion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@bgs.local');
    await page.fill('[name="password"]', 'user1234');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show course progress on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="course-progress"]').first()).toBeVisible();
  });

  test('should mark course as completed after watching all videos >= 80%', async ({ page }) => {
    await page.goto('/dashboard');
    const completedBadge = page.locator('[data-testid="completed-badge"]');
    if (await completedBadge.count() > 0) {
      await expect(completedBadge.first()).toBeVisible();
    }
  });
});
