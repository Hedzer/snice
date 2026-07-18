import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

type BuildTarget = 'source' | 'distribution' | 'cdn';

const controls = [
  'button', 'checkbox', 'color-picker', 'date-picker', 'date-range-picker',
  'date-time-picker', 'file-upload', 'input', 'key-value', 'radio',
  'range-slider', 'select', 'slider', 'step-input', 'switch', 'tag-input',
  'textarea', 'time-picker'
] as const;

const validityControls = controls.filter(control => control !== 'button');

async function loadControls(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  if (build === 'source') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/packages/components/src/button/snice-button.ts'),
        import('/packages/components/src/checkbox/snice-checkbox.ts'),
        import('/packages/components/src/color-picker/snice-color-picker.ts'),
        import('/packages/components/src/date-picker/snice-date-picker.ts'),
        import('/packages/components/src/date-range-picker/snice-date-range-picker.ts'),
        import('/packages/components/src/date-time-picker/snice-date-time-picker.ts'),
        import('/packages/components/src/file-upload/snice-file-upload.ts'),
        import('/packages/components/src/input/snice-input.ts'),
        import('/packages/components/src/key-value/snice-key-value.ts'),
        import('/packages/components/src/radio/snice-radio.ts'),
        import('/packages/components/src/range-slider/snice-range-slider.ts'),
        import('/packages/components/src/select/snice-select.ts'),
        import('/packages/components/src/slider/snice-slider.ts'),
        import('/packages/components/src/step-input/snice-step-input.ts'),
        import('/packages/components/src/switch/snice-switch.ts'),
        import('/packages/components/src/tag-input/snice-tag-input.ts'),
        import('/packages/components/src/textarea/snice-textarea.ts'),
        import('/packages/components/src/time-picker/snice-time-picker.ts')
      ]);
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/dist/components/button/snice-button.js'),
        import('/dist/components/checkbox/snice-checkbox.js'),
        import('/dist/components/color-picker/snice-color-picker.js'),
        import('/dist/components/date-picker/snice-date-picker.js'),
        import('/dist/components/date-range-picker/snice-date-range-picker.js'),
        import('/dist/components/date-time-picker/snice-date-time-picker.js'),
        import('/dist/components/file-upload/snice-file-upload.js'),
        import('/dist/components/input/snice-input.js'),
        import('/dist/components/key-value/snice-key-value.js'),
        import('/dist/components/radio/snice-radio.js'),
        import('/dist/components/range-slider/snice-range-slider.js'),
        import('/dist/components/select/snice-select.js'),
        import('/dist/components/slider/snice-slider.js'),
        import('/dist/components/step-input/snice-step-input.js'),
        import('/dist/components/switch/snice-switch.js'),
        import('/dist/components/tag-input/snice-tag-input.js'),
        import('/dist/components/textarea/snice-textarea.js'),
        import('/dist/components/time-picker/snice-time-picker.js')
      ]);
    });
  } else {
    for (const control of controls) {
      await page.addScriptTag({ url: `/components/snice-${control}.min.js` });
    }
  }

  await page.waitForFunction(tags => tags.every(tag => Boolean(customElements.get(`snice-${tag}`))), controls);
}

