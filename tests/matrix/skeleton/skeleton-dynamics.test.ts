/**
 * snice-skeleton matrix — property transitions.
 *
 * The generated cross builds each combo once. This file changes a mounted
 * skeleton and asserts the documented contract still holds AFTERWARDS, which is
 * where a re-render that keeps stale bones, a gap that never updates, or an
 * attribute left behind by an earlier value would show up.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountSkeleton, skeletonProblems, combo, wait, VARIANTS, ANIMATIONS,
} from './skeleton-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('skeleton matrix: count transitions', () => {
  const transitions: Array<[number, number]> = [[1, 3], [3, 1], [1, 5], [5, 2], [2, 1]];
  for (const [from, to] of transitions) {
    it(`count ${from} -> ${to} re-renders exactly ${to} bones`, async () => {
      el = await mountSkeleton(combo('t', { count: from }));
      el.count = to;
      await wait(20);
      expect(skeletonProblems(el, combo(`count ${from}->${to}`, { count: to }), { fresh: false }))
        .toEqual([]);
    });
  }
});

describe('skeleton matrix: variant and animation transitions', () => {
  for (const variant of VARIANTS) {
    it(`variant -> ${variant} keeps the documented shape`, async () => {
      el = await mountSkeleton(combo('t', { variant: 'text', count: 2 }));
      el.variant = variant;
      await wait(20);
      expect(skeletonProblems(el, combo(`variant->${variant}`, { variant, count: 2 }),
        { fresh: false })).toEqual([]);
    });
  }

  for (const animation of ANIMATIONS) {
    it(`animation -> ${animation} keeps the documented shape`, async () => {
      el = await mountSkeleton(combo('t', { count: 2 }));
      el.animation = animation;
      await wait(20);
      expect(skeletonProblems(el, combo(`animation->${animation}`, { animation, count: 2 }),
        { fresh: false })).toEqual([]);
    });
  }
});

describe('skeleton matrix: sizing transitions', () => {
  it('a width set then cleared releases the placeholder box', async () => {
    el = await mountSkeleton(combo('t', { variant: 'circular', width: '48px', height: '48px' }));
    el.width = '';
    el.height = '';
    await wait(20);
    const bone = el.shadowRoot.querySelector('[part~="bone"]') as HTMLElement;
    const style = bone.getAttribute('style') ?? '';
    expect(style.includes('48px'),
      `width/height cleared but the bone still carries "${style}"`).toBe(false);
  });

  it('spacing follows the property after the first render', async () => {
    el = await mountSkeleton(combo('t', { count: 3 }));
    el.spacing = '24px';
    await wait(20);
    expect(skeletonProblems(el, combo('spacing->24px', { count: 3, spacing: '24px' }),
      { fresh: false })).toEqual([]);
  });
});

describe('skeleton matrix: the attribute channel', () => {
  // The documented markup form. `count` is `type: Number`, so the string "3"
  // arriving from an attribute must land as the number 3 and drive the loop.
  it('<snice-skeleton variant="text" count="3"> renders three text bones', async () => {
    el = document.createElement('snice-skeleton');
    el.setAttribute('variant', 'text');
    el.setAttribute('count', '3');
    document.body.appendChild(el);
    await el.ready;
    await wait(20);
    expect(el.count).toBe(3);
    expect(el.shadowRoot.querySelectorAll('[part~="bone"]').length).toBe(3);
  });

  it('<snice-skeleton animation="pulse"> arrives as the pulse animation', async () => {
    el = document.createElement('snice-skeleton');
    el.setAttribute('animation', 'pulse');
    document.body.appendChild(el);
    await el.ready;
    await wait(20);
    expect(el.animation).toBe('pulse');
  });
});
