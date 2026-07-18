import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

const tags = [
  'checkbox', 'radio', 'input', 'textarea', 'select', 'tag-input',
  'color-picker', 'step-input', 'switch', 'range-slider', 'slider', 'file-upload'
] as const;

async function loadControls(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.id = 'pre-upgrade-reset-fixture';
    fixture.innerHTML = `
      <snice-input id="pre-input" value="authored"></snice-input>
      <snice-textarea id="pre-textarea" value="authored"></snice-textarea>
      <snice-select id="pre-select" value="authored"></snice-select>
      <snice-tag-input id="pre-tags" value='["authored"]'></snice-tag-input>
      <snice-color-picker id="pre-color" value="#112233"></snice-color-picker>
      <snice-step-input id="pre-step" value="2"></snice-step-input>
      <snice-slider id="pre-slider" value="20"></snice-slider>
      <snice-range-slider id="pre-range" value-low="20" value-high="80"></snice-range-slider>
      <snice-checkbox id="pre-checkbox" checked></snice-checkbox>
      <snice-radio id="pre-radio" checked></snice-radio>
      <snice-switch id="pre-switch" checked></snice-switch>
    `;
    document.body.append(fixture);
    const liveValues: Record<string, unknown> = {
      'pre-input': 'runtime',
      'pre-textarea': 'runtime',
      'pre-select': 'runtime',
      'pre-tags': ['runtime'],
      'pre-color': '#445566',
      'pre-step': 4,
      'pre-slider': 40
    };
    for (const [id, value] of Object.entries(liveValues)) (document.querySelector(`#${id}`) as any).value = value;
    const range = document.querySelector('#pre-range') as any;
    range.valueLow = 30;
    range.valueHigh = 70;
    for (const id of ['pre-checkbox', 'pre-radio', 'pre-switch']) (document.querySelector(`#${id}`) as any).checked = false;
  });

  if (build === 'source') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/packages/components/src/checkbox/snice-checkbox.ts'),
        import('/packages/components/src/radio/snice-radio.ts'),
        import('/packages/components/src/input/snice-input.ts'),
        import('/packages/components/src/textarea/snice-textarea.ts'),
        import('/packages/components/src/select/snice-select.ts'),
        import('/packages/components/src/tag-input/snice-tag-input.ts'),
        import('/packages/components/src/color-picker/snice-color-picker.ts'),
        import('/packages/components/src/step-input/snice-step-input.ts'),
        import('/packages/components/src/switch/snice-switch.ts'),
        import('/packages/components/src/range-slider/snice-range-slider.ts'),
        import('/packages/components/src/slider/snice-slider.ts'),
        import('/packages/components/src/file-upload/snice-file-upload.ts')
      ]);
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/dist/components/checkbox/snice-checkbox.js'),
        import('/dist/components/radio/snice-radio.js'),
        import('/dist/components/input/snice-input.js'),
        import('/dist/components/textarea/snice-textarea.js'),
        import('/dist/components/select/snice-select.js'),
        import('/dist/components/tag-input/snice-tag-input.js'),
        import('/dist/components/color-picker/snice-color-picker.js'),
        import('/dist/components/step-input/snice-step-input.js'),
        import('/dist/components/switch/snice-switch.js'),
        import('/dist/components/range-slider/snice-range-slider.js'),
        import('/dist/components/slider/snice-slider.js'),
        import('/dist/components/file-upload/snice-file-upload.js')
      ]);
    });
  } else {
    for (const tag of tags) await page.addScriptTag({ url: `/components/snice-${tag}.min.js` });
  }

  await page.waitForFunction(() => [
    'snice-checkbox', 'snice-radio', 'snice-input', 'snice-textarea', 'snice-select',
    'snice-tag-input', 'snice-color-picker', 'snice-step-input', 'snice-switch',
    'snice-range-slider', 'snice-slider', 'snice-file-upload'
  ].every(tag => Boolean(customElements.get(tag))));

  return page.evaluate(async () => {
    const elements = Array.from(document.querySelectorAll('#pre-upgrade-reset-fixture > *')) as any[];
    await Promise.all(elements.map(element => element.ready));
    await Promise.all(elements.map(element => element.rendered));
    return {
      scalar: ['input', 'textarea', 'select', 'tags', 'color', 'step', 'slider'].map(id => {
        const element = document.querySelector(`#pre-${id}`) as any;
        return {
          id,
          value: element.value,
          defaultValue: element.defaultValue,
          ownsValue: Object.prototype.hasOwnProperty.call(element, 'value'),
          attribute: element.getAttribute('value')
        };
      }),
      range: (() => {
        const element = document.querySelector('#pre-range') as any;
        return {
          values: [element.valueLow, element.valueHigh],
          defaults: [element.defaultValueLow, element.defaultValueHigh],
          owns: [
            Object.prototype.hasOwnProperty.call(element, 'valueLow'),
            Object.prototype.hasOwnProperty.call(element, 'valueHigh')
          ],
          attributes: [element.getAttribute('value-low'), element.getAttribute('value-high')]
        };
      })(),
      checked: ['checkbox', 'radio', 'switch'].map(id => {
        const element = document.querySelector(`#pre-${id}`) as any;
        return {
          id,
          checked: element.checked,
          defaultChecked: element.defaultChecked,
          ownsChecked: Object.prototype.hasOwnProperty.call(element, 'checked'),
          attribute: element.hasAttribute('checked')
        };
      })
    };
  });
}

