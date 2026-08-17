/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-popover TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/popover, `npm run test:matrix`) owns the
 * structural contract: the `trigger` / `panel` / `content` parts, the ARIA
 * shell, the open/close events, which dismissals the `no-*` switches disable.
 * It cannot own the component's actual subject, because the component IS a
 * position: "a panel ANCHORED to a trigger element", with twelve documented
 * `placement` values and a `distance` in pixels. Every one of those is a
 * rectangle computed from another rectangle, and happy-dom has neither.
 *
 * ── Layer 1 (every combo): the anchoring arithmetic, painted ────────────────
 *   For each placement, the panel's real on-screen box is checked against the
 *   trigger's real on-screen box:
 *     · the SIDE the placement names is separated from the trigger by exactly
 *       `distance` px — no more, and never overlapping;
 *     · the ALIGNMENT suffix does what its name says: `-start` flushes the
 *       leading edges, `-end` the trailing ones, and a bare placement centres
 *       the panel on the trigger's axis;
 *     · the panel is opaque, above the page, and reachable by a pointer;
 *     · the panel never leaves the viewport, whatever the anchor;
 *     · a closed popover has no panel a pointer can reach.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Three. The panel's whole job is to be READABLE ON TOP of the page; the
 *   fixture puts a saturated block underneath so a probe can say whether the
 *   panel's surface actually covers it, whether the `distance` gap is really
 *   empty, and whether a closed popover paints anything at all.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/popover/matrix.html';

/** Every documented `placement`. */
const PLACEMENTS = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
] as const;
type Placement = typeof PLACEMENTS[number];

interface Combo {
  id: string;
  placement: Placement;
  distance: number;
  body?: 'short' | 'medium' | 'long';
  open?: boolean;
  anchorX?: string;
  anchorY?: string;
  /** The combo deliberately anchors somewhere the panel must be clamped. */
  clamped?: boolean;
  /**
   * A `MATRIX-popover-N` id when this combo is a recorded divergence. The
   * assertion stays exactly as correct as every other combo's; the id is what
   * turns the test into `test.fail`, so the tier still exits 0 while the
   * divergence stays on the record and starts failing the day it is fixed.
   */
  finding?: string;
}

/**
 * ── FINDING MATRIX-popover-1 ────────────────────────────────────────────────
 *
 * `position()` measures the panel BEFORE the panel exists on screen.
 *
 * `handleOpenChange()` runs `this.position()` and only then calls
 * `this.panel.showPopover()`. Until `showPopover()` lands, the panel carries
 * the UA's `[popover]:not(:popover-open) { display: none }` rule, so
 * `getBoundingClientRect()` answers 0x0 — and every branch of the placement
 * switch that subtracts the panel's own width or height is therefore computing
 * with zero. Measured on a 71x34 trigger with a 286x42 panel:
 *
 *   · `bottom-end`  puts the panel's LEFT edge on the trigger's right edge
 *                   (`a.right - p.width` with `p.width === 0`), so the panel
 *                   hangs a full width to the right of where it belongs;
 *   · `bottom`/`top` centre on `a.centre - 0/2`, i.e. do not centre at all;
 *   · every `left*`  lands `a.left - 0 - distance`, i.e. ON the trigger and to
 *                   its right, on the wrong side of the anchor entirely;
 *   · every `*-end`  flushes against the wrong edge for the same reason;
 *   · the viewport clamp inherits the zero too, so an edge-anchored panel is
 *     "clamped" to a rectangle that still hangs off the screen.
 *
 * Only `bottom-start` and `right-start` are correct, because they are the two
 * placements whose arithmetic never mentions the panel's own box.
 *
 * The DOM matrix cannot see any of it: happy-dom reports 0x0 for every element
 * whether or not it is shown, so there the "before" and "after" measurements
 * are identical and the bug has no symptom. The diagnosis is confirmed below
 * by `a reposition places the panel correctly` — one `resize`, dispatched after
 * the panel is really on screen, re-runs the same code with a real box and
 * every placement lands exactly where the docs say.
 */
const MISPLACED: readonly Placement[] = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-end',
];

function combo(over: Partial<Combo> & { id: string }): Combo {
  return { placement: 'bottom-end', distance: 6, ...over };
}

