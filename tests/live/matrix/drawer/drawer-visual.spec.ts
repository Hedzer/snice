/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-drawer TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/drawer, `npm run test:matrix`) owns structure
 * truth: the parts per switch vector, the three slots, role/aria reflection,
 * attribute reflection of position/size, the two events, and every dismissal
 * route via synthetic clicks. Its own header explains why that is not enough:
 * position and size "have no rendered text and no class of their own … the
 * stylesheet does the rest" — and happy-dom does no layout, so the stylesheet
 * doing the rest is invisible to it.
 *
 * This tier owns the REST:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · an OPEN overlay drawer is a viewport-sized fixed surface whose backdrop
 *     covers everything ("--drawer-backdrop … rgb(0 0 0 / 0.6)"), whose panel
 *     is flush to its documented side and exactly the documented size
 *     (`--drawer-width-small`…`xxxl`, `--drawer-height-*`, `full`), and which
 *     the page underneath cannot be clicked through;
 *   · a CLOSED overlay drawer paints nothing and blocks nothing — the panel is
 *     fully off-canvas on its own side and the beacon underneath is reachable;
 *   · the panel stacks above its own backdrop, and the header/body/footer
 *     stack inside the panel without overlapping, with the close button a
 *     reachable 2rem box;
 *   · `inline` really sits in document flow: static host, static panel, no
 *     transform, no backdrop, real content beside it;
 *   · `no-backdrop` paints no backdrop; an empty footer slot paints no footer.
 *
 * ── Real-page clauses: show/hide/toggle, Escape and backdrop and close-button
 *   dismissal by REAL keys and pointers, the body scroll lock against a REAL
 *   wheel gesture, and push-content sliding a real snice-drawer-target.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The backdrop and the panel are paints; "covers" and "flush" are geometry
 *   words, and only the decoded PNG proves the dimming and the panel's own
 *   surface.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/drawer/matrix.html';

type Position = 'left' | 'right' | 'top' | 'bottom';
type Size = 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'xxxl' | 'full';

const POSITIONS: Position[] = ['left', 'right', 'top', 'bottom'];
const SIZES: Size[] = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl', 'full'];

/**
 * The documented size tokens, in rem, straight off the property table:
 * "…through `--drawer-width-xxxl` - Width per size" and
 * "…through `--drawer-height-xxxl` - Height per size (top/bottom)". `xl`+
 * heights are the vh percentages the stylesheet defines; `full` is the whole
 * host, which for an overlay drawer is the viewport.
 */
const WIDTH_REM: Record<Size, number> = {
  small: 15, medium: 20, large: 30, xl: 40, xxl: 50, xxxl: 60, full: 0,
};
const HEIGHT_REM: Record<Size, number> = {
  small: 12.5, medium: 25, large: 37.5, xl: 0, xxl: 0, xxxl: 0, full: 0,
};
const HEIGHT_VH: Partial<Record<Size, number>> = { xl: 0.7, xxl: 0.8, xxxl: 0.9 };

interface Combo {
  id: string;
  mode: 'overlay' | 'inline';
  position: Position;
  size: Size;
  open: boolean;
  noHeader?: boolean;
  noFooter?: boolean;
  noBackdrop?: boolean;
  persistent?: boolean;
  emptyFooter?: boolean;
}

