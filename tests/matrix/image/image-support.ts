/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-image feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is quoted from docs/ai/components/image.md and
 * packages/components/src/image/snice-image.types.ts, never from observed
 * output:
 *
 *   · PARTS — "container: Image container div", "image: The img element",
 *     "placeholder: Placeholder element (shown when loading or no src)". So the
 *     two documented render shapes are:
 *       – no `src`  → a container holding a placeholder, and NO img part;
 *       – with `src` → a container holding the img part, plus the placeholder
 *         part while a low-res `placeholder` is still covering the load.
 *   · SOURCES — `src`, `srcset`, `sizes` and `alt` are documented img
 *     attributes and must reach the rendered img, unchanged.
 *   · LAZY — `lazy: boolean = true`; the usage block documents
 *     `<snice-image lazy="false">` as "Eager loading", so the img's `loading`
 *     attribute is `lazy` when the property is true and `eager` when false.
 *   · FALLBACK — `fallback: string` is documented as the source used when the
 *     primary one fails, so after the img errors the rendered src is the
 *     fallback.
 *   · DIMENSIONS — `width` / `height` are documented as explicit box overrides
 *     (`<snice-image src=… width="300px" height="200px">`), so they land on the
 *     rendered image itself.
 *   · REFLECTION — docs/ai/properties.md: `@property` reflects setter changes,
 *     initial defaults are NOT reflected. `variant`, `size` and `fit` are the
 *     documented style dimensions and reflect as attributes.
 *
 * The oracle returns EVERY divergence of a combo at once.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/image/snice-image';
import type {
  ImageVariant, ImageSize, ImageFit,
} from '../../../packages/components/src/image/snice-image.types';

export { wait, createComponent };

export interface ImageCombo {
  id: string;
  src: string;
  alt: string;
  fallback: string;
  placeholder: string;
  srcset: string;
  sizes: string;
  variant: ImageVariant;
  size: ImageSize;
  lazy: boolean;
  fit: ImageFit;
  width: string;
  height: string;
  /** Fire the img's `error` event after mounting — the documented fallback path. */
  broken: boolean;
}

/** The documented defaults, straight out of the Properties block. */
export const DEFAULTS: Omit<ImageCombo, 'id'> = {
  src: '',
  alt: '',
  fallback: '',
  placeholder: '',
  srcset: '',
  sizes: '',
  variant: 'rounded',
  size: 'medium',
  lazy: true,
  fit: 'cover',
  width: '',
  height: '',
  broken: false,
};

export const VARIANTS: ImageVariant[] = ['rounded', 'square', 'circle'];
export const SIZES: ImageSize[] = ['small', 'medium', 'large'];
export const FITS: ImageFit[] = ['cover', 'contain', 'fill', 'none', 'scale-down'];

export const SRC = '/fixtures/photo.jpg';
export const FALLBACK = '/fixtures/fallback.jpg';
export const PLACEHOLDER = '/fixtures/tiny.jpg';

export function combo(id: string, over: Partial<ImageCombo> = {}): ImageCombo {
  return { ...DEFAULTS, id, ...over };
}

/**
 * The cross: variant x fit x src-present — 30 combos, the dimensions that
 * change either the render shape or the paint rule — with `size`, `lazy`,
 * `alt`, `srcset`/`sizes`, the explicit box and the low-res placeholder rotated
 * across them so every documented value of each is exercised several times.
 * `.ai/fuzzing.md` sizes the matrix to the component: the image has one branch
 * (src / no src) and one conditional (placeholder), so the full product of all
 * twelve properties would be the table's budget spent on a wrapper round `<img>`.
 */
export function generateCombos(): ImageCombo[] {
  const combos: ImageCombo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const fit of FITS) {
      for (const hasSrc of [false, true]) {
        const size = SIZES[n % SIZES.length];
        const lazy = n % 3 !== 1;
        const alt = n % 2 === 0 ? 'A descriptive alt' : '';
        const width = n % 4 === 0 ? '300px' : '';
        const height = n % 4 === 0 ? '200px' : '';
        const srcset = hasSrc && n % 5 === 0 ? `${SRC} 1x, ${SRC} 2x` : '';
        const sizes = srcset ? '(max-width: 600px) 100vw, 50vw' : '';
        // The inner axis is `hasSrc`, so odd `n` is the sourced half — the only
        // half where a low-res placeholder means anything.
        const placeholder = hasSrc && n % 6 === 3 ? PLACEHOLDER : '';
        combos.push({
          id: `${variant}/${fit}/${hasSrc ? 'src' : 'no-src'}/size:${size}`
            + `/[${lazy ? 'lazy' : 'eager'}${alt ? ',alt' : ''}${width ? ',boxed' : ''}`
            + `${srcset ? ',srcset' : ''}${placeholder ? ',placeholder' : ''}]`,
          ...DEFAULTS,
          src: hasSrc ? SRC : '',
          alt, variant, size, fit, lazy, width, height, srcset, sizes, placeholder,
        });
        n++;
      }
    }
  }
  return combos;
}

/** Attribute name for each documented property. */
const ATTRIBUTE_OF: Record<string, string> = {
  src: 'src',
  alt: 'alt',
  fallback: 'fallback',
  placeholder: 'placeholder',
  srcset: 'srcset',
  sizes: 'sizes',
  variant: 'variant',
  size: 'size',
  fit: 'fit',
  width: 'width',
  height: 'height',
};

/**
 * Mount through the PROPERTY channel with only NON-DEFAULT values assigned —
 * the channel that can actually detect broken reflection, and the one the
 * documented "defaults are not reflected" rule is written against.
 *
 * `broken: true` then fires the img's `error` event, which is how the
 * documented fallback path is reachable in a DOM with no network.
 */
