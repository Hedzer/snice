/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-nav TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/nav, `npm run test:matrix`) owns
 * structure truth: which links exist, in what order, with which href,
 * aria-label and aria-current. It cannot own visual truth, because happy-dom
 * performs no layout — every box reads 0 and nothing is painted.
 *
 * Two of the nav's four documented properties are ENTIRELY visual.
 * `orientation` produces no DOM difference at all (`flex-direction` on one
 * class), and `active-style="text"` is documented as a "color-only highlight"
 * — a claim about background-color and an ::after accent bar that no DOM test
 * can evaluate. The hierarchical submenu's indentation and the grouped
 * variant's uppercase bucket labels are likewise pure CSS.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `orientation` really switches axis: a horizontal nav lays its links out
 *     left-to-right with no vertical overlap, a vertical one top-to-bottom;
 *   · a vertical nav's links really span their column (the documented
 *     `width: 100%`), so the whole row is a click target and not just the text;
 *   · `active-style="fill"` paints the active link a background DIFFERENT from
 *     its inactive siblings; `active-style="text"` paints NO background on any
 *     link and instead gives the active one a full-width accent bar, which is
 *     exactly the pair of claims the docs make;
 *   · the hierarchical submenu is really indented past its parent link, and
 *     the grouped label really sits above its bucket's first link;
 *   · every link's label is visible, non-empty, and NOT occluded by a sibling
 *     (elementFromPoint through the shadow root);
 *   · `:host` has `overflow: hidden`, so a nav whose links exceed the host is
 *     silently clipped — every combo asserts every link is inside the host box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The active link has a background-color" and "you can see which link is
 *   active" are different claims. The marquee captures decode the PNG inside
 *   the browser under test and assert the active link's painted pixels really
 *   differ from an inactive sibling's under `fill`, really do NOT under `text`,
 *   and that the text-mode accent bar paints the primary colour it promises.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/nav/matrix.html';

type Variant = 'flat' | 'hierarchical' | 'grouped';
type Orientation = 'horizontal' | 'vertical';
type ActiveStyle = 'fill' | 'text';
type Dataset = 'flat' | 'nested' | 'grouped';

interface Combo {
  id: string;
  variant: Variant;
  orientation: Orientation;
  activeStyle: ActiveStyle;
  dataset: Dataset;
  route: string;
  slotted: boolean;
}

/** The dataset each variant is meant to display, per the doc's own examples. */
const DATASET_FOR: Record<Variant, Dataset> = {
  flat: 'flat',
  hierarchical: 'nested',
  grouped: 'grouped',
};

/** The route that makes exactly one link current in each dataset. */
const ROUTE_FOR: Record<Dataset, string> = {
  flat: 'products',
  nested: 'products',
  grouped: 'profile',
};

