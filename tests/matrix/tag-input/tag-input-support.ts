/**
 * Per-component oracle for the snice-tag-input matrix.
 *
 * snice-tag-input is a form-ASSOCIATED control with real state: a live value,
 * an authored default, a dirty flag, and a constraint set. Everything encoded
 * here is read off docs/ai/components/tag-input.md,
 * docs/components/tag-input.md, and snice-tag-input.types.ts — never off the
 * component:
 *
 *   VALUE AND FORM LIFECYCLE (quoted from the docs):
 *   · "The `value` attribute parses JSON and backs `defaultValue`; live
 *     `value` is a separate cloned array."
 *   · "Adding/removing/restoring/assigning tags dirties live state. Pristine
 *     state follows default changes."
 *   · "The successful/restoration value is JSON, preserving commas and
 *     Unicode within tags."
 *   · "Reset/restoration are silent."
 *   · "A named host … contributes one JSON array string to `FormData`."
 *   · "More than a positive `maxTags` reports `tooLong`. Duplicate values
 *     while `allowDuplicates === false` report `customError`. Programmatic
 *     arrays remain visible and invalid so customers can correct them;
 *     insertion methods still prevent violating additions."
 *   · "Dynamic rules recalculate immediately."
 *   · "Disabled controls are omitted/barred. Readonly controls remain
 *     successful but are barred."
 *   · "Calculated errors mark the container/input … At capacity,
 *     reporting/focus targets the first remove action because the draft input
 *     is hidden."
 *
 *   PARTS: `base` (outer wrapper), `label`, `container` (tags + input),
 *   `tag`, `tag-text`, `input`, `suggestions` — the label part exists only
 *   with a label; the suggestions part only while an open list has matches;
 *   the tag parts once per live tag.
 *
 *   EVENTS: `tag-add -> { tag, value }`, `tag-remove ->
 *   { tag, index, value }`, `tag-change -> { value }` — "Emitted only by tag
 *   edits (`addTag()`, `removeTag()`, and the user actions that call them).
 *   Assigning `value`, `clear()`, reset, and restoration are silent."
 *
 *   KEYBOARD: "Enter: Add current input as tag (or select highlighted
 *   suggestion); Comma: Split input and add each part as a tag; Backspace on
 *   empty input: Remove last tag; ArrowUp/ArrowDown: Navigate suggestions;
 *   Escape: Close suggestions dropdown."
 *
 *   METHODS: addTag/removeTag/clear/focus/blur/checkValidity/reportValidity/
 *   setCustomValidity, with `focus()` documented as "Focus draft input or
 *   first remove action at capacity".
 *
 * happy-dom implements none of the ElementInternals form plumbing
 * (`tests/matrix/internals-mock.ts`), so the form oracle reads the recorder:
 * the "one JSON array string" claim is `setFormValue`'s recorded value, and
 * the barred claims are the recorded validity flags.
 */
import { mount, shadow, settle, text, type Shape } from '../matrix-utils';
import { exactPart, exactParts } from '../part-exact';

export const CHANNELS = ['attr', 'prop'] as const;
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from docs/ai/components/tag-input.md. */
export const DEFAULTS = {
  value: [] as string[],
  defaultValue: [] as string[],
  suggestions: [] as string[],
  maxTags: 0,
  allowDuplicates: false,
  placeholder: 'Add a tag...',
  disabled: false,
  readonly: false,
  label: '',
  name: '',
};

export interface TagInputCombo {
  /** Initial live tags: the JSON `value` attribute (attr) or `.value` (prop). */
  value: string[];
  label?: string;
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  name?: string;
  channel: Channel;
}

/** A value that exercises the documented JSON preservation guarantees. */
export const TRICKY_TAGS = ['A, comma', 'Züge', 'two words'];

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount a control the way a page author writes one.
 *
 * The ATTR channel authors the markup attributes the docs table lists
 * (`value` as JSON, `max-tags`, `allow-duplicates`, `placeholder`, `disabled`,
 * `readonly`, `label`, `name`); the PROP channel assigns typed properties once
 * the element is ready — `suggestions` has no attribute form and crosses this
 * way in every combo that needs it.
 */
