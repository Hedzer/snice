/**
 * Shared oracle for the snice-chip feature-combination matrix.
 *
 * Same shape as tests/matrix/table/matrix-utils.ts: one function
 * derives the EXPECTED rendered facts from the documented contract
 * (docs/ai/components/chip.md) and one reads the ACTUAL facts out of the
 * shadow root. Tests compare the two objects wholesale so a failing combo
 * reports every divergence at once instead of one assertion per re-run.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/chip/snice-chip';

export { wait, createComponent };

// ── Dimensions (docs/ai/components/chip.md "Properties") ────────────────────

export const VARIANTS = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const SHAPES = ['pill', 'rounded', 'square'] as const;

export type ChipVariant = typeof VARIANTS[number];
export type ChipSize = typeof SIZES[number];
export type ChipShape = typeof SHAPES[number];

/**
 * How the chip gets its text. Documented: `label` is a property, and
 * "slotted content wins: <snice-chip>Text</snice-chip>".
 */
export const CONTENT_SOURCES = ['label', 'slot', 'both'] as const;
export type ContentSource = typeof CONTENT_SOURCES[number];

/**
 * The affordance dimension. Documented precedence: `avatar` (an image URL)
 * takes precedence over the icon slot, and the `icon` slot overrides the
 * `icon` property.
 */
export const AFFORDANCES = ['none', 'icon-prop', 'icon-slot', 'avatar', 'avatar+icon'] as const;
export type Affordance = typeof AFFORDANCES[number];

export interface ChipCombo {
  variant: ChipVariant;
  size: ChipSize;
  shape: ChipShape;
  content: ContentSource;
  affordance: Affordance;
  removable: boolean;
  selectable: boolean;
  selected: boolean;
  disabled: boolean;
}

export const BASE_COMBO: ChipCombo = {
  variant: 'default',
  size: 'medium',
  shape: 'pill',
  content: 'label',
  affordance: 'none',
  removable: false,
  selectable: false,
  selected: false,
  disabled: false,
};

export const combo = (patch: Partial<ChipCombo> = {}): ChipCombo => ({ ...BASE_COMBO, ...patch });

export const comboId = (c: ChipCombo): string =>
  [
    c.variant, c.size, c.shape, c.content, c.affordance,
    c.removable ? 'removable' : '',
    c.selectable ? 'selectable' : '',
    c.selected ? 'selected' : '',
    c.disabled ? 'disabled' : '',
  ].filter(Boolean).join('/');

// ── Fixtures ────────────────────────────────────────────────────────────────

export const LABEL = 'Design';
export const SLOT_TEXT = 'Slotted';
export const ICON_TEXT = '★';
export const SLOT_ICON_TEXT = 'ICN';
export const AVATAR_URL = 'https://example.test/a.png';

/**
 * Build one combo as a live element and wait for the first render.
 *
 * Light-DOM children are attached BEFORE the host is connected, exactly as
 * authored HTML delivers them. Appending them afterwards leaves the component's
 * `slotchange` bookkeeping racing the assertion, which is a property of the
 * test, not of the component — and the docs describe authored markup
 * (`<snice-chip>Text</snice-chip>`), so that is what the matrix mounts.
 */
