import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import '../../packages/components/src/radio/snice-radio';
import type { SniceRadioElement } from '../../packages/components/src/radio/snice-radio.types';

type TestRadio = SniceRadioElement & {
  ready: Promise<void>;
  rendered: Promise<void>;
  formAssociatedCallback(form?: HTMLFormElement | null): void;
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

async function createRadio({
  attributes = {},
  properties = {},
  beforeConnect = {},
  parent = document.body
}: {
  attributes?: Record<string, string | boolean>;
  properties?: Partial<TestRadio>;
  beforeConnect?: Partial<TestRadio>;
  parent?: ParentNode;
} = {}) {
  const radio = document.createElement('snice-radio') as TestRadio;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false) continue;
    radio.setAttribute(name, value === true ? '' : value);
  }
  Object.assign(radio, beforeConnect);
  parent.appendChild(radio);
  await radio.ready;
  Object.assign(radio, properties);
  await radio.rendered;
  return radio;
}

function inputFor(radio: TestRadio) {
  return radio.shadowRoot!.querySelector<HTMLInputElement>('.radio-input')!;
}

function internalsFor(radio: TestRadio) {
  return internalsByElement.get(radio)!;
}

// happy-dom does not implement the radio input/change activation sequence.
// Emulate only that native input primitive here; the permanent Playwright
// matrix runs the same contract against all three real browser engines.
function emulateNativeActivation(radio: TestRadio) {
  const input = inputFor(radio);
  vi.spyOn(input, 'click').mockImplementation(() => {
    if (input.disabled || input.checked) return;
    input.checked = true;
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

describe('snice-radio rendering and public state', () => {
  it('keeps the real receiver and constructor during disconnect coordination', async () => {
    const radio = await createRadio();
    const Radio = radio.constructor as typeof HTMLElement & { scheduleRootSync?: Function };

    expect(typeof Radio.scheduleRootSync).toBe('function');
    radio.remove();
    await Promise.resolve();
    await Promise.resolve();

    expect(radio.constructor).toBe(Radio);
  });

  it('renders a native radio with native-compatible defaults', async () => {
    const radio = await createRadio();
    const input = inputFor(radio);

    expect(radio.tagName).toBe('SNICE-RADIO');
    expect(radio.checked).toBe(false);
    expect(radio.defaultChecked).toBe(false);
    expect(radio.disabled).toBe(false);
    expect(radio.loading).toBe(false);
    expect(radio.required).toBe(false);
    expect(radio.invalid).toBe(false);
    expect(radio.variant).toBe('default');
    expect(radio.size).toBe('medium');
    expect(radio.name).toBe('');
    expect(radio.value).toBe('on');
    expect(radio.label).toBe('');
    expect(radio.description).toBe('');
    expect(radio.type).toBe('radio');
    expect(input.type).toBe('radio');
    expect(input.value).toBe('on');
    expect(input.checked).toBe(false);
  });

  it.each(['small', 'medium', 'large'] as const)('renders the %s size', async size => {
    const radio = await createRadio({ attributes: { size, label: size } });
    expect(radio.shadowRoot!.querySelector('.radio')!.classList).toContain(`radio--${size}`);
    expect(radio.shadowRoot!.querySelector('.radio-label')!.classList).toContain(`radio-label--${size}`);
  });

  it('renders default labels and omits block-only content', async () => {
    const radio = await createRadio({ attributes: { label: 'Email', description: 'Not rendered inline' } });
    expect(radio.shadowRoot!.querySelector('.radio-label')!.textContent!.trim()).toBe('Email');
    expect(radio.shadowRoot!.querySelector('.radio-content')).toBeNull();
    expect(radio.shadowRoot!.querySelector('.radio-description')).toBeNull();
  });

  it('renders block labels, descriptions, and suffix content', async () => {
    const radio = document.createElement('snice-radio') as TestRadio;
    radio.setAttribute('variant', 'block');
    radio.setAttribute('label', 'Pro');
    radio.setAttribute('description', 'For teams');
    const suffix = document.createElement('span');
    suffix.slot = 'suffix';
    suffix.textContent = '$12';
    radio.appendChild(suffix);
    document.body.appendChild(radio);
    await radio.ready;

    expect(radio.shadowRoot!.querySelector('.radio-wrapper')!.classList).toContain('radio-wrapper--block');
    expect(radio.shadowRoot!.querySelector('.radio-description')!.textContent!.trim()).toBe('For teams');
    expect(radio.shadowRoot!.querySelector('slot[name="suffix"]')).toBeTruthy();
    expect(radio.querySelector('[slot="suffix"]')!.textContent).toBe('$12');
  });

  it('renders loading and explicit invalid states without confusing them with validity', async () => {
    const radio = await createRadio({ attributes: { label: 'Pending', loading: true, invalid: true } });
    expect(radio.shadowRoot!.querySelector('.radio-spinner')).toBeTruthy();
    expect(radio.shadowRoot!.querySelector('.radio-dot')).toBeNull();
    expect(radio.shadowRoot!.querySelector('.radio')!.classList).toContain('radio--invalid');
    expect(inputFor(radio).disabled).toBe(true);
    expect(inputFor(radio).getAttribute('aria-invalid')).toBe('true');
    expect(radio.validity.valid).toBe(true);
  });

  it('renders the required indicator only on authored required radios', async () => {
    const required = await createRadio({ attributes: { name: 'required-label', label: 'Required', required: true } });
    const peer = await createRadio({ attributes: { name: 'required-label', label: 'Peer' } });
    expect(required.shadowRoot!.querySelector('.radio-label')!.classList).toContain('radio-label--required');
    expect(peer.shadowRoot!.querySelector('.radio-label')!.classList).not.toContain('radio-label--required');
    expect(inputFor(required).required).toBe(true);
    expect(inputFor(peer).required).toBe(true);
  });
});

describe('native checkedness and authored defaults', () => {
  it('uses the checked attribute as initial state and defaultChecked', async () => {
    const radio = await createRadio({ attributes: { checked: true } });
    expect(radio.checked).toBe(true);
    expect(radio.defaultChecked).toBe(true);
    expect(inputFor(radio).checked).toBe(true);
  });

  it('keeps live checked assignments separate from the checked attribute', async () => {
    const radio = await createRadio();
    radio.checked = true;
    await radio.rendered;
    expect(radio.checked).toBe(true);
    expect(radio.defaultChecked).toBe(false);
    expect(radio.hasAttribute('checked')).toBe(false);
    expect(inputFor(radio).checked).toBe(true);
  });

  it('reflects defaultChecked and updates clean live state', async () => {
    const radio = await createRadio();
    radio.defaultChecked = true;
    await radio.rendered;
    expect(radio.hasAttribute('checked')).toBe(true);
    expect(radio.checked).toBe(true);

    radio.defaultChecked = false;
    await radio.rendered;
    expect(radio.hasAttribute('checked')).toBe(false);
    expect(radio.checked).toBe(false);
  });

  it('does not let default changes overwrite dirty checkedness', async () => {
    const radio = await createRadio();
    radio.checked = false;
    radio.defaultChecked = true;
    await radio.rendered;
    expect(radio.checked).toBe(false);
    expect(radio.defaultChecked).toBe(true);
  });

  it('marks checkedness dirty even when assigned its current value', async () => {
    const radio = await createRadio();
    radio.checked = false;
    radio.setAttribute('checked', '');
    await radio.rendered;
    expect(radio.defaultChecked).toBe(true);
    expect(radio.checked).toBe(false);
  });

  it('adopts checked property bindings made before connection', async () => {
    const radio = await createRadio({ beforeConnect: { checked: true } });
    expect(radio.checked).toBe(true);
    expect(radio.defaultChecked).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(radio, 'checked')).toBe(false);
    radio.checked = false;
    expect(radio.checked).toBe(false);
  });

  it('restores each authored group default without emitting events', async () => {
    const first = await createRadio({ attributes: { name: 'reset', value: 'first', checked: true } });
    const second = await createRadio({ attributes: { name: 'reset', value: 'second' } });
    second.checked = true;
    const events: string[] = [];
    for (const radio of [first, second]) {
      radio.addEventListener('input', () => events.push('input'));
      radio.addEventListener('change', () => events.push('change'));
      radio.addEventListener('radio-change', () => events.push('radio-change'));
    }

    first.formResetCallback();
    second.formResetCallback();
    expect([first.checked, second.checked]).toEqual([true, false]);
    expect(events).toEqual([]);
  });

  it('uses tree order when a reset group contains multiple authored defaults', async () => {
    const first = await createRadio({ attributes: { name: 'multi-default', checked: true } });
    const second = await createRadio({ attributes: { name: 'multi-default', checked: true } });
    first.checked = true;

    first.formResetCallback();
    second.formResetCallback();
    expect([first.checked, second.checked]).toEqual([false, true]);
    expect([first.defaultChecked, second.defaultChecked]).toEqual([true, true]);
  });

  it('restores checked and unchecked session state silently', async () => {
    const first = await createRadio({ attributes: { name: 'restore', value: 'first' } });
    const second = await createRadio({ attributes: { name: 'restore', value: 'second', checked: true } });
    const listener = vi.fn();
    first.addEventListener('radio-change', listener);

    first.formStateRestoreCallback('checked', 'restore');
    expect([first.checked, second.checked]).toEqual([true, false]);
    first.formStateRestoreCallback('unchecked', 'restore');
    expect(first.checked).toBe(false);
    first.formStateRestoreCallback(new FormData(), 'restore');
    expect(first.checked).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('radio group identity and coordination', () => {
  it('allows only the last programmatically checked group member', async () => {
    const first = await createRadio({ attributes: { name: 'plan', value: 'first' } });
    const second = await createRadio({ attributes: { name: 'plan', value: 'second' } });
    const third = await createRadio({ attributes: { name: 'plan', value: 'third' } });

    first.checked = true;
    second.checked = true;
    third.checked = true;
    expect([first.checked, second.checked, third.checked]).toEqual([false, false, true]);
  });

  it('does not emit events while programmatic selection unchecks peers', async () => {
    const first = await createRadio({ attributes: { name: 'silent', checked: true } });
    const second = await createRadio({ attributes: { name: 'silent' } });
    const listener = vi.fn();
    first.addEventListener('change', listener);
    first.addEventListener('radio-change', listener);
    second.checked = true;
    expect(first.checked).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps empty names and different names independent', async () => {
    const anonymousA = await createRadio();
    const anonymousB = await createRadio();
    const namedA = await createRadio({ attributes: { name: 'a' } });
    const namedB = await createRadio({ attributes: { name: 'b' } });
    for (const radio of [anonymousA, anonymousB, namedA, namedB]) radio.checked = true;
    expect([anonymousA, anonymousB, namedA, namedB].every(radio => radio.checked)).toBe(true);
  });

  it('keeps identical names in different form owners independent', async () => {
    const formA = document.createElement('form');
    const formB = document.createElement('form');
    document.body.append(formA, formB);
    const first = await createRadio({ attributes: { name: 'choice' }, parent: formA });
    const second = await createRadio({ attributes: { name: 'choice' }, parent: formB });

    first.checked = true;
    second.checked = true;
    expect([first.checked, second.checked]).toEqual([true, true]);
    expect([first.form, second.form]).toEqual([formA, formB]);
  });

  it('coordinates an external form-associated radio with its owner group', async () => {
    const form = document.createElement('form');
    form.id = 'owner:with[selector] syntax';
    document.body.appendChild(form);
    const inside = await createRadio({ attributes: { name: 'external', checked: true }, parent: form });
    const external = await createRadio({
      attributes: { name: 'external', form: form.id }
    });

    external.checked = true;
    expect([inside.checked, external.checked]).toEqual([false, true]);
    expect([inside.form, external.form]).toEqual([form, form]);
  });

  it('keeps matching groups in different shadow roots independent', async () => {
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');
    document.body.append(hostA, hostB);
    const rootA = hostA.attachShadow({ mode: 'open' });
    const rootB = hostB.attachShadow({ mode: 'open' });
    const first = await createRadio({ attributes: { name: 'shadow', checked: true }, parent: rootA });
    const second = await createRadio({ attributes: { name: 'shadow', checked: true }, parent: rootB });
    expect([first.checked, second.checked]).toEqual([true, true]);
  });

  it('coordinates matching radios inside the same shadow root', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const first = await createRadio({ attributes: { name: 'shadow', checked: true }, parent: root });
    const second = await createRadio({ attributes: { name: 'shadow' }, parent: root });
    second.checked = true;
    expect([first.checked, second.checked]).toEqual([false, true]);
  });

  it('reconciles a checked radio when its name changes into another group', async () => {
    const first = await createRadio({ attributes: { name: 'old', checked: true } });
    const second = await createRadio({ attributes: { name: 'new', checked: true } });
    first.name = 'new';
    await first.rendered;
    expect([first.checked, second.checked]).toEqual([true, false]);
  });

  it('reconciles checkedness after disconnect and reinsertion', async () => {
    const first = await createRadio({ attributes: { name: 'reconnect', checked: true } });
    const second = await createRadio({ attributes: { name: 'reconnect' } });
    first.remove();
    second.checked = true;
    document.body.appendChild(first);
    await Promise.resolve();
    expect([first.checked, second.checked]).toEqual([true, false]);
  });
});

describe('form value and group validity', () => {
  it('contributes only checked state with the configured value and restore token', async () => {
    const radio = await createRadio({ attributes: { name: 'plan', value: 'pro' } });
    const internals = internalsFor(radio);
    expect(internals.formValue).toBeNull();
    expect(internals.state).toBe('unchecked');

    radio.checked = true;
    expect(internals.formValue).toBe('pro');
    expect(internals.state).toBe('checked');
    radio.checked = false;
    expect(internals.formValue).toBeNull();
    expect(internals.state).toBe('unchecked');
  });

  it('uses the native on value when value is omitted and preserves explicit empty values', async () => {
    const nativeDefault = await createRadio({ attributes: { checked: true } });
    const empty = await createRadio({ attributes: { value: '', checked: true } });
    expect(internalsFor(nativeDefault).formValue).toBe('on');
    expect(internalsFor(empty).formValue).toBe('');
  });

  it('updates the successful value without changing checkedness or emitting', async () => {
    const radio = await createRadio({ attributes: { value: 'old', checked: true } });
    const listener = vi.fn();
    radio.addEventListener('radio-change', listener);
    radio.value = 'new';
    expect(radio.checked).toBe(true);
    expect(inputFor(radio).value).toBe('new');
    expect(internalsFor(radio).formValue).toBe('new');
    expect(listener).not.toHaveBeenCalled();
  });

  it('makes every member value-missing when any group member is required', async () => {
    const required = await createRadio({ attributes: { name: 'validity', required: true } });
    const peer = await createRadio({ attributes: { name: 'validity' } });
    expect(required.validity.valueMissing).toBe(true);
    expect(peer.validity.valueMissing).toBe(true);
    expect(required.checkValidity()).toBe(false);
    expect(peer.reportValidity()).toBe(false);

    peer.checked = true;
    expect(required.validity.valueMissing).toBe(false);
    expect(peer.validity.valueMissing).toBe(false);
    expect(required.validationMessage).toBe('');
  });

  it('treats an anonymous required radio as a one-control group', async () => {
    const radio = await createRadio({ attributes: { required: true } });
    expect(radio.validity.valueMissing).toBe(true);
    radio.checked = true;
    expect(radio.validity.valid).toBe(true);
  });

  it('keeps a disabled required member in the group requirement', async () => {
    const required = await createRadio({ attributes: { name: 'disabled-required', required: true, disabled: true } });
    const peer = await createRadio({ attributes: { name: 'disabled-required' } });
    internalsFor(required).willValidate = false;
    required.formDisabledCallback(true);
    expect(required.validity.valueMissing).toBe(true);
    expect(peer.validity.valueMissing).toBe(true);
    expect(required.willValidate).toBe(false);
    expect(required.checkValidity()).toBe(true);
    expect(inputFor(required).getAttribute('aria-invalid')).toBe('false');
    expect(peer.checkValidity()).toBe(false);
  });

  it('lets a disabled checked member satisfy group requiredness', async () => {
    const required = await createRadio({ attributes: { name: 'disabled-checked', required: true } });
    const checked = await createRadio({ attributes: { name: 'disabled-checked', checked: true, disabled: true } });
    expect(required.validity.valueMissing).toBe(false);
    expect(checked.validity.valueMissing).toBe(false);
  });

  it('recomputes old and new group validity after a dynamic name change', async () => {
    const first = await createRadio({ attributes: { name: 'first', required: true } });
    const selected = await createRadio({ attributes: { name: 'first', checked: true } });
    const other = await createRadio({ attributes: { name: 'second', required: true } });
    expect(first.validity.valid).toBe(true);
    expect(other.validity.valueMissing).toBe(true);

    selected.name = 'second';
    await selected.rendered;
    expect(first.validity.valueMissing).toBe(true);
    expect(other.validity.valid).toBe(true);
  });

  it('supports custom validity independently on each group member', async () => {
    const first = await createRadio({ attributes: { name: 'custom', checked: true } });
    const second = await createRadio({ attributes: { name: 'custom' } });
    first.setCustomValidity('Choose another option');
    expect(first.validity.customError).toBe(true);
    expect(first.validationMessage).toBe('Choose another option');
    expect(second.validity.valid).toBe(true);
    expect(internalsFor(first).anchor).toBe(inputFor(first));

    first.loading = true;
    expect(first.validity.customError).toBe(true);
    expect(first.willValidate).toBe(true);
    expect(first.checkValidity()).toBe(false);
    expect(inputFor(first).getAttribute('aria-invalid')).toBe('true');
    first.loading = false;
    expect(first.validity.customError).toBe(true);

    first.setCustomValidity('');
    expect(first.validity.valid).toBe(true);
  });

  it('exposes native form, validity, validation, and labels APIs', async () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    const radio = await createRadio({ attributes: { required: true }, parent: form });
    const internals = internalsFor(radio);
    internals.form = form;
    internals.labels = document.querySelectorAll('label');
    radio.formAssociatedCallback(form);

    expect(radio.form).toBe(form);
    expect(radio.validity).toBe(internals.validity);
    expect(radio.validationMessage).toBe(internals.validationMessage);
    expect(radio.willValidate).toBe(true);
    expect(radio.labels).toBe(internals.labels);
    expect(radio.checkValidity()).toBe(false);
    expect(radio.reportValidity()).toBe(false);
    expect(internals.checkValidity).toHaveBeenCalled();
    expect(internals.reportValidity).toHaveBeenCalled();
  });
});

describe('disabled fieldset and interaction state', () => {
  it('keeps fieldset-disabled state separate from authored disabled state', async () => {
    const radio = await createRadio({ attributes: { checked: true } });
    radio.formDisabledCallback(true);
    await radio.rendered;
    expect(radio.disabled).toBe(false);
    expect(radio.hasAttribute('disabled')).toBe(false);
    expect(inputFor(radio).disabled).toBe(true);
    expect(radio.shadowRoot!.querySelector('.radio-wrapper')!.classList).toContain('radio-wrapper--disabled');

    radio.formDisabledCallback(false);
    await radio.rendered;
    expect(inputFor(radio).disabled).toBe(false);
    expect(radio.checked).toBe(true);
  });

  it('preserves authored disabled state when a fieldset becomes enabled', async () => {
    const radio = await createRadio({ attributes: { disabled: true } });
    radio.formDisabledCallback(true);
    radio.formDisabledCallback(false);
    expect(radio.disabled).toBe(true);
    expect(radio.hasAttribute('disabled')).toBe(true);
    expect(inputFor(radio).disabled).toBe(true);
  });

  it('blocks disabled, loading, and fieldset-disabled activation', async () => {
    const radio = await createRadio();
    emulateNativeActivation(radio);
    radio.disabled = true;
    radio.click();
    expect(radio.checked).toBe(false);
    radio.disabled = false;
    radio.loading = true;
    radio.click();
    expect(radio.checked).toBe(false);
    radio.loading = false;
    radio.formDisabledCallback(true);
    radio.click();
    expect(radio.checked).toBe(false);
  });

  it('removes blocked radios from the roving tab stop', async () => {
    const first = await createRadio({ attributes: { name: 'tabs', checked: true } });
    const second = await createRadio({ attributes: { name: 'tabs' } });
    expect([inputFor(first).tabIndex, inputFor(second).tabIndex]).toEqual([0, -1]);
    first.disabled = true;
    await first.rendered;
    expect([inputFor(first).tabIndex, inputFor(second).tabIndex]).toEqual([-1, 0]);
  });
});

describe('activation events and public methods', () => {
  it('surfaces input, change, and radio-change in stable order', async () => {
    const radio = await createRadio({ attributes: { value: 'pro' } });
    emulateNativeActivation(radio);
    const events: Array<{ type: string; checked: boolean; detail?: unknown }> = [];
    for (const type of ['input', 'change', 'radio-change']) {
      radio.addEventListener(type, event => {
        events.push({
          type,
          checked: radio.checked,
          detail: event instanceof CustomEvent ? event.detail : undefined
        });
      });
    }

    radio.click();
    expect(events.map(event => event.type)).toEqual(['input', 'change', 'radio-change']);
    expect(events.every(event => event.checked)).toBe(true);
    expect(events[2].detail).toEqual({ checked: true, value: 'pro', radio });
  });

  it('emits activation events only from the newly selected radio', async () => {
    const first = await createRadio({ attributes: { name: 'events', checked: true } });
    const second = await createRadio({ attributes: { name: 'events' } });
    emulateNativeActivation(first);
    emulateNativeActivation(second);
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    first.addEventListener('radio-change', firstListener);
    second.addEventListener('radio-change', secondListener);
    second.click();
    expect([first.checked, second.checked]).toEqual([false, true]);
    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledOnce();
  });

  it('does not emit input/change/custom events when activating an already checked radio', async () => {
    const radio = await createRadio({ attributes: { checked: true } });
    emulateNativeActivation(radio);
    const listener = vi.fn();
    radio.addEventListener('input', listener);
    radio.addEventListener('change', listener);
    radio.addEventListener('radio-change', listener);
    radio.click();
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps direct assignments and authored-default changes silent', async () => {
    const radio = await createRadio();
    const listener = vi.fn();
    radio.addEventListener('input', listener);
    radio.addEventListener('change', listener);
    radio.addEventListener('radio-change', listener);
    radio.checked = true;
    radio.defaultChecked = true;
    radio.value = 'updated';
    expect(listener).not.toHaveBeenCalled();
  });

  it('uses native activation for select and is idempotent once selected', async () => {
    const radio = await createRadio();
    emulateNativeActivation(radio);
    const listener = vi.fn();
    radio.addEventListener('radio-change', listener);
    radio.select();
    radio.select();
    expect(radio.checked).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('forwards focus and blur to the native radio', async () => {
    const radio = await createRadio();
    radio.focus();
    expect(radio.shadowRoot!.activeElement).toBe(inputFor(radio));
    radio.blur();
    expect(radio.shadowRoot!.activeElement).toBeNull();
  });
});

describe('keyboard group navigation', () => {
  it.each([
    ['ArrowRight', 1],
    ['ArrowDown', 1],
    ['ArrowLeft', 2],
    ['ArrowUp', 2]
  ] as const)('uses %s to select the expected wrapped member', async (key, expectedIndex) => {
    const radios = await Promise.all([
      createRadio({ attributes: { name: `keyboard-${key}`, checked: true } }),
      createRadio({ attributes: { name: `keyboard-${key}` } }),
      createRadio({ attributes: { name: `keyboard-${key}` } })
    ]);
    radios.forEach(emulateNativeActivation);
    inputFor(radios[0]).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    expect(radios.map(radio => radio.checked)).toEqual(radios.map((_, index) => index === expectedIndex));
    await radios[expectedIndex].rendered;
    expect(radios[expectedIndex].shadowRoot!.querySelector('.radio')!.classList)
      .toContain('radio--keyboard-focus');
  });

  it('skips disabled and loading radios during arrow navigation', async () => {
    const first = await createRadio({ attributes: { name: 'keyboard-skip', checked: true } });
    const disabled = await createRadio({ attributes: { name: 'keyboard-skip', disabled: true } });
    const loading = await createRadio({ attributes: { name: 'keyboard-skip', loading: true } });
    const last = await createRadio({ attributes: { name: 'keyboard-skip' } });
    [first, disabled, loading, last].forEach(emulateNativeActivation);
    inputFor(first).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    expect([first.checked, disabled.checked, loading.checked, last.checked]).toEqual([false, false, false, true]);
  });

  it('ignores arrows for anonymous radios and unrelated event targets', async () => {
    const radio = await createRadio();
    emulateNativeActivation(radio);
    radio.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    inputFor(radio).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    expect(radio.checked).toBe(false);
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/radio/snice-radio.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
