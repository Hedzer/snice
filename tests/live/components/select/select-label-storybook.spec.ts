import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=select--external-label-lifecycle&viewMode=story';

test('Storybook select label story stays associated, interactive, responsive, and theme-complete', async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const selects = Array.from(document.querySelectorAll('#select-label-story snice-select'));
    return selects.length === 3 && selects.every(select => select.shadowRoot?.querySelector('.select-trigger, .select-editable-input'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const standard = page.locator('#select-story-standard');
  const standardTarget = standard.locator('.select-trigger');
  await expect(standardTarget).toHaveAttribute('aria-label', 'Shipping country required');
  expect(await standard.evaluate((select: any) => Array.from(select.labels, (label: HTMLLabelElement) => label.textContent?.trim())))
    .toEqual(['Shipping country', '(required)']);

  const description = await standardTarget.getAttribute('aria-describedby');
  expect(description).toBeTruthy();
  expect(await standard.evaluate((select: HTMLElement, id) => ({
    count: select.shadowRoot?.querySelectorAll(`#${id}`).length,
    text: select.shadowRoot?.querySelector(`#${id}`)?.textContent,
  }), description)).toEqual({ count: 1, text: 'Used to calculate delivery options.' });

  await page.locator('label[for="select-story-standard"]').first().click();
  expect(await standard.evaluate((select: HTMLElement) => select.shadowRoot?.activeElement?.classList.contains('select-trigger'))).toBe(true);
  expect(await standard.evaluate((select: any) => select.open)).toBe(false);

  await page.getByRole('button', { name: 'Change label' }).click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Billing country required');
  await expect(page.locator('#select-label-story output')).toHaveText('Accessible name: Billing country required');

  await page.getByRole('button', { name: 'Show error' }).click();
  await expect(standardTarget).toHaveAttribute('aria-invalid', 'true');
  await expect(standard.locator('.select-error-text')).toHaveText('Choose an available country.');
  expect(await standard.locator('.select-helper-text').count()).toBe(0);
  expect(await standard.evaluate((select: HTMLElement, id) => select.shadowRoot?.querySelectorAll(`#${id}`).length, description)).toBe(1);

  await page.getByRole('button', { name: 'Remove external labels' }).click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Select');
  expect(await standard.evaluate((select: any) => select.labels?.length ?? 0)).toBe(0);
  await page.getByRole('button', { name: 'Restore external labels' }).click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Billing country required');

  const editable = page.locator('#select-story-editable');
  const editableInput = editable.locator('.select-editable-input');
  await expect(editableInput).toHaveAttribute('aria-label', 'Editable destination');
  await page.locator('#select-label-story .wrapping-label').click({ position: { x: 8, y: 8 } });
  expect(await editable.evaluate((select: HTMLElement) => select.shadowRoot?.activeElement?.classList.contains('select-editable-input'))).toBe(true);
  expect(await editable.evaluate((select: any) => select.open)).toBe(true);
  await editableInput.press('Escape');
  expect(await editable.evaluate((select: any) => select.open)).toBe(false);

  const disabled = page.locator('#select-story-disabled');
  await page.locator('label[for="select-story-disabled"]').click();
  expect(await disabled.evaluate((select: HTMLElement) => Boolean(select.shadowRoot?.activeElement))).toBe(false);

  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#select-label-story')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
