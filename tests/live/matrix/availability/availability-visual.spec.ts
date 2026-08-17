/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-availability TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/availability) owns the value <-> slot mapping,
 * the presets and the events. This tier owns the grid as a person meets it:
 * seven even day columns beside a time gutter, rows that stack in ascending
 * time, an available cell that is visibly available, and — the one thing no
 * DOM assertion can reach — whether a `readonly` grid still LOOKS interactive.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the grid paints exactly 7 columns of cells, one per documented day, each
 *     under its own Mon-Sun heading;
 *   · rows ascend without overlapping, and every cell is hit-testable;
 *   · an active cell is painted differently from an inactive one;
 *   · the hour labels are painted and legible in both documented formats;
 *   · a readonly grid drops the presets the docs give the editable one.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the legend's "available" swatch must paint the same colour an active cell
 *   does — a legend that does not match the grid it explains is worse than no
 *   legend.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/availability/matrix.html';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Combo {
  id: string;
  granularity: number;
  startHour: number;
  endHour: number;
  format: '12h' | '24h';
  readonly: boolean;
  value: Array<{ day: number; start: string; end: string }>;
}

/**
 * granularity (3) x window (2) x format (2) x readonly (2) = 24 combos, each
 * carrying a Mon-Fri 09:00-17:00 band so every combo has both an active and an
 * inactive cell to compare.
 */
function generateCombos(): Combo[] {
  const value = [0, 1, 2, 3, 4].map(day => ({ day, start: '09:00', end: '17:00' }));
  const combos: Combo[] = [];
  for (const granularity of [15, 30, 60]) {
    for (const [startHour, endHour] of [[8, 18], [0, 24]] as const) {
      for (const format of ['12h', '24h'] as const) {
        for (const readonly of [false, true]) {
          combos.push({
            id: `g${granularity}/${startHour}-${endHour}/${format}/${readonly ? 'readonly' : 'editable'}`,
            granularity, startHour, endHour, format, readonly, value,
          });
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
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
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }
    const rect = (el: Element) => el.getBoundingClientRect();

    // ── The documented parts have boxes ────────────────────────────────────
    for (const name of ['base', 'header', 'grid']) {
      const node = sr.querySelector(`[part="${name}"]`) as HTMLElement | null;
      if (!node) { say(`part="${name}" is missing`); continue; }
      const box = rect(node);
      if (box.width <= 0 || box.height <= 0) say(`part="${name}" is ${box.width}x${box.height}`);
    }

    // ── Seven day columns, each under its own heading ──────────────────────
    const headings = [...sr.querySelectorAll('.availability__day-header')] as HTMLElement[];
    if (headings.length !== 7) say(`${headings.length} day headings painted`);

    const cells = [...sr.querySelectorAll('.availability__cell')] as HTMLElement[];
    const expectedRows = Math.round(((combo.endHour - combo.startHour) * 60) / combo.granularity);
    if (cells.length !== expectedRows * 7) {
      say(`${cells.length} cells painted for ${expectedRows} rows x 7 days`);
    }
    const columns = [...new Set(cells.map(cell => Math.round(rect(cell).left)))]
      .sort((a, b) => a - b);
    if (columns.length !== 7) say(`the grid paints ${columns.length} day columns`);

    for (const [i, cell] of cells.slice(0, 7).entries()) {
      const head = rect(headings[i]);
      const box = rect(cell);
      const centre = box.left + box.width / 2;
      if (centre < head.left - 2 || centre > head.right + 2) {
        say(`the first row's cell ${i} is not under the "${headings[i]?.textContent}" heading`);
      }
    }

    // ── Rows ascend and cells are hit-testable ─────────────────────────────
    for (let row = 1; row < Math.min(expectedRows, 8); row++) {
      const above = rect(cells[(row - 1) * 7]);
      const box = rect(cells[row * 7]);
      if (box.top < above.bottom - EPS) say(`row ${row} overlaps row ${row - 1}`);
    }
    // `elementFromPoint` answers only for coordinates inside the viewport, and
    // a 24-hour grid at 15-minute resolution runs off the bottom of any window
    // — so the hit test is applied to the cells that are actually on screen.
    for (const index of [0, 7, cells.length - 1]) {
      const cell = cells[index];
      if (!cell) continue;
      const box = rect(cell);
      if (box.width <= 0 || box.height <= 0) { say(`cell ${index} is ${box.width}x${box.height}`); continue; }
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== cell && !cell.contains(hit as Node)) {
        say(`cell ${index} is not the element under its own centre`);
      }
    }

    // ── An available cell looks available ──────────────────────────────────
    const active = cells.find(cell => cell.classList.contains('availability__cell--active'));
    const inactive = cells.find(cell => !cell.classList.contains('availability__cell--active'));
    if (!active) {
      say('no cell is marked available for a Mon-Fri 09:00-17:00 value');
    } else if (inactive) {
      const face = (cell: HTMLElement) => getComputedStyle(cell).backgroundColor;
      if (face(active) === face(inactive)) {
        say(`an available cell paints exactly like an unavailable one (${face(active)})`);
      }
    }

    // ── The hour labels are painted ────────────────────────────────────────
    const labels = [...sr.querySelectorAll('.availability__time-label')] as HTMLElement[];
    const painted = labels.filter(label => label.getClientRects().length > 0
      && (label.textContent ?? '').trim().length > 0);
    if (!painted.length) say('no time label is painted');
    const first = painted[0]?.textContent?.trim() ?? '';
    const twelveHour = /(AM|PM)$/.test(first);
    if (combo.format === '12h' && !twelveHour) {
      say(`format=12h painted "${first}"`);
    }
    if (combo.format === '24h' && twelveHour) {
      say(`format=24h painted "${first}"`);
    }

    // ── readonly withdraws the editing affordances ─────────────────────────
    const presets = [...sr.querySelectorAll('.availability__preset')] as HTMLElement[];
    const paintedPresets = presets.filter(node => node.getClientRects().length > 0);
    if (combo.readonly && paintedPresets.length) {
      say(`a readonly grid paints ${paintedPresets.length} preset buttons`);
    }
    if (!combo.readonly && paintedPresets.length !== 3) {
      say(`an editable grid paints ${paintedPresets.length} preset buttons, not the`
        + ' documented three');
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('availability visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.cells, 'painted cells')
        .toBe(Math.round(((combo.endHour - combo.startHour) * 60) / combo.granularity) * 7);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('availability visual matrix: the day headings', () => {
  test('the seven columns are Mon-Sun, in order and evenly wide', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      granularity: 60, startHour: 8, endHour: 12, format: '24h', value: [],
    }));
    const painted = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const headings = [...sr.querySelectorAll('.availability__day-header')] as HTMLElement[];
      return headings.map(head => ({
        label: head.textContent!.trim(),
        left: head.getBoundingClientRect().left,
        width: head.getBoundingClientRect().width,
      }));
    });

    expect(painted.map(h => h.label), 'the documented Mon-Sun order').toEqual(DAYS);
    const widths = painted.map(h => Math.round(h.width));
    expect(Math.max(...widths) - Math.min(...widths),
      `the seven day columns differ in width: ${widths.join(',')}`)
      .toBeLessThanOrEqual(2);
    for (let i = 1; i < painted.length; i++) {
      expect(painted[i].left, `${DAYS[i]} sits right of ${DAYS[i - 1]}`)
        .toBeGreaterThan(painted[i - 1].left);
    }
  });
});

