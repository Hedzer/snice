import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/checkbox/snice-checkbox';
import type { SniceCheckboxElement } from '../../packages/components/src/checkbox/snice-checkbox.types';

type TestCheckbox = SniceCheckboxElement & {
  ready: Promise<void>;
  rendered: Promise<void>;
  formAssociatedCallback(form: HTMLFormElement | null): void;
  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: File | string | FormData | null, mode?: 'restore' | 'autocomplete'): void;
};

type MockValidity = ValidityState & Record<string, boolean>;

type MockInternals = {
  formValue: File | string | FormData | null;
  state: File | string | FormData | null;
  form: HTMLFormElement | null;
  validity: MockValidity;
  validationMessage: string;
  willValidate: boolean;
  labels: NodeList;
  anchor?: HTMLElement;
  setFormValue: ReturnType<typeof vi.fn>;
  setValidity: ReturnType<typeof vi.fn>;
  checkValidity: ReturnType<typeof vi.fn>;
  reportValidity: ReturnType<typeof vi.fn>;
};

const validityFlags = [
  'badInput',
  'customError',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valueMissing'
] as const;

const internalsByElement = new WeakMap<HTMLElement, MockInternals>();
const originalAttachInternals = HTMLElement.prototype.attachInternals;

function createValidity(flags: Partial<Record<(typeof validityFlags)[number], boolean>> = {}): MockValidity {
  const validity = Object.fromEntries(validityFlags.map(flag => [flag, Boolean(flags[flag])])) as MockValidity;
  validity.valid = validityFlags.every(flag => !validity[flag]);
  return validity;
}

function createMockInternals(): MockInternals {
  const internals = {
    formValue: null,
    state: null,
    form: null,
    validity: createValidity(),
    validationMessage: '',
    willValidate: true,
    labels: document.querySelectorAll('label'),
    setFormValue: vi.fn(),
    setValidity: vi.fn(),
    checkValidity: vi.fn(),
    reportValidity: vi.fn()
  } as MockInternals;

  internals.setFormValue.mockImplementation((value, state = value) => {
    internals.formValue = value;
    internals.state = state;
  });
  internals.setValidity.mockImplementation((flags = {}, message = '', anchor?: HTMLElement) => {
    internals.validity = createValidity(flags);
    internals.validationMessage = internals.validity.valid ? '' : message;
    internals.anchor = anchor;
  });
  internals.checkValidity.mockImplementation(() => !internals.willValidate || internals.validity.valid);
  internals.reportValidity.mockImplementation(() => !internals.willValidate || internals.validity.valid);
  return internals;
}

async function createCheckbox({
  attributes = {},
  properties = {},
  beforeConnect = {}
}: {
  attributes?: Record<string, string | boolean>;
  properties?: Partial<TestCheckbox>;
  beforeConnect?: Partial<TestCheckbox>;
} = {}) {
  const checkbox = document.createElement('snice-checkbox') as TestCheckbox;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false) continue;
    checkbox.setAttribute(name, value === true ? '' : value);
  }
  Object.assign(checkbox, beforeConnect);
  document.body.appendChild(checkbox);
  await checkbox.ready;
  Object.assign(checkbox, properties);
  await checkbox.rendered;
  return checkbox;
}

function inputFor(checkbox: TestCheckbox) {
  return checkbox.shadowRoot!.querySelector<HTMLInputElement>('.checkbox-input')!;
}

function internalsFor(checkbox: TestCheckbox) {
  return internalsByElement.get(checkbox)!;
}

// happy-dom toggles checkbox.checked for click(), but does not implement the
// browser's checkbox input/change sequence or indeterminate clearing. Install
// that native activation algorithm only in the event-contract unit tests; the
// permanent Playwright matrix exercises the engines' real implementation.
function emulateNativeActivation(checkbox: TestCheckbox) {
  const input = inputFor(checkbox);
  vi.spyOn(input, 'click').mockImplementation(() => {
    if (input.disabled) return;
    input.checked = !input.checked;
    input.indeterminate = false;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      const internals = createMockInternals();
      internalsByElement.set(this, internals);
      return internals;
    }
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  if (originalAttachInternals) {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
      configurable: true,
      value: originalAttachInternals
    });
  } else {
    delete (HTMLElement.prototype as any).attachInternals;
  }
});