export async function mountTagInput(combo: TagInputCombo): Promise<HTMLElement> {
  const attrs: Record<string, any> = {};
  if (combo.channel === 'attr') {
    if (combo.value.length) attrs.value = JSON.stringify(combo.value);
    if (combo.label !== undefined && combo.label !== '') attrs.label = combo.label;
    if (combo.placeholder !== undefined && combo.placeholder !== DEFAULTS.placeholder) {
      attrs.placeholder = combo.placeholder;
    }
    if (combo.maxTags !== undefined && combo.maxTags !== DEFAULTS.maxTags) attrs['max-tags'] = combo.maxTags;
    if (combo.allowDuplicates) attrs['allow-duplicates'] = true;
    if (combo.disabled) attrs.disabled = true;
    if (combo.readonly) attrs.readonly = true;
    if (combo.name) attrs.name = combo.name;
    const el = await mount<HTMLElement>('snice-tag-input', attrs);
    return el;
  }
  const el = await mount<HTMLElement>('snice-tag-input', {});
  const target = el as any;
  // The documented JavaScript authoring pattern: "set initial tags via
  // JavaScript — tagInput.value = [...]".
  target.value = combo.value;
  if (combo.label !== undefined) target.label = combo.label;
  if (combo.placeholder !== undefined) target.placeholder = combo.placeholder;
  if (combo.maxTags !== undefined) target.maxTags = combo.maxTags;
  if (combo.allowDuplicates !== undefined) target.allowDuplicates = combo.allowDuplicates;
  if (combo.disabled !== undefined) target.disabled = combo.disabled;
  if (combo.readonly !== undefined) target.readonly = combo.readonly;
  if (combo.name !== undefined) target.name = combo.name;
  await settle(el, 10);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function draftInput(el: HTMLElement): HTMLInputElement | null {
  return shadow(el).querySelector<HTMLInputElement>('.tag-input-field');
}

export function tagChips(el: HTMLElement): HTMLElement[] {
  // `tag`/`tag-text` share a prefix, so the exact-token lookup is mandatory
  // (see tests/matrix/part-exact.ts).
  return exactParts<HTMLElement>(el, 'tag');
}

export function removeButtons(el: HTMLElement): HTMLButtonElement[] {
  return [...shadow(el).querySelectorAll<HTMLButtonElement>('.tag-remove')];
}

export function suggestionItems(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('.tag-suggestion-item')];
}

// ── The shape oracle ────────────────────────────────────────────────────────

/**
 * The DOCUMENTED shape for a combo — the "expected" side of the oracle.
 *
 * The capacity rule is the docs' own: "At capacity … the draft input is
 * hidden", i.e. a positive `maxTags` that the value has reached removes the
 * draft field from an enabled control. What the docs guarantee about
 * disabled/readonly is the BARRED contract, so their structural observable is
 * phrased as "no enabled draft field" rather than presence or absence.
 */
export function expectedShape(combo: TagInputCombo): Shape {
  const enabled = !(combo.disabled ?? DEFAULTS.disabled) && !(combo.readonly ?? DEFAULTS.readonly);
  const maxTags = combo.maxTags ?? DEFAULTS.maxTags;
  const atCapacity = maxTags > 0 && combo.value.length >= maxTags;
  const placeholder = combo.placeholder ?? DEFAULTS.placeholder;
  return {
    hasBasePart: true,
    hasContainerPart: true,
    labelPart: combo.label ? combo.label : null,
    tagCount: combo.value.length,
    tagTexts: combo.value,
    tagTextParts: combo.value.length,
    // "the draft input is hidden" at capacity; barred controls have no ENABLED
    // draft field.
    enabledDraftInputs: enabled && !atCapacity ? 1 : 0,
    // The placeholder attribute is always rendered on the draft field; it
    // carries the documented text only while no tag hides it.
    placeholder: enabled && !atCapacity
      ? (combo.value.length === 0 ? placeholder : '')
      : null,
    suggestionsPart: 0,
  };
}

