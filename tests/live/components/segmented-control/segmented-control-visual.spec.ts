import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/segmented-control/demo.html';

test.describe('Snice Segmented Control visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('segments tile on one row with a uniform gap and centered labels', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-segmented-control').forEach((host, ci) => {
        const control = (host as any).shadowRoot?.querySelector('.segmented-control');
        if (!control) { problems.push(`control[${ci}]: no track`); return; }
        const cr = control.getBoundingClientRect();
        const segs = [...control.querySelectorAll('.segmented-control__segment')] as HTMLElement[];
        if (segs.length < 2) { problems.push(`control[${ci}]: ${segs.length} segments`); return; }
        const rects = segs.map(s => s.getBoundingClientRect());

        const tops = rects.map(r => Math.round(r.top));
        const heights = rects.map(r => Math.round(r.height));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`control[${ci}]: segment tops diverge ${tops.join(',')}`);
        }
        if (Math.max(...heights) - Math.min(...heights) > 1) {
          problems.push(`control[${ci}]: segment heights diverge ${heights.join(',')}`);
        }

        const gaps: number[] = [];
        rects.forEach((r, i) => {
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`control[${ci}] segment ${i}: escapes the track`);
          }
          if (i > 0) gaps.push(r.left - rects[i - 1].right);
        });
        if (gaps.some(g => g < -0.5)) {
          problems.push(`control[${ci}]: segments overlap (${gaps.map(g => g.toFixed(1)).join(',')})`);
        }
        if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1) {
          problems.push(`control[${ci}]: uneven segment gaps ${gaps.map(g => g.toFixed(1)).join(',')}`);
        }

        segs.forEach((seg, i) => {
          const label = seg.querySelector('.segmented-control__label');
          if (!label) { problems.push(`control[${ci}] segment ${i}: no label`); return; }
          const lr = label.getBoundingClientRect();
          const sr = rects[i];
          const dx = (lr.left + lr.width / 2) - (sr.left + sr.width / 2);
          const dy = (lr.top + lr.height / 2) - (sr.top + sr.height / 2);
          if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
            problems.push(`control[${ci}] segment ${i}: label off center by ${dx.toFixed(1)},${dy.toFixed(1)}`);
          }
          if (lr.left < sr.left - 1 || lr.right > sr.right + 1) {
            problems.push(`control[${ci}] segment ${i}: label overflows its segment`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the sliding indicator exactly covers the selected segment', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-segmented-control').forEach((host, ci) => {
        const root = (host as any).shadowRoot;
        const indicator = root?.querySelector('.segmented-control__indicator');
        const selected = root?.querySelector('.segmented-control__segment--selected');
        if (!indicator || !selected) return;
        const ir = indicator.getBoundingClientRect();
        const sr = selected.getBoundingClientRect();
        (['left', 'right', 'top', 'bottom'] as const).forEach(edge => {
          if (Math.abs(ir[edge] - sr[edge]) > 1) {
            problems.push(`control[${ci}]: indicator ${edge} ${Math.round(ir[edge])} != selected ${Math.round(sr[edge])}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('selecting another segment slides the indicator onto it', async ({ page }) => {
    const host = '#sc-three';
    const before = await page.evaluate((sel) => {
      const root = (document.querySelector(sel) as any).shadowRoot;
      const segs = [...root.querySelectorAll('.segmented-control__segment')];
      return {
        selectedIndex: segs.findIndex(s => s.classList.contains('segmented-control__segment--selected')),
        indicator: root.querySelector('.segmented-control__indicator').getBoundingClientRect().toJSON(),
        count: segs.length,
      };
    }, host);
    expect(before.count).toBeGreaterThan(2);
    expect(before.selectedIndex).toBe(0);

    await page.evaluate((sel) => {
      const root = (document.querySelector(sel) as any).shadowRoot;
      const segs = [...root.querySelectorAll('.segmented-control__segment')];
      (segs[segs.length - 1] as HTMLElement).click();
    }, host);
    // Let the indicator transition settle.
    await page.waitForTimeout(500);

    const after = await page.evaluate((sel) => {
      const root = (document.querySelector(sel) as any).shadowRoot;
      const segs = [...root.querySelectorAll('.segmented-control__segment')];
      const last = segs[segs.length - 1].getBoundingClientRect();
      const ind = root.querySelector('.segmented-control__indicator').getBoundingClientRect();
      const track = root.querySelector('.segmented-control').getBoundingClientRect();
      return {
        selectedIndex: segs.findIndex(s => s.classList.contains('segmented-control__segment--selected')),
        dLeft: ind.left - last.left,
        dRight: ind.right - last.right,
        dTop: ind.top - last.top,
        dBottom: ind.bottom - last.bottom,
        insideTrack: ind.left >= track.left - 1 && ind.right <= track.right + 1,
        moved: ind.left,
      };
    }, host);

    expect(after.selectedIndex).toBe(before.count - 1);
    expect(after.moved).toBeGreaterThan(before.indicator.left);
    expect(Math.abs(after.dLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.dRight)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.dTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.dBottom)).toBeLessThanOrEqual(1);
    expect(after.insideTrack).toBe(true);
  });
});
