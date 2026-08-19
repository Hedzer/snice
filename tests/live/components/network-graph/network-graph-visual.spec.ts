import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/network-graph/visual.html';

test.describe('Snice Network Graph visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Force-layout simulations need time to settle before geometry is stable.
    await page.waitForTimeout(2500);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('canvas fills the host at the documented minimum height', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const graphs = [...document.querySelectorAll('snice-network-graph')] as any[];
      if (!graphs.length) problems.push('no snice-network-graph on page');
      graphs.forEach((host, i) => {
        const box = host.shadowRoot?.querySelector('.network-graph') as HTMLElement | null;
        const svg = host.shadowRoot?.querySelector('.network-graph__svg') as SVGElement | null;
        if (!box || !svg) { problems.push(`graph[${i}]: missing canvas`); return; }
        const hr = host.getBoundingClientRect();
        const br = box.getBoundingClientRect();
        const sr = svg.getBoundingClientRect();
        if (Math.abs(br.width - hr.width) > 1) {
          problems.push(`graph[${i}]: canvas width ${Math.round(br.width)} != host ${Math.round(hr.width)}`);
        }
        if (br.height < 300) problems.push(`graph[${i}]: canvas only ${Math.round(br.height)}px tall`);
        if (Math.abs(sr.width - br.width) > 2 || Math.abs(sr.height - br.height) > 2) {
          problems.push(`graph[${i}]: svg ${Math.round(sr.width)}x${Math.round(sr.height)}`
            + ` != canvas ${Math.round(br.width)}x${Math.round(br.height)}`);
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('deterministic layouts keep every node inside the canvas at a visible radius', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      // Force layouts jitter; circular/grid layouts are deterministic.
      const graphs = ([...document.querySelectorAll('snice-network-graph')] as any[])
        .filter(g => ['circular', 'grid'].includes(g.getAttribute('layout') || ''));
      if (!graphs.length) problems.push('showcase has no circular/grid graph');

      graphs.forEach((host, i) => {
        const box = host.shadowRoot?.querySelector('.network-graph') as HTMLElement | null;
        if (!box) return;
        const br = box.getBoundingClientRect();
        const circles = [...host.shadowRoot.querySelectorAll('.network-graph__node-circle')] as SVGElement[];
        if (!circles.length) { problems.push(`graph[${i}] ${host.id}: no nodes drawn`); return; }
        circles.forEach((c, n) => {
          const r = c.getBoundingClientRect();
          if (r.width < 6 || r.width > 80) {
            problems.push(`graph[${i}] node[${n}]: diameter ${Math.round(r.width)}px`);
          }
          if (r.left < br.left - 1 || r.right > br.right + 1
              || r.top < br.top - 1 || r.bottom > br.bottom + 1) {
            problems.push(`graph[${i}] ${host.id} node[${n}]: drawn outside the canvas`);
          }
        });
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('circular layout spaces nodes evenly on one ring', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const graphs = ([...document.querySelectorAll('snice-network-graph[layout="circular"]')] as any[]);
      if (!graphs.length) problems.push('showcase has no circular graph');

      graphs.forEach((host, i) => {
        const circles = [...host.shadowRoot.querySelectorAll('.network-graph__node-circle')] as SVGElement[];
        if (circles.length < 4) return;
        const centers = circles.map(c => {
          const r = c.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        const cx = centers.reduce((s, p) => s + p.x, 0) / centers.length;
        const cy = centers.reduce((s, p) => s + p.y, 0) / centers.length;
        const radii = centers.map(p => Math.hypot(p.x - cx, p.y - cy));
        const min = Math.min(...radii);
        const max = Math.max(...radii);
        if (max - min > Math.max(4, max * 0.05)) {
          problems.push(`graph[${i}] ${host.id}: ring radii spread ${min.toFixed(0)}..${max.toFixed(0)}`);
        }
        // No two nodes may sit on top of each other.
        for (let a = 0; a < centers.length; a++) {
          for (let b = a + 1; b < centers.length; b++) {
            if (Math.hypot(centers[a].x - centers[b].x, centers[a].y - centers[b].y) < 4) {
              problems.push(`graph[${i}] ${host.id}: nodes ${a}/${b} coincide`);
            }
          }
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('show-labels="false" draws no node labels', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-network-graph[show-labels="false"]')] as any[]).forEach(host => {
        const labels = [...host.shadowRoot.querySelectorAll('.network-graph__node-label')] as SVGElement[];
        const visible = labels.filter(l => l.getBoundingClientRect().width > 0);
        if (visible.length) problems.push(`${host.id}: ${visible.length} labels rendered despite show-labels="false"`);
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});
