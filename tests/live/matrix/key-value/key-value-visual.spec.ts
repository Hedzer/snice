/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-key-value TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/key-value, `npm run test:matrix`) owns value
 * truth: the canonical serialization, the display model, the mutation events,
 * validity, slot mode, and the form lifecycle as seen through
 * `ElementInternals`.
 *
 * Two categories of claim it cannot own:
 *
 *   1. LAYOUT. This editor is `width: 100%` and divides that width between a
 *      key field, a value field, an optional description field and a delete
 *      button. Every one of those boxes reads zero in happy-dom, so an editor
 *      that stacked its fields on top of each other, clipped the delete button
 *      out of its own `overflow: hidden` frame, or collapsed a column to
 *      nothing passes the entire DOM tier.
 *   2. THE REAL FORM. happy-dom implements no `FormData`, no `form.elements`,
 *      no `form.reset()` reaching `formResetCallback`, no `<label for>`
 *      association and no `<fieldset disabled>` for a form-associated custom
 *      element. Only here does the browser's own plumbing run.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is `display: block` and the frame a bordered box in the theme's
 *     own border colour;
 *   · every row's fields run LEFT TO RIGHT without overlapping, inside the
 *     frame, with the delete button (when there is one) at the end and fully
 *     inside it;
 *   · rows stack top to bottom without overlapping;
 *   · a disabled or readonly field is visibly marked (dimmed, or on the
 *     element surface) and shows the right cursor;
 *   · an invalid key field is bordered in the danger colour, and only that one;
 *   · view mode paints its key column and its monospaced value column side by
 *     side;
 *   · every editable field is hit-testable where a user would click it.
 *
 * ── Layer 2: the real form, real clicks, and one pinned capture ────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/key-value/matrix.html';

interface Item { key: string; value: string; description?: string }

const ITEMS: Item[] = [
  { key: 'Accept', value: 'application/json', description: 'Content negotiation' },
  { key: 'Cache-Control', value: 'no-cache', description: '' },
];

type State = 'editable' | 'disabled' | 'readonly';

interface Combo {
  id: string;
  mode: 'edit' | 'view';
  showDescription: boolean;
  state: State;
  content: 'empty' | 'populated';
  showCopy: boolean;
  items: Item[];
}

