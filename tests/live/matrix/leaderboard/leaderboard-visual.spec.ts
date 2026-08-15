/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-leaderboard TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/leaderboard, `npm run test:matrix`)
 * owns structure truth: which entries render, what they say, which events they
 * emit. It cannot own visual truth, because happy-dom performs no layout — and
 * this component's most quotable documented behaviour is pure layout:
 *
 *     "The top 3 entries are displayed in a podium layout (2nd, 1st, 3rd)."
 *
 * In the DOM the tiles are in rank order 1, 2, 3; only a browser applies the
 * `order` rules that put 2nd on the left. The same is true of "Tighter spacing
 * with smaller avatars" (compact), of the size scale, and of the rule that the
 * declarative `<snice-leaderboard-entry>` children are DATA and must never
 * paint.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the board and every entry have real, visible boxes;
 *   · rows stack downward in board order and never overlap;
 *   · the podium lays its three tiles out left-to-right as 2nd, 1st, 3rd, with
 *     the winner's avatar the largest of the three;
 *   · slotted data children paint nothing at all;
 *   · the rank/name/score of a row never occlude each other (elementFromPoint);
 *   · `compact` really is tighter than `default`, and `small` < `medium` <
 *     `large` in row height.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A rise and a fall that "have different colours" in the cascade can still
 *   paint the same pixels, and a highlighted row can have a tint nobody sees.
 *   Both are decided by decoding the PNG inside the browser under test.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/leaderboard/matrix.html';

type Variant = 'default' | 'podium' | 'compact';
type Size = 'small' | 'medium' | 'large';
type Source = 'slot' | 'imperative';

const AVATAR = 'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">'
    + '<rect width="8" height="8" fill="#3b82f6"/></svg>');

interface Entry {
  rank: number; name: string; score: number | string;
  avatar?: string; change?: number; highlighted?: boolean;
}

/** The same board the DOM matrix uses, with an inline avatar so nothing is fetched. */
function board(): Entry[] {
  return [
    { rank: 1, name: 'Alice', score: 2500, avatar: AVATAR, change: 3, highlighted: true },
    { rank: 2, name: 'Bob', score: 2100, change: -1 },
    { rank: 3, name: 'Cleo', score: '1,950', change: 0 },
    { rank: 4, name: 'Dev', score: 1200, avatar: AVATAR },
    { rank: 5, name: 'Eve', score: 900, change: 12 },
  ];
}

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  source: Source;
  entries: Entry[];
}

