// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import '../../packages/components/src/input/snice-input';
import '../../packages/components/src/textarea/snice-textarea';
import '../../packages/components/src/select/snice-select';
import '../../packages/components/src/checkbox/snice-checkbox';
import '../../packages/components/src/radio/snice-radio';
import '../../packages/components/src/switch/snice-switch';
import '../../packages/components/src/slider/snice-slider';
import '../../packages/components/src/range-slider/snice-range-slider';
import '../../packages/components/src/date-picker/snice-date-picker';
import '../../packages/components/src/date-range-picker/snice-date-range-picker';
import '../../packages/components/src/date-time-picker/snice-date-time-picker';
import '../../packages/components/src/time-picker/snice-time-picker';
import '../../packages/components/src/file-upload/snice-file-upload';
import '../../packages/components/src/tag-input/snice-tag-input';
import '../../packages/components/src/step-input/snice-step-input';
import '../../packages/components/src/key-value/snice-key-value';
import '../../packages/components/src/color-picker/snice-color-picker';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('partial ElementInternals in jsdom', () => {
  const controls: Array<[string, (element: any) => void]> = [
    ['snice-input', element => { element.value = 'hello'; }],
    ['snice-textarea', element => { element.value = 'hello'; }],
    ['snice-select', element => { element.value = 'option-a'; }],
    ['snice-checkbox', element => { element.checked = true; }],
    ['snice-radio', element => { element.checked = true; }],
    ['snice-switch', element => { element.checked = true; }],
    ['snice-slider', element => { element.value = 25; }],
    ['snice-range-slider', element => { element.valueLow = 25; }],
    ['snice-date-picker', element => { element.value = '2026-08-03'; }],
    ['snice-date-range-picker', element => { element.start = '2026-08-03'; }],
    ['snice-date-time-picker', element => { element.value = '2026-08-03T14:30'; }],
    ['snice-time-picker', element => { element.value = '14:30'; }],
    ['snice-file-upload', element => { element.formAssociatedCallback(); }],
    ['snice-tag-input', element => { element.value = ['alpha']; }],
    ['snice-step-input', element => { element.value = 2; }],
    ['snice-key-value', element => { element.value = '[["key","value"]]'; }],
    ['snice-color-picker', element => { element.value = '#336699'; }]
  ];

  it.each(controls)('%s keeps its fallback usable', (tag, update) => {
    const element = document.createElement(tag) as any;

    expect(element.internals).toBeTruthy();
    expect(typeof element.internals.setFormValue).toBe('undefined');
    expect(typeof element.internals.setValidity).toBe('undefined');
    expect(() => update(element)).not.toThrow();
  });

  it.each(controls)('%s initializes and remains writable', async (tag, update) => {
    const element = document.createElement(tag) as any;
    document.body.appendChild(element);

    await expect(element.ready).resolves.toBeUndefined();
    expect(() => update(element)).not.toThrow();
    await element.rendered;
  });
});
