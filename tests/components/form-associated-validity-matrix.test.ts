import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/input/snice-input';
import '../../packages/components/src/textarea/snice-textarea';
import '../../packages/components/src/select/snice-select';
import '../../packages/components/src/switch/snice-switch';
import '../../packages/components/src/file-upload/snice-file-upload';
import '../../packages/components/src/color-picker/snice-color-picker';
import '../../packages/components/src/slider/snice-slider';
import '../../packages/components/src/range-slider/snice-range-slider';
import '../../packages/components/src/step-input/snice-step-input';
import '../../packages/components/src/tag-input/snice-tag-input';
import '../../packages/components/src/checkbox/snice-checkbox';
import '../../packages/components/src/radio/snice-radio';
import '../../packages/components/src/date-picker/snice-date-picker';
import '../../packages/components/src/date-range-picker/snice-date-range-picker';
import '../../packages/components/src/date-time-picker/snice-date-time-picker';
import '../../packages/components/src/time-picker/snice-time-picker';
import '../../packages/components/src/key-value/snice-key-value';
import { normalizeSteppedValue } from '../../packages/components/src/form-control-validity';

type MockInternals = {
  form: HTMLFormElement | null;
  labels: NodeList | null;
  validity: ValidityState;
  validationMessage: string;
  willValidate: boolean;
  setFormValue: ReturnType<typeof vi.fn>;
  setValidity: ReturnType<typeof vi.fn>;
  checkValidity: ReturnType<typeof vi.fn>;
  reportValidity: ReturnType<typeof vi.fn>;
};

const validityKeys = [
  'badInput', 'customError', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow',
  'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch', 'valueMissing'
] as const;

const originalAttachInternals = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'attachInternals');
let internalsByHost = new WeakMap<HTMLElement, MockInternals>();

function validity(flags: ValidityStateFlags = {}): ValidityState {
  const result: Record<string, boolean> = {};
  for (const key of validityKeys) result[key] = Boolean(flags[key]);
  result.valid = !validityKeys.some(key => result[key]);
  return result as unknown as ValidityState;
}

function createInternals(): MockInternals {
  const mock = {
    form: null,
    labels: null,
    validity: validity(),
    validationMessage: '',
    willValidate: true,
    setFormValue: vi.fn(),
    setValidity: vi.fn(),
    checkValidity: vi.fn(),
    reportValidity: vi.fn()
  } as MockInternals;
  mock.setValidity.mockImplementation((flags: ValidityStateFlags = {}, message = '') => {
    mock.validity = validity(flags);
    mock.validationMessage = message;
  });
  mock.checkValidity.mockImplementation(() => !mock.willValidate || mock.validity.valid);
  mock.reportValidity.mockImplementation(() => !mock.willValidate || mock.validity.valid);
  return mock;
}

async function createControl(tag: string, properties: Record<string, unknown> = {}) {
  const element = document.createElement(tag) as any;
  Object.assign(element, properties);
  document.body.append(element);
  await element.ready;
  await element.rendered;
  await Promise.resolve();
  return element;
}

function mockFor(element: HTMLElement): MockInternals {
  const mock = internalsByHost.get(element);
  if (!mock) throw new Error(`No ElementInternals mock for ${element.localName}`);
  return mock;
}

beforeEach(() => {
  internalsByHost = new WeakMap();
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      const mock = createInternals();
      internalsByHost.set(this, mock);
      return mock;
    }
  });
});

afterEach(() => {
  document.body.replaceChildren();
  if (originalAttachInternals) {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', originalAttachInternals);
  } else {
    delete (HTMLElement.prototype as any).attachInternals;
  }
});

