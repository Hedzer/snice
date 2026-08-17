/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-pdf-viewer TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/pdf-viewer, `npm run test:matrix`) owns
 * structure and value truth through an offline loader stand-in: the parts, the
 * toolbar readouts and boundary disables, the event lifecycle. happy-dom does
 * no layout, so this tier is where the REAL vendored PDF.js runs — against a
 * two-page PDF the fixture builds as bytes in the page. NO NETWORK.
 *
 * Per the mission's pdf-viewer rule, this tier asserts what a real browser can
 * assert of a real render:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the chrome: the three parts, the toolbar spanning the base above the
 *     viewport, the focusable container (tabindex 0), titled buttons with real
 *     boxes, hit-testable and not occluded;
 *   · the fit contract, in real pixels: `width` sizes the canvas to the
 *     viewport's inner width, `height` to its inner height, `page` to whichever
 *     binds — each multiplied by `zoom` (the documented 0.25–5 zoom level is a
 *     multiplier on the fit);
 *   · `pdf-loaded -> { totalPages }` from a real document, and the toolbar's
 *     document-aware state afterwards;
 *   · the empty state with no src and the error state with a junk document:
 *     exactly one viewport state visible each;
 *   · page navigation re-renders the canvas (page-change -> { page,
 *     totalPages }).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A canvas that "has a width" can still paint nothing. The marquee captures
 *   decode the PNG inside the browser under test and judge the painted page
 *   against the dark viewport around it, page 1 against page 2, and the error
 *   state's danger icon against its surface.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/pdf-viewer/matrix.html';

type Fit = 'width' | 'height' | 'page';

interface Combo {
  id: string;
  /** 'pdf' = the in-page two-page document, 'bad' = junk bytes, none = empty. */
  src: 'pdf' | 'bad' | 'none';
  fit: Fit;
  zoom: number;
  page: number;
}

/**
 * The cross: doc combos fit (3) x zoom (3) x page (2) = 18, plus the empty
 * state per fit (3) and the error state through both authoring channels (2)
 * — 23 combos. Sized to a component whose fit contract has three arms and
 * whose zoom is a multiplier over them.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const fit of ['width', 'height', 'page'] as Fit[]) {
    for (const zoom of [0.5, 1, 2]) {
      for (const page of [1, 2]) {
        combos.push({
          id: `doc/${fit}/zoom${zoom}/page${page}`,
          src: 'pdf', fit, zoom, page,
        });
      }
    }
    combos.push({ id: `empty/${fit}`, src: 'none', fit, zoom: 1, page: 1 });
  }
  combos.push({ id: 'error/fit-width', src: 'bad', fit: 'width', zoom: 1, page: 1 });
  combos.push({ id: 'error/fit-page', src: 'bad', fit: 'page', zoom: 1, page: 1 });
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** The canvas the current page rendered into. */
const CANVAS_PROBE = `host.shadowRoot.querySelector('.pdf-canvas-wrapper canvas')`;