/**
 * 33 combos. Sized to the component: a popover has ONE panel and ONE layout,
 * and what varies is where that panel is put. The twelve placements crossed
 * with two distances is therefore the whole of it, plus the panel widths the
 * documented `min-width` / `max-width` bracket, plus the four viewport corners
 * where the panel has to be pulled back on-screen, plus the closed state.
 */
const COMBOS: Combo[] = [
  ...PLACEMENTS.flatMap(placement => [6, 24].map(distance => combo({
    id: `${placement}/distance=${distance}`,
    placement,
    distance,
    finding: MISPLACED.includes(placement) ? 'MATRIX-popover-1' : undefined,
  }))),

  // The documented width bracket: `--snice-popover-min-width` (12rem) and
  // `--snice-popover-max-width` (28rem). Only a browser resolves either.
  ...(['short', 'medium', 'long'] as const).map(body => combo({
    id: `body=${body}`, placement: 'bottom-start', body,
  })),

  // Anchored into each corner. Nothing in the docs promises a flip, but a
  // panel painted off the edge of the screen is a panel nobody can use, so the
  // claim asserted for these is only that: it stays on screen.
  combo({ id: 'anchored top-left corner', placement: 'top-start', anchorX: '8px', anchorY: '8px', clamped: true }),
  combo({ id: 'anchored top-right corner', placement: 'top-end', anchorX: 'calc(100% - 90px)', anchorY: '8px', clamped: true, finding: 'MATRIX-popover-1' }),
  combo({ id: 'anchored bottom-left corner', placement: 'bottom-start', anchorX: '8px', anchorY: 'calc(100% - 40px)', clamped: true, finding: 'MATRIX-popover-1' }),
  combo({ id: 'anchored bottom-right corner', placement: 'right', anchorX: 'calc(100% - 90px)', anchorY: 'calc(100% - 40px)', clamped: true, finding: 'MATRIX-popover-1' }),

  combo({ id: 'closed', placement: 'bottom-end', open: false }),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 0.6;
    const round = (n: number) => n.toFixed(1);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const named = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const triggerWrap = named('trigger');
    const panel = named('panel');
    const content = named('content');
    if (!triggerWrap) { say('no part="trigger" painted'); return problems; }
    if (!panel) { say('no part="panel" painted'); return problems; }
    if (!content) say('no part="content" painted');

    const anchor = rect(triggerWrap);
    if (anchor.width <= 0 || anchor.height <= 0) {
      say(`the trigger renders at ${anchor.width}x${anchor.height}`);
      return problems;
    }

    const panelStyle = getComputedStyle(panel);
    const box = rect(panel);
    const under = document.getElementById('under') as HTMLElement;

    // ── CLOSED: no panel a pointer, or an eye, can reach ─────────────────────
    if (combo.open === false) {
      const reachable = panelStyle.visibility === 'visible'
        && Number(panelStyle.opacity) > 0
        && panelStyle.display !== 'none';
      if (reachable) {
        say(`a closed popover leaves its panel visible (display ${panelStyle.display},`
          + ` visibility ${panelStyle.visibility}, opacity ${panelStyle.opacity})`);
      }
      const hit = document.elementFromPoint(anchor.left + anchor.width / 2, anchor.bottom + 20);
      if (hit === host || host.contains(hit as Node)) {
        say('a closed popover still answers a hit-test below its trigger');
      }
      return problems;
    }

    // ── OPEN: the panel is real, opaque and on top of the page ───────────────
    if (box.width <= 0 || box.height <= 0) {
      say(`the open panel renders at ${box.width}x${box.height}`);
      return problems;
    }
    if (panelStyle.visibility !== 'visible') say(`panel visibility "${panelStyle.visibility}"`);
    if (Number(panelStyle.opacity) < 1) say(`the settled panel is at opacity ${panelStyle.opacity}`);
    if (panelStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the panel has a transparent background — the page reads through it');
    }
    // "Panel is role=\"dialog\", opens via the platform popover=\"manual\" API"
    if (panel.getAttribute('role') !== 'dialog') {
      say(`part="panel" role="${panel.getAttribute('role')}", expected "dialog"`);
    }

    // A panel a pointer cannot reach is not an "interactive panel". Probe in
    // the panel's own padding strip, clear of its content.
    const hit = document.elementFromPoint(box.left + 3, box.top + 3);
    if (hit !== host && !host.contains(hit as Node)) {
      say(`a pointer at the panel's own corner finds`
        + ` <${(hit as HTMLElement | null)?.tagName.toLowerCase() ?? 'nothing'}`
        + `${(hit as HTMLElement | null)?.id ? `#${(hit as HTMLElement).id}` : ''}>,`
        + ' not the popover');
    }
    if (hit === under) say('the page block is painted OVER the open panel');

    // ── The panel is on the screen ───────────────────────────────────────────
    if (box.left < -EPS || box.top < -EPS
      || box.right > window.innerWidth + EPS || box.bottom > window.innerHeight + EPS) {
      say(`the panel (${round(box.left)},${round(box.top)}`
        + ` ${round(box.width)}x${round(box.height)}) hangs outside the`
        + ` ${window.innerWidth}x${window.innerHeight} viewport`);
    }

    // ── The documented width bracket ─────────────────────────────────────────
    //
    // Measured on the CONTENT box, because `min-width` / `max-width` are
    // content-box properties and the panel adds its own padding and border on
    // top: the doc's "Panel min width (default 12rem)" is a claim about the
    // box those properties govern, not about the painted outer edge.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const min = 12 * rem;  // --snice-popover-min-width
    const max = 28 * rem;  // --snice-popover-max-width
    const chrome = parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight)
      + parseFloat(panelStyle.borderLeftWidth) + parseFloat(panelStyle.borderRightWidth);
    const contentWidth = box.width - chrome;
    if (contentWidth < min - EPS) {
      say(`the panel's content box is ${round(contentWidth)}px wide, under the`
        + ` documented ${round(min)}px minimum`);
    }
    if (contentWidth > max + EPS) {
      say(`the panel's content box is ${round(contentWidth)}px wide, over the`
        + ` documented ${round(max)}px maximum`);
    }

    // ── THE ANCHORING. Skipped where the combo asked to be clamped ───────────
    //
    // The placement vocabulary is the standard one the doc's own list spells
    // out: the word before the hyphen is the SIDE of the trigger the panel goes
    // on, and the word after is which pair of edges line up. `distance` is
    // documented as the "px gap from trigger", so it is the gap and not an
    // offset the panel may eat into.
    if (!combo.clamped) {
      const [side, align] = combo.placement.split('-');
      const gapFor = (actual: number, what: string) => {
        if (Math.abs(actual - combo.distance) > EPS) {
          say(`${what}: the gap is ${round(actual)}px, expected distance=${combo.distance}px`);
        }
      };
      const flush = (actual: number, expected: number, what: string) => {
        if (Math.abs(actual - expected) > EPS) {
          say(`${what}: ${round(actual)}, expected ${round(expected)}`);
        }
      };

      if (side === 'top') gapFor(anchor.top - box.bottom, 'above the trigger');
      if (side === 'bottom') gapFor(box.top - anchor.bottom, 'below the trigger');
      if (side === 'left') gapFor(anchor.left - box.right, 'left of the trigger');
      if (side === 'right') gapFor(box.left - anchor.right, 'right of the trigger');

      const vertical = side === 'top' || side === 'bottom';
      if (vertical) {
        if (align === 'start') flush(box.left, anchor.left, '"-start" left edges');
        else if (align === 'end') flush(box.right, anchor.right, '"-end" right edges');
        else {
          flush(box.left + box.width / 2, anchor.left + anchor.width / 2,
            'a bare placement centres the panel horizontally');
        }
      } else {
        if (align === 'start') flush(box.top, anchor.top, '"-start" top edges');
        else if (align === 'end') flush(box.bottom, anchor.bottom, '"-end" bottom edges');
        else {
          flush(box.top + box.height / 2, anchor.top + anchor.height / 2,
            'a bare placement centres the panel vertically');
        }
      }

      // Whatever the placement, the panel and the trigger must not share a
      // pixel: a panel sitting on its own trigger is not "anchored to" it.
      if (box.left < anchor.right - EPS && anchor.left < box.right - EPS
        && box.top < anchor.bottom - EPS && anchor.top < box.bottom - EPS) {
        say('the panel overlaps its own trigger');
      }
    }

    // The panel's content wrapper stays inside the panel it wraps.
    if (content) {
      const c = rect(content);
      if (c.left < box.left - EPS || c.right > box.right + EPS
        || c.top < box.top - EPS || c.bottom > box.bottom + EPS) {
        say('part="content" escapes part="panel"');
      }
    }

    return problems;
  }, combo as any);
}

