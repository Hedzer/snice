/**
 * Shared harness for the snice-avatar feature-combination matrix.
 *
 * Same oracle pattern as tests/matrix/table/matrix-utils.ts: one
 * function derives the whole expectation from the DOCUMENTED contract, one
 * function reads the rendered tree back, and a combo reports EVERY divergence
 * at once so a failure tells its whole story in a single run.
 *
 * Everything asserted here comes from docs/ai/components/avatar.md and
 * docs/ai/properties.md — never from watching the component run:
 *
 *   · STRUCTURE — "CSS Parts: `base` outer container, `image` the `<img>`
 *     element (when loaded), `fallback` initials or default icon container".
 *     So `image` exists exactly when there is a `src`, `fallback` always
 *     exists, and `base` is the single outer container.
 *   · FALLBACK CONTENT — "automatic fallback to name-based initials or default
 *     person icon" plus the `getInitials` method. A named avatar shows its
 *     initials; an unnamed one shows the icon.
 *   · ALT — "alt: Alt text (falls back to `name`)". The rendered img must carry
 *     `alt` when given, `name` when not.
 *   · LOADING — "loading: 'lazy'|'eager' — img loading strategy". It is an
 *     attribute of the `<img>`, not just of the host.
 *   · REFLECTION — properties.md: `@property` reflects setter changes by
 *     default and does NOT reflect untouched defaults. `size` and `shape` are
 *     the entire sizing/shape contract (`:host([size="xl"])`,
 *     `:host([shape="square"])` in snice-avatar.css), so an unreflected
 *     property is a property that does nothing.
 *   · CUSTOM PROPERTIES — "`--avatar-bg` background color (auto-generated from
 *     name)", "`--avatar-color` text/icon color". `fallback-background`
 *     "overrides auto-color", so setting it must pin both custom properties and
 *     suppress the name-derived auto colour.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/avatar/snice-avatar';

export { wait };

export type Size = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl';
export type Shape = 'circle' | 'square' | 'rounded';
export type Loading = 'lazy' | 'eager';

export interface AvatarCombo {
  id: string;
  size: Size;
  shape: Shape;
  loading: Loading;
  src: string;
  alt: string;
  name: string;
  fallbackColor: string;
  fallbackBackground: string;
  /** Whether the test drives the img's `error` event before asserting. */
  broken: boolean;
}

/** The documented defaults, straight out of docs/ai/components/avatar.md. */
export const DEFAULTS = {
  src: '',
  alt: '',
  name: '',
  size: 'medium' as Size,
  shape: 'circle' as Shape,
  loading: 'lazy' as Loading,
  fallbackColor: '#ffffff',
  fallbackBackground: '',
  broken: false,
};

export const SIZES: Size[] = ['xs', 'small', 'medium', 'large', 'xl', 'xxl'];
export const SHAPES: Shape[] = ['circle', 'square', 'rounded'];
/**
 * The three documented fallback inputs: no name (the person icon), a one-word
 * name, and a multi-word name. `getInitials` is a documented METHOD, so its
 * output is part of the contract for each of them.
 */
export const NAMES = ['', 'Cher', 'John Doe'];
export const SRCS = ['', '/fixtures/user.jpg'];

/**
 * The documented initials rule, encoded independently of the component.
 *
 * docs/ai/components/avatar.md documents `getInitials(name)` as "Extract
 * initials from a name string" and the examples show `name="John Doe"` giving a
 * two-letter badge and `name="JD"` a compact one. The oracle therefore expects:
 * nothing for an empty name, the first letter for a single word, and the first
 * letters of the first two words otherwise — uppercased.
 */
export function expectedInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * The cross: size x shape (18) doubled by `src` present/absent — the one branch
 * in the render function — is 36 combos, with `name`, `alt`, `loading`,
 * `fallback-background` and the broken-image path rotated across them so every
 * documented value of each is exercised repeatedly. The avatar is a
 * presentational component with one conditional; 36 is the "mid" band the
 * policy describes, and the 6*3*2*3*2*2*2 = 864 full product would be the
 * table's budget spent on a div and an img.
 */
