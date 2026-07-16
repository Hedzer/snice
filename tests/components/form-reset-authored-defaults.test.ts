import { afterEach, describe, expect, it } from 'vitest';
import { wait } from './test-utils';
import '../../packages/components/src/checkbox/snice-checkbox';
import '../../packages/components/src/radio/snice-radio';
import '../../packages/components/src/input/snice-input';
import '../../packages/components/src/textarea/snice-textarea';
import '../../packages/components/src/select/snice-select';
import '../../packages/components/src/tag-input/snice-tag-input';
import '../../packages/components/src/color-picker/snice-color-picker';
import '../../packages/components/src/step-input/snice-step-input';
import '../../packages/components/src/switch/snice-switch';
import '../../packages/components/src/range-slider/snice-range-slider';
import '../../packages/components/src/slider/snice-slider';
import '../../packages/components/src/file-upload/snice-file-upload';

type FormControl = HTMLElement & {
  ready: Promise<void>;
  rendered?: Promise<void>;
  formResetCallback(): void;
  formDisabledCallback(disabled: boolean): void;
  formStateRestoreCallback(state: File | string | FormData | null): void;
  disabled: boolean;
};

async function mount(tag: string, attributes: Record<string, string> = {}): Promise<FormControl & Record<string, any>> {
  const element = document.createElement(tag) as FormControl & Record<string, any>;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  await element.ready;
  await element.rendered;
  return element;
}

async function settle(element: FormControl) {
  await element.rendered;
  await wait(0);
}

function captureEvents(element: HTMLElement, names: string[]) {
  const events: string[] = [];
  for (const name of names) element.addEventListener(name, () => events.push(name));
  return events;
}

afterEach(() => {
  document.body.innerHTML = '';
});

const scalarControls = [
  {
    tag: 'snice-input', authored: 'alpha', dirty: 'dirty', next: 'next', restored: 'restored', empty: '',
    events: ['input', 'change', 'input-input', 'input-change', 'input-clear']
  },
  {
    tag: 'snice-textarea', authored: 'alpha', dirty: 'dirty', next: 'next', restored: 'restored', empty: '',
    events: ['input', 'change', 'textarea-input', 'textarea-change']
  },
  {
    tag: 'snice-select', authored: 'alpha', dirty: 'dirty', next: 'next', restored: 'restored', empty: '',
    events: ['input', 'change', 'select-change']
  },
  {
    tag: 'snice-color-picker', authored: '#112233', dirty: '#445566', next: '#778899', restored: '#abcdef', empty: '#000000',
    events: ['input', 'change', 'color-picker-input', 'color-picker-change']
  },
  {
    tag: 'snice-step-input', authored: 2, dirty: 4, next: 6, restored: 8, empty: 0,
    events: ['input', 'change', 'value-change']
  },
  {
    tag: 'snice-slider', authored: 20, dirty: 40, next: 60, restored: 80, empty: 0,
    events: ['input', 'change', 'slider-input', 'slider-change']
  }
] as const;