export async function makeChip(c: ChipCombo): Promise<any> {
  const chip = document.createElement('snice-chip') as any;

  const attr = (name: string, value: string) => chip.setAttribute(name, value);
  attr('variant', c.variant);
  attr('size', c.size);
  attr('shape', c.shape);
  if (c.content === 'label' || c.content === 'both') attr('label', LABEL);
  if (c.affordance === 'icon-prop' || c.affordance === 'avatar+icon') attr('icon', ICON_TEXT);
  if (c.affordance === 'avatar' || c.affordance === 'avatar+icon') attr('avatar', AVATAR_URL);
  if (c.removable) attr('removable', '');
  if (c.selectable) attr('selectable', '');
  if (c.selected) attr('selected', '');
  if (c.disabled) attr('disabled', '');

  if (c.content === 'slot' || c.content === 'both') {
    chip.appendChild(document.createTextNode(SLOT_TEXT));
  }
  if (c.affordance === 'icon-slot' || c.affordance === 'avatar+icon') {
    const span = document.createElement('span');
    span.setAttribute('slot', 'icon');
    span.textContent = SLOT_ICON_TEXT;
    chip.appendChild(span);
  }

  document.body.appendChild(chip);
  await chip.ready;
  await wait(30);
  return chip;
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface ChipFacts {
  /** A `[part="base"]` container is always rendered. */
  hasBase: boolean;
  /** Text the user reads — slotted content wins over `label`. */
  text: string;
  /** `[part="icon"]` wrapper: present when an icon is contributed and no avatar. */
  hasIconPart: boolean;
  /** The avatar `<img>`, present exactly when `avatar` is set. */
  avatarSrc: string | null;
  /** The remove affordance, present exactly when `removable`. */
  hasRemoveButton: boolean;
  /**
   * Documented: "Remove button has aria-label". The docs pin its EXISTENCE,
   * not its wording, so the oracle asserts a non-empty accessible name rather
   * than a string the implementation happens to build.
   */
  removeIsNamed: boolean;
  /** Documented accessibility surface. */
  ariaDisabled: string | null;
  /** Documented accessibility surface. */
  ariaSelected: string | null;
  /** A non-disabled chip is reachable; a disabled chip is not. */
  tabindex: string | null;
}

/**
 * EXPECTED facts, derived from the documented contract only.
 *
 *  · label/slot  — "slotted content wins: <snice-chip>Text</snice-chip>"
 *  · icon slot   — "Custom icon content (overrides `icon` property;
 *                  `avatar` takes precedence)"
 *  · avatar      — "Avatar image URL (takes precedence over icon slot)"
 *  · removable   — the remove affordance and its aria-label
 *  · disabled    — "aria-disabled", and not keyboard reachable
 *  · selected    — "aria-selected"
 */
export function expectedFacts(c: ChipCombo): ChipFacts {
  const slotted = c.content === 'slot' || c.content === 'both';
  const text = slotted ? SLOT_TEXT : (c.content === 'label' ? LABEL : '');
  const hasAvatar = c.affordance === 'avatar' || c.affordance === 'avatar+icon';
  const contributesIcon = c.affordance === 'icon-prop' || c.affordance === 'icon-slot'
    || c.affordance === 'avatar+icon';

  return {
    hasBase: true,
    text,
    hasIconPart: !hasAvatar && contributesIcon,
    avatarSrc: hasAvatar ? AVATAR_URL : null,
    hasRemoveButton: c.removable,
    removeIsNamed: c.removable,
    ariaDisabled: String(c.disabled),
    ariaSelected: String(c.selected),
    tabindex: c.disabled ? '-1' : '0',
  };
}

/** ACTUAL facts, read from the rendered shadow tree. */
export function readFacts(chip: any): ChipFacts {
  const sr = chip.shadowRoot as ShadowRoot;
  const base = sr.querySelector('[part="base"]') as HTMLElement | null;
  const iconPart = sr.querySelector('[part="icon"]') as HTMLElement | null;
  const avatar = sr.querySelector('img.chip-avatar') as HTMLImageElement | null;
  const remove = sr.querySelector('.chip-remove') as HTMLButtonElement | null;

  return {
    hasBase: !!base,
    text: labelText(chip),
    hasIconPart: !!iconPart,
    avatarSrc: avatar ? avatar.getAttribute('src') : null,
    hasRemoveButton: !!remove,
    removeIsNamed: !!(remove?.getAttribute('aria-label') ?? '').trim(),
    ariaDisabled: base ? base.getAttribute('aria-disabled') : null,
    ariaSelected: base ? base.getAttribute('aria-selected') : null,
    tabindex: base ? base.getAttribute('tabindex') : null,
  };
}

/**
 * The text a user reads. `<slot>` fallback content is what happy-dom renders
 * into `.chip-label`; assigned nodes live on the host, so both paths have to
 * be consulted to answer "what does this chip say".
 */
export function labelText(chip: any): string {
  const slot = chip.shadowRoot?.querySelector('.chip-label slot') as HTMLSlotElement | null;
  const assigned = slot?.assignedNodes?.({ flatten: false }) ?? [];
  const fromSlot = assigned
    // The DEFAULT slot only ever takes nodes without a `slot=` name; a
    // `<span slot="icon">` belongs to the icon slot and is not chip text.
    .filter((n: Node) => !(n as Element).getAttribute?.('slot'))
    .map((n: Node) => n.textContent ?? '')
    .join('')
    .trim();
  if (fromSlot) return fromSlot;
  const el = chip.shadowRoot?.querySelector('.chip-label') as HTMLElement | null;
  return (el?.textContent ?? '').trim();
}

/**
 * `aria-selected` was a KNOWN divergence (MATRIX-chip-1, fixed: the template
 * now renders it from first paint). It stays held out of the bulk comparison
 * and asserted on its own in chip-a11y.test.ts — a reporting-layout choice,
 * not a weakening: exactly one test owns the claim.
 */
const HELD_OUT: ReadonlyArray<keyof ChipFacts> = ['ariaSelected'];

/** Compare a whole combo against the oracle, reporting every divergence. */
export function expectChipMatches(chip: any, c: ChipCombo): void {
  const actual = readFacts(chip);
  const expected = expectedFacts(c);
  const problems = (Object.keys(expected) as Array<keyof ChipFacts>)
    .filter(key => !HELD_OUT.includes(key))
    .filter(key => actual[key] !== expected[key])
    .map(key => `${key}: ${JSON.stringify(actual[key])} != ${JSON.stringify(expected[key])}`);
  expect(problems, `combo ${comboId(c)}`).toEqual([]);
}

/**
 * The documented accessibility surface: "aria-selected, aria-disabled".
 * Asserted at full strength — see MATRIX-chip-1.
 */
export function expectAriaSelected(chip: any, c: ChipCombo): void {
  const actual = readFacts(chip);
  expect(actual.ariaSelected, `combo ${comboId(c)} aria-selected`).toBe(String(c.selected));
}

// ── Interaction helpers ─────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the documented events in dispatch order. */
export function collectEvents(chip: HTMLElement, types = ['chip-click', 'chip-remove']): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    chip.addEventListener(type, (e: Event) => {
      seen.push({ type, detail: (e as CustomEvent).detail });
    });
  }
  return seen;
}

/** Click the chip body (never the remove button). */
export function clickBody(chip: any): void {
  const base = chip.shadowRoot.querySelector('[part="base"]') as HTMLElement;
  base.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Click the remove affordance. */
export function clickRemove(chip: any): boolean {
  const button = chip.shadowRoot.querySelector('.chip-remove') as HTMLElement | null;
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}

/** Press a key on the chip body. */
export function press(chip: any, key: string): void {
  const base = chip.shadowRoot.querySelector('[part="base"]') as HTMLElement;
  base.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
}