/**
 * The cross: mode (2) x showDescription (2) x state (3) x content (2)
 * x showCopy (2) = 48 combos.
 *
 * Every axis here changes which BOXES exist: the mode swaps the whole
 * rendering, `showDescription` adds a column, the state decides whether a
 * delete button is drawn at all, the content decides whether there are rows or
 * an empty state, and `showCopy` adds a header the rows must sit below.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const mode of ['edit', 'view'] as const) {
    for (const showDescription of [false, true]) {
      for (const state of ['editable', 'disabled', 'readonly'] as State[]) {
        for (const content of ['empty', 'populated'] as const) {
          for (const showCopy of [false, true]) {
            combos.push({
              id: `${mode}/${content}/${state}`
                + `/${showDescription ? 'desc' : 'no-desc'}`
                + `/${showCopy ? 'copy' : 'no-copy'}`,
              mode,
              showDescription,
              state,
              content,
              showCopy,
              items: content === 'populated' ? ITEMS : [],
            });
          }
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function mount(combo: Record<string, unknown>): Promise<any> {
  return page.evaluate(c => (window as any).matrix.mount(c), combo as any);
}

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const token = (name: string) => (window as any).matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    // Exact part matching, never `[part~=…]`: this component's part names share
    // tokens (`row`/`view-row`, `value-input`/`view-value`).
    const tokensOf = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/);
    const partsNamed = (name: string, root: ParentNode = sr) =>
      [...root.querySelectorAll('[part]')]
        .filter(node => tokensOf(node).includes(name)) as HTMLElement[];
    const partNamed = (name: string, root: ParentNode = sr) => partsNamed(name, root)[0] ?? null;

    if (getComputedStyle(host).display !== 'block') {
      say(`host computed display "${getComputedStyle(host).display}", expected "block"`);
    }

    const frame = partNamed('base');
    if (!frame) { say('no part="base" rendered'); return problems; }
    const frameBox = rect(frame);
    const frameCs = getComputedStyle(frame);
    if (frameBox.width <= 0 || frameBox.height <= 0) {
      say(`frame renders at ${frameBox.width}x${frameBox.height}`);
      return problems;
    }
    const border = token('--snice-color-border');
    if (parseFloat(frameCs.borderTopWidth) <= 0) {
      say(`frame has no border (border-top-width ${frameCs.borderTopWidth})`);
    }
    if (frameCs.borderTopColor !== border) {
      say(`frame border "${frameCs.borderTopColor}", expected --snice-color-border "${border}"`);
    }

    // The copy affordance sits in the header, above the rows, when there is
    // something to copy.
    const copy = partNamed('copy-button');
    const wantsCopy = combo.showCopy && combo.content === 'populated';
    if (wantsCopy && !copy) say('showCopy with data painted no copy button');
    if (!wantsCopy && copy) say('a copy button was painted with nothing to copy');
    if (copy) {
      const copyBox = rect(copy);
      if (copyBox.width <= 0 || copyBox.height <= 0) {
        say(`copy button renders at ${copyBox.width}x${copyBox.height}`);
      }
      if (copyBox.right > frameBox.right + EPS) {
        say(`copy button (right ${copyBox.right.toFixed(1)}) escapes the frame`
          + ` (right ${frameBox.right.toFixed(1)})`);
      }
      const cursor = getComputedStyle(copy).cursor;
      const wanted = combo.state === 'disabled' ? 'not-allowed' : 'pointer';
      if (cursor !== wanted) say(`copy button cursor "${cursor}", expected "${wanted}"`);
    }

    if (combo.mode === 'view') {
      const rows = partsNamed('view-row');
      if (combo.content === 'empty') {
        if (rows.length) say(`an empty view painted ${rows.length} rows`);
        const empty = partNamed('empty');
        if (!empty) { say('an empty view painted no part="empty"'); }
        else if (rect(empty).height <= 0) {
          say(`the empty state renders at height ${rect(empty).height}`);
        }
        return problems;
      }
      if (rows.length !== combo.items.length) {
        say(`${rows.length} view rows, expected ${combo.items.length}`);
        return problems;
      }
      let previousBottom = -Infinity;
      for (const [index, row] of rows.entries()) {
        const rowBox = rect(row);
        if (rowBox.height <= 0) say(`view row ${index} renders at height ${rowBox.height}`);
        if (rowBox.top < previousBottom - EPS) {
          say(`view row ${index} (top ${rowBox.top.toFixed(1)}) overlaps row ${index - 1}`);
        }
        previousBottom = rowBox.bottom;

        const key = partNamed('view-key', row);
        const value = partNamed('view-value', row);
        if (!key || !value) { say(`view row ${index} is missing its key or value`); continue; }
        const keyBox = rect(key);
        const valueBox = rect(value);
        if (keyBox.width <= 0 || valueBox.width <= 0) {
          say(`view row ${index} boxes: key ${keyBox.width}, value ${valueBox.width}`);
        }
        if (valueBox.left < keyBox.right - EPS) {
          say(`view row ${index}: the value (left ${valueBox.left.toFixed(1)}) overlaps`
            + ` the key (right ${keyBox.right.toFixed(1)})`);
        }
        // The documented reading order: a named key, then a machine value.
        if (!/mono/i.test(getComputedStyle(value).fontFamily)) {
          say(`view row ${index} value is not monospaced`
            + ` ("${getComputedStyle(value).fontFamily}")`);
        }
        const desc = partNamed('view-desc', row);
        const wantsDesc = combo.showDescription && !!combo.items[index].description;
        if (wantsDesc && !desc) say(`view row ${index} has a description but painted none`);
        if (!wantsDesc && desc) say(`view row ${index} painted a description it does not have`);
      }
      return problems;
    }

    // ── Edit mode ──────────────────────────────────────────────────────────
    const rows = partsNamed('row');
    if (!rows.length) { say('an editor painted no rows'); return problems; }
    if (partNamed('empty')) say('an editor painted the view-mode empty state');

    let previousBottom = -Infinity;
    for (const [index, row] of rows.entries()) {
      const rowBox = rect(row);
      if (rowBox.height <= 0) { say(`row ${index} renders at height ${rowBox.height}`); continue; }
      if (rowBox.top < previousBottom - EPS) {
        say(`row ${index} (top ${rowBox.top.toFixed(1)}) overlaps row ${index - 1}`
          + ` (bottom ${previousBottom.toFixed(1)})`);
      }
      previousBottom = rowBox.bottom;
      if (rowBox.left < frameBox.left - EPS || rowBox.right > frameBox.right + EPS) {
        say(`row ${index} escapes the frame`);
      }

      const keyInput = partNamed('key-input', row) as HTMLInputElement | null;
      const valueInput = partNamed('value-input', row) as HTMLInputElement | null;
      if (!keyInput || !valueInput) { say(`row ${index} is missing a field`); continue; }
      const keyBox = rect(keyInput);
      const valueBox = rect(valueInput);
      for (const [name, box] of [['key', keyBox], ['value', valueBox]] as Array<[string, DOMRect]>) {
        if (box.width <= 0 || box.height <= 0) {
          say(`row ${index} ${name} field renders at ${box.width}x${box.height}`);
        }
        if (box.left < frameBox.left - EPS || box.right > frameBox.right + EPS) {
          say(`row ${index} ${name} field escapes the frame`);
        }
      }
      // The pair shares the row: side by side, never stacked and never on top
      // of each other.
      if (valueBox.left < keyBox.right - EPS) {
        say(`row ${index}: the value field (left ${valueBox.left.toFixed(1)}) overlaps`
          + ` the key field (right ${keyBox.right.toFixed(1)})`);
      }
      if (Math.abs((keyBox.top + keyBox.height / 2) - (valueBox.top + valueBox.height / 2)) > 2) {
        say(`row ${index}: the key and value fields are not on one line`);
      }

      const descInput = partNamed('description-input', row) as HTMLInputElement | null;
      if (combo.showDescription && !descInput) {
        say(`row ${index} shows no description field although showDescription is set`);
      }
      if (!combo.showDescription && descInput) {
        say(`row ${index} painted a description field it was not asked for`);
      }
      if (descInput) {
        const descBox = rect(descInput);
        if (descBox.width <= 0 || descBox.height <= 0) {
          say(`row ${index} description renders at ${descBox.width}x${descBox.height}`);
        }
        // The description is a second line under the pair, not a third column.
        if (descBox.top < keyBox.bottom - EPS) {
          say(`row ${index}: the description is not below the key/value pair`);
        }
      }

      // The documented states, as paint.
      const keyCs = getComputedStyle(keyInput);
      if (keyInput.disabled !== (combo.state === 'disabled')) {
        say(`row ${index} key field disabled=${keyInput.disabled}`);
      }
      if (keyInput.readOnly !== (combo.state === 'readonly')) {
        say(`row ${index} key field readOnly=${keyInput.readOnly}`);
      }
      if (combo.state === 'disabled') {
        if (Number(keyCs.opacity) >= 1) {
          say(`row ${index} disabled field painted at full opacity ${keyCs.opacity}`);
        }
        if (keyCs.cursor !== 'not-allowed') {
          say(`row ${index} disabled field cursor "${keyCs.cursor}"`);
        }
      } else if (combo.state === 'readonly') {
        // Readonly is marked by surface rather than by dimming — it is still a
        // successful control the user can read and copy from.
        const elementSurface = token('--snice-color-surface-container-high');
        if (keyCs.backgroundColor !== elementSurface) {
          say(`row ${index} readonly field surface "${keyCs.backgroundColor}",`
            + ` expected --snice-color-surface-container-high "${elementSurface}"`);
        }
        if (keyCs.cursor !== 'default') {
          say(`row ${index} readonly field cursor "${keyCs.cursor}"`);
        }
      } else {
        // An editable field the pointer cannot reach is not editable.
        const hit = (sr as any).elementFromPoint(
          keyBox.left + keyBox.width / 2, keyBox.top + keyBox.height / 2,
        ) as Element | null;
        if (hit !== keyInput) {
          say(`row ${index} key field is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }

      // "Fixed `rows`: … no delete", and a barred editor offers none either.
      const remove = partNamed('delete-button', row) as HTMLButtonElement | null;
      const wantsDelete = combo.state === 'editable';
      if (wantsDelete && !remove) say(`row ${index} has no delete button`);
      if (!wantsDelete && remove) say(`row ${index} painted a delete button while barred`);
      if (remove) {
        const removeBox = rect(remove);
        if (removeBox.width <= 0 || removeBox.height <= 0) {
          say(`row ${index} delete button renders at ${removeBox.width}x${removeBox.height}`);
        }
        // The frame clips its overflow; a button outside it is unreachable.
        if (removeBox.right > frameBox.right + EPS) {
          say(`row ${index} delete button (right ${removeBox.right.toFixed(1)}) is clipped`
            + ` by the frame (right ${frameBox.right.toFixed(1)})`);
        }
        if (removeBox.left < valueBox.right - EPS) {
          say(`row ${index} delete button overlaps the value field`);
        }
        const hit = (sr as any).elementFromPoint(
          removeBox.left + removeBox.width / 2, removeBox.top + removeBox.height / 2,
        ) as Element | null;
        if (hit !== remove && !remove.contains(hit as Node)) {
          say(`row ${index} delete button is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('key-value visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await mount({
        mode: combo.mode,
        showDescription: combo.showDescription,
        showCopy: combo.showCopy,
        disabled: combo.state === 'disabled',
        readonly: combo.state === 'readonly',
        items: combo.items,
      });
      expect(mounted.items, `data for ${combo.id}`).toHaveLength(combo.items.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The invalid row is the marked row — a claim about which BORDER is painted in
 * the danger colour, which the DOM tier can only see as a class name.
 */
