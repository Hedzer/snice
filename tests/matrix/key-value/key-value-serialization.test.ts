/**
 * MATRIX slice — snice-key-value: the serialized value.
 *
 * Dimensions (docs/ai/components/key-value.md, "Serialization"):
 *   payload shape (8) x entry channel (3) = 24 combos
 *
 * The three entry channels are the three documented ways data arrives, and the
 * docs give them ONE canonical result:
 *
 *   · the `value` ATTRIBUTE — documented as `defaultValue`, the reset default;
 *   · the `value` PROPERTY  — "live ordered JSON entry array";
 *   · `setItems(items)`     — "Replace live data; silent".
 *
 * The eight payloads each put a different clause in charge of the answer:
 * the empty editor, a plain entry, duplicate keys, Unicode, descriptions, a
 * value-only row, the legacy string-valued object form, and malformed JSON.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product, unmountAll } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock, activeFlags } from '../internals-mock';
import {
  mountKeyValue, tick, serialize, parseDocumented, canonical, recordEvents,
  type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

/**
 * The payloads. `items` is what the docs say the editor holds afterwards;
 * `null` means "malformed — retained raw, `badInput` set".
 */
const PAYLOADS: Array<{
  id: string; serialized: string; items: KeyValueItem[] | null;
  /** Documented `badInput`: a meaningful row whose key is blank. */
  invalidRow?: boolean;
}> = [
  {
    id: 'empty',
    serialized: '[]',
    items: [],
  },
  {
    id: 'single',
    serialized: '[{"key":"Accept","value":"application/json","description":""}]',
    items: [{ key: 'Accept', value: 'application/json', description: '' }],
  },
  {
    // "Duplicate keys are preserved with their order, descriptions, and Unicode."
    id: 'duplicates',
    serialized: '[{"key":"A","value":"1","description":""},'
      + '{"key":"A","value":"2","description":"duplicate"}]',
    items: [
      { key: 'A', value: '1', description: '' },
      { key: 'A', value: '2', description: 'duplicate' },
    ],
  },
  {
    id: 'unicode',
    serialized: '[{"key":"ключ","value":"значение 🎉","description":"日本語"}]',
    items: [{ key: 'ключ', value: 'значение 🎉', description: '日本語' }],
  },
  {
    // "Empty value is valid when key exists."
    id: 'empty-value',
    serialized: '[{"key":"FLAG","value":"","description":""}]',
    items: [{ key: 'FLAG', value: '', description: '' }],
  },
  {
    // A value-only row is meaningful data (it is not wholly empty) even though
    // it is invalid; serialization and validity are different questions.
    id: 'value-only',
    serialized: '[{"key":"","value":"orphan","description":""}]',
    items: [{ key: '', value: 'orphan', description: '' }],
    // "Value-only/description-only row is invalid" — it serializes exactly as
    // authored AND raises badInput. Round-tripping and validity are different
    // questions, and this payload is the one that tells them apart.
    invalidRow: true,
  },
  {
    // "Accepts old string-valued object JSON input; immediately normalizes to
    // array."
    id: 'legacy-object',
    serialized: '{"Accept":"application/json","Cache-Control":"no-cache"}',
    items: [
      { key: 'Accept', value: 'application/json', description: '' },
      { key: 'Cache-Control', value: 'no-cache', description: '' },
    ],
  },
  {
    // "Malformed JSON/schema is retained in live `value`, sets `badInput`."
    id: 'malformed',
    serialized: '[{"key":1,"value":"x"}]',
    items: null,
  },
];

const CHANNELS = ['attribute', 'property', 'setItems'] as const;

