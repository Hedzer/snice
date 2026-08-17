/**
 * MATRIX slice — snice-key-value: the display model and the data methods.
 *
 * Dimensions (docs/ai/components/key-value.md, "Rows/data"):
 *   rows setting (4) x auto-expand (2) x entry count (4) = 32 combos,
 *   then the mutation cross: rows setting (2) x method (4) = 8.
 *
 * The display model is deliberately NOT the data model, and the docs say so in
 * three clauses this slice grades against each other:
 *
 *   · `rows: number = 0  // 0 variable; >0 exact fixed count`;
 *   · "Variable + auto-expand: trailing empty display row, never serialized.";
 *   · "Fixed `rows`: exact count, no delete/auto-expand; add fills empty row;
 *     full add is no-op." and "Lowering fixed `rows` drops entries beyond new
 *     count."
 *
 * The mutation methods are crossed against the row configuration because the
 * docs give them DIFFERENT answers in each: `addItem` appends in variable mode
 * and fills in fixed mode, and `removeItem` has no delete affordance to match
 * in fixed mode though the method itself still works ("Public data methods
 * remain usable while UI is disabled/readonly").
 *
 * Every assertion is the DOCUMENTED expectation. One combo diverges and is
 * pinned rather than softened:
 *
 *   MATRIX-key-value-1 — moving `rows` from a fixed count back to `0` keeps the
 *     empty rows the fixed count had padded in, so a variable auto-expanding
 *     editor holding one entry displays three rows instead of the documented
 *     two (one data row plus one trailing editing row).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  mountKeyValue, tick, expectedRows, expectedShape, readShape, serialize,
  editRows, deleteButtons, recordEvents, canonical, type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

const ROW_SETTINGS = [0, 1, 3, 5] as const;
const COUNTS = [0, 1, 3, 6] as const;

function entries(count: number): KeyValueItem[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `K${i + 1}`, value: `V${i + 1}`, description: '',
  }));
}

const COMBOS = product({
  rows: ROW_SETTINGS,
  autoExpand: [true, false],
  count: COUNTS,
});

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe(`key-value matrix: the display model (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `rows=${combo.rows}/${combo.autoExpand ? 'auto' : 'no-auto'}`
      + `/entries=${combo.count}`;

    it(id, async () => {
      const items = entries(combo.count);
      const vector = { rows: combo.rows, autoExpand: combo.autoExpand };
      const el = await mountKeyValue(vector);
      el.setItems(items);
      await tick(el);

      const display = expectedRows(items, combo.rows, combo.autoExpand);
      expectShape(readShape(el), expectedShape(vector, items), `shape ${id}`);
      expect(editRows(el).length, `${id} display rows`).toBe(display.length);

      // "Fixed `rows`: exact count" — including trimming the data that does not
      // fit. Whatever the display does, the VALUE is the data it still holds.
      const kept = combo.rows > 0 ? items.slice(0, combo.rows) : items;
      expect(el.getItems(), `${id} data`).toEqual(kept.map(canonical));
      expect(el.value, `${id} serialized`).toBe(serialize(kept));

      // "Fixed `rows`: … no delete" — the affordance is absent, not disabled.
      expect(deleteButtons(el).length, `${id} delete buttons`)
        .toBe(combo.rows > 0 ? 0 : display.length);
    });
  }
});

/**
 * "Lowering fixed `rows` drops entries beyond new count." A separate test
 * because it is a claim about a TRANSITION, which no single mount can make.
 */
describe('key-value matrix: changing the row configuration', () => {
  it('lowering a fixed row count drops the entries beyond it', async () => {
    const el = await mountKeyValue({ rows: 5 });
    el.setItems(entries(5));
    await tick(el);
    expect(el.getItems()).toHaveLength(5);

    el.rows = 2;
    await tick(el);
    expect(editRows(el).length, 'display row count').toBe(2);
    expect(el.getItems(), 'entries beyond the new count survived')
      .toEqual(entries(2).map(canonical));
    expect(el.value).toBe(serialize(entries(2)));
  });

  it('raising a fixed row count pads with empty rows and keeps the data', async () => {
    const el = await mountKeyValue({ rows: 2 });
    el.setItems(entries(2));
    await tick(el);

    el.rows = 5;
    await tick(el);
    expect(editRows(el).length).toBe(5);
    expect(el.getItems(), 'padding became data').toEqual(entries(2).map(canonical));
  });

  /**
   * FINDING MATRIX-key-value-1.
   *
   * `rows` is documented as "0 variable; >0 exact fixed count", and the display
   * of a VARIABLE editor is documented as its data rows plus one trailing empty
   * row ("Variable + auto-expand: trailing empty display row"). Moving a fixed
   * editor back to variable leaves the padding rows the fixed count had
   * created, so an editor holding one entry displays three rows: one data row
   * and TWO empty ones. The assertion is not weakened — the documented display
   * for one entry under `rows = 0` with auto-expand is two rows.
   */
  it.fails(
    'MATRIX-key-value-1: turning a fixed count back to variable restores auto-expand',
    async () => {
      const el = await mountKeyValue({ rows: 3, autoExpand: true });
      el.setItems(entries(1));
      await tick(el);
      expect(editRows(el).length).toBe(3);

      el.rows = 0;
      await tick(el);
      // One data row plus the documented trailing editing row.
      expect(editRows(el).length,
        'the fixed count\'s padding rows survived the move to variable').toBe(2);
      expect(el.getItems()).toEqual(entries(1).map(canonical));
    },
  );

  it('the data survives the move from fixed to variable even so', async () => {
    // The finding above is about the DISPLAY. The value must be untouched, and
    // that half is asserted here so a regression in it cannot hide behind the
    // pinned test.
    const el = await mountKeyValue({ rows: 3, autoExpand: true });
    el.setItems(entries(1));
    await tick(el);
    el.rows = 0;
    await tick(el);
    expect(el.getItems()).toEqual(entries(1).map(canonical));
    expect(el.value).toBe(serialize(entries(1)));
  });

  it('auto-expand adds exactly one trailing row, never two', async () => {
    const el = await mountKeyValue({ rows: 0, autoExpand: true });
    el.setItems(entries(2));
    await tick(el);
    expect(editRows(el).length).toBe(3);

    // Setting the same data again must not stack another empty row.
    el.setItems(entries(2));
    await tick(el);
    expect(editRows(el).length, 'a second trailing row appeared').toBe(3);
  });
});

