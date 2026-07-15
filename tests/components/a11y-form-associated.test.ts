import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';
import { expectFormCallbacks } from './a11y-helpers';

afterEach(() => { document.body.innerHTML = ''; });

// Theme 1: form-associated basics. Each component that can live inside a
// <form> must implement formResetCallback + formDisabledCallback and call
// attachInternals() so setFormValue works.

const COMPONENTS = [
  { tag: 'snice-range-slider', path: '../../packages/components/src/range-slider/snice-range-slider', resetField: 'valueLow', resetTo: 0, initial: { min: 0, max: 100, valueLow: 30, valueHigh: 70 } },
  { tag: 'snice-radio',        path: '../../packages/components/src/radio/snice-radio',                resetField: 'checked',  resetTo: false, initial: { checked: true, value: 'a' } },
  { tag: 'snice-checkbox',     path: '../../packages/components/src/checkbox/snice-checkbox',          resetField: 'checked',  resetTo: false, initial: { checked: true } },
  { tag: 'snice-color-picker', path: '../../packages/components/src/color-picker/snice-color-picker',  resetField: null,        resetTo: null,  initial: { value: '#ff0000' } },
  { tag: 'snice-step-input',   path: '../../packages/components/src/step-input/snice-step-input',      resetField: 'value',    resetTo: 0,     initial: { value: 5 } },
  { tag: 'snice-tag-input',    path: '../../packages/components/src/tag-input/snice-tag-input',        resetField: 'value',    resetTo: [],    initial: { value: ['a', 'b'] } },
  { tag: 'snice-file-upload',  path: '../../packages/components/src/file-upload/snice-file-upload',    resetField: null, resetTo: null, initial: {} }, // has its own reset path
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

    it('formDisabledCallback applies effective disabledness', async () => {
      await import(spec.path);
      const el = document.createElement(spec.tag) as any;
      for (const [k, v] of Object.entries(spec.initial)) el[k] = v;
      document.body.appendChild(el);
      await el.ready;
      el.formDisabledCallback(true);
      await el.rendered;
      if (spec.tag === 'snice-checkbox') {
        // Native input.disabled reflects only the authored attribute; a
        // disabled fieldset changes effective disabledness without rewriting
        // that property. The shadow input still becomes non-interactive.
        expect(el.disabled).toBe(false);
        expect(el.shadowRoot.querySelector('input').disabled).toBe(true);
      } else {
        expect(el.disabled).toBe(true);
      }
      el.formDisabledCallback(false);
      await el.rendered;
      expect(el.disabled).toBe(false);
    });
  });
}
