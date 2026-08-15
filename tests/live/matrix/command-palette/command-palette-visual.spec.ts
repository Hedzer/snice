/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-command-palette TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/command-palette, `npm run test:matrix`)
 * owns structure truth: which items survive the filter, which parts each command
 * renders, which events fire. It cannot own visual truth, because happy-dom
 * performs no layout — every box reads 0 and nothing is painted.
 *
 * For an OVERLAY component that is most of the risk. A command palette is
 * defined by being on top of the page and by being reachable: a backdrop that
 * does not cover the viewport, a container that scrolls off-screen, a results
 * list that overflows its own box, or a highlight that is invisible are all
 * perfectly valid DOM.
 *
 * ── Layer 1 (every combo): geometry + occlusion + computed style ────────────
 *   · the backdrop covers the viewport and the container sits inside it;
 *   · `elementFromPoint` over the container finds the PALETTE, not the page
 *     content the fixture deliberately puts underneath it;
 *   · every rendered item has a real box, sits inside the results region, and
 *     no two items overlap;
 *   · the search input is visible, focused, and big enough to type into;
 *   · the highlighted item is visually distinguished from its neighbours
 *     (a different background colour), not merely class-tagged;
 *   · the empty state, when it is the combo, occupies the results region.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Small on purpose — a screenshot costs two orders of magnitude more than an
 *   evaluate, and layer 1 already measured the model the browser built. These
 *   exist because "the container has a background-color" and "the palette is
 *   readable over the page" are different claims, and only pixels tell them
 *   apart.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/command-palette/matrix.html';

const COMMANDS = [
  { id: 'new', label: 'New File', icon: '📄', shortcut: '⌘N', category: 'File' },
  { id: 'save', label: 'Save', icon: '💾', shortcut: '⌘S', category: 'File',
    description: 'Persist the current buffer' },
  { id: 'open', label: 'Open Folder', category: 'File' },
  { id: 'theme', label: 'Toggle Theme', category: 'Preferences', description: 'Light or dark' },
  { id: 'keys', label: 'Keyboard Shortcuts', shortcut: '⌘K ⌘S', category: 'Preferences' },
  { id: 'about', label: 'About' },
];

interface Combo {
  id: string;
  query?: string;
  arrowDown?: number;
  maxResults?: number;
  caseSensitive?: boolean;
  placeholder?: string;
  /** How many items the combo must produce — the fixture returns the count. */
  items: number;
}

/**
 * 12 combos. Sized to the component, not to the table: a palette has one
 * layout, and what varies visually is HOW MANY items are in it (none, one, a
 * capped few, all of them), whether categories break the list up, and which row
 * is highlighted. Every one of those is a different box arrangement, and each is
 * mounted once.
 */