/**
 * variant (3) x size (3) x source (2) = 18 combos. Sized to a component whose
 * documented surface is a list plus one alternate layout: the point of this tier
 * is that the podium ordering, the spacing scale and the hidden data children
 * get a real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['default', 'podium', 'compact'] as Variant[]) {
    for (const size of ['small', 'medium', 'large'] as Size[]) {
      for (const source of ['slot', 'imperative'] as Source[]) {
        combos.push({
          id: `${variant}/${size}/${source}`,
          variant, size, source, entries: board(),
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
    const rows = [...sr.querySelectorAll('.leaderboard__entry')] as HTMLElement[];
    const tiles = [...sr.querySelectorAll('.leaderboard__podium-entry')] as HTMLElement[];

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') say(`host display "${hostCs.display}", expected block`);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const expectedTiles = combo.variant === 'podium' ? 3 : 0;
    if (tiles.length !== expectedTiles) {
      say(`${tiles.length} podium tiles, expected ${expectedTiles}`);
    }
    if (rows.length !== combo.entries.length - expectedTiles) {
      say(`${rows.length} list rows, expected ${combo.entries.length - expectedTiles}`);
    }

    // ── Every rendered entry has a real box ─────────────────────────────────
    for (const [i, node] of [...tiles, ...rows].entries()) {
      const b = rect(node);
      if (b.width <= 0 || b.height <= 0) say(`entry ${i} renders at ${b.width}x${b.height}`);
      const cs = getComputedStyle(node);
      if (cs.visibility !== 'visible') say(`entry ${i} visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`entry ${i} opacity "${cs.opacity}"`);
    }

    // ── Rows stack downward, in board order, without overlapping ────────────
    for (let i = 1; i < rows.length; i++) {
      const above = rect(rows[i - 1]);
      const below = rect(rows[i]);
      if (below.top < above.bottom - 1) {
        say(`row ${i} (top ${below.top.toFixed(1)}) overlaps row ${i - 1}`
          + ` (bottom ${above.bottom.toFixed(1)})`);
      }
    }

    // ── The podium: 2nd, 1st, 3rd, left to right ────────────────────────────
    if (combo.variant === 'podium' && tiles.length === 3) {
      const byRank = new Map<number, DOMRect>();
      for (const tile of tiles) {
        const rank = Number(tile.textContent?.match(/#(\d+)/)?.[1] ?? 0);
        byRank.set(rank, rect(tile));
      }
      const [first, second, third] = [byRank.get(1), byRank.get(2), byRank.get(3)];
      if (!first || !second || !third) {
        say(`podium ranks resolved to ${[...byRank.keys()].join(',')}`);
      } else {
        if (!(second.left < first.left)) {
          say(`podium order: 2nd (left ${second.left.toFixed(0)}) is not left of`
            + ` 1st (left ${first.left.toFixed(0)})`);
        }
        if (!(first.left < third.left)) {
          say(`podium order: 1st (left ${first.left.toFixed(0)}) is not left of`
            + ` 3rd (left ${third.left.toFixed(0)})`);
        }
        // The winner is the tallest step: its avatar is documented as the
        // emphasised one.
        const avatarOf = (rank: number) => {
          const tile = tiles.find(t => t.textContent?.includes(`#${rank}`));
          const node = tile?.querySelector('.leaderboard__podium-avatar, .leaderboard__podium-avatar-placeholder');
          return node ? rect(node).width : 0;
        };
        const [w1, w2, w3] = [avatarOf(1), avatarOf(2), avatarOf(3)];
        if (!(w1 > w2 && w1 > w3)) {
          say(`winner's avatar is ${w1}px against ${w2}px / ${w3}px`);
        }
      }
    }

    // ── Declarative children are DATA: they must paint nothing ──────────────
    if (combo.source === 'slot') {
      const children = [...host.children] as HTMLElement[];
      if (children.length !== combo.entries.length) {
        say(`${children.length} light-DOM children, expected ${combo.entries.length}`);
      }
      for (const [i, child] of children.entries()) {
        const cs = getComputedStyle(child);
        const b = rect(child);
        if (cs.display !== 'none') say(`data child ${i} has display "${cs.display}"`);
        if (b.width > 0 || b.height > 0) {
          say(`data child ${i} occupies ${b.width}x${b.height}`);
        }
      }
    }

    // ── A row's parts do not occlude each other ─────────────────────────────
    if (rows.length) {
      const row = rows[0];
      for (const selector of ['.leaderboard__rank', '.leaderboard__name', '.leaderboard__score']) {
        const node = row.querySelector(selector) as HTMLElement | null;
        if (!node) { say(`row is missing ${selector}`); continue; }
        const b = rect(node);
        if (b.width <= 0 || b.height <= 0) { say(`${selector} renders at ${b.width}x${b.height}`); continue; }
        const x = b.left + b.width / 2;
        const y = b.top + b.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`${selector}: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== node && !node.contains(hit as Node)) {
          say(`${selector} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('leaderboard visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.rows + mounted.tiles).toBe(combo.entries.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The documented spacing scale, measured across mounts ────────────────────

test.describe('leaderboard visual matrix: spacing scale', () => {
  async function rowHeight(variant: Variant, size: Size): Promise<number> {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { variant, size, source: 'imperative', entries: board() } as any);
    return page.evaluate(() => {
      const row = document.getElementById('subject')!.shadowRoot!
        .querySelector('.leaderboard__entry')!;
      return row.getBoundingClientRect().height;
    });
  }

  test('size grows the row: small < medium < large', async () => {
    const small = await rowHeight('default', 'small');
    const medium = await rowHeight('default', 'medium');
    const large = await rowHeight('default', 'large');
    expect(small, `small ${small} vs medium ${medium}`).toBeLessThan(medium);
    expect(medium, `medium ${medium} vs large ${large}`).toBeLessThan(large);
  });

  test('compact is tighter than default, with a smaller avatar', async () => {
    const defaultHeight = await rowHeight('default', 'medium');
    const compactHeight = await rowHeight('compact', 'medium');
    expect(compactHeight, `compact ${compactHeight} vs default ${defaultHeight}`)
      .toBeLessThan(defaultHeight);

    const avatar = async (variant: Variant) => {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant, size: 'medium', source: 'imperative', entries: board() } as any);
      return page.evaluate(() => {
        const root = document.getElementById('subject')!.shadowRoot!;
        const node = root.querySelector('.leaderboard__entry img, .leaderboard__entry .leaderboard__avatar-placeholder')!;
        return node.getBoundingClientRect().width;
      });
    };
    const defaultAvatar = await avatar('default');
    const compactAvatar = await avatar('compact');
    expect(compactAvatar, `compact avatar ${compactAvatar} vs default ${defaultAvatar}`)
      .toBeLessThan(defaultAvatar);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// two exist because "the rise and the fall have different colour rules" and
// "a reader can tell them apart" are different claims, and only pixels decide.

test.describe('leaderboard visual matrix: marquee pixels', () => {
  test('a rise and a fall paint visibly different colours', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'large', source: 'imperative',
      entries: [
        { rank: 1, name: 'Up', score: 10, change: 3 },
        { rank: 2, name: 'Down', score: 9, change: -3 },
      ],
    }));
    const [up, down] = await capture(
      page, '#subject', 'leaderboard-change',
      `(host) => {
        const nodes = host.shadowRoot.querySelectorAll('.leaderboard__change');
        return [...nodes].map(node => {
          const box = node.getBoundingClientRect();
          return { x: box.x + box.width - 4, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(sameColor(up, down),
      `rise painted ${up.join(',')} and fall painted ${down.join(',')}`).toBe(false);
  });

  test('a highlighted row paints a background a reader can see', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'large', source: 'imperative',
      entries: [
        { rank: 1, name: 'Plain', score: 10 },
        { rank: 2, name: 'Marked', score: 9, highlighted: true },
      ],
    }));
    // Probe the left gutter of each row, clear of the rank glyph, so the pixel
    // read is the row's own background rather than its text.
    const [plain, marked] = await capture(
      page, '#subject', 'leaderboard-highlight',
      `(host) => {
        const rows = host.shadowRoot.querySelectorAll('.leaderboard__entry');
        return [...rows].map(row => {
          const box = row.getBoundingClientRect();
          return { x: box.x + box.width - 6, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(sameColor(plain, marked),
      `highlighted row painted ${marked.join(',')}, identical to the plain row`).toBe(false);
    expect(contrast(plain, marked),
      `highlight contrast is ${contrast(plain, marked).toFixed(2)}:1`).toBeGreaterThan(1.02);
  });
});
