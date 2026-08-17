/**
 * snice-terminal matrix — commands, history, clearing, and the events.
 *
 * Documented:
 *   · `terminal-command` -> `{ command, args }` — "Command entered"
 *   · `terminal-clear` -> `{}` — "Terminal cleared"
 *   · `terminal-ready` -> `{}` — "Terminal ready"
 *   · `getHistory()` / `clearHistory()`
 *   · `prompt` — the string in front of what the user types
 *   · `readonly` — a terminal with no input
 *
 * The cross for command entry is over the SHAPES of a command line, because
 * `{ command, args }` is a parse and every shape below parses differently:
 * bare, with arguments, with runs of whitespace, with surrounding whitespace,
 * and empty.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkChrome, inputValue, lineTexts, lineTypes, lines,
  mountTerminal, part, pressInput, runCommand, wait, SETTLE, type Vector,
} from './terminal-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

interface Entry {
  name: string;
  typed: string;
  /** `{ command, args }` as the documented payload, or null for "nothing ran". */
  parsed: { command: string; args: string[] } | null;
}

const ENTRIES: Entry[] = [
  { name: 'bare', typed: 'ls', parsed: { command: 'ls', args: [] } },
  { name: 'one-arg', typed: 'cat file.txt', parsed: { command: 'cat', args: ['file.txt'] } },
  {
    name: 'several-args',
    typed: 'git commit -m wip',
    parsed: { command: 'git', args: ['commit', '-m', 'wip'] },
  },
  {
    name: 'runs-of-whitespace',
    typed: 'echo   a    b',
    parsed: { command: 'echo', args: ['a', 'b'] },
  },
  {
    name: 'surrounded-by-whitespace',
    typed: '   ls -la   ',
    parsed: { command: 'ls', args: ['-la'] },
  },
  // "Command entered" — nothing was.
  { name: 'empty', typed: '', parsed: null },
  { name: 'whitespace-only', typed: '    ', parsed: null },
];

const PROMPTS = ['$ ', '> ', 'snice:~$ '];

describe('terminal matrix: entering a command', () => {
  for (const combo of cross({ entry: ENTRIES, prompt: PROMPTS })) {
    const entry = combo.entry as Entry;
    const prompt = combo.prompt as string;
    const id = `${entry.name}/prompt="${prompt}"`;

    it(id, async () => {
      el = await mountTerminal({ prompt });
      const commands = captureEvents<{ command: string; args: string[] }>(el, 'terminal-command');
      const problems = new Problems();

      await runCommand(el, entry.typed);

      if (!entry.parsed) {
        problems.equal(commands.length, 0, 'an empty command line still fired terminal-command');
        problems.equal((el as any).getHistory(), [], 'an empty command line entered history');
        problems.equal(lines(el).length, 0, 'an empty command line wrote a transcript line');
        expectClean(problems, id);
        return;
      }

      if (problems.equal(commands.length, 1, 'terminal-command events')) {
        problems.equal(commands[0].command, entry.parsed.command, 'detail.command');
        problems.equal(commands[0].args, entry.parsed.args, 'detail.args');
      }

      // The transcript echoes what was typed, behind the prompt, as an `input`
      // line — the one line type named for exactly this.
      const echoed = [entry.parsed.command, ...entry.parsed.args].join(' ');
      problems.equal(lineTexts(el)[0], `${prompt}${echoed}`.replace(/\s+/g, ' ').trim(),
        'the echoed command line');
      problems.equal(lineTypes(el)[0], 'input', 'the echoed line type');

      // …and the input box is empty again, ready for the next command.
      problems.equal(inputValue(el), '', 'the input was not cleared after Enter');

      // Documented: `getHistory()` — "Get command history".
      problems.equal((el as any).getHistory(), [entry.typed.trim()], 'getHistory()');

      expectClean(problems, id);
    });
  }
});

