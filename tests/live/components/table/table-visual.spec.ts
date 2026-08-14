import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/table/demo.html';

test.describe('Snice Table visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      !!(document.getElementById('pro-table') as any)?.shadowRoot?.querySelector('tbody tr'));
    await page.waitForTimeout(800);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('body cells line up under their header columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const tables = [...document.querySelectorAll('snice-table')] as any[];
      if (tables.length === 0) problems.push('no tables');
      let checked = 0;

      tables.forEach(host => {
        // Virtualised bodies position rows absolutely; column-group headers
        // span multiple columns. Both are judged elsewhere.
        if (host.hasAttribute('virtualize') || host.hasAttribute('list')) return;
        const table = host.shadowRoot?.querySelector('table') as HTMLTableElement | null;
        if (!table) return;
        const headRows = [...table.querySelectorAll('thead tr')] as HTMLElement[];
        if (headRows.length !== 1) return; // multi-level header
        const ths = [...headRows[0].children] as HTMLElement[];
        const rows = [...table.querySelectorAll('tbody tr')] as HTMLElement[];
        if (ths.length === 0 || rows.length === 0) return;

        const id = host.id || host.tagName.toLowerCase();
        const cols = ths.map(th => th.getBoundingClientRect());
        checked++;

        rows.forEach((row, r) => {
          const cells = [...row.children] as HTMLElement[];
          // Group headers, detail panels and "no data" rows use a single
          // spanning cell — they are not column-aligned by design.
          if (cells.length !== ths.length) return;
          if (cells.some(c => (c as HTMLTableCellElement).colSpan > 1)) return;
          const rects = cells.map(c => c.getBoundingClientRect());
          if (rects[0].height === 0) return;

          rects.forEach((cr, c) => {
            if (Math.abs(cr.left - cols[c].left) > 1 || Math.abs(cr.width - cols[c].width) > 1) {
              problems.push(`${id} row ${r} col ${c}: cell [${Math.round(cr.left)},`
                + `${Math.round(cr.width)}] vs header [${Math.round(cols[c].left)},`
                + `${Math.round(cols[c].width)}]`);
            }
          });
          // All cells in a row share the row's height.
          const tops = rects.map(x => Math.round(x.top));
          const bottoms = rects.map(x => Math.round(x.bottom));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`${id} row ${r}: uneven cell tops`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`${id} row ${r}: uneven cell bottoms`);
          }
        });
      });
      if (checked === 0) problems.push('no simple-header tables were checked');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('rows tile the body with no gaps and no overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const tables = [...document.querySelectorAll('snice-table')] as any[];
      let checked = 0;

      tables.forEach(host => {
        if (host.hasAttribute('virtualize')) return; // absolutely positioned rows
        const table = host.shadowRoot?.querySelector('table') as HTMLTableElement | null;
        if (!table) return;
        const rows = ([...table.querySelectorAll('tbody tr')] as HTMLElement[])
          .filter(r => r.getBoundingClientRect().height > 0);
        if (rows.length < 2) return;
        const id = host.id || host.tagName.toLowerCase();
        checked++;

        const tableRect = table.getBoundingClientRect();
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1].getBoundingClientRect();
          const cur = rows[i].getBoundingClientRect();
          if (Math.abs(cur.top - prev.bottom) > 1) {
            problems.push(`${id} row ${i}: seam ${Math.round(prev.bottom)} -> ${Math.round(cur.top)}`);
          }
          if (cur.right > tableRect.right + 1 || cur.left < tableRect.left - 1) {
            problems.push(`${id} row ${i}: overhangs the table box`);
          }
        }
      });
      if (checked === 0) problems.push('no tables with rows were checked');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('sticky header stays pinned above the first body row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const tables = [...document.querySelectorAll('snice-table')] as any[];
      let checked = 0;

      tables.forEach(host => {
        const table = host.shadowRoot?.querySelector('table') as HTMLTableElement | null;
        if (!table) return;
        const head = table.querySelector('thead tr') as HTMLElement | null;
        const firstRow = table.querySelector('tbody tr') as HTMLElement | null;
        if (!head || !firstRow) return;
        const hr = head.getBoundingClientRect();
        const rr = firstRow.getBoundingClientRect();
        if (hr.height === 0 || rr.height === 0) return;
        const id = host.id || host.tagName.toLowerCase();
        checked++;

        if (hr.bottom > rr.top + 1) {
          problems.push(`${id}: header overlaps the first row`
            + ` (${Math.round(hr.bottom)} > ${Math.round(rr.top)})`);
        }
        if (hr.height < 20) problems.push(`${id}: header height ${Math.round(hr.height)}`);
        // Header must span exactly the same width as the body rows.
        if (Math.abs(hr.width - rr.width) > 1) {
          problems.push(`${id}: header width ${Math.round(hr.width)}`
            + ` != row width ${Math.round(rr.width)}`);
        }
      });
      if (checked === 0) problems.push('no headers were checked');
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