/**
 * Three crosses, sized to the component:
 *   OPEN  — position (4) x size (7) = 28. The full documented size table on
 *     every side it can be on; this is the geometry the DOM tier cannot see.
 *   SWITCH — the paint switches on one fixed drawer (left/medium/open):
 *     no-backdrop, no-header, no-footer, persistent, empty footer slot.
 *   CLOSED — one per position (4): nothing paints, nothing blocks.
 *   INLINE — one per position (4): the in-flow pattern.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const position of POSITIONS) {
    for (const size of SIZES) {
      combos.push({
        id: `open/${position}/${size}`, mode: 'overlay',
        position, size, open: true,
      });
    }
  }
  const switches: Array<Partial<Combo>> = [
    { noBackdrop: true }, { noHeader: true }, { noFooter: true },
    { persistent: true }, { emptyFooter: true },
  ];
  for (const sw of switches) {
    combos.push({
      id: `switch/left-medium-open/${Object.keys(sw)[0]}`,
      mode: 'overlay', position: 'left', size: 'medium', open: true, ...sw,
    } as Combo);
  }
  for (const position of POSITIONS) {
    combos.push({
      id: `closed/${position}/medium`, mode: 'overlay',
      position, size: 'medium', open: false,
    });
  }
  for (const position of POSITIONS) {
    combos.push({
      id: `inline/${position}/medium`, mode: 'inline',
      position, size: 'medium', open: false,
    });
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
  return page.evaluate((data) => {
    const combo = data.combo;
    const problems: string[] = [];
    const say = (message: string) => problems.push(message);
    const EPS = 1.5;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const WIDTH_REM = data.WIDTH_REM;
    const HEIGHT_REM = data.HEIGHT_REM;
    const HEIGHT_VH = data.HEIGHT_VH;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const backdrop = partNamed('backdrop');
    const panel = partNamed('base');
    if (!backdrop) { say('no [part="backdrop"]'); return problems; }
    if (!panel) { say('no [part="base"]'); return problems; }

    const beacon = document.getElementById('beacon')!;
    const beaconBox = rect(beacon);
    const beaconPoint = { x: beaconBox.x + 10, y: beaconBox.y + 10 };

    const widthOf = () => combo.size === 'full' ? vw : WIDTH_REM[combo.size] * rem;
    const heightOf = () => {
      if (combo.size === 'full') return vh;
      if (HEIGHT_VH[combo.size] !== undefined) return HEIGHT_VH[combo.size]! * vh;
      return HEIGHT_REM[combo.size] * rem;
    };

    // ── INLINE: in flow, no overlay machinery ──────────────────────────────
    if (combo.mode === 'inline') {
      if (getComputedStyle(host).position !== 'static') {
        say(`an inline host is positioned "${getComputedStyle(host).position}", documented "in document flow"`);
      }
      if (getComputedStyle(backdrop).display !== 'none') {
        say('an inline drawer paints a backdrop');
      }
      const panelCs = getComputedStyle(panel);
      if (panelCs.position !== 'static') say(`an inline panel is positioned "${panelCs.position}"`);
      if (panelCs.transform !== 'none') say(`an inline panel carries "${panelCs.transform}"`);
      const stageBox = rect(document.getElementById('inline-stage')!);
      const panelBox = rect(panel);
      const side = combo.position === 'left' || combo.position === 'right';
      if (side) {
        // Left/right inline drawers take their width token and stretch to the
        // row's height; top/bottom inline drawers take their height token and
        // span the row's width — the stylesheet's own inline size table.
        if (Math.abs(panelBox.width - WIDTH_REM[combo.size] * rem) > EPS) {
          say(`an inline ${combo.position} ${combo.size} panel is ${panelBox.width.toFixed(1)}px wide,`
            + ` expected the documented ${WIDTH_REM[combo.size]}rem (${WIDTH_REM[combo.size] * rem}px)`);
        }
        if (Math.abs(panelBox.height - stageBox.height) > EPS) {
          say(`an inline panel is ${panelBox.height.toFixed(1)}px tall in a`
            + ` ${stageBox.height.toFixed(1)}px flex row — it does not stretch with its row`);
        }
      } else {
        if (Math.abs(panelBox.height - HEIGHT_REM[combo.size] * rem) > EPS) {
          say(`an inline ${combo.position} ${combo.size} panel is ${panelBox.height.toFixed(1)}px tall,`
            + ` expected the documented ${HEIGHT_REM[combo.size]}rem (${HEIGHT_REM[combo.size] * rem}px)`);
        }
        if (Math.abs(panelBox.width - stageBox.width) > EPS) {
          say(`an inline ${combo.position} panel is ${panelBox.width.toFixed(1)}px wide in a`
            + ` ${stageBox.width.toFixed(1)}px row — it does not span the row`);
        }
      }
      const main = document.getElementById('inline-main');
      if (main) {
        const mainBox = rect(main);
        if (side && mainBox.left < panelBox.right - EPS) {
          say('the content beside an inline drawer is not beside it');
        }
        if (!side && mainBox.top < panelBox.bottom - EPS) {
          say('the content under an inline top/bottom drawer is not under it');
        }
      }
      const nav = host.querySelector('nav');
      if (nav && rect(nav).width <= 0) say('the slotted body of an inline drawer has no box');
      return problems;
    }

    // ── OVERLAY host: a viewport-sized fixed layer ─────────────────────────
    const hostCs = getComputedStyle(host);
    if (hostCs.position !== 'fixed') say(`an overlay host is positioned "${hostCs.position}", documented fixed`);
    const hostBox = rect(host);
    if (hostBox.width < vw - EPS || hostBox.height < vh - EPS) {
      say(`the overlay host is ${hostBox.width.toFixed(0)}x${hostBox.height.toFixed(0)}`
        + ` in a ${vw}x${vh} viewport — it cannot overlay the whole page`);
    }
    const hostZ = parseInt(hostCs.zIndex, 10);
    if (!Number.isFinite(hostZ) || hostZ < 100) say(`the overlay host sits at z-index "${hostCs.zIndex}"`);

    // ── CLOSED: nothing paints, nothing blocks ─────────────────────────────
    if (!combo.open) {
      if (hostCs.pointerEvents !== 'none') {
        say(`a closed drawer's host still catches pointers ("${hostCs.pointerEvents}")`);
      }
      if (getComputedStyle(backdrop).visibility !== 'hidden') {
        say('a closed drawer still paints its backdrop');
      }
      const panelBox = rect(panel);
      if (combo.position === 'left' && panelBox.right > 1) {
        say(`a closed left drawer's panel still reaches ${panelBox.right.toFixed(0)}px into the viewport`);
      }
      if (combo.position === 'right' && panelBox.left < vw - 1) {
        say(`a closed right drawer's panel still starts at ${panelBox.left.toFixed(0)}px`);
      }
      if (combo.position === 'top' && panelBox.bottom > 1) {
        say(`a closed top drawer's panel still reaches ${panelBox.bottom.toFixed(0)}px into the viewport`);
      }
      if (combo.position === 'bottom' && panelBox.top < vh - 1) {
        say(`a closed bottom drawer's panel still starts at ${panelBox.top.toFixed(0)}px`);
      }
      const hit = document.elementFromPoint(beaconPoint.x, beaconPoint.y);
      if (hit !== beacon) {
        say(`a closed drawer intercepts the page's own clicks (hit <${hit?.tagName.toLowerCase() ?? 'nothing'}>)`);
      }
      return problems;
    }

    // ── OPEN: an overlay that covers and blocks ────────────────────────────
    if (hostCs.pointerEvents !== 'auto') {
      say(`an open drawer's host does not catch pointers ("${hostCs.pointerEvents}")`);
    }
    if (combo.noBackdrop) {
      if (getComputedStyle(backdrop).display !== 'none') {
        say('no-backdrop still paints a backdrop');
      }
    } else {
      const backdropCs = getComputedStyle(backdrop);
      if (backdropCs.visibility !== 'visible') say('an open drawer hides its backdrop');
      if (parseFloat(backdropCs.opacity) < 0.99) say(`the open backdrop's opacity is "${backdropCs.opacity}"`);
      // "--drawer-backdrop - Backdrop color (default: rgb(0 0 0 / 0.6))".
      if (backdropCs.backgroundColor !== 'rgba(0, 0, 0, 0.6)') {
        say(`the backdrop paints "${backdropCs.backgroundColor}", documented rgb(0 0 0 / 0.6)`);
      }
      const backdropBox = rect(backdrop);
      if (backdropBox.width < vw - EPS || backdropBox.height < vh - EPS) {
        say(`the backdrop is ${backdropBox.width.toFixed(0)}x${backdropBox.height.toFixed(0)},`
          + ` it must cover the whole ${vw}x${vh} viewport`);
      }
    }

    // The page underneath is unreachable — the defining fact of an overlay.
    const overBeacon = document.elementFromPoint(beaconPoint.x, beaconPoint.y);
    if (overBeacon === beacon) {
      say('the page behind the open drawer is still clickable through it');
    } else if (overBeacon !== host && !host.contains(overBeacon)) {
      say(`the beacon is covered by <${overBeacon?.tagName.toLowerCase() ?? 'nothing'}>, not the drawer`);
    }

    // ── The panel: the documented size, flush to its documented side ──────
    const panelBox = rect(panel);
    if (panelBox.width <= 0 || panelBox.height <= 0) {
      say(`the open panel renders at ${panelBox.width}x${panelBox.height}`);
      return problems;
    }
    if (panelBox.left < -EPS || panelBox.top < -EPS
      || panelBox.right > vw + EPS || panelBox.bottom > vh + EPS) {
      say(`the open panel escapes the viewport`
        + ` (${panelBox.left.toFixed(0)},${panelBox.top.toFixed(0)}`
        + ` → ${panelBox.right.toFixed(0)},${panelBox.bottom.toFixed(0)})`);
    }
    const expectedMain = combo.position === 'left' || combo.position === 'right'
      ? widthOf() : heightOf();
    if (combo.position === 'left' || combo.position === 'right') {
      if (Math.abs(panelBox.width - expectedMain) > EPS) {
        say(`a ${combo.position} ${combo.size} panel is ${panelBox.width.toFixed(1)}px wide,`
          + ` expected the documented ${expectedMain.toFixed(1)}px`);
      }
      if (Math.abs(panelBox.height - vh) > EPS) {
        say(`a ${combo.position} panel is ${panelBox.height.toFixed(1)}px tall, expected the full viewport`);
      }
      if (combo.position === 'left' && Math.abs(panelBox.left) > EPS) {
        say(`a left panel starts at ${panelBox.left.toFixed(1)}px, not flush to the left edge`);
      }
      if (combo.position === 'right' && Math.abs(panelBox.right - vw) > EPS) {
        say(`a right panel ends at ${panelBox.right.toFixed(1)}px, not flush to the right edge`);
      }
    } else {
      if (Math.abs(panelBox.height - expectedMain) > EPS) {
        say(`a ${combo.position} ${combo.size} panel is ${panelBox.height.toFixed(1)}px tall,`
          + ` expected the documented ${expectedMain.toFixed(1)}px`);
      }
      if (Math.abs(panelBox.width - vw) > EPS) {
        say(`a ${combo.position} panel is ${panelBox.width.toFixed(1)}px wide, expected the full viewport`);
      }
      if (combo.position === 'top' && Math.abs(panelBox.top) > EPS) {
        say(`a top panel starts at ${panelBox.top.toFixed(1)}px, not flush to the top edge`);
      }
      if (combo.position === 'bottom' && Math.abs(panelBox.bottom - vh) > EPS) {
        say(`a bottom panel ends at ${panelBox.bottom.toFixed(1)}px, not flush to the bottom edge`);
      }
    }

    // The panel must beat its own backdrop, both in z and in hit-testing.
    const backdropZ = parseInt(getComputedStyle(backdrop).zIndex, 10);
    const panelZ = parseInt(getComputedStyle(panel).zIndex, 10);
    if (Number.isFinite(backdropZ) && Number.isFinite(panelZ) && panelZ <= backdropZ) {
      say(`the panel (z ${panelZ}) does not stack above its backdrop (z ${backdropZ})`);
    }
    const centreHit = (sr as any).elementFromPoint(
      panelBox.x + panelBox.width / 2, panelBox.y + Math.min(panelBox.height / 2, 300)) as Element | null;
    // Slotted light-DOM content (the body's <nav>) belongs to the panel
    // through its slot; panel.contains() cannot see across that shadow
    // boundary, so the host's own light DOM counts as the panel here.
    const inPanel = centreHit !== null
      && (panel.contains(centreHit) || host.contains(centreHit));
    if (centreHit === backdrop) say('the backdrop is painted over its own panel');
    else if (centreHit !== panel && !inPanel) {
      say(`the panel's centre hit-tests as <${centreHit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    // ── The sections stack inside the panel ────────────────────────────────
    const header = partNamed('header');
    const body = partNamed('body');
    const footer = partNamed('footer');
    if (combo.noHeader && header) say('no-header still paints a header');
    if (!body) { say('no [part="body"]'); return problems; }

    const stack: Array<[string, HTMLElement]> = [];
    if (header) stack.push(['header', header]);
    stack.push(['body', body]);
    if (footer && getComputedStyle(footer).display !== 'none') stack.push(['footer', footer]);
    let previousBottom = -Infinity;
    for (const [name, node] of stack) {
      const box = rect(node);
      if (box.height <= 0) { say(`[part="${name}"] renders at ${box.width}x${box.height}`); continue; }
      if (box.top < previousBottom - EPS) say(`[part="${name}"] overlaps the section above it`);
      previousBottom = box.bottom;
      if (box.left < panelBox.left - EPS || box.right > panelBox.right + EPS) {
        say(`[part="${name}"] escapes the panel horizontally`);
      }
    }
    if (combo.emptyFooter) {
      // No footer slot authored: the part stays (DOM tier's claim) but the
      // component's own empty-footer rule must keep it from painting.
      if (footer && getComputedStyle(footer).display !== 'none') {
        say('a footer with nothing slotted still paints');
      }
    }

    // ── The close button: a reachable 2rem control ─────────────────────────
    const close = partNamed('close');
    if (combo.persistent) {
      if (close) say('a persistent drawer still paints its close button');
    } else if (!combo.noHeader) {
      if (!close) say('a dismissible drawer with a header paints no close button');
      else {
        const box = rect(close);
        if (Math.abs(box.width - 2 * rem) > EPS || Math.abs(box.height - 2 * rem) > EPS) {
          say(`the close button renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)},`
              + ` documented --snice-drawer-control-size 2rem (${2 * rem}px)`);
        }
        const hit = (sr as any).elementFromPoint(
          box.x + box.width / 2, box.y + box.height / 2) as Element | null;
        if (hit !== close && !close.contains(hit)) {
          say(`the close button is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    // ── The slotted body is really on screen ───────────────────────────────
    const nav = host.querySelector('nav');
    if (!nav) say('no body content slotted');
    else {
      const box = rect(nav);
      if (box.width <= 0 || box.height <= 0) say('the slotted body has no box');
      if (box.top < body.getBoundingClientRect().top - EPS
        || box.bottom > body.getBoundingClientRect().bottom + EPS) {
        say('the slotted body escapes the body section');
      }
    }

    return problems;
  }, {
    combo, WIDTH_REM, HEIGHT_REM, HEIGHT_VH,
  } as any);
}

const combos = generateCombos();

test.describe('drawer visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.position).toBe(combo.position);
      expect(mounted.size).toBe(combo.size);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The clauses that need real keys, pointers, and a scrollable page ────────

test.describe('drawer visual matrix: real interaction', () => {
  test.beforeEach(async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'left', size: 'small', open: false,
    }));
  });

  test('show() slides the panel in and hide() takes it out, with events', async () => {
    await page.evaluate(() => (window as any).matrix.startEvents());
    await page.evaluate(() => (window as any).matrix.show());

    const open = await page.evaluate(() => {
      const panel = (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="base"]') as HTMLElement;
      const box = panel.getBoundingClientRect();
      return { left: box.left, width: box.width, open: (document.getElementById('subject') as any).open };
    });
    expect(open.open).toBe(true);
    expect(open.left, `the panel rests at left ${open.left}`).toBeCloseTo(0, 0);
    expect(open.width).toBeCloseTo(240, 0);

    await page.evaluate(() => (window as any).matrix.hide());
    const closed = await page.evaluate(() => {
      const panel = (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="base"]') as HTMLElement;
      return { right: panel.getBoundingClientRect().right, open: (document.getElementById('subject') as any).open };
    });
    expect(closed.open).toBe(false);
    expect(closed.right, `the closed panel reaches ${closed.right}px into the viewport`)
      .toBeLessThanOrEqual(1);

    const events = await page.evaluate(() => (window as any).matrix.stopEvents());
    expect(events, `lifecycle fired ${JSON.stringify(events)}`).toEqual(['drawer-open', 'drawer-close']);
  });

  test('a real Escape press closes an open drawer', async () => {
    await page.evaluate(() => (window as any).matrix.show());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    const open = await page.evaluate(() => (document.getElementById('subject') as any).open);
    expect(open, 'Escape did not close the drawer').toBe(false);
  });

  test('a real click on the backdrop dismisses; no-backdrop-dismiss does not', async () => {
    await page.evaluate(() => (window as any).matrix.show());
    // 900,300 is over the backdrop, far outside a 240px left panel.
    await page.mouse.click(900, 300);
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => (document.getElementById('subject') as any).open),
      'clicking the backdrop did not dismiss the drawer').toBe(false);

    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'left', size: 'small', open: true, noBackdropDismiss: true,
    }));
    await page.mouse.click(900, 300);
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => (document.getElementById('subject') as any).open),
      'no-backdrop-dismiss was dismissed by the backdrop anyway').toBe(true);
  });

  test('a real click on the painted close button closes the drawer', async () => {
    await page.evaluate(() => (window as any).matrix.show());
    const target = await page.evaluate(() => {
      const close = (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="close"]') as HTMLElement;
      const box = close.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => (document.getElementById('subject') as any).open),
      'the close button did not close the drawer').toBe(false);
  });

  test('an open overlay drawer really locks the page against a real wheel', async () => {
    /**
     * A REAL wheel gesture over the page, then what the page did about it —
     * the same instrument the modal tier uses, because a scripted scroll
     * moves a correctly locked page too.
     */
    const wheelBy = async (delta: number): Promise<number> => {
      await page.mouse.move(1200, 800);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(150);
      return page.evaluate(() => (window as any).matrix.scrollY());
    };

    await page.evaluate(() => (window as any).matrix.resetScroll());
    const free = await wheelBy(400);
    expect(free, 'the fixture page cannot scroll at all — the probe proves nothing')
      .toBeGreaterThan(0);

    await page.evaluate(() => (window as any).matrix.resetScroll());
    await page.evaluate(() => (window as any).matrix.show());
    const locked = await wheelBy(400);
    expect(locked, `the page scrolled to ${locked} with a drawer open`).toBe(0);

    await page.evaluate(() => (window as any).matrix.hide());
    const released = await wheelBy(400);
    expect(released, 'the page never scrolled again after the drawer closed')
      .toBeGreaterThan(0);
    await page.evaluate(() => (window as any).matrix.resetScroll());
  });
});