export async function mountImage(c: Partial<ImageCombo>): Promise<any> {
  const el = await createComponent<any>('snice-image', {});
  for (const [key, value] of Object.entries(c)) {
    if (key === 'id' || key === 'broken') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  if (c.broken) {
    const img = el.shadowRoot?.querySelector('[part~="image"]') as HTMLImageElement | null;
    img?.dispatchEvent(new Event('error'));
    await wait(20);
  }
  return el;
}

const partsNamed = (sr: ShadowRoot, name: string): HTMLElement[] =>
  [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

export interface OracleOptions { fresh?: boolean }

/** Documented rendered source: the fallback once the primary one has failed. */
export function expectedSrc(c: ImageCombo): string {
  return c.broken && c.fallback ? c.fallback : c.src;
}

/** Documented loading mode: `lazy` unless the author asked for eager. */
export function expectedLoading(c: ImageCombo): string {
  return c.lazy ? 'lazy' : 'eager';
}

/** Every documented consequence of `c`, read back off the rendered tree. */
export function imageProblems(
  el: any,
  c: ImageCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('image rendered no shadow root'); return problems; }

  // ── The container is always there ─────────────────────────────────────────
  const containers = partsNamed(sr, 'container');
  if (containers.length !== 1) {
    say(`${containers.length} elements carry part="container", expected exactly 1`);
    return problems;
  }
  const container = containers[0];
  const images = partsNamed(sr, 'image');
  const placeholders = partsNamed(sr, 'placeholder');

  if (!c.src) {
    // "placeholder — Placeholder element (shown when loading or no src)", and
    // the usage block's `<snice-image size="medium" variant="circle">` with no
    // src is documented as the placeholder form.
    if (images.length !== 0) {
      say(`a source-less image rendered ${images.length} part="image" element(s)`);
    }
    if (placeholders.length !== 1) {
      say(`a source-less image rendered ${placeholders.length} part="placeholder"`
        + ' element(s), expected exactly 1');
    }
  } else {
    if (images.length !== 1) {
      say(`src="${c.src}" rendered ${images.length} part="image" elements, expected 1`);
    } else {
      const img = images[0] as HTMLImageElement;
      if (img.tagName !== 'IMG') say(`part="image" is a <${img.tagName.toLowerCase()}>, not an <img>`);
      if (!container.contains(img)) say('part="image" is not inside part="container"');

      const wantSrc = expectedSrc(c);
      if (img.getAttribute('src') !== wantSrc) {
        say(`img src is "${img.getAttribute('src')}", expected "${wantSrc}"`);
      }
      // `alt: string = ''` — whatever the author wrote, verbatim, with no
      // invented filler text for the empty (decorative) case.
      if ((img.getAttribute('alt') ?? '') !== c.alt) {
        say(`img alt is "${img.getAttribute('alt')}", expected "${c.alt}"`);
      }
      const wantLoading = expectedLoading(c);
      if (img.getAttribute('loading') !== wantLoading) {
        say(`lazy=${c.lazy} rendered loading="${img.getAttribute('loading')}",`
          + ` expected "${wantLoading}"`);
      }
      if (c.srcset && img.getAttribute('srcset') !== c.srcset) {
        say(`srcset="${c.srcset}" never reached the img (got "${img.getAttribute('srcset')}")`);
      }
      if (c.sizes && img.getAttribute('sizes') !== c.sizes) {
        say(`sizes="${c.sizes}" never reached the img (got "${img.getAttribute('sizes')}")`);
      }
      // The explicit box overrides, documented as `width="300px" height="200px"`.
      const style = img.getAttribute('style') ?? '';
      if (c.width && !style.includes(`width: ${c.width}`)) {
        say(`width="${c.width}" never reached the img box (style="${style}")`);
      }
      if (c.height && !style.includes(`height: ${c.height}`)) {
        say(`height="${c.height}" never reached the img box (style="${style}")`);
      }
    }

    // The low-res placeholder is documented as "shown while loading", so it is
    // present exactly while a `placeholder` source is set and the real image has
    // not finished loading — and absent when the author supplied none.
    const wantPlaceholder = c.placeholder ? 1 : 0;
    if (placeholders.length !== wantPlaceholder) {
      say(`placeholder=${JSON.stringify(c.placeholder)} rendered ${placeholders.length}`
        + ` part="placeholder" element(s), expected ${wantPlaceholder}`);
    } else if (c.placeholder) {
      const low = placeholders[0] as HTMLImageElement;
      if (low.getAttribute('src') !== c.placeholder) {
        say(`the low-res placeholder points at "${low.getAttribute('src')}",`
          + ` expected "${c.placeholder}"`);
      }
      // A decorative duplicate of the real image: it must not be announced.
      if (low.getAttribute('aria-hidden') !== 'true') {
        say('the low-res placeholder is not aria-hidden, so it is announced twice');
      }
    }
  }

  // ── Reflection of the documented style dimensions ─────────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const value = (c as any)[key];
    const isDefault = (DEFAULTS as any)[key] === value;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh) {
        say(`${key} left at its default but [${attribute}]="${el.getAttribute(attribute)}"`
          + ' was written anyway');
      }
      if (present && !fresh && el.getAttribute(attribute) !== String(value)) {
        say(`[${attribute}] still reads "${el.getAttribute(attribute)}" after ${key}`
          + ` returned to its default ${JSON.stringify(value)}`);
      }
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(value)} assigned as a property but [${attribute}]`
        + ' never reflected');
      continue;
    }
    if (el.getAttribute(attribute) !== String(value)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}", expected "${String(value)}"`);
    }
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectImage(el: any, c: ImageCombo, options?: OracleOptions): void {
  expect(imageProblems(el, c, options), `combo ${c.id}`).toEqual([]);
}