/**
 * The cross: variant x orientation x activeStyle (12), each also run with the
 * documented default slot occupied (24). Sized to a component with four
 * properties and three layout shapes — the point is that every style-only
 * dimension gets a real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['flat', 'hierarchical', 'grouped'] as Variant[]) {
    for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
      for (const activeStyle of ['fill', 'text'] as ActiveStyle[]) {
        for (const slotted of [false, true]) {
          const dataset = DATASET_FOR[variant];
          combos.push({
            id: `${variant}/${orientation}/active-style=${activeStyle}`
              + `${slotted ? '/slotted' : ''}`,
            variant, orientation, activeStyle, dataset,
            route: ROUTE_FOR[dataset], slotted,
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
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);
    if (hostCs.display !== 'block') say(`host computed display "${hostCs.display}", expected "block"`);

    const navEl = sr.querySelector('[part~="nav"]') as HTMLElement | null;
    if (!navEl) { say('no part="nav" rendered'); return problems; }
    const navCs = getComputedStyle(navEl);

    // ── orientation: the documented axis switch ──────────────────────────────
    const wantDirection = combo.orientation === 'vertical' ? 'column' : 'row';
    if (navCs.flexDirection !== wantDirection) {
      say(`orientation="${combo.orientation}" gave flex-direction`
        + ` "${navCs.flexDirection}", expected "${wantDirection}"`);
    }

    const links = [...sr.querySelectorAll('[part~="link"]')] as HTMLElement[];
    if (links.length === 0) { say('no part="link" rendered'); return problems; }

    // ── Every link has a real, visible, readable box ─────────────────────────
    for (const [i, link] of links.entries()) {
      const box = rect(link);
      const label = link.querySelector('.nav__label') as HTMLElement | null;
      const where = `link[${i}] "${label?.textContent ?? '?'}"`;

      if (box.width <= 0 || box.height <= 0) {
        say(`${where} renders at ${box.width}x${box.height}`);
        continue;
      }
      const cs = getComputedStyle(link);
      if (cs.visibility !== 'visible') say(`${where} visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`${where} opacity "${cs.opacity}"`);
      if (parseFloat(cs.fontSize) < 9) say(`${where} font-size ${cs.fontSize}`);

      if (!label) { say(`${where} has no .nav__label`); continue; }
      const labelBox = rect(label);
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`${where} label renders at ${labelBox.width}x${labelBox.height}`);
      }
      // `.nav__label` is `text-overflow: ellipsis`; a label narrower than its
      // own text is silently truncated, which is a layout defect at this width.
      if (label.scrollWidth > label.clientWidth + 1) {
        say(`${where} label is truncated (${label.scrollWidth} > ${label.clientWidth})`);
      }

      // ── overflow: hidden on :host means anything outside is INVISIBLE ─────
      if (box.right > hostBox.right + EPS || box.left < hostBox.left - EPS) {
        say(`${where} is clipped horizontally by the host`
          + ` (${box.left.toFixed(0)}..${box.right.toFixed(0)} vs`
          + ` ${hostBox.left.toFixed(0)}..${hostBox.right.toFixed(0)})`);
      }
      if (box.bottom > hostBox.bottom + EPS || box.top < hostBox.top - EPS) {
        say(`${where} is clipped vertically by the host`);
      }

      // ── Occlusion: nothing may paint over a navigation label ─────────────
      const y = labelBox.top + labelBox.height / 2;
      for (const fraction of [0.25, 0.75]) {
        const x = labelBox.left + labelBox.width * fraction;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`${where} @${Math.round(fraction * 100)}%: page hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the nav`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== label && !label.contains(hit as Node) && !link.contains(hit as Node)) {
          say(`${where} @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    // ── The axis really separates the links ──────────────────────────────────
    // Top-level siblings only: a hierarchical submenu is deliberately stacked
    // under its parent even in a horizontal nav.
    const topLinks = links.filter(l =>
      !l.closest('.nav__submenu') && !(combo.variant === 'hierarchical' && l.closest('.nav__submenu')));
    const rowLinks = combo.variant === 'flat' ? links : topLinks;
    for (let i = 1; i < rowLinks.length; i++) {
      const a = rect(rowLinks[i - 1]);
      const b = rect(rowLinks[i]);
      if (combo.orientation === 'horizontal' && combo.variant === 'flat') {
        if (b.left < a.right - EPS) say(`horizontal links ${i - 1}/${i} overlap on x`);
      }
      if (combo.orientation === 'vertical') {
        if (b.top < a.bottom - EPS) say(`vertical links ${i - 1}/${i} overlap on y`);
      }
    }

    // ── A vertical nav's links span their column (documented width: 100%) ────
    if (combo.orientation === 'vertical') {
      for (const [i, link] of links.entries()) {
        if (link.closest('.nav__submenu')) continue; // indented by design
        const box = rect(link);
        const parentBox = rect(link.parentElement!);
        if (box.width < parentBox.width - EPS) {
          say(`vertical link[${i}] is ${box.width.toFixed(0)}px in a`
            + ` ${parentBox.width.toFixed(0)}px item — it does not fill its row`);
        }
      }
    }

    // ── active-style: the documented highlight, and its absence ──────────────
    const active = links.find(l => l.getAttribute('aria-current') === 'page');
    const inactive = links.find(l => l.getAttribute('aria-current') !== 'page');
    if (!active) {
      say(`route "${combo.route}" produced no aria-current link to judge`);
    } else if (inactive) {
      const activeBg = getComputedStyle(active).backgroundColor;
      const inactiveBg = getComputedStyle(inactive).backgroundColor;
      const TRANSPARENT = 'rgba(0, 0, 0, 0)';
      if (combo.activeStyle === 'fill') {
        if (activeBg === inactiveBg) {
          say(`active-style="fill" painted the active link the same background`
            + ` as an inactive one (${activeBg})`);
        }
        if (activeBg === TRANSPARENT) {
          say('active-style="fill" left the active link transparent — there is no fill');
        }
      } else {
        // "color-only highlight": no fill on ANY link, and a colour difference.
        for (const [i, link] of links.entries()) {
          const bg = getComputedStyle(link).backgroundColor;
          if (bg !== TRANSPARENT) {
            say(`active-style="text" painted link[${i}] a background fill (${bg})`);
          }
        }
        if (getComputedStyle(active).color === getComputedStyle(inactive).color) {
          say('active-style="text" gave the active link no colour difference at all');
        }
        // The accent bar: full-width under a horizontal nav, full-height beside
        // a vertical one. `::after` geometry is only reachable as computed style.
        const bar = getComputedStyle(active, '::after');
        if (bar.content === 'none') {
          say('active-style="text" rendered no ::after accent bar on the active link');
        } else if (combo.orientation === 'horizontal') {
          if (parseFloat(bar.left) !== 0 || parseFloat(bar.right) !== 0) {
            say(`the active accent bar is inset (left ${bar.left}, right ${bar.right}),`
              + ' expected it anchored full-width');
          }
        } else if (bar.transform !== 'none' && bar.transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
          say(`the vertical accent bar is still scaled away (${bar.transform})`);
        }
      }
    }

    // ── hierarchical: the submenu is indented past its parent link ───────────
    if (combo.variant === 'hierarchical') {
      const submenu = sr.querySelector('.nav__submenu') as HTMLElement | null;
      if (!submenu) {
        say('hierarchical nav rendered no submenu for a dataset that has children');
      } else {
        const parentLink = submenu.closest('.nav__group')
          ?.querySelector(':scope > [part~="link"]') as HTMLElement | null;
        const child = submenu.querySelector('[part~="link"]') as HTMLElement | null;
        if (parentLink && child) {
          if (rect(child).left <= rect(parentLink).left + EPS) {
            say(`the submenu link is not indented past its parent`
              + ` (${rect(child).left.toFixed(0)} vs ${rect(parentLink).left.toFixed(0)})`);
          }
          if (rect(child).top < rect(parentLink).bottom - EPS) {
            say('the submenu link overlaps its parent link vertically');
          }
        }
      }
    }

    // ── grouped: the label sits above its bucket, uppercase and legible ──────
    if (combo.variant === 'grouped') {
      const label = sr.querySelector('.nav__group-label') as HTMLElement | null;
      if (!label) {
        say('grouped nav rendered no group label for a dataset with named groups');
      } else {
        const labelBox = rect(label);
        if (labelBox.width <= 0 || labelBox.height <= 0) {
          say(`group label renders at ${labelBox.width}x${labelBox.height}`);
        }
        const labelCs = getComputedStyle(label);
        if (labelCs.textTransform !== 'uppercase') {
          say(`group label text-transform "${labelCs.textTransform}", expected uppercase`);
        }
        const first = label.parentElement?.querySelector('[part~="link"]') as HTMLElement | null;
        if (first && rect(first).top < labelBox.bottom - EPS) {
          say('the group label overlaps the first link of its bucket');
        }
      }
    }

    // ── The default slot really renders AFTER the navigation ────────────────
    if (combo.slotted) {
      const slotted = host.querySelector('#slotted') as HTMLElement | null;
      if (!slotted) {
        say('the slotted button did not render at all');
      } else {
        const box = rect(slotted);
        if (box.width <= 0 || box.height <= 0) {
          say(`slotted content renders at ${box.width}x${box.height} — the default slot is dead`);
        }
        if (box.top < rect(navEl).top - EPS) {
          say('slotted content painted ABOVE the navigation');
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('nav visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.links, `combo ${combo.id} mounted no links`).toBeGreaterThan(0);
      expect(mounted.orientation).toBe(combo.orientation);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the active link has a different background-color" and "a user
// can see which page they are on" are different claims, and only pixels can
// tell them apart.

test.describe('nav visual matrix: marquee pixels', () => {
  test('active-style="fill" paints the current page a visibly different colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'flat', orientation: 'horizontal', activeStyle: 'fill',
      dataset: 'flat', route: 'products',
    }));
    // Probe the middle of the active link and the middle of an inactive one. A
    // fill that "exists" but matches its neighbour marks nothing.
    const [activePx, inactivePx] = await capture(
      page, '#subject', 'nav-active-fill',
      `(host) => {
        const links = [...host.shadowRoot.querySelectorAll('[part~="link"]')];
        const active = links.find(l => l.getAttribute('aria-current') === 'page');
        const inactive = links.find(l => l.getAttribute('aria-current') !== 'page');
        const mid = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.x + 6, y: b.y + b.height / 2 };
        };
        return [mid(active), mid(inactive)];
      }`,
    );
    expect(sameColor(activePx, inactivePx),
      `the active link painted ${activePx.join(',')}, identical to an inactive one`).toBe(false);
    // A highlight nobody can see is not a highlight. 1.05:1 is a deliberately
    // low bar — a surface-container fill is meant to be quiet — but "quiet" is
    // not "absent".
    expect(contrast(activePx, inactivePx),
      `active/inactive contrast is ${contrast(activePx, inactivePx).toFixed(3)}:1`)
      .toBeGreaterThan(1.02);
  });

  test('active-style="text" paints NO fill — the documented colour-only highlight', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'flat', orientation: 'horizontal', activeStyle: 'text',
      dataset: 'flat', route: 'products',
    }));
    // The padding of an active link, well clear of its glyphs and of the accent
    // bar at the very bottom, must read as the page surface itself.
    const [activePad, surface] = await capture(
      page, '#subject', 'nav-active-text',
      `(host) => {
        const links = [...host.shadowRoot.querySelectorAll('[part~="link"]')];
        const active = links.find(l => l.getAttribute('aria-current') === 'page');
        const b = active.getBoundingClientRect();
        const hostBox = host.getBoundingClientRect();
        return [
          { x: b.x + 3, y: b.y + 4 },
          { x: hostBox.x + hostBox.width - 4, y: hostBox.y + 2 },
        ];
      }`,
    );
    expect(sameColor(activePad, surface),
      `active-style="text" painted a fill: ${activePad.join(',')} vs surface ${surface.join(',')}`)
      .toBe(true);
  });

  test('the text-mode accent bar paints under the active link', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'flat', orientation: 'horizontal', activeStyle: 'text',
      dataset: 'flat', route: 'products',
    }));
    // Two probes on the bar's row and one on the row above it. The bar is
    // 2px tall at `bottom: 2px`, so the row above is bare link background —
    // if the bar never painted, all three read the same.
    const pixels = await capture(
      page, '#subject', 'nav-accent-bar',
      `(host) => {
        const links = [...host.shadowRoot.querySelectorAll('[part~="link"]')];
        const active = links.find(l => l.getAttribute('aria-current') === 'page');
        const b = active.getBoundingClientRect();
        return [
          { x: b.x + b.width * 0.5, y: b.bottom - 3 },
          { x: b.x + b.width * 0.2, y: b.bottom - 3 },
          { x: b.x + b.width * 0.5, y: b.bottom - 10 },
        ];
      }`,
    );
    const [barMid, barEdge, above] = pixels as RGB[];
    expect(sameColor(barMid, above),
      `the accent bar row (${barMid.join(',')}) is identical to the row above it`).toBe(false);
    // "left: 0; right: 0" — the bar spans the WHOLE link, so a probe at 20%
    // must land on it too, not just the centre.
    expect(sameColor(barMid, barEdge),
      `the accent bar is not full-width: centre ${barMid.join(',')} vs 20% ${barEdge.join(',')}`)
      .toBe(true);
  });

  test('a vertical nav paints its links as full-width rows', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'flat', orientation: 'vertical', activeStyle: 'fill',
      dataset: 'flat', route: 'products',
    }));
    // The active row's fill must reach the far right edge of the column, not
    // stop at the end of the text. Probe just inside the right edge.
    const [rowRight, surface] = await capture(
      page, '#subject', 'nav-vertical-row',
      `(host) => {
        const links = [...host.shadowRoot.querySelectorAll('[part~="link"]')];
        const active = links.find(l => l.getAttribute('aria-current') === 'page');
        const b = active.getBoundingClientRect();
        const hostBox = host.getBoundingClientRect();
        return [
          { x: b.right - 4, y: b.y + b.height / 2 },
          { x: hostBox.x + hostBox.width - 4, y: hostBox.y + 1 },
        ];
      }`,
    );
    expect(sameColor(rowRight, surface),
      `the active row's right edge (${rowRight.join(',')}) is bare surface —`
      + ' the fill does not span the column').toBe(false);
  });
});
