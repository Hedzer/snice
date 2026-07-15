import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadRadio(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const radio = document.createElement('snice-radio') as HTMLElement & { checked: boolean };
    radio.id = 'pre-upgrade-radio';
    radio.checked = true;
    document.body.appendChild(radio);
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/radio/snice-radio.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/radio/snice-radio.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-radio.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-radio')));
  const preUpgrade = await page.evaluate(async () => {
    const radio = document.querySelector('#pre-upgrade-radio') as HTMLElement & {
      checked: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    await radio.ready;
    await radio.rendered;
    return {
      checked: radio.checked,
      ownsChecked: Object.prototype.hasOwnProperty.call(radio, 'checked'),
      inputChecked: (radio.shadowRoot!.querySelector('input') as HTMLInputElement).checked,
      checkedAttribute: radio.hasAttribute('checked')
    };
  });
  expect(preUpgrade).toEqual({
    checked: true,
    ownsChecked: false,
    inputChecked: true,
    checkedAttribute: false
  });
}

async function exerciseFormAndGroupContract(page: Page) {
  return page.evaluate(async () => {
    type Radio = HTMLElement & {
      checked: boolean;
      defaultChecked: boolean;
      disabled: boolean;
      loading: boolean;
      required: boolean;
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
    const waitFor = async (...radios: Radio[]) => {
      await Promise.all(radios.map(radio => radio.ready));
      await Promise.all(radios.map(radio => radio.rendered));
    };
    const nativeInput = (radio: Radio) => radio.shadowRoot!.querySelector('input') as HTMLInputElement;

    const externalLabel = document.createElement('label');
    externalLabel.htmlFor = 'plan-basic';
    externalLabel.textContent = 'External basic plan label';
    const form = document.createElement('form');
    form.id = 'radio-contract-form';
    form.innerHTML = `
      <snice-radio id="plan-basic" name="plan" value="basic" label="Basic" required></snice-radio>
      <snice-radio id="plan-pro" name="plan" value="pro" label="Pro"></snice-radio>
      <snice-radio id="plan-disabled" name="plan" value="disabled" label="Disabled" disabled></snice-radio>
    `;
    document.body.append(externalLabel, form);
    const [basic, pro, disabled] = Array.from(form.querySelectorAll('snice-radio')) as Radio[];
    await waitFor(basic, pro, disabled);

    const initial = {
      entries: entries(form),
      owners: [basic.form === form, pro.form === form, disabled.form === form],
      listed: [basic, pro, disabled].every(radio => Array.from(form.elements).includes(radio as any)),
      type: basic.type,
      checked: [basic.checked, pro.checked, disabled.checked],
      valueMissing: [basic, pro, disabled].map(radio => radio.validity.valueMissing),
      valid: [basic.checkValidity(), pro.checkValidity(), disabled.checkValidity()],
      willValidate: [basic.willValidate, pro.willValidate, disabled.willValidate],
      formValid: form.checkValidity(),
      message: basic.validationMessage,
      labels: basic.labels?.length ?? -1,
      tabs: [basic, pro, disabled].map(radio => nativeInput(radio).tabIndex)
    };

    pro.checked = true;
    const selected = {
      entries: entries(form),
      checked: [basic.checked, pro.checked, disabled.checked],
      valueMissing: [basic, pro, disabled].map(radio => radio.validity.valueMissing),
      formValid: form.checkValidity(),
      tabs: [basic, pro, disabled].map(radio => nativeInput(radio).tabIndex)
    };

    pro.value = 'professional';
    const updatedValue = entries(form);
    pro.name = '';
    const emptyName = {
      entries: entries(form),
      originalGroupMissing: basic.validity.valueMissing,
      selectedStillChecked: pro.checked,
      selectedValid: pro.validity.valid
    };
    pro.removeAttribute('name');
    const removedName = entries(form);
    pro.name = 'plan';
    pro.value = '';
    const emptyValue = entries(form);
    pro.value = 'pro';

    const matrix = document.createElement('div');
    matrix.innerHTML = `
      <snice-radio name="delivery" value="standard" checked></snice-radio>
      <snice-radio name="delivery" value="express"></snice-radio>
      <snice-radio name="default-value" checked></snice-radio>
      <snice-radio value="unnamed" checked></snice-radio>
      <snice-radio name="disabled-value" value="omitted" checked disabled></snice-radio>
    `;
    form.appendChild(matrix);
    const matrixRadios = Array.from(matrix.querySelectorAll('snice-radio')) as Radio[];
    await waitFor(...matrixRadios);
    const successfulControlMatrix = entries(form);

    pro.setCustomValidity('Choose a supported plan.');
    const customValidity = {
      valid: pro.checkValidity(),
      formValid: form.checkValidity(),
      customError: pro.validity.customError,
      valueMissing: pro.validity.valueMissing,
      message: pro.validationMessage,
      report: pro.reportValidity()
    };
    pro.setCustomValidity('');
    const clearedCustomValidity = {
      valid: pro.checkValidity(),
      customError: pro.validity.customError,
      message: pro.validationMessage
    };

    pro.disabled = true;
    await pro.rendered;
    const authoredDisabled = {
      property: pro.disabled,
      attribute: pro.hasAttribute('disabled'),
      matches: pro.matches(':disabled'),
      inputDisabled: nativeInput(pro).disabled,
      entries: entries(form),
      willValidate: pro.willValidate,
      groupValid: basic.validity.valid,
      formValid: form.checkValidity()
    };
    pro.disabled = false;
    await pro.rendered;

    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    fieldset.innerHTML = `
      <legend>
        Options
        <snice-radio name="legend-radio" value="included" checked></snice-radio>
      </legend>
      <snice-radio name="fieldset-radio" value="selected" required></snice-radio>
    `;
    form.appendChild(fieldset);
    const legendRadio = fieldset.querySelector('[name="legend-radio"]') as Radio;
    const fieldsetRadio = fieldset.querySelector('[name="fieldset-radio"]') as Radio;
    await waitFor(legendRadio, fieldsetRadio);
    await Promise.resolve();
    await Promise.all([legendRadio.rendered, fieldsetRadio.rendered]);
    const fieldsetDisabled = {
      entries: entries(form),
      legend: {
        disabledProperty: legendRadio.disabled,
        matches: legendRadio.matches(':disabled'),
        inputDisabled: nativeInput(legendRadio).disabled,
        willValidate: legendRadio.willValidate
      },
      descendant: {
        disabledProperty: fieldsetRadio.disabled,
        disabledAttribute: fieldsetRadio.hasAttribute('disabled'),
        matches: fieldsetRadio.matches(':disabled'),
        inputDisabled: nativeInput(fieldsetRadio).disabled,
        valueMissing: fieldsetRadio.validity.valueMissing,
        willValidate: fieldsetRadio.willValidate,
        formValid: form.checkValidity()
      }
    };

    fieldset.disabled = false;
    await Promise.resolve();
    await fieldsetRadio.rendered;
    const fieldsetEnabled = {
      disabledProperty: fieldsetRadio.disabled,
      matches: fieldsetRadio.matches(':disabled'),
      inputDisabled: nativeInput(fieldsetRadio).disabled,
      entries: entries(form),
      valueMissing: fieldsetRadio.validity.valueMissing,
      formValid: form.checkValidity()
    };
    fieldsetRadio.checked = true;
    const fieldsetChecked = entries(form);

    const disabledRequirement = document.createElement('fieldset');
    disabledRequirement.disabled = true;
    disabledRequirement.innerHTML = '<snice-radio name="shared-required" required></snice-radio>';
    const enabledPeer = document.createElement('snice-radio') as Radio;
    enabledPeer.name = 'shared-required';
    form.append(disabledRequirement, enabledPeer);
    const disabledRequired = disabledRequirement.querySelector('snice-radio') as Radio;
    await waitFor(disabledRequired, enabledPeer);
    await Promise.resolve();
    const disabledRequiredGroup = {
      disabledMissing: disabledRequired.validity.valueMissing,
      disabledWillValidate: disabledRequired.willValidate,
      enabledMissing: enabledPeer.validity.valueMissing,
      enabledValid: enabledPeer.checkValidity(),
      formValid: form.checkValidity()
    };
    enabledPeer.checked = true;
    const disabledRequiredSatisfied = {
      disabledMissing: disabledRequired.validity.valueMissing,
      enabledMissing: enabledPeer.validity.valueMissing,
      formValid: form.checkValidity()
    };

    const externalForm = document.createElement('form');
    externalForm.id = 'external-radio-form';
    externalForm.innerHTML = '<snice-radio name="external-plan" value="inside" checked required></snice-radio>';
    const external = document.createElement('snice-radio') as Radio;
    external.setAttribute('form', externalForm.id);
    external.name = 'external-plan';
    external.value = 'outside';
    document.body.append(externalForm, external);
    const insideExternalForm = externalForm.querySelector('snice-radio') as Radio;
    await waitFor(insideExternalForm, external);
    external.checked = true;
    const externalAssociation = {
      owner: external.form === externalForm,
      listed: Array.from(externalForm.elements).includes(external as any),
      checked: [insideExternalForm.checked, external.checked],
      entries: entries(externalForm),
      valid: externalForm.checkValidity()
    };

    const independentA = document.createElement('form');
    const independentB = document.createElement('form');
    independentA.innerHTML = '<snice-radio name="same" value="a" checked></snice-radio>';
    independentB.innerHTML = '<snice-radio name="same" value="b" checked></snice-radio>';
    document.body.append(independentA, independentB);
    const independentRadioA = independentA.querySelector('snice-radio') as Radio;
    const independentRadioB = independentB.querySelector('snice-radio') as Radio;
    await waitFor(independentRadioA, independentRadioB);
    const independentForms = {
      checked: [independentRadioA.checked, independentRadioB.checked],
      first: entries(independentA),
      second: entries(independentB)
    };

    const ownerA = document.createElement('form');
    const ownerB = document.createElement('form');
    ownerA.id = 'radio-owner-a';
    ownerB.id = 'radio-owner-b';
    ownerA.innerHTML = '<snice-radio name="moving" value="anchor" required checked></snice-radio>';
    ownerB.innerHTML = '<snice-radio name="moving" value="peer" checked></snice-radio>';
    const moving = document.createElement('snice-radio') as Radio;
    moving.setAttribute('form', ownerA.id);
    moving.name = 'moving';
    moving.value = 'moving';
    document.body.append(ownerA, ownerB, moving);
    const ownerARadio = ownerA.querySelector('snice-radio') as Radio;
    const ownerBRadio = ownerB.querySelector('snice-radio') as Radio;
    await waitFor(ownerARadio, ownerBRadio, moving);
    moving.checked = true;
    const beforeOwnerChange = {
      owner: moving.form === ownerA,
      checked: [ownerARadio.checked, moving.checked, ownerBRadio.checked],
      first: entries(ownerA),
      second: entries(ownerB)
    };
    moving.setAttribute('form', ownerB.id);
    await Promise.resolve();
    const afterOwnerChange = {
      owner: moving.form === ownerB,
      checked: [ownerARadio.checked, moving.checked, ownerBRadio.checked],
      first: entries(ownerA),
      second: entries(ownerB),
      firstMissing: ownerARadio.validity.valueMissing,
      firstValid: ownerA.checkValidity(),
      secondValid: ownerB.checkValidity()
    };

    const shadowHostA = document.createElement('div');
    const shadowHostB = document.createElement('div');
    document.body.append(shadowHostA, shadowHostB);
    const shadowA = shadowHostA.attachShadow({ mode: 'open' });
    const shadowB = shadowHostB.attachShadow({ mode: 'open' });
    shadowA.innerHTML = `
      <form>
        <snice-radio name="shadow-plan" value="one" checked required></snice-radio>
        <snice-radio name="shadow-plan" value="two"></snice-radio>
      </form>
    `;
    shadowB.innerHTML = '<snice-radio name="shadow-plan" value="other" checked></snice-radio>';
    const shadowForm = shadowA.querySelector('form')!;
    const [shadowOne, shadowTwo] = Array.from(shadowA.querySelectorAll('snice-radio')) as Radio[];
    const shadowOther = shadowB.querySelector('snice-radio') as Radio;
    await waitFor(shadowOne, shadowTwo, shadowOther);
    shadowTwo.checked = true;
    const shadowGroups = {
      sameRoot: [shadowOne.checked, shadowTwo.checked],
      otherRoot: shadowOther.checked,
      entries: entries(shadowForm),
      owners: [shadowOne.form === shadowForm, shadowTwo.form === shadowForm]
    };

    const insertionForm = document.createElement('form');
    insertionForm.innerHTML = '<snice-radio name="inserted" value="first" required checked></snice-radio>';
    document.body.appendChild(insertionForm);
    const insertionFirst = insertionForm.querySelector('snice-radio') as Radio;
    await waitFor(insertionFirst);
    const insertionSecond = document.createElement('snice-radio') as Radio;
    insertionSecond.name = 'inserted';
    insertionSecond.value = 'second';
    insertionSecond.defaultChecked = true;
    insertionForm.appendChild(insertionSecond);
    await waitFor(insertionSecond);
    const afterInsertion = {
      checked: [insertionFirst.checked, insertionSecond.checked],
      entries: entries(insertionForm)
    };
    insertionSecond.remove();
    await Promise.resolve();
    const afterRemoval = {
      firstChecked: insertionFirst.checked,
      firstMissing: insertionFirst.validity.valueMissing,
      entries: entries(insertionForm),
      valid: insertionForm.checkValidity()
    };
    insertionForm.appendChild(insertionSecond);
    await Promise.resolve();
    await insertionSecond.rendered;
    const afterReconnection = {
      checked: [insertionFirst.checked, insertionSecond.checked],
      entries: entries(insertionForm),
      valid: insertionForm.checkValidity()
    };

    const resetForm = document.createElement('form');
    resetForm.innerHTML = `
      <snice-radio name="reset-plan" value="first" checked></snice-radio>
      <snice-radio name="reset-plan" value="second"></snice-radio>
    `;
    document.body.appendChild(resetForm);
    const [resetFirst, resetSecond] = Array.from(resetForm.querySelectorAll('snice-radio')) as Radio[];
    await waitFor(resetFirst, resetSecond);
    const resetEvents: string[] = [];
    for (const radio of [resetFirst, resetSecond]) {
      for (const type of ['input', 'change', 'radio-change']) {
        radio.addEventListener(type, () => resetEvents.push(type));
      }
    }
    resetSecond.checked = true;
    const beforeReset = {
      checked: [resetFirst.checked, resetSecond.checked],
      entries: entries(resetForm)
    };
    resetForm.reset();
    await Promise.resolve();
    const afterReset = {
      checked: [resetFirst.checked, resetSecond.checked],
      defaults: [resetFirst.defaultChecked, resetSecond.defaultChecked],
      entries: entries(resetForm),
      events: resetEvents
    };

    const multiDefaultForm = document.createElement('form');
    multiDefaultForm.innerHTML = `
      <snice-radio name="multi-default" value="first" checked></snice-radio>
      <snice-radio name="multi-default" value="second" checked></snice-radio>
    `;
    document.body.appendChild(multiDefaultForm);
    const [multiFirst, multiSecond] = Array.from(multiDefaultForm.querySelectorAll('snice-radio')) as Radio[];
    await waitFor(multiFirst, multiSecond);
    multiFirst.checked = true;
    multiDefaultForm.reset();
    await Promise.resolve();
    const multipleDefaults = {
      checked: [multiFirst.checked, multiSecond.checked],
      defaults: [multiFirst.defaultChecked, multiSecond.defaultChecked],
      entries: entries(multiDefaultForm)
    };

    return {
      initial,
      selected,
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
      disabledRequiredGroup,
      disabledRequiredSatisfied,
      externalAssociation,
      independentForms,
      beforeOwnerChange,
      afterOwnerChange,
      shadowGroups,
      afterInsertion,
      afterRemoval,
      afterReconnection,
      beforeReset,
      afterReset,
      multipleDefaults
    };
  });
}

function assertFormAndGroupContract(result: Awaited<ReturnType<typeof exerciseFormAndGroupContract>>) {
  expect(result.initial.entries).toEqual([]);
  expect(result.initial.owners).toEqual([true, true, true]);
  expect(result.initial.listed).toBe(true);
  expect(result.initial.type).toBe('radio');
  expect(result.initial.checked).toEqual([false, false, false]);
  expect(result.initial.valueMissing).toEqual([true, true, true]);
  expect(result.initial.valid).toEqual([false, false, true]);
  expect(result.initial.willValidate).toEqual([true, true, false]);
  expect(result.initial.formValid).toBe(false);
  expect(result.initial.message).not.toBe('');
  expect(result.initial.labels).toBe(1);
  expect(result.initial.tabs).toEqual([0, -1, -1]);

  expect(result.selected).toEqual({
    entries: [['plan', 'pro']],
    checked: [false, true, false],
    valueMissing: [false, false, false],
    formValid: true,
    tabs: [-1, 0, -1]
  });
  expect(result.updatedValue).toEqual([['plan', 'professional']]);
  expect(result.emptyName).toEqual({
    entries: [],
    originalGroupMissing: true,
    selectedStillChecked: true,
    selectedValid: true
  });
  expect(result.removedName).toEqual([]);
  expect(result.emptyValue).toEqual([['plan', '']]);
  expect(result.successfulControlMatrix).toEqual([
    ['plan', 'pro'],
    ['delivery', 'standard'],
    ['default-value', 'on']
  ]);

  expect(result.customValidity).toEqual({
    valid: false,
    formValid: false,
    customError: true,
    valueMissing: false,
    message: 'Choose a supported plan.',
    report: false
  });
  expect(result.clearedCustomValidity).toEqual({ valid: true, customError: false, message: '' });
  expect(result.authoredDisabled).toEqual({
    property: true,
    attribute: true,
    matches: true,
    inputDisabled: true,
    entries: [
      ['delivery', 'standard'],
      ['default-value', 'on']
    ],
    willValidate: false,
    groupValid: true,
    formValid: true
  });

  expect(result.fieldsetDisabled.entries).toContainEqual(['legend-radio', 'included']);
  expect(result.fieldsetDisabled.entries).not.toContainEqual(['fieldset-radio', 'selected']);
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
    valueMissing: true,
    willValidate: false,
    formValid: true
  });
  expect(result.fieldsetEnabled.disabledProperty).toBe(false);
  expect(result.fieldsetEnabled.matches).toBe(false);
  expect(result.fieldsetEnabled.inputDisabled).toBe(false);
  expect(result.fieldsetEnabled.entries).not.toContainEqual(['fieldset-radio', 'selected']);
  expect(result.fieldsetEnabled.valueMissing).toBe(true);
  expect(result.fieldsetEnabled.formValid).toBe(false);
  expect(result.fieldsetChecked).toContainEqual(['fieldset-radio', 'selected']);

  expect(result.disabledRequiredGroup).toEqual({
    disabledMissing: true,
    disabledWillValidate: false,
    enabledMissing: true,
    enabledValid: false,
    formValid: false
  });
  expect(result.disabledRequiredSatisfied).toEqual({
    disabledMissing: false,
    enabledMissing: false,
    formValid: true
  });
  expect(result.externalAssociation).toEqual({
    owner: true,
    listed: true,
    checked: [false, true],
    entries: [['external-plan', 'outside']],
    valid: true
  });
  expect(result.independentForms).toEqual({
    checked: [true, true],
    first: [['same', 'a']],
    second: [['same', 'b']]
  });
  expect(result.beforeOwnerChange).toEqual({
    owner: true,
    checked: [false, true, true],
    first: [['moving', 'moving']],
    second: [['moving', 'peer']]
  });
  expect(result.afterOwnerChange).toEqual({
    owner: true,
    checked: [false, true, false],
    first: [],
    second: [['moving', 'moving']],
    firstMissing: true,
    firstValid: false,
    secondValid: true
  });
  expect(result.shadowGroups).toEqual({
    sameRoot: [false, true],
    otherRoot: true,
    entries: [['shadow-plan', 'two']],
    owners: [true, true]
  });
  expect(result.afterInsertion).toEqual({
    checked: [false, true],
    entries: [['inserted', 'second']]
  });
  expect(result.afterRemoval).toEqual({
    firstChecked: false,
    firstMissing: true,
    entries: [],
    valid: false
  });
  expect(result.afterReconnection).toEqual({
    checked: [false, true],
    entries: [['inserted', 'second']],
    valid: true
  });
  expect(result.beforeReset).toEqual({
    checked: [false, true],
    entries: [['reset-plan', 'second']]
  });
  expect(result.afterReset).toEqual({
    checked: [true, false],
    defaults: [true, false],
    entries: [['reset-plan', 'first']],
    events: []
  });
  expect(result.multipleDefaults).toEqual({
    checked: [false, true],
    defaults: [true, true],
    entries: [['multi-default', 'second']]
  });
}