async function installForm(page: Page) {
  await page.evaluate(async () => {
    document.querySelector('#reset-contract')?.remove();
    document.querySelector('#reset-move-target')?.remove();
    const form = document.createElement('form');
    form.id = 'reset-contract';
    form.innerHTML = `
      <snice-input id="reset-input" name="input" value="alpha"></snice-input>
      <snice-textarea id="reset-textarea" name="textarea" value="alpha"></snice-textarea>
      <snice-select id="reset-select" name="select" value="alpha" editable allow-free-text>
        <snice-option value="alpha">Alpha</snice-option>
        <snice-option value="beta">Beta</snice-option>
      </snice-select>
      <snice-tag-input id="reset-tags" name="tags" value='["alpha"]'></snice-tag-input>
      <snice-color-picker id="reset-color" name="color" value="#112233"></snice-color-picker>
      <snice-step-input id="reset-step" name="step" min="0" max="10" value="2"></snice-step-input>
      <snice-checkbox id="reset-checkbox" name="checkbox" value="yes" checked></snice-checkbox>
      <snice-radio id="reset-radio" name="radio" value="yes" checked></snice-radio>
      <snice-switch id="reset-switch" name="switch" value="yes"></snice-switch>
      <snice-range-slider id="reset-range" name="range" min="0" max="100" step="5" value-low="20" value-high="80"></snice-range-slider>
      <snice-slider id="reset-slider" name="slider" min="0" max="100" step="5" value="20"></snice-slider>
      <snice-file-upload id="reset-file" name="files" multiple></snice-file-upload>
      <button type="reset">Reset</button>
    `;
    const moveTarget = document.createElement('form');
    moveTarget.id = 'reset-move-target';
    document.body.append(form, moveTarget);
    const controls = Array.from(form.querySelectorAll<HTMLElement>('[id^="reset-"]:not(button)')) as any[];
    await Promise.all(controls.map(control => control.ready));
    await Promise.all(controls.map(control => control.rendered));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
    const entries = (form: HTMLFormElement) => Array.from(new FormData(form).entries()).map(([name, value]) => [
      name,
      value instanceof File ? { name: value.name, size: value.size, type: value.type } : String(value)
    ]);
    return {
      values: {
        input: get('input').value,
        textarea: get('textarea').value,
        select: get('select').value,
        tags: get('tags').value,
        color: get('color').value,
        step: get('step').value,
        checkbox: get('checkbox').checked,
        radio: get('radio').checked,
        switch: get('switch').checked,
        range: [get('range').valueLow, get('range').valueHigh],
        slider: get('slider').value,
        files: Array.from(get('file').files ?? [], (file: File) => file.name)
      },
      defaults: {
        input: get('input').defaultValue,
        textarea: get('textarea').defaultValue,
        select: get('select').defaultValue,
        tags: get('tags').defaultValue,
        color: get('color').defaultValue,
        step: get('step').defaultValue,
        checkbox: get('checkbox').defaultChecked,
        radio: get('radio').defaultChecked,
        switch: get('switch').defaultChecked,
        range: [get('range').defaultValueLow, get('range').defaultValueHigh],
        slider: get('slider').defaultValue
      },
      attributes: {
        input: get('input').getAttribute('value'),
        textarea: get('textarea').getAttribute('value'),
        select: get('select').getAttribute('value'),
        tags: get('tags').getAttribute('value'),
        color: get('color').getAttribute('value'),
        step: get('step').getAttribute('value'),
        checkbox: get('checkbox').hasAttribute('checked'),
        radio: get('radio').hasAttribute('checked'),
        switch: get('switch').hasAttribute('checked'),
        range: [get('range').getAttribute('value-low'), get('range').getAttribute('value-high')],
        slider: get('slider').getAttribute('value')
      },
      entries: entries(document.querySelector('#reset-contract') as HTMLFormElement)
    };
  });
}

