import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadDateRangePicker(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    type PreUpgradePicker = HTMLElement & { start: string; end: string };
    const canonical = document.createElement('snice-date-range-picker') as PreUpgradePicker;
    canonical.id = 'pre-upgrade-range';
    canonical.start = '2026-03-10';
    canonical.end = '2026-03-20';

    const formatted = document.createElement('snice-date-range-picker') as PreUpgradePicker;
    formatted.id = 'pre-upgrade-formatted-range';
    formatted.setAttribute('format', 'dd/mm/yyyy');
    formatted.start = '10/03/2026';
    formatted.end = '20/03/2026';
    document.body.append(canonical, formatted);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/date-range-picker/snice-date-range-picker.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/date-range-picker/snice-date-range-picker.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-date-range-picker.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-date-range-picker')));
  const preUpgrade = await page.evaluate(async () => {
    type Picker = HTMLElement & {
      start: string;
      end: string;
      defaultStart: string;
      defaultEnd: string;
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    const read = async (selector: string) => {
      const picker = document.querySelector(selector) as Picker;
      await picker.ready;
      await picker.rendered;
      return {
        start: picker.start,
        end: picker.end,
        defaultStart: picker.defaultStart,
        defaultEnd: picker.defaultEnd,
        ownsStart: Object.prototype.hasOwnProperty.call(picker, 'start'),
        ownsEnd: Object.prototype.hasOwnProperty.call(picker, 'end'),
        startAttribute: picker.getAttribute('start'),
        endAttribute: picker.getAttribute('end'),
        display: (picker.shadowRoot!.querySelector('.input') as HTMLInputElement).value
      };
    };
    return {
      canonical: await read('#pre-upgrade-range'),
      formatted: await read('#pre-upgrade-formatted-range')
    };
  });

  expect(preUpgrade.canonical).toEqual({
    start: '2026-03-10',
    end: '2026-03-20',
    defaultStart: '',
    defaultEnd: '',
    ownsStart: false,
    ownsEnd: false,
    startAttribute: null,
    endAttribute: null,
    display: '03/10/2026  —  03/20/2026'
  });
  expect(preUpgrade.formatted).toEqual({
    start: '10/03/2026',
    end: '20/03/2026',
    defaultStart: '',
    defaultEnd: '',
    ownsStart: false,
    ownsEnd: false,
    startAttribute: null,
    endAttribute: null,
    display: '10/03/2026  —  20/03/2026'
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Picker = HTMLElement & {
      start: string;
      end: string;
      defaultStart: string;
      defaultEnd: string;
      format: string;
      min: string;
      max: string;
      name: string;
      disabled: boolean;
      readonly: boolean;
      loading: boolean;
      required: boolean;
      showCalendar: boolean;
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
      formStateRestoreCallback(state: string | FormData, mode: 'restore' | 'autocomplete'): void;
    };

    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries())
      .map(([name, value]) => [name, String(value)]);
    const input = (picker: Picker) => picker.shadowRoot!.querySelector('.input') as HTMLInputElement;
    const toggle = (picker: Picker) => picker.shadowRoot!.querySelector('.calendar-toggle') as HTMLButtonElement;
    const clear = (picker: Picker) => picker.shadowRoot!.querySelector('.clear-button') as HTMLButtonElement;
    const settle = async (...pickers: Picker[]) => {
      await Promise.all(pickers.map(picker => picker.ready));
      await Promise.all(pickers.map(picker => picker.rendered));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    };

    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'main-range';
    externalLabel.textContent = 'External trip range';
    const form = document.createElement('form');
    form.id = 'range-contract-form';
    form.innerHTML = `
      <snice-date-range-picker
        id="main-range"
        name="trip"
        start="2026-03-10"
        end="2026-03-20"
        format="dd/mm/yyyy"
        min="2026-03-01"
        max="2026-03-31"
        clearable
        required
      ></snice-date-range-picker>
      <snice-date-range-picker id="optional-range" name="optional"></snice-date-range-picker>
      <snice-date-range-picker id="disabled-range" name="disabled-range" start="2026-03-02" end="2026-03-03" disabled></snice-date-range-picker>
      <snice-date-range-picker id="readonly-range" name="readonly-range" required readonly></snice-date-range-picker>
      <fieldset id="range-fieldset" disabled>
        <legend>
          Legend
          <snice-date-range-picker id="legend-range" name="legend-range" start="2026-03-04" end="2026-03-05"></snice-date-range-picker>
        </legend>
        <snice-date-range-picker id="nested-range" name="nested-range" start="2026-03-06" end="2026-03-07"></snice-date-range-picker>
      </fieldset>
    `;
    document.body.append(externalLabel, form);
    const pickers = Array.from(form.querySelectorAll('snice-date-range-picker')) as Picker[];
    await settle(...pickers);
    const [main, optional, authoredDisabled, readonly, legend, nested] = pickers;

    const initial = {
      entries: entries(form),
      start: main.start,
      end: main.end,
      defaultStart: main.defaultStart,
      defaultEnd: main.defaultEnd,
      startAttribute: main.getAttribute('start'),
      endAttribute: main.getAttribute('end'),
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
    for (const type of ['daterange-change', 'daterange-clear', 'daterange-preset']) {
      main.addEventListener(type, () => lifecycleEvents.push(type));
    }

    main.start = '11/03/2026';
    main.end = '21/03/2026';
    main.format = 'mmmm dd, yyyy';
    await settle(main);
    const liveAssignment = {
      start: main.start,
      end: main.end,
      display: input(main).value,
      defaultStart: main.defaultStart,
      defaultEnd: main.defaultEnd,
      startAttribute: main.getAttribute('start'),
      endAttribute: main.getAttribute('end'),
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    main.end = '';
    const partial = {
      start: main.start,
      end: main.end,
      badInput: main.validity.badInput,
      valueMissing: main.validity.valueMissing,
      valid: main.checkValidity(),
      formValid: form.checkValidity(),
      entries: entries(form)
    };

    main.start = '2026-03-25';
    main.end = '2026-03-15';
    const reversed = {
      start: main.start,
      end: main.end,
      customError: main.validity.customError,
      message: main.validationMessage,
      valid: main.checkValidity(),
      entries: entries(form)
    };

    main.start = '2026-02-28';
    main.end = '2026-03-15';
    const underflow = {
      underflow: main.validity.rangeUnderflow,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.start = '2026-03-15';
    main.end = '2026-04-01';
    const overflow = { overflow: main.validity.rangeOverflow, valid: main.checkValidity() };

    main.start = '2026-03-12';
    main.end = '2026-03-22';
    main.setAttribute('start', '2026-03-05');
    main.setAttribute('end', '2026-03-25');
    const dirtyBeforeReset = {
      start: main.start,
      end: main.end,
      defaultStart: main.defaultStart,
      defaultEnd: main.defaultEnd
    };
    lifecycleEvents.length = 0;
    form.reset();
    await settle(main);
    const afterReset = {
      start: main.start,
      end: main.end,
      defaultStart: main.defaultStart,
      defaultEnd: main.defaultEnd,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };

    main.formStateRestoreCallback(JSON.stringify(['March 06, 2026', 'March 24, 2026']), 'restore');
    const restored = {
      start: main.start,
      end: main.end,
      display: input(main).value,
      entries: entries(form),
      events: [...lifecycleEvents]
    };
    main.formStateRestoreCallback(JSON.stringify(['March 06, 2026', '']), 'autocomplete');
    const restoredPartial = {
      start: main.start,
      end: main.end,
      badInput: main.validity.badInput,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.formStateRestoreCallback('malformed-state', 'restore');
    const ignoredRestore = [main.start, main.end];

    const restoredFormData = new FormData();
    restoredFormData.append('trip-start', '2026-03-08');
    restoredFormData.append('trip-end', '2026-03-18');
    main.formStateRestoreCallback(restoredFormData, 'restore');
    const restoredFromFormData = {
      start: main.start,
      end: main.end,
      display: input(main).value,
      entries: entries(form)
    };

    main.remove();
    form.prepend(main);
    await settle(main);
    const reconnected = {
      start: main.start,
      end: main.end,
      display: input(main).value,
      owner: main.form === form,
      entries: entries(form)
    };

    main.setCustomValidity('Trip dates are unavailable.');
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

    main.format = 'dd/mm/yyyy';
    main.min = '10/03/2026';
    main.max = '20/03/2026';
    main.start = '10/03/2026';
    main.end = '21/03/2026';
    const formattedConstraints = {
      display: input(main).value,
      overflow: main.validity.rangeOverflow,
      valid: main.checkValidity(),
      entries: entries(form)
    };
    main.max = '21/03/2026';
    const dynamicConstraint = { valid: main.checkValidity(), entries: entries(form) };

    const fieldset = form.querySelector('#range-fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await settle(nested);
    const reenabledFieldset = {
      nestedInputDisabled: input(nested).disabled,
      nestedProperty: nested.disabled,
      entries: entries(form)
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-range-form';
    const external = document.createElement('snice-date-range-picker') as Picker;
    external.setAttribute('form', externalForm.id);
    external.setAttribute('name', 'external');
    external.setAttribute('start', '2026-07-04');
    external.setAttribute('end', '2026-07-05');
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
      reversed,
      underflow,
      overflow,
      dirtyBeforeReset,
      afterReset,
      restored,
      restoredPartial,
      ignoredRestore,
      restoredFromFormData,
      reconnected,
      customValidity,
      clearedCustomValidity,
      loading,
      formattedConstraints,
      dynamicConstraint,
      reenabledFieldset,
      explicitOwner
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  expect(result.initial).toEqual({
    entries: [
      ['trip-start', '2026-03-10'],
      ['trip-end', '2026-03-20'],
      ['optional-start', ''],
      ['optional-end', ''],
      ['readonly-range-start', ''],
      ['readonly-range-end', ''],
      ['legend-range-start', '2026-03-04'],
      ['legend-range-end', '2026-03-05']
    ],
    start: '2026-03-10',
    end: '2026-03-20',
    defaultStart: '2026-03-10',
    defaultEnd: '2026-03-20',
    startAttribute: '2026-03-10',
    endAttribute: '2026-03-20',
    display: '10/03/2026  —  20/03/2026',
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
    start: '11/03/2026',
    end: '21/03/2026',
    display: 'March 11, 2026  —  March 21, 2026',
    defaultStart: '2026-03-10',
    defaultEnd: '2026-03-20',
    startAttribute: '2026-03-10',
    endAttribute: '2026-03-20',
    entries: [
      ['trip-start', '2026-03-11'],
      ['trip-end', '2026-03-21'],
      ['optional-start', ''],
      ['optional-end', ''],
      ['readonly-range-start', ''],
      ['readonly-range-end', ''],
      ['legend-range-start', '2026-03-04'],
      ['legend-range-end', '2026-03-05']
    ],
    events: []
  });
  expect(result.partial).toMatchObject({
    start: '11/03/2026', end: '', badInput: true, valueMissing: true, valid: false, formValid: false
  });
  expect(result.partial.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-11'], ['trip-end', '']]);
  expect(result.reversed).toMatchObject({
    start: '2026-03-25', end: '2026-03-15', customError: true, valid: false
  });
  expect(result.reversed.message).toContain('End date');
  expect(result.reversed.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-25'], ['trip-end', '2026-03-15']]);
  expect(result.underflow).toMatchObject({ underflow: true, valid: false });
  expect(result.underflow.entries.slice(0, 2)).toEqual([['trip-start', '2026-02-28'], ['trip-end', '2026-03-15']]);
  expect(result.overflow).toEqual({ overflow: true, valid: false });
  expect(result.dirtyBeforeReset).toEqual({
    start: '2026-03-12', end: '2026-03-22', defaultStart: '2026-03-05', defaultEnd: '2026-03-25'
  });
  expect(result.afterReset).toMatchObject({
    start: '2026-03-05',
    end: '2026-03-25',
    defaultStart: '2026-03-05',
    defaultEnd: '2026-03-25',
    display: 'March 05, 2026  —  March 25, 2026',
    events: []
  });
  expect(result.afterReset.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-05'], ['trip-end', '2026-03-25']]);
  expect(result.restored).toMatchObject({
    start: 'March 06, 2026', end: 'March 24, 2026', display: 'March 06, 2026  —  March 24, 2026', events: []
  });
  expect(result.restored.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-06'], ['trip-end', '2026-03-24']]);
  expect(result.restoredPartial).toMatchObject({
    start: 'March 06, 2026', end: '', badInput: true, valid: false
  });
  expect(result.restoredPartial.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-06'], ['trip-end', '']]);
  expect(result.ignoredRestore).toEqual(['March 06, 2026', '']);
  expect(result.restoredFromFormData).toMatchObject({
    start: '2026-03-08', end: '2026-03-18', display: 'March 08, 2026  —  March 18, 2026'
  });
  expect(result.restoredFromFormData.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-08'], ['trip-end', '2026-03-18']]);
  expect(result.reconnected).toMatchObject({
    start: '2026-03-08', end: '2026-03-18', display: 'March 08, 2026  —  March 18, 2026', owner: true
  });
  expect(result.reconnected.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-08'], ['trip-end', '2026-03-18']]);
  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    message: 'Trip dates are unavailable.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.loading).toMatchObject({
    inputDisabled: true, toggleDisabled: true, clearHidden: true, willValidate: false, valid: true
  });
  expect(result.loading.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-08'], ['trip-end', '2026-03-18']]);
  expect(result.formattedConstraints).toMatchObject({
    display: '10/03/2026  —  21/03/2026', overflow: true, valid: false
  });
  expect(result.formattedConstraints.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-10'], ['trip-end', '2026-03-21']]);
  expect(result.dynamicConstraint).toMatchObject({ valid: true });
  expect(result.dynamicConstraint.entries.slice(0, 2)).toEqual([['trip-start', '2026-03-10'], ['trip-end', '2026-03-21']]);
  expect(result.reenabledFieldset).toMatchObject({ nestedInputDisabled: false, nestedProperty: false });
  expect(result.reenabledFieldset.entries).toContainEqual(['nested-range-start', '2026-03-06']);
  expect(result.reenabledFieldset.entries).toContainEqual(['nested-range-end', '2026-03-07']);
  expect(result.explicitOwner).toEqual({
    owner: true,
    entries: [['external-start', '2026-07-04'], ['external-end', '2026-07-05']]
  });
}

async function exerciseCustomerInteractions(page: Page) {
  await page.evaluate(async () => {
    const fixture = document.createElement('div');
    fixture.id = 'range-interaction-fixture';
    fixture.style.cssText = [
      'position:fixed',
      'inset:0.5rem auto auto 0.5rem',
      'z-index:2147483647',
      'width:42rem',
      'padding:1rem',
      'background:white',
      'color:black'
    ].join(';');
    fixture.innerHTML = `
      <form id="range-interaction-form">
        <snice-date-range-picker
          id="interaction-range"
          name="booking"
          label="Booking dates"
          start="2026-03-10"
          end="2026-03-15"
          min="2026-03-01"
          max="2026-03-31"
          columns="2"
          clearable
          required
        ></snice-date-range-picker>
        <button id="range-reset" type="reset">Reset</button>
        <button id="range-submit" type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const picker = document.querySelector('#interaction-range') as any;
    await picker.ready;
    await picker.rendered;
    picker.presets = [
      { label: 'March week', start: '2026-03-05', end: '2026-03-11' },
      { label: 'Late March', start: new Date(2026, 2, 21), end: new Date(2026, 2, 28) }
    ];
    await picker.rendered;
    (globalThis as any).__rangeEvents = [];
    (globalThis as any).__rangeSubmits = 0;
    for (const type of ['daterange-change', 'daterange-clear', 'daterange-preset']) {
      picker.addEventListener(type, (event: CustomEvent) => {
        (globalThis as any).__rangeEvents.push({
          type,
          start: picker.start,
          end: picker.end,
          startIso: event.detail?.startIso,
          endIso: event.detail?.endIso,
          label: event.detail?.label
        });
      });
    }
    document.querySelector('#range-interaction-form')!.addEventListener('submit', event => {
      event.preventDefault();
      (globalThis as any).__rangeSubmits++;
    });
  });

  const picker = page.locator('#interaction-range');
  const formEntries = () => page.evaluate(() =>
    Array.from(new FormData(document.querySelector('#range-interaction-form') as HTMLFormElement).entries())
  );

  await picker.locator('.clear-button').click();
  const cleared = await page.evaluate(() => {
    const picker = document.querySelector('#interaction-range') as any;
    const form = document.querySelector('#range-interaction-form') as HTMLFormElement;
    return {
      start: picker.start,
      end: picker.end,
      display: picker.shadowRoot.querySelector('.input').value,
      valid: picker.checkValidity(),
      formValid: form.checkValidity(),
      entries: Array.from(new FormData(form).entries()),
      eventTypes: (globalThis as any).__rangeEvents.map((event: any) => event.type)
    };
  });
  expect(cleared).toEqual({
    start: '',
    end: '',
    display: '',
    valid: false,
    formValid: false,
    entries: [['booking-start', ''], ['booking-end', '']],
    eventTypes: ['daterange-clear', 'daterange-change']
  });

  await page.evaluate(() => (document.querySelector('#range-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__rangeSubmits)).toBe(0);

  await picker.locator('.calendar-toggle').click();
  await expect(picker.locator('.month')).toHaveCount(2);
  await picker.locator('[data-date="2026-03-12"]').click();
  expect(await formEntries()).toEqual([['booking-start', '2026-03-12'], ['booking-end', '']]);
  await picker.locator('[data-date="2026-03-20"]').click();
  const selected = await page.evaluate(() => {
    const picker = document.querySelector('#interaction-range') as any;
    return {
      start: picker.start,
      end: picker.end,
      display: picker.shadowRoot.querySelector('.input').value,
      open: picker.showCalendar,
      valid: picker.checkValidity(),
      events: [...(globalThis as any).__rangeEvents]
    };
  });
  expect(selected).toMatchObject({
    start: '03/12/2026',
    end: '03/20/2026',
    display: '03/12/2026  —  03/20/2026',
    open: false,
    valid: true
  });
  expect(selected.events.map((event: any) => event.type)).toEqual([
    'daterange-clear', 'daterange-change', 'daterange-change'
  ]);
  expect(await formEntries()).toEqual([['booking-start', '2026-03-12'], ['booking-end', '2026-03-20']]);

  await page.evaluate(() => (document.querySelector('#range-interaction-form') as HTMLFormElement).requestSubmit());
  expect(await page.evaluate(() => (globalThis as any).__rangeSubmits)).toBe(1);

  await picker.locator('.calendar-toggle').click();
  await expect(picker.locator('[data-date="2026-04-01"]')).toBeDisabled();
  await picker.locator('[data-preset="0"]').click();
  expect(await formEntries()).toEqual([['booking-start', '2026-03-05'], ['booking-end', '2026-03-11']]);
  const presetEvent = await page.evaluate(() =>
    (globalThis as any).__rangeEvents.find((event: any) => event.type === 'daterange-preset')
  );
  expect(presetEvent).toMatchObject({ type: 'daterange-preset', label: 'March week' });

  await page.locator('#range-reset').click();
  expect(await formEntries()).toEqual([['booking-start', '2026-03-10'], ['booking-end', '2026-03-15']]);

  const fieldsetState = await page.evaluate(async () => {
    const picker = document.querySelector('#interaction-range') as any;
    picker.open();
    const fieldset = document.createElement('fieldset');
    picker.parentElement.insertBefore(fieldset, picker);
    fieldset.appendChild(picker);
    fieldset.disabled = true;
    await picker.rendered;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return {
      property: picker.disabled,
      attribute: picker.hasAttribute('disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      toggleDisabled: picker.shadowRoot.querySelector('.calendar-toggle').disabled,
      open: picker.showCalendar,
      entries: Array.from(new FormData(document.querySelector('#range-interaction-form') as HTMLFormElement).entries())
    };
  });
  expect(fieldsetState).toEqual({
    property: false,
    attribute: false,
    inputDisabled: true,
    toggleDisabled: true,
    open: false,
    entries: []
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native date-range form behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadDateRangePicker(page, build);
    assertFormContract(await exerciseFormContract(page));
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test(`works through customer calendar, preset, clear, reset, submit, and fieldset paths in ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadDateRangePicker(page, build);
    await exerciseCustomerInteractions(page);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
