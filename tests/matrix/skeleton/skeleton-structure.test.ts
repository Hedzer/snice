/**
 * snice-skeleton matrix — the generated cross.
 *
 * variant x animation x count (24 combos) with the sizing dimensions rotated
 * across them. Every combo is judged by the shared oracle in
 * skeleton-support.ts, which encodes docs/ai/components/skeleton.md and the
 * documented reflection rules — never observed output.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mountSkeleton, expectSkeleton, skeletonProblems,
  skeletonAriaProblems, combo, VARIANTS, ANIMATIONS, COUNTS,
} from './skeleton-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('skeleton matrix: generated cross', () => {
  for (const c of combos) {
    it(c.id, async () => {
      el = await mountSkeleton(c);
      expectSkeleton(el, c);
    });
  }
});

describe('skeleton matrix: the cross is what it claims to be', () => {
  it('covers every documented variant, animation and repeat count', () => {
    const seen = new Set(combos.map(c => `${c.variant}/${c.animation}/${c.count}`));
    const want = VARIANTS.length * ANIMATIONS.length * COUNTS.length;
    expect(combos.length).toBe(want);
    expect(seen.size).toBe(want);
  });

  it('rotates every sizing dimension in', () => {
    expect(combos.some(c => c.width), 'width is never exercised').toBe(true);
    expect(combos.some(c => c.height), 'height is never exercised').toBe(true);
    expect(combos.some(c => c.spacing !== '8px'), 'spacing is never overridden').toBe(true);
    expect(combos.some(c => !c.width && !c.height), 'the intrinsic size is never exercised').toBe(true);
  });
});

describe('skeleton matrix: the documented repeat contract', () => {
  // `count` is the one documented dimension that changes how MANY elements the
  // component renders, so it gets its own explicit table rather than living
  // only inside the rotation.
  for (const count of [1, 2, 3, 5]) {
    it(`count=${count} renders ${count} placeholder element(s)`, async () => {
      const c = combo(`count:${count}`, { count });
      el = await mountSkeleton(c);
      expectSkeleton(el, c);
    });
  }
});

describe('skeleton matrix: the oracle is not vacuous', () => {
  it('rejects a skeleton that renders the wrong number of bones', async () => {
    el = await mountSkeleton(combo('probe', { count: 2 }));
    const problems = skeletonProblems(el, combo('probe', { count: 5 }));
    expect(problems.length, 'oracle accepted 2 bones where 5 were documented')
      .toBeGreaterThan(0);
  });

  it('rejects a skeleton whose width never reached the placeholder', async () => {
    el = await mountSkeleton(combo('probe', {}));
    const problems = skeletonProblems(el, combo('probe', { width: '48px' }));
    expect(problems.length, 'oracle accepted a bone with no documented width')
      .toBeGreaterThan(0);
  });
});

describe('skeleton matrix: accessibility', () => {
  // MATRIX-skeleton-1 — docs/ai/components/skeleton.md Accessibility:
  // "Decorative only; use `aria-busy="true"` on container while loading."
  // The component gives every bone `role="status" aria-label="Loading..."`, so a
  // documented `count="3"` skeleton is three live regions announcing the same
  // wait three times. The assertion below is the documented one and STAYS.
  it.fails('MATRIX-skeleton-1: a decorative skeleton exposes no live-region role', async () => {
    el = await mountSkeleton(combo('a11y', { count: 3 }));
    expect(skeletonAriaProblems(el)).toEqual([]);
  });
});
