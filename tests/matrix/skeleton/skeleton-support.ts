/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-skeleton feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted here comes from docs/ai/components/skeleton.md and
 * packages/components/src/skeleton/snice-skeleton.types.ts, never from watching
 * the component run:
 *
 *   · PARTS — "base: Outer container", "bone: Individual placeholder element".
 *     One base, and exactly `count` bones: `count: number = 1` is documented as
 *     the number of placeholder elements (`<snice-skeleton variant="text"
 *     count="3">` in the usage block renders three lines).
 *   · SIZING — `width` / `height` are documented as strings applied to the
 *     placeholder (`<snice-skeleton variant="circular" width="48px"
 *     height="48px">`), so a set value must reach the bone's own box, not the
 *     container's.
 *   · SPACING — `spacing: string = '8px'` is the gap BETWEEN the repeated
 *     bones, so it belongs to the container that stacks them.
 *   · REFLECTION — docs/ai/properties.md: `@property` reflects setter changes by
 *     default, and initial defaults are NOT reflected. Every documented property
 *     of this component is a plain `@property`, so a non-default assignment owes
 *     its attribute and an untouched default owes its absence.
 *   · ACCESSIBILITY — "Decorative only; use `aria-busy="true"` on container
 *     while loading". A decorative placeholder does not announce itself.
 *
 * The oracle returns EVERY divergence a combo commits at once, so one run tells
 * the whole story instead of one problem per re-run.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/skeleton/snice-skeleton';
import type {
  SkeletonVariant, SkeletonAnimation,
} from '../../../packages/components/src/skeleton/snice-skeleton.types';

export { wait, createComponent };

export interface SkeletonCombo {
  id: string;
  variant: SkeletonVariant;
  animation: SkeletonAnimation;
  count: number;
  width: string;
  height: string;
  spacing: string;
}

/** The documented defaults, straight out of the Properties block. */
export const DEFAULTS: Omit<SkeletonCombo, 'id'> = {
  variant: 'text',
  animation: 'wave',
  count: 1,
  width: '',
  height: '',
  spacing: '8px',
};

export const VARIANTS: SkeletonVariant[] = ['text', 'circular', 'rectangular', 'rounded'];
export const ANIMATIONS: SkeletonAnimation[] = ['pulse', 'wave', 'none'];
export const COUNTS = [1, 3];

export function combo(id: string, over: Partial<SkeletonCombo> = {}): SkeletonCombo {
  return { ...DEFAULTS, id, ...over };
}

/**
 * The cross: variant x animation x count — 24 combos, the three dimensions that
 * change what is rendered or how it is animated — with the three sizing
 * dimensions (`width`, `height`, `spacing`) rotated across them so every one is
 * exercised against several variants. `.ai/fuzzing.md` sizes a matrix to the
 * component: a skeleton's render function has one loop and one branch-free
 * class string, so the full 4*3*2*3*3*3 product would be budget spent on
 * nothing.
 */
export function generateCombos(): SkeletonCombo[] {
  const WIDTHS = ['', '48px', '60%'];
  const HEIGHTS = ['', '48px', '200px'];
  const SPACINGS = ['8px', '0px', '16px'];
  const combos: SkeletonCombo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const animation of ANIMATIONS) {
      for (const count of COUNTS) {
        const width = WIDTHS[n % WIDTHS.length];
        // `n * 2 % 3` pairs a set width with a DIFFERENT set height while still
        // landing on the both-unset case, so the intrinsic size of every
        // variant is exercised as well as the overridden one.
        const height = HEIGHTS[(n * 2) % HEIGHTS.length];
        const spacing = SPACINGS[n % SPACINGS.length];
        combos.push({
          id: `${variant}/${animation}/count:${count}`
            + `/[${width ? `w:${width}` : 'w:auto'},${height ? `h:${height}` : 'h:auto'}`
            + `,gap:${spacing}]`,
          variant, animation, count, width, height, spacing,
        });
        n++;
      }
    }
  }
  return combos;
}

/** Attribute name for every documented property (all plain, no renames). */
const ATTRIBUTE_OF: Record<string, string> = {
  variant: 'variant',
  animation: 'animation',
  count: 'count',
  width: 'width',
  height: 'height',
  spacing: 'spacing',
};

