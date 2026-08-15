/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-tree TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/tree, `npm run test:matrix`) owns
 * structure truth across 205 combos: which rows exist, what they say, the ARIA
 * triple, the icon precedence rules, selection and checkbox state, expansion
 * state. It states its own boundary up front — happy-dom performs no layout, so
 * "collapsed" is judged there by `aria-expanded` and a class name, and
 * "indented" cannot be judged at all.
 *
 * This tier is where those become measurements:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every visible row has a real, non-zero box, and rows stack without
 *     overlapping;
 *   · a child row is really INDENTED past its parent — the `--tree-level`
 *     custom property is the entire indentation mechanism and produces no DOM
 *     difference at all, so a browser is the only place it can be checked;
 *   · a COLLAPSED subtree really takes no space: its rows are rendered into the
 *     DOM and hidden by CSS, which is exactly the failure mode a DOM-tier class
 *     assertion cannot distinguish from a working one;
 *   · a disabled row really is unclickable (`pointer-events: none`) and dimmed;
 *   · no row is occluded by another, and every visible label is hit-testable.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The row has a selected class" and "the row looks selected" are different
 *   claims. The marquee captures decode the PNG inside the browser under test
 *   and assert the selected row really paints a different background from its
 *   neighbours.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/tree/matrix.html';

type Shape = 'nested' | 'deep' | 'mixed';

interface Combo {
  id: string;
  shape: Shape;
  selectionMode: 'single' | 'multiple' | 'none';
  showCheckboxes: boolean;
  showIcons: boolean;
  /** Rows that must be visible, and rows that must not (collapsed subtrees). */
  visible: string[];
  hidden: string[];
  /** child id -> parent id, for the indentation claim. */
  indent: Array<[string, string]>;
}

const SHAPE_ROWS: Record<Shape, { visible: string[]; hidden: string[]; indent: Array<[string, string]> }> = {
  nested: {
    visible: ['src', 'index', 'main', 'docs'],
    hidden: ['readme'],
    indent: [['index', 'src'], ['main', 'src']],
  },
  deep: {
    visible: ['l1', 'l2', 'l3a', 'l3b'],
    hidden: [],
    indent: [['l2', 'l1'], ['l3a', 'l2'], ['l3b', 'l2']],
  },
  mixed: {
    visible: ['ok', 'no', 'group', 'g1', 'g2'],
    hidden: [],
    indent: [['g1', 'group'], ['g2', 'group']],
  },
};

