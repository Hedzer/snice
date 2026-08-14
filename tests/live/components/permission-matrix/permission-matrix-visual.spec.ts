import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/permission-matrix/demo.html';

test.describe('Snice Permission Matrix visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every body row lines its cells up under the header columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const matrices = [...document.querySelectorAll('snice-permission-matrix')] as any[];
      if (matrices.length === 0) problems.push('no matrices rendered');
      matrices.forEach(m => {
        const sr = m.shadowRoot as ShadowRoot;
        const table = sr.querySelector('table') as HTMLTableElement | null;
        const label = `#${m.id}`;
        if (!table) {
          // Empty state: no data, so no table — must still say something visible.
          if ((m.roles ?? []).length > 0 || (m.permissions ?? []).length > 0) {
            problems.push(`${label}: data present but no table`);
          } else if (sr.textContent!.trim().length === 0) {
            problems.push(`${label}: empty state renders nothing`);
          }
          return;
        }
        const headers = [...table.querySelectorAll('thead th')] as HTMLElement[];
        const rows = [...table.querySelectorAll('tbody tr')] as HTMLElement[];
        if (headers.length === 0 || rows.length === 0) {
          problems.push(`${label}: ${headers.length} headers / ${rows.length} rows`);
          return;
        }
        const headerRects = headers.map(h => h.getBoundingClientRect());

        let prevBottom: number | null = null;
        rows.forEach((row, ri) => {
          const cells = [...row.children] as HTMLElement[];
          if (cells.length !== headers.length) {
            problems.push(`${label} row[${ri}]: ${cells.length} cells vs ${headers.length} columns`);
            return;
          }
          const rects = cells.map(c => c.getBoundingClientRect());
          rects.forEach((r, ci) => {
            if (Math.abs(r.left - headerRects[ci].left) > 1
                || Math.abs(r.right - headerRects[ci].right) > 1) {
              problems.push(`${label} row[${ri}] col[${ci}]: not under its header`
                + ` (${Math.round(r.left)}..${Math.round(r.right)}`
                + ` vs ${Math.round(headerRects[ci].left)}..${Math.round(headerRects[ci].right)})`);
            }
          });
          const tops = rects.map(r => Math.round(r.top));
          const bottoms = rects.map(r => Math.round(r.bottom));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`${label} row[${ri}]: cells have uneven tops`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`${label} row[${ri}]: cells have uneven bottoms`);
          }
          const rowTop = Math.min(...tops);
          if (prevBottom !== null && Math.abs(rowTop - prevBottom) > 1) {
            problems.push(`${label} row[${ri}]: seam ${prevBottom} -> ${rowTop}`);
          }
          prevBottom = Math.max(...bottoms);
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('grant controls are centred in their cell and role labels stay in theirs', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-permission-matrix').forEach(m => {
        const sr = (m as HTMLElement).shadowRoot!;
        const label = `#${m.id}`;
        [...sr.querySelectorAll('.matrix-cell')].forEach((cell, ci) => {
          const cr = (cell as HTMLElement).getBoundingClientRect();
          const control = cell.querySelector('.matrix-checkbox, .matrix-readonly-indicator') as HTMLElement | null;
          if (!control) { problems.push(`${label} cell[${ci}]: no grant control`); return; }
          const kr = control.getBoundingClientRect();
          if (kr.width < 10 || kr.height < 10) {
            problems.push(`${label} cell[${ci}]: control too small (${Math.round(kr.width)}x${Math.round(kr.height)})`);
          }
          if (kr.width > cr.width || kr.height > cr.height) {
            problems.push(`${label} cell[${ci}]: control larger than its cell`);
          }
          const dx = (kr.left + kr.width / 2) - (cr.left + cr.width / 2);
          const dy = (kr.top + kr.height / 2) - (cr.top + cr.height / 2);
          if (Math.abs(dx) > 1.5) problems.push(`${label} cell[${ci}]: control off-centre by ${dx.toFixed(1)}px`);
          if (Math.abs(dy) > 1.5) problems.push(`${label} cell[${ci}]: control off-middle by ${dy.toFixed(1)}px`);
        });

        [...sr.querySelectorAll('.matrix-role-cell')].forEach((cell, ci) => {
          const cr = (cell as HTMLElement).getBoundingClientRect();
          [...cell.children].forEach(child => {
            const r = (child as HTMLElement).getBoundingClientRect();
            if (r.height === 0) return;
            if (r.left < cr.left - 1 || r.right > cr.right + 1
                || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
              problems.push(`${label} role cell[${ci}]: ${(child as HTMLElement).className} escapes the cell`);
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('a wide matrix scrolls inside its own box instead of stretching the page', async ({ page }) => {
    const geo = await page.locator('#pm-large').evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const box = sr.querySelector('.matrix') as HTMLElement;
      const table = sr.querySelector('table') as HTMLElement;
      return {
        hostWidth: el.getBoundingClientRect().width,
        boxWidth: box.getBoundingClientRect().width,
        boxScrollWidth: box.scrollWidth,
        overflowX: getComputedStyle(box).overflowX,
        tableWidth: table.getBoundingClientRect().width,
        pageScrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth
      };
    });

    // The scroll box tracks the host width (its 1px border sits just outside).
    expect(geo.boxWidth).toBeLessThanOrEqual(geo.hostWidth + 4);
    // The table is genuinely wider than the box, so the box must be the scroller.
    expect(geo.tableWidth).toBeGreaterThan(geo.boxWidth);
    expect(['auto', 'scroll']).toContain(geo.overflowX);
    expect(geo.boxScrollWidth).toBeGreaterThan(Math.round(geo.boxWidth));
    expect(geo.pageScrollWidth).toBeLessThanOrEqual(geo.viewport + 1);
  });

  test('toggling a grant does not reflow the grid', async ({ page }) => {
    const matrix = page.locator('#pm-editable');
    const before = await matrix.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      return [...sr.querySelectorAll('tbody tr')].map(r => {
        const b = (r as HTMLElement).getBoundingClientRect();
        return [Math.round(b.top), Math.round(b.height)];
      });
    });

    const box = matrix.locator('.matrix-checkbox').first();
    const wasChecked = await box.isChecked();
    await box.click();
    await page.waitForTimeout(250);

    const after = await matrix.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const first = sr.querySelector('.matrix-checkbox') as HTMLInputElement;
      const cell = first.closest('td')!.getBoundingClientRect();
      const kr = first.getBoundingClientRect();
      return {
        rows: [...sr.querySelectorAll('tbody tr')].map(r => {
          const b = (r as HTMLElement).getBoundingClientRect();
          return [Math.round(b.top), Math.round(b.height)];
        }),
        checked: first.checked,
        dx: (kr.left + kr.width / 2) - (cell.left + cell.width / 2),
        dy: (kr.top + kr.height / 2) - (cell.top + cell.height / 2)
      };
    });

    expect(after.checked).toBe(!wasChecked);
    expect(after.rows).toEqual(before);
    expect(Math.abs(after.dx)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(after.dy)).toBeLessThanOrEqual(1.5);
  });
});
