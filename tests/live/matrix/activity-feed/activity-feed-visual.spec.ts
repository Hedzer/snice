/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-activity-feed TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/activity-feed, `npm run test:matrix`)
 * owns structure truth: which entries render, what they say, which events they
 * emit. It cannot own the first three words of this component's own
 * description — "vertical timeline" — because happy-dom performs no layout and
 * paints no pseudo-elements. The timeline is a `::before` connector plus a
 * column of icons that must share one vertical axis; a browser is the only
 * place either can be seen.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every entry has a real box, and entries stack downward without overlap;
 *   · the icons of every entry share one vertical axis (the timeline's spine),
 *     and each icon sits left of its own content column;
 *   · the connector `::before` is painted between consecutive entries and
 *     suppressed after the last one — the documented timeline, not a list;
 *   · a date group header sits ABOVE the entries it heads;
 *   · the `snice-activity-item` data carriers ("never rendered directly") paint
 *     nothing at all;
 *   · the timestamp is never occluded by the entry's own content.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The active filter button and the connector line are both "a rule exists in
 *   the cascade" claims that pixels can refute.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/activity-feed/matrix.html';

type GroupBy = 'none' | 'date';
type Source = 'slot' | 'array';

const HOUR = 3_600_000;
const DAY = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

interface Activity {
  id: string;
  actor: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: string;
  type?: string;
}

/** The same five activities the DOM matrix uses, spanning three calendar days. */
function feed(): Activity[] {
  return [
    { id: 'a2', actor: { name: 'Bob Stone' }, action: 'commented on', target: 'Issue #42', timestamp: ago(2 * HOUR), type: 'comment' },
    { id: 'a1', actor: { name: 'Alice Ray' }, action: 'created', target: 'Project Alpha', timestamp: ago(30 * 60_000), type: 'create' },
    { id: 'a4', actor: { name: 'Dana' }, action: 'signed in', timestamp: ago(3 * DAY) },
    { id: 'a3', actor: { name: 'Cy Green' }, action: 'created', target: 'Task 9', timestamp: ago(DAY + HOUR), type: 'create' },
    { id: 'a5', actor: { name: 'Eve' }, action: 'deployed', target: 'v3.0', timestamp: ago(4 * HOUR), type: 'deploy' },
  ];
}

interface Combo {
  id: string;
  groupBy: GroupBy;
  source: Source;
  hasMore: boolean;
  filter: string;
  activities: Activity[];
}

/**
 * groupBy (2) x source (2) x hasMore (2) x filter (2: none / one type) = 16
 * combos. Sized to a component whose documented visual surface is one timeline
 * plus a filter bar: the point is that the spine, the connector and the hidden
 * data carriers get a real browser.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const groupBy of ['none', 'date'] as GroupBy[]) {
    for (const source of ['slot', 'array'] as Source[]) {
      for (const hasMore of [false, true]) {
        for (const filter of ['', 'create']) {
          combos.push({
            id: `${groupBy}/${source}/${hasMore ? 'has-more' : 'complete'}/${filter || 'unfiltered'}`,
            groupBy, source, hasMore, filter, activities: feed(),
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

/** LAYER 1. One evaluate per combo, returning every violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const entries = [...sr.querySelectorAll('.feed__entry')] as HTMLElement[];
    if (entries.length === 0) { say('no entries rendered'); return problems; }

    // ── Every entry has a real box, and they stack without overlapping ──────
    for (const [i, entry] of entries.entries()) {
      const box = rect(entry);
      if (box.width <= 0 || box.height <= 0) say(`entry ${i} renders at ${box.width}x${box.height}`);
      const cs = getComputedStyle(entry);
      if (cs.visibility !== 'visible') say(`entry ${i} visibility "${cs.visibility}"`);
      if (i > 0) {
        const above = rect(entries[i - 1]);
        if (box.top < above.bottom - 1) {
          say(`entry ${i} (top ${box.top.toFixed(1)}) overlaps entry ${i - 1}`
            + ` (bottom ${above.bottom.toFixed(1)})`);
        }
      }
    }

    // ── The timeline spine: one shared vertical axis ────────────────────────
    const icons = entries.map(entry => entry.querySelector('.feed__icon') as HTMLElement);
    if (icons.some(icon => !icon)) {
      say('an entry rendered no icon');
    } else {
      const lefts = icons.map(icon => rect(icon).left);
      const spread = Math.max(...lefts) - Math.min(...lefts);
      if (spread > 1) say(`icon column wanders ${spread.toFixed(1)}px across the timeline`);
      for (const [i, icon] of icons.entries()) {
        const iconBox = rect(icon);
        if (iconBox.width <= 0 || iconBox.height <= 0) {
          say(`icon ${i} renders at ${iconBox.width}x${iconBox.height}`);
          continue;
        }
        const content = entries[i].querySelector('.feed__content') as HTMLElement | null;
        if (!content) { say(`entry ${i} has no content column`); continue; }
        if (rect(content).left < iconBox.right - 1) {
          say(`entry ${i}: content (left ${rect(content).left.toFixed(1)}) runs under its`
            + ` icon (right ${iconBox.right.toFixed(1)})`);
        }
      }
    }

    // ── The connector: painted between entries, suppressed after the last ───
    for (const [i, entry] of entries.entries()) {
      const before = getComputedStyle(entry, '::before');
      const last = i === entries.length - 1;
      if (last) {
        if (before.display !== 'none') {
          say(`the last entry still paints a connector (display "${before.display}")`);
        }
      } else if (before.display === 'none') {
        say(`entry ${i} paints no connector to the next one`);
      } else if (parseFloat(before.width) <= 0) {
        say(`entry ${i}'s connector is ${before.width} wide`);
      }
    }

    // ── A group header sits above the entries it heads ──────────────────────
    if (combo.groupBy === 'date') {
      const headers = [...sr.querySelectorAll('.feed__group-header')] as HTMLElement[];
      if (headers.length === 0) say('grouped mode rendered no headers');
      for (const [i, header] of headers.entries()) {
        const box = rect(header);
        if (box.height <= 0) say(`group header ${i} renders at ${box.width}x${box.height}`);
        const following = entries.find(entry => rect(entry).top >= box.bottom - 1);
        if (!following) say(`group header ${i} heads nothing`);
      }
    }

    // ── The data carriers paint nothing ────────────────────────────────────
    if (combo.source === 'slot') {
      const carriers = [...host.children] as HTMLElement[];
      if (carriers.length !== combo.activities.length) {
        say(`${carriers.length} data carriers, expected ${combo.activities.length}`);
      }
      for (const [i, carrier] of carriers.entries()) {
        const box = rect(carrier);
        if (box.width > 0 || box.height > 0) {
          say(`data carrier ${i} occupies ${box.width}x${box.height}`);
        }
      }
      const slot = sr.querySelector('.feed__data-slot') as HTMLElement | null;
      if (slot && getComputedStyle(slot).display !== 'none') {
        say(`the data slot has display "${getComputedStyle(slot).display}"`);
      }
    }

    // ── The timestamp is legible, not painted over ─────────────────────────
    const stamp = entries[0].querySelector('.feed__timestamp') as HTMLElement | null;
    if (!stamp) {
      say('the first entry has no timestamp');
    } else {
      const box = rect(stamp);
      if (box.width <= 0 || box.height <= 0) {
        say(`timestamp renders at ${box.width}x${box.height}`);
      } else {
        const x = box.left + 2;
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`timestamp: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
        } else {
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit !== stamp && !stamp.contains(hit as Node) && !hit?.contains(stamp)) {
            say(`timestamp is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
              + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
          }
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('activity-feed visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      const kept = combo.filter
        ? combo.activities.filter(a => a.type === combo.filter).length
        : combo.activities.length;
      expect(mounted.entries).toBe(kept);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('activity-feed visual matrix: marquee pixels', () => {
  test('the active filter button paints differently from the inactive ones', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { groupBy: 'none', source: 'array', activities: feed() } as any);
    await page.evaluate(() => (window as any).matrix.clickFilter('create'));

    // Probe the middle of the active button and of a neighbour, inside their
    // padding so the read is the button's fill rather than its label.
    const [active, idle] = await capture(
      page, '#subject', 'activity-feed-filter',
      `(host) => {
        const buttons = [...host.shadowRoot.querySelectorAll('.feed__filter')];
        const active = buttons.find(b => b.classList.contains('feed__filter--active'));
        const idle = buttons.find(b => !b.classList.contains('feed__filter--active'));
        return [active, idle].map(node => {
          const box = node.getBoundingClientRect();
          return { x: box.x + 3, y: box.y + 3 };
        });
      }`,
    );
    expect(sameColor(active, idle),
      `active button painted ${active.join(',')}, identical to the idle one`).toBe(false);
    expect(contrast(active, idle),
      `active/idle contrast is ${contrast(active, idle).toFixed(2)}:1`).toBeGreaterThan(1.15);
  });

  test('the timeline connector paints between two entries', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { groupBy: 'none', source: 'array', activities: feed() } as any);

    // One probe on the connector's own column, in the gap between the first two
    // icons, and one a few pixels to the right of it — the page surface.
    const [line, surface] = await capture(
      page, '#subject', 'activity-feed-connector',
      `(host) => {
        const entries = [...host.shadowRoot.querySelectorAll('.feed__entry')];
        const first = entries[0].querySelector('.feed__icon').getBoundingClientRect();
        const second = entries[1].querySelector('.feed__icon').getBoundingClientRect();
        const y = (first.bottom + second.top) / 2;
        const x = first.x + first.width / 2;
        return [{ x, y }, { x: x + 40, y }];
      }`,
    );
    expect(sameColor(line, surface),
      `connector painted ${line.join(',')}, identical to the surface`).toBe(false);
  });
});
