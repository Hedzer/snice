import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadCheckbox(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const checkbox = document.createElement('snice-checkbox') as HTMLElement & { checked: boolean };
    checkbox.id = 'pre-upgrade-checkbox';
    checkbox.checked = true;
    document.body.appendChild(checkbox);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/checkbox/snice-checkbox.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/checkbox/snice-checkbox.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-checkbox.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-checkbox')));

  const preUpgrade = await page.evaluate(async () => {
    const checkbox = document.querySelector('#pre-upgrade-checkbox') as HTMLElement & {
      checked: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    await checkbox.ready;
    await checkbox.rendered;
    return {
      checked: checkbox.checked,
      ownsChecked: Object.prototype.hasOwnProperty.call(checkbox, 'checked'),
      inputChecked: (checkbox.shadowRoot!.querySelector('input') as HTMLInputElement).checked,
      checkedAttribute: checkbox.hasAttribute('checked')
    };
  });
  expect(preUpgrade).toEqual({
    checked: true,
    ownsChecked: false,
    inputChecked: true,
    checkedAttribute: false
  });
}

async function exerciseFormContract(page: Page) {
  return page.evaluate(async () => {
    type Checkbox = HTMLElement & {
      checked: boolean;
      defaultChecked: boolean;
      indeterminate: boolean;
      disabled: boolean;
      loading: boolean;
      required: boolean;
      invalid: boolean;
      name: string;
      value: string;
      type: string;
      form: HTMLFormElement | null;
      validity: ValidityState;
      validationMessage: string;
      willValidate: boolean;
      labels: NodeList | null;
      ready: Promise<void>;
      rendered: Promise<void>;
      checkValidity(): boolean;
      reportValidity(): boolean;
      setCustomValidity(message: string): void;
      formStateRestoreCallback(state: string, mode: 'restore' | 'autocomplete'): void;
    };

    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries())
      .map(([name, value]) => [name, String(value)]);
    const waitFor = async (...checkboxes: Checkbox[]) => {
      await Promise.all(checkboxes.map(checkbox => checkbox.ready));
      await Promise.all(checkboxes.map(checkbox => checkbox.rendered));
    };

    const label = document.createElement('label');
    label.htmlFor = 'terms-checkbox';
    label.textContent = 'External terms label';
    const form = document.createElement('form');
    form.id = 'checkbox-contract-form';
    form.innerHTML = `
      <snice-checkbox
        id="terms-checkbox"
        name="terms"
        value="accepted"
        label="Accept terms"
        required
      ></snice-checkbox>
    `;
    document.body.append(label, form);
    const terms = form.querySelector('snice-checkbox') as Checkbox;
    await waitFor(terms);

    let invalidEvents = 0;
    terms.addEventListener('invalid', event => {
      invalidEvents++;
      if (event.target !== terms) throw new Error('invalid event target was not the host');
    });

    const initial = {
      entries: entries(form),
      formIsOwner: terms.form === form,
      listed: Array.from(form.elements).includes(terms as any),
      type: terms.type,
      valid: terms.checkValidity(),
      formValid: form.checkValidity(),
      valueMissing: terms.validity.valueMissing,
      validationMessage: terms.validationMessage,
      willValidate: terms.willValidate,
      labels: terms.labels?.length ?? -1,
      invalidEvents
    };

    terms.checked = true;
    const checked = {
      entries: entries(form),
      valid: terms.checkValidity(),
      formValid: form.checkValidity(),
      valueMissing: terms.validity.valueMissing
    };

    terms.value = 'updated';
    const updatedValue = entries(form);
    terms.name = '';
    const emptyName = entries(form);
    terms.removeAttribute('name');
    const removedName = entries(form);
    terms.name = 'terms';
    terms.value = '';
    const emptyValue = entries(form);
    terms.value = 'accepted';

    const matrix = document.createElement('div');
    matrix.innerHTML = `
      <snice-checkbox name="choices" value="a" checked></snice-checkbox>
      <snice-checkbox name="choices" value="b" checked></snice-checkbox>
      <snice-checkbox name="default-value" checked></snice-checkbox>
      <snice-checkbox value="ignored" checked></snice-checkbox>
      <snice-checkbox name="disabled-choice" value="ignored" checked disabled></snice-checkbox>
    `;
    form.appendChild(matrix);
    const matrixCheckboxes = Array.from(matrix.querySelectorAll('snice-checkbox')) as Checkbox[];
    await waitFor(...matrixCheckboxes);
    const successfulControlMatrix = entries(form);

    terms.setCustomValidity('Accept the policy first.');
    const customValidity = {
      valid: terms.checkValidity(),
      formValid: form.checkValidity(),
      customError: terms.validity.customError,
      valueMissing: terms.validity.valueMissing,
      message: terms.validationMessage,
      report: terms.reportValidity()
    };
    terms.setCustomValidity('');
    const clearedCustomValidity = {
      valid: terms.checkValidity(),
      customError: terms.validity.customError,
      message: terms.validationMessage
    };

    terms.checked = false;
    terms.disabled = true;
    await terms.rendered;
    const authoredDisabled = {
      property: terms.disabled,
      attribute: terms.hasAttribute('disabled'),
      matches: terms.matches(':disabled'),
      inputDisabled: (terms.shadowRoot!.querySelector('input') as HTMLInputElement).disabled,
      entries: entries(form),
      willValidate: terms.willValidate,
      formValid: form.checkValidity()
    };
    terms.disabled = false;
    terms.checked = true;
    await terms.rendered;

    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    fieldset.innerHTML = `
      <legend>
        Options
        <snice-checkbox name="legend-choice" value="included" checked></snice-checkbox>
      </legend>
      <snice-checkbox name="fieldset-choice" value="excluded" required></snice-checkbox>
    `;
    form.appendChild(fieldset);
    const legendChoice = fieldset.querySelector('[name="legend-choice"]') as Checkbox;
    const fieldsetChoice = fieldset.querySelector('[name="fieldset-choice"]') as Checkbox;
    await waitFor(legendChoice, fieldsetChoice);
    await Promise.resolve();
    await legendChoice.rendered;
    await fieldsetChoice.rendered;
    const fieldsetDisabled = {
      entries: entries(form),
      legend: {
        disabledProperty: legendChoice.disabled,
        matches: legendChoice.matches(':disabled'),
        inputDisabled: (legendChoice.shadowRoot!.querySelector('input') as HTMLInputElement).disabled,
        willValidate: legendChoice.willValidate
      },
      descendant: {
        disabledProperty: fieldsetChoice.disabled,
        disabledAttribute: fieldsetChoice.hasAttribute('disabled'),
        matches: fieldsetChoice.matches(':disabled'),
        inputDisabled: (fieldsetChoice.shadowRoot!.querySelector('input') as HTMLInputElement).disabled,
        willValidate: fieldsetChoice.willValidate,
        formValid: form.checkValidity()
      }
    };

    fieldset.disabled = false;
    await Promise.resolve();
    await fieldsetChoice.rendered;
    const fieldsetEnabled = {
      disabledProperty: fieldsetChoice.disabled,
      matches: fieldsetChoice.matches(':disabled'),
      inputDisabled: (fieldsetChoice.shadowRoot!.querySelector('input') as HTMLInputElement).disabled,
      entries: entries(form),
      formValid: form.checkValidity()
    };
    fieldsetChoice.checked = true;
    const fieldsetChecked = entries(form);

    const externalForm = document.createElement('form');
    externalForm.id = 'external-checkbox-form';
    const external = document.createElement('snice-checkbox') as Checkbox;
    external.setAttribute('form', externalForm.id);
    external.name = 'external-choice';
    external.value = 'outside';
    external.checked = true;
    document.body.append(externalForm, external);
    await waitFor(external);
    const externalAssociation = {
      owner: external.form === externalForm,
      listed: Array.from(externalForm.elements).includes(external as any),
      entries: entries(externalForm)
    };

    const firstForm = document.createElement('form');
    const secondForm = document.createElement('form');
    const moving = document.createElement('snice-checkbox') as Checkbox;
    moving.name = 'moving-choice';
    moving.value = 'before';
    moving.checked = true;
    firstForm.appendChild(moving);
    document.body.append(firstForm, secondForm);
    await waitFor(moving);
    const beforeMove = {
      owner: moving.form === firstForm,
      first: entries(firstForm),
      second: entries(secondForm)
    };
    moving.remove();
    moving.value = 'after';
    moving.indeterminate = true;
    secondForm.appendChild(moving);
    await moving.rendered;
    const afterMove = {
      owner: moving.form === secondForm,
      first: entries(firstForm),
      second: entries(secondForm),
      checked: moving.checked,
      indeterminate: moving.indeterminate,
      inputChecked: (moving.shadowRoot!.querySelector('input') as HTMLInputElement).checked,
      inputIndeterminate: (moving.shadowRoot!.querySelector('input') as HTMLInputElement).indeterminate
    };

    return {
      initial,
      checked,
      updatedValue,
      emptyName,
      removedName,
      emptyValue,
      successfulControlMatrix,
      customValidity,
      clearedCustomValidity,
      authoredDisabled,
      fieldsetDisabled,
      fieldsetEnabled,
      fieldsetChecked,
      externalAssociation,
      beforeMove,
      afterMove
    };
  });
}