describe.each(scalarControls)('$tag authored reset defaults', control => {
  it('separates the live property from the value attribute and current default', async () => {
    const element = await mount(control.tag, { value: String(control.authored) });
    expect(element.value).toBe(control.authored);
    expect(element.defaultValue).toBe(control.authored);
    expect(element.getAttribute('value')).toBe(String(control.authored));

    element.value = control.dirty;
    await settle(element);
    expect(element.value).toBe(control.dirty);
    expect(element.defaultValue).toBe(control.authored);
    expect(element.getAttribute('value')).toBe(String(control.authored));

    element.setAttribute('value', String(control.next));
    await settle(element);
    expect(element.value).toBe(control.dirty);
    expect(element.defaultValue).toBe(control.next);

    const events = captureEvents(element, [...control.events]);
    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe(control.next);
    expect(element.defaultValue).toBe(control.next);
    expect(events).toEqual([]);

    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe(control.next);
    expect(events).toEqual([]);
  });

  it('tracks default mutations while pristine, including removal', async () => {
    const element = await mount(control.tag);
    element.defaultValue = control.next;
    await settle(element);
    expect(element.value).toBe(control.next);
    expect(element.getAttribute('value')).toBe(String(control.next));

    element.removeAttribute('value');
    await settle(element);
    expect(element.defaultValue).toBe(control.empty);
    expect(element.value).toBe(control.empty);
  });

  it('makes same-value live assignments dirty like the native value property', async () => {
    const element = await mount(control.tag, { value: String(control.authored) });
    element.value = control.authored;
    element.defaultValue = control.next;
    await settle(element);

    expect(element.value).toBe(control.authored);
    expect(element.defaultValue).toBe(control.next);

    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe(control.next);
  });

  it('preserves pre-connection live assignments and restores browser state silently', async () => {
    const element = document.createElement(control.tag) as FormControl & Record<string, any>;
    element.setAttribute('value', String(control.authored));
    element.value = control.dirty;
    document.body.append(element);
    await element.ready;
    await element.rendered;
    expect(element.value).toBe(control.dirty);
    expect(element.defaultValue).toBe(control.authored);

    const events = captureEvents(element, [...control.events]);
    element.formStateRestoreCallback(String(control.restored));
    await settle(element);
    expect(element.value).toBe(control.restored);
    expect(element.defaultValue).toBe(control.authored);
    expect(events).toEqual([]);

    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe(control.authored);
    expect(events).toEqual([]);
  });

  it('keeps inherited disabledness separate from authored disabled state', async () => {
    const element = await mount(control.tag, { value: String(control.authored) });
    element.formDisabledCallback(true);
    await settle(element);
    expect(element.disabled).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);

    element.formDisabledCallback(false);
    await settle(element);
    expect(element.disabled).toBe(false);
    expect(element.value).toBe(control.authored);
  });
});

describe.each(['snice-checkbox', 'snice-radio', 'snice-switch'])('%s checked reset defaults', tag => {
  it('keeps checked live and checked/defaultChecked authored', async () => {
    const element = await mount(tag, { checked: '' });
    expect(element.checked).toBe(true);
    expect(element.defaultChecked).toBe(true);

    element.checked = false;
    await settle(element);
    expect(element.hasAttribute('checked')).toBe(true);
    expect(element.defaultChecked).toBe(true);

    element.removeAttribute('checked');
    await settle(element);
    expect(element.checked).toBe(false);
    expect(element.defaultChecked).toBe(false);

    element.defaultChecked = true;
    expect(element.checked).toBe(false);
    const events = captureEvents(element, ['input', 'change', 'checkbox-change', 'radio-change', 'switch-change']);
    element.formResetCallback();
    await settle(element);
    expect(element.checked).toBe(true);
    expect(events).toEqual([]);
  });

  it('restores checkedness state without changing the authored default', async () => {
    const element = await mount(tag);
    element.formStateRestoreCallback('checked');
    await settle(element);
    expect(element.checked).toBe(true);
    expect(element.defaultChecked).toBe(false);
    element.formResetCallback();
    await settle(element);
    expect(element.checked).toBe(false);
  });
});

describe('snice-tag-input authored reset defaults', () => {
  it('uses a JSON value attribute as a cloned authored default', async () => {
    const element = await mount('snice-tag-input', { value: '["alpha","beta"]' });
    expect(element.value).toEqual(['alpha', 'beta']);
    expect(element.defaultValue).toEqual(['alpha', 'beta']);

    element.value = ['dirty'];
    element.setAttribute('value', '["next","default"]');
    await settle(element);
    expect(element.value).toEqual(['dirty']);
    expect(element.defaultValue).toEqual(['next', 'default']);

    const events = captureEvents(element, ['tag-add', 'tag-remove', 'tag-change']);
    element.formResetCallback();
    await settle(element);
    expect(element.value).toEqual(['next', 'default']);
    expect(events).toEqual([]);

    element.value.push('mutated-live-array');
    expect(element.defaultValue).toEqual(['next', 'default']);
  });

  it('handles pristine mutations, malformed restoration, valid restoration, and removal', async () => {
    const element = await mount('snice-tag-input');
    element.defaultValue = ['pristine'];
    await settle(element);
    expect(element.value).toEqual(['pristine']);

    element.formStateRestoreCallback('not json');
    expect(element.value).toEqual(['pristine']);
    element.formStateRestoreCallback('["restored",2]');
    await settle(element);
    expect(element.value).toEqual(['restored', '2']);
    expect(element.defaultValue).toEqual(['pristine']);

    element.formResetCallback();
    element.removeAttribute('value');
    await settle(element);
    expect(element.value).toEqual([]);
    expect(element.defaultValue).toEqual([]);
  });

  it('makes a same-content live assignment dirty without sharing either array', async () => {
    const element = await mount('snice-tag-input', { value: '["authored"]' });
    const live = ['authored'];
    element.value = live;
    element.defaultValue = ['next'];
    live.push('outside mutation');
    await settle(element);

    expect(element.value).toEqual(['authored']);
    expect(element.defaultValue).toEqual(['next']);

    element.formResetCallback();
    await settle(element);
    expect(element.value).toEqual(['next']);
  });
});

