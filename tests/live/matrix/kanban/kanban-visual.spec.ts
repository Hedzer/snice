/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-kanban TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/kanban, `npm run test:matrix`) owns structure
 * truth: the parts, per-column headers and counts, per-card attributes, the
 * method set, and the two events. It cannot own visual truth, because
 * happy-dom performs no layout and paints nothing.
 *
 * The kanban is a LAYOUT-heavy component, so its visual matrix asserts the
 * board's own documented visual contract:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the board is a horizontal row of columns — ascending, non-overlapping,
 *     each a real box of the stylesheet's 18.75rem width (measured, never
 *     assumed, so a rem change fails the probe rather than the assertion);
 *   · every column's header sits above its card list, and carries the title
 *     text plus the count badge exactly when `showCardCount` is on;
 *   · a column `color` paints the header's rule in that colour, and a card
 *     `color` paints the card's left accent — the documented colors feature;
 *   · cards stack top-to-bottom inside their column's card list without
 *     overlapping, and each card's title hit-tests to its own card;
 *   · a `collapsed` column hides its card list (the interface field's only
 *     reading) while its header stays;
 *   · `allowDragDrop` is each card's draggable state;
 *   · clicking a card emits `kanban-card-click -> { card, kanban }` through a
 *     real browser click.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A header that "has a border-bottom color" can still paint nothing, and an
 *   accent that "has a border-left color" can be invisible on the card. The
 *   marquee captures decode the PNG inside the browser under test and judge
 *   the painted pixels against the surfaces they sit on.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/kanban/matrix.html';

interface Combo {
  id: string;
  family: 'basic' | 'colors' | 'labels' | 'collapsed' | 'empty';
  showCardCount: boolean;
  allowDragDrop: boolean;
}

const FAMILIES: Combo['family'][] = ['basic', 'colors', 'labels', 'collapsed', 'empty'];

