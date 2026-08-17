/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-time-picker feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as `tests/matrix/table/matrix-utils.ts` and its closest sibling,
 * `tests/matrix/date-time-picker/date-time-picker-support.ts`: expectations are
 * DERIVED from the documented contract (docs/ai/components/time-picker.md plus
 * snice-time-picker.types.ts), a reader pulls the ACTUAL facts out of the
 * rendered control, and a combo collects EVERY violation before asserting so
 * one run tells the whole story.
 *
 * The documented contract this file encodes, clause by clause:
 *
 *   · "Display: `format=\"24h\"` uses `14:05`; `format=\"12h\"` uses `2:05 PM`."
 *     — so 24-hour display pads the hour and 12-hour display does not, and the
 *     period is a suffix.
 *   · "Successful `FormData` value: `HH:mm`, or `HH:mm:ss` when `showSeconds`
 *     is true." — the submitted string is canonical and zero-padded whatever
 *     the display says.
 *   · "Always local wall-clock time. No date, time zone, UTC conversion, or
 *     localized form value."
 *   · "Programmatic canonical input: zero-padded `HH:mm` or `HH:mm:ss`."
 *   · "Keyboard input uses the active display. With `showSeconds`, displayed
 *     seconds are required."
 *   · "Partial/malformed text is preserved, sets `badInput`, and submits `''`
 *     instead of malformed text."
 *   · Live/default: "`value`: live value; not reflected to the value
 *     attribute", "`defaultValue`: value attribute and form-reset default",
 *     "Pristine `defaultValue`/`value`-attribute changes update live `value`",
 *     "After property input/selection/clear/restore makes the control dirty,
 *     attribute changes update only `defaultValue`", "`form.reset()` restores
 *     `defaultValue` with no user-change events".
 *   · "Exact visible text is stored as browser restoration state; canonical
 *     time is stored as the successful control value."
 *   · Validity: `valueMissing` = required && canonical === ''; `badInput` =
 *     non-empty visible text that cannot be parsed in the active display
 *     format; `rangeUnderflow`/`rangeOverflow` against valid `min-time`/
 *     `max-time`, inclusive; `stepMismatch` = minute not divisible by the
 *     effective step, or a VISIBLE second not divisible by it; `customError`.
 *   · "Supported steps: `1|5|10|15|30`, default `15`. … Invalid runtime step
 *     values safely fall back to `15`." and "Step controls minute options,
 *     visible second options, and validity."
 *   · "`min-time`/`max-time` accept canonical `HH:mm` or `HH:mm:ss`; malformed
 *     constraints are ignored and boundaries are inclusive."
 *   · "`invalid` is visual/ARIA presentation only; it does not change native
 *     validity."
 *   · Disabled/readonly/loading: "all user paths blocked … barred from
 *     validation"; disabled is "omitted from `FormData`" while readonly and
 *     loading keep "current value … in `FormData`".
 *   · Naming: "Base name precedence: associated labels, then `label`, then
 *     fallback `Time`" and "Related names: `<name>: open time picker`,
 *     `Clear <name>`, `<name> controls`, and `<name> hours|minutes|seconds|
 *     period`".
 *   · "One stable `aria-describedby` targets helper/error text; error replaces
 *     helper, uses `role=\"alert\"`, and invalid state uses `aria-invalid`."
 *   · CSS parts: `base`, `label`, `input`, `toggle`, `clear`, `spinner`,
 *     `dropdown`, `hours`, `minutes`, `seconds`, `period`, `helper-text`,
 *     `error-text`.
 *   · Interaction: "Dropdown: input click, clock click, `Enter`, or
 *     `ArrowDown` opens; `Escape` closes", "Inline: selectors stay visible …",
 *     "Range logic disables selector intervals wholly outside min/max."
 *
 * ── Deliberately NOT encoded ────────────────────────────────────────────────
 *
 * Pixel geometry, the dropdown's top-layer behaviour, the spelling of the
 * selector column headings, and the scroll-into-view of the selected option.
 * Those are the visual tier's (tests/live/matrix/time-picker/). Where the docs
 * describe a FORMAT without pinning every character, the oracle asserts the
 * documented meaning — the right hour, the right period, a round trip back to
 * the same canonical value — rather than a string invented from observed
 * output.
 *
 * ── Why the form assertions go through ElementInternals ─────────────────────
 *
 * happy-dom attaches internals but implements none of the plumbing behind them
 * (`new FormData(form)` is empty for a form-associated custom element,
 * `form.reset()` never reaches `formResetCallback`, `<fieldset disabled>` never
 * calls `formDisabledCallback`). The shared `tests/matrix/internals-mock.ts`
 * records the component's own half — the `setFormValue`/`setValidity` calls —
 * and the platform's half is driven by invoking the callbacks the browser
 * would. The REAL algorithms run in a real engine in
 * `tests/live/matrix/time-picker/time-picker-visual.spec.ts`.
 */
