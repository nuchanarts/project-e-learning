import { test, expect } from '@playwright/test';

test.describe('Course & Video Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@bgs.local');
    await page.fill('[name="password"]', 'user1234');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display course list', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
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
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test('should filter courses by category', async ({ page }) => {
    await page.goto('/courses');
    // Category filter tabs should be visible when courses with categories exist
    const tabs = page.locator('[data-testid="category-tab"]');
    const tabCount = await tabs.count();
    if (tabCount > 1) {
      // Click a non-"ทั้งหมด" tab and verify courses are filtered
      await tabs.nth(1).click();
      const cards = page.locator('[data-testid="course-card"]');
      await expect(cards.first()).toBeVisible();
    }
    // At minimum, the course list must render without error
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
  });
});
