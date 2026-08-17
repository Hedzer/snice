/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-rating feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is quoted from docs/ai/components/rating.md and
 * packages/components/src/rating/snice-rating.types.ts, never from observed
 * output:
 *
 *   · PARTS — "base: Outer rating container", "star: Individual star/icon
 *     element", and `max: number = 5` is the number of stars.
 *   · ARIA — "role=`radiogroup` with role=`radio` per star"; "Not focusable
 *     when readonly", so the group is `tabindex="0"` unless readonly, where it
 *     is out of the tab order.
 *   · VALUE — `value: number = 0` against `max`: star *i* (0-based) carries a
 *     filled state exactly when `value > i`, which is what a radio's checked
 *     state reports.
 *   · ICONS — `icon: string = 'star'` (catalogue name, emoji, URL, or image
 *     file) and `emptyIcon` where "empty falls back to icon".
 *   · INTERACTION — clicking star *i* commits `i + 1` at full precision and
 *     `i + 0.5` for the left half at half precision; ArrowRight/Up increase by
 *     the step (1 or 0.5) and ArrowLeft/Down decrease by it; `readonly` takes
 *     the component out of both paths.
 *   · EVENT — `rating-change` → `{ value: number }`.
 *   · REFLECTION — docs/ai/properties.md: setter changes reflect, defaults do
 *     not. `emptyIcon` is documented as the `empty-icon` attribute.
 *
 * The oracle reports EVERY divergence of a combo at once.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/rating/snice-rating';
import type {
  RatingPrecision, RatingSize,
} from '../../../packages/components/src/rating/snice-rating.types';

export { wait, createComponent };

export interface RatingCombo {
  id: string;
  value: number;
  max: number;
  icon: string;
  emptyIcon: string;
  size: RatingSize;
  readonly: boolean;
  precision: RatingPrecision;
}

/** The documented defaults, straight out of the Properties block. */
export const DEFAULTS: Omit<RatingCombo, 'id'> = {
  value: 0,
  max: 5,
  icon: 'star',
  emptyIcon: '',
  size: 'medium',
  readonly: false,
  precision: 'full',
};

export const SIZES: RatingSize[] = ['small', 'medium', 'large'];
export const PRECISIONS: RatingPrecision[] = ['full', 'half'];
/** 0 (empty), a whole star, a half star, and a value at the top of the range. */
export const VALUES = [0, 3, 3.5, 5];

export function combo(id: string, over: Partial<RatingCombo> = {}): RatingCombo {
  return { ...DEFAULTS, id, ...over };
}

/**
 * The cross: precision x readonly x value-shape x size — 48 combos, every
 * dimension that changes the rendered fill, the interaction contract or the
 * tab order — with `max` and the two icon inputs rotated across them. That is
 * the mid-range size `.ai/fuzzing.md` asks for: the rating is a small
 * interactive control, not a data component.
 */