function assertFormContract(result: Awaited<ReturnType<typeof exerciseFormContract>>) {
  expect(result.initial.entries).toEqual([]);
  expect(result.initial.formIsOwner).toBe(true);
  expect(result.initial.listed).toBe(true);
  expect(result.initial.type).toBe('checkbox');
  expect(result.initial.valid).toBe(false);
  expect(result.initial.formValid).toBe(false);
  expect(result.initial.valueMissing).toBe(true);
  expect(result.initial.validationMessage).not.toBe('');
  expect(result.initial.willValidate).toBe(true);
  expect(result.initial.labels).toBe(1);
  expect(result.initial.invalidEvents).toBe(2);

  expect(result.checked).toEqual({
    entries: [['terms', 'accepted']],
    valid: true,
    formValid: true,
    valueMissing: false
  });
  expect(result.updatedValue).toEqual([['terms', 'updated']]);
  expect(result.emptyName).toEqual([]);
  expect(result.removedName).toEqual([]);
  expect(result.emptyValue).toEqual([['terms', '']]);
  expect(result.successfulControlMatrix).toEqual([
    ['terms', 'accepted'],
    ['choices', 'a'],
    ['choices', 'b'],
    ['default-value', 'on']
  ]);

  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    valueMissing: false,
    message: 'Accept the policy first.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });

  expect(result.authoredDisabled).toEqual({
    property: true,
    attribute: true,
    matches: true,
    inputDisabled: true,
    entries: [
      ['choices', 'a'],
      ['choices', 'b'],
      ['default-value', 'on']
    ],
    willValidate: false,
    formValid: true
  });

  expect(result.fieldsetDisabled.entries).toEqual([
    ['terms', 'accepted'],
    ['choices', 'a'],
    ['choices', 'b'],
    ['default-value', 'on'],
    ['legend-choice', 'included']
  ]);
  expect(result.fieldsetDisabled.legend).toEqual({
    disabledProperty: false,
    matches: false,
    inputDisabled: false,
    willValidate: true
  });
  expect(result.fieldsetDisabled.descendant).toEqual({
    disabledProperty: false,
    disabledAttribute: false,
    matches: true,
    inputDisabled: true,
    willValidate: false,
    formValid: true
  });
  expect(result.fieldsetEnabled.disabledProperty).toBe(false);
  expect(result.fieldsetEnabled.matches).toBe(false);
  expect(result.fieldsetEnabled.inputDisabled).toBe(false);
  expect(result.fieldsetEnabled.entries).not.toContainEqual(['fieldset-choice', 'excluded']);
  expect(result.fieldsetEnabled.formValid).toBe(false);
  expect(result.fieldsetChecked).toContainEqual(['fieldset-choice', 'excluded']);

  expect(result.externalAssociation).toEqual({
    owner: true,
    listed: true,
    entries: [['external-choice', 'outside']]
  });
  expect(result.beforeMove).toEqual({
    owner: true,
    first: [['moving-choice', 'before']],
    second: []
  });
  expect(result.afterMove).toEqual({
    owner: true,
    first: [],
    second: [['moving-choice', 'after']],
    checked: true,
    indeterminate: true,
    inputChecked: true,
    inputIndeterminate: true
  });
}

