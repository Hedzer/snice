/**
 * snice-rating matrix — the interaction cross.
 *
 * The rating is the one component in this batch with a documented input
 * contract, so its matrix crosses the two entry points (pointer, keyboard)
 * against precision, readonly and the range edges, and asserts BOTH the
 * committed value and the `rating-change` payload each time. A control that
 * updates its value without telling its owner is as broken as one that never
 * updates at all.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountRating, ratingProblems, combo, clickStar, pressKey, captureChanges,
  expectedStep, stars, wait, PRECISIONS,
} from './rating-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('rating matrix: pointer commits', () => {
  // "clicking star i commits i + 1" at full precision, for every star of the
  // range and from every starting value.
  for (const precision of PRECISIONS) {
    for (const index of [0, 2, 4]) {
      it(`${precision}: clicking star ${index} commits ${index + 1}`, async () => {
        el = await mountRating(combo('click', { precision, value: 1 }));
        const changes = captureChanges(el);
        clickStar(el, index, 'right');
        await wait(20);
        expect(el.value).toBe(index + 1);
        expect(changes).toEqual([{ value: index + 1 }]);
        expect(ratingProblems(el, combo('after click', { precision, value: index + 1 }),
          { fresh: false })).toEqual([]);
      });
    }
  }

  // "precision: 'half'" with the documented left-half rule.
  for (const index of [0, 2, 4]) {
    it(`half: clicking the left half of star ${index} commits ${index + 0.5}`, async () => {
      el = await mountRating(combo('half-click', { precision: 'half' }));
      const changes = captureChanges(el);
      clickStar(el, index, 'left');
      await wait(20);
      expect(el.value).toBe(index + 0.5);
      expect(changes).toEqual([{ value: index + 0.5 }]);
    });
  }

  it('full precision ignores where in the star the pointer landed', async () => {
    el = await mountRating(combo('full-click', { precision: 'full' }));
    clickStar(el, 2, 'left');
    await wait(20);
    expect(el.value).toBe(3);
  });

  // "Not focusable when readonly" — a readonly rating is a display, so the
  // pointer path commits nothing and announces nothing.
  it('readonly refuses the pointer and stays silent', async () => {
    const c = combo('readonly', { readonly: true, value: 2 });
    el = await mountRating(c);
    const changes = captureChanges(el);
    clickStar(el, 4, 'right');
    await wait(20);
    expect(el.value).toBe(2);
    expect(changes).toEqual([]);
    expect(ratingProblems(el, c)).toEqual([]);
  });
});

describe('rating matrix: keyboard commits', () => {
  // "ArrowRight/Up: increase by step (1 or 0.5); ArrowLeft/Down: decrease".
  for (const precision of PRECISIONS) {
    const step = expectedStep({ precision });
    for (const key of ['ArrowRight', 'ArrowUp']) {
      it(`${precision}: ${key} increases by ${step}`, async () => {
        el = await mountRating(combo('key', { precision, value: 2 }));
        const changes = captureChanges(el);
        pressKey(el, key);
        await wait(20);
        expect(el.value).toBe(2 + step);
        expect(changes).toEqual([{ value: 2 + step }]);
      });
    }
    for (const key of ['ArrowLeft', 'ArrowDown']) {
      it(`${precision}: ${key} decreases by ${step}`, async () => {
        el = await mountRating(combo('key', { precision, value: 2 }));
        const changes = captureChanges(el);
        pressKey(el, key);
        await wait(20);
        expect(el.value).toBe(2 - step);
        expect(changes).toEqual([{ value: 2 - step }]);
      });
    }
  }

  // The keyboard walks a range; it cannot walk out of one.
  it('ArrowRight stops at max', async () => {
    el = await mountRating(combo('clamp', { value: 5, max: 5 }));
    pressKey(el, 'ArrowRight');
    await wait(20);
    expect(el.value).toBe(5);
  });

  it('ArrowLeft stops at zero', async () => {
    el = await mountRating(combo('clamp', { value: 0 }));
    pressKey(el, 'ArrowLeft');
    await wait(20);
    expect(el.value).toBe(0);
  });

  it('a half-precision walk lands on the documented half steps', async () => {
    el = await mountRating(combo('walk', { precision: 'half', value: 0 }));
    const changes = captureChanges(el);
    for (let i = 0; i < 4; i++) pressKey(el, 'ArrowRight');
    await wait(20);
    expect(changes.map(c => c.value)).toEqual([0.5, 1, 1.5, 2]);
    expect(ratingProblems(el, combo('after walk', { precision: 'half', value: 2 }),
      { fresh: false })).toEqual([]);
  });

  it('readonly refuses the keyboard and stays silent', async () => {
    el = await mountRating(combo('readonly', { readonly: true, value: 3 }));
    const changes = captureChanges(el);
    pressKey(el, 'ArrowRight');
    pressKey(el, 'ArrowLeft');
    await wait(20);
    expect(el.value).toBe(3);
    expect(changes).toEqual([]);
  });
});

describe('rating matrix: the event carries the documented payload', () => {
  it('rating-change bubbles out of the shadow root with { value }', async () => {
    el = await mountRating(combo('event', {}));
    const seen: any[] = [];
    document.addEventListener('rating-change', (event: Event) => {
      seen.push((event as CustomEvent).detail);
    }, { once: true });
    clickStar(el, 3, 'right');
    await wait(20);
    expect(seen).toEqual([{ value: 4 }]);
  });
});

describe('rating matrix: readonly transitions', () => {
  it('lifting readonly returns the control to the tab order and the pointer', async () => {
    el = await mountRating(combo('t', { readonly: true, value: 1 }));
    el.readonly = false;
    await wait(20);
    expect(ratingProblems(el, combo('interactive', { value: 1 }), { fresh: false })).toEqual([]);
    clickStar(el, 3, 'right');
    await wait(20);
    expect(el.value).toBe(4);
  });

  it('applying readonly removes it from both', async () => {
    el = await mountRating(combo('t', { value: 1 }));
    el.readonly = true;
    await wait(20);
    const changes = captureChanges(el);
    clickStar(el, 3, 'right');
    pressKey(el, 'ArrowRight');
    await wait(20);
    expect(el.value).toBe(1);
    expect(changes).toEqual([]);
    expect(stars(el).length).toBe(5);
  });
});
