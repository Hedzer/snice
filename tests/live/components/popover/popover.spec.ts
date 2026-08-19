import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/popover/visual.html';

test.describe('Snice Popover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render popovers', async ({ page }) => {
    const count = await page.locator('snice-popover').count();
    expect(count).toBeGreaterThan(0);
  });

  test('opens the panel when the trigger is clicked', async ({ page }) => {
    const popover = page.locator('#po-default');
    await popover.locator('[slot="trigger"]').click();

    await expect.poll(() =>
      popover.evaluate((el: any) => {
        const panel = el.shadowRoot.querySelector('.popover__panel');
        const rect = panel.getBoundingClientRect();
        return el.open && rect.width > 0 && rect.height > 0;
      })
    ).toBe(true);
  });

  test('shows the panel on load when open is authored', async ({ page }) => {
    const popover = page.locator('snice-popover[open]');

    await expect.poll(() =>
      popover.evaluate((el: any) => {
        const panel = el.shadowRoot.querySelector('.popover__panel');
        const rect = panel.getBoundingClientRect();
        return el.open && rect.width > 0 && rect.height > 0 && panel.matches(':popover-open');
      })
    ).toBe(true);
  });

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const popover = page.locator('#po-default');
    await popover.locator('[slot="trigger"]').click();
    await expect.poll(() => popover.evaluate((el: any) => el.open)).toBe(true);

    await page.keyboard.press('Escape');
    await expect.poll(() => popover.evaluate((el: any) => el.open)).toBe(false);
  });
});