import { mount, shadow, part, text, settle } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
} from '../internals-mock';
import '../../../packages/components/src/time-picker/snice-time-picker';
import type {
  TimePickerFormat, TimePickerStep, TimePickerVariant, TimePickerSize,
} from '../../../packages/components/src/time-picker/snice-time-picker.types';

export { installInternalsMock, restoreInternalsMock, internalsFor, activeFlags };
export type { TimePickerFormat, TimePickerStep, TimePickerVariant, TimePickerSize };

// ── Documented value sets and defaults ──────────────────────────────────────

export const FORMATS: readonly TimePickerFormat[] = ['24h', '12h'];
export const STEPS: readonly TimePickerStep[] = [1, 5, 10, 15, 30];
export const VARIANTS: readonly TimePickerVariant[] = ['dropdown', 'inline'];
export const SIZES: readonly TimePickerSize[] = ['small', 'medium', 'large'];

export const DEFAULT_FORMAT: TimePickerFormat = '24h';
export const DEFAULT_STEP: TimePickerStep = 15;
export const DEFAULT_VARIANT: TimePickerVariant = 'dropdown';
export const DEFAULT_SIZE: TimePickerSize = 'medium';

/** The documented CSS parts, in the order the docs list them. */
export const PARTS = [
  'base', 'label', 'input', 'toggle', 'clear', 'spinner', 'dropdown',
  'hours', 'minutes', 'seconds', 'period', 'helper-text', 'error-text',
] as const;

/** The documented events. */
export const EVENTS = [
  'time-change', 'timepicker-clear', 'timepicker-focus', 'timepicker-blur',
  'timepicker-open', 'timepicker-close',
] as const;

export interface TimeParts { hours: number; minutes: number; seconds: number }

export interface TimeCombo {
  defaultValue: string;
  format: TimePickerFormat;
  step: TimePickerStep | number;
  minTime: string;
  maxTime: string;
  showSeconds: boolean;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  clearable: boolean;
  placeholder: string;
  label: string;
  helperText: string;
  errorText: string;
  required: boolean;
  invalid: boolean;
  name: string;
  variant: TimePickerVariant;
  size: TimePickerSize;
}

/** Every documented property at its documented default. */
export const DEFAULTS: TimeCombo = {
  defaultValue: '',
  format: DEFAULT_FORMAT,
  step: DEFAULT_STEP,
  minTime: '',
  maxTime: '',
  showSeconds: false,
  disabled: false,
  readonly: false,
  loading: false,
  clearable: false,
  placeholder: '',
  label: '',
  helperText: '',
  errorText: '',
  required: false,
  invalid: false,
  name: '',
  variant: DEFAULT_VARIANT,
  size: DEFAULT_SIZE,
};

export const picker = (overrides: Partial<TimeCombo> = {}): TimeCombo => ({
  ...DEFAULTS,
  ...overrides,
});