/**
 * The documented data methods, crossed against the row configuration that
 * changes their answers.
 */
describe('key-value matrix: the data methods', () => {
  const MUTATIONS = product({
    rows: [0, 3] as const,
    method: ['addItem', 'removeItem', 'clear', 'setItems'] as const,
  });

  for (const combo of MUTATIONS) {
    const id = `rows=${combo.rows}/${combo.method}`;

    it(id, async () => {
      const el = await mountKeyValue({ rows: combo.rows });
      el.setItems(entries(2));
      await tick(el);
      const seen = recordEvents(el);

      switch (combo.method) {
        case 'addItem': el.addItem('PORT', '3000', 'HTTP listener'); break;
        case 'removeItem': el.removeItem(0); break;
        case 'clear': el.clear(); break;
        case 'setItems': el.setItems(entries(1)); break;
      }
      await tick(el);

      switch (combo.method) {
        case 'addItem': {
          // "add fills empty row" in fixed mode; appends in variable mode.
          // Either way the entry is now data, at the index the event named.
          expect(el.getItems()).toEqual([
            ...entries(2).map(canonical),
            { key: 'PORT', value: '3000', description: 'HTTP listener' },
          ]);
          // "emits add then change" — the order is the contract.
          expect(seen.map(e => e.type)).toEqual(['kv-add', 'kv-change']);
          expect(seen[0].detail.item)
            .toEqual({ key: 'PORT', value: '3000', description: 'HTTP listener' });
          expect(seen[0].detail.index).toBe(2);
          expect(seen[1].detail.items).toEqual(el.getItems());
          break;
        }
        case 'removeItem': {
          expect(el.getItems()).toEqual([canonical(entries(2)[1])]);
          // "emits remove then change".
          expect(seen.map(e => e.type)).toEqual(['kv-remove', 'kv-change']);
          expect(seen[0].detail.item).toEqual(canonical(entries(2)[0]));
          expect(seen[0].detail.index).toBe(0);
          break;
        }
        case 'clear': {
          expect(el.getItems()).toEqual([]);
          expect(el.value).toBe('[]');
          // "clear() - Clear and emit change" — change only.
          expect(seen.map(e => e.type)).toEqual(['kv-change']);
          expect(seen[0].detail.items).toEqual([]);
          break;
        }
        case 'setItems': {
          expect(el.getItems()).toEqual(entries(1).map(canonical));
          // "setItems(items) — Replace live data; SILENT."
          expect(seen.map(e => e.type)).toEqual([]);
          break;
        }
      }
    });
  }

  it('"full add is no-op" in fixed mode', async () => {
    const el = await mountKeyValue({ rows: 2 });
    el.setItems(entries(2));
    await tick(el);
    const seen = recordEvents(el);

    el.addItem('PORT', '3000');
    await tick(el);

    expect(el.getItems(), 'a full fixed editor accepted another entry')
      .toEqual(entries(2).map(canonical));
    expect(seen.map(e => e.type), 'a no-op add dispatched events').toEqual([]);
  });

  it('addItem fills the first EMPTY row rather than appending past it', async () => {
    const el = await mountKeyValue({ rows: 4 });
    el.setItems(entries(1));
    await tick(el);

    el.addItem('PORT', '3000');
    await tick(el);
    expect(el.getItems()).toEqual([
      canonical(entries(1)[0]),
      { key: 'PORT', value: '3000', description: '' },
    ]);
    expect(editRows(el).length, 'the fixed count changed').toBe(4);
  });

  it('removeItem outside the range does nothing at all', async () => {
    const el = await mountKeyValue();
    el.setItems(entries(2));
    await tick(el);
    const seen = recordEvents(el);

    el.removeItem(-1);
    el.removeItem(99);
    await tick(el);

    expect(el.getItems()).toEqual(entries(2).map(canonical));
    expect(seen.map(e => e.type)).toEqual([]);
  });

  it('getItems returns COPIES, so a caller cannot reach into the editor', async () => {
    const el = await mountKeyValue();
    el.setItems(entries(1));
    await tick(el);

    const items = el.getItems();
    items[0].key = 'MUTATED';
    await tick(el);
    expect(el.getItems()[0].key, 'getItems handed out live state').toBe('K1');
  });
});