export function generateCombos(): RatingCombo[] {
  const ICONS = ['star', '❤', 'heart'];
  const EMPTY_ICONS = ['', '·', ''];
  const MAXES = [5, 3, 10];
  const combos: RatingCombo[] = [];
  let n = 0;
  for (const precision of PRECISIONS) {
    for (const readonly of [false, true]) {
      for (const value of VALUES) {
        for (const size of SIZES) {
          const max = MAXES[n % MAXES.length];
          const icon = ICONS[n % ICONS.length];
          const emptyIcon = EMPTY_ICONS[n % EMPTY_ICONS.length];
          combos.push({
            id: `${precision}/${readonly ? 'readonly' : 'interactive'}/value:${value}/${size}`
              + `/[max:${max},icon:${icon}${emptyIcon ? `,empty:${emptyIcon}` : ''}]`,
            value, max, icon, emptyIcon, size, readonly, precision,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

/** Attribute name for each documented property. */
const ATTRIBUTE_OF: Record<string, string> = {
  value: 'value',
  max: 'max',
  icon: 'icon',
  emptyIcon: 'empty-icon',
  size: 'size',
  readonly: 'readonly',
  precision: 'precision',
};

/**
 * Mount through the PROPERTY channel with only NON-DEFAULT values assigned —
 * the channel that can detect broken reflection, against the documented rule
 * that untouched defaults are not reflected.
 */
export async function mountRating(c: Partial<RatingCombo>): Promise<any> {
  const el = await createComponent<any>('snice-rating', {});
  for (const [key, value] of Object.entries(c)) {
    if (key === 'id') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  return el;
}

export const stars = (el: any): HTMLElement[] =>
  [...(el.shadowRoot as ShadowRoot).querySelectorAll('[part]')]
    .filter(node => (node.getAttribute('part') ?? '').split(/\s+/).includes('star')) as HTMLElement[];

export const base = (el: any): HTMLElement | null =>
  [...(el.shadowRoot as ShadowRoot).querySelectorAll('[part]')]
    .find(node => (node.getAttribute('part') ?? '').split(/\s+/).includes('base')) as HTMLElement ?? null;

export interface OracleOptions { fresh?: boolean }

/** Documented: star `i` is filled exactly when the value has reached past it. */
export function expectedChecked(c: Pick<RatingCombo, 'value'>, index: number): boolean {
  return c.value > index;
}

/** Documented keyboard step: 1 at full precision, 0.5 at half. */
export function expectedStep(c: Pick<RatingCombo, 'precision'>): number {
  return c.precision === 'half' ? 0.5 : 1;
}

/** Every documented consequence of `c`, read back off the rendered tree. */
export function ratingProblems(
  el: any,
  c: RatingCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('rating rendered no shadow root'); return problems; }

  // ── The group ─────────────────────────────────────────────────────────────
  const group = base(el);
  if (!group) { say('no element carries part="base"'); return problems; }
  if (group.getAttribute('role') !== 'radiogroup') {
    say(`part="base" role is "${group.getAttribute('role')}", expected "radiogroup"`);
  }
  if (!(group.getAttribute('aria-label') || group.getAttribute('aria-labelledby'))) {
    say('the radiogroup has no accessible name');
  }
  // "Not focusable when readonly."
  const tabindex = group.getAttribute('tabindex');
  const wantTabindex = c.readonly ? '-1' : '0';
  if (tabindex !== wantTabindex) {
    say(`readonly=${c.readonly} left tabindex="${tabindex}", expected "${wantTabindex}"`);
  }

  // ── The stars ─────────────────────────────────────────────────────────────
  const rendered = stars(el);
  if (rendered.length !== c.max) {
    say(`max=${c.max} rendered ${rendered.length} part="star" elements`);
  }
  for (const [i, star] of rendered.entries()) {
    if (star.getAttribute('role') !== 'radio') {
      say(`star ${i} role is "${star.getAttribute('role')}", expected "radio"`);
    }
    if (!star.getAttribute('aria-label')) say(`star ${i} has no accessible name`);
    const want = expectedChecked(c, i) ? 'true' : 'false';
    if (star.getAttribute('aria-checked') !== want) {
      say(`value=${c.value}: star ${i} is aria-checked="${star.getAttribute('aria-checked')}",`
        + ` expected "${want}"`);
    }
    if (!group.contains(star)) say(`star ${i} is not inside part="base"`);
    // Every star draws SOMETHING: an icon element from the catalogue/URL path,
    // or the literal glyph for an emoji.
    const drew = star.querySelector('svg, img, [part~="icon"]') !== null
      || (star.textContent ?? '').trim().length > 0;
    if (!drew) say(`star ${i} rendered no glyph for icon="${c.icon}"`);
  }

  // "empty falls back to icon" — with an explicit empty icon, an UNFILLED star
  // must show it. Only asserted for text glyphs, where the DOM can read it.
  if (c.emptyIcon && /^[^\w]/.test(c.emptyIcon)) {
    const firstEmpty = rendered.findIndex((_, i) => !expectedChecked(c, i));
    if (firstEmpty >= 0) {
      const glyphs = (rendered[firstEmpty].textContent ?? '');
      if (!glyphs.includes(c.emptyIcon)) {
        say(`empty-icon="${c.emptyIcon}" never appears on unfilled star ${firstEmpty}`
          + ` (reads "${glyphs.trim()}")`);
      }
    }
  }

  // ── Reflection ────────────────────────────────────────────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const v = (c as any)[key];
    const isDefault = (DEFAULTS as any)[key] === v;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh) {
        say(`${key} left at its default but [${attribute}]="${el.getAttribute(attribute)}"`
          + ' was written anyway');
      }
      if (present && !fresh && typeof v !== 'boolean'
        && el.getAttribute(attribute) !== String(v)) {
        say(`[${attribute}] still reads "${el.getAttribute(attribute)}" after ${key}`
          + ` returned to its default ${JSON.stringify(v)}`);
      }
      continue;
    }
    if (typeof v === 'boolean') {
      if (v && !present) say(`${key}=true assigned but [${attribute}] never reflected`);
      if (!v && present) say(`${key}=false assigned but [${attribute}] is still present`);
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(v)} assigned as a property but [${attribute}] never reflected`);
      continue;
    }
    if (el.getAttribute(attribute) !== String(v)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}", expected "${String(v)}"`);
    }
  }

  return problems;
}

/**
 * Click star `index`, on the left or right half.
 *
 * happy-dom performs no layout, so every `getBoundingClientRect()` is a zero
 * box and the documented half-star rule ("left half → i + 0.5") could not be
 * expressed at all. The star is given a real rect for the duration of the
 * click — the geometry a browser would have supplied — so the rule under test
 * is the component's arithmetic, not the environment's missing layout. The
 * visual tier checks the same rule against a real painted box.
 */
export function clickStar(el: any, index: number, half: 'left' | 'right' = 'right'): void {
  const star = stars(el)[index];
  if (!star) throw new Error(`no star at index ${index}`);
  const LEFT = 100;
  const WIDTH = 24;
  const original = star.getBoundingClientRect;
  (star as any).getBoundingClientRect = () => ({
    left: LEFT, right: LEFT + WIDTH, top: 0, bottom: WIDTH,
    width: WIDTH, height: WIDTH, x: LEFT, y: 0, toJSON: () => ({}),
  });
  try {
    star.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
      clientX: half === 'left' ? LEFT + WIDTH * 0.25 : LEFT + WIDTH * 0.75,
      clientY: WIDTH / 2,
    }));
  } finally {
    (star as any).getBoundingClientRect = original;
  }
}

/** A keydown on the radiogroup, as a real key event (bubbles + composed). */
export function pressKey(el: any, key: string): void {
  base(el)?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** Record every `rating-change` detail, in dispatch order. */
export function captureChanges(el: HTMLElement): Array<{ value: number }> {
  const seen: Array<{ value: number }> = [];
  el.addEventListener('rating-change', (event: Event) => {
    seen.push((event as CustomEvent).detail);
  });
  return seen;
}

/** Assert one combo against the oracle. */
export function expectRating(el: any, c: RatingCombo, options?: OracleOptions): void {
  expect(ratingProblems(el, c, options), `combo ${c.id}`).toEqual([]);
}