test.describe('key-value visual matrix: the invalid row is the painted one', () => {
  test('only the blank-key row takes the danger border', async () => {
    await mount({
      value: '[{"key":"A","value":"1","description":""},'
        + '{"key":"","value":"orphan","description":""},'
        + '{"key":"C","value":"3","description":""}]',
    });
    const painted = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const inputs = [...sr.querySelectorAll('[part]')]
        .filter(node => (node.getAttribute('part') ?? '').split(/\s+/).includes('key-input'));
      const danger = (window as any).matrix.token('--snice-color-danger');
      return {
        danger,
        borders: inputs.map(input => getComputedStyle(input).borderTopColor),
        marked: inputs.map(input => input.getAttribute('aria-invalid')),
      };
    });
    expect(painted.marked).toEqual(['false', 'true', 'false', 'false']);
    expect(painted.borders[1], 'the invalid row is not painted in the danger colour')
      .toBe(painted.danger);
    expect(painted.borders[0], 'a valid row took the danger colour').not.toBe(painted.danger);
    expect(painted.borders[2], 'a valid row took the danger colour').not.toBe(painted.danger);
  });

  test('the error message is a real, visible box below the rows', async () => {
    await mount({ required: 'true', value: '[]' });
    const measured = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const named = (name: string) => [...sr.querySelectorAll('[part]')]
        .find(node => (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement;
      const error = named('error');
      const rows = named('rows');
      if (!error) return null;
      return {
        role: error.getAttribute('role'),
        text: error.textContent?.trim(),
        height: error.getBoundingClientRect().height,
        belowRows: error.getBoundingClientRect().top >= rows.getBoundingClientRect().bottom - 1,
      };
    });
    expect(measured, 'no part="error" was painted').not.toBeNull();
    expect(measured!.role).toBe('alert');
    expect(measured!.height, 'the error message has no box').toBeGreaterThan(0);
    expect(measured!.belowRows, 'the error message is not below the rows').toBe(true);
  });
});