/**
 * The cross: family (5) x showCardCount (2) x allowDragDrop (2) = 20 combos.
 * Sized to a component whose data shapes are the families and whose two
 * switches change chrome, not layout — multiplying the families by more axes
 * would revisit the same boxes.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const family of FAMILIES) {
    for (const showCardCount of [true, false]) {
      for (const allowDragDrop of [true, false]) {
        combos.push({
          id: `${family}/${showCardCount ? 'count' : 'nocount'}`
            + `/${allowDragDrop ? 'drag' : 'nodrag'}`,
          family, showCardCount, allowDragDrop,
        });
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
    const EPS = 1.5;
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const board = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!board) { say('no part="base"'); return problems; }

    // ── The board is a flex row of columns ──────────────────────────────────
    const boardCs = getComputedStyle(board);
    if (!/^(inline-)?flex$/.test(boardCs.display)) {
      say(`board display "${boardCs.display}", expected a flex row`);
    }
    const columns = [...sr.querySelectorAll('.column')] as HTMLElement[];
    if (columns.length === 0) { say('no columns rendered'); return problems; }

    for (const [i, column] of columns.entries()) {
      const box = rect(column);
      if (box.width <= 0 || box.height <= 0) {
        say(`column ${i} renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
        continue;
      }
      if (i > 0) {
        const prev = rect(columns[i - 1]);
        if (box.left < prev.right - EPS) {
          say(`column ${i} (left ${box.left.toFixed(0)}) overlaps column ${i - 1}`
            + ` (right ${prev.right.toFixed(0)}) — the row is not ascending`);
        }
      }
      // The stylesheet's column width is 18.75rem; measured against the live
      // root font so the assertion is about the component, not this page.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const wantWidth = 18.75 * rem;
      if (Math.abs(box.width - wantWidth) > rem * 0.75) {
        say(`column ${i} is ${box.width.toFixed(0)}px wide, expected ${wantWidth.toFixed(0)}px`);
      }
      // The column stays inside the board's own padding.
      const boardBox = rect(board);
      if (box.right > boardBox.right + EPS) {
        say(`column ${i} (right ${box.right.toFixed(0)}) escapes the board`
          + ` (right ${boardBox.right.toFixed(0)})`);
      }

      // ── Header: title, count badge, above the card list ──────────────────
      const header = column.querySelector('.column__header') as HTMLElement | null;
      const cards = column.querySelector('.column__cards') as HTMLElement | null;
      if (!header) { say(`column ${i} has no header`); continue; }
      if (!cards) { say(`column ${i} has no card list`); continue; }
      const headerBox = rect(header);
      const cardsBox = rect(cards);
      if (headerBox.width <= 0 || headerBox.height <= 0) {
        say(`column ${i} header renders at ${headerBox.width}x${headerBox.height}`);
      }
      if (cardsBox.height > 0 && headerBox.bottom > cardsBox.top + EPS) {
        say(`column ${i}: the card list starts above the header's bottom`);
      }

      const title = header.querySelector('.column__title');
      if (!title || !(title.textContent ?? '').trim()) {
        say(`column ${i} header carries no title text`);
      }
      const count = header.querySelector('.column__count');
      if (combo.showCardCount && !count) {
        say(`column ${i}: showCardCount painted no count badge`);
      }
      if (!combo.showCardCount && count) {
        say(`column ${i}: a count badge exists with showCardCount off`);
      }
      if (combo.showCardCount && count) {
        const countBox = rect(count);
        if (countBox.width <= 0 || countBox.height <= 0) {
          say(`column ${i} count badge renders at ${countBox.width}x${countBox.height}`);
        }
        if (!(count.textContent ?? '').trim()) {
          say(`column ${i} count badge carries no number`);
        }
      }

      // ── A collapsed column hides its card list, keeps its header ─────────
      // `collapsed` is the interface's own field; hiding the list is its only
      // reading, and the header is how a collapsed column stays addressable.
      const isCollapsed = column.classList.contains('column--collapsed');
      if (isCollapsed) {
        const cardsDisplay = getComputedStyle(cards).display;
        if (cardsDisplay !== 'none' && rect(cards).height > 1) {
          say(`collapsed column ${i} still shows its card list (display "${cardsDisplay}")`);
        }
      }

      // ── Cards stack inside the list without overlapping ──────────────────
      // A collapsed column's list is removed from layout (`.column--collapsed
      // .column__cards { display: none }` — hiding the list is the documented
      // `collapsed` field's only reading), so its cards have no boxes: only
      // their DOM state is assertable there, never their geometry.
      const cardEls = [...column.querySelectorAll('.card')] as HTMLElement[];
      for (const [j, card] of cardEls.entries()) {
        if (card.getAttribute('draggable') !== String(combo.allowDragDrop)) {
          say(`column ${i} card ${j} draggable "${card.getAttribute('draggable')}"`
            + `, expected "${combo.allowDragDrop}"`);
        }
        if (isCollapsed) continue;
        const cardBox = rect(card);
        if (cardBox.width <= 0 || cardBox.height <= 0) {
          say(`column ${i} card ${j} renders at ${cardBox.width}x${cardBox.height}`);
          continue;
        }
        if (j > 0) {
          const above = rect(cardEls[j - 1]);
          if (cardBox.top < above.bottom - EPS) {
            say(`column ${i} card ${j} overlaps the card above it`);
          }
        }
        if (cardBox.left < cardsBox.left - EPS || cardBox.right > cardsBox.right + EPS) {
          say(`column ${i} card ${j} escapes its column's card list`);
        }
        if (getComputedStyle(card).cursor !== 'pointer') {
          say(`column ${i} card ${j} cursor "${getComputedStyle(card).cursor}"`);
        }

        // A card's title must be reachable: nothing the card itself painted
        // may sit over it.
        const titleEl = card.querySelector('.card__title') as HTMLElement | null;
        if (titleEl) {
          const t = rect(titleEl);
          const x = t.left + Math.min(t.width / 2, 12);
          const y = t.top + t.height / 2;
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit !== card && !card.contains(hit)) {
            say(`column ${i} card ${j} title is occluded by`
              + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }

      // ── Colors: the header rule and the card accent ──────────────────────
      // A KanbanColumn.color is the column's colour; the header's bottom rule
      // is where the component paints it. A KanbanCard.color paints the card's
      // left accent. Both compared as computed colours against the same string
      // resolved through the fixture's probe, so hex and rgb() spellings agree.
      const columnColor = (host as any).columns?.[i]?.color;
      if (columnColor) {
        const want = matrix.colorOf(columnColor);
        if (getComputedStyle(header).borderBottomColor !== want) {
          say(`column ${i} header rule "${getComputedStyle(header).borderBottomColor}"`
            + `, expected "${want}"`);
        }
      }
      for (const [j, card] of cardEls.entries()) {
        const cardColor = (host as any).columns?.[i]?.cards?.[j]?.color;
        if (!cardColor) continue;
        const want = matrix.colorOf(cardColor);
        const cardCs = getComputedStyle(card);
        if (cardCs.borderLeftColor !== want) {
          say(`column ${i} card ${j} accent "${cardCs.borderLeftColor}", expected "${want}"`);
        }
        if (parseFloat(cardCs.borderLeftWidth) < 2) {
          say(`column ${i} card ${j} accent is ${cardCs.borderLeftWidth} wide`);
        }
      }
    }

    return problems;
  }, combo);
}

test.describe('kanban visual matrix: layer 1', () => {
  for (const combo of generateCombos()) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mountProblems(mounted, combo)).toEqual([]);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

function mountProblems(mounted: Record<string, unknown>, combo: Combo): string[] {
  const problems: string[] = [];
  if (mounted.allowDragDrop !== combo.allowDragDrop) problems.push('allowDragDrop did not land');
  if (mounted.showCardCount !== combo.showCardCount) problems.push('showCardCount did not land');
  return problems;
}

/** The documented event through a real browser click — once, not per combo. */
test.describe('kanban visual matrix: interaction', () => {
  test('a real click on a card emits kanban-card-click -> { card, kanban }', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ family: 'basic' }));
    const result = await page.evaluate(() => (window as any).matrix.clickCard('c2'));
    expect(result.clicked, 'no card to click').toBe(true);
    expect(result.events, 'kanban-card-click dispatch count').toBe(1);
    expect(result.sameBoard, 'detail.kanban is the board itself').toBe(true);
    expect(result.cardId).toBe('c2');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the header has a border-bottom colour" and "the accent is
