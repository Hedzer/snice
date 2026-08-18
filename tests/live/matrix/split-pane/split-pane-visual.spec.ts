/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-split-pane TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/split-pane, `npm run test:matrix`) owns
 * structure truth: the four documented parts, the slot names, the divider's
 * separator semantics, the clamping arithmetic, the `pane-resize` payload, and
 * the keyboard paths. It cannot own the thing the component exists to do,
 * because a split pane IS a layout — `flex-direction`, a percentage width or
 * height, and a divider with a real grabbable box — and happy-dom performs no
 * layout, so every box there reads 0.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the primary pane really occupies `primarySize`% of the container along
 *     the documented axis, and the secondary pane really takes the rest;
 *   · `direction` really chooses the axis: horizontal splits left/right,
 *     vertical splits top/bottom, and the OTHER axis is full-bleed;
 *   · the divider really sits between the two panes, with a non-zero box and
 *     the documented resize affordance (`col-resize` / `row-resize`, or
 *     `default` when disabled);
 *   · the two panes and the divider never overlap and never overflow the host;
 *   · nothing occludes either pane at its centre.
 *
 * ── Layer 1b: the mouse (the input the DOM tier structurally cannot have) ───
 *   Real pointer drags on the divider: the pane follows the pointer, stops at
 *   both documented minimums, lands on the `snap-size` grid, and does nothing
 *   at all while `disabled`.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A pane that "has a box" can still be painted nowhere. The marquee captures
 *   decode the PNG inside the browser under test and assert that the pixels
 *   either side of the split really are the two panes' own colours, and — for
 *   the standing finding — that the default split pane's divider is a zero-width
 *   seam rather than the grabbable bar the stylesheet describes.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/split-pane/matrix.html';

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 500;

interface Combo {
  id: string;
  direction: 'horizontal' | 'vertical';
  primarySize: number;
  minPrimarySize: number;
  minSecondarySize: number;
  snapSize: number;
  disabled: boolean;
  stageWidth: number;
  stageHeight: number;
}

/**
 * The cross: direction (2) x primarySize (4) x disabled (2) = 16 combos, with
 * the two minimums and `snapSize` rotated across them so each is exercised at
 * both directions without multiplying the product. Sized to a component with
 * six properties, one event and one moving part.
 */
