import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=daterangepicker--form-integration&viewMode=story';

test('Storybook date-range form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const pickers = Array.from(document.querySelectorAll('snice-date-range-picker'));
    return pickers.length === 4
      && pickers.every(picker => picker.shadowRoot?.querySelector('.input'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#date-range-picker-story-form');
  const booking = page.locator('#date-range-picker-story-booking');
  const legend = page.locator('#date-range-picker-story-legend');
  const fieldset = page.locator('#date-range-picker-story-fieldset');
  const output = form.locator('output');

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
  }))).toEqual({
    valid: true,
    entries: [
      ['booking-start', '2026-03-10'],
      ['booking-end', '2026-03-20'],
      ['confirmed-start', '2026-03-12'],
      ['confirmed-end', '2026-03-18'],
      ['legend-start', '2026-03-04'],
      ['legend-end', '2026-03-05']
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

  await booking.locator('.clear-button').click();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Ready');

  await booking.locator('.calendar-toggle').click();
  await expect(booking.locator('.month')).toHaveCount(2);
  const popupBounds = await booking.locator('.calendar').evaluate(element => {
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
  await booking.locator('[data-date="2026-03-12"]').click();
  await booking.locator('[data-date="2026-03-22"]').click();
  expect(await booking.evaluate((picker: any) => ({
    start: picker.start,
    end: picker.end,
    display: picker.shadowRoot.querySelector('.input').value,
    valid: picker.checkValidity(),
    open: picker.showCalendar
  }))).toEqual({
    start: '12/03/2026',
    end: '22/03/2026',
    display: '12/03/2026  —  22/03/2026',
    valid: true,
    open: false
  });
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: booking-start=2026-03-12, booking-end=2026-03-22, confirmed-start=2026-03-12, confirmed-end=2026-03-18, legend-start=2026-03-04, legend-end=2026-03-05'
  );

  await booking.locator('.calendar-toggle').click();
  await expect(booking.locator('[data-date="2026-04-01"]')).toBeDisabled();
  await booking.locator('[data-preset="0"]').click();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: booking-start=2026-03-05, booking-end=2026-03-11, confirmed-start=2026-03-12, confirmed-end=2026-03-18, legend-start=2026-03-04, legend-end=2026-03-05'
  );

  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toHaveText(
    'Reset: booking-start=2026-03-10, booking-end=2026-03-20, confirmed-start=2026-03-12, confirmed-end=2026-03-18, legend-start=2026-03-04, legend-end=2026-03-05'
  );
  expect(await booking.evaluate((picker: any) => ({
    start: picker.start,
    end: picker.end,
    defaultStart: picker.defaultStart,
    defaultEnd: picker.defaultEnd,
    display: picker.shadowRoot.querySelector('.input').value
  }))).toEqual({
    start: '2026-03-10',
    end: '2026-03-20',
    defaultStart: '2026-03-10',
    defaultEnd: '2026-03-20',
    display: '10/03/2026  —  20/03/2026'
  });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#date-range-picker-story-booking')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
