import { test, expect } from '@playwright/test';

// MODAL-3: `top-layer` / `container` escape the shell stacking-context trap.
//
// The validated bug: a fixed modal hosted inside
// `main { position: relative; z-index: 0 }` paints inside that stacking
// context, so a shell header (positioned, z-index: 1020) paints over the
// modal's top strip no matter what --modal-z-index says — the fixed overlay
// escapes LAYOUT but not the STACKING CHAIN. `top-layer` (native
// popover="manual") lifts the overlay into the browser top layer, immune to
// ancestor contexts; `container` pins the fixed overlay to a container's box.
//
// Two defects found against this spec are now fixed and pinned here:
//   1. The UA `[popover]` sheet (`inset:0; width/height:fit-content;
//      margin:auto`) used to shrink the overlay to fit-content, so the
//      backdrop left scrim gaps and tall panels overflowed the viewport top.
//      The component now applies inline geometry (`inset` + `width/height:
//      auto` + `margin: 0`) on show and on every re-measure, so the overlay
//      stretches EXACTLY to its inset box (viewport or container) — the
//      full-overlay assertions below lock that in. One UA caveat: absolute
//      children of a top-layer popover resolve against a containing block
//      deflated ~3px on every side (reproduced with a bare popover in all
//      three engines), so the backdrop coverage assertions allow that
//      deflate and no more.
//   2. `.modal--container` is template-owned (`containerActive` state), so
//      it survives re-renders instead of being an imperative classList patch
//      that renders wipe.
//
// Probe method (identical across every assertion): a REAL `page.mouse.click`
// at a point that is geometrically inside the panel's top strip AND inside
// the 64px header band, with a capture-phase document listener recording
// `composedPath()`. `document.elementFromPoint` is deliberately NOT used:
// Chromium's elementFromPoint ignores top-layer (popover) elements and would
// report the header even when the modal IS above it; a real input click
// follows the true top-layer hit-test in every engine.

const fixturePath = '/tests/live/fixtures/modal/stacking.html';

const MODALS = {
  trap: 'stack-modal',
  top: 'stack-modal-top',
  container: 'stack-modal-container',
  both: 'stack-modal-both',
};

async function fixtureReady(page: import('@playwright/test').Page) {
  // domcontentloaded, NOT load: the fixture's module script top-level-await
  // on document.fonts.ready delays the load event, and under a cold vite
  // transform the full snice core graph can take well over the 30s default.
  // The fixtureReady signal IS the readiness contract; wait on it directly.
  await page.goto(fixturePath, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.documentElement.dataset.fixtureReady === 'true',
    undefined, { timeout: 60_000 },
  );
}

/**
 * Opens a modal and waits for the panel to SETTLE at its final state —
 * `expect().toBeVisible()` fires at the START of the open transition (panel
 * opacity/transform still animating), which would make geometry and
 * hit-tests measure a moving target. Settled = `.modal--open` present, panel
 * opacity 1 and identity transform, and the header row's content-in animation
 * finished (opacity 1).
 */
async function openSettled(page: import('@playwright/test').Page, id: string) {
  await page.evaluate((modalId) => (document.getElementById(modalId) as any).show(), id);
  await expect.poll(() => page.evaluate((modalId) => {
    const m = document.getElementById(modalId) as any;
    if (!m?.shadowRoot?.querySelector('.modal--open')) return false;
    const cs = getComputedStyle(m.shadowRoot.querySelector('.modal__panel') as HTMLElement);
    const header = m.shadowRoot.querySelector('.modal__header') as HTMLElement | null;
    const hcs = header ? getComputedStyle(header) : null;
    const settled = cs.opacity === '1'
      && (cs.transform === 'none' || cs.transform.startsWith('matrix(1, 0, 0, 1, 0'))
      && (!hcs || hcs.opacity === '1');
    return settled;
  }, id)).toBe(true);
}

