/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-modal TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/modal, `npm run test:matrix`) owns structure
 * truth: which regions exist per switch vector, the two events, the dismissal
 * routes, the ARIA surface. Five of this component's documented claims are
 * invisible to happy-dom, which performs no layout and paints nothing:
 *
 *   · "Dialog OVERLAY" — the panel has to be ON TOP of the page, and the
 *     backdrop has to cover what is behind it. Both are stacking facts;
 *   · four SIZES whose entire difference is how wide the panel is, up to
 *     `fullscreen`, which has to be exactly that;
 *   · "Body scroll locked while open" — a real lock is a page that refuses to
 *     scroll, not a style property;
 *   · "first focusable element focused on open; previous focus restored on
 *     close" — a real focus ring on a real element;
 *   · a closed modal must paint NOTHING: a dialog that merely sets
 *     `aria-hidden` still eats the clicks of the page underneath it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots + the real page ───────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/modal/matrix.html';

type Size = 'small' | 'medium' | 'large' | 'fullscreen';
const SIZES: Size[] = ['small', 'medium', 'large', 'fullscreen'];

interface Combo {
  id: string;
  size: Size;
  open: boolean;
  noHeader: boolean;
  noFooter: boolean;
  noCloseButton: boolean;
}

/**
 * 4 sizes x open/closed x the three chrome switches — 32 combos. Sized to a
 * component whose visual contract is "a panel of the right width, centred over
 * a backdrop that covers everything, or nothing at all".
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const open of [true, false]) {
      for (const chrome of [0, 1, 2, 4]) {
        const noHeader = chrome === 1;
        const noFooter = chrome === 2;
        const noCloseButton = chrome === 4;
        const label = ['no-header', 'no-footer', 'no-close-button'][[1, 2, 4].indexOf(chrome)]
          ?? 'full-chrome';
        combos.push({
          id: `${size}/${open ? 'open' : 'closed'}/${label}`,
          size, open, noHeader, noFooter, noCloseButton,
        });
      }
    }
  }
  return combos;
}

const mountArgs = (combo: Combo) => ({
  size: combo.size,
  open: combo.open,
  noHeader: combo.noHeader,
  noFooter: combo.noFooter,
  noCloseButton: combo.noCloseButton,
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
    const partOf = (name: string) =>
      ([...sr.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;
    const painted = (node: Element | null) => {
      if (!node) return false;
      const cs = getComputedStyle(node as HTMLElement);
      if (cs.display === 'none' || cs.visibility !== 'visible' || Number(cs.opacity) <= 0.01) return false;
      const box = rect(node);
      return box.width > 0 && box.height > 0;
    };

    const backdrop = partOf('backdrop');
    const panel = partOf('panel');
    if (!backdrop) { say('no [part="backdrop"]'); return problems; }
    if (!panel) { say('no [part="panel"]'); return problems; }

    const beacon = document.getElementById('beacon')!.getBoundingClientRect();

    // ── A CLOSED modal paints nothing and blocks nothing ────────────────────
    if (!combo.open) {
      if (painted(backdrop)) say('a closed modal still paints its backdrop');
      if (painted(panel)) say('a closed modal still paints its panel');
      // The decisive check: the page underneath is still reachable.
      const hit = document.elementFromPoint(beacon.x + 10, beacon.y + 10);
      if (hit !== document.getElementById('beacon')) {
        say(`a closed modal intercepts the page's own clicks`
          + ` (hit <${hit?.tagName.toLowerCase() ?? 'nothing'}>)`);
      }
      return problems;
    }

    // ── An OPEN modal is an overlay ─────────────────────────────────────────
    if (!painted(backdrop)) say('an open modal paints no backdrop');
    if (!painted(panel)) { say('an open modal paints no panel'); return problems; }

    const backdropBox = rect(backdrop);
    const panelBox = rect(panel);
    const view = { width: window.innerWidth, height: window.innerHeight };

    // The backdrop covers the whole viewport — that is what makes it a modal.
    if (backdropBox.width < view.width - EPS || backdropBox.height < view.height - EPS) {
      say(`the backdrop is ${backdropBox.width.toFixed(0)}x${backdropBox.height.toFixed(0)}`
        + ` in a ${view.width}x${view.height} viewport`);
    }
    if (getComputedStyle(backdrop).position === 'static') {
      say('the backdrop is in the content flow — it cannot overlay anything');
    }

    // …and it really covers the page: the beacon underneath is unreachable.
    const overBeacon = document.elementFromPoint(beacon.x + 10, beacon.y + 10);
    if (overBeacon === document.getElementById('beacon')) {
      say('the page behind the modal is still clickable through the backdrop');
    }

    // The panel is inside the viewport, and on top of the backdrop.
    if (panelBox.width <= 0 || panelBox.height <= 0) {
      say(`the panel renders at ${panelBox.width}x${panelBox.height}`);
    }
    if (panelBox.left < -EPS || panelBox.top < -EPS
      || panelBox.right > view.width + EPS || panelBox.bottom > view.height + EPS) {
      say(`the panel escapes the viewport`
        + ` (${panelBox.left.toFixed(0)},${panelBox.top.toFixed(0)}`
        + ` → ${panelBox.right.toFixed(0)},${panelBox.bottom.toFixed(0)})`);
    }
    // A hit-test at the panel's centre must find the modal, not the backdrop.
    const centre = (sr as any).elementFromPoint(
      panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2) as Element | null;
    if (centre === backdrop) say('the backdrop is painted over its own panel');

    // `fullscreen` has to actually read as the full screen. The dialog box is
    // the viewport inset by its own padding — a rounded card flush against the
    // glass would look broken — so the precise claim is that a fullscreen panel
    // fills the dialog's CONTENT BOX exactly, and that no other size does.
    const dialog = sr.querySelector('[role="dialog"]') as HTMLElement | null;
    if (!dialog) say('no role="dialog" element');
    else {
      const dialogBox = rect(dialog);
      const pad = getComputedStyle(dialog);
      const available = {
        width: dialogBox.width - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight),
        height: dialogBox.height - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom),
      };
      if (combo.size === 'fullscreen') {
        if (Math.abs(panelBox.width - available.width) > EPS
          || Math.abs(panelBox.height - available.height) > EPS) {
          say(`a fullscreen panel is ${panelBox.width.toFixed(0)}x${panelBox.height.toFixed(0)}`
            + ` in a ${available.width.toFixed(0)}x${available.height.toFixed(0)} dialog box`);
        }
      } else if (panelBox.width >= available.width - EPS) {
        say(`size="${combo.size}" fills the dialog box as completely as fullscreen does`);
      }
    }

    // ── The sections stack inside the panel ─────────────────────────────────
    const header = partOf('header');
    const body = partOf('body');
    const footer = partOf('footer');
    if (combo.noHeader && header) say('no-header still paints a header');
    if (combo.noFooter && footer) say('no-footer still paints a footer');
    if (!body) { say('no [part="body"]'); return problems; }

    const stack: Array<[string, HTMLElement]> = [];
    if (header) stack.push(['header', header]);
    stack.push(['body', body]);
    if (footer) stack.push(['footer', footer]);
    let previousBottom = -Infinity;
    for (const [name, node] of stack) {
      const box = rect(node);
      if (box.height <= 0) say(`[part="${name}"] renders at ${box.width}x${box.height}`);
      if (box.top < previousBottom - EPS) {
        say(`[part="${name}"] overlaps the section above it`);
      }
      previousBottom = box.bottom;
      if (box.left < panelBox.left - EPS || box.right > panelBox.right + EPS) {
        say(`[part="${name}"] escapes the panel horizontally`);
      }
    }

    // ── The close button is reachable ───────────────────────────────────────
    const close = partOf('close');
    const wantClose = !combo.noCloseButton && !combo.noHeader;
    if (!!close !== wantClose) {
      say(`[part="close"] is ${close ? 'present' : 'absent'} for`
        + ` no-close-button=${combo.noCloseButton}, no-header=${combo.noHeader}`);
    }
    if (close) {
      const box = rect(close);
      if (box.width < 16 || box.height < 16) {
        say(`the close button renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
      } else {
        const hit = (sr as any).elementFromPoint(
          box.x + box.width / 2, box.y + box.height / 2) as Element | null;
        if (hit !== close && !close.contains(hit as Node)) {
          say(`the close button is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    // ── The slotted body is really on screen ────────────────────────────────
    const text = document.getElementById('body-text');
    if (!text) say('the body text was not slotted');
    else {
      const box = text.getBoundingClientRect();
      if (box.height <= 0) say('the body text has no box');
      if (box.top < panelBox.top - EPS || box.bottom > panelBox.bottom + EPS) {
        say('the body text escapes the panel');
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('modal visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The claims that need the real page ──────────────────────────────────────

test.describe('modal visual matrix: the body scroll lock', () => {
  test('an open modal really stops the page scrolling, and closing gives it back', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { size: 'medium' } as any);

    /**
     * A REAL wheel gesture over the page, then what the page did about it.
     * `window.scrollTo` would be the wrong instrument: a box with
     * `overflow: hidden` remains programmatically scrollable by design, so a
     * scripted scroll moves a correctly locked page too.
     */
    const wheelBy = async (delta: number): Promise<number> => {
      await page.mouse.move(1200, 800);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(120);
      return page.evaluate(() => (window as any).matrix.scrollY());
    };

    await page.evaluate(() => (window as any).matrix.resetScroll());
    const free = await wheelBy(400);
    expect(free, 'the fixture page cannot scroll at all — the probe proves nothing')
      .toBeGreaterThan(0);

    await page.evaluate(() => (window as any).matrix.resetScroll());
    await page.evaluate(() => (window as any).matrix.show());
    const locked = await wheelBy(400);
    expect(locked, `the page scrolled to ${locked} with a modal open`).toBe(0);

    await page.evaluate(() => (window as any).matrix.close());
    const released = await wheelBy(400);
    expect(released, 'the page never scrolled again after the modal closed')
      .toBeGreaterThan(0);
    await page.evaluate(() => (window as any).matrix.resetScroll());
  });
});

