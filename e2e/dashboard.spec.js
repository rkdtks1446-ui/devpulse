const { test, expect } = require('@playwright/test');

test('E2E: DevPulse dashboard analyzes PR size and Conventional Commit message', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('DevPulse Dashboard');

  await page.fill('#linesInput', '450');
  await page.fill('#commitInput', 'feat(tdd): add release readiness engine');
  await page.click('button:has-text("분석하기")');

  await expect(page.locator('#checkResult')).toContainText('PR Size: Medium (450 lines) | Conventional Commit: PASS');
});

test('E2E: failure screenshot artifact capture verification', async ({ page }) => {
  test.skip(process.env.DEMO_FAILURE_SCREENSHOT !== '1', 'Runs only when verifying failure screenshot capture');
  await page.goto('/');
  await expect(page.locator('#checkResult')).toContainText('INTENTIONAL_FAILURE_FOR_SCREENSHOT_ARTIFACT', { timeout: 2000 });
});
