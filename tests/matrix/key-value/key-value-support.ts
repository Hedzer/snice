/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-key-value matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * snice-key-value is the most stateful component in this batch: a
 * form-associated ordered string-pair editor with a display model (rows) that
 * is deliberately NOT the same as its data model (entries). Everything encoded
 * here is transcribed from docs/ai/components/key-value.md,
 * docs/components/key-value.md and snice-key-value.types.ts.
 *
 *   SERIALIZATION — "Canonical emitted/submitted shape"
 *   · every output entry carries the exact string fields `key`, `value`,
 *     `description`; the empty editor is `'[]'`;
 *   · "Duplicate keys are preserved with their order, descriptions, and
 *     Unicode." — so the value is an ordered ARRAY, never a keyed object;
 *   · "Omits wholly empty display rows." — the trailing editing row is display,
 *     not data;
 *   · "Accepts old string-valued object JSON input; immediately normalizes to
 *     array.";
 *   · "Malformed JSON/schema is retained in live `value`, sets `badInput`, and
 *     remains raw `FormData`."
 *
 *   ROWS — the display model
 *   · `rows: number = 0  // 0 variable; >0 exact fixed count`;
 *   · "Variable + auto-expand: trailing empty display row, never serialized.";
 *   · "Fixed `rows`: exact count, no delete/auto-expand; add fills empty row;
 *     full add is no-op.";
 *   · "Lowering fixed `rows` drops entries beyond new count."
 *
 *   VALIDATION
 *   · "`valueMissing`: `required` and no meaningful rows.";
 *   · "`badInput`: malformed serialized state or meaningful row with
 *     blank/whitespace key.";
 *   · "Empty value is valid when key exists. Value-only/description-only row is
 *     invalid.";
 *   · "`customError`: non-empty `setCustomValidity()`.";
 *   · "Invalid key gets `aria-invalid`; message uses `part="error"` and
 *     `role="alert"`."
 *
 *   BARRIERS
 *   · "Disabled/fieldset-disabled: blocked, omitted, validation-barred;
 *     authored `disabled` unchanged.";
 *   · "Readonly/view: editing and validation barred; value still submitted;
 *     copy allowed."
 *
 *   EVENTS
 *   · `kv-add`/`kv-remove`/`kv-change`/`kv-copy` with the documented details,
 *     and "No user events: `setItems`, property assignment, slot sync, reset,
 *     restore."
 */
import { shadow, settle, wait, type Shape } from '../matrix-utils';
import { exactPart, exactPartIn, exactParts, partTokens } from '../part-exact';
import type { KeyValueItem } from
  '../../../packages/components/src/key-value/snice-key-value.types';

export type { KeyValueItem };

export const VARIANTS = ['default', 'compact'] as const;
export const MODES = ['edit', 'view'] as const;
export type Variant = typeof VARIANTS[number];
export type Mode = typeof MODES[number];

/** Documented defaults, from the property block in both doc versions. */
export const DEFAULTS = {
  value: '[]',
  defaultValue: '[]',
  label: '',
  autoExpand: true,
  rows: 0,
  showDescription: false,
  keyPlaceholder: 'Key',
  valuePlaceholder: 'Value',
  disabled: false,
  readonly: false,
  required: false,
  name: '',
  variant: 'default' as Variant,
  mode: 'edit' as Mode,
  showCopy: false,
};

/** Every part name the docs list. */
export const DOCUMENTED_PARTS = [
  'base', 'title', 'copy-button', 'rows', 'row',
  'key-input', 'value-input', 'description-input', 'delete-button', 'error',
  'view-row', 'view-key', 'view-value', 'view-desc', 'empty',
];

// ── The documented data model ───────────────────────────────────────────────

export const EMPTY_ROW: KeyValueItem = { key: '', value: '', description: '' };

/** "Omits wholly empty display rows" — the definition of an empty row. */
export function isEmptyRow(item: KeyValueItem | undefined): boolean {
  if (!item) return true;
  return !item.key && !item.value && !(item.description ?? '').trim();
}

/** Every field is an exact string; `description` defaults to the empty one. */
export function canonical(item: Partial<KeyValueItem>): KeyValueItem {
  return {
    key: String(item.key ?? ''),
    value: String(item.value ?? ''),
    description: String(item.description ?? ''),
  };
}

