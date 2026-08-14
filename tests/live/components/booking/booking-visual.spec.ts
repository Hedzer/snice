import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/booking/demo.html';

test.describe('Snice Booking visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-booking'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-booking')?.shadowRoot?.querySelector('.booking__days .booking__day'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('day grid tiles in 7 aligned columns under the weekday header', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const bookings = [...document.querySelectorAll('snice-booking')] as HTMLElement[];
      if (bookings.length === 0) problems.push('no snice-booking on the page');

      bookings.forEach((booking, bi) => {
        const grid = booking.shadowRoot?.querySelector('.booking__days') as HTMLElement | null;
        const header = booking.shadowRoot?.querySelector('.booking__weekdays') as HTMLElement | null;
        if (!grid || !header) { problems.push(`booking[${bi}]: no day grid`); return; }

        const gridRect = grid.getBoundingClientRect();
        const days = [...grid.querySelectorAll('.booking__day')] as HTMLElement[];
        if (days.length === 0 || days.length % 7 !== 0) {
          problems.push(`booking[${bi}]: ${days.length} day cells (not a multiple of 7)`);
          return;
        }

        const rows: HTMLElement[][] = [];
        for (let r = 0; r < days.length / 7; r++) rows.push(days.slice(r * 7, r * 7 + 7));

        rows.forEach((row, r) => {
          const rects = row.map(c => c.getBoundingClientRect());
          const tops = rects.map(x => Math.round(x.top));
          const bottoms = rects.map(x => Math.round(x.bottom));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`booking[${bi}] row ${r}: uneven cell tops ${tops.join(',')}`);
          }
          if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
            problems.push(`booking[${bi}] row ${r}: uneven cell bottoms`);
          }
          rects.forEach((x, ci) => {
            if (x.width < 8 || x.height < 8) {
              problems.push(`booking[${bi}] row ${r} cell ${ci}: ${Math.round(x.width)}x${Math.round(x.height)}`);
            }
            if (Math.round(x.right) > Math.round(gridRect.right) + 1
                || Math.round(x.left) < Math.round(gridRect.left) - 1) {
              problems.push(`booking[${bi}] row ${r} cell ${ci}: overhangs the grid`);
            }
          });
          // Columns must advance left-to-right without overlapping.
          for (let ci = 1; ci < rects.length; ci++) {
            if (rects[ci].left < rects[ci - 1].right - 1) {
              problems.push(`booking[${bi}] row ${r} cell ${ci}: overlaps its left neighbour`);
            }
          }
          // Rows must abut vertically (allowing a fixed grid gap, but never a
          // negative one and never a wildly uneven seam).
          if (r > 0) {
            const prevBottom = rows[r - 1][0].getBoundingClientRect().bottom;
            const gap = rects[0].top - prevBottom;
            if (gap < -1 || gap > 12) {
              problems.push(`booking[${bi}] row ${r}: seam gap ${Math.round(gap)}px`);
            }
          }
        });

        // Each weekday label must sit over the column it names.
        const labels = [...header.querySelectorAll('.booking__weekday')] as HTMLElement[];
        if (labels.length !== 7) {
          problems.push(`booking[${bi}]: ${labels.length} weekday labels`);
        } else {
          labels.forEach((label, ci) => {
            const lr = label.getBoundingClientRect();
            const cr = rows[0][ci].getBoundingClientRect();
            const dx = (lr.left + lr.width / 2) - (cr.left + cr.width / 2);
            if (Math.abs(dx) > 2) {
              problems.push(`booking[${bi}] weekday ${ci}: off column by ${Math.round(dx)}px`);
            }
          });
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('picking a day advances the stepper and lays out time slots in a tidy grid', async ({ page }) => {
    const host = page.locator('#book-stepper');
    await expect(host).toHaveCount(1);

    // Step 1: pick an available day. Step 2: press the primary "Next" action.
    await host.locator('.booking__day--available').first().click();
    await host.locator('.booking__btn--primary').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('#book-stepper')!;
      return !!el.shadowRoot!.querySelector('.booking__slots, .booking__no-slots');
    });
    await page.waitForTimeout(150);

    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const el = document.querySelector('#book-stepper')!;
      const root = el.shadowRoot!;

      const steps = [...root.querySelectorAll('.booking__step')];
      const activeIdx = steps.findIndex(s => s.classList.contains('booking__step--active'));
      if (activeIdx !== 1) problems.push(`active step is ${activeIdx}, expected 1 (Time)`);

      const slotsBox = root.querySelector('.booking__slots') as HTMLElement | null;
      if (!slotsBox) { problems.push('no .booking__slots after picking a day'); return problems; }
      const container = (root.querySelector('.booking__slots-grid') ?? slotsBox) as HTMLElement;
      const cr = container.getBoundingClientRect();
      if (cr.width < 100 || cr.height < 20) {
        problems.push(`slots container ${Math.round(cr.width)}x${Math.round(cr.height)}`);
      }

      const slots = [...container.querySelectorAll('.booking__slot')] as HTMLElement[];
      if (slots.length === 0) { problems.push('no time slots rendered'); return problems; }

      slots.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        if (r.width < 30 || r.height < 20) {
          problems.push(`slot[${i}]: ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        if (r.left < cr.left - 1 || r.right > cr.right + 1
            || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
          problems.push(`slot[${i}]: escapes the slots container`);
        }
      });

      // Slots wrap into rows; every slot on a row shares its top edge and
      // every slot shares the same height.
      const heights = slots.map(s => Math.round(s.getBoundingClientRect().height));
      if (Math.max(...heights) - Math.min(...heights) > 1) {
        problems.push(`slot heights vary: ${Math.min(...heights)}..${Math.max(...heights)}`);
      }
      const byRow = new Map<number, DOMRect[]>();
      slots.forEach(s => {
        const r = s.getBoundingClientRect();
        const key = Math.round(r.top);
        if (!byRow.has(key)) byRow.set(key, []);
        byRow.get(key)!.push(r);
      });
      byRow.forEach((rects, top) => {
        const sorted = [...rects].sort((a, b) => a.left - b.left);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].left < sorted[i - 1].right - 1) {
            problems.push(`slots on row ${top} overlap horizontally`);
            break;
          }
        }
      });

      return problems;
    });
    expect(result).toEqual([]);
  });
});
