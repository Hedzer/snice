/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-countdown matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything encoded here comes from docs/ai/components/countdown.md,
 * docs/components/countdown.md and snice-countdown.types.ts:
 *
 *   · `target: string` — "ISO date string"; the component counts down TO it.
 *   · `format: 'dhms'|'hms'|'ms'` — "Display format: days+hours+minutes+seconds,
 *     hours+minutes+seconds, or minutes+seconds". So the format decides which
 *     UNITS the remaining time is expressed in — `hms` is an hours+minutes+
 *     seconds reading of the SAME remaining time, not a `dhms` reading with the
 *     days column hidden.
 *   · CSS parts — `base` (outer container), `segment` (individual time segment),
 *     `value` (digit value within a segment), `label` (text label within a
 *     segment), `separator` (colon separator BETWEEN segments). "Between" is
 *     load-bearing: n segments carry n-1 separators.
 *   · Accessibility — "Each time segment has a descriptive label below the
 *     digits", so every segment carries a non-empty `part="label"`.
 *   · "`.complete` class added to host on finish", and `countdown-complete`
 *     fires then; `countdown-tick` carries
 *     `{ days, hours, minutes, seconds, total }` every second.
 *   · `variant: 'simple'|'flip'|'circular'` is a pure style axis — the
 *     stylesheet selects it as `:host([variant=…])`, so its observable contract
 *     in a layout-free DOM is the attribute channel.
 *
 * Time is made deterministic by FREEZING `Date` (see `freezeClock`) rather than
 * by mocking the component: the countdown reads `Date.now()`, so a frozen clock
 * gives an exact expected reading for every combo with no tolerance windows and
 * no second-boundary flake.
 */
import { vi } from 'vitest';
import { mount, part, shadow, settle, type Shape } from '../matrix-utils';

export const FORMATS = ['dhms', 'hms', 'ms'] as const;
export const VARIANTS = ['simple', 'flip', 'circular'] as const;

export type Format = typeof FORMATS[number];
export type Variant = typeof VARIANTS[number];

/** Documented defaults, from docs/ai/components/countdown.md. */
export const DEFAULTS = { target: '', format: 'dhms' as Format, variant: 'simple' as Variant };

/** A fixed instant to freeze the clock at, so every combo is reproducible. */
export const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Freeze `Date` only. `setInterval` stays real, so nothing else is disturbed. */
export function freezeClock(at = NOW): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(at);
}

export function thawClock(): void {
  vi.useRealTimers();
}

/** The ISO target that leaves exactly `remainingMs` on a clock frozen at NOW. */
export function targetFor(remainingMs: number, at = NOW): string {
  return new Date(at + remainingMs).toISOString();
}

// ── Durations ───────────────────────────────────────────────────────────────

export interface Duration { id: string; ms: number }

/** Durations that fit inside every format's own units. */
export const DURATIONS: Record<Format, Duration[]> = {
  dhms: [
    { id: 'zero', ms: 0 },
    { id: '45s', ms: 45 * SECOND },
    { id: '5m30s', ms: 5 * MINUTE + 30 * SECOND },
    { id: '2h3m4s', ms: 2 * HOUR + 3 * MINUTE + 4 * SECOND },
    { id: '3d4h5m6s', ms: 3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND },
    { id: '100d1h', ms: 100 * DAY + HOUR },
  ],
  hms: [
    { id: 'zero', ms: 0 },
    { id: '45s', ms: 45 * SECOND },
    { id: '5m30s', ms: 5 * MINUTE + 30 * SECOND },
    { id: '2h3m4s', ms: 2 * HOUR + 3 * MINUTE + 4 * SECOND },
  ],
  ms: [
    { id: 'zero', ms: 0 },
    { id: '45s', ms: 45 * SECOND },
    { id: '5m30s', ms: 5 * MINUTE + 30 * SECOND },
    { id: '59m59s', ms: 59 * MINUTE + 59 * SECOND },
  ],
};

