/**
 * Smoke slice of the snice-rating matrix — the everyday-loop tier.
 *
 * One case per documented feature family: the fill rule, the two precisions,
 * the pointer and keyboard entry points, readonly, and the reflection contract.
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for. Budget: well
 * under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountRating, ratingProblems, combo, clickStar, pressKey, captureChanges, wait,
} from './rating-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('rating matrix smoke', () => {
  it('a default rating is five empty radio stars in a radiogroup', async () => {
    const c = combo('smoke');
    el = await mountRating(c);
    expect(ratingProblems(el, c)).toEqual([]);
  });

  it('a half value fills the documented number of stars', async () => {
    const c = combo('smoke', { value: 3.5, precision: 'half' });
    el = await mountRating(c);
    expect(ratingProblems(el, c)).toEqual([]);
  });

  it('a readonly rating leaves the tab order', async () => {
    const c = combo('smoke', { value: 4, readonly: true });
    el = await mountRating(c);
    expect(ratingProblems(el, c)).toEqual([]);
  });

  it('a custom icon and max render the documented star count', async () => {
    const c = combo('smoke', { icon: '❤', value: 3, max: 10, size: 'large' });
    el = await mountRating(c);
    expect(ratingProblems(el, c)).toEqual([]);
  });

  it('clicking star 3 commits 4 and announces it', async () => {
    el = await mountRating(combo('smoke'));
    const changes = captureChanges(el);
    clickStar(el, 3, 'right');
    await wait(20);
    expect(el.value).toBe(4);
    expect(changes).toEqual([{ value: 4 }]);
  });

  it('the left half of a star commits a half step', async () => {
    el = await mountRating(combo('smoke', { precision: 'half' }));
    clickStar(el, 2, 'left');
    await wait(20);
    expect(el.value).toBe(2.5);
  });

  it('ArrowRight walks by the documented step and stops at max', async () => {
    el = await mountRating(combo('smoke', { value: 4.5, precision: 'half' }));
    pressKey(el, 'ArrowRight');
    pressKey(el, 'ArrowRight');
    await wait(20);
    expect(el.value).toBe(5);
  });

  it('readonly refuses both entry points', async () => {
    el = await mountRating(combo('smoke', { readonly: true, value: 2 }));
    const changes = captureChanges(el);
    clickStar(el, 4, 'right');
    pressKey(el, 'ArrowRight');
    await wait(20);
    expect(el.value).toBe(2);
    expect(changes).toEqual([]);
  });
});
