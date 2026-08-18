/**
 * Matrix slice WATERFALL / ORIENTATION — the documented `orientation` axis.
 *
 * Dimensions: dataset (7) crossed with the documented orientation values —
 * 7 vertical combos plus the 6 populated horizontal ones (an empty chart draws
 * no axis at all, so it carries no orientation claim), 13 in total.
 *
 * Documented contract (docs/ai/components/waterfall.md "Properties"):
 *
 *     orientation: 'vertical'|'horizontal' = 'vertical';
 *
 * A waterfall's orientation is the axis its VALUES run along, so the zero axis —
 * the single line marking value 0 across the plot — is drawn ACROSS that axis:
 * a horizontal baseline for a vertical chart (bars grow up and down from it), a
 * vertical baseline for a horizontal chart (bars grow left and right from it),
 * with the bars advancing along the other axis, one per data point.
 *
 * That is the weakest reading of the documented property that still means it
 * does anything at all: it pins no scale, no padding, and no bar thickness.
 *
 * ── FINDING MATRIX-waterfall-1 (FIXED) ──────────────────────────────────────
 * `orientation="horizontal"` used to render a chart byte-for-byte identical
 * to `orientation="vertical"`: the watcher re-ran `rebuildChart()`, but the
 * render never read `this.orientation`. `rebuildChart()` now draws a true
 * horizontal layout — values run across the page from a vertical zero axis,
 * bars advance down it — so the documented assertion runs unpinned.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DATASET_NAMES, DATASETS,
  combo, comboId, makeWaterfall, orientationProblems, expectClean,
} from './waterfall-support';

const POPULATED = DATASET_NAMES.filter(name => DATASETS[name].length > 0);

describe('waterfall matrix: orientation', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  // The documented default. These pass.
  for (const dataset of DATASET_NAMES) {
    const c = combo({ dataset, orientation: 'vertical' });

    it(`${comboId(c)}: values run up the page from a horizontal baseline`, async () => {
      el = await makeWaterfall(c);
      expectClean(orientationProblems(el, c), comboId(c));
    });
  }

  // MATRIX-waterfall-1 (fixed): horizontal now renders its own layout.
  for (const dataset of POPULATED) {
    const c = combo({ dataset, orientation: 'horizontal' });

    it(
      `MATRIX-waterfall-1 (fixed) ${comboId(c)}: values run across the page from a vertical baseline`,
      async () => {
        el = await makeWaterfall(c);
        expectClean(orientationProblems(el, c), comboId(c));
      },
    );
  }
});
