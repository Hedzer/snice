/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-date-range-picker feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/date-picker/date-picker-support.ts`: expectations
 * are DERIVED from the documented contract (docs/ai/components/
 * date-range-picker.md plus snice-date-range-picker.types.ts), readers pull the
 * ACTUAL facts off the rendered control, and a combo collects EVERY violation
 * before asserting so one run tells the whole story.
 *
 * The documented contract this file encodes, clause by clause:
 *
 *   · "`start` and `end` are current strings. Valid canonical or
 *     configured-format assignment is accepted without rewriting it."
 *   · "`defaultStart`/`defaultEnd` map to the `start`/`end` attributes and form
 *     the authored reset pair." — and "Assignment is silent, dirty, and does
 *     not change either content attribute."
 *   · "Assigning, selecting, clearing, or browser restoration dirties live
 *     state. Later default changes do not overwrite a dirty range."
 *   · "form.reset() clears dirtiness and silently restores both current
 *     defaults. A partial default remains partial and invalid when required."
 *   · "`format` controls visible text and formatted-string parsing. Changing
 *     it never changes already parsed live/default state or submitted values."
 *   · "Calendar and preset selection write live strings in the configured
 *     display format."
 *   · "Direct reversed assignments remain reversed and invalid.
 *     `selectRange(Date, Date)` preserves its selection convenience and orders
 *     reversed valid arguments."
 *   · "Each endpoint is strict local-calendar data: month-length and Gregorian
 *     leap-year failures never roll into another month."
 *   · "An impossible live/default/restored endpoint remains observable as its
 *     exact string, submits `''`, sets `badInput`, and never mutates its peer."
 *   · "Invalid `Date` arguments and presets with an impossible endpoint are
 *     ignored atomically without preview, mutation, close, or events."
 *   · Form: "An enabled picker with `name="booking"` contributes exactly two
 *     `FormData` entries: `booking-start` and `booking-end`"; "Each parseable
 *     endpoint is submitted as local-calendar `YYYY-MM-DD`, independent of the
 *     visible `format` and preserved live string"; "Empty/unparseable
 *     endpoints contribute `''`. A named optional empty picker still
 *     contributes both empty fields. Empty `name` contributes nothing";
 *     "`readonly` and `loading` retain submitted values"; "disabled ... are
 *     omitted" (the omission itself is the browser's doing — this tier asserts
 *     the values survive and validation is barred, and the VISUAL tier asserts
 *     the real `new FormData(form)`).
 *   · Validity: "Optional completely empty pair: valid"; "`required` +
 *     incomplete/invalid pair: `valueMissing` (with `badInput` for
 *     partial/malformed input)"; "Partial or unparseable endpoint:
 *     `badInput`"; "Reversed parseable range: `customError`; values are not
 *     silently normalized"; "`min`/`max`: inclusive bounds applied to both
 *     endpoints, using `rangeUnderflow`/`rangeOverflow`; out-of-range days are
 *     disabled"; "configured display-format strings remain accepted.
 *     Impossible constraints are ignored rather than normalized.";
 *     "`invalid` and `errorText` are visual presentation only".
 *   · Events: the seven `daterange-*` events, all bubbling and composed;
 *     "Clear emits `daterange-clear` before `daterange-change`; preset
 *     selection emits change before preset"; "Direct assignments, default
 *     changes, reset, and restoration are silent."
 *   · CSS parts: `input`, `calendar-toggle`, `clear`, `spinner`, `calendar`,
 *     `helper-text`, `error-text`.
 *   · Accessibility: "Required, effective disabledness, loading, and visual
 *     `aria-invalid` state are mirrored to the visible input"; "Helper/error
 *     content is referenced exactly once with `aria-describedby`; error
 *     replaces helper and has `role="alert"`"; "The popup is a separately
 *     named `<accessible name> calendar` group"; "External `<label for>` ...
 *     External labels take precedence; fallback is `label`, then
 *     `Date range`. Activation focuses without opening."
 *   · "`firstDayOfWeek: number = 0; // 0=Sunday`"; "columns: number = 1;
 *     supported layouts: 1 or 2".
 *   · Reflection (`docs/ai/properties.md`): authored attributes always exist;
 *     property assignments reflect unless equal to the documented default,
 *     and defaults are never reflected. `size` matters most here — the
 *     calendar stylesheet selects `:host([size=…])`.
 *
 * Deliberately NOT encoded: popup geometry, top-layer paint, real FormData
 * plumbing, and how any of this LOOKS — those belong to
 * `tests/live/matrix/date-range-picker`, where a real engine runs them.
 */
