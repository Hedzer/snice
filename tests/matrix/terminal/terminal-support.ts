/**
 * snice-terminal matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/terminal.md and
 * packages/components/src/terminal/snice-terminal.types.ts. Nothing here is
 * read off the component's output.
 *
 * The documented surface:
 *
 *   · `prompt = '$ '`, `cwd = '~'`, `readonly = false`,
 *     `maxLines = 1000` (attr `max-lines`),
 *     `showTimestamps = false` (attr `show-timestamps`)
 *   · writers `write(content, type?)` — "Write without newline" —
 *     `writeln(content, type?)` — "Write with newline" — `writeLines(lines)`,
 *     `writeError(content)`
 *   · streaming `appendChunk(chunk, type?)`, `pipeFrom(source, type?)`,
 *     `commitLiveLine()`, with "a trailing partial line stays live and grows
 *     until a newline commits it"
 *   · `clear()`, `focus()`, `getHistory()`, `clearHistory()`
 *   · events `terminal-command` -> `{ command, args }`, `terminal-clear` -> `{}`,
 *     `terminal-ready` -> `{}`
 *   · CSS parts `container`, `output`, `input-line`, `prompt`, `input`, `line`,
 *     `timestamp`, `line-content`
 *   · line types `input | output | error | info | success | warning`
 *   · CSS custom properties, including one per ANSI colour
 *     (`--snice-terminal-ansi-red`, …)
 *
 * SIMULATION BOUNDARY. Scrolling ("Output scrollable area", the auto-scroll to
 * the newest line) and the painted colour of an ANSI span are layout and paint;
 * they belong to tests/live/matrix/terminal/terminal-visual.spec.ts. Everything
 * here is structure, content and API behaviour.
 */
import { Problems, SETTLE, all, captureEvents, mount, press, sr, text, wait } from '../matrix-kit';
import { exactPart, exactPartIn, exactParts, partTokens } from '../part-exact';
import '../../../packages/components/src/terminal/snice-terminal';

export { Problems, all, captureEvents, mount, press, sr, text, wait, SETTLE, partTokens };

/**
 * `part="input"` and `part="input-line"` share a prefix, and happy-dom's
 * `[part~="input"]` matches both. Part lookups here read the token list
 * directly — see tests/matrix/part-exact.ts.
 */
export const part = exactPart;
export const parts = exactParts;

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  prompt: '$ ',
  cwd: '~',
  readonly: false,
  maxLines: 1000,
  showTimestamps: false,
};

/** The documented line types, in the order the doc lists them. */
export const LINE_TYPES = ['input', 'output', 'error', 'info', 'success', 'warning'] as const;
export type LineType = typeof LINE_TYPES[number];

export interface Vector {
  prompt: string;
  readonly: boolean;
  showTimestamps: boolean;
  maxLines: number;
}

export async function mountTerminal(vector: Partial<Vector> = {}): Promise<HTMLElement> {
  const v = { ...DEFAULTS, ...vector };
  const attrs: Record<string, string | boolean> = {
    prompt: v.prompt,
    'max-lines': String(v.maxLines),
  };
  if (v.readonly) attrs.readonly = true;
  if (v.showTimestamps) attrs['show-timestamps'] = true;
  return mount('snice-terminal', attrs as Record<string, string>);
}

// ── Reading the rendered terminal ───────────────────────────────────────────

export const lines = (el: HTMLElement): HTMLElement[] => parts(el, 'line');

/** The visible text of each line's content span — the string a reader sees. */
export const lineTexts = (el: HTMLElement): string[] =>
  lines(el).map(line => text(exactPartIn(line, 'line-content')));

export const lineTypes = (el: HTMLElement): string[] =>
  lines(el).map(line => line.getAttribute('data-type') ?? '');

/** The `<span>` elements an ANSI escape produced inside a line. */
export const ansiSpans = (el: HTMLElement): HTMLElement[] =>
  all<HTMLElement>(el, '.line-content span');

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The chrome: the documented container, the log region, and — unless the
 * terminal is `readonly` — the prompt and the input it belongs to.
 */
