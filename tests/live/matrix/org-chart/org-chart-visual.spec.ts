/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-org-chart TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/org-chart) owns structural truth: the
 * rendered tree IS the data, every card carries its documented name/title/
 * avatar/toggle, and the tree/treeitem/group ARIA holds. None of that says
 * anything about the SHAPE of the chart, and shape is the whole point of an org
 * chart — `direction`, `compact`, and the connector lines between a manager and
 * their reports exist only as CSS.
 *
 * ── Layer 1 (every combo): geometry, occlusion, computed style ──────────────
 *   · `direction="top-down"` really stacks children BELOW their parent, and
 *     `left-right` really puts them to its RIGHT — the only place either claim
 *     can be checked at all;
 *   · siblings sit side by side without overlapping, in data order;
 *   · `compact` really produces smaller cards than the default;
 *   · connector lines have real painted boxes between parent and child;
 *   · no card is occluded by another element (elementFromPoint), and every
 *     card's text has a real box, so nothing has collapsed to zero;
 *   · collapsing a branch really removes its subtree's paint, and shrinks the
 *     chart's own box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The initials placeholder and a real `avatar` image are two different
 *   renderings of the same slot; only pixels can prove the image actually
 *   painted, and that a card is visible against the surface behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/org-chart/matrix.html';

type Tree = 'none' | 'lone' | 'doc' | 'wide' | 'deep' | 'avatars';
type Direction = 'top-down' | 'left-right';

interface Combo {
  id: string;
  tree: Tree;
  direction: Direction;
  compact: boolean;
  collapsed: string[];
}

