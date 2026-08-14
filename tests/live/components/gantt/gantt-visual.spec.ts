import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/gantt/demo.html';

const ROW = 36; // .gantt-timeline-rows lays bars out on a 2.25rem grid

test.describe('Snice Gantt visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('bars sit on the timeline row grid and their fills stay inside the bar', async ({ page }) => {
    const failures = await page.evaluate((ROW) => {
      const problems: string[] = [];
      document.querySelectorAll('snice-gantt').forEach((host, gi) => {
        const root = (host as any).shadowRoot;
        const rows = root?.querySelector('.gantt-timeline-rows');
        if (!rows) { problems.push(`gantt[${gi}]: no timeline rows`); return; }
        const rowsRect = rows.getBoundingClientRect();
        const bars = [...rows.querySelectorAll('.gantt-bar')] as HTMLElement[];
        if (bars.length === 0) { problems.push(`gantt[${gi}]: no bars`); return; }

        bars.forEach((bar, bi) => {
          const br = bar.getBoundingClientRect();
          if (br.width <= 0 || br.height <= 0) {
            problems.push(`gantt[${gi}] bar ${bi}: zero size`);
            return;
          }
          // Every bar must land in exactly one 2.25rem row band.
          const offset = br.top - rowsRect.top;
          const band = Math.round((offset - 6) / ROW);
          if (Math.abs(offset - 6 - band * ROW) > 1) {
            problems.push(`gantt[${gi}] bar ${bi}: top offset ${offset.toFixed(1)} is off the ${ROW}px row grid`);
          }
          if (br.height > ROW) {
            problems.push(`gantt[${gi}] bar ${bi}: height ${Math.round(br.height)} exceeds row ${ROW}`);
          }
          if (br.bottom > rowsRect.bottom + 1 || br.top < rowsRect.top - 1
              || br.left < rowsRect.left - 1 || br.right > rowsRect.right + 1) {
            problems.push(`gantt[${gi}] bar ${bi}: escapes the timeline rows box`);
          }

          const fill = bar.querySelector('.gantt-bar-progress');
          if (fill) {
            const fr = fill.getBoundingClientRect();
            if (fr.width > br.width + 1 || fr.left < br.left - 1 || fr.right > br.right + 1) {
              problems.push(`gantt[${gi}] bar ${bi}: progress fill ${Math.round(fr.width)} wider than bar ${Math.round(br.width)}`);
            }
            if (Math.abs(fr.height - br.height) > 1) {
              problems.push(`gantt[${gi}] bar ${bi}: progress fill height ${Math.round(fr.height)} != bar ${Math.round(br.height)}`);
            }
          }

          const left = bar.querySelector('.gantt-bar-handle--left');
          const right = bar.querySelector('.gantt-bar-handle--right');
          if (left && Math.abs(left.getBoundingClientRect().left - br.left) > 1) {
            problems.push(`gantt[${gi}] bar ${bi}: left handle detached from the bar edge`);
          }
          if (right && Math.abs(right.getBoundingClientRect().right - br.right) > 1) {
            problems.push(`gantt[${gi}] bar ${bi}: right handle detached from the bar edge`);
          }
        });
      });
      return problems;
    }, ROW);
    expect(failures).toEqual([]);
  });

  test('the timeline header and rows share one horizontal scroll surface', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-gantt').forEach((host, gi) => {
        const root = (host as any).shadowRoot;
        const timeline = root?.querySelector('.gantt-timeline');
        const header = root?.querySelector('.gantt-timeline-header');
        const rows = root?.querySelector('.gantt-timeline-rows');
        if (!timeline || !header || !rows) { problems.push(`gantt[${gi}]: missing timeline parts`); return; }
        const hr = header.getBoundingClientRect();
        const rr = rows.getBoundingClientRect();
        // Header cells and the bar canvas must be the same width, otherwise
        // dates and bars scroll out of correspondence.
        if (Math.abs(hr.width - rr.width) > 1) {
          problems.push(`gantt[${gi}]: header width ${Math.round(hr.width)} != rows width ${Math.round(rr.width)}`);
        }
        if (Math.abs(hr.left - rr.left) > 1) {
          problems.push(`gantt[${gi}]: header left ${Math.round(hr.left)} != rows left ${Math.round(rr.left)}`);
        }
        if (Math.abs(rr.top - hr.bottom) > 1) {
          problems.push(`gantt[${gi}]: seam header ${Math.round(hr.bottom)} -> rows ${Math.round(rr.top)}`);
        }
        // The timeline viewport itself must not overflow the chart.
        const tr = timeline.getBoundingClientRect();
        const container = root.querySelector('.gantt-container').getBoundingClientRect();
        if (tr.right > container.right + 1) {
          problems.push(`gantt[${gi}]: timeline viewport overhangs the container`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: the left task list and the timeline are laid out on two different
  // row pitches. `.gantt-task-name` sets `height: 2.25rem` but also adds
  // 0.5rem block padding and a 1px border under content-box sizing, so each
  // label row is 53px tall, while `.gantt-timeline-rows` positions bars on a
  // 2.25rem (36px) grid. The two headers differ too (49px vs 33px). Labels
  // therefore drift ~17px further from their own bar with every row -- by
  // task 5 of the showcase the name sits nearly three rows below its bar.
  test.fixme('task-list labels line up with their timeline bars', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-gantt').forEach((host, gi) => {
        const root = (host as any).shadowRoot;
        const names = [...root.querySelectorAll('.gantt-task-name')] as HTMLElement[];
        const bars = [...root.querySelectorAll('.gantt-bar')] as HTMLElement[];
        if (names.length === 0 || names.length !== bars.length) return;
        names.forEach((name, i) => {
          const nr = name.getBoundingClientRect();
          const br = bars[i].getBoundingClientRect();
          const dy = (nr.top + nr.height / 2) - (br.top + br.height / 2);
          if (Math.abs(dy) > 3) {
            problems.push(`gantt[${gi}] row ${i}: label center off its bar by ${dy.toFixed(1)}px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