test.describe('popover visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    const declare = combo.finding ? test.fail : test;
    declare(combo.finding ? `${combo.finding}: ${combo.id}` : combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.open, `open state for ${combo.id}`).toBe(combo.open !== false);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('popover visual matrix: dismissal', () => {
  /** A real pointer press on the page block, far from trigger and panel. */
  const clickThePage = async () => {
    await page.mouse.click(30, 830);
    await page.evaluate(() => (window as any).matrix.settle());
    return page.evaluate(() => (window as any).matrix.el.open as boolean);
  };

  test('an outside click closes by default and no-outside-dismiss opts out', async () => {
    // Driven with a REAL pointer rather than a synthesised event: the component
    // dismisses on `mousedown`, and only an actual press produces the whole
    // pointer sequence a browser would.
    await page.evaluate(() => (window as any).matrix.mount({ placement: 'bottom-start' }));
    expect(await clickThePage(), 'an outside click did not close the panel').toBe(false);

    await page.evaluate(() => (window as any).matrix.mount({
      placement: 'bottom-start', noOutsideDismiss: true,
    }));
    expect(await clickThePage(),
      'no-outside-dismiss did not survive an outside click').toBe(true);
  });

  test('Escape closes, restores focus to the trigger, and no-escape-dismiss opts out',
    async () => {
      // "Focus is restored to the trigger when the panel closes via Escape".
      // The trigger the component focuses is its own `part="trigger"` wrapper
      // inside the shadow root, so `document.activeElement` only ever reports
      // the host — the shadow root's own `activeElement` is the one that
      // answers the question.
      await page.evaluate(() => (window as any).matrix.mount({ placement: 'bottom-start' }));
      const dismissed = await page.evaluate(async () => {
        const result = await (window as any).matrix.press('Escape');
        const sr = document.getElementById('subject')!.shadowRoot!;
        const active = sr.activeElement as HTMLElement | null;
        return {
          open: result.open,
          focused: (active?.getAttribute('part') ?? '').split(/\s+/).includes('trigger'),
          focusedTag: active?.tagName.toLowerCase() ?? 'nothing',
          hostFocused: document.activeElement?.id ?? '',
        };
      });
      expect(dismissed.open, 'Escape did not close the panel').toBe(false);
      expect(dismissed.hostFocused, 'focus left the popover entirely').toBe('subject');
      expect(dismissed.focused,
        `focus landed on <${dismissed.focusedTag}>, not part="trigger"`).toBe(true);

      await page.evaluate(() => (window as any).matrix.mount({
        placement: 'bottom-start', noEscapeDismiss: true,
      }));
      expect((await page.evaluate(() => (window as any).matrix.press('Escape'))).open,
        'no-escape-dismiss did not survive Escape').toBe(true);
    });

  test('a reposition places the panel correctly — the MATRIX-popover-1 diagnosis',
    async () => {
      // Not a finding: this asserts the CORRECT documented placement, and it
      // passes. It is here because it is the evidence that MATRIX-popover-1 is
      // a measurement-ordering bug and nothing else — the very same
      // `position()` produces the right answer the moment the panel it measures
      // is really on screen. A `resize` is the documented reposition trigger
      // the component itself listens for.
      await page.evaluate(() => (window as any).matrix.mount({
        placement: 'bottom-end', distance: 6,
      }));
      const after = await page.evaluate(async () => {
        window.dispatchEvent(new Event('resize'));
        await (window as any).matrix.settle();
        const sr = document.getElementById('subject')!.shadowRoot!;
        const named = (name: string) => [...sr.querySelectorAll('[part]')].find(node =>
          (node.getAttribute('part') ?? '').split(/\s+/).includes(name))!;
        const anchor = named('trigger').getBoundingClientRect();
        const panel = named('panel').getBoundingClientRect();
        return {
          gap: panel.top - anchor.bottom,
          rightEdges: panel.right - anchor.right,
        };
      });
      expect(after.gap, 'after a reposition the gap is not distance=6').toBeCloseTo(6, 0);
      expect(after.rightEdges,
        'after a reposition "bottom-end" still does not flush the right edges')
        .toBeCloseTo(0, 0);
    });

  test('the trigger toggles the panel in and out of the page', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      placement: 'bottom-start', open: false,
    }));
    const opened = await page.evaluate(() => (window as any).matrix.clickTrigger());
    expect(opened.open, 'clicking the trigger did not open the panel').toBe(true);
    const boxed = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const panel = [...sr.querySelectorAll('[part]')].find(n =>
        (n.getAttribute('part') ?? '').split(/\s+/).includes('panel'))!;
      return panel.getBoundingClientRect().height;
    });
    expect(boxed, 'the opened panel has no height').toBeGreaterThan(0);
    const closed = await page.evaluate(() => (window as any).matrix.clickTrigger());
    expect(closed.open, 'clicking the trigger again did not close the panel').toBe(false);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('popover visual matrix: marquee pixels', () => {
  test('the open panel covers the page it floats over', async () => {
    // The fixture's page block is a saturated teal. The panel's own surface is
    // near-white. If the panel painted at all, a probe inside it cannot read
    // teal — and `z-index: 9999` on a `position: fixed` box is exactly the sort
    // of thing that computes correctly and still ends up under a stacking
    // context it did not expect.
    await page.evaluate(() => (window as any).matrix.mount({ placement: 'bottom-start' }));
    const [inside, outside] = await capture(
      page, '#under', 'popover-over-page',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const panel = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('panel'));
        const box = panel.getBoundingClientRect();
        return [
          { x: box.x + 4, y: box.y + 4 },
          { x: 8, y: window.innerHeight - 8 },
        ];
      }`,
    );
    expect(sameColor(inside, outside),
      `the panel painted ${inside.join(',')} — identical to the page underneath,`
      + ' so nothing was drawn on top').toBe(false);
  });

  test('`distance` is a real gap, with the page showing through it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      placement: 'bottom-start', distance: 24,
    }));
    const [gap, panelPixel, ground] = await capture(
      page, '#under', 'popover-distance-gap',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const parts = [...sr.querySelectorAll('[part]')];
        const named = n => parts.find(p =>
          (p.getAttribute('part') || '').split(/\\s+/).includes(n));
        const anchor = named('trigger').getBoundingClientRect();
        const panel = named('panel').getBoundingClientRect();
        return [
          { x: anchor.x + anchor.width / 2, y: (anchor.bottom + panel.top) / 2 },
          { x: panel.x + 4, y: panel.y + 4 },
          { x: 8, y: window.innerHeight - 8 },
        ];
      }`,
    );
    // "distance: number = 6 // px gap from trigger". A gap the panel's own
    // fill bleeds into is not a gap; the page must be visible in it. The
    // panel's documented box-shadow does reach faintly across it, and engines
    // composite that sub-1/255 tint differently (Firefox paints it as a
    // one-step darken, Chromium rounds it away) — so the claim is bounded:
    // the gap is the page's own colour within a 2/255 budget, which no
    // visible bleed, border or fill can satisfy.
    const drift = Math.max(...gap.map((c, i) => Math.abs(c - ground[i])));
    expect(drift, `the 24px gap painted ${gap.join(',')} rather than the page's`
      + ` own ${ground.join(',')}`).toBeLessThanOrEqual(2);
    expect(sameColor(panelPixel, ground),
      'the reference probe inside the panel also read as page — the capture is'
      + ' not aligned with the popover').toBe(false);
  });

  test('a closed popover paints nothing where its panel would be', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      placement: 'bottom-start', open: false,
    }));
    const pixels = await capture(
      page, '#under', 'popover-closed',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const anchor = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('trigger'))
          .getBoundingClientRect();
        // A grid over the region a bottom-start panel would occupy.
        return [10, 60, 110].flatMap(dy => [10, 90, 170].map(dx => ({
          x: anchor.x + dx, y: anchor.bottom + dy,
        })));
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `nine probes below a CLOSED popover painted ${distinct.size} different`
      + ` colours (${[...distinct].join(' | ')}) — a panel is showing`).toBe(1);
  });
});