describe('snice-checkbox rendering and public state', () => {
  it('renders a native checkbox with complete defaults', async () => {
    const checkbox = await createCheckbox();
    const input = inputFor(checkbox);

    expect(checkbox.tagName).toBe('SNICE-CHECKBOX');
    expect(checkbox.checked).toBe(false);
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.indeterminate).toBe(false);
    expect(checkbox.disabled).toBe(false);
    expect(checkbox.loading).toBe(false);
    expect(checkbox.required).toBe(false);
    expect(checkbox.invalid).toBe(false);
    expect(checkbox.size).toBe('medium');
    expect(checkbox.name).toBe('');
    expect(checkbox.value).toBe('on');
    expect(checkbox.label).toBe('');
    expect(checkbox.type).toBe('checkbox');
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBe(false);
    expect(input.value).toBe('on');
  });

  it.each(['small', 'medium', 'large'] as const)('renders the %s size', async size => {
    const checkbox = await createCheckbox({ attributes: { size } });
    expect(checkbox.shadowRoot!.querySelector('.checkbox')!.classList).toContain(`checkbox--${size}`);
  });

  it('renders label, required indicator, loading, and explicit invalid state', async () => {
    const checkbox = await createCheckbox({
      attributes: { label: 'Accept terms', required: true, loading: true, invalid: true }
    });

    expect(checkbox.shadowRoot!.querySelector('.checkbox-label')!.textContent!.trim()).toBe('Accept terms');
    expect(checkbox.shadowRoot!.querySelector('.checkbox-label')!.classList).toContain('checkbox-label--required');
    expect(checkbox.shadowRoot!.querySelector('.checkbox')!.classList).toContain('checkbox--invalid');
    expect(checkbox.shadowRoot!.querySelector('.checkbox-spinner')).toBeTruthy();
    expect(inputFor(checkbox).disabled).toBe(true);
    expect(inputFor(checkbox).getAttribute('aria-invalid')).toBe('true');
  });

  it('omits the optional label and spinner when they are not requested', async () => {
    const checkbox = await createCheckbox();
    expect(checkbox.shadowRoot!.querySelector('.checkbox-label')).toBeNull();
    expect(checkbox.shadowRoot!.querySelector('.checkbox-spinner')).toBeNull();
  });
});

