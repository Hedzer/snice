/**
 * Tests for the currency-input example from the docs.
 * Verifies that extending snice-input actually works end-to-end.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow } from './components/test-utils';

let counter = 0;
function tag() { return `test-currency-${++counter}-${Date.now()}`; }

describe('currency-input (extending snice-input)', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => { els.forEach(el => { try { removeComponent(el); } catch {} }); els = []; });

  async function setup() {
    const { element, property, watch, on, styles, css } = await import('snice');
    await import('../packages/components/src/input/snice-input');
    const { SniceInput } = await import('../packages/components/src/input/snice-input');


    const t = tag();

    @element(t)
    class CurrencyInput extends SniceInput {
      @property() currency = 'USD';

      @watch('currency')
      updatePrefix() {
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        (this as any).prefixIcon = symbols[(this as any).currency] || (this as any).currency;
      }

      connectedCallback() {
        super.connectedCallback();
        // Set initial prefix from default currency
        this.updatePrefix();
      }

      @on('blur')
      formatValue() {
        const num = parseFloat((this as any).value);
        if (!isNaN(num)) {
          (this as any).value = num.toFixed(2);
        }
      }

      @styles()
      currencyStyles() {
        return css`:host { --input-text-align: right; }`;
      }
    }

    return { tag: t, CurrencyInput };
  }

  it('inherits snice-input properties', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t, { label: 'Price', placeholder: '0.00' }));
    await el.ready;

    // Inherited from snice-input
    expect((el as any).label).toBe('Price');
    expect((el as any).placeholder).toBe('0.00');
    expect((el as any).value).toBeDefined();
    expect((el as any).disabled).toBe(false);
    expect((el as any).size).toBeDefined();
    expect((el as any).variant).toBeDefined();
  });

  it('has its own currency property', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t));
    await el.ready;

    expect((el as any).currency).toBe('USD');
    (el as any).currency = 'EUR';
    expect((el as any).currency).toBe('EUR');
  });

  it('currency watcher sets prefixIcon', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t));
    await el.ready;

    // Default USD should set $ prefix
    (el as any).currency = 'USD';
    expect((el as any).prefixIcon).toBe('$');

    (el as any).currency = 'EUR';
    expect((el as any).prefixIcon).toBe('€');

    (el as any).currency = 'GBP';
    expect((el as any).prefixIcon).toBe('£');

    (el as any).currency = 'JPY';
    expect((el as any).prefixIcon).toBe('¥');

    (el as any).currency = 'BRL';
    expect((el as any).prefixIcon).toBe('BRL');
  });

  it('formats value on blur', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t));
    await el.ready;

    (el as any).value = '42';
    el.dispatchEvent(new Event('blur'));
    expect((el as any).value).toBe('42.00');

    (el as any).value = '9.5';
    el.dispatchEvent(new Event('blur'));
    expect((el as any).value).toBe('9.50');

    (el as any).value = 'abc';
    el.dispatchEvent(new Event('blur'));
    // NaN — value should stay as-is
    expect((el as any).value).toBe('abc');
  });

  it('inherits formAssociated from snice-input', async () => {
    const { tag: t } = await setup();
    const Ctor = customElements.get(t) as any;
    expect(Ctor.formAssociated).toBe(true);
  });

  it('inherits snice-input styles plus adds own', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t));
    await el.ready;

    const sr = el.shadowRoot!;
    const sheets = sr.adoptedStyleSheets;
    if (sheets && sheets.length > 0) {
      // Parent + child stylesheets
      expect(sheets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('inherits snice-input render (shadow DOM has input element)', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t));
    await el.ready;

    // snice-input renders an <input> in shadow DOM
    const input = queryShadow(el, 'input');
    expect(input).not.toBeNull();
  });

  it('currency attribute works via HTML', async () => {
    const { tag: t } = await setup();
    const el = track(await createComponent(t, { currency: 'GBP' }));
    await el.ready;

    expect((el as any).currency).toBe('GBP');
    expect((el as any).prefixIcon).toBe('£');
  });

  it('observedAttributes includes both parent and child properties', async () => {
    const { tag: t } = await setup();
    const Ctor = customElements.get(t) as any;
    const observed = Ctor.observedAttributes;

    // From snice-input
    expect(observed).toContain('label');
    expect(observed).toContain('placeholder');
    expect(observed).toContain('disabled');
    // From currency-input
    expect(observed).toContain('currency');
  });

  it('multiple instances have independent state', async () => {
    const { tag: t } = await setup();
    const el1 = track(await createComponent(t, { currency: 'USD' }));
    const el2 = track(await createComponent(t, { currency: 'EUR' }));
    await el1.ready; await el2.ready;

    expect((el1 as any).prefixIcon).toBe('$');
    expect((el2 as any).prefixIcon).toBe('€');

    (el1 as any).value = '100';
    (el2 as any).value = '200';
    expect((el1 as any).value).toBe('100');
    expect((el2 as any).value).toBe('200');
  });
});