import {
  mount, wait, settle, type Shape,
} from '../matrix-utils';
import { exactPart } from '../part-exact';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
} from '../internals-mock';
import '../../../packages/components/src/date-range-picker/snice-date-range-picker';
import type {
  SniceDateRangePickerElement, DateRangeFormat, DateRangePickerSize,
  DateRangePickerVariant, DateRangePreset,
} from '../../../packages/components/src/date-range-picker/snice-date-range-picker.types';

export {
  wait, installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
};
export type {
  SniceDateRangePickerElement, DateRangeFormat, DateRangePickerSize,
  DateRangePickerVariant, DateRangePreset,
};

/** A Snice render is a microtask plus a queued task; clear-button state lands
 *  on a nested microtask after that. */
export const SETTLE = 30;

export type Picker = SniceDateRangePickerElement;

// ── Dimensions (docs "API") ─────────────────────────────────────────────────

export const FORMATS: readonly DateRangeFormat[] = [
  'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd', 'yyyy/mm/dd',
  'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy',
];
export const SIZES: readonly DateRangePickerSize[] = ['small', 'medium', 'large'];
export const VARIANTS: readonly DateRangePickerVariant[] = ['outlined', 'filled', 'underlined'];

/** The documented CSS parts, in the order the docs list them. */
export const PARTS = [
  'input', 'calendar-toggle', 'clear', 'spinner', 'calendar',
  'helper-text', 'error-text',
] as const;

/** The documented events. */
export const EVENTS = [
  'daterange-change', 'daterange-preset', 'daterange-clear',
  'daterange-open', 'daterange-close', 'daterange-focus', 'daterange-blur',
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The weekday abbreviations, Sunday first — the `firstDayOfWeek = 0` origin. */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Documented defaults, from docs/ai/components/date-range-picker.md "API". */
export const DEFAULTS = {
  start: '',
  end: '',
  defaultStart: '',
  defaultEnd: '',
  format: 'mm/dd/yyyy' as DateRangeFormat,
  size: 'medium' as DateRangePickerSize,
  variant: 'outlined' as DateRangePickerVariant,
  placeholder: '',
  label: '',
  helperText: '',
  errorText: '',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  invalid: false,
  clearable: false,
  min: '',
  max: '',
  name: '',
  columns: 1,
  firstDayOfWeek: 0,
  showCalendar: false,
};

/** How a combo is authored: markup attributes, or post-connect JS assignment. */
export type Channel = 'attr' | 'prop';
export const CHANNELS: readonly Channel[] = ['attr', 'prop'];

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

// ── The endpoint parse oracle (pure, documented) ────────────────────────────

export interface DateParts { year: number; month: number; day: number }

/** Gregorian month length — the "strict local-calendar" authority. */
export function daysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

/** Strict field validation: no month/day rollover, Gregorian leap rules. */
function strictDate(year: number, month: number, day: number): DateParts | null {
  if (!Number.isInteger(year) || year < 1) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/**
 * The DOCUMENTED parse of one endpoint string under one format.
 *
 *   · "Accept canonical YYYY-MM-DD or the configured display format" —
 *     canonical is tried first and wins regardless of `format`;
 *   · the display formats are numeric with `/` AND `-` accepted ("numeric `/`
 *     and `-` separators remain accepted for compatibility" — the date-picker
 *     clause this component declares it keeps), except `mmmm dd, yyyy`, which
 *     is the month's name;
 *   · "Each endpoint is strict local-calendar data: month-length and Gregorian
 *     leap-year failures never roll into another month."
 */
export function parseEndpoint(text: string, format: DateRangeFormat): DateParts | null {
  if (!text) return null;
  const canonical = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(text);
  if (canonical) return strictDate(Number(canonical[1]), Number(canonical[2]), Number(canonical[3]));

  if (format === 'mmmm dd, yyyy') {
    const named = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4,})$/.exec(text);
    if (!named) return null;
    const month = MONTH_NAMES.findIndex(m => m.toLowerCase() === named[1].toLowerCase()) + 1;
    if (month === 0) return null;
    return strictDate(Number(named[3]), month, Number(named[2]));
  }

  // Field order read straight off the format NAME; both separators accepted.
  const orders: Record<string, RegExp> = {
    'mm/dd/yyyy': /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/,
    'dd/mm/yyyy': /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/,
    'mm-dd-yyyy': /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/,
    'dd-mm-yyyy': /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4,})$/,
    'yyyy/mm/dd': /^(\d{4,})[\/-](\d{1,2})[\/-](\d{1,2})$/,
  };
  const pattern = orders[format];
  if (!pattern) return null; // 'yyyy-mm-dd' display form IS the canonical form
  const match = pattern.exec(text);
  if (!match) return null;
  const [a, b, y] = match.slice(1).map(Number);
  return format.startsWith('dd')
    ? strictDate(y, b, a)
    : strictDate(y, a, b);
}