describe('native checkedness and reset defaults', () => {
  it('uses the checked attribute as both initial state and defaultChecked', async () => {
    const checkbox = await createCheckbox({ attributes: { checked: true } });
    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(true);
    expect(inputFor(checkbox).checked).toBe(true);
  });

  it('keeps live checked assignments separate from the checked attribute', async () => {
    const checkbox = await createCheckbox();
    checkbox.checked = true;
    await checkbox.rendered;

    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);
    expect(inputFor(checkbox).checked).toBe(true);
  });

  it('reflects defaultChecked through the checked attribute', async () => {
    const checkbox = await createCheckbox();
    checkbox.defaultChecked = true;
    await checkbox.rendered;

    expect(checkbox.hasAttribute('checked')).toBe(true);
    expect(checkbox.checked).toBe(true);
    checkbox.defaultChecked = false;
    await checkbox.rendered;
    expect(checkbox.hasAttribute('checked')).toBe(false);
    expect(checkbox.checked).toBe(false);
  });

  it('updates current checkedness from default changes while state is clean', async () => {
    const checkbox = await createCheckbox();
    checkbox.setAttribute('checked', 'true');
    await checkbox.rendered;
    expect(checkbox.defaultChecked).toBe(true);
    expect(checkbox.checked).toBe(true);

    checkbox.removeAttribute('checked');
    await checkbox.rendered;
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.checked).toBe(false);
  });

  it('does not let default changes overwrite dirty checkedness', async () => {
    const checkbox = await createCheckbox();
    checkbox.checked = true;
    checkbox.defaultChecked = false;
    checkbox.defaultChecked = true;
    await checkbox.rendered;

    expect(checkbox.checked).toBe(true);
    checkbox.defaultChecked = false;
    await checkbox.rendered;
    expect(checkbox.checked).toBe(true);
  });

  it('marks checkedness dirty even when assigned its current value', async () => {
    const checkbox = await createCheckbox();
    checkbox.checked = false;
    checkbox.defaultChecked = true;
    await checkbox.rendered;

    expect(checkbox.defaultChecked).toBe(true);
    expect(checkbox.checked).toBe(false);
  });

  it('preserves a checked property assigned before connection as dirty state', async () => {
    const checkbox = await createCheckbox({ beforeConnect: { checked: true } });
    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(false);

    checkbox.defaultChecked = true;
    checkbox.defaultChecked = false;
    await checkbox.rendered;
    expect(checkbox.checked).toBe(true);
  });

  it('adopts a checked data property created before custom-element upgrade', async () => {
    const checkbox = document.createElement('snice-checkbox') as TestCheckbox;
    Object.defineProperty(checkbox, 'checked', {
      value: true,
      writable: true,
      enumerable: true,
      configurable: true
    });

    document.body.appendChild(checkbox);
    await checkbox.ready;
    await checkbox.rendered;

    expect(Object.prototype.hasOwnProperty.call(checkbox, 'checked')).toBe(false);
    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);
    expect(inputFor(checkbox).checked).toBe(true);
  });

  it('restores an unchecked authored default without firing events', async () => {
    const checkbox = await createCheckbox();
    const events: string[] = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    checkbox.checked = true;
    checkbox.formResetCallback();
    await checkbox.rendered;

    expect(checkbox.checked).toBe(false);
    expect(events).toEqual([]);
  });

  it('restores a checked authored default and preserves indeterminate', async () => {
    const checkbox = await createCheckbox({ attributes: { checked: true, indeterminate: true } });
    checkbox.checked = false;
    checkbox.formResetCallback();
    await checkbox.rendered;

    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(true);
    expect(checkbox.indeterminate).toBe(true);
    expect(inputFor(checkbox).indeterminate).toBe(true);
  });

  it('resets to a default changed after checkedness became dirty', async () => {
    const checkbox = await createCheckbox();
    checkbox.checked = true;
    checkbox.defaultChecked = false;
    checkbox.formResetCallback();
    expect(checkbox.checked).toBe(false);

    checkbox.defaultChecked = true;
    expect(checkbox.checked).toBe(true);
  });
});

