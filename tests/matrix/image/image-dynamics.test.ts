/**
 * snice-image matrix — property transitions.
 *
 * The generated cross builds each combo once; this file changes a mounted image
 * and asserts the documented contract still holds afterwards. That is where a
 * stale error flag (a new src still showing the previous fallback), a
 * placeholder that never clears, or an attribute left behind by an earlier
 * value would show up.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountImage, imageProblems, combo, wait, SRC, FALLBACK, PLACEHOLDER, VARIANTS, FITS,
} from './image-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const fireError = async (subject: any) => {
  subject.shadowRoot.querySelector('[part~="image"]')?.dispatchEvent(new Event('error'));
  await wait(20);
};

describe('image matrix: source transitions', () => {
  it('gaining a src swaps the placeholder shape for the img shape', async () => {
    el = await mountImage(combo('t', {}));
    el.src = SRC;
    await wait(20);
    expect(imageProblems(el, combo('no-src -> src', { src: SRC }), { fresh: false })).toEqual([]);
  });

  it('losing a src falls back to the documented placeholder shape', async () => {
    el = await mountImage(combo('t', { src: SRC }));
    el.src = '';
    await wait(20);
    expect(imageProblems(el, combo('src -> no-src', {}), { fresh: false })).toEqual([]);
  });

  // The documented `fallback` is a consequence of THIS source failing. A new
  // source has not failed, so it must be given its own chance to load.
  it('a new src is retried rather than inheriting the previous failure', async () => {
    el = await mountImage(combo('t', { src: SRC, fallback: FALLBACK }));
    await fireError(el);
    expect(el.shadowRoot.querySelector('[part~="image"]').getAttribute('src')).toBe(FALLBACK);

    el.src = '/fixtures/other.jpg';
    await wait(20);
    expect(imageProblems(el, combo('retry', {
      src: '/fixtures/other.jpg', fallback: FALLBACK,
    }), { fresh: false })).toEqual([]);
  });
});

describe('image matrix: style dimension transitions', () => {
  for (const variant of VARIANTS) {
    it(`variant -> ${variant} keeps the documented shape`, async () => {
      el = await mountImage(combo('t', { src: SRC }));
      el.variant = variant;
      await wait(20);
      expect(imageProblems(el, combo(`variant->${variant}`, { src: SRC, variant }),
        { fresh: false })).toEqual([]);
    });
  }

  for (const fit of FITS) {
    it(`fit -> ${fit} keeps the documented shape`, async () => {
      el = await mountImage(combo('t', { src: SRC }));
      el.fit = fit;
      await wait(20);
      expect(imageProblems(el, combo(`fit->${fit}`, { src: SRC, fit }),
        { fresh: false })).toEqual([]);
    });
  }

  it('an explicit box set then cleared releases the img', async () => {
    el = await mountImage(combo('t', { src: SRC, width: '300px', height: '200px' }));
    el.width = '';
    el.height = '';
    await wait(20);
    const style = el.shadowRoot.querySelector('[part~="image"]').getAttribute('style') ?? '';
    expect(style.includes('300px') || style.includes('200px'),
      `box cleared but the img still carries "${style}"`).toBe(false);
  });
});

describe('image matrix: the low-res placeholder', () => {
  it('is present alongside the real image while it covers the load', async () => {
    const c = combo('t', { src: SRC, placeholder: PLACEHOLDER });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
    expect(el.shadowRoot.querySelectorAll('[part~="image"]').length).toBe(1);
  });

  it('clearing it leaves the real image alone', async () => {
    el = await mountImage(combo('t', { src: SRC, placeholder: PLACEHOLDER }));
    el.placeholder = '';
    await wait(20);
    expect(imageProblems(el, combo('placeholder cleared', { src: SRC }), { fresh: false }))
      .toEqual([]);
  });
});
