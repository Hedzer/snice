import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/date-picker/demo.html';

test.describe('Snice Date Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('opened calendar panel is sanely sized, anchored under the input, and contains its day grid', async ({ page }) => {
    const first = page.locator('snice-date-picker').first();
    await first.click();
    await page.waitForTimeout(250);

    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-date-picker') as HTMLElement;
      const root = host.shadowRoot!;
      const cal = root.querySelector('.calendar') as HTMLElement | null;
      const input = root.querySelector('.input-container') as HTMLElement | null;
      if (!cal || !input) return ['calendar or input container missing'];

      const c = cal.getBoundingClientRect();
      const i = input.getBoundingClientRect();

      if (c.width < 240 || c.width > 520) problems.push(`panel width ${Math.round(c.width)} out of range`);
      if (c.height < 240 || c.height > 640) problems.push(`panel height ${Math.round(c.height)} out of range`);
      if (c.top < i.bottom - 2) problems.push(`panel top ${Math.round(c.top)} overlaps the input (bottom ${Math.round(i.bottom)})`);
      if (c.left < 0 || c.right > window.innerWidth) {
        problems.push(`panel escapes the viewport horizontally (${Math.round(c.left)}..${Math.round(c.right)})`);
      }

      const days = [...root.querySelectorAll('.calendar-days > *')] as HTMLElement[];
      if (days.length < 28) problems.push(`only ${days.length} day cells rendered`);
      days.forEach((d, n) => {
        const r = d.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1) {
          problems.push(`day cell ${n} escapes the calendar panel`);
        }
      });

      // Day cells tile in rows of 7: shared tops within a row, rows abut.
      const rows: DOMRect[][] = [];
      for (let r0 = 0; r0 < days.length; r0 += 7) {
        rows.push(days.slice(r0, r0 + 7).map(d => d.getBoundingClientRect()));
      }
      rows.forEach((row, w) => {
        const tops = row.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`day row ${w}: uneven tops ${tops.join(',')}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.day { width: 32px }` inside `.calendar-days { grid-template-columns:
  // repeat(7, 1fr) }` makes each day button start-aligned in a ~42px column,
  // while `.weekday` headers stretch and center across the full column. Every
  // day number therefore renders ~5px left of the weekday letter above it, and
  // the day grid leaves a ragged gap down its right edge.
  test.fixme('day numbers line up under their weekday headers', async ({ page }) => {
    await page.locator('snice-date-picker').first().click();
    await page.waitForTimeout(250);

    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const root = (document.querySelector('snice-date-picker') as HTMLElement).shadowRoot!;
      const heads = [...root.querySelectorAll('.weekday')] as HTMLElement[];
      const days = [...root.querySelectorAll('.calendar-days > *')].slice(0, 7) as HTMLElement[];
      heads.forEach((h, i) => {
        const hr = h.getBoundingClientRect();
        const dr = days[i]?.getBoundingClientRect();
        if (!dr || dr.width === 0) return;
        const dx = (dr.left + dr.width / 2) - (hr.left + hr.width / 2);
        if (Math.abs(dx) > 1.5) {
          problems.push(`column ${i}: day center off header center by ${dx.toFixed(1)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