test.describe('drawer visual matrix: push-content slides a real target', () => {
  test('the target translates by the open panel width and back', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'push', position: 'left', size: 'small', open: true,
    }));

    const open = await page.evaluate(() => {
      const target = document.querySelector('snice-drawer-target') as HTMLElement;
      const panel = (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="base"]') as HTMLElement;
      const transform = getComputedStyle(target).transform;
      const tx = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
      return { tx, panelWidth: panel.getBoundingClientRect().width };
    });
    // "Target properties: … push: string (auto-set amount)" — auto-set from
    // the measured panel, which for a contained left/small drawer is 240px.
    expect(open.tx, `the target translated ${open.tx}px for a ${open.panelWidth}px panel`)
      .toBeCloseTo(open.panelWidth, 0);
    expect(open.panelWidth).toBeCloseTo(240, 0);

    await page.evaluate(() => (window as any).matrix.hide());
    const closed = await page.evaluate(() =>
      getComputedStyle(document.querySelector('snice-drawer-target') as HTMLElement).transform);
    expect(closed, `the target still carries "${closed}" after close`).toBe('none');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// "Covers", "dims", "flush" are paint words. The captures decode the PNG in
// the browser under test and compare the beacon with and without the overlay,
// the panel against its own backdrop, and the two sides against each other.