describe('terminal matrix: history', () => {
  it('getHistory returns the commands in the order they were entered', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    for (const command of ['one', 'two', 'three']) await runCommand(el, command);

    problems.equal((el as any).getHistory(), ['one', 'two', 'three'], 'getHistory()');
    expectClean(problems, 'history/order');
  });

  it('getHistory hands back a copy, not the terminal\'s own list', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    await runCommand(el, 'ls');
    const history = (el as any).getHistory() as string[];
    history.push('rm -rf /');

    problems.equal((el as any).getHistory(), ['ls'],
      'mutating the returned array changed the terminal\'s history');
    expectClean(problems, 'history/copy');
  });

  it('clearHistory empties it without touching the transcript', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    await runCommand(el, 'ls');
    const transcript = lineTexts(el);
    (el as any).clearHistory();
    await wait(SETTLE);

    problems.equal((el as any).getHistory(), [], 'getHistory() after clearHistory()');
    problems.equal(lineTexts(el), transcript,
      'clearHistory() also cleared the transcript — the doc gives clear() that job');
    expectClean(problems, 'history/clear');
  });

  it('ArrowUp and ArrowDown walk the history', async () => {
    // Documented under the component's own keyboard affordances: the history is
    // there to be recalled, and a terminal input is where it is recalled from.
    el = await mountTerminal();
    const problems = new Problems();

    for (const command of ['first', 'second', 'third']) await runCommand(el, command);

    await pressInput(el, 'ArrowUp');
    problems.equal(inputValue(el), 'third', 'ArrowUp once');
    await pressInput(el, 'ArrowUp');
    problems.equal(inputValue(el), 'second', 'ArrowUp twice');
    await pressInput(el, 'ArrowUp');
    problems.equal(inputValue(el), 'first', 'ArrowUp three times');
    await pressInput(el, 'ArrowUp');
    problems.equal(inputValue(el), 'first', 'ArrowUp past the oldest command');

    await pressInput(el, 'ArrowDown');
    problems.equal(inputValue(el), 'second', 'ArrowDown once');
    await pressInput(el, 'ArrowDown');
    problems.equal(inputValue(el), 'third', 'ArrowDown twice');
    await pressInput(el, 'ArrowDown');
    problems.equal(inputValue(el), '', 'ArrowDown back past the newest command');

    expectClean(problems, 'history/arrows');
  });

  it('an empty history has nothing to walk', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    await pressInput(el, 'ArrowUp');
    problems.equal(inputValue(el), '', 'ArrowUp with no history');
    await pressInput(el, 'ArrowDown');
    problems.equal(inputValue(el), '', 'ArrowDown with no history');

    expectClean(problems, 'history/empty');
  });
});

describe('terminal matrix: clear', () => {
  for (const written of [0, 1, 5]) {
    it(`clear() after ${written} lines`, async () => {
      el = await mountTerminal();
      const cleared = captureEvents(el, 'terminal-clear');
      const problems = new Problems();

      for (let i = 0; i < written; i++) (el as any).writeln(`line ${i}`);
      await wait(SETTLE);

      (el as any).clear();
      await wait(SETTLE);

      problems.equal(lines(el).length, 0, 'lines after clear()');
      problems.equal(cleared.length, 1, 'terminal-clear events');
      // Documented separately from the transcript: `clearHistory()` is the
      // method that empties the history.
      expectClean(problems, `clear/${written}`);
    });
  }

  it('clear() leaves the command history alone', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    await runCommand(el, 'ls');
    (el as any).clear();
    await wait(SETTLE);

    problems.equal((el as any).getHistory(), ['ls'],
      'clear() also cleared the history — the doc gives clearHistory() that job');
    expectClean(problems, 'clear/history');
  });
});

describe('terminal matrix: readonly', () => {
  for (const showTimestamps of [false, true]) {
    it(`a readonly terminal has no input (show-timestamps=${showTimestamps})`, async () => {
      const vector = { ...DEFAULTS, readonly: true, showTimestamps } as Vector;
      el = await mountTerminal(vector);
      const problems = new Problems();

      checkChrome(problems, el, vector);
      // …but it still shows output. `readonly` is documented as a property of
      // the terminal's INPUT, not of its transcript.
      (el as any).writeln('read only, still writable by the app', 'info');
      await wait(SETTLE);
      problems.equal(lineTexts(el), ['read only, still writable by the app'],
        'a readonly terminal refused programmatic output');

      expectClean(problems, `readonly/${showTimestamps}`);
    });
  }
});

describe('terminal matrix: terminal-ready', () => {
  it('fires once when the terminal is ready', async () => {
    // The event has to be observable, which means listening before the element
    // is connected — `@ready` runs during connection.
    const host = document.createElement('snice-terminal');
    const ready = captureEvents(host, 'terminal-ready');
    document.body.appendChild(host);
    await (host as any).ready;
    await wait(SETTLE);

    const problems = new Problems();
    problems.equal(ready.length, 1, 'terminal-ready events');
    problems.check(!!part(host, 'container'),
      'terminal-ready fired before the terminal had rendered');
    host.remove();

    expectClean(problems, 'terminal-ready');
  });
});
