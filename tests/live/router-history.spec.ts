import { expect, test } from '@playwright/test';

for (const type of ['hash', 'pushstate'] as const) {
  test(`programmatic ${type} navigation records browser history`, async ({ page }) => {
    await page.goto(`/tests/live/fixtures/router-history.html?type=${type}`);
    await expect(page.locator('router-history-home')).toBeVisible();

    await page.evaluate(() => window.routerNavigate('/about'));
    await expect(page.locator('router-history-about')).toBeVisible();
    if (type === 'hash') await expect(page).toHaveURL(/#\/about$/);
    else await expect(page).toHaveURL(/\/about$/);

    await page.goBack();
    await expect(page.locator('router-history-home')).toBeVisible();
  });
}

declare global {
  interface Window {
    routerNavigate(path: string): Promise<void>;
  }
}
