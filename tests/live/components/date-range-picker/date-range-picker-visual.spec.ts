import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/date-range-picker/visual.html';

test.describe('Snice Date Range Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('closed pickers stack label over field with the toggle centred inside the field', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const pickers = [...document.querySelectorAll('snice-date-range-picker')] as HTMLElement[];
      if (pickers.length === 0) problems.push('no pickers rendered');
      pickers.forEach((pk, i) => {
        const sr = pk.shadowRoot!;
        const label = sr.querySelector('.label') as HTMLElement | null;
        const container = sr.querySelector('.input-container') as HTMLElement;
        const input = sr.querySelector('.input') as HTMLElement;
        const toggle = sr.querySelector('.calendar-toggle') as HTMLElement | null;
        const calendar = sr.querySelector('.calendar') as HTMLElement;
        if (!container || !input || !calendar) { problems.push(`picker[${i}]: missing parts`); return; }
        const cr = container.getBoundingClientRect();
        const ir = input.getBoundingClientRect();

        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.height > 0 && lr.bottom > cr.top + 1) {
            problems.push(`picker[${i}]: label overlaps the field`);
          }
        }
        if (Math.abs(ir.width - cr.width) > 1) {
          problems.push(`picker[${i}]: field ${Math.round(ir.width)} != container ${Math.round(cr.width)}`);
        }
        if (ir.height < 24) problems.push(`picker[${i}]: field collapsed to ${Math.round(ir.height)}px`);

        if (toggle) {
          const tr = toggle.getBoundingClientRect();
          if (tr.width > 0) {
            if (tr.right > ir.right - 1 || tr.left < ir.left) {
              problems.push(`picker[${i}]: toggle escapes the field horizontally`);
            }
            if (tr.top < ir.top - 0.5 || tr.bottom > ir.bottom + 0.5) {
              problems.push(`picker[${i}]: toggle escapes the field vertically`);
            }
            const dy = (tr.top + tr.height / 2) - (ir.top + ir.height / 2);
            if (Math.abs(dy) > 1.5) {
              problems.push(`picker[${i}]: toggle off-centre by ${dy.toFixed(1)}px`);
            }
          }
        }

        // Closed popovers must take no space at all.
        if (!calendar.classList.contains('calendar--open')) {
          const kr = calendar.getBoundingClientRect();
          if (kr.width > 0 || kr.height > 0) {
            problems.push(`picker[${i}]: closed popover occupies ${Math.round(kr.width)}x${Math.round(kr.height)}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('open dual-calendar popover lays presets beside two equal months, inside the viewport', async ({ page }) => {
    // "columns=2 + presets" showcase.
    const picker = page.locator('snice-date-range-picker#drp-dual-presets');
    await picker.locator('.input').click();
    await expect(picker.locator('.calendar--open')).toBeVisible();
    await page.waitForTimeout(250);

    const failures = await picker.evaluate(el => {
      const problems: string[] = [];
      const sr = (el as HTMLElement).shadowRoot!;
      const cal = sr.querySelector('.calendar--open') as HTMLElement;
      const kr = cal.getBoundingClientRect();
      const inputRect = sr.querySelector('.input')!.getBoundingClientRect();

      if (kr.width < 300 || kr.height < 200) {
        problems.push(`popover too small (${Math.round(kr.width)}x${Math.round(kr.height)})`);
      }
      if (kr.left < 0 || kr.top < 0 || kr.right > window.innerWidth + 1 || kr.bottom > window.innerHeight + 1) {
        problems.push(`popover outside viewport (${Math.round(kr.left)},${Math.round(kr.top)}`
          + ` ${Math.round(kr.right)},${Math.round(kr.bottom)} vs ${window.innerWidth}x${window.innerHeight})`);
      }
      if (Math.abs(kr.left - inputRect.left) > 8) {
        problems.push(`popover not anchored to the field (${Math.round(kr.left)} vs ${Math.round(inputRect.left)})`);
      }

      const presets = sr.querySelector('.presets') as HTMLElement | null;
      const months = sr.querySelector('.months') as HTMLElement;
      const monthEls = [...sr.querySelectorAll('.month')] as HTMLElement[];
      if (!months || monthEls.length !== 2) {
        problems.push(`expected 2 months, found ${monthEls.length}`);
        return problems;
      }
      const [a, bm] = monthEls.map(m => m.getBoundingClientRect());
      if (Math.abs(a.width - bm.width) > 1 || Math.abs(a.height - bm.height) > 1) {
        problems.push(`months differ (${Math.round(a.width)}x${Math.round(a.height)}`
          + ` vs ${Math.round(bm.width)}x${Math.round(bm.height)})`);
      }
      if (Math.abs(a.top - bm.top) > 1) problems.push('months not aligned on their top edge');
      if (bm.left < a.right - 0.5) problems.push('months overlap horizontally');
      const mr = months.getBoundingClientRect();
      if (a.left < mr.left - 1 || bm.right > mr.right + 1) problems.push('months escape their row');

      if (presets) {
        const pr = presets.getBoundingClientRect();
        if (pr.width < 40) problems.push(`presets rail collapsed to ${Math.round(pr.width)}px`);
        if (pr.right > mr.left + 0.5) problems.push('presets rail overlaps the months');
        [...presets.querySelectorAll('.preset-button')].forEach((btn, i) => {
          const br = (btn as HTMLElement).getBoundingClientRect();
          if (br.right > pr.right + 1 || br.left < pr.left - 1) {
            problems.push(`preset[${i}] escapes the rail`);
          }
        });
      }

      const footer = sr.querySelector('.calendar-footer') as HTMLElement | null;
      if (footer) {
        const fr = footer.getBoundingClientRect();
        if (fr.top < mr.bottom - 1) problems.push('footer overlaps the calendar body');
        if (fr.bottom > kr.bottom + 1) problems.push('footer escapes the popover');
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('day cells tile each month grid in seven equal columns', async ({ page }) => {
    const picker = page.locator('snice-date-range-picker#drp-dual-presets');
    await picker.locator('.input').click();
    await expect(picker.locator('.calendar--open')).toBeVisible();
    await page.waitForTimeout(250);

    const failures = await picker.evaluate(el => {
      const problems: string[] = [];
      const sr = (el as HTMLElement).shadowRoot!;
      [...sr.querySelectorAll('.month')].forEach((month, mi) => {
        const mr = (month as HTMLElement).getBoundingClientRect();
        const days = [...month.querySelectorAll('.calendar-days .day')] as HTMLElement[];
        const weekdays = [...month.querySelectorAll('.calendar-weekdays .weekday')] as HTMLElement[];
        if (days.length < 28) { problems.push(`month[${mi}]: only ${days.length} day cells`); return; }
        if (weekdays.length !== 7) { problems.push(`month[${mi}]: ${weekdays.length} weekday headers`); return; }

        const rects = days.map(d => d.getBoundingClientRect());
        const widths = rects.map(r => r.width);
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`month[${mi}]: day cells differ in width`
            + ` (${Math.min(...widths).toFixed(1)}..${Math.max(...widths).toFixed(1)})`);
        }
        rects.forEach((r, i) => {
          if (r.left < mr.left - 1 || r.right > mr.right + 1
              || r.top < mr.top - 1 || r.bottom > mr.bottom + 1) {
            problems.push(`month[${mi}] day[${i}]: escapes the month box`);
          }
        });

        // Seven columns: the first week's cells line up under the weekday headers.
        const firstWeek = rects.slice(0, 7);
        firstWeek.forEach((r, i) => {
          const wr = weekdays[i].getBoundingClientRect();
          const dx = (r.left + r.width / 2) - (wr.left + wr.width / 2);
          if (Math.abs(dx) > 1.5) {
            problems.push(`month[${mi}] column ${i}: day off its weekday header by ${dx.toFixed(1)}px`);
          }
        });
        // Rows must not overlap each other.
        const byTop = new Map<number, number>();
        rects.forEach(r => byTop.set(Math.round(r.top), Math.round(r.bottom)));
        const tops = [...byTop.keys()].sort((x, y) => x - y);
        for (let i = 1; i < tops.length; i++) {
          if (tops[i] < byTop.get(tops[i - 1])! - 1) {
            problems.push(`month[${mi}]: day rows overlap at ${tops[i]}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
