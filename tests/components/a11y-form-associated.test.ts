import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';
import { expectFormCallbacks } from './a11y-helpers';

afterEach(() => { document.body.innerHTML = ''; });

// Theme 1: form-associated basics. Each component that can live inside a
// <form> must implement formResetCallback + formDisabledCallback and call
// attachInternals() so setFormValue works.

const COMPONENTS = [
  { tag: 'snice-range-slider', path: '../../components/range-slider/snice-range-slider', resetField: 'valueLow', resetTo: 0, initial: { min: 0, max: 100, valueLow: 30, valueHigh: 70 } },
  { tag: 'snice-radio',        path: '../../components/radio/snice-radio',                resetField: 'checked',  resetTo: false, initial: { checked: true, value: 'a' } },
  { tag: 'snice-checkbox',     path: '../../components/checkbox/snice-checkbox',          resetField: 'checked',  resetTo: false, initial: { checked: true } },
  { tag: 'snice-color-picker', path: '../../components/color-picker/snice-color-picker',  resetField: null,        resetTo: null,  initial: { value: '#ff0000' } },
  { tag: 'snice-step-input',   path: '../../components/step-input/snice-step-input',      resetField: 'value',    resetTo: 0,     initial: { value: 5 } },
  { tag: 'snice-tag-input',    path: '../../components/tag-input/snice-tag-input',        resetField: 'value',    resetTo: [],    initial: { value: ['a', 'b'] } },
  { tag: 'snice-mentions',     path: '../../components/mentions/snice-mentions',          resetField: 'value',    resetTo: '',    initial: { value: 'hello @bob' } },
  { tag: 'snice-file-upload',  path: '../../components/file-upload/snice-file-upload',    resetField: null, resetTo: null, initial: {} }, // has its own reset path
];

for (const spec of COMPONENTS) {
  describe(`${spec.tag}: form-associated`, () => {
    it('exposes formResetCallback + formDisabledCallback', async () => {
      await import(spec.path);
      const el = document.createElement(spec.tag) as any;
      for (const [k, v] of Object.entries(spec.initial)) el[k] = v;
      document.body.appendChild(el);
      await el.ready;
      await wait(20);

      expectFormCallbacks(el);
    });

    it('formResetCallback restores initial state', async () => {
      if (!spec.resetField) return;
      await import(spec.path);
      const el = document.createElement(spec.tag) as any;
      for (const [k, v] of Object.entries(spec.initial)) el[k] = v;
      document.body.appendChild(el);
      await el.ready;
      await wait(20);

      el.formResetCallback();
      await wait(20);

      expect(el[spec.resetField]).toEqual(spec.resetTo);
    });

    it('formDisabledCallback sets disabled', async () => {
      await import(spec.path);
      const el = document.createElement(spec.tag) as any;
      for (const [k, v] of Object.entries(spec.initial)) el[k] = v;
      document.body.appendChild(el);
      await el.ready;
      el.formDisabledCallback(true);
      expect(el.disabled).toBe(true);
      el.formDisabledCallback(false);
      expect(el.disabled).toBe(false);
    });
  });
}
