import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/breadcrumbs/visual.html';

test.describe('Snice Breadcrumbs visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  // BUG: the showcase's "Declarative API" section renders <snice-crumb> children,
  // but snice-crumb is never registered as a custom element - the shared
  // invariant reports "<snice-crumb> is not defined".
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // BUG: consequence of the unregistered <snice-crumb> above - the declarative
  // breadcrumbs host renders four label-less 21x21 crumbs, and the active crumb
  // collapses to 0x0 and drops 11px below the shared baseline.
  test.fixme('declarative <snice-crumb> children render as real crumbs', async ({ page }) => {
    const crumbs = await page.evaluate(() => {
      const host = [...document.querySelectorAll('snice-breadcrumbs')]
        .find(b => b.querySelector('snice-crumb')) as any;
      if (!host) return null;
      return [...host.shadowRoot.querySelectorAll('.breadcrumb-item')].map((li: Element) => {
        const r = li.getBoundingClientRect();
        return { text: li.textContent!.trim(), w: Math.round(r.width), h: Math.round(r.height) };
      });
    });
    expect(crumbs).not.toBeNull();
    expect(crumbs!.map(c => c.text)).toEqual(['Home', 'Products', 'Electronics', 'Phones']);
    expect(crumbs!.every(c => c.w > 0 && c.h > 0)).toBe(true);
  });

  test('crumbs tile left-to-right on one baseline with no gaps or overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      // Every property-configured breadcrumb on the showcase. The declarative
      // <snice-crumb> variant is covered by its own (fixme'd) test above.
      const bars = [...document.querySelectorAll('snice-breadcrumbs[id]')] as any[];
      if (bars.length === 0) problems.push('no breadcrumbs on page');

      bars.forEach(bar => {
        const label = bar.id;
        const list = bar.shadowRoot?.querySelector('.breadcrumb');
        if (!list) { problems.push(`${label}: no .breadcrumb list`); return; }
        const items = [...list.querySelectorAll('.breadcrumb-item')] as HTMLElement[];
        if (items.length === 0) { problems.push(`${label}: no crumbs`); return; }

        const rects = items.map(i => i.getBoundingClientRect());
        const listRect = list.getBoundingClientRect();

        // A breadcrumb trail is a single line: every crumb shares top and height.
        const tops = rects.map(r => Math.round(r.top));
        const heights = rects.map(r => Math.round(r.height));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`${label}: crumbs off one baseline, tops ${tops.join(',')}`);
        }
        if (Math.max(...heights) - Math.min(...heights) > 1) {
          problems.push(`${label}: crumb heights differ ${heights.join(',')}`);
        }

        // Crumbs abut exactly - a gap or an overlap both break the separator rhythm.
        for (let i = 1; i < rects.length; i++) {
          const seam = rects[i].left - rects[i - 1].right;
          if (Math.abs(seam) > 1) {
            problems.push(`${label}: seam of ${Math.round(seam)}px between crumb ${i - 1} and ${i}`);
          }
        }

        // The trail stays inside the list box.
        if (rects[0].left < listRect.left - 1
            || rects[rects.length - 1].right > listRect.right + 1) {
          problems.push(`${label}: trail overhangs the list box`);
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('every crumb but the last carries a separator, and icons render at text scale', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-breadcrumbs')].forEach((bar: any, b) => {
        const label = bar.id || `#${b}`;
        const items = [...(bar.shadowRoot?.querySelectorAll('.breadcrumb-item') ?? [])] as HTMLElement[];

        items.forEach((item, i) => {
          const sep = item.querySelector('.breadcrumb-separator') as HTMLElement | null;
          const isLast = i === items.length - 1;
          if (isLast && sep) problems.push(`${label}: trailing separator after the last crumb`);
          if (!isLast && !sep) problems.push(`${label}: crumb ${i} has no separator`);
          if (!isLast && sep) {
            const sr = sep.getBoundingClientRect();
            const ir = item.getBoundingClientRect();
            // The separator is the crumb's right edge, not floating loose.
            if (sr.width === 0 || sr.right > ir.right + 1 || sr.left < ir.left - 1) {
              problems.push(`${label}: crumb ${i} separator sits outside its item`);
            }
          }

          const icon = item.querySelector('.breadcrumb-icon') as HTMLElement | null;
          if (icon) {
            const ic = icon.getBoundingClientRect();
            const rowH = item.getBoundingClientRect().height;
            if (ic.width < 8 || ic.height < 8 || ic.height > rowH * 2) {
              problems.push(`${label}: crumb ${i} icon ${Math.round(ic.width)}x${Math.round(ic.height)} `
                + `against a ${Math.round(rowH)}px row`);
            }
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('size variants scale monotonically', async ({ page }) => {
    const heights = await page.evaluate(() =>
      ['size-small', 'size-medium', 'size-large'].map(id => {
        const el = document.getElementById(id);
        return el ? Math.round(el.getBoundingClientRect().height) : -1;
      }));

    expect(heights.every(h => h > 0)).toBe(true);
    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });
});