describe('form value, restoration, and validity', () => {
  it('starts as a non-successful unchecked control with restorable state', async () => {
    const checkbox = await createCheckbox({ attributes: { name: 'terms' } });
    const internals = internalsFor(checkbox);
    expect(internals.formValue).toBeNull();
    expect(internals.state).toBe('unchecked');
  });

  it('contributes the default on value only while checked', async () => {
    const checkbox = await createCheckbox({ attributes: { name: 'terms' } });
    const internals = internalsFor(checkbox);

    checkbox.checked = true;
    expect(internals.formValue).toBe('on');
    expect(internals.state).toBe('checked');
    checkbox.checked = false;
    expect(internals.formValue).toBeNull();
    expect(internals.state).toBe('unchecked');
  });

  it.each(['accepted', '', '0', 'checked'])('uses the exact configured value %j', async value => {
    const checkbox = await createCheckbox({
      attributes: { name: 'terms', value, checked: true }
    });
    expect(internalsFor(checkbox).formValue).toBe(value);
  });

  it('updates the successful value immediately when value changes', async () => {
    const checkbox = await createCheckbox({ attributes: { checked: true, value: 'first' } });
    checkbox.value = 'second';
    expect(internalsFor(checkbox).formValue).toBe('second');
    expect(inputFor(checkbox).value).toBe('second');
  });

  it('keeps the shadow input name synchronized through name changes and removal', async () => {
    const checkbox = await createCheckbox({ attributes: { name: 'first' } });
    checkbox.name = 'second';
    expect(inputFor(checkbox).name).toBe('second');
    checkbox.removeAttribute('name');
    expect(inputFor(checkbox).name).toBe('');
  });

  it('restores checked and unchecked state silently and marks it dirty', async () => {
    const checkbox = await createCheckbox();
    const events: string[] = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    checkbox.formStateRestoreCallback('checked');
    expect(checkbox.checked).toBe(true);
    checkbox.defaultChecked = false;
    expect(checkbox.checked).toBe(true);

    checkbox.formStateRestoreCallback('unchecked');
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual([]);
  });

  it.each([null, new FormData(), new File(['x'], 'x.txt'), 'unknown'])('ignores unsupported restore state', async state => {
    const checkbox = await createCheckbox({ attributes: { checked: true } });
    checkbox.formStateRestoreCallback(state);
    expect(checkbox.checked).toBe(true);
  });

  it('resynchronizes submission state when associated with a form', async () => {
    const checkbox = await createCheckbox({ attributes: { checked: true, value: 'yes' } });
    const internals = internalsFor(checkbox);
    internals.setFormValue.mockClear();
    checkbox.formAssociatedCallback(document.createElement('form'));
    expect(internals.setFormValue).toHaveBeenLastCalledWith('yes', 'checked');
  });

  it('reports valueMissing for a required unchecked checkbox', async () => {
    const checkbox = await createCheckbox({ attributes: { required: true } });
    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.validity.valid).toBe(false);
    expect(checkbox.validationMessage).not.toBe('');
    expect(checkbox.checkValidity()).toBe(false);
    expect(internalsFor(checkbox).anchor).toBe(inputFor(checkbox));
  });

  it('clears valueMissing as soon as the checkbox becomes checked', async () => {
    const checkbox = await createCheckbox({ attributes: { required: true } });
    checkbox.checked = true;
    expect(checkbox.validity.valueMissing).toBe(false);
    expect(checkbox.validity.valid).toBe(true);
    expect(checkbox.validationMessage).toBe('');
    expect(checkbox.checkValidity()).toBe(true);
  });

  it('updates required validity dynamically', async () => {
    const checkbox = await createCheckbox();
    checkbox.required = true;
    expect(checkbox.validity.valueMissing).toBe(true);
    checkbox.required = false;
    expect(checkbox.validity.valid).toBe(true);
  });

  it('combines custom validity with native required validity', async () => {
    const checkbox = await createCheckbox({ attributes: { required: true } });
    checkbox.setCustomValidity('Accept the policy first.');
    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.validity.customError).toBe(true);
    expect(checkbox.validationMessage).toBe('Accept the policy first.');
    expect(inputFor(checkbox).validationMessage).toBe('Accept the policy first.');

    checkbox.checked = true;
    expect(checkbox.validity.valueMissing).toBe(false);
    expect(checkbox.validity.customError).toBe(true);
    checkbox.setCustomValidity('');
    expect(checkbox.validity.valid).toBe(true);
  });

  it('retains disabled flags and keeps loading validation-participating', async () => {
    const checkbox = await createCheckbox({ attributes: { required: true, disabled: true } });
    const internals = internalsFor(checkbox);
    internals.willValidate = false;

    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.willValidate).toBe(false);
    expect(checkbox.checkValidity()).toBe(true);
    expect(inputFor(checkbox).getAttribute('aria-invalid')).toBe('false');

    checkbox.setCustomValidity('Retained while disabled');
    expect(checkbox.validity.customError).toBe(true);
    expect(inputFor(checkbox).getAttribute('aria-invalid')).toBe('false');

    checkbox.disabled = false;
    internals.willValidate = true;
    expect(checkbox.checkValidity()).toBe(false);
    expect(inputFor(checkbox).getAttribute('aria-invalid')).toBe('true');

    checkbox.loading = true;
    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.validity.customError).toBe(true);
    expect(checkbox.willValidate).toBe(true);
    expect(checkbox.checkValidity()).toBe(false);
    expect(inputFor(checkbox).getAttribute('aria-invalid')).toBe('true');
    checkbox.loading = false;
    expect(checkbox.validity.valueMissing).toBe(true);
    expect(checkbox.validity.customError).toBe(true);
  });

  it('proxies form, labels, willValidate, checkValidity, and reportValidity', async () => {
    const checkbox = await createCheckbox();
    const internals = internalsFor(checkbox);
    const form = document.createElement('form');
    internals.form = form;
    internals.willValidate = false;

    expect(checkbox.form).toBe(form);
    expect(checkbox.labels).toBe(internals.labels);
    expect(checkbox.willValidate).toBe(false);
    expect(checkbox.checkValidity()).toBe(true);
    expect(checkbox.reportValidity()).toBe(true);
    expect(internals.checkValidity).toHaveBeenCalledTimes(1);
    expect(internals.reportValidity).toHaveBeenCalledTimes(1);
  });
});

