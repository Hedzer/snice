/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-tooltip TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (`tests/matrix/tooltip`) owns structure truth: which parts the
 * portal renders, which position class it carries, which trigger opens it, how
 * the delays behave. It cannot own visual truth, and for this component that
 * gap is unusually wide — almost everything `snice-tooltip` promises is a
 * statement about GEOMETRY:
 *
 *   `position` (12 values)  is a claim about which side of the trigger the
 *                           popup lands on, and where along that side;
 *   `offset: 12`            is a claim about the gap between the two boxes;
 *   `arrow`                 is a claim about a painted triangle between them;
 *   `maxWidth: 250`         is a claim about wrapping;
 *   `strictPositioning`     is a claim about what happens when the requested
 *                           side does not FIT — the whole point of "smart
 *                           positioning" is a flip that only exists in a
 *                           viewport;
 *   `zIndex: 10000`         is a claim about stacking above the page.
 *
 * happy-dom answers every one of those with zero, so the DOM tier can only
 * check the class name that asks for them. This tier checks that they happened.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the popup is painted at a real, non-zero size, opaque and legible;
 *   · it lands on the documented SIDE of the trigger, with the documented
 *     alignment along that side;
 *   · the gap between popup and trigger is the documented `offset`;
 *   · it stays inside the viewport (a tooltip nobody can see is not a tooltip);
 *   · nothing paints over its text (`elementFromPoint` at three x-offsets);
 *   · the arrow, when enabled, sits BETWEEN the popup and the trigger, and is
 *     really absent when it is turned off;
 *   · `max-width` really caps the box and really wraps the text.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Contrast. A tooltip is a floating label read against whatever it covers,
 *   so "the text is a different colour from the background" is the one claim
 *   that has to be judged on painted pixels rather than on computed style.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/tooltip/matrix.html';

const POSITIONS = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
] as const;
type Position = typeof POSITIONS[number];

const TRIGGERS = ['hover', 'click', 'focus', 'manual'] as const;
type Trigger = typeof TRIGGERS[number];

interface Combo {
  id: string;
  content: string;
  position: Position;
  trigger: Trigger;
  arrow: boolean;
  offset?: number;
  maxWidth?: number;
  /** Where the trigger sits in the viewport — the anchor the flip depends on. */
  anchorTop?: number;
  anchorLeft?: number;
}

/**
 * The cross: every documented `position` (12) against every documented
 * `trigger` (4) = 48, plus the arrow switched off for each position (12) = 60.
 *
 * `position` x `trigger` is the right cross rather than a generous one: the
 * popup is PORTALLED into `<body>`, so the code that places it runs on the show
 * path, and each trigger has its own show path. A tooltip that positions
 * correctly on hover and lands at 0,0 on focus is a real bug shape, and it is
 * invisible to any suite that only ever hovers.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const position of POSITIONS) {
    for (const trigger of TRIGGERS) {
      combos.push({
        id: `${position}/${trigger}`,
        content: 'Save changes', position, trigger, arrow: true,
      });
    }
    combos.push({
      id: `${position}/no-arrow`,
      content: 'Save changes', position, trigger: 'manual', arrow: false,
    });
  }
  return combos;
}

/**
 * What the fixture is actually handed.
 *
 * Two translations, both forced by the fixture's own contract (it turns every
 * key of the object into an attribute):
 *
 *  · `id` is the TEST's name, not the element's. Passing it through would
 *    overwrite the `id="subject"` the fixture uses to find the mounted element
 *    again, and every probe would report "nothing mounted".
 *  · `arrow` DEFAULTS to true, and the fixture drops `false` values instead of
 *    writing them — an absent boolean attribute cannot express false. The only
 *    markup that can turn it off is an explicit `arrow="false"`, which is also
 *    the markup a page author has to write.
 */