const COMBOS = product({ payload: PAYLOADS, channel: CHANNELS })
  // `setItems` takes items, not a string, so it cannot express a malformed
  // payload at all — that is what the `value` channels are for.
  .filter(combo => !(combo.channel === 'setItems' && combo.payload.items === null));

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe(`key-value matrix: serialization (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `${combo.payload.id}/${combo.channel}`;

    it(id, async () => {
      let el: any;
      if (combo.channel === 'attribute') {
        el = await mountKeyValue({ value: combo.payload.serialized });
      } else {
        el = await mountKeyValue();
        if (combo.channel === 'property') el.value = combo.payload.serialized;
        else el.setItems(combo.payload.items!);
        await tick(el);
      }

      if (combo.payload.items === null) {
        // Retained verbatim, and flagged — not silently discarded.
        expect(el.value, `${id} did not retain the malformed value`)
          .toBe(combo.payload.serialized);
        expect(activeFlags(el), `${id} flags`).toContain('badInput');
        expect(el.getItems(), `${id} items`).toEqual([]);
        return;
      }

      // The canonical shape: an ordered array whose every entry carries all
      // three exact string fields.
      expect(el.value, `${id} serialized`).toBe(serialize(combo.payload.items));
      expect(el.getItems(), `${id} getItems`).toEqual(combo.payload.items.map(canonical));
      if (combo.payload.invalidRow) {
        expect(activeFlags(el), `${id} flags`).toContain('badInput');
      } else {
        expect(activeFlags(el), `${id} flags`).not.toContain('badInput');
      }
    });
  }
});

/**
 * "Omits wholly empty display rows" — the trailing editing row auto-expand adds
 * is display, never data, so it can never reach the serialized value.
 */
describe('key-value matrix: display rows are not data', () => {
  for (const rows of [0, 2, 4]) {
    for (const autoExpand of [true, false]) {
      const id = `rows=${rows}/${autoExpand ? 'auto-expand' : 'fixed-list'}`;
      it(id, async () => {
        const items = [{ key: 'A', value: '1', description: '' }];
        const el = await mountKeyValue({ rows, autoExpand });
        el.setItems(items);
        await tick(el);

        expect(el.value, `${id} serialized`).toBe(serialize(items));
        expect(el.getItems(), `${id} getItems`).toEqual(items.map(canonical));
      });
    }
  }

  it('an editor nobody has touched serializes as the empty array', async () => {
    const el = await mountKeyValue();
    expect(el.value).toBe('[]');
    expect(el.getItems()).toEqual([]);
  });
});

/**
 * "No user events: `setItems`, property assignment, slot sync, reset, restore."
 * The silence is a contract: an owner that re-renders on `kv-change` must not
 * be re-entered by its own write.
 */
describe('key-value matrix: the silent entry channels', () => {
  for (const channel of ['property', 'setItems', 'defaultValue', 'restore'] as const) {
    it(`${channel} dispatches no event`, async () => {
      const el = await mountKeyValue();
      const seen = recordEvents(el);

      switch (channel) {
        case 'property':
          el.value = '[{"key":"A","value":"1","description":""}]';
          break;
        case 'setItems':
          el.setItems([{ key: 'A', value: '1' }]);
          break;
        case 'defaultValue':
          el.defaultValue = '[{"key":"A","value":"1","description":""}]';
          break;
        case 'restore':
          el.formStateRestoreCallback('[{"key":"A","value":"1","description":""}]');
          break;
      }
      await tick(el);

      expect(el.getItems(), `${channel} did not apply`).toEqual([
        { key: 'A', value: '1', description: '' },
      ]);
      expect(seen.map(e => e.type), `${channel} dispatched events`).toEqual([]);
    });
  }
});

/**
 * The documented parser, asserted directly so the schema is legible without
 * reading the oracle. Everything the docs do not name is `badInput`.
 */
describe('key-value matrix: the documented schema, case by case', () => {
  const REJECTED = [
    ['not JSON at all', 'not json'],
    ['a bare number', '42'],
    ['an array of numbers', '[1,2,3]'],
    ['a nested array', '[[]]'],
    ['an entry with a non-string key', '[{"key":1,"value":"x"}]'],
    ['an entry with a non-string value', '[{"key":"a","value":2}]'],
    ['an entry with a non-string description', '[{"key":"a","value":"b","description":3}]'],
    ['an entry with an unknown field', '[{"key":"a","value":"b","extra":"c"}]'],
    ['an object with a non-string member', '{"a":1}'],
  ] as const;

  for (const [why, serialized] of REJECTED) {
    it(`rejects ${why}`, async () => {
      expect(parseDocumented(serialized)).toBeNull();
      const el = await mountKeyValue({ value: serialized });
      expect(el.value, 'the malformed value was not retained').toBe(serialized);
      expect(activeFlags(el)).toContain('badInput');
    });
  }

  const ACCEPTED = [
    ['the empty string', '', []],
    ['the empty array', '[]', []],
    ['a description-less entry', '[{"key":"a","value":"b"}]',
      [{ key: 'a', value: 'b', description: '' }]],
  ] as const;

  for (const [why, serialized, items] of ACCEPTED) {
    it(`accepts ${why}`, async () => {
      expect(parseDocumented(serialized)).toEqual(items);
      const el = await mountKeyValue({ value: serialized });
      expect(el.getItems()).toEqual(items);
      expect(activeFlags(el)).not.toContain('badInput');
    });
  }
});