const initialValues = {
  input: 'alpha', textarea: 'alpha', select: 'alpha', tags: ['alpha'], color: '#112233', step: 2,
  checkbox: true, radio: true, switch: false, range: [20, 80], slider: 20, files: []
};

const initialDefaults = {
  input: 'alpha', textarea: 'alpha', select: 'alpha', tags: ['alpha'], color: '#112233', step: 2,
  checkbox: true, radio: true, switch: false, range: [20, 80], slider: 20
};

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`preserves pre-upgrade live values and authored defaults through ${build}`, async ({ page }) => {
    const result = await loadControls(page, build);
    expect(result.scalar).toEqual([
      { id: 'input', value: 'runtime', defaultValue: 'authored', ownsValue: false, attribute: 'authored' },
      { id: 'textarea', value: 'runtime', defaultValue: 'authored', ownsValue: false, attribute: 'authored' },
      { id: 'select', value: 'runtime', defaultValue: 'authored', ownsValue: false, attribute: 'authored' },
      { id: 'tags', value: ['runtime'], defaultValue: ['authored'], ownsValue: false, attribute: '["authored"]' },
      { id: 'color', value: '#445566', defaultValue: '#112233', ownsValue: false, attribute: '#112233' },
      { id: 'step', value: 4, defaultValue: 2, ownsValue: false, attribute: '2' },
      { id: 'slider', value: 40, defaultValue: 20, ownsValue: false, attribute: '20' }
    ]);
    expect(result.range).toEqual({ values: [30, 70], defaults: [20, 80], owns: [false, false], attributes: ['20', '80'] });
    expect(result.checked).toEqual([
      { id: 'checkbox', checked: false, defaultChecked: true, ownsChecked: false, attribute: true },
      { id: 'radio', checked: false, defaultChecked: true, ownsChecked: false, attribute: true },
      { id: 'switch', checked: false, defaultChecked: true, ownsChecked: false, attribute: true }
    ]);
  });

  test(`restores current authored defaults after customer changes through ${build}`, async ({ page }) => {
    await loadControls(page, build);
    await installForm(page);
    const initial = await snapshot(page);
    expect(initial.values).toEqual(initialValues);
    expect(initial.defaults).toEqual(initialDefaults);

    await page.locator('#reset-input').locator('.input').fill('dirty input');
    await page.locator('#reset-textarea').locator('.textarea').fill('dirty textarea');
    await page.evaluate(() => {
      const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
      get('select').selectOption('beta');
      get('tags').clear();
      get('tags').addTag('dirty');
      const color = get('color').shadowRoot.querySelector('.color-input') as HTMLInputElement;
      color.value = '#445566';
      color.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      const step = get('step').shadowRoot.querySelector('input') as HTMLInputElement;
      step.value = '4';
      step.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      get('checkbox').shadowRoot.querySelector('input').click();
      get('radio').checked = false;
      get('switch').shadowRoot.querySelector('input').click();
      get('range').valueLow = 30;
      get('range').valueHigh = 70;
      get('slider').value = 40;
    });
    await page.locator('#reset-file').locator('.file-input').setInputFiles([
      { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
      { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') }
    ]);
    await page.evaluate(async () => {
      const controls = Array.from(document.querySelectorAll<any>('#reset-contract [id^="reset-"]'));
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
      get('input').setAttribute('value', 'next input');
      get('textarea').defaultValue = 'next textarea';
      get('select').setAttribute('value', 'alpha');
      get('tags').defaultValue = ['next'];
      get('color').setAttribute('value', '#778899');
      get('step').defaultValue = 6;
      get('checkbox').defaultChecked = false;
      get('radio').removeAttribute('checked');
      get('switch').defaultChecked = true;
      get('range').defaultValueLow = 10;
      get('range').setAttribute('value-high', '90');
      get('slider').setAttribute('value', '60');
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
    });

    const dirty = await snapshot(page);
    expect(dirty.values).toEqual({
      input: 'dirty input', textarea: 'dirty textarea', select: 'beta', tags: ['dirty'], color: '#445566', step: 4,
      checkbox: false, radio: false, switch: true, range: [30, 70], slider: 40, files: ['a.txt', 'b.txt']
    });
    expect(dirty.defaults).toEqual({
      input: 'next input', textarea: 'next textarea', select: 'alpha', tags: ['next'], color: '#778899', step: 6,
      checkbox: false, radio: false, switch: true, range: [10, 90], slider: 60
    });

    await page.evaluate(() => {
      const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
      get('tags').suggestions = ['draft suggestion'];
      const drafts: Array<[HTMLInputElement, string, boolean]> = [
        [get('tags').shadowRoot.querySelector('.tag-input-field'), 'draft', true],
        [get('color').shadowRoot.querySelector('.color-input'), 'not-a-color', true],
        [get('step').shadowRoot.querySelector('.step-input__input'), '9', false],
        [get('select').shadowRoot.querySelector('.select-editable-input'), 'draft', true]
      ];
      for (const [input, value, dispatch] of drafts) {
        input.value = value;
        if (dispatch) input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      }
    });

    const resetEvents = await page.evaluate(async () => {
      const events: string[] = [];
      const form = document.querySelector('#reset-contract') as HTMLFormElement;
      for (const control of Array.from(form.querySelectorAll('[id^="reset-"]'))) {
        for (const type of [
          'input', 'change', 'input-input', 'input-change', 'textarea-input', 'textarea-change', 'select-change',
          'tag-change', 'color-picker-input', 'color-picker-change', 'value-change', 'checkbox-change', 'radio-change',
          'switch-change', 'range-change', 'slider-input', 'slider-change', 'file-upload-change', 'select-close'
        ]) control.addEventListener(type, () => events.push(`${control.id}:${type}`));
      }
      form.reset();
      const controls = Array.from(form.querySelectorAll<any>('[id^="reset-"]'));
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      form.reset();
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      return events;
    });
    expect(resetEvents).toEqual([]);

    const reset = await snapshot(page);
    expect(reset.values).toEqual({ ...initialValues, ...{
      input: 'next input', textarea: 'next textarea', tags: ['next'], color: '#778899', step: 6,
      checkbox: false, radio: false, switch: true, range: [10, 90], slider: 60
    }});
    expect(reset.defaults).toEqual(dirty.defaults);
    expect(reset.entries).toEqual([
      ['input', 'next input'], ['textarea', 'next textarea'], ['select', 'alpha'], ['tags', '["next"]'],
      ['color', '#778899'], ['step', '6'], ['switch', 'yes'], ['range', '10,90'], ['slider', '60']
    ]);
    expect(await page.evaluate(() => {
      const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
      return {
        tags: get('tags').shadowRoot.querySelector('.tag-input-field')?.value,
        tagSuggestions: Boolean(get('tags').shadowRoot.querySelector('.tag-suggestions')),
        color: get('color').shadowRoot.querySelector('.color-input')?.value,
        nativeColor: get('color').shadowRoot.querySelector('.native-input')?.value,
        step: get('step').shadowRoot.querySelector('.step-input__input')?.value,
        select: get('select').shadowRoot.querySelector('.select-editable-input')?.value,
        selectOpen: get('select').isOpen
      };
    })).toEqual({
      tags: '', tagSuggestions: false, color: '#778899', nativeColor: '#778899',
      step: '6', select: 'Alpha', selectOpen: false
    });
  });

  test(`keeps defaults across state restoration, disconnects, form moves, and fieldsets through ${build}`, async ({ page }) => {
    await loadControls(page, build);
    await installForm(page);
    const result = await page.evaluate(async () => {
      const source = document.querySelector('#reset-contract') as HTMLFormElement;
      const target = document.querySelector('#reset-move-target') as HTMLFormElement;
      const controls = Array.from(source.querySelectorAll<any>('[id^="reset-"]:not(button)'));
      const events: string[] = [];
      for (const control of controls) {
        for (const type of ['input', 'change', 'tag-change', 'range-change', 'slider-change', 'file-upload-change']) {
          control.addEventListener(type, () => events.push(`${control.id}:${type}`));
        }
      }
      const get = (id: string) => document.querySelector(`#reset-${id}`) as any;
      get('input').formStateRestoreCallback('restored input');
      get('textarea').formStateRestoreCallback('restored textarea');
      get('select').formStateRestoreCallback('beta');
      get('tags').formStateRestoreCallback('["restored"]');
      get('color').formStateRestoreCallback('#abcdef');
      get('step').formStateRestoreCallback('8');
      get('checkbox').formStateRestoreCallback('unchecked');
      get('radio').formStateRestoreCallback('unchecked');
      get('switch').formStateRestoreCallback('checked');
      get('range').formStateRestoreCallback('35,75');
      get('slider').formStateRestoreCallback('80');
      get('file').formStateRestoreCallback(new File(['restored'], 'restored.txt', { type: 'text/plain' }));
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      const restoredEvents = [...events];

      const fragment = document.createDocumentFragment();
      for (const control of controls) fragment.append(control);
      target.append(fragment);
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const moved = controls.map(control => ({
        id: control.id,
        form: control.internals?.form?.id ?? null,
        authoredDisabled: control.disabled,
        disabledAttribute: control.hasAttribute('disabled')
      }));
      const sourceEntries = Array.from(new FormData(source).entries()).length;
      const targetEntries = Array.from(new FormData(target).entries()).map(([name, value]) => [name, value instanceof File ? value.name : String(value)]);

      const fieldset = document.createElement('fieldset');
      fieldset.disabled = true;
      target.append(fieldset);
      for (const control of controls) fieldset.append(control);
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const disabled = controls.map(control => ({
        id: control.id,
        authoredDisabled: control.disabled,
        disabledAttribute: control.hasAttribute('disabled'),
        enabledShadowInputs: control.shadowRoot?.querySelectorAll('input:not(:disabled), textarea:not(:disabled), button:not(:disabled)').length ?? 0,
        enabledTabStops: Array.from(control.shadowRoot?.querySelectorAll<HTMLElement>('[tabindex]') ?? []).filter(node => node.tabIndex >= 0).length
      }));
      fieldset.disabled = false;
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      target.reset();
      await Promise.all(controls.map(control => control.rendered).filter(Boolean));
      return { restoredEvents, moved, sourceEntries, targetEntries, disabled, finalEvents: events };
    });

    expect(result.restoredEvents).toEqual([]);
    expect(result.moved.every(item => item.form === 'reset-move-target' && !item.authoredDisabled && !item.disabledAttribute)).toBe(true);
    expect(result.sourceEntries).toBe(0);
    expect(result.targetEntries).toEqual([
      ['input', 'restored input'], ['textarea', 'restored textarea'], ['select', 'beta'], ['tags', '["restored"]'],
      ['color', '#abcdef'], ['step', '8'], ['switch', 'yes'], ['range', '35,75'], ['slider', '80'], ['files', 'restored.txt']
    ]);
    expect(result.disabled.filter(item => item.authoredDisabled || item.disabledAttribute || item.enabledShadowInputs > 0 || item.enabledTabStops > 0)).toEqual([]);
    expect(result.finalEvents).toEqual([]);

    const reset = await snapshot(page);
    expect(reset.values).toEqual(initialValues);
    expect(reset.defaults).toEqual(initialDefaults);
  });

  test(`interrupts active slider gestures when a fieldset disables them through ${build}`, async ({ page }) => {
    await loadControls(page, build);
    await installForm(page);
    await page.evaluate(async () => {
      const form = document.querySelector('#reset-contract') as HTMLFormElement;
      const slider = document.querySelector('#reset-slider') as any;
      const range = document.querySelector('#reset-range') as any;
      const sliderFieldset = document.createElement('fieldset');
      const rangeFieldset = document.createElement('fieldset');
      sliderFieldset.id = 'active-slider-fieldset';
      rangeFieldset.id = 'active-range-fieldset';
      slider.before(sliderFieldset);
      range.before(rangeFieldset);
      sliderFieldset.append(slider);
      rangeFieldset.append(range);
      form.append(sliderFieldset, rangeFieldset);
      await Promise.all([slider.rendered, range.rendered]);
      (globalThis as any).__interruptedGestureEvents = [];
      slider.addEventListener('slider-input', () => (globalThis as any).__interruptedGestureEvents.push('slider-input'));
      slider.addEventListener('slider-change', () => (globalThis as any).__interruptedGestureEvents.push('slider-change'));
      range.addEventListener('range-change', () => (globalThis as any).__interruptedGestureEvents.push('range-change'));
    });

    const sliderThumb = page.locator('#reset-slider').locator('.slider-thumb');
    const sliderTrack = page.locator('#reset-slider').locator('.slider-track');
    const sliderThumbBox = (await sliderThumb.boundingBox())!;
    const sliderTrackBox = (await sliderTrack.boundingBox())!;
    await page.mouse.move(
      sliderThumbBox.x + sliderThumbBox.width / 2,
      sliderThumbBox.y + sliderThumbBox.height / 2
    );
    await page.mouse.down();
    await page.evaluate(() => {
      (document.querySelector('#active-slider-fieldset') as HTMLFieldSetElement).disabled = true;
    });
    await page.mouse.move(sliderTrackBox.x + sliderTrackBox.width - 1, sliderTrackBox.y + sliderTrackBox.height / 2);
    await page.mouse.up();

    const rangeThumb = page.locator('#reset-range').locator('.range-slider__thumb--low');
    const rangeTrack = page.locator('#reset-range').locator('.range-slider__track');
    const rangeThumbBox = (await rangeThumb.boundingBox())!;
    const rangeTrackBox = (await rangeTrack.boundingBox())!;
    await page.mouse.move(
      rangeThumbBox.x + rangeThumbBox.width / 2,
      rangeThumbBox.y + rangeThumbBox.height / 2
    );
    await page.mouse.down();
    await page.evaluate(() => {
      (document.querySelector('#active-range-fieldset') as HTMLFieldSetElement).disabled = true;
    });
    await page.mouse.move(rangeTrackBox.x + rangeTrackBox.width - 1, rangeTrackBox.y + rangeTrackBox.height / 2);
    await page.mouse.up();

    expect(await page.evaluate(() => {
      const slider = document.querySelector('#reset-slider') as any;
      const range = document.querySelector('#reset-range') as any;
      return {
        slider: slider.value,
        sliderDragging: slider.shadowRoot.querySelector('.slider-thumb--dragging') !== null,
        range: [range.valueLow, range.valueHigh],
        rangeDragging: range.shadowRoot.querySelector('.range-slider__thumb--dragging') !== null,
        events: (globalThis as any).__interruptedGestureEvents
      };
    })).toEqual({
      slider: 20,
      sliderDragging: false,
      range: [20, 80],
      rangeDragging: false,
      events: []
    });
  });
}