/** The documented attribute names. */
export function attrsOf(c: TimeCombo): Record<string, any> {
  const attrs: Record<string, any> = {
    format: c.format,
    variant: c.variant,
    size: c.size,
    step: c.step,
  };
  if (c.defaultValue) attrs.value = c.defaultValue;
  if (c.minTime) attrs['min-time'] = c.minTime;
  if (c.maxTime) attrs['max-time'] = c.maxTime;
  if (c.showSeconds) attrs['show-seconds'] = true;
  if (c.disabled) attrs.disabled = true;
  if (c.readonly) attrs.readonly = true;
  if (c.loading) attrs.loading = true;
  if (c.clearable) attrs.clearable = true;
  if (c.placeholder) attrs.placeholder = c.placeholder;
  if (c.label) attrs.label = c.label;
  if (c.helperText) attrs['helper-text'] = c.helperText;
  if (c.errorText) attrs['error-text'] = c.errorText;
  if (c.required) attrs.required = true;
  if (c.invalid) attrs.invalid = true;
  if (c.name) attrs.name = c.name;
  return attrs;
}

export const comboId = (c: TimeCombo): string =>
  `${c.variant}/${c.format}${c.showSeconds ? '/seconds' : ''} step=${c.step}`
  + ` value="${c.defaultValue}"`
  + `${c.minTime || c.maxTime ? ` range=[${c.minTime}..${c.maxTime}]` : ''}`
  + `${c.required ? '/required' : ''}${c.disabled ? '/disabled' : ''}`
  + `${c.readonly ? '/readonly' : ''}${c.loading ? '/loading' : ''}`;

export const mountPicker = (c: TimeCombo) =>
  mount<any>('snice-time-picker', attrsOf(c));

// ── The documented parse and print ──────────────────────────────────────────

/** "Programmatic canonical input: zero-padded `HH:mm` or `HH:mm:ss`." */
export function parseCanonical(value: string): TimeParts | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  return validParts(Number(match[1]), Number(match[2]),
    match[3] === undefined ? 0 : Number(match[3]));
}

/**
 * "Keyboard input uses the active display. With `showSeconds`, displayed
 * seconds are required." — the oracle's own reading of the two display forms
 * the docs print (`14:05` and `2:05 PM`).
 */
export function parseDisplay(
  value: string, format: TimePickerFormat, showSeconds: boolean,
): TimeParts | null {
  const candidate = value.trim();
  if (!candidate) return null;

  if (format === '12h') {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(candidate);
    if (!match) return null;
    if (showSeconds && match[3] === undefined) return null;
    const displayHours = Number(match[1]);
    if (displayHours < 1 || displayHours > 12) return null;
    const pm = match[4].toUpperCase() === 'PM';
    return validParts((displayHours % 12) + (pm ? 12 : 0), Number(match[2]),
      match[3] === undefined ? 0 : Number(match[3]));
  }

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(candidate);
  if (!match) return null;
  if (showSeconds && match[3] === undefined) return null;
  return validParts(Number(match[1]), Number(match[2]),
    match[3] === undefined ? 0 : Number(match[3]));
}

