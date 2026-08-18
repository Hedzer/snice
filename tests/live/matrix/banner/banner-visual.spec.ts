/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-banner TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/banner, `npm run test:matrix`) owns
 * structure truth: which parts exist, what they read, which events fire, how
 * the countdown behaves. It cannot own any of the things that make a banner a
 * banner, because all of them are layout:
 *
 *   · a banner is `position: fixed` — the docs' first line is "Fixed position
 *     notification banner" — so it must stay put while the page scrolls;
 *   · `open` is a TRANSFORM, not a display switch: a closed banner is fully
 *     translated off-screen, and a closed banner that still intercepts clicks
 *     would break every page it is on (`pointer-events` is part of the rule);
 *   · `position: 'top' | 'bottom'` decides which edge it flies in from;
 *   · the icon, the message, the action and the close button share one row and
 *     must not overlap, whatever the message length.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   Every claim above, per combo, reported all at once.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Each variant must be visibly distinct — a "success" banner that paints the
 *   same pixels as an "error" one is not a variant. The marquee captures decode
 *   the PNG inside the browser and compare the four variants' actual surfaces,
 *   and assert the message text really contrasts with the banner behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/banner/matrix.html';

type Variant = 'info' | 'success' | 'warning' | 'error';
type Position = 'top' | 'bottom';
type IconMode = 'default' | 'emoji' | 'image' | 'slot';

interface Combo {
  id: string;
  variant: Variant;
  position: Position;
  iconMode: IconMode;
  dismissible: boolean;
  actionText: string;
  message: string;
  open: boolean;
}

const LONG_MESSAGE = 'A deployment finished and this banner carries a message long '
  + 'enough to compete with the action button for the row it shares with it.';

