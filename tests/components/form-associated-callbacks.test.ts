import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Verify form-reset and form-disable callbacks exist and behave correctly
// on switch, slider, textarea, select, key-value (which previously declared
// ElementInternals but never called attachInternals).

describe('form-associated callbacks: switch', () => {
  it('formResetCallback resets checked', async () => {
    await import('../../packages/components/src/switch/snice-switch');
    const el = document.createElement('snice-switch') as any;
    el.checked = true;
    document.body.appendChild(el);
    await el.ready;
    expect(typeof el.formResetCallback).toBe('function');
    el.formResetCallback();
    expect(el.checked).toBe(false);
  });

  it('formDisabledCallback disables element', async () => {
    await import('../../packages/components/src/switch/snice-switch');
    const el = document.createElement('snice-switch') as any;
    document.body.appendChild(el);
    await el.ready;
    el.formDisabledCallback(true);
    expect(el.disabled).toBe(true);
  });
});

describe('form-associated callbacks: slider', () => {
  it('formResetCallback resets to min', async () => {
    await import('../../packages/components/src/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    el.min = 10;
    el.max = 90;
    el.value = 50;
    document.body.appendChild(el);
    await el.ready;
    expect(typeof el.formResetCallback).toBe('function');
    el.formResetCallback();
    expect(el.value).toBe(10);
  });

  it('formDisabledCallback disables element', async () => {
    await import('../../packages/components/src/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    document.body.appendChild(el);
    await el.ready;
    el.formDisabledCallback(true);
    expect(el.disabled).toBe(true);
  });
});

describe('form-associated callbacks: textarea', () => {
  it('formResetCallback clears value', async () => {
    await import('../../packages/components/src/textarea/snice-textarea');
    const el = document.createElement('snice-textarea') as any;
    el.value = 'hello';
    document.body.appendChild(el);
    await el.ready;
    expect(typeof el.formResetCallback).toBe('function');
    el.formResetCallback();
    expect(el.value).toBe('');
  });

  it('formDisabledCallback disables element', async () => {
    await import('../../packages/components/src/textarea/snice-textarea');
    const el = document.createElement('snice-textarea') as any;
    document.body.appendChild(el);
    await el.ready;
    el.formDisabledCallback(true);
    expect(el.disabled).toBe(true);
  });
});

describe('form-associated callbacks: select', () => {
  it('formResetCallback clears value', async () => {
    await import('../../packages/components/src/select/snice-select');
    const el = document.createElement('snice-select') as any;
    el.value = 'x';
    document.body.appendChild(el);
    await el.ready;
    expect(typeof el.formResetCallback).toBe('function');
    el.formResetCallback();
    expect(el.value).toBe('');
  });

  it('formDisabledCallback disables element', async () => {
    await import('../../packages/components/src/select/snice-select');
    const el = document.createElement('snice-select') as any;
    document.body.appendChild(el);
    await el.ready;
    el.formDisabledCallback(true);
    expect(el.disabled).toBe(true);
  });
});

describe('key-value: constructor attaches ElementInternals when supported', () => {
  it('constructor calls attachInternals if available', async () => {
    await import('../../packages/components/src/key-value/snice-key-value');

    // Install a minimal attachInternals so we can observe whether the
    // constructor calls it. Default happy-dom lacks this API.
    let attached = false;
    const origProto = (HTMLElement.prototype as any).attachInternals;
    (HTMLElement.prototype as any).attachInternals = function () {
      attached = true;
      return { setFormValue: () => {}, setValidity: () => {} };
    };

    try {
      const el = document.createElement('snice-key-value') as any;
      document.body.appendChild(el);
      await el.ready;
      expect(attached).toBe(true);
      expect(el.internals).toBeTruthy();
    } finally {
      if (origProto) (HTMLElement.prototype as any).attachInternals = origProto;
      else delete (HTMLElement.prototype as any).attachInternals;
    }
  });
});
