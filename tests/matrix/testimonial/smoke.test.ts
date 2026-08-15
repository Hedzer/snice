/**
 * Smoke slice of the snice-testimonial matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (see
 * vitest.config.ts); the 95-combo matrix runs only via `npm run test:matrix`.
 * This file is the standing cost the everyday loop DOES pay, and it lives
 * at `smoke.test.ts` so it stays collected.
 *
 * Four marquee combos, one per documented rule that has nowhere else to break:
 * the star row's fill split, the "role at company" join, the avatar's presence
 * rule and its accessible name, and the variant reflection the stylesheet keys
 * on. Every assertion routes through the matrix's own oracle (`expectedShape` /
 * `readShape`), so this file cannot drift into asserting something weaker than
 * the suite it stands in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, unmountAll } from '../matrix-utils';
import {
  mountTestimonial, expectedShape, readShape, expectedAxes, readAxes,
  starGlyphs, glyphKind, starsPart, roleLine, avatarImage,
  type TestimonialCombo,
} from './testimonial-support';
import '../../../packages/components/src/testimonial/snice-testimonial';

const combo = (over: Partial<TestimonialCombo>): TestimonialCombo => ({
  id: 'smoke', variant: 'card', rating: 0, avatar: '', roleShape: 'none',
  channel: 'attr', ...over,
});

describe('testimonial matrix smoke', () => {
  afterEach(() => unmountAll());

  it('rating 4 paints four filled stars and one outline; rating 0 paints none', async () => {
    const rated = combo({ rating: 4 });
    const el = await mountTestimonial(rated);
    expect(starGlyphs(el).map(glyphKind))
      .toEqual(['filled', 'filled', 'filled', 'filled', 'outline']);
    expectShape(readShape(el), expectedShape(rated), 'smoke/rating:4');

    const bare = combo({ rating: 0 });
    const plain = await mountTestimonial(bare);
    expect(starsPart(plain)).toBeNull();
    expectShape(readShape(plain), expectedShape(bare), 'smoke/rating:0');
  });

  it('role and company render as "role at company"', async () => {
    const both = combo({ roleShape: 'both', rating: 5 });
    const el = await mountTestimonial(both);
    expect(roleLine(el)).toBe('CTO at Acme Corp');
    expectShape(readShape(el), expectedShape(both), 'smoke/role:both');
  });

  it('an avatar URL renders an image named after the author; no URL renders none', async () => {
    const withAvatar = combo({ avatar: '/avatars/jane.png', roleShape: 'role' });
    const el = await mountTestimonial(withAvatar);
    const image = avatarImage(el);
    expect(image?.getAttribute('src')).toBe('/avatars/jane.png');
    expect(image?.getAttribute('alt')).toBe('Jane Doe');
    expectShape(readShape(el), expectedShape(withAvatar), 'smoke/avatar');

    const without = combo({ avatar: '' });
    expect(avatarImage(await mountTestimonial(without))).toBeNull();
  });

  it('a variant assigned as a property reflects to the attribute the stylesheet selects on', async () => {
    const featured = combo({ channel: 'prop', variant: 'featured', rating: 5 });
    const el = await mountTestimonial(featured);
    expect(el.getAttribute('variant')).toBe('featured');
    expectShape(readAxes(el, featured), expectedAxes(featured), 'smoke/prop/featured');
  });
});
