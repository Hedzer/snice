/**
 * snice-funnel matrix — the data cross.
 *
 * Eleven dataset shapes x both orientations = 22 combos. The orientation axis
 * is repeated for every shape ON PURPOSE: the component builds two entirely
 * separate SVG strings (`buildVerticalSVG` / `buildHorizontalSVG`) that each
 * re-derive widths, percentages and escaping from the same data, so a shape
 * that survives one path proves nothing about the other.
 *
 * The shapes are chosen to be the ones that break funnel arithmetic:
 * a zero first stage (division by zero), a stage LARGER than the first
 * (>100%, the "funnel" that widens), fractional values (rounding), a single
 * stage (no `data[i-1]`), and empty data (no `data[0]`).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeFunnel, expectFunnelMatches, expectChartAccessible, expectedPercent,
  svgEl, stageEls, textIn, CANONICAL,
  type FunnelStage, type SniceFunnelElement,
} from './matrix-utils';

interface Shape { id: string; data: FunnelStage[] }

const SHAPES: Shape[] = [
  { id: 'canonical', data: CANONICAL },
  { id: 'single-stage', data: [{ label: 'Only', value: 42 }] },
  { id: 'two-equal', data: [{ label: 'A', value: 100 }, { label: 'B', value: 100 }] },
  { id: 'zero-first', data: [{ label: 'Zero', value: 0 }, { label: 'After', value: 5 }] },
  { id: 'all-zero', data: [{ label: 'A', value: 0 }, { label: 'B', value: 0 }] },
  // A later stage bigger than the first: a real funnel never does this, which
  // is exactly why the code path is untested until something asserts it.
  { id: 'widening', data: [{ label: 'Start', value: 100 }, { label: 'More', value: 250 }] },
  { id: 'fractional', data: [{ label: 'A', value: 3 }, { label: 'B', value: 1 }] },
  { id: 'millions', data: [{ label: 'Impressions', value: 4_200_000 }, { label: 'Clicks', value: 12_500 }] },
  {
    id: 'all-custom-colors',
    data: [
      { label: 'A', value: 90, color: '#e74c3c' },
      { label: 'B', value: 45, color: 'rgb(0, 128, 0)' },
    ],
  },
  {
    id: 'mixed-colors',
    data: [
      { label: 'A', value: 90, color: '#123456' },
      { label: 'B', value: 45 },
      { label: 'C', value: 10, color: 'tomato' },
    ],
  },
  // Labels the funnel must ESCAPE on the way into innerHTML and hand back
  // verbatim as text.
  {
    id: 'html-in-labels',
    data: [
      { label: '<b>Bold</b> & "quoted"', value: 500 },
      { label: "O'Brien <script>", value: 200 },
    ],
  },
];

const ORIENTATIONS = ['vertical', 'horizontal'] as const;
const ALL_ON = { showLabels: true, showValues: true, showPercentages: true };

describe('snice-funnel matrix: data shapes', () => {
  let el: SniceFunnelElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const shape of SHAPES) {
    for (const orientation of ORIENTATIONS) {
      it(`renders every stage: ${shape.id}/${orientation}`, async () => {
        el = await makeFunnel({ data: shape.data, orientation, ...ALL_ON });
        expectChartAccessible(el);
        expectFunnelMatches(el, shape.data, ALL_ON);
      });
    }
  }

  // ── Empty data: the one shape with no chart to assert ────────────────────

  for (const orientation of ORIENTATIONS) {
    it(`renders no chart for empty data: ${orientation}`, async () => {
      el = await makeFunnel({ data: [], orientation, ...ALL_ON });
      expect(svgEl(el)).toBeNull();
      expect(stageEls(el)).toHaveLength(0);
    });
  }

  // ── Percentage arithmetic, stated once against the oracle ────────────────

  it('derives every percentage from the first stage', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const stages = stageEls(el);
    expect(stages.slice(1).map(s => textIn(s, 'percentage'))).toEqual(
      CANONICAL.slice(1).map((_, i) => expectedPercent(CANONICAL, i + 1)),
    );
    // 5000/10000, 2000/10000, 500/10000 — pinned so a change in the reference
    // stage (e.g. "percent of previous") cannot pass by redefining the oracle.
    expect(stages.slice(1).map(s => textIn(s, 'percentage'))).toEqual(['50%', '20%', '5%']);
  });

  it('shows a distinguishable value for each distinct stage value', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const values = stageEls(el).map(s => textIn(s, 'value'));
    expect(new Set(values).size).toBe(CANONICAL.length);
  });

  it('hands labels back as text, not as markup', async () => {
    const data = SHAPES.find(s => s.id === 'html-in-labels')!.data;
    el = await makeFunnel({ data, ...ALL_ON });
    const stage = stageEls(el)[0];
    expect(textIn(stage, 'label')).toBe(data[0].label);
    // The escaped source must not have produced real elements inside the chart.
    expect(el.shadowRoot!.querySelector('.funnel__chart b')).toBeNull();
    expect(el.shadowRoot!.querySelector('.funnel__chart script')).toBeNull();
  });
});
