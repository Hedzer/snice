/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-form-layout matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/form-layout.md` and
 * `packages/components/src/form-layout/snice-form-layout.types.ts`:
 *
 *   · Properties `columns` (number, default 1), `labelPosition`
 *     ('top' | 'left' | 'right', default 'top', attribute `label-position`),
 *     `labelWidth` (string, default '8rem', attribute `label-width`), `gap`
 *     ('small' | 'medium' | 'large', default 'medium'), `variant`
 *     ('default' | 'compact' | 'inline', default 'default').
 *   · Slot: the default slot takes the form fields.
 *   · Part: `base`, the root layout container.
 *   · Custom properties: `--form-columns` "set from `columns` prop" and
 *     `--form-label-width` "set from `label-width` prop".
 *   · "No events — layout-only component."
 *
 * ── What this tier can and cannot see ───────────────────────────────────────
 *
 * This is a LAYOUT component: almost everything it documents is a picture. In
 * happy-dom there is no grid, no gap and no media query, so the DOM tier owns
 * exactly three things — that the slotted fields are still the author's own
 * children in the author's own order, that `[part="base"]` carries the class
 * hooks the stylesheet selects on, and that the two documented custom
 * properties really do carry the two property values. The columns, the label
 * alignment, the gap scale and the "<640px collapses to one column" rule are
 * asserted in a real engine by
 * `tests/live/matrix/form-layout/form-layout-visual.spec.ts`.
 *
 * The class names are not invented from observed output: each is the hook the
 * component's own stylesheet selects on (`.form-layout--gap-*`,
 * `.form-layout--<variant>`, `.form-layout--labels-*`), so asserting them is
 * asserting that a documented property reaches the documented presentation.
 */
import { mount, shadow, part, classesOf } from '../matrix-utils';
import '../../../packages/components/src/form-layout/snice-form-layout';
import type {
  FormLayoutLabelPosition, FormLayoutGap, FormLayoutVariant,
} from '../../../packages/components/src/form-layout/snice-form-layout.types';

export type { FormLayoutLabelPosition, FormLayoutGap, FormLayoutVariant };

// ── Documented value sets and defaults ──────────────────────────────────────

export const LABEL_POSITIONS: readonly FormLayoutLabelPosition[] = ['top', 'left', 'right'];
export const GAPS: readonly FormLayoutGap[] = ['small', 'medium', 'large'];
export const VARIANTS: readonly FormLayoutVariant[] = ['default', 'compact', 'inline'];

export const DEFAULTS = {
  columns: 1,
  labelPosition: 'top' as FormLayoutLabelPosition,
  labelWidth: '8rem',
  gap: 'medium' as FormLayoutGap,
  variant: 'default' as FormLayoutVariant,
};

export interface LayoutCombo {
  columns: number;
  labelPosition: FormLayoutLabelPosition;
  labelWidth: string;
  gap: FormLayoutGap;
  variant: FormLayoutVariant;
  /** How many slotted fields the combo authors. */
  fields: number;
}

export const layout = (overrides: Partial<LayoutCombo> = {}): LayoutCombo => ({
  ...DEFAULTS,
  fields: 3,
  ...overrides,
});

/** The documented attribute names. */
export function attrsOf(c: LayoutCombo): Record<string, any> {
  const attrs: Record<string, any> = {
    columns: c.columns,
    gap: c.gap,
    variant: c.variant,
    'label-position': c.labelPosition,
  };
  if (c.labelWidth !== DEFAULTS.labelWidth) attrs['label-width'] = c.labelWidth;
  return attrs;
}

/** The slotted fields, authored the way the docs' examples author them. */
export const fieldsMarkup = (count: number): string =>
  Array.from({ length: count }, (_, i) =>
    `<div class="field" data-index="${i}">Field ${i + 1}</div>`).join('');

export const comboId = (c: LayoutCombo): string =>
  `${c.variant}/${c.gap}/labels-${c.labelPosition} columns=${c.columns}`
  + ` width=${c.labelWidth} fields=${c.fields}`;

export const mountLayout = (c: LayoutCombo) =>
  mount<HTMLElement>('snice-form-layout', attrsOf(c), fieldsMarkup(c.fields));

// ── Reading ─────────────────────────────────────────────────────────────────

export interface Reading {
  base: HTMLElement | null;
  classes: Set<string>;
  columnsVariable: string;
  labelWidthVariable: string;
  slot: HTMLSlotElement | null;
  assigned: string[];
  lightChildren: string[];
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const base = part<HTMLElement>(el, 'base');
  const slot = root.querySelector('slot');
  return {
    base,
    classes: classesOf(base),
    columnsVariable: base?.style.getPropertyValue('--form-columns').trim() ?? '',
    labelWidthVariable: base?.style.getPropertyValue('--form-label-width').trim() ?? '',
    slot,
    // Spread first: happy-dom hands back a live collection rather than a plain
    // array, and mapping it directly carries its internal bookkeeping into the
    // result.
    assigned: slot
      ? [...slot.assignedElements()].map(node => (node as HTMLElement).dataset.index ?? '?')
      : [],
    lightChildren: [...el.children].map(node => (node as HTMLElement).dataset.index ?? '?'),
  };
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * Every documented consequence of `c`, as a problem list. `[]` means the
 * rendered layout matches its documentation.
 */
export function layoutProblems(el: HTMLElement, c: LayoutCombo): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── The one documented part ──────────────────────────────────────────────
  if (!r.base) { say('no [part="base"] layout container'); return problems; }

  // ── The presentation hooks the stylesheet selects on ─────────────────────
  const expected = [
    'form-layout',
    `form-layout--gap-${c.gap}`,
    `form-layout--${c.variant}`,
    `form-layout--labels-${c.labelPosition}`,
  ];
  for (const name of expected) {
    if (!r.classes.has(name)) {
      say(`[part="base"] is missing "${name}" (has ${[...r.classes].join(' ')})`);
    }
  }
  // …and no hook from a value this combo did not ask for.
  for (const gap of GAPS) {
    if (gap !== c.gap && r.classes.has(`form-layout--gap-${gap}`)) {
      say(`gap="${c.gap}" but the "${gap}" hook is also applied`);
    }
  }
  for (const variant of VARIANTS) {
    if (variant !== c.variant && r.classes.has(`form-layout--${variant}`)) {
      say(`variant="${c.variant}" but the "${variant}" hook is also applied`);
    }
  }
  for (const position of LABEL_POSITIONS) {
    if (position !== c.labelPosition && r.classes.has(`form-layout--labels-${position}`)) {
      say(`labelPosition="${c.labelPosition}" but the "${position}" hook is also applied`);
    }
  }

  // ── The two documented custom properties ─────────────────────────────────
  if (r.columnsVariable !== String(c.columns)) {
    say(`--form-columns is "${r.columnsVariable}", expected "${c.columns}"`);
  }
  if (r.labelWidthVariable !== c.labelWidth) {
    say(`--form-label-width is "${r.labelWidthVariable}", expected "${c.labelWidth}"`);
  }

  // ── The default slot: the author's fields, in the author's order ─────────
  if (!r.slot) say('no default slot for the form fields');
  const authored = Array.from({ length: c.fields }, (_, i) => String(i));
  if (r.lightChildren.join(',') !== authored.join(',')) {
    say(`the light DOM holds [${r.lightChildren.join(', ')}], expected [${authored.join(', ')}]`);
  }
  if (r.assigned.join(',') !== authored.join(',')) {
    say(`the slot has [${r.assigned.join(', ')}] assigned, expected [${authored.join(', ')}]`);
  }

  return problems;
}
