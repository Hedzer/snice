import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/masonry/demo.html';

test.describe('Snice Masonry visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('items form exactly the requested number of equal-width columns inside the host', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const grids = [...document.querySelectorAll('snice-masonry')] as HTMLElement[];
      if (grids.length === 0) problems.push('no snice-masonry on page');

      grids.forEach((grid, g) => {
        const items = ([...grid.children] as HTMLElement[])
          .map(el => ({ el, r: el.getBoundingClientRect() }))
          .filter(x => x.r.width > 0 && x.r.height > 0);
        if (items.length === 0) return; // the intentionally empty showcase

        const host = grid.getBoundingClientRect();
        const declared = Number(grid.getAttribute('columns') ?? 0);

        const lefts = [...new Set(items.map(x => Math.round(x.r.left)))].sort((a, b) => a - b);
        if (declared > 0 && lefts.length !== Math.min(declared, items.length)) {
          problems.push(`grid[${g}] columns="${declared}": found ${lefts.length} column x-positions `
            + `(${lefts.join(',')}) for ${items.length} items`);
        }

        const widths = items.map(x => Math.round(x.r.width));
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`grid[${g}]: unequal item widths ${[...new Set(widths)].join(',')}`);
        }

        items.forEach((x, i) => {
          if (x.r.left < host.left - 1 || x.r.right > host.right + 1
              || x.r.top < host.top - 1 || x.r.bottom > host.bottom + 1) {
            problems.push(`grid[${g}] item ${i}: escapes the host box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the declared gap is honoured both between columns and between stacked items', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const toPx = (v: string | null) => {
        if (!v) return rem; // component default: 1rem
        if (v.endsWith('rem')) return parseFloat(v) * rem;
        if (v.endsWith('px')) return parseFloat(v);
        return NaN;
      };

      ([...document.querySelectorAll('snice-masonry')] as HTMLElement[]).forEach((grid, g) => {
        const expected = toPx(grid.getAttribute('gap'));
        if (Number.isNaN(expected)) return;

        const items = ([...grid.children] as HTMLElement[])
          .map(el => el.getBoundingClientRect())
          .filter(r => r.width > 0 && r.height > 0);
        if (items.length < 2) return;

        // Group by column x-position.
        const columns = new Map<number, DOMRect[]>();
        items.forEach(r => {
          const key = Math.round(r.left);
          if (!columns.has(key)) columns.set(key, []);
          columns.get(key)!.push(r);
        });

        const keys = [...columns.keys()].sort((a, b) => a - b);
        for (let i = 1; i < keys.length; i++) {
          const prevRight = Math.round(columns.get(keys[i - 1])![0].right);
          const gap = keys[i] - prevRight;
          if (Math.abs(gap - expected) > 1.5) {
            problems.push(`grid[${g}]: column gap ${gap}px, expected ${Math.round(expected)}px`);
          }
        }

        columns.forEach((stack, key) => {
          stack.sort((a, b) => a.top - b.top);
          for (let i = 1; i < stack.length; i++) {
            const gap = stack[i].top - stack[i - 1].bottom;
            if (Math.abs(gap - expected) > 1.5) {
              problems.push(`grid[${g}] column @${key}: row gap ${Math.round(gap)}px, `
                + `expected ${Math.round(expected)}px`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
