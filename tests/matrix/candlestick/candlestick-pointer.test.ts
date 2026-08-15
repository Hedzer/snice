/**
 * snice-candlestick matrix — the POINTER slice: crosshair, tooltip, and the
 * three documented events.
 *
 * The docs promise:
 *
 *   showCrosshair   a crosshair that follows the pointer
 *   crosshair-move  -> { price, date, x, y }
 *   candle-click    -> { candle, index }
 *   candle-hover    -> { candle, index }
 *   tooltip part    the OHLC tooltip overlay
 *
 * The oracle for the crosshair is the chart's own axis again: the price the
 * component reports for a pointer position must be the price its y axis puts at
 * that position, and the vertical line must snap to the candle slot the pointer
 * is over. Two of the documented events do not exist at all; those are recorded
 * as findings, with the assertion left correct.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASET, combo, mountChart, mountChartImmediately, readAxis, readCandles,
  crosshairLines, tooltipState, withPointerSpace, pointerMove, pointerLeave,
  dateTextIsWellFormed, axisTextIsWellFormed, parsePrice, xLabels, removeComponent, wait,
  type CandleCombo,
} from './candlestick-support';

const SHAPE = DATASET['five-mixed'];

/** Pointer positions in the component's own user space (identity screen CTM). */
const POINTS: Array<{ id: string; x: number; y: number; inChart: boolean }> = [
  { id: 'top-left of the plot', x: 40, y: 40, inChart: true },
  { id: 'centre', x: 270, y: 180, inChart: true },
  { id: 'over the last slot', x: 500, y: 120, inChart: true },
  { id: 'low in the plot', x: 200, y: 340, inChart: true },
  { id: 'left of the plot', x: 2, y: 180, inChart: false },
  { id: 'right of the plot', x: 590, y: 180, inChart: false },
  { id: 'above the plot', x: 270, y: 2, inChart: false },
  { id: 'below everything', x: 270, y: 398, inChart: false },
];

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('candlestick matrix: crosshair x pointer position', () => {
  for (const showCrosshair of [true, false]) {
    for (const showVolume of [false, true]) {
      for (const point of POINTS) {
        const c = combo(
          `crosshair:${showCrosshair}/volume:${showVolume}/${point.id}`,
          SHAPE, { showCrosshair, showVolume, animation: false },
        );
        it(c.id, async () => {
          await withPointerSpace(async () => {
            chart = await mountChart(c);
            const events: any[] = [];
            chart.addEventListener('crosshair-move', (e: CustomEvent) => events.push(e.detail));

            pointerMove(chart, point.x, point.y);
            await wait(40);

            const problems: string[] = [];
            const lines = crosshairLines(chart);

            if (!showCrosshair) {
              if (lines.horizontal || lines.vertical) {
                problems.push(`showCrosshair is false but ${lines.horizontal + lines.vertical}`
                  + ' crosshair lines were drawn');
              }
              if (events.length) {
                problems.push(`showCrosshair is false but ${events.length} crosshair-move`
                  + ' events fired');
              }
              expect(problems, c.id).toEqual([]);
              return;
            }

            // ── The crosshair itself ─────────────────────────────────────────
            if (point.inChart) {
              if (lines.horizontal !== 1) {
                problems.push(`${lines.horizontal} horizontal crosshair lines, expected 1`);
              }
              if (lines.vertical !== 1) {
                problems.push(`${lines.vertical} vertical crosshair lines, expected 1`);
              }
            } else if (lines.horizontal || lines.vertical) {
              problems.push('a crosshair was drawn for a pointer outside the plot area');
            }

            // ── The reported price agrees with the rendered axis ──────────────
            if (events.length) {
              const axis = readAxis(chart, c.yAxisFormat);
              const first = axis[0];
              const last = axis[axis.length - 1];
              const slope = (last.y - first.y) / (last.price - first.price);
              const priceAt = (y: number) => first.price + (y - first.y) / slope;
              const detail = events[events.length - 1];

              if (Math.abs(detail.x - point.x) > 0.01 || Math.abs(detail.y - point.y) > 0.01) {
                problems.push(`crosshair-move reported (${detail.x}, ${detail.y}) for a`
                  + ` pointer at (${point.x}, ${point.y})`);
              }
              const wantPrice = priceAt(point.y);
              if (Math.abs(detail.price - wantPrice) > 0.05) {
                problems.push(`crosshair-move reported price ${detail.price},`
                  + ` but the rendered axis puts y=${point.y} at ${wantPrice.toFixed(4)}`);
              }
              const centres = readCandles(chart).map(candle => candle.x);
              let nearest = 0;
              for (let i = 1; i < centres.length; i++) {
                if (Math.abs(centres[i] - point.x) < Math.abs(centres[nearest] - point.x)) nearest = i;
              }
              const when = SHAPE.data[nearest].date as Date;
              if (!dateTextIsWellFormed(detail.date, c.timeFormat, when)) {
                problems.push(`crosshair-move reported date "${detail.date}" for the candle`
                  + ` at ${when.toISOString()} under timeFormat="${c.timeFormat}"`);
              }
            }

            expect(problems, c.id).toEqual([]);
          });
        });
      }
    }
  }
});