async function setupInteractionFixture(page: Page) {
  await page.evaluate(async () => {
    type Radio = HTMLElement & {
      checked: boolean;
      defaultChecked: boolean;
      disabled: boolean;
      loading: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
      click(): void;
      select(): void;
      formStateRestoreCallback(state: string, mode: 'restore' | 'autocomplete'): void;
    };

    const fixture = document.createElement('div');
    fixture.id = 'radio-interaction-fixture';
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
    fixture.innerHTML = `
      <label id="external-radio-label" for="event-a">External A label</label>
      <form id="radio-event-form">
        <snice-radio id="event-a" name="event-plan" value="a" label="A" checked></snice-radio>
        <snice-radio id="event-b" name="event-plan" value="b" label="B"></snice-radio>
        <snice-radio id="event-disabled" name="event-plan" value="disabled" label="Disabled" disabled></snice-radio>
        <snice-radio id="event-loading" name="event-plan" value="loading" label="Loading" loading></snice-radio>
        <snice-radio id="event-e" name="event-plan" value="e" label="E"></snice-radio>
        <button type="reset">Reset</button>
      </form>
    `;
    document.body.appendChild(fixture);
    const radios = Array.from(fixture.querySelectorAll('snice-radio')) as Radio[];
    await Promise.all(radios.map(radio => radio.ready));
    await Promise.all(radios.map(radio => radio.rendered));

    (globalThis as any).__radioEvents = [];
    for (const radio of radios) {
      for (const type of ['input', 'change', 'radio-change']) {
        radio.addEventListener(type, event => {
          const custom = event instanceof CustomEvent;
          (globalThis as any).__radioEvents.push({
            id: radio.id,
            type,
            checked: radio.checked,
            targetIsHost: event.target === radio,
            bubbles: event.bubbles,
            composed: event.composed,
            custom,
            detail: custom && type === 'radio-change'
              ? {
                  checked: event.detail.checked,
                  value: event.detail.value,
                  radioIsHost: event.detail.radio === radio
                }
              : null
          });
        });
      }
    }
  });
}

