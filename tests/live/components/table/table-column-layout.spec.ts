import { expect, test } from '@playwright/test';

/**
 * Column geometry, measured against real layout.
 *
 * happy-dom cannot express any of this: every assertion here is about pixels
 * the browser produced — whether the columns reach the frame's right edge,
 * whether they stay inside a narrow card, and whether auto-sizing converges
 * instead of inflating the table past its own frame. The class-level contract
 * lives in tests/components/table-column-fit.test.ts.
 */
const showcaseUrl = process.env.TABLE_SHOWCASE_URL
  || '/tests/live/fixtures/table/visual.html';

type Box = { frame: number; table: number; lastColumnRight: number; tableRight: number };

test.describe('table column layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 1000 });
    await page.goto(showcaseUrl);
    await page.waitForFunction(() => {
      const virtual = document.querySelector('#virtual-demo') as any;
      return virtual?.shadowRoot?.querySelectorAll('tbody tr[data-index]').length > 0;
    });
  });

  const geometry = (page: any, id: string) => page.evaluate((tableId: string): Box => {
    const host = document.querySelector(`#${tableId}`) as any;
    const root = host.shadowRoot as ShadowRoot;
    const frame = root.querySelector('.table-frame') as HTMLElement;
    const grid = root.querySelector('table') as HTMLElement;
    const heads = Array.from(root.querySelectorAll('thead tr.column-header-row > th')) as HTMLElement[];
    const last = heads[heads.length - 1];
    return {
      frame: Math.round(frame.getBoundingClientRect().width),
      table: Math.round(grid.getBoundingClientRect().width),
      lastColumnRight: Math.round(last.getBoundingClientRect().right),
      tableRight: Math.round(grid.getBoundingClientRect().right),
    };
  }, id);

  test('virtualized columns fill the frame instead of leaving a dead strip', async ({ page }) => {
    // The spacer rows must not invent columns: a colspan wider than the table
    // makes fixed layout hand the frame's spare width to phantom columns.
    const spans = await page.evaluate(() => {
      const host = document.querySelector('#virtual-demo') as any;
      const root = host.shadowRoot as ShadowRoot;
      const headers = root.querySelectorAll('thead tr.column-header-row > th').length;
      const spacers = Array.from(root.querySelectorAll('tbody tr.virtual-spacer td'))
        .map((td) => (td as HTMLTableCellElement).colSpan);
      return { headers, spacers };
    });
    expect(spans.spacers.length).toBeGreaterThan(0);
    for (const span of spans.spacers) expect(span).toBe(spans.headers);

    const box = await geometry(page, 'virtual-demo');
    // Anything more than a hairline of unpainted grid is the dead strip.
    expect(box.tableRight - box.lastColumnRight).toBeLessThanOrEqual(2);
  });

  test('a table in a narrow card keeps its columns inside the frame', async ({ page }) => {
    for (const id of ['density-compact', 'density-comfy', 'loading', 'empty']) {
      const fit = await page.evaluate((tableId: string) => {
        const host = document.querySelector(`#${tableId}`) as any;
        const root = host.shadowRoot as ShadowRoot;
        const frame = root.querySelector('.table-frame') as HTMLElement;
        const grid = root.querySelector('table') as HTMLElement;
        const card = host.closest('.demo-card') as HTMLElement;
        return {
          frameWidth: frame.clientWidth,
          tableWidth: Math.round(grid.getBoundingClientRect().width),
          overflow: frame.scrollWidth - frame.clientWidth,
          frameRight: Math.round(frame.getBoundingClientRect().right),
          cardRight: Math.round(card.getBoundingClientRect().right),
        };
      }, id);

      // Nothing may paint outside the card...
      expect(fit.frameRight, `${id} frame escapes its card`).toBeLessThanOrEqual(fit.cardRight);
      // ...and the columns fit the frame rather than being clipped by it.
      expect(fit.overflow, `${id} columns overflow the frame by ${fit.overflow}px`)
        .toBeLessThanOrEqual(1);
    }
  });

  test('auto-size fits content and keeps the table inside its frame', async ({ page }) => {
    const before = await geometry(page, 'pin-demo');

    await page.locator('#autosize-columns').click();
    await expect(page.locator('#column-status')).toContainText('auto-sized');
    const once = await geometry(page, 'pin-demo');

    // Fitting content must not inflate the table past the frame it lives in —
    // an overflowing table lets the right-pinned column occlude its neighbours.
    expect(once.table).toBeLessThanOrEqual(once.frame + 1);

    // ...and it must converge: clicking again re-measures the same content.
    await page.locator('#autosize-columns').click();
    await page.waitForTimeout(150);
    const twice = await geometry(page, 'pin-demo');
    expect(Math.abs(twice.table - once.table)).toBeLessThanOrEqual(1);
    expect(twice.table).toBeLessThanOrEqual(before.frame + 1);

    // Every declared column is still on screen, inside the frame.
    const visible = await page.evaluate(() => {
      const host = document.querySelector('#pin-demo') as any;
      const root = host.shadowRoot as ShadowRoot;
      const frame = (root.querySelector('.table-frame') as HTMLElement).getBoundingClientRect();
      return Array.from(root.querySelectorAll('thead tr.column-header-row > th[data-key]'))
        .map((th) => {
          const rect = (th as HTMLElement).getBoundingClientRect();
          return {
            key: (th as HTMLElement).getAttribute('data-key'),
            inside: rect.left >= frame.left - 1 && rect.right <= frame.right + 1,
            width: Math.round(rect.width),
          };
        });
    });
    expect(visible.map(v => v.key)).toContain('status');
    for (const column of visible) {
      expect(column.inside, `${column.key} sits outside the frame`).toBe(true);
      expect(column.width, `${column.key} collapsed`).toBeGreaterThan(0);
    }
  });

  // MATRIX-columns-7. The class-level suite cannot see this: happy-dom has no
  // layout, so auto-size measures nothing, changes nothing, and a th/td width
  // comparison there passes whether or not the body was ever repainted. Only a
  // real browser makes auto-size actually move a width, which is what turns
  // "the header alone was re-rendered" into an observable disagreement.
  test('auto-size writes the measured width to the body, not the header alone', async ({ page }) => {
    const widths = () => page.evaluate(() => {
      const root = (document.querySelector('#pin-demo') as any).shadowRoot as ShadowRoot;
      return Array.from(root.querySelectorAll('thead tr.column-header-row > th[data-key]'))
        .map((th) => {
          const key = (th as HTMLElement).getAttribute('data-key') as string;
          const cell = root.querySelector(`tbody td[data-key="${key}"]`) as HTMLElement | null;
          return {
            key,
            header: (th as HTMLElement).style.width,
            body: cell ? cell.style.width : null,
          };
        });
    });

    const before = await widths();
    await page.locator('#autosize-columns').click();
    await expect(page.locator('#column-status')).toContainText('auto-sized');
    await page.waitForTimeout(150);
    const after = await widths();

    // The measurement has to have DONE something, or the agreement below is
    // vacuous and this test guards nothing.
    expect(after.some((c, i) => c.header !== before[i].header)).toBe(true);

    for (const column of after) {
      expect(column.body, `${column.key} has no body cell to carry the width`).toBeTruthy();
      expect(column.body, `${column.key}: body kept ${column.body} while the header moved to ${column.header}`)
        .toBe(column.header);
    }
  });

  test('a pinned column shows its frozen edge', async ({ page }) => {
    const affordance = await page.evaluate(() => {
      const host = document.querySelector('#pin-demo') as any;
      const root = host.shadowRoot as ShadowRoot;
      const pinned = root.querySelector('th[data-key="name"]') as HTMLElement;
      const plain = root.querySelector('th[data-key="age"]') as HTMLElement;
      const read = (el: HTMLElement) => {
        const style = getComputedStyle(el);
        return {
          border: parseFloat(style.borderRightWidth) || 0,
          shadow: style.boxShadow,
          indicator: !!el.querySelector('.pin-indicator'),
        };
      };
      return { pinned: read(pinned), plain: read(plain) };
    });

    // A divider the reader can actually see, and a marker that survives even
    // when the table happens to be wide enough not to scroll.
    expect(affordance.pinned.border).toBeGreaterThanOrEqual(2);
    expect(affordance.pinned.border).toBeGreaterThan(affordance.plain.border);
    expect(affordance.pinned.shadow).not.toBe('none');
    expect(affordance.plain.shadow).toBe('none');
    expect(affordance.pinned.indicator).toBe(true);
    expect(affordance.plain.indicator).toBe(false);
  });
});
