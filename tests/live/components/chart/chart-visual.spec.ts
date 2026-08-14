import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/chart/demo.html';

test.describe('Snice Chart visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Entry animation + first paint of the render canvas.
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('legend and canvas tile the chart container without gaps or overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const charts = [...document.querySelectorAll('snice-chart')] as HTMLElement[];
      if (charts.length === 0) problems.push('no snice-chart on page');

      charts.forEach(chart => {
        const id = chart.id || chart.getAttribute('type');
        const root = chart.shadowRoot;
        const container = root?.querySelector('.chart-container');
        const legend = root?.querySelector('.chart-legend');
        const wrap = root?.querySelector('.chart-canvas');
        if (!container || !wrap) { problems.push(`${id}: missing container/canvas wrapper`); return; }

        const c = container.getBoundingClientRect();
        const w = wrap.getBoundingClientRect();

        if (Math.abs(w.width - c.width) > 1) {
          problems.push(`${id}: canvas area ${Math.round(w.width)} does not span container ${Math.round(c.width)}`);
        }
        if (w.bottom > c.bottom + 1 || w.top < c.top - 1) {
          problems.push(`${id}: canvas area escapes the container vertically`);
        }

        if (legend) {
          const l = legend.getBoundingClientRect();
          // legend-top: the legend band must sit above the plot, abutting it.
          if (l.height > 0 && Math.abs(w.top - l.bottom) > 1) {
            problems.push(`${id}: seam between legend (${Math.round(l.bottom)}) and plot (${Math.round(w.top)})`);
          }
          [...legend.querySelectorAll('.legend-item')].forEach((item, i) => {
            const r = item.getBoundingClientRect();
            if (r.width === 0) return;
            if (r.left < l.left - 1 || r.right > l.right + 1
                || r.top < l.top - 1 || r.bottom > l.bottom + 1) {
              problems.push(`${id}: legend item ${i} escapes the legend band`);
            }
          });
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: snice-chart.ts sizes the render canvas from `this.offsetWidth`, which is
  // the host's BORDER-box width. Any chart with a border (the showcase adds 1px)
  // gets a canvas 2px wider than its `.chart-canvas` wrapper, so the rightmost
  // 2px of every plot is silently clipped by the wrapper's overflow:hidden.
  test.fixme('render canvas fits inside its clipping wrapper', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-chart')] as HTMLElement[]).forEach(chart => {
        const root = chart.shadowRoot!;
        const wrap = root.querySelector('.chart-canvas');
        const canvas = root.querySelector('canvas');
        if (!wrap || !canvas) return;
        const w = wrap.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        if (c.width > w.width + 0.5 || c.left < w.left - 0.5) {
          problems.push(`${chart.id}: canvas ${Math.round(c.width)}px wider than wrapper ${Math.round(w.width)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
