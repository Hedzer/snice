import { test, expect } from '@playwright/test';

// Where the event overlays actually LAND and whether they actually PAINT.
//
// `snice-calendar`'s host declares `contain: layout style`. Layout containment
// makes the host the containing block for `position: fixed` descendants and
// turns it into a stacking context, so the overlays used to be placed a whole
// host-offset down the page (≈250px below the calendar, on top of the next
// section) and the one that got there could be painted over by the next
// section's own contained host — present in the DOM, `visibility: visible`,
// and invisible on screen. Only real layout can catch either half, so this
// lives here instead of the happy-dom suite.

const demoPath = '/components/calendar/demo.html';

/** Adjacency budget between a bar and its overlay, in px. */
const GAP = 8;

/**
 * Walks `elementFromPoint` down through shadow roots and reports whether the
 * element painted at that point is (inside) the calendar's popover.
 */
async function popoverPaintsAt(page: import('@playwright/test').Page, x: number, y: number) {
  return page.evaluate(({ x, y }) => {
    let el = document.elementFromPoint(x, y) as Element | null;
    const chain: string[] = [];
    while (el) {
      chain.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''));
      const inner = (el as Element & { shadowRoot: ShadowRoot | null }).shadowRoot?.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return { hit: !!el?.closest('.calendar__popover'), chain };
  }, { x, y });
}

test.describe('Snice Calendar overlay anchoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
    await page.waitForFunction(() => {
      const cal = document.getElementById('cal-popover') as any;
      return !!cal?.shadowRoot?.querySelector('.calendar__event-bar');
    });
  });

  /** Clicks the named bar of the popover showcase and returns both boxes. */
  async function openPopover(page: import('@playwright/test').Page, title: string) {
    const bar = page.locator(`#cal-popover .calendar__event-bar:has-text("${title}")`).first();
    await bar.scrollIntoViewIfNeeded();
    await bar.click();

    const popover = page.locator('#cal-popover .calendar__popover');
    await expect(popover).toBeVisible();
    // Lazily-provided content replaces the loading shell; wait it out so the
    // final size is what gets measured.
    await expect(popover).not.toContainText('Loading');

    const barBox = (await bar.boundingBox())!;
    const popBox = (await popover.boundingBox())!;
    return { bar, popover, barBox, popBox };
  }

  for (const { title, kind } of [
    { title: 'Kickoff', kind: 'inline content' },
    { title: 'Audit', kind: 'lazily provided content' },
  ]) {
    test(`popover with ${kind} paints next to its bar`, async ({ page }) => {
      const { barBox, popBox } = await openPopover(page, title);

      // Vertically adjacent: directly under the bar, or flipped directly above
      // it when the viewport bottom is in the way.
      const below = popBox.y - (barBox.y + barBox.height);
      const above = barBox.y - (popBox.y + popBox.height);
      expect(
        Math.min(Math.abs(below), Math.abs(above)),
        `popover is ${Math.round(Math.min(below, above))}px from its bar`,
      ).toBeLessThanOrEqual(GAP);

      // Horizontally anchored to the bar's left edge (or clamped to the
      // viewport's right margin when the panel would overflow).
      const viewport = page.viewportSize()!;
      const clamped = popBox.x + popBox.width >= viewport.width - GAP;
      if (!clamped) expect(Math.abs(popBox.x - barBox.x)).toBeLessThanOrEqual(GAP);

      // And it is on screen, not parked below the fold.
      expect(popBox.y).toBeGreaterThanOrEqual(0);
      expect(popBox.y + popBox.height).toBeLessThanOrEqual(viewport.height);
    });

    test(`popover with ${kind} is the element painted right beside its bar`, async ({ page }) => {
      const { barBox, popBox } = await openPopover(page, title);

      // The probe points come from the BAR, not from the popover's own box:
      // an overlay that drifted down the page still "paints somewhere", and an
      // overlay covered by a later stacking context is `visible` to the DOM
      // while showing nothing. Both lose the point next to their anchor.
      const flipped = popBox.y + popBox.height <= barBox.y;
      const beside = flipped ? barBox.y - GAP - 4 : barBox.y + barBox.height + GAP + 4;

      for (const [x, y] of [
        [barBox.x + 8, beside],
        [popBox.x + popBox.width / 2, popBox.y + popBox.height / 2],
      ]) {
        const { hit, chain } = await popoverPaintsAt(page, x, y);
        expect(hit, `nothing of the popover paints at (${Math.round(x)}, ${Math.round(y)}); topmost chain: ${chain.join(' > ')}`).toBe(true);
      }
    });
  }

  test('popover does not land on the following section', async ({ page }) => {
    const { popBox } = await openPopover(page, 'Kickoff');
    // The next section's calendar — where the mis-anchored panel used to land,
    // and where that calendar's own contained host painted over it.
    const nextBox = (await page.locator('#cal-noselect').boundingBox())!;

    const overlaps = popBox.x < nextBox.x + nextBox.width
      && popBox.x + popBox.width > nextBox.x
      && popBox.y < nextBox.y + nextBox.height
      && popBox.y + popBox.height > nextBox.y;
    expect(overlaps, 'popover overlaps the next section\'s calendar').toBe(false);
  });

  test('hover tooltip anchors to its bar too', async ({ page }) => {
    const bar = page.locator('#cal-default .calendar__event-bar:has-text("Offsite")').first();
    await bar.scrollIntoViewIfNeeded();
    await bar.hover();

    const tooltip = page.locator('#cal-default .calendar__tooltip');
    await expect(tooltip).toBeVisible();

    const barBox = (await bar.boundingBox())!;
    const tipBox = (await tooltip.boundingBox())!;
    const above = barBox.y - (tipBox.y + tipBox.height);
    const below = tipBox.y - (barBox.y + barBox.height);
    expect(Math.min(Math.abs(above), Math.abs(below))).toBeLessThanOrEqual(GAP);
    expect(Math.abs(tipBox.x - barBox.x)).toBeLessThanOrEqual(GAP);
  });
});
