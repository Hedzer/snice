/**
 * Smoke slice of the snice-waterfall matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * waterfall matrix runs only via `npm run test:matrix`. This file deliberately
 * lives at `smoke.test.ts` so it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · structure   — the docs' own Basic Usage dataset renders the whole chart;
 *   · type        — a dataset with no `type` anywhere is sign-detected;
 *   · cumulative  — the running total is plotted on one shared axis (the only
 *                   arithmetic this component has), on the dataset that crosses
 *                   below zero;
 *   · switches    — `showValues` and `showConnectors` off really removes both;
 *   · events      — `bar-click` carries the caller's own item and its index;
 *   · findings    — the two marquee regressions, pinned so a FIX shows up here
 *                   immediately rather than only in the matrix tier.
 *
 * Every assertion routes through the matrix's own oracle
 * (matrix/waterfall/waterfall-support.ts) so this file cannot drift into
 * asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import {
  combo, comboId, dataOf, makeWaterfall,
  structureProblems, cumulativeProblems, orientationProblems, a11yProblems,
  expectClean, readFacts, collectEvents, clickBar,
} from './waterfall-support';

describe('waterfall matrix smoke', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('structure: the documented Basic Usage dataset renders the whole chart', async () => {
    const c = combo();
    el = await makeWaterfall(c);
    expectClean(structureProblems(el, c), comboId(c));

    const facts = readFacts(el);
    expect(facts.labels).toEqual(['Start', 'Revenue', 'Costs', 'Tax', 'End']);
    expect(facts.bars.map(bar => bar.type))
      .toEqual(['total', 'increase', 'decrease', 'decrease', 'total']);
  });

  it('type: a dataset with no explicit type is detected from each value sign', async () => {
    const c = combo({ dataset: 'auto' });
    el = await makeWaterfall(c);
    expectClean(structureProblems(el, c), comboId(c));
    expect(readFacts(el).bars.map(bar => bar.type))
      .toEqual(['increase', 'decrease', 'increase', 'decrease']);
  });

  it('cumulative: a run that crosses below zero still plots on one shared axis', async () => {
    const c = combo({ dataset: 'descending' });
    el = await makeWaterfall(c);
    expectClean(cumulativeProblems(el, c), comboId(c));
  });

  it('switches: showValues and showConnectors off remove exactly those parts', async () => {
    const c = combo({ showValues: false, showConnectors: false });
    el = await makeWaterfall(c);
    expectClean(structureProblems(el, c), comboId(c));

    const facts = readFacts(el);
    expect(facts.values).toEqual([]);
    expect(facts.connectorCount).toBe(0);
    expect(facts.bars).toHaveLength(dataOf(c).length);
  });

  it('events: bar-click carries the caller\'s own item and its index', async () => {
    const c = combo();
    el = await makeWaterfall(c);
    const seen = collectEvents(el, ['bar-click']);

    expect(clickBar(el, 2)).toBe(true);
    await wait(20);

    expect(seen).toHaveLength(1);
    expect(seen[0].detail.index).toBe(2);
    expect(seen[0].detail.item).toBe(dataOf(c)[2]);
  });

  // The two marquee regressions, kept at full strength. See
  // matrix/waterfall/waterfall-orientation.test.ts (MATRIX-waterfall-1) and
  // waterfall-a11y.test.ts (MATRIX-waterfall-3).
  it.fails('MATRIX-waterfall-1 orientation="horizontal" turns the chart', async () => {
    const c = combo({ orientation: 'horizontal' });
    el = await makeWaterfall(c);
    expectClean(orientationProblems(el, c), comboId(c));
  });

  it.fails('MATRIX-waterfall-3 bars carry a role and are focusable', async () => {
    const c = combo();
    el = await makeWaterfall(c);
    expectClean(a11yProblems(el, c), comboId(c));
  });
});