describe('effective disabled state', () => {
  it('reflects authored disabled state and blocks activation', async () => {
    const checkbox = await createCheckbox({ attributes: { disabled: true } });
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));
    checkbox.click();

    expect(checkbox.disabled).toBe(true);
    expect(inputFor(checkbox).disabled).toBe(true);
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual([]);
  });

  it('treats loading as interaction-disabled without changing disabled', async () => {
    const checkbox = await createCheckbox({ attributes: { loading: true } });
    checkbox.toggle();
    expect(checkbox.disabled).toBe(false);
    expect(inputFor(checkbox).disabled).toBe(true);
    expect(checkbox.checked).toBe(false);
  });

  it('applies fieldset disabledness without overwriting the authored property or attribute', async () => {
    const checkbox = await createCheckbox();
    checkbox.formDisabledCallback(true);
    await checkbox.rendered;

    expect(checkbox.disabled).toBe(false);
    expect(checkbox.hasAttribute('disabled')).toBe(false);
    expect(inputFor(checkbox).disabled).toBe(true);
    expect(checkbox.shadowRoot!.querySelector('.checkbox-wrapper')!.classList).toContain('checkbox-wrapper--disabled');

    checkbox.formDisabledCallback(false);
    await checkbox.rendered;
    expect(inputFor(checkbox).disabled).toBe(false);
  });

  it('preserves authored disabledness after inherited disabledness is removed', async () => {
    const checkbox = await createCheckbox({ attributes: { disabled: true } });
    checkbox.formDisabledCallback(true);
    checkbox.formDisabledCallback(false);
    await checkbox.rendered;

    expect(checkbox.disabled).toBe(true);
    expect(checkbox.hasAttribute('disabled')).toBe(true);
    expect(inputFor(checkbox).disabled).toBe(true);
  });
});

