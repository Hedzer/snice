import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/sankey/visual.html';

test.describe('Snice Sankey visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600); // the `animation` showcase grows its bands
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('nodes form ordered columns of uniform width that never collide', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const charts = [...document.querySelectorAll('snice-sankey')] as any[];
      if (charts.length === 0) problems.push('no sankeys on page');

      charts.forEach(chart => {
        const id = chart.id || '(anon)';
        const svg = chart.shadowRoot?.querySelector('svg');
        if (!svg) return; // the no-data showcase renders no chart
        const sr = svg.getBoundingClientRect();
        const nodes = [...svg.querySelectorAll('.sankey__node rect')] as SVGRectElement[];
        if (nodes.length === 0) { problems.push(`${id}: no node rects`); return; }

        // Group nodes into columns by their left edge.
        const columns = new Map<number, DOMRect[]>();
        nodes.forEach(n => {
          const r = n.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) {
            problems.push(`${id}: a node rect is ${Math.round(r.width)}x${Math.round(r.height)}`);
            return;
          }
          if (r.left < sr.left - 1 || r.right > sr.right + 1
              || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`${id}: node ${Math.round(r.left)},${Math.round(r.top)} escapes the chart`);
          }
          const key = Math.round(r.left);
          if (!columns.has(key)) columns.set(key, []);
          columns.get(key)!.push(r);
        });

        // One node width across the whole diagram.
        const widths = [...new Set(nodes.map(n => Math.round(n.getBoundingClientRect().width)))];
        if (widths.length > 1) problems.push(`${id}: mixed node widths ${widths.join(',')}`);

        // Columns advance left to right without touching each other.
        const keys = [...columns.keys()].sort((a, b) => a - b);
        for (let i = 1; i < keys.length; i++) {
          if (keys[i] - keys[i - 1] < widths[0]) {
            problems.push(`${id}: columns ${keys[i - 1]} and ${keys[i]} overlap`);
          }
        }

        // Within a column, nodes stack with a padding gap and never overlap.
        columns.forEach((rects, key) => {
          const sorted = [...rects].sort((a, b) => a.top - b.top);
          for (let i = 1; i < sorted.length; i++) {
            const gap = sorted[i].top - sorted[i - 1].bottom;
            if (gap < 0) {
              problems.push(`${id} column ${key}: nodes overlap by ${Math.round(-gap)}px`);
            }
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('node-width and node-padding attributes change the drawn geometry', async ({ page }) => {
    const geom = await page.evaluate(() => {
      const read = (id: string) => {
        const chart = document.getElementById(id) as any;
        const rects = [...chart.shadowRoot.querySelectorAll('.sankey__node rect')] as SVGRectElement[];
        const boxes = rects.map(r => r.getBoundingClientRect());
        const first = boxes.filter(b => Math.round(b.left) === Math.round(boxes[0].left))
          .sort((a, b) => a.top - b.top);
        return {
          width: Math.round(boxes[0].width),
          gap: first.length > 1 ? Math.round(first[1].top - first[0].bottom) : -1,
        };
      };
      return { base: read('s-default'), wide: read('s-wide-node'), padded: read('s-pad') };
    });

    expect(geom.base.width).toBeGreaterThan(0);
    // node-width=30 draws 30-unit nodes; Firefox rounds the sub-pixel box up
    // to 31px, so allow one rounding step instead of an exact integer.
    expect(Math.abs(geom.wide.width - 30)).toBeLessThanOrEqual(1);
    expect(geom.wide.width).toBeGreaterThan(geom.base.width);
    expect(geom.padded.gap).toBeGreaterThan(geom.base.gap);
  });

  // The chart reserves no horizontal margin for node text at first layout,
  // so the outer columns' labels spilled out of the SVG viewport ("Organic
  // Search" ran 23px past the chart's left edge). The component now measures
  // its drawn labels after the first render and grows the gutter until they
  // fit.
  test('node labels and values are drawn inside the chart viewport', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-sankey')].forEach((chart: any) => {
        const svg = chart.shadowRoot?.querySelector('svg');
        if (!svg) return;
        const sr = svg.getBoundingClientRect();
        [...svg.querySelectorAll('text')].forEach((t: Element) => {
          const r = t.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.left < sr.left - 0.5 || r.right > sr.right + 0.5) {
            problems.push(`${chart.id || '(anon)'}: "${t.textContent}" spans `
              + `${Math.round(r.left)}..${Math.round(r.right)} in a chart of `
              + `${Math.round(sr.left)}..${Math.round(sr.right)}`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });
});
