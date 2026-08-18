/**
 * snice-chart matrix — EXPORT and OPTIONS.
 *
 * Two documented surfaces that are pure contract rather than pixels, and so
 * belong in the DOM tier:
 *
 *   · `exportImage(format?: 'png'|'svg'): string` — "Export as data URL
 *     (default: 'svg')", crossed over all ten chart types and both formats
 *     (20 combos);
 *   · `options: ChartOptions` — a documented DEFAULT object, every field of
 *     which is optional, so assigning a partial object must leave the rest of
 *     the defaults standing.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeChart, expectChartMatches, legendItems, legendEl, containerEl, click,
  wait, SETTLE, TYPES, CANONICAL, CANONICAL_LABELS, series, finding,
  type SniceChartElement,
} from './matrix-utils';

describe('snice-chart matrix: exportImage cross', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: an empty chart has nothing to export. The empty string is the only
  // sensible "no image" value a `string` return type can carry.
  it('exports nothing for a chart with no datasets', async () => {
    el = await makeChart({ type: 'line', datasets: [], labels: [] });
    expect(el.exportImage()).toBe('');
    expect(el.exportImage('svg')).toBe('');
  });

  // MATRIX-chart-3 (fixed): `exportImage('svg')` returns the documented
  // `data:image/svg+xml` URL — usable directly from `<img src>` or a download
  // link. Crossed over every chart type, because the three drawing families
  // build their SVG in three separate methods and the wrap must reach all.
  for (const type of TYPES) {
    it(finding(
      'MATRIX-chart-3 (fixed)',
      `exportImage('svg') returns the documented data URL (${type})`,
    ), async () => {
      el = await makeChart({
        type, datasets: CANONICAL, labels: CANONICAL_LABELS,
      });
      const exported = el.exportImage('svg');
      expect(exported.length, `${type}: exportImage returned nothing`).toBeGreaterThan(0);
      expect(exported.startsWith('data:image/svg+xml'),
        `${type}: exportImage returned "${exported.slice(0, 40)}…"`).toBe(true);
    });
  }

  // MATRIX-chart-4 (fixed): `exportImage('png')` returns a `data:image/png`
  // URL for every chart type. The raster is produced by the 2D canvas when the
  // environment has one and by a dependency-free PNG encoder otherwise (the
  // signature is documented synchronous, and browsers decode SVG images
  // asynchronously, so no synchronous rasterization of the marks exists).
  for (const type of TYPES) {
    it(finding(
      'MATRIX-chart-4 (fixed)',
      `exportImage('png') returns a PNG data URL (${type})`,
    ), async () => {
      el = await makeChart({
        type, datasets: CANONICAL, labels: CANONICAL_LABELS,
      });
      const exported = el.exportImage('png');
      expect(exported.startsWith('data:image/png'),
        `${type}: exportImage('png') returned "${exported.slice(0, 40)}…"`).toBe(true);
    });
  }
});

describe('snice-chart matrix: options defaults', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc Properties: the default options object is
  //   { responsive, maintainAspectRatio, legend: {position:'top', clickable:true},
  //     tooltip: {trigger:'hover'}, animation: {enabled:true, ...},
  //     xAxis: {grid:true}, yAxis: {grid:true} }
  // A chart that is never given `options` must behave exactly like that.
  it('a chart with no options uses the documented defaults', async () => {
    el = await makeChart({
      type: 'line', datasets: CANONICAL, labels: CANONICAL_LABELS,
    });
    const legend = legendEl(el);
    expect(legend, 'the default legend position is "top", so a legend must render')
      .not.toBeNull();
    expect(legend!.classList.contains('legend-top')).toBe(true);
    expect(containerEl(el)!.classList.contains('animated'),
      'animation.enabled defaults to true').toBe(true);

    // clickable defaults to true, so a legend click toggles the dataset.
    click(legendItems(el)[0]);
    await wait(SETTLE);
    expectChartMatches(el, {
      type: 'line', datasets: CANONICAL,
      options: { legend: { position: 'top', clickable: true } },
      hidden: [0],
    });
  });

  // Doc `ChartOptions`: every field is optional. `animation.enabled` is the one
  // switch with a rendered consequence in this tier, and both of its states are
  // asserted against the container class the CSS keys off.
  it('animation.enabled switches the animated class in both directions', async () => {
    for (const enabled of [true, false]) {
      const options = {
        legend: { position: 'top' as const, clickable: true },
        animation: { enabled },
      };
      el = await makeChart({
        type: 'bar', datasets: CANONICAL, labels: CANONICAL_LABELS, options,
      });
      expectChartMatches(el, { type: 'bar', datasets: CANONICAL, options });
      removeComponent(el);
      el = undefined;
    }
  });

  // Doc `ChartLegendPosition` includes `'none'`, which is the documented way to
  // suppress the legend entirely — not to hide it with CSS.
  it('legend position "none" removes the legend from the DOM', async () => {
    const options = { legend: { position: 'none' as const } };
    el = await makeChart({
      type: 'pie', datasets: CANONICAL, labels: CANONICAL_LABELS, options,
    });
    expectChartMatches(el, { type: 'pie', datasets: CANONICAL, options });
    expect(legendItems(el)).toHaveLength(0);
  });

  // MATRIX-chart-5 (fixed): a partial `options` object is deep-merged over the
  // documented defaults, so `options = { yAxis: { min: 0 } }` — straight out of
  // the doc's own example shape — leaves `legend.clickable` (documented
  // default `true`) standing.
  it(finding(
    'MATRIX-chart-5 (fixed)',
    'a partial `options` object merges with the documented defaults — setting '
    + 'only yAxis keeps legend.clickable at its documented default',
  ), async () => {
    const datasets = series(2);
    el = await makeChart({
      type: 'line', datasets, labels: CANONICAL_LABELS,
      options: { yAxis: { min: 0, max: 100, grid: true } },
    });

    // The documented default legend position is "top" and it does still apply,
    // because the render falls back to it — so the legend is on screen and
    // looks clickable.
    expect(legendItems(el)).toHaveLength(2);

    click(legendItems(el)[0]);
    await wait(SETTLE);
    expect(legendItems(el)[0].classList.contains('hidden'),
      'legend.clickable defaults to true, so this click should have hidden the dataset')
      .toBe(true);
  });
});