async function readAndClearEvents(page: Page) {
  return page.evaluate(() => {
    const events = [...(globalThis as any).__radioEvents];
    (globalThis as any).__radioEvents.length = 0;
    return events;
  });
}

function assertActivationEvents(
  events: Awaited<ReturnType<typeof readAndClearEvents>>,
  id: string,
  value: string
) {
  expect(events.map(event => `${event.id}:${event.type}`)).toEqual([
    `${id}:input`,
    `${id}:change`,
    `${id}:radio-change`
  ]);
  expect(events.every(event => event.checked)).toBe(true);
  expect(events.every(event => event.targetIsHost)).toBe(true);
  expect(events.every(event => event.bubbles)).toBe(true);
  expect(events.every(event => event.composed)).toBe(true);
  expect(events.map(event => event.custom)).toEqual([false, false, true]);
  expect(events[2].detail).toEqual({ checked: true, value, radioIsHost: true });
}

async function exerciseInteractionContract(page: Page) {
  await setupInteractionFixture(page);
  const a = page.locator('#event-a');
  const b = page.locator('#event-b');
  const e = page.locator('#event-e');
  const inputA = a.getByRole('radio');

  await b.locator('.radio-label').click();
  assertActivationEvents(await readAndClearEvents(page), 'event-b', 'b');
  expect(await page.evaluate(() => [
    (document.querySelector('#event-a') as any).checked,
    (document.querySelector('#event-b') as any).checked
  ])).toEqual([false, true]);

  await b.locator('.radio-label').click();
  expect(await readAndClearEvents(page)).toEqual([]);

  const silentProgrammatic = await page.evaluate(() => {
    const a = document.querySelector('#event-a') as any;
    const b = document.querySelector('#event-b') as any;
    a.checked = true;
    a.defaultChecked = true;
    b.defaultChecked = false;
    const events = [...(globalThis as any).__radioEvents];
    (globalThis as any).__radioEvents.length = 0;
    return { checked: [a.checked, b.checked], events };
  });
  expect(silentProgrammatic).toEqual({ checked: [true, false], events: [] });

  await page.evaluate(() => (document.querySelector('#event-b') as any).select());
  assertActivationEvents(await readAndClearEvents(page), 'event-b', 'b');

  await page.evaluate(() => (document.querySelector('#event-a') as any).click());
  assertActivationEvents(await readAndClearEvents(page), 'event-a', 'a');

  await page.evaluate(() => (document.querySelector('#event-b') as any).focus());
  await page.keyboard.press('Space');
  assertActivationEvents(await readAndClearEvents(page), 'event-b', 'b');

  await page.locator('#external-radio-label').click();
  assertActivationEvents(await readAndClearEvents(page), 'event-a', 'a');
  expect(await page.evaluate(() => {
    const radio = document.querySelector('#event-a') as any;
    return document.activeElement === radio
      && radio.shadowRoot.activeElement === radio.shadowRoot.querySelector('input');
  })).toBe(true);

  const canceledExternalLabel = await page.evaluate(async () => {
    const a = document.querySelector('#event-a') as any;
    const b = document.querySelector('#event-b') as any;
    b.checked = true;
    a.addEventListener('click', (event: Event) => event.preventDefault(), { once: true });
    (document.querySelector('#external-radio-label') as HTMLLabelElement).click();
    await Promise.resolve();
    const events = [...(globalThis as any).__radioEvents];
    (globalThis as any).__radioEvents.length = 0;
    return { checked: [a.checked, b.checked], events };
  });
  expect(canceledExternalLabel).toEqual({ checked: [false, true], events: [] });

  await page.evaluate(() => {
    const a = document.querySelector('#event-a') as any;
    a.checked = true;
    a.focus();
  });
  await page.keyboard.press('ArrowRight');
  assertActivationEvents(await readAndClearEvents(page), 'event-b', 'b');
  await page.keyboard.press('ArrowRight');
  assertActivationEvents(await readAndClearEvents(page), 'event-e', 'e');
  expect(await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('#radio-event-form snice-radio')) as any[];
    return {
      checked: radios.map(radio => radio.checked),
      tabs: radios.map(radio => radio.shadowRoot.querySelector('input').tabIndex),
      active: (document.activeElement as HTMLElement)?.id
    };
  })).toEqual({
    checked: [false, false, false, false, true],
    tabs: [-1, -1, -1, -1, 0],
    active: 'event-e'
  });

  await page.keyboard.press('ArrowLeft');
  assertActivationEvents(await readAndClearEvents(page), 'event-b', 'b');

  const silentLifecycle = await page.evaluate(() => {
    const form = document.querySelector('#radio-event-form') as HTMLFormElement;
    const a = document.querySelector('#event-a') as any;
    const b = document.querySelector('#event-b') as any;
    b.checked = true;
    a.defaultChecked = true;
    form.reset();
    b.formStateRestoreCallback('checked', 'restore');
    b.formStateRestoreCallback('unchecked', 'restore');
    const events = [...(globalThis as any).__radioEvents];
    (globalThis as any).__radioEvents.length = 0;
    return {
      checked: [a.checked, b.checked],
      defaults: [a.defaultChecked, b.defaultChecked],
      events
    };
  });
  expect(silentLifecycle).toEqual({
    checked: [false, false],
    defaults: [true, false],
    events: []
  });

  const blocked = await page.evaluate(async () => {
    const a = document.querySelector('#event-a') as any;
    const snapshots = [];
    a.checked = false;
    a.disabled = true;
    a.click();
    snapshots.push({ mode: 'disabled', checked: a.checked });
    a.disabled = false;
    a.loading = true;
    a.click();
    snapshots.push({ mode: 'loading', checked: a.checked });
    a.loading = false;
    const fieldset = document.createElement('fieldset');
    a.parentElement!.insertBefore(fieldset, a);
    fieldset.appendChild(a);
    fieldset.disabled = true;
    await Promise.resolve();
    a.click();
    await a.rendered;
    snapshots.push({
      mode: 'fieldset',
      checked: a.checked,
      disabledProperty: a.disabled,
      disabledAttribute: a.hasAttribute('disabled'),
      inputDisabled: a.shadowRoot.querySelector('input').disabled
    });
    const events = [...(globalThis as any).__radioEvents];
    (globalThis as any).__radioEvents.length = 0;
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

  const anonymousKeyboard = await page.evaluate(async () => {
    const anonymous = document.createElement('snice-radio') as any;
    anonymous.id = 'anonymous-keyboard-radio';
    document.body.appendChild(anonymous);
    await anonymous.ready;
    anonymous.focus();
    return anonymous.checked;
  });
  expect(anonymousKeyboard).toBe(false);
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (document.querySelector('#anonymous-keyboard-radio') as any).checked)).toBe(false);

  expect(await e.isVisible()).toBe(true);
  expect(await inputA.count()).toBe(1);
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`matches native radio form and group behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadRadio(page, build);
    assertFormAndGroupContract(await exerciseFormAndGroupContract(page));
    expect(pageErrors).toEqual([]);
  });

  test(`matches native radio activation and keyboard behavior through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadRadio(page, build);
    await exerciseInteractionContract(page);
    expect(pageErrors).toEqual([]);
  });
}
