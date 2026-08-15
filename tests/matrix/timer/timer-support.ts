/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-timer matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything encoded here comes from docs/ai/components/timer.md,
 * docs/components/timer.md and snice-timer.types.ts:
 *
 *   · `mode: 'stopwatch'|'timer' = 'stopwatch'` — a stopwatch "counts up", a
 *     timer is a "Countdown (counts down from 60s)" for `initial-time="60"`.
 *   · `initialTime: number = 0` — "attr: initial-time, seconds (for timer
 *     mode)". So a timer's initial state is `initialTime` seconds, and a
 *     stopwatch's is 0.
 *   · `running: boolean` — read-only; true between `start()` and `stop()`.
 *   · Methods — `start()`, `stop()`, `reset()` ("Reset to initial state"),
 *     `getTime()` ("Get current time in seconds").
 *   · Events — `timer-start`/`timer-stop`/`timer-reset` carry `{ timer, time }`,
 *     `timer-complete` carries `{ timer }` and fires when the "Countdown
 *     reached 0".
 *   · CSS parts — `base` (outer container), `display` (the time display
 *     element), `controls` (the start/stop/reset button container).
 *
 * The display's exact string is NOT documented, so the oracle does not invent
 * one: it parses whatever the display shows back into seconds and requires it to
 * agree with `getTime()`. That is the documented claim — the display element
 * shows the timer's time — with no extra assumption about formatting.
 */
import { mount, part, shadow, wait, type Shape } from '../matrix-utils';

export const MODES = ['stopwatch', 'timer'] as const;
export type Mode = typeof MODES[number];

/** Documented defaults, from docs/ai/components/timer.md. */
export const DEFAULTS = { mode: 'stopwatch' as Mode, initialTime: 0 };

/** Initial times, in seconds: none, short, the doc's own example, over an hour. */
export const INITIAL_TIMES = [0, 5, 60, 3725] as const;

export interface TimerElement extends HTMLElement {
  mode: Mode;
  initialTime: number;
  running: boolean;
  start(): void;
  stop(): void;
  reset(): void;
  getTime(): number;
}

/** Mount a timer the documented way: `mode` and `initial-time` as markup. */
export async function mountTimer(mode: Mode, initialTime: number): Promise<TimerElement> {
  const attrs: Record<string, any> = { mode };
  if (initialTime) attrs['initial-time'] = initialTime;
  return mount<TimerElement>('snice-timer', attrs);
}

/**
 * The documented INITIAL STATE: "Reset to initial state" plus "initial-time …
 * (for timer mode)". A timer starts at `initialTime`; a stopwatch counts up
 * from zero.
 */
export function initialState(mode: Mode, initialTime: number): number {
  return mode === 'timer' ? initialTime : 0;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function displayText(el: HTMLElement): string {
  return part<HTMLElement>(el, 'display')?.textContent?.trim() ?? '';
}

export function controlButtons(el: HTMLElement): HTMLButtonElement[] {
  const controls = part<HTMLElement>(el, 'controls');
  return controls ? [...controls.querySelectorAll('button')] : [];
}

export function buttonTitles(el: HTMLElement): string[] {
  return controlButtons(el).map(b => b.getAttribute('title') ?? '');
}

/**
 * Read a rendered display back into seconds, accepting either shape the
 * component uses (`h:mm:ss` above an hour, `m:ss.d` below one). Returns null
 * when the display says something that is not a time at all — which is itself a
 * reportable answer rather than a silent pass.
 */
export function parseDisplay(text: string): number | null {
  const long = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(text);
  if (long) return Number(long[1]) * 3600 + Number(long[2]) * 60 + Number(long[3]);
  const short = /^(\d+):([0-5]\d)\.(\d)$/.exec(text);
  if (short) return Number(short[1]) * 60 + Number(short[2]) + Number(short[3]) / 10;
  return null;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

export interface TimerReading {
  time: number;
  running: boolean;
  display: string;
}

export function read(el: TimerElement): TimerReading {
  return { time: el.getTime(), running: el.running, display: displayText(el) };
}

/**
 * The structural shape every combo must satisfy, whatever the clock is doing:
 * the three documented parts, a control set that offers exactly one of
 * start/pause plus reset, and a display that reads back as the time the timer
 * reports.
 */
export function shapeProblems(el: TimerElement): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);

  if (!part(el, 'base')) say('no part="base"');
  if (!part(el, 'display')) say('no part="display"');
  if (!part(el, 'controls')) say('no part="controls"');

  const titles = buttonTitles(el);
  if (!titles.includes('Reset')) say(`controls offer no reset button (titles ${JSON.stringify(titles)})`);
  const wanted = el.running ? 'Pause' : 'Start';
  const unwanted = el.running ? 'Start' : 'Pause';
  if (!titles.includes(wanted)) {
    say(`running=${el.running} offers no "${wanted}" button (titles ${JSON.stringify(titles)})`);
  }
  if (titles.includes(unwanted)) {
    say(`running=${el.running} still offers "${unwanted}"`);
  }

  const text = displayText(el);
  const shown = parseDisplay(text);
  if (shown === null) {
    say(`display "${text}" is not a readable time`);
  } else if (Math.abs(shown - el.getTime()) > 1.05) {
    // The display truncates, so a second of slack is the format's own rounding —
    // anything beyond that is a display showing a different time than the timer.
    say(`display "${text}" reads ${shown}s, but getTime() is ${el.getTime()}s`);
  }

  return problems;
}

export function expectedIdleShape(mode: Mode, initialTime: number): Shape {
  return {
    time: initialState(mode, initialTime),
    running: false,
  };
}

/** Capture the documented events in dispatch order. */
export function recordEvents(el: HTMLElement): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of ['timer-start', 'timer-stop', 'timer-reset', 'timer-complete']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Let the component's own rAF loop run for `ms` of wall clock. */
export async function run(ms: number): Promise<void> {
  await wait(ms);
}

export { wait };