async function installFixture(page: Page) {
  await page.evaluate(async tags => {
    document.querySelector('#form-contract-matrix')?.remove();
    document.querySelector('#form-contract-labels')?.remove();
    document.querySelector('#form-contract-external')?.remove();

    const labels = document.createElement('div');
    labels.id = 'form-contract-labels';
    const form = document.createElement('form');
    form.id = 'form-contract-matrix';
    form.innerHTML = `
      <fieldset id="matrix-fieldset">
        <snice-button id="matrix-button" type="button">Action</snice-button>
        <snice-checkbox id="matrix-checkbox" name="checkbox" value="accepted" checked></snice-checkbox>
        <snice-color-picker id="matrix-color-picker" name="color" value="#112233"></snice-color-picker>
        <snice-date-picker id="matrix-date-picker" name="date" value="2026-03-15"></snice-date-picker>
        <snice-date-range-picker id="matrix-date-range-picker" name="trip" start="2026-03-10" end="2026-03-20"></snice-date-range-picker>
        <snice-date-time-picker id="matrix-date-time-picker" name="datetime" value="2026-03-15T14:30"></snice-date-time-picker>
        <snice-file-upload id="matrix-file-upload" name="files" multiple></snice-file-upload>
        <snice-input id="matrix-input" name="input" value="alpha"></snice-input>
        <snice-key-value id="matrix-key-value" name="pairs" value='[{"key":"Alpha","value":"One","description":""}]'></snice-key-value>
        <snice-radio id="matrix-radio" name="radio" value="selected" checked></snice-radio>
        <snice-range-slider id="matrix-range-slider" name="range" value-low="20" value-high="80"></snice-range-slider>
        <snice-select id="matrix-select" name="select" value="a">
          <snice-option value="a">Alpha</snice-option>
          <snice-option value="b">Beta</snice-option>
        </snice-select>
        <snice-slider id="matrix-slider" name="slider" value="25"></snice-slider>
        <snice-step-input id="matrix-step-input" name="step" value="2" min="0" max="10"></snice-step-input>
        <snice-switch id="matrix-switch" name="switch" value="enabled" checked></snice-switch>
        <snice-tag-input id="matrix-tag-input" name="tags" value='["one","two"]'></snice-tag-input>
        <snice-textarea id="matrix-textarea" name="textarea" value="notes"></snice-textarea>
        <snice-time-picker id="matrix-time-picker" name="time" value="14:30"></snice-time-picker>
        <button id="matrix-native-submit" type="submit">Submit</button>
      </fieldset>
    `;
    const external = document.createElement('form');
    external.id = 'form-contract-external';
    document.body.append(labels, form, external);

    for (const tag of tags) {
      const label = document.createElement('label');
      label.htmlFor = `matrix-${tag}`;
      label.textContent = `Matrix ${tag}`;
      labels.append(label);
    }

    const elements = tags.map(tag => document.querySelector(`#matrix-${tag}`) as any);
    await Promise.all(elements.map(element => element.ready));
    await Promise.all(elements.map(element => element.rendered));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, controls);
}

async function baselineSnapshot(page: Page) {
  return page.evaluate(tags => {
    const form = document.querySelector('#form-contract-matrix') as HTMLFormElement;
    const elements = tags.map(tag => document.querySelector(`#matrix-${tag}`) as any);
    let formdataEvents = 0;
    let eventEntries: Array<[string, string]> = [];
    form.addEventListener('formdata', event => {
      formdataEvents++;
      eventEntries = Array.from((event as FormDataEvent).formData.entries(), ([name, value]) => [name, String(value)]);
    }, { once: true });
    const entries = Array.from(new FormData(form).entries(), ([name, value]) => [name, String(value)] as [string, string]);
    return {
      entries,
      eventEntries,
      formdataEvents,
      listed: elements.map(element => Array.from(form.elements).includes(element)),
      owners: elements.map(element => element.form === form),
      labels: elements.map(element => element.labels?.length ?? -1),
      focusDelegation: elements.map(element => element.shadowRoot?.delegatesFocus ?? false),
      valid: elements.slice(1).map(element => element.checkValidity()),
      reports: elements.slice(1).map(element => element.reportValidity()),
      willValidate: elements.slice(1).map(element => element.willValidate)
    };
  }, controls);
}

async function exerciseConstraintMatrix(page: Page) {
  return page.evaluate(async tags => {
    type Control = HTMLElement & Record<string, any>;
    const host = document.createElement('form');
    host.id = 'matrix-constraints';
    document.body.append(host);

    const create = async (tag: string, properties: Record<string, unknown> = {}) => {
      const element = document.createElement(`snice-${tag}`) as Control;
      element.id = `constraint-${tag}`;
      element.setAttribute('name', `constraint-${tag}`);
      Object.assign(element, properties);
      if (tag === 'select') {
        element.innerHTML = '<snice-option value="a">Alpha</snice-option>';
      }
      host.append(element);
      await element.ready;
      await element.rendered;
      return element;
    };
    const ariaInvalid = (element: Control, selector: string) =>
      element.shadowRoot?.querySelector(selector)?.getAttribute('aria-invalid');
    const result: Record<string, any> = {};
    result.messages = {};
    const rememberMessage = (key: string, element: Control) => {
      result.messages[key] = element.validationMessage;
    };

    const checkbox = await create('checkbox', { required: true });
    result.checkbox = {
      missing: checkbox.validity.valueMissing,
      valid: checkbox.checkValidity(),
      report: checkbox.reportValidity(),
      aria: ariaInvalid(checkbox, '.checkbox-input')
    };
    rememberMessage('checkbox-required', checkbox);
    checkbox.indeterminate = true;
    result.checkbox.indeterminateMissing = checkbox.validity.valueMissing;
    checkbox.checked = true;
    result.checkbox.cleared = checkbox.checkValidity();

    const color = await create('color-picker');
    color.value = '#nope';
    result.color = { badInput: color.validity.badInput, aria: ariaInvalid(color, '.color-input') };
    rememberMessage('color-bad-input', color);
    color.value = 'rgb(256, 0, 0)';
    result.color.rgbBounds = color.validity.badInput;
    color.value = 'hsl(0, 101%, 50%)';
    result.color.hslBounds = color.validity.badInput;
    color.value = '';
    color.required = true;
    result.color.missing = color.validity.valueMissing;
    rememberMessage('color-required', color);
    color.value = 'rgb(18, 52, 86)';
    result.color.canonical = color.value;
    result.color.cleared = color.checkValidity();
    color.showInput = false;
    await color.rendered;

    const date = await create('date-picker', { required: true, min: '2026-03-10', max: '2026-03-20' });
    result.date = { missing: date.validity.valueMissing, aria: ariaInvalid(date, '.input') };
    rememberMessage('date-required', date);
    const dateInput = date.shadowRoot!.querySelector('.input') as HTMLInputElement;
    dateInput.value = 'not-a-date';
    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    result.date.badInput = date.validity.badInput;
    rememberMessage('date-bad-input', date);
    date.value = '2026-03-09';
    result.date.underflow = date.validity.rangeUnderflow;
    rememberMessage('date-underflow', date);
    date.value = '2026-03-21';
    result.date.overflow = date.validity.rangeOverflow;
    rememberMessage('date-overflow', date);
    date.value = '2026-03-15';
    result.date.cleared = date.checkValidity();

    const dateRange = await create('date-range-picker', { required: true, min: '2026-03-10', max: '2026-03-20' });
    result.dateRange = { missing: dateRange.validity.valueMissing, aria: ariaInvalid(dateRange, '.input') };
    rememberMessage('date-range-required', dateRange);
    dateRange.start = '2026-03-12';
    result.dateRange.partial = dateRange.validity.badInput;
    rememberMessage('date-range-partial', dateRange);
    dateRange.end = '2026-03-11';
    result.dateRange.reversed = dateRange.validity.customError;
    rememberMessage('date-range-reversed', dateRange);
    dateRange.start = '2026-03-09';
    dateRange.end = '2026-03-12';
    result.dateRange.underflow = dateRange.validity.rangeUnderflow;
    rememberMessage('date-range-underflow', dateRange);
    dateRange.start = '2026-03-12';
    dateRange.end = '2026-03-21';
    result.dateRange.overflow = dateRange.validity.rangeOverflow;
    rememberMessage('date-range-overflow', dateRange);
    dateRange.end = '2026-03-18';
    result.dateRange.cleared = dateRange.checkValidity();

    const dateTime = await create('date-time-picker', { required: true, min: '2026-03-10T09:00', max: '2026-03-20T17:00' });
    result.dateTime = { missing: dateTime.validity.valueMissing, aria: ariaInvalid(dateTime, '.input') };
    rememberMessage('date-time-required', dateTime);
    dateTime.value = 'not-a-date-time';
    result.dateTime.badInput = dateTime.validity.badInput;
    rememberMessage('date-time-bad-input', dateTime);
    dateTime.value = '2026-03-09T12:00';
    result.dateTime.underflow = dateTime.validity.rangeUnderflow;
    rememberMessage('date-time-underflow', dateTime);
    dateTime.value = '2026-03-21T12:00';
    result.dateTime.overflow = dateTime.validity.rangeOverflow;
    rememberMessage('date-time-overflow', dateTime);
    dateTime.value = '2026-03-15T12:00';
    result.dateTime.cleared = dateTime.checkValidity();

    const upload = await create('file-upload', { required: true, multiple: true, maxSize: 3, maxFiles: 2 });
    result.file = { missing: upload.validity.valueMissing, aria: ariaInvalid(upload, '.file-input') };
    rememberMessage('file-required', upload);
    const rejected = new DataTransfer();
    rejected.items.add(new File(['large'], 'large.txt', { type: 'text/plain' }));
    const uploadInput = upload.shadowRoot!.querySelector('.file-input') as HTMLInputElement;
    uploadInput.files = rejected.files;
    uploadInput.dispatchEvent(new Event('change', { bubbles: true }));
    result.file.rejected = upload.validity.customError;
    result.file.rejectedMessage = upload.validationMessage;
    rememberMessage('file-max-size-rejection', upload);
    const accepted = new DataTransfer();
    accepted.items.add(new File(['a'], 'a.txt', { type: 'text/plain' }));
    uploadInput.files = accepted.files;
    uploadInput.dispatchEvent(new Event('change', { bubbles: true }));
    const excess = new DataTransfer();
    excess.items.add(new File(['b'], 'b.txt', { type: 'text/plain' }));
    excess.items.add(new File(['c'], 'c.txt', { type: 'text/plain' }));
    uploadInput.files = excess.files;
    uploadInput.dispatchEvent(new Event('change', { bubbles: true }));
    result.file.maxFiles = upload.validity.customError;
    rememberMessage('file-max-count-rejection', upload);
    upload.maxFiles = 3;
    result.file.dynamicCountCleared = upload.checkValidity();
    upload.maxSize = 0.5;
    result.file.dynamicSize = upload.validity.customError;
    rememberMessage('file-dynamic-size', upload);
    upload.maxSize = 3;
    result.file.cleared = upload.checkValidity();

    const input = await create('input', { required: true, type: 'email' });
    result.input = { missing: input.validity.valueMissing, aria: ariaInvalid(input, '.input') };
    rememberMessage('input-required', input);
    input.value = 'invalid';
    result.input.typeMismatch = input.validity.typeMismatch;
    rememberMessage('input-email', input);
    input.type = 'url';
    input.value = 'not a url';
    result.input.urlMismatch = input.validity.typeMismatch;
    rememberMessage('input-url', input);
    input.type = 'number';
    input.required = false;
    input.min = '10';
    input.max = '20';
    input.step = '2';
    input.value = '9';
    result.input.underflow = input.validity.rangeUnderflow;
    rememberMessage('input-underflow', input);
    input.value = '21';
    result.input.overflow = input.validity.rangeOverflow;
    rememberMessage('input-overflow', input);
    input.value = '11';
    result.input.step = input.validity.stepMismatch;
    rememberMessage('input-step', input);
    input.value = 'not-a-number';
    result.input.badInput = input.validity.badInput;
    rememberMessage('input-bad-input', input);
    input.value = '12';
    result.input.cleared = input.checkValidity();

    const keyValue = await create('key-value', { required: true });
    result.keyValue = { missing: keyValue.validity.valueMissing };
    rememberMessage('key-value-required', keyValue);
    keyValue.setItems([{ key: '', value: 'orphan' }]);
    result.keyValue.badInput = keyValue.validity.badInput;
    rememberMessage('key-value-row', keyValue);
    keyValue.value = '{malformed';
    result.keyValue.malformedJson = keyValue.validity.badInput;
    rememberMessage('key-value-json', keyValue);
    keyValue.setItems([{ key: 'Accept', value: 'application/json' }]);
    result.keyValue.cleared = keyValue.checkValidity();

    const radio = await create('radio', { required: true });
    result.radio = { missing: radio.validity.valueMissing, aria: ariaInvalid(radio, '.radio-input') };
    rememberMessage('radio-required', radio);
    const radioPeer = await create('radio');
    radioPeer.name = radio.name;
    radioPeer.value = 'peer';
    radioPeer.checked = true;
    result.radio.groupSatisfied = radio.checkValidity();
    radioPeer.checked = false;
    result.radio.groupMissingAgain = radio.validity.valueMissing;
    radio.checked = true;
    result.radio.cleared = radio.checkValidity();

    const range = await create('range-slider', {
      min: 1,
      max: 9,
      step: 2,
      defaultValueLow: 2,
      defaultValueHigh: 8
    });
    result.range = {
      normalized: [range.valueLow, range.valueHigh],
      normalizedValid: range.checkValidity()
    };
    range.setCustomValidity('Range rejected');
    result.range.custom = range.validity.customError;
    result.range.aria = ariaInvalid(range, '.range-slider__thumb--low');
    rememberMessage('range-custom', range);
    range.setCustomValidity('');
    result.range.cleared = range.checkValidity();

    const select = await create('select', { required: true });
    result.select = { missing: select.validity.valueMissing, aria: ariaInvalid(select, '.select-trigger') };
    rememberMessage('select-required', select);
    select.selectOption('a');
    select.multiple = true;
    select.clear();
    result.select.multipleMissing = select.validity.valueMissing;
    rememberMessage('select-multiple-required', select);
    select.selectOption('a');
    result.select.cleared = select.checkValidity();
    select.editable = true;
    await select.rendered;

    const slider = await create('slider', {
      errorText: 'Slider rejected',
      min: 1,
      max: 9,
      step: 2,
      defaultValue: 2
    });
    result.slider = {
      initiallyValid: slider.checkValidity(),
      initialAlerts: slider.shadowRoot!.querySelectorAll('[role="alert"]').length,
      normalized: slider.value
    };
    slider.setCustomValidity('Slider rejected');
    await slider.rendered;
    result.slider.custom = slider.validity.customError;
    result.slider.aria = ariaInvalid(slider, '.slider-thumb');
    result.slider.alerts = slider.shadowRoot!.querySelectorAll('[role="alert"]').length;
    rememberMessage('slider-custom', slider);
    slider.setCustomValidity('');
    await slider.rendered;
    result.slider.cleared = slider.checkValidity();
    result.slider.clearedAlerts = slider.shadowRoot!.querySelectorAll('[role="alert"]').length;

    const step = await create('step-input', { min: 1, max: 9, step: 2, defaultValue: 2 });
    result.step = { normalized: step.value, normalizedValid: step.checkValidity() };
    step.setCustomValidity('Step rejected');
    result.step.custom = step.validity.customError;
    result.step.aria = ariaInvalid(step, '.step-input__input');
    rememberMessage('step-custom', step);
    step.setCustomValidity('');
    result.step.cleared = step.checkValidity();

    const switchControl = await create('switch', { required: true });
    result.switch = { missing: switchControl.validity.valueMissing, aria: ariaInvalid(switchControl, '.switch-input') };
    rememberMessage('switch-required', switchControl);
    switchControl.checked = true;
    result.switch.cleared = switchControl.checkValidity();

    const tag = await create('tag-input', { maxTags: 2 });
    tag.value = ['one', 'two', 'three'];
    await tag.rendered;
    result.tag = { tooLong: tag.validity.tooLong, aria: ariaInvalid(tag, '.tag-input-container') };
    rememberMessage('tag-max', tag);
    tag.value = ['same', 'same'];
    result.tag.duplicate = tag.validity.customError;
    rememberMessage('tag-duplicate', tag);
    tag.allowDuplicates = true;
    result.tag.cleared = tag.checkValidity();

    const textarea = await create('textarea', { required: true });
    result.textarea = { missing: textarea.validity.valueMissing, aria: ariaInvalid(textarea, '.textarea') };
    rememberMessage('textarea-required', textarea);
    textarea.value = 'notes';
    result.textarea.cleared = textarea.checkValidity();

    const time = await create('time-picker', { required: true, minTime: '09:00', maxTime: '17:00', step: 5 });
    result.time = { missing: time.validity.valueMissing, aria: ariaInvalid(time, '.input') };
    rememberMessage('time-required', time);
    time.value = 'not-a-time';
    result.time.badInput = time.validity.badInput;
    rememberMessage('time-bad-input', time);
    time.value = '08:00';
    result.time.underflow = time.validity.rangeUnderflow;
    rememberMessage('time-underflow', time);
    time.value = '18:00';
    result.time.overflow = time.validity.rangeOverflow;
    rememberMessage('time-overflow', time);
    time.value = '12:07';
    result.time.step = time.validity.stepMismatch;
    rememberMessage('time-step', time);
    time.value = '12:00';
    result.time.cleared = time.checkValidity();

    const selectors: Record<string, string> = {
      checkbox: '.checkbox-input',
      'color-picker': '.color-swatch',
      'date-picker': '.input',
      'date-range-picker': '.input',
      'date-time-picker': '.input',
      'file-upload': '.file-input',
      input: '.input',
      'key-value': '.kv__input',
      radio: '.radio-input',
      'range-slider': '.range-slider__thumb--low',
      select: '.select-editable-input',
      slider: '.slider-thumb',
      'step-input': '.step-input__input',
      switch: '.switch-input',
      'tag-input': '.tag-remove',
      textarea: '.textarea',
      'time-picker': '.input'
    };
    const ariaSelectors: Record<string, string> = {
      ...selectors,
      'tag-input': '.tag-input-container'
    };
    result.custom = {};
    let genericSubmitEvents = 0;
    host.addEventListener('submit', event => {
      genericSubmitEvents++;
      event.preventDefault();
    });
    for (const tag of tags) {
      const element = host.querySelector(`snice-${tag}`) as Control;
      const message = `Custom ${tag}`;
      element.setCustomValidity(message);
      await element.rendered;
      result.custom[tag] = {
        invalid: !element.checkValidity(),
        formInvalid: !host.checkValidity(),
        reportInvalid: !element.reportValidity(),
        customError: element.validity.customError,
        message: element.validationMessage,
        aria: ariaInvalid(element, ariaSelectors[tag])
      };
      const submissionsBefore = genericSubmitEvents;
      host.requestSubmit();
      result.custom[tag].submissionBlocked = genericSubmitEvents === submissionsBefore;
      const anchor = element.shadowRoot?.querySelector(selectors[tag]);
      result.custom[tag].focus = {
        host: document.activeElement === element,
        anchor: element.shadowRoot?.activeElement === anchor
      };
      element.setCustomValidity('');
      await element.rendered;
      result.custom[tag].cleared = element.checkValidity();
    }

    result.allMessagesUseful = Object.values(result.messages)
      .every(message => typeof message === 'string' && message.length > 0);
    return result;
  }, validityControls);
}

async function exerciseCustomerTextConstraints(page: Page) {
  await page.evaluate(() => {
    const input = document.querySelector('#constraint-input') as any;
    input.type = 'text';
    input.required = false;
    input.min = '';
    input.max = '';
    input.step = '';
    input.pattern = '[A-Z]+';
    input.minlength = 3;
    input.maxlength = 5;

    const textarea = document.querySelector('#constraint-textarea') as any;
    textarea.required = false;
    textarea.minlength = 3;
    textarea.maxlength = 5;
  });

  const input = page.locator('#constraint-input').locator('.input');
  await input.fill('');
  await input.pressSequentially('ab');
  const inputShort = await page.evaluate(() => {
    const element = document.querySelector('#constraint-input') as any;
    return {
      tooShort: element.validity.tooShort,
      pattern: element.validity.patternMismatch,
      valid: element.checkValidity(),
      aria: element.shadowRoot.querySelector('.input').getAttribute('aria-invalid')
    };
  });
  await input.fill('ABCDE');
  const inputValid = await page.evaluate(() => (document.querySelector('#constraint-input') as any).checkValidity());
  await input.fill('');
  await input.pressSequentially('ABCDEFG');
  const inputBounded = await input.inputValue();
  const inputLong = await page.evaluate(() => {
    const element = document.querySelector('#constraint-input') as any;
    const native = element.shadowRoot.querySelector('.input') as HTMLInputElement;
    native.value = 'ABCDEF';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    const userTooLong = element.validity.tooLong;
    element.value = 'ABCDEF';
    return { userTooLong, programmaticTooLong: element.validity.tooLong };
  });

  const textarea = page.locator('#constraint-textarea').locator('.textarea');
  await textarea.fill('');
  await textarea.pressSequentially('ab');
  const textareaShort = await page.evaluate(() => {
    const element = document.querySelector('#constraint-textarea') as any;
    return {
      tooShort: element.validity.tooShort,
      valid: element.checkValidity(),
      aria: element.shadowRoot.querySelector('.textarea').getAttribute('aria-invalid')
    };
  });
  await textarea.fill('');
  await textarea.pressSequentially('abcdefg');
  const textareaBounded = await textarea.inputValue();
  const textareaLong = await page.evaluate(() => {
    const element = document.querySelector('#constraint-textarea') as any;
    const native = element.shadowRoot.querySelector('.textarea') as HTMLTextAreaElement;
    native.value = 'abcdef';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    const userTooLong = element.validity.tooLong;
    element.value = 'abcdef';
    return { userTooLong, programmaticTooLong: element.validity.tooLong };
  });

  const cleared = await page.evaluate(() => {
    const input = document.querySelector('#constraint-input') as any;
    input.pattern = '';
    input.minlength = -1;
    input.maxlength = -1;
    const textarea = document.querySelector('#constraint-textarea') as any;
    textarea.minlength = -1;
    textarea.maxlength = -1;
    return {
      inputAttributes: ['pattern', 'minlength', 'maxlength']
        .map(name => input.shadowRoot.querySelector('.input').hasAttribute(name)),
      textareaAttributes: ['minlength', 'maxlength']
        .map(name => textarea.shadowRoot.querySelector('.textarea').hasAttribute(name))
    };
  });

  return {
    inputShort,
    inputValid,
    inputBounded,
    inputLong,
    textareaShort,
    textareaBounded,
    textareaLong,
    cleared
  };
}

async function exerciseLifecycleMatrix(page: Page) {
  return page.evaluate(async tags => {
    const form = document.querySelector('#form-contract-matrix') as HTMLFormElement;
    const fieldset = document.querySelector('#matrix-fieldset') as HTMLFieldSetElement;
    const elements = tags.map(tag => document.querySelector(`#matrix-${tag}`) as any);
    const successfulEntries = () => Array.from(new FormData(form).entries(), ([name, value]) => [name, String(value)] as [string, string]);

    const legend = document.createElement('legend');
    legend.innerHTML = '<snice-input id="matrix-legend-input" name="legend" value="included"></snice-input>';
    fieldset.prepend(legend);
    const legendInput = legend.querySelector('snice-input') as any;
    await legendInput.ready;
    await legendInput.rendered;

    fieldset.disabled = true;
    await Promise.resolve();
    await Promise.all(elements.map(element => element.rendered));
    const disabledLabelFocus = [];
    for (const element of elements) {
      (document.activeElement as HTMLElement | null)?.blur();
      const label = Array.from(document.querySelectorAll('label'))
        .find(candidate => candidate.htmlFor === element.id);
      label?.click();
      await new Promise(resolve => setTimeout(resolve, 0));
      disabledLabelFocus.push({
        tag: element.localName.replace('snice-', ''),
        host: document.activeElement === element,
        shadow: Boolean(element.shadowRoot?.activeElement)
      });
    }
    const disabled = {
      matches: elements.map(element => element.matches(':disabled')),
      willValidate: elements.slice(1).map(element => element.willValidate),
      labelFocus: disabledLabelFocus,
      legend: {
        matches: legendInput.matches(':disabled'),
        willValidate: legendInput.willValidate,
        owner: legendInput.form === form
      },
      entries: successfulEntries()
    };
    fieldset.disabled = false;
    await Promise.resolve();
    await Promise.all(elements.map(element => element.rendered));
    const reenabledEntries = successfulEntries();

    const readonlyTags = [
      'date-picker', 'date-range-picker', 'date-time-picker', 'input', 'key-value',
      'select', 'slider', 'step-input', 'tag-input', 'textarea', 'time-picker'
    ];
    const readonly = readonlyTags.map(tag => {
      const element = document.querySelector(`#matrix-${tag}`) as any;
      element.setCustomValidity('retained');
      element.readonly = true;
      const barred = { tag, willValidate: element.willValidate, valid: element.checkValidity() };
      element.readonly = false;
      const restored = !element.checkValidity() && element.validity.customError;
      element.setCustomValidity('');
      return { ...barred, restored };
    });

    const loadingTags = [
      'checkbox', 'color-picker', 'date-picker', 'date-range-picker', 'date-time-picker',
      'input', 'radio', 'select', 'slider', 'switch', 'textarea', 'time-picker'
    ];
    const loading = loadingTags.map(tag => {
      const element = document.querySelector(`#matrix-${tag}`) as any;
      element.setCustomValidity('retained');
      element.loading = true;
      const barred = { tag, willValidate: element.willValidate, valid: element.checkValidity() };
      element.loading = false;
      const restored = !element.checkValidity() && element.validity.customError;
      element.setCustomValidity('');
      return { ...barred, restored };
    });

    const beforeReconnect = successfulEntries();
    const fragment = document.createDocumentFragment();
    for (const element of elements) fragment.append(element);
    legend.after(fragment);
    await Promise.all(elements.map(element => element.rendered));
    await Promise.resolve();
    const reconnect = {
      owners: elements.map(element => element.form === form),
      labels: elements.map(element => element.labels?.length ?? -1),
      entries: successfulEntries()
    };

    return { disabled, reenabledEntries, readonly, loading, beforeReconnect, reconnect };
  }, controls);
}

async function exerciseEventMatrix(page: Page) {
  return page.evaluate(async () => {
    const get = (tag: string) => document.querySelector(`#matrix-${tag}`) as any;
    const eventNames: Record<string, string> = {
      button: 'button-click',
      checkbox: 'checkbox-change',
      'color-picker': 'color-picker-change',
      'date-picker': 'datepicker-change',
      'date-range-picker': 'daterange-change',
      'date-time-picker': 'datetimepicker-clear',
      'file-upload': 'file-upload-change',
      input: 'input-change',
      'key-value': 'kv-change',
      radio: 'radio-change',
      'range-slider': 'range-change',
      select: 'select-change',
      slider: 'slider-change',
      'step-input': 'value-change',
      switch: 'switch-change',
      'tag-input': 'tag-change',
      textarea: 'textarea-change',
      'time-picker': 'timepicker-clear'
    };
    const counts = Object.fromEntries(Object.keys(eventNames).map(tag => [tag, 0])) as Record<string, number>;
    for (const [tag, eventName] of Object.entries(eventNames)) {
      get(tag).addEventListener(eventName, () => counts[tag]++);
    }
    const standard = Object.fromEntries(
      ['checkbox', 'radio', 'switch'].map(tag => [tag, { input: 0, change: 0 }])
    ) as Record<string, { input: number; change: number }>;
    for (const [tag, count] of Object.entries(standard)) {
      get(tag).addEventListener('input', () => count.input++);
      get(tag).addEventListener('change', () => count.change++);
    }
    const switchOrder: string[] = [];
    for (const eventName of ['input', 'change', 'switch-change']) {
      get('switch').addEventListener(eventName, () => switchOrder.push(eventName));
    }

    get('button').shadowRoot.querySelector('.button').click();
    get('checkbox').shadowRoot.querySelector('.checkbox-input').click();

    const nativeColor = get('color-picker').shadowRoot.querySelector('.native-input') as HTMLInputElement;
    nativeColor.value = '#abcdef';
    nativeColor.dispatchEvent(new Event('change', { bubbles: true }));

    get('date-picker').selectDate(new Date(2026, 5, 1));
    get('date-range-picker').selectRange(new Date(2026, 5, 2), new Date(2026, 5, 3));
    get('date-time-picker').clear();

    const fileInput = get('file-upload').shadowRoot.querySelector('.file-input') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['event'], 'event.txt', { type: 'text/plain' }));
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    const input = get('input').shadowRoot.querySelector('.input') as HTMLInputElement;
    input.value = 'event input';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    get('key-value').addItem('Event', 'Value');
    get('radio').checked = false;
    get('radio').shadowRoot.querySelector('.radio-input').click();
    get('range-slider').shadowRoot.querySelector('.range-slider__thumb--low')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    get('select').selectOption('b');
    get('slider').shadowRoot.querySelector('.slider-thumb')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    get('step-input').increment();
    get('switch').checked = false;
    await get('switch').rendered;
    get('switch').shadowRoot.querySelector('.switch-input').click();
    get('tag-input').addTag('event');

    const textarea = get('textarea').shadowRoot.querySelector('.textarea') as HTMLTextAreaElement;
    textarea.value = 'event notes';
    textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    get('time-picker').clear();

    await Promise.resolve();
    return { counts, standard, switchOrder };
  });
}

