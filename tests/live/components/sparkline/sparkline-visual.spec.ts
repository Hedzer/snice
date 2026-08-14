import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/sparkline/demo.html';

test.describe('Snice Sparkline visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-sparkline'));
    await page.waitForFunction(() => document.querySelectorAll('snice-sparkline').length > 20);
    // Let the draw/grow animations finish so geometry is settled.
    await page.waitForTimeout(1200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('each svg renders at its declared width/height and holds its viewBox', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-sparkline').forEach((spark, i) => {
        const root = (spark as HTMLElement).shadowRoot;
        const svg = root?.querySelector('.sparkline__svg') as SVGSVGElement | null;
        if (!svg) { problems.push(`spark[${i}]: no svg`); return; }
        const w = (spark as any).width ?? 100;
        const h = (spark as any).height ?? 30;
        const r = svg.getBoundingClientRect();
        if (Math.abs(r.width - w) > 1 || Math.abs(r.height - h) > 1) {
          problems.push(
            `spark[${i}]: svg ${Math.round(r.width)}x${Math.round(r.height)} != declared ${w}x${h}`);
        }
        if (svg.getAttribute('viewBox') !== `0 0 ${w} ${h}`) {
          problems.push(`spark[${i}]: viewBox "${svg.getAttribute('viewBox')}" != "0 0 ${w} ${h}"`);
        }
        const host = spark.getBoundingClientRect();
        if (r.right > host.right + 1 || r.bottom > host.bottom + 1) {
          problems.push(`spark[${i}]: svg escapes its host`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('plotted geometry stays inside the chart box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-sparkline').forEach((spark, i) => {
        const svg = (spark as HTMLElement).shadowRoot
          ?.querySelector('.sparkline__svg') as SVGSVGElement | null;
        if (!svg) return;
        const w = (spark as any).width ?? 100;
        const h = (spark as any).height ?? 30;
        const stroke = (spark as any).strokeWidth ?? 2;
        // Stroke and dot radius legitimately paint half a stroke past the
        // path geometry, so allow that much slack on the box.
        const slack = stroke + 0.5;
        svg.querySelectorAll('.sparkline__line, .sparkline__area, .sparkline__bar, .sparkline__dot')
          .forEach(shape => {
            const b = (shape as SVGGraphicsElement).getBBox();
            if (b.width === 0 && b.height === 0) return;
            if (b.x < -slack || b.y < -slack
              || b.x + b.width > w + slack || b.y + b.height > h + slack) {
              problems.push(
                `spark[${i}] ${(shape as Element).getAttribute('class')}: bbox `
                + `(${b.x.toFixed(1)},${b.y.toFixed(1)},${b.width.toFixed(1)},${b.height.toFixed(1)})`
                + ` leaves the ${w}x${h} box`);
            }
          });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('bar charts tile evenly on a shared baseline', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sparks = [...document.querySelectorAll('snice-sparkline')]
        .filter(s => (s as any).type === 'bar');
      if (sparks.length === 0) problems.push('no bar sparklines found');
      sparks.forEach((spark, i) => {
        const svg = (spark as HTMLElement).shadowRoot!
          .querySelector('.sparkline__svg') as SVGSVGElement;
        const bars = [...svg.querySelectorAll('.sparkline__bar')] as SVGRectElement[];
        const data = (spark as any).data as number[];
        if (bars.length !== data.length) {
          problems.push(`bar[${i}]: ${bars.length} bars for ${data.length} points`);
          return;
        }
        const boxes = bars.map(b => b.getBBox());
        const baseline = boxes[0].y + boxes[0].height;
        boxes.forEach((b, j) => {
          if (Math.abs(b.width - boxes[0].width) > 0.5) {
            problems.push(`bar[${i}] rect ${j}: width ${b.width.toFixed(2)} != ${boxes[0].width.toFixed(2)}`);
          }
          if (Math.abs((b.y + b.height) - baseline) > 0.5) {
            problems.push(`bar[${i}] rect ${j}: bottom ${(b.y + b.height).toFixed(2)} off baseline ${baseline.toFixed(2)}`);
          }
          if (j > 0 && b.x < boxes[j - 1].x + boxes[j - 1].width - 0.5) {
            problems.push(`bar[${i}] rect ${j}: overlaps rect ${j - 1}`);
          }
        });
        // Even spacing between bar origins.
        if (boxes.length > 2) {
          const steps = boxes.slice(1).map((b, j) => b.x - boxes[j].x);
          if (Math.max(...steps) - Math.min(...steps) > 0.5) {
            problems.push(`bar[${i}]: uneven bar pitch ${steps.map(s => s.toFixed(2)).join(',')}`);
          }
        }
        // Taller values must produce taller bars.
        const tallest = boxes.indexOf(boxes.reduce((a, b) => (b.height > a.height ? b : a)));
        const peak = data.indexOf(Math.max(...data));
        if (tallest !== peak) {
          problems.push(`bar[${i}]: tallest bar at ${tallest}, data peak at ${peak}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