describe('candlestick matrix: the crosshair snaps to a candle slot', () => {
  it('puts the vertical line on the slot the pointer is over', async () => {
    await withPointerSpace(async () => {
      const c = combo('snap', SHAPE, { animation: false });
      chart = await mountChart(c);
      const centres = readCandles(chart).map(candle => candle.x);

      const problems: string[] = [];
      for (const x of [40, 120, 200, 270, 340, 420, 500]) {
        pointerMove(chart, x, 180);
        await wait(30);
        const vertical = chart.shadowRoot
          .querySelector('.candlestick__crosshair-v') as SVGLineElement | null;
        if (!vertical) { problems.push(`no vertical crosshair at x=${x}`); continue; }
        const drawn = Number(vertical.getAttribute('x1'));
        let nearest = centres[0];
        for (const centre of centres) {
          if (Math.abs(centre - x) < Math.abs(nearest - x)) nearest = centre;
        }
        if (Math.abs(drawn - nearest) > 0.01) {
          problems.push(`pointer at x=${x} snapped the crosshair to ${drawn},`
            + ` but the nearest candle slot is ${nearest}`);
        }
        const horizontal = chart.shadowRoot
          .querySelector('.candlestick__crosshair-h') as SVGLineElement | null;
        if (Number(horizontal?.getAttribute('y1')) !== 180) {
          problems.push(`the horizontal line sits at y=${horizontal?.getAttribute('y1')},`
            + ' not at the pointer');
        }
      }
      expect(problems).toEqual([]);
    });
  });

  it('clears the crosshair when the pointer leaves', async () => {
    await withPointerSpace(async () => {
      const c = combo('leave', SHAPE, { animation: false });
      chart = await mountChart(c);
      pointerMove(chart, 270, 180);
      await wait(30);
      expect(crosshairLines(chart)).toEqual({ horizontal: 1, vertical: 1 });

      pointerLeave(chart);
      await wait(30);
      expect(crosshairLines(chart), 'a crosshair outlived the pointer').toEqual({
        horizontal: 0, vertical: 0,
      });
      expect(tooltipState(chart).visible, 'the tooltip outlived the pointer').toBe(false);
    });
  });
});

