import { test, expect } from '@playwright/test';

/**
 * `column-fit="squish"` is a promise about pixels, so it can only be verified
 * against a real layout engine: five columns whose minimums add up to 800 are
 * painted into a 380px frame, and the mode has to make them fit.
 *
 * The arithmetic behind it is unit-tested in
 * tests/components/table-column-fit.test.ts — what is here is the part happy-dom
 * cannot answer: is there a horizontal scrollbar, where is the rightmost column
 * edge, and does the over-long text actually end in an ellipsis.
 */
const fixture = process.env.TABLE_COLUMN_FIT_URL
  || 'http://localhost:5566/tests/live/fixtures/table/column-fit.html';

/** Frame geometry, read past the frame's own border. */
async function frameGeometry(page: import('@playwright/test').Page, id: string) {
  return page.evaluate((tableId) => {
    const table = document.getElementById(tableId) as any;
    const root = table.shadowRoot as ShadowRoot;
    const frame = root.querySelector('.table-frame') as HTMLElement;
    const headers = [...root.querySelectorAll('thead tr.column-header-row th')] as HTMLElement[];
    const last = headers[headers.length - 1];
    const frameRect = frame.getBoundingClientRect();
    return {
      overflowX: getComputedStyle(frame).overflowX,
      scrollWidth: frame.scrollWidth,
      clientWidth: frame.clientWidth,
      headerCount: headers.length,
      // The frame's inner (content-box) right edge, and where the rightmost
      // column actually ends.
      innerRight: frameRect.left + frame.clientLeft + frame.clientWidth,
      lastColumnRight: last.getBoundingClientRect().right,
      widths: headers.map((th) => Math.round(th.getBoundingClientRect().width)),
    };
  }, id);
}

