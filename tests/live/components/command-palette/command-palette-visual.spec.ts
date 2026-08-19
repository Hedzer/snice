import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/command-palette/visual.html';

async function openPalette(page: import('@playwright/test').Page, id: string) {
  await page.evaluate(pid => (document.getElementById(pid) as any).show(), id);
  await page.waitForTimeout(300);
  await page.locator(`snice-command-palette#${id}`).locator('input').fill('e');
  await page.waitForTimeout(300);
}

test.describe('Snice Command Palette visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      (document.getElementById('pal-default') as any)?.commands?.length > 0);
  });

  // Shared-invariant false positive: the palette is a full-viewport overlay with
  // `:host { display: contents }`, so the host itself legitimately measures 0x0.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('open palette is a centred, viewport-sized dialog', async ({ page }) => {
    await openPalette(page, 'pal-default');
    const geo = await page.evaluate(() => {
      const sr = (document.getElementById('pal-default') as any).shadowRoot;
      const c = sr.querySelector('.command-palette__container').getBoundingClientRect();
      return {
        x: c.x, w: c.width, top: c.top, bottom: c.bottom,
        vw: window.innerWidth, vh: window.innerHeight
      };
    });
    // Panel must be a real dialog: wide enough to read, never wider than the
    // viewport, horizontally centred, and anchored in the upper part of it.
    expect(geo.w).toBeGreaterThan(320);
    expect(geo.w).toBeLessThanOrEqual(geo.vw);
    const centreOffset = (geo.x + geo.w / 2) - geo.vw / 2;
    expect(Math.abs(centreOffset)).toBeLessThanOrEqual(1);
    expect(geo.top).toBeGreaterThan(0);
    expect(geo.top).toBeLessThan(geo.vh / 2);
    expect(geo.bottom).toBeLessThanOrEqual(geo.vh + 1);
  });

  test('result rows tile without gaps and icons render at a sane size', async ({ page }) => {
    await openPalette(page, 'pal-default');
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sr = (document.getElementById('pal-default') as any).shadowRoot;
      const results = sr.querySelector('.command-palette__results') as HTMLElement;
      const rows = [...results.querySelectorAll(
        '.command-palette__category, .command-palette__item')] as HTMLElement[];
      if (rows.length < 2) problems.push(`only ${rows.length} result rows`);

      const rr = results.getBoundingClientRect();
      rows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        if (r.height < 20) problems.push(`row[${i}]: height ${Math.round(r.height)}`);
        // Rows must span the list, not float inside it.
        if (Math.abs(r.width - rr.width) > 1) {
          problems.push(`row[${i}]: width ${Math.round(r.width)} != list ${Math.round(rr.width)}`);
        }
        if (i > 0) {
          const prev = rows[i - 1].getBoundingClientRect();
          if (Math.abs(r.top - prev.bottom) > 1) {
            problems.push(`row[${i}]: seam gap ${Math.round(r.top - prev.bottom)}px`);
          }
        }
      });

      // Every command icon is a small square glyph inside its own row.
      (results.querySelectorAll('.command-palette__item') as NodeListOf<HTMLElement>)
        .forEach((item, i) => {
          const icon = item.querySelector('.command-palette__item-icon') as HTMLElement | null;
          if (!icon) return;
          const ir = icon.getBoundingClientRect();
          const itr = item.getBoundingClientRect();
          if (ir.width < 12 || ir.width > 32 || Math.abs(ir.width - ir.height) > 1) {
            problems.push(`item[${i}] icon ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
          if (ir.top < itr.top - 1 || ir.bottom > itr.bottom + 1) {
            problems.push(`item[${i}] icon escapes its row`);
          }
        });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.command-palette__input` has `width: 100%` plus 0.75rem/1rem padding but
  // the component CSS never sets `box-sizing: border-box`, so its border box is
  // 640px inside a 608px content area. That gives `.command-palette__search`
  // scrollWidth 656 vs clientWidth 640, and the `overflow: hidden`
  // `.command-palette__container` therefore has 16px of horizontal overflow.
  // Opening the palette focuses the input, Chromium scrolls the hidden container
  // to reveal it (scrollLeft = 16), and every row — search box, categories,
  // items — renders 16px left of the container's content box, clipped on the
  // left with a 16px dead gap on the right.
  test.fixme('palette content is aligned with its container, not scrolled out of it', async ({ page }) => {
    await openPalette(page, 'pal-default');
    const geo = await page.evaluate(() => {
      const sr = (document.getElementById('pal-default') as any).shadowRoot;
      const container = sr.querySelector('.command-palette__container') as HTMLElement;
      const search = sr.querySelector('.command-palette__search') as HTMLElement;
      const results = sr.querySelector('.command-palette__results') as HTMLElement;
      return {
        scrollLeft: container.scrollLeft,
        overflow: container.scrollWidth - container.clientWidth,
        contentLeft: container.getBoundingClientRect().left
          + parseFloat(getComputedStyle(container).borderLeftWidth),
        searchLeft: search.getBoundingClientRect().left,
        resultsLeft: results.getBoundingClientRect().left
      };
    });
    expect(geo.overflow).toBe(0);
    expect(geo.scrollLeft).toBe(0);
    expect(Math.abs(geo.searchLeft - geo.contentLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo.resultsLeft - geo.contentLeft)).toBeLessThanOrEqual(1);
  });
});
