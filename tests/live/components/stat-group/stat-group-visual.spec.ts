import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/stat-group/visual.html';

test.describe('Snice Stat Group visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('stat tiles form a true grid: equal cells, straight columns, uniform gutters', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const groups = [...document.querySelectorAll('snice-stat-group')] as any[];
      if (groups.length === 0) problems.push('no stat groups on page');

      groups.forEach(group => {
        const id = group.id || '(anon)';
        const grid = group.shadowRoot?.querySelector('.stat-group') as HTMLElement | null;
        if (!grid) { problems.push(`${id}: no .stat-group`); return; }
        const gr = grid.getBoundingClientRect();
        const tiles = [...grid.querySelectorAll('.stat')] as HTMLElement[];
        if (tiles.length === 0) { problems.push(`${id}: no tiles`); return; }

        const rects = tiles.map(t => t.getBoundingClientRect());

        // Bucket into visual rows and columns.
        const rows = new Map<number, DOMRect[]>();
        const cols = new Map<number, DOMRect[]>();
        rects.forEach(r => {
          const rk = Math.round(r.top);
          const ck = Math.round(r.left);
          if (!rows.has(rk)) rows.set(rk, []);
          if (!cols.has(ck)) cols.set(ck, []);
          rows.get(rk)!.push(r);
          cols.get(ck)!.push(r);
        });

        // Every tile in a row shares its band; every tile in a column its width.
        rows.forEach((band, top) => {
          const heights = band.map(r => Math.round(r.height));
          if (Math.max(...heights) - Math.min(...heights) > 1) {
            problems.push(`${id} row ${top}: uneven tile heights ${heights.join(',')}`);
          }
        });
        cols.forEach((column, left) => {
          const widths = column.map(r => Math.round(r.width));
          if (Math.max(...widths) - Math.min(...widths) > 1) {
            problems.push(`${id} column ${left}: uneven tile widths ${widths.join(',')}`);
          }
        });

        // Horizontal gutters are constant and positive across each row.
        rows.forEach((band, top) => {
          const sorted = [...band].sort((a, b) => a.left - b.left);
          const gaps: number[] = [];
          for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i].left - sorted[i - 1].right);
          gaps.forEach(g => {
            if (g < 0) problems.push(`${id} row ${top}: tiles overlap by ${Math.round(-g)}px`);
          });
          if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1) {
            problems.push(`${id} row ${top}: uneven gutters ${gaps.map(g => Math.round(g)).join(',')}`);
          }
        });

        // The grid contains every tile.
        rects.forEach((r, i) => {
          if (r.left < gr.left - 1 || r.right > gr.right + 1
              || r.top < gr.top - 1 || r.bottom > gr.bottom + 1) {
            problems.push(`${id} tile ${i}: escapes the grid`);
          }
        });

        // A declared column count is the row width.
        const declared = parseInt(group.getAttribute('columns') ?? '', 10);
        if (declared > 0) {
          rows.forEach((band, top) => {
            if (band.length > declared) {
              problems.push(`${id} row ${top}: ${band.length} tiles for columns="${declared}"`);
            }
          });
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('label, value, trend and icon stay inside their tile and stack in order', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-stat-group')].forEach((group: any) => {
        const id = group.id || '(anon)';
        [...(group.shadowRoot?.querySelectorAll('.stat') ?? [])].forEach((tile: Element, t) => {
          const tr = tile.getBoundingClientRect();
          const label = tile.querySelector('.stat__label') as HTMLElement | null;
          const value = tile.querySelector('.stat__value') as HTMLElement | null;
          const trend = tile.querySelector('.stat__trend') as HTMLElement | null;
          const icon = tile.querySelector('.stat__icon') as HTMLElement | null;

          if (!label || !value) { problems.push(`${id} tile ${t}: missing label/value`); return; }

          const parts: Array<[string, DOMRect]> = [['label', label.getBoundingClientRect()],
                                                   ['value', value.getBoundingClientRect()]];
          if (trend) parts.push(['trend', trend.getBoundingClientRect()]);
          if (icon) parts.push(['icon', icon.getBoundingClientRect()]);

          parts.forEach(([name, r]) => {
            if (r.left < tr.left - 1 || r.right > tr.right + 1
                || r.top < tr.top - 1 || r.bottom > tr.bottom + 1) {
              problems.push(`${id} tile ${t}: ${name} escapes the tile`);
            }
          });

          // Label above value above trend, none overlapping.
          const lr = parts[0][1], vr = parts[1][1];
          if (vr.top < lr.bottom - 1) problems.push(`${id} tile ${t}: value overlaps label`);
          if (trend) {
            const trr = trend.getBoundingClientRect();
            if (trr.top < vr.bottom - 1) problems.push(`${id} tile ${t}: trend overlaps value`);
          }

          // An icon is a square badge in its own gutter, left of the text.
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (Math.abs(ir.width - ir.height) > 1 || ir.width < 12 || ir.width > 64) {
              problems.push(`${id} tile ${t}: icon ${Math.round(ir.width)}x${Math.round(ir.height)}`);
            }
            if (ir.right > lr.left + 1) problems.push(`${id} tile ${t}: icon overlaps the text column`);
            const glyph = icon.querySelector('svg');
            if (glyph) {
              const gr = glyph.getBoundingClientRect();
              if (gr.width < 8 || gr.width > ir.width + 1 || gr.height > ir.height + 1) {
                problems.push(`${id} tile ${t}: icon glyph ${Math.round(gr.width)}x${Math.round(gr.height)} `
                  + `in a ${Math.round(ir.width)}px badge`);
              }
            }
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('the columns attribute sets the track count', async ({ page }) => {
    const tracks = await page.evaluate(() =>
      ['cols-2', 'cols-3', 'cols-4'].map(id => {
        const grid = (document.getElementById(id) as any).shadowRoot.querySelector('.stat-group');
        return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      }));

    expect(tracks).toEqual([2, 3, 4]);
  });
});
