/**
 * Matrix slice WATERFALL / CUMULATIVE — the arithmetic that makes a bridge
 * chart a bridge chart.
 *
 * Dimensions: dataset (7) x animated (2) = 14 combos. `animated` rides along
 * because a component that swaps in an animated render path is exactly the
 * component that could plot the animated path from different numbers; the docs
 * promise the same chart either way.
 *
 * Documented contract under test: "Waterfall chart (bridge chart) showing
 * cumulative effect of sequential positive/negative values" — each bar floats
 * between the running total before it and the running total after it, a `total`
 * bar restates the accumulated figure from the baseline, and everything is
 * plotted against one shared value axis.
 *
 * The oracle (`cumulativeProblems`) is scale-free on purpose: the docs pin the
 * cumulative MODEL, not the pixel scale, so it verifies that every plotted edge
 * and the zero axis all sit on one consistent, upward value->y mapping rather
 * than predicting coordinates the docs never promised.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DATASET_NAMES,
  combo, comboId, makeWaterfall, cumulativeProblems, expectClean,
} from './waterfall-support';

describe('waterfall matrix: cumulative model', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const dataset of DATASET_NAMES) {
    for (const animated of [false, true]) {
      const c = combo({ dataset, animated });

      it(`${comboId(c)}: plots the running total on one shared axis`, async () => {
        el = await makeWaterfall(c);
        expectClean(cumulativeProblems(el, c), comboId(c));
      });
    }
  }
});
