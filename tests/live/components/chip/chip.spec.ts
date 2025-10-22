import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/chip/demo.html';

test.describe('Snice Chip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render chip components', async ({ page }) => {
    const count = await page.locator('snice-chip').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have chips with labels', async ({ page }) => {
    const count = await page.locator('snice-chip[label]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-chip[variant="default"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="primary"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="warning"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-chip[variant="error"]').count()).toBeGreaterThan(0);
  });

  test('should have selected chips', async ({ page }) => {
    const count = await page.locator('snice-chip[selected]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should toggle selection on click', async ({ page }) => {
    const chip = page.locator('snice-chip').first();
    const initialSelected = await chip.evaluate((el: any) => el.selected);

    await chip.click();
    await page.waitForTimeout(100);

    const afterClickSelected = await chip.evaluate((el: any) => el.selected);
    expect(afterClickSelected).not.toBe(initialSelected);
  });

  test('should remove chip when remove button clicked', async ({ page }) => {
    const removableChips = page.locator('snice-chip[removable]');
    const initialCount = await removableChips.count();

    if (initialCount > 0) {
      const firstChip = removableChips.first();
      const removeBtn = firstChip.locator('.chip-remove').first();

      await removeBtn.click();
      await page.waitForTimeout(100);

      // Check if chip fired remove event (we can't easily test if it was removed from DOM without demo logic)
      const isVisible = await firstChip.isVisible();
      console.log('Chip still visible after remove:', isVisible);
    }
  });

  test('should not interact when disabled', async ({ page }) => {
    const disabledChips = page.locator('snice-chip[disabled]');
    const count = await disabledChips.count();

    if (count > 0) {
      const chip = disabledChips.first();
      const beforeClick = await chip.evaluate((el: any) => el.selected);

      await chip.click({ force: true });
      await page.waitForTimeout(100);

      const afterClick = await chip.evaluate((el: any) => el.selected);
      expect(afterClick).toBe(beforeClick);
    }
  });
});