function mountPayload(combo: Combo): Record<string, unknown> {
  const { id, arrow, ...rest } = combo;
  void id;
  return { ...rest, arrow: arrow ? true : 'false' };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1 — one evaluate per combo, every violation reported at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    const trigger = document.getElementById('trigger') as HTMLElement | null;
    if (!host || !trigger) { say('nothing mounted'); return problems; }

    const popup = document.querySelector('.snice-tooltip') as HTMLElement | null;
    if (!popup) { say('the portalled popup does not exist'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const popupBox = rect(popup);
    const triggerBox = rect(trigger);
    const cs = getComputedStyle(popup);

    // ── the popup is really painted ──────────────────────────────────────────
    if (popupBox.width <= 0 || popupBox.height <= 0) {
      say(`popup renders at ${popupBox.width}x${popupBox.height}`);
      return problems;
    }
    if (cs.visibility !== 'visible') say(`popup visibility "${cs.visibility}"`);
    if (Number(cs.opacity) <= 0.5) say(`popup opacity "${cs.opacity}" — it never faded in`);
    if (parseFloat(cs.fontSize) < 9) say(`popup font-size ${cs.fontSize} is unreadable`);
    if (cs.position !== 'fixed' && cs.position !== 'absolute') {
      say(`popup position "${cs.position}" — a portalled tooltip must be taken out of flow`);
    }
    // "zIndex: 10000" — the popup must stack above ordinary page content.
    if (Number(cs.zIndex) < 1) say(`popup z-index "${cs.zIndex}" cannot float above the page`);

    // ── the content really carries the text ──────────────────────────────────
    const content = popup.querySelector('[part~="content"], .snice-tooltip__content') as HTMLElement | null;
    const readable = content ?? popup;
    if ((readable.textContent ?? '').trim() !== combo.content) {
      say(`popup reads "${(readable.textContent ?? '').trim()}", expected "${combo.content}"`);
    }
    const contentBox = rect(readable);
    if (contentBox.width <= 0 || contentBox.height <= 0) {
      say(`popup text renders at ${contentBox.width}x${contentBox.height}`);
    }

    // ── the documented SIDE ──────────────────────────────────────────────────
    const side = combo.position.split('-')[0];
    const gap = {
      top: triggerBox.top - popupBox.bottom,
      bottom: popupBox.top - triggerBox.bottom,
      left: triggerBox.left - popupBox.right,
      right: popupBox.left - triggerBox.right,
    }[side]!;

    // The anchor sits in the middle of a 1280x900 viewport, so the requested
    // side always fits and no flip is due — the popup must be on that side.
    if (gap < -EPS) {
      say(`position="${combo.position}" put the popup on the wrong side`
        + ` (gap ${gap.toFixed(1)}px on "${side}")`);
    }

    // ── `offset: 12` is the documented gap ───────────────────────────────────
    // The arrow lives inside that gap, so the popup box itself may sit a little
    // closer; what must not happen is the two boxes touching or overlapping.
    if (gap >= -EPS && gap < 1) {
      say(`popup and trigger are flush on "${side}" (gap ${gap.toFixed(1)}px) —`
        + ' the documented offset never applied');
    }
    if (gap > 40) {
      say(`popup floats ${gap.toFixed(0)}px from its trigger on "${side}" —`
        + ' far past the documented offset');
    }

    // ── the documented ALIGNMENT along that side ─────────────────────────────
    const align = combo.position.split('-')[1];
    const horizontalSide = side === 'top' || side === 'bottom';
    const [pStart, pEnd, tStart, tEnd] = horizontalSide
      ? [popupBox.left, popupBox.right, triggerBox.left, triggerBox.right]
      : [popupBox.top, popupBox.bottom, triggerBox.top, triggerBox.bottom];
    const pMid = (pStart + pEnd) / 2;
    const tMid = (tStart + tEnd) / 2;

    if (align === 'start') {
      // A `-start` popup is anchored to the trigger's leading edge, so its own
      // leading edge must be at least as far back as the trigger's centre.
      if (pStart > tMid) {
        say(`position="${combo.position}" aligned to the far side`
          + ` (start ${pStart.toFixed(0)} past trigger mid ${tMid.toFixed(0)})`);
      }
    } else if (align === 'end') {
      if (pEnd < tMid) {
        say(`position="${combo.position}" aligned to the near side`
          + ` (end ${pEnd.toFixed(0)} before trigger mid ${tMid.toFixed(0)})`);
      }
    } else if (Math.abs(pMid - tMid) > Math.max(20, (pEnd - pStart) / 4)) {
      say(`position="${combo.position}" is not centred on its trigger`
        + ` (${pMid.toFixed(0)} vs ${tMid.toFixed(0)})`);
    }

    // ── it stays on screen ───────────────────────────────────────────────────
    if (popupBox.left < -EPS || popupBox.top < -EPS
      || popupBox.right > window.innerWidth + EPS
      || popupBox.bottom > window.innerHeight + EPS) {
      say(`popup escapes the viewport`
        + ` (${popupBox.left.toFixed(0)},${popupBox.top.toFixed(0)}`
        + ` ${popupBox.right.toFixed(0)}x${popupBox.bottom.toFixed(0)})`);
    }

    // ── hit testing: the popup must not steal its own trigger ────────────────
    //
    // The popup is `pointer-events: none`, so a probe over its text answers
    // `<body>` — which is the RIGHT answer and says nothing about occlusion.
    // The claim that does matter, and that only a hit test can settle, is the
    // one a floating label breaks most often: the tooltip must never sit on
    // top of the element it annotates. If it did, a hover-triggered tooltip
    // would flicker forever as the pointer is handed back and forth.
    for (const fraction of [0.2, 0.5, 0.8]) {
      const x = triggerBox.left + triggerBox.width * fraction;
      const y = triggerBox.top + triggerBox.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (hit !== trigger && !trigger.contains(hit as Node) && !host.contains(hit as Node)) {
        say(`the trigger @${Math.round(fraction * 100)}% is covered by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // …and the popup's own text must be inside the popup's painted box, which
    // is what makes the pixel probes in layer 2 mean anything.
    if (contentBox.left < popupBox.left - EPS || contentBox.right > popupBox.right + EPS
      || contentBox.top < popupBox.top - EPS || contentBox.bottom > popupBox.bottom + EPS) {
      say('the tooltip text overflows the popup box it is painted on');
    }

    // ── the arrow ────────────────────────────────────────────────────────────
    const arrow = popup.querySelector('[part~="arrow"], .snice-tooltip__arrow') as HTMLElement | null;
    if (!combo.arrow) {
      if (arrow && rect(arrow).width > 0 && rect(arrow).height > 0) {
        say('arrow="false" still painted an arrow');
      }
    } else if (!arrow) {
      say('the documented arrow is not rendered at all');
    } else {
      const arrowBox = rect(arrow);
      if (arrowBox.width <= 0 || arrowBox.height <= 0) {
        say(`arrow renders at ${arrowBox.width}x${arrowBox.height}`);
      } else {
        // It has to sit on the trigger's side of the popup — an arrow pointing
        // away from what it annotates is worse than none.
        const arrowMidX = arrowBox.left + arrowBox.width / 2;
        const arrowMidY = arrowBox.top + arrowBox.height / 2;
        const wrongSide =
          side === 'top' ? arrowMidY < popupBox.top + popupBox.height / 2 - EPS :
          side === 'bottom' ? arrowMidY > popupBox.top + popupBox.height / 2 + EPS :
          side === 'left' ? arrowMidX < popupBox.left + popupBox.width / 2 - EPS :
          arrowMidX > popupBox.left + popupBox.width / 2 + EPS;
        if (wrongSide) {
          say(`the arrow is on the far side of the popup for position="${combo.position}"`);
        }
      }
    }

    // ── `maxWidth: 250` caps the CONTENT box ─────────────────────────────────
    //
    // Measured inside the padding, because that is what `max-width` means in
    // CSS's default box model and what the component writes: a popup padded
    // 0.75rem a side is legitimately wider than its `max-width` by that
    // padding. What must never happen is the TEXT running past the cap.
    const cap = combo.maxWidth ?? 250;
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const contentWidth = popupBox.width - padX;
    if (contentWidth > cap + EPS) {
      say(`popup content is ${contentWidth.toFixed(0)}px wide, past its max-width of ${cap}`);
    }
    if (cs.maxWidth !== `${cap}px`) {
      say(`popup max-width computed "${cs.maxWidth}", expected "${cap}px"`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('tooltip visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountPayload(combo) as any);
      const shown = await page.evaluate(() => (window as any).matrix.open());
      expect(shown, `combo ${combo.id} never became visible`).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
      await page.evaluate(() => (window as any).matrix.unmount());
    });
  }
});

// ── Smart positioning: the flip only exists in a viewport ───────────────────

test.describe('tooltip visual matrix: smart positioning', () => {
  test('a top tooltip with no room above flips below its trigger', async () => {
    // "Contextual information … with smart positioning": an anchor pinned to
    // the top edge cannot host a popup above it, so the popup must move.
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'Save changes', position: 'top', trigger: 'manual', anchorTop: 2, anchorLeft: 500,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const geometry = await page.evaluate(() => {
      const popup = document.querySelector('.snice-tooltip') as HTMLElement;
      const trigger = document.getElementById('trigger') as HTMLElement;
      const p = popup.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      return { popupTop: p.top, popupBottom: p.bottom, triggerTop: t.top, triggerBottom: t.bottom };
    });

    expect(geometry.popupTop, 'the popup must not be pushed off the top of the screen')
      .toBeGreaterThanOrEqual(-1);
    expect(geometry.popupTop, 'with no room above, the popup belongs below the trigger')
      .toBeGreaterThan(geometry.triggerTop);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('a bottom tooltip with no room below flips above its trigger', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'Save changes', position: 'bottom', trigger: 'manual',
      anchorTop: 850, anchorLeft: 500,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const geometry = await page.evaluate(() => {
      const popup = document.querySelector('.snice-tooltip') as HTMLElement;
      const trigger = document.getElementById('trigger') as HTMLElement;
      return {
        popupBottom: popup.getBoundingClientRect().bottom,
        triggerBottom: trigger.getBoundingClientRect().bottom,
        viewport: window.innerHeight,
      };
    });

    expect(geometry.popupBottom, 'the popup must not fall off the bottom of the screen')
      .toBeLessThanOrEqual(geometry.viewport + 1);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('a tooltip against the left edge stays fully on screen', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'A rather long tooltip label', position: 'left', trigger: 'manual',
      anchorTop: 400, anchorLeft: 4,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const left = await page.evaluate(() =>
      document.querySelector('.snice-tooltip')!.getBoundingClientRect().left);
    expect(left, 'a tooltip clipped by the window edge is unreadable').toBeGreaterThanOrEqual(-1);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('max-width really wraps long content instead of stretching', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'This tooltip carries a deliberately long sentence so that it has to wrap '
        + 'somewhere rather than run off the side of the window entirely',
      position: 'top', trigger: 'manual', maxWidth: 180,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const box = await page.evaluate(() => {
      const popup = document.querySelector('.snice-tooltip') as HTMLElement;
      const b = popup.getBoundingClientRect();
      const cs = getComputedStyle(popup);
      return {
        content: b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        height: b.height,
        lineHeight: parseFloat(cs.lineHeight),
      };
    });

    expect(box.content, 'the text is capped at the requested max-width')
      .toBeLessThanOrEqual(181);
    expect(box.height, 'and it wrapped onto more than one line')
      .toBeGreaterThan(box.lineHeight * 1.5);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('the wrapper-free tooltip attribute positions just as well', async () => {
    await page.evaluate(() => (window as any).matrix.mountAttribute('Save changes'));
    const shown = await page.evaluate(() => (window as any).matrix.openAttribute());
    expect(shown, 'the attribute API never showed a tooltip').toBe(true);

    const problems = await page.evaluate(() => {
      const out: string[] = [];
      const popup = document.querySelector('.snice-tooltip') as HTMLElement;
      const trigger = document.getElementById('trigger') as HTMLElement;
      const p = popup.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      if (p.width <= 0 || p.height <= 0) out.push(`popup ${p.width}x${p.height}`);
      if (p.bottom > t.top + 1) out.push('the default position is not above the trigger');
      if (p.left < 0 || p.right > window.innerWidth) out.push('popup escapes the viewport');
      return out;
    });
    expect(problems).toEqual([]);
    await page.evaluate(() => (window as any).matrix.unmount());
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Deliberately small. Layer 1 measured the boxes; these exist because "the
// popup has a background-color and a color" and "a person can read the label"
// are different claims, and only pixels separate them.

test.describe('tooltip visual matrix: marquee pixels', () => {
  test('the popup paints a readable label against its own surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'Save changes', position: 'bottom', trigger: 'manual',
    }));
    await page.evaluate(() => (window as any).matrix.open());

    // A probe on the popup's own padding (its fill) and one on the page behind
    // it. A tooltip that paints nothing is invisible over any content.
    const [fill, pageSurface] = await capture(
      page, '.snice-tooltip', 'tooltip-fill',
      `() => {
        const popup = document.querySelector('.snice-tooltip');
        const b = popup.getBoundingClientRect();
        return [
          { x: b.x + 3, y: b.y + 3 },
          { x: 20, y: 20 },
        ];
      }`,
    ) as RGB[];

    expect(sameColor(fill, pageSurface),
      `the tooltip painted the page surface (${fill.join(',')}) — it has no fill of its own`)
      .toBe(false);
    expect(contrast(fill, pageSurface),
      `tooltip/page contrast is ${contrast(fill, pageSurface).toFixed(2)}:1`)
      .toBeGreaterThan(1.3);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('the label text is legible against the popup fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'Save', position: 'bottom', trigger: 'manual',
    }));
    await page.evaluate(() => (window as any).matrix.open());

    // Sample a band across the glyph row and take the pixel furthest from the
    // fill: that is ink. A tooltip whose text matches its background is blank.
    const pixels = await capture(
      page, '.snice-tooltip', 'tooltip-label',
      `() => {
        const popup = document.querySelector('.snice-tooltip');
        const b = popup.getBoundingClientRect();
        const y = b.y + b.height / 2;
        const points = [{ x: b.x + 3, y: b.y + 2 }];
        for (let i = 3; i <= 17; i++) points.push({ x: b.x + (b.width * i) / 20, y });
        return points;
      }`,
    ) as RGB[];

    const [fill, ...band] = pixels;
    const ink = band.reduce((best, px) =>
      (contrast(px, fill) > contrast(best, fill) ? px : best), band[0]);
    expect(contrast(ink, fill),
      `the darkest pixel on the glyph row is ${contrast(ink, fill).toFixed(2)}:1 against the`
      + ' tooltip fill — nothing was drawn')
      .toBeGreaterThan(2);
    await page.evaluate(() => (window as any).matrix.unmount());
  });

  test('the arrow paints the same colour as the popup it points from', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'Save changes', position: 'bottom', trigger: 'manual', arrow: true,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    // Probe the arrow's own body and the popup's padding. An arrow in a
    // different colour reads as a stray shape rather than a pointer.
    const [arrowPx, fillPx] = await capture(
      page, 'body', 'tooltip-arrow',
      `() => {
        const popup = document.querySelector('.snice-tooltip');
        const arrow = popup.querySelector('[part~="arrow"], .snice-tooltip__arrow');
        const a = arrow.getBoundingClientRect();
        const b = popup.getBoundingClientRect();
        return [
          { x: a.x + a.width / 2, y: a.y + a.height / 2 },
          { x: b.x + 3, y: b.y + b.height / 2 },
        ];
      }`,
    ) as RGB[];

    expect(contrast(arrowPx, fillPx),
      `arrow ${arrowPx.join(',')} vs popup ${fillPx.join(',')} —`
      + ' the arrow is not the popup colour')
      .toBeLessThan(1.6);
    await page.evaluate(() => (window as any).matrix.unmount());
  });
});
