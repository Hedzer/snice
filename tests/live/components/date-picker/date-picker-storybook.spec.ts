import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=datepicker--form-integration&viewMode=story';

test('Storybook date-picker form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const pickers = Array.from(document.querySelectorAll('snice-date-picker'));
    return pickers.length === 4
      && pickers.every(picker => picker.shadowRoot?.querySelector('.input'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#date-picker-story-form');
  const delivery = page.locator('#date-picker-story-delivery');
  const legend = page.locator('#date-picker-story-legend');
  const fieldset = page.locator('#date-picker-story-fieldset');
  const input = delivery.locator('.input');
  const output = form.locator('output');

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
  }))).toEqual({
    valid: true,
    entries: [
      ['delivery-date', '2026-03-15'],
      ['confirmed-date', '2026-03-16'],
      ['legend-date', '2026-03-12']
    ]
  });
  expect(await fieldset.evaluate((picker: any) => ({
    authoredDisabled: picker.disabled,
    effectiveDisabled: picker.matches(':disabled'),
    inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
    willValidate: picker.willValidate
  }))).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputDisabled: true,
    willValidate: false
  });
  expect(await legend.evaluate((picker: any) => picker.matches(':disabled'))).toBe(false);

  await input.fill('18/03/2026');
  await input.press('Tab');
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: delivery-date=2026-03-18, confirmed-date=2026-03-16, legend-date=2026-03-12'
  );

  await delivery.locator('.calendar-toggle').click();
  await expect(delivery.locator('[data-date="2026-03-09"]')).toBeDisabled();
  await delivery.locator('[data-date="2026-03-20"]').click();
  expect(await delivery.evaluate((picker: any) => ({
    value: picker.value,
    display: picker.shadowRoot.querySelector('.input').value,
    valid: picker.checkValidity(),
    open: picker.open
  }))).toEqual({ value: '2026-03-20', display: '20/03/2026', valid: true, open: false });

  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toHaveText(
    'Reset: delivery-date=2026-03-15, confirmed-date=2026-03-16, legend-date=2026-03-12'
  );
  expect(await delivery.evaluate((picker: any) => ({
    value: picker.value,
    defaultValue: picker.defaultValue,
    display: picker.shadowRoot.querySelector('.input').value
  }))).toEqual({ value: '2026-03-15', defaultValue: '2026-03-15', display: '15/03/2026' });

  await delivery.locator('.clear-button').click();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Reset: delivery-date=2026-03-15, confirmed-date=2026-03-16, legend-date=2026-03-12'
  );
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#date-picker-story-delivery')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
});