async function exerciseResetRestoreAndSubmission(page: Page) {
  return page.evaluate(async () => {
    const form = document.querySelector('#form-contract-matrix') as HTMLFormElement;
    const get = (tag: string) => document.querySelector(`#matrix-${tag}`) as any;
    const entries = () => Array.from(new FormData(form).entries(), ([name, value]) => [name, String(value)] as [string, string]);

    get('checkbox').checked = false;
    get('color-picker').value = '#445566';
    get('date-picker').value = '2026-04-01';
    get('date-range-picker').start = '2026-04-01';
    get('date-range-picker').end = '2026-04-02';
    get('date-time-picker').value = '2026-04-01T09:00';
    get('input').value = 'dirty';
    get('key-value').setItems([{ key: 'Dirty', value: 'Value' }]);
    get('radio').checked = false;
    get('range-slider').valueLow = 30;
    get('range-slider').valueHigh = 70;
    get('select').selectOption('b');
    get('slider').value = 40;
    get('step-input').value = 4;
    get('switch').checked = false;
    get('tag-input').value = ['dirty'];
    get('textarea').value = 'dirty';
    get('time-picker').value = '09:00';
    const fileInput = get('file-upload').shadowRoot.querySelector('.file-input') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['a'], 'reset.txt', { type: 'text/plain' }));
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    form.reset();
    await Promise.resolve();
    const reset = {
      values: {
        checkbox: get('checkbox').checked,
        color: get('color-picker').value,
        date: get('date-picker').value,
        dateRange: [get('date-range-picker').start, get('date-range-picker').end],
        dateTime: get('date-time-picker').value,
        files: get('file-upload').files?.length ?? -1,
        input: get('input').value,
        keyValue: get('key-value').value,
        radio: get('radio').checked,
        range: [get('range-slider').valueLow, get('range-slider').valueHigh],
        select: get('select').value,
        slider: get('slider').value,
        step: get('step-input').value,
        switch: get('switch').checked,
        tags: get('tag-input').value,
        textarea: get('textarea').value,
        time: get('time-picker').value
      },
      entries: entries()
    };

    get('checkbox').formStateRestoreCallback('unchecked', 'restore');
    get('color-picker').formStateRestoreCallback('#abcdef', 'restore');
    get('date-picker').formStateRestoreCallback('2026-05-01', 'restore');
    get('date-range-picker').formStateRestoreCallback('["2026-05-01","2026-05-02"]', 'restore');
    get('date-time-picker').formStateRestoreCallback('2026-05-01T10:30', 'restore');
    get('file-upload').formStateRestoreCallback(new File(['r'], 'restored.txt', { type: 'text/plain' }), 'restore');
    get('input').formStateRestoreCallback('restored input', 'restore');
    get('key-value').formStateRestoreCallback('[{"key":"Restored","value":"Pair","description":""}]', 'restore');
    get('radio').formStateRestoreCallback('checked', 'restore');
    get('range-slider').formStateRestoreCallback('35,65', 'restore');
    get('select').formStateRestoreCallback('b', 'restore');
    get('slider').formStateRestoreCallback('45', 'restore');
    get('step-input').formStateRestoreCallback('6', 'restore');
    get('switch').formStateRestoreCallback('unchecked', 'restore');
    get('tag-input').formStateRestoreCallback('["restored"]', 'restore');
    get('textarea').formStateRestoreCallback('restored notes', 'restore');
    get('time-picker').formStateRestoreCallback('10:30', 'restore');
    const restored = {
      values: {
        checkbox: get('checkbox').checked,
        color: get('color-picker').value,
        date: get('date-picker').value,
        dateRange: [get('date-range-picker').start, get('date-range-picker').end],
        dateTime: get('date-time-picker').value,
        files: Array.from(get('file-upload').files || [], (file: File) => file.name),
        input: get('input').value,
        keyValue: get('key-value').value,
        radio: get('radio').checked,
        range: [get('range-slider').valueLow, get('range-slider').valueHigh],
        select: get('select').value,
        slider: get('slider').value,
        step: get('step-input').value,
        switch: get('switch').checked,
        tags: get('tag-input').value,
        textarea: get('textarea').value,
        time: get('time-picker').value
      },
      entries: entries()
    };

    let submitEvents = 0;
    form.addEventListener('submit', event => {
      submitEvents++;
      event.preventDefault();
    });
    get('input').required = true;
    get('input').value = '';
    let invalidEvents = 0;
    get('input').addEventListener('invalid', () => invalidEvents++);
    form.requestSubmit();
    const blocked = {
      submitEvents,
      invalidEvents,
      formValid: form.checkValidity(),
      focus: {
        host: document.activeElement === get('input'),
        anchor: get('input').shadowRoot.activeElement === get('input').shadowRoot.querySelector('.input')
      }
    };
    get('input').value = 'valid';
    form.requestSubmit();
    const submitted = { submitEvents, invalidEvents, formValid: form.checkValidity() };

    return { reset, restored, blocked, submitted };
  });
}

