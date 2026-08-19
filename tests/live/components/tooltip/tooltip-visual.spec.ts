import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

// Note: the tooltip fixture is built from the component's own demo.html (the
// served page) rather than the generated full.html showcase. Tooltips render
// into a `div.snice-tooltip` portal appended to the document, not into the
// component's shadow root.
const demoPath = 'http://localhost:5566/tests/live/fixtures/tooltip/visual.html';

const openTooltip = async (
  page: import('@playwright/test').Page,
  trigger: import('@playwright/test').Locator
) => {
  await trigger.hover();
  await page.waitForFunction(() => {
    const p = document.querySelector('.snice-tooltip--visible') as HTMLElement | null;
    return !!p && p.getBoundingClientRect().width > 0;
  });
  // Let the show transition (opacity/scale, 200ms) finish.
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const portal = document.querySelector('.snice-tooltip--visible') as HTMLElement;
    const r = portal.getBoundingClientRect();
    return {
      left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      width: r.width, height: r.height,
      text: portal.textContent?.trim() ?? '',
      vw: window.innerWidth, vh: window.innerHeight
    };
  });
};

const closeTooltip = async (page: import('@playwright/test').Page) => {
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => !document.querySelector('.snice-tooltip--visible'));
};

test.describe('Snice Tooltip visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-tooltip'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-tooltip')?.shadowRoot?.querySelector('.tooltip-trigger'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Each basic position must open a readable panel that sits fully in the
  // viewport, clear of its trigger, on the requested side — or on the opposite
  // side when the requested side has no room (documented flip behaviour; the
  // "Right" demo sits close enough to the right edge to flip left).
  for (const [label, side] of [
    ['Top', 'top'], ['Bottom', 'bottom'], ['Left', 'left'], ['Right', 'right']
  ] as const) {
    test(`position="${side}" opens clear of its trigger inside the viewport`, async ({ page }) => {
      const trigger = page.getByRole('button', { name: label, exact: true });
      const box = (await trigger.boundingBox())!;
      const tip = await openTooltip(page, trigger);

      expect(tip.width).toBeGreaterThan(40);
      expect(tip.height).toBeGreaterThan(16);
      expect(tip.left).toBeGreaterThanOrEqual(0);
      expect(tip.top).toBeGreaterThanOrEqual(0);
      expect(tip.right).toBeLessThanOrEqual(tip.vw);
      expect(tip.bottom).toBeLessThanOrEqual(tip.vh);

      const overlapsTrigger = tip.right > box.x && tip.left < box.x + box.width
        && tip.bottom > box.y && tip.top < box.y + box.height;
      expect(overlapsTrigger, 'panel covers its trigger').toBe(false);

      const above = tip.bottom <= box.y + 1;
      const below = tip.top >= box.y + box.height - 1;
      const leftOf = tip.right <= box.x + 1;
      const rightOf = tip.left >= box.x + box.width - 1;
      const placed = { top: above, bottom: below, left: leftOf, right: rightOf };
      const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
      expect(placed[side] || placed[opposite[side]],
        `panel is neither ${side} nor ${opposite[side]} of the trigger`).toBe(true);
    });
  }

  // BUG: centred placements land ~2.6% of the panel width to the RIGHT of the
  // trigger centre (5px on the 190px "Top" tooltip, 10.6px on the 400px "Wide
  // Tooltip"). `updatePosition()` measures the portal with
  // getBoundingClientRect() while it still carries its hidden inline
  // `transform: scale(0.95)` — the `.snice-tooltip--visible` class that resets
  // the scale is only added afterwards — so the centring maths uses a width
  // 5% smaller than the painted panel and biases every panel right/down.
  test.fixme('centred placements are centred on their trigger', async ({ page }) => {
    for (const label of ['Top', 'Bottom']) {
      const trigger = page.getByRole('button', { name: label, exact: true });
      const box = (await trigger.boundingBox())!;
      const tip = await openTooltip(page, trigger);
      const dx = (tip.left + tip.width / 2) - (box.x + box.width / 2);
      expect(Math.abs(dx), `${label} off-centre by ${dx.toFixed(1)}px`).toBeLessThanOrEqual(2);
      await closeTooltip(page);
    }
  });

  // The edge-detection demo parks triggers in the corners of a wide box:
  // whichever way the panel flips, it must stay fully on screen and must not
  // cover its own trigger.
  test('edge-detection tooltips stay fully inside the viewport', async ({ page }) => {
    for (const label of ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']) {
      const trigger = page.getByRole('button', { name: label, exact: true });
      const box = (await trigger.boundingBox())!;
      const tip = await openTooltip(page, trigger);

      expect(tip.left, `${label} left`).toBeGreaterThanOrEqual(0);
      expect(tip.top, `${label} top`).toBeGreaterThanOrEqual(0);
      expect(tip.right, `${label} right`).toBeLessThanOrEqual(tip.vw);
      expect(tip.bottom, `${label} bottom`).toBeLessThanOrEqual(tip.vh);

      const overlapsTrigger = tip.right > box.x && tip.left < box.x + box.width
        && tip.bottom > box.y && tip.top < box.y + box.height;
      expect(overlapsTrigger, `${label} covers its trigger`).toBe(false);

      await closeTooltip(page);
    }
  });

  // max-width caps the panel's text column (content-box, plus 0.75rem side
  // padding) and forces the long copy onto several lines instead of one.
  test('max-width caps the panel and wraps long content', async ({ page }) => {
    const wide = await openTooltip(page,
      page.getByRole('button', { name: 'Wide Tooltip', exact: true }));
    expect(wide.width).toBeLessThanOrEqual(400 + 24);
    expect(wide.width).toBeGreaterThan(200);
    expect(wide.height).toBeGreaterThan(35); // wrapped onto 2+ lines
    expect(wide.right).toBeLessThanOrEqual(wide.vw);
    expect(wide.left).toBeGreaterThanOrEqual(0);
  });
});