describe('candlestick matrix: the OHLC tooltip', () => {
  const LABELS = ['Date', 'Open', 'High', 'Low', 'Close'];

  for (const showVolume of [false, true]) {
    for (const yAxisFormat of ['number', 'currency', 'percent'] as const) {
      for (const shape of ['five-mixed', 'no-volume'] as const) {
        const c = combo(`volume:${showVolume}/y:${yAxisFormat}/${shape}`, DATASET[shape], {
          showVolume, yAxisFormat, animation: false,
        });
        it(c.id, async () => {
          await withPointerSpace(async () => {
            chart = await mountChart(c);
            pointerMove(chart, 270, 180);
            await wait(40);

            const problems: string[] = [];
            const { visible, rows } = tooltipState(chart);
            if (!visible) problems.push('the tooltip stayed hidden while the pointer was over a candle');

            const labels = rows.map(([label]) => label);
            for (const label of LABELS) {
              if (!labels.includes(label)) problems.push(`the tooltip has no "${label}" row`);
            }
            // Volume is documented as optional data AND gated by showVolume.
            const dataHasVolume = c.dataset.data.some(candle => candle.volume !== undefined);
            const wantVolumeRow = showVolume && dataHasVolume;
            if (wantVolumeRow && !labels.includes('Volume')) {
              problems.push('showVolume is on and the data carries volume, but the tooltip'
                + ' has no Volume row');
            }
            if (!showVolume && labels.includes('Volume')) {
              problems.push('showVolume is off but the tooltip shows a Volume row');
            }

            // Prices in the tooltip use the same documented yAxisFormat as the axis.
            for (const [label, value] of rows) {
              if (label === 'Date' || label === 'Volume') continue;
              if (!axisTextIsWellFormed(value, yAxisFormat)) {
                problems.push(`tooltip ${label} reads "${value}", which is not a`
                  + ` ${yAxisFormat} value`);
              }
            }

            // The tooltip names the candle the pointer is actually over.
            const centres = readCandles(chart).map(candle => candle.x);
            let nearest = 0;
            for (let i = 1; i < centres.length; i++) {
              if (Math.abs(centres[i] - 270) < Math.abs(centres[nearest] - 270)) nearest = i;
            }
            const source = c.dataset.data[nearest];
            const cell = (name: string) => rows.find(([label]) => label === name)?.[1] ?? '';
            for (const [name, want] of [
              ['Open', source.open], ['High', source.high],
              ['Low', source.low], ['Close', source.close],
            ] as const) {
              const got = parsePrice(cell(name), yAxisFormat);
              if (Math.abs(got - want) > 0.01) {
                problems.push(`tooltip ${name} reads ${cell(name)} (${got}) for a candle`
                  + ` whose ${name.toLowerCase()} is ${want}`);
              }
            }

            expect(problems, c.id).toEqual([]);
          });
        });
      }
    }
  }

  it('is hidden before the pointer arrives', async () => {
    const c = combo('untouched', SHAPE, { animation: false });
    chart = await mountChart(c);
    expect(tooltipState(chart).visible).toBe(false);
  });
});

describe('candlestick matrix: zoomEnabled', () => {
  // Documented: "Enable scroll-to-zoom and drag-to-pan". So a wheel over the
  // chart narrows the visible window when enabled, and changes nothing when not.
  for (const zoomEnabled of [true, false]) {
    it(`wheel zoom with zoomEnabled=${zoomEnabled}`, async () => {
      await withPointerSpace(async () => {
        const c = combo(`wheel:${zoomEnabled}`, DATASET['sixty'], {
          zoomEnabled, animation: false,
        });
        chart = await mountChart(c);
        const before = readCandles(chart).length;

        const base = chart.shadowRoot.querySelector('[part="base"]')!;
        pointerMove(chart, 270, 180);
        await wait(20);
        base.dispatchEvent(new WheelEvent('wheel', {
          bubbles: true, composed: true, cancelable: true, deltaY: -120,
        }));
        await wait(40);
        const after = readCandles(chart).length;

        if (zoomEnabled) {
          expect(after, 'a wheel with zoomEnabled did not narrow the window')
            .toBeLessThan(before);
        } else {
          expect(after, 'a wheel changed the window even though zoomEnabled is false')
            .toBe(before);
        }
      });
    });
  }
});

