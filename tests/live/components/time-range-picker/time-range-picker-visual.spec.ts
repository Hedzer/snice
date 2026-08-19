import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/time-range-picker/visual.html';

test.describe('Snice Time Range Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('slots tile the list: equal widths, shared edges, no gaps or overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-time-range-picker').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const list = root?.querySelector('.slots-container') as HTMLElement | null;
        if (!list) { problems.push(`picker[${i}]: no slots container`); return; }
        const lr = list.getBoundingClientRect();
        const slots = [...list.querySelectorAll('.slot')] as HTMLElement[];
        if (slots.length < 2) { problems.push(`picker[${i}]: ${slots.length} slots`); return; }

        const rects = slots.map(s => s.getBoundingClientRect());
        const widths = rects.map(r => Math.round(r.width));
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`picker[${i}]: slot widths differ (${Math.min(...widths)}..${Math.max(...widths)})`);
        }
        const lefts = rects.map(r => Math.round(r.left));
        if (Math.max(...lefts) - Math.min(...lefts) > 1) {
          problems.push(`picker[${i}]: slots not left-aligned`);
        }
        for (let s = 1; s < rects.length; s++) {
          const seam = rects[s].top - rects[s - 1].bottom;
          if (Math.abs(seam) > 1) {
            problems.push(`picker[${i}] slot ${s}: seam gap/overlap of ${seam.toFixed(1)}px`);
            break;
          }
        }
        rects.forEach((r, s) => {
          if (r.left < lr.left - 1 || r.right > lr.right + 1) {
            problems.push(`picker[${i}] slot ${s}: overhangs the list horizontally`);
          }
          if (r.height < 12) {
            problems.push(`picker[${i}] slot ${s}: collapsed (${Math.round(r.height)}px tall)`);
          }
        });

        // The label inside each slot must stay in its slot.
        slots.forEach((slot, s) => {
          const time = slot.querySelector('.slot-time') as HTMLElement | null;
          if (!time) return;
          const r = time.getBoundingClientRect();
          const sr = slot.getBoundingClientRect();
          if (r.left < sr.left - 1 || r.right > sr.right + 1
              || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`picker[${i}] slot ${s}: time label escapes the slot`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the long slot list scrolls inside the picker instead of overflowing it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-time-range-picker').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const wrapper = root?.querySelector('.wrapper') as HTMLElement | null;
        const header = root?.querySelector('.header') as HTMLElement | null;
        const list = root?.querySelector('.slots-container') as HTMLElement | null;
        if (!wrapper || !header || !list) return;
        const wr = wrapper.getBoundingClientRect();
        const hr = header.getBoundingClientRect();
        const lr = list.getBoundingClientRect();

        if (lr.top < hr.bottom - 1) {
          problems.push(`picker[${i}]: slot list overlaps the header`);
        }
        if (lr.bottom > wr.bottom + 1 || lr.right > wr.right + 1 || lr.left < wr.left - 1) {
          problems.push(`picker[${i}]: slot list escapes the picker box`);
        }
        if (list.scrollHeight > list.clientHeight + 1) {
          const overflowY = getComputedStyle(list).overflowY;
          if (overflowY === 'visible') {
            problems.push(`picker[${i}]: ${list.scrollHeight}px of slots overflow`
              + ` a ${list.clientHeight}px list without scrolling`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('dragging a range highlights a contiguous block and updates the header', async ({ page }) => {
    const anchors = await page.evaluate(() => {
      const host = document.querySelector('snice-time-range-picker') as HTMLElement;
      const slots = host.shadowRoot!.querySelectorAll('.slot');
      const a = slots[1].getBoundingClientRect();
      const b = slots[4].getBoundingClientRect();
      return {
        from: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
        to: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
      };
    });

    await page.mouse.move(anchors.from.x, anchors.from.y);
    await page.mouse.down();
    await page.mouse.move(anchors.to.x, anchors.to.y, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const host = document.querySelector('snice-time-range-picker') as HTMLElement;
      const root = host.shadowRoot!;
      const all = [...root.querySelectorAll('.slot')] as HTMLElement[];
      const selected = all.filter(s => s.getAttribute('aria-selected') === 'true');
      const indices = selected.map(s => all.indexOf(s));
      const list = root.querySelector('.slots-container')!.getBoundingClientRect();
      const rects = selected.map(s => s.getBoundingClientRect());
      return {
        count: selected.length,
        contiguous: indices.every((v, i) => i === 0 || v === indices[i - 1] + 1),
        header: root.querySelector('.header-value')!.textContent!.trim(),
        withinList: rects.every(r => r.left >= list.left - 1 && r.right <= list.right + 1),
        hasStart: !!root.querySelector('.slot--range-start'),
        hasEnd: !!root.querySelector('.slot--range-end'),
      };
    });

    expect(result.count).toBe(4);
    expect(result.contiguous).toBe(true);
    expect(result.withinList).toBe(true);
    expect(result.hasStart).toBe(true);
    expect(result.hasEnd).toBe(true);
    expect(result.header).toMatch(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
  });
});
