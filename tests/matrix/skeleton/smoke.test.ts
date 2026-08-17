/**
 * Smoke slice of the snice-skeleton matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include except this file,
 * so the subset below is the standing cost the everyday loop pays for this
 * component: one combo per feature family (variant, animation, repeat count,
 * sizing) plus the marquee finding. Every assertion routes through the matrix's
 * own oracle, so this file cannot drift into something weaker than the suite it
 * stands in for. Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountSkeleton, skeletonProblems, skeletonAriaProblems, combo, wait,
} from './skeleton-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('skeleton matrix smoke', () => {
  it('a default skeleton is one bone inside one base', async () => {
    const c = combo('smoke');
    el = await mountSkeleton(c);
    expect(skeletonProblems(el, c)).toEqual([]);
  });

  it('count="3" renders three placeholders spaced by `spacing`', async () => {
    const c = combo('smoke', { count: 3, spacing: '16px' });
    el = await mountSkeleton(c);
    expect(skeletonProblems(el, c)).toEqual([]);
  });

  it('a circular skeleton takes its documented width and height', async () => {
    const c = combo('smoke', { variant: 'circular', width: '48px', height: '48px' });
    el = await mountSkeleton(c);
    expect(skeletonProblems(el, c)).toEqual([]);
  });

  it('every style-hook property reflects to its attribute', async () => {
    const c = combo('smoke', { variant: 'rounded', animation: 'pulse', width: '100%', height: '200px' });
    el = await mountSkeleton(c);
    expect(skeletonProblems(el, c)).toEqual([]);
  });

  it('count changes re-render the exact number of bones', async () => {
    el = await mountSkeleton(combo('smoke', { count: 4 }));
    el.count = 2;
    await wait(20);
    expect(skeletonProblems(el, combo('smoke', { count: 2 }), { fresh: false })).toEqual([]);
  });

  // MATRIX-skeleton-1: bones carry role="status", one live region per bone,
  // against a documented "decorative only" contract.
  it.fails('MATRIX-skeleton-1: a decorative skeleton exposes no live-region role', async () => {
    el = await mountSkeleton(combo('smoke', { count: 3 }));
    expect(skeletonAriaProblems(el)).toEqual([]);
  });
});
