import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/activity-feed/visual.html';

test.describe('Snice Activity Feed visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('entries tile down the list: sane icon gutter, no overlap, no overhang', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const feeds = [...document.querySelectorAll('snice-activity-feed')] as any[];
      if (feeds.length === 0) problems.push('no feeds on page');

      feeds.forEach((feed, f) => {
        const list = feed.shadowRoot?.querySelector('.feed__list');
        if (!list) return; // empty-state feeds render no list
        const listRect = list.getBoundingClientRect();
        const rows = [...list.children] as HTMLElement[];

        let prevBottom: number | null = null;
        rows.forEach((row, r) => {
          const rr = row.getBoundingClientRect();
          if (rr.height === 0) return;

          // Rows stay inside the list box horizontally.
          if (rr.left < listRect.left - 1 || rr.right > listRect.right + 1) {
            problems.push(`feed[${f}] row[${r}]: overhangs list `
              + `(${Math.round(rr.left)}..${Math.round(rr.right)} vs `
              + `${Math.round(listRect.left)}..${Math.round(listRect.right)})`);
          }
          // Rows stack downward without overlapping the previous row.
          if (prevBottom !== null && rr.top < prevBottom - 1) {
            problems.push(`feed[${f}] row[${r}]: overlaps previous row `
              + `(top ${Math.round(rr.top)} < ${Math.round(prevBottom)})`);
          }
          prevBottom = rr.bottom;

          if (!row.classList.contains('feed__entry')) return;

          const icon = row.querySelector('.feed__icon') as HTMLElement | null;
          const content = row.querySelector('.feed__content') as HTMLElement | null;
          if (!icon || !content) {
            problems.push(`feed[${f}] row[${r}]: missing icon/content`);
            return;
          }
          const ir = icon.getBoundingClientRect();
          const cr = content.getBoundingClientRect();

          // Icon badge is a sane, near-square avatar-sized box.
          if (ir.width < 16 || ir.width > 72 || Math.abs(ir.width - ir.height) > 2) {
            problems.push(`feed[${f}] row[${r}]: icon ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
          // Icon and content sit in their own columns - text never runs under the badge.
          if (cr.left < ir.right - 1) {
            problems.push(`feed[${f}] row[${r}]: content left ${Math.round(cr.left)} `
              + `collides with icon right ${Math.round(ir.right)}`);
          }
          // Both stay inside the entry box.
          if (ir.top < rr.top - 1 || ir.bottom > rr.bottom + 1
              || cr.top < rr.top - 1 || cr.bottom > rr.bottom + 1) {
            problems.push(`feed[${f}] row[${r}]: icon/content spills the entry vertically`);
          }
          if (cr.right > rr.right + 1) {
            problems.push(`feed[${f}] row[${r}]: content right ${Math.round(cr.right)} > entry ${Math.round(rr.right)}`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('filter chips wrap into aligned rows inside the filter bar', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-activity-feed')].forEach((feed: any, f) => {
        const bar = feed.shadowRoot?.querySelector('.feed__filters');
        if (!bar) return;
        const barRect = bar.getBoundingClientRect();
        const chips = [...bar.querySelectorAll('.feed__filter')] as HTMLElement[];
        if (chips.length === 0) return;

        // Group chips by visual row, then require a shared baseline per row.
        const byRow = new Map<number, DOMRect[]>();
        chips.forEach(chip => {
          const r = chip.getBoundingClientRect();
          if (r.left < barRect.left - 1 || r.right > barRect.right + 1
              || r.top < barRect.top - 1 || r.bottom > barRect.bottom + 1) {
            problems.push(`feed[${f}] filter "${chip.textContent?.trim()}" escapes the filter bar`);
          }
          const key = Math.round(r.top / 8);
          if (!byRow.has(key)) byRow.set(key, []);
          byRow.get(key)!.push(r);
        });
        byRow.forEach((rects, key) => {
          const tops = rects.map(r => Math.round(r.top));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`feed[${f}] filter row ${key}: uneven tops ${tops.join(',')}`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });
});
