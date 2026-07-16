import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadDateTimePicker(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const picker = document.createElement('snice-date-time-picker') as HTMLElement & { value: string };
    picker.id = 'pre-upgrade-date-time';
    picker.value = '2026-03-08T02:30';
    document.body.appendChild(picker);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/date-time-picker/snice-date-time-picker.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/date-time-picker/snice-date-time-picker.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-date-time-picker.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-date-time-picker')));
  const preUpgrade = await page.evaluate(async () => {
    const picker = document.querySelector('#pre-upgrade-date-time') as any;
    await picker.ready;
    await picker.rendered;
    return {
      value: picker.value,
      defaultValue: picker.defaultValue,
      ownsValue: Object.prototype.hasOwnProperty.call(picker, 'value'),
      valueAttribute: picker.getAttribute('value'),
      display: picker.shadowRoot.querySelector('.input').value,
      valid: picker.checkValidity(),
      type: picker.type
    };
  });
  expect(preUpgrade).toEqual({
    value: '2026-03-08T02:30',
    defaultValue: '',
    ownsValue: false,
    valueAttribute: null,
    display: '2026-03-08 02:30',
    valid: true,
    type: 'datetime-local'
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Picker = HTMLElement & {
      value: string;
      defaultValue: string;
      dateFormat: string;
      timeFormat: string;
      showSeconds: boolean;
      min: string;
      max: string;
      disabled: boolean;
      readonly: boolean;
      loading: boolean;
      required: boolean;
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
      clear(): void;
      open(): void;
      formStateRestoreCallback(state: File | string | FormData | null, mode: 'restore' | 'autocomplete'): void;
    };

    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries())
      .map(([name, value]) => [name, String(value)]);
    const input = (picker: Picker) => picker.shadowRoot!.querySelector('.input') as HTMLInputElement;
    const toggle = (picker: Picker) => picker.shadowRoot!.querySelector('.toggle-button') as HTMLButtonElement;
    const clear = (picker: Picker) => picker.shadowRoot!.querySelector('.clear-button') as HTMLButtonElement;
    const settle = async (...pickers: Picker[]) => {
      await Promise.all(pickers.map(picker => picker.ready));
      await Promise.all(pickers.map(picker => picker.rendered));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    };

    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'main-date-time';
    externalLabel.textContent = 'External appointment time';
    const form = document.createElement('form');
    form.id = 'date-time-contract-form';
    form.innerHTML = `
      <snice-date-time-picker
        id="main-date-time"
        name="appointment"
        value="2026-03-10T14:05"
        date-format="dd/mm/yyyy"
        min="2026-03-01T00:00"
        max="2026-03-31T23:59"
        clearable
        required
      ></snice-date-time-picker>
      <snice-date-time-picker id="optional-date-time" name="optional"></snice-date-time-picker>
      <snice-date-time-picker id="disabled-date-time" name="disabled-time" value="2026-03-02T10:00" disabled></snice-date-time-picker>
      <snice-date-time-picker id="readonly-date-time" name="readonly-time" required readonly></snice-date-time-picker>
      <fieldset id="date-time-fieldset" disabled>
        <legend>
          Legend
          <snice-date-time-picker id="legend-date-time" name="legend-time" value="2026-03-04T11:00"></snice-date-time-picker>
        </legend>
        <snice-date-time-picker id="nested-date-time" name="nested-time" value="2026-03-06T12:00"></snice-date-time-picker>
      </fieldset>
    `;
    document.body.append(externalLabel, form);
    const pickers = Array.from(form.querySelectorAll('snice-date-time-picker')) as Picker[];
    await settle(...pickers);
    const [main, optional, authoredDisabled, readonly, legend, nested] = pickers;

    const initial = {
      entries: entries(form),
      value: main.value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      display: input(main).value,
      owner: main.form === form,
      listed: pickers.every(picker => Array.from(form.elements).includes(picker as any)),
      labels: main.labels?.length ?? -1,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      optionalValid: optional.checkValidity(),
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
    for (const type of ['datetime-change', 'datetimepicker-clear']) {
      main.addEventListener(type, () => lifecycleEvents.push(type));
    }

    main.value = '2026-03-11 16:25';
    main.dateFormat = 'mmmm dd, yyyy';
    main.timeFormat = '12h';
    await settle(main);
    const liveAssignment = {
      value: main.value,
      display: input(main).value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    input(main).value = 'March 11, 2026 4:';
    input(main).dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
    await settle(main);
    const partial = {
      value: main.value,
      display: input(main).value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      entries: entries(form)
    };

    main.timeFormat = '24h';
    main.dateFormat = 'yyyy-mm-dd';
    main.value = '2026-03-01T00:00';
    const minimum = { underflow: main.validity.rangeUnderflow, valid: main.checkValidity() };
    main.value = '2026-02-28T23:59';
    const underflow = { underflow: main.validity.rangeUnderflow, valid: main.checkValidity() };
    main.value = '2026-03-31T23:59';
    const maximum = { overflow: main.validity.rangeOverflow, valid: main.checkValidity() };
    main.value = '2026-04-01T00:00';
    const overflow = { overflow: main.validity.rangeOverflow, valid: main.checkValidity() };

    main.value = '2026-03-12T09:15';
    main.setAttribute('value', '2026-03-05T08:30');
    const dirtyBeforeReset = {
      value: main.value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value')
    };
    lifecycleEvents.length = 0;
    form.reset();
    await settle(main);
    const afterReset = {
      value: main.value,
      defaultValue: main.defaultValue,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    main.dateFormat = 'dd/mm/yyyy';
    main.timeFormat = '12h';
    await settle(main);
    main.formStateRestoreCallback('06/03/2026 9:45 PM', 'restore');
    const restored = {
      value: main.value,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };
    main.formStateRestoreCallback('07/03/2026 10:', 'autocomplete');
    const restoredPartial = {
      value: main.value,
      display: input(main).value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.formStateRestoreCallback(new File([], 'ignored.txt'), 'restore');
    const ignoredRestore = main.value;

    main.formStateRestoreCallback('2026-03-08T22:10', 'restore');
    main.remove();
    form.prepend(main);
    await settle(main);
    const reconnected = {
      value: main.value,
      display: input(main).value,
      owner: main.form === form,
      entries: entries(form)
    };

    main.setCustomValidity('Appointment booking is closed.');
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

    main.value = '2026-03-08T22:10:09';
    main.showSeconds = false;
    await settle(main);
    const minutePrecision = entries(form).find(entry => entry[0] === 'appointment')?.[1];
    main.showSeconds = true;
    await settle(main);
    const secondPrecision = entries(form).find(entry => entry[0] === 'appointment')?.[1];

    main.loading = true;
    await settle(main);
    const loading = {
      inputDisabled: input(main).disabled,
      toggleDisabled: toggle(main).disabled,
      clearHidden: clear(main).style.display === 'none',
      entries: entries(form),
      willValidate: main.willValidate,
      valid: main.checkValidity()
    };
    main.loading = false;
    await settle(main);

    const fieldset = form.querySelector('#date-time-fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await settle(nested);
    const reenabledFieldset = {
      nestedInputDisabled: input(nested).disabled,
      nestedProperty: nested.disabled,
      entries: entries(form)
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-date-time-form';
    const external = document.createElement('snice-date-time-picker') as Picker;
    external.setAttribute('form', externalForm.id);
    external.setAttribute('name', 'external-time');
    external.setAttribute('value', '2026-07-04T15:30');
    document.body.append(externalForm, external);
    await settle(external);
    const explicitOwner = {
      owner: external.form === externalForm,
      entries: entries(externalForm)
    };

    main.showSeconds = false;
    main.value = '2026-03-08T02:30';
    const localTime = {
      value: main.value,
      display: input(main).value,
      entries: entries(form).filter(entry => entry[0] === 'appointment'),
      valid: main.checkValidity()
    };

    return {
      initial,
      liveAssignment,
      partial,
      minimum,
      underflow,
      maximum,
      overflow,
      dirtyBeforeReset,
      afterReset,
      restored,
      restoredPartial,
      ignoredRestore,
      reconnected,
      customValidity,
      clearedCustomValidity,
      minutePrecision,
      secondPrecision,
      loading,
      reenabledFieldset,
      explicitOwner,
      localTime
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  expect(result.initial).toEqual({
    entries: [
      ['appointment', '2026-03-10T14:05'],
      ['optional', ''],
      ['readonly-time', ''],
      ['legend-time', '2026-03-04T11:00']
    ],
    value: '2026-03-10T14:05',
    defaultValue: '2026-03-10T14:05',
    valueAttribute: '2026-03-10T14:05',
    display: '10/03/2026 14:05',
    owner: true,
    listed: true,
    labels: 1,
    valid: true,
    formValid: true,
    optionalValid: true,
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
    value: '2026-03-11 16:25',
    display: 'March 11, 2026 4:25 PM',
    defaultValue: '2026-03-10T14:05',
    valueAttribute: '2026-03-10T14:05',
    entries: [
      ['appointment', '2026-03-11T16:25'],
      ['optional', ''],
      ['readonly-time', ''],
      ['legend-time', '2026-03-04T11:00']
    ],
    events: []
  });
  expect(result.partial).toMatchObject({
    value: 'March 11, 2026 4:',
    display: 'March 11, 2026 4:',
    badInput: true,
    valid: false,
    formValid: false
  });
  expect(result.partial.entries[0]).toEqual(['appointment', '']);
  expect(result.minimum).toEqual({ underflow: false, valid: true });
  expect(result.underflow).toEqual({ underflow: true, valid: false });
  expect(result.maximum).toEqual({ overflow: false, valid: true });
  expect(result.overflow).toEqual({ overflow: true, valid: false });
  expect(result.dirtyBeforeReset).toEqual({
    value: '2026-03-12T09:15',
    defaultValue: '2026-03-05T08:30',
    valueAttribute: '2026-03-05T08:30'
  });
  expect(result.afterReset).toMatchObject({
    value: '2026-03-05T08:30',
    defaultValue: '2026-03-05T08:30',
    display: '2026-03-05 08:30',
    events: []
  });
  expect(result.afterReset.entries[0]).toEqual(['appointment', '2026-03-05T08:30']);
  expect(result.restored).toMatchObject({
    value: '2026-03-06T21:45',
    display: '06/03/2026 9:45 PM',
    events: []
  });
  expect(result.restored.entries[0]).toEqual(['appointment', '2026-03-06T21:45']);
  expect(result.restoredPartial).toMatchObject({
    value: '07/03/2026 10:',
    display: '07/03/2026 10:',
    badInput: true,
    valid: false
  });
  expect(result.restoredPartial.entries[0]).toEqual(['appointment', '']);
  expect(result.ignoredRestore).toBe('07/03/2026 10:');
  expect(result.reconnected).toMatchObject({
    value: '2026-03-08T22:10',
    display: '08/03/2026 10:10 PM',
    owner: true
  });
  expect(result.reconnected.entries[0]).toEqual(['appointment', '2026-03-08T22:10']);
  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    message: 'Appointment booking is closed.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.minutePrecision).toBe('2026-03-08T22:10');
  expect(result.secondPrecision).toBe('2026-03-08T22:10:09');
  expect(result.loading).toMatchObject({
    inputDisabled: true,
    toggleDisabled: true,
    clearHidden: true,
    willValidate: false,
    valid: true
  });
  expect(result.loading.entries[0]).toEqual(['appointment', '2026-03-08T22:10:09']);
  expect(result.reenabledFieldset).toMatchObject({ nestedInputDisabled: false, nestedProperty: false });
  expect(result.reenabledFieldset.entries).toContainEqual(['nested-time', '2026-03-06T12:00']);
  expect(result.explicitOwner).toEqual({
    owner: true,
    entries: [['external-time', '2026-07-04T15:30']]
  });
  expect(result.localTime).toEqual({
    value: '2026-03-08T02:30',
    display: '08/03/2026 2:30 AM',
    entries: [['appointment', '2026-03-08T02:30']],
    valid: true
  });
}

async function exerciseCustomerInteractions(page: Page) {
  await page.evaluate(async () => {
    const fixture = document.createElement('div');
    fixture.id = 'date-time-interaction-fixture';
    fixture.style.cssText = 'position:fixed;inset:.5rem auto auto .5rem;z-index:2147483647;width:36rem;padding:1rem;background:white;color:black';
    fixture.innerHTML = `
      <form id="date-time-interaction-form">
        <snice-date-time-picker
          id="interaction-date-time"
          name="scheduled-at"
          label="Scheduled at"
          value="2026-03-10T14:05"
          min="2026-03-01T00:00"
          max="2026-03-31T23:59"
          show-seconds
          clearable
          required
        ></snice-date-time-picker>
        <button id="date-time-reset" type="reset">Reset</button>
        <button id="date-time-submit" type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const picker = document.querySelector('#interaction-date-time') as any;
    await picker.ready;
    await picker.rendered;
    (globalThis as any).__dateTimeEvents = [];
    (globalThis as any).__dateTimeSubmits = 0;
    for (const type of ['datetime-change', 'datetimepicker-clear']) {
      picker.addEventListener(type, () => (globalThis as any).__dateTimeEvents.push(type));
    }
    document.querySelector('#date-time-interaction-form')!.addEventListener('submit', event => {
      event.preventDefault();
      (globalThis as any).__dateTimeSubmits++;
    });
  });

  const picker = page.locator('#interaction-date-time');
  const form = page.locator('#date-time-interaction-form');
  const state = () => form.evaluate((element: HTMLFormElement) => {
    const picker = element.querySelector('snice-date-time-picker') as any;
    return {
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input')?.value ?? '',
      valid: picker.checkValidity(),
      formValid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)]),
      events: [...(globalThis as any).__dateTimeEvents]
    };
  });

  await picker.locator('.clear-button').click();
  expect(await state()).toEqual({
    value: '',
    display: '',
    valid: false,
    formValid: false,
    entries: [['scheduled-at', '']],
    events: ['datetimepicker-clear', 'datetime-change']
  });
  await page.evaluate(() => (document.querySelector('#date-time-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__dateTimeSubmits)).toBe(0);

  const input = picker.locator('.input');
  await input.fill('2026-03-12 09:30:15');
  await input.blur();
  expect(await state()).toMatchObject({
    value: '2026-03-12T09:30:15',
    valid: true,
    formValid: true,
    entries: [['scheduled-at', '2026-03-12T09:30:15']]
  });
  await page.evaluate(() => (document.querySelector('#date-time-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__dateTimeSubmits)).toBe(1);

  await picker.locator('.toggle-button').click();
  await picker.locator('[data-date="2026-03-15"]').click();
  await picker.locator('[data-hour="16"]').click();
  await picker.locator('[data-minute="30"]').click();
  await picker.locator('[data-second="45"]').click();
  expect(await state()).toMatchObject({
    value: '2026-03-15T16:30:45',
    valid: true,
    entries: [['scheduled-at', '2026-03-15T16:30:45']]
  });

  await page.locator('#date-time-reset').click();
  expect(await state()).toMatchObject({
    value: '2026-03-10T14:05',
    display: '2026-03-10 14:05:00',
    valid: true,
    entries: [['scheduled-at', '2026-03-10T14:05:00']]
  });

  const fieldset = await page.evaluate(async () => {
    const picker = document.querySelector('#interaction-date-time') as any;
    const fieldset = document.createElement('fieldset');
    picker.parentElement.insertBefore(fieldset, picker);
    fieldset.appendChild(picker);
    fieldset.disabled = true;
    await picker.rendered;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return {
      authoredDisabled: picker.disabled,
      effectiveDisabled: picker.matches(':disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      toggleDisabled: picker.shadowRoot.querySelector('.toggle-button').disabled,
      willValidate: picker.willValidate,
      entries: Array.from(new FormData(document.querySelector('#date-time-interaction-form') as HTMLFormElement).entries())
    };
  });
  expect(fieldset).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputDisabled: true,
    toggleDisabled: true,
    willValidate: false,
    entries: []
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native date-time form behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadDateTimePicker(page, build);
    assertFormContract(await exerciseFormContract(page));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test(`works through customer typing, calendar, time, clear, reset, submit, and fieldset paths in ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadDateTimePicker(page, build);
    await exerciseCustomerInteractions(page);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