/**
 * Mount through the PROPERTY channel, assigning only NON-DEFAULT values.
 *
 * Properties are the informative channel: attributes written in markup are
 * trivially present afterwards, so an attribute-built element could never
 * detect broken reflection. Defaults are skipped because the documented rule is
 * that untouched defaults are not reflected — assigning one would make the
 * attribute expectation ambiguous.
 */
export async function mountSkeleton(c: Partial<SkeletonCombo>): Promise<any> {
  const el = await createComponent<any>('snice-skeleton', {});
  for (const [key, value] of Object.entries(c)) {
    if (key === 'id') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  return el;
}

const partsNamed = (sr: ShadowRoot, name: string): HTMLElement[] =>
  [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

export interface OracleOptions {
  /**
   * `true` (default) for an element built once: an untouched default must not
   * have written its attribute. `false` after a property was reassigned during
   * the element's life — reflection has legitimately run by then, so the
   * attribute may exist as long as it is HONEST about the current value.
   */
  fresh?: boolean;
}

/** Every documented consequence of `c`, read back off the rendered tree. */
export function skeletonProblems(
  el: any,
  c: SkeletonCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('skeleton rendered no shadow root'); return problems; }

  // ── Parts ─────────────────────────────────────────────────────────────────
  const bases = partsNamed(sr, 'base');
  if (bases.length !== 1) {
    say(`${bases.length} elements carry part="base", expected exactly 1`);
    return problems;
  }
  const base = bases[0];
  const bones = partsNamed(sr, 'bone');

  // "count: number = 1" — the number of placeholder elements.
  if (bones.length !== c.count) {
    say(`count=${c.count} rendered ${bones.length} part="bone" elements`);
  }
  for (const bone of bones) {
    if (!base.contains(bone)) say('a part="bone" is not inside part="base"');
  }

  // ── Sizing: width / height land on the BONE ───────────────────────────────
  for (const [i, bone] of bones.entries()) {
    const style = bone.getAttribute('style') ?? '';
    if (c.width && !new RegExp(`(^|;)\\s*width:\\s*${escapeForRegex(c.width)}\\s*(;|$)`).test(style)) {
      say(`width="${c.width}" never reached bone ${i} (style="${style}")`);
    }
    if (c.height && !new RegExp(`(^|;)\\s*height:\\s*${escapeForRegex(c.height)}\\s*(;|$)`).test(style)) {
      say(`height="${c.height}" never reached bone ${i} (style="${style}")`);
    }
  }

  // ── Spacing: the documented gap between the repeated bones ────────────────
  const gap = (base.style.gap || '').trim();
  if (gap !== c.spacing) {
    say(`spacing="${c.spacing}" but part="base" stacks its bones with gap "${gap}"`);
  }

  // ── Reflection: the documented property→attribute contract ────────────────
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

/**
 * The documented accessibility contract, kept apart from the structural oracle
 * so a finding here cannot mask a structural regression.
 *
 * "Decorative only; use `aria-busy="true"` on container while loading" — a
 * decorative element carries no ARIA live role of its own, and certainly not
 * one per repeated bone (a `count="3"` skeleton would queue three "Loading…"
 * announcements for the same wait).
 */
export function skeletonAriaProblems(el: any): string[] {
  const problems: string[] = [];
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) return ['skeleton rendered no shadow root'];
  const announcing = [...sr.querySelectorAll('[role]')]
    .filter(node => ['status', 'alert', 'log', 'progressbar'].includes(node.getAttribute('role')!));
  if (announcing.length) {
    problems.push(`a decorative skeleton exposes ${announcing.length} live-region role(s)`
      + ` (${announcing.map(n => n.getAttribute('role')).join(', ')});`
      + ' the docs put the loading announcement on the consumer\'s container via aria-busy');
  }
  return problems;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Assert one combo against the oracle. */
export function expectSkeleton(el: any, c: SkeletonCombo, options?: OracleOptions): void {
  expect(skeletonProblems(el, c, options), `combo ${c.id}`).toEqual([]);
}
