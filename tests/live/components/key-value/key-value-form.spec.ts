import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

const canonical = (items: Array<{ key: string; value: string; description?: string }>) => JSON.stringify(
  items.map(item => ({ key: item.key, value: item.value, description: item.description ?? '' }))
);

async function loadKeyValue(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });
  const preUpgradeValue = canonical([
    { key: 'pre-upgrade', value: '東京 ✓', description: 'own property' },
  ]);

  await page.evaluate(value => {
    const editor = document.createElement('snice-key-value') as HTMLElement & { value: string };
    editor.id = 'pre-upgrade-key-value';
    editor.value = value;
    document.body.appendChild(editor);
  }, preUpgradeValue);

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/key-value/snice-key-value.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/key-value/snice-key-value.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-key-value.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-key-value')));
  const preUpgrade = await page.evaluate(async () => {
    const editor = document.querySelector('#pre-upgrade-key-value') as any;
    await editor.ready;
    await editor.rendered;
    return {
      value: editor.value,
      defaultValue: editor.defaultValue,
      ownsValue: Object.prototype.hasOwnProperty.call(editor, 'value'),
      valueAttribute: editor.getAttribute('value'),
      items: editor.getItems(),
      valid: editor.checkValidity(),
      type: editor.type,
    };
  });
  expect(preUpgrade).toEqual({
    value: preUpgradeValue,
    defaultValue: '[]',
    ownsValue: false,
    valueAttribute: null,
    items: [{ key: 'pre-upgrade', value: '東京 ✓', description: 'own property' }],
    valid: true,
    type: 'key-value',
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Item = { key: string; value: string; description?: string };
    type Editor = HTMLElement & {
      value: string;
      defaultValue: string;
      name: string;
      disabled: boolean;
      readonly: boolean;
      required: boolean;
      mode: 'edit' | 'view';
      form: HTMLFormElement | null;
      labels: NodeList | null;
      validity: ValidityState;
      validationMessage: string;
      willValidate: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
      getItems(): Item[];
      setItems(items: Item[]): void;
      addItem(key?: string, value?: string, description?: string): void;
      checkValidity(): boolean;
      reportValidity(): boolean;
      setCustomValidity(message: string): void;
      formStateRestoreCallback(state: File | string | FormData | null, mode: 'restore' | 'autocomplete'): void;
    };
    const exact = (items: Item[]) => JSON.stringify(items.map(item => ({
      key: item.key,
      value: item.value,
      description: item.description ?? '',
    })));
    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries())
      .map(([name, value]) => [name, String(value)]);
    const keyInputs = (editor: Editor) => Array.from(
      editor.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="key-input"]')
    );
    const allInputs = (editor: Editor) => Array.from(editor.shadowRoot!.querySelectorAll<HTMLInputElement>('input'));
    const settle = async (...editors: Editor[]) => {
      await Promise.all(editors.map(editor => editor.ready));
      await Promise.all(editors.map(editor => editor.rendered));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    };

    const initialItems = [
      { key: 'tag', value: 'one', description: 'first duplicate' },
      { key: 'tag', value: '東京 ✓', description: 'second duplicate' },
      { key: 'control', value: 'line\none\ttwo', description: 'escapes' },
    ];
    const legendItems = [{ key: 'legend', value: 'included', description: '' }];
    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'main-key-value';
    externalLabel.textContent = 'External metadata label';
    const form = document.createElement('form');
    form.id = 'key-value-contract-form';
    form.innerHTML = `
      <snice-key-value id="main-key-value" name="metadata" show-description required></snice-key-value>
      <snice-key-value id="optional-key-value" name="optional"></snice-key-value>
      <snice-key-value id="disabled-key-value" name="disabled-data" disabled></snice-key-value>
      <snice-key-value id="readonly-key-value" name="readonly-data" readonly required></snice-key-value>
      <snice-key-value id="view-key-value" name="view-data" mode="view" required></snice-key-value>
      <snice-key-value id="unnamed-key-value"></snice-key-value>
      <fieldset id="key-value-fieldset" disabled>
        <legend>
          Legend
          <snice-key-value id="legend-key-value" name="legend-data"></snice-key-value>
        </legend>
        <snice-key-value id="nested-key-value" name="nested-data"></snice-key-value>
      </fieldset>
    `;
    document.body.append(externalLabel, form);
    const editors = Array.from(form.querySelectorAll('snice-key-value')) as Editor[];
    const [main, optional, authoredDisabled, readonly, view, unnamed, legend, nested] = editors;
    main.setAttribute('value', exact(initialItems));
    authoredDisabled.setAttribute('value', exact([{ key: 'disabled', value: 'omitted', description: '' }]));
    legend.setAttribute('value', exact(legendItems));
    nested.setAttribute('value', exact([{ key: 'nested', value: 'omitted', description: '' }]));
    unnamed.setAttribute('value', exact([{ key: 'unnamed', value: 'omitted', description: '' }]));
    await settle(...editors);

    const initial = {
      entries: entries(form),
      value: main.value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      items: main.getItems(),
      owner: main.form === form,
      listed: editors.every(editor => Array.from(form.elements).includes(editor as any)),
      labels: main.labels?.length ?? -1,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      optional: { value: optional.value, valid: optional.checkValidity() },
      readonly: {
        value: readonly.value,
        valid: readonly.checkValidity(),
        willValidate: readonly.willValidate,
        inputReadonly: keyInputs(readonly)[0].readOnly,
        inputDisabled: keyInputs(readonly)[0].disabled,
      },
      view: { value: view.value, valid: view.checkValidity(), willValidate: view.willValidate, inputs: allInputs(view).length },
      fieldset: {
        legendDisabled: keyInputs(legend)[0].disabled,
        nestedDisabled: keyInputs(nested)[0].disabled,
        nestedProperty: nested.disabled,
        nestedAttribute: nested.hasAttribute('disabled'),
        nestedWillValidate: nested.willValidate,
      },
      authoredDisabled: {
        inputDisabled: keyInputs(authoredDisabled)[0].disabled,
        willValidate: authoredDisabled.willValidate,
      },
    };

    const lifecycleEvents: string[] = [];
    for (const type of ['kv-add', 'kv-remove', 'kv-change']) {
      main.addEventListener(type, () => lifecycleEvents.push(type));
    }

    const liveItems = [
      { key: 'live', value: '2', description: 'property assignment' },
      { key: 'live', value: '3', description: 'duplicate retained' },
    ];
    main.value = exact(liveItems);
    await settle(main);
    const liveAssignment = {
      value: main.value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      entries: entries(form),
      events: [...lifecycleEvents],
    };

    main.value = '{partial';
    await settle(main);
    const malformedSerialized = {
      value: main.value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      entry: entries(form).find(entry => entry[0] === 'metadata'),
      invalidInput: keyInputs(main)[0].getAttribute('aria-invalid'),
      message: main.validationMessage,
    };

    const malformedRowValue = exact([{ key: '   ', value: 'orphan', description: '' }]);
    main.value = malformedRowValue;
    await settle(main);
    const malformedRow = {
      value: main.value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      entry: entries(form).find(entry => entry[0] === 'metadata'),
      message: main.validationMessage,
    };

    main.value = '[]';
    await settle(main);
    const requiredEmpty = {
      valueMissing: main.validity.valueMissing,
      valid: main.checkValidity(),
      entry: entries(form).find(entry => entry[0] === 'metadata'),
    };
    const emptyValueItem = [{ key: 'presence-only', value: '', description: 'empty value valid' }];
    main.value = exact(emptyValueItem);
    const emptyValue = {
      valid: main.checkValidity(),
      value: main.value,
      entry: entries(form).find(entry => entry[0] === 'metadata'),
    };

    main.setCustomValidity('Metadata is locked by policy.');
    const customValidity = {
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      customError: main.validity.customError,
      message: main.validationMessage,
      report: main.reportValidity(),
    };
    main.setCustomValidity('');
    const clearedCustomValidity = {
      valid: main.checkValidity(),
      customError: main.validity.customError,
      message: main.validationMessage,
    };

    const newDefault = exact([{ key: 'reset', value: 'default', description: 'new attribute' }]);
    main.value = exact([{ key: 'dirty', value: 'live', description: '' }]);
    main.setAttribute('value', newDefault);
    const dirtyBeforeReset = { value: main.value, defaultValue: main.defaultValue, valueAttribute: main.getAttribute('value') };
    lifecycleEvents.length = 0;
    form.reset();
    await settle(main);
    const afterReset = {
      value: main.value,
      defaultValue: main.defaultValue,
      items: main.getItems(),
      entries: entries(form),
      events: [...lifecycleEvents],
    };

    const restoredItems = [
      { key: 'restored', value: 'one', description: 'α' },
      { key: 'restored', value: 'two', description: 'β' },
    ];
    main.formStateRestoreCallback(exact(restoredItems), 'restore');
    const restored = { value: main.value, items: main.getItems(), events: [...lifecycleEvents] };
    main.formStateRestoreCallback('{"legacy":"string"}', 'restore');
    const restoredLegacy = { value: main.value, items: main.getItems() };
    main.formStateRestoreCallback('restored {', 'autocomplete');
    const restoredMalformed = { value: main.value, badInput: main.validity.badInput, valid: main.checkValidity() };
    main.formStateRestoreCallback(new File([], 'ignored.json'), 'restore');
    main.formStateRestoreCallback(new FormData(), 'restore');
    main.formStateRestoreCallback(null, 'restore');
    const ignoredRestore = main.value;

    main.formStateRestoreCallback(exact(restoredItems), 'restore');
    main.remove();
    await Promise.resolve();
    form.prepend(main);
    await settle(main);
    const reconnected = {
      value: main.value,
      items: main.getItems(),
      owner: main.form === form,
      entry: entries(form).find(entry => entry[0] === 'metadata'),
    };

    const fieldset = form.querySelector('#key-value-fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await settle(nested);
    const reenabledFieldset = {
      nestedInputDisabled: keyInputs(nested)[0].disabled,
      nestedProperty: nested.disabled,
      entry: entries(form).find(entry => entry[0] === 'nested-data'),
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-key-value-form';
    const external = document.createElement('snice-key-value') as Editor;
    external.setAttribute('form', externalForm.id);
    external.setAttribute('name', 'external-data');
    external.setAttribute('value', exact([{ key: 'external', value: 'yes', description: '' }]));
    document.body.append(externalForm, external);
    await settle(external);
    const explicitOwner = { owner: external.form === externalForm, entries: entries(externalForm) };

    const declarativeForm = document.createElement('form');
    declarativeForm.innerHTML = `
      <snice-key-value id="declarative-key-value" name="pairs" value='[{"key":"fallback","value":"default","description":""}]'>
        <snice-kv-pair key="duplicate" value="one" description="first"></snice-kv-pair>
        <snice-kv-pair key="duplicate" value="東京 ✓" description="second"></snice-kv-pair>
      </snice-key-value>
    `;
    document.body.appendChild(declarativeForm);
    const declarative = declarativeForm.querySelector('snice-key-value') as Editor;
    await settle(declarative);
    const pairs = Array.from(declarative.children) as HTMLElement[];
    declarative.setItems([{ key: 'ignored', value: 'ignored' }]);
    declarative.addItem('ignored', 'ignored');
    const declarativeInitial = { value: declarative.value, items: declarative.getItems(), entries: entries(declarativeForm) };
    const declarativeKey = keyInputs(declarative)[0];
    declarativeKey.value = 'edited';
    declarativeKey.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    await settle(declarative);
    declarativeForm.reset();
    await settle(declarative);
    const declarativeReset = { value: declarative.value, items: declarative.getItems() };
    declarative.insertBefore(pairs[1], pairs[0]);
    await settle(declarative);
    const declarativeReordered = { value: declarative.value, items: declarative.getItems(), entries: entries(declarativeForm) };
    pairs.forEach(pair => pair.remove());
    await settle(declarative);
    const declarativeFallback = { value: declarative.value, defaultValue: declarative.defaultValue, items: declarative.getItems() };

    const large = document.createElement('snice-key-value') as Editor;
    large.name = 'large-data';
    large.mode = 'view';
    const largeItems = Array.from({ length: 500 }, (_, index) => ({
      key: `duplicate-${index % 13}`,
      value: `value-${index}-✓`,
      description: `row-${index}`,
    }));
    form.appendChild(large);
    await settle(large);
    large.setItems(largeItems);
    await settle(large);
    const largeValue = String(new FormData(form).get('large-data'));
    const parsedLarge = JSON.parse(largeValue);
    const largeRoundTrip = {
      length: parsedLarge.length,
      first: parsedLarge[0],
      last: parsedLarge.at(-1),
      exact: largeValue === exact(largeItems),
      renderedRows: large.shadowRoot!.querySelectorAll('[part="view-row"]').length,
    };

    return {
      initial,
      liveAssignment,
      malformedSerialized,
      malformedRow,
      requiredEmpty,
      emptyValue,
      customValidity,
      clearedCustomValidity,
      dirtyBeforeReset,
      afterReset,
      restored,
      restoredLegacy,
      restoredMalformed,
      ignoredRestore,
      reconnected,
      reenabledFieldset,
      explicitOwner,
      declarativeInitial,
      declarativeReset,
      declarativeReordered,
      declarativeFallback,
      largeRoundTrip,
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  const initialItems = [
    { key: 'tag', value: 'one', description: 'first duplicate' },
    { key: 'tag', value: '東京 ✓', description: 'second duplicate' },
    { key: 'control', value: 'line\none\ttwo', description: 'escapes' },
  ];
  const initialValue = canonical(initialItems);
  expect(result.initial).toEqual({
    entries: [
      ['metadata', initialValue],
      ['optional', '[]'],
      ['readonly-data', '[]'],
      ['view-data', '[]'],
      ['legend-data', canonical([{ key: 'legend', value: 'included', description: '' }])],
    ],
    value: initialValue,
    defaultValue: initialValue,
    valueAttribute: initialValue,
    items: initialItems,
    owner: true,
    listed: true,
    labels: 1,
    valid: true,
    formValid: true,
    optional: { value: '[]', valid: true },
    readonly: { value: '[]', valid: true, willValidate: false, inputReadonly: true, inputDisabled: false },
    view: { value: '[]', valid: true, willValidate: false, inputs: 0 },
    fieldset: {
      legendDisabled: false,
      nestedDisabled: true,
      nestedProperty: false,
      nestedAttribute: false,
      nestedWillValidate: false,
    },
    authoredDisabled: { inputDisabled: true, willValidate: false },
  });
  const liveItems = [
    { key: 'live', value: '2', description: 'property assignment' },
    { key: 'live', value: '3', description: 'duplicate retained' },
  ];
  expect(result.liveAssignment).toEqual({
    value: canonical(liveItems),
    defaultValue: initialValue,
    valueAttribute: initialValue,
    entries: [
      ['metadata', canonical(liveItems)],
      ['optional', '[]'],
      ['readonly-data', '[]'],
      ['view-data', '[]'],
      ['legend-data', canonical([{ key: 'legend', value: 'included', description: '' }])],
    ],
    events: [],
  });
  expect(result.malformedSerialized).toMatchObject({
    value: '{partial',
    badInput: true,
    valid: false,
    formValid: false,
    entry: ['metadata', '{partial'],
    invalidInput: 'true',
  });
  expect(result.malformedSerialized.message).toContain('ordered JSON entry array');
  const malformedRow = canonical([{ key: '   ', value: 'orphan', description: '' }]);
  expect(result.malformedRow).toMatchObject({
    value: malformedRow,
    badInput: true,
    valid: false,
    entry: ['metadata', malformedRow],
  });
  expect(result.malformedRow.message).toContain('Row 1');
  expect(result.requiredEmpty).toEqual({ valueMissing: true, valid: false, entry: ['metadata', '[]'] });
  const emptyValue = canonical([{ key: 'presence-only', value: '', description: 'empty value valid' }]);
  expect(result.emptyValue).toEqual({ valid: true, value: emptyValue, entry: ['metadata', emptyValue] });
  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    message: 'Metadata is locked by policy.',
    report: false,
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.dirtyBeforeReset).toEqual({
    value: canonical([{ key: 'dirty', value: 'live', description: '' }]),
    defaultValue: canonical([{ key: 'reset', value: 'default', description: 'new attribute' }]),
    valueAttribute: canonical([{ key: 'reset', value: 'default', description: 'new attribute' }]),
  });
  expect(result.afterReset).toMatchObject({
    value: canonical([{ key: 'reset', value: 'default', description: 'new attribute' }]),
    defaultValue: canonical([{ key: 'reset', value: 'default', description: 'new attribute' }]),
    items: [{ key: 'reset', value: 'default', description: 'new attribute' }],
    events: [],
  });
  expect(result.afterReset.entries[0]).toEqual([
    'metadata',
    canonical([{ key: 'reset', value: 'default', description: 'new attribute' }]),
  ]);
  const restoredItems = [
    { key: 'restored', value: 'one', description: 'α' },
    { key: 'restored', value: 'two', description: 'β' },
  ];
  expect(result.restored).toEqual({ value: canonical(restoredItems), items: restoredItems, events: [] });
  expect(result.restoredLegacy).toEqual({
    value: canonical([{ key: 'legacy', value: 'string', description: '' }]),
    items: [{ key: 'legacy', value: 'string', description: '' }],
  });
  expect(result.restoredMalformed).toEqual({ value: 'restored {', badInput: true, valid: false });
  expect(result.ignoredRestore).toBe('restored {');
  expect(result.reconnected).toEqual({
    value: canonical(restoredItems),
    items: restoredItems,
    owner: true,
    entry: ['metadata', canonical(restoredItems)],
  });
  expect(result.reenabledFieldset).toEqual({
    nestedInputDisabled: false,
    nestedProperty: false,
    entry: ['nested-data', canonical([{ key: 'nested', value: 'omitted', description: '' }])],
  });
  expect(result.explicitOwner).toEqual({
    owner: true,
    entries: [['external-data', canonical([{ key: 'external', value: 'yes', description: '' }])]],
  });
  const declarativeInitial = [
    { key: 'duplicate', value: 'one', description: 'first' },
    { key: 'duplicate', value: '東京 ✓', description: 'second' },
  ];
  expect(result.declarativeInitial).toEqual({
    value: canonical(declarativeInitial),
    items: declarativeInitial,
    entries: [['pairs', canonical(declarativeInitial)]],
  });
  expect(result.declarativeReset).toEqual({ value: canonical(declarativeInitial), items: declarativeInitial });
  const reversed = [...declarativeInitial].reverse();
  expect(result.declarativeReordered).toEqual({
    value: canonical(reversed),
    items: reversed,
    entries: [['pairs', canonical(reversed)]],
  });
  expect(result.declarativeFallback).toEqual({
    value: canonical([{ key: 'fallback', value: 'default', description: '' }]),
    defaultValue: canonical([{ key: 'fallback', value: 'default', description: '' }]),
    items: [{ key: 'fallback', value: 'default', description: '' }],
  });
  expect(result.largeRoundTrip).toEqual({
    length: 500,
    first: { key: 'duplicate-0', value: 'value-0-✓', description: 'row-0' },
    last: { key: 'duplicate-5', value: 'value-499-✓', description: 'row-499' },
    exact: true,
    renderedRows: 500,
  });
}

async function exerciseCustomerInteractions(page: Page) {
  await page.evaluate(async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => { (globalThis as any).__keyValueClipboard = text; },
      },
    });
    const fixture = document.createElement('div');
    fixture.id = 'key-value-interaction-fixture';
    fixture.style.cssText = 'position:fixed;inset:.5rem auto auto .5rem;z-index:2147483647;width:min(42rem,calc(100vw - 1rem));padding:1rem;background:white;color:black;box-sizing:border-box;max-height:calc(100vh - 1rem);overflow:auto';
    fixture.innerHTML = `
      <form id="key-value-interaction-form">
        <snice-key-value
          id="interaction-key-value"
          name="headers"
          label="Request headers"
          value='[{"key":"Accept","value":"application/json","description":"preferred"}]'
          show-description
          show-copy
          required
        ></snice-key-value>
        <button id="key-value-reset" type="reset">Reset</button>
        <button id="key-value-submit" type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const editor = document.querySelector('#interaction-key-value') as any;
    await editor.ready;
    await editor.rendered;
    (globalThis as any).__keyValueEvents = [];
    (globalThis as any).__keyValueSubmits = 0;
    for (const type of ['kv-add', 'kv-remove', 'kv-change', 'kv-copy']) {
      editor.addEventListener(type, (event: CustomEvent) => {
        (globalThis as any).__keyValueEvents.push({ type, detail: event.detail });
      });
    }
    document.querySelector('#key-value-interaction-form')!.addEventListener('submit', event => {
      event.preventDefault();
      (globalThis as any).__keyValueSubmits++;
    });
  });

  const editor = page.locator('#interaction-key-value');
  const form = page.locator('#key-value-interaction-form');
  const state = () => form.evaluate((element: HTMLFormElement) => {
    const editor = element.querySelector('#interaction-key-value') as any;
    return {
      value: editor.value,
      items: editor.getItems(),
      valid: editor.checkValidity(),
      formValid: element.checkValidity(),
      entry: String(new FormData(element).get('headers')),
      rows: editor.shadowRoot.querySelectorAll('[part="row"]').length,
      events: (globalThis as any).__keyValueEvents.map((event: any) => event.type),
    };
  });

  const keys = editor.locator('[part="key-input"]');
  const values = editor.locator('[part="value-input"]');
  const descriptions = editor.locator('[part="description-input"]');
  await keys.nth(1).fill('Accept');
  await values.nth(1).fill('text/plain ✓');
  await descriptions.nth(1).fill('duplicate and Unicode');
  const editedItems = [
    { key: 'Accept', value: 'application/json', description: 'preferred' },
    { key: 'Accept', value: 'text/plain ✓', description: 'duplicate and Unicode' },
  ];
  expect(await state()).toMatchObject({
    value: canonical(editedItems),
    items: editedItems,
    valid: true,
    formValid: true,
    entry: canonical(editedItems),
    rows: 3,
  });

  await editor.locator('[part="copy-button"]').click();
  await expect.poll(() => page.evaluate(() => (globalThis as any).__keyValueClipboard)).toBe(
    JSON.stringify(editedItems, null, 2)
  );
  expect((await state()).events.at(-1)).toBe('kv-copy');

  await editor.locator('[part="delete-button"]').first().click();
  const afterDelete = [editedItems[1]];
  expect(await state()).toMatchObject({
    value: canonical(afterDelete),
    items: afterDelete,
    entry: canonical(afterDelete),
    rows: 2,
  });

  await keys.first().fill('');
  const invalid = await state();
  expect(invalid).toMatchObject({ valid: false, formValid: false });
  expect(await keys.first().getAttribute('aria-invalid')).toBe('true');
  await page.evaluate(() => (document.querySelector('#key-value-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__keyValueSubmits)).toBe(0);

  await page.locator('#key-value-reset').click();
  const resetItems = [{ key: 'Accept', value: 'application/json', description: 'preferred' }];
  expect(await state()).toMatchObject({
    value: canonical(resetItems),
    items: resetItems,
    valid: true,
    formValid: true,
    entry: canonical(resetItems),
    rows: 2,
  });
  await page.evaluate(() => (document.querySelector('#key-value-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__keyValueSubmits)).toBe(1);

  const fieldset = await page.evaluate(async () => {
    const editor = document.querySelector('#interaction-key-value') as any;
    const fieldset = document.createElement('fieldset');
    editor.parentElement.insertBefore(fieldset, editor);
    fieldset.appendChild(editor);
    fieldset.disabled = true;
    await editor.rendered;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return {
      authoredDisabled: editor.disabled,
      effectiveDisabled: editor.matches(':disabled'),
      inputsDisabled: Array.from(editor.shadowRoot.querySelectorAll('input')).every((input: any) => input.disabled),
      buttonsDisabled: Array.from(editor.shadowRoot.querySelectorAll('button')).every((button: any) => button.disabled),
      willValidate: editor.willValidate,
      entries: Array.from(new FormData(document.querySelector('#key-value-interaction-form') as HTMLFormElement).entries()),
    };
  });
  expect(fieldset).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputsDisabled: true,
    buttonsDisabled: true,
    willValidate: false,
    entries: [],
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native ordered key-value form behavior through ${build}`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadKeyValue(page, build);
    assertFormContract(await exerciseFormContract(page));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test(`works through customer edit, duplicate, copy, delete, validation, reset, submit, and fieldset paths in ${build}`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadKeyValue(page, build);
    await exerciseCustomerInteractions(page);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
