/**
 * Matrix slice CHIP / PRESENTATION — the appearance axes crossed with the two
 * content sources.
 *
 * Dimensions: variant (6) x size (3) x shape (3) = 54 combos, with the content
 * source rotated across them so `label` and slotted text are each exercised on
 * a third of the product (docs: "slotted content wins").
 *
 * Documented contract under test (docs/ai/components/chip.md): whatever the
 * appearance axes are set to, the chip still renders its `base` part, still
 * says what it was told to say, still exposes `aria-disabled`, and stays
 * keyboard reachable. `variant`/`size`/`shape` are pure CSS on the host — the
 * DOM tier's job is to prove no appearance combination can break the
 * structure, and the visual tier (tests/live/matrix/chip) owns whether the
 * three axes actually paint differently.
 *
 * it.fails policy: every assertion here is the documented expectation. No
 * finding is pinned in this file.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  VARIANTS, SIZES, SHAPES, CONTENT_SOURCES,
  combo, comboId, makeChip, expectChipMatches,
} from './chip-support';

describe('chip matrix: presentation axes', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  let rotation = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const shape of SHAPES) {
        // Rotating the content source keeps the product at 54 combos while
        // still crossing `label` and slotted text against every appearance
        // axis value. `both` is the interesting one: the docs say the slot
        // wins even when a `label` is also set.
        const content = CONTENT_SOURCES[rotation++ % CONTENT_SOURCES.length];
        const c = combo({ variant, size, shape, content });

        it(`${comboId(c)}: renders the documented structure`, async () => {
          chip = await makeChip(c);
          expectChipMatches(chip, c);
        });
      }
    }
  }
});