// ── LAYER 2: the plumbing only a real browser has ───────────────────────────

test.describe('key-value visual matrix: the real form', () => {
  test('a named editor is in form.elements, in FormData, and labelled', async () => {
    const mounted = await mount({ items: ITEMS });
    expect(mounted.inForm, 'el.form is not the enclosing form').toBe(true);
    expect(mounted.listed, 'the editor is not listed in form.elements').toBe(true);
    expect(mounted.labelled, '<label for> did not associate').toBe(true);
    expect(mounted.submitted, 'FormData carries the wrong value').toBe(
      '[{"key":"Accept","value":"application/json","description":"Content negotiation"},'
      + '{"key":"Cache-Control","value":"no-cache","description":""}]',
    );
  });

  test('an empty editor submits the canonical empty array', async () => {
    const mounted = await mount({});
    expect(mounted.submitted).toBe('[]');
  });

  test('a malformed value is submitted raw', async () => {
    const malformed = '[{"key":1,"value":"x"}]';
    const mounted = await mount({ value: malformed });
    expect(mounted.submitted, 'the malformed value was rewritten before submission')
      .toBe(malformed);
    expect(mounted.valid).toBe(false);
  });

  test('a real form.reset() restores the authored default, silently', async () => {
    await mount({ value: '[{"key":"A","value":"1","description":""}]' });
    const typed = await page.evaluate(() => (window as any).matrix.type('key', 0, 'CHANGED'));
    expect(typed.items[0].key).toBe('CHANGED');

    const reset = await page.evaluate(() => (window as any).matrix.reset());
    expect(reset.items, 'form.reset() did not restore the default')
      .toEqual([{ key: 'A', value: '1', description: '' }]);
    expect(reset.events, 'form.reset() dispatched events').toEqual([]);
  });

  test('a disabled fieldset bars the editor and omits it from the submission', async () => {
    const mounted = await mount({ items: ITEMS, fieldsetDisabled: true });
    expect(mounted.willValidate, 'a fieldset-disabled editor still validates').toBe(false);
    expect(mounted.submitted, 'a fieldset-disabled editor submitted a value').toBeNull();
    // The data is untouched — the bar comes from the fieldset.
    expect(mounted.items).toHaveLength(2);
  });

  test('a readonly editor remains successful; a disabled one is omitted', async () => {
    const readonly = await mount({ items: ITEMS, readonly: 'true' });
    expect(readonly.submitted, 'a readonly editor stopped submitting').not.toBeNull();
    expect(readonly.willValidate, 'a readonly editor still validates').toBe(false);

    const disabled = await mount({ items: ITEMS, disabled: 'true' });
    expect(disabled.submitted, 'a disabled editor submitted a value').toBeNull();
  });

  test('required with nothing in it blocks submission with the documented message', async () => {
    const mounted = await mount({ required: 'true' });
    expect(mounted.valid).toBe(false);
    expect(mounted.validationMessage).toContain('Add at least one');

    const filled = await mount({ required: 'true', items: ITEMS });
    expect(filled.valid).toBe(true);
    expect(filled.validationMessage).toBe('');
  });
});