/**
 * The cross: variant x position x icon-source x open = 4 * 2 * 4 * 2 = 64,
 * halved to 32 by pairing `dismissible` and `actionText` with it — the same
 * size as the DOM matrix, so a divergence between the tiers is a real
 * divergence rather than a difference in what was asked for.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of ['info', 'success', 'warning', 'error'] as Variant[]) {
    for (const position of ['top', 'bottom'] as Position[]) {
      for (const iconMode of ['default', 'emoji', 'image', 'slot'] as IconMode[]) {
        const open = n % 4 !== 3;
        combos.push({
          id: `${variant}/${position}/icon:${iconMode}`
            + `/[${open ? 'open' : 'closed'}${n % 2 ? ',action' : ''}`
            + `${n % 3 === 0 ? '' : ',dismissible'}${n % 5 === 0 ? ',long-message' : ''}]`,
          variant, position, iconMode, open,
          dismissible: n % 3 !== 0,
          actionText: n % 2 ? 'Update Now' : '',
          message: n % 5 === 0 ? LONG_MESSAGE : `${variant} message`,
        });
        n++;
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning every violation at once. */
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
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // ── "Fixed position notification banner" ────────────────────────────────
    if (hostCs.position !== 'fixed') {
      say(`the banner's position is "${hostCs.position}", documented as fixed`);
    }
    if (Math.abs(hostBox.width - viewportWidth) > EPS) {
      say(`the banner is ${hostBox.width.toFixed(1)}px wide in a`
        + ` ${viewportWidth}px viewport — it does not span the edge it is pinned to`);
    }

    const banner = partsNamed('banner')[0];
    if (!banner) { say('no part="banner"'); return problems; }
    const bannerBox = rect(banner);
    if (bannerBox.height <= 0) {
      say(`part="banner" renders ${bannerBox.height}px tall`);
      return problems;
    }

    // ── open: the documented show/hide, which is a TRANSFORM ────────────────
    if (combo.open) {
      // Fully on screen at the edge it belongs to.
      if (combo.position === 'top') {
        if (Math.abs(hostBox.top) > EPS) {
          say(`an open top banner sits at y=${hostBox.top.toFixed(1)}, expected 0`);
        }
      } else if (Math.abs(hostBox.bottom - viewportHeight) > EPS) {
        say(`an open bottom banner's bottom edge is ${hostBox.bottom.toFixed(1)},`
          + ` expected the viewport bottom ${viewportHeight}`);
      }
      if (hostCs.pointerEvents === 'none') {
        say('an open banner has pointer-events: none — its buttons cannot be clicked');
      }
    } else {
      // Fully off screen: a closed banner that is merely translated PART of the
      // way still paints over the page.
      const onScreen = hostBox.bottom > 1 && hostBox.top < viewportHeight - 1;
      if (onScreen) {
        say(`a closed banner still occupies ${hostBox.top.toFixed(1)}..`
          + `${hostBox.bottom.toFixed(1)} of a ${viewportHeight}px viewport`);
      }
      // A closed banner must not eat clicks meant for the page underneath.
      if (hostCs.pointerEvents !== 'none') {
        say(`a closed banner has pointer-events: "${hostCs.pointerEvents}" —`
          + ' it still intercepts the page\'s clicks');
      }
    }

    // ── The row: icon, message, action, close, in order, without overlap ────
    const iconWrapper = [...banner.children].find(child =>
      (child.getAttribute('part') ?? '').split(/\s+/).includes('icon')) as HTMLElement | undefined;
    const message = partsNamed('message')[0];
    const action = partsNamed('action')[0];
    const close = partsNamed('close')[0];

    const row: Array<[string, HTMLElement]> = [];
    if (iconWrapper) row.push(['icon', iconWrapper]);
    if (message) row.push(['message', message]);
    if (action) row.push(['action', action]);
    if (close) row.push(['close', close]);

    if (combo.open) {
      for (const [name, node] of row) {
        const b = rect(node);
        if (b.width <= 0 || b.height <= 0) {
          say(`${name} renders at ${b.width}x${b.height}`);
          continue;
        }
        if (b.top < bannerBox.top - EPS || b.bottom > bannerBox.bottom + EPS) {
          say(`${name} spills outside the banner vertically`);
        }
        if (b.right > bannerBox.right + EPS || b.left < bannerBox.left - EPS) {
          say(`${name} spills outside the banner horizontally`);
        }
      }
      for (let i = 1; i < row.length; i++) {
        const [prevName, prev] = row[i - 1];
        const [name, node] = row[i];
        const a = rect(prev);
        const b = rect(node);
        if (b.left < a.right - EPS) {
          say(`${name} (left ${b.left.toFixed(1)}) overlaps ${prevName}`
            + ` (right ${a.right.toFixed(1)})`);
        }
      }
    }

    // ── The icon slot really overrides the default variant icon ────────────
    if (iconWrapper) {
      const slot = iconWrapper.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
      const assigned = slot ? slot.assignedElements() : [];
      if (combo.iconMode === 'slot') {
        if (assigned.length !== 1) {
          say(`a [slot="icon"] child was authored but the slot assigns ${assigned.length}`);
        }
        // The per-variant default is the slot's FALLBACK, which a browser hides
        // once the slot is filled. Anything still occupying a box is a second
        // icon painted next to the author's.
        for (const node of [...(slot?.children ?? [])] as HTMLElement[]) {
          const b = rect(node);
          if (b.width > 0 || b.height > 0) {
            say(`the default variant icon still occupies ${b.width.toFixed(1)}x`
              + `${b.height.toFixed(1)} beside the slotted icon`);
          }
        }
      } else if (assigned.length !== 0) {
        say(`no [slot="icon"] child was authored, yet the slot assigns ${assigned.length}`);
      } else if (combo.open) {
        const glyph = iconWrapper.querySelector('img, svg, span');
        const b = glyph ? rect(glyph) : null;
        if (!glyph || !b || b.width <= 0 || b.height <= 0) {
          say(`icon mode "${combo.iconMode}" painted no glyph with a box`);
        }
      }
    }

    // ── Occlusion: an open banner really covers the page beneath it ────────
    const strip = document.getElementById(
      combo.position === 'top' ? 'under-top' : 'under-bottom') as HTMLElement;
    const probeY = combo.position === 'top' ? 4 : viewportHeight - 4;
    const hit = document.elementFromPoint(viewportWidth / 2, probeY);
    if (combo.open) {
      if (hit !== host) {
        say(`an open banner does not own the point it covers: hit`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    } else if (hit !== strip) {
      say(`a closed banner still blocks the page: the point under it hit`
        + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}#${(hit as HTMLElement)?.id ?? ''}>`
        + ` instead of the strip beneath`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('banner visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('banner visual matrix: fixed really means fixed', () => {
  for (const position of ['top', 'bottom'] as Position[]) {
    test(`${position}: the banner stays at its edge while the page scrolls`, async () => {
      await page.evaluate(p => (window as any).matrix.mount({
        variant: 'info', position: p, message: 'Scroll test', open: true,
      }), position);
      const before = await page.evaluate(() =>
        document.getElementById('subject')!.getBoundingClientRect().toJSON());
      const scrolled = await page.evaluate(() => (window as any).matrix.scrollTo(900));
      expect(scrolled, 'the fixture did not scroll, so the claim was never tested')
        .toBeGreaterThan(0);
      const after = await page.evaluate(() =>
        document.getElementById('subject')!.getBoundingClientRect().toJSON());
      await page.evaluate(() => (window as any).matrix.scrollTo(0));
      expect(Math.abs(after.top - before.top),
        `the banner moved from y=${before.top} to y=${after.top} when the page scrolled`)
        .toBeLessThan(1);
    });
  }
});

test.describe('banner visual matrix: opening and closing move it', () => {
  test('opening slides the banner into view and closing takes it back out', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'success', position: 'top', message: 'Saved', open: false,
    }));
    const geometry = () => page.evaluate(() => {
      const host = document.getElementById('subject')!;
      return {
        top: host.getBoundingClientRect().top,
        bottom: host.getBoundingClientRect().bottom,
        pointerEvents: getComputedStyle(host).pointerEvents,
      };
    });
    const closed = await geometry();
    expect(closed.bottom, 'a closed top banner is not off screen').toBeLessThanOrEqual(1);
    expect(closed.pointerEvents).toBe('none');

    expect(await page.evaluate(() => (window as any).matrix.setOpen(true))).toBe(true);
    const open = await geometry();
    expect(Math.abs(open.top), 'an open top banner is not at the top edge').toBeLessThan(1.5);
    expect(open.pointerEvents).not.toBe('none');

    expect(await page.evaluate(() => (window as any).matrix.setOpen(false))).toBe(true);
    const reclosed = await geometry();
    expect(reclosed.bottom, 'a reclosed banner did not leave the viewport')
      .toBeLessThanOrEqual(1);
  });
});

