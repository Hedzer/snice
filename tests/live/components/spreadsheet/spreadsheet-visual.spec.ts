import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/spreadsheet/demo.html';

test.describe('Snice Spreadsheet visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-spreadsheet'));
    await page.waitForFunction(() =>
      !!document.querySelector('#with-columns')?.shadowRoot?.querySelector('tbody td'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('header cells cap their body columns and rows tile at a uniform height', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sheets = [...document.querySelectorAll('snice-spreadsheet')] as HTMLElement[];
      if (sheets.length === 0) problems.push('no snice-spreadsheet on the page');

      sheets.forEach(sheet => {
        const root = sheet.shadowRoot!;
        const id = `#${sheet.id}`;
        const scroller = root.querySelector('.spreadsheet') as HTMLElement | null;
        const headers = [...root.querySelectorAll('thead tr > *')] as HTMLElement[];
        const rows = [...root.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
        if (!scroller || headers.length === 0 || rows.length === 0) return; // empty sheet

        const sr = scroller.getBoundingClientRect();

        // Every body row has one cell per header column, and each cell's left
        // edge and width match the header above it.
        rows.forEach((row, ri) => {
          const cells = [...row.children] as HTMLElement[];
          if (cells.length !== headers.length) {
            problems.push(`${id} row ${ri}: ${cells.length} cells vs ${headers.length} headers`);
            return;
          }
          cells.forEach((cell, ci) => {
            const cr = cell.getBoundingClientRect();
            const hr = headers[ci].getBoundingClientRect();
            if (Math.abs(cr.left - hr.left) > 1) {
              problems.push(`${id} r${ri}c${ci}: left ${Math.round(cr.left)} != header ${Math.round(hr.left)}`);
            }
            if (Math.abs(cr.width - hr.width) > 1) {
              problems.push(`${id} r${ri}c${ci}: width ${Math.round(cr.width)} != header ${Math.round(hr.width)}`);
            }
            if (cr.width < 12 || cr.height < 12) {
              problems.push(`${id} r${ri}c${ci}: ${Math.round(cr.width)}x${Math.round(cr.height)}`);
            }
            if (ci > 0) {
              const prev = cells[ci - 1].getBoundingClientRect();
              if (cr.left < prev.right - 1) {
                problems.push(`${id} r${ri}c${ci}: overlaps the cell to its left`);
              }
            }
          });

          // Cells in a row share top and bottom edges.
          const rects = cells.map(c => c.getBoundingClientRect());
          const tops = rects.map(r => Math.round(r.top));
          const bottoms = rects.map(r => Math.round(r.bottom));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`${id} row ${ri}: uneven cell tops`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`${id} row ${ri}: uneven cell bottoms`);
          }
          // Consecutive rows abut with no gap and no overlap.
          if (ri > 0) {
            const prevBottom = rows[ri - 1].children[0].getBoundingClientRect().bottom;
            const gap = rects[0].top - prevBottom;
            if (Math.abs(gap) > 1) {
              problems.push(`${id} row ${ri}: seam gap ${gap.toFixed(1)}px`);
            }
          }
        });

        // Uniform row height across the sheet.
        const heights = rows.map(r => Math.round(r.getBoundingClientRect().height));
        if (Math.max(...heights) - Math.min(...heights) > 1) {
          problems.push(`${id}: row heights vary ${Math.min(...heights)}..${Math.max(...heights)}`);
        }

        // The row-number gutter is the leftmost column of both the head and
        // every body row, and it stays flush with the scroll box's left edge.
        const gutterHeader = headers[0];
        if (!gutterHeader.classList.contains('spreadsheet-row-num')) {
          problems.push(`${id}: first header is not the row-number gutter`);
        }
        rows.forEach((row, ri) => {
          const first = row.children[0] as HTMLElement;
          if (!first.classList.contains('spreadsheet-row-num')) {
            problems.push(`${id} row ${ri}: first cell is not a row number`);
          }
          const fr = first.getBoundingClientRect();
          if (fr.left < sr.left - 1) problems.push(`${id} row ${ri}: gutter left of the scroll box`);
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the grid never paints outside its scroll box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      (document.querySelectorAll('snice-spreadsheet') as NodeListOf<HTMLElement>).forEach(sheet => {
        const root = sheet.shadowRoot!;
        const scroller = root.querySelector('.spreadsheet') as HTMLElement | null;
        const table = root.querySelector('.spreadsheet-table') as HTMLElement | null;
        if (!scroller || !table) return;
        const sr = scroller.getBoundingClientRect();
        const tr = table.getBoundingClientRect();
        const id = `#${sheet.id}`;

        // The scroll box is what clips; the table may be wider/taller than the
        // visible area, but its origin must line up and the box itself must
        // stay within the host.
        if (Math.abs(tr.left - sr.left) > 1) {
          problems.push(`${id}: table origin ${Math.round(tr.left)} vs scroller ${Math.round(sr.left)}`);
        }
        if (getComputedStyle(scroller).overflow === 'visible' && tr.height > sr.height + 1) {
          problems.push(`${id}: taller-than-box table in a non-clipping scroller`);
        }
        const hr = sheet.getBoundingClientRect();
        if (sr.right > hr.right + 1 || sr.bottom > hr.bottom + 1) {
          problems.push(`${id}: scroll box escapes the host`);
        }

        // The formula bar sits above the grid, full width, never overlapping.
        const bar = root.querySelector('.spreadsheet-formula-bar') as HTMLElement | null;
        if (bar) {
          const br = bar.getBoundingClientRect();
          if (br.bottom > sr.top + 1) problems.push(`${id}: formula bar overlaps the grid`);
          if (br.width < hr.width - 2) {
            problems.push(`${id}: formula bar ${Math.round(br.width)}px in a ${Math.round(hr.width)}px host`);
          }
          const input = bar.querySelector('.spreadsheet-formula-input') as HTMLElement;
          const ref = bar.querySelector('.spreadsheet-cell-ref') as HTMLElement;
          const ir = input.getBoundingClientRect();
          const rr = ref.getBoundingClientRect();
          if (ir.left < rr.right - 1) problems.push(`${id}: formula input overlaps the cell ref`);
          if (ir.right > br.right + 1) problems.push(`${id}: formula input overflows its bar`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('selecting a cell highlights exactly that cell and drops the fill handle on its corner', async ({ page }) => {
    const sheet = page.locator('#with-columns');
    const cell = sheet.locator('tbody tr').first().locator('td').nth(1);
    await cell.click();
    await page.waitForFunction(() =>
      !!document.querySelector('#with-columns')!.shadowRoot!.querySelector('td.selected'));
    await page.waitForTimeout(150);

    const geo = await page.evaluate(() => {
      const root = document.querySelector('#with-columns')!.shadowRoot!;
      const selected = [...root.querySelectorAll('td.selected')] as HTMLElement[];
      const sel = selected[0];
      const sr = sel.getBoundingClientRect();
      const handle = root.querySelector('.spreadsheet-fill-handle') as HTMLElement | null;
      const hr = handle?.getBoundingClientRect();
      const scroller = root.querySelector('.spreadsheet')!.getBoundingClientRect();
      return {
        selectedCount: selected.length,
        ref: root.querySelector('.spreadsheet-cell-ref')!.textContent!.trim(),
        cell: { w: sr.width, h: sr.height, right: sr.right, bottom: sr.bottom },
        handle: hr ? { w: hr.width, h: hr.height, cx: hr.left + hr.width / 2, cy: hr.top + hr.height / 2 } : null,
        selInsideScroller: sr.left >= scroller.left - 1 && sr.top >= scroller.top - 1
      };
    });

    expect(geo.selectedCount).toBe(1);
    expect(geo.ref).toBe('B1');
    expect(geo.selInsideScroller).toBe(true);
    expect(geo.handle).not.toBeNull();
    // The handle is a small square pinned to the selection's bottom-right.
    expect(geo.handle!.w).toBeGreaterThan(4);
    expect(geo.handle!.w).toBeLessThan(20);
    expect(Math.abs(geo.handle!.w - geo.handle!.h)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo.handle!.cx - geo.cell.right)).toBeLessThanOrEqual(8);
    expect(Math.abs(geo.handle!.cy - geo.cell.bottom)).toBeLessThanOrEqual(8);
  });
});