/** "Canonical emitted/submitted shape" — the string a form actually carries. */
export function serialize(items: Array<Partial<KeyValueItem>>): string {
  return JSON.stringify(items.map(canonical));
}

/** The meaningful entries of a display list — what `getItems()` returns. */
export function dataItems(rows: KeyValueItem[]): KeyValueItem[] {
  return rows.filter(row => !isEmptyRow(row));
}

/**
 * The DOCUMENTED display model: how many rows an editor shows for a given data
 * list under a given row configuration.
 *
 *   · "Fixed `rows`: exact count" — pad up, and trim beyond the count
 *     ("Lowering fixed `rows` drops entries beyond new count").
 *   · "Variable + auto-expand: trailing empty display row" — exactly one, so a
 *     list already ending in an empty row does not grow a second.
 *   · An editor always offers somewhere to type: with no data, no fixed count
 *     and no auto-expand, the one row it shows is the row the user needs.
 */
export function expectedRows(
  items: KeyValueItem[], rows: number, autoExpand: boolean,
): KeyValueItem[] {
  let display = items.map(canonical);
  if (rows > 0) {
    while (display.length < rows) display.push({ ...EMPTY_ROW });
    if (display.length > rows) display = display.slice(0, rows);
  } else if (autoExpand) {
    if (!(display.length > 0 && isEmptyRow(display[display.length - 1]))) {
      display.push({ ...EMPTY_ROW });
    }
  }
  if (display.length === 0) display.push({ ...EMPTY_ROW });
  return display;
}

/**
 * "Accepts old string-valued object JSON input; immediately normalizes to
 * array." Returns `null` for anything the documented schema rejects — which is
 * the `badInput` case, not a throw.
 */
export function parseDocumented(serialized: string): KeyValueItem[] | null {
  if (serialized === '') return [];
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { return null; }

  if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.some(([, value]) => typeof value !== 'string')) return null;
    return entries.map(([key, value]) => ({ key, value: value as string, description: '' }));
  }
  if (!Array.isArray(parsed)) return null;

  const items: KeyValueItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const record = entry as Record<string, unknown>;
    if (Object.keys(record).some(key => !['key', 'value', 'description'].includes(key))) return null;
    if (typeof record.key !== 'string' || typeof record.value !== 'string') return null;
    if (record.description !== undefined && typeof record.description !== 'string') return null;
    items.push({
      key: record.key,
      value: record.value,
      description: (record.description as string) ?? '',
    });
  }
  return items;
}

// ── The documented validity ─────────────────────────────────────────────────

/** "meaningful row with blank/whitespace key" — the badInput row test. */
export function isMalformedRow(item: KeyValueItem): boolean {
  return !isEmptyRow(item) && item.key.trim().length === 0;
}

export interface ValidityInput {
  items: KeyValueItem[];
  required: boolean;
  parseError: boolean;
  customMessage: string;
  barred: boolean;
}

