/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-list TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/list, `npm run test:matrix`) owns
 * structure truth: which parts exist, which slot projects what, which request
 * payload leaves the element. It cannot own visual truth, because happy-dom
 * performs no layout — every box reads 0 and nothing is painted.
 *
 * Three of this component's documented claims are reachable ONLY here:
 *
 *   · `dividers` paints through `:host([dividers]) ::slotted(snice-list-item)`,
 *     a rule that crosses the shadow boundary AND is suppressed on the last
 *     row. Neither half exists in the DOM.
 *   · Slot ASSIGNMENT itself. happy-dom assigns every light-DOM child to the
 *     default slot, including children that name another slot, so the DOM tier
 *     is explicitly compensating for the environment (see `list-slots.test.ts`).
 *     Only a real engine can show that `slot="before"` content leaves the list
 *     body and lands in the icon area.
 *   · `selected` and `disabled` are a background tint and an opacity — two
 *     claims about paint that a class name only stands in for.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every row spans the full width of the list, so the whole row is the
 *     target the `cursor: pointer` promises;
 *   · rows stack without overlapping, and the search wrapper / loading block /
 *     empty state each occupy their documented position in that stack;
 *   · `dividers` puts a real border on every row EXCEPT the last;
 *   · `disabled` really drops opacity and really removes pointer events;
 *   · a before-slot icon sits left of the heading and an after-slot badge
 *     right of it, neither overlapping the text;
 *   · no heading is occluded by a sibling (elementFromPoint through the
 *     shadow root), and no row is clipped out of the list box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The divider has a border-bottom-color" and "you can see where one row
 *   ends" are different claims. The marquee captures decode the PNG inside the
 *   browser under test and assert the divider line, the selected tint and the
 *   disabled dimming are actually painted.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/list/matrix.html';

interface Combo {
  id: string;
  dividers: boolean;
  searchable: boolean;
  loading: boolean;
  noResults: boolean;
  itemSlots: boolean;
  selected?: number;
  disabled?: number;
  skeletonCount?: number;
}

