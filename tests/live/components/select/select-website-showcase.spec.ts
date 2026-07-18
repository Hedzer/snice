import { expect, test } from '@playwright/test';

const showcaseUrl = 'http://localhost:5566/website/showcases/select/full.html';

test('select full showcase renders and exercises its external-label lifecycle', async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(showcaseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const selects = Array.from(document.querySelectorAll('snice-select'));
    return selects.length === 42 && selects.every(select => select.shadowRoot?.querySelector('.select-trigger, .select-editable-input'));
  });

  await expect(page.getByRole('heading', { name: 'External Label Lifecycle', exact: true })).toBeVisible();
  const standard = page.locator('#select-showcase-standard');
  const standardTarget = standard.locator('.select-trigger');
  await expect(standardTarget).toHaveAttribute('aria-label', 'Shipping country required');
  expect(await standard.evaluate((select: any) => Array.from(select.labels, (label: HTMLLabelElement) => label.id)))
    .toEqual(['select-showcase-primary-label', 'select-showcase-secondary-label']);

  const description = await standardTarget.getAttribute('aria-describedby');
  expect(description).toBeTruthy();
  expect(await standard.evaluate((select: HTMLElement, id) => ({
    count: select.shadowRoot?.querySelectorAll(`#${id}`).length,
    text: select.shadowRoot?.querySelector(`#${id}`)?.textContent,
  }), description)).toEqual({ count: 1, text: 'Used to calculate delivery options.' });

  await page.locator('#select-showcase-primary-label').click();
  expect(await standard.evaluate((select: HTMLElement) => select.shadowRoot?.activeElement?.classList.contains('select-trigger'))).toBe(true);
  expect(await standard.evaluate((select: any) => select.open)).toBe(false);

  await page.locator('#select-showcase-change-label').click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Billing country required');
  await page.locator('#select-showcase-toggle-error').click();
  await expect(standardTarget).toHaveAttribute('aria-invalid', 'true');
  await expect(standard.locator('.select-error-text')).toHaveText('Choose an available country.');
  expect(await standard.locator('.select-helper-text').count()).toBe(0);

  await page.locator('#select-showcase-toggle-labels').click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Select');
  expect(await standard.evaluate((select: any) => select.labels?.length ?? 0)).toBe(0);
  await page.locator('#select-showcase-toggle-labels').click();
  await expect(standardTarget).toHaveAttribute('aria-label', 'Billing country required');

  const editable = page.locator('#select-showcase-editable');
  await expect(editable.locator('.select-editable-input')).toHaveAttribute('aria-label', 'Editable destination');
  await page.locator('#select-showcase-wrapping-label').click({ position: { x: 8, y: 8 } });
  expect(await editable.evaluate((select: HTMLElement) => select.shadowRoot?.activeElement?.classList.contains('select-editable-input'))).toBe(true);
  expect(await editable.evaluate((select: any) => select.open)).toBe(true);
  await editable.locator('.select-editable-input').press('Escape');
  expect(await editable.evaluate((select: any) => select.open)).toBe(false);

  const disabled = page.locator('#select-showcase-disabled');
  await page.locator('label[for="select-showcase-disabled"]').click();
  expect(await disabled.evaluate((select: HTMLElement) => Boolean(select.shadowRoot?.activeElement))).toBe(false);

  const programmatic = page.locator('#programmatic');
  expect(await programmatic.evaluate((select: any) => select.options.map((option: any) => option.value)))
    .toEqual(['node', 'deno', 'bun', 'workers']);
  await programmatic.locator('.select-trigger').click();
  await expect(programmatic.locator('.select-option')).toHaveCount(4);

  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await page.evaluate(() => localStorage.setItem('snice-theme', 'light'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#select-label-lifecycle')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await page.setViewportSize({ width: 194, height: 844 });
  expect(await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))).toEqual({ viewport: 194, scroll: 194 });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
