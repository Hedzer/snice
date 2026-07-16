import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/key-value/snice-key-value';
import '../../packages/components/src/key-value/snice-kv-pair';
import type { SniceKeyValueElement, SniceKvPairElement } from '../../packages/components/src/key-value/snice-key-value.types';

describe('snice-key-value', () => {
  let kv: SniceKeyValueElement;
  let restoreAttachInternals: (() => void) | undefined;

  const canonical = (items: Array<{ key: string; value: string; description?: string }>) => JSON.stringify(
    items.map(item => ({ key: item.key, value: item.value, description: item.description ?? '' }))
  );
  const settle = async () => {
    await (kv as any).rendered;
    await Promise.resolve();
  };
  const keyInputs = () => Array.from(
    kv.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="key-input"]')
  );
  const valueInputs = () => Array.from(
    kv.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="value-input"]')
  );
  const installInternalsMock = () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'attachInternals');
    const setFormValue = vi.fn();
    const emptyValidity = {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: false,
      valid: true,
    };
    const internals: any = {
      form: null,
      labels: null,
      validity: emptyValidity,
      validationMessage: '',
      willValidate: true,
      setFormValue,
      setValidity: vi.fn((flags: ValidityStateFlags = {}, message = '') => {
        const hasError = Object.values(flags).some(Boolean);
        internals.validity = { ...emptyValidity, ...flags, valid: !hasError };
        internals.validationMessage = message;
      }),
      checkValidity: vi.fn(() => internals.validity.valid),
      reportValidity: vi.fn(() => internals.validity.valid),
    };
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
      configurable: true,
      value: () => internals,
    });
    restoreAttachInternals = () => {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, 'attachInternals', descriptor);
      else delete (HTMLElement.prototype as any).attachInternals;
    };
    return { internals, setFormValue };
  };

  afterEach(() => {
    if (kv?.isConnected) {
      removeComponent(kv as HTMLElement);
    }
    document.querySelectorAll('[data-key-value-test]').forEach(element => element.remove());
    restoreAttachInternals?.();
    restoreAttachInternals = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should render key-value element', async () => {
    kv = await createComponent<SniceKeyValueElement>('snice-key-value');
    expect(kv).toBeTruthy();
    expect(kv.shadowRoot).toBeTruthy();
  });

  it('should have default property values', async () => {
    kv = await createComponent<SniceKeyValueElement>('snice-key-value');
    expect(kv.label).toBe('');
    expect(kv.autoExpand).toBe(true);
    expect(kv.rows).toBe(0);
    expect(kv.showDescription).toBe(false);
    expect(kv.keyPlaceholder).toBe('Key');
    expect(kv.valuePlaceholder).toBe('Value');
    expect(kv.disabled).toBe(false);
    expect(kv.readonly).toBe(false);
    expect(kv.required).toBe(false);
    expect(kv.variant).toBe('default');
    expect(kv.mode).toBe('edit');
    expect(kv.name).toBe('');
    expect(kv.value).toBe('[]');
    expect(kv.defaultValue).toBe('[]');
    expect(kv.type).toBe('key-value');
  });

  it('should render title when label is set', async () => {
    kv = await createComponent<SniceKeyValueElement>('snice-key-value', { label: 'HTTP Headers' });
    await wait(50);
    const title = kv.shadowRoot!.querySelector('.kv__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('HTTP Headers');
  });

  it('should start with one empty row by default', async () => {
    kv = await createComponent<SniceKeyValueElement>('snice-key-value');
    await wait(50);
    const rows = kv.shadowRoot!.querySelectorAll('.kv__row');
    expect(rows.length).toBe(1);
  });

  it('should accept variant attribute', async () => {
    kv = await createComponent<SniceKeyValueElement>('snice-key-value', { variant: 'compact' });
    expect(kv.variant).toBe('compact');
  });

  describe('setItems() imperative API', () => {
    it('should render items via setItems()', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer token123' },
      ]);
      await wait(100);

      const rows = kv.shadowRoot!.querySelectorAll('.kv__row');
      // 2 data rows + 1 auto-expand empty row
      expect(rows.length).toBe(3);
    });

    it('should display key and value in inputs', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'Accept', value: 'text/html' },
      ]);
      await wait(100);

      const inputs = kv.shadowRoot!.querySelectorAll('.kv__input') as NodeListOf<HTMLInputElement>;
      expect(inputs[0].value).toBe('Accept');
      expect(inputs[1].value).toBe('text/html');
    });

    it('should clear items when setItems is called with empty array', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'X-Custom', value: 'test' },
      ]);
      await wait(100);

      kv.setItems([]);
      await wait(100);

      // Should have 1 empty row (auto-expand default)
      const rows = kv.shadowRoot!.querySelectorAll('.kv__row');
      expect(rows.length).toBe(1);
      expect(kv.getItems().length).toBe(0);
    });
  });

  describe('getItems()', () => {
    it('should return only non-empty items', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'Host', value: 'example.com' },
        { key: '', value: '' },
      ]);
      await wait(100);

      const items = kv.getItems();
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('Host');
    });
  });

  describe('addItem()', () => {
    it('should add an item programmatically', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.addItem('X-Request-Id', '12345');
      await wait(100);

      const items = kv.getItems();
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('X-Request-Id');
      expect(items[0].value).toBe('12345');
    });
  });

  describe('removeItem()', () => {
    it('should remove an item by index', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'A', value: '1' },
        { key: 'B', value: '2' },
      ]);
      await wait(100);

      kv.removeItem(0);
      await wait(100);

      const items = kv.getItems();
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('B');
    });
  });

  describe('clear()', () => {
    it('should remove all items', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'A', value: '1' },
        { key: 'B', value: '2' },
      ]);
      await wait(100);

      kv.clear();
      await wait(100);

      expect(kv.getItems().length).toBe(0);
    });
  });

  describe('fixed rows mode', () => {
    it('should render exact number of rows when rows is set', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { rows: '3' });
      await wait(100);

      const rows = kv.shadowRoot!.querySelectorAll('.kv__row');
      expect(rows.length).toBe(3);
    });

    it('should not show delete buttons in fixed mode', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { rows: '3' });
      await wait(100);

      const deleteButtons = kv.shadowRoot!.querySelectorAll('.kv__delete');
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('description field', () => {
    it('should show description inputs when showDescription is true', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'show-description': true });
      await wait(50);

      kv.setItems([{ key: 'A', value: '1', description: 'First item' }]);
      await wait(100);

      const descriptions = kv.shadowRoot!.querySelectorAll('.kv__description');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    it('should fire kv-remove when delete button is clicked', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'X-Header', value: 'test-value' },
      ]);
      await wait(100);

      let removedDetail: any = null;
      kv.addEventListener('kv-remove', (e: Event) => {
        removedDetail = (e as CustomEvent).detail;
      });

      const deleteBtn = kv.shadowRoot!.querySelector('.kv__delete') as HTMLButtonElement;
      deleteBtn?.click();
      await wait(50);

      expect(removedDetail).toBeTruthy();
      expect(removedDetail.item.key).toBe('X-Header');
    });

    it('should fire kv-change on input', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      let changeDetail: any = null;
      kv.addEventListener('kv-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      const input = kv.shadowRoot!.querySelector('.kv__input') as HTMLInputElement;
      input.value = 'NewKey';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(50);

      expect(changeDetail).toBeTruthy();
    });
  });

  describe('declarative child element usage', () => {
    it('should render from <snice-kv-pair> children', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;

      const pair1 = document.createElement('snice-kv-pair');
      pair1.setAttribute('key', 'Content-Type');
      pair1.setAttribute('value', 'application/json');

      const pair2 = document.createElement('snice-kv-pair');
      pair2.setAttribute('key', 'Accept');
      pair2.setAttribute('value', 'text/html');

      kv.appendChild(pair1);
      kv.appendChild(pair2);
      document.body.appendChild(kv);

      await (kv as any).ready;
      await wait(100);

      const inputs = kv.shadowRoot!.querySelectorAll('.kv__input') as NodeListOf<HTMLInputElement>;
      // 2 pairs * 2 inputs + 1 empty row * 2 inputs = 6
      expect(inputs.length).toBeGreaterThanOrEqual(4);
      expect(inputs[0].value).toBe('Content-Type');
      expect(inputs[1].value).toBe('application/json');
    });

    it('should use slot children over setItems()', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;

      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'SlotKey');
      pair.setAttribute('value', 'SlotValue');

      kv.appendChild(pair);
      document.body.appendChild(kv);

      await (kv as any).ready;
      await wait(100);

      // Try to override with setItems — should be ignored
      kv.setItems([
        { key: 'ImperativeKey', value: 'ImperativeValue' },
      ]);
      await wait(100);

      const inputs = kv.shadowRoot!.querySelectorAll('.kv__input') as NodeListOf<HTMLInputElement>;
      expect(inputs[0].value).toBe('SlotKey');
    });
  });

  describe('form association', () => {
    it('should expose value as JSON string', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([
        { key: 'HOST', value: 'localhost' },
        { key: 'PORT', value: '3000' },
      ]);
      await wait(100);

      const value = kv.value;
      expect(value).toBe(canonical([
        { key: 'HOST', value: 'localhost' },
        { key: 'PORT', value: '3000' },
      ]));
    });

    it('should return an ordered empty entry array when no items', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(100);

      expect(kv.value).toBe('[]');
    });
  });

  describe('copy button', () => {
    it('should render copy button when show-copy is set', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'show-copy': true });
      await wait(50);

      kv.setItems([{ key: 'A', value: '1' }]);
      await wait(100);

      const copyBtn = kv.shadowRoot!.querySelector('.kv__copy');
      expect(copyBtn).toBeTruthy();
    });

    it('should not render copy button by default', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(50);

      kv.setItems([{ key: 'A', value: '1' }]);
      await wait(100);

      const copyBtn = kv.shadowRoot!.querySelector('.kv__copy');
      expect(copyBtn).toBeFalsy();
    });
  });

  describe('view mode', () => {
    it('should render items as text in view mode', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { mode: 'view' });
      await wait(50);

      kv.setItems([
        { key: 'Host', value: 'example.com' },
        { key: 'Accept', value: 'text/html' },
      ]);
      await wait(100);

      const viewRows = kv.shadowRoot!.querySelectorAll('.kv__view-row');
      expect(viewRows.length).toBe(2);

      const keys = kv.shadowRoot!.querySelectorAll('.kv__view-key');
      expect(keys[0].textContent).toContain('Host');

      const values = kv.shadowRoot!.querySelectorAll('.kv__view-value');
      expect(values[0].textContent).toContain('example.com');
    });

    it('should not render input elements in view mode', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { mode: 'view' });
      await wait(50);

      kv.setItems([{ key: 'A', value: '1' }]);
      await wait(100);

      const inputs = kv.shadowRoot!.querySelectorAll('.kv__input');
      expect(inputs.length).toBe(0);
    });

    it('should show empty state when no items in view mode', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { mode: 'view' });
      await wait(100);

      const empty = kv.shadowRoot!.querySelector('.kv__empty');
      expect(empty).toBeTruthy();
      expect(empty!.textContent).toContain('No entries');
    });

    it('should only show non-empty items in view mode', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { mode: 'view' });
      await wait(50);

      kv.setItems([
        { key: 'Host', value: 'example.com' },
        { key: '', value: '' },
      ]);
      await wait(100);

      const viewRows = kv.shadowRoot!.querySelectorAll('.kv__view-row');
      expect(viewRows.length).toBe(1);
    });
  });

  describe('MutationObserver reacts to child changes', () => {
    it('should update when children are added', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      document.body.appendChild(kv);

      await (kv as any).ready;
      await wait(50);

      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'DynamicKey');
      pair.setAttribute('value', 'DynamicValue');
      kv.appendChild(pair);

      await wait(200);

      const inputs = kv.shadowRoot!.querySelectorAll('.kv__input') as NodeListOf<HTMLInputElement>;
      expect(inputs[0].value).toBe('DynamicKey');
    });

    it('should update when children are removed', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;

      const pair1 = document.createElement('snice-kv-pair');
      pair1.setAttribute('key', 'A');
      pair1.setAttribute('value', '1');

      const pair2 = document.createElement('snice-kv-pair');
      pair2.setAttribute('key', 'B');
      pair2.setAttribute('value', '2');

      kv.appendChild(pair1);
      kv.appendChild(pair2);
      document.body.appendChild(kv);

      await (kv as any).ready;
      await wait(100);

      kv.removeChild(pair2);
      await wait(200);

      const items = kv.getItems();
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('A');
    });

    it('should fall back to imperative mode when all children removed', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;

      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'A');
      pair.setAttribute('value', '1');

      kv.appendChild(pair);
      document.body.appendChild(kv);

      await (kv as any).ready;
      await wait(100);

      kv.removeChild(pair);
      await wait(200);

      // Now setItems should work
      kv.setItems([
        { key: 'ImperativeKey', value: 'ImperativeValue' },
      ]);
      await wait(100);

      const items = kv.getItems();
      expect(items.length).toBe(1);
      expect(items[0].key).toBe('ImperativeKey');
    });
  });

  describe('ordered serialization contract', () => {
    it('preserves pre-connection direct items assignments for runtime compatibility', async () => {
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      (kv as any).items = [{ key: 'legacy', value: 'preserved', description: 'pre-connect' }];
      kv.showCopy = true;

      document.body.appendChild(kv);
      await (kv as any).ready;
      await settle();

      expect(kv.getItems()).toEqual([
        { key: 'legacy', value: 'preserved', description: 'pre-connect' },
      ]);
      const copyButton = kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy-button"]');
      expect(copyButton).toBeTruthy();
      copyButton!.click();
      await wait(50);
      expect(kv.shadowRoot!.querySelector('[part="copy-button"]')!.classList.contains('kv__copy--copied')).toBe(true);
    });

    it('preserves duplicate keys, descriptions, Unicode, control characters, and row order exactly', async () => {
      const { setFormValue } = installInternalsMock();
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      kv.name = 'headers';
      document.body.appendChild(kv);
      await (kv as any).ready;
      const items = [
        { key: 'X-Duplicate', value: 'first', description: 'line\none' },
        { key: 'X-Duplicate', value: 'second\tvalue', description: '二番目' },
        { key: 'emoji-🔑', value: 'café & <safe>', description: 'مرحبا' },
      ];

      kv.setItems(items);

      expect(kv.value).toBe(canonical(items));
      expect(kv.getItems()).toEqual(items);
      expect(setFormValue.mock.calls.at(-1)).toEqual([canonical(items), canonical(items)]);
    });

    it('uses [] as the stable live, restore, copy, and successful-control empty representation', async () => {
      const { setFormValue } = installInternalsMock();
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      document.body.appendChild(kv);
      await (kv as any).ready;

      expect(kv.value).toBe('[]');
      expect(kv.getItems()).toEqual([]);
      expect(setFormValue.mock.calls.at(-1)).toEqual(['[]', '[]']);
      kv.value = '';
      expect(kv.value).toBe('[]');
      expect(setFormValue.mock.calls.at(-1)).toEqual(['[]', '[]']);
    });

    it('normalizes optional descriptions and runtime scalar values through setItems()', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems([
        { key: 'plain', value: 'value' },
        { key: 42, value: false, description: null } as any,
      ]);

      expect(kv.getItems()).toEqual([
        { key: 'plain', value: 'value', description: '' },
        { key: '42', value: 'false', description: '' },
      ]);
      expect(kv.value).toBe(canonical(kv.getItems()));
    });

    it('returns defensive item copies', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems([{ key: 'A', value: '1', description: 'original' }]);
      const result = kv.getItems();
      result[0].key = 'mutated';
      result.push({ key: 'B', value: '2' });

      expect(kv.getItems()).toEqual([{ key: 'A', value: '1', description: 'original' }]);
    });

    it('accepts the previous object state format but always emits the ordered array format', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.value = JSON.stringify({ HOST: 'localhost', PORT: '3000' });

      expect(kv.getItems()).toEqual([
        { key: 'HOST', value: 'localhost', description: '' },
        { key: 'PORT', value: '3000', description: '' },
      ]);
      expect(kv.value).toBe(canonical(kv.getItems()));
    });

    it('accepts array entries without descriptions and canonicalizes their exact shape', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.value = '[{"key":"A","value":"1"},{"key":"A","value":"2","description":"duplicate"}]';

      expect(kv.value).toBe(canonical([
        { key: 'A', value: '1' },
        { key: 'A', value: '2', description: 'duplicate' },
      ]));
    });

    it.each([
      '{',
      'null',
      'true',
      '42',
      '"text"',
      '[null]',
      '[[]]',
      '[{"value":"1"}]',
      '[{"key":"A"}]',
      '[{"key":1,"value":"1"}]',
      '[{"key":"A","value":1}]',
      '[{"key":"A","value":"1","description":2}]',
      '[{"key":"A","value":"1","unknown":"lost"}]',
      '{"A":1}',
      '{"A":null}',
      '{"A":{"nested":true}}',
    ])('retains malformed serialized input for correction and marks it bad input: %s', async raw => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems([{ key: 'before', value: 'kept only until assignment' }]);

      kv.value = raw;
      await settle();

      expect(kv.value).toBe(raw);
      expect(kv.getItems()).toEqual([]);
      expect((kv as any).getValidityFlags().badInput).toBe(true);
      expect(kv.checkValidity()).toBe(false);
      expect(kv.validationMessage).toContain('ordered JSON entry array');
      expect(keyInputs()[0].getAttribute('aria-invalid')).toBe('true');
      expect(kv.shadowRoot!.querySelector('[part="error"]')?.textContent).toContain('ordered JSON entry array');
    });

    it('recovers atomically from malformed serialized input on the next real edit', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.value = 'not json';
      await settle();
      const input = keyInputs()[0];
      input.value = 'Recovered';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await settle();

      expect(kv.value).toBe(canonical([{ key: 'Recovered', value: '' }]));
      expect(kv.checkValidity()).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });

    it('round-trips a large ordered set without truncation or reordering', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { mode: 'view' });
      const items = Array.from({ length: 1000 }, (_, index) => ({
        key: `key-${index % 17}`,
        value: `value-${index}-✓`,
        description: `row-${index}`,
      }));
      kv.setItems(items);
      await settle();

      expect(kv.getItems()).toEqual(items);
      expect(JSON.parse(kv.value)).toHaveLength(1000);
      expect(JSON.parse(kv.value)[999]).toEqual(items[999]);
      expect(kv.shadowRoot!.querySelectorAll('[part="view-row"]')).toHaveLength(1000);
    });
  });

  describe('live value, authored defaults, reset, and restore', () => {
    it('keeps dirty live state separate from the reflected authored reset default', async () => {
      const authored = canonical([{ key: 'authored', value: '1' }]);
      const live = canonical([{ key: 'live', value: '2' }]);
      const replacementDefault = canonical([{ key: 'reset', value: '3' }]);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { value: authored });

      kv.value = live;
      kv.setAttribute('value', replacementDefault);

      expect(kv.value).toBe(live);
      expect(kv.defaultValue).toBe(replacementDefault);
      expect(kv.getAttribute('value')).toBe(replacementDefault);
      (kv as any).formResetCallback();
      expect(kv.value).toBe(replacementDefault);
      expect(kv.getItems()[0].key).toBe('reset');
    });

    it('tracks default mutations while pristine and stops after the live value becomes dirty', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      const firstDefault = canonical([{ key: 'first', value: '1' }]);
      const secondDefault = canonical([{ key: 'second', value: '2' }]);
      kv.defaultValue = firstDefault;
      expect(kv.value).toBe(firstDefault);

      kv.addItem('live', '3');
      kv.defaultValue = secondDefault;
      expect(kv.getItems().map(item => item.key)).toEqual(['first', 'live']);
      expect(kv.defaultValue).toBe(secondDefault);
      (kv as any).formResetCallback();
      expect(kv.value).toBe(secondDefault);
    });

    it('resets without emitting add, remove, or change events', async () => {
      const authored = canonical([{ key: 'authored', value: '1' }]);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { value: authored });
      const add = vi.fn();
      const remove = vi.fn();
      const change = vi.fn();
      kv.addEventListener('kv-add', add);
      kv.addEventListener('kv-remove', remove);
      kv.addEventListener('kv-change', change);
      kv.setItems([{ key: 'live', value: '2' }]);

      (kv as any).formResetCallback();

      expect(kv.value).toBe(authored);
      expect(add).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(change).not.toHaveBeenCalled();
    });

    it('uses current direct child attributes as declarative reset defaults', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'Authored');
      pair.setAttribute('value', 'one');
      pair.setAttribute('description', 'default row');
      kv.appendChild(pair);
      document.body.appendChild(kv);
      await (kv as any).ready;
      await settle();

      keyInputs()[0].value = 'Edited';
      keyInputs()[0].dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(kv.getItems()[0].key).toBe('Edited');
      (kv as any).formResetCallback();

      expect(kv.getItems()).toEqual([{ key: 'Authored', value: 'one', description: 'default row' }]);
    });

    it('tracks declarative child attribute changes, insertion order, and removal exactly', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      const first = document.createElement('snice-kv-pair');
      const second = document.createElement('snice-kv-pair');
      first.setAttribute('key', 'first');
      first.setAttribute('value', '1');
      second.setAttribute('key', 'second');
      second.setAttribute('value', '2');
      kv.append(first, second);
      document.body.appendChild(kv);
      await (kv as any).ready;

      second.setAttribute('description', 'moved');
      kv.insertBefore(second, first);
      await wait(20);

      expect(kv.getItems()).toEqual([
        { key: 'second', value: '2', description: 'moved' },
        { key: 'first', value: '1', description: '' },
      ]);
      first.remove();
      await wait(20);
      expect(kv.getItems()).toEqual([{ key: 'second', value: '2', description: 'moved' }]);
    });

    it('restores canonical, legacy, and malformed string state without user events', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      const change = vi.fn();
      kv.addEventListener('kv-change', change);
      const restored = canonical([
        { key: 'duplicate', value: 'one', description: 'α' },
        { key: 'duplicate', value: 'two', description: 'β' },
      ]);

      (kv as any).formStateRestoreCallback(restored, 'restore');
      expect(kv.value).toBe(restored);
      (kv as any).formStateRestoreCallback('{"legacy":"yes"}', 'restore');
      expect(kv.value).toBe(canonical([{ key: 'legacy', value: 'yes' }]));
      (kv as any).formStateRestoreCallback('partial {', 'restore');
      expect(kv.value).toBe('partial {');
      expect(kv.checkValidity()).toBe(false);
      expect(change).not.toHaveBeenCalled();
    });

    it('ignores every non-string restore state atomically', async () => {
      const initial = canonical([{ key: 'A', value: '1' }]);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { value: initial });
      for (const state of [null, new File([], 'state.json'), new FormData()]) {
        (kv as any).formStateRestoreCallback(state, 'restore');
        expect(kv.value).toBe(initial);
      }
    });
  });

  describe('constraint validation and native surface', () => {
    it('distinguishes optional empty, required empty, and a key with an empty value', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      expect(kv.checkValidity()).toBe(true);
      kv.required = true;
      expect(kv.checkValidity()).toBe(false);
      expect((kv as any).getValidityFlags().valueMissing).toBe(true);
      expect(kv.validationMessage).toContain('at least one');

      kv.addItem('EMPTY_VALUE_IS_VALID', '');
      expect(kv.checkValidity()).toBe(true);
      expect(kv.value).toBe(canonical([{ key: 'EMPTY_VALUE_IS_VALID', value: '' }]));
    });

    it.each([
      { label: 'empty key with value', items: [{ key: '', value: 'orphan value' }] },
      { label: 'space-only key', items: [{ key: '   ', value: '' }] },
      { label: 'tab-only key', items: [{ key: '\t', value: 'orphan value' }] },
      { label: 'description-only row', items: [{ key: '', value: '', description: 'description without key' }] },
      { label: 'malformed second row', items: [{ key: 'good', value: '1' }, { key: '', value: 'bad second row' }] },
    ])('rejects a non-empty row without a non-whitespace key: $label', async ({ items }) => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems(items);
      await settle();

      expect(kv.checkValidity()).toBe(false);
      expect((kv as any).getValidityFlags().badInput).toBe(true);
      expect(kv.validationMessage).toMatch(/Row \d+ needs a non-empty key/);
      const invalid = keyInputs().filter(input => input.getAttribute('aria-invalid') === 'true');
      expect(invalid).toHaveLength(1);
    });

    it('omits wholly empty display rows while retaining whitespace in meaningful values', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems([
        { key: '', value: '', description: '   ' },
        { key: 'spaces', value: '   ', description: '' },
      ]);

      expect(kv.getItems()).toEqual([{ key: 'spaces', value: '   ', description: '' }]);
      expect(kv.checkValidity()).toBe(true);
    });

    it('sets, replaces, and clears custom validity without rewriting data', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.setItems([{ key: 'A', value: '1' }]);
      kv.setCustomValidity('Headers are locked by policy');
      await settle();

      expect(kv.checkValidity()).toBe(false);
      expect(kv.validity.customError).toBe(true);
      expect(kv.validationMessage).toContain('Headers are locked by policy');
      expect(kv.getItems()[0].key).toBe('A');
      kv.setCustomValidity('Replacement message');
      expect(kv.validationMessage).toContain('Replacement message');
      kv.setCustomValidity('');
      expect(kv.checkValidity()).toBe(true);
    });

    it.each([
      ['disabled', true],
      ['readonly', true],
      ['mode', 'view'],
    ] as const)('bars %s from validation without clearing malformed live state', async (property, value) => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { required: true });
      kv.setItems([{ key: '', value: 'invalid' }]);
      expect(kv.checkValidity()).toBe(false);

      (kv as any)[property] = value;
      await settle();

      expect(kv.willValidate).toBe(false);
      expect(kv.checkValidity()).toBe(true);
      expect(kv.getItems()).toEqual([{ key: '', value: 'invalid', description: '' }]);
      if (property !== 'mode') (kv as any)[property] = false;
      else kv.mode = 'edit';
      await settle();
      expect(kv.checkValidity()).toBe(false);
    });

    it('keeps inherited fieldset disabledness separate from authored disabledness', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', {
        required: true,
        'show-description': true,
        'show-copy': true,
      });
      kv.setItems([{ key: 'A', value: '1', description: 'row' }]);
      (kv as any).formDisabledCallback(true);
      await settle();

      expect(kv.disabled).toBe(false);
      expect(kv.hasAttribute('disabled')).toBe(false);
      expect(kv.willValidate).toBe(false);
      expect(Array.from(kv.shadowRoot!.querySelectorAll<HTMLInputElement>('input')).every(input => input.disabled)).toBe(true);
      expect(Array.from(kv.shadowRoot!.querySelectorAll<HTMLButtonElement>('button')).every(button => button.disabled)).toBe(true);
      expect(kv.shadowRoot!.querySelector('.kv')?.classList.contains('kv--disabled')).toBe(true);

      (kv as any).formDisabledCallback(false);
      await settle();
      expect(keyInputs()[0].disabled).toBe(false);
      expect(kv.willValidate).toBe(true);
      expect(kv.disabled).toBe(false);
    });

    it('exposes form ownership, type, validation methods, and label association', async () => {
      const form = document.createElement('form');
      form.id = 'kv-owner';
      form.dataset.keyValueTest = 'true';
      const label = document.createElement('label');
      label.htmlFor = 'owned-kv';
      label.dataset.keyValueTest = 'true';
      document.body.append(form, label);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { required: true });
      kv.id = 'owned-kv';
      kv.setAttribute('form', form.id);

      expect(kv.type).toBe('key-value');
      expect(kv.form).toBe(form);
      expect(kv.validity).toBeTruthy();
      expect(typeof kv.validationMessage).toBe('string');
      expect(typeof kv.checkValidity()).toBe('boolean');
      expect(typeof kv.reportValidity()).toBe('boolean');
      expect(kv.labels?.length ?? 0).toBeGreaterThanOrEqual(0);
      expect(kv.tabIndex).toBe(-1);
    });

    it('delegates the native surface to ElementInternals when available', async () => {
      const { internals } = installInternalsMock();
      const form = document.createElement('form');
      const labels = document.querySelectorAll('label');
      internals.form = form;
      internals.labels = labels;
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      kv.required = true;
      document.body.appendChild(kv);
      await (kv as any).ready;

      expect(kv.form).toBe(form);
      expect(kv.labels).toBe(labels);
      expect(kv.checkValidity()).toBe(false);
      expect(internals.checkValidity).toHaveBeenCalled();
      expect(kv.reportValidity()).toBe(false);
      expect(internals.reportValidity).toHaveBeenCalled();
      expect(internals.setValidity.mock.calls.at(-1)?.[0]).toMatchObject({ valueMissing: true });
    });

    it('renders an accessible group, internal labels, required marker, and exact invalid row anchor', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', {
        label: 'Request headers',
        required: true,
        'show-description': true,
      });
      kv.setItems([{ key: 'A', value: '1' }, { key: '', value: 'bad' }]);
      await settle();

      const group = kv.shadowRoot!.querySelector('[part="base"]')!;
      expect(group.getAttribute('role')).toBe('group');
      expect(group.getAttribute('aria-labelledby')).toBe('kv-title');
      expect(group.getAttribute('aria-required')).toBe('true');
      expect(kv.shadowRoot!.querySelector('[part="title"]')?.textContent).toContain('Request headers *');
      expect(keyInputs().map(input => input.getAttribute('aria-label'))).toEqual(['Key 1', 'Key 2', 'Key 3']);
      expect(valueInputs().map(input => input.getAttribute('aria-label'))).toEqual(['Value 1', 'Value 2', 'Value 3']);
      expect(keyInputs()[1].getAttribute('aria-invalid')).toBe('true');
      expect(keyInputs()[1].getAttribute('aria-errormessage')).toBe('kv-error');
      expect(keyInputs()[0].getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('row operations, blocked paths, and reconnect lifecycle', () => {
    it('updates sample placeholders reactively and keeps each row assignment stable', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.75);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      kv.placeholders = [
        { key: 'first key', value: 'first value' },
        { key: 'second key', value: 'second value' },
      ];
      await settle();
      expect(keyInputs()[0].placeholder).toBe('second key');
      expect(valueInputs()[0].placeholder).toBe('second value');

      kv.label = 'Unrelated render';
      await settle();
      expect(keyInputs()[0].placeholder).toBe('second key');

      vi.mocked(Math.random).mockReturnValue(0);
      kv.placeholders = [{ key: 'replacement key', value: 'replacement value' }];
      await settle();
      expect(keyInputs()[0].placeholder).toBe('replacement key');
      expect(valueInputs()[0].placeholder).toBe('replacement value');
    });

    it('fills existing empty rows before appending and never reports a trimmed fixed-row addition', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { rows: 2 });
      const add = vi.fn();
      const change = vi.fn();
      kv.addEventListener('kv-add', add);
      kv.addEventListener('kv-change', change);

      kv.addItem('A', '1');
      kv.addItem('B', '2');
      kv.addItem('C', '3');

      expect(kv.getItems()).toEqual([
        { key: 'A', value: '1', description: '' },
        { key: 'B', value: '2', description: '' },
      ]);
      expect(add).toHaveBeenCalledTimes(2);
      expect(change).toHaveBeenCalledTimes(2);
      expect(add.mock.calls.map(call => call[0].detail.index)).toEqual([0, 1]);
    });

    it('fills the initial empty row when auto-expand is off', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'auto-expand': false });
      kv.addItem('A', '1');

      expect(kv.getItems()).toEqual([{ key: 'A', value: '1', description: '' }]);
      expect(kv.shadowRoot!.querySelectorAll('[part="row"]')).toHaveLength(1);
    });

    it('retains fixed-row count across remove, clear, reset, and dynamic row changes', async () => {
      const authored = canonical([
        { key: 'A', value: '1' },
        { key: 'B', value: '2' },
        { key: 'C', value: '3' },
      ]);
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { rows: 3, value: authored });
      kv.removeItem(1);
      await settle();
      expect(kv.getItems().map(item => item.key)).toEqual(['A', 'C']);
      expect(kv.shadowRoot!.querySelectorAll('[part="row"]')).toHaveLength(3);
      kv.clear();
      await settle();
      expect(kv.getItems()).toEqual([]);
      expect(kv.shadowRoot!.querySelectorAll('[part="row"]')).toHaveLength(3);
      (kv as any).formResetCallback();
      expect(kv.getItems().map(item => item.key)).toEqual(['A', 'B', 'C']);
      kv.rows = 2;
      await settle();
      expect(kv.getItems().map(item => item.key)).toEqual(['A', 'B']);
      expect(kv.shadowRoot!.querySelectorAll('[part="row"]')).toHaveLength(2);
    });

    it('emits add/remove/change details in operation order and keeps setItems silent', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      const events: string[] = [];
      const details: any[] = [];
      for (const name of ['kv-add', 'kv-remove', 'kv-change']) {
        kv.addEventListener(name, event => {
          events.push(name);
          details.push((event as CustomEvent).detail);
        });
      }
      kv.setItems([{ key: 'silent', value: '0' }]);
      expect(events).toEqual([]);
      kv.addItem('A', '1', 'added');
      kv.removeItem(0);

      expect(events).toEqual(['kv-add', 'kv-change', 'kv-remove', 'kv-change']);
      expect(details[0]).toMatchObject({ item: { key: 'A', value: '1', description: 'added' }, index: 1 });
      expect(details[2]).toMatchObject({ item: { key: 'silent', value: '0', description: '' }, index: 0 });
      expect(details[3].items).toEqual([{ key: 'A', value: '1', description: 'added' }]);
    });

    it('blocks every synthetic edit/delete path while fieldset-disabled without blocking public data methods', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'show-description': true });
      kv.setItems([{ key: 'A', value: '1', description: 'original' }]);
      const change = vi.fn();
      const remove = vi.fn();
      kv.addEventListener('kv-change', change);
      kv.addEventListener('kv-remove', remove);
      (kv as any).formDisabledCallback(true);
      await settle();

      const key = keyInputs()[0];
      const value = valueInputs()[0];
      const description = kv.shadowRoot!.querySelector<HTMLInputElement>('[part="description-input"]')!;
      key.value = 'blocked-key';
      value.value = 'blocked-value';
      description.value = 'blocked-description';
      key.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      value.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      description.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="delete-button"]')?.click();

      expect(kv.getItems()).toEqual([{ key: 'A', value: '1', description: 'original' }]);
      expect([key.value, value.value, description.value]).toEqual(['A', '1', 'original']);
      expect(change).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();

      kv.setItems([{ key: 'programmatic', value: 'works' }]);
      kv.addItem('also', 'works');
      expect(kv.getItems().map(item => item.key)).toEqual(['programmatic', 'also']);
      kv.removeItem(0);
      expect(kv.getItems().map(item => item.key)).toEqual(['also']);
      kv.clear();
      expect(kv.getItems()).toEqual([]);
    });

    it('blocks readonly synthetic edits and deletion while retaining copy access', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', {
        readonly: true,
        'show-copy': true,
      });
      kv.setItems([{ key: 'A', value: '1' }]);
      await settle();
      const input = keyInputs()[0];
      input.value = 'blocked';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="delete-button"]')?.click();
      kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy-button"]')!.click();
      await Promise.resolve();

      expect(kv.getItems()).toEqual([{ key: 'A', value: '1', description: '' }]);
      expect(input.value).toBe('A');
      expect(writeText).toHaveBeenCalledWith(JSON.stringify(kv.getItems(), null, 2));
    });

    it('copies the exact ordered array, preserves duplicates, emits once, and clears feedback', async () => {
      vi.useFakeTimers();
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'show-copy': true });
      const items = [
        { key: 'A', value: '1', description: 'first' },
        { key: 'A', value: '2', description: 'second' },
      ];
      kv.setItems(items);
      await settle();
      const copied = vi.fn();
      kv.addEventListener('kv-copy', copied);

      kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy-button"]')!.click();
      await Promise.resolve();
      await settle();

      expect(writeText).toHaveBeenCalledWith(JSON.stringify(items, null, 2));
      expect(copied).toHaveBeenCalledTimes(1);
      expect(copied.mock.calls[0][0].detail.items).toEqual(items);
      expect((kv as any).copyFeedback).toBe(true);
      vi.advanceTimersByTime(1500);
      await settle();
      expect((kv as any).copyFeedback).toBe(false);
    });

    it('cancels copy feedback timers and state on disconnect', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { 'show-copy': true });
      kv.setItems([{ key: 'A', value: '1' }]);
      await settle();
      await (kv as any).handleCopy();
      expect((kv as any).copyFeedback).toBe(true);

      kv.remove();

      expect((kv as any).copyFeedbackTimer).toBeUndefined();
      expect((kv as any).copyFeedback).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('preserves declarative precedence over every imperative mutation API', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'declarative');
      pair.setAttribute('value', 'wins');
      kv.appendChild(pair);
      document.body.appendChild(kv);
      await (kv as any).ready;

      kv.setItems([{ key: 'set', value: 'ignored' }]);
      kv.addItem('add', 'ignored');
      kv.removeItem(0);
      kv.clear();

      expect(kv.getItems()).toEqual([{ key: 'declarative', value: 'wins', description: '' }]);
    });

    it('reconnects declarative child observation without duplicating updates', async () => {
      kv = document.createElement('snice-key-value') as SniceKeyValueElement;
      const pair = document.createElement('snice-kv-pair');
      pair.setAttribute('key', 'before');
      pair.setAttribute('value', '1');
      kv.appendChild(pair);
      document.body.appendChild(kv);
      await (kv as any).ready;
      kv.remove();
      await Promise.resolve();
      document.body.appendChild(kv);
      await Promise.resolve();

      pair.setAttribute('key', 'after');
      await wait(20);

      expect(kv.getItems()).toEqual([{ key: 'after', value: '1', description: '' }]);
    });

    it('focuses the first key input and preserves an authored host tabindex', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value', { tabindex: 3 });
      kv.focus();

      expect(kv.tabIndex).toBe(3);
      expect(kv.shadowRoot!.activeElement).toBe(keyInputs()[0]);
    });
  });
});

describe('snice-kv-pair', () => {
  let pair: SniceKvPairElement;

  afterEach(() => {
    if (pair) {
      removeComponent(pair as HTMLElement);
    }
  });

  it('should register as custom element', async () => {
    pair = document.createElement('snice-kv-pair') as SniceKvPairElement;
    document.body.appendChild(pair);
    await (pair as any).ready;
    expect(pair).toBeTruthy();
  });

  it('should accept key attribute', async () => {
    pair = document.createElement('snice-kv-pair') as SniceKvPairElement;
    pair.setAttribute('key', 'Content-Type');
    document.body.appendChild(pair);
    await (pair as any).ready;
    expect(pair.key).toBe('Content-Type');
  });

  it('should accept value attribute', async () => {
    pair = document.createElement('snice-kv-pair') as SniceKvPairElement;
    pair.setAttribute('value', 'application/json');
    document.body.appendChild(pair);
    await (pair as any).ready;
    expect(pair.value).toBe('application/json');
  });

  it('should accept description attribute', async () => {
    pair = document.createElement('snice-kv-pair') as SniceKvPairElement;
    pair.setAttribute('description', 'The content type');
    document.body.appendChild(pair);
    await (pair as any).ready;
    expect(pair.description).toBe('The content type');
  });
});
