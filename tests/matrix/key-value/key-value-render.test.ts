/**
 * MATRIX slice — snice-key-value: the rendered shape across every mode.
 *
 * Dimensions (docs/ai/components/key-value.md):
 *   mode (2) x showDescription (2) x showCopy (2) x label (2)
 *   x state (3: editable, disabled, readonly) x content (2: empty, populated)
 *   = 96 combos
 *
 * What this slice grades:
 *
 *   · `mode: 'edit'|'view'` — two entirely different renderings out of one data
 *     model. Edit shows `row`/`key-input`/`value-input`; view shows
 *     `view-row`/`view-key`/`view-value`, and view of nothing is `part="empty"`.
 *   · `showDescription` — adds `description-input` per editing row, and
 *     `view-desc` per view row that HAS a description.
 *   · `showCopy` — "Copy: formatted canonical ordered array". There is nothing
 *     to copy from an empty editor, so the button belongs to a populated one.
 *   · `label` — names the group; "ARIA group named by `label` or default name",
 *     and `required` marks the title.
 *   · "Disabled/fieldset-disabled: blocked … Readonly/view: editing … barred;
 *     copy allowed." — which is a claim about which affordances still exist.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  DOCUMENTED_PARTS, mountKeyValue, tick, expectedShape, readShape, partNames,
  basePart, titlePart, copyButton, keyInputs, valueInputs, viewRows,
  type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

const POPULATED: KeyValueItem[] = [
  { key: 'Accept', value: 'application/json', description: 'Content negotiation' },
  { key: 'Cache-Control', value: 'no-cache', description: '' },
];

const COMBOS = product({
  mode: ['edit', 'view'] as const,
  showDescription: [false, true],
  showCopy: [false, true],
  label: ['', 'HTTP Headers'] as const,
  state: ['editable', 'disabled', 'readonly'] as const,
  content: ['empty', 'populated'] as const,
});

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe(`key-value matrix: rendered shape (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `${combo.mode}/${combo.content}/${combo.state}`
      + `/${combo.showDescription ? 'desc' : 'no-desc'}`
      + `/${combo.showCopy ? 'copy' : 'no-copy'}`
      + `/${combo.label ? 'labelled' : 'unlabelled'}`;

    it(id, async () => {
      const vector = {
        mode: combo.mode,
        showDescription: combo.showDescription,
        showCopy: combo.showCopy,
        label: combo.label,
        disabled: combo.state === 'disabled',
        readonly: combo.state === 'readonly',
      };
      const items = combo.content === 'populated' ? POPULATED : [];
      const el = await mountKeyValue(vector);
      el.setItems(items);
      await tick(el);

      expectShape(readShape(el), expectedShape(vector, items), `shape ${id}`);

      // Every part the tree renders is one the docs list. A part the docs do
      // not name is a public API nobody agreed to.
      for (const name of partNames(el)) {
        expect(DOCUMENTED_PARTS, `${id}: undocumented part "${name}"`).toContain(name);
      }

      // "ARIA group named by `label` or default name."
      const base = basePart(el)!;
      expect(base.getAttribute('role'), `${id} role`).toBe('group');
      if (combo.label) {
        expect(base.getAttribute('aria-labelledby'), `${id} aria-labelledby`).toBe('kv-title');
        expect(titlePart(el)?.id).toBe('kv-title');
      } else {
        expect(base.getAttribute('aria-label'), `${id} aria-label`).toBe('Key value editor');
      }
    });
  }
});

/**
 * The two renderings, named. These combos are already inside the cross above;
 * asserting them by name is what makes a regression report the DOC that broke.
 */