/** Panel + overlay + backdrop geometry and state from inside the page. */
async function geom(page: import('@playwright/test').Page, id: string) {
  return page.evaluate((modalId) => {
    const m = document.getElementById(modalId) as any;
    const root = m.shadowRoot;
    const pr = root.querySelector('.modal__panel').getBoundingClientRect();
    const overlay = root.querySelector('.modal') as HTMLElement;
    const or = overlay.getBoundingClientRect();
    const br = root.querySelector('.modal__backdrop').getBoundingClientRect();
    const main = document.querySelector('.shell__main') as HTMLElement;
    const header = document.querySelector('.shell__header') as HTMLElement;
    const mr = main.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    return {
      panel: { x: pr.x, y: pr.y, w: pr.width, h: pr.height, cx: pr.left + pr.width / 2, cy: pr.top + pr.height / 2 },
      overlay: { x: or.x, y: or.y, w: or.width, h: or.height, right: or.right, bottom: or.bottom },
      backdrop: { x: br.x, y: br.y, w: br.width, h: br.height, right: br.right, bottom: br.bottom },
      containerClass: overlay.classList.contains('modal--container'),
      inset: overlay.style.inset,
      popoverOpen: overlay.matches(':popover-open'),
      main: { x: mr.x, y: mr.y, w: mr.width, h: mr.height, cx: mr.left + mr.width / 2, cy: mr.top + mr.height / 2 },
      header: { y: hr.y, bottom: hr.bottom },
      vw: window.innerWidth,
      vh: window.innerHeight,
    };
  }, id);
}

/** Box equality within 1px; returns a list of diverging axes. */
function boxDiff(actual: { x: number; y: number; w: number; h: number },
                 expected: { x: number; y: number; w: number; h: number }): string[] {
  const d: string[] = [];
  if (Math.abs(actual.x - expected.x) > 1) d.push(`x ${actual.x} vs ${expected.x}`);
  if (Math.abs(actual.y - expected.y) > 1) d.push(`y ${actual.y} vs ${expected.y}`);
  if (Math.abs(actual.w - expected.w) > 1) d.push(`w ${actual.w} vs ${expected.w}`);
  if (Math.abs(actual.h - expected.h) > 1) d.push(`h ${actual.h} vs ${expected.h}`);
  return d;
}

/**
 * The backdrop must cover the overlay (no exposed scrim gaps).
 *
 * Non-top-layer overlays: exact. Top-layer (popover) overlays: the UA
 * resolves the containing block of an element's absolutely-positioned
 * children against a box deflated by ~3px on EVERY side when that element
 * rides the top layer — verified with a BARE `<div popover=manual>` (no
 * snice, no stylesheet) measuring the identical 3px deflate in Chromium,
 * Firefox, AND WebKit. That is UA behavior the component cannot override;
 * the component contract is that the overlay itself stretches exactly to its
 * inset box and the backdrop covers it to within that deflate.
 */
function backdropCovers(backdrop: { x: number; y: number; right: number; bottom: number },
                        overlay: { x: number; y: number; right: number; bottom: number },
                        tolerance = 1): string[] {
  const problems: string[] = [];
  if (backdrop.x > overlay.x + tolerance || backdrop.y > overlay.y + tolerance
      || backdrop.right < overlay.right - tolerance || backdrop.bottom < overlay.bottom - tolerance) {
    problems.push(`backdrop ${JSON.stringify(backdrop)} does not cover overlay ${JSON.stringify(overlay)} `
      + `(tolerance ${tolerance}px)`);
  }
  return problems;
}

/**
 * The fixed geometry contract (MODAL-3 defect #1): the overlay stretches
 * EXACTLY to its inset box — the viewport when no container is set, the
 * container's box when one is — and the backdrop covers that box fully. The
 * UA popover sheet (`inset:0; width/height:fit-content; margin:auto`) is
 * neutralized by the inline geometry the component applies on show and on
 * every re-measure, so a full-viewport overlay is not a UA default but a
 * component guarantee.
 */
async function expectOverlayBox(page: import('@playwright/test').Page, id: string,
                                expected: { x: number; y: number; w: number; h: number },
                                label: string, backdropTolerance = 1) {
  const g = await geom(page, id);
  expect(boxDiff(g.overlay, expected), `${label}: overlay must stretch exactly to the expected box`)
    .toEqual([]);
  expect(backdropCovers(g.backdrop, g.overlay, backdropTolerance), `${label}: backdrop must cover the overlay fully`)
    .toEqual([]);
  return g;
}