export function checkChrome(problems: Problems, el: HTMLElement, vector: Vector): void {
  const container = part(el, 'container');
  const output = part(el, 'output');

  if (!problems.check(!!container, 'no [part="container"]')) return;
  if (!problems.check(!!output, 'no [part="output"]')) return;
  problems.check(container!.contains(output!), 'the output is not inside the container');

  // The output is a live log: new lines have to be announced, and a terminal
  // that replaced its whole transcript on every write would be unreadable.
  problems.equal(output!.getAttribute('role'), 'log', 'output role');
  problems.equal(output!.getAttribute('aria-live'), 'polite', 'output aria-live');

  const inputLine = part(el, 'input-line');
  const prompt = part(el, 'prompt');
  const input = part(el, 'input') as HTMLInputElement | null;

  if (vector.readonly) {
    // `readonly` is documented as a boolean property of the terminal itself,
    // and a read-only terminal has nothing to type into.
    problems.check(!inputLine, 'a readonly terminal still renders an input line');
    problems.check(!input, 'a readonly terminal still renders a text input');
    return;
  }

  if (!problems.check(!!inputLine, 'no [part="input-line"]')) return;
  if (!problems.check(!!prompt, 'no [part="prompt"]')) return;
  if (!problems.check(!!input, 'no [part="input"]')) return;
  problems.check(inputLine!.contains(prompt!), 'the prompt is not on the input line');
  problems.check(inputLine!.contains(input!), 'the input is not on the input line');
  problems.equal(text(prompt), vector.prompt.trim(), 'prompt text');
  problems.equal(input!.getAttribute('type'), 'text', 'input type');
  problems.check(!!input!.getAttribute('aria-label'), 'the input has no aria-label');
}

/** One line per written entry, each carrying its documented type. */
export function checkLines(
  problems: Problems, el: HTMLElement, expected: Array<{ content: string; type: LineType }>,
): void {
  const rendered = lines(el);
  if (!problems.equal(rendered.length, expected.length, 'rendered line count')) return;

  problems.equal(lineTexts(el), expected.map(line => line.content), 'line text');
  problems.equal(lineTypes(el), expected.map(line => line.type), 'line data-type');

  rendered.forEach((line, i) => {
    // The type is also a class, because the stylesheet colours lines by type
    // (`.terminal-line.error { … }`) and a line that does not carry it is
    // painted as ordinary output whatever its data attribute says.
    problems.check(line.classList.contains(expected[i].type),
      `line ${i} does not carry the "${expected[i].type}" class (${line.className})`);
    problems.check(!!line.querySelector('.line-content'),
      `line ${i} has no [part="line-content"]`);
  });
}

/**
 * `show-timestamps`: documented as a boolean, and `part="timestamp"` as the
 * element it produces. Every line gets one, or none does.
 */
export function checkTimestamps(problems: Problems, el: HTMLElement, vector: Vector): void {
  const stamps = parts(el, 'timestamp');
  const count = lines(el).length;
  problems.equal(stamps.length, vector.showTimestamps ? count : 0,
    `timestamp elements for show-timestamps=${vector.showTimestamps}`);
  if (!vector.showTimestamps) return;
  for (const [i, stamp] of stamps.entries()) {
    problems.check(/^\d{1,2}:\d{2}:\d{2}$/.test(text(stamp)),
      `timestamp ${i} reads "${text(stamp)}", not a wall-clock time`);
  }
}

// ── Interaction ─────────────────────────────────────────────────────────────

/**
 * Type `command` into the terminal input and press Enter, then wait for the
 * whole entry to finish.
 *
 * Entering a command runs the component's `@request('terminal-command')` round
 * trip, and with no responding controller attached that request TIMES OUT after
 * 50ms and writes an error line. That line is part of the transcript whether a
 * test wants it or not, so this settles past the timeout: an assertion made
 * before it lands would pass or fail on scheduling rather than on behaviour.
 */
export async function runCommand(el: HTMLElement, command: string): Promise<void> {
  const input = part(el, 'input') as HTMLInputElement | null;
  if (!input) throw new Error('the terminal rendered no input to type into');
  input.value = command;
  press(input, 'Enter');
  await wait(120);
}

/** Press a key on the terminal input without typing anything first. */
export async function pressInput(
  el: HTMLElement, key: string, init: KeyboardEventInit = {},
): Promise<void> {
  const input = part(el, 'input') as HTMLInputElement | null;
  input?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true, ...init,
  }));
  await wait(SETTLE);
}

/** The current value of the terminal's input box. */
export const inputValue = (el: HTMLElement): string =>
  (part(el, 'input') as HTMLInputElement | null)?.value ?? '';

/** An `AsyncIterable<string>` over the given chunks, for `pipeFrom`. */
export async function* chunks(list: string[]): AsyncIterable<string> {
  for (const chunk of list) yield chunk;
}

/** A `ReadableStream<Uint8Array>` over the given chunks, for `pipeFrom`. */
export function byteStream(list: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of list) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}
