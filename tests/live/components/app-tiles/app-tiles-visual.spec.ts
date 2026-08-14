import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/app-tiles/demo.html';

test.describe('Snice App Tiles visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every tile keeps its icon and name inside the tile box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-app-tiles').forEach((host, h) => {
        const root = (host as HTMLElement).shadowRoot;
        if (!root) return;
        root.querySelectorAll('.tile').forEach((tile, t) => {
          const tr = tile.getBoundingClientRect();
          if (tr.width === 0) return;
          const id = `tiles[${h}].tile[${t}]`;
          const icon = tile.querySelector('.tile__icon') as HTMLElement | null;
          const name = tile.querySelector('.tile__name') as HTMLElement | null;
          if (!name) { problems.push(`${id}: no .tile__name`); return; }
          [['icon', icon], ['name', name]].forEach(([what, el]) => {
            if (!el) return;
            const r = (el as HTMLElement).getBoundingClientRect();
            if (r.left < tr.left - 1 || r.right > tr.right + 1
                || r.top < tr.top - 1 || r.bottom > tr.bottom + 1) {
              problems.push(`${id}: ${what} escapes the tile`
                + ` (${Math.round(r.width)}x${Math.round(r.height)} vs tile`
                + ` ${Math.round(tr.width)}x${Math.round(tr.height)})`);
            }
          });
          // Icon glyph boxes must stay in a sane range: never collapsed,
          // never blown up past the tile itself.
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (ir.width < 12 || ir.height < 12) {
              problems.push(`${id}: icon collapsed (${Math.round(ir.width)}x${Math.round(ir.height)})`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('grid tiles tile uniformly: shared row edges, no overlap across a row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-app-tiles').forEach((host, h) => {
        const root = (host as HTMLElement).shadowRoot;
        const grid = root?.querySelector('.tiles');
        if (!grid) return;
        const tiles = [...grid.querySelectorAll('.tile')] as HTMLElement[];
        if (tiles.length < 2) return;

        // Group tiles into visual rows by their top edge.
        const rows = new Map<number, HTMLElement[]>();
        tiles.forEach(t => {
          const key = Math.round(t.getBoundingClientRect().top);
          const bucket = [...rows.keys()].find(k => Math.abs(k - key) <= 2) ?? key;
          rows.set(bucket, [...(rows.get(bucket) ?? []), t]);
        });

        for (const [top, row] of rows) {
          const rects = row.map(t => t.getBoundingClientRect())
            .sort((a, b) => a.left - b.left);
          const bottoms = rects.map(r => Math.round(r.bottom));
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`tiles[${h}] row@${top}: uneven bottoms ${bottoms.join(',')}`);
          }
          for (let i = 1; i < rects.length; i++) {
            if (rects[i].left < rects[i - 1].right - 1) {
              problems.push(`tiles[${h}] row@${top}: tile ${i} overlaps its neighbour`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