/**
 * The ONE probe: a real click at (x, y) whose `composedPath()` is recorded by
 * a capture-phase document listener. Returns the serialized path (tag + id +
 * class per entry, pseudo-element entries tagged separately).
 */
async function hitPath(page: import('@playwright/test').Page, x: number, y: number) {
  await page.evaluate(() => {
    (window as any).__hitPath = null;
    document.addEventListener('click', (e: MouseEvent) => {
      const path: any[] = e.composedPath ? e.composedPath() : [];
      (window as any).__hitPath = path.map((el) => {
        if (typeof el === 'string') return { pseudo: el };
        const cls = typeof (el as Element).className === 'string' ? (el as Element).className : '';
        return { tag: (el as Element).tagName?.toLowerCase() ?? '', id: (el as Element).id ?? '', cls };
      });
    }, { capture: true, once: true });
  });
  await page.mouse.click(x, y);
  return page.evaluate(() => (window as any).__hitPath ?? []);
}

function pathHits(path: Array<{ cls?: string; tag?: string; id?: string }>, classFragment: string): boolean {
  return path.some((p) => typeof p.cls === 'string' && p.cls.split(/\s+/).includes(classFragment));
}

test.describe('Snice Modal stacking escape (top-layer / container)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await fixtureReady(page);
  });

  test('the z-index trap reproduces by default: the header wins the hit-test over the open modal', async ({ page }) => {
    await openSettled(page, MODALS.trap);

    const g = await geom(page, MODALS.trap);
    expect(g.popoverOpen).toBe(false);
    // The panel's top strip must geometrically overlap the header band for
    // the probe to be meaningful — the trap fixture is built so it does.
    expect(g.panel.y, 'panel top strip must lie inside the header band').toBeLessThan(g.header.bottom - 8);

    const probe = { x: g.panel.cx, y: g.panel.y + 8 };
    const path = await hitPath(page, probe.x, probe.y);

    expect(pathHits(path, 'shell__header'),
      `click at (${Math.round(probe.x)}, ${Math.round(probe.y)}) should hit the shell header, got: ${JSON.stringify(path)}`)
      .toBe(true);
    expect(pathHits(path, 'modal__panel')).toBe(false);
    expect(pathHits(path, 'modal__header')).toBe(false);
  });

  test('top-layer escapes the trap: the same hit-test lands on the modal above the header', async ({ page }) => {
    await openSettled(page, MODALS.top);

    const g = await geom(page, MODALS.top);
    expect(g.popoverOpen, 'overlay must match :popover-open (browser top layer)').toBe(true);
    // Browsers serialize a uniform shorthand as one token ('0px'); assert
    // every side resolves to 0 regardless.
    expect(g.inset.split(' ').every((v) => parseFloat(v) === 0),
      `inline inset must be pinned to the full viewport, got: "${g.inset}"`).toBe(true);
    // Defect #1 regression: the UA popover sheet must NOT shrink the overlay
    // to fit-content — it stretches to the viewport and the backdrop covers it.
    expect(boxDiff(g.overlay, { x: 0, y: 0, w: g.vw, h: g.vh }),
      'overlay must stretch to the full viewport').toEqual([]);
    // Top-layer UA deflate: absolute children of a popover resolve against a
    // box ~3px smaller on every side (verified with a bare popover in all
    // three engines); tolerate that, never more.
    expect(backdropCovers(g.backdrop, g.overlay, 4), 'backdrop must cover the full-viewport overlay').toEqual([]);
    expect(g.panel.y, 'panel top strip must lie inside the header band').toBeLessThan(g.header.bottom - 8);

    const probe = { x: g.panel.cx, y: g.panel.y + 8 };
    const path = await hitPath(page, probe.x, probe.y);

    expect(pathHits(path, 'shell__header'),
      `click at (${Math.round(probe.x)}, ${Math.round(probe.y)}) must NOT reach the header: ${JSON.stringify(path)}`)
      .toBe(false);
    expect(pathHits(path, 'modal__panel') || pathHits(path, 'modal__header'),
      `click at (${Math.round(probe.x)}, ${Math.round(probe.y)}) should hit the modal's panel, got: ${JSON.stringify(path)}`)
      .toBe(true);
  });

  test('container centers the panel in .main (excluding the sidebar) and pins the overlay inset to its box', async ({ page }) => {
    await openSettled(page, MODALS.container);

    const g = await geom(page, MODALS.container);

    // The sidebar makes the container center meaningfully different from the
    // viewport center — without it this test asserts nothing.
    expect(Math.abs(g.main.cx - g.vw / 2)).toBeGreaterThan(50);
    expect(Math.abs(g.panel.cx - g.main.cx), 'panel must center on .main, not the viewport').toBeLessThanOrEqual(2);
    expect(Math.abs(g.panel.cx - g.vw / 2), 'panel must NOT center on the viewport').toBeGreaterThan(50);

    // The `.tall` (110vh) fixture content caps the panel via the container
    // rule's `max-height: 100%`, which resolves against the overlay flex
    // box's CONTENT box (container height minus the padding already outside
    // it) — so the panel caps at 100vh - 2 * padding (24px) with its top
    // edge at y = 24px, inside the 64px header band. The old
    // `calc(100% - 2 * padding)` subtracted the padding a second time and
    // capped at 624px instead; this height check pins the corrected math to
    // a real engine.
    expect(Math.abs(g.panel.h - (g.main.h - 48)), 'panel height must cap at main height - 2 * padding, not 4 * padding')
      .toBeLessThanOrEqual(4);
    expect(g.panel.y, 'panel top edge must sit inside the header band').toBeLessThan(g.header.bottom - 8);

    // The durable class: `modal--container` is template-owned (containerActive
    // state), not an imperative classList patch that renders wipe.
    expect(g.containerClass, 'overlay must carry the template-owned .modal--container class').toBe(true);

    // Overlay inline inset = distances from viewport edges to the container's
    // box: top/right/bottom/left, each exact to the pixel.
    const [top, right, bottom, left] = g.inset.split(' ').map((v) => parseFloat(v));
    expect(Math.abs(top - g.main.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(right - (g.vw - (g.main.x + g.main.w)))).toBeLessThanOrEqual(1);
    expect(Math.abs(bottom - (g.vh - (g.main.y + g.main.h)))).toBeLessThanOrEqual(1);
    expect(Math.abs(left - g.main.x)).toBeLessThanOrEqual(1);

    // Defect #1 regression: the overlay box equals the container's box and
    // the backdrop covers it fully.
    const g2 = await expectOverlayBox(page, MODALS.container, { x: g.main.x, y: g.main.y, w: g.main.w, h: g.main.h }, 'container');

    // Defect #2 regression: `modal--container` survives a re-render (a
    // reactive property change rebuilds the template) and the overlay stays
    // pinned to the container's box.
    await page.evaluate(() => ((document.getElementById('stack-modal-container') as any).size = 'large'));
    await expect.poll(() => page.evaluate(() => {
      const m = document.getElementById('stack-modal-container') as any;
      const root = m.shadowRoot;
      const overlay = root.querySelector('.modal') as HTMLElement;
      const mr = document.querySelector('.shell__main').getBoundingClientRect();
      const or = overlay.getBoundingClientRect();
      return overlay.classList.contains('modal--container')
        && Math.abs(or.x - mr.left) <= 1
        && Math.abs(or.width - mr.width) <= 1;
    }), 'modal--container must survive re-render and keep the overlay pinned to .main').toBe(true);
    expect(g2.panel.w, 'container modal panel must stay inside the container box').toBeLessThanOrEqual(g.main.w);
  });

  test('top-layer + container: centered in .main and painted above the header', async ({ page }) => {
    await openSettled(page, MODALS.both);

    const g = await geom(page, MODALS.both);
    expect(g.popoverOpen, 'overlay must match :popover-open (browser top layer)').toBe(true);
    expect(g.containerClass, 'overlay must carry the template-owned .modal--container class').toBe(true);
    expect(Math.abs(g.panel.cx - g.main.cx), 'panel must center on .main').toBeLessThanOrEqual(2);
    expect(Math.abs(g.panel.cx - g.vw / 2), 'panel must NOT center on the viewport').toBeGreaterThan(50);
    await expectOverlayBox(page, MODALS.both, { x: g.main.x, y: g.main.y, w: g.main.w, h: g.main.h }, 'both', 4);
    expect(g.panel.y, 'panel top strip must lie inside the header band').toBeLessThan(g.header.bottom - 8);

    const probe = { x: g.panel.cx, y: g.panel.y + 8 };
    const path = await hitPath(page, probe.x, probe.y);

    expect(pathHits(path, 'shell__header'),
      `click at (${Math.round(probe.x)}, ${Math.round(probe.y)}) must NOT reach the header: ${JSON.stringify(path)}`)
      .toBe(false);
    expect(pathHits(path, 'modal__panel') || pathHits(path, 'modal__header'),
      `click at (${Math.round(probe.x)}, ${Math.round(probe.y)}) should hit the modal's panel, got: ${JSON.stringify(path)}`)
      .toBe(true);
  });

  test('container re-measures its box while open', async ({ page }) => {
    await openSettled(page, MODALS.container);

    const before = await geom(page, MODALS.container);
    const initialCx = before.panel.cx;

    // Shrink .main while the modal is open: the ResizeObserver must re-pin
    // the overlay and re-center the panel inside the new box.
    await page.evaluate(() => {
      (document.querySelector('.shell__main') as HTMLElement).style.width = '700px';
    });
    await expect.poll(() => page.evaluate((maxCx) => {
      const root = (document.getElementById('stack-modal-container') as any).shadowRoot;
      const main = document.querySelector('.shell__main') as HTMLElement;
      const mr = main.getBoundingClientRect();
      const r = root.querySelector('.modal__panel').getBoundingClientRect();
      const cx = r.left + r.width / 2;
      return Math.abs(cx - (mr.left + mr.width / 2)) <= 2 && cx <= maxCx;
    }, initialCx - 100), 'panel must re-center inside the shrunken .main').toBe(true);

    // Restore the box and confirm the panel follows back.
    await page.evaluate(() => {
      (document.querySelector('.shell__main') as HTMLElement).style.width = '';
    });
    await expect.poll(() => page.evaluate(() => {
      const root = (document.getElementById('stack-modal-container') as any).shadowRoot;
      const r = root.querySelector('.modal__panel').getBoundingClientRect();
      return r.left + r.width / 2;
    })).toBeGreaterThanOrEqual(before.panel.cx - 2);

    // Re-measures rewrite inline geometry; the durable class must survive.
    expect((await geom(page, MODALS.container)).containerClass, 'modal--container must survive re-measure').toBe(true);
  });

  test('top-layer modal survives close -> reopen: no exception, panel returns, scroll unlocks, focus restored', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    // Real click on the opener: it takes focus (the focus-restore contract)
    // and opens the modal through the fixture's onclick.
    await page.click('#opener-top');
    await openSettled(page, MODALS.top);
    expect((await geom(page, MODALS.top)).popoverOpen).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Close via Escape (focus lives inside the open panel).
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => {
      const m = document.getElementById('stack-modal-top') as any;
      const overlay = m?.shadowRoot?.querySelector('.modal') as HTMLElement | null;
      return !!overlay && overlay.matches(':popover-open');
    })).toBe(false);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('opener-top');

    // Reopen, verify the panel comes back fully, then close via the button.
    await page.click('#opener-top');
    await openSettled(page, MODALS.top);
    expect((await geom(page, MODALS.top)).popoverOpen).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.locator(`#${MODALS.top} [part="close"]`).click();
    await expect.poll(() => page.evaluate(() => {
      const m = document.getElementById('stack-modal-top') as any;
      const overlay = m?.shadowRoot?.querySelector('.modal') as HTMLElement | null;
      return !!overlay && overlay.matches(':popover-open');
    })).toBe(false);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('opener-top');

    expect(pageErrors).toEqual([]);
  });
});
