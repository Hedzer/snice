/**
 * snice-chart matrix — the SHELL cross.
 *
 * FULL product of the two dimensions every chart type shares:
 *
 *   type {line, bar, horizontal-bar, area, pie, donut, scatter, bubble,
 *         radar, mixed}                                                  (10)
 *     x legend position {top, bottom, left, right, none}                  (5)
 *   = 50 combos, each judged by `expectChartMatches`.
 *
 * Enumerating rather than sampling is the point here. The ten types take three
 * completely different drawing paths (`drawPieChart`, `drawRadarChart`,
 * `drawCartesianChart`) but ONE render template, and the render template is
 * what produces the documented parts, the a11y summary and the legend. A type
 * that renders no canvas, or a legend position class that only exists for the
 * two positions someone tried by hand, is exactly what this cross catches — and
 * `legend: none` is crossed against every type because "remove the legend" is a
 * branch that gets forgotten for the types nobody demoes.
 *
 * The animation switch is crossed on top (rotated across the 50) rather than
 * doubling the product: it is a single class on the container with no
 * type-specific code behind it, so a full 100-cell product would buy nothing.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeChart, expectChartMatches, TYPES, LEGEND_POSITIONS, CANONICAL, CANONICAL_LABELS,
  type SniceChartElement,
} from './matrix-utils';

describe('snice-chart matrix: type x legend position', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  let n = 0;
  for (const type of TYPES) {
    for (const position of LEGEND_POSITIONS) {
      const animationEnabled = n % 2 === 0;
      n++;
      const id = `${type}/legend=${position}/animation=${animationEnabled}`;

      it(`renders the documented shell: ${id}`, async () => {
        const options = {
          legend: { position, clickable: true },
          animation: { enabled: animationEnabled },
        };
        el = await makeChart({
          type, datasets: CANONICAL, labels: CANONICAL_LABELS, options,
        });
        expectChartMatches(el, { type, datasets: CANONICAL, options });
      });
    }
  }
});

describe('snice-chart matrix: dataset-count cross', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: `datasets: ChartDataset[] = []`. The legend is one entry per dataset,
  // so the count is crossed against the drawing families — a chart with no
  // datasets must still render its shell rather than throwing, and a chart with
  // more datasets than the eight-slot accent palette must still colour them all.
  for (const count of [0, 1, 2, 3, 8, 9, 12]) {
    for (const type of ['line', 'bar', 'pie', 'radar'] as const) {
      it(`renders ${count} legend entries: ${type}/${count} datasets`, async () => {
        const datasets = Array.from({ length: count }, (_, i) => ({
          label: `Series ${i}`,
          data: [1 + i, 2 + i, 3 + i],
        }));
        const options = { legend: { position: 'top' as const, clickable: true } };
        el = await makeChart({ type, datasets, labels: ['a', 'b', 'c'], options });
        expectChartMatches(el, { type, datasets, options });
      });
    }
  }
});
