import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=slider--native-form-validation&viewMode=story';

test('Storybook slider validation story works as a customer form in both themes', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const slider = document.querySelector('snice-slider');
    return slider?.shadowRoot?.querySelector('.slider-thumb');
  });

  const slider = page.locator('snice-slider');
  const form = page.locator('form');
  const output = page.locator('output');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(await slider.evaluate((element: any) => ({
    value: element.value,
    entry: new FormData(element.form).get(element.name),
    valid: element.checkValidity(),
    alerts: element.shadowRoot.querySelectorAll('[role="alert"]').length
  }))).toEqual({ value: 3, entry: '3', valid: true, alerts: 0 });

  await page.getByRole('button', { name: 'Set business-rule error' }).click();
  await expect(output).toHaveText('This rating is unavailable.');
  expect(await slider.evaluate((element: any) => ({
    customError: element.validity.customError,
    formValid: element.form.checkValidity(),
    ariaInvalid: element.shadowRoot.querySelector('.slider-thumb').getAttribute('aria-invalid'),
    alerts: element.shadowRoot.querySelectorAll('[role="alert"]').length
  }))).toEqual({ customError: true, formValid: false, ariaInvalid: 'true', alerts: 1 });

  await page.getByRole('button', { name: 'Submit normalized value' }).click();
  expect(await slider.evaluate((element: any) => ({
    hostFocused: document.activeElement === element,
    thumbFocused: element.shadowRoot.activeElement === element.shadowRoot.querySelector('.slider-thumb')
  }))).toEqual({ hostFocused: true, thumbFocused: true });

  await page.getByRole('button', { name: 'Clear business-rule error' }).click();
  await page.getByRole('button', { name: 'Submit normalized value' }).click();
  await expect(output).toHaveText('Submitted rating=3');
  expect(await slider.evaluate((element: any) => ({
    valid: element.checkValidity(),
    ariaInvalid: element.shadowRoot.querySelector('.slider-thumb').getAttribute('aria-invalid'),
    alerts: element.shadowRoot.querySelectorAll('[role="alert"]').length
  }))).toEqual({ valid: true, ariaInvalid: 'false', alerts: 0 });

  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(output).toHaveText('Reset rating=3');
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(true);

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('snice-slider')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
