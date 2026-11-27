import { test, expect } from '@playwright/test';

test.describe('Website Themes Showcase Platform Switcher (PS-09)', () => {
  test('switches live [data-platform] skins cleanly across all 5 options with accessible radiogroup semantics and zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/website/public/themes.html', { waitUntil: 'load' });
    await page.waitForTimeout(250);

    const group = page.locator('#platform-switcher');
    await expect(group).toBeVisible();
    await expect(group).toHaveAttribute('role', 'radiogroup');

    for (const pf of ['ios', 'material', 'windows', 'macos', 'default'] as const) {
      const btn = group.locator(`[data-platform-choice="${pf}"]`);
      await btn.click();
      await expect(btn).toHaveAttribute('aria-checked', 'true');

      const panelPlatform = await page.evaluate(() => {
        const panel = document.querySelector('.theme-preview-panel');
        return panel?.getAttribute('data-platform') ?? null;
      });
      expect(panelPlatform).toBe(pf === 'default' ? null : pf);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
});
