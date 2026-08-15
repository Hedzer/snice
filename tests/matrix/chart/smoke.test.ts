/**
 * Smoke slice of the snice-chart matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/chart, 205 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file is
 * the standing cost the everyday loop pays, and it lives at `smoke.test.ts`
 * so it stays collected.
 *
 * Marquee combos only — one per family the matrix is built around:
 *   · a cartesian chart with the doc's own dataset, legend on top;
 *   · a pie chart, because it takes a different drawing path and a different
 *     colouring rule;
 *   · legend position "none", the branch that removes a whole subtree;
 *   · a legend click, the documented toggle;
 *   · the empty dataset list, the state with no series to divide by.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeChart, expectChartMatches, legendItems, legendLabels, click,
  wait, SETTLE, CANONICAL, CANONICAL_LABELS,
  type SniceChartElement,
} from './matrix-utils';

const OPTIONS = { legend: { position: 'top' as const, clickable: true } };

describe('snice-chart matrix smoke', () => {
  let el: SniceChartElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('renders the documented shell for a line chart', async () => {
    el = await makeChart({
      type: 'line', datasets: CANONICAL, labels: CANONICAL_LABELS, options: OPTIONS,
    });
    expectChartMatches(el, { type: 'line', datasets: CANONICAL, options: OPTIONS });
  });

  it('renders the documented shell for a pie chart', async () => {
    el = await makeChart({
      type: 'pie', datasets: CANONICAL, labels: CANONICAL_LABELS, options: OPTIONS,
    });
    expectChartMatches(el, { type: 'pie', datasets: CANONICAL, options: OPTIONS });
  });

  it('legend position "none" removes the legend', async () => {
    const options = { legend: { position: 'none' as const } };
    el = await makeChart({
      type: 'bar', datasets: CANONICAL, labels: CANONICAL_LABELS, options,
    });
    expectChartMatches(el, { type: 'bar', datasets: CANONICAL, options });
    expect(legendItems(el)).toHaveLength(0);
  });

  it('a legend click toggles the dataset it names', async () => {
    el = await makeChart({
      type: 'line', datasets: CANONICAL, labels: CANONICAL_LABELS, options: OPTIONS,
    });
    expect(legendLabels(el)).toEqual(['Sales', 'Costs']);
    click(legendItems(el)[1]);
    await wait(SETTLE);
    expectChartMatches(el, {
      type: 'line', datasets: CANONICAL, options: OPTIONS, hidden: [1],
    });
  });

  it('renders the shell for an empty dataset list', async () => {
    el = await makeChart({ type: 'line', datasets: [], labels: [], options: OPTIONS });
    expectChartMatches(el, { type: 'line', datasets: [], options: OPTIONS });
    expect(el.exportImage()).toBe('');
  });
});
