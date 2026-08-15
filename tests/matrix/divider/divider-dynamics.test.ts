/**
 * snice-divider matrix — the transitions between combos.
 *
 * The generated cross builds each combo once. This file crosses the same
 * dimensions in TIME: every documented property is a live `@property`, so
 * changing one after first paint must move the component to exactly the state a
 * fresh build with that value would have produced. That is the one thing a
 * one-shot matrix cannot see, and it is where a `@watch` that only fires in one
 * direction hides.
 */
import { describe, it, afterEach } from 'vitest';
import { expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeDivider, dividerProblems, wait,
  type DividerCombo,
} from './divider-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const base = (over: Partial<DividerCombo> = {}): DividerCombo => ({
  id: 'transition', ...DEFAULTS, ...over,
} as DividerCombo);

/** Assign a property on a live element and let the render settle. */
async function set(element: any, key: string, value: any) {
  element[key] = value;
  await wait(20);
}

describe('divider matrix: property transitions', () => {
  it('adding text turns the bare line into a labelled divider', async () => {
    const combo = base({ text: 'OR' });
    el = await makeDivider(base());
    await set(el, 'text', 'OR');
    expect(dividerProblems(el, combo, { fresh: false }), 'text added after first paint').toEqual([]);
  });

  it('clearing text turns the labelled divider back into a bare line', async () => {
    const combo = base();
    el = await makeDivider(base({ text: 'OR' }));
    await set(el, 'text', '');
    expect(dividerProblems(el, combo, { fresh: false }), 'text cleared after first paint').toEqual([]);
  });

  it('switching orientation moves aria-orientation with it', async () => {
    const combo = base({ orientation: 'vertical' });
    el = await makeDivider(base());
    await set(el, 'orientation', 'vertical');
    expect(dividerProblems(el, combo, { fresh: false }), 'orientation flipped after first paint').toEqual([]);
  });

  it('switching variant reflects the new value and drops the old one', async () => {
    const combo = base({ variant: 'dotted' });
    el = await makeDivider(base({ variant: 'dashed' }));
    await set(el, 'variant', 'dotted');
    expect(dividerProblems(el, combo, { fresh: false }), 'variant changed after first paint').toEqual([]);
  });

  it('toggling capped on and back off leaves no stale attribute', async () => {
    el = await makeDivider(base());
    await set(el, 'capped', true);
    expect(dividerProblems(el, base({ capped: true }), { fresh: false }), 'capped on').toEqual([]);
    await set(el, 'capped', false);
    expect(dividerProblems(el, base({ capped: false }), { fresh: false }), 'capped off').toEqual([]);
  });

  it('setting a color pins --divider-color to it', async () => {
    const combo = base({ color: 'rgb(59, 130, 246)' });
    el = await makeDivider(base());
    await set(el, 'color', 'rgb(59, 130, 246)');
    expect(dividerProblems(el, combo, { fresh: false }), 'color assigned after first paint').toEqual([]);
  });

  // MATRIX-divider-2: clearing `color` back to its documented default ('') must
  // return the line to `--snice-color-border`. `updateColor()` only writes the
  // custom property when `this.color` is truthy and never removes it, so the
  // element keeps painting the old colour forever. Documented default per
  // docs/ai/components/divider.md: `color: string = ''`, with `--divider-color`
  // defaulting to `var(--snice-color-border)`.
  it.fails('MATRIX-divider-2: clearing color releases --divider-color', async () => {
    const combo = base();
    el = await makeDivider(base({ color: 'rgb(59, 130, 246)' }));
    await set(el, 'color', '');
    expect(dividerProblems(el, combo, { fresh: false }), 'color cleared back to its default').toEqual([]);
  });

  it('setting text-background pins --divider-text-bg to it', async () => {
    const combo = base({ text: 'OR', textBackground: 'rgb(255, 255, 255)' });
    el = await makeDivider(base({ text: 'OR' }));
    await set(el, 'textBackground', 'rgb(255, 255, 255)');
    expect(dividerProblems(el, combo, { fresh: false }), 'text-background assigned after first paint').toEqual([]);
  });
});
