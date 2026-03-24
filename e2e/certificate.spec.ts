import { test, expect } from '@playwright/test';

test.describe('Certificate Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
  });

  test('should show certificate button for completed courses', async ({ page }) => {
    await page.goto('/courses');
    // Navigate to a completed course
    const completedCourse = page.locator('[data-testid="course-card"][data-completed="true"]');
    if (await completedCourse.count() > 0) {
      await completedCourse.first().click();
      await expect(page.locator('[data-testid="certificate-button"]')).toBeVisible();
    }
  });

  test('should not show certificate button for incomplete courses', async ({ page }) => {
    await page.goto('/courses');
    const incompleteCourse = page.locator('[data-testid="course-card"][data-completed="false"]');
    if (await incompleteCourse.count() > 0) {
      await incompleteCourse.first().click();
      await expect(page.locator('[data-testid="certificate-button"]')).not.toBeVisible();
    }
  });

  test('should download certificate as PDF', async ({ page }) => {
    await page.goto('/courses');
    const completedCourse = page.locator('[data-testid="course-card"][data-completed="true"]');
    if (await completedCourse.count() > 0) {
      await completedCourse.first().click();
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="certificate-button"]'),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });
});
