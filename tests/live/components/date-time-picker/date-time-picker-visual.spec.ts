import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/date-time-picker/visual.html';

test.describe('Snice Date Time Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-date-time-picker'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-date-time-picker[variant="inline"]')
        ?.shadowRoot?.querySelector('.calendar-days .day'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('inline panel: day cells tile under the weekday header and time lists sit in parallel columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const el = document.querySelector('snice-date-time-picker[variant="inline"]') as HTMLElement;
      if (!el) { problems.push('no inline picker on the page'); return problems; }
      const root = el.shadowRoot!;

      const grid = root.querySelector('.calendar-days') as HTMLElement;
      const header = root.querySelector('.calendar-weekdays') as HTMLElement;
      if (!grid || !header) { problems.push('inline picker has no calendar grid'); return problems; }
      const gr = grid.getBoundingClientRect();

      const days = [...grid.querySelectorAll('.day')] as HTMLElement[];
      if (days.length < 28) problems.push(`only ${days.length} day cells`);

      // Group cells into visual rows by their top edge.
      const rows = new Map<number, HTMLElement[]>();
      days.forEach(d => {
        const key = Math.round(d.getBoundingClientRect().top);
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key)!.push(d);
      });
      const rowTops = [...rows.keys()].sort((a, b) => a - b);

      rowTops.forEach((top, ri) => {
        const cells = rows.get(top)!;
        if (cells.length > 7) problems.push(`row ${ri}: ${cells.length} cells (>7)`);
        const rects = cells.map(c => c.getBoundingClientRect()).sort((a, b) => a.left - b.left);
        const bottoms = rects.map(r => Math.round(r.bottom));
        if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
          problems.push(`row ${ri}: uneven cell bottoms`);
        }
        rects.forEach((r, ci) => {
          if (r.width < 10 || r.height < 10) {
            problems.push(`row ${ri} cell ${ci}: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < gr.left - 1 || r.right > gr.right + 1) {
            problems.push(`row ${ri} cell ${ci}: overhangs the day grid`);
          }
          if (ci > 0 && r.left < rects[ci - 1].right - 1) {
            problems.push(`row ${ri} cell ${ci}: overlaps its left neighbour`);
          }
        });
        if (ri > 0) {
          const prev = rows.get(rowTops[ri - 1])![0].getBoundingClientRect();
          const gap = rects[0].top - prev.bottom;
          if (gap < -1 || gap > 12) problems.push(`row ${ri}: seam gap ${Math.round(gap)}px`);
        }
      });

      const labels = [...header.querySelectorAll('.weekday')] as HTMLElement[];
      if (labels.length !== 7) {
        problems.push(`${labels.length} weekday labels, expected 7`);
      }

      // Hour/minute lists must be parallel, equal-topped columns whose items
      // stay inside their own scroll box.
      const columns = [...root.querySelectorAll('.time-column')] as HTMLElement[];
      if (columns.length < 2) problems.push(`${columns.length} time columns, expected >= 2`);
      const colRects = columns.map(c => c.getBoundingClientRect());
      colRects.forEach((r, i) => {
        if (r.width < 20 || r.height < 20) {
          problems.push(`time column ${i}: ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        if (i > 0) {
          if (Math.abs(r.top - colRects[i - 1].top) > 1) {
            problems.push(`time column ${i}: top misaligned with column ${i - 1}`);
          }
          if (r.left < colRects[i - 1].right - 1) {
            problems.push(`time column ${i}: overlaps column ${i - 1}`);
          }
        }
      });
      columns.forEach((col, i) => {
        const list = col.querySelector('.time-list') as HTMLElement | null;
        if (!list) { problems.push(`time column ${i}: no .time-list`); return; }
        const lr = list.getBoundingClientRect();
        const items = [...list.querySelectorAll('.time-item')] as HTMLElement[];
        if (items.length === 0) { problems.push(`time column ${i}: no items`); return; }
        items.forEach((item, ii) => {
          const r = item.getBoundingClientRect();
          if (r.height === 0) return; // scrolled out of the clipped list
          if (r.left < lr.left - 1 || r.right > lr.right + 1) {
            problems.push(`time column ${i} item ${ii}: wider than its list`);
          }
        });
      });

      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: day numbers are visibly offset from their weekday headers. Both
  // `.calendar-weekdays` and `.calendar-days` are `repeat(7, 1fr)` grids, but
  // `.day` is pinned to `width: 2rem` (32px) while the tracks resolve to
  // ~39.86px, so each day button left-aligns in its track and its glyph
  // centre lands ~4px left of the centred `.weekday` label above it.
  // Fix belongs in snice-date-time-picker.css (justify-self/centre the day
  // button in its track, or drop the fixed width), not in this spec.
  test.fixme('weekday labels sit centred over their day columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const root = document.querySelector('snice-date-time-picker[variant="inline"]')!.shadowRoot!;
      const labels = [...root.querySelectorAll('.calendar-weekdays .weekday')] as HTMLElement[];
      const days = [...root.querySelectorAll('.calendar-days .day')] as HTMLElement[];

      const rows = new Map<number, HTMLElement[]>();
      days.forEach(d => {
        const key = Math.round(d.getBoundingClientRect().top);
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key)!.push(d);
      });
      const fullRow = [...rows.values()].find(r => r.length === 7);
      if (!fullRow) { problems.push('no full 7-cell week row'); return problems; }

      const cells = fullRow.map(c => c.getBoundingClientRect()).sort((a, b) => a.left - b.left);
      labels.forEach((lab, i) => {
        const lr = lab.getBoundingClientRect();
        const dx = (lr.left + lr.width / 2) - (cells[i].left + cells[i].width / 2);
        if (Math.abs(dx) > 2) problems.push(`weekday ${i}: off column by ${dx.toFixed(1)}px`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('opening the dropdown places a sized panel directly under its input', async ({ page }) => {
    const picker = page.locator('snice-date-time-picker[label="Appointment"]:not([id])');
    await expect(picker).toHaveCount(1);

    expect(await picker.evaluate(el =>
      (el.shadowRoot!.querySelector('.panel') as HTMLElement).hasAttribute('hidden'))).toBe(true);

    await picker.locator('.toggle-button').click();
    await page.waitForFunction(() => {
      const el = document.querySelector('snice-date-time-picker[label="Appointment"]:not([id])')!;
      return !el.shadowRoot!.querySelector('.panel')!.hasAttribute('hidden');
    });
    await page.waitForTimeout(250);

    const geo = await picker.evaluate(el => {
      const root = el.shadowRoot!;
      const panel = root.querySelector('.panel') as HTMLElement;
      const input = root.querySelector('.input') as HTMLElement;
      const pr = panel.getBoundingClientRect();
      const ir = input.getBoundingClientRect();
      const cal = root.querySelector('.panel-calendar')!.getBoundingClientRect();
      const time = root.querySelector('.panel-time')!.getBoundingClientRect();
      return {
        panel: { w: pr.width, h: pr.height, left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom },
        input: { left: ir.left, bottom: ir.bottom, right: ir.right },
        // calendar and time sections must sit side by side inside the panel
        sectionsSideBySide: time.left >= cal.right - 1,
        sectionsInPanel: cal.left >= pr.left - 1 && time.right <= pr.right + 1
          && cal.top >= pr.top - 1 && cal.bottom <= pr.bottom + 1
          && time.bottom <= pr.bottom + 1,
        viewport: { w: window.innerWidth, h: window.innerHeight }
      };
    });

    // Panel is a real, sized surface.
    expect(geo.panel.w).toBeGreaterThan(250);
    expect(geo.panel.h).toBeGreaterThan(200);
    // Anchored just below the input, on its left edge.
    expect(geo.panel.top).toBeGreaterThanOrEqual(geo.input.bottom - 1);
    expect(geo.panel.top - geo.input.bottom).toBeLessThan(16);
    expect(Math.abs(geo.panel.left - geo.input.left)).toBeLessThanOrEqual(2);
    // Fully on screen.
    expect(geo.panel.left).toBeGreaterThanOrEqual(0);
    expect(geo.panel.right).toBeLessThanOrEqual(geo.viewport.w);
    expect(geo.sectionsSideBySide).toBe(true);
    expect(geo.sectionsInPanel).toBe(true);
  });
});
