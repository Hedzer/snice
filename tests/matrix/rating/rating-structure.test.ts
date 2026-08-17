/**
 * snice-rating matrix — the generated cross.
 *
 * precision x readonly x value-shape x size — 48 combos — with `max` and the
 * two icon inputs rotated across them. Every combo is judged by the shared
 * oracle in rating-support.ts, which encodes docs/ai/components/rating.md and
 * the documented reflection rules — never observed output.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mountRating, expectRating, ratingProblems, combo, stars,
  SIZES, PRECISIONS, VALUES,
} from './rating-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('rating matrix: generated cross', () => {
  for (const c of combos) {
    it(c.id, async () => {
      el = await mountRating(c);
      expectRating(el, c);
    });
  }
});

describe('rating matrix: the cross is what it claims to be', () => {
  it('covers every precision, readonly state, value shape and size', () => {
    const seen = new Set(combos.map(c =>
      `${c.precision}/${c.readonly}/${c.value}/${c.size}`));
    const want = PRECISIONS.length * 2 * VALUES.length * SIZES.length;
    expect(combos.length).toBe(want);
    expect(seen.size).toBe(want);
  });

  it('rotates every documented icon form and a non-default max in', () => {
    expect(combos.some(c => c.icon === 'star'), 'the catalogue icon is never used').toBe(true);
    expect(combos.some(c => c.icon === '❤'), 'an emoji icon is never used').toBe(true);
    expect(combos.some(c => c.emptyIcon), 'empty-icon is never used').toBe(true);
    expect(combos.some(c => c.max !== 5), 'max is never overridden').toBe(true);
    expect(combos.some(c => c.max === 10), 'a large max is never used').toBe(true);
  });
});

describe('rating matrix: the documented fill rule', () => {
  // `value` against `max`: star i is filled exactly when value > i. The table
  // below is the contract stated as data, independent of the generator.
  const cases: Array<[number, number, boolean[]]> = [
    [0, 5, [false, false, false, false, false]],
    [1, 5, [true, false, false, false, false]],
    [3, 5, [true, true, true, false, false]],
    [3.5, 5, [true, true, true, true, false]],
    [5, 5, [true, true, true, true, true]],
    [2.5, 3, [true, true, true]],
  ];
  for (const [value, max, expected] of cases) {
    it(`value=${value} of ${max} fills ${expected.filter(Boolean).length} star(s)`, async () => {
      const c = combo(`fill/${value}/${max}`, { value, max, precision: 'half' });
      el = await mountRating(c);
      expectRating(el, c);
      const checked = stars(el).map(s => s.getAttribute('aria-checked') === 'true');
      expect(checked).toEqual(expected);
    });
  }
});

describe('rating matrix: the documented icon fallback', () => {
  // "emptyIcon … empty falls back to icon".
  it('an unset empty-icon draws the same glyph as the filled layer', async () => {
    const c = combo('fallback', { icon: '❤', value: 2, max: 4 });
    el = await mountRating(c);
    expectRating(el, c);
    for (const star of stars(el)) {
      expect((star.textContent ?? '').includes('❤'),
        `a star drew "${star.textContent}" instead of the icon`).toBe(true);
    }
  });

  it('an explicit empty-icon draws on the unfilled stars', async () => {
    const c = combo('empty-icon', { icon: '★', emptyIcon: '·', value: 2, max: 4 });
    el = await mountRating(c);
    expectRating(el, c);
    const text = stars(el).map(s => (s.textContent ?? '').trim());
    expect(text[3].includes('·'), `unfilled star reads "${text[3]}"`).toBe(true);
  });
});

describe('rating matrix: the oracle is not vacuous', () => {
  it('rejects a rating with the wrong number of stars', async () => {
    el = await mountRating(combo('probe', { max: 3 }));
    const problems = ratingProblems(el, combo('probe', { max: 7 }));
    expect(problems.length, 'oracle accepted 3 stars where 7 were documented')
      .toBeGreaterThan(0);
  });

  it('rejects a rating whose stars contradict its value', async () => {
    el = await mountRating(combo('probe', { value: 1 }));
    const problems = ratingProblems(el, combo('probe', { value: 4 }));
    expect(problems.length, 'oracle accepted a fill that disagrees with the value')
      .toBeGreaterThan(0);
  });
});