/** The validity flags the docs describe, as a sorted list of flag names. */
export function expectedFlags(input: ValidityInput): string[] {
  // "Readonly/view: … validation barred" and "Disabled … validation-barred".
  if (input.barred) return [];
  const meaningful = dataItems(input.items);
  const flags: string[] = [];
  if (input.parseError || meaningful.some(isMalformedRow)) flags.push('badInput');
  if (input.customMessage) flags.push('customError');
  if (input.required && meaningful.length === 0) flags.push('valueMissing');
  return flags.sort();
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface KeyValueVector {
  value?: string;
  label?: string;
  autoExpand?: boolean;
  rows?: number;
  showDescription?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  variant?: Variant;
  mode?: Mode;
  showCopy?: boolean;
}

const ATTRIBUTE_NAMES: Record<string, string> = {
  value: 'value',
  label: 'label',
  autoExpand: 'auto-expand',
  rows: 'rows',
  showDescription: 'show-description',
  keyPlaceholder: 'key-placeholder',
  valuePlaceholder: 'value-placeholder',
  disabled: 'disabled',
  readonly: 'readonly',
  required: 'required',
  name: 'name',
  variant: 'variant',
  mode: 'mode',
  showCopy: 'show-copy',
};

/**
 * Mount an editor the way a page author writes one: attributes and any
 * `<snice-kv-pair>` children in place BEFORE connection.
 *
 * The pre-connect ordering is load-bearing here, not tidiness: "Direct children
 * override all imperative mutation methods", and the component decides slot
 * mode during its first ready pass. Appending children afterwards measures a
 * different, un-authored control.
 */
export async function mountKeyValue(
  vector: KeyValueVector = {}, children = '',
): Promise<any> {
  const el = document.createElement('snice-key-value') as any;
  for (const [key, value] of Object.entries(vector)) {
    if (value === undefined) continue;
    const attribute = ATTRIBUTE_NAMES[key] ?? key;
    // Booleans are authored the way the docs spell them: BARE when true and
    // ABSENT when false. That spelling is not cosmetic — an attribute's
    // PRESENCE is what both the platform and the stylesheet read. A
    // form-associated custom element carrying `disabled` is disabled by the
    // engine whatever string the attribute holds, and the component's own
    // `:host([readonly]) .kv__delete { display: none }` rule fires for
    // `readonly="false"` just as it does for `readonly`. Writing `="false"`
    // would author the state it was trying to deny.
    //
    // The one exception is a boolean whose documented default is TRUE:
    // `autoExpand` cannot be turned off by omission, so it takes the explicit
    // string the documented converter has a rule for ("false" -> false).
    if (typeof value === 'boolean') {
      if (key === 'autoExpand') el.setAttribute(attribute, String(value));
      else if (value) el.setAttribute(attribute, '');
      continue;
    }
    el.setAttribute(attribute, String(value));
  }
  if (children) el.innerHTML = children;
  document.body.appendChild(el);
  await el.ready;
  await settle(el, 10);
  return el;
}

/** Let a mutation, an event, or a microtask-deferred validity pass land. */
export async function tick(el: any): Promise<void> {
  await settle(el, 10);
}

export { wait };

// ── Readers ─────────────────────────────────────────────────────────────────

// Every lookup here goes through `part-exact`, never through `[part~="…"]`.
// This component's part names share tokens and prefixes — `row`/`view-row`,
// `value-input`/`view-value` — and happy-dom's `~=` matches hyphenated
// neighbours, so a `~=` count would be a number the component never rendered.
export const basePart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'base');
export const titlePart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'title');
export const errorPart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'error');
export const emptyPart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'empty');
export const rowsPart = (el: HTMLElement) => exactPart<HTMLElement>(el, 'rows');
export const copyButton = (el: HTMLElement) => exactPart<HTMLButtonElement>(el, 'copy-button');

export const editRows = (el: HTMLElement) => exactParts<HTMLElement>(el, 'row');
export const viewRows = (el: HTMLElement) => exactParts<HTMLElement>(el, 'view-row');
export const keyInputs = (el: HTMLElement) => exactParts<HTMLInputElement>(el, 'key-input');
export const valueInputs = (el: HTMLElement) => exactParts<HTMLInputElement>(el, 'value-input');
export const descriptionInputs = (el: HTMLElement) =>
  exactParts<HTMLInputElement>(el, 'description-input');
export const deleteButtons = (el: HTMLElement) => exactParts<HTMLButtonElement>(el, 'delete-button');

export function partNames(el: HTMLElement): string[] {
  return [...new Set([...shadow(el).querySelectorAll('[part]')]
    .flatMap(node => partTokens(node)))].sort();
}

/** The rows an editor is DISPLAYING, read back off its inputs. */
export function readDisplayRows(el: HTMLElement): KeyValueItem[] {
  const keys = keyInputs(el);
  const values = valueInputs(el);
  const descriptions = descriptionInputs(el);
  return keys.map((input, index) => ({
    key: input.value,
    value: values[index]?.value ?? '',
    description: descriptions[index]?.value ?? '',
  }));
}