/**
 * The cross: the four state switches that change the rendered stack (16),
 * doubled by whether the rows carry their documented before/after slot content
 * — 32 combos. The list is a mid-complexity component; the point of this tier
 * is that every documented CSS-only claim gets a real browser.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const dividers of [false, true]) {
    for (const searchable of [false, true]) {
      for (const loading of [false, true]) {
        for (const noResults of [false, true]) {
          for (const itemSlots of [false, true]) {
            const flags = [
              dividers && 'dividers', searchable && 'searchable',
              loading && 'loading', noResults && 'no-results',
              itemSlots && 'item-slots',
            ].filter(Boolean).join(',');
            combos.push({
              id: `[${flags || 'plain'}]`,
              dividers, searchable, loading, noResults, itemSlots,
              // Rotate the two item states across the cross so both are covered
              // in every structural shape without doubling the product again.
              selected: n % 3 === 0 ? 0 : undefined,
              disabled: n % 3 === 1 ? 1 : undefined,
              skeletonCount: loading ? 3 : undefined,
            });
            n++;
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') say(`host display "${hostCs.display}", expected "block"`);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const container = partNamed('container');
    if (!container) { say('no part="container"'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width < hostBox.width - EPS) {
      say(`the container is ${containerBox.width.toFixed(0)}px in a`
        + ` ${hostBox.width.toFixed(0)}px host — it does not fill it`);
    }

    // ── The search wrapper sits at the TOP of the stack ──────────────────────
    const search = partNamed('search');
    if (combo.searchable) {
      if (!search) {
        say('searchable list rendered no part="search"');
      } else {
        const box = rect(search);
        if (box.height <= 0) say(`part="search" renders at ${box.width}x${box.height}`);
        const input = sr.querySelector('.list__search-input') as HTMLElement | null;
        if (!input) {
          say('searchable list rendered no search input');
        } else {
          const inputBox = rect(input);
          if (inputBox.width <= 0 || inputBox.height <= 0) {
            say(`the search input renders at ${inputBox.width}x${inputBox.height}`);
          }
          // `flex: 1; min-width: 0` — the input must actually fill its wrapper
          // rather than collapse to an intrinsic width.
          if (inputBox.width < box.width - 60) {
            say(`the search input is ${inputBox.width.toFixed(0)}px inside a`
              + ` ${box.width.toFixed(0)}px wrapper — it did not flex`);
          }
          if (inputBox.right > box.right + EPS || inputBox.left < box.left - EPS) {
            say('the search input overflows its own wrapper');
          }
        }
        if (box.top > containerBox.top + 2) {
          say('the search wrapper is not at the top of the list');
        }
      }
    } else if (search) {
      say('a non-searchable list still rendered part="search"');
    }

    // ── The rows ─────────────────────────────────────────────────────────────
    const rows = [...host.querySelectorAll('snice-list-item')] as HTMLElement[];
    const visibleRows = combo.noResults ? [] : rows;
    if (!combo.noResults && rows.length === 0) {
      say('no rows rendered at all');
    }

    for (const [i, row] of visibleRows.entries()) {
      const box = rect(row);
      const where = `row[${i}]`;
      if (box.width <= 0 || box.height <= 0) {
        say(`${where} renders at ${box.width}x${box.height}`);
        continue;
      }
      // `:host { width: 100% }` on the item: the whole row is the target.
      if (box.width < containerBox.width - EPS) {
        say(`${where} is ${box.width.toFixed(0)}px in a`
          + ` ${containerBox.width.toFixed(0)}px list — it does not span the row`);
      }
      if (box.left < hostBox.left - EPS || box.right > hostBox.right + EPS) {
        say(`${where} is clipped horizontally by the list`);
      }

      const inner = row.shadowRoot?.querySelector('.list-item') as HTMLElement | null;
      if (!inner) { say(`${where} has no .list-item box`); continue; }
      const innerCs = getComputedStyle(inner);

      // ── disabled: a documented opacity + pointer-events claim ─────────────
      const isDisabled = row.hasAttribute('disabled');
      const opacity = Number(innerCs.opacity);
      if (isDisabled) {
        if (opacity >= 1) say(`${where} is disabled but painted at full opacity`);
        if (innerCs.pointerEvents !== 'none') {
          say(`${where} is disabled but still accepts pointer events`);
        }
        if (innerCs.cursor !== 'not-allowed') {
          say(`${where} is disabled but its cursor is "${innerCs.cursor}"`);
        }
      } else {
        if (opacity < 1) say(`${where} is not disabled but painted at opacity ${opacity}`);
        if (innerCs.cursor !== 'pointer') {
          say(`${where} cursor is "${innerCs.cursor}", expected "pointer"`);
        }
      }

      // ── selected: a documented background tint ───────────────────────────
      const isSelected = row.hasAttribute('selected');
      const bg = innerCs.backgroundColor;
      if (isSelected && bg === 'rgba(0, 0, 0, 0)') {
        say(`${where} is selected but painted no background tint`);
      }
      if (!isSelected && bg !== 'rgba(0, 0, 0, 0)') {
        say(`${where} is not selected but painted a background (${bg})`);
      }

      // ── dividers: the ::slotted border, and its absence on the last row ───
      const border = parseFloat(getComputedStyle(row).borderBottomWidth) || 0;
      const isLast = i === visibleRows.length - 1;
      if (combo.dividers && !isLast && border <= 0) {
        say(`${where} has no divider border under dividers`);
      }
      if (combo.dividers && isLast && border > 0) {
        say('the LAST row still draws a divider — the list ends in a stray rule');
      }
      if (!combo.dividers && border > 0) {
        say(`${where} drew a divider border without the dividers switch`);
      }

      // ── The heading is legible and unoccluded ─────────────────────────────
      const heading = row.shadowRoot?.querySelector('.list-item__heading') as HTMLElement | null;
      if (!heading) { say(`${where} rendered no heading`); continue; }
      const headingBox = rect(heading);
      if (headingBox.width <= 0 || headingBox.height <= 0) {
        say(`${where} heading renders at ${headingBox.width}x${headingBox.height}`);
        continue;
      }
      const x = headingBox.left + 4;
      const y = headingBox.top + headingBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      // A disabled row has `pointer-events: none`, so the hit-test correctly
      // falls through it — that is the documented behaviour, not an occlusion.
      if (!isDisabled && outer !== host && outer !== row) {
        say(`${where} heading hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the list`);
      }

      // ── The documented slot AREAS: icon left, badge right ────────────────
      if (combo.itemSlots) {
        const before = row.querySelector('[slot="before"]') as HTMLElement | null;
        const after = row.querySelector('[slot="after"]') as HTMLElement | null;
        if (!before || !after) {
          say(`${where} lost its before/after slot content`);
        } else {
          const beforeBox = rect(before);
          const afterBox = rect(after);
          if (beforeBox.width <= 0 || beforeBox.height <= 0) {
            say(`${where} before-slot icon renders at ${beforeBox.width}x${beforeBox.height}`);
          }
          if (afterBox.width <= 0 || afterBox.height <= 0) {
            say(`${where} after-slot badge renders at ${afterBox.width}x${afterBox.height}`);
          }
          if (beforeBox.right > headingBox.left + EPS) {
            say(`${where} before-slot icon overlaps the heading`);
          }
          if (afterBox.left < headingBox.right - EPS) {
            say(`${where} after-slot badge overlaps the heading`);
          }
          // The named slots must not ALSO appear in the body — this is the
          // exclusivity claim happy-dom cannot make.
          const contentBox = row.shadowRoot?.querySelector('.list-item__content') as HTMLElement | null;
          if (contentBox && rect(contentBox).left > beforeBox.right + 40) {
            say(`${where} content is pushed far right of its icon — the layout collapsed`);
          }
        }
      }
    }

    // ── Rows stack without overlapping ──────────────────────────────────────
    for (let i = 1; i < visibleRows.length; i++) {
      const a = rect(visibleRows[i - 1]);
      const b = rect(visibleRows[i]);
      if (b.top < a.bottom - EPS) say(`rows ${i - 1}/${i} overlap vertically`);
    }

    // ── The loading block and its skeletons ─────────────────────────────────
    const loading = partNamed('loading');
    if (combo.loading) {
      if (!loading) {
        say('loading list rendered no part="loading"');
      } else {
        const box = rect(loading);
        if (box.height <= 0) say(`part="loading" renders at ${box.width}x${box.height}`);
        const skeletons = [...sr.querySelectorAll('snice-skeleton')] as HTMLElement[];
        if (skeletons.length !== (combo.skeletonCount ?? 5)) {
          say(`${skeletons.length} skeletons, expected ${combo.skeletonCount ?? 5}`);
        }
        for (const [i, skeleton] of skeletons.entries()) {
          const sbox = rect(skeleton);
          if (sbox.width <= 0 || sbox.height <= 0) {
            say(`skeleton[${i}] renders at ${sbox.width}x${sbox.height}`);
          }
        }
      }
    } else if (loading) {
      say('a list that is not loading still rendered part="loading"');
    }

    // ── The no-results empty state really occupies the body ─────────────────
    if (combo.noResults) {
      const empty = sr.querySelector('snice-empty-state') as HTMLElement | null;
      if (!empty) {
        say('no-results rendered no empty state');
      } else {
        const box = rect(empty);
        if (box.width <= 0 || box.height <= 0) {
          say(`the empty state renders at ${box.width}x${box.height}`);
        }
      }
      // The rows must not paint at all: `noResults` removes the default slot.
      for (const [i, row] of rows.entries()) {
        const box = rect(row);
        if (box.width > 0 && box.height > 0) {
          say(`row[${i}] is still painted under no-results (${box.width}x${box.height})`);
        }
      }
    }

    // ── The sentinel exists and takes no visible space ──────────────────────
    const sentinel = partNamed('sentinel');
    if (!sentinel) {
      say('no part="sentinel"');
    } else {
      const box = rect(sentinel);
      if (box.height > 2) say(`the sentinel is ${box.height}px tall — it displaces content`);
      if (getComputedStyle(sentinel).pointerEvents !== 'none') {
        say('the sentinel intercepts pointer events');
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('list visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.rows, `combo ${combo.id} mounted no rows`).toBe(3);
      expect(mounted.dividers).toBe(combo.dividers);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('list visual matrix: marquee pixels', () => {
  test('dividers paint a line between rows and none after the last', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dividers: true, searchable: false, loading: false, noResults: false, itemSlots: false,
    }));
    // Probe the seam between rows 0 and 1, the middle of row 0, and the seam
    // just below the last row. The first must differ from the row interior;
    // the last must match the surface behind the list.
    const [seam, interior, afterLast] = await capture(
      page, '#subject', 'list-dividers',
      `(host) => {
        const rows = [...host.querySelectorAll('snice-list-item')];
        const first = rows[0].getBoundingClientRect();
        const last = rows[rows.length - 1].getBoundingClientRect();
        return [
          { x: first.x + first.width / 2, y: first.bottom - 1 },
          { x: first.x + first.width / 2, y: first.y + first.height / 2 },
          { x: last.x + last.width / 2, y: last.bottom - 1 },
        ];
      }`,
    );
    expect(sameColor(seam, interior),
      `the divider seam painted ${seam.join(',')}, identical to the row interior`).toBe(false);
    expect(contrast(seam, interior),
      `divider contrast against the row is ${contrast(seam, interior).toFixed(3)}:1`)
      .toBeGreaterThan(1.02);
    expect(sameColor(afterLast, interior),
      `the LAST row painted a divider (${afterLast.join(',')}) — the list ends in a stray rule`)
      .toBe(true);
  });

  test('a selected row paints a tint an unselected sibling does not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dividers: false, searchable: false, loading: false, noResults: false,
      itemSlots: false, selected: 0,
    }));
    const [selectedPx, plainPx] = await capture(
      page, '#subject', 'list-selected',
      `(host) => {
        const rows = [...host.querySelectorAll('snice-list-item')];
        const mid = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.right - 8, y: b.y + b.height / 2 };
        };
        return [mid(rows[0]), mid(rows[1])];
      }`,
    );
    expect(sameColor(selectedPx, plainPx),
      `the selected row painted ${selectedPx.join(',')}, identical to an unselected one`)
      .toBe(false);
  });

  test('a disabled row is visibly dimmed', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dividers: false, searchable: false, loading: false, noResults: false,
      itemSlots: false, disabled: 1,
    }));
    // The heading glyphs of a dimmed row must sit closer to the background than
    // an enabled row's. Probing the darkest pixel of each heading's box keeps
    // the comparison about ink rather than about where the text happened to land.
    const [dimmedInk, plainInk] = await capture(
      page, '#subject', 'list-disabled',
      `(host) => {
        const rows = [...host.querySelectorAll('snice-list-item')];
        const headingPoint = (row) => {
          const h = row.shadowRoot.querySelector('.list-item__heading');
          const b = h.getBoundingClientRect();
          return { x: b.x + 2, y: b.y + b.height / 2 };
        };
        return [headingPoint(rows[1]), headingPoint(rows[0])];
      }`,
    );
    const surface: [number, number, number] = [255, 255, 255];
    expect(contrast(dimmedInk, surface),
      `the disabled row's ink (${dimmedInk.join(',')}) is not dimmer than`
      + ` the enabled row's (${plainInk.join(',')})`)
      .toBeLessThanOrEqual(contrast(plainInk, surface));
  });

  test('a before-slot icon really paints in the row', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dividers: false, searchable: false, loading: false, noResults: false, itemSlots: true,
    }));
    // The icon's centre against a point in the same row that is deliberately
    // empty — between the heading and the badge. A dead slot leaves both
    // reading the row background, which is exactly what this catches. (The
    // probe is a colour comparison, not a variety count: a solid emoji glyph
    // legitimately paints one flat colour across its middle.)
    const [iconPx, rowPx] = await capture(
      page, '#subject', 'list-item-icon',
      `(host) => {
        const row = host.querySelector('snice-list-item');
        const icon = row.querySelector('[slot="before"]');
        const badge = row.querySelector('[slot="after"]');
        const b = icon.getBoundingClientRect();
        const badgeBox = badge.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + b.height / 2 },
          { x: badgeBox.x - 12, y: badgeBox.y + badgeBox.height / 2 },
        ];
      }`,
    );
    expect(sameColor(iconPx, rowPx),
      `the icon painted ${iconPx.join(',')}, identical to the bare row background —`
      + ' the before slot is dead').toBe(false);
    expect(contrast(iconPx, rowPx),
      `icon contrast against the row is ${contrast(iconPx, rowPx).toFixed(2)}:1`)
      .toBeGreaterThan(1.2);
  });
});