function generateCombos(): Combo[] {
  const minPairs: Array<[number, number]> = [[10, 10], [25, 25], [0, 40], [40, 0]];
  const snaps = [0, 10, 25, 0];
  const combos: Combo[] = [];
  let n = 0;
  for (const direction of ['horizontal', 'vertical'] as const) {
    for (const primarySize of [15, 30, 50, 85]) {
      for (const disabled of [false, true]) {
        const [minPrimarySize, minSecondarySize] = minPairs[n % minPairs.length];
        const snapSize = snaps[n % snaps.length];
        combos.push({
          id: `direction=${direction}/primary=${primarySize}/disabled=${disabled}`
            + `/[min:${minPrimarySize}+${minSecondarySize},snap:${snapSize}]`,
          direction, primarySize, minPrimarySize, minSecondarySize, snapSize, disabled,
          stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT,
        });
        n++;
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
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const primary = sr.querySelector('[part~="primary"]') as HTMLElement | null;
    const divider = sr.querySelector('[part~="divider"]') as HTMLElement | null;
    const secondary = sr.querySelector('[part~="secondary"]') as HTMLElement | null;
    if (!primary || !divider || !secondary) {
      say('a documented part is missing from the shadow root');
      return problems;
    }

    const hostBox = host.getBoundingClientRect();
    const primaryBox = primary.getBoundingClientRect();
    const dividerBox = divider.getBoundingClientRect();
    const secondaryBox = secondary.getBoundingClientRect();
    const horizontal = combo.direction === 'horizontal';

    if (getComputedStyle(host).visibility !== 'visible') say('host is not visible');
    if (hostBox.width < 1 || hostBox.height < 1) {
      say(`host box is ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── `direction` chooses the axis ──────────────────────────────────────
    // Documented: primary is "left or top", secondary "right or bottom". So
    // along the split axis the three boxes are ordered and disjoint, and across
    // it every one of them spans the whole host.
    const start = (box: DOMRect) => (horizontal ? box.left : box.top);
    const end = (box: DOMRect) => (horizontal ? box.right : box.bottom);
    const along = (box: DOMRect) => (horizontal ? box.width : box.height);
    const across = (box: DOMRect) => (horizontal ? box.height : box.width);

    if (start(primaryBox) < start(hostBox) - EPS) say('the primary pane starts before the host');
    if (start(dividerBox) < end(primaryBox) - EPS) {
      say(`the divider starts at ${start(dividerBox).toFixed(1)}, before the primary pane ends`
        + ` at ${end(primaryBox).toFixed(1)} — the divider is documented as sitting between them`);
    }
    if (start(secondaryBox) < end(dividerBox) - EPS) {
      say(`the secondary pane starts at ${start(secondaryBox).toFixed(1)}, before the divider ends`
        + ` at ${end(dividerBox).toFixed(1)}`);
    }
    if (end(secondaryBox) > end(hostBox) + EPS) say('the secondary pane overflows the host');

    for (const [name, box] of [['primary', primaryBox], ['divider', dividerBox],
      ['secondary', secondaryBox]] as const) {
      if (Math.abs(across(box) - across(hostBox)) > EPS) {
        say(`the ${name} spans ${across(box).toFixed(1)} across the split,`
          + ` not the host's ${across(hostBox).toFixed(1)} —`
          + ` a ${combo.direction} split is full-bleed on the other axis`);
      }
    }

    // ── `primarySize` is a real percentage of the container ───────────────
    // Documented: "primarySize: number = 50; // percentage". Measured against
    // the host box, which is the container the two panes divide.
    const measured = (along(primaryBox) / along(hostBox)) * 100;
    if (Math.abs(measured - combo.primarySize) > 0.6) {
      say(`the primary pane occupies ${measured.toFixed(2)}% of the container,`
        + ` documented ${combo.primarySize}%`);
    }
    // And the secondary really takes what is left, minus the divider itself.
    const remainder = along(hostBox) - along(primaryBox) - along(dividerBox);
    if (Math.abs(along(secondaryBox) - remainder) > EPS) {
      say(`the secondary pane is ${along(secondaryBox).toFixed(1)}px,`
        + ` but ${remainder.toFixed(1)}px is left over`);
    }

    // ── The divider is a real, grabbable bar ──────────────────────────────
    // Documented as the "Draggable divider bar" with a "Visual handle inside".
    // A bar with no thickness cannot be pointed at, whatever the DOM says.
    if (along(dividerBox) < 1) {
      say(`the divider is ${along(dividerBox).toFixed(2)}px thick along the split —`
        + ' a draggable divider needs a box to grab');
    }
    const cursor = getComputedStyle(divider).cursor;
    const wantCursor = combo.disabled ? 'default' : (horizontal ? 'col-resize' : 'row-resize');
    if (cursor !== wantCursor) {
      say(`divider cursor is "${cursor}", documented ${combo.disabled
        ? 'a disabled pane (no resize affordance)' : `a ${combo.direction} resize`}`
        + ` -> "${wantCursor}"`);
    }
    const handle = sr.querySelector('[part~="handle"]') as HTMLElement | null;
    if (!handle) {
      say('no [part~="handle"]');
    } else {
      const handleBox = handle.getBoundingClientRect();
      if (handleBox.width < 1 || handleBox.height < 1) {
        say(`the handle box is ${handleBox.width.toFixed(1)}x${handleBox.height.toFixed(1)}`);
      }
      const centre = { x: dividerBox.x + dividerBox.width / 2, y: dividerBox.y + dividerBox.height / 2 };
      const handleCentre = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
      if (Math.abs(centre.x - handleCentre.x) > 1 || Math.abs(centre.y - handleCentre.y) > 1) {
        say('the handle is not centred in the divider it lives inside');
      }
    }

    // ── Nothing overlaps ──────────────────────────────────────────────────
    const boxes: Array<[string, DOMRect]> = [
      ['primary', primaryBox], ['divider', dividerBox], ['secondary', secondaryBox],
    ];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [an, a] = boxes[i];
        const [bn, b] = boxes[j];
        if (a.left < b.right - EPS && a.right > b.left + EPS
          && a.top < b.bottom - EPS && a.bottom > b.top + EPS) {
          say(`${an} and ${bn} overlap`);
        }
      }
    }

    // ── The slotted content is where its pane is ──────────────────────────
    for (const slot of ['primary', 'secondary'] as const) {
      const content = host.querySelector(`[slot="${slot}"]`) as HTMLElement;
      const box = content.getBoundingClientRect();
      const paneBox = slot === 'primary' ? primaryBox : secondaryBox;
      if (box.width < 1 || box.height < 1) {
        say(`the ${slot} slot's content has a ${box.width}x${box.height} box`);
        continue;
      }
      if (box.left < paneBox.left - EPS || box.right > paneBox.right + EPS
        || box.top < paneBox.top - EPS || box.bottom > paneBox.bottom + EPS) {
        say(`the ${slot} slot's content is not inside its own pane`);
      }
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight) {
        const hit = document.elementFromPoint(x, y);
        if (hit !== content && !content.contains(hit)) {
          say(`the ${slot} pane's content hit-tests as`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>, not itself`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('split-pane visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.direction).toBe(combo.direction);
      expect(mounted.primarySize).toBe(combo.primarySize);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 1b: the mouse ─────────────────────────────────────────────────────
//
// "Mouse, touch, and keyboard input supported" is a documented claim the DOM
// tier can only test two thirds of: a drag is a sequence of real pointer events
// against a real box, and happy-dom has neither.

/** Drag the divider by `dx`/`dy` viewport pixels and return the resulting size. */
async function dragDivider(dx: number, dy: number): Promise<number> {
  const centre = await page.evaluate(() => (window as any).matrix.dividerCentre());
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  await page.mouse.move(centre.x + dx, centre.y + dy, { steps: 8 });
  await page.mouse.up();
  return page.evaluate(() => (window as any).matrix.primarySize());
}

test.describe('split-pane visual matrix: dragging the divider', () => {
  for (const direction of ['horizontal', 'vertical'] as const) {
    const along = direction === 'horizontal' ? STAGE_WIDTH : STAGE_HEIGHT;

    test(`${direction}: the pane follows the pointer`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        direction, primarySize: 50, minPrimarySize: 0, minSecondarySize: 0, snapSize: 0,
        disabled: false, stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT,
      } as any);
      await page.evaluate(() => (window as any).matrix.record());

      // A tenth of the container, in the direction that grows the primary pane.
      const step = Math.round(along / 10);
      const after = await dragDivider(
        direction === 'horizontal' ? step : 0,
        direction === 'horizontal' ? 0 : step,
      );

      expect(after, `dragging +${step}px of a ${along}px container should add ~10%`)
        .toBeGreaterThan(58);
      expect(after).toBeLessThan(62);

      const resizes = await page.evaluate(() => (window as any).matrix.resizes());
      expect(resizes.length, 'a drag emits pane-resize').toBeGreaterThan(0);
      const last = resizes[resizes.length - 1];
      expect(last.primarySize + last.secondarySize).toBe(100);
    });

    test(`${direction}: a drag stops at both documented minimums`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        direction, primarySize: 50, minPrimarySize: 20, minSecondarySize: 30, snapSize: 0,
        disabled: false, stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT,
      } as any);

      const floor = await dragDivider(
        direction === 'horizontal' ? -along : 0,
        direction === 'horizontal' ? 0 : -along,
      );
      expect(floor, 'minPrimarySize is the floor').toBe(20);

      const ceiling = await dragDivider(
        direction === 'horizontal' ? along : 0,
        direction === 'horizontal' ? 0 : along,
      );
      expect(ceiling, 'minSecondarySize is the ceiling').toBe(70);
    });

    test(`${direction}: snap-size lands the drag on the grid`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        direction, primarySize: 50, minPrimarySize: 0, minSecondarySize: 0, snapSize: 10,
        disabled: false, stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT,
      } as any);

      // Deliberately an awkward distance: ~13% of the container, which lands
      // nowhere near a multiple of 10 unless the snap grid is real.
      const step = Math.round(along * 0.13);
      const after = await dragDivider(
        direction === 'horizontal' ? step : 0,
        direction === 'horizontal' ? 0 : step,
      );
      expect(after % 10, `snap-size="10" produced ${after}`).toBe(0);
    });

    test(`${direction}: a disabled divider does not drag`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        direction, primarySize: 40, minPrimarySize: 10, minSecondarySize: 10, snapSize: 0,
        disabled: true, stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT,
      } as any);
      await page.evaluate(() => (window as any).matrix.record());

      const after = await dragDivider(
        direction === 'horizontal' ? 200 : 0,
        direction === 'horizontal' ? 0 : 200,
      );
      expect(after, 'a disabled split pane moved').toBe(40);
      expect(await page.evaluate(() => (window as any).matrix.resizes())).toEqual([]);
    });
  }
});

// ── MATRIX-split-pane-3 in a real browser (fixed) ────────────────────────────
//
// Combo:    `<snice-split-pane>` with nothing but its two slotted panes.
// Expected: the divider is the documented "Draggable divider bar" —
//           `:host([direction="horizontal"]) .divider { width: 0.25rem;
//           cursor: col-resize }` — so it has a 4px box and a resize cursor.
// Fixed:    the component reflects the effective default `direction` at ready,
//           so the `:host([direction="…"])` rules always have an attribute to
//           match and the divider is grabbable on the headline example.
test.describe('split-pane visual matrix: the standing finding', () => {
  test('MATRIX-split-pane-3 (fixed): the default split pane has a grabbable divider', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      bare: true, stageWidth: 800, stageHeight: 500,
    }));
    const divider = await page.evaluate(() => (window as any).matrix.dividerCentre());
    expect(divider.width, 'the divider has no width to grab').toBeGreaterThan(1);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the primary pane's box is 30% wide" and "30% of the pixels are
// the primary pane's colour" are different claims.

test.describe('split-pane visual matrix: marquee pixels', () => {
  test('a horizontal split paints the primary pane left of the divider', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      direction: 'horizontal', primarySize: 30, minPrimarySize: 10, minSecondarySize: 10,
      snapSize: 0, disabled: false, stageWidth: 800, stageHeight: 500,
    }));
    // Three probes: just inside the primary pane, just inside the secondary
    // pane, and the pane colours must be the two the fixture painted.
    const [left, right] = await capture(
      page, '#subject', 'split-pane-horizontal',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.15, y: box.y + box.height / 2 },
          { x: box.x + box.width * 0.65, y: box.y + box.height / 2 },
        ];
      }`,
    );
    expect(left[2] > left[0] + 40, `primary pane painted rgb(${left.join(',')}), not blue`).toBe(true);
    expect(right[0] > right[2] + 40, `secondary pane painted rgb(${right.join(',')}), not orange`).toBe(true);
    expect(sameColor(left, right), 'both sides of the split painted the same colour').toBe(false);
  });

  test('a vertical split paints the primary pane above the divider', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      direction: 'vertical', primarySize: 70, minPrimarySize: 10, minSecondarySize: 10,
      snapSize: 0, disabled: false, stageWidth: 800, stageHeight: 500,
    }));
    const [top, bottom] = await capture(
      page, '#subject', 'split-pane-vertical',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height * 0.35 },
          { x: box.x + box.width / 2, y: box.y + box.height * 0.85 },
        ];
      }`,
    );
    expect(top[2] > top[0] + 40, `top pane painted rgb(${top.join(',')}), not blue`).toBe(true);
    expect(bottom[0] > bottom[2] + 40, `bottom pane painted rgb(${bottom.join(',')}), not orange`).toBe(true);
  });

  test('the divider is painted as its own bar, not as either pane', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      direction: 'horizontal', primarySize: 50, minPrimarySize: 10, minSecondarySize: 10,
      snapSize: 0, disabled: false, stageWidth: 800, stageHeight: 500,
    }));
    const [primary, seam, secondary] = await capture(
      page, '#subject', 'split-pane-divider',
      `(host) => {
        const box = host.getBoundingClientRect();
        const divider = host.shadowRoot.querySelector('[part~="divider"]').getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.25, y: box.y + box.height / 2 },
          { x: divider.x + divider.width / 2, y: divider.y + divider.height / 2 },
          { x: box.x + box.width * 0.75, y: box.y + box.height / 2 },
        ];
      }`,
    );
    expect(sameColor(seam, primary),
      `the divider painted the primary pane's colour rgb(${seam.join(',')})`).toBe(false);
    expect(sameColor(seam, secondary),
      `the divider painted the secondary pane's colour rgb(${seam.join(',')})`).toBe(false);
  });
});