describe('snice-range-slider authored reset defaults', () => {
  it('tracks each authored endpoint independently from live state', async () => {
    const element = await mount('snice-range-slider', { min: '0', max: '100', 'value-low': '20', 'value-high': '80' });
    expect([element.valueLow, element.valueHigh]).toEqual([20, 80]);
    expect([element.defaultValueLow, element.defaultValueHigh]).toEqual([20, 80]);

    element.valueLow = 30;
    element.valueHigh = 70;
    element.setAttribute('value-low', '10');
    element.defaultValueHigh = 90;
    await settle(element);
    expect([element.valueLow, element.valueHigh]).toEqual([30, 70]);
    expect([element.defaultValueLow, element.defaultValueHigh]).toEqual([10, 90]);
    expect([element.getAttribute('value-low'), element.getAttribute('value-high')]).toEqual(['10', '90']);

    const events = captureEvents(element, ['input', 'change', 'range-change']);
    element.formResetCallback();
    await settle(element);
    expect([element.valueLow, element.valueHigh]).toEqual([10, 90]);
    expect(events).toEqual([]);
  });

  it('restores, clamps, rejects malformed state, and resets repeatedly', async () => {
    const element = await mount('snice-range-slider', { min: '0', max: '100', step: '5', 'value-low': '20', 'value-high': '80' });
    element.formStateRestoreCallback('33,77');
    await settle(element);
    expect([element.valueLow, element.valueHigh]).toEqual([35, 75]);
    element.formStateRestoreCallback('bad');
    expect([element.valueLow, element.valueHigh]).toEqual([35, 75]);
    element.formResetCallback();
    element.formResetCallback();
    await settle(element);
    expect([element.valueLow, element.valueHigh]).toEqual([20, 80]);
  });

  it('dirties same-value endpoint assignments independently', async () => {
    const element = await mount('snice-range-slider', { min: '0', max: '100', 'value-low': '20', 'value-high': '80' });
    element.valueLow = 20;
    element.defaultValueLow = 10;
    element.defaultValueHigh = 90;
    await settle(element);

    expect([element.valueLow, element.valueHigh]).toEqual([20, 90]);
    expect([element.defaultValueLow, element.defaultValueHigh]).toEqual([10, 90]);

    element.formResetCallback();
    await settle(element);
    expect([element.valueLow, element.valueHigh]).toEqual([10, 90]);
  });
});

describe('snice-file-upload reset lifecycle', () => {
  it('has the native empty authored default and silently clears/restores files', async () => {
    const element = await mount('snice-file-upload', { name: 'attachments', multiple: '' });
    const first = new File(['a'], 'a.txt', { type: 'text/plain' });
    const second = new File(['b'], 'b.txt', { type: 'text/plain' });
    const state = new FormData();
    state.append('attachments', first);
    state.append('attachments', second);
    const events = captureEvents(element, ['input', 'change', 'file-upload-change', 'file-upload-error']);

    element.formStateRestoreCallback(state);
    await settle(element);
    expect(Array.from(element.files ?? [], (file: File) => file.name)).toEqual(['a.txt', 'b.txt']);
    expect(events).toEqual([]);

    element.formResetCallback();
    await settle(element);
    expect(element.files?.length).toBe(0);
    expect(events).toEqual([]);
    expect(element.getAttribute('value')).toBeNull();
  });

  it('restores one File, ignores string state as an empty native selection, and preserves authored disabledness', async () => {
    const element = await mount('snice-file-upload');
    element.formStateRestoreCallback(new File(['a'], 'a.txt'));
    await settle(element);
    expect(element.files?.[0]?.name).toBe('a.txt');
    element.formStateRestoreCallback('');
    expect(element.files?.length).toBe(0);

    element.formDisabledCallback(true);
    await settle(element);
    expect(element.disabled).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
    element.formDisabledCallback(false);
  });
});
