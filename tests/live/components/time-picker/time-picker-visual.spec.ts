import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/time-picker/visual.html';

test.describe('Snice Time Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the clock toggle sits inside the field, vertically centered', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-time-picker').forEach((host, ti) => {
        const root = (host as any).shadowRoot;
        const container = root?.querySelector('.input-container');
        // The inline variant renders the selector panel with no text field.
        if (!container) {
          if (host.getAttribute('variant') !== 'inline') {
            problems.push(`picker[${ti}]: no input container`);
          }
          return;
        }
        const cr = container.getBoundingClientRect();
        const input = container.querySelector('.input');
        const toggle = container.querySelector('.clock-toggle');
        if (!input || !toggle) { problems.push(`picker[${ti}]: missing input/toggle`); return; }
        const ir = input.getBoundingClientRect();
        const tr = toggle.getBoundingClientRect();

        if (tr.right > cr.right + 1 || tr.left < cr.left - 1
            || tr.top < cr.top - 1 || tr.bottom > cr.bottom + 1) {
          problems.push(`picker[${ti}]: clock toggle escapes the field (${Math.round(tr.left)}..${Math.round(tr.right)} vs ${Math.round(cr.left)}..${Math.round(cr.right)})`);
        }
        const dy = (tr.top + tr.height / 2) - (ir.top + ir.height / 2);
        if (Math.abs(dy) > 1.5) {
          problems.push(`picker[${ti}]: clock toggle off field center by ${dy.toFixed(1)}px`);
        }
        if (tr.height > ir.height || tr.width < 12) {
          problems.push(`picker[${ti}]: clock toggle ${Math.round(tr.width)}x${Math.round(tr.height)} vs field ${Math.round(ir.height)}`);
        }
        const glyph = toggle.querySelector('svg');
        if (glyph) {
          const gr = glyph.getBoundingClientRect();
          if (gr.width < 8 || gr.width > tr.width + 1) {
            problems.push(`picker[${ti}]: clock glyph ${Math.round(gr.width)}px vs button ${Math.round(tr.width)}px`);
          }
        }
        // The label must stack above the field, never over it.
        const label = root.querySelector('.label');
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.width > 0 && lr.bottom > cr.top + 1) {
            problems.push(`picker[${ti}]: label overlaps the field`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('inline pickers lay their hour/minute columns out side by side', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const inline = [...document.querySelectorAll('snice-time-picker[variant="inline"]')];
      if (inline.length === 0) problems.push('no inline pickers in showcase');
      inline.forEach((host, pi) => {
        const selectors = (host as any).shadowRoot?.querySelector('.selectors');
        if (!selectors) { problems.push(`inline[${pi}]: no selector block`); return; }
        const sr = selectors.getBoundingClientRect();
        const cols = [...selectors.querySelectorAll('.selector-column')].map(c => c.getBoundingClientRect());
        if (cols.length < 2) { problems.push(`inline[${pi}]: ${cols.length} columns`); return; }
        cols.forEach((c, i) => {
          if (c.width <= 0 || c.height <= 0) {
            problems.push(`inline[${pi}] column ${i}: collapsed`);
          }
          if (c.left < sr.left - 1 || c.right > sr.right + 1) {
            problems.push(`inline[${pi}] column ${i}: escapes the selector block`);
          }
          if (i > 0) {
            if (c.left < cols[i - 1].right - 1) {
              problems.push(`inline[${pi}] column ${i}: overlaps the previous column`);
            }
            if (Math.abs(c.top - cols[i - 1].top) > 1) {
              problems.push(`inline[${pi}] column ${i}: top ${Math.round(c.top)} != ${Math.round(cols[i - 1].top)}`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('opening the dropdown drops a sized panel under the field with the selection in view', async ({ page }) => {
    const sel = 'snice-time-picker[variant="dropdown"]';
    const closed = await page.evaluate((s) => {
      const root = (document.querySelector(s) as any).shadowRoot;
      const d = root.querySelector('.dropdown');
      return { open: d.classList.contains('dropdown--open'), height: d.getBoundingClientRect().height };
    }, sel);
    expect(closed.open).toBe(false);
    expect(closed.height).toBe(0);

    await page.evaluate((s) => {
      const root = (document.querySelector(s) as any).shadowRoot;
      (root.querySelector('.clock-toggle') as HTMLElement).click();
    }, sel);
    await page.waitForTimeout(400);

    const opened = await page.evaluate((s) => {
      const root = (document.querySelector(s) as any).shadowRoot;
      const dropdown = root.querySelector('.dropdown');
      const field = root.querySelector('.input-container').getBoundingClientRect();
      const dr = dropdown.getBoundingClientRect();
      const problems: string[] = [];

      const cols = [...dropdown.querySelectorAll('.selector-column')].map(c => c.getBoundingClientRect());
      cols.forEach((c, i) => {
        if (c.left < dr.left - 1 || c.right > dr.right + 1) problems.push(`column ${i} escapes the panel`);
        if (i > 0 && c.left < cols[i - 1].right - 1) problems.push(`column ${i} overlaps column ${i - 1}`);
      });

      // Every list must have scrolled its selection into its own viewport.
      [...dropdown.querySelectorAll('.selector-list')].forEach((list: Element, i: number) => {
        const lr = list.getBoundingClientRect();
        const sel = list.querySelector('.selector-item--selected');
        if (!sel) return;
        const s = sel.getBoundingClientRect();
        if (s.bottom < lr.top - 1 || s.top > lr.bottom + 1) {
          problems.push(`list ${i}: selected item is scrolled out of view`);
        }
        if (s.width > lr.width + 1) problems.push(`list ${i}: item wider than its list`);
      });

      return {
        open: dropdown.classList.contains('dropdown--open'),
        width: dr.width,
        height: dr.height,
        belowField: dr.top >= field.bottom - 2,
        onScreenX: dr.left >= 0 && dr.right <= document.documentElement.clientWidth,
        columns: cols.length,
        problems,
      };
    }, sel);

    expect(opened.open).toBe(true);
    expect(opened.problems).toEqual([]);
    expect(opened.columns).toBeGreaterThanOrEqual(2);
    expect(opened.width).toBeGreaterThan(120);
    expect(opened.height).toBeGreaterThan(100);
    expect(opened.belowField).toBe(true);
    expect(opened.onScreenX).toBe(true);
  });
});