// visible on the card" are paint claims, and only pixels can tell them apart.

test.describe('kanban visual matrix: marquee pixels', () => {
  test('a colored column paints its header rule in that colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ family: 'colors' }));
    // One pixel inside the header's bottom rule and one just above it (the
    // column's own tinted surface). A rule that "renders" but paints the
    // surface colour is invisible. The rule is 2px tall and the capture maps
    // probe points with Math.round, so the sample sits at the rule's MIDDLE
    // (bottom - 1): bottom - 0.5 rounds DOWN AND UP to the row below the
    // border, reading the surface at both points.
    const [rule, surface] = await capture(
      page, '#subject', 'kanban-column-rule',
      `(host) => {
        const header = host.shadowRoot.querySelector('.column').querySelector('.column__header');
        const b = header.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.bottom - 1 },
          { x: b.x + b.width / 2, y: b.bottom - 6 },
        ];
      }`,
    );
    expect(sameColor(rule as RGB, surface as RGB),
      `header rule painted ${rule.join(',')} identical to the surface ${surface.join(',')}`)
      .toBe(false);
  });

  test('a colored card paints its left accent', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ family: 'colors' }));
    // The accent is the card's left edge; six pixels in is the card surface.
    const [accent, surface] = await capture(
      page, '#subject', 'kanban-card-accent',
      `(host) => {
        const card = host.shadowRoot.querySelector('.card');
        const b = card.getBoundingClientRect();
        return [
          { x: b.x + 0.5, y: b.y + b.height / 2 },
          { x: b.x + 10, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(accent as RGB, surface as RGB),
      `card accent painted ${accent.join(',')} identical to the card ${surface.join(',')}`)
      .toBe(false);
  });

  test('the colored accent is really red, not just different', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ family: 'colors' }));
    const [accent] = await capture(
      page, '#subject', 'kanban-card-accent-red',
      `(host) => {
        const card = host.shadowRoot.querySelector('.card');
        const b = card.getBoundingClientRect();
        return [{ x: b.x + 0.5, y: b.y + b.height / 2 }];
      }`,
    );
    const [r, g, b] = accent as RGB;
    expect(r > g + 40 && r > b + 40,
      `rgb(220,38,38) accent painted rgb(${r},${g},${b})`).toBe(true);
  });

  test('the count badge is readable against its own column surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ family: 'basic' }));
    // The badge's own chip and the column tint around it. The chip's surface
    // (250,250,250) and the column's (248,248,247) are deliberately near
    // twins — what makes the badge READABLE is its count digit. Walk the
    // chip's mid row every 2px and read the darkest pixel as the ink: a
    // single centre probe lands on the digit only by font-metric luck
    // (Chromium's did; WebKit's read the chip fill at contrast 1.02).
    const pixels = await capture(
      page, '#subject', 'kanban-count-badge',
      `(host) => {
        const count = host.shadowRoot.querySelector('.column__count');
        const column = host.shadowRoot.querySelector('.column');
        const c = count.getBoundingClientRect();
        const b = column.getBoundingClientRect();
        const points = [];
        for (let x = 1; x < c.width; x += 2) {
          points.push({ x: c.x + x, y: c.y + c.height / 2 });
        }
        points.push({ x: b.x + b.width - 8, y: c.y + c.height / 2 });
        return points;
      }`,
    );
    const column = pixels[pixels.length - 1] as RGB;
    const ink = (pixels.slice(0, -1) as RGB[]).reduce((a, p) =>
      p[0] + p[1] + p[2] < a[0] + a[1] + a[2] ? p : a);
    expect(ink, 'no ink found on the badge row — the count did not paint')
      .not.toEqual(pixels[0]);
    // The badge chip is a low-contrast surface-container chip by design; the
    // claim is that its count is readable, visibly set off from the column.
    expect(contrast(ink, column),
      `badge ink contrast against the column is ${contrast(ink, column).toFixed(2)}:1`)
      .toBeGreaterThan(1.05);
  });
});
