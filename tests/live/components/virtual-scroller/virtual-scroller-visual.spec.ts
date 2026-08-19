import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/virtual-scroller/visual.html';

test.describe('Snice Virtual Scroller visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('rendered rows tile the window at the declared item height', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const scrollers = [...document.querySelectorAll('snice-virtual-scroller')] as any[];
      if (scrollers.length === 0) problems.push('no scrollers rendered');
      scrollers.forEach(vs => {
        const sr = vs.shadowRoot as ShadowRoot;
        const label = `#${vs.id}`;
        const itemHeight = Number(vs.getAttribute('item-height'));
        const scroller = sr.querySelector('.scroller') as HTMLElement;
        const rows = [...sr.querySelectorAll('.scroller__item')] as HTMLElement[];
        const total = (vs.items ?? []).length;

        if (total === 0) {
          if (rows.length > 0) problems.push(`${label}: empty list still renders ${rows.length} rows`);
          if (vs.getBoundingClientRect().height < 50) problems.push(`${label}: empty list collapsed`);
          return;
        }
        if (rows.length === 0) { problems.push(`${label}: ${total} items but nothing rendered`); return; }

        const origin = scroller.getBoundingClientRect().top;
        const hostRect = vs.getBoundingClientRect();
        const seen = new Set<number>();
        const placed = rows.map(row => {
          const index = Number(row.getAttribute('data-index'));
          const r = row.getBoundingClientRect();
          if (seen.has(index)) problems.push(`${label}: index ${index} rendered twice`);
          seen.add(index);
          if (Math.abs(r.height - itemHeight) > 1) {
            problems.push(`${label} row ${index}: height ${Math.round(r.height)} != item-height ${itemHeight}`);
          }
          // The row must sit exactly at index * item-height in scroller space.
          const offset = r.top - origin;
          if (Math.abs(offset - index * itemHeight) > 1) {
            problems.push(`${label} row ${index}: offset ${Math.round(offset)}`
              + ` != ${index * itemHeight}`);
          }
          if (Math.abs(r.width - hostRect.width) > 3) {
            problems.push(`${label} row ${index}: width ${Math.round(r.width)}`
              + ` != host ${Math.round(hostRect.width)}`);
          }
          return { index, top: r.top, bottom: r.bottom };
        }).sort((a, b) => a.index - b.index);

        // Rendered indices are contiguous and their boxes abut.
        for (let i = 1; i < placed.length; i++) {
          if (placed[i].index !== placed[i - 1].index + 1) {
            problems.push(`${label}: gap in rendered indices ${placed[i - 1].index} -> ${placed[i].index}`);
          } else if (Math.abs(placed[i].top - placed[i - 1].bottom) > 1) {
            problems.push(`${label}: seam between rows ${placed[i - 1].index} and ${placed[i].index}`);
          }
        }

        // The rendered window must cover everything the user can see.
        const first = placed[0];
        const last = placed[placed.length - 1];
        if (first.top > hostRect.top + 1) {
          problems.push(`${label}: blank strip above the first rendered row`);
        }
        if (last.bottom < Math.min(hostRect.bottom, hostRect.top + total * itemHeight) - 1) {
          problems.push(`${label}: blank strip below the last rendered row`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the scroll range matches the full list while only a window is in the DOM', async ({ page }) => {
    const stats = await page.evaluate(() =>
      [...document.querySelectorAll('snice-virtual-scroller')].map(el => {
        const vs = el as any;
        return {
          id: vs.id,
          total: (vs.items ?? []).length,
          rendered: vs.shadowRoot.querySelectorAll('.scroller__item').length,
          itemHeight: Number(vs.getAttribute('item-height')),
          scrollHeight: vs.scrollHeight,
          clientHeight: vs.clientHeight
        };
      }));

    expect(stats.length).toBeGreaterThan(0);
    for (const s of stats) {
      if (s.total === 0) continue;
      // The spacer reproduces the full list height, so the scrollbar is honest.
      expect(Math.abs(s.scrollHeight - s.total * s.itemHeight), s.id).toBeLessThanOrEqual(2);
      // ...but only a viewport-sized window is materialised.
      const maxWindow = Math.ceil(s.clientHeight / s.itemHeight) + 45;
      expect(s.rendered, `${s.id} rendered rows`).toBeLessThanOrEqual(maxWindow);
      expect(s.rendered, `${s.id} rendered rows`).toBeGreaterThan(0);
    }
  });

  // BUG: the scroll container is the host (`:host { overflow: auto }` in
  // snice-virtual-scroller.css) but the `@scroll` handler is bound to the inner
  // `.scroller` div, which never scrolls (height 0, overflow visible). Scroll
  // events do not bubble, so handleScroll never fires, `cachedScrollTop` stays 0
  // and the rendered window stays pinned to indices 0..n. After any scroll the
  // rows sit far above the viewport and the scroller renders as a blank box.
  test.fixme('scrolling re-renders the window so the viewport is never blank', async ({ page }) => {
    const scroller = page.locator('#vs-default');
    await scroller.scrollIntoViewIfNeeded();
    const box = (await scroller.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 300);
    await page.waitForTimeout(600);

    const geo = await scroller.evaluate(el => {
      const vs = el as any;
      const sr = vs.shadowRoot as ShadowRoot;
      const host = vs.getBoundingClientRect();
      const rows = [...sr.querySelectorAll('.scroller__item')].map(r => {
        const b = (r as HTMLElement).getBoundingClientRect();
        return { index: Number(r.getAttribute('data-index')), top: b.top, bottom: b.bottom };
      }).sort((a, b) => a.index - b.index);
      return { scrollTop: vs.scrollTop, itemHeight: Number(vs.getAttribute('item-height')), rows, host: { top: host.top, bottom: host.bottom } };
    });

    expect(geo.scrollTop).toBeGreaterThan(1000);
    // The window must have followed the scroll position.
    expect(geo.rows[0].index).toBeGreaterThan(geo.scrollTop / geo.itemHeight - 30);
    // ...and paint over the whole visible box, top and bottom.
    expect(geo.rows[0].top).toBeLessThanOrEqual(geo.host.top + 1);
    expect(geo.rows[geo.rows.length - 1].bottom).toBeGreaterThanOrEqual(geo.host.bottom - 1);
  });

  test('custom row content stays inside its row box', async ({ page }) => {
    const failures = await page.locator('#vs-custom').evaluate(el => {
      const problems: string[] = [];
      const sr = (el as HTMLElement).shadowRoot!;
      [...sr.querySelectorAll('.scroller__item')].forEach(row => {
        const rr = (row as HTMLElement).getBoundingClientRect();
        const index = row.getAttribute('data-index');
        [...row.querySelectorAll('img')].forEach(img => {
          const ir = img.getBoundingClientRect();
          if (ir.height > rr.height + 1) problems.push(`row ${index}: avatar taller than the row`);
          if (Math.abs(ir.width - ir.height) > 1) {
            problems.push(`row ${index}: avatar not square (${Math.round(ir.width)}x${Math.round(ir.height)})`);
          }
          if (ir.left < rr.left - 1) problems.push(`row ${index}: avatar starts outside the row`);
        });
        // Only the component's own row box is asserted here: the showcase's
        // render function supplies its own inline padding/box-sizing.
        if (rr.width < 100) problems.push(`row ${index}: row box collapsed`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
