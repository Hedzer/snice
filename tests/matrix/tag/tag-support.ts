/**
 * Per-component oracle for the snice-tag matrix.
 *
 * snice-tag is display-only, so its whole contract is "render the declared
 * shape and carry the declared style axes". Everything encoded here comes from
 * docs/ai/components/tag.md, snice-tag.types.ts, and the framework property
 * contract in docs/ai/properties.md:
 *
 *   · CSS Parts: `base` (container span), `icon` (icon slot wrapper), `label`
 *     (label slot wrapper). The doc lists all three unconditionally and names
 *     no property that removes one, so all three exist in every combo.
 *   · Slots: `(default)` = tag label content, `icon` = leading icon. Each slot
 *     lives inside the part the doc names after it.
 *   · `removable: boolean = false  // Show remove button` — the only axis that
 *     adds DOM, and the only source of `tag-remove -> { tag }`.
 *   · `variant` / `size` / `outline` / `pill` are style axes with no DOM of
 *     their own; the stylesheet selects them as `:host([variant=…])`, so in a
 *     layout-free DOM their observable contract is the attribute channel.
 *     docs/ai/properties.md: "Reflect property setter changes to corresponding
 *     attributes unless `reflect: false`" and "Initial field values (defaults)
 *     are NOT reflected". Hence the oracle demands an attribute for an authored
 *     attribute always, and for a property assignment only when the assigned
 *     value differs from the documented default.
 */
import { mount, part, shadow, settle, type Shape } from '../matrix-utils';

export const VARIANTS = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const CHANNELS = ['attr', 'prop'] as const;

export type Variant = typeof VARIANTS[number];
export type Size = typeof SIZES[number];
/** How a combo is authored: markup attributes, or post-connect JS assignment. */
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from docs/ai/components/tag.md. */
export const DEFAULTS = {
  variant: 'default' as Variant,
  size: 'medium' as Size,
  removable: false,
  outline: false,
  pill: false,
};

export interface TagCombo {
  variant: Variant;
  size: Size;
  removable: boolean;
  outline: boolean;
  pill: boolean;
  channel: Channel;
}

export const LABEL = 'Ready';
export const ICON_CHILD = '<span slot="icon" data-icon>*</span>';

/** Mount a combo through its own authoring channel. */
export async function mountTag(combo: TagCombo, innerHTML = LABEL): Promise<HTMLElement> {
  if (combo.channel === 'attr') {
    const attrs: Record<string, any> = { variant: combo.variant, size: combo.size };
    if (combo.removable) attrs.removable = true;
    if (combo.outline) attrs.outline = true;
    if (combo.pill) attrs.pill = true;
    return mount<HTMLElement>('snice-tag', attrs, innerHTML);
  }
  const el = await mount<HTMLElement>('snice-tag', {}, innerHTML);
  const target = el as any;
  target.variant = combo.variant;
  target.size = combo.size;
  target.removable = combo.removable;
  target.outline = combo.outline;
  target.pill = combo.pill;
  await settle(el, 5);
  return el;
}

export function removeButton(el: HTMLElement): HTMLButtonElement | null {
  return shadow(el).querySelector<HTMLButtonElement>('.tag-remove');
}

export function labelSlot(el: HTMLElement): HTMLSlotElement | null {
  return shadow(el).querySelector<HTMLSlotElement>('slot:not([name])');
}

export function iconSlot(el: HTMLElement): HTMLSlotElement | null {
  return shadow(el).querySelector<HTMLSlotElement>('slot[name="icon"]');
}

/**
 * The DOCUMENTED shadow shape for a combo — the "expected" side of the oracle.
 */
export function expectedShape(combo: TagCombo): Shape {
  return {
    hasBase: true,
    hasIconPart: true,
    hasLabelPart: true,
    defaultSlotInLabelPart: true,
    iconSlotInIconPart: true,
    hasRemoveButton: combo.removable,
    removeButtonInBase: combo.removable,
    removeAriaLabel: combo.removable ? 'Remove' : null,
    removeType: combo.removable ? 'button' : null,
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const base = part(el, 'base');
  const iconPart = part(el, 'icon');
  const labelPart = part(el, 'label');
  const button = removeButton(el);
  const label = labelSlot(el);
  const icon = iconSlot(el);
  return {
    hasBase: !!base,
    hasIconPart: !!iconPart,
    hasLabelPart: !!labelPart,
    defaultSlotInLabelPart: !!labelPart && !!label && labelPart.contains(label),
    iconSlotInIconPart: !!iconPart && !!icon && iconPart.contains(icon),
    hasRemoveButton: !!button,
    removeButtonInBase: !!button && !!base && base.contains(button),
    removeAriaLabel: button?.getAttribute('aria-label') ?? null,
    removeType: button?.getAttribute('type') ?? null,
  };
}

/**
 * The DOCUMENTED axis state: property truth for every axis, plus the attribute
 * the stylesheet keys on. See the module header for why a default-valued
 * property assignment is exempt from the reflection demand.
 */
export function expectedAxes(combo: TagCombo): Shape {
  const reflected = (name: keyof typeof DEFAULTS) =>
    combo.channel === 'attr' || combo[name] !== DEFAULTS[name];
  return {
    'prop.variant': combo.variant,
    'prop.size': combo.size,
    'prop.removable': combo.removable,
    'prop.outline': combo.outline,
    'prop.pill': combo.pill,
    'attr.variant': reflected('variant') ? combo.variant : undefined,
    'attr.size': reflected('size') ? combo.size : undefined,
    'attr.removable': reflected('removable') ? combo.removable : undefined,
    'attr.outline': reflected('outline') ? combo.outline : undefined,
    'attr.pill': reflected('pill') ? combo.pill : undefined,
  };
}

export function readAxes(el: HTMLElement, combo: TagCombo): Shape {
  const any = el as any;
  const reflected = (name: keyof typeof DEFAULTS) =>
    combo.channel === 'attr' || combo[name] !== DEFAULTS[name];
  return {
    'prop.variant': any.variant,
    'prop.size': any.size,
    'prop.removable': any.removable,
    'prop.outline': any.outline,
    'prop.pill': any.pill,
    'attr.variant': reflected('variant') ? el.getAttribute('variant') : undefined,
    'attr.size': reflected('size') ? el.getAttribute('size') : undefined,
    'attr.removable': reflected('removable') ? el.hasAttribute('removable') : undefined,
    'attr.outline': reflected('outline') ? el.hasAttribute('outline') : undefined,
    'attr.pill': reflected('pill') ? el.hasAttribute('pill') : undefined,
  };
}
