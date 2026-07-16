import { expect, test } from '@playwright/test';

const showcases = [
  {
    component: 'time picker',
    url: 'http://localhost:5566/website/showcases/time-picker/full.html',
    section: '#time-picker-label-lifecycle',
    host: '#time-showcase-labelled',
    primary: '#time-showcase-primary-label',
    target: '.input',
    change: '#time-showcase-change-label',
    errorButton: '#time-showcase-toggle-error',
    labelsButton: '#time-showcase-toggle-labels',
    initialName: 'Appointment time required',
    changedName: 'Event starts required',
    fallbackName: 'Internal time fallback',
    error: 'Choose an available time.'
  },
  {
    component: 'color picker',
    url: 'http://localhost:5566/website/showcases/color-picker/full.html',
    section: '#color-picker-label-lifecycle',
    host: '#color-showcase-labelled',
    primary: '#color-showcase-primary-label',
    target: '.color-input',
    change: '#color-showcase-change-label',
    errorButton: '#color-showcase-toggle-error',
    labelsButton: '#color-showcase-toggle-labels',
    initialName: 'Brand color required',
    changedName: 'Surface color required',
    fallbackName: 'Internal color fallback',
    error: 'Choose a color with sufficient contrast.'
  }
] as const;

for (const showcase of showcases) {
  test(`${showcase.component} full showcase exercises the external-label lifecycle`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(showcase.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(({ host, target }) =>
      Boolean(document.querySelector(host)?.shadowRoot?.querySelector(target)), showcase);

    await expect(page.locator(showcase.section).getByRole('heading', { name: 'External Label Lifecycle' })).toBeVisible();
    const host = page.locator(showcase.host);
    const target = host.locator(showcase.target);
    await expect(target).toHaveAccessibleName(showcase.initialName);
    expect(await host.evaluate((picker: any) => picker.labels.length)).toBe(2);
    const descriptionId = await target.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(host.locator(`#${descriptionId}`)).toHaveCount(1);

    await page.locator(showcase.primary).click();
    await expect(target).toBeFocused();
    if (showcase.component === 'time picker') {
      expect(await host.evaluate((picker: any) => picker.showDropdown)).toBe(false);
    }
    await page.locator(showcase.change).click();
    await expect(target).toHaveAccessibleName(showcase.changedName);
    await page.locator(showcase.errorButton).click();
    await expect(target).toHaveAttribute('aria-invalid', 'true');
    await expect(host.locator('.error-text')).toHaveText(showcase.error);
    await expect(host.locator('.helper-text')).toHaveCount(0);
    await page.locator(showcase.labelsButton).click();
    await expect(target).toHaveAccessibleName(showcase.fallbackName);
    expect(await host.evaluate((picker: any) => picker.labels.length)).toBe(0);
    await page.locator(showcase.labelsButton).click();
    await expect(target).toHaveAccessibleName(showcase.changedName);

    if (showcase.component === 'time picker') {
      const inline = page.locator('#time-showcase-inline');
      await expect(inline.locator('.dropdown')).toHaveAccessibleName('Inline schedule controls');
      await expect(inline.locator('[data-time-unit="hours"]')).toHaveAccessibleName('Inline schedule hours');
    } else {
      await expect(host.locator('.color-swatch')).toHaveAccessibleName(`${showcase.changedName} color chooser`);
      await expect(host.locator('[data-color]').first()).toHaveAccessibleName(/Set Surface color required to #/);
      const swatchOnly = page.locator('#color-showcase-swatch');
      await expect(swatchOnly.locator('.color-swatch')).toHaveAccessibleName('Swatch color');
      await expect(swatchOnly.locator('.color-input')).toHaveCount(0);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
    await page.evaluate(() => localStorage.setItem('snice-theme', 'light'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
    await expect(page.locator(showcase.section)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
