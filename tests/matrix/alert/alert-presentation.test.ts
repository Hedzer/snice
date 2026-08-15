/**
 * Matrix slice ALERT / PRESENTATION — the three appearance axes crossed.
 *
 * Dimensions: variant (4) x size (3) x appearance (2) = 24 combos, with the
 * `title` and `dismissible` switches rotated across the product so neither
 * structural add-on is only ever seen next to one variant.
 *
 * Documented contract under test (docs/ai/components/alert.md): whatever the
 * appearance axes are set to, the alert still renders its `base` part, still
 * carries the state classes and host attributes its stylesheet selects on,
 * still says what it was told to say, and still exposes the live region.
 * `variant`/`size`/`appearance` are pure CSS — whether they PAINT differently
 * is the visual tier's job (tests/live/matrix/alert).
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, afterEach } from 'vitest';
import {
  VARIANTS, SIZES, APPEARANCES,
  combo, comboId, makeAlert, expectAlertMatches, removeComponent,
} from './alert-support';

describe('alert matrix: presentation axes', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const appearance of APPEARANCES) {
        // Rotating the two structural switches keeps the product at 24 while
        // still crossing "has a title" and "has a dismiss button" against every
        // appearance value.
        const c = combo({
          variant, size, appearance,
          titled: n % 2 === 0,
          dismissible: n % 3 === 0,
        });
        n++;

        it(`${comboId(c)}: renders the documented structure`, async () => {
          alert = await makeAlert(c);
          expectAlertMatches(alert, c);
        });
      }
    }
  }
});
