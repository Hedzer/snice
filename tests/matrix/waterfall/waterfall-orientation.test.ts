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
 * ── FINDING MATRIX-waterfall-1 ──────────────────────────────────────────────
 * `orientation="horizontal"` renders a chart byte-for-byte identical to
 * `orientation="vertical"`. `handleDisplayChange` watches `orientation` and
 * re-runs `rebuildChart()`, but `rebuildChart()` never reads `this.orientation`
 * — the whole render is hard-coded to the vertical layout.
 *
 *   combo:    data=doc/orientation=horizontal/values/connectors/static
 *   expected: the value-0 axis is a VERTICAL baseline, and successive bars
 *             advance down the page.
 *   actual:   the axis is drawn horizontally at y=254.35 from x=20 to x=380 —
 *             the same line the vertical chart draws — and the bars advance
 *             across the page (dx = +72 each, dy varies with the value), i.e.
 *             the vertical layout, unchanged.
 *
 * The assertion below is the documented one and is NOT weakened; it is marked
 * `it.fails` so the divergence is reported rather than hidden.
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

  // MATRIX-waterfall-1. The assertion is the documented one; only the
  // expectation of PASSING is inverted.
  for (const dataset of POPULATED) {
    const c = combo({ dataset, orientation: 'horizontal' });

    it.fails(
      `MATRIX-waterfall-1 ${comboId(c)}: values run across the page from a vertical baseline`,
      async () => {
        el = await makeWaterfall(c);
        expectClean(orientationProblems(el, c), comboId(c));
      },
    );
  }
});