export function readShape(el: HTMLElement): Shape {
  const chips = tagChips(el);
  const label = exactPart(el, 'label');
  const inputs = [...shadow(el).querySelectorAll<HTMLInputElement>('.tag-input-field')];
  const enabledInputs = inputs.filter(input => !input.disabled && !input.readOnly);
  return {
    hasBasePart: !!exactPart(el, 'base'),
    hasContainerPart: !!exactPart(el, 'container'),
    labelPart: label ? text(label) : null,
    tagCount: chips.length,
    tagTexts: chips.map(chip => text(chip.querySelector('.tag-text'))),
    tagTextParts: chips.filter(chip => !!chip.querySelector('[part="tag-text"]')).length,
    enabledDraftInputs: enabledInputs.length,
    placeholder: enabledInputs.length ? enabledInputs[0].getAttribute('placeholder') : null,
    suggestionsPart: exactParts(el, 'suggestions').length,
  };
}

// ── The form oracle (through the internals recorder) ────────────────────────

/**
 * The DOCUMENTED constraint state: `tooLong` for "more than a positive
 * maxTags", `customError` for duplicate values while `allowDuplicates ===
 * false`, both cleared while barred ("Disabled controls are omitted/barred.
 * Readonly controls remain successful but are barred" — a barred control
 * reports no constraint errors). `willValidate` is false exactly when barred.
 */
export function expectedValidity(combo: TagInputCombo, value: string[]): Shape {
  const barred = (combo.disabled ?? false) || (combo.readonly ?? false);
  const maxTags = combo.maxTags ?? DEFAULTS.maxTags;
  const allowDuplicates = combo.allowDuplicates ?? DEFAULTS.allowDuplicates;
  return {
    barred,
    tooLong: !barred && maxTags > 0 && value.length > maxTags,
    customError: !barred && !allowDuplicates && new Set(value).size !== value.length,
    'willValidate': !barred,
    submitted: JSON.stringify(value),
  };
}

// ── The event oracle ────────────────────────────────────────────────────────

/**
 * The DOCUMENTED event sequence for an entry: `tag-add` then `tag-change`
 * ("A tag was added", "A tag was added or removed"), each carrying the
 * documented payload with the value AFTER the edit.
 */
export function expectedAddSequence(tag: string, valueAfter: string[]): string[] {
  return [
    `tag-add:${JSON.stringify({ tag, value: valueAfter })}`,
    `tag-change:${JSON.stringify({ value: valueAfter })}`,
  ];
}

export function expectedRemoveSequence(tag: string, index: number, valueAfter: string[]): string[] {
  return [
    `tag-remove:${JSON.stringify({ tag, index, value: valueAfter })}`,
    `tag-change:${JSON.stringify({ value: valueAfter })}`,
  ];
}

/** Record the three documented events as printable `type:detail` strings. */
export function recordEvents(el: HTMLElement): {
  seen: string[];
  types: () => string[];
  stop: () => void;
} {
  const seen: string[] = [];
  const types: string[] = [];
  const names = ['tag-add', 'tag-remove', 'tag-change'] as const;
  const handlers = names.map(name => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      seen.push(`${name}:${JSON.stringify(detail)}`);
      types.push(name);
    };
    el.addEventListener(name, handler);
    return { name, handler };
  });
  return {
    seen,
    types: () => [...types],
    stop: () => handlers.forEach(({ name, handler }) => el.removeEventListener(name, handler)),
  };
}

// ── Interaction helpers ─────────────────────────────────────────────────────

/** Type into the draft field the way a user's keystrokes do. */
export function typeDraft(el: HTMLElement, value: string): void {
  const input = draftInput(el);
  if (!input) throw new Error('no draft input to type into');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

/** A keydown on the draft field, as a real key event. */
export function pressDraft(el: HTMLElement, key: string): void {
  const input = draftInput(el);
  input?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** Type `query` into the draft field and let the suggestion list settle. */
export async function typeAndSettle(el: HTMLElement, query: string): Promise<void> {
  typeDraft(el, query);
  await settle(el, 10);
}
