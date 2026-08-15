/**
 * MATRIX slice — snice-testimonial authoring channel, rating scale, and the
 * empty-content states.
 *
 * Dimensions:
 *   channel (attr, prop) x variant (3)                    =  6 combos
 *   rating 1..5, both channels                            = 10 combos
 *   empty content (no quote, no author, neither, both)    =  4 combos
 *   live property updates                                 =  3 combos
 *                                                          ── 23 combos
 *
 * `channel` is a real axis, not a convenience: an authored attribute and a
 * post-connect property assignment are two different paths into the same state,
 * and only the attribute one is what `:host([variant=…])` can select on. The
 * rating scale is separated out because it is a 1-D sweep — crossing 1..5
 * against every other axis would quintuple the render matrix without reaching
 * one new branch.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll, settle } from '../matrix-utils';
import {
  VARIANTS, CHANNELS, QUOTE, AUTHOR,
  mountTestimonial, expectedShape, readShape, expectedAxes, readAxes,
  starGlyphs, glyphKind, starsPart, documentedParts, roleLine,
  type TestimonialCombo, type Channel,
} from './testimonial-support';
import '../../../packages/components/src/testimonial/snice-testimonial';

const base = (over: Partial<TestimonialCombo>): TestimonialCombo => ({
  id: 'edge', variant: 'card', rating: 0, avatar: '', roleShape: 'both',
  channel: 'attr', ...over,
});

describe('testimonial matrix: authoring channel', () => {
  afterEach(() => unmountAll());

  for (const { channel, variant } of product({ channel: CHANNELS, variant: VARIANTS })) {
    const id = `${channel}/${variant}`;
    it(`${id}: the same feature vector renders the same shape either way`, async () => {
      const combo = base({ channel: channel as Channel, variant, rating: 4, avatar: '/a.png' });
      const el = await mountTestimonial(combo);
      expectShape(readShape(el), expectedShape(combo), id);
      expectShape(readAxes(el, combo), expectedAxes(combo), id);
    });
  }
});

describe('testimonial matrix: the 0-5 rating scale', () => {
  afterEach(() => unmountAll());

  for (const { channel, rating } of product({ channel: CHANNELS, rating: [1, 2, 3, 4, 5] })) {
    const id = `${channel}/rating:${rating}`;
    it(`${id}: ${rating} filled of five stars`, async () => {
      const combo = base({ channel: channel as Channel, rating });
      const el = await mountTestimonial(combo);
      // The documented reading of "0-5 star rating": five glyphs, `rating` of
      // them filled. Asserted directly here as well as through the shape oracle
      // so the intent of the axis is unmissable in a failure report.
      expect(starGlyphs(el).map(glyphKind), id).toEqual(
        Array.from({ length: 5 }, (_, i) => (i < rating ? 'filled' : 'outline')),
      );
      expectShape(readShape(el), expectedShape(combo), id);
    });
  }

  it('rating 0 renders no stars part at all', async () => {
    const combo = base({ rating: 0 });
    const el = await mountTestimonial(combo);
    expect(starsPart(el)).toBeNull();
    expectShape(readShape(el), expectedShape(combo), 'rating:0');
  });
});

describe('testimonial matrix: empty content', () => {
  afterEach(() => unmountAll());

  const CASES: Array<{ id: string; quote: string; author: string }> = [
    { id: 'quote+author', quote: QUOTE, author: AUTHOR },
    { id: 'no-quote', quote: '', author: AUTHOR },
    { id: 'no-author', quote: QUOTE, author: '' },
    { id: 'neither', quote: '', author: '' },
  ];

  for (const testCase of CASES) {
    it(`${testCase.id}: the documented parts still exist and read exactly what was given`, async () => {
      const combo = base({
        channel: 'prop', rating: 3, quote: testCase.quote, author: testCase.author,
      });
      const el = await mountTestimonial(combo);
      // `quote` and `author` have documented defaults of '' — an empty string is
      // an ordinary value, not a reason for the card to drop its structure.
      expect(documentedParts(el), testCase.id)
        .toEqual(expect.arrayContaining(['base', 'quote', 'author', 'stars']));
      expectShape(readShape(el), expectedShape(combo), testCase.id);
    });
  }
});

describe('testimonial matrix: live property updates', () => {
  afterEach(() => unmountAll());

  it('raising the rating repaints the star row', async () => {
    const combo = base({ channel: 'prop', rating: 2 });
    const el = await mountTestimonial(combo);
    expect(starGlyphs(el).map(glyphKind))
      .toEqual(['filled', 'filled', 'outline', 'outline', 'outline']);

    (el as any).rating = 5;
    await settle(el, 5);
    expect(starGlyphs(el).map(glyphKind))
      .toEqual(['filled', 'filled', 'filled', 'filled', 'filled']);
    expectShape(readShape(el), expectedShape(base({ channel: 'prop', rating: 5 })), 'rating 2 -> 5');
  });

  it('dropping the rating to 0 removes the stars part', async () => {
    const el = await mountTestimonial(base({ channel: 'prop', rating: 4 }));
    (el as any).rating = 0;
    await settle(el, 5);
    expect(starsPart(el)).toBeNull();
  });

  it('clearing company leaves the role alone, and clearing both removes the line', async () => {
    const el = await mountTestimonial(base({ channel: 'prop', roleShape: 'both' }));
    expect(roleLine(el)).toBe('CTO at Acme Corp');

    (el as any).company = '';
    await settle(el, 5);
    expect(roleLine(el)).toBe('CTO');

    (el as any).role = '';
    await settle(el, 5);
    expect(roleLine(el)).toBeNull();
  });
});
