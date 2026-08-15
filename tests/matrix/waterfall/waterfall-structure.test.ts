/**
 * Matrix slice WATERFALL / STRUCTURE — the data shapes crossed with the two
 * display switches.
 *
 * Dimensions: dataset (7) x showValues (2) x showConnectors (2) = 28 combos,
 * with `orientation` and `animated` rotated across the product so neither is
 * ever the same value for a whole run (their own dedicated slices own the
 * claims those two make).
 *
 * Documented contract under test (docs/ai/components/waterfall.md):
 *   · CSS parts `base` and `chart` exist for every combo, data or no data;
 *   · one bar per `WaterfallDataPoint`, addressable by its index;
 *   · `type` is the authored one, or "auto-detected from value sign if omitted";
 *   · every bar shows its `label`;
 *   · `showValues` decides whether value labels exist at all, and each label
 *     carries the sign that makes the bar type readable "not color alone";
 *   · `showConnectors` decides whether the n-1 bridging lines are drawn.
 *
 * it.fails policy: every assertion here is the documented expectation and every
 * combo passes. The findings this component has are pinned in
 * waterfall-orientation.test.ts and waterfall-a11y.test.ts.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DATASET_NAMES, ORIENTATIONS,
  combo, comboId, makeWaterfall, structureProblems, expectClean,
} from './waterfall-support';

describe('waterfall matrix: structure', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  let rotation = 0;
  for (const dataset of DATASET_NAMES) {
    for (const showValues of [true, false]) {
      for (const showConnectors of [true, false]) {
        // Rotating the two dimensions this file does not own keeps the product
        // at 28 while still crossing them against every data shape.
        const orientation = ORIENTATIONS[rotation % ORIENTATIONS.length];
        const animated = rotation % 3 === 0;
        rotation++;

        const c = combo({ dataset, showValues, showConnectors, orientation, animated });

        it(`${comboId(c)}: renders the documented chart`, async () => {
          el = await makeWaterfall(c);
          expectClean(structureProblems(el, c), comboId(c));
        });
      }
    }
  }
});