async function exerciseExternalOwners(page: Page) {
  return page.evaluate(async tags => {
    const external = document.querySelector('#form-contract-external') as HTMLFormElement;
    const container = document.createElement('div');
    container.id = 'external-owner-controls';
    document.body.append(container);
    for (const tag of tags) {
      const element = document.createElement(`snice-${tag}`) as any;
      element.id = `external-${tag}`;
      element.setAttribute('form', external.id);
      element.setAttribute('name', `external-${tag}`);
      if (tag === 'checkbox' || tag === 'radio' || tag === 'switch') element.setAttribute('checked', '');
      if (tag === 'color-picker') element.setAttribute('value', '#123456');
      if (tag === 'date-picker') element.setAttribute('value', '2026-03-15');
      if (tag === 'date-range-picker') {
        element.setAttribute('start', '2026-03-10');
        element.setAttribute('end', '2026-03-20');
      }
      if (tag === 'date-time-picker') element.setAttribute('value', '2026-03-15T14:30');
      if (tag === 'input' || tag === 'textarea' || tag === 'select') element.setAttribute('value', 'a');
      if (tag === 'key-value') element.setAttribute('value', '[{"key":"A","value":"B","description":""}]');
      if (tag === 'range-slider') {
        element.setAttribute('value-low', '20');
        element.setAttribute('value-high', '80');
      }
      if (tag === 'slider' || tag === 'step-input') element.setAttribute('value', '2');
      if (tag === 'tag-input') element.setAttribute('value', '["a"]');
      if (tag === 'time-picker') element.setAttribute('value', '14:30');
      if (tag === 'select') element.innerHTML = '<snice-option value="a">Alpha</snice-option>';
      container.append(element);
      await element.ready;
      await element.rendered;
    }
    const elements = tags.map(tag => document.querySelector(`#external-${tag}`) as any);
    const entries = Array.from(new FormData(external).entries(), ([name, value]) => [name, String(value)] as [string, string]);
    return {
      owners: elements.map(element => element.form === external),
      listed: elements.map(element => Array.from(external.elements).includes(element)),
      entries
    };
  }, controls);
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`runs the complete form-associated customer contract through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await loadControls(page, build);
    await installFixture(page);

    await test.step('FormData, formdata, ownership, labels, and native host surface', async () => {
      const baseline = await baselineSnapshot(page);
      expect(baseline.listed).toEqual(controls.map(() => true));
      expect(baseline.owners).toEqual(controls.map(() => true));
      expect(baseline.labels).toEqual(controls.map(() => 1));
      expect(baseline.focusDelegation).toEqual(controls.map(() => true));
      expect(baseline.valid).toEqual(validityControls.map(() => true));
      expect(baseline.reports).toEqual(validityControls.map(() => true));
      expect(baseline.willValidate).toEqual(validityControls.map(() => true));
      expect(baseline.formdataEvents).toBe(1);
      expect(baseline.eventEntries).toEqual(baseline.entries);
      expect(baseline.entries).toEqual([
        ['checkbox', 'accepted'],
        ['color', '#112233'],
        ['date', '2026-03-15'],
        ['trip-start', '2026-03-10'],
        ['trip-end', '2026-03-20'],
        ['datetime', '2026-03-15T14:30'],
        ['input', 'alpha'],
        ['pairs', '[{"key":"Alpha","value":"One","description":""}]'],
        ['radio', 'selected'],
        ['range', '20,80'],
        ['select', 'a'],
        ['slider', '25'],
        ['step', '2'],
        ['switch', 'enabled'],
        ['tags', '["one","two"]'],
        ['textarea', 'notes'],
        ['time', '14:30']
      ]);
    });

    await test.step('every component-specific validity rule and clearing path', async () => {
      const result = await exerciseConstraintMatrix(page);
      expect(result).toMatchObject({
        checkbox: { missing: true, valid: false, report: false, aria: 'true', indeterminateMissing: true, cleared: true },
        color: {
          badInput: true, aria: 'true', rgbBounds: true, hslBounds: true,
          missing: true, canonical: '#123456', cleared: true
        },
        date: { missing: true, aria: 'true', badInput: true, underflow: true, overflow: true, cleared: true },
        dateRange: {
          missing: true, aria: 'true', partial: true, reversed: true,
          underflow: true, overflow: true, cleared: true
        },
        dateTime: { missing: true, aria: 'true', badInput: true, underflow: true, overflow: true, cleared: true },
        file: {
          missing: true, aria: 'true', rejected: true, maxFiles: true,
          dynamicCountCleared: true, dynamicSize: true, cleared: true
        },
        input: {
          missing: true, aria: 'true', typeMismatch: true, urlMismatch: true,
          underflow: true, overflow: true, step: true, badInput: true, cleared: true
        },
        keyValue: { missing: true, badInput: true, malformedJson: true, cleared: true },
        radio: {
          missing: true, aria: 'true', groupSatisfied: true,
          groupMissingAgain: true, cleared: true
        },
        range: { normalized: [3, 9], normalizedValid: true, custom: true, aria: 'true', cleared: true },
        select: { missing: true, aria: 'true', multipleMissing: true, cleared: true },
        slider: {
          initiallyValid: true, initialAlerts: 0, normalized: 3,
          custom: true, aria: 'true', alerts: 1, cleared: true, clearedAlerts: 0
        },
        step: { normalized: 3, normalizedValid: true, custom: true, aria: 'true', cleared: true },
        switch: { missing: true, aria: 'true', cleared: true },
        tag: { tooLong: true, aria: 'true', duplicate: true, cleared: true },
        textarea: { missing: true, aria: 'true', cleared: true },
        time: {
          missing: true, aria: 'true', badInput: true, underflow: true,
          overflow: true, step: true, cleared: true
        },
        allMessagesUseful: true
      });
      expect(result.file.rejectedMessage).toContain('large.txt');
      expect(Object.keys(result.custom)).toEqual(validityControls);
      for (const tag of validityControls) {
        expect(result.custom[tag], tag).toEqual({
          invalid: true,
          formInvalid: true,
          reportInvalid: true,
          customError: true,
          message: `Custom ${tag}`,
          aria: 'true',
          submissionBlocked: true,
          focus: { host: true, anchor: true },
          cleared: true
        });
      }
    });

    await test.step('customer typing exercises user-only length and pattern validity', async () => {
      const result = await exerciseCustomerTextConstraints(page);
      expect(result.inputShort).toEqual({ tooShort: true, pattern: true, valid: false, aria: 'true' });
      expect(result.inputValid).toBe(true);
      expect(result.inputBounded).toBe('ABCDE');
      expect(result.inputLong).toEqual({ userTooLong: true, programmaticTooLong: false });
      expect(result.textareaShort).toEqual({ tooShort: true, valid: false, aria: 'true' });
      expect(result.textareaBounded).toBe('abcde');
      expect(result.textareaLong).toEqual({ userTooLong: true, programmaticTooLong: false });
      expect(result.cleared).toEqual({ inputAttributes: [false, false, false], textareaAttributes: [false, false] });
    });

    await test.step('fieldset, readonly, loading, and reconnect eligibility', async () => {
      const result = await exerciseLifecycleMatrix(page);
      expect(result.disabled.matches).toEqual(controls.map(() => true));
      expect(result.disabled.willValidate).toEqual(validityControls.map(() => false));
      expect(result.disabled.labelFocus).toEqual(controls.map(tag => ({ tag, host: false, shadow: false })));
      expect(result.disabled.legend).toEqual({ matches: false, willValidate: true, owner: true });
      expect(result.disabled.entries).toEqual([['legend', 'included']]);
      expect(result.reenabledEntries).toEqual(result.beforeReconnect);
      expect(
        result.readonly.every(entry => !entry.willValidate && entry.valid && entry.restored),
        JSON.stringify(result.readonly)
      ).toBe(true);
      const loadingValidationParticipants = new Set(['checkbox', 'date-picker', 'radio']);
      for (const entry of result.loading) {
        const participates = loadingValidationParticipants.has(entry.tag);
        expect(entry, JSON.stringify(result.loading)).toEqual({
          tag: entry.tag,
          willValidate: participates,
          valid: !participates,
          restored: true
        });
      }
      expect(result.reconnect.owners).toEqual(controls.map(() => true));
      expect(result.reconnect.labels).toEqual(controls.map(() => 1));
      expect(result.reconnect.entries).toEqual(result.beforeReconnect);
    });

    await test.step('customer interactions emit every documented component event and standard form events', async () => {
      const result = await exerciseEventMatrix(page);
      expect(Object.values(result.counts).every(count => count >= 1), JSON.stringify(result.counts)).toBe(true);
      expect(Object.values(result.standard).every(count => count.input >= 1 && count.change >= 1), JSON.stringify(result.standard)).toBe(true);
      expect(result.switchOrder).toEqual(['input', 'change', 'switch-change']);
    });

    await test.step('authored reset defaults, browser restore state, and submit blocking', async () => {
      const result = await exerciseResetRestoreAndSubmission(page);
      expect(result.reset.values).toEqual({
        checkbox: true,
        color: '#112233',
        date: '2026-03-15',
        dateRange: ['2026-03-10', '2026-03-20'],
        dateTime: '2026-03-15T14:30',
        files: 0,
        input: 'alpha',
        keyValue: '[{"key":"Alpha","value":"One","description":""}]',
        radio: true,
        range: [20, 80],
        select: 'a',
        slider: 25,
        step: 2,
        switch: true,
        tags: ['one', 'two'],
        textarea: 'notes',
        time: '14:30'
      });
      expect(result.restored.values).toEqual({
        checkbox: false,
        color: '#abcdef',
        date: '2026-05-01',
        dateRange: ['2026-05-01', '2026-05-02'],
        dateTime: '2026-05-01T10:30',
        files: ['restored.txt'],
        input: 'restored input',
        keyValue: '[{"key":"Restored","value":"Pair","description":""}]',
        radio: true,
        range: [35, 65],
        select: 'b',
        slider: 45,
        step: 6,
        switch: false,
        tags: ['restored'],
        textarea: 'restored notes',
        time: '10:30'
      });
      expect(result.blocked).toEqual({
        submitEvents: 0,
        invalidEvents: 1,
        formValid: false,
        focus: { host: true, anchor: true }
      });
      expect(result.submitted).toEqual({ submitEvents: 1, invalidEvents: 2, formValid: true });
    });

    await test.step('explicit form owners outside the form tree', async () => {
      const result = await exerciseExternalOwners(page);
      expect(result.owners).toEqual(controls.map(() => true));
      expect(result.listed).toEqual(controls.map(() => true));
      expect(result.entries.length).toBeGreaterThanOrEqual(validityControls.length - 2);
      expect(result.entries).toContainEqual(['external-input', 'a']);
      expect(result.entries).toContainEqual(['external-date-picker', '2026-03-15']);
      expect(result.entries).toContainEqual(['external-time-picker', '14:30']);
    });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