test.describe('Snice Table column-fit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixture);
    await page.waitForFunction(() => !!customElements.get('snice-table'));
    await page.waitForFunction(() => {
      const table = document.getElementById('squish') as any;
      return !!table?.shadowRoot?.querySelector('thead tr.column-header-row th');
    });
    await page.waitForTimeout(200);
  });

  test('squish never scrolls horizontally', async ({ page }) => {
    const geo = await frameGeometry(page, 'squish');
    expect(geo.headerCount).toBe(5);
    expect(geo.overflowX).toBe('hidden');
    // Nothing to scroll to: the painted content is no wider than the frame.
    expect(geo.scrollWidth).toBeLessThanOrEqual(geo.clientWidth);
  });

  test('squish puts the rightmost column edge on the frame edge', async ({ page }) => {
    const geo = await frameGeometry(page, 'squish');
    expect(Math.abs(geo.lastColumnRight - geo.innerRight)).toBeLessThanOrEqual(1);
    // Every column is still present and drawn, not collapsed to nothing.
    expect(Math.min(...geo.widths)).toBeGreaterThan(0);
  });

  test('squish ellipsises content too long for its column', async ({ page }) => {
    const cell = await page.evaluate(() => {
      const table = document.getElementById('squish') as any;
      const host = table.shadowRoot.querySelector('tbody td[data-key="note"] snice-cell-text') as any;
      const content = host.shadowRoot.querySelector('.cell-content') as HTMLElement;
      const style = getComputedStyle(content);
      return {
        text: content.textContent?.trim(),
        overflowing: content.scrollWidth > content.clientWidth,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        // The td clips, so nothing escapes the column box.
        cellOverflow: getComputedStyle(
          table.shadowRoot.querySelector('tbody td[data-key="note"]') as HTMLElement,
        ).overflow,
      };
    });

    expect(cell.text).toContain('build pipeline');
    expect(cell.overflowing).toBe(true);
    expect(cell.textOverflow).toBe('ellipsis');
    expect(cell.whiteSpace).toBe('nowrap');
    expect(cell.cellOverflow).toBe('hidden');
  });

  /**
   * The text cell was never the hard case. Every OTHER typed cell (email here,
   * and equally status/link/phone/location/json/colour/image/actions) declares
   * a 100px floor on its host and on its inner .cell-content — wider than a
   * squished column routinely is. Left alone the cell refuses to shrink, the
   * td's overflow clips it, and the label is chopped mid-glyph: no ellipsis,
   * because the element that owns the ellipsis never got narrow enough to
   * trigger one. Squish relaxes that floor through --snice-table-cell-min-width.
   */
  test('squish ellipsises a typed cell, not just a text cell', async ({ page }) => {
    const cell = await page.evaluate(() => {
      const table = document.getElementById('squish') as any;
      const td = table.shadowRoot.querySelector('tbody td[data-key="email"]') as HTMLElement;
      const host = td.querySelector('snice-cell-email') as any;
      const content = host.shadowRoot.querySelector('.cell-content') as HTMLElement;
      const link = host.shadowRoot.querySelector('.email-link') as HTMLElement;
      const style = getComputedStyle(link);
      return {
        text: link.textContent?.trim(),
        cellWidth: Math.round(td.getBoundingClientRect().width),
        // The cell's own box now fits the column instead of overhanging it.
        contentFits: content.getBoundingClientRect().width <= td.clientWidth + 1,
        overflowing: link.scrollWidth > link.clientWidth,
        textOverflow: style.textOverflow,
        overflow: style.overflow,
      };
    });

    expect(cell.text).toContain('@example.com');
    expect(cell.cellWidth).toBeLessThan(100);
    expect(cell.contentFits).toBe(true);
    expect(cell.overflowing).toBe(true);
    expect(cell.textOverflow).toBe('ellipsis');
    expect(cell.overflow).toBe('hidden');
  });

  /**
   * A header is content too. "Email Address" clipped to "Email Addr" reads as a
   * different label, and the sortable header puts its span in a flex row beside
   * the sort indicator — a flex item does not shrink below its content until it
   * is allowed to, so the ellipsis needs min-width: 0 to ever fire.
   */
  test('squish ellipsises the header label instead of chopping it', async ({ page }) => {
    const header = await page.evaluate(() => {
      const table = document.getElementById('squish') as any;
      const th = table.shadowRoot.querySelector('thead th[data-key="email"]') as HTMLElement;
      const label = th.querySelector('.sort-header > span') as HTMLElement;
      const style = getComputedStyle(label);
      return {
        text: label.textContent?.trim(),
        labelOverflowing: label.scrollWidth > label.clientWidth,
        textOverflow: style.textOverflow,
        overflow: style.overflow,
        // The label shrinks inside the th rather than overflowing it, so the
        // th's own clip never gets to cut a glyph in half.
        thOverflowing: th.scrollWidth > th.clientWidth,
        // #resizable declares no `sortable`, so its label is bare text in the
        // th and the th itself has to carry the ellipsis.
        plainHeaderTextOverflow: (() => {
          const plain = (document.getElementById('resizable') as any)
            .shadowRoot.querySelector('thead th[data-key="email"]') as HTMLElement;
          return getComputedStyle(plain).textOverflow;
        })(),
      };
    });

    expect(header.text).toContain('Email Address');
    expect(header.labelOverflowing).toBe(true);
    expect(header.textOverflow).toBe('ellipsis');
    expect(header.overflow).toBe('hidden');
    expect(header.thOverflowing).toBe(false);
    expect(header.plainHeaderTextOverflow).toBe('ellipsis');
  });

  test('the default policy still scrolls instead of squishing', async ({ page }) => {
    const geo = await frameGeometry(page, 'scroll');
    expect(geo.overflowX).not.toBe('hidden');
    // The same five columns in the same 380px frame keep their minimums and
    // overflow into the frame's own scroller — the behavior squish opts out of.
    expect(geo.scrollWidth).toBeGreaterThan(geo.clientWidth);
  });

  test('switching the property at runtime re-fits the painted columns', async ({ page }) => {
    const before = await frameGeometry(page, 'switchable');
    expect(before.scrollWidth).toBeGreaterThan(before.clientWidth);

    await page.evaluate(() => {
      (document.getElementById('switchable') as any).columnFit = 'squish';
    });
    await page.waitForTimeout(200);

    const after = await frameGeometry(page, 'switchable');
    expect(await page.getAttribute('#switchable', 'column-fit')).toBe('squish');
    expect(after.overflowX).toBe('hidden');
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth);
    expect(Math.abs(after.lastColumnRight - after.innerRight)).toBeLessThanOrEqual(1);
  });

  test('resizing rebalances inside the frame instead of overflowing it', async ({ page }) => {
    const before = await frameGeometry(page, 'resizable');

    const handle = page.locator('#resizable thead th[data-key="name"] .resize-handle');
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const after = await frameGeometry(page, 'resizable');
    // The drag was honoured …
    expect(after.widths[0]).toBeGreaterThan(before.widths[0]);
    // … the neighbours paid for it …
    expect(after.widths[1]).toBeLessThan(before.widths[1]);
    // … and the frame is still the boundary.
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth);
    expect(Math.abs(after.lastColumnRight - after.innerRight)).toBeLessThanOrEqual(1);
  });
});