async function setupEventFixture(page: Page) {
  await page.evaluate(async () => {
    type Checkbox = HTMLElement & {
      checked: boolean;
      defaultChecked: boolean;
      indeterminate: boolean;
      disabled: boolean;
      loading: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
      click(): void;
      toggle(): void;
      setIndeterminate(): void;
      formStateRestoreCallback(state: string, mode: 'restore' | 'autocomplete'): void;
    };

    const form = document.createElement('form');
    form.id = 'checkbox-event-form';
    form.innerHTML = `
      <snice-checkbox id="event-checkbox" name="choice" value="yes" label="Event checkbox"></snice-checkbox>
      <button type="reset">Reset</button>
    `;
    const externalLabel = document.createElement('label');
    externalLabel.id = 'external-event-label';
    externalLabel.htmlFor = 'event-checkbox';
    externalLabel.textContent = 'External event checkbox label';
    const fixture = document.createElement('div');
    fixture.id = 'checkbox-event-fixture';
    fixture.style.cssText = [
      'position:fixed',
      'inset:0.5rem auto auto 0.5rem',
      'z-index:2147483647',
      'display:grid',
      'gap:0.5rem',
      'padding:0.75rem',
      'background:white',
      'color:black'
    ].join(';');
    fixture.append(externalLabel, form);
    document.body.appendChild(fixture);
    const checkbox = form.querySelector('snice-checkbox') as Checkbox;
    await checkbox.ready;
    await checkbox.rendered;

    (globalThis as any).__checkboxEvents = [];
    (globalThis as any).__checkboxHostClicks = 0;
    checkbox.addEventListener('click', () => (globalThis as any).__checkboxHostClicks++);
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, event => {
        const custom = event instanceof CustomEvent;
        (globalThis as any).__checkboxEvents.push({
          type,
          checked: checkbox.checked,
          indeterminate: checkbox.indeterminate,
          targetIsHost: event.target === checkbox,
          bubbles: event.bubbles,
          composed: event.composed,
          custom,
          detail: custom && type === 'checkbox-change'
            ? {
                checked: event.detail.checked,
                indeterminate: event.detail.indeterminate,
                checkboxIsHost: event.detail.checkbox === checkbox
              }
            : null
        });
      });
    }
  });
}

