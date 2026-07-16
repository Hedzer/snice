import { expect, test } from '@playwright/test';

const showcases = [
  {
    component: 'date picker',
    url: 'http://localhost:5566/website/showcases/date-picker/full.html',
    section: '#date-picker-label-lifecycle',
    host: '#date-showcase-labelled',
    primary: '#date-showcase-primary-label',
    change: '#date-showcase-change-label',
    errorButton: '#date-showcase-toggle-error',
    labelsButton: '#date-showcase-toggle-labels',
    initialName: 'Arrival date required',
    changedName: 'Departure date required',
    fallbackName: 'Internal date fallback',
    error: 'Choose an available date.',
    popupState: 'open'
  },
  {
    component: 'date range picker',
    url: 'http://localhost:5566/website/showcases/date-range-picker/full.html',
    section: '#date-range-picker-label-lifecycle',
    host: '#range-showcase-labelled',
    primary: '#range-showcase-primary-label',
    change: '#range-showcase-change-label',
    errorButton: '#range-showcase-toggle-error',
    labelsButton: '#range-showcase-toggle-labels',
    initialName: 'Booking dates required',
    changedName: 'Travel window required',
    fallbackName: 'Internal range fallback',
    error: 'Choose a complete available range.',
    popupState: 'showCalendar'
  },
  {
    component: 'date-time picker',
    url: 'http://localhost:5566/website/showcases/date-time-picker/full.html',
    section: '#date-time-picker-label-lifecycle',
    host: '#datetime-showcase-labelled',
    primary: '#datetime-showcase-primary-label',
    change: '#datetime-showcase-change-label',
    errorButton: '#datetime-showcase-toggle-error',
    labelsButton: '#datetime-showcase-toggle-labels',
    initialName: 'Appointment required',
    changedName: 'Event starts required',
    fallbackName: 'Internal date-time fallback',
    error: 'Choose an available date and time.',
    popupState: 'showPanel'
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
    await page.waitForFunction(({ host }) => Boolean(document.querySelector(host)?.shadowRoot?.querySelector('.input')), showcase);

    await expect(page.locator(showcase.section).getByRole('heading', { name: 'External Label Lifecycle' })).toBeVisible();
    const host = page.locator(showcase.host);
    const target = host.locator('.input');
    await expect(target).toHaveAccessibleName(showcase.initialName);
    expect(await host.evaluate((picker: any) => picker.labels.length)).toBe(2);
    const descriptionId = await target.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(host.locator(`#${descriptionId}`)).toHaveCount(1);

    await page.locator(showcase.primary).click();
    await expect(target).toBeFocused();
    expect(await host.evaluate((picker: any, state) => Boolean(picker[state]), showcase.popupState)).toBe(false);
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

    if (showcase.component === 'date-time picker') {
      const inline = page.locator('#datetime-showcase-inline');
      await expect(inline.locator('.panel')).toHaveAccessibleName('Inline schedule controls');
      await expect(inline.locator('[data-time-unit="seconds"]')).toHaveAccessibleName('Inline schedule seconds');
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
