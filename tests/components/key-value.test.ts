import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/key-value/snice-key-value';
import '../../components/key-value/snice-kv-pair';
import type { SniceKeyValueElement, SniceKvPairElement } from '../../components/key-value/snice-key-value.types';

describe('snice-key-value', () => {
  let kv: SniceKeyValueElement;

  afterEach(() => {
    if (kv) {
      removeComponent(kv as HTMLElement);
    }
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
    expect(kv.variant).toBe('default');
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
      const parsed = JSON.parse(value);
      expect(parsed.HOST).toBe('localhost');
      expect(parsed.PORT).toBe('3000');
    });

    it('should return empty string when no items', async () => {
      kv = await createComponent<SniceKeyValueElement>('snice-key-value');
      await wait(100);

      expect(kv.value).toBe('');
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
