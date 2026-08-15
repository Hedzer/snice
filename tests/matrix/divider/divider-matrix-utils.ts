/**
 * Shared harness for the snice-divider feature-combination matrix.
 *
 * The divider is the small end of the scale the policy describes (.ai/fuzzing.md:
 * "a divider gets a handful of combos"), so this file is deliberately one oracle
 * and one small generator rather than the twelve-file spread the table needs.
 *
 * Everything the oracle asserts comes from docs/ai/components/divider.md and
 * docs/ai/properties.md, never from watching the component run:
 *
 *   · STRUCTURE — a divider with `text` renders a container carrying
 *     `part="base"` with `part="line"` before and after a `part="text"` label;
 *     a divider without text renders one element carrying `part="base line"`.
 *     Both are `role="separator"` and carry `aria-orientation`.
 *   · REFLECTION — `@property` reflects by default (properties.md), and initial
 *     defaults are explicitly NOT reflected. So a non-default value assigned
 *     through the property channel must appear as its attribute, and a value
 *     left at its default must leave the attribute absent. Those attributes are
 *     the whole styling contract: every visual dimension of this component
 *     (`variant`, `spacing`, `align`, `capped`, `orientation`) is a
 *     `:host([attr=…])` rule in snice-divider.css, so an unreflected property is
 *     a property that does nothing.
 *   · CUSTOM PROPERTIES — `color` drives `--divider-color`, `text-background`
 *     drives `--divider-text-bg` (both documented under "CSS Custom Properties").
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/divider/snice-divider';

export { wait };

export type Orientation = 'horizontal' | 'vertical';
export type Variant = 'solid' | 'dashed' | 'dotted';
export type Spacing = 'none' | 'small' | 'medium' | 'large';
export type Align = 'start' | 'center' | 'end';

export interface DividerCombo {
  id: string;
  orientation: Orientation;
  variant: Variant;
  spacing: Spacing;
  align: Align;
  capped: boolean;
  text: string;
  textBackground: string;
  color: string;
}

/** The documented defaults, straight out of docs/ai/components/divider.md. */
export const DEFAULTS = {
  orientation: 'horizontal' as Orientation,
  variant: 'solid' as Variant,
  spacing: 'medium' as Spacing,
  align: 'center' as Align,
  capped: false,
  text: '',
  textBackground: '',
  color: '',
};

export const ORIENTATIONS: Orientation[] = ['horizontal', 'vertical'];
export const VARIANTS: Variant[] = ['solid', 'dashed', 'dotted'];
export const SPACINGS: Spacing[] = ['none', 'small', 'medium', 'large'];
export const ALIGNS: Align[] = ['start', 'center', 'end'];
export const TEXTS = ['', 'OR'];

/**
 * The generator: the full cross of the three dimensions that change the RENDER
 * TREE or the line's paint rule — orientation x text x variant = 12 combos —
 * with the four dimensions that are pure style hooks (align, spacing, capped,
 * color) rotated across them so every documented value of every one of them is
 * exercised at least twice. Twelve is the "handful" the policy asks a divider
 * for; the full 2*2*3*3*4*2*2 = 576 product would be the table's budget spent
 * on a component with one branch in its render function.
 */
export function generateCombos(): DividerCombo[] {
  const combos: DividerCombo[] = [];
  let n = 0;
  for (const orientation of ORIENTATIONS) {
    for (const text of TEXTS) {
      for (const variant of VARIANTS) {
        const align = ALIGNS[n % ALIGNS.length];
        const spacing = SPACINGS[n % SPACINGS.length];
        const capped = n % 2 === 1;
        const color = n % 3 === 2 ? 'rgb(59, 130, 246)' : '';
        const textBackground = text && n % 4 === 0 ? 'rgb(255, 255, 255)' : '';
        combos.push({
          id: `${orientation}/${text ? `text:"${text}"` : 'no-text'}/${variant}`
            + `/[align:${align},spacing:${spacing}${capped ? ',capped' : ''}`
            + `${color ? ',color' : ''}${textBackground ? ',text-bg' : ''}]`,
          orientation, variant, spacing, align, capped, text, textBackground, color,
        });
        n++;
      }
    }
  }
  return combos;
}

/**
 * Build a divider by assigning PROPERTIES, never attributes.
 *
 * That is the harder and more informative channel: attributes set in markup are
 * trivially present afterwards, so an attribute-built element could not detect a
 * broken `reflect`. Assigning properties means the attributes this component's
 * entire stylesheet keys off have to be produced by the framework, which is the
 * documented behaviour (properties.md: "Reflect property setter changes to
 * corresponding attributes unless `reflect: false`").
 *
 * Only NON-DEFAULT values are assigned, because the same doc says initial
 * defaults are not reflected — assigning a value equal to the default is a
 * no-op for the setter and would make the attribute expectation ambiguous.
 */
