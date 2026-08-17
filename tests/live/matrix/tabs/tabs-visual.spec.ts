/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-tabs TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/tabs, `npm run test:matrix`) owns structure
 * truth: which parts exist, which panel is hidden, the three event details, the
 * four methods. Five of this component's documented claims are invisible to
 * happy-dom, which performs no layout and paints nothing:
 *
 *   · four PLACEMENTS whose entire meaning is where the nav sits relative to
 *     the panels — `top`, `bottom`, `start`, `end`. A DOM assertion cannot tell
 *     one from another;
 *   · `indicator` — "Active tab indicator bar". It is positioned by script
 *     (`updateIndicator` measures the tabs and writes width/height/transform),
 *     so it is meaningless without a layout engine, and it has to actually sit
 *     under the ACTIVE tab;
 *   · `scroll-button` / `-start` / `-end` — arrows that exist for an
 *     OVERFLOWING nav, which is a width question;
 *   · "exactly one panel is on screen" — the DOM tier reads `hidden`; only a
 *     browser can say the hidden ones really take no space;
 *   · `close` — a button inside a tab, which must not cover the tab's own
 *     label or spill outside it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/tabs/matrix.html';

type Placement = 'top' | 'bottom' | 'start' | 'end';
const PLACEMENTS: Placement[] = ['top', 'bottom', 'start', 'end'];

/** Wide enough for three tabs; narrow enough that eight must overflow. */
const WIDE = 640;
const NARROW = 260;

interface Combo {
  id: string;
  placement: Placement;
  count: number;
  selected: number;
  closable: boolean;
  stageWidth: number;
}