/** Local-calendar `YYYY-MM-DD`, or `''` for an unparseable endpoint. */
export function canonicalOf(parts: DateParts | null): string {
  return parts ? `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}` : '';
}

/**
 * The visible text, read straight off the format NAME (`dd/mm/yyyy` means
 * two-digit day, slash, two-digit month, slash, four-digit year), with the
 * documented range join: `"<start>  —  <end>"`.
 */
export function displayOf(parts: DateParts | null, format: DateRangeFormat): string {
  if (!parts) return '';
  const yyyy = pad(parts.year, 4);
  const mm = pad(parts.month);
  const dd = pad(parts.day);
  switch (format) {
    case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
    case 'yyyy-mm-dd': return `${yyyy}-${mm}-${dd}`;
    case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
    case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
    case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
    case 'mmmm dd, yyyy': return `${MONTH_NAMES[parts.month - 1]} ${dd}, ${yyyy}`;
    case 'mm/dd/yyyy':
    default: return `${mm}/${dd}/${yyyy}`;
  }
}

/** The same fields with the other numeric separator ("remain accepted"). */
export function withSwappedSeparator(text: string, format: DateRangeFormat): string | null {
  if (format === 'mmmm dd, yyyy' || format === 'yyyy-mm-dd') return null;
  return text.includes('/') ? text.replace(/\//g, '-') : text.replace(/-/g, '/');
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface MountSpec {
  /** Attributes in place before connection — the authored markup channel. */
  attrs?: Record<string, string | number | boolean>;
  /** Properties assigned after the element is ready — the JS channel. */
  props?: Record<string, unknown>;
  /** Live `start`/`end` assignments after everything else ("Assigning ...
   *  dirties live state"). */
  live?: { start?: string; end?: string };
}

const mounted: HTMLElement[] = [];

export async function mountRange(spec: MountSpec = {}): Promise<Picker> {
  const el = await mount<Picker>(
    'snice-date-range-picker',
    spec.attrs ?? {},
    '',
    spec.props ?? {},
  );
  if (spec.live) {
    if (spec.live.start !== undefined) el.start = spec.live.start;
    if (spec.live.end !== undefined) el.end = spec.live.end;
  }
  await settle(el, SETTLE);
  mounted.push(el);
  return el;
}

/** Tear down everything `mountRange` created. Call from `afterEach`. */
export function cleanupRanges(): void {
  while (mounted.length) mounted.pop()!.remove();
  document.body.innerHTML = '';
}

// ── Reading the rendered control ────────────────────────────────────────────

export function shadowOf(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-date-range-picker has no shadow root');
  return root;
}

/**
 * EXACT part lookup. `[part~="calendar"]` also matches the hyphen-prefixed
 * `calendar-toggle` in happy-dom (see ../part-exact.ts), and the toggle comes
 * FIRST in the shadow tree — so every part read here is token-exact.
 */
export const part = exactPart;

export const textOf = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const inputOf = (el: HTMLElement): HTMLInputElement | null =>
  part<HTMLInputElement>(el, 'input');

export const toggleOf = (el: HTMLElement): HTMLButtonElement | null =>
  part<HTMLButtonElement>(el, 'calendar-toggle');

export const clearButtonOf = (el: HTMLElement): HTMLButtonElement | null =>
  part<HTMLButtonElement>(el, 'clear');

export const calendarOf = (el: HTMLElement): HTMLElement | null =>
  part<HTMLElement>(el, 'calendar');

/** Every rendered calendar day button, in grid order. */
export const dayButtons = (el: HTMLElement): HTMLButtonElement[] =>
  [...shadowOf(el).querySelectorAll<HTMLButtonElement>('[data-date]')];

/** The weekday column headers, left to right. */
export const weekdayHeaders = (el: HTMLElement): string[] =>
  [...shadowOf(el).querySelectorAll('.weekday')].map(node => textOf(node));

/** The combo every shape assertion is written against. */
export interface RangeCombo {
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  hasValue: boolean;
  helperText: string;
  errorText: string;
  channel: Channel;
}

/**
 * The DOCUMENTED shadow shape for a combo — the "expected" side of the oracle.
 *
 * `hasValue` means both endpoints hold the same parseable day, so the clear
 * affordance's documented precondition ("something to clear") holds.
 */
export function expectedShape(combo: RangeCombo): Shape {
  const interactionBarred = combo.disabled || combo.loading;
  return {
    hasInput: true,
    hasToggle: true,
    hasClearPart: true,
    hasCalendarPart: true,
    spinnerPart: combo.loading,
    helperPart: !!combo.helperText && !combo.errorText,
    errorPart: !!combo.errorText,
    // "Required, effective disabledness, loading ... mirrored to the visible
    // input" — readonly mirrors to the toggle/clear instead (below).
    inputDisabled: interactionBarred,
    inputRequired: combo.required,
    toggleDisabled: interactionBarred || combo.readonly,
    // Clear shows only when `clearable`, something is held, and the control
    // can actually be edited.
    clearVisible: combo.hasValue && combo.clearable && !interactionBarred && !combo.readonly,
    // "Enter/Space opens from the range input" — nothing is open on mount.
    calendarOpen: false,
    // visual aria-invalid mirrors `invalid` (no constraint error in a
    // well-formed combo).
    ariaInvalid: combo.invalid ? 'true' : 'false',
    described: !!(combo.helperText || combo.errorText),
    errorRole: combo.errorText ? 'alert' : null,
  };
}

export function readShape(el: HTMLElement): Shape {
  const root = shadowOf(el);
  const input = inputOf(el);
  const toggle = toggleOf(el);
  const clear = clearButtonOf(el);
  const calendar = calendarOf(el);
  const helper = part(el, 'helper-text');
  const error = part(el, 'error-text');
  const described = (input?.getAttribute('aria-describedby') ?? '').trim();

  return {
    hasInput: !!input,
    hasToggle: !!toggle,
    hasClearPart: !!clear,
    hasCalendarPart: !!calendar,
    spinnerPart: !!part(el, 'spinner'),
    helperPart: !!helper,
    errorPart: !!error,
    inputDisabled: !!input?.disabled,
    inputRequired: !!input?.required,
    toggleDisabled: !!toggle?.disabled,
    clearVisible: (() => {
      if (!clear) return false;
      return clear.style.display !== 'none' && !clear.hasAttribute('hidden');
    })(),
    calendarOpen: !!calendar && !calendar.hasAttribute('hidden'),
    ariaInvalid: input?.getAttribute('aria-invalid') ?? null,
    described: !!described,
    describedResolves: described
      ? described.split(/\s+/).filter(id => !!root.getElementById(id)).length === 1
      : false,
    errorRole: error?.getAttribute('role') ?? null,
  };
}

/**
 * The DOCUMENTED axis state: property truth for every axis, plus the attribute
 * the stylesheet keys on (`:host([size=…]) .calendar` among others).
 * properties.md: authored attributes always exist; property assignments
 * reflect unless equal to the documented default; defaults never reflect.
 */
export function expectedAxes(combo: {
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  required: boolean;
  invalid: boolean;
  clearable: boolean;
  defaultStart?: string;
  defaultEnd?: string;
  channel: Channel;
}): Shape {
  const reflected = (value: unknown, fallback: unknown) =>
    combo.channel === 'attr' || value !== fallback;
  return {
    'prop.size': combo.size,
    'prop.variant': combo.variant,
    'prop.disabled': combo.disabled,
    'prop.readonly': combo.readonly,
    'prop.loading': combo.loading,
    'prop.required': combo.required,
    'prop.invalid': combo.invalid,
    'prop.clearable': combo.clearable,
    'attr.size': reflected(combo.size, DEFAULTS.size) ? combo.size : undefined,
    'attr.variant': reflected(combo.variant, DEFAULTS.variant) ? combo.variant : undefined,
    'attr.disabled': reflected(combo.disabled, false) ? true : undefined,
    'attr.readonly': reflected(combo.readonly, false) ? true : undefined,
    'attr.loading': reflected(combo.loading, false) ? true : undefined,
    'attr.required': reflected(combo.required, false) ? true : undefined,
    'attr.invalid': reflected(combo.invalid, false) ? true : undefined,
    'attr.clearable': reflected(combo.clearable, false) ? true : undefined,
    // `defaultStart`/`defaultEnd` ARE the `start`/`end` attributes; a live
    // assignment never touches them.
    'attr.start': combo.defaultStart
      ? (reflected(combo.defaultStart, '') ? combo.defaultStart : undefined)
      : undefined,
    'attr.end': combo.defaultEnd
      ? (reflected(combo.defaultEnd, '') ? combo.defaultEnd : undefined)
      : undefined,
  };
}

export function readAxes(
  el: HTMLElement,
  combo: Parameters<typeof expectedAxes>[0],
): Shape {
  const any = el as any;
  const reflected = (value: unknown, fallback: unknown) =>
    combo.channel === 'attr' || value !== fallback;
  return {
    'prop.size': any.size,
    'prop.variant': any.variant,
    'prop.disabled': any.disabled,
    'prop.readonly': any.readonly,
    'prop.loading': any.loading,
    'prop.required': any.required,
    'prop.invalid': any.invalid,
    'prop.clearable': any.clearable,
    'attr.size': reflected(combo.size, DEFAULTS.size) ? el.getAttribute('size') : undefined,
    'attr.variant': reflected(combo.variant, DEFAULTS.variant) ? el.getAttribute('variant') : undefined,
    'attr.disabled': reflected(combo.disabled, false) ? el.hasAttribute('disabled') : undefined,
    'attr.readonly': reflected(combo.readonly, false) ? el.hasAttribute('readonly') : undefined,
    'attr.loading': reflected(combo.loading, false) ? el.hasAttribute('loading') : undefined,
    'attr.required': reflected(combo.required, false) ? el.hasAttribute('required') : undefined,
    'attr.invalid': reflected(combo.invalid, false) ? el.hasAttribute('invalid') : undefined,
    'attr.clearable': reflected(combo.clearable, false) ? el.hasAttribute('clearable') : undefined,
    'attr.start': combo.defaultStart
      ? (reflected(combo.defaultStart, '') ? el.getAttribute('start') : undefined)
      : undefined,
    'attr.end': combo.defaultEnd
      ? (reflected(combo.defaultEnd, '') ? el.getAttribute('end') : undefined)
      : undefined,
  };
}

// ── The form-value oracle ───────────────────────────────────────────────────

/**
 * "An enabled picker with `name="booking"` contributes exactly two FormData
 * entries: `booking-start` and `booking-end`." Read off the recorded
 * `setFormValue` payload — the matrix stand-in for `new FormData(form)`
 * (happy-dom implements none of that plumbing; see internals-mock.ts).
 */
export function formEntries(el: Picker): Array<[string, string]> | null {
  const value = internalsFor(el).formValue;
  if (value === null || typeof value === 'string') return null;
  return [...(value as FormData).entries()].map(([k, v]) => [k, String(v)] as [string, string]);
}

/**
 * The documented submission for a live (start, end) pair under a format:
 * `{name}-start`/`{name}-end`, each canonical or `''`, in that order — or
 * `null` when `name` is empty ("Empty `name` contributes nothing").
 */
export function expectedEntries(
  name: string,
  start: string,
  end: string,
  format: DateRangeFormat,
): Array<[string, string]> | null {
  if (!name) return null;
  return [
    [`${name}-start`, canonicalOf(parseEndpoint(start, format))],
    [`${name}-end`, canonicalOf(parseEndpoint(end, format))],
  ];
}

// ── The validity oracle ─────────────────────────────────────────────────────

export interface ValidityContext {
  required: boolean;
  min: string;
  max: string;
  format: DateRangeFormat;
  /** barred = "disabled ... and readonly/loading are barred from validation" */
  barred: boolean;
  customMessage?: string;
}

/**
 * The documented flag mapping for a live (start, end) pair:
 *
 *   optional + completely empty                 -> valid
 *   required + incomplete/invalid pair          -> valueMissing (+badInput
 *                                                  for partial/malformed)
 *   partial or unparseable endpoint             -> badInput
 *   reversed parseable range                    -> customError
 *   endpoint outside min/max (inclusive bounds) -> rangeUnderflow/Overflow
 *   impossible constraints                      -> ignored
 */
export function expectedFlags(
  start: string,
  end: string,
  context: ValidityContext,
): string[] {
  if (context.barred) return [];

  const startParts = parseEndpoint(start, context.format);
  const endParts = parseEndpoint(end, context.format);
  const complete = !!startParts && !!endParts;

  const flags = new Set<string>();
  if (context.customMessage) flags.add('customError');
  if ((!!start && !startParts) || (!!end && !endParts)) flags.add('badInput');
  // "Partial or unparseable endpoint: badInput" — one endpoint held, the other
  // empty, is partial.
  if (!!start !== !!end) flags.add('badInput');
  if (context.required && !complete) flags.add('valueMissing');
  if (complete && startParts!.year !== 0) {
    const s = new Date(startParts!.year, startParts!.month - 1, startParts!.day).getTime();
    const e = new Date(endParts!.year, endParts!.month - 1, endParts!.day).getTime();
    // "Reversed parseable range: customError"
    if (s > e) flags.add('customError');
    // "min/max: inclusive bounds applied to both endpoints"
    const bound = (text: string): number | null => {
      const parts = text ? parseEndpoint(text, context.format) : null;
      return parts ? new Date(parts.year, parts.month - 1, parts.day).getTime() : null;
    };
    const min = bound(context.min);
    const max = bound(context.max);
    if (min !== null && (s < min || e < min)) flags.add('rangeUnderflow');
    if (max !== null && (s > max || e > max)) flags.add('rangeOverflow');
  }
  return [...flags].sort();
}

// ── Calendar derivations ────────────────────────────────────────────────────

/** The weekday headers for a `firstDayOfWeek`, in painted order. */
export function expectedWeekdays(firstDayOfWeek: number): string[] {
  const days = [...DAY_NAMES];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(days.shift()!);
  return days;
}

/**
 * The canonical `data-date` strings a month's grid must render, in order —
 * every day of the month, once, and nothing outside it.
 */
export function expectedMonthDates(year: number, month1Based: number): string[] {
  return Array.from({ length: daysInMonth(year, month1Based) }, (_, i) =>
    `${pad(year, 4)}-${pad(month1Based)}-${pad(i + 1)}`);
}

/**
 * "out-of-range days are disabled", with INCLUSIVE boundaries. An impossible
 * constraint is ignored ("Impossible constraints are ignored rather than
 * normalized"), so it disables nothing.
 */
export function expectedDisabledDates(
  year: number,
  month1Based: number,
  min: string,
  max: string,
  format: DateRangeFormat = 'yyyy-mm-dd',
): string[] {
  const key = (parts: DateParts | null) =>
    parts ? new Date(parts.year, parts.month - 1, parts.day).getTime() : null;
  const minKey = min ? key(parseEndpoint(min, format)) : null;
  const maxKey = max ? key(parseEndpoint(max, format)) : null;
  return expectedMonthDates(year, month1Based).filter(date => {
    const [y, m, d] = date.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    return (minKey !== null && t < minKey) || (maxKey !== null && t > maxKey);
  });
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** Click a shadow node the way a user's pointer would. */
export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

/** Keydown on a shadow node — the Enter/Space/Escape activation paths. */
export function press(node: Element | null | undefined, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** Hover a shadow node, the way a range preview or preset preview begins. */
export function hover(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
}

/**
 * Point the OPEN calendar's view at a month without leaving a selection.
 *
 * `open()` anchors the view on the held start, else on TODAY — which would
 * make a March journey depend on the machine's clock. Assigning a March start
 * and clearing it leaves the view on March with an empty selection, so the
 * next day click is a FRESH first click exactly as the two-click journey
 * documents. Call before `open()` and before `recordEvents`.
 */
export async function viewOn(el: Picker, iso: string): Promise<void> {
  el.start = iso;
  await settle(el, SETTLE);
  el.clear();
  await settle(el, SETTLE);
}

export interface Recorded { type: string; detail: any }

/** Record every documented event, in dispatch ORDER. */
export function recordEvents(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Just the event names, in order — the shape most assertions want. */
export const namesOf = (seen: Recorded[]): string[] => seen.map(entry => entry.type);