const COMBOS: Combo[] = [
  { id: 'full list', items: 6 },
  { id: 'full list, second row highlighted', arrowDown: 1, items: 6 },
  { id: 'full list, last row highlighted', arrowDown: 9, items: 6 },
  { id: 'capped at 2', maxResults: 2, items: 2 },
  { id: 'capped at 1', maxResults: 1, items: 1 },
  { id: 'label search', query: 'save', items: 1 },
  { id: 'description search', query: 'persist', items: 1 },
  { id: 'category search, two hits', query: 'preferences', items: 2 },
  { id: 'category search, highlighted', query: 'preferences', arrowDown: 1, items: 2 },
  { id: 'case-sensitive miss', query: 'save', caseSensitive: true, items: 0 },
  { id: 'no match', query: 'zzzz', items: 0 },
  { id: 'long placeholder', placeholder: 'Search commands, files, settings and anything else', items: 6 },
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  // The command list is injected once rather than serialised into every mount
  // call, so the combos below stay readable as feature vectors.
  await page.evaluate((commands) => { (window as any).__COMMANDS = commands; }, COMMANDS);
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const named = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const container = named('container')[0];
    const results = named('results')[0];
    const input = named('input')[0] as HTMLInputElement | undefined;
    const items = named('item');
    const backdrop = sr.querySelector('.command-palette__backdrop') as HTMLElement | null;

    if (!container) { say('no part="container" painted'); return problems; }
    if (!results) say('no part="results" painted');
    if (!input) say('no part="input" painted');

    // ── The overlay really covers the page ───────────────────────────────────
    if (!backdrop) say('no backdrop painted');
    else {
      const b = rect(backdrop);
      if (b.width < window.innerWidth - EPS || b.height < window.innerHeight - EPS) {
        say(`backdrop is ${b.width.toFixed(0)}x${b.height.toFixed(0)} in a`
          + ` ${window.innerWidth}x${window.innerHeight} viewport — the page shows through`);
      }
      if (Number(getComputedStyle(backdrop).opacity) <= 0) {
        say('backdrop opacity is 0 — nothing dims the page behind the palette');
      }
    }

    // ── The container is on screen and has a real box ────────────────────────
    const box = rect(container);
    if (box.width <= 0 || box.height <= 0) {
      say(`container renders at ${box.width}x${box.height}`);
      return problems;
    }
    if (box.top < -EPS || box.left < -EPS
      || box.right > window.innerWidth + EPS || box.bottom > window.innerHeight + EPS) {
      say(`container (${box.left.toFixed(0)},${box.top.toFixed(0)} `
        + `${box.width.toFixed(0)}x${box.height.toFixed(0)}) hangs outside the viewport`);
    }
    const containerCs = getComputedStyle(container);
    if (containerCs.visibility !== 'visible') say(`container visibility "${containerCs.visibility}"`);
    if (Number(containerCs.opacity) <= 0) say(`container opacity "${containerCs.opacity}"`);
    if (containerCs.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('container has a transparent background — the page reads through the palette');
    }

    // ── OCCLUSION: the overlay is above the page, not behind it ──────────────
    // The fixture puts a full-viewport block of text underneath. A hit-test at
    // the container's own centre that finds anything other than the palette
    // means the overlay is not an overlay.
    for (const fraction of [0.25, 0.5, 0.75]) {
      const x = box.left + box.width * fraction;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`container @${Math.round(fraction * 100)}%: the page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}${outer?.id ? `#${outer.id}` : ''}>,`
          + ' not the palette');
      }
    }

    // ── The search input is usable ───────────────────────────────────────────
    if (input) {
      const ib = rect(input);
      if (ib.height < 20) say(`search input is only ${ib.height.toFixed(0)}px tall`);
      if (ib.width < box.width * 0.5) {
        say(`search input spans ${ib.width.toFixed(0)}px of a ${box.width.toFixed(0)}px palette`);
      }
      if (parseFloat(getComputedStyle(input).fontSize) < 12) {
        say(`search input font-size ${getComputedStyle(input).fontSize}`);
      }
      // Doc "Accessibility: focus trap when open" — at the very least the input
      // must take focus when the palette opens, or the user's first keystroke
      // goes to the page behind it.
      if (sr.activeElement !== input) {
        say(`focus is on <${sr.activeElement?.tagName.toLowerCase() ?? 'nothing outside the palette'}>,`
          + ' not the search input');
      }
    }

    // ── The result rows ──────────────────────────────────────────────────────
    if (items.length !== combo.items) {
      say(`${items.length} items painted, expected ${combo.items}`);
    }
    const resultsBox = results ? rect(results) : box;
    const boxes: DOMRect[] = [];
    items.forEach((item, i) => {
      const r = rect(item);
      if (r.width <= 0 || r.height <= 0) { say(`item ${i} renders at ${r.width}x${r.height}`); return; }
      if (r.left < resultsBox.left - EPS || r.right > resultsBox.right + EPS
        || r.top < resultsBox.top - EPS || r.bottom > resultsBox.bottom + EPS) {
        say(`item ${i} escapes the results region`);
      }
      const cs = getComputedStyle(item);
      if (cs.visibility !== 'visible') say(`item ${i} visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`item ${i} opacity "${cs.opacity}"`);

      // Occlusion inside the shadow tree: a row the pointer cannot reach is a
      // row that cannot be clicked, however correct the DOM is. The probe is
      // the row's own CENTRE rather than a point near its left edge — the
      // container clips its children (`overflow: hidden`), so a point measured
      // from an edge can land in the clipped strip and report the backdrop for
      // a perfectly reachable row.
      const hit = (sr as any).elementFromPoint(
        r.left + r.width / 2, r.top + r.height / 2,
      ) as Element | null;
      if (hit !== item && !item.contains(hit as Node)) {
        say(`item ${i} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
      boxes.push(r);
    });

    // Rows must stack, not pile up: overlapping rows are the classic symptom of
    // a layout that collapsed to absolute positioning at 0,0.
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].top < boxes[i - 1].bottom - EPS) {
        say(`item ${i} (top ${boxes[i].top.toFixed(0)}) overlaps item ${i - 1}`
          + ` (bottom ${boxes[i - 1].bottom.toFixed(0)})`);
      }
    }

    // ── The highlight is VISIBLE, not merely classed ─────────────────────────
    const active = items.find(item => item.classList.contains('command-palette__item--active'));
    if (items.length > 1) {
      if (!active) say('no item carries the active class');
      else {
        const activeBg = getComputedStyle(active).backgroundColor;
        const other = items.find(item => item !== active)!;
        const otherBg = getComputedStyle(other).backgroundColor;
        if (activeBg === otherBg) {
          say(`the highlighted row paints the same background (${activeBg}) as its neighbours`);
        }
      }
    }

    // ── The empty state occupies the results region ──────────────────────────
    const empty = named('empty')[0];
    if (combo.items === 0) {
      if (!empty) say('no results, but no part="empty" painted');
      else {
        const e = rect(empty);
        if (e.width <= 0 || e.height <= 0) say(`empty state renders at ${e.width}x${e.height}`);
        if (!(empty.textContent ?? '').trim()) say('empty state paints no text');
      }
    } else if (empty) {
      say('results painted alongside the empty state');
    }

    return problems;
  }, combo as any);
}

