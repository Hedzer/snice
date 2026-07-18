import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadDatePicker(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const picker = document.createElement('snice-date-picker') as HTMLElement & { value: string };
    picker.id = 'pre-upgrade-date-picker';
    picker.value = '2026-03-15';
    const formattedPicker = document.createElement('snice-date-picker') as HTMLElement & { value: string };
    formattedPicker.id = 'pre-upgrade-formatted-date-picker';
    formattedPicker.setAttribute('format', 'dd/mm/yyyy');
    formattedPicker.value = '10/03/2026';
    document.body.append(picker, formattedPicker);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/date-picker/snice-date-picker.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/date-picker/snice-date-picker.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-date-picker.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-date-picker')));
  const preUpgrade = await page.evaluate(async () => {
    const picker = document.querySelector('#pre-upgrade-date-picker') as HTMLElement & {
      value: string;
      defaultValue: string;
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    await picker.ready;
    await picker.rendered;
    return {
      value: picker.value,
      defaultValue: picker.defaultValue,
      ownsValue: Object.prototype.hasOwnProperty.call(picker, 'value'),
      valueAttribute: picker.getAttribute('value'),
      display: (picker.shadowRoot!.querySelector('input') as HTMLInputElement).value
    };
  });
  expect(preUpgrade).toEqual({
    value: '2026-03-15',
    defaultValue: '',
    ownsValue: false,
    valueAttribute: null,
    display: '03/15/2026'
  });

  const preUpgradeFormatted = await page.evaluate(async () => {
    const picker = document.querySelector('#pre-upgrade-formatted-date-picker') as HTMLElement & {
      value: string;
      defaultValue: string;
      format: string;
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    await picker.ready;
    await picker.rendered;
    return {
      value: picker.value,
      defaultValue: picker.defaultValue,
      format: picker.format,
      valueAttribute: picker.getAttribute('value'),
      display: (picker.shadowRoot!.querySelector('input') as HTMLInputElement).value
    };
  });
  expect(preUpgradeFormatted).toEqual({
    value: '2026-03-10',
    defaultValue: '',
    format: 'dd/mm/yyyy',
    valueAttribute: null,
    display: '10/03/2026'
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Picker = HTMLElement & {
      value: string;
      defaultValue: string;
      format: string;
      min: string;
      max: string;
      name: string;
      disabled: boolean;
      readonly: boolean;
      loading: boolean;
      type: string;
      form: HTMLFormElement | null;
      labels: NodeList | null;
      validity: ValidityState;
      validationMessage: string;
      willValidate: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
      checkValidity(): boolean;
      reportValidity(): boolean;
      setCustomValidity(message: string): void;
      formStateRestoreCallback(state: string | FormData, mode: 'restore' | 'autocomplete'): void;
    };

    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries())
      .map(([name, value]) => [name, String(value)]);
    const input = (picker: Picker) => picker.shadowRoot!.querySelector('.input') as HTMLInputElement;
    const toggle = (picker: Picker) => picker.shadowRoot!.querySelector('.calendar-toggle') as HTMLButtonElement;
    const waitFor = async (...pickers: Picker[]) => {
      await Promise.all(pickers.map(picker => picker.ready));
      await Promise.all(pickers.map(picker => picker.rendered));
    };

    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'main-date';
    externalLabel.textContent = 'External date label';
    const form = document.createElement('form');
    form.id = 'date-contract-form';
    form.innerHTML = `
      <snice-date-picker
        id="main-date"
        name="date"
        value="2026-03-15"
        format="dd/mm/yyyy"
        min="2026-03-10"
        max="2026-03-20"
        required
      ></snice-date-picker>
      <snice-date-picker id="optional-date" name="optional"></snice-date-picker>
      <snice-date-picker id="disabled-date" name="disabled-date" value="2026-03-14" disabled></snice-date-picker>
      <snice-date-picker id="readonly-date" name="readonly-date" required readonly></snice-date-picker>
      <fieldset id="date-fieldset" disabled>
        <legend>
          Legend
          <snice-date-picker id="legend-date" name="legend-date" value="2026-03-12"></snice-date-picker>
        </legend>
        <snice-date-picker id="nested-date" name="nested-date" value="2026-03-13"></snice-date-picker>
      </fieldset>
    `;
    document.body.append(externalLabel, form);
    const pickers = Array.from(form.querySelectorAll('snice-date-picker')) as Picker[];
    await waitFor(...pickers);
    const [main, optional, authoredDisabled, readonly, legend, nested] = pickers;

    const initial = {
      entries: entries(form),
      display: input(main).value,
      value: main.value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      type: main.type,
      owner: main.form === form,
      listed: pickers.every(picker => Array.from(form.elements).includes(picker as any)),
      labels: main.labels?.length ?? -1,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      readonly: {
        valid: readonly.checkValidity(),
        willValidate: readonly.willValidate,
        inputDisabled: input(readonly).disabled,
        inputReadonly: input(readonly).readOnly
      },
      fieldset: {
        legendInputDisabled: input(legend).disabled,
        nestedInputDisabled: input(nested).disabled,
        nestedProperty: nested.disabled,
        nestedAttribute: nested.hasAttribute('disabled'),
        nestedWillValidate: nested.willValidate
      },
      authoredDisabled: {
        inputDisabled: input(authoredDisabled).disabled,
        willValidate: authoredDisabled.willValidate
      }
    };

    const lifecycleEvents: string[] = [];
    for (const type of ['datepicker-input', 'datepicker-change', 'datepicker-clear', 'datepicker-select']) {
      main.addEventListener(type, () => lifecycleEvents.push(type));
    }

    main.value = '16/03/2026';
    main.format = 'mmmm dd, yyyy';
    await main.rendered;
    const liveAssignment = {
      value: main.value,
      display: input(main).value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    main.value = '2026-03-09';
    const underflow = {
      value: main.value,
      underflow: main.validity.rangeUnderflow,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      entries: entries(form)
    };
    main.value = '2026-03-21';
    const overflow = {
      value: main.value,
      overflow: main.validity.rangeOverflow,
      valid: main.checkValidity()
    };

    const mainInput = input(main);
    mainInput.value = 'March 40, 2026';
    mainInput.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    const invalidManual = {
      value: main.value,
      display: mainInput.value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      entries: entries(form)
    };

    mainInput.value = 'March 20, 2026';
    mainInput.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    mainInput.dispatchEvent(new Event('change', { bubbles: true }));
    const validManual = {
      value: main.value,
      display: mainInput.value,
      valid: main.checkValidity(),
      entries: entries(form)
    };

    lifecycleEvents.length = 0;
    main.setAttribute('value', '2026-03-18');
    const dirtyBeforeReset = { value: main.value, defaultValue: main.defaultValue };
    form.reset();
    await main.rendered;
    const afterReset = {
      value: main.value,
      defaultValue: main.defaultValue,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    main.formStateRestoreCallback('March 17, 2026', 'restore');
    const restoredValid = { value: main.value, display: input(main).value, entries: entries(form) };
    main.formStateRestoreCallback('March ', 'autocomplete');
    const restoredPartial = {
      value: main.value,
      display: input(main).value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.formStateRestoreCallback(new FormData(), 'restore');
    const ignoredRestoreState = input(main).value;

    main.value = '2026-03-19';
    main.remove();
    form.prepend(main);
    await waitFor(main);
    const reconnected = {
      value: main.value,
      display: input(main).value,
      defaultValue: main.defaultValue,
      owner: main.form === form,
      entries: entries(form)
    };

    main.setCustomValidity('Date inventory is closed.');
    const customValidity = {
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      customError: main.validity.customError,
      message: main.validationMessage,
      report: main.reportValidity()
    };
    main.setCustomValidity('');
    const clearedCustomValidity = {
      valid: main.checkValidity(),
      customError: main.validity.customError,
      message: main.validationMessage
    };

    main.loading = true;
    await main.rendered;
    const loading = {
      inputDisabled: input(main).disabled,
      toggleDisabled: toggle(main).disabled,
      entries: entries(form),
      willValidate: main.willValidate,
      valid: main.checkValidity()
    };
    main.loading = false;
    await main.rendered;

    main.format = 'dd/mm/yyyy';
    main.min = '10/03/2026';
    main.max = '20/03/2026';
    main.value = '2026-03-21';
    const formattedConstraints = {
      display: input(main).value,
      overflow: main.validity.rangeOverflow,
      valid: main.checkValidity(),
      entries: entries(form)
    };

    main.min = 'invalid-min';
    main.max = 'invalid-max';
    main.value = '2026-03-19';
    const invalidConstraints = { valid: main.checkValidity(), value: main.value };

    const fieldset = form.querySelector('#date-fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await nested.rendered;
    const reenabledFieldset = {
      nestedInputDisabled: input(nested).disabled,
      nestedProperty: nested.disabled,
      entries: entries(form)
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-date-form';
    const external = document.createElement('snice-date-picker') as Picker;
    external.setAttribute('form', externalForm.id);
    external.setAttribute('name', 'external-date');
    external.setAttribute('value', '2026-07-04');
    document.body.append(externalForm, external);
    await waitFor(external);
    const explicitOwner = {
      owner: external.form === externalForm,
      entries: entries(externalForm)
    };

    return {
      initial,
      liveAssignment,
      underflow,
      overflow,
      invalidManual,
      validManual,
      dirtyBeforeReset,
      afterReset,
      restoredValid,
      restoredPartial,
      ignoredRestoreState,
      reconnected,
      customValidity,
      clearedCustomValidity,
      loading,
      formattedConstraints,
      invalidConstraints,
      reenabledFieldset,
      explicitOwner
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  expect(result.initial).toEqual({
    entries: [
      ['date', '2026-03-15'],
      ['optional', ''],
      ['readonly-date', ''],
      ['legend-date', '2026-03-12']
    ],
    display: '15/03/2026',
    value: '2026-03-15',
    defaultValue: '2026-03-15',
    valueAttribute: '2026-03-15',
    type: 'date',
    owner: true,
    listed: true,
    labels: 1,
    valid: true,
    formValid: true,
    readonly: { valid: true, willValidate: false, inputDisabled: false, inputReadonly: true },
    fieldset: {
      legendInputDisabled: false,
      nestedInputDisabled: true,
      nestedProperty: false,
      nestedAttribute: false,
      nestedWillValidate: false
    },
    authoredDisabled: { inputDisabled: true, willValidate: false }
  });
  expect(result.liveAssignment).toEqual({
    value: '2026-03-16',
    display: 'March 16, 2026',
    defaultValue: '2026-03-15',
    valueAttribute: '2026-03-15',
    entries: [
      ['date', '2026-03-16'],
      ['optional', ''],
      ['readonly-date', ''],
      ['legend-date', '2026-03-12']
    ],
    events: []
  });
  expect(result.underflow).toMatchObject({
    value: '2026-03-09', underflow: true, valid: false, formValid: false
  });
  expect(result.underflow.entries[0]).toEqual(['date', '2026-03-09']);
  expect(result.overflow).toEqual({ value: '2026-03-21', overflow: true, valid: false });
  expect(result.invalidManual).toMatchObject({
    value: '', display: 'March 40, 2026', badInput: true, valid: false, formValid: false
  });
  expect(result.invalidManual.entries[0]).toEqual(['date', '']);
  expect(result.validManual).toMatchObject({
    value: '2026-03-20', display: 'March 20, 2026', valid: true
  });
  expect(result.validManual.entries[0]).toEqual(['date', '2026-03-20']);
  expect(result.dirtyBeforeReset).toEqual({ value: '2026-03-20', defaultValue: '2026-03-18' });
  expect(result.afterReset).toMatchObject({
    value: '2026-03-18', defaultValue: '2026-03-18', display: 'March 18, 2026', events: []
  });
  expect(result.afterReset.entries[0]).toEqual(['date', '2026-03-18']);
  expect(result.restoredValid).toMatchObject({ value: '2026-03-17', display: 'March 17, 2026' });
  expect(result.restoredValid.entries[0]).toEqual(['date', '2026-03-17']);
  expect(result.restoredPartial).toMatchObject({
    value: '', display: 'March ', badInput: true, valid: false
  });
  expect(result.restoredPartial.entries[0]).toEqual(['date', '']);
  expect(result.ignoredRestoreState).toBe('March ');
  expect(result.reconnected).toMatchObject({
    value: '2026-03-19', display: 'March 19, 2026', defaultValue: '2026-03-18', owner: true
  });
  expect(result.reconnected.entries[0]).toEqual(['date', '2026-03-19']);
  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    message: 'Date inventory is closed.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.loading).toMatchObject({
    inputDisabled: true, toggleDisabled: true, willValidate: true, valid: true
  });
  expect(result.loading.entries[0]).toEqual(['date', '2026-03-19']);
  expect(result.formattedConstraints).toMatchObject({
    display: '21/03/2026', overflow: true, valid: false
  });
  expect(result.formattedConstraints.entries[0]).toEqual(['date', '2026-03-21']);
  expect(result.invalidConstraints).toEqual({ valid: true, value: '2026-03-19' });
  expect(result.reenabledFieldset).toMatchObject({ nestedInputDisabled: false, nestedProperty: false });
  expect(result.reenabledFieldset.entries).toContainEqual(['nested-date', '2026-03-13']);
  expect(result.explicitOwner).toEqual({ owner: true, entries: [['external-date', '2026-07-04']] });
}

async function exerciseStrictCalendarBoundaries(page: Page) {
  const result = await page.evaluate(async () => {
    const form = document.createElement('form');
    const picker = document.createElement('snice-date-picker') as any;
    picker.name = 'strict-date';
    picker.required = true;
    form.append(picker);
    document.body.append(form);
    await picker.ready;
    await picker.rendered;
    const input = picker.shadowRoot.querySelector('.input') as HTMLInputElement;

    const accepted = [
      '2026-01-31', '2026-02-28', '2024-02-29', '2000-02-29',
      '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30',
      '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31',
      '2026-11-30', '2026-12-31'
    ];
    const rejected = [
      '2026-01-32', '2026-02-29', '1900-02-29', '2024-02-30',
      '2026-03-32', '2026-04-31', '2026-05-32', '2026-06-31',
      '2026-07-32', '2026-08-32', '2026-09-31', '2026-10-32',
      '2026-11-31', '2026-12-32', '2026-00-10', '2026-13-01',
      '2026-01-00'
    ];
    const acceptedFailures: string[] = [];
    const rejectedFailures: string[] = [];

    for (const value of accepted) {
      picker.value = value;
      if (picker.value !== value || !picker.checkValidity() ||
          new FormData(form).get('strict-date') !== value) {
        acceptedFailures.push(value);
      }
    }
    for (const value of rejected) {
      picker.value = value;
      if (picker.value !== '' || input.value !== '' ||
          new FormData(form).get('strict-date') !== '' || picker.checkValidity()) {
        rejectedFailures.push(value);
      }
    }

    const formatCases = [
      ['mm/dd/yyyy', '02/29/2026', '02/29/2024'],
      ['dd/mm/yyyy', '29/02/2026', '29/02/2024'],
      ['yyyy/mm/dd', '2026/02/29', '2024/02/29'],
      ['dd-mm-yyyy', '29-02-2026', '29-02-2024'],
      ['mm-dd-yyyy', '02-29-2026', '02-29-2024'],
      ['mmmm dd, yyyy', 'February 29, 2026', 'February 29, 2024']
    ];
    const formatFailures: string[] = [];
    for (const [format, invalid, valid] of formatCases) {
      picker.format = format;
      picker.value = invalid;
      if (picker.value !== '') formatFailures.push(`${format}:invalid`);
      picker.value = valid;
      if (picker.value !== '2024-02-29' || !picker.checkValidity()) {
        formatFailures.push(`${format}:valid`);
      }
    }

    picker.format = 'mm/dd/yyyy';
    input.value = '02/31/2026';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    const manual = {
      raw: input.value,
      value: picker.value,
      badInput: picker.validity.badInput,
      valid: picker.checkValidity(),
      submitted: new FormData(form).get('strict-date')
    };

    picker.formStateRestoreCallback('02/30/2024', 'restore');
    const restored = {
      raw: input.value,
      value: picker.value,
      badInput: picker.validity.badInput,
      valid: picker.checkValidity(),
      submitted: new FormData(form).get('strict-date')
    };

    picker.min = '2026-02-31';
    picker.max = '2026-04-31';
    picker.value = '2026-05-02';
    const impossibleConstraints = {
      valid: picker.checkValidity(),
      underflow: picker.validity.rangeUnderflow,
      overflow: picker.validity.rangeOverflow,
      value: picker.value
    };

    form.remove();
    return { acceptedFailures, rejectedFailures, formatFailures, manual, restored, impossibleConstraints };
  });

  expect(result).toEqual({
    acceptedFailures: [],
    rejectedFailures: [],
    formatFailures: [],
    manual: { raw: '02/31/2026', value: '', badInput: true, valid: false, submitted: '' },
    restored: { raw: '02/30/2024', value: '', badInput: true, valid: false, submitted: '' },
    impossibleConstraints: { valid: true, underflow: false, overflow: false, value: '2026-05-02' }
  });
}

async function exerciseCustomerInteractions(page: Page) {
  await page.evaluate(async () => {
    const fixture = document.createElement('div');
    fixture.id = 'date-interaction-fixture';
    fixture.style.cssText = [
      'position:fixed',
      'inset:0.5rem auto auto 0.5rem',
      'z-index:2147483647',
      'width:24rem',
      'padding:1rem',
      'background:white',
      'color:black'
    ].join(';');
    fixture.innerHTML = `
      <form id="date-interaction-form">
        <snice-date-picker
          id="interaction-date"
          name="date"
          label="Delivery date"
          value="2026-03-15"
          min="2026-03-10"
          max="2026-03-20"
          clearable
          required
        ></snice-date-picker>
        <button id="date-reset" type="reset">Reset</button>
        <button id="date-submit" type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const picker = document.querySelector('#interaction-date') as any;
    await picker.ready;
    await picker.rendered;
    (globalThis as any).__dateEvents = [];
    (globalThis as any).__dateSubmits = 0;
    for (const type of ['datepicker-input', 'datepicker-change', 'datepicker-clear', 'datepicker-select']) {
      picker.addEventListener(type, (event: CustomEvent) => {
        (globalThis as any).__dateEvents.push({
          type,
          value: picker.value,
          detailValue: event.detail?.value,
          iso: event.detail?.iso
        });
      });
    }
    document.querySelector('#date-interaction-form')!.addEventListener('submit', event => {
      event.preventDefault();
      (globalThis as any).__dateSubmits++;
    });
  });

  const picker = page.locator('#interaction-date');
  const input = picker.locator('.input');
  await input.fill('03/18/2026');
  await input.press('Tab');
  const typed = await page.evaluate(() => {
    const picker = document.querySelector('#interaction-date') as any;
    const form = document.querySelector('#date-interaction-form') as HTMLFormElement;
    return {
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input').value,
      entries: Array.from(new FormData(form).entries()),
      events: [...(globalThis as any).__dateEvents]
    };
  });
  expect(typed).toMatchObject({ value: '2026-03-18', display: '03/18/2026', entries: [['date', '2026-03-18']] });
  expect(typed.events.map((event: any) => event.type)).toContain('datepicker-input');
  expect(typed.events.map((event: any) => event.type)).toContain('datepicker-change');

  await picker.locator('.clear-button').click();
  const cleared = await page.evaluate(() => {
    const picker = document.querySelector('#interaction-date') as any;
    const form = document.querySelector('#date-interaction-form') as HTMLFormElement;
    return {
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input').value,
      valid: picker.checkValidity(),
      formValid: form.checkValidity(),
      entries: Array.from(new FormData(form).entries()),
      eventTypes: (globalThis as any).__dateEvents.map((event: any) => event.type)
    };
  });
  expect(cleared).toEqual({
    value: '',
    display: '',
    valid: false,
    formValid: false,
    entries: [['date', '']],
    eventTypes: ['datepicker-input', 'datepicker-change', 'datepicker-clear', 'datepicker-change']
  });

  await picker.locator('.calendar-toggle').click();
  await picker.locator('[data-date="2026-03-20"]').click();
  const selected = await page.evaluate(() => {
    const picker = document.querySelector('#interaction-date') as any;
    return {
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input').value,
      open: picker.open,
      eventTypes: (globalThis as any).__dateEvents.map((event: any) => event.type),
      selectEvent: (globalThis as any).__dateEvents.find((event: any) => event.type === 'datepicker-select')
    };
  });
  expect(selected).toMatchObject({
    value: '2026-03-20',
    display: '03/20/2026',
    open: false,
    selectEvent: { type: 'datepicker-select', value: '2026-03-20', iso: '2026-03-20' }
  });

  await picker.locator('.calendar-toggle').click();
  await expect(picker.locator('[data-date="2026-03-21"]')).toBeDisabled();
  await input.focus();
  await input.press('Escape');
  await page.locator('#date-reset').click();
  expect(await page.evaluate(() => (document.querySelector('#interaction-date') as any).value)).toBe('2026-03-15');

  await picker.locator('.clear-button').click();
  await page.evaluate(() => (document.querySelector('#date-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__dateSubmits)).toBe(0);
  await picker.locator('.calendar-toggle').click();
  await picker.locator('[data-date="2026-03-19"]').click();
  await page.evaluate(() => (document.querySelector('#date-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__dateSubmits)).toBe(1);

  const fieldsetState = await page.evaluate(async () => {
    const picker = document.querySelector('#interaction-date') as any;
    const fieldset = document.createElement('fieldset');
    picker.parentElement.insertBefore(fieldset, picker);
    fieldset.appendChild(picker);
    fieldset.disabled = true;
    await picker.rendered;
    return {
      property: picker.disabled,
      attribute: picker.hasAttribute('disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      toggleDisabled: picker.shadowRoot.querySelector('.calendar-toggle').disabled,
      open: picker.open
    };
  });
  expect(fieldsetState).toEqual({
    property: false,
    attribute: false,
    inputDisabled: true,
    toggleDisabled: true,
    open: false
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native date form behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadDatePicker(page, build);
    assertFormContract(await exerciseFormContract(page));
    await exerciseStrictCalendarBoundaries(page);
    expect(pageErrors).toEqual([]);
  });

  test(`works through customer typing, picker, clear, reset, and submit paths in ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadDatePicker(page, build);
    await exerciseCustomerInteractions(page);
    expect(pageErrors).toEqual([]);
  });
}
