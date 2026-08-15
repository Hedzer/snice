/**
 * MATRIX slice — snice-testimonial rendered shape.
 *
 * Dimensions (docs/ai/components/testimonial.md):
 *   variant (3) x rating (0, 3, 5) x avatar (absent, present) x
 *   role/company shape (none, role, company, both) = 72 combos
 *
 * The axes are crossed rather than sampled because they are NOT independent in
 * the docs: `featured` inverts the text colour that the stars and the role line
 * are painted in, `avatar` and the role line share `part="author"`, and the
 * role line's "role at company" join is the only place `role` and `company`
 * interact at all. `channel`, fractional/edge ratings and empty content live in
 * testimonial-edges.test.ts so this cross stays sized to a display-only card —
 * the table is the ceiling, not the template (.ai/fuzzing.md).
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, afterEach } from 'vitest';
import { product, comboId, expectShape, unmountAll } from '../matrix-utils';
import {
  VARIANTS, RATINGS, AVATARS, ROLE_SHAPES,
  mountTestimonial, expectedShape, readShape, expectedAxes, readAxes,
  type TestimonialCombo,
} from './testimonial-support';
import '../../../packages/components/src/testimonial/snice-testimonial';

const COMBOS: TestimonialCombo[] = product({
  variant: VARIANTS,
  rating: RATINGS,
  avatar: AVATARS,
  roleShape: ROLE_SHAPES,
}).map(c => ({
  ...c,
  channel: 'attr' as const,
  id: comboId({
    variant: c.variant,
    rating: `rating:${c.rating}`,
    avatar: c.avatar ? 'avatar' : 'no-avatar',
    roleShape: `role:${c.roleShape}`,
  }),
}));

describe('testimonial matrix: variant x rating x avatar x role/company', () => {
  afterEach(() => unmountAll());

  for (const combo of COMBOS) {
    it(`${combo.id}: renders the documented parts, text and stars`, async () => {
      const el = await mountTestimonial(combo);
      expectShape(readShape(el), expectedShape(combo), combo.id);
    });

    it(`${combo.id}: carries the documented property and attribute state`, async () => {
      const el = await mountTestimonial(combo);
      expectShape(readAxes(el, combo), expectedAxes(combo), combo.id);
    });
  }
});