test.describe('command-palette visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount({
        ...c, commands: (window as any).__COMMANDS, showRecentCommands: false,
      }), combo as any);
      expect(mounted.open, 'the palette did not open').toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Three. Layer 1 already measured every box; these answer the questions only
// pixels can: is the palette actually legible over the page, does the highlight
// actually paint, and does the backdrop actually darken anything.

test.describe('command-palette visual matrix: marquee pixels', () => {
  test('the palette surface is legible against the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      commands: (window as any).__COMMANDS, showRecentCommands: false,
    }));
    const [inside, outside] = await capture(
      page, '#under', 'command-palette-surface',
      `() => {
        const host = document.getElementById('subject');
        const sr = host.shadowRoot;
        const container = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('container'));
        const box = container.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + 4 },
          { x: 12, y: window.innerHeight - 12 },
        ];
      }`,
    );
    expect(sameColor(inside, outside),
      `the palette painted ${inside.join(',')}, identical to the page behind it`).toBe(false);
    expect(contrast(inside, outside),
      `palette-vs-page contrast is ${contrast(inside, outside).toFixed(2)}:1`)
      .toBeGreaterThan(1.15);
  });

  test('the highlighted row paints a different colour from its neighbour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      commands: (window as any).__COMMANDS, showRecentCommands: false, arrowDown: 1,
    }));
    const [activePixel, idlePixel] = await capture(
      page, '#under', 'command-palette-highlight',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const items = [...sr.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(/\\s+/).includes('item'));
        const active = items.find(i => i.classList.contains('command-palette__item--active'));
        const idle = items.find(i => i !== active);
        const a = active.getBoundingClientRect();
        const b = idle.getBoundingClientRect();
        return [
          { x: a.right - 4, y: a.y + a.height / 2 },
          { x: b.right - 4, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(activePixel, idlePixel),
      `the highlight painted ${activePixel.join(',')}, the same as an idle row`).toBe(false);
  });

  test('the empty state paints readable text, not a blank panel', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      commands: (window as any).__COMMANDS, showRecentCommands: false, query: 'zzzz',
    }));
    // Three probes across the empty message. A blank panel reads one flat
    // colour at every probe; painted glyphs guarantee variety.
    const pixels = await capture(
      page, '#under', 'command-palette-empty',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const empty = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('empty'));
        const box = empty.getBoundingClientRect();
        return [0.35, 0.5, 0.65].map(f => ({
          x: box.x + box.width * f,
          y: box.y + box.height / 2,
        }));
      }`,
    );
    const distinct = new Set(pixels.map(pixel => pixel.join(',')));
    expect(distinct.size, `the empty state painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
  });
});