/**
 * LAYER 1. One evaluate per combo, returning every violation at once.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 2;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    const toolbar = sr.querySelector('[part~="toolbar"]') as HTMLElement | null;
    const viewport = sr.querySelector('[part~="viewport"]') as HTMLElement | null;
    if (!base || !toolbar || !viewport) {
      say('the three documented parts are not all rendered');
      return problems;
    }

    // ── The chrome ──────────────────────────────────────────────────────────
    if (base.getAttribute('tabindex') !== '0') {
      say(`container tabindex "${base.getAttribute('tabindex')}", expected "0"`);
    }
    const baseBox = rect(base);
    const toolbarBox = rect(toolbar);
    const viewportBox = rect(viewport);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`base renders at ${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)}`);
      return problems;
    }
    // :host { width: 100% } — the viewer fills its stage.
    const stageBox = rect(document.getElementById('stage')!);
    if (Math.abs(baseBox.width - stageBox.width) > EPS) {
      say(`base is ${baseBox.width.toFixed(0)}px wide in a ${stageBox.width.toFixed(0)}px stage`);
    }
    // The toolbar spans the viewer, above the viewport.
    if (Math.abs(toolbarBox.width - baseBox.width) > EPS) {
      say(`toolbar is ${toolbarBox.width.toFixed(0)}px wide, base is ${baseBox.width.toFixed(0)}px`);
    }
    if (toolbarBox.height < 24) say(`toolbar is only ${toolbarBox.height.toFixed(0)}px tall`);
    if (viewportBox.top < toolbarBox.bottom - EPS) {
      say('the viewport starts above the toolbar');
    }
    // The viewport's documented min-height is 30rem.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (viewportBox.height < 30 * rem - 4) {
      say(`viewport is ${viewportBox.height.toFixed(0)}px tall, under the 30rem minimum`);
    }

    // ── The toolbar buttons: real, titled, hit-testable ─────────────────────
    const buttons = [...sr.querySelectorAll('.pdf-btn')] as HTMLButtonElement[];
    const kinds = ['prev', 'next', 'zoom-out', 'zoom-in', 'download', 'print'];
    if (buttons.length !== 6) say(`${buttons.length} toolbar buttons, expected 6`);
    for (const button of buttons) {
      if (!button.getAttribute('title')) say(`button ${button.className} has no title`);
      const b = rect(button);
      if (b.width < 16 || b.height < 16) {
        say(`button ${button.className} renders at ${b.width.toFixed(0)}x${b.height.toFixed(0)}`);
      }
      if (!button.disabled) {
        const hit = (sr as any).elementFromPoint(
          b.left + b.width / 2, b.top + b.height / 2) as Element | null;
        if (hit !== button && !button.contains(hit)) {
          say(`button ${button.className} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }
    void kinds;

    // ── The state machine: exactly one viewport state visible ───────────────
    const states = {
      loading: sr.querySelector('.pdf-loading'),
      error: sr.querySelector('.pdf-error'),
      empty: sr.querySelector('.pdf-empty'),
      canvas: sr.querySelector('.pdf-canvas-wrapper'),
    };
    const visible = Object.entries(states)
      .filter(([, node]) => node && (node as Element).classList.contains('is-visible'))
      .map(([name]) => name);
    const wantVisible = combo.src === 'pdf' ? 'canvas'
      : combo.src === 'bad' ? 'error' : 'empty';
    if (visible.length !== 1 || visible[0] !== wantVisible) {
      say(`visible viewport states [${visible.join(',')}], expected [${wantVisible}]`);
    }

    // ── Document-aware toolbar state ────────────────────────────────────────
    const totalPages = combo.src === 'pdf' ? 2 : 0;
    const findBtn = (kind: string) =>
      sr.querySelector(`.pdf-btn-${kind}`) as HTMLButtonElement | null;
    if (findBtn('prev')!.disabled !== (combo.page <= 1)) {
      say(`prev disabled is ${findBtn('prev')!.disabled} at page ${combo.page}`);
    }
    if (findBtn('next')!.disabled !== (combo.page >= totalPages)) {
      say(`next disabled is ${findBtn('next')!.disabled} at page ${combo.page} of ${totalPages}`);
    }
    // The DOM matrix's toolbar oracle (pdf-viewer-support.ts): download and
    // print act on `src` — disabled only when there is no src at all, not
    // when the document behind it failed to load.
    if (findBtn('download')!.disabled !== (combo.src === 'none')) {
      say(`download disabled is ${findBtn('download')!.disabled} with src "${combo.src}"`);
    }
    const pageInput = sr.querySelector('.pdf-page-input') as HTMLInputElement;
    if (pageInput.value !== String(combo.page)) {
      say(`page input "${pageInput.value}", expected "${combo.page}"`);
    }
    const zoomInfo = sr.querySelector('.pdf-zoom-info') as HTMLElement;
    if ((zoomInfo.textContent ?? '').trim() !== `${Math.round(combo.zoom * 100)}%`) {
      say(`zoom info "${zoomInfo.textContent}", expected ${Math.round(combo.zoom * 100)}%`);
    }
    const fitSelect = sr.querySelector('.pdf-fit-select') as HTMLSelectElement;
    if (fitSelect.value !== combo.fit) {
      say(`fit select "${fitSelect.value}", expected "${combo.fit}"`);
    }

    // ── The fit contract, in real pixels ────────────────────────────────────
    if (combo.src === 'pdf') {
      const canvas = states.canvas!.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) { say('no canvas in the visible wrapper'); return problems; }
      if (canvas.width < 100 || canvas.height < 100) {
        say(`canvas backing store is ${canvas.width}x${canvas.height}`);
        return problems;
      }
      const cssBox = rect(canvas);
      if (cssBox.width < 100 || cssBox.height < 100) {
        say(`canvas CSS box is ${cssBox.width.toFixed(0)}x${cssBox.height.toFixed(0)}`);
        return problems;
      }
      const vpCs = getComputedStyle(viewport);
      // The component reserves 32px total (16px padding each side).
      const innerWidth = viewport.clientWidth - 32;
      // The height axis is NOT clientHeight: this fixture does not size the
      // host, so the auto-height viewport GROWS to a tall canvas after it
      // paints — measuring clientHeight then feeds the canvas back into its
      // own oracle (zoom 2 sizes to 2x30rem, then "expects" 2x that). The
      // fit base is the inner box of the documented 30rem min-height the
      // component measured when it derived the fit.
      const innerHeight = 30 * rem;
      const zoom = combo.zoom;
      if (combo.fit === 'width') {
        if (Math.abs(cssBox.width - innerWidth * zoom) > 4) {
          say(`fit=width canvas is ${cssBox.width.toFixed(0)}px, expected`
            + ` ${innerWidth * zoom} (inner width x zoom)`);
        }
      } else if (combo.fit === 'height') {
        if (Math.abs(cssBox.height - innerHeight * zoom) > 4) {
          say(`fit=height canvas is ${cssBox.height.toFixed(0)}px, expected`
            + ` ${innerHeight * zoom} (inner height x zoom)`);
        }
      } else {
        // fit=page: both dimensions fit, and at least one binds.
        const fitsWidth = cssBox.width <= innerWidth * zoom + 4;
        const fitsHeight = cssBox.height <= innerHeight * zoom + 4;
        if (!fitsWidth || !fitsHeight) {
          say(`fit=page canvas ${cssBox.width.toFixed(0)}x${cssBox.height.toFixed(0)}`
            + ` overflows the ${innerWidth}x${innerHeight} inner box`);
        }
        const bindsW = Math.abs(cssBox.width - innerWidth * zoom) <= 4;
        const bindsH = Math.abs(cssBox.height - innerHeight * zoom) <= 4;
        if (!bindsW && !bindsH) {
          say(`fit=page canvas binds neither dimension — it is smaller than both`);
        }
      }
      // A drawn page is centered in the viewport. At zoom > 1 the canvas is
      // MEANT to overflow the scrollable viewport symmetrically — zoom is a
      // documented multiplier (0.25–5) on the fit — so the claim is about
      // the centre, never the edges.
      const centre = (b: DOMRect) => b.left + b.width / 2;
      if (Math.abs(centre(cssBox) - centre(viewportBox)) > EPS) {
        say(`canvas centre ${centre(cssBox).toFixed(0)} is off the viewport`
          + ` centre ${centre(viewportBox).toFixed(0)}`);
      }
      void vpCs;
    }

    return problems;
  }, combo);
}

test.describe('pdf-viewer visual matrix: layer 1', () => {
  for (const combo of generateCombos()) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      // The lifecycle the fixture observed must be the documented one.
      const wantLifecycle = combo.src === 'pdf' ? 'loaded' : combo.src === 'bad' ? 'error' : 'none';
      expect(mounted.lifecycle, `combo ${combo.id} lifecycle`).toBe(wantLifecycle);
      if (combo.src === 'pdf') {
        expect(mounted.totalPages, `combo ${combo.id} totalPages`).toBe(2);
      }
      if (combo.src === 'bad') {
        expect(String(mounted.error).length, `combo ${combo.id} error text`).toBeGreaterThan(0);
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('pdf-viewer visual matrix: navigation re-renders', () => {
  test('goToPage fires page-change and repaints the canvas', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      src: 'pdf', fit: 'width', zoom: 1, page: 1,
    }));
    const before = await page.evaluate(() => {
      const canvas = (window as any).matrix.el.shadowRoot
        .querySelector('.pdf-canvas-wrapper canvas');
      return canvas.toDataURL();
    });
    const events = await page.evaluate(() => {
      const el = (window as any).matrix.el;
      const seen: Array<{ page: number; totalPages: number }> = [];
      const listener = (e: Event) => seen.push((e as CustomEvent).detail);
      el.addEventListener('page-change', listener);
      return (window as any).matrix.goToPage(2).then(() => {
        el.removeEventListener('page-change', listener);
        return seen;
      });
    });
    expect(events).toEqual([{ page: 2, totalPages: 2 }]);
    const after = await page.evaluate(() => {
      const canvas = (window as any).matrix.el.shadowRoot
        .querySelector('.pdf-canvas-wrapper canvas');
      return canvas.toDataURL();
    });
    // Page 1 paints red and page 2 blue: a real re-render, not a no-op.
    expect(after, 'the canvas did not repaint for page 2').not.toBe(before);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 measured the model the browser built; these exist
// because "the canvas has a width" and "the page painted" are different
// claims, and only pixels can tell them apart.

test.describe('pdf-viewer visual matrix: marquee pixels', () => {
  test('a rendered page paints against the dark viewport, not into the void', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      src: 'pdf', fit: 'width', zoom: 1, page: 1,
    }));
    // One pixel in the page's white paper band and one in the viewport's
    // dark margin beside it (the component paints the viewport surface, the
    // page white). NOT the canvas centre: the fixture's own red rect spans
    // PDF x 156..456, so the centre is red (red-vs-dark is under 2:1) while
    // the left band stays white paper at every scale.
    const [pagePx, viewportPx] = await capture(
      page, '#subject', 'pdf-page-vs-viewport',
      `(host) => {
        const canvas = ${CANVAS_PROBE};
        const c = canvas.getBoundingClientRect();
        const viewport = host.shadowRoot.querySelector('[part~="viewport"]');
        const v = viewport.getBoundingClientRect();
        return [
          { x: c.x + 12, y: c.y + c.height / 2 },
          { x: v.x + 8, y: v.y + v.height / 2 },
        ];
      }`,
    );
    expect(sameColor(pagePx as RGB, viewportPx as RGB),
      `page painted ${pagePx.join(',')}, identical to the viewport ${viewportPx.join(',')}`)
      .toBe(false);
    expect(contrast(pagePx as RGB, viewportPx as RGB),
      `page-vs-viewport contrast is ${contrast(pagePx as RGB, viewportPx as RGB).toFixed(2)}:1`)
      .toBeGreaterThan(3);
  });

  test('page 1 paints the red rectangle the fixture authored', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      src: 'pdf', fit: 'width', zoom: 1, page: 1,
    }));
    // MediaBox 612x792, rect (156,296,300,400) in PDF space (origin bottom
    // left): the rect's centre is at 306,496 -> 132px from the canvas top in
    // rendered space.
    const [rectPx, pagePx] = await capture(
      page, '#subject', 'pdf-red-rect',
      `(host) => {
        const canvas = ${CANVAS_PROBE};
        const c = canvas.getBoundingClientRect();
        const scale = c.height / 792;
        return [
          { x: c.x + c.width / 2, y: c.y + (792 - 496) * scale },
          { x: c.x + c.width / 2, y: c.y + 20 },
        ];
      }`,
    );
    const [r, g, b] = rectPx as RGB;
    expect(r > g + 40 && r > b + 40,
      `authored red rect painted rgb(${r},${g},${b})`).toBe(true);
    expect(sameColor(rectPx as RGB, pagePx as RGB),
      `rect ${rectPx.join(',')} and page margin ${pagePx.join(',')} are the same colour`)
      .toBe(false);
  });

  test('page 2 paints blue where page 1 painted red', async () => {
    const rectPixels: RGB[] = [];
    for (const pageNo of [1, 2]) {
      await page.evaluate(n => (window as any).matrix.mount({
        src: 'pdf', fit: 'width', zoom: 1, page: n,
      }), pageNo);
      const [px] = await capture(
        page, '#subject', `pdf-rect-page${pageNo}`,
        `(host) => {
          const canvas = ${CANVAS_PROBE};
          const c = canvas.getBoundingClientRect();
          const scale = c.height / 792;
          return [{ x: c.x + c.width / 2, y: c.y + (792 - 496) * scale }];
        }`,
      );
      rectPixels.push(px as RGB);
    }
    const [r1, , b1] = rectPixels[0];
    const [r2, , b2] = rectPixels[1];
    expect(r1 > b1, `page 1 rect is not red: ${rectPixels[0].join(',')}`).toBe(true);
    expect(b2 > r2, `page 2 rect is not blue: ${rectPixels[1].join(',')}`).toBe(true);
  });

  test('the error state paints its danger icon against the dark viewport', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ src: 'bad' }));
    // The error icon's stroke is the danger colour on the dark viewport
    // surface. A point inside the icon's circle and a point beside it in the
    // empty viewport area must differ.
    const [iconPx, surfacePx] = await capture(
      page, '#subject', 'pdf-error-icon',
      `(host) => {
        const icon = host.shadowRoot.querySelector('.pdf-error-icon svg');
        const viewport = host.shadowRoot.querySelector('[part~="viewport"]');
        const i = icon.getBoundingClientRect();
        const v = viewport.getBoundingClientRect();
        return [
          { x: i.x + i.width / 2, y: i.y + i.height / 2 },
          { x: v.x + 12, y: v.y + 12 },
        ];
      }`,
    );
    expect(sameColor(iconPx as RGB, surfacePx as RGB),
      `error icon painted ${iconPx.join(',')} identical to the surface ${surfacePx.join(',')}`)
      .toBe(false);
  });
});
