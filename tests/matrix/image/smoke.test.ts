/**
 * Smoke slice of the snice-image matrix — the everyday-loop tier.
 *
 * One combo per documented feature family: the two render shapes, the loading
 * mode, the fallback path, the low-res placeholder and the reflection contract.
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for. Budget: well
 * under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountImage, imageProblems, combo, wait, SRC, FALLBACK, PLACEHOLDER,
} from './image-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('image matrix smoke', () => {
  it('a source-less image renders the placeholder shape', async () => {
    const c = combo('smoke', { variant: 'circle', size: 'medium' });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('a sourced image renders one img carrying src, alt and loading', async () => {
    const c = combo('smoke', { src: SRC, alt: 'Mountains at dusk' });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('lazy=false renders loading="eager"', async () => {
    const c = combo('smoke', { src: SRC, lazy: false });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('a failed image swaps in its documented fallback', async () => {
    const c = combo('smoke', { src: SRC, fallback: FALLBACK, broken: true });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('a low-res placeholder covers the load without hiding the img', async () => {
    const c = combo('smoke', { src: SRC, placeholder: PLACEHOLDER });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('every style dimension reflects to the attribute its CSS keys off', async () => {
    const c = combo('smoke', {
      src: SRC, variant: 'square', size: 'large', fit: 'contain',
      width: '300px', height: '200px',
    });
    el = await mountImage(c);
    expect(imageProblems(el, c)).toEqual([]);
  });

  it('a new src is retried rather than inheriting the previous failure', async () => {
    el = await mountImage(combo('smoke', { src: SRC, fallback: FALLBACK, broken: true }));
    el.src = '/fixtures/other.jpg';
    await wait(20);
    expect(imageProblems(el, combo('smoke', { src: '/fixtures/other.jpg', fallback: FALLBACK }),
      { fresh: false })).toEqual([]);
  });
});