test.describe('key-value visual matrix: real interaction', () => {
  test('clicking a delete button removes that row and emits the documented pair', async () => {
    await mount({ items: ITEMS });
    const result = await page.evaluate(() => (window as any).matrix.deleteRow(0));
    expect(result!.clicked, 'no delete button to click').toBe(true);
    expect(result!.events).toEqual(['kv-remove', 'kv-change']);
    expect(result!.items).toEqual([
      { key: 'Cache-Control', value: 'no-cache', description: '' },
    ]);
  });

  test('typing into the last row expands the editor', async () => {
    await mount({});
    const typed = await page.evaluate(() => (window as any).matrix.type('key', 0, 'NODE_ENV'));
    expect(typed.items).toEqual([{ key: 'NODE_ENV', value: '', description: '' }]);

    const rows = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      return [...host.shadowRoot!.querySelectorAll('[part]')]
        .filter(node => (node.getAttribute('part') ?? '').split(/\s+/).includes('row')).length;
    });
    expect(rows, 'the editor did not auto-expand after typing').toBe(2);
  });

  test('slot children drive the editor, and removing them reapplies the default', async () => {
    const mounted = await mount({
      value: '[{"key":"FALLBACK","value":"1","description":""}]',
      children: '<snice-kv-pair key="Accept" value="application/json"></snice-kv-pair>',
    });
    expect(mounted.items).toEqual([
      { key: 'Accept', value: 'application/json', description: '' },
    ]);

    const cleared = await page.evaluate(() => (window as any).matrix.setChildren(''));
    expect(cleared!.items, 'defaultValue was not reapplied')
      .toEqual([{ key: 'FALLBACK', value: '1', description: '' }]);
  });
});

// ── The pinned marquee capture ──────────────────────────────────────────────

test.describe('key-value visual matrix: marquee pixels', () => {
  test('a key the user typed is legible in the field it sits in', async () => {
    await mount({ items: ITEMS });
    const pixels = await capture(
      page, '#subject', 'key-value-field',
      `(host) => {
        const sr = host.shadowRoot;
        const input = [...sr.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(/\\s+/).includes('key-input'))[0];
        const b = input.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 14; i++) {
          points.push({ x: b.x + 6 + i * 2, y: b.y + b.height / 2 });
        }
        points.push({ x: b.x + b.width - 4, y: b.y + b.height / 2 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, surface)),
      `every probed glyph pixel equals the field surface ${surface.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, surface)));
    expect(best, `best key-vs-field contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(4.5);
  });

  test('a readonly field paints a different surface from an editable one', async () => {
    const surfaces: RGB[] = [];
    for (const readonly of ['false', 'true']) {
      await mount({ items: ITEMS, readonly });
      const [surface] = await capture(
        page, '#subject', `key-value-${readonly === 'true' ? 'readonly' : 'editable'}`,
        `(host) => {
          const sr = host.shadowRoot;
          const input = [...sr.querySelectorAll('[part]')]
            .filter(n => (n.getAttribute('part') || '').split(/\\s+/).includes('key-input'))[0];
          const b = input.getBoundingClientRect();
          return [{ x: b.x + b.width - 4, y: b.y + b.height / 2 }];
        }`,
      );
      surfaces.push(surface);
    }
    expect(sameColor(surfaces[0], surfaces[1]),
      `both states painted ${surfaces[0].join(',')}`).toBe(false);
  });
});