/**
 * 4 placements x 3 tab counts x a rotating selection, with the closable switch
 * rotated through them — 36 combos. Sized to a component whose visual contract
 * is "the nav sits on the documented side, exactly one panel is on screen, and
 * the indicator is under the active tab".
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let i = 0;
  for (const placement of PLACEMENTS) {
    for (const count of [2, 3, 8]) {
      // Deduped: with two tabs, "the second" and "the last" are the same tab.
      for (const selected of [...new Set([0, 1, count - 1])]) {
        const closable = i++ % 3 === 0;
        combos.push({
          id: `${placement}/tabs=${count}/selected=${selected}/${closable ? 'closable' : 'plain'}`,
          placement,
          count,
          selected,
          closable,
          // Eight tabs in a narrow stage is the overflow case the scroll
          // buttons exist for.
          stageWidth: count === 8 ? NARROW : WIDE,
        });
      }
    }
  }
  return combos;
}

const mountArgs = (combo: Combo) => ({
  placement: combo.placement,
  count: combo.count,
  selected: combo.selected,
  closable: combo.closable,
  stageWidth: combo.stageWidth,
});

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
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
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partIn = (root: ParentNode, name: string) =>
      ([...root.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;
    const partOf = (name: string) => partIn(sr, name);

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the tabs render at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── In the content flow, filling its column ─────────────────────────────
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (Math.abs(hostBox.width - stage.width) > 1) {
      say(`the tabs are ${hostBox.width.toFixed(0)}px wide in a ${stage.width.toFixed(0)}px column`);
    }
    const after = document.getElementById('after')!.getBoundingClientRect();
    if (after.top < hostBox.bottom - EPS) {
      say('the block after the tabs does not clear them — the tabs take no space');
    }

    const nav = partOf('nav');
    const panels = partOf('panels');
    if (!nav) { say('no [part="nav"]'); return problems; }
    if (!panels) { say('no [part="panels"]'); return problems; }
    const navBox = rect(nav);
    const panelsBox = rect(panels);
    if (navBox.height <= 0 || navBox.width <= 0) {
      say(`[part="nav"] renders at ${navBox.width}x${navBox.height}`);
      return problems;
    }

    // ── The placement really places the nav ─────────────────────────────────
    const gap = {
      above: panelsBox.top - navBox.bottom,
      below: navBox.top - panelsBox.bottom,
      left: panelsBox.left - navBox.right,
      right: navBox.left - panelsBox.right,
    };
    const side = combo.placement === 'top' ? gap.above
      : combo.placement === 'bottom' ? gap.below
        : combo.placement === 'start' ? gap.left
          : gap.right;
    if (side < -EPS) {
      say(`placement="${combo.placement}" puts the nav on the wrong side of the panels`
        + ` (gaps: ${JSON.stringify(gap, (_, v) => (typeof v === 'number' ? Math.round(v) : v))})`);
    }

    // ── Exactly one panel takes space ───────────────────────────────────────
    const shownPanels: number[] = [];
    for (let i = 0; i < combo.count; i++) {
      const panel = document.getElementById(`panel-${i}`);
      if (!panel) { say(`panel ${i} was not slotted`); continue; }
      const box = panel.getBoundingClientRect();
      const cs = getComputedStyle(panel);
      const visible = cs.display !== 'none' && cs.visibility === 'visible'
        && box.width > 0 && box.height > 0;
      if (visible) shownPanels.push(i);
    }
    if (shownPanels.length !== 1 || shownPanels[0] !== combo.selected) {
      say(`panels on screen: [${shownPanels.join(',')}], expected [${combo.selected}]`);
    }
    // …and the one that is showing is inside the panels region.
    const active = document.getElementById(`panel-${combo.selected}`);
    if (active) {
      const box = active.getBoundingClientRect();
      if (box.top < panelsBox.top - EPS || box.bottom > panelsBox.bottom + EPS) {
        say('the active panel escapes [part="panels"]');
      }
    }

    // ── The tabs sit in the nav, in order, without overlapping ──────────────
    const tabs: HTMLElement[] = [];
    for (let i = 0; i < combo.count; i++) {
      const tab = document.getElementById(`tab-${i}`) as HTMLElement | null;
      if (!tab) { say(`tab ${i} was not slotted`); continue; }
      tabs.push(tab);
    }
    const horizontal = combo.placement === 'top' || combo.placement === 'bottom';
    let previousEdge = -Infinity;
    for (const [i, tab] of tabs.entries()) {
      const box = tab.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        say(`tab ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      const leading = horizontal ? box.left : box.top;
      const trailing = horizontal ? box.right : box.bottom;
      if (leading < previousEdge - EPS) say(`tab ${i} overlaps the tab before it`);
      previousEdge = trailing;

      // A tab's label must be readable and must not be covered by its own
      // close button.
      const label = partIn(tab.shadowRoot!, 'label');
      if (!label) { say(`tab ${i} has no [part="label"]`); continue; }
      const labelBox = rect(label);
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`tab ${i} label renders at ${labelBox.width}x${labelBox.height}`);
      }
      const close = partIn(tab.shadowRoot!, 'close');
      if (combo.closable && !close) say(`closable tab ${i} paints no [part="close"]`);
      if (!combo.closable && close) say(`tab ${i} paints a close button it does not have`);
      if (close) {
        const closeBox = rect(close);
        if (closeBox.width < 10 || closeBox.height < 10) {
          say(`tab ${i} close button renders at`
            + ` ${closeBox.width.toFixed(0)}x${closeBox.height.toFixed(0)}`);
        }
        const ox = Math.min(labelBox.right, closeBox.right) - Math.max(labelBox.left, closeBox.left);
        const oy = Math.min(labelBox.bottom, closeBox.bottom) - Math.max(labelBox.top, closeBox.top);
        if (ox > EPS && oy > EPS) say(`tab ${i} close button covers its own label`);
        if (closeBox.right > box.right + EPS) say(`tab ${i} close button spills out of the tab`);
      }
    }

    // ── The indicator bar sits under the ACTIVE tab ─────────────────────────
    const indicator = partOf('indicator');
    if (!indicator) say('no [part="indicator"]');
    else if (tabs[combo.selected]) {
      const bar = rect(indicator);
      const activeTab = tabs[combo.selected].getBoundingClientRect();
      // Documented: "Active tab indicator bar". The measurement the component
      // performs is the tab's own extent, so the bar has to match it on the
      // axis the placement runs along.
      if (horizontal) {
        if (bar.width <= 0) say(`the indicator is ${bar.width}px wide`);
        else if (Math.abs(bar.width - activeTab.width) > 2) {
          say(`the indicator is ${bar.width.toFixed(0)}px wide under a`
            + ` ${activeTab.width.toFixed(0)}px tab`);
        }
      } else if (bar.height <= 0) {
        say(`the indicator is ${bar.height}px tall`);
      } else if (Math.abs(bar.height - activeTab.height) > 2) {
        say(`the indicator is ${bar.height.toFixed(0)}px tall beside a`
          + ` ${activeTab.height.toFixed(0)}px tab`);
      }
    }

    // ── The scroll buttons ──────────────────────────────────────────────────
    const start = partOf('scroll-button-start');
    const end = partOf('scroll-button-end');
    if (!start || !end) say('a tab bar with scroll controls is missing one of its arrows');
    else {
      const track = sr.querySelector('.tabs__nav-track') as HTMLElement | null;
      const overflowing = !!track && track.scrollWidth > nav.clientWidth + 1;
      const armed = start.classList.contains('tabs__scroll-button--visible');
      // Documented: the arrows are a SCROLL control — they belong to a nav
      // that has somewhere to scroll to.
      if (horizontal && overflowing !== armed) {
        say(`the scroll arrows are ${armed ? 'armed' : 'idle'} for a nav that`
          + ` ${overflowing ? 'overflows' : 'fits'}`);
      }
      // Containment is only a question for an arrow that is actually PAINTED:
      // an idle arrow is collapsed out of the layout, and a zero-size box
      // parked at the origin would fail a containment test for no reason a
      // user could ever see.
      for (const [name, button] of [['start', start], ['end', end]] as const) {
        const cs = getComputedStyle(button);
        const box = rect(button);
        const shown = cs.display !== 'none' && cs.visibility === 'visible'
          && Number(cs.opacity) > 0.05 && box.width > 0 && box.height > 0;
        if (!shown) continue;
        if (box.right > hostBox.right + EPS || box.left < hostBox.left - EPS) {
          say(`the ${name} scroll arrow hangs outside the component`
            + ` (${box.left.toFixed(0)}→${box.right.toFixed(0)} in`
            + ` ${hostBox.left.toFixed(0)}→${hostBox.right.toFixed(0)})`);
        }
      }
    }

    // ── Occlusion: every tab the user can SEE is reachable ──────────────────
    //
    // The nav is a scroll container, so an overflowing tab bar legitimately
    // parks some tabs outside the visible strip — those are clipped, not
    // occluded, and the scroll arrows exist precisely to bring them back. Only
    // the tabs currently inside the nav's own box are probed.
    for (const [i, tab] of tabs.entries()) {
      const box = tab.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      if (x < navBox.left + 1 || x > navBox.right - 1
        || y < navBox.top + 1 || y > navBox.bottom - 1) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit !== tab && !tab.contains(hit as Node) && hit !== host) {
        say(`tab ${i} is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('tabs visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The claims a browser answers best ───────────────────────────────────────

test.describe('tabs visual matrix: the indicator follows the selection', () => {
  test('clicking a tab moves the indicator bar under it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      placement: 'top', count: 4, selected: 0, stageWidth: 640,
    } as any);

    const measure = () => page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const indicator = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('indicator'))!;
      const bar = indicator.getBoundingClientRect();
      const active = document.getElementById(`tab-${(host as any).selected}`)!.getBoundingClientRect();
      return { barLeft: bar.left, barWidth: bar.width, tabLeft: active.left, tabWidth: active.width };
    });

    const first = await measure();
    expect(Math.abs(first.barLeft - first.tabLeft),
      `the indicator starts at ${first.barLeft.toFixed(0)} under a tab at ${first.tabLeft.toFixed(0)}`)
      .toBeLessThan(3);

    await page.evaluate(() => (window as any).matrix.clickTab(2));
    const moved = await measure();
    expect(moved.barLeft, 'the indicator did not move with the selection')
      .not.toBeCloseTo(first.barLeft, 0);
    expect(Math.abs(moved.barLeft - moved.tabLeft),
      `the indicator sits at ${moved.barLeft.toFixed(0)} under a tab at ${moved.tabLeft.toFixed(0)}`)
      .toBeLessThan(3);
    expect(Math.abs(moved.barWidth - moved.tabWidth),
      `the indicator is ${moved.barWidth.toFixed(0)}px wide under a`
      + ` ${moved.tabWidth.toFixed(0)}px tab`)
      .toBeLessThan(3);
  });
});

test.describe('tabs visual matrix: the four placements', () => {
  test('each placement puts the nav on its own side of the panels', async () => {
    const sides: Record<string, string> = {};
    for (const placement of PLACEMENTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        placement, count: 3, selected: 0, stageWidth: 640,
      } as any);
      sides[placement] = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const find = (name: string) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes(name))!
          .getBoundingClientRect();
        const nav = find('nav');
        const panels = find('panels');
        if (nav.bottom <= panels.top + 1) return 'above';
        if (nav.top >= panels.bottom - 1) return 'below';
        if (nav.right <= panels.left + 1) return 'left';
        if (nav.left >= panels.right - 1) return 'right';
        return 'overlapping';
      });
    }
    expect(sides.top, `placements resolved to ${JSON.stringify(sides)}`).toBe('above');
    expect(sides.bottom, `placements resolved to ${JSON.stringify(sides)}`).toBe('below');
    expect(sides.start, `placements resolved to ${JSON.stringify(sides)}`).toBe('left');
    expect(sides.end, `placements resolved to ${JSON.stringify(sides)}`).toBe('right');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('tabs visual matrix: marquee pixels', () => {
  test('the indicator bar is really painted, in a colour of its own', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      placement: 'top', count: 3, selected: 1, stageWidth: 640,
    } as any);

    const [bar, surface] = await capture(
      page, '#subject', 'tabs-indicator',
      `(host) => {
        const sr = host.shadowRoot;
        const indicator = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes('indicator'))
          .getBoundingClientRect();
        return [
          { x: indicator.x + indicator.width / 2, y: indicator.y + indicator.height / 2 },
          { x: host.getBoundingClientRect().right - 4, y: indicator.y + indicator.height / 2 },
        ];
      }`,
    );
    expect(sameColor(bar, surface),
      `the indicator painted rgb(${bar.join(',')}), the same as the bar beside it`)
      .toBe(false);
  });

  test('the active tab looks different from an inactive one', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      placement: 'top', count: 3, selected: 0, stageWidth: 640,
    } as any);

    const probe = `() => {
      const points = [];
      for (const index of [0, 1]) {
        const tab = document.getElementById('tab-' + index).getBoundingClientRect();
        for (let i = 0; i < 14; i++) {
          points.push({ x: tab.x + (tab.width * (i + 0.5)) / 14, y: tab.y + tab.height / 2 });
        }
      }
      return points;
    }`;
    const pixels = await capture(page, '#subject', 'tabs-active', probe);
    const activeRun = pixels.slice(0, 14);
    const idleRun = pixels.slice(14);

    // Documented: the nav shows which tab is active. Two runs of pixels across
    // two tabs that are pixel-for-pixel identical would mean it does not.
    const different = activeRun.some((pixel, i) => !sameColor(pixel, idleRun[i]));
    expect(different,
      'the active tab paints exactly the same pixels as an inactive one')
      .toBe(true);
  });

  test('a disabled tab is visibly dimmer than a live one', async () => {
    const probe = `() => {
      const tab = document.getElementById('tab-1').getBoundingClientRect();
      const points = [];
      for (let i = 0; i < 14; i++) {
        points.push({ x: tab.x + (tab.width * (i + 0.5)) / 14, y: tab.y + tab.height / 2 });
      }
      return points;
    }`;

    await page.evaluate(c => (window as any).matrix.mount(c), {
      placement: 'top', count: 3, selected: 0, stageWidth: 640,
    } as any);
    const live = await capture(page, '#subject', 'tabs-live', probe);

    await page.evaluate(c => (window as any).matrix.mount(c), {
      placement: 'top', count: 3, selected: 0, disabled: 1, stageWidth: 640,
    } as any);
    const dead = await capture(page, '#subject', 'tabs-disabled', probe);

    const different = dead.some((pixel, i) => !sameColor(pixel, live[i]));
    expect(different, 'a disabled tab paints exactly the same pixels as a live one').toBe(true);
  });
});