test.describe('modal visual matrix: the focus contract', () => {
  test('opening focuses inside the dialog and closing restores the opener', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { size: 'medium' } as any);

    await page.evaluate(() => (window as any).matrix.openFromOpener());
    const inside = await page.evaluate(() => (window as any).matrix.activeId());
    // Documented: "first focusable element focused on open". The first
    // focusable inside the panel is the header's own close button.
    expect(inside, `focus landed on "${inside}" instead of inside the dialog`).not.toBe('opener');
    expect(inside, 'nothing at all took focus when the dialog opened').not.toBe(null);

    await page.evaluate(() => (window as any).matrix.close());
    const after = await page.evaluate(() => (window as any).matrix.activeId());
    // Documented: "previous focus restored on close".
    expect(after, `focus went to "${after}" instead of back to the opener`).toBe('opener');
  });

  test('Tab cycles inside the dialog rather than escaping to the page', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { size: 'medium', open: true } as any);
    await page.evaluate(() => (window as any).matrix.settle());

    const seen: Array<string | null> = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => (window as any).matrix.activeId()));
    }
    // Documented: "Tab/Shift+Tab cycle focus WITHIN modal".
    expect(seen, `focus escaped the dialog: ${JSON.stringify(seen)}`).not.toContain('opener');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('modal visual matrix: marquee pixels', () => {
  test('the backdrop really dims the page behind it', async () => {
    const probe = `() => {
      const beacon = document.getElementById('beacon').getBoundingClientRect();
      return [{ x: beacon.x + beacon.width / 2, y: beacon.y + beacon.height / 2 }];
    }`;

    await page.evaluate(c => (window as any).matrix.mount(c), { size: 'medium' } as any);
    const [bare] = await capture(page, 'body', 'modal-beacon-bare', probe);

    await page.evaluate(() => (window as any).matrix.show());
    const [dimmed] = await capture(page, 'body', 'modal-beacon-dimmed', probe);

    // The beacon is a solid magenta block. With the modal open, the backdrop
    // has to change what a camera sees there — otherwise it is not a backdrop.
    expect(sameColor(bare, dimmed),
      `the beacon painted rgb(${bare.join(',')}) with and without the modal open`)
      .toBe(false);
  });

  test('the four sizes paint four panel widths', async () => {
    const widths: Record<string, number> = {};
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c), { size, open: true } as any);
      widths[size] = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const panel = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('panel'))!;
        return Math.round(panel.getBoundingClientRect().width);
      });
    }
    expect(widths.small, `panel widths: ${JSON.stringify(widths)}`).toBeLessThan(widths.medium);
    expect(widths.medium, `panel widths: ${JSON.stringify(widths)}`).toBeLessThan(widths.large);
    expect(widths.large, `panel widths: ${JSON.stringify(widths)}`)
      .toBeLessThan(widths.fullscreen);
  });

  test('the panel is opaque enough to read on top of the backdrop', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { size: 'medium', open: true } as any);

    const [panelFill, backdropFill] = await capture(
      page, 'body', 'modal-panel',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const find = (name) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes(name))
          .getBoundingClientRect();
        const panel = find('panel');
        return [
          { x: panel.right - 6, y: panel.bottom - 6 },
          { x: 8, y: window.innerHeight - 8 },
        ];
      }`,
    );
    expect(sameColor(panelFill, backdropFill),
      `the panel paints rgb(${panelFill.join(',')}), exactly the backdrop's own colour`)
      .toBe(false);
  });
});
