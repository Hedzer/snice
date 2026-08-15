/**
 * snice-funnel matrix — the display cross.
 *
 * FULL product of the five display switches the docs expose:
 *   orientation {vertical, horizontal}
 *     x variant {default, gradient}
 *     x show-labels {on, off}
 *     x show-values {on, off}
 *     x show-percentages {on, off}
 *   = 32 combos, each asserted through `expectFunnelMatches`.
 *
 * The product is worth enumerating rather than sampling because the three text
 * flags SHARE A LAYOUT: the component moves each text run's baseline depending
 * on which of the others are on (label pushes value down, value pushes the
 * percentage down). That is precisely the shape of code where "labels off" is
 * the combo nobody tried, so every cell is mounted.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeFunnel, expectFunnelMatches, expectChartAccessible, CANONICAL,
  type SniceFunnelElement,
} from './matrix-utils';

const ORIENTATIONS = ['vertical', 'horizontal'] as const;
const VARIANTS = ['default', 'gradient'] as const;
const FLAGS = [true, false];

describe('snice-funnel matrix: display cross', () => {
  let el: SniceFunnelElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const orientation of ORIENTATIONS) {
    for (const variant of VARIANTS) {
      for (const showLabels of FLAGS) {
        for (const showValues of FLAGS) {
          for (const showPercentages of FLAGS) {
            const id = `${orientation}/${variant}/L${+showLabels}V${+showValues}P${+showPercentages}`;

            it(`renders the documented stages: ${id}`, async () => {
              el = await makeFunnel({
                data: CANONICAL, orientation, variant,
                showLabels, showValues, showPercentages,
              });
              expectChartAccessible(el);
              expectFunnelMatches(el, CANONICAL, { showLabels, showValues, showPercentages });
            });
          }
        }
      }
    }
  }
});
