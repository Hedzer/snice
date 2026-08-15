/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-date-time-picker feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts`: expectations
 * are DERIVED from the documented contract (docs/ai/components/date-time-picker.md
 * plus snice-date-time-picker.types.ts), a reader pulls the ACTUAL facts out of
 * the rendered control, and a combo collects EVERY violation before asserting
 * so one run tells the whole story.
 *
 * The documented contract this file encodes, clause by clause:
 *
 *   · Canonical form value — `showSeconds=false -> YYYY-MM-DDTHH:mm`,
 *     `showSeconds=true -> YYYY-MM-DDTHH:mm:ss`.
 *   · "Malformed/partial/impossible text stays visible, sets `badInput`, and
 *     contributes an empty form value."
 *   · "Date and time parts are strict and never roll" — February 30th does not
 *     become March 2nd, and 25:61 does not become the next day.
 *   · "`dateFormat` and `timeFormat` control display/input presentation only;
 *     canonical form submission stays local ISO syntax."
 *   · Validity mapping: required empty -> `valueMissing`; partial/malformed/
 *     impossible -> `badInput`; before `min` -> `rangeUnderflow`; after `max`
 *     -> `rangeOverflow`; custom message -> `customError`.
 *   · "Date-only `min` starts at `00:00:00`; date-only `max` includes
 *     `23:59:59`."
 *   · `disabled`: "omitted from FormData, barred validation". `readonly`:
 *     "submitted but barred". `loading`: "submitted but interaction/validation
 *     blocked".
 *   · Live/default: `value` is live and does not reflect; `defaultValue` is the
 *     `value` attribute and the reset default; "`form.reset()` restores
 *     `defaultValue` without customer events"; "Attribute/default changes update
 *     live state only while pristine".
 *   · CSS parts: base, label, input, toggle, panel, calendar, time, clear,
 *     spinner, helper-text, error-text.
 *   · "Exactly one helper/error node is connected with `aria-describedby`; error
 *     replaces helper, uses `role="alert"`, and visual `invalid` mirrors to
 *     `aria-invalid`".
 *   · Naming: "External labels take precedence; fallback is `label`, then
 *     `Date and time`", and "The panel, calendar, hours, minutes, optional
 *     seconds, and period groups are named independently from the same
 *     accessible name".
 *
 * Deliberately NOT encoded: pixel geometry, the popup's top-layer behaviour, the
 * month-name spelling of the calendar header, and the zero-padding of a 12-hour
 * display hour — none of which the docs pin. Where the docs describe a FORMAT
 * without pinning every character (the 12-hour clock), the oracle asserts the
 * documented meaning (correct hour, correct period, round-trips back to the same
 * canonical value) rather than a string invented from observed output.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import { installInternalsMock, restoreInternalsMock, internalsFor, activeFlags } from '../internals-mock';
import '../../../packages/components/src/date-time-picker/snice-date-time-picker';
import type {
  SniceDateTimePickerElement,
  DateTimePickerDateFormat,
  DateTimePickerTimeFormat,
  DateTimePickerSize,
  DateTimePickerVariant,
} from '../../../packages/components/src/date-time-picker/snice-date-time-picker.types';

export { wait, createComponent, installInternalsMock, restoreInternalsMock, internalsFor, activeFlags };
export type { SniceDateTimePickerElement };

/** A Snice render is a microtask plus a queued task. */
export const SETTLE = 30;

// ── Dimensions (docs "Properties") ──────────────────────────────────────────

export const DATE_FORMATS: readonly DateTimePickerDateFormat[] = [
  'yyyy-mm-dd', 'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy/mm/dd',
  'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy',
];
export const TIME_FORMATS: readonly DateTimePickerTimeFormat[] = ['24h', '12h'];
export const SIZES: readonly DateTimePickerSize[] = ['small', 'medium', 'large'];
export const VARIANTS: readonly DateTimePickerVariant[] = ['dropdown', 'inline'];

/** The documented CSS parts, in the order the docs list them. */
export const PARTS = [
  'base', 'label', 'input', 'toggle', 'panel', 'calendar', 'time',
  'clear', 'spinner', 'helper-text', 'error-text',
] as const;

/** The documented events. */
export const EVENTS = [
  'datetime-change',
  'datetimepicker-focus', 'datetimepicker-blur',
  'datetimepicker-open', 'datetimepicker-close',
  'datetimepicker-clear',
] as const;

// ── The value dimension ─────────────────────────────────────────────────────

export interface ValueSample {
  /** Id fragment. */
  name: string;
  /** The string assigned to `value` / the `value` attribute. */
  input: string;
  /**
   * The documented parse: the local wall-clock parts, or `null` when the string
   * is "malformed/partial/impossible" and therefore contributes nothing.
   */
  parts: { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } | null;
  /** Why the sample exists — quoted from the docs where it is a documented rule. */
  why: string;
}

export const VALUES: readonly ValueSample[] = [
  {
    name: 'empty', input: '', parts: null,
    why: 'the documented default; an empty control is optional-valid and submits nothing',
  },
  {
    name: 'canonical', input: '2026-03-10T14:05',
    parts: { year: 2026, month: 3, day: 10, hours: 14, minutes: 5, seconds: 0 },
    why: 'the canonical minute-resolution form printed in the docs',
  },
  {
    name: 'canonical-seconds', input: '2026-03-10T14:05:30',
    parts: { year: 2026, month: 3, day: 10, hours: 14, minutes: 5, seconds: 30 },
    why: 'the canonical second-resolution form (showSeconds=true)',
  },
  {
    name: 'midnight', input: '2026-03-10T00:00',
    parts: { year: 2026, month: 3, day: 10, hours: 0, minutes: 0, seconds: 0 },
    why: '00:00 is 12 AM on a 12-hour clock — the edge the conversion gets wrong',
  },
  {
    name: 'noon', input: '2026-03-10T12:00',
    parts: { year: 2026, month: 3, day: 10, hours: 12, minutes: 0, seconds: 0 },
    why: '12:00 is 12 PM, the other end of the same edge',
  },
  {
    name: 'leap-day', input: '2024-02-29T23:59',
    parts: { year: 2024, month: 2, day: 29, hours: 23, minutes: 59, seconds: 0 },
    why: 'a real Gregorian leap day must be accepted',
  },
  {
    name: 'dst-gap', input: '2026-03-08T02:30',
    parts: { year: 2026, month: 3, day: 8, hours: 2, minutes: 30, seconds: 0 },
    why: '"DST gaps/repeated times remain unchanged local wall times"',
  },
  {
    name: 'partial-date-only', input: '2026-03-10', parts: null,
    why: '"Malformed/partial/... text stays visible, sets badInput"',
  },
  {
    name: 'partial-no-minutes', input: '2026-03-10T14', parts: null,
    why: 'partial time — the canonical form requires HH:mm',
  },
  {
    name: 'malformed', input: 'not a date at all', parts: null,
    why: '"Malformed ... text stays visible, sets badInput"',
  },
  {
    name: 'impossible-date', input: '2026-02-30T10:00', parts: null,
    why: '"Date and time parts are strict and never roll" — Feb 30 is not Mar 2',
  },
  {
    name: 'impossible-leap', input: '2026-02-29T10:00', parts: null,
    why: '2026 is not a leap year, so Feb 29 is impossible',
  },
  {
    name: 'impossible-time', input: '2026-03-10T25:61', parts: null,
    why: '"...never roll" — 25:61 is not 02:01 the next day',
  },
];

export const valueByName = (name: string): ValueSample => {
  const sample = VALUES.find(v => v.name === name);
  if (!sample) throw new Error(`no value sample named "${name}"`);
  return sample;
};

// ── Canonical + display derivation ──────────────────────────────────────────

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * The documented canonical form:
 *   showSeconds=false -> YYYY-MM-DDTHH:mm
 *   showSeconds=true  -> YYYY-MM-DDTHH:mm:ss
 */
export function canonical(parts: ValueSample['parts'], showSeconds: boolean): string {
  if (!parts) return '';
  const base = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`
    + `T${pad(parts.hours)}:${pad(parts.minutes)}`;
  return showSeconds ? `${base}:${pad(parts.seconds)}` : base;
}

