/**
 * Smoke slice of the snice-terminal matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/terminal/, ~300 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and it routes every assertion through
 * the matrix's own oracle so it cannot claim something the full suite does not.
 *
 * The marquee combos: the documented chrome, a typed command, the streaming
 * live line, `max-lines`, escaping, and the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, ansiSpans, captureEvents, checkChrome, checkLines, checkTimestamps,
  chunks, inputValue, lineTexts, lines, mountTerminal, runCommand, wait, SETTLE, type Vector,
} from './terminal-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('terminal matrix smoke', () => {
  it('<snice-terminal> renders a log, a prompt and an input', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    const vector = { ...DEFAULTS } as Vector;

    const terminal = el as any;
    problems.equal(terminal.prompt, DEFAULTS.prompt, 'default prompt');
    problems.equal(terminal.cwd, DEFAULTS.cwd, 'default cwd');
    problems.equal(terminal.readonly, DEFAULTS.readonly, 'default readonly');
    problems.equal(terminal.maxLines, DEFAULTS.maxLines, 'default maxLines');
    problems.equal(terminal.showTimestamps, DEFAULTS.showTimestamps, 'default showTimestamps');
    problems.equal(terminal.getHistory(), [], 'default history');

    checkChrome(problems, el, vector);
    problems.equal(lines(el).length, 0, 'a fresh terminal has a transcript');

    expectClean(problems, 'smoke/defaults');
  });

  it('the writers produce typed lines, with timestamps when asked', async () => {
    const vector = { ...DEFAULTS, showTimestamps: true } as Vector;
    el = await mountTerminal(vector);
    const problems = new Problems();

    (el as any).writeln('Welcome!', 'info');
    (el as any).writeError('Something failed');
    await wait(SETTLE);

    checkLines(problems, el, [
      { content: 'Welcome!', type: 'info' },
      { content: 'Something failed', type: 'error' },
    ]);
    checkTimestamps(problems, el, vector);

    expectClean(problems, 'smoke/writers');
  });

  it('entering a command echoes it, parses it, and records it', async () => {
    el = await mountTerminal();
    const commands = captureEvents<{ command: string; args: string[] }>(el, 'terminal-command');
    const problems = new Problems();

    await runCommand(el, 'git commit -m wip');

    if (problems.equal(commands.length, 1, 'terminal-command events')) {
      problems.equal(commands[0].command, 'git', 'detail.command');
      problems.equal(commands[0].args, ['commit', '-m', 'wip'], 'detail.args');
    }
    problems.equal(lineTexts(el)[0], '$ git commit -m wip', 'the echoed command line');
    problems.equal(inputValue(el), '', 'the input was not cleared');
    problems.equal((el as any).getHistory(), ['git commit -m wip'], 'getHistory()');

    expectClean(problems, 'smoke/command');
  });

  it('a streamed partial line stays live until a newline commits it', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).appendChunk('down');
    (el as any).appendChunk('loading');
    await wait(SETTLE);
    problems.equal(lineTexts(el), ['downloading'], 'the live line while it grows');

    (el as any).appendChunk('… done\nnext');
    await wait(SETTLE);
    problems.equal(lineTexts(el), ['downloading… done', 'next'], 'after a newline commits it');

    expectClean(problems, 'smoke/streaming');
  });

  it('pipeFrom drains a source into the transcript', async () => {
    el = await mountTerminal({ maxLines: 3 });
    const problems = new Problems();

    await (el as any).pipeFrom(chunks(['1\n', '2\n', '3\n', '4\n']), 'info');
    await wait(SETTLE);

    problems.equal(lineTexts(el), ['2', '3', '4'], 'piped transcript under max-lines=3');
    expectClean(problems, 'smoke/pipeFrom');
  });

  it('clear() empties the transcript and announces it', async () => {
    el = await mountTerminal();
    const cleared = captureEvents(el, 'terminal-clear');
    const problems = new Problems();

    (el as any).writeln('one');
    (el as any).clear();
    await wait(SETTLE);

    problems.equal(lines(el).length, 0, 'lines after clear()');
    problems.equal(cleared.length, 1, 'terminal-clear events');

    expectClean(problems, 'smoke/clear');
  });

  it('written content cannot inject markup', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).writeln('<img src=x onerror=alert(1)>');
    await wait(SETTLE);

    problems.equal(lineTexts(el), ['<img src=x onerror=alert(1)>'], 'the payload is shown verbatim');
    problems.equal(el.shadowRoot!.querySelectorAll('img').length, 0, 'a real element was created');

    expectClean(problems, 'smoke/escaping');
  });

  // MATRIX-terminal-1 — see tests/matrix/terminal/output.test.ts.
  // `write()` is documented as writing WITHOUT a newline, but is the same
  // function as `writeln()`, so every call ends its line.
  it.fails('MATRIX-terminal-1: write() leaves the line open for the next write', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).write('abc');
    (el as any).write('def');
    await wait(SETTLE);
    problems.equal(lineTexts(el), ['abcdef'], 'two writes without a newline');
    expectClean(problems, 'smoke/write');
  });

  // MATRIX-terminal-2 — see tests/matrix/terminal/ansi.test.ts.
  // The sixteen documented `--snice-terminal-ansi-*` custom properties never
  // reach the output: ANSI runs get a hardcoded inline colour instead.
  it.fails('MATRIX-terminal-2: an ANSI run is themable by its custom property', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).writeln('\x1b[31mfailed\x1b[0m');
    await wait(SETTLE);
    const span = ansiSpans(el)[0];
    if (problems.check(!!span, 'the coloured run was not wrapped at all')) {
      problems.check(span!.classList.contains('ansi-red'),
        `the coloured run carries no "ansi-red" class (style="${span!.getAttribute('style')}")`);
      problems.equal(span!.style.color, '', 'the coloured run carries a hardcoded inline colour');
    }
    expectClean(problems, 'smoke/ansi');
  });
});