// ── The documented reading ──────────────────────────────────────────────────

/**
 * The units a format displays, in order. Straight from the docs table:
 * "days+hours+minutes+seconds, hours+minutes+seconds, or minutes+seconds".
 */
export const UNITS: Record<Format, Array<'days' | 'hours' | 'minutes' | 'seconds'>> = {
  dhms: ['days', 'hours', 'minutes', 'seconds'],
  hms: ['hours', 'minutes', 'seconds'],
  ms: ['minutes', 'seconds'],
};

/**
 * The remaining time expressed in a format's own units — the oracle.
 *
 * The leading unit carries everything above it (a 3-day countdown read in
 * hours+minutes+seconds is 76 hours, not 4): the format chooses the units, it
 * does not discard time.
 */
export function expectedValues(format: Format, remainingMs: number): number[] {
  const total = Math.floor(Math.max(0, remainingMs) / 1000);
  switch (format) {
    case 'dhms':
      return [
        Math.floor(total / 86400),
        Math.floor((total % 86400) / 3600),
        Math.floor((total % 3600) / 60),
        total % 60,
      ];
    case 'hms':
      return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
    case 'ms':
      return [Math.floor(total / 60), total % 60];
  }
}

export interface CountdownCombo {
  id: string;
  format: Format;
  variant: Variant;
  duration: Duration;
}

export async function mountCountdown(combo: CountdownCombo): Promise<HTMLElement> {
  return mount<HTMLElement>('snice-countdown', {
    target: targetFor(combo.duration.ms),
    format: combo.format,
    variant: combo.variant,
  });
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function segments(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('[part~="segment"]')];
}

export function separators(el: HTMLElement): HTMLElement[] {
  return [...shadow(el).querySelectorAll<HTMLElement>('[part~="separator"]')];
}

export function segmentValue(segment: HTMLElement): string {
  return segment.querySelector('[part~="value"]')?.textContent?.trim() ?? '';
}

export function segmentLabel(segment: HTMLElement): string {
  return segment.querySelector('[part~="label"]')?.textContent?.trim() ?? '';
}

export function readValues(el: HTMLElement): number[] {
  return segments(el).map(seg => Number(segmentValue(seg)));
}

// ── Oracle ──────────────────────────────────────────────────────────────────

export function expectedShape(combo: CountdownCombo): Shape {
  const values = expectedValues(combo.format, combo.duration.ms);
  return {
    hasBase: true,
    segmentCount: values.length,
    values,
    // "Colon separator BETWEEN segments": n segments, n-1 separators.
    separatorCount: values.length - 1,
    // "Each time segment has a descriptive label below the digits."
    everySegmentLabelled: true,
    labelsAreDistinct: true,
    // "`.complete` class added to host on finish" — and only then.
    hostComplete: combo.duration.ms <= 0,
    'attr.format': combo.format === DEFAULTS.format ? undefined : combo.format,
    'attr.variant': combo.variant === DEFAULTS.variant ? undefined : combo.variant,
  };
}

export function readShape(el: HTMLElement, combo: CountdownCombo): Shape {
  const segs = segments(el);
  const labels = segs.map(segmentLabel);
  return {
    hasBase: !!part(el, 'base'),
    segmentCount: segs.length,
    values: readValues(el),
    separatorCount: separators(el).length,
    everySegmentLabelled: segs.length > 0 && labels.every(label => label.length > 0),
    labelsAreDistinct: new Set(labels).size === labels.length,
    hostComplete: el.classList.contains('complete'),
    'attr.format': combo.format === DEFAULTS.format
      ? undefined : el.getAttribute('format') ?? null,
    'attr.variant': combo.variant === DEFAULTS.variant
      ? undefined : el.getAttribute('variant') ?? null,
  };
}

/** Capture the documented events in dispatch order. */
export function recordEvents(el: HTMLElement): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of ['countdown-tick', 'countdown-complete']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export { settle };