/**
 * The date half of the visible text, read straight off the format name: the
 * format IS its own pattern (`mm/dd/yyyy` means two-digit month, slash,
 * two-digit day, slash, four-digit year), except `mmmm dd, yyyy`, whose `mmmm`
 * is the month's name.
 */
export function displayDate(
  parts: NonNullable<ValueSample['parts']>,
  format: DateTimePickerDateFormat,
): string {
  const yyyy = pad(parts.year, 4);
  const mm = pad(parts.month);
  const dd = pad(parts.day);
  switch (format) {
    case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
    case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
    case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
    case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
    case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
    case 'mmmm dd, yyyy': return `${MONTH_NAMES[parts.month - 1]} ${dd}, ${yyyy}`;
    case 'yyyy-mm-dd':
    default: return `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * The time half, as a MEANING rather than a string.
 *
 * `timeFormat: '12h'|'24h'` is documented, but the exact rendering of a
 * 12-hour hour (`2:05 PM` vs `02:05 PM`) is not, so this returns the numbers a
 * correct display must show and `timeMatches` accepts either padding. The 24h
 * form IS pinned by the canonical spec's own `HH:mm` shape.
 */
export interface ExpectedTime {
  hours12: number;
  period: 'AM' | 'PM';
  hours24: number;
  minutes: number;
  seconds: number;
}

export function expectedTime(parts: NonNullable<ValueSample['parts']>): ExpectedTime {
  const h = parts.hours;
  return {
    hours24: h,
    hours12: h % 12 === 0 ? 12 : h % 12,
    period: h >= 12 ? 'PM' : 'AM',
    minutes: parts.minutes,
    seconds: parts.seconds,
  };
}

/**
 * Does `text` show the documented time? Returns a complaint, or null when it
 * does.
 */
export function timeProblem(
  text: string,
  parts: NonNullable<ValueSample['parts']>,
  format: DateTimePickerTimeFormat,
  showSeconds: boolean,
): string | null {
  const want = expectedTime(parts);
  if (format === '24h') {
    const wanted = showSeconds
      ? `${pad(want.hours24)}:${pad(want.minutes)}:${pad(want.seconds)}`
      : `${pad(want.hours24)}:${pad(want.minutes)}`;
    return text === wanted ? null : `24h time reads "${text}", expected "${wanted}"`;
  }

  const match = showSeconds
    ? /^(\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/.exec(text)
    : /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(text);
  if (!match) {
    return `12h time reads "${text}", which is not a 12-hour clock reading`
      + `${showSeconds ? ' with seconds' : ''}`;
  }
  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = showSeconds ? Number(match[3]) : 0;
  const period = showSeconds ? match[4] : match[3];

  if (hour !== want.hours12) return `12h hour reads ${hour}, expected ${want.hours12} (from ${want.hours24}:00)`;
  if (minutes !== want.minutes) return `12h minutes read ${minutes}, expected ${want.minutes}`;
  if (showSeconds && seconds !== want.seconds) {
    return `12h seconds read ${seconds}, expected ${want.seconds}`;
  }
  if (period !== want.period) return `12h period reads "${period}", expected "${want.period}"`;
  return null;
}

/** Split the visible text into its date half and its time half. */
export function splitDisplay(text: string, format: DateTimePickerDateFormat): { date: string; time: string } {
  // Every documented format writes the date first, then a single space, then the
  // time; `mmmm dd, yyyy` is the only one whose date half contains spaces, so it
  // is split from the right by the number of spaces the time half can hold.
  const pieces = text.split(' ');
  const timeWords = /(AM|PM)$/.test(text) ? 2 : 1;
  return {
    date: pieces.slice(0, pieces.length - timeWords).join(' '),
    time: pieces.slice(pieces.length - timeWords).join(' '),
  };
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface MountSpec {
  attrs?: Record<string, string | number | boolean>;
  props?: Record<string, unknown>;
  /** Assigned AFTER connection, through the live `value` property. */
  liveValue?: string;
  /** Light-DOM markup wrapped around the picker (labels, forms, fieldsets). */
  wrapper?: (picker: HTMLElement) => HTMLElement;
}

const mounted: HTMLElement[] = [];

export async function mountPicker(spec: MountSpec = {}): Promise<SniceDateTimePickerElement> {
  let el: SniceDateTimePickerElement;
  if (spec.wrapper) {
    el = document.createElement('snice-date-time-picker') as SniceDateTimePickerElement;
    for (const [key, value] of Object.entries(spec.attrs ?? {})) {
      if (value === false || value == null) continue;
      el.setAttribute(key, value === true ? '' : String(value));
    }
    const root = spec.wrapper(el);
    document.body.appendChild(root);
    mounted.push(root);
    await (el as any).ready;
  } else {
    el = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', spec.attrs ?? {});
    mounted.push(el);
  }
  for (const [key, value] of Object.entries(spec.props ?? {})) {
    (el as any)[key] = value;
  }
  if (spec.liveValue !== undefined) el.value = spec.liveValue;
  await wait(SETTLE);
  return el;
}

/** Tear down everything `mountPicker` created. Call from `afterEach`. */
export function cleanupPickers(): void {
  while (mounted.length) mounted.pop()!.remove();
  document.body.innerHTML = '';
}

// ── Reading the rendered control ────────────────────────────────────────────

export function shadow(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-date-time-picker has no shadow root');
  return root;
}

export const part = <T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null =>
  shadow(el).querySelector<T>(`[part~="${name}"]`);

export const partsNamed = <T extends Element = HTMLElement>(el: HTMLElement, name: string): T[] =>
  [...shadow(el).querySelectorAll<T>(`[part~="${name}"]`)];

export const textOf = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const inputOf = (el: HTMLElement): HTMLInputElement | null =>
  part<HTMLInputElement>(el, 'input');

export interface PickerFacts {
  /** The text the user sees in the editable field. */
  visible: string;
  /** The live `value` property. */
  value: string;
  /** The reset default. */
  defaultValue: string;
  /** The `value` content attribute — documented NOT to follow the live value. */
  valueAttribute: string | null;
  /** What the control contributes to a submission. */
  formValue: File | string | FormData | null;
  /** Which validity flags are set, sorted. */
  flags: string[];
  validationMessage: string;
  /** Which documented parts are present. */
  presentParts: string[];
  ariaInvalid: string | null;
  ariaDescribedby: string | null;
  /** The one described node's id, if it exists. */
  describedNodeIds: string[];
  helperRole: string | null;
  errorRole: string | null;
  inputDisabled: boolean;
  inputReadonly: boolean;
  inputRequired: boolean;
  /** `data-time-unit` of every time column the panel drew. */
  timeUnits: string[];
  /**
   * Whether the dropdown panel is SHOWN. The panel element is always in the
   * shadow tree; `hidden` is what opens and closes it, so mere presence of the
   * `panel` part answers nothing.
   */
  panelOpen: boolean;
  /**
   * Whether the clear affordance is SHOWN. Same story: the button is always
   * rendered and `display` is what reveals it.
   */
  clearVisible: boolean;
  /** The accessible name of the editable field. */
  inputName: string | null;
  /**
   * The composite group names the docs require to be independent: panel,
   * calendar, and one per time column.
   */
  groupNames: Record<string, string>;
}

export function readFacts(el: SniceDateTimePickerElement): PickerFacts {
  const root = shadow(el);
  const input = inputOf(el);
  const internals = internalsFor(el);
  const helper = part(el, 'helper-text');
  const error = part(el, 'error-text');
  const described = (input?.getAttribute('aria-describedby') ?? '').trim();

  return {
    visible: input?.value ?? '',
    value: el.value,
    defaultValue: el.defaultValue,
    valueAttribute: el.getAttribute('value'),
    formValue: internals.formValue,
    flags: activeFlags(el),
    validationMessage: internals.validationMessage,
    presentParts: PARTS.filter(name => !!part(el, name)),
    ariaInvalid: input?.getAttribute('aria-invalid') ?? null,
    ariaDescribedby: described || null,
    describedNodeIds: described
      ? described.split(/\s+/).filter(id => !!root.getElementById(id))
      : [],
    helperRole: helper?.getAttribute('role') ?? null,
    errorRole: error?.getAttribute('role') ?? null,
    inputDisabled: !!input?.disabled,
    inputReadonly: !!input?.readOnly,
    inputRequired: !!input?.required,
    timeUnits: [...root.querySelectorAll('[data-time-unit]')]
      .map(node => node.getAttribute('data-time-unit') ?? ''),
    panelOpen: (() => {
      const panel = part(el, 'panel');
      return !!panel && !panel.hasAttribute('hidden');
    })(),
    clearVisible: (() => {
      const clear = part<HTMLElement>(el, 'clear');
      return !!clear && clear.style.display !== 'none';
    })(),
    inputName: input?.getAttribute('aria-label') ?? null,
    groupNames: (() => {
      const names: Record<string, string> = {};
      const panel = part(el, 'panel');
      if (panel?.getAttribute('aria-label')) names.panel = panel.getAttribute('aria-label')!;
      const calendar = part(el, 'calendar');
      if (calendar?.getAttribute('aria-label')) names.calendar = calendar.getAttribute('aria-label')!;
      for (const group of root.querySelectorAll('[data-time-unit]')) {
        const unit = group.getAttribute('data-time-unit') ?? '?';
        names[unit] = group.getAttribute('aria-label') ?? '';
      }
      return names;
    })(),
  };
}

// ── Problem collection ──────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];
  say(message: string): void { this.list.push(message); }
  ok(condition: boolean, message: string): boolean {
    if (!condition) this.say(message);
    return condition;
  }
  eq(what: string, actual: unknown, expected: unknown): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.say(`${what}: ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The DISPLAY oracle. "dateFormat and timeFormat control display/input
 * presentation only; canonical form submission stays local ISO syntax."
 */
export function displayProblems(
  el: SniceDateTimePickerElement,
  sample: ValueSample,
  dateFormat: DateTimePickerDateFormat,
  timeFormat: DateTimePickerTimeFormat,
  showSeconds: boolean,
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  if (!sample.parts) {
    // "Malformed/partial/impossible text stays visible" — whatever the format,
    // an unparseable string is shown back to the author untouched.
    problems.eq('unparseable text stays visible', facts.visible, sample.input);
    problems.eq('unparseable value contributes nothing', facts.formValue, '');
    return problems;
  }

  const wantDate = displayDate(sample.parts, dateFormat);
  const split = splitDisplay(facts.visible, dateFormat);
  problems.eq(`date half under "${dateFormat}"`, split.date, wantDate);

  const timeComplaint = timeProblem(split.time, sample.parts, timeFormat, showSeconds);
  if (timeComplaint) problems.say(timeComplaint);

  // The submitted value is canonical whatever the display says.
  problems.eq('canonical form value', facts.formValue, canonical(sample.parts, showSeconds));

  return problems;
}

/**
 * The VALIDITY oracle, straight off the docs' mapping table.
 *
 *   required empty            -> valueMissing
 *   partial/malformed/impossible -> badInput
 *   before min                -> rangeUnderflow
 *   after max                 -> rangeOverflow
 *   custom message            -> customError
 *
 * `disabled` is "barred validation", and so are `readonly` and `loading`, so a
 * barred control reports no flags at all.
 */
export interface ValidityContext {
  required: boolean;
  min: string;
  max: string;
  barred: boolean;
  customMessage?: string;
}

/** Compare two canonical local datetimes as documented calendar order. */
function keyOf(text: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (!match) return null;
  const [y, mo, d, h, mi] = match.slice(1, 6).map(Number);
  const s = match[6] === undefined ? 0 : Number(match[6]);
  return ((((y * 13 + mo) * 32 + d) * 24 + h) * 60 + mi) * 60 + s;
}

/**
 * "Date-only `min` starts at `00:00:00`; date-only `max` includes `23:59:59`."
 * "Impossible constraints are ignored rather than normalized."
 */
function constraintKey(text: string, edge: 'min' | 'max'): number | null {
  if (!text) return null;
  const direct = keyOf(text);
  if (direct !== null) return direct;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!dateOnly) return null;
  const filled = edge === 'max'
    ? `${text}T23:59:59`
    : `${text}T00:00:00`;
  return keyOf(filled);
}

export function expectedFlags(sample: ValueSample, context: ValidityContext, showSeconds: boolean): string[] {
  if (context.barred) return [];

  const flags = new Set<string>();
  if (context.customMessage) flags.add('customError');

  const value = canonical(sample.parts, showSeconds);
  if (!sample.parts) {
    // An empty control is not bad input; a non-empty unparseable one is.
    if (sample.input !== '') flags.add('badInput');
    if (context.required) flags.add('valueMissing');
    return [...flags].sort();
  }

  if (context.required && !value) flags.add('valueMissing');

  const key = keyOf(value);
  const min = constraintKey(context.min, 'min');
  const max = constraintKey(context.max, 'max');
  if (key !== null && min !== null && key < min) flags.add('rangeUnderflow');
  if (key !== null && max !== null && key > max) flags.add('rangeOverflow');

  return [...flags].sort();
}

export function validityProblems(
  el: SniceDateTimePickerElement,
  sample: ValueSample,
  context: ValidityContext,
  showSeconds: boolean,
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  problems.eq('validity flags', facts.flags, expectedFlags(sample, context, showSeconds));

  // "Malformed/partial/impossible text ... contributes an empty form value",
  // and "readonly/loading: submitted".
  //
  // `disabled` is documented as "omitted from FormData", but that omission is
  // performed by the BROWSER for every disabled form-associated element,
  // whatever the control hands to `setFormValue`. happy-dom implements neither,
  // so asserting it here would be asserting an implementation strategy rather
  // than the documented behaviour. The real `new FormData(form)` check for
  // disabled lives in the visual tier (tests/live/matrix/date-time-picker),
  // where a real engine runs the real algorithm.
  problems.eq('form value', facts.formValue, canonical(sample.parts, showSeconds));

  return problems;
}

// ── Chrome, panel and naming oracles ────────────────────────────────────────

export interface ChromeSpec {
  variant: DateTimePickerVariant;
  label: string;
  helperText: string;
  errorText: string;
  loading: boolean;
  clearable: boolean;
  disabled: boolean;
  readonly: boolean;
  invalid: boolean;
  /** Whether the control currently holds visible text. */
  hasText: boolean;
}

/**
 * Which documented parts a combo must render.
 *
 * The docs list the parts without conditions, so this pins only the ones a
 * documented PROPERTY governs: `label` for the `label` property, `spinner` for
 * `loading`, and helper/error for their texts with "error replaces helper".
 * `base`, `panel`, `calendar` and `time` are the control's fixed anatomy. The
 * `input`/`toggle` pair belongs to the `dropdown` variant, the one the docs give
 * an "editable input" and a dropdown to toggle; the `inline` variant is
 * documented as focusing "the composite panel" instead, so nothing is claimed
 * about an input there.
 */
export function expectedParts(spec: ChromeSpec): string[] {
  const wanted = new Set<string>(['base', 'panel', 'calendar', 'time']);
  if (spec.label) wanted.add('label');
  if (spec.variant === 'dropdown') {
    wanted.add('input');
    wanted.add('toggle');
    wanted.add('clear');
    if (spec.loading) wanted.add('spinner');
  }
  if (spec.errorText) wanted.add('error-text');
  else if (spec.helperText) wanted.add('helper-text');
  return PARTS.filter(name => wanted.has(name));
}

/**
 * The CHROME oracle: which parts exist, whether the clear affordance is
 * actually offered, and the documented describedby/alert/aria-invalid rules.
 */
export function chromeProblems(el: SniceDateTimePickerElement, spec: ChromeSpec): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  problems.eq('rendered parts', facts.presentParts, expectedParts(spec));

  // `clearable` + something to clear = a clear affordance the user can see.
  // A disabled, form-disabled, loading or readonly control offers none, because
  // all four are documented as blocking interaction.
  if (spec.variant === 'dropdown') {
    const wantClear = spec.clearable && spec.hasText && !spec.disabled
      && !spec.readonly && !spec.loading;
    problems.eq('clear affordance offered', facts.clearVisible, wantClear);
  }

  // "Exactly one helper/error node is connected with aria-describedby; error
  // replaces helper, uses role="alert"".
  if (spec.variant === 'dropdown') {
    const described = spec.errorText || spec.helperText;
    problems.eq(
      'aria-describedby ids that resolve to a rendered node',
      facts.describedNodeIds.length,
      described ? 1 : 0,
    );
    if (!described) {
      problems.eq('aria-describedby with no helper or error', facts.ariaDescribedby, null);
    }
  }
  if (spec.errorText) {
    problems.eq('error node role', facts.errorRole, 'alert');
    problems.eq('helper node hidden while an error is shown', facts.helperRole, null);
  }

  // "visual `invalid` mirrors to `aria-invalid` without replacing native
  // validity APIs" — so aria-invalid is true whenever the author asked for it,
  // whatever the constraint validity says.
  if (spec.variant === 'dropdown' && spec.invalid) {
    problems.eq('aria-invalid mirrors the authored invalid state', facts.ariaInvalid, 'true');
  }

  return problems;
}

