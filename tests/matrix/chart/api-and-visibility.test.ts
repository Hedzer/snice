/**
 * snice-chart matrix — the METHOD and VISIBILITY cross.
 *
 * Doc "Methods" lists seven entry points; doc "Accessibility" adds "Legend
 * items clickable to toggle datasets", gated by `options.legend.clickable`.
 * Both are crossed here because they share one piece of state — the set of
 * hidden dataset INDICES — and index-keyed visibility is the classic place for
 * an off-by-one to hide the wrong series after a list mutation.
 *
 *   toggle route {legend click, toggleDataset()}
 *     x clickable {true, false}
 *     x type {line, bar, pie, radar, mixed}
 *   = 20 combos, plus the mutation sequences that move indices under the set.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeChart, expectChartMatches, legendItems, legendLabels, hiddenLegendFlags,
  click, wait, SETTLE, series, CANONICAL, CANONICAL_LABELS, finding,
  type ChartType, type SniceChartElement,
} from './matrix-utils';

const TOGGLE_TYPES: ChartType[] = ['line', 'bar', 'pie', 'radar', 'mixed'];

describe('snice-chart matrix: dataset visibility cross', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const type of TOGGLE_TYPES) {
    for (const clickable of [true, false]) {
      for (const route of ['legend-click', 'toggleDataset'] as const) {
        const id = `${type}/clickable=${clickable}/${route}`;

        it(`toggles the documented dataset: ${id}`, async () => {
          const datasets = series(3);
          const options = { legend: { position: 'top' as const, clickable } };
          el = await makeChart({ type, datasets, labels: ['a', 'b', 'c', 'd'], options });
          expectChartMatches(el, { type, datasets, options });

          if (route === 'legend-click') click(legendItems(el)[1]);
          else el.toggleDataset(1);
          await wait(SETTLE);

          // Doc: `legend.clickable` gates the CLICK route only. The
          // `toggleDataset()` method is a documented public API and is not
          // gated by a legend option at all.
          const hidden = route === 'toggleDataset' || clickable ? [1] : [];
          expectChartMatches(el, { type, datasets, options, hidden });

          // Toggling the same dataset again restores it — the documented verb
          // is "toggle", not "hide".
          if (route === 'legend-click') click(legendItems(el)[1]);
          else el.toggleDataset(1);
          await wait(SETTLE);
          expectChartMatches(el, { type, datasets, options, hidden: [] });
        });
      }
    }
  }
});

describe('snice-chart matrix: list mutation methods', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const options = { legend: { position: 'top' as const, clickable: true } };

  // Doc: `addDataset(dataset)` - "Append dataset".
  it('addDataset appends to the end of the list and the legend', async () => {
    const datasets = series(2);
    el = await makeChart({ type: 'line', datasets, labels: ['a', 'b', 'c', 'd'], options });
    expect(legendLabels(el)).toEqual(['Series 0', 'Series 1']);

    el.addDataset({ label: 'Appended', data: [5, 5, 5, 5] });
    await wait(SETTLE);
    expect(legendLabels(el)).toEqual(['Series 0', 'Series 1', 'Appended']);
    expect(el.getData().datasets).toHaveLength(3);
  });

  // Doc: `removeDataset(index)` - "Remove by index".
  it('removeDataset drops exactly the indexed dataset', async () => {
    const datasets = series(4);
    el = await makeChart({ type: 'bar', datasets, labels: ['a', 'b', 'c', 'd'], options });

    el.removeDataset(1);
    await wait(SETTLE);
    expect(legendLabels(el)).toEqual(['Series 0', 'Series 2', 'Series 3']);

    // An out-of-range index removes nothing rather than corrupting the list.
    el.removeDataset(99);
    await wait(SETTLE);
    expect(legendLabels(el)).toEqual(['Series 0', 'Series 2', 'Series 3']);
  });

  // Doc: `update(datasets)` - "Replace all datasets".
  it('update replaces the whole list', async () => {
    const datasets = series(3);
    el = await makeChart({ type: 'area', datasets, labels: ['a', 'b', 'c', 'd'], options });

    const replacement = [{ label: 'Only', data: [1, 2, 3, 4] }];
    el.update(replacement);
    await wait(SETTLE);
    expect(legendLabels(el)).toEqual(['Only']);
    expectChartMatches(el, { type: 'area', datasets: replacement, options });
  });

  // Doc: `getData()` - "Get current data". It must report what the chart is
  // actually showing, after every documented mutation route.
  it('getData reports the live datasets and labels', async () => {
    const datasets = series(2);
    el = await makeChart({ type: 'line', datasets, labels: CANONICAL_LABELS, options });
    expect(el.getData().labels).toEqual(CANONICAL_LABELS);
    expect(el.getData().datasets.map(d => d.label)).toEqual(['Series 0', 'Series 1']);

    el.addDataset({ label: 'Third', data: [1, 1, 1, 1] });
    await wait(SETTLE);
    expect(el.getData().datasets.map(d => d.label)).toEqual(['Series 0', 'Series 1', 'Third']);

    el.removeDataset(0);
    await wait(SETTLE);
    expect(el.getData().datasets.map(d => d.label)).toEqual(['Series 1', 'Third']);
  });

  // Doc: `refresh()` - "Re-render chart". It must not change what is shown.
  it('refresh re-renders without altering the data or the legend', async () => {
    el = await makeChart({
      type: 'line', datasets: CANONICAL, labels: CANONICAL_LABELS, options,
    });
    const before = legendLabels(el);
    el.refresh();
    await wait(SETTLE);
    expect(legendLabels(el)).toEqual(before);
    expectChartMatches(el, { type: 'line', datasets: CANONICAL, options });
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc: `removeDataset(index)` - "Remove by index", and `toggleDataset(index)`
  // - "Toggle visibility". Visibility is stored as a set of INDICES, and
  // removing a dataset only deletes that one index from it; every hidden index
  // above the removal point still refers to its old slot. So hiding series 2 and
  // then removing series 0 leaves the hidden mark on what is now series 2 — the
  // wrong series disappears, and the one the user hid comes back.
  it.fails(finding(
    'MATRIX-chart-1',
    'removeDataset does not re-base the hidden-dataset indices, so removing a '
    + 'dataset transfers a hidden series\' state to a different series',
  ), async () => {
    const datasets = series(4);
    el = await makeChart({ type: 'line', datasets, labels: ['a', 'b', 'c', 'd'], options });

    el.toggleDataset(2);                    // hide "Series 2"
    await wait(SETTLE);
    expect(hiddenLegendFlags(el)).toEqual([false, false, true, false]);

    el.removeDataset(0);                    // "Series 2" is now at index 1
    await wait(SETTLE);

    expect(legendLabels(el)).toEqual(['Series 1', 'Series 2', 'Series 3']);
    expect(hiddenLegendFlags(el),
      'the hidden mark did not follow "Series 2" to its new index')
      .toEqual([false, true, false]);
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc `ChartDataset.hidden?: boolean` is part of the published dataset
  // contract in `snice-chart.types.ts` — the declarative way to start a series
  // hidden, and the only way to restore a saved visibility state when
  // re-assigning `datasets`. The component never reads it: visibility lives
  // entirely in a private index set, so `hidden: true` renders a fully visible
  // series with a fully lit legend entry.
  it.fails(finding(
    'MATRIX-chart-2',
    'ChartDataset.hidden is ignored — a dataset declared hidden renders and its '
    + 'legend entry is not marked hidden',
  ), async () => {
    const datasets = [
      { label: 'Visible', data: [1, 2, 3] },
      { label: 'Hidden', data: [4, 5, 6], hidden: true },
      { label: 'Also visible', data: [7, 8, 9] },
    ];
    el = await makeChart({ type: 'line', datasets, labels: ['a', 'b', 'c'], options });
    expect(hiddenLegendFlags(el)).toEqual([false, true, false]);
  });
});
