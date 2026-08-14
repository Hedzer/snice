import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/treemap/demo.html';

test.describe('Snice Treemap visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-treemap'));
    await page.waitForFunction(() =>
      ((document.querySelector('#tm-default') as any)?.shadowRoot
        ?.querySelectorAll('.treemap__rect').length ?? 0) === 6);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every cell stays inside the chart and cells never overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-treemap').forEach((host: any) => {
        const id = host.id;
        const chart = host.shadowRoot.querySelector('.treemap__chart') as HTMLElement;
        const cr = chart.getBoundingClientRect();
        const cells = [...host.shadowRoot.querySelectorAll('.treemap__rect')] as SVGElement[];
        if (!cells.length) { problems.push(`${id}: no cells rendered`); return; }
        const rects = cells.map(c => c.getBoundingClientRect());

        rects.forEach((r, n) => {
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`${id} cell[${n}]: escapes the chart box`);
          }
          if (r.width < 1 || r.height < 1) {
            problems.push(`${id} cell[${n}]: degenerate ${r.width.toFixed(1)}x${r.height.toFixed(1)}`);
          }
        });

        for (let a = 0; a < rects.length; a++) {
          for (let b = a + 1; b < rects.length; b++) {
            const overlapX = Math.min(rects[a].right, rects[b].right) - Math.max(rects[a].left, rects[b].left);
            const overlapY = Math.min(rects[a].bottom, rects[b].bottom) - Math.max(rects[a].top, rects[b].top);
            if (overlapX > 1 && overlapY > 1) {
              problems.push(`${id}: cell[${a}] and cell[${b}] overlap by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('with padding=0 the cells tile the chart and their areas match the data', async ({ page }) => {
    const measured = await page.evaluate(() => {
      const host = document.querySelector('#tm-pad0') as any;
      const chart = host.shadowRoot.querySelector('.treemap__chart').getBoundingClientRect();
      const cells = [...host.shadowRoot.querySelectorAll('.treemap__rect')] as SVGElement[];
      const values = host.data.children.map((c: any) => c.value);
      const total = values.reduce((s: number, v: number) => s + v, 0);
      const areas = cells.map(c => {
        const r = c.getBoundingClientRect();
        return r.width * r.height;
      });
      return {
        chartArea: chart.width * chart.height,
        coverage: areas.reduce((s, a) => s + a, 0),
        shares: areas.map(a => a / areas.reduce((s, x) => s + x, 0)),
        expected: values.map((v: number) => v / total)
      };
    });

    // Zero padding means the mosaic fills the chart without gaps.
    expect(measured.coverage / measured.chartArea).toBeGreaterThan(0.98);
    expect(measured.coverage / measured.chartArea).toBeLessThan(1.02);
    // Area encodes value: that is the whole point of a treemap.
    measured.shares.forEach((share, n) => {
      expect(Math.abs(share - measured.expected[n]),
        `cell ${n}: ${(share * 100).toFixed(1)}% of the area for ${(measured.expected[n] * 100).toFixed(1)}% of the value`)
        .toBeLessThan(0.02);
    });
  });

  test('larger padding inset shrinks the drawn area and widens the gutters', async ({ page }) => {
    const coverage = await page.evaluate(() =>
      ['tm-pad0', 'tm-pad2', 'tm-pad5', 'tm-pad10'].map(id => {
        const host = document.querySelector(`#${id}`) as any;
        const chart = host.shadowRoot.querySelector('.treemap__chart').getBoundingClientRect();
        const area = [...host.shadowRoot.querySelectorAll('.treemap__rect')]
          .reduce((sum: number, c: any) => {
            const r = c.getBoundingClientRect();
            return sum + r.width * r.height;
          }, 0);
        return area / (chart.width * chart.height);
      }));

    for (let n = 1; n < coverage.length; n++) {
      expect(coverage[n], `padding step ${n} did not increase the gutters`).toBeLessThan(coverage[n - 1]);
    }
    // Even the widest padding must leave most of the chart painted.
    expect(coverage[coverage.length - 1]).toBeGreaterThan(0.5);
  });

  test('labels and values stay inside the cell they describe', async ({ page }) => {
    const { failures, labelCount } = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      ['tm-default', 'tm-values-on', 'tm-many'].forEach(id => {
        const host = document.querySelector(`#${id}`) as any;
        const cells = [...host.shadowRoot.querySelectorAll('.treemap__rect')] as SVGElement[];
        const labels = [...host.shadowRoot.querySelectorAll('.treemap__label')] as SVGTextElement[];
        seen += labels.length;
        labels.forEach(label => {
          const lr = label.getBoundingClientRect();
          // Find the cell whose box contains the label's centre.
          const cx = lr.left + lr.width / 2;
          const cy = lr.top + lr.height / 2;
          const owner = cells.find(c => {
            const r = c.getBoundingClientRect();
            return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
          });
          if (!owner) {
            problems.push(`${id}: label "${label.textContent}" sits over no cell`);
            return;
          }
          const or = owner.getBoundingClientRect();
          if (lr.left < or.left - 1 || lr.right > or.right + 1
              || lr.top < or.top - 1 || lr.bottom > or.bottom + 1) {
            problems.push(`${id}: label "${label.textContent}" spills out of its cell`
              + ` (${Math.round(lr.width)}px wide in a ${Math.round(or.width)}px cell)`);
          }
        });
      });
      return { failures: problems, labelCount: seen };
    });
    expect(labelCount).toBeGreaterThan(5);
    expect(failures).toEqual([]);
  });

  test('drilling into a parent cell reveals its children and a breadcrumb trail', async ({ page }) => {
    const host = page.locator('#tm-drill');
    const before = await host.evaluate((el: any) => ({
      cells: el.shadowRoot.querySelectorAll('.treemap__rect').length,
      crumbsShown: getComputedStyle(el.shadowRoot.querySelector('.treemap__breadcrumbs')).display !== 'none'
    }));
    expect(before.cells).toBe(4);
    expect(before.crumbsShown).toBe(false);

    // "Engineering" is the largest node, so it is the first cell.
    await host.evaluate((el: any) =>
      (el.shadowRoot.querySelector('.treemap__rect') as SVGElement)
        .dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await expect
      .poll(() => host.evaluate((el: any) => el.shadowRoot.querySelectorAll('.treemap__rect').length))
      .toBe(4);

    const after = await host.evaluate((el: any) => {
      const crumbs = el.shadowRoot.querySelector('.treemap__breadcrumbs');
      const chart = el.shadowRoot.querySelector('.treemap__chart').getBoundingClientRect();
      const cells = [...el.shadowRoot.querySelectorAll('.treemap__rect')]
        .map((c: any) => c.getBoundingClientRect());
      const br = crumbs.getBoundingClientRect();
      return {
        crumbsShown: getComputedStyle(crumbs).display !== 'none',
        crumbText: crumbs.textContent.replace(/\s+/g, ' ').trim(),
        crumbsAboveChart: br.bottom <= chart.top + 1,
        allInside: cells.every(r =>
          r.left >= chart.left - 1 && r.right <= chart.right + 1
          && r.top >= chart.top - 1 && r.bottom <= chart.bottom + 1)
      };
    });

    expect(after.crumbsShown).toBe(true);
    expect(after.crumbText).toContain('Engineering');
    expect(after.crumbsAboveChart).toBe(true);
    expect(after.allInside).toBe(true);
  });
});
