import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/diff/demo.html';

test.describe('Snice Diff visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('diff lines tile: cells share a row band, rows abut, gutters form straight columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const diffs = [...document.querySelectorAll('snice-diff')] as any[];
      if (diffs.length === 0) problems.push('no diffs on page');

      diffs.forEach(diff => {
        const id = diff.id || '(anon)';
        const tables = [...(diff.shadowRoot?.querySelectorAll('.diff-table') ?? [])] as HTMLElement[];
        tables.forEach((table, t) => {
          const tRect = table.getBoundingClientRect();
          // Every rendered row, including the "... N unchanged lines" hunk
          // collapse row, which is a plain <tr> with a single spanning cell.
          const drawn = ([...table.querySelectorAll('tr')] as HTMLElement[])
            .filter(r => r.getBoundingClientRect().height > 0);
          if (drawn.length === 0) return;

          let prevBottom: number | null = null;
          const columnLefts: number[][] = [];

          drawn.forEach((row, i) => {
            const rr = row.getBoundingClientRect();
            const cells = [...row.children] as HTMLElement[];
            const rects = cells.map(c => c.getBoundingClientRect());

            // Every cell of a line occupies the full row band - no cell rides
            // high or short, so the marker/number/code stay on one line.
            rects.forEach((cr, c) => {
              if (Math.abs(cr.top - rr.top) > 1 || Math.abs(cr.bottom - rr.bottom) > 1) {
                problems.push(`${id} table${t} line ${i} cell ${c}: `
                  + `${Math.round(cr.top)}..${Math.round(cr.bottom)} vs row `
                  + `${Math.round(rr.top)}..${Math.round(rr.bottom)}`);
              }
              if (cr.right > tRect.right + 1) {
                problems.push(`${id} table${t} line ${i} cell ${c}: overhangs the table`);
              }
            });

            // Consecutive rows abut - no gap, no overlap.
            if (prevBottom !== null && Math.abs(rr.top - prevBottom) > 1) {
              problems.push(`${id} table${t} row ${i}: seam ${Math.round(prevBottom)} -> ${Math.round(rr.top)}`);
            }
            prevBottom = rr.bottom;

            if (row.classList.contains('diff-line')) {
              columnLefts.push(rects.map(r => Math.round(r.left)));
            }
          });
          if (columnLefts.length === 0) return;

          // Gutters/markers/code form straight vertical columns down the table.
          const widths = columnLefts[0].length;
          if (columnLefts.every(l => l.length === widths)) {
            for (let c = 0; c < widths; c++) {
              const lefts = columnLefts.map(l => l[c]);
              if (Math.max(...lefts) - Math.min(...lefts) > 1) {
                problems.push(`${id} table${t} column ${c}: ragged left edges ${[...new Set(lefts)].join(',')}`);
              }
            }
          } else {
            problems.push(`${id} table${t}: rows have differing cell counts`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('split mode puts two equal panes side by side with corresponding lines aligned', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const diff = document.getElementById('diff-split') as any;
      if (!diff) return ['#diff-split missing'];

      const panes = [...diff.shadowRoot.querySelectorAll('.diff-split-pane')] as HTMLElement[];
      if (panes.length !== 2) return [`expected 2 panes, got ${panes.length}`];

      const [l, r] = panes.map(p => p.getBoundingClientRect());
      if (Math.abs(l.width - r.width) > 2) {
        problems.push(`panes uneven: ${Math.round(l.width)} vs ${Math.round(r.width)}`);
      }
      if (r.left < l.right - 1) problems.push('panes overlap horizontally');
      if (Math.abs(l.top - r.top) > 1) problems.push('panes are not top-aligned');

      const rowsOf = (p: HTMLElement) =>
        [...p.querySelectorAll('.diff-line')].map(x => Math.round(x.getBoundingClientRect().top));
      const lt = rowsOf(panes[0]);
      const rt = rowsOf(panes[1]);
      if (lt.length !== rt.length) {
        problems.push(`pane line counts differ: ${lt.length} vs ${rt.length}`);
      } else {
        lt.forEach((top, i) => {
          if (Math.abs(top - rt[i]) > 1) {
            problems.push(`line ${i} desynced across panes: ${top} vs ${rt[i]}`);
          }
        });
      }
      return problems;
    });

    expect(failures).toEqual([]);
  });

  // BUG: a diff line whose code is empty renders 17px tall while every other
  // line is 20px, so blank lines shrink the monospace line grid and the gutter
  // numbering loses its constant rhythm (visible in #diff-unified, #diff-split,
  // and every showcase whose text contains a blank line).
  test.fixme('all rendered diff lines share one line height', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-diff')].forEach((diff: any) => {
        [...diff.shadowRoot.querySelectorAll('.diff-table')].forEach((table: Element, t) => {
          const heights = [...table.querySelectorAll('.diff-line')]
            .map(r => Math.round(r.getBoundingClientRect().height))
            .filter(h => h > 0);
          const distinct = [...new Set(heights)];
          if (distinct.length > 1) {
            problems.push(`${diff.id || '(anon)'} table${t}: line heights ${distinct.join(',')}`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });
});