/** The rows a VIEW-mode editor is displaying, read back off its spans. */
export function readViewRows(el: HTMLElement): Array<{ key: string; value: string; description: string }> {
  return viewRows(el).map(row => ({
    key: exactPartIn(row, 'view-key')?.textContent ?? '',
    value: exactPartIn(row, 'view-value')?.textContent ?? '',
    description: exactPartIn(row, 'view-desc')?.textContent ?? '',
  }));
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The DOCUMENTED shape of an editor holding `items` under `vector`. Only the
 * keys a caller asks about are compared (see `expectShape`), so a slice can
 * grade the part of the shape it owns.
 */
export function expectedShape(vector: KeyValueVector, items: KeyValueItem[]): Shape {
  const mode = vector.mode ?? DEFAULTS.mode;
  const rows = vector.rows ?? DEFAULTS.rows;
  const autoExpand = vector.autoExpand ?? DEFAULTS.autoExpand;
  const meaningful = dataItems(items.map(canonical));
  const display = expectedRows(items, rows, autoExpand);
  const isView = mode === 'view';
  const isEmpty = isView && meaningful.length === 0;
  const barred = (vector.disabled ?? false) || (vector.readonly ?? false) || isView;
  const showDescription = vector.showDescription ?? DEFAULTS.showDescription;
  // A description that is not shown has no field to read it back from, so the
  // observable description of a row is empty unless `showDescription` renders
  // one. This masks the EXPECTATION, never the assertion: the data itself is
  // graded by `getItems()`/`value` in the serialization slice.
  const visible = (item: KeyValueItem): KeyValueItem =>
    (showDescription ? item : { ...item, description: '' });

  return {
    hasBase: true,
    // "`0` variable; `>0` exact fixed count", and the view mode shows data
    // rows only — the trailing editing row is display, not data.
    editRowCount: isView ? 0 : display.length,
    viewRowCount: isView ? meaningful.length : 0,
    displayRows: isView ? [] : display.map(visible),
    viewRowContent: isView ? meaningful.map(visible) : [],
    // The empty state is a VIEW-mode affordance: an editor always shows rows.
    hasEmpty: isEmpty,
    hasRowsPart: !isEmpty,
    hasTitle: !!(vector.label ?? DEFAULTS.label),
    titleText: vector.label
      ? `${vector.label}${vector.required ? ' *' : ''}`
      : null,
    // "Fixed `rows`: … no delete"; a barred editor offers no deletion either.
    deleteButtonCount: !isView && rows === 0 && !barred ? display.length : 0,
    // "showCopy" only has something to copy when there IS something.
    hasCopyButton: !!(vector.showCopy ?? DEFAULTS.showCopy) && meaningful.length > 0,
    // "showDescription" adds one input per displayed row.
    descriptionInputCount: !isView && showDescription ? display.length : 0,
    inputsDisabled: isView ? [] : display.map(() => vector.disabled ?? false),
    inputsReadOnly: isView ? [] : display.map(() => vector.readonly ?? false),
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const keys = keyInputs(el);
  return {
    hasBase: !!basePart(el),
    editRowCount: editRows(el).length,
    viewRowCount: viewRows(el).length,
    displayRows: readDisplayRows(el),
    viewRowContent: readViewRows(el),
    hasEmpty: !!emptyPart(el),
    hasRowsPart: !!rowsPart(el),
    hasTitle: !!titlePart(el),
    titleText: titlePart(el)
      ? (titlePart(el)!.textContent ?? '').replace(/\s+/g, ' ').trim()
      : null,
    deleteButtonCount: deleteButtons(el).length,
    hasCopyButton: !!copyButton(el),
    descriptionInputCount: descriptionInputs(el).length,
    inputsDisabled: keys.map(input => input.disabled),
    inputsReadOnly: keys.map(input => input.readOnly),
  };
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface CapturedKvEvent { type: string; detail: any }

/** Record the documented events in dispatch ORDER — order is part of the contract. */
export function recordEvents(el: HTMLElement): CapturedKvEvent[] {
  const seen: CapturedKvEvent[] = [];
  for (const type of ['kv-add', 'kv-remove', 'kv-change', 'kv-copy']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Type into a row's key/value/description field, as a user does. */
export function typeInto(
  el: HTMLElement, field: 'key' | 'value' | 'description', index: number, text: string,
): void {
  const inputs = field === 'key' ? keyInputs(el)
    : field === 'value' ? valueInputs(el)
      : descriptionInputs(el);
  const input = inputs[index];
  if (!input) return;
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}
