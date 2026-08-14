import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/funnel/demo.html';

test.describe('Snice Funnel visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // The `animation` showcase grows its bands on load; measure settled geometry.
    await page.waitForTimeout(1000);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('stages narrow along the flow, share a centre axis, and stay in the chart box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const funnels = [...document.querySelectorAll('snice-funnel')] as any[];
      if (funnels.length === 0) problems.push('no funnels on page');

      funnels.forEach((funnel, f) => {
        const horizontal = funnel.getAttribute('orientation') === 'horizontal';
        const id = `funnel[${f}]${horizontal ? ' horizontal' : ''}`;
        const svg = funnel.shadowRoot?.querySelector('svg');
        if (!svg) return; // no-data funnels render no chart
        const sr = svg.getBoundingClientRect();
        const bands = [...svg.querySelectorAll('g > path')] as SVGPathElement[];
        if (bands.length < 2) return;

        const rects = bands.map(b => b.getBoundingClientRect());

        // Every band is painted inside the chart viewport.
        rects.forEach((r, i) => {
          if (r.left < sr.left - 1 || r.right > sr.right + 1
              || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`${id} stage ${i}: band escapes the svg`);
          }
        });

        // Main axis: stages advance, abutting with one constant gap.
        const starts = rects.map(r => horizontal ? r.left : r.top);
        const ends = rects.map(r => horizontal ? r.right : r.bottom);
        const gaps: number[] = [];
        for (let i = 1; i < rects.length; i++) {
          const gap = starts[i] - ends[i - 1];
          if (gap < -0.5) problems.push(`${id} stage ${i}: overlaps the previous stage by ${(-gap).toFixed(1)}px`);
          if (gap > 16) problems.push(`${id} stage ${i}: ${gap.toFixed(1)}px hole before it`);
          gaps.push(gap);
        }
        if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 3) {
          problems.push(`${id}: uneven stage spacing ${gaps.map(g => g.toFixed(1)).join(',')}`);
        }

        // Cross axis: a funnel only ever narrows, and stays centred on one axis.
        const extents = rects.map(r => horizontal ? r.height : r.width);
        const centres = rects.map(r => horizontal ? r.top + r.height / 2 : r.left + r.width / 2);
        for (let i = 1; i < rects.length; i++) {
          if (extents[i] > extents[i - 1] + 1) {
            problems.push(`${id} stage ${i}: widens `
              + `(${Math.round(extents[i - 1])} -> ${Math.round(extents[i])})`);
          }
        }
        if (Math.max(...centres) - Math.min(...centres) > 2) {
          problems.push(`${id}: stages off the centre axis ${centres.map(c => Math.round(c)).join(',')}`);
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('stage labels stay inside the chart viewport', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-funnel')].forEach((funnel: any, f) => {
        const svg = funnel.shadowRoot?.querySelector('svg');
        if (!svg) return;
        const sr = svg.getBoundingClientRect();
        [...svg.querySelectorAll('text')].forEach((t: Element, i) => {
          const r = t.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.left < sr.left - 1 || r.right > sr.right + 1
              || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`funnel[${f}] text ${i} "${t.textContent}" clipped by the chart box`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('show-* flags actually remove their text runs', async ({ page }) => {
    const counts = await page.evaluate(() => {
      const count = (sel: string) => {
        const el = document.querySelector(sel) as any;
        return el?.shadowRoot?.querySelectorAll('text').length ?? -1;
      };
      return {
        all: count('snice-funnel[show-labels][data-default]'),
        none: count('snice-funnel[show-labels="false"][show-values="false"][show-percentages="false"]'),
      };
    });

    expect(counts.all).toBeGreaterThan(0);
    expect(counts.none).toBe(0);
  });
});