async function readAndClearEvents(page: Page) {
  return page.evaluate(() => {
    const events = [...(globalThis as any).__checkboxEvents];
    (globalThis as any).__checkboxEvents.length = 0;
    return events;
  });
}

function assertActivationEvents(
  events: Awaited<ReturnType<typeof readAndClearEvents>>,
  checked: boolean,
  indeterminate = false
) {
  expect(events.map(event => event.type)).toEqual(['input', 'change', 'checkbox-change']);
  expect(events.every(event => event.checked === checked)).toBe(true);
  expect(events.every(event => event.indeterminate === indeterminate)).toBe(true);
  expect(events.every(event => event.targetIsHost)).toBe(true);
  expect(events.every(event => event.bubbles)).toBe(true);
  expect(events.every(event => event.composed)).toBe(true);
  expect(events.map(event => event.custom)).toEqual([false, false, true]);
  expect(events[2].detail).toEqual({ checked, indeterminate, checkboxIsHost: true });
}

async function exerciseStateAndEvents(page: Page) {
  await setupEventFixture(page);
  const checkbox = page.locator('#event-checkbox');
  const nativeInput = checkbox.getByRole('checkbox');

  await nativeInput.click();
  assertActivationEvents(await readAndClearEvents(page), true);

  await page.evaluate(() => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    checkbox.indeterminate = true;
  });
  await nativeInput.click();
  assertActivationEvents(await readAndClearEvents(page), false);

  await page.evaluate(() => (document.querySelector('#event-checkbox') as any).toggle());
  assertActivationEvents(await readAndClearEvents(page), true);

  await page.evaluate(() => (document.querySelector('#event-checkbox') as any).click());
  assertActivationEvents(await readAndClearEvents(page), false);

  await page.evaluate(() => (document.querySelector('#event-checkbox') as any).focus());
  await page.keyboard.press('Space');
  assertActivationEvents(await readAndClearEvents(page), true);

  await checkbox.locator('.checkbox-label').evaluate((label: HTMLElement) => label.click());
  assertActivationEvents(await readAndClearEvents(page), false);

  await page.evaluate(() => (globalThis as any).__checkboxHostClicks = 0);
  await page.locator('#external-event-label').click();
  assertActivationEvents(await readAndClearEvents(page), true);
  expect(await page.evaluate(() => (globalThis as any).__checkboxHostClicks)).toBe(1);
  expect(await page.evaluate(() => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    return document.activeElement === checkbox
      && checkbox.shadowRoot.activeElement === checkbox.shadowRoot.querySelector('input');
  })).toBe(true);

  const canceledExternalLabel = await page.evaluate(async () => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    checkbox.addEventListener('click', (event: Event) => event.preventDefault(), { once: true });
    (document.querySelector('#external-event-label') as HTMLLabelElement).click();
    await Promise.resolve();
    const events = [...(globalThis as any).__checkboxEvents];
    (globalThis as any).__checkboxEvents.length = 0;
    return { checked: checkbox.checked, events };
  });
  expect(canceledExternalLabel).toEqual({ checked: true, events: [] });

  const silent = await page.evaluate(() => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    const form = document.querySelector('#checkbox-event-form') as HTMLFormElement;
    checkbox.checked = false;
    checkbox.defaultChecked = true;
    checkbox.indeterminate = true;
    checkbox.value = 'updated';
    checkbox.setIndeterminate();
    form.reset();
    checkbox.formStateRestoreCallback('unchecked', 'restore');
    const events = [...(globalThis as any).__checkboxEvents];
    (globalThis as any).__checkboxEvents.length = 0;
    return {
      events,
      checked: checkbox.checked,
      defaultChecked: checkbox.defaultChecked,
      indeterminate: checkbox.indeterminate
    };
  });
  expect(silent).toEqual({ events: [], checked: false, defaultChecked: true, indeterminate: true });

  const defaultModel = await page.evaluate(async () => {
    const clean = document.createElement('snice-checkbox') as any;
    clean.setAttribute('checked', '');
    document.body.appendChild(clean);
    await clean.ready;
    const authored = { checked: clean.checked, defaultChecked: clean.defaultChecked };
    clean.checked = false;
    clean.removeAttribute('checked');
    clean.setAttribute('checked', '');
    const dirty = { checked: clean.checked, defaultChecked: clean.defaultChecked };
    clean.indeterminate = true;
    clean.formResetCallback();
    const reset = {
      checked: clean.checked,
      defaultChecked: clean.defaultChecked,
      indeterminate: clean.indeterminate
    };

    const same = document.createElement('snice-checkbox') as any;
    document.body.appendChild(same);
    await same.ready;
    same.checked = false;
    same.defaultChecked = true;

    const preconnected = document.createElement('snice-checkbox') as any;
    preconnected.checked = true;
    document.body.appendChild(preconnected);
    await preconnected.ready;
    preconnected.defaultChecked = true;
    preconnected.defaultChecked = false;

    return {
      authored,
      dirty,
      reset,
      sameAssignment: { checked: same.checked, defaultChecked: same.defaultChecked },
      preconnected: { checked: preconnected.checked, defaultChecked: preconnected.defaultChecked }
    };
  });
  expect(defaultModel).toEqual({
    authored: { checked: true, defaultChecked: true },
    dirty: { checked: false, defaultChecked: true },
    reset: { checked: true, defaultChecked: true, indeterminate: true },
    sameAssignment: { checked: false, defaultChecked: true },
    preconnected: { checked: true, defaultChecked: false }
  });

  const canceled = await page.evaluate(() => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    checkbox.checked = false;
    checkbox.indeterminate = true;
    checkbox.addEventListener('click', (event: Event) => event.preventDefault(), { once: true });
    checkbox.click();
    const events = [...(globalThis as any).__checkboxEvents];
    (globalThis as any).__checkboxEvents.length = 0;
    return { checked: checkbox.checked, indeterminate: checkbox.indeterminate, events };
  });
  expect(canceled).toEqual({ checked: false, indeterminate: true, events: [] });

  const blocked = await page.evaluate(async () => {
    const checkbox = document.querySelector('#event-checkbox') as any;
    const fieldset = document.createElement('fieldset');
    checkbox.parentElement!.insertBefore(fieldset, checkbox);
    fieldset.appendChild(checkbox);

    const snapshots = [];
    checkbox.disabled = true;
    checkbox.click();
    snapshots.push({ mode: 'disabled', checked: checkbox.checked });
    checkbox.disabled = false;
    checkbox.loading = true;
    checkbox.click();
    snapshots.push({ mode: 'loading', checked: checkbox.checked });
    checkbox.loading = false;
    fieldset.disabled = true;
    await Promise.resolve();
    checkbox.click();
    await checkbox.rendered;
    snapshots.push({
      mode: 'fieldset',
      checked: checkbox.checked,
      disabledProperty: checkbox.disabled,
      disabledAttribute: checkbox.hasAttribute('disabled'),
      inputDisabled: checkbox.shadowRoot.querySelector('input').disabled
    });
    checkbox.shadowRoot.querySelector('input').dispatchEvent(new Event('change', { bubbles: true }));
    const events = [...(globalThis as any).__checkboxEvents];
    (globalThis as any).__checkboxEvents.length = 0;
    return { snapshots, events };
  });
  expect(blocked).toEqual({
    snapshots: [
      { mode: 'disabled', checked: false },
      { mode: 'loading', checked: false },
      {
        mode: 'fieldset',
        checked: false,
        disabledProperty: false,
        disabledAttribute: false,
        inputDisabled: true
      }
    ],
    events: []
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native checkbox form behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadCheckbox(page, build);
    assertFormContract(await exerciseFormContract(page));
    expect(pageErrors).toEqual([]);
  });

  test(`matches native checkbox state and event behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadCheckbox(page, build);
    await exerciseStateAndEvents(page);
    expect(pageErrors).toEqual([]);
  });
}
