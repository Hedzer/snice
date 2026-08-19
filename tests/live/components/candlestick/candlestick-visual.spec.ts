import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/candlestick/visual.html';

test.describe('Snice Candlestick visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-candlestick'));
    // Wait for the last chart on the page (200 candles) to have drawn bodies.
    await page.waitForFunction(() => {
      const charts = [...document.querySelectorAll('snice-candlestick')];
      return charts.length > 0 && charts.every(c =>
        (c as any).shadowRoot?.querySelectorAll('.candlestick__body').length > 0);
    });
    // Entry animation on candle bodies.
    await page.waitForTimeout(700);
  });

  // BUG: the chart never adopts the host's CSS height. rebuildChart() writes
  // `containerEl.style.height = svgHeight` (default 400) and measureSize()
  // then re-reads that same forced container height, so the measurement is
  // self-referential and the authored height is ignored. Every chart on this
  // showcase renders a 400px-tall .candlestick inside a 350px host (250px for
  // the two inline-height charts), overflowing the host by 50-150px and
  // painting over the section below.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Candles are drawn into an SVG plot area. Every body and wick must sit
  // inside the SVG box, and bodies must march strictly left-to-right in data
  // order without overlapping their neighbours.
  test('candles stay inside the plot and tile left-to-right without overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-candlestick').forEach((host, ci) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const svg = root.querySelector('.candlestick__svg') as SVGElement | null;
        if (!svg) { problems.push(`chart[${ci}]: no svg`); return; }
        const sr = svg.getBoundingClientRect();
        if (sr.width < 50 || sr.height < 50) {
          problems.push(`chart[${ci}]: svg too small (${Math.round(sr.width)}x${Math.round(sr.height)})`);
          return;
        }

        const bodies = [...root.querySelectorAll('.candlestick__body')] as SVGElement[];
        const wicks = [...root.querySelectorAll('.candlestick__wick')] as SVGElement[];
        if (bodies.length === 0) { problems.push(`chart[${ci}]: no candles`); return; }
        if (wicks.length !== bodies.length) {
          problems.push(`chart[${ci}]: ${wicks.length} wicks vs ${bodies.length} bodies`);
        }

        [...bodies, ...wicks].forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.left < sr.left - 1 || r.right > sr.right + 1
              || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`chart[${ci}]: ${el.getAttribute('class')} escapes the plot`);
          }
        });

        // Bodies must be ordered and non-overlapping (they may abut).
        const rects = bodies.map(b => b.getBoundingClientRect());
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].left < rects[i - 1].right - 0.5) {
            problems.push(`chart[${ci}]: candle ${i} overlaps candle ${i - 1}`
              + ` (${rects[i].left.toFixed(1)} < ${rects[i - 1].right.toFixed(1)})`);
            break;
          }
        }
        // Every body must be wide enough to be visible.
        const thin = rects.filter(r => r.width < 1).length;
        if (thin > 0) problems.push(`chart[${ci}]: ${thin} candle bodies under 1px wide`);

        // A wick must be horizontally centred on its body.
        bodies.forEach((b, i) => {
          const w = wicks[i];
          if (!w) return;
          const br = b.getBoundingClientRect();
          const wr = w.getBoundingClientRect();
          const dx = (wr.left + wr.width / 2) - (br.left + br.width / 2);
          if (Math.abs(dx) > 1.5) {
            problems.push(`chart[${ci}]: wick ${i} off-centre by ${dx.toFixed(1)}px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Hovering the default chart opens the OHLC tooltip: it must render at a
  // usable size and stay within the viewport.
  test('hover tooltip renders at a sane size inside the viewport', async ({ page }) => {
    const chart = page.locator('#cs-default');
    const box = (await chart.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    // The tooltip paints an empty shell before its rows render; wait for the
    // asserted state itself (all five OHLC rows), not for a non-zero box.
    await page.waitForFunction(() => {
      const tip = document.querySelector('#cs-default')?.shadowRoot
        ?.querySelector('.candlestick__tooltip') as HTMLElement | null;
      return !!tip && tip.querySelectorAll('.candlestick__tooltip-row').length >= 5;
    });

    const geometry = await page.evaluate(() => {
      const tip = document.querySelector('#cs-default')!.shadowRoot!
        .querySelector('.candlestick__tooltip') as HTMLElement;
      const r = tip.getBoundingClientRect();
      return {
        width: r.width, height: r.height, left: r.left, top: r.top,
        right: r.right, bottom: r.bottom,
        rows: tip.querySelectorAll('.candlestick__tooltip-row').length,
        vw: window.innerWidth, vh: window.innerHeight
      };
    });

    expect(geometry.rows).toBeGreaterThanOrEqual(5); // date, O, H, L, C
    expect(geometry.width).toBeGreaterThan(60);
    expect(geometry.height).toBeGreaterThan(40);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.vw + 1);
  });
});
