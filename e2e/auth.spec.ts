import { test, expect } from '@playwright/test';

const SEEDED_EMAIL = 'user@bgs.local';
const SEEDED_PASSWORD = 'user1234';
const TEST_EMAIL = `e2e_${Date.now()}@test.local`;
const TEST_PASSWORD = 'password123';

test.describe('Auth Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'E2E Test User');
    await page.fill('[name="email"]', TEST_EMAIL);
    await page.fill('[name="password"]', TEST_PASSWORD);
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should register a new user with CID and hospital', async ({ page }) => {
    const cidEmail = `e2e_cid_${Date.now()}@test.local`;
    await page.goto('/register');
    await page.fill('[name="name"]', 'E2E CID User');
    await page.fill('[name="email"]', cidEmail);
    await page.fill('[name="password"]', TEST_PASSWORD);
    await page.fill('[name="cid"]', '1234567890123');
    await page.fill('[name="hospital"]', 'รพ.สต.บ้านใหม่');
    await page.fill('[name="position"]', 'เจ้าหน้าที่สาธารณสุข');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should reject invalid CID (not 13 digits)', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'Bad CID User');
    await page.fill('[name="email"]', `e2e_badcid_${Date.now()}@test.local`);
    await page.fill('[name="password"]', TEST_PASSWORD);
    await page.fill('[name="cid"]', '123'); // invalid
    await page.click('[type="submit"]');
    // Should stay on register page due to validation
    await expect(page).toHaveURL('/register');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', SEEDED_EMAIL);
    await page.fill('[name="password"]', SEEDED_PASSWORD);
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
    await page.goto('/login');
    await page.fill('[name="email"]', SEEDED_EMAIL);
    await page.fill('[name="password"]', SEEDED_PASSWORD);
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });
});