/**
 * The PANEL oracle. "All seven date formats, 12/24-hour modes, seconds, sizes,
 * dropdown/inline variants ... remain supported", and "The panel, calendar,
 * hours, minutes, optional seconds, and period groups are named independently
 * from the same accessible name."
 */
export function panelProblems(
  el: SniceDateTimePickerElement,
  timeFormat: DateTimePickerTimeFormat,
  showSeconds: boolean,
  accessibleName: string,
): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  // The documented time columns: hours and minutes always, seconds when
  // `showSeconds`, a period column only on a 12-hour clock.
  const wantUnits = ['hours', 'minutes'];
  if (showSeconds) wantUnits.push('seconds');
  if (timeFormat === '12h') wantUnits.push('period');
  problems.eq('time columns', facts.timeUnits, wantUnits);

  // Every documented group is named, from the same accessible name, and no two
  // groups share a name — that is what "named independently" buys a screen
  // reader moving between them.
  const wantGroups = ['panel', 'calendar', ...wantUnits];
  problems.eq('named groups', Object.keys(facts.groupNames).sort(), [...wantGroups].sort());

  for (const [group, name] of Object.entries(facts.groupNames)) {
    problems.ok(
      name.includes(accessibleName),
      `the ${group} group is named "${name}", which does not carry the control's`
      + ` accessible name "${accessibleName}"`,
    );
  }
  const distinct = new Set(Object.values(facts.groupNames));
  problems.eq(
    'group names are distinct',
    distinct.size,
    Object.keys(facts.groupNames).length,
  );

  return problems;
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

export function collectEvents(el: HTMLElement, types: readonly string[] = EVENTS): Seen[] {
  const seen: Seen[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export const sequence = (seen: Seen[]): string[] => seen.map(e => e.type);

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function typeInto(el: SniceDateTimePickerElement, text: string): void {
  const input = inputOf(el);
  if (!input) throw new Error('no input part rendered');
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

export function commit(el: SniceDateTimePickerElement): void {
  const input = inputOf(el);
  input?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}