export function generateCombos(): AvatarCombo[] {
  const combos: AvatarCombo[] = [];
  let n = 0;
  for (const size of SIZES) {
    for (const shape of SHAPES) {
      for (const src of SRCS) {
        const name = NAMES[n % NAMES.length];
        const loading: Loading = n % 2 === 0 ? 'lazy' : 'eager';
        const alt = n % 3 === 1 ? 'Profile portrait' : '';
        const fallbackBackground = n % 5 === 2 ? 'rgb(59, 130, 246)' : '';
        const fallbackColor = n % 7 === 3 ? 'rgb(17, 24, 39)' : DEFAULTS.fallbackColor;
        // Only meaningful when there IS an image to break.
        const broken = !!src && n % 4 === 3;
        combos.push({
          id: `${size}/${shape}/${src ? 'src' : 'no-src'}`
            + `/[name:${name || '∅'},loading:${loading}`
            + `${alt ? ',alt' : ''}${fallbackBackground ? ',fallback-bg' : ''}`
            + `${fallbackColor !== DEFAULTS.fallbackColor ? ',fallback-color' : ''}`
            + `${broken ? ',broken' : ''}]`,
          size, shape, loading, src, alt, name,
          fallbackColor, fallbackBackground, broken,
        });
        n++;
      }
    }
  }
  return combos;
}

/**
 * Build an avatar by assigning PROPERTIES, never attributes.
 *
 * That is the informative channel: an attribute-built element proves nothing
 * about reflection, and every size/shape rule in snice-avatar.css keys off the
 * HOST attribute. Only non-default values are assigned, because the documented
 * rule is that untouched defaults are not reflected.
 */
