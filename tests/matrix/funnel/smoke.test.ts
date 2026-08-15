/**
 * Smoke slice of the snice-funnel matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/funnel, 90 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file is
 * the standing cost the everyday loop pays, and it lives at `smoke.test.ts`
 * so it stays collected.
 *
 * Marquee combos only — one per axis the matrix is built around:
 *   · the doc's own dataset rendered with everything on, vertical;
 *   · the same in horizontal, because the component builds a SEPARATE SVG for
 *     it and a change to one is routinely forgotten in the other;
 *   · all three text flags off, the combo that regresses into "labels always
 *     render" without anyone noticing;
 *   · a click, the load-bearing event;
 *   · empty data, the state with no `data[0]` to divide by.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeFunnel, expectFunnelMatches, expectChartAccessible,
  stageEls, svgEl, CANONICAL,
  type SniceFunnelElement,
} from './matrix-utils';

const ALL_ON = { showLabels: true, showValues: true, showPercentages: true };
const ALL_OFF = { showLabels: false, showValues: false, showPercentages: false };

describe('snice-funnel matrix smoke', () => {
  let el: SniceFunnelElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  it('vertical, everything shown', async () => {
    el = await makeFunnel({ data: CANONICAL, orientation: 'vertical', ...ALL_ON });
    expectChartAccessible(el);
    expectFunnelMatches(el, CANONICAL, ALL_ON);
  });

  it('horizontal, everything shown', async () => {
    el = await makeFunnel({ data: CANONICAL, orientation: 'horizontal', ...ALL_ON });
    expectChartAccessible(el);
    expectFunnelMatches(el, CANONICAL, ALL_ON);
  });

  it('gradient variant with every text flag off', async () => {
    el = await makeFunnel({ data: CANONICAL, variant: 'gradient', ...ALL_OFF });
    expectFunnelMatches(el, CANONICAL, ALL_OFF);
  });

  it('emits funnel-click with the clicked stage', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const seen: any[] = [];
    el.addEventListener('funnel-click', (e: any) => seen.push(e.detail));
    stageEls(el)[2].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(seen).toEqual([{ stage: CANONICAL[2], index: 2 }]);
  });

  it('renders no chart for empty data', async () => {
    el = await makeFunnel({ data: [] });
    expect(svgEl(el)).toBeNull();
  });
});