export async function makeDivider(combo: Partial<DividerCombo>): Promise<any> {
  const el = document.createElement('snice-divider') as any;
  document.body.appendChild(el);
  await el.ready;
  for (const [key, value] of Object.entries(combo)) {
    if (key === 'id') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  return el;
}

/** Attribute name for a property, per the documented attribute mapping. */
const ATTRIBUTE_OF: Record<string, string> = {
  orientation: 'orientation',
  variant: 'variant',
  spacing: 'spacing',
  align: 'align',
  capped: 'capped',
  text: 'text',
  textBackground: 'text-background',
  color: 'color',
};

/**
 * The oracle. Returns every divergence from the documented contract at once, so
 * a failing combo reports its whole story instead of one problem per re-run.
 */
export interface OracleOptions {
  /**
   * `true` (the default) for an element built once and never touched again:
   * a property left at its documented default must NOT have written its
   * attribute. `false` once a property has been assigned during the element's
   * life — reflection has legitimately run by then, so an attribute carrying
   * the CURRENT value is correct whether or not that value is the default. The
   * distinction is the documented one ("Initial field values … are NOT
   * reflected. Only changes made via the property setter are reflected"), and
   * keeping it explicit stops the transition tests from reading a faithful
   * reflection as a defect.
   */
  fresh?: boolean;
}

export function dividerProblems(
  el: any,
  combo: DividerCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) return ['no shadow root'];

  const part = (name: string) =>
    [...sr.querySelectorAll('[part]')].filter(node =>
      (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

  const bases = part('base');
  if (bases.length !== 1) {
    say(`${bases.length} elements carry part="base", expected exactly 1`);
    return problems;
  }
  const base = bases[0];

  // ── role / aria, documented on every divider shape ────────────────────────
  if (base.getAttribute('role') !== 'separator') {
    say(`part="base" role is "${base.getAttribute('role')}", expected "separator"`);
  }
  if (base.getAttribute('aria-orientation') !== combo.orientation) {
    say(`aria-orientation is "${base.getAttribute('aria-orientation')}",`
      + ` expected "${combo.orientation}"`);
  }

  // ── The two documented shapes ─────────────────────────────────────────────
  const lines = part('line');
  const texts = part('text');
  if (combo.text) {
    // "text — Optional text label" is documented with no orientation caveat, so
    // a labelled divider owes a label whichever way it points.
    if (texts.length !== 1) {
      say(`text divider renders ${texts.length} part="text" elements, expected 1`);
    } else if ((texts[0].textContent ?? '').trim() !== combo.text) {
      say(`part="text" reads "${(texts[0].textContent ?? '').trim()}", expected "${combo.text}"`);
    }
    if (lines.length !== 2) {
      say(`text divider renders ${lines.length} part="line" elements, expected 2`
        + ' (one each side of the label)');
    }
    if (lines.includes(base)) {
      say('text divider merges part="base" and part="line" onto one element;'
        + ' the label needs its own container');
    }
  } else {
    if (texts.length !== 0) {
      say(`textless divider renders ${texts.length} part="text" elements, expected 0`);
    }
    if (lines.length !== 1 || lines[0] !== base) {
      say(`textless divider should render one element carrying part="base line";`
        + ` found ${lines.length} part="line" elements`);
    }
  }

  // ── Reflection: the styling contract ──────────────────────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    const value = (combo as any)[key];
    const isDefault = (DEFAULTS as any)[key] === value;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      // Documented: "Initial field values (defaults …) are NOT reflected".
      if (present && fresh) {
        say(`${key} left at its default but attribute [${attribute}]`
          + `="${el.getAttribute(attribute)}" was written anyway`);
      }
      // On a settled element the attribute may exist; it must still be honest.
      if (present && !fresh && typeof value !== 'boolean'
        && el.getAttribute(attribute) !== String(value)) {
        say(`[${attribute}] still reads "${el.getAttribute(attribute)}" after`
          + ` ${key} returned to its default ${JSON.stringify(value)}`);
      }
      if (present && !fresh && typeof value === 'boolean' && value === false) {
        say(`[${attribute}] is still present after ${key} was set false`);
      }
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(value)} assigned as a property but [${attribute}]`
        + ' never reflected — every style rule for it keys off that attribute');
      continue;
    }
    if (typeof value === 'boolean') continue;
    if (el.getAttribute(attribute) !== String(value)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}",`
        + ` expected "${String(value)}"`);
    }
  }
  // ── Documented custom properties ──────────────────────────────────────────
  const inline = (name: string) => el.style.getPropertyValue(name).trim();
  if (combo.color && inline('--divider-color') !== combo.color) {
    say(`color="${combo.color}" but --divider-color is`
      + ` "${inline('--divider-color')}"`);
  }
  if (!combo.color && inline('--divider-color') !== '') {
    say(`no color set but --divider-color is pinned to "${inline('--divider-color')}"`);
  }
  if (combo.textBackground && inline('--divider-text-bg') !== combo.textBackground) {
    say(`text-background="${combo.textBackground}" but --divider-text-bg is`
      + ` "${inline('--divider-text-bg')}"`);
  }

  return problems;
}

/** Assert one combo against the oracle. */
export function expectDivider(el: any, combo: DividerCombo): void {
  expect(dividerProblems(el, combo), `combo ${combo.id}`).toEqual([]);
}
