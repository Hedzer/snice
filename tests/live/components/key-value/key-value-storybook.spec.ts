import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=keyvalue--form-integration&viewMode=story';
const canonical = (items: Array<{ key: string; value: string; description?: string }>) => JSON.stringify(
  items.map(item => ({ key: item.key, value: item.value, description: item.description ?? '' }))
);

test('Storybook key-value form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
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
    const editors = Array.from(document.querySelectorAll('snice-key-value'));
    return editors.length === 4 && editors.every(editor => editor.shadowRoot);
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#key-value-story-form');
  const main = page.locator('#key-value-story-main');
  const legend = page.locator('#key-value-story-legend');
  const fieldset = page.locator('#key-value-story-fieldset');
  const output = form.locator('output');
  const initial = [
    { key: 'Accept', value: 'application/json', description: 'Preferred response' },
    { key: 'X-Trace', value: '✓ 東京', description: 'Unicode survives' },
  ];
  const readonly = [
    { key: 'Set-Cookie', value: 'session=one', description: 'First cookie' },
    { key: 'Set-Cookie', value: 'theme=dark', description: 'Second cookie' },
  ];

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)]),
  }))).toEqual({
    valid: true,
    entries: [
      ['headers', canonical(initial)],
      ['response-headers', canonical(readonly)],
      ['legend-metadata', canonical([{ key: 'legend', value: 'included', description: '' }])],
    ],
  });
  expect(await fieldset.evaluate((editor: any) => ({
    authoredDisabled: editor.disabled,
    effectiveDisabled: editor.matches(':disabled'),
    inputsDisabled: Array.from(editor.shadowRoot.querySelectorAll('input')).every((input: any) => input.disabled),
    buttonsDisabled: Array.from(editor.shadowRoot.querySelectorAll('button')).every((button: any) => button.disabled),
    willValidate: editor.willValidate,
  }))).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputsDisabled: true,
    buttonsDisabled: true,
    willValidate: false,
  });
  expect(await legend.evaluate((editor: any) => editor.matches(':disabled'))).toBe(false);

  const keys = main.locator('[part="key-input"]');
  const values = main.locator('[part="value-input"]');
  const descriptions = main.locator('[part="description-input"]');
  await keys.nth(2).fill('Accept');
  await expect.poll(() => main.evaluate((editor: any) => editor.getItems()[2]?.key)).toBe('Accept');
  await values.nth(2).fill('text/plain');
  await expect.poll(() => main.evaluate((editor: any) => editor.getItems()[2]?.value)).toBe('text/plain');
  await descriptions.nth(2).fill('Third duplicate');
  await expect.poll(() => main.evaluate((editor: any) => editor.getItems()[2]?.description)).toBe('Third duplicate');
  const edited = [...initial, { key: 'Accept', value: 'text/plain', description: 'Third duplicate' }];
  expect(await main.evaluate((editor: any) => ({
    value: editor.value,
    items: editor.getItems(),
    rows: editor.shadowRoot.querySelectorAll('[part="row"]').length,
  }))).toEqual({ value: canonical(edited), items: edited, rows: 4 });

  await keys.nth(2).fill('');
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Ready');
  await expect(keys.nth(2)).toHaveAttribute('aria-invalid', 'true');

  await keys.nth(2).fill('Accept');
  await expect.poll(() => main.evaluate((editor: any) => editor.getItems()[2]?.key)).toBe('Accept');
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toContainText(`headers=${canonical(edited)}`);
  await expect(output).toContainText(`response-headers=${canonical(readonly)}`);

  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toContainText(`Reset: headers=${canonical(initial)}`);
  expect(await main.evaluate((editor: any) => ({
    value: editor.value,
    defaultValue: editor.defaultValue,
    items: editor.getItems(),
  }))).toEqual({ value: canonical(initial), defaultValue: canonical(initial), items: initial });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#key-value-story-main')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
