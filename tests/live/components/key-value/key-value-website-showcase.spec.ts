import { expect, test } from '@playwright/test';

const websiteUrl = process.env.KEY_VALUE_WEBSITE_URL || '/components.html#comp-key-value';
const canonical = (items: Array<{ key: string; value: string; description?: string }>) => JSON.stringify(
  items.map(item => ({ key: item.key, value: item.value, description: item.description ?? '' }))
);

test('public website key-value card, docs, and full showcase preserve every major capability', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(websiteUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const section = document.querySelector('#comp-key-value');
    const editor = section?.querySelector('#demo-kv-declarative') as any;
    const imperative = section?.querySelector('#demo-kv-imperative') as any;
    return editor?.shadowRoot && imperative?.getItems?.().length === 3;
  });

  const cardState = await page.locator('#comp-key-value').evaluate(section => {
    const editors = Array.from(section.querySelectorAll('snice-key-value')) as any[];
    const declarative = section.querySelector('#demo-kv-declarative') as any;
    const imperative = section.querySelector('#demo-kv-imperative') as any;
    const view = section.querySelector('#demo-kv-view') as any;
    const fixed = section.querySelector('#demo-kv-fixed') as any;
    return {
      total: editors.length,
      rendered: editors.filter(editor => editor.shadowRoot).length,
      declarative: declarative.getItems(),
      imperative: imperative.getItems(),
      viewRows: view.shadowRoot.querySelectorAll('[part="view-row"]').length,
      fixedRows: fixed.shadowRoot.querySelectorAll('[part="row"]').length,
      moreLink: Boolean(section.querySelector('.more-link[data-slug="key-value"]')),
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    };
  });
  expect(cardState).toEqual({
    total: 5,
    rendered: 5,
    declarative: [
      { key: 'Content-Type', value: 'application/json', description: '' },
      { key: 'Authorization', value: 'Bearer token123', description: '' },
    ],
    imperative: [
      { key: 'NODE_ENV', value: 'production', description: '' },
      { key: 'PORT', value: '3000', description: '' },
      { key: 'DATABASE_URL', value: 'postgres://localhost/mydb', description: '' },
    ],
    viewRows: 4,
    fixedRows: 3,
    moreLink: true,
    viewport: cardState.viewport,
    scroll: cardState.scroll,
  });
  expect(cardState.scroll).toBeLessThanOrEqual(cardState.viewport);

  const cardItems = [
    { key: 'region', value: 'us-east-1', description: 'Primary region' },
    { key: 'tag', value: 'stable', description: 'First duplicate' },
    { key: 'tag', value: '東京 ✓', description: 'Duplicate and Unicode' },
  ];
  const cardForm = page.locator('#showcase-key-value-form');
  const cardEditor = page.locator('#showcase-key-value-form-editor');
  expect(await cardForm.evaluate((form: HTMLFormElement) => ({
    valid: form.checkValidity(),
    entries: Array.from(new FormData(form).entries()).map(([name, value]) => [name, String(value)]),
  }))).toEqual({ valid: true, entries: [['metadata', canonical(cardItems)]] });
  await cardEditor.locator('[part="key-input"]').first().fill('');
  expect(await cardForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
  await cardForm.getByRole('button', { name: 'Reset' }).click();
  expect(await cardEditor.evaluate((editor: any) => editor.value)).toBe(canonical(cardItems));

  await page.locator('#comp-key-value .more-link[data-slug="key-value"]').click();
  await expect(page.locator('#help-drawer')).toHaveClass(/open/);
  const docs = page.locator('#help-drawer-body');
  await expect(docs).toContainText('ordered JSON entry-array');
  await expect(docs).toContainText('Duplicate keys and entry order are preserved');
  await expect(docs).toContainText('defaultValue');
  await expect(docs).toContainText('badInput');

  await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
  const frame = page.frameLocator('#help-drawer-iframe');
  await expect(frame.getByRole('heading', { name: 'Native form lifecycle', exact: true })).toBeVisible();
  await frame.locator('snice-key-value').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const iframe = document.querySelector('#help-drawer-iframe') as HTMLIFrameElement;
    const editor = iframe.contentDocument?.querySelector('#key-value-showcase-editor') as any;
    return editor?.shadowRoot && editor.getItems?.().length === 3;
  });

  const showcaseState = await frame.locator('body').evaluate(body => {
    const editors = Array.from(body.querySelectorAll('snice-key-value')) as any[];
    const state = (id: string) => {
      const editor = body.querySelector(`#${id}`) as any;
      return { items: editor.getItems(), rows: editor.shadowRoot.querySelectorAll('[part="row"]').length };
    };
    return {
      total: editors.length,
      rendered: editors.filter(editor => editor.shadowRoot).length,
      populated: state('kv-populated'),
      viewRows: (body.querySelector('#kv-view') as any).shadowRoot.querySelectorAll('[part="view-row"]').length,
      compact: state('kv-compact'),
      descriptions: state('kv-desc'),
      viewDescriptionRows: (body.querySelector('#kv-view-desc') as any).shadowRoot.querySelectorAll('[part="view-row"]').length,
      disabled: state('kv-disabled'),
      readonly: state('kv-readonly'),
      copyButton: Boolean((body.querySelector('#kv-copy') as any).shadowRoot.querySelector('[part="copy-button"]')),
      fixed3: Array.from(body.querySelectorAll('snice-key-value[rows="3"]'))
        .every((editor: any) => editor.shadowRoot.querySelectorAll('[part="row"]').length === 3),
      fixed5: Array.from(body.querySelectorAll('snice-key-value[rows="5"]'))
        .every((editor: any) => editor.shadowRoot.querySelectorAll('[part="row"]').length === 5),
      declarative: Array.from(body.querySelectorAll('snice-key-value')).find((editor: any) => editor.label === 'Declarative Pairs')?.getItems(),
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    };
  });
  expect(showcaseState.total).toBeGreaterThanOrEqual(25);
  expect(showcaseState.rendered).toBe(showcaseState.total);
  expect(showcaseState.populated.items).toHaveLength(3);
  expect(showcaseState.viewRows).toBe(4);
  expect(showcaseState.compact.items).toHaveLength(3);
  expect(showcaseState.descriptions.items.every((item: any) => item.description)).toBe(true);
  expect(showcaseState.viewDescriptionRows).toBe(3);
  expect(showcaseState.disabled.items).toEqual([{ key: 'LOCKED', value: 'authored disabled', description: '' }]);
  expect(showcaseState.readonly.items).toEqual([{ key: 'VERSION', value: '2.1.0', description: '' }]);
  expect(showcaseState.copyButton).toBe(true);
  expect(showcaseState.fixed3).toBe(true);
  expect(showcaseState.fixed5).toBe(true);
  expect(showcaseState.declarative).toEqual([
    { key: 'Language', value: 'TypeScript', description: '' },
    { key: 'Framework', value: 'Snice', description: '' },
    { key: 'Build', value: 'Rollup', description: '' },
  ]);
  expect(showcaseState.scroll).toBeLessThanOrEqual(showcaseState.viewport);

  const showcaseItems = [
    { key: 'region', value: 'us-east-1', description: 'Primary region' },
    { key: 'tag', value: 'stable', description: 'First duplicate' },
    { key: 'tag', value: '東京 ✓', description: 'Duplicate and Unicode' },
  ];
  const showcaseForm = frame.locator('#key-value-showcase-form');
  const showcaseEditor = frame.locator('#key-value-showcase-editor');
  const showcaseLegend = frame.locator('#key-value-showcase-legend');
  const showcaseFieldset = frame.locator('#key-value-showcase-fieldset');
  expect(await showcaseForm.evaluate((form: HTMLFormElement) => ({
    valid: form.checkValidity(),
    entries: Array.from(new FormData(form).entries()).map(([name, value]) => [name, String(value)]),
  }))).toEqual({
    valid: true,
    entries: [
      ['metadata', canonical(showcaseItems)],
      ['readonly-metadata', canonical([{ key: 'release', value: '2026.07', description: '' }])],
      ['legend-metadata', canonical([{ key: 'legend', value: 'included', description: '' }])],
    ],
  });
  expect(await showcaseFieldset.evaluate((editor: any) => ({
    authoredDisabled: editor.disabled,
    effectiveDisabled: editor.matches(':disabled'),
    inputsDisabled: Array.from(editor.shadowRoot.querySelectorAll('input')).every((input: any) => input.disabled),
    willValidate: editor.willValidate,
  }))).toEqual({ authoredDisabled: false, effectiveDisabled: true, inputsDisabled: true, willValidate: false });
  expect(await showcaseLegend.evaluate((editor: any) => editor.matches(':disabled'))).toBe(false);

  await showcaseEditor.locator('[part="key-input"]').first().fill('');
  expect(await showcaseForm.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
  await showcaseForm.getByRole('button', { name: 'Submit' }).click();
  await expect(frame.locator('#key-value-form-output')).toHaveText('Ready');
  await showcaseForm.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(frame.locator('#key-value-form-output')).toContainText(`Reset: metadata=${canonical(showcaseItems)}`);

  const expectedShowcasePath = process.env.KEY_VALUE_WEBSITE_URL
    ? 'showcase/key-value.html'
    : '/components/key-value/full-showcase.html';
  expect(await page.locator('#help-drawer-iframe').getAttribute('src')).toContain(expectedShowcasePath);

  await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});