test.describe('banner visual matrix: the buttons work in a browser', () => {
  test('the close button closes an open banner and fires banner-close', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'warning', position: 'top', message: 'Careful', open: true,
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickPart('close'));
    expect(result.clicked).toBe(true);
    expect(result.events).toEqual(['banner-close']);
    expect(result.open).toBe(false);
  });

  test('the action button fires banner-action and leaves the banner open', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'info', position: 'top', message: 'Update available',
      actionText: 'Update Now', open: true,
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickPart('action'));
    expect(result.events).toEqual(['banner-action']);
    expect(result.open).toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('banner visual matrix: marquee pixels', () => {
  test('the four variants paint four different surfaces', async () => {
    // A variant that looks like another variant is not a variant. This is the
    // one claim the whole `variant` property exists to make, and no computed
    // style can make it: two rules can resolve to the same colour.
    const painted: Record<string, string> = {};
    for (const variant of ['info', 'success', 'warning', 'error'] as Variant[]) {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, position: 'top', message: `${v} message`, open: true,
      }), variant);
      const [surface] = await capture(
        page, '#subject', `banner-variant-${variant}`,
        `(host) => {
          const box = host.shadowRoot.querySelector('[part~="banner"]').getBoundingClientRect();
          return [{ x: box.x + box.width * 0.5, y: box.y + 3 }];
        }`,
      );
      painted[variant] = surface.join(',');
    }
    const distinct = new Set(Object.values(painted));
    expect(distinct.size,
      `variant surfaces: ${JSON.stringify(painted)}`).toBe(4);
  });

  test('the message contrasts with the banner it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'error', position: 'top', message: 'Something went wrong', open: true,
    }));
    // Sampled as a strip: the centre of a text box regularly lands between two
    // letters, and one probe there would measure the banner and call the
    // message invisible.
    const pixels = await capture(
      page, '#subject', 'banner-message',
      `(host) => {
        const sr = host.shadowRoot;
        const box = sr.querySelector('[part~="message"]').getBoundingClientRect();
        const banner = sr.querySelector('[part~="banner"]').getBoundingClientRect();
        const points = Array.from({ length: 24 }, (_, i) => ({
          x: box.x + box.width * ((i + 0.5) / 24),
          y: box.y + box.height / 2,
        }));
        points.push({ x: banner.x + banner.width - 4, y: banner.y + 3 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const best = Math.max(...pixels.slice(0, 24).map(p => contrast(p, surface)));
    expect(best, `message contrast against its banner is ${best.toFixed(2)}:1`)
      .toBeGreaterThan(3);
  });

  // VISUAL-MATRIX-banner-2 (fixed) — a CLOSED banner used to still darken the
  // page underneath it. `open` is documented as "Whether banner is visible",
  // and the closed state moves the banner off-screen with
  // `transform: translateY(-100%)`; but the strip that sat under it painted
  // rgb(8,116,100) with a closed banner mounted and exactly its own
  // rgb(9,121,105) with no banner on the page at all. The culprit was the
  // banner's downward `box-shadow`: a box translated fully above the viewport
  // still cast ~10px of shadow into it. The shadow is now gated on `[open]`,
  // and the assertion runs unpinned as a regression guard.
  test('VISUAL-MATRIX-banner-2 (fixed): a closed banner paints nothing over the page', async () => {
    // The page's fixed strip is a known solid colour. If a "closed" banner is
    // only translated part of the way — or merely faded — the strip's pixels
    // change, and no geometry assertion would necessarily notice a 1px sliver.
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'error', position: 'top', message: 'Should be hidden', open: false,
    }));
    const [strip] = await capture(
      page, '#under-top', 'banner-closed-strip',
      `(under) => {
        const box = under.getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + 2 }];
      }`,
    );
    expect(sameColor(strip, [9, 121, 105]),
      `the strip under a closed banner painted ${strip.join(',')},`
      + ' expected its own colour 9,121,105').toBe(true);
  });
});
