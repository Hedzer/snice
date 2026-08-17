/**
 * snice-image matrix — the generated cross.
 *
 * variant x fit x src-present (30 combos), with size, lazy, alt, the explicit
 * box, srcset/sizes and the low-res placeholder rotated across them. Every
 * combo is judged by the shared oracle in image-support.ts, which encodes
 * docs/ai/components/image.md and the documented reflection rules — never
 * observed output.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mountImage, expectImage, imageProblems, combo,
  VARIANTS, SIZES, FITS, SRC, PLACEHOLDER,
} from './image-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('image matrix: generated cross', () => {
  for (const c of combos) {
    it(c.id, async () => {
      el = await mountImage(c);
      expectImage(el, c);
    });
  }
});

describe('image matrix: the cross is what it claims to be', () => {
  it('covers every documented variant and fit against both render shapes', () => {
    const seen = new Set(combos.map(c => `${c.variant}/${c.fit}/${!!c.src}`));
    const want = VARIANTS.length * FITS.length * 2;
    expect(combos.length).toBe(want);
    expect(seen.size).toBe(want);
  });

  it('rotates every documented size, loading mode and optional source in', () => {
    for (const size of SIZES) {
      expect(combos.some(c => c.size === size), `size="${size}" is never exercised`).toBe(true);
    }
    expect(combos.some(c => c.lazy), 'lazy loading is never exercised').toBe(true);
    expect(combos.some(c => !c.lazy), 'eager loading is never exercised').toBe(true);
    expect(combos.some(c => c.alt), 'alt is never exercised').toBe(true);
    expect(combos.some(c => !c.alt), 'the decorative empty alt is never exercised').toBe(true);
    expect(combos.some(c => c.srcset), 'srcset is never exercised').toBe(true);
    expect(combos.some(c => c.placeholder), 'the low-res placeholder is never exercised').toBe(true);
    expect(combos.some(c => c.width && c.height), 'the explicit box is never exercised').toBe(true);
  });
});

describe('image matrix: the documented fallback path', () => {
  // "fallback — <snice-image src="image.jpg" fallback="placeholder.jpg">":
  // when the primary source fails, the rendered image is the fallback.
  it('a failed image swaps in the fallback source', async () => {
    const c = combo('fallback', { src: SRC, fallback: '/fixtures/fallback.jpg', broken: true });
    el = await mountImage(c);
    expectImage(el, c);
  });

  it('a failed image with no fallback keeps its own source', async () => {
    const c = combo('no-fallback', { src: SRC, broken: true });
    el = await mountImage(c);
    expectImage(el, c);
  });

  it('the fallback survives every documented shape', async () => {
    for (const variant of VARIANTS) {
      const c = combo(`fallback/${variant}`, {
        src: SRC, fallback: '/fixtures/fallback.jpg', variant, broken: true,
      });
      const subject = await mountImage(c);
      const problems = imageProblems(subject, c);
      removeComponent(subject);
      expect(problems, `combo ${c.id}`).toEqual([]);
    }
  });
});

describe('image matrix: the documented markup channel', () => {
  // docs/ai/properties.md: `<element enabled="false">` -> false. The image docs
  // use exactly that form for eager loading, so the string must survive the
  // converter and reach the img's `loading` attribute.
  it('<snice-image lazy="false"> loads eagerly', async () => {
    el = document.createElement('snice-image');
    el.setAttribute('src', SRC);
    el.setAttribute('lazy', 'false');
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 20));
    expect(el.lazy).toBe(false);
    const img = el.shadowRoot.querySelector('[part~="image"]');
    expect(img?.getAttribute('loading')).toBe('eager');
  });

  it('<snice-image src alt> renders the author\'s alt verbatim', async () => {
    el = document.createElement('snice-image');
    el.setAttribute('src', SRC);
    el.setAttribute('alt', 'Mountains at dusk');
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 20));
    const img = el.shadowRoot.querySelector('[part~="image"]');
    expect(img?.getAttribute('alt')).toBe('Mountains at dusk');
  });
});

describe('image matrix: the oracle is not vacuous', () => {
  it('rejects an image that rendered no img where a src was documented', async () => {
    el = await mountImage(combo('probe', {}));
    const problems = imageProblems(el, combo('probe', { src: SRC }));
    expect(problems.length, 'oracle accepted a placeholder where an img was documented')
      .toBeGreaterThan(0);
  });

  it('rejects an image whose low-res placeholder never rendered', async () => {
    el = await mountImage(combo('probe', { src: SRC }));
    const problems = imageProblems(el, combo('probe', { src: SRC, placeholder: PLACEHOLDER }));
    expect(problems.length, 'oracle accepted a missing documented placeholder')
      .toBeGreaterThan(0);
  });
});