describe('form-associated validity matrix', () => {
  it('exposes the complete native-style host API on every remaining control', async () => {
    const tags = [
      'snice-input', 'snice-textarea', 'snice-select', 'snice-switch',
      'snice-file-upload', 'snice-color-picker', 'snice-slider',
      'snice-range-slider', 'snice-step-input', 'snice-tag-input',
      'snice-checkbox', 'snice-radio', 'snice-date-picker',
      'snice-date-range-picker', 'snice-date-time-picker', 'snice-time-picker',
      'snice-key-value'
    ];
    const anchorSelectors: Record<string, string> = {
      'snice-input': '.input',
      'snice-textarea': '.textarea',
      'snice-select': '.select-trigger',
      'snice-switch': '.switch-input',
      'snice-file-upload': '.file-input',
      'snice-color-picker': '.color-input',
      'snice-slider': '.slider-thumb',
      'snice-range-slider': '.range-slider__thumb--low',
      'snice-step-input': '.step-input__input',
      'snice-tag-input': '.tag-input-field',
      'snice-checkbox': '.checkbox-input',
      'snice-radio': '.radio-input',
      'snice-date-picker': '.input',
      'snice-date-range-picker': '.input',
      'snice-date-time-picker': '.input',
      'snice-time-picker': '.input',
      'snice-key-value': '.kv__input'
    };
    const form = document.createElement('form');
    document.body.append(form);

    for (const tag of tags) {
      const label = document.createElement('label');
      const element = document.createElement(tag) as any;
      element.id = `${tag}-matrix`;
      element.name = tag;
      label.htmlFor = element.id;
      label.textContent = tag;
      form.append(label, element);
      await element.ready;
      await element.rendered;
      mockFor(element).form = form;
      mockFor(element).labels = document.querySelectorAll(`label[for="${element.id}"]`);

      expect(element.form, tag).toBe(form);
      expect(element.labels?.length, tag).toBe(1);
      expect(typeof element.validity.valid, tag).toBe('boolean');
      expect(typeof element.validationMessage, tag).toBe('string');
      expect(typeof element.willValidate, tag).toBe('boolean');
      expect(element.checkValidity(), tag).toBe(true);
      expect(element.reportValidity(), tag).toBe(true);

      element.setCustomValidity(`invalid ${tag}`);
      expect(element.checkValidity(), tag).toBe(false);
      expect(mockFor(element).validity.customError, tag).toBe(true);
      expect(element.validationMessage, tag).toBe(`invalid ${tag}`);
      expect(mockFor(element).setValidity.mock.calls.at(-1)?.[2], tag)
        .toBe(element.shadowRoot.querySelector(anchorSelectors[tag]));
      element.setCustomValidity('');
      expect(element.checkValidity(), tag).toBe(true);
    }
  });

  it('maps input and textarea native constraints to ElementInternals and clears them dynamically', async () => {
    const input = await createControl('snice-input', { required: true });
    expect(input.checkValidity()).toBe(false);
    expect(mockFor(input).validity.valueMissing).toBe(true);
    expect(input.shadowRoot.querySelector('.input').getAttribute('aria-invalid')).toBe('true');

    input.value = 'customer';
    expect(mockFor(input).validity.valueMissing).toBe(false);
    expect(Object.fromEntries(validityKeys.map(key => [key, mockFor(input).validity[key]]))).toEqual(
      Object.fromEntries(validityKeys.map(key => [key, false]))
    );
    expect(input.checkValidity()).toBe(true);
    input.type = 'email';
    input.value = 'not-an-email';
    await input.rendered;
    expect(input.checkValidity()).toBe(false);
    expect(mockFor(input).validity.typeMismatch).toBe(true);
    input.value = 'person@example.com';
    expect(input.checkValidity()).toBe(true);

    input.type = 'url';
    input.value = 'not a url';
    expect(input.checkValidity()).toBe(false);
    expect(input.validity.typeMismatch).toBe(true);
    input.value = 'https://example.com/path';
    expect(input.checkValidity()).toBe(true);

    input.type = 'text';
    input.pattern = '[A-Z]{3}';
    input.value = 'abc';
    expect(input.checkValidity()).toBe(false);
    expect(input.validity.patternMismatch).toBe(true);
    input.pattern = '';
    expect(input.checkValidity()).toBe(true);

    input.type = 'number';
    input.min = '10';
    input.max = '20';
    input.step = '2';
    input.value = '9';
    expect(input.validity.rangeUnderflow).toBe(true);
    input.value = '21';
    expect(input.validity.rangeOverflow).toBe(true);
    input.value = '11';
    expect(input.validity.stepMismatch).toBe(true);
    input.value = '12';
    expect(input.checkValidity()).toBe(true);
    input.value = 'not-a-number';
    expect(input.validity.badInput).toBe(true);
    expect(input.validationMessage.length).toBeGreaterThan(0);
    input.value = '12';
    expect(input.checkValidity()).toBe(true);
    input.min = '';
    input.max = '';
    input.step = '';
    expect(input.shadowRoot.querySelector('.input').hasAttribute('min')).toBe(false);
    expect(input.shadowRoot.querySelector('.input').hasAttribute('max')).toBe(false);
    expect(input.shadowRoot.querySelector('.input').hasAttribute('step')).toBe(false);

    const textarea = await createControl('snice-textarea', { required: true });
    expect(textarea.checkValidity()).toBe(false);
    expect(mockFor(textarea).validity.valueMissing).toBe(true);
    textarea.value = 'Complete';
    expect(textarea.checkValidity()).toBe(true);
    textarea.setCustomValidity('Server rejected this message.');
    expect(textarea.validity.customError).toBe(true);
    expect(textarea.shadowRoot.querySelector('.textarea').getAttribute('aria-invalid')).toBe('true');
    textarea.setCustomValidity('');
    expect(textarea.checkValidity()).toBe(true);
  });

  it('retains custom errors across barred states and restores them when controls become eligible', async () => {
    const configurations = [
      ['snice-input', 'disabled'],
      ['snice-textarea', 'readonly'],
      ['snice-select', 'loading'],
      ['snice-switch', 'disabled'],
      ['snice-file-upload', 'disabled'],
      ['snice-color-picker', 'loading'],
      ['snice-slider', 'readonly'],
      ['snice-range-slider', 'disabled'],
      ['snice-step-input', 'readonly'],
      ['snice-tag-input', 'readonly']
    ] as const;

    for (const [tag, barredProperty] of configurations) {
      const control = await createControl(tag);
      control.setCustomValidity(`Retained ${tag}`);
      expect(control.checkValidity(), tag).toBe(false);
      control[barredProperty] = true;
      expect(control.willValidate, tag).toBe(false);
      expect(control.checkValidity(), tag).toBe(true);
      control[barredProperty] = false;
      expect(control.checkValidity(), tag).toBe(false);
      expect(control.validationMessage, tag).toBe(`Retained ${tag}`);
      control.setCustomValidity('');
      expect(control.checkValidity(), tag).toBe(true);
    }
  });

  it('preserves user-only length validity across rerenders without applying it to programmatic values', async () => {
    const input = await createControl('snice-input', { minlength: 3, maxlength: 5 });
    const nativeInput = input.shadowRoot.querySelector('.input') as HTMLInputElement;
    nativeInput.value = 'ab';
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    await input.rendered;
    expect(input.validity.tooShort).toBe(true);
    expect(input.checkValidity()).toBe(false);
    expect(input.shadowRoot.querySelector('.input').getAttribute('aria-invalid')).toBe('true');

    nativeInput.value = 'abcdef';
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.validity.tooLong).toBe(true);
    expect(input.checkValidity()).toBe(false);

    input.value = 'x';
    expect(input.validity.tooShort).toBe(false);
    input.type = 'number';
    await input.rendered;
    const numericInput = input.shadowRoot.querySelector('.input') as HTMLInputElement;
    numericInput.value = '1';
    numericInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.validity.tooShort, JSON.stringify({
      componentType: input.type,
      nativeType: numericInput.type,
      componentValue: input.value,
      nativeValue: numericInput.value,
      validity: Object.fromEntries(validityKeys.map(key => [key, input.validity[key]]))
    })).toBe(false);

    const textarea = await createControl('snice-textarea', { minlength: 3, maxlength: 5 });
    const nativeTextarea = textarea.shadowRoot.querySelector('.textarea') as HTMLTextAreaElement;
    nativeTextarea.value = 'ab';
    nativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    await textarea.rendered;
    expect(textarea.validity.tooShort).toBe(true);
    expect(textarea.checkValidity()).toBe(false);
    nativeTextarea.value = 'abcdef';
    nativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(textarea.validity.tooLong).toBe(true);
    expect(textarea.checkValidity()).toBe(false);
    textarea.minlength = 2;
    textarea.maxlength = 6;
    expect(textarea.checkValidity()).toBe(true);
    textarea.value = 'x';
    textarea.minlength = 3;
    expect(textarea.validity.tooShort).toBe(false);
  });

  it('maps selection, switch, file, and color conditions without conflating visual invalid state', async () => {
    const select = await createControl('snice-select', {
      required: true,
      options: [{ value: 'a', label: 'Alpha' }]
    });
    expect(select.checkValidity()).toBe(false);
    expect(mockFor(select).validity.valueMissing).toBe(true);
    select.selectOption('a');
    expect(select.checkValidity()).toBe(true);
    select.multiple = true;
    select.clear();
    expect(select.validity.valueMissing).toBe(true);
    select.selectOption('a');
    expect(select.checkValidity()).toBe(true);

    const switchControl = await createControl('snice-switch', { required: true });
    expect(switchControl.checkValidity()).toBe(false);
    expect(mockFor(switchControl).validity.valueMissing).toBe(true);
    switchControl.checked = true;
    expect(switchControl.checkValidity()).toBe(true);

    const upload = await createControl('snice-file-upload', { required: true });
    expect(upload.checkValidity()).toBe(false);
    expect(mockFor(upload).validity.valueMissing).toBe(true);
    upload.invalid = true;
    await upload.rendered;
    expect(upload.validity.valueMissing).toBe(true);
    upload.required = false;
    expect(upload.checkValidity()).toBe(true);
    expect(upload.shadowRoot.querySelector('.upload-area').classList.contains('upload-area--invalid')).toBe(true);

    const color = await createControl('snice-color-picker');
    color.value = '#nope';
    expect(color.checkValidity()).toBe(false);
    expect(mockFor(color).validity.badInput).toBe(true);
    expect(color.validationMessage).toBe('Please enter a valid color.');
    color.value = 'rgb(256, 0, 0)';
    expect(color.validity.badInput).toBe(true);
    color.value = 'hsl(0, 101%, 50%)';
    expect(color.validity.badInput).toBe(true);
    color.value = 'rgb(255, 0, 1)';
    expect(color.value).toBe('#ff0001');
    expect(color.checkValidity()).toBe(true);
    color.value = 'RGB(255, 0, 1)';
    expect(color.value).toBe('#ff0001');
    color.value = 'hsl(-120, 100%, 50%)';
    expect(color.value).toBe('#0000ff');
    expect(color.checkValidity()).toBe(true);
    color.value = 'HSL(120, 100%, 50%)';
    expect(color.value).toBe('#00ff00');
    color.value = '';
    expect(color.checkValidity()).toBe(true);
    color.required = true;
    expect(color.validity.valueMissing).toBe(true);
    color.value = '#123456';
    expect(color.checkValidity()).toBe(true);
    expect(color.validity.valueMissing).toBe(false);

    const editableColor = color.shadowRoot.querySelector('.color-input') as HTMLInputElement;
    editableColor.value = 'rgb(nope)';
    editableColor.dispatchEvent(new Event('input', { bubbles: true }));
    expect(color.value).toBe('rgb(nope)');
    expect(color.validity.badInput).toBe(true);
    expect(editableColor.value).toBe('rgb(nope)');
  });

  it('turns rejected and dynamically disallowed file selections into actionable host validity', async () => {
    const upload = await createControl('snice-file-upload', { multiple: true, maxSize: 3, maxFiles: 2 });
    const input = upload.shadowRoot.querySelector('.file-input') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['large'], 'large.txt', { type: 'text/plain' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(upload.files.length).toBe(0);
    expect(upload.validity.customError).toBe(true);
    expect(upload.validationMessage).toContain('large.txt');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const validTransfer = new DataTransfer();
    validTransfer.items.add(new File(['a'], 'a.txt', { type: 'text/plain' }));
    validTransfer.items.add(new File(['b'], 'b.txt', { type: 'text/plain' }));
    input.files = validTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(upload.files.length).toBe(2);
    expect(upload.checkValidity()).toBe(true);

    upload.maxFiles = 1;
    expect(upload.validity.customError).toBe(true);
    expect(upload.validationMessage).toContain('Too many');
    upload.maxFiles = 2;
    expect(upload.checkValidity()).toBe(true);
    upload.maxSize = 0;
    expect(upload.checkValidity()).toBe(true);

    const single = await createControl('snice-file-upload', { maxFiles: 1 });
    const singleInput = single.shadowRoot.querySelector('.file-input') as HTMLInputElement;
    const first = new DataTransfer();
    first.items.add(new File(['first'], 'first.txt', { type: 'text/plain' }));
    singleInput.files = first.files;
    singleInput.dispatchEvent(new Event('change', { bubbles: true }));
    const replacement = new DataTransfer();
    replacement.items.add(new File(['second'], 'second.txt', { type: 'text/plain' }));
    singleInput.files = replacement.files;
    singleInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(Array.from(single.files, (file: File) => file.name)).toEqual(['second.txt']);
    expect(single.checkValidity()).toBe(true);
  });

  it('validates aggregate tag constraints and supports custom validity on numeric controls', async () => {
    const tags = await createControl('snice-tag-input', { maxTags: 2 });
    tags.value = ['one', 'two', 'three'];
    await tags.rendered;
    expect(tags.checkValidity()).toBe(false);
    expect(mockFor(tags).validity.tooLong).toBe(true);
    const removeButton = tags.shadowRoot.querySelector('.tag-remove') as HTMLButtonElement;
    expect(mockFor(tags).setValidity.mock.calls.at(-1)?.[2]).toBe(removeButton);
    const focus = vi.spyOn(removeButton, 'focus');
    const blur = vi.spyOn(removeButton, 'blur');
    tags.focus();
    tags.blur();
    expect(focus).toHaveBeenCalledOnce();
    expect(blur).toHaveBeenCalledOnce();
    tags.value = ['same', 'same'];
    await tags.rendered;
    expect(tags.checkValidity()).toBe(false);
    expect(mockFor(tags).validity.customError).toBe(true);
    expect(mockFor(tags).setValidity.mock.calls.at(-1)?.[2])
      .toBe(tags.shadowRoot.querySelector('.tag-remove'));
    tags.allowDuplicates = true;
    expect(tags.checkValidity()).toBe(true);
    expect(tags.shadowRoot.querySelector('.tag-input-container').getAttribute('aria-invalid')).toBe('false');

    const unlimited = await createControl('snice-tag-input', { maxTags: -1 });
    unlimited.value = ['one'];
    await unlimited.rendered;
    expect(unlimited.shadowRoot.querySelector('.tag-input-field')).not.toBeNull();
    unlimited.addTag('two');
    expect(unlimited.value).toEqual(['one', 'two']);
    expect(unlimited.checkValidity()).toBe(true);

    for (const tag of ['snice-slider', 'snice-range-slider', 'snice-step-input']) {
      const control = await createControl(tag);
      control.setCustomValidity('Outside the permitted business rule.');
      expect(control.checkValidity(), tag).toBe(false);
      expect(mockFor(control).validity.customError, tag).toBe(true);
      control.setCustomValidity('');
      expect(control.checkValidity(), tag).toBe(true);
    }
  });

  it('refreshes conditional validation anchors after color and select mode renders', async () => {
    const color = await createControl('snice-color-picker', { required: true, value: '' });
    color.showInput = false;
    await color.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFor(color).setValidity.mock.calls.at(-1)?.[2])
      .toBe(color.shadowRoot.querySelector('.color-swatch'));
    color.showInput = true;
    await color.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFor(color).setValidity.mock.calls.at(-1)?.[2])
      .toBe(color.shadowRoot.querySelector('.color-input'));

    const select = await createControl('snice-select', {
      required: true,
      options: [{ value: 'a', label: 'Alpha' }]
    });
    select.editable = true;
    await select.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFor(select).setValidity.mock.calls.at(-1)?.[2])
      .toBe(select.shadowRoot.querySelector('.select-editable-input'));
    select.editable = false;
    await select.rendered;
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFor(select).setValidity.mock.calls.at(-1)?.[2])
      .toBe(select.shadowRoot.querySelector('.select-trigger'));
  });

  it('normalizes every numeric control on a min-based lattice without invalid edge output', async () => {
    expect(normalizeSteppedValue(Number.MAX_VALUE, Number.MAX_VALUE / 2, Infinity, Number.MAX_VALUE))
      .toBe(Number.MAX_VALUE);

    const slider = await createControl('snice-slider', { min: 1, max: 9, step: 2, value: 2 });
    expect(slider.value).toBe(3);
    expect(slider.checkValidity()).toBe(true);
    slider.value = 8;
    expect(slider.value).toBe(9);
    slider.max = 8;
    expect(slider.value).toBe(7);
    slider.step = 0;
    slider.value = 6.6;
    expect(slider.value).toBe(7);
    slider.min = 5;
    slider.max = 5;
    await slider.rendered;
    expect(slider.value).toBe(5);
    expect(slider.shadowRoot.querySelector('.slider-thumb').getAttribute('style')).not.toContain('NaN');
    slider.value = Infinity;
    expect(slider.value).toBe(5);

    const range = await createControl('snice-range-slider', {
      min: 1,
      max: 9,
      step: 2,
      defaultValueLow: 2,
      defaultValueHigh: 8
    });
    expect([range.valueLow, range.valueHigh]).toEqual([3, 9]);
    expect(range.checkValidity()).toBe(true);
    range.valueLow = -Infinity;
    range.valueHigh = Infinity;
    expect([range.valueLow, range.valueHigh]).toEqual([3, 9]);
    range.max = 1;
    await range.rendered;
    expect([range.valueLow, range.valueHigh]).toEqual([1, 1]);
    expect(range.shadowRoot.querySelector('.range-slider__thumb--low').getAttribute('style')).not.toContain('NaN');
    expect(range.shadowRoot.querySelector('.range-slider__thumb--high').getAttribute('style')).not.toContain('NaN');

    const step = await createControl('snice-step-input', { min: 1, max: 9, step: 2, value: 2 });
    expect(step.value).toBe(3);
    expect(step.checkValidity()).toBe(true);
    step.increment();
    expect(step.value).toBe(5);
    step.step = -2;
    step.increment();
    expect(step.value).toBe(6);
    step.value = NaN;
    expect(step.value).toBe(6);
  });

  it('keeps authored invalid visual while calculated errors and eligibility track native state', async () => {
    const slider = await createControl('snice-slider', { invalid: true, errorText: 'Review this value' });
    const thumb = () => slider.shadowRoot.querySelector('.slider-thumb');
    expect(slider.checkValidity()).toBe(true);
    expect(thumb().getAttribute('aria-invalid')).toBe('true');
    expect(thumb().classList.contains('slider-thumb--invalid')).toBe(true);

    slider.invalid = false;
    slider.setCustomValidity('Calculated error');
    await slider.rendered;
    expect(slider.checkValidity()).toBe(false);
    expect(thumb().getAttribute('aria-invalid')).toBe('true');
    slider.disabled = true;
    expect(slider.willValidate).toBe(false);
    expect(slider.checkValidity()).toBe(true);
    slider.disabled = false;
    expect(slider.checkValidity()).toBe(false);
    slider.readonly = true;
    expect(slider.willValidate).toBe(false);
    expect(slider.checkValidity()).toBe(true);
    slider.readonly = false;
    slider.setCustomValidity('');
    expect(slider.checkValidity()).toBe(true);
    expect(thumb().getAttribute('aria-invalid')).toBe('false');
  });

  it('projects calculated validity into checkbox, radio, date, and date-range accessibility state', async () => {
    const checkbox = await createControl('snice-checkbox', { required: true });
    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.shadowRoot.querySelector('.checkbox-input').getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.shadowRoot.querySelector('.checkbox').classList.contains('checkbox--invalid')).toBe(true);
    checkbox.checked = true;
    expect(checkbox.checkValidity()).toBe(true);
    expect(checkbox.shadowRoot.querySelector('.checkbox-input').getAttribute('aria-invalid')).toBe('false');

    const radio = await createControl('snice-radio', { required: true });
    expect(radio.validity.valueMissing).toBe(true);
    expect(radio.shadowRoot.querySelector('.radio-input').getAttribute('aria-invalid')).toBe('true');
    radio.checked = true;
    expect(radio.checkValidity()).toBe(true);

    radio.checked = false;
    radio.disabled = true;
    mockFor(radio).willValidate = false;
    expect(radio.willValidate).toBe(false);
    expect(radio.validity.valueMissing).toBe(true);
    expect(radio.shadowRoot.querySelector('.radio-input').getAttribute('aria-invalid')).toBe('false');
    expect(radio.checkValidity()).toBe(true);
    radio.disabled = false;
    mockFor(radio).willValidate = true;
    expect(radio.validity.valueMissing).toBe(true);

    const date = await createControl('snice-date-picker', { required: true });
    expect(date.validity.valueMissing).toBe(true);
    expect(date.shadowRoot.querySelector('.input').getAttribute('aria-invalid')).toBe('true');
    date.value = '2026-03-10';
    expect(date.checkValidity()).toBe(true);

    const range = await createControl('snice-date-range-picker', { required: true });
    expect(range.validity.valueMissing).toBe(true);
    expect(range.shadowRoot.querySelector('.input').getAttribute('aria-invalid')).toBe('true');
    range.start = '2026-03-10';
    range.end = '2026-03-11';
    expect(range.checkValidity()).toBe(true);
    expect(range.shadowRoot.querySelector('.input').getAttribute('aria-invalid')).toBe('false');
  });

  it('uses useful shadow validation anchors and never activates slider errors while valid', async () => {
    const input = await createControl('snice-input', { required: true });
    const inputCall = mockFor(input).setValidity.mock.calls.at(-1);
    expect(inputCall?.[2]).toBe(input.shadowRoot.querySelector('.input'));

    const slider = await createControl('snice-slider', {
      helperText: 'Choose a volume',
      errorText: 'Volume is rejected'
    });
    expect(slider.shadowRoot.querySelector('.error-text')).toBeNull();
    expect(slider.shadowRoot.querySelector('.helper-text')?.textContent).toBe('Choose a volume');
    slider.setCustomValidity('Volume is rejected');
    await slider.rendered;
    expect(slider.shadowRoot.querySelectorAll('[role="alert"]')).toHaveLength(1);
    expect(slider.shadowRoot.querySelector('.error-text')?.textContent).toBe('Volume is rejected');
    expect(mockFor(slider).setValidity.mock.calls.at(-1)?.[2]).toBe(slider.shadowRoot.querySelector('.slider-thumb'));
    slider.setCustomValidity('');
    await slider.rendered;
    expect(slider.shadowRoot.querySelector('.error-text')).toBeNull();
  });
});