describe('activation and event contract', () => {
  it('fires one input, one change, and one custom event in stable order', async () => {
    const checkbox = await createCheckbox();
    emulateNativeActivation(checkbox);
    const events: Array<{ type: string; checked: boolean; target: EventTarget | null }> = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, event => {
        events.push({ type, checked: checkbox.checked, target: event.target });
      });
    }

    checkbox.click();
    expect(events.map(event => event.type)).toEqual(['input', 'change', 'checkbox-change']);
    expect(events.every(event => event.checked)).toBe(true);
    expect(events.slice(1).every(event => event.target === checkbox)).toBe(true);
  });

  it('emits current checked and indeterminate state in checkbox-change detail', async () => {
    const checkbox = await createCheckbox({ attributes: { indeterminate: true } });
    emulateNativeActivation(checkbox);
    let detail: any;
    checkbox.addEventListener('checkbox-change', event => {
      detail = (event as CustomEvent).detail;
    });

    checkbox.click();
    expect(detail).toEqual({ checked: true, indeterminate: false, checkbox });
  });

  it('clears indeterminate through native activation', async () => {
    const checkbox = await createCheckbox({ attributes: { indeterminate: true } });
    emulateNativeActivation(checkbox);
    checkbox.click();
    await checkbox.rendered;

    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(false);
    expect(inputFor(checkbox).indeterminate).toBe(false);
  });

  it('makes toggle use the same activation and event path as click', async () => {
    const checkbox = await createCheckbox();
    emulateNativeActivation(checkbox);
    const events: string[] = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    checkbox.toggle();
    expect(checkbox.checked).toBe(true);
    expect(events).toEqual(['input', 'change', 'checkbox-change']);
  });

  it('keeps direct state assignments silent', async () => {
    const checkbox = await createCheckbox();
    const events: string[] = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    checkbox.checked = true;
    checkbox.indeterminate = true;
    checkbox.defaultChecked = true;
    checkbox.value = 'yes';
    expect(events).toEqual([]);
  });

  it('sets indeterminate without changing checkedness or dispatching events', async () => {
    const checkbox = await createCheckbox({ properties: { checked: true } });
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));

    checkbox.setIndeterminate();
    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(true);
    expect(events).toEqual([]);
  });

  it.each([
    ['authored disabled', { disabled: true }],
    ['loading', { loading: true }]
  ] as const)('does not activate while %s', async (_name, attributes) => {
    const checkbox = await createCheckbox({ attributes });
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));
    checkbox.click();
    checkbox.toggle();
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual([]);
  });

  it('does not activate while disabled through form ancestry', async () => {
    const checkbox = await createCheckbox();
    checkbox.formDisabledCallback(true);
    checkbox.click();
    expect(checkbox.checked).toBe(false);
  });

  it('ignores a synthetic change event when no state transition preceded it', async () => {
    const checkbox = await createCheckbox();
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));
    inputFor(checkbox).dispatchEvent(new Event('change', { bubbles: true }));
    expect(events).toEqual([]);
  });

  it('clicking the rendered label toggles exactly once', async () => {
    const checkbox = await createCheckbox({ attributes: { label: 'Terms' } });
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));
    (checkbox.shadowRoot!.querySelector('.checkbox-label') as HTMLElement).click();

    expect(checkbox.checked).toBe(true);
    expect(events).toEqual(['checkbox-change']);
  });

  it('forwards a host-targeted label activation to the native input once', async () => {
    const checkbox = await createCheckbox();
    emulateNativeActivation(checkbox);
    const events: string[] = [];
    for (const type of ['input', 'change', 'checkbox-change']) {
      checkbox.addEventListener(type, () => events.push(type));
    }

    checkbox.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    await Promise.resolve();

    expect(checkbox.checked).toBe(true);
    expect(checkbox.shadowRoot!.activeElement).toBe(inputFor(checkbox));
    expect(events).toEqual(['input', 'change', 'checkbox-change']);
  });

  it('honors cancellation of a host-targeted label activation', async () => {
    const checkbox = await createCheckbox();
    emulateNativeActivation(checkbox);
    const events: string[] = [];
    checkbox.addEventListener('checkbox-change', () => events.push('checkbox-change'));
    checkbox.addEventListener('click', event => event.preventDefault(), { once: true });

    checkbox.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    await Promise.resolve();

    expect(checkbox.checked).toBe(false);
    expect(checkbox.shadowRoot!.activeElement).toBe(inputFor(checkbox));
    expect(events).toEqual([]);
  });
});

describe('imperative API and lifecycle', () => {
  it('focuses and blurs the internal native input', async () => {
    const checkbox = await createCheckbox();
    checkbox.focus();
    expect(checkbox.shadowRoot!.activeElement).toBe(inputFor(checkbox));
    checkbox.blur();
    expect(checkbox.shadowRoot!.activeElement).toBeNull();
  });

  it('retains synchronized form and visual state across repeated connection', async () => {
    const checkbox = await createCheckbox({ attributes: { name: 'terms', value: 'yes' } });
    checkbox.remove();
    checkbox.checked = true;
    checkbox.indeterminate = true;
    document.body.appendChild(checkbox);
    await checkbox.rendered;

    expect(checkbox.checked).toBe(true);
    expect(inputFor(checkbox).checked).toBe(true);
    expect(inputFor(checkbox).indeterminate).toBe(true);
    expect(internalsFor(checkbox).formValue).toBe('yes');

    checkbox.remove();
    document.body.appendChild(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(internalsFor(checkbox).formValue).toBe('yes');
  });
});