export async function makeAvatar(combo: Partial<AvatarCombo>): Promise<any> {
  const el = document.createElement('snice-avatar') as any;
  document.body.appendChild(el);
  await el.ready;
  for (const [key, value] of Object.entries(combo)) {
    if (key === 'id' || key === 'broken') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  if (combo.broken) {
    const img = el.shadowRoot?.querySelector('img');
    // The documented behaviour is "Broken image falls back to initials". A
    // real 404 in happy-dom never resolves, so the same `error` event a browser
    // would deliver is dispatched here; the component's own handler does the
    // rest.
    img?.dispatchEvent(new Event('error'));
    await wait(20);
  }
  return el;
}

/** Attribute name for each documented property. */
const ATTRIBUTE_OF: Record<string, string> = {
  src: 'src',
  alt: 'alt',
  name: 'name',
  size: 'size',
  shape: 'shape',
  loading: 'loading',
  fallbackColor: 'fallback-color',
  fallbackBackground: 'fallback-background',
};

export interface OracleOptions {
  /**
   * `true` (default) for a freshly built element: a property left at its
   * documented default must not have written its attribute. `false` once a
   * property has been assigned during the element's life, where an attribute
   * carrying the CURRENT value is correct either way.
   */
  fresh?: boolean;
}

/** Every divergence from the documented contract, collected at once. */
export function avatarProblems(
  el: any,
  combo: AvatarCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) return ['no shadow root'];

  const classesOf = (node: Element) =>
    (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

  const partsNamed = (name: string) =>
    [...sr.querySelectorAll('[part]')].filter(node =>
      (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

  // ── part="base": the documented outer container ──────────────────────────
  const bases = partsNamed('base');
  if (bases.length !== 1) {
    say(`${bases.length} elements carry part="base", expected exactly 1`);
    return problems;
  }
  const base = bases[0];

  // ── part="image": documented as existing when there is an image ──────────
  const images = partsNamed('image');
  if (combo.src) {
    if (images.length !== 1) {
      say(`src set but ${images.length} elements carry part="image", expected 1`);
    } else {
      const img = images[0] as HTMLImageElement;
      if (img.tagName !== 'IMG') {
        say(`part="image" is <${img.tagName.toLowerCase()}>, documented as the <img> element`);
      }
      if (img.getAttribute('src') !== combo.src) {
        say(`img src is "${img.getAttribute('src')}", expected "${combo.src}"`);
      }
      // "alt — Alt text (falls back to `name`)"
      const wantAlt = combo.alt || combo.name;
      if ((img.getAttribute('alt') ?? '') !== wantAlt) {
        say(`img alt is "${img.getAttribute('alt')}", expected "${wantAlt}"`
          + ' (alt falls back to name)');
      }
      // "loading — img loading strategy"
      if (img.getAttribute('loading') !== combo.loading) {
        say(`img loading is "${img.getAttribute('loading')}", expected "${combo.loading}"`);
      }
      if (!base.contains(img)) say('part="image" is not inside part="base"');
    }
  } else if (images.length !== 0) {
    say(`no src, yet ${images.length} elements carry part="image"`);
  }

  // ── part="fallback": initials or the default person icon ─────────────────
  const fallbacks = partsNamed('fallback');
  if (fallbacks.length !== 1) {
    say(`${fallbacks.length} elements carry part="fallback", expected exactly 1`);
  } else {
    const fallback = fallbacks[0];
    if (!base.contains(fallback)) say('part="fallback" is not inside part="base"');

    // "User profile image with AUTOMATIC FALLBACK to name-based initials or
    // default person icon", and the documented example "Broken image falls
    // back to initials". The fallback layer is stacked over the image and
    // hidden until it is needed, so which layer is SHOWN is the whole feature:
    // it must be the fallback when there is no image or the image failed, and
    // the image otherwise.
    const shouldShowFallback = !combo.src || combo.broken;
    const fallbackShown = classesOf(fallback).includes('avatar-fallback--visible');
    if (shouldShowFallback && !fallbackShown) {
      say(combo.broken
        ? 'the image errored but the fallback layer is still hidden — a broken'
          + ' image must fall back to the initials/icon'
        : 'no src, yet the fallback layer is hidden — nothing is shown at all');
    }
    if (!shouldShowFallback && fallbackShown) {
      say('a loaded image is showing, yet the fallback layer is visible over it');
    }
    if (combo.src && images.length === 1) {
      const hidden = classesOf(images[0]).includes('avatar-image--error');
      if (combo.broken && !hidden) say('the errored image is still displayed over the fallback');
      if (!combo.broken && hidden) say('a healthy image is hidden as if it had errored');
    }
    const initials = expectedInitials(combo.name);
    const shown = (fallback.textContent ?? '').replace(/\s+/g, ' ').trim();
    const icon = fallback.querySelector('svg');
    if (initials) {
      if (shown !== initials) {
        say(`fallback reads "${shown}", expected initials "${initials}" for name`
          + ` "${combo.name}"`);
      }
      if (icon) say('a named avatar renders the default person icon as well as its initials');
    } else {
      if (shown !== '') say(`unnamed avatar's fallback reads "${shown}", expected the icon only`);
      if (!icon) say('unnamed avatar renders no default person icon');
    }
  }

  // ── The documented method ────────────────────────────────────────────────
  if (typeof el.getInitials !== 'function') {
    say('documented method getInitials() is missing');
  } else if (el.getInitials(combo.name) !== expectedInitials(combo.name)) {
    say(`getInitials("${combo.name}") returned "${el.getInitials(combo.name)}",`
      + ` expected "${expectedInitials(combo.name)}"`);
  }

  // ── Reflection: the size/shape styling contract ──────────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const value = (combo as any)[key];
    const isDefault = (DEFAULTS as any)[key] === value;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh) {
        say(`${key} left at its default but [${attribute}]`
          + `="${el.getAttribute(attribute)}" was written anyway`);
      }
      if (present && !fresh && el.getAttribute(attribute) !== String(value)) {
        say(`[${attribute}] still reads "${el.getAttribute(attribute)}" after`
          + ` ${key} returned to its default ${JSON.stringify(value)}`);
      }
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(value)} assigned as a property but [${attribute}]`
        + ' never reflected — the stylesheet keys off that attribute');
      continue;
    }
    if (el.getAttribute(attribute) !== String(value)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}",`
        + ` expected "${String(value)}"`);
    }
  }

  // ── Documented custom properties ─────────────────────────────────────────
  const inline = (name: string) => base.style.getPropertyValue(name).trim();
  if (combo.fallbackBackground) {
    // "fallback-background — overrides auto-color"
    if (inline('--avatar-bg') !== combo.fallbackBackground) {
      say(`fallback-background="${combo.fallbackBackground}" but --avatar-bg is`
        + ` "${inline('--avatar-bg')}"`);
    }
    if (inline('--avatar-color') !== combo.fallbackColor) {
      say(`fallback-color="${combo.fallbackColor}" but --avatar-color is`
        + ` "${inline('--avatar-color')}"`);
    }
    const auto = classesOf(base).filter(c => c.startsWith('avatar--'));
    if (auto.length) {
      say(`fallback-background is meant to OVERRIDE the auto colour, but the`
        + ` name-derived class ${auto.join(' ')} is still applied`);
    }
  } else if (inline('--avatar-bg') !== '') {
    say(`no fallback-background set but --avatar-bg is pinned to "${inline('--avatar-bg')}"`);
  }

  // ── The auto-generated colour is a documented feature and must be stable ──
  if (combo.name && !combo.fallbackBackground) {
    const auto = classesOf(base).filter(c => c.startsWith('avatar--'));
    if (auto.length !== 1) {
      say(`name="${combo.name}" produced ${auto.length} auto-colour classes,`
        + ' expected exactly 1 (--avatar-bg is "auto-generated from name")');
    }
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectAvatar(el: any, combo: AvatarCombo): void {
  expect(avatarProblems(el, combo), `combo ${combo.id}`).toEqual([]);
}