/** "Always local wall-clock time" — nothing rolls over into another hour or day. */
function validParts(hours: number, minutes: number, seconds: number): TimeParts | null {
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** "Display: `24h` uses `14:05`; `12h` uses `2:05 PM`." */
export function display(
  parts: TimeParts, format: TimePickerFormat, showSeconds: boolean,
): string {
  if (format === '12h') {
    const period = parts.hours >= 12 ? 'PM' : 'AM';
    const hour = parts.hours % 12 || 12;
    return showSeconds
      ? `${hour}:${pad(parts.minutes)}:${pad(parts.seconds)} ${period}`
      : `${hour}:${pad(parts.minutes)} ${period}`;
  }
  return showSeconds
    ? `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
    : `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** "Successful `FormData` value: `HH:mm`, or `HH:mm:ss` when showSeconds." */
export function canonical(parts: TimeParts, showSeconds: boolean): string {
  return showSeconds
    ? `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
    : `${pad(parts.hours)}:${pad(parts.minutes)}`;
}

/** The documented placeholder for a combo that authored none. */
export function defaultPlaceholder(format: TimePickerFormat, showSeconds: boolean): string {
  if (format === '12h') return showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM';
  return showSeconds ? 'HH:MM:SS' : 'HH:MM';
}

/** "Supported steps: 1|5|10|15|30, default 15. … Invalid … fall back to 15." */
export function effectiveStep(step: number): TimePickerStep {
  return (STEPS as readonly number[]).includes(step) ? step as TimePickerStep : DEFAULT_STEP;
}

export const timeKey = (parts: TimeParts) =>
  parts.hours * 3600 + parts.minutes * 60 + parts.seconds;

/**
 * The documented flags for one combo in one state, as a sorted list.
 *
 * The state is the EXPECTATION — what the control should be showing and what
 * it should be submitting — because that is the pair the documentation's
 * validity table is written against: `badInput` is "non-empty visible text
 * that cannot be parsed", i.e. text with no successful value behind it, and
 * the range/step clauses grade the successful value.
 */
export function expectedFlags(c: TimeCombo, want: Expectation): string[] {
  // "all user editing blocked and barred from validation" — a barred control
  // carries no flags at all.
  if (c.disabled || c.readonly || c.loading) return [];

  const parts = want.canonical ? parseCanonical(want.canonical) : null;
  const step = effectiveStep(c.step as number);
  const min = parseCanonical(c.minTime);
  const max = parseCanonical(c.maxTime);
  const key = parts
    ? timeKey({ ...parts, seconds: c.showSeconds ? parts.seconds : 0 })
    : null;

  const flags: string[] = [];
  if (Boolean(want.visible) && !parts) flags.push('badInput');
  if (key !== null && max && key > timeKey(max)) flags.push('rangeOverflow');
  if (key !== null && min && key < timeKey(min)) flags.push('rangeUnderflow');
  if (parts && (parts.minutes % step !== 0
    || (c.showSeconds && parts.seconds % step !== 0))) flags.push('stepMismatch');
  if (c.required && !want.canonical) flags.push('valueMissing');
  return flags.sort();
}

// ── Reading ─────────────────────────────────────────────────────────────────

export interface SelectorReading {
  labels: string[];
  disabled: string[];
  selected: string[];
}

export interface Reading {
  parts: string[];
  inputValue: string | null;
  placeholder: string | null;
  ariaInvalid: string | null;
  ariaLabel: string | null;
  describedBy: string | null;
  describedNodeText: string | null;
  describedNodeRole: string | null;
  labelText: string | null;
  helperText: string | null;
  errorText: string | null;
  toggleLabel: string | null;
  clearLabel: string | null;
  dropdownLabel: string | null;
  dropdownHidden: boolean;
  clearVisible: boolean;
  spinner: boolean;
  hours: SelectorReading | null;
  minutes: SelectorReading | null;
  seconds: SelectorReading | null;
  period: SelectorReading | null;
}

function readSelector(el: HTMLElement, name: string): SelectorReading | null {
  const column = part(el, name);
  if (!column) return null;
  const items = [...column.querySelectorAll<HTMLButtonElement>('.selector-item')];
  return {
    labels: items.map(item => text(item)),
    disabled: items.filter(item => item.disabled).map(item => text(item)),
    selected: items.filter(item => item.classList.contains('selector-item--selected'))
      .map(item => text(item)),
  };
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const input = part<HTMLInputElement>(el, 'input');
  const clear = part<HTMLElement>(el, 'clear');
  const dropdown = part(el, 'dropdown');
  const describedBy = input?.getAttribute('aria-describedby')
    || dropdown?.getAttribute('aria-describedby') || '';
  const described = describedBy ? root.getElementById(describedBy) : null;

  return {
    parts: PARTS.filter(name => !!part(el, name)),
    inputValue: input ? input.value : null,
    placeholder: input ? input.getAttribute('placeholder') ?? input.placeholder : null,
    ariaInvalid: input ? input.getAttribute('aria-invalid') : null,
    ariaLabel: input ? input.getAttribute('aria-label') : null,
    describedBy: describedBy || null,
    describedNodeText: described ? text(described) : null,
    describedNodeRole: described ? described.getAttribute('role') : null,
    labelText: part(el, 'label') ? text(part(el, 'label')) : null,
    helperText: part(el, 'helper-text') ? text(part(el, 'helper-text')) : null,
    errorText: part(el, 'error-text') ? text(part(el, 'error-text')) : null,
    toggleLabel: part(el, 'toggle')?.getAttribute('aria-label') ?? null,
    clearLabel: clear?.getAttribute('aria-label') ?? null,
    dropdownLabel: dropdown?.getAttribute('aria-label') ?? null,
    dropdownHidden: dropdown ? dropdown.hasAttribute('hidden') : true,
    // Read the inline STYLE ATTRIBUTE rather than `style.display`: the
    // component hides the button by writing `display: none` inline, and
    // happy-dom's CSSStyleDeclaration does not reliably reflect an attribute
    // written by the template engine. The attribute is the fact both sides
    // agree on.
    clearVisible: !!clear && !/display:\s*none/.test(clear.getAttribute('style') ?? ''),
    spinner: !!part(el, 'spinner'),
    hours: readSelector(el, 'hours'),
    minutes: readSelector(el, 'minutes'),
    seconds: readSelector(el, 'seconds'),
    period: readSelector(el, 'period'),
  };
}

// ── Oracle ──────────────────────────────────────────────────────────────────

export interface Expectation {
  /** The visible text the control should be showing. */
  visible: string;
  /** The canonical value it should be submitting (`''` for none). */
  canonical: string;
}

/** What a freshly-mounted, untouched picker should show and submit. */
export function expectedInitial(c: TimeCombo): Expectation {
  const parts = parseCanonical(c.defaultValue);
  return parts
    ? { visible: display(parts, c.format, c.showSeconds), canonical: canonical(parts, c.showSeconds) }
    // "Partial/malformed text is preserved … and submits `''`".
    : { visible: c.defaultValue, canonical: '' };
}

/**
 * Every documented consequence of `c` at the expectation `want`, as a problem
 * list. `[]` means the rendered control matches its documentation.
 */
export function pickerProblems(
  el: HTMLElement,
  c: TimeCombo,
  want: Expectation = expectedInitial(c),
): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);
  const isInline = c.variant === 'inline';

  // ── The documented parts ─────────────────────────────────────────────────
  const wanted: Record<string, boolean> = {
    base: true,
    label: Boolean(c.label),
    // "Inline: selectors stay visible" — the inline variant has no text input,
    // and therefore no toggle, clear button or spinner beside one.
    input: !isInline,
    toggle: !isInline,
    clear: !isInline,
    spinner: !isInline && c.loading,
    dropdown: true,
    hours: true,
    minutes: true,
    seconds: c.showSeconds,
    period: c.format === '12h',
    'helper-text': Boolean(c.helperText) && !c.errorText,
    'error-text': Boolean(c.errorText),
  };
  for (const [name, present] of Object.entries(wanted)) {
    const got = r.parts.includes(name);
    if (got !== present) {
      say(`[part="${name}"] ${got ? 'present' : 'absent'}, expected ${present ? 'present' : 'absent'}`);
    }
  }

  // ── The visible text and the submitted value ─────────────────────────────
  if (!isInline) {
    if (r.inputValue !== want.visible) {
      say(`the input shows "${r.inputValue}", expected "${want.visible}"`);
    }
    const wantPlaceholder = c.placeholder || defaultPlaceholder(c.format, c.showSeconds);
    if (r.placeholder !== wantPlaceholder) {
      say(`placeholder "${r.placeholder}", expected "${wantPlaceholder}"`);
    }
  }
  // The live `value` is documented as "live value; not reflected to the value
  // attribute" — the docs pin its MEANING, not its spelling, so the oracle
  // asks the documented question: does it denote the same wall-clock time the
  // control is submitting? A control given `value="14:05"` while `showSeconds`
  // is on may keep the author's own string; what it may not do is denote a
  // different time. When there is no valid time at all, the documented rule is
  // exact: "Partial/malformed text is preserved".
  const liveValue = String((el as any).value ?? '');
  if (want.canonical) {
    const liveParts = parseCanonical(liveValue);
    if (!liveParts) {
      say(`live value "${liveValue}" is not canonical, though the control holds a valid time`);
    } else if (canonical(liveParts, c.showSeconds) !== want.canonical) {
      say(`live value "${liveValue}" denotes a different time from the submitted`
        + ` "${want.canonical}"`);
    }
  } else if (liveValue !== want.visible) {
    say(`live value "${liveValue}" is not the preserved text "${want.visible}"`);
  }

  const internals = internalsFor(el);
  if (internals.formValue !== want.canonical) {
    say(`the submitted value is "${internals.formValue}", expected "${want.canonical}"`);
  }
  // "Exact visible text is stored as browser restoration state."
  if (internals.state !== want.visible) {
    say(`the restoration state is "${internals.state}", expected the visible "${want.visible}"`);
  }

  // ── Validity ─────────────────────────────────────────────────────────────
  const flags = expectedFlags(c, want);
  const got = activeFlags(el);
  if (got.join(',') !== flags.join(',')) {
    say(`validity flags [${got.join(', ')}], expected [${flags.join(', ')}]`);
  }
  const barred = c.disabled || c.readonly || c.loading;
  if ((el as any).willValidate !== !barred) {
    say(`willValidate is ${(el as any).willValidate}, expected ${!barred}`);
  }
  if ((el as any).type !== 'time') say(`type is "${(el as any).type}", expected "time"`);

  // "`invalid` is visual/ARIA presentation only" — it shows, but never adds a flag.
  if (!isInline) {
    const wantAriaInvalid = String(c.invalid || flags.length > 0);
    if (r.ariaInvalid !== wantAriaInvalid) {
      say(`aria-invalid is "${r.ariaInvalid}", expected "${wantAriaInvalid}"`);
    }
  }

  // ── Naming ───────────────────────────────────────────────────────────────
  const name = c.label || 'Time';
  if (!isInline && r.ariaLabel !== name) {
    say(`the input is named "${r.ariaLabel}", expected "${name}"`);
  }
  if (!isInline && r.toggleLabel !== `${name}: open time picker`) {
    say(`the toggle is named "${r.toggleLabel}"`);
  }
  if (!isInline && r.clearLabel !== `Clear ${name}`) {
    say(`the clear button is named "${r.clearLabel}"`);
  }
  if (r.dropdownLabel !== `${name} controls`) {
    say(`the dropdown is named "${r.dropdownLabel}"`);
  }
  for (const unit of ['hours', 'minutes', 'seconds', 'period'] as const) {
    const column = part(el, unit);
    if (!column) continue;
    if (column.getAttribute('aria-label') !== `${name} ${unit}`) {
      say(`the ${unit} group is named "${column.getAttribute('aria-label')}"`);
    }
  }

  // ── Helper and error text ────────────────────────────────────────────────
  if (c.errorText) {
    if (r.errorText !== c.errorText) say(`error text reads "${r.errorText}"`);
    if (r.describedNodeText !== c.errorText) {
      say('aria-describedby does not point at the error text');
    }
    if (r.describedNodeRole !== 'alert') {
      say(`the error text has role "${r.describedNodeRole}", expected "alert"`);
    }
    if (r.helperText !== null) say('the error text did not replace the helper text');
  } else if (c.helperText) {
    if (r.helperText !== c.helperText) say(`helper text reads "${r.helperText}"`);
    if (r.describedNodeText !== c.helperText) {
      say('aria-describedby does not point at the helper text');
    }
  } else if (r.describedBy) {
    say(`aria-describedby is "${r.describedBy}" with no helper or error text`);
  }

  // ── Label ────────────────────────────────────────────────────────────────
  if (c.label && r.labelText !== c.label) say(`the label reads "${r.labelText}"`);

  // ── The dropdown's resting state ─────────────────────────────────────────
  if (isInline) {
    if (r.dropdownHidden) say('the inline variant hides its selectors');
  } else if (!r.dropdownHidden) {
    say('the dropdown variant starts open');
  }

  // ── The selector options the step and the range decide ───────────────────
  const step = effectiveStep(c.step as number);
  if (r.minutes) {
    const wantMinutes = [];
    for (let m = 0; m < 60; m += step) wantMinutes.push(pad(m));
    if (r.minutes.labels.join(',') !== wantMinutes.join(',')) {
      say(`minute options [${r.minutes.labels.join(', ')}], expected [${wantMinutes.join(', ')}]`);
    }
  }
  if (c.showSeconds && r.seconds) {
    const wantSeconds = [];
    for (let s = 0; s < 60; s += step) wantSeconds.push(pad(s));
    if (r.seconds.labels.join(',') !== wantSeconds.join(',')) {
      say(`second options [${r.seconds.labels.join(', ')}], expected [${wantSeconds.join(', ')}]`);
    }
  }
  if (r.hours) {
    const wantHours: string[] = [];
    if (c.format === '12h') for (let h = 1; h <= 12; h++) wantHours.push(String(h));
    else for (let h = 0; h <= 23; h++) wantHours.push(pad(h));
    if (r.hours.labels.join(',') !== wantHours.join(',')) {
      say(`hour options [${r.hours.labels.join(', ')}], expected [${wantHours.join(', ')}]`);
    }
  }
  if (c.format === '12h' && r.period) {
    if (r.period.labels.join(',') !== 'AM,PM') {
      say(`period options [${r.period.labels.join(', ')}]`);
    }
  }

  // ── The clear button only offers itself when there is something to clear ──
  if (!isInline && c.clearable) {
    const shouldShow = Boolean(want.visible) && !c.disabled && !c.readonly && !c.loading;
    if (r.clearVisible !== shouldShow) {
      say(`the clear button is ${r.clearVisible ? 'shown' : 'hidden'},`
        + ` expected ${shouldShow ? 'shown' : 'hidden'}`);
    }
  }

  return problems;
}

// ── Driving the documented user paths ───────────────────────────────────────

/**
 * Type into the control the way a keyboard does: the text lands in the internal
 * input and an `input` event follows. "Keyboard input uses the active display."
 */
export async function typeInto(el: any, value: string): Promise<void> {
  const input = part<HTMLInputElement>(el, 'input');
  if (!input) throw new Error('this variant has no text input to type into');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await settle(el);
}

/** Click one option in a selector column, by its rendered label. */
export async function clickOption(el: any, unit: string, label: string): Promise<void> {
  const column = part(el, unit);
  if (!column) throw new Error(`no [part="${unit}"] column`);
  const option = [...column.querySelectorAll<HTMLButtonElement>('.selector-item')]
    .find(item => text(item) === label);
  if (!option) throw new Error(`no "${label}" option in the ${unit} column`);
  option.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
}

/** The option button for one label, whether or not it is enabled. */
export function optionFor(el: any, unit: string, label: string): HTMLButtonElement | null {
  const column = part(el, unit);
  if (!column) return null;
  return [...column.querySelectorAll<HTMLButtonElement>('.selector-item')]
    .find(item => text(item) === label) ?? null;
}

/** A keydown on the internal input, with the composed flag a real key has. */
export async function pressKey(el: any, key: string): Promise<void> {
  const input = part<HTMLInputElement>(el, 'input');
  input?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  await settle(el);
}

export { settle, part, text, shadow };
