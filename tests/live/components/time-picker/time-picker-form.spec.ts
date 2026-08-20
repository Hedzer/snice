import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadTimePicker(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const picker = document.createElement('snice-time-picker') as HTMLElement & { value: string };
    picker.id = 'pre-upgrade-time';
    picker.value = '02:30:09';
    picker.setAttribute('show-seconds', '');
    picker.setAttribute('step', '1');
    document.body.appendChild(picker);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/time-picker/snice-time-picker.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/time-picker/snice-time-picker.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-time-picker.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-time-picker')));
  const preUpgrade = await page.evaluate(async () => {
    const picker = document.querySelector('#pre-upgrade-time') as any;
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
    value: '02:30:09',
    defaultValue: '',
    ownsValue: false,
    valueAttribute: null,
    display: '02:30:09',
    valid: true,
    type: 'time'
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Picker = HTMLElement & {
      value: string;
      defaultValue: string;
      format: '12h' | '24h';
      step: number;
      showSeconds: boolean;
      minTime: string;
      maxTime: string;
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
    const toggle = (picker: Picker) => picker.shadowRoot!.querySelector('.clock-toggle') as HTMLButtonElement;
    const clear = (picker: Picker) => picker.shadowRoot!.querySelector('.clear-button') as HTMLButtonElement;
    const settle = async (...pickers: Picker[]) => {
      await Promise.all(pickers.map(picker => picker.ready));
      await Promise.all(pickers.map(picker => picker.rendered));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    };

    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'main-time';
    externalLabel.textContent = 'External appointment time';
    const form = document.createElement('form');
    form.id = 'time-contract-form';
    form.innerHTML = `
      <snice-time-picker
        id="main-time"
        name="appointment"
        value="14:05:10"
        format="12h"
        step="5"
        min-time="09:30:10"
        max-time="17:45:50"
        show-seconds
        clearable
        required
      ></snice-time-picker>
      <snice-time-picker id="optional-time" name="optional"></snice-time-picker>
      <snice-time-picker id="disabled-time" name="disabled-time" value="10:00" disabled></snice-time-picker>
      <snice-time-picker id="readonly-time" name="readonly-time" required readonly></snice-time-picker>
      <fieldset id="time-fieldset" disabled>
        <legend>
          Legend
          <snice-time-picker id="legend-time" name="legend-time" value="11:00"></snice-time-picker>
        </legend>
        <snice-time-picker id="nested-time" name="nested-time" value="12:00"></snice-time-picker>
      </fieldset>
    `;
    document.body.append(externalLabel, form);
    const pickers = Array.from(form.querySelectorAll('snice-time-picker')) as Picker[];
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
    for (const type of ['time-change', 'timepicker-clear']) {
      main.addEventListener(type, () => lifecycleEvents.push(type));
    }

    main.value = '16:25:35';
    main.format = '24h';
    await settle(main);
    const liveAssignment = {
      value: main.value,
      display: input(main).value,
      defaultValue: main.defaultValue,
      valueAttribute: main.getAttribute('value'),
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    input(main).value = '16:';
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

    main.value = '09:30:10';
    const minimum = { underflow: main.validity.rangeUnderflow, valid: main.checkValidity() };
    main.value = '09:30:09';
    const underflow = { underflow: main.validity.rangeUnderflow, valid: main.checkValidity() };
    main.value = '17:45:50';
    const maximum = { overflow: main.validity.rangeOverflow, valid: main.checkValidity() };
    main.value = '17:45:51';
    const overflow = { overflow: main.validity.rangeOverflow, valid: main.checkValidity() };
    main.value = '10:06:10';
    const minuteStep = { mismatch: main.validity.stepMismatch, valid: main.checkValidity() };
    main.value = '10:05:11';
    const secondStep = { mismatch: main.validity.stepMismatch, valid: main.checkValidity() };
    main.value = '10:05:10';
    const alignedStep = { mismatch: main.validity.stepMismatch, valid: main.checkValidity() };

    main.value = '12:15:20';
    main.setAttribute('value', '10:30:40');
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

    main.format = '12h';
    await settle(main);
    main.formStateRestoreCallback('9:45:15 PM', 'restore');
    const restored = {
      value: main.value,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };
    main.formStateRestoreCallback('10:', 'autocomplete');
    const restoredPartial = {
      value: main.value,
      display: input(main).value,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.formStateRestoreCallback(new File([], 'ignored.txt'), 'restore');
    const ignoredRestore = main.value;

    main.formStateRestoreCallback('14:30:45', 'restore');
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

    main.value = '14:30:45';
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

    const fieldset = form.querySelector('#time-fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await settle(nested);
    const reenabledFieldset = {
      nestedInputDisabled: input(nested).disabled,
      nestedProperty: nested.disabled,
      entries: entries(form)
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-time-form';
    const external = document.createElement('snice-time-picker') as Picker;
    external.setAttribute('form', externalForm.id);
    external.setAttribute('name', 'external-time');
    external.setAttribute('value', '15:30');
    external.setAttribute('step', '1');
    document.body.append(externalForm, external);
    await settle(external);
    const explicitOwner = {
      owner: external.form === externalForm,
      entries: entries(externalForm)
    };

    return {
      initial,
      liveAssignment,
      partial,
      minimum,
      underflow,
      maximum,
      overflow,
      minuteStep,
      secondStep,
      alignedStep,
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
      explicitOwner
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  expect(result.initial).toEqual({
    entries: [
      ['appointment', '14:05:10'],
      ['optional', ''],
      ['readonly-time', ''],
      ['legend-time', '11:00']
    ],
    value: '14:05:10',
    defaultValue: '14:05:10',
    valueAttribute: '14:05:10',
    display: '2:05:10 PM',
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
    value: '16:25:35',
    display: '16:25:35',
    defaultValue: '14:05:10',
    valueAttribute: '14:05:10',
    entries: [
      ['appointment', '16:25:35'],
      ['optional', ''],
      ['readonly-time', ''],
      ['legend-time', '11:00']
    ],
    events: []
  });
  expect(result.partial).toMatchObject({
    value: '16:',
    display: '16:',
    badInput: true,
    valid: false,
    formValid: false
  });
  expect(result.partial.entries[0]).toEqual(['appointment', '']);
  expect(result.minimum).toEqual({ underflow: false, valid: true });
  expect(result.underflow).toEqual({ underflow: true, valid: false });
  expect(result.maximum).toEqual({ overflow: false, valid: true });
  expect(result.overflow).toEqual({ overflow: true, valid: false });
  expect(result.minuteStep).toEqual({ mismatch: true, valid: false });
  expect(result.secondStep).toEqual({ mismatch: true, valid: false });
  expect(result.alignedStep).toEqual({ mismatch: false, valid: true });
  expect(result.dirtyBeforeReset).toEqual({
    value: '12:15:20',
    defaultValue: '10:30:40',
    valueAttribute: '10:30:40'
  });
  expect(result.afterReset).toMatchObject({
    value: '10:30:40',
    defaultValue: '10:30:40',
    display: '10:30:40',
    events: []
  });
  expect(result.afterReset.entries[0]).toEqual(['appointment', '10:30:40']);
  expect(result.restored).toMatchObject({
    value: '21:45:15',
    display: '9:45:15 PM',
    events: []
  });
  expect(result.restored.entries[0]).toEqual(['appointment', '21:45:15']);
  expect(result.restoredPartial).toMatchObject({
    value: '10:',
    display: '10:',
    badInput: true,
    valid: false
  });
  expect(result.restoredPartial.entries[0]).toEqual(['appointment', '']);
  expect(result.ignoredRestore).toBe('10:');
  expect(result.reconnected).toMatchObject({
    value: '14:30:45',
    display: '2:30:45 PM',
    owner: true
  });
  expect(result.reconnected.entries[0]).toEqual(['appointment', '14:30:45']);
  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    message: 'Appointment booking is closed.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.minutePrecision).toBe('14:30');
  expect(result.secondPrecision).toBe('14:30:45');
  expect(result.loading).toMatchObject({
    inputDisabled: true,
    toggleDisabled: true,
    clearHidden: true,
    willValidate: false,
    valid: true
  });
  expect(result.loading.entries[0]).toEqual(['appointment', '14:30:45']);
  expect(result.reenabledFieldset).toMatchObject({ nestedInputDisabled: false, nestedProperty: false });
  expect(result.reenabledFieldset.entries).toContainEqual(['nested-time', '12:00']);
  expect(result.explicitOwner).toEqual({ owner: true, entries: [['external-time', '15:30']] });
}

async function exerciseCustomerInteractions(page: Page) {
  await page.evaluate(async () => {
    const fixture = document.createElement('div');
    fixture.id = 'time-interaction-fixture';
    fixture.style.cssText = 'position:fixed;inset:.5rem auto auto .5rem;z-index:2147483647;width:min(36rem,calc(100vw - 1rem));padding:1rem;background:white;color:black;box-sizing:border-box';
    fixture.innerHTML = `
      <form id="time-interaction-form">
        <snice-time-picker
          id="interaction-time"
          name="scheduled-at"
          label="Scheduled at"
          value="14:05:10"
          format="12h"
          step="5"
          min-time="09:00:00"
          max-time="17:00:00"
          show-seconds
          clearable
          required
        ></snice-time-picker>
        <snice-time-picker
          id="inline-time"
          name="inline-at"
          value="10:00"
          step="5"
          variant="inline"
        ></snice-time-picker>
        <button id="time-reset" type="reset">Reset</button>
        <button id="time-submit" type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const pickers = Array.from(fixture.querySelectorAll('snice-time-picker')) as any[];
    await Promise.all(pickers.map(picker => picker.ready));
    await Promise.all(pickers.map(picker => picker.rendered));
    (globalThis as any).__timeEvents = [];
    (globalThis as any).__timeSubmits = 0;
    for (const type of ['time-change', 'timepicker-clear']) {
      pickers[0].addEventListener(type, () => (globalThis as any).__timeEvents.push(type));
    }
    document.querySelector('#time-interaction-form')!.addEventListener('submit', event => {
      event.preventDefault();
      (globalThis as any).__timeSubmits++;
    });
  });

  const picker = page.locator('#interaction-time');
  const inline = page.locator('#inline-time');
  const form = page.locator('#time-interaction-form');
  const state = () => form.evaluate((element: HTMLFormElement) => {
    const picker = element.querySelector('#interaction-time') as any;
    return {
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input')?.value ?? '',
      valid: picker.checkValidity(),
      formValid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)]),
      events: [...(globalThis as any).__timeEvents]
    };
  });

  await picker.locator('.clear-button').click();
  expect(await state()).toEqual({
    value: '',
    display: '',
    valid: false,
    formValid: false,
    entries: [['scheduled-at', ''], ['inline-at', '10:00']],
    events: ['timepicker-clear', 'time-change']
  });
  await page.evaluate(() => (document.querySelector('#time-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__timeSubmits)).toBe(0);

  const input = picker.locator('.input');
  await input.fill('2:30:15 PM');
  await input.blur();
  expect(await state()).toMatchObject({
    value: '14:30:15',
    display: '2:30:15 PM',
    valid: true,
    formValid: true,
    entries: [['scheduled-at', '14:30:15'], ['inline-at', '10:00']]
  });
  await page.evaluate(() => (document.querySelector('#time-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__timeSubmits)).toBe(1);

  await page.evaluate(() => {
    const fixture = document.querySelector('#time-interaction-fixture') as HTMLElement;
    fixture.style.width = '21rem';
    fixture.style.inset = 'auto .25rem .25rem auto';
    (document.querySelector('#inline-time') as HTMLElement).style.display = 'none';
  });
  await picker.locator('.clock-toggle').click();
  // The dropdown's position is settled asynchronously: Firefox lays the
  // popover out lazily after showPopover() and the panel runs a 150ms
  // entrance transition, so the viewport clamps land on the settled box a
  // beat after the open. Wait for the full clamp invariant (both axes)
  // before measuring it.
  await expect.poll(() => picker.locator('.dropdown').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.left >= 0 && rect.top >= 0
      && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight;
  })).toBe(true).catch(async (err) => {
    const state = await picker.locator('.dropdown').evaluate(el => {
      const rect = el.getBoundingClientRect();
      const anchor = el.parentElement?.querySelector('.input-container')?.getBoundingClientRect();
      return {
        top: +rect.top.toFixed(1), bottom: +rect.bottom.toFixed(1),
        left: +rect.left.toFixed(1), right: +rect.right.toFixed(1),
        h: +rect.height.toFixed(1), w: +rect.width.toFixed(1), vh: window.innerHeight, vw: window.innerWidth,
        styleTop: (el as HTMLElement).style.top, styleBottom: (el as HTMLElement).style.bottom,
        styleLeft: (el as HTMLElement).style.left, styleRight: (el as HTMLElement).style.right,
        anchor: anchor ? { top: +anchor.top.toFixed(1), left: +anchor.left.toFixed(1), bottom: +anchor.bottom.toFixed(1) } : null,
        open: (el as HTMLElement).matches(':popover-open'),
      };
    });
    console.log('TPPOLL ' + JSON.stringify(state));
    throw err;
  });
  const popupBounds = await picker.locator('.dropdown').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: innerWidth,
      height: innerHeight
    };
  });
  expect(popupBounds.left).toBeGreaterThanOrEqual(0);
  expect(popupBounds.top).toBeGreaterThanOrEqual(0);
  expect(popupBounds.right).toBeLessThanOrEqual(popupBounds.width);
  expect(popupBounds.bottom).toBeLessThanOrEqual(popupBounds.height);
  await picker.locator('[data-hour="4"]').click();
  await picker.locator('[data-minute="30"]').click();
  await picker.locator('[data-second="45"]').click();
  await picker.locator('.selector-column--period .selector-item', { hasText: 'PM' }).click();
  expect(await state()).toMatchObject({
    value: '16:30:45',
    display: '4:30:45 PM',
    valid: true,
    entries: [['scheduled-at', '16:30:45'], ['inline-at', '10:00']]
  });
  await picker.evaluate((element: any) => element.close());
  await page.evaluate(() => {
    const fixture = document.querySelector('#time-interaction-fixture') as HTMLElement;
    fixture.style.width = 'min(36rem,calc(100vw - 1rem))';
    fixture.style.inset = '.5rem auto auto .5rem';
    (document.querySelector('#inline-time') as HTMLElement).style.display = '';
  });

  await inline.locator('[data-hour="11"]').click();
  await inline.locator('[data-minute="15"]').click();
  expect(await inline.evaluate((element: any) => element.value)).toBe('11:15');

  await page.locator('#time-reset').click();
  expect(await state()).toMatchObject({
    value: '14:05:10',
    display: '2:05:10 PM',
    valid: true,
    entries: [['scheduled-at', '14:05:10'], ['inline-at', '10:00']]
  });

  const fieldset = await page.evaluate(async () => {
    const picker = document.querySelector('#interaction-time') as any;
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
      toggleDisabled: picker.shadowRoot.querySelector('.clock-toggle').disabled,
      selectorDisabled: Array.from(picker.shadowRoot.querySelectorAll('.selector-item'))
        .every((button: any) => button.disabled),
      willValidate: picker.willValidate,
      entries: Array.from(new FormData(document.querySelector('#time-interaction-form') as HTMLFormElement).entries())
        .map(([name, value]) => [name, String(value)])
    };
  });
  expect(fieldset).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputDisabled: true,
    toggleDisabled: true,
    selectorDisabled: true,
    willValidate: false,
    entries: [['inline-at', '10:00']]
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native time form behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());


    });
    await loadTimePicker(page, build);
    assertFormContract(await exerciseFormContract(page));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test(`works through customer typing, picker, inline, clear, reset, submit, and fieldset paths in ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());

    });
    await loadTimePicker(page, build);
    await exerciseCustomerInteractions(page);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
