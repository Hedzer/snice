/**
 * MATRIX slice — snice-key-value: slot mode and the form lifecycle.
 *
 * Dimensions (docs/ai/components/key-value.md, "Slots" and "Lifecycle"):
 *   slot mode x mutation method (4) = 4, plus the slot transitions (5),
 *   plus the pristine/dirty cross: source (3) x follow (2) = 6,
 *   plus form participation (5) and restore (4).
 *
 * ── Slot mode ──────────────────────────────────────────────────────────────
 *   · "Direct `<snice-kv-pair>` children" are the data;
 *   · "Direct children override ALL imperative mutation methods" — so
 *     `setItems`, `addItem`, `removeItem` and `clear` are no-ops, not errors;
 *   · "Child attributes are declarative reset defaults; removing all children
 *     reapplies `defaultValue`";
 *   · "slot mode reset -> current pair attributes";
 *   · "No user events: … slot sync".
 *
 * ── Form lifecycle ─────────────────────────────────────────────────────────
 *   · "Pristine default/`value`-attribute mutation updates live value. Dirty
 *     default mutation changes next reset only.";
 *   · "Reset -> `defaultValue`";
 *   · "Browser restore accepts strings only; non-string state ignored
 *     atomically.";
 *   · "FACE: `FormData`, `form.elements`, `form="id"`, labels, reset/restore,
 *     fieldsets."
 *
 * ── How the form contract is observed ──────────────────────────────────────
 * Through `tests/matrix/internals-mock.ts`, the shared recorder this tier uses
 * for every form-associated component: happy-dom attaches `ElementInternals`
 * but implements no `FormData`, no `form.elements`, no `form.reset()` reaching
 * `formResetCallback`, and no fieldset disabledness for a custom element. The
 * real plumbing is asserted in the visual tier, where an engine runs it.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, wait } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, submittedEntry, activeFlags,
} from '../internals-mock';
import {
  mountKeyValue, tick, serialize, recordEvents, canonical, keyInputs,
  type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

const PAIRS = '<snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>'
  + '<snice-kv-pair key="Cache-Control" value="no-cache" description="cdn"></snice-kv-pair>';

const PAIR_ITEMS: KeyValueItem[] = [
  { key: 'Accept', value: 'application/json', description: '' },
  { key: 'Cache-Control', value: 'no-cache', description: 'cdn' },
];

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe('key-value matrix: slot mode is the data', () => {
  it('direct children become the value, in their authored order', async () => {
    const el = await mountKeyValue({ name: 'headers' }, PAIRS);
    expect(el.getItems()).toEqual(PAIR_ITEMS);
    expect(el.value).toBe(serialize(PAIR_ITEMS));
    expect(submittedEntry(el)).toEqual(['headers', serialize(PAIR_ITEMS)]);
  });

  it('children win over an authored `value` attribute', async () => {
    const el = await mountKeyValue(
      { value: '[{"key":"IGNORED","value":"x","description":""}]' }, PAIRS,
    );
    expect(el.getItems(), 'the value attribute overrode the children').toEqual(PAIR_ITEMS);
  });

  for (const method of ['setItems', 'addItem', 'removeItem', 'clear'] as const) {
    it(`${method} is a no-op in slot mode`, async () => {
      const el = await mountKeyValue({}, PAIRS);
      const seen = recordEvents(el);

      switch (method) {
        case 'setItems': el.setItems([{ key: 'X', value: 'y' }]); break;
        case 'addItem': el.addItem('X', 'y'); break;
        case 'removeItem': el.removeItem(0); break;
        case 'clear': el.clear(); break;
      }
      await tick(el);

      expect(el.getItems(), `${method} mutated a slot-driven editor`).toEqual(PAIR_ITEMS);
      expect(seen.map(e => e.type), `${method} dispatched events`).toEqual([]);
    });
  }

  it('adding a child extends the value, silently', async () => {
    const el = await mountKeyValue({}, PAIRS);
    const seen = recordEvents(el);

    const pair = document.createElement('snice-kv-pair');
    pair.setAttribute('key', 'X-Trace');
    pair.setAttribute('value', 'on');
    el.appendChild(pair);
    await tick(el);

    expect(el.getItems()).toEqual([
      ...PAIR_ITEMS,
      { key: 'X-Trace', value: 'on', description: '' },
    ]);
    // "No user events: … slot sync."
    expect(seen.map(e => e.type)).toEqual([]);
  });

  it("changing a child's attribute updates the value, silently", async () => {
    const el = await mountKeyValue({}, PAIRS);
    const seen = recordEvents(el);

    el.children[0].setAttribute('value', 'text/plain');
    await tick(el);

    expect(el.getItems()[0]).toEqual({ key: 'Accept', value: 'text/plain', description: '' });
    expect(seen.map(e => e.type)).toEqual([]);
  });

  it('removing ALL children reapplies defaultValue', async () => {
    const fallback = '[{"key":"FALLBACK","value":"1","description":""}]';
    const el = await mountKeyValue({ value: fallback }, PAIRS);
    expect(el.getItems()).toEqual(PAIR_ITEMS);

    el.innerHTML = '';
    await tick(el);
    expect(el.getItems(), 'defaultValue was not reapplied')
      .toEqual([{ key: 'FALLBACK', value: '1', description: '' }]);
  });

  it('reset in slot mode restores the CURRENT pair attributes', async () => {
    const el = await mountKeyValue({}, PAIRS);
    // A child attribute changes; the editor follows.
    el.children[0].setAttribute('value', 'text/plain');
    await tick(el);
    expect(el.getItems()[0].value).toBe('text/plain');

    const seen = recordEvents(el);
    el.formResetCallback();
    await tick(el);

    // "slot mode reset -> current pair attributes" — the LIVE attributes, not
    // the ones the document was first parsed with.
    expect(el.getItems()[0].value).toBe('text/plain');
    expect(seen.map(e => e.type), 'reset dispatched events').toEqual([]);
  });
});

describe('key-value matrix: the pristine/dirty split', () => {
  it('a pristine editor follows a changing default', async () => {
    const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
    el.defaultValue = '[{"key":"B","value":"2","description":""}]';
    await tick(el);
    expect(el.getItems()).toEqual([{ key: 'B', value: '2', description: '' }]);
  });

  for (const source of ['property', 'setItems', 'typing'] as const) {
    it(`after ${source} the editor is dirty and stops following the default`, async () => {
      const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });

      switch (source) {
        case 'property':
          el.value = '[{"key":"LIVE","value":"9","description":""}]';
          break;
        case 'setItems':
          el.setItems([{ key: 'LIVE', value: '9' }]);
          break;
        case 'typing': {
          const input = keyInputs(el)[0];
          input.value = 'LIVE';
          input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          break;
        }
      }
      await tick(el);
      const dirtied = el.value;

      el.defaultValue = '[{"key":"B","value":"2","description":""}]';
      await tick(el);
      expect(el.value, `${source} did not dirty the editor`).toBe(dirtied);
      expect(el.defaultValue).toBe('[{"key":"B","value":"2","description":""}]');
    });
  }

  it('reset restores the LATEST default', async () => {
    const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
    el.setItems([{ key: 'LIVE', value: '9' }]);
    await tick(el);
    el.defaultValue = '[{"key":"B","value":"2","description":""}]';
    await tick(el);
    expect(el.getItems()[0].key, 'a dirty editor followed the default').toBe('LIVE');

    el.formResetCallback();
    await tick(el);
    expect(el.getItems()).toEqual([{ key: 'B', value: '2', description: '' }]);
  });

  it('repeated reset does not rewrite the authored state', async () => {
    const authored = '[{"key":"A","value":"1","description":""}]';
    const el = await mountKeyValue({ value: authored });
    for (let i = 0; i < 3; i++) {
      el.setItems([{ key: 'LIVE', value: '9' }]);
      await tick(el);
      el.formResetCallback();
      await tick(el);
      expect(el.value, `reset #${i + 1}`).toBe(authored);
      expect(el.defaultValue, `default after reset #${i + 1}`).toBe(authored);
    }
  });

  it('a reconnect does not rewrite the live value', async () => {
    const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
    el.setItems([{ key: 'LIVE', value: '9' }]);
    await tick(el);
    const live = el.value;

    const parent = el.parentElement!;
    el.remove();
    await wait(10);
    parent.appendChild(el);
    await tick(el);
    expect(el.value, 'a reconnect rewrote the live value').toBe(live);
  });
});

describe('key-value matrix: form participation', () => {
  it('a named editor contributes its canonical serialization', async () => {
    const el = await mountKeyValue({ name: 'headers' });
    expect(el.type).toBe('key-value');
    expect(submittedEntry(el)).toEqual(['headers', '[]']);

    el.setItems(PAIR_ITEMS);
    await tick(el);
    expect(submittedEntry(el)).toEqual(['headers', serialize(PAIR_ITEMS)]);
  });

  it('an unnamed editor contributes nothing', async () => {
    const el = await mountKeyValue();
    el.setItems(PAIR_ITEMS);
    await tick(el);
    expect(submittedEntry(el)).toBeNull();
  });

  it('"remains raw FormData" — a malformed value is still submitted verbatim', async () => {
    const malformed = '[{"key":1,"value":"x"}]';
    const el = await mountKeyValue({ name: 'headers', value: malformed });
    await tick(el);
    expect(activeFlags(el)).toContain('badInput');
    expect(submittedEntry(el), 'the malformed value was rewritten before submission')
      .toEqual(['headers', malformed]);
  });

  it('a readonly editor "remains successful"', async () => {
    const el = await mountKeyValue({
      name: 'headers', readonly: true, value: serialize(PAIR_ITEMS),
    });
    await tick(el);
    expect(submittedEntry(el)).toEqual(['headers', serialize(PAIR_ITEMS)]);
    expect(el.willValidate, 'a readonly editor still validates').toBe(false);
  });

  it('a fieldset bar leaves the authored `disabled` property alone', async () => {
    const el = await mountKeyValue({ name: 'headers', value: serialize(PAIR_ITEMS) });
    el.formDisabledCallback(true);
    await tick(el);
    expect(el.disabled, "the fieldset wrote the host's disabled property").toBe(false);
    expect(el.willValidate).toBe(false);
    expect(el.getItems(), 'the fieldset rewrote the data').toEqual(PAIR_ITEMS);
  });

  it('"Public data methods remain usable while UI is disabled/readonly"', async () => {
    for (const barrier of ['disabled', 'readonly'] as const) {
      const el = await mountKeyValue({ [barrier]: true });
      el.setItems(PAIR_ITEMS);
      await tick(el);
      expect(el.getItems(), `setItems under ${barrier}`).toEqual(PAIR_ITEMS);

      el.addItem('X-Trace', 'on');
      await tick(el);
      expect(el.getItems().at(-1), `addItem under ${barrier}`)
        .toEqual({ key: 'X-Trace', value: 'on', description: '' });

      el.clear();
      await tick(el);
      expect(el.getItems(), `clear under ${barrier}`).toEqual([]);
      el.remove();
    }
  });
});

describe('key-value matrix: browser state restore', () => {
  it('a restored string becomes the live value', async () => {
    const el = await mountKeyValue();
    el.formStateRestoreCallback(serialize(PAIR_ITEMS));
    await tick(el);
    expect(el.getItems()).toEqual(PAIR_ITEMS);
  });

  it('a restored string dirties the editor', async () => {
    const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
    el.formStateRestoreCallback(serialize(PAIR_ITEMS));
    await tick(el);

    el.defaultValue = '[{"key":"B","value":"2","description":""}]';
    await tick(el);
    expect(el.getItems(), 'restore did not dirty the editor').toEqual(PAIR_ITEMS);
  });

  for (const state of [null, new FormData()] as const) {
    it(`a non-string restore (${state === null ? 'null' : 'FormData'}) is ignored atomically`,
      async () => {
        const authored = '[{"key":"A","value":"1","description":""}]';
        const el = await mountKeyValue({ value: authored });
        el.formStateRestoreCallback(state as any);
        await tick(el);
        expect(el.value, 'a non-string restore changed the value').toBe(authored);
        expect(el.getItems()).toEqual([canonical({ key: 'A', value: '1' })]);
      });
  }

  it('a restored MALFORMED string is retained and flagged, like any other', async () => {
    const el = await mountKeyValue({ name: 'headers' });
    el.formStateRestoreCallback('not json');
    await tick(el);
    expect(el.value).toBe('not json');
    expect(activeFlags(el)).toContain('badInput');
    expect(submittedEntry(el)).toEqual(['headers', 'not json']);
  });
});
