/**
 * Smoke slice of the snice-key-value matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the ~180-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family, each chosen because it is the only place a
 * whole documented rule can break: the canonical serialization, the display
 * model, the mutation events, view mode, validation, slot mode, and form
 * submission. Structural assertions route through the matrix's own oracle, so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for.
 *
 * It also carries the two pinned findings (`it.fails`), so a fix to either is
 * noticed by the everyday loop rather than only by the opt-in matrix run.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape, unmountAll } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, submittedEntry, activeFlags,
} from '../internals-mock';
import {
  mountKeyValue, tick, serialize, expectedShape, readShape,
  editRows, viewRows, keyInputs, errorPart, recordEvents, typeInto,
  type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

const ITEMS: KeyValueItem[] = [
  { key: 'A', value: '1', description: '' },
  { key: 'A', value: '2', description: 'duplicate' },
];

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe('key-value matrix smoke', () => {
  it('the value is an ordered array that preserves duplicates and descriptions', async () => {
    const el = await mountKeyValue();
    el.setItems(ITEMS);
    await tick(el);
    expect(el.value).toBe(
      '[{"key":"A","value":"1","description":""},'
      + '{"key":"A","value":"2","description":"duplicate"}]',
    );
    expect(el.getItems()).toEqual(ITEMS);
  });

  it('auto-expand shows a trailing row that never reaches the value', async () => {
    const vector = { rows: 0, autoExpand: true };
    const el = await mountKeyValue(vector);
    el.setItems(ITEMS);
    await tick(el);

    expect(editRows(el)).toHaveLength(3);
    expect(el.value, 'the trailing display row was serialized').toBe(serialize(ITEMS));
    expectShape(readShape(el), expectedShape(vector, ITEMS), 'smoke/auto-expand');
  });

  it('a fixed row count is exact, offers no delete, and drops the overflow', async () => {
    const vector = { rows: 2 };
    const el = await mountKeyValue(vector);
    el.setItems([...ITEMS, { key: 'C', value: '3', description: '' }]);
    await tick(el);

    expect(editRows(el)).toHaveLength(2);
    expect(el.getItems()).toEqual(ITEMS);
    expectShape(readShape(el), expectedShape(vector, ITEMS), 'smoke/fixed-rows');
  });

  it('addItem and removeItem emit their documented event pairs', async () => {
    const el = await mountKeyValue();
    el.setItems(ITEMS);
    await tick(el);
    const seen = recordEvents(el);

    el.addItem('PORT', '3000', 'HTTP listener');
    await tick(el);
    expect(seen.map(e => e.type)).toEqual(['kv-add', 'kv-change']);
    expect(seen[0].detail).toEqual({
      item: { key: 'PORT', value: '3000', description: 'HTTP listener' }, index: 2,
    });

    seen.length = 0;
    el.removeItem(0);
    await tick(el);
    expect(seen.map(e => e.type)).toEqual(['kv-remove', 'kv-change']);
    expect(seen[0].detail.index).toBe(0);
  });

  it('typing dirties the editor and expands it', async () => {
    const el = await mountKeyValue();
    const seen = recordEvents(el);
    typeInto(el, 'key', 0, 'NODE_ENV');
    await tick(el);

    expect(el.getItems()).toEqual([{ key: 'NODE_ENV', value: '', description: '' }]);
    expect(editRows(el), 'the editor did not auto-expand after typing').toHaveLength(2);
    expect(seen.map(e => e.type)).toEqual(['kv-change']);
  });

  it('view mode renders data rows only, and an empty view says so', async () => {
    const el = await mountKeyValue({ mode: 'view' });
    el.setItems(ITEMS);
    await tick(el);
    expect(viewRows(el)).toHaveLength(2);
    expect(keyInputs(el), 'view mode rendered editable inputs').toHaveLength(0);

    el.clear();
    await tick(el);
    expect(viewRows(el)).toHaveLength(0);
    expectShape(readShape(el), expectedShape({ mode: 'view' }, []), 'smoke/empty-view');
  });

  it('required with nothing in it is valueMissing, and says so in part="error"', async () => {
    const el = await mountKeyValue({ required: true });
    await tick(el);
    expect(activeFlags(el)).toEqual(['valueMissing']);
    expect(errorPart(el)?.getAttribute('role')).toBe('alert');

    el.setItems(ITEMS);
    await tick(el);
    expect(activeFlags(el)).toEqual([]);
    expect(errorPart(el)).toBeNull();
  });

  it('a blank key on a meaningful row is badInput, on that row', async () => {
    const el = await mountKeyValue({
      value: '[{"key":"A","value":"1","description":""},'
        + '{"key":"","value":"orphan","description":""}]',
    });
    await tick(el);
    expect(activeFlags(el)).toEqual(['badInput']);
    expect(keyInputs(el).map(input => input.getAttribute('aria-invalid')))
      .toEqual(['false', 'true', 'false']);
  });

  it('slot children are the data and override the imperative methods', async () => {
    const el = await mountKeyValue(
      { name: 'headers' },
      '<snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>',
    );
    const items = [{ key: 'Accept', value: 'application/json', description: '' }];
    expect(el.getItems()).toEqual(items);

    el.clear();
    await tick(el);
    expect(el.getItems(), 'clear() mutated a slot-driven editor').toEqual(items);
    expect(submittedEntry(el)).toEqual(['headers', serialize(items)]);
  });

  it('a malformed value is retained, flagged, and still submitted raw', async () => {
    const malformed = '[{"key":1,"value":"x"}]';
    const el = await mountKeyValue({ name: 'headers', value: malformed });
    await tick(el);
    expect(el.value).toBe(malformed);
    expect(activeFlags(el)).toContain('badInput');
    expect(submittedEntry(el)).toEqual(['headers', malformed]);
  });
});

/**
 * The pinned findings, kept where the everyday loop runs them. Both are FIXED:
 * the assertions now run as ordinary green tests, so a regression in either
 * fails the everyday loop directly.
 */
describe('key-value matrix smoke: pinned findings', () => {
  it(
    'MATRIX-key-value-1 (fixed): moving `rows` back to 0 restores the single trailing row',
    async () => {
      const el = await mountKeyValue({ rows: 3, autoExpand: true });
      el.setItems([{ key: 'A', value: '1' }]);
      await tick(el);
      el.rows = 0;
      await tick(el);
      expect(editRows(el).length,
        "the fixed count's padding rows survived the move to variable").toBe(2);
    },
  );

  it(
    'MATRIX-key-value-2 (fixed): setCustomValidity renders its message in part="error"',
    async () => {
      const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
      await tick(el);
      el.setCustomValidity('That key is reserved');
      await tick(el);
      expect(errorPart(el), 'no part="error" was rendered for the custom rule').not.toBeNull();
      expect(errorPart(el)?.textContent).toContain('That key is reserved');
    },
  );
});