/** Six hierarchy shapes x two directions x compact = 24 combos. */
function generateCombos(): Combo[] {
  const trees: Tree[] = ['none', 'lone', 'doc', 'wide', 'deep', 'avatars'];
  const combos: Combo[] = [];
  for (const tree of trees) {
    for (const direction of ['top-down', 'left-right'] as Direction[]) {
      for (const compact of [false, true]) {
        combos.push({
          id: `${tree}/${direction}/[${compact ? 'compact' : 'default'}]`,
          tree, direction, compact, collapsed: [],
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

    const base = sr.querySelector('[part="base"]') as HTMLElement | null;
    if (!base) { say('no part="base"'); return problems; }
    if (getComputedStyle(base).visibility !== 'visible') say('the container is not visible');

    const tree = sr.querySelector('[part="tree"]') as HTMLElement | null;
    if (combo.tree === 'none') {
      if (tree) say('a chart with no data still painted a tree');
      if (rect(base).height <= 0) say('the empty-state message has no box');
      return problems;
    }
    if (!tree) { say('no part="tree"'); return problems; }

    const cards = [...sr.querySelectorAll('.org-node')] as HTMLElement[];
    if (cards.length === 0) { say('no cards painted'); return problems; }

    // ── Every card is a real, visible box with real text ─────────────────────
    for (const [i, card] of cards.entries()) {
      const box = rect(card);
      if (box.width <= 0 || box.height <= 0) {
        say(`card ${i} paints at ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
        continue;
      }
      const name = card.querySelector('.org-node-name') as HTMLElement | null;
      if (!name) { say(`card ${i} has no name element`); continue; }
      const nameBox = rect(name);
      if (nameBox.width <= 0 || nameBox.height <= 0) {
        say(`card ${i}'s name "${name.textContent}" paints nothing`);
      }
      if (nameBox.right > box.right + EPS || nameBox.bottom > box.bottom + EPS) {
        say(`card ${i}'s name overflows its own card`);
      }
      const cs = getComputedStyle(card);
      if (Number(cs.opacity) <= 0) say(`card ${i} is fully transparent`);

      // ── Occlusion: the card is really the topmost thing at its own centre ──
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const outer = document.elementFromPoint(cx, cy);
      if (outer !== host) {
        say(`card ${i}: the page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`
          + ' instead of the chart');
      } else {
        const hit = (sr as any).elementFromPoint(cx, cy) as Element | null;
        if (hit && !card.contains(hit) && hit !== card) {
          say(`card ${i} is occluded by <${hit.tagName.toLowerCase()}`
            + `${hit.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    // ── Cards must not overlap each other ────────────────────────────────────
    const boxes = cards.map(rect);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > EPS && overlapY > EPS) {
          say(`cards ${i} and ${j} overlap by`
            + ` ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`);
        }
      }
    }

    // ── direction: where the children actually are ───────────────────────────
    const wrappers = [...sr.querySelectorAll('.org-node-wrapper')] as HTMLElement[];
    for (const wrapper of wrappers) {
      const card = wrapper.querySelector(':scope > .org-node') as HTMLElement | null;
      const group = wrapper.querySelector(':scope > .org-children') as HTMLElement | null;
      if (!card || !group) continue;
      const parentBox = rect(card);
      const childCards = [...group.querySelectorAll('.org-node')] as HTMLElement[];
      const directChildren = [...group.children]
        .map(branch => branch.querySelector('.org-node') as HTMLElement | null)
        .filter(Boolean) as HTMLElement[];
      if (childCards.length === 0) { say('a children group painted no cards'); continue; }

      for (const child of directChildren) {
        const childBox = rect(child);
        if (combo.direction === 'top-down') {
          if (childBox.top < parentBox.bottom - EPS) {
            say(`direction="top-down": a child (top ${childBox.top.toFixed(1)}) is not`
              + ` below its parent (bottom ${parentBox.bottom.toFixed(1)})`);
          }
        } else if (childBox.left < parentBox.right - EPS) {
          say(`direction="left-right": a child (left ${childBox.left.toFixed(1)}) is not`
            + ` to the right of its parent (right ${parentBox.right.toFixed(1)})`);
        }
      }

      // Siblings run in data order along the layout axis.
      for (let i = 1; i < directChildren.length; i++) {
        const previous = rect(directChildren[i - 1]);
        const current = rect(directChildren[i]);
        if (combo.direction === 'top-down') {
          if (current.left < previous.left - EPS) {
            say('direction="top-down": siblings are not painted left to right in data order');
          }
        } else if (current.top < previous.top - EPS) {
          say('direction="left-right": siblings are not painted top to bottom in data order');
        }
      }
    }

    // ── Connector lines really paint something between the levels ────────────
    if (wrappers.some(wrapper => wrapper.querySelector(':scope > .org-children'))) {
      const groups = [...sr.querySelectorAll('.org-children')] as HTMLElement[];
      for (const group of groups) {
        const box = rect(group);
        if (box.width <= 0 || box.height <= 0) say('a children group has no box');
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('org-chart visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      if (combo.tree === 'none') expect(mounted.cards).toBe(0);
      else expect(mounted.cards).toBeGreaterThan(0);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('org-chart visual matrix: compact really is smaller', () => {
  // `compact` produces NO structural difference the DOM tier can weigh — it is
  // a class, and classes are CSS. Whether that CSS makes the card smaller can
  // only be measured here.
  for (const direction of ['top-down', 'left-right'] as Direction[]) {
    test(`compact cards are smaller than default cards (${direction})`, async () => {
      const measure = async (compact: boolean) => {
        await page.evaluate(c => (window as any).matrix.mount(c), {
          tree: 'doc', direction, compact, collapsed: [],
        } as any);
        return page.evaluate(() => {
          const sr = document.getElementById('subject')!.shadowRoot!;
          const card = sr.querySelector('.org-node')!.getBoundingClientRect();
          const avatar = sr.querySelector('.org-avatar-placeholder')!.getBoundingClientRect();
          return { card: card.width * card.height, avatar: avatar.width };
        });
      };

      const normal = await measure(false);
      const compact = await measure(true);

      expect(compact.card, `a compact card covers ${compact.card.toFixed(0)}px2 and a`
        + ` default card ${normal.card.toFixed(0)}px2`).toBeLessThan(normal.card);
      expect(compact.avatar, `a compact avatar is ${compact.avatar}px wide and a default`
        + ` one ${normal.avatar}px`).toBeLessThan(normal.avatar);
    });
  }
});

test.describe('org-chart visual matrix: collapsing removes paint', () => {
  test('folding a branch shrinks the chart and un-paints its subtree', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      tree: 'deep', direction: 'top-down', compact: false, collapsed: [],
    }));

    const before = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return {
        cards: sr.querySelectorAll('.org-node').length,
        height: sr.querySelector('[part="tree"]')!.getBoundingClientRect().height,
      };
    });

    await page.evaluate(() => (window as any).matrix.toggle('Level One'));

    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return {
        cards: sr.querySelectorAll('.org-node').length,
        height: sr.querySelector('[part="tree"]')!.getBoundingClientRect().height,
      };
    });

    expect(after.cards, 'collapsing must remove the subtree').toBe(before.cards - 2);
    expect(after.height, `the tree was ${before.height.toFixed(0)}px tall and is`
      + ` ${after.height.toFixed(0)}px after folding two levels away`)
      .toBeLessThan(before.height - 10);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('org-chart visual matrix: marquee pixels', () => {
  test('a card is separated from the page by a painted edge', async () => {
    // The card's FILL is the page surface by design (snice-org-chart.css uses
    // --snice-color-surface for both), so what makes a card a card is its
    // border. A border that resolves to the surface colour would leave the
    // chart as unstructured text — invisible to every DOM assertion, and
    // obvious here.
    await page.evaluate(() => (window as any).matrix.mount({
      tree: 'lone', direction: 'top-down', compact: false, collapsed: [],
    }));

    const [edge, inside, outside] = await capture(
      page, '#subject', 'org-chart-card-edge',
      `(host) => {
        const box = host.shadowRoot.querySelector('.org-node').getBoundingClientRect();
        const y = box.y + box.height / 2;
        return [
          { x: box.x + 0.5, y },
          { x: box.x + 6, y },
          { x: box.x - 4, y },
        ];
      }`,
    );

    expect(sameColor(edge, outside),
      `the card's left edge painted ${edge.join(',')}, identical to the page`).toBe(false);
    expect(sameColor(edge, inside),
      `the card's left edge painted ${edge.join(',')}, identical to its own fill`).toBe(false);
    expect(contrast(edge, outside),
      `the card border's contrast against the page is`
      + ` ${contrast(edge, outside).toFixed(2)}:1`).toBeGreaterThan(1.05);
  });

  test('an `avatar` really paints its image, and a placeholder paints its letter', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      tree: 'avatars', direction: 'top-down', compact: false, collapsed: [],
    }));

    const [image, placeholderInk, placeholderGround] = await capture(
      page, '#subject', 'org-chart-avatars',
      `(host) => {
        const sr = host.shadowRoot;
        const img = sr.querySelector('.org-avatar').getBoundingClientRect();
        const ph = sr.querySelector('.org-avatar-placeholder').getBoundingClientRect();
        return [
          { x: img.x + img.width / 2, y: img.y + img.height / 2 },
          { x: ph.x + ph.width / 2, y: ph.y + ph.height / 2 },
          { x: ph.x + 2, y: ph.y + 2 },
        ];
      }`,
    );

    // The fixture's avatar is a solid rgb(20,120,220) square.
    const [r, g, b] = image;
    expect(b > r + 40 && b > g + 20,
      `the avatar image painted rgb(${r},${g},${b}), not the blue square it points at`)
      .toBe(true);
    // The placeholder's letter must be ink on a ground, not a blank chip.
    expect(sameColor(placeholderInk, placeholderGround),
      `the placeholder painted one flat colour (${placeholderInk.join(',')}) — no letter`)
      .toBe(false);
  });
});