describe('key-value matrix: edit mode and view mode are different renderings', () => {
  it('edit mode renders one input pair per display row', async () => {
    const el = await mountKeyValue({ mode: 'edit', showDescription: true });
    el.setItems(POPULATED);
    await tick(el);

    // Two data rows plus the documented trailing editing row.
    expect(keyInputs(el).map(input => input.value)).toEqual(['Accept', 'Cache-Control', '']);
    expect(valueInputs(el).map(input => input.value))
      .toEqual(['application/json', 'no-cache', '']);
    expect(viewRows(el)).toHaveLength(0);
  });

  it('view mode renders the DATA rows only — no editing row, no inputs', async () => {
    const el = await mountKeyValue({ mode: 'view', showDescription: true });
    el.setItems(POPULATED);
    await tick(el);

    expect(keyInputs(el), 'view mode rendered editable inputs').toHaveLength(0);
    expect(viewRows(el)).toHaveLength(2);
    expect(viewRows(el).map(row => row.querySelector('[part~="view-key"]')?.textContent))
      .toEqual(['Accept', 'Cache-Control']);
    // "view-desc" appears only for a row that HAS a description.
    expect(viewRows(el).map(row => !!row.querySelector('[part~="view-desc"]')))
      .toEqual([true, false]);
  });

  it('view mode with no data renders the empty state and no rows', async () => {
    const el = await mountKeyValue({ mode: 'view' });
    await tick(el);
    expect(partNames(el)).toContain('empty');
    expect(partNames(el), 'an empty view still rendered a rows container').not.toContain('rows');
    expect(viewRows(el)).toHaveLength(0);
  });

  it('an EMPTY EDITOR is not the empty state — it is a row to type in', async () => {
    const el = await mountKeyValue({ mode: 'edit' });
    await tick(el);
    expect(partNames(el), 'an editor rendered the view-mode empty state')
      .not.toContain('empty');
    expect(keyInputs(el)).toHaveLength(1);
  });
});

describe('key-value matrix: the copy affordance', () => {
  it('showCopy renders no button for an editor with nothing to copy', async () => {
    const el = await mountKeyValue({ showCopy: true });
    await tick(el);
    expect(copyButton(el)).toBeNull();
  });

  it('showCopy renders a button once there is data', async () => {
    const el = await mountKeyValue({ showCopy: true });
    el.setItems(POPULATED);
    await tick(el);
    expect(copyButton(el)).not.toBeNull();
    expect(copyButton(el)?.disabled).toBe(false);
  });

  it('"copy allowed" under readonly and in view mode', async () => {
    for (const vector of [{ readonly: true }, { mode: 'view' as const }]) {
      const el = await mountKeyValue({ showCopy: true, ...vector });
      el.setItems(POPULATED);
      await tick(el);
      expect(copyButton(el), `copy button under ${JSON.stringify(vector)}`).not.toBeNull();
      expect(copyButton(el)?.disabled, `copy disabled under ${JSON.stringify(vector)}`)
        .toBe(false);
      el.remove();
    }
  });

  it('a disabled editor disables the copy button', async () => {
    // "Disabled … blocked" applies to every affordance, copy included; only
    // readonly and view are documented as keeping it.
    const el = await mountKeyValue({ showCopy: true, disabled: true });
    el.setItems(POPULATED);
    await tick(el);
    expect(copyButton(el)?.disabled).toBe(true);
  });
});

describe('key-value matrix: placeholders', () => {
  it('the documented defaults appear on every row', async () => {
    const el = await mountKeyValue();
    await tick(el);
    expect(keyInputs(el)[0].placeholder).toBe('Key');
    expect(valueInputs(el)[0].placeholder).toBe('Value');
  });

  it('keyPlaceholder and valuePlaceholder replace them', async () => {
    const el = await mountKeyValue({
      keyPlaceholder: 'Header', valuePlaceholder: 'Contents',
    });
    el.setItems(POPULATED);
    await tick(el);
    for (const input of keyInputs(el)) expect(input.placeholder).toBe('Header');
    for (const input of valueInputs(el)) expect(input.placeholder).toBe('Contents');
  });

  it('per-row placeholder samples come from the documented list', async () => {
    const samples = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '3000' },
    ];
    const el = await mountKeyValue();
    el.placeholders = samples;
    el.setItems(POPULATED);
    await tick(el);

    for (const input of keyInputs(el)) {
      expect(samples.map(s => s.key), `key placeholder "${input.placeholder}"`)
        .toContain(input.placeholder);
    }
    for (const input of valueInputs(el)) {
      expect(samples.map(s => s.value), `value placeholder "${input.placeholder}"`)
        .toContain(input.placeholder);
    }
  });
});