test.describe('drawer visual matrix: marquee pixels', () => {
  const beaconProbe = `() => {
    const beacon = document.getElementById('beacon').getBoundingClientRect();
    return [{ x: beacon.x + beacon.width / 2, y: beacon.y + beacon.height / 2 }];
  }`;

  test('the backdrop really dims the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'left', size: 'small', open: false,
    }));
    const [bare] = await capture(page, 'body', 'drawer-beacon-bare', beaconProbe);

    await page.evaluate(() => (window as any).matrix.show());
    const [dimmed] = await capture(page, 'body', 'drawer-beacon-dimmed', beaconProbe);

    // The beacon is solid magenta. With the drawer open, the backdrop has to
    // change what a camera sees there — otherwise it is not a backdrop.
    expect(sameColor(bare as RGB, dimmed as RGB),
      `the beacon painted rgb(${bare.join(',')}) with and without the drawer open`)
      .toBe(false);
  });

  test('the open panel paints its own surface over the backdrop', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'left', size: 'medium', open: true,
    }));
    const [panelFill, backdropFill] = await capture(
      page, 'body', 'drawer-panel',
      `() => {
        const panel = document.getElementById('subject').shadowRoot
          .querySelector('[part~="base"]').getBoundingClientRect();
        const beacon = document.getElementById('beacon').getBoundingClientRect();
        return [
          { x: panel.right - 8, y: panel.bottom - 40 },
          { x: beacon.x + beacon.width / 2, y: beacon.y + beacon.height / 2 },
        ];
      }`,
    );
    expect(sameColor(panelFill as RGB, backdropFill as RGB),
      `the panel painted rgb(${panelFill.join(',')}), exactly the dimmed page it covers`)
      .toBe(false);
  });

  test('a left drawer and a right drawer put their panel on opposite sides', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'left', size: 'small', open: true,
    }));
    const [leftPixel] = await capture(
      page, 'body', 'drawer-side-left',
      `() => [{ x: 10, y: window.innerHeight / 2 }]`,
    );

    await page.evaluate(() => (window as any).matrix.mount({
      mode: 'overlay', position: 'right', size: 'small', open: true,
    }));
    const [rightPixel] = await capture(
      page, 'body', 'drawer-side-right',
      `() => [{ x: 10, y: window.innerHeight / 2 }]`,
    );
    // x=10 is inside a left drawer's panel and on a right drawer's backdrop.
    expect(sameColor(leftPixel as RGB, rightPixel as RGB),
      `both sides painted ${leftPixel.join(',')} at x=10`).toBe(false);
  });
});
