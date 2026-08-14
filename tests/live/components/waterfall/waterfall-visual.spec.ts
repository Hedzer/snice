import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/waterfall/demo.html';

test.describe('Snice Waterfall visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-waterfall'));
    await page.waitForFunction(() =>
      !!document.querySelector('#wf-default')?.shadowRoot?.querySelector('svg rect'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('bars are evenly pitched, equally wide and fully inside the plot', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const charts = [...document.querySelectorAll('snice-waterfall')] as HTMLElement[];
      if (charts.length === 0) problems.push('no snice-waterfall on the page');

      charts.forEach(chart => {
        const svg = chart.shadowRoot!.querySelector('svg') as SVGSVGElement | null;
        const id = `#${chart.id}`;
        const bars = svg ? [...svg.querySelectorAll('rect')] as SVGRectElement[] : [];
        if (!svg || bars.length === 0) return; // empty-data showcase

        const vb = svg.viewBox.baseVal;
        // Work in viewBox units: that is the geometry the component authors.
        const geo = bars.map(b => ({
          x: b.x.baseVal.value, y: b.y.baseVal.value,
          w: b.width.baseVal.value, h: b.height.baseVal.value
        }));

        geo.forEach((g, i) => {
          if (g.w <= 0 || g.h <= 0) {
            problems.push(`${id} bar ${i}: ${g.w}x${g.h}`);
          }
          if (g.x < vb.x - 0.5 || g.x + g.w > vb.x + vb.width + 0.5) {
            problems.push(`${id} bar ${i}: escapes the viewBox horizontally`);
          }
          if (g.y < vb.y - 0.5 || g.y + g.h > vb.y + vb.height + 0.5) {
            problems.push(`${id} bar ${i}: escapes the viewBox vertically`);
          }
          if (i > 0 && g.x < geo[i - 1].x + geo[i - 1].w - 0.5) {
            problems.push(`${id} bar ${i}: overlaps bar ${i - 1}`);
          }
        });

        // Uniform bar width and uniform column pitch.
        const widths = geo.map(g => g.w);
        if (Math.max(...widths) - Math.min(...widths) > 0.5) {
          problems.push(`${id}: bar widths vary ${Math.min(...widths).toFixed(1)}..${Math.max(...widths).toFixed(1)}`);
        }
        if (geo.length > 2) {
          const pitches = geo.slice(1).map((g, i) => g.x - geo[i].x);
          if (Math.max(...pitches) - Math.min(...pitches) > 0.5) {
            problems.push(`${id}: uneven bar pitch ${pitches.map(p => p.toFixed(1)).join(',')}`);
          }
        }

        // Labels: one per bar, centred under it, below every bar.
        const labels = [...svg.querySelectorAll('.waterfall-label')] as SVGTextElement[];
        if (labels.length !== bars.length) {
          problems.push(`${id}: ${labels.length} labels for ${bars.length} bars`);
        } else {
          labels.forEach((label, i) => {
            const lx = label.x.baseVal[0].value;
            const centre = geo[i].x + geo[i].w / 2;
            if (Math.abs(lx - centre) > 0.5) {
              problems.push(`${id} label ${i}: anchored at ${lx.toFixed(1)}, bar centre ${centre.toFixed(1)}`);
            }
            const ly = label.y.baseVal[0].value;
            if (ly < geo[i].y + geo[i].h) {
              problems.push(`${id} label ${i}: drawn above the bar it names`);
            }
            if (ly > vb.y + vb.height) {
              problems.push(`${id} label ${i}: below the viewBox`);
            }
          });
        }

        // Value captions (when enabled): centred over their bar, above its top.
        // `showValues` defaults to true, so key off the live property: an
        // absent attribute leaves captions ON (only show-values="false" hides
        // them).
        const values = [...svg.querySelectorAll('.waterfall-value')] as SVGTextElement[];
        if ((chart as any).showValues) {
          if (values.length !== bars.length) {
            problems.push(`${id}: ${values.length} value captions for ${bars.length} bars`);
          } else {
            values.forEach((v, i) => {
              const vx = v.x.baseVal[0].value;
              const centre = geo[i].x + geo[i].w / 2;
              if (Math.abs(vx - centre) > 0.5) {
                problems.push(`${id} value ${i}: not centred on its bar`);
              }
              const vy = v.y.baseVal[0].value;
              if (vy > geo[i].y) problems.push(`${id} value ${i}: drawn inside/below the bar top`);
              if (vy < vb.y) problems.push(`${id} value ${i}: clipped above the viewBox`);
            });
          }
        } else if (values.length > 0) {
          problems.push(`${id}: renders ${values.length} value captions with show-values off`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('connectors bridge consecutive bars at the previous bar’s end level', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const charts = [...document.querySelectorAll('snice-waterfall')] as HTMLElement[];

      charts.forEach(chart => {
        const svg = chart.shadowRoot!.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return;
        const id = `#${chart.id}`;
        const bars = [...svg.querySelectorAll('rect')] as SVGRectElement[];
        const connectors = [...svg.querySelectorAll('.waterfall-connector')] as SVGLineElement[];

        // Same default-true rule as show-values.
        if (!(chart as any).showConnectors) {
          if (connectors.length > 0) {
            problems.push(`${id}: ${connectors.length} connectors with showConnectors off`);
          }
          return;
        }
        if (bars.length < 2) return;
        if (connectors.length !== bars.length - 1) {
          problems.push(`${id}: ${connectors.length} connectors for ${bars.length} bars`);
          return;
        }

        connectors.forEach((line, i) => {
          const x1 = line.x1.baseVal.value, x2 = line.x2.baseVal.value;
          const y1 = line.y1.baseVal.value, y2 = line.y2.baseVal.value;
          const prev = bars[i], next = bars[i + 1];
          const prevRight = prev.x.baseVal.value + prev.width.baseVal.value;
          const nextLeft = next.x.baseVal.value;

          if (Math.abs(y1 - y2) > 0.5) {
            problems.push(`${id} connector ${i}: not horizontal (${y1.toFixed(1)} -> ${y2.toFixed(1)})`);
          }
          if (Math.abs(x1 - prevRight) > 0.5) {
            problems.push(`${id} connector ${i}: starts at ${x1.toFixed(1)}, bar ${i} ends at ${prevRight.toFixed(1)}`);
          }
          if (Math.abs(x2 - nextLeft) > 0.5) {
            problems.push(`${id} connector ${i}: ends at ${x2.toFixed(1)}, bar ${i + 1} starts at ${nextLeft.toFixed(1)}`);
          }
          if (x2 < x1) problems.push(`${id} connector ${i}: drawn right-to-left`);

          // The bridge must meet the previous bar at one of its two edges —
          // that is what makes a waterfall read as a running total.
          const prevTop = prev.y.baseVal.value;
          const prevBottom = prevTop + prev.height.baseVal.value;
          if (Math.abs(y1 - prevTop) > 1 && Math.abs(y1 - prevBottom) > 1) {
            problems.push(`${id} connector ${i}: y ${y1.toFixed(1)} touches neither edge of bar ${i}`
              + ` (${prevTop.toFixed(1)}..${prevBottom.toFixed(1)})`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the chart svg fills its host without overflowing it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      (document.querySelectorAll('snice-waterfall') as NodeListOf<HTMLElement>).forEach(chart => {
        const svg = chart.shadowRoot!.querySelector('svg') as SVGSVGElement | null;
        const id = `#${chart.id}`;
        const hr = chart.getBoundingClientRect();
        if (!svg) return;
        const sr = svg.getBoundingClientRect();
        if (sr.width < 100 || sr.height < 60) {
          problems.push(`${id}: svg ${Math.round(sr.width)}x${Math.round(sr.height)}`);
        }
        if (sr.right > hr.right + 1 || sr.bottom > hr.bottom + 1
            || sr.left < hr.left - 1 || sr.top < hr.top - 1) {
          problems.push(`${id}: svg escapes its host`);
        }
        // Painted bars must land inside the on-screen svg box too.
        (svg.querySelectorAll('rect') as NodeListOf<SVGRectElement>).forEach((bar, i) => {
          const br = bar.getBoundingClientRect();
          if (br.left < sr.left - 1 || br.right > sr.right + 1
              || br.top < sr.top - 1 || br.bottom > sr.bottom + 1) {
            problems.push(`${id} bar ${i}: painted outside the svg box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