/**
 * The cross: shape (3) x selectionMode (3) x checkboxes (2) x icons (2) — 36
 * combos. The DOM tier already owns the exhaustive 205-combo product; this tier
 * takes every documented dimension that can change the LAYOUT of a row and
 * spends its budget on the things only a browser knows.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const shape of ['nested', 'deep', 'mixed'] as Shape[]) {
    for (const selectionMode of ['single', 'multiple', 'none'] as const) {
      for (const showCheckboxes of [true, false]) {
        for (const showIcons of [true, false]) {
          combos.push({
            id: `${shape}/${selectionMode}/checkboxes=${showCheckboxes}/icons=${showIcons}`,
            shape, selectionMode, showCheckboxes, showIcons,
            ...SHAPE_ROWS[shape],
          });
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

async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const items = (window as any).treeItems(host) as any[];
    const byId = new Map<string, any>(items.map(item => [item.node?.id, item]));

    const rowOf = (id: string): HTMLElement | null =>
      byId.get(id)?.shadowRoot?.querySelector('[part~="content"]') ?? null;
    const labelOf = (id: string): HTMLElement | null =>
      byId.get(id)?.shadowRoot?.querySelector('[part~="label"]') ?? null;

    for (const id of [...combo.visible, ...combo.hidden]) {
      if (!byId.has(id)) say(`node ${id} was not rendered at all`);
    }

    // ── Visible rows have real boxes ──────────────────────────────────────
    const boxes = new Map<string, DOMRect>();
    for (const id of combo.visible) {
      const row = rowOf(id);
      if (!row) { say(`node ${id}: no row element`); continue; }
      const box = row.getBoundingClientRect();
      boxes.set(id, box);
      if (box.width < 1 || box.height < 1) {
        say(`row ${id} has a ${box.width.toFixed(0)}x${box.height.toFixed(0)} box`);
      }
      const cs = getComputedStyle(row);
      if (cs.visibility !== 'visible') say(`row ${id} visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`row ${id} opacity "${cs.opacity}"`);
    }

    // ── A collapsed subtree really takes no space ─────────────────────────
    //
    // This is the claim the DOM tier explicitly cannot make: the rows ARE in
    // the DOM, and only layout can say whether they are shown. The mechanism is
    // `max-height: 0; overflow: hidden; opacity: 0` on the GROUP, so the row
    // inside keeps a box of its own and is clipped away — which is exactly why
    // the measurement has to be taken on the group and on the hit test, not on
    // the row's own rect.
    for (const id of combo.hidden) {
      const item = byId.get(id);
      const group = item?.parentElement?.closest
        ? (item.getRootNode() as ShadowRoot)?.querySelector('[part~="children"]') as HTMLElement | null
        : null;
      if (group) {
        const groupBox = group.getBoundingClientRect();
        if (groupBox.height > EPS) {
          say(`the collapsed group holding ${id} is ${groupBox.height.toFixed(0)}px tall`);
        }
        if (Number(getComputedStyle(group).opacity) > 0) {
          say(`the collapsed group holding ${id} is painted at`
            + ` opacity ${getComputedStyle(group).opacity}`);
        }
      } else {
        say(`node ${id}: could not find the group that should be hiding it`);
      }

      const row = rowOf(id);
      if (!row) continue;
      const box = row.getBoundingClientRect();
      const x = box.left + Math.min(box.width / 2, 40);
      const y = box.top + box.height / 2;
      if (y >= 0 && y <= window.innerHeight) {
        const hit = (host.shadowRoot as any).elementFromPoint(x, y);
        if (hit && (hit === row || row.contains(hit))) {
          say(`row ${id} is inside a collapsed subtree but is still hit-testable`);
        }
      }
    }

    // ── Rows stack, in order, without overlapping ─────────────────────────
    const ordered = combo.visible
      .map(id => ({ id, box: boxes.get(id)! }))
      .filter(({ box }) => !!box)
      .sort((a, b) => a.box.top - b.box.top);
    if (ordered.map(({ id }) => id).join(',') !== combo.visible.join(',')) {
      say(`rows are painted in the order ${ordered.map(({ id }) => id).join(',')},`
        + ` documented depth-first order is ${combo.visible.join(',')}`);
    }
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].box.top < ordered[i - 1].box.bottom - EPS) {
        say(`rows ${ordered[i - 1].id} and ${ordered[i].id} overlap vertically`);
      }
    }

    // ── Children are indented past their parent ───────────────────────────
    // `.tree-item__content { padding-left: calc(var(--tree-level) * ...) }` is
    // the whole mechanism, and it leaves no trace in the DOM.
    for (const [child, parent] of combo.indent) {
      const childLabel = labelOf(child);
      const parentLabel = labelOf(parent);
      if (!childLabel || !parentLabel) continue;
      const childX = childLabel.getBoundingClientRect().left;
      const parentX = parentLabel.getBoundingClientRect().left;
      if (childX <= parentX + EPS) {
        say(`"${child}" starts at x=${childX.toFixed(0)}, its parent "${parent}" at`
          + ` x=${parentX.toFixed(0)} — the child is not indented`);
      }
    }

    // ── Icons and checkboxes really show, or really do not ────────────────
    for (const id of combo.visible) {
      const item = byId.get(id);
      const holder = item?.shadowRoot?.querySelector('[part~="checkbox"]') as HTMLElement | null;
      if (holder) {
        const shown = holder.getBoundingClientRect().width > EPS;
        if (shown !== combo.showCheckboxes) {
          say(`row ${id}: checkbox ${shown ? 'occupies space' : 'has no box'}`
            + ` with show-checkboxes=${combo.showCheckboxes}`);
        }
      }
      const icon = item?.shadowRoot?.querySelector('[part~="icon-text"], [part~="icon-image"]');
      const iconShown = !!icon && (icon as HTMLElement).getBoundingClientRect().width > EPS;
      if (combo.showIcons && !iconShown && item?.node?.icon) {
        say(`row ${id}: show-icons is on but the icon has no painted box`);
      }
      if (!combo.showIcons && iconShown) {
        say(`row ${id}: show-icons is off but an icon still occupies space`);
      }
    }

    // ── Disabled rows are really unclickable ──────────────────────────────
    for (const id of combo.visible) {
      const node = byId.get(id)?.node;
      if (!node?.disabled) continue;
      const row = rowOf(id)!;
      const cs = getComputedStyle(row);
      if (cs.pointerEvents !== 'none') {
        say(`disabled row ${id} has pointer-events "${cs.pointerEvents}"`);
      }
      if (Number(cs.opacity) >= 1) {
        say(`disabled row ${id} is painted at full opacity`);
      }
    }

    // ── Nothing occludes a visible label ──────────────────────────────────
    for (const id of combo.visible) {
      const label = labelOf(id);
      if (!label) continue;
      const box = label.getBoundingClientRect();
      if (box.width < 1) continue;
      const x = box.left + Math.min(box.width / 2, 40);
      const y = box.top + box.height / 2;
      if (y < 0 || y > window.innerHeight) continue;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`label ${id} hit-tests to <${outer?.tagName.toLowerCase() ?? 'nothing'}>`
          + ' outside the tree');
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('tree visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.rows).toBe(combo.visible.length + combo.hidden.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('tree visual matrix: expansion really changes the layout', () => {
  test('expanding a collapsed subtree gives its rows real boxes', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'nested', selectionMode: 'single', showCheckboxes: false, showIcons: true,
    }));

    const before = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const items = (window as any).treeItems(host);
      const row = items.find((i: any) => i.node?.id === 'readme')
        ?.shadowRoot?.querySelector('[part~="content"]');
      return { height: row?.getBoundingClientRect().height ?? -1, tree: host.getBoundingClientRect().height };
    });
    expect(before.height, 'a collapsed row already has height').toBeLessThan(1.5);

    await page.evaluate(() => (window as any).matrix.clickExpander('docs'));
    // The group animates `max-height` over 250ms; measure after it settles.
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const items = (window as any).treeItems(host);
      const row = items.find((i: any) => i.node?.id === 'readme')
        ?.shadowRoot?.querySelector('[part~="content"]');
      return { height: row?.getBoundingClientRect().height ?? -1, tree: host.getBoundingClientRect().height };
    });
    expect(after.height, 'the expanded row still has no height').toBeGreaterThan(10);
    expect(after.tree, 'the tree did not grow to hold the expanded row')
      .toBeGreaterThan(before.tree + 10);
  });
});

test.describe('tree visual matrix: marquee pixels', () => {
  test('a selected row paints a background its neighbours do not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'nested', selectionMode: 'single', showCheckboxes: false, showIcons: true,
    }));
    await page.evaluate(() => (window as any).matrix.clickRow('index'));

    // Probe the right-hand end of the selected row (past the label, so the
    // text itself cannot supply the difference) and the same x on the row
    // below it. A "selected" class that paints nothing is not a selection.
    const [selected, neighbour] = await capture(
      page, '#subject', 'tree-selected-row',
      `(host) => {
        const items = window.treeItems(host);
        const box = id => items.find(i => i.node?.id === id)
          .shadowRoot.querySelector('[part~="content"]').getBoundingClientRect();
        const sel = box('index');
        const other = box('main');
        return [
          { x: sel.right - 8, y: sel.top + sel.height / 2 },
          { x: other.right - 8, y: other.top + other.height / 2 },
        ];
      }`,
    );
    expect(sameColor(selected, neighbour),
      `the selected row painted ${selected.join(',')}, identical to its neighbour`).toBe(false);
  });

  test('a disabled row is painted dimmer than an enabled one', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'mixed', selectionMode: 'single', showCheckboxes: false, showIcons: true,
    }));
    // The label text of an enabled row against the label text of a disabled
    // one: `opacity: 0.5` on the disabled row must show up as less contrast
    // against the same surface.
    const [enabled, disabled, surface] = await capture(
      page, '#subject', 'tree-disabled-row',
      `(host) => {
        const items = window.treeItems(host);
        const label = id => items.find(i => i.node?.id === id)
          .shadowRoot.querySelector('[part~="label"]').getBoundingClientRect();
        const ok = label('ok');
        const no = label('no');
        return [
          { x: ok.left + 3, y: ok.top + ok.height / 2 },
          { x: no.left + 3, y: no.top + no.height / 2 },
          { x: ok.right + 40, y: ok.top + ok.height / 2 },
        ];
      }`,
    );
    expect(contrast(enabled, surface),
      `enabled label contrast ${contrast(enabled, surface).toFixed(2)},`
      + ` disabled ${contrast(disabled, surface).toFixed(2)}`)
      .toBeGreaterThan(contrast(disabled, surface));
  });
});
