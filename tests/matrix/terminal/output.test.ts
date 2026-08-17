/**
 * snice-terminal matrix — the writers and the lines they produce.
 *
 * The cross: writer (4) x line type (6) x `show-timestamps` (2) x `readonly`
 * (2) = 96 combos. Every documented writer is crossed against every documented
 * line type, because the type is what the stylesheet colours by and the writers
 * disagree about how a type is chosen: `write`/`writeln` take one, `writeError`
 * fixes it to `error`, and `writeLines` carries one per entry.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, LINE_TYPES, Problems, checkChrome, checkLines, checkTimestamps, lineTexts, lines,
  mountTerminal, type LineType, type Vector,
} from './terminal-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

type Writer = 'write' | 'writeln' | 'writeError' | 'writeLines';

/** How each documented writer is called, and the type it produces. */
function emit(terminal: any, writer: Writer, content: string, type: LineType): LineType {
  switch (writer) {
    case 'write': terminal.write(content, type); return type;
    case 'writeln': terminal.writeln(content, type); return type;
    // "Write error line" — the type is the method's whole point.
    case 'writeError': terminal.writeError(content); return 'error';
    case 'writeLines': terminal.writeLines([{ content, type }]); return type;
  }
}

const combos = cross({
  writer: ['write', 'writeln', 'writeError', 'writeLines'] as const,
  type: LINE_TYPES,
  showTimestamps: [false, true],
  readonly: [false, true],
});

describe('terminal matrix: writers', () => {
  for (const combo of combos) {
    const vector = {
      ...DEFAULTS, showTimestamps: combo.showTimestamps, readonly: combo.readonly,
    } as Vector;
    it(combo.id, async () => {
      el = await mountTerminal(vector);
      const problems = new Problems();

      const produced = emit(el as any, combo.writer as Writer, 'hello world', combo.type as LineType);
      await new Promise(resolve => setTimeout(resolve, 30));

      checkChrome(problems, el, vector);
      checkLines(problems, el, [{ content: 'hello world', type: produced }]);
      checkTimestamps(problems, el, vector);

      expectClean(problems, combo.id);
    });
  }
});

describe('terminal matrix: multi-line content', () => {
  // A writer given embedded newlines produces one LINE per newline-separated
  // piece — the transcript is a list of lines, and a "line" that wrapped a
  // three-line payload into one element could never be trimmed by `max-lines`
  // or coloured per type.
  for (const writer of ['write', 'writeln'] as const) {
    for (const type of LINE_TYPES) {
      it(`${writer}/${type}: embedded newlines split`, async () => {
        el = await mountTerminal();
        const problems = new Problems();

        (el as any)[writer]('one\ntwo\nthree', type);
        await new Promise(resolve => setTimeout(resolve, 30));

        checkLines(problems, el, [
          { content: 'one', type }, { content: 'two', type }, { content: 'three', type },
        ]);

        expectClean(problems, `${writer}/${type}/multiline`);
      });
    }
  }

  it('writeLines writes one line per entry, each with its own type', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).writeLines([
      { content: 'building', type: 'info' },
      { content: 'ok', type: 'success' },
      { content: 'no type given' },
    ]);
    await new Promise(resolve => setTimeout(resolve, 30));

    checkLines(problems, el, [
      { content: 'building', type: 'info' },
      { content: 'ok', type: 'success' },
      // The doc's `writeLines(lines: Array<{ content, type? }>)` makes `type`
      // optional, and the writers' own default type is `output`.
      { content: 'no type given', type: 'output' },
    ]);

    expectClean(problems, 'writeLines');
  });

  it('the default type is "output" for every writer that takes one', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).write('a');
    (el as any).writeln('b');
    await new Promise(resolve => setTimeout(resolve, 30));

    checkLines(problems, el, [
      { content: 'a', type: 'output' }, { content: 'b', type: 'output' },
    ]);

    expectClean(problems, 'default-type');
  });
});

/**
 * MATRIX-terminal-1
 *
 * Combo:    `terminal.write('abc'); terminal.write('def');`
 * Expected: one line reading `abcdef`. The doc gives the two writers different
 *           jobs and nothing else distinguishes them:
 *             · `write(content, type?)`   — "Write without newline"
 *             · `writeln(content, type?)` — "Write with newline"
 *           A write that does not end its line leaves the line open for the
 *           next write, which is the entire meaning of the distinction (and the
 *           behaviour the streaming section describes for its own raw feed: "a
 *           trailing partial line stays live and grows until a newline commits
 *           it").
 * Actual:   two lines, `abc` and `def`. `writeln()` is `return this.write(...)`
 *           — the same function under two names — so every `write()` terminates
 *           its line. Building a progress line with repeated `write()` calls
 *           produces one transcript line per call, and there is no documented
 *           way to write without a newline at all: the streaming API's
 *           `appendChunk` is the only method that actually behaves the way
 *           `write` is documented to.
 */
describe('terminal matrix: write vs writeln', () => {
  it.fails('MATRIX-terminal-1: write() leaves the line open for the next write', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).write('abc');
    (el as any).write('def');
    await new Promise(resolve => setTimeout(resolve, 30));

    problems.equal(lineTexts(el), ['abcdef'], 'two writes without a newline');
    expectClean(problems, 'write-without-newline');
  });

  it('writeln() always ends its line', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).writeln('abc');
    (el as any).writeln('def');
    await new Promise(resolve => setTimeout(resolve, 30));

    problems.equal(lineTexts(el), ['abc', 'def'], 'two writeln calls');
    expectClean(problems, 'writeln');
  });

  it.fails('MATRIX-terminal-1: write() then writeln() closes the one open line', async () => {
    el = await mountTerminal();
    (el as any).write('loading');
    (el as any).writeln('… done');
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(
      (() => {
        const problems = new Problems();
        problems.equal(lineTexts(el!), ['loading… done'], 'write then writeln');
        return problems;
      })(),
      'write-then-writeln',
    );
  });
});

describe('terminal matrix: max-lines', () => {
  // Documented: "maxLines: number = 1000" — "Maximum number of lines to keep in
  // history". The transcript is trimmed from the OLDEST end, because a terminal
  // that dropped its newest output would be showing the past.
  for (const maxLines of [1, 3, 10]) {
    for (const written of [1, 3, 12]) {
      it(`max-lines=${maxLines} after ${written} lines`, async () => {
        el = await mountTerminal({ maxLines });
        const problems = new Problems();

        for (let i = 0; i < written; i++) (el as any).writeln(`line ${i}`);
        await new Promise(resolve => setTimeout(resolve, 30));

        const kept = Math.min(written, maxLines);
        problems.equal(lines(el).length, kept, 'lines kept');
        problems.equal(lineTexts(el),
          Array.from({ length: kept }, (_, i) => `line ${written - kept + i}`),
          'the newest lines are the ones kept');

        expectClean(problems, `max-lines=${maxLines}/written=${written}`);
      });
    }
  }
});
