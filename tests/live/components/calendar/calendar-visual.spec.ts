import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/calendar/visual.html';

// Complements calendar.spec.ts (week-row tiling) with header/column alignment
// and header-chrome containment. No screenshot baselines.
test.describe('Snice Calendar visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('weekday headers line up with their day columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-calendar').forEach((cal, i) => {
        const grid = (cal as HTMLElement).shadowRoot?.querySelector('.calendar__grid');
        if (!grid) { problems.push(`cal[${i}]: no grid`); return; }
        const weekdays = [...grid.querySelectorAll('.calendar__weekday')] as HTMLElement[];
        const days = [...grid.querySelectorAll('.calendar__day')] as HTMLElement[];
        if (weekdays.length !== 7) { problems.push(`cal[${i}]: ${weekdays.length} weekday cells`); return; }
        if (days.length < 7) { problems.push(`cal[${i}]: ${days.length} day cells`); return; }

        const firstWeek = days.slice(0, 7);
        weekdays.forEach((wd, c) => {
          const wr = wd.getBoundingClientRect();
          const dr = firstWeek[c].getBoundingClientRect();
          if (Math.abs(wr.left - dr.left) > 1 || Math.abs(wr.right - dr.right) > 1) {
            problems.push(`cal[${i}] column ${c}: header [${Math.round(wr.left)},${Math.round(wr.right)}]`
              + ` misaligned with days [${Math.round(dr.left)},${Math.round(dr.right)}]`);
          }
          // The header strip must sit above the first week, never over it.
          if (wr.bottom > dr.top + 1) {
            problems.push(`cal[${i}] column ${c}: header overlaps the first week row`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('header title and nav buttons stay inside the calendar box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-calendar').forEach((cal, i) => {
        const root = (cal as HTMLElement).shadowRoot;
        const header = root?.querySelector('.calendar__header') as HTMLElement | null;
        if (!header) return;
        const hr = header.getBoundingClientRect();
        const parts = [
          ...root!.querySelectorAll('.calendar__title'),
          ...root!.querySelectorAll('.calendar__nav-button'),
        ] as HTMLElement[];
        parts.forEach(p => {
          const r = p.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.left < hr.left - 1 || r.right > hr.right + 1
              || r.top < hr.top - 1 || r.bottom > hr.bottom + 1) {
            problems.push(`cal[${i}]: .${p.className.split(' ')[0]} escapes the header`);
          }
        });
        // Nav buttons must be tappable squares, not collapsed slivers.
        (root!.querySelectorAll('.calendar__nav-button') as NodeListOf<HTMLElement>).forEach((b, n) => {
          const r = b.getBoundingClientRect();
          if (r.width < 16 || r.height < 16) {
            problems.push(`cal[${i}] nav[${n}]: collapsed (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
