import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/sortable/demo.html';

test.describe('Snice Sortable visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-sortable'));
    await page.waitForFunction(() => {
      const lists = [...document.querySelectorAll('snice-sortable')];
      return lists.length > 0 && lists.every(l => !!(l as any).shadowRoot?.querySelector('.sortable'));
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Vertical lists stack their slotted items in DOM order: shared left edge,
  // equal widths, evenly spaced, never overlapping, never escaping the host.
  test('vertical lists stack items in order with a uniform gap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-sortable[direction="vertical"]').forEach((host, i) => {
        const hr = host.getBoundingClientRect();
        const items = [...host.children] as HTMLElement[];
        if (items.length === 0) { problems.push(`v[${i}]: no items`); return; }
        const rects = items.map(el => el.getBoundingClientRect());

        const lefts = rects.map(r => Math.round(r.left));
        if (Math.max(...lefts) - Math.min(...lefts) > 1) {
          problems.push(`v[${i}]: items not left-aligned (${lefts.join(',')})`);
        }
        const widths = rects.map(r => Math.round(r.width));
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`v[${i}]: uneven item widths (${widths.join(',')})`);
        }
        rects.forEach((r, n) => {
          if (r.left < hr.left - 1 || r.right > hr.right + 1
              || r.top < hr.top - 1 || r.bottom > hr.bottom + 1) {
            problems.push(`v[${i}] item ${n}: escapes the host`);
          }
        });
        const gaps = rects.slice(1).map((r, n) => Math.round(r.top - rects[n].bottom));
        if (gaps.some(g => g < 0)) problems.push(`v[${i}]: items overlap (${gaps.join(',')})`);
        if (gaps.length && Math.max(...gaps) - Math.min(...gaps) > 1) {
          problems.push(`v[${i}]: uneven gaps (${gaps.join(',')})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The horizontal list lays items out on one row: shared top, strictly
  // increasing lefts, a uniform gap, and no overflow past the host.
  test('horizontal list tiles items across one row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-sortable[direction="horizontal"]')!;
      const hr = host.getBoundingClientRect();
      const rects = ([...host.children] as HTMLElement[]).map(el => el.getBoundingClientRect());
      if (rects.length < 2) problems.push('expected several horizontal items');

      const tops = rects.map(r => Math.round(r.top));
      if (Math.max(...tops) - Math.min(...tops) > 1) {
        problems.push(`items not on one row (tops ${tops.join(',')})`);
      }
      const gaps = rects.slice(1).map((r, n) => Math.round(r.left - rects[n].right));
      if (gaps.some(g => g < 0)) problems.push(`items overlap (${gaps.join(',')})`);
      if (gaps.length && Math.max(...gaps) - Math.min(...gaps) > 1) {
        problems.push(`uneven gaps (${gaps.join(',')})`);
      }
      rects.forEach((r, n) => {
        if (r.left < hr.left - 1 || r.right > hr.right + 1) {
          problems.push(`item ${n}: overflows the host row`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Handle-mode items keep the grip glyph inside the item, to the left of the
  // label, and every item must be marked draggable so the grip is live.
  test('drag handles sit inside their item, left of the label', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-sortable[handle]')!;
      ([...host.children] as HTMLElement[]).forEach((item, i) => {
        const ir = item.getBoundingClientRect();
        const handle = item.querySelector('.handle') as HTMLElement | null;
        if (!handle) { problems.push(`item ${i}: no handle`); return; }
        const r = handle.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) {
          problems.push(`item ${i}: handle ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        if (r.left < ir.left - 1 || r.right > ir.right + 1
            || r.top < ir.top - 1 || r.bottom > ir.bottom + 1) {
          problems.push(`item ${i}: handle escapes the item box`);
        }
        // Grip precedes the label text.
        const range = document.createRange();
        range.selectNodeContents(item);
        if (r.left > range.getBoundingClientRect().right) {
          problems.push(`item ${i}: handle is not at the start of the row`);
        }
        if (!item.draggable) problems.push(`item ${i}: not marked draggable`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
