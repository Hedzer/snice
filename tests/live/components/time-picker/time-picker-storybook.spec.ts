import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=timepicker--form-integration&viewMode=story';

test('Storybook time form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const pickers = Array.from(document.querySelectorAll('snice-time-picker'));
    return pickers.length === 4 && pickers.every(picker => picker.shadowRoot);
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#time-picker-story-form');
  const appointment = page.locator('#time-picker-story-appointment');
  const legend = page.locator('#time-picker-story-legend');
  const fieldset = page.locator('#time-picker-story-fieldset');
  const output = form.locator('output');

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
  }))).toEqual({
    valid: true,
    entries: [
      ['appointment', '14:05:10'],
      ['confirmed', '16:30'],
      ['legend-time', '11:00']
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

  await appointment.locator('.clear-button').click();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Ready');

  const input = appointment.locator('.input');
  await input.fill('3:30:15 PM');
  await input.blur();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: appointment=15:30:15, confirmed=16:30, legend-time=11:00'
  );

  await appointment.locator('.clock-toggle').click();
  const popupBounds = await appointment.locator('.dropdown').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  });
  expect(popupBounds.left).toBeGreaterThanOrEqual(0);
  expect(popupBounds.top).toBeGreaterThanOrEqual(0);
  expect(popupBounds.right).toBeLessThanOrEqual(popupBounds.viewportWidth);
  expect(popupBounds.bottom).toBeLessThanOrEqual(popupBounds.viewportHeight);
  await appointment.locator('[data-hour="4"]').click();
  await appointment.locator('[data-minute="30"]').click();
  await appointment.locator('[data-second="45"]').click();
  await appointment.locator('.selector-column--period .selector-item', { hasText: 'PM' }).click();
  await appointment.evaluate((picker: any) => picker.close());
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: appointment=16:30:45, confirmed=16:30, legend-time=11:00'
  );

  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toHaveText(
    'Reset: appointment=14:05:10, confirmed=16:30, legend-time=11:00'
  );
  expect(await appointment.evaluate((picker: any) => ({
    value: picker.value,
    defaultValue: picker.defaultValue,
    display: picker.shadowRoot.querySelector('.input').value
  }))).toEqual({
    value: '14:05:10',
    defaultValue: '14:05:10',
    display: '2:05:10 PM'
  });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#time-picker-story-appointment')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