test.describe('availability visual matrix: dragging a band', () => {
  test('a drag paints the cells it covered', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      granularity: 60, startHour: 9, endHour: 17, format: '24h', value: [],
    }));
    const before = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelectorAll('.availability__cell--active').length);
    expect(before, 'an empty grid').toBe(0);

    expect(await page.evaluate(() => (window as any).matrix.dragBand(0, 4)),
      'the grid accepted a drag').toBe(true);

    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const active = [...sr.querySelectorAll('.availability__cell--active')] as HTMLElement[];
      return {
        count: active.length,
        allPainted: active.every(cell => cell.getClientRects().length > 0),
        background: active.length ? getComputedStyle(active[0]).backgroundColor : null,
      };
    });
    expect(after.count, 'the dragged band is marked available').toBeGreaterThan(0);
    expect(after.allPainted, 'every marked cell is painted').toBe(true);
  });

  test('a readonly grid ignores the same drag', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      granularity: 60, startHour: 9, endHour: 17, format: '24h', readonly: true, value: [],
    }));
    await page.evaluate(() => (window as any).matrix.dragBand(0, 4));
    const active = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelectorAll('.availability__cell--active').length);
    expect(active, 'a readonly grid was edited by a drag').toBe(0);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('availability visual matrix: marquee pixels', () => {
  test('the legend swatch is the colour the grid actually uses', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      granularity: 60, startHour: 8, endHour: 18, format: '24h',
      value: [{ day: 0, start: '09:00', end: '17:00' }],
    }));

    const [cell, swatch, empty] = await capture(
      page, '#subject', 'availability-legend',
      `(host) => {
        const sr = host.shadowRoot;
        const active = sr.querySelector('.availability__cell--active');
        const mark = sr.querySelector('.availability__legend-swatch--available');
        const cells = [...sr.querySelectorAll('.availability__cell')];
        const blank = cells.find(c => !c.classList.contains('availability__cell--active'));
        const box = node => node.getBoundingClientRect();
        const centre = node => ({
          x: box(node).x + box(node).width / 2,
          y: box(node).y + box(node).height / 2,
        });
        return [centre(active), centre(mark), centre(blank)];
      }`,
    );

    expect(sameColor(cell, swatch),
      `an available cell painted ${cell.join(',')} but the legend swatch painted`
      + ` ${swatch.join(',')}`).toBe(true);
    expect(sameColor(cell, empty),
      `an available cell painted ${cell.join(',')}, the same as an empty one`).toBe(false);
  });
});