// ── FINDINGS ────────────────────────────────────────────────────────────────
//
// Per .ai/fuzzing.md the assertions below stay CORRECT — they assert what
// docs/ai/components/candlestick.md promises — and are declared `it.fails` so
// the suite turns red the day the component is fixed and the finding is closed.

describe('candlestick matrix: findings', () => {
  it.fails(
    'MATRIX-candlestick-1: `animation` never animates when data is assigned in the'
    + ' ready tick (docs: "Animate candle appearance on data change")',
    async () => {
      // The documented usage is `import` then `chart.data = [...]`. Assigning
      // data in the same task the element becomes ready leaves every candle
      // WITHOUT the entry animation: a rebuild scheduled during the element's
      // own first pass lands after the data render and clears the flag. One
      // macrotask of delay and the same assignment animates correctly.
      const c = combo('ready-tick data', SHAPE, { animation: true });
      chart = await mountChartImmediately(c);
      const animated = readCandles(chart)
        .filter(candle => candle.bodyClass.includes('--animated')).length;
      expect(animated, 'candles carrying the documented entry animation')
        .toBe(SHAPE.data.length);
    },
  );

  it.fails(
    'MATRIX-candlestick-2: the documented `candle-click` event never fires',
    async () => {
      // docs: `candle-click` -> { candle: CandleData, index: number }.
      // The component declares the dispatcher and never calls it, and the
      // candle bodies carry `cursor: pointer` — so a chart advertises clickable
      // candles and then swallows every click.
      const c = combo('click', SHAPE, { animation: false });
      chart = await mountChart(c);
      const events: any[] = [];
      chart.addEventListener('candle-click', (e: CustomEvent) => events.push(e.detail));

      const body = chart.shadowRoot.querySelectorAll('.candlestick__body')[2];
      body.dispatchEvent(new MouseEvent('click', {
        bubbles: true, composed: true, cancelable: true, clientX: 270, clientY: 180,
      }));
      await wait(40);

      expect(events).toEqual([{ candle: SHAPE.data[2], index: 2 }]);
    },
  );

  it.fails(
    'MATRIX-candlestick-4: an ISO date-only string is plotted a day early west of'
    + ' Greenwich',
    async () => {
      // The docs' own example data is `{ date: '2024-01-01', ... }`. An ISO
      // date-only string is parsed as UTC midnight and then formatted in the
      // reader's local zone, so in any zone behind UTC every candle is labelled
      // with the PREVIOUS day. The zone is pinned here so the divergence is the
      // component's and not the machine's.
      const previousZone = process.env.TZ;
      process.env.TZ = 'America/New_York';
      try {
        const c = combo('iso dates', {
          id: 'iso', why: 'the docs\' own example shape', data: [
            { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500_000 },
            { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600_000 },
          ],
        }, { timeFormat: 'date', animation: false });
        chart = await mountChart(c);
        const labels = xLabels(chart).map(label => label.text);
        expect(labels[0], 'the x-axis label for the 2024-01-01 candle').toBe('Jan 1');
      } finally {
        if (previousZone === undefined) delete process.env.TZ;
        else process.env.TZ = previousZone;
      }
    },
  );

  it.fails(
    'MATRIX-candlestick-3: the documented `candle-hover` event never fires',
    async () => {
      // docs: `candle-hover` -> { candle: CandleData, index: number }. The
      // component computes the hovered candle for its own tooltip and never
      // tells anybody, so no page can react to a hover.
      await withPointerSpace(async () => {
        const c = combo('hover', SHAPE, { animation: false });
        chart = await mountChart(c);
        const events: any[] = [];
        chart.addEventListener('candle-hover', (e: CustomEvent) => events.push(e.detail));

        const centres = readCandles(chart).map(candle => candle.x);
        pointerMove(chart, centres[1], 180);
        await wait(40);

        expect(events.length, 'candle-hover events for a pointer over candle 1')
          .toBeGreaterThan(0);
      });
    },
  );
});
