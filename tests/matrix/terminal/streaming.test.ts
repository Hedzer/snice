/**
 * snice-terminal matrix — the streaming API.
 *
 * Documented: "feed raw chunks without splitting on newlines; a trailing
 * partial line stays live and grows until a newline commits it", with
 * `appendChunk(chunk, type?)`, `pipeFrom(source, type?)` over an
 * `AsyncIterable<string>` or a `ReadableStream<string|Uint8Array>`, and
 * `commitLiveLine()`.
 *
 * The cross: chunk script (8) x line type (6) = 48 combos. A "script" is a list
 * of chunks fed one at a time; the expected transcript is derived from the
 * documented rule alone — join the chunks, split on `\n`, and a trailing piece
 * with no newline after it is the live line.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, LINE_TYPES, Problems, byteStream, checkLines, chunks, lineTexts, lineTypes,
  mountTerminal, type LineType,
} from './terminal-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const settle = () => new Promise(resolve => setTimeout(resolve, 30));

/**
 * The documented transcript for a chunk script: the concatenation split on
 * newlines, with a trailing empty piece dropped (a stream ending in `\n` has
 * committed its last line and started nothing new).
 */
function expectedLines(script: string[]): string[] {
  const joined = script.join('');
  if (!joined) return [];
  const pieces = joined.split('\n');
  if (pieces[pieces.length - 1] === '') pieces.pop();
  return pieces;
}

const SCRIPTS: Array<{ name: string; script: string[] }> = [
  { name: 'one-partial', script: ['abc'] },
  { name: 'growing-partial', script: ['ab', 'cd', 'ef'] },
  { name: 'committed', script: ['abc\n'] },
  { name: 'partial-then-newline', script: ['abc', 'def\n'] },
  { name: 'newline-inside-chunk', script: ['one\ntwo'] },
  { name: 'many-lines-one-chunk', script: ['one\ntwo\nthree\n'] },
  { name: 'newline-split-across-chunks', script: ['one', '\n', 'two'] },
  { name: 'blank-lines', script: ['a\n\nb\n'] },
];

describe('terminal matrix: appendChunk', () => {
  for (const combo of cross({ entry: SCRIPTS, type: LINE_TYPES })) {
    const entry = combo.entry as { name: string; script: string[] };
    const type = combo.type as LineType;
    const id = `${entry.name}/type=${type}`;

    it(id, async () => {
      el = await mountTerminal();
      const problems = new Problems();

      for (const chunk of entry.script) (el as any).appendChunk(chunk, type);
      await settle();

      const want = expectedLines(entry.script);
      checkLines(problems, el, want.map(content => ({ content, type })));

      expectClean(problems, id);
    });
  }

  it('appendChunk defaults to the "output" type', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).appendChunk('plain\n');
    await settle();
    checkLines(problems, el, [{ content: 'plain', type: 'output' }]);
    expectClean(problems, 'appendChunk/default-type');
  });

  it('an empty chunk changes nothing', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).appendChunk('live');
    (el as any).appendChunk('');
    await settle();
    problems.equal(lineTexts(el), ['live'], 'transcript after an empty chunk');
    expectClean(problems, 'appendChunk/empty');
  });

  it('a type change mid-stream commits the line in flight', async () => {
    // Documented: `appendChunk(chunk, type?)` types each chunk, and the live
    // line is ONE line — so a chunk of a different type cannot join a line that
    // is already a different colour.
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).appendChunk('building', 'info');
    (el as any).appendChunk('failed', 'error');
    await settle();

    problems.equal(lineTexts(el), ['building', 'failed'], 'transcript across a type change');
    problems.equal(lineTypes(el), ['info', 'error'], 'line types across a type change');

    expectClean(problems, 'appendChunk/type-change');
  });
});

describe('terminal matrix: commitLiveLine', () => {
  // Documented: "Force the live buffer to become a finished line."
  for (const type of LINE_TYPES) {
    it(`commitLiveLine closes the open line (${type})`, async () => {
      el = await mountTerminal();
      const problems = new Problems();

      (el as any).appendChunk('partial', type);
      (el as any).commitLiveLine();
      (el as any).appendChunk('next', type);
      await settle();

      // The committed line is finished, so the following chunk starts a new one
      // instead of growing it.
      problems.equal(lineTexts(el), ['partial', 'next'], 'transcript after commitLiveLine');
      expectClean(problems, `commitLiveLine/${type}`);
    });
  }

  it('commitLiveLine with nothing live is a no-op', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).appendChunk('done\n');
    (el as any).commitLiveLine();
    (el as any).commitLiveLine();
    await settle();
    problems.equal(lineTexts(el), ['done'], 'transcript after redundant commits');
    expectClean(problems, 'commitLiveLine/no-op');
  });
});

describe('terminal matrix: pipeFrom', () => {
  for (const entry of SCRIPTS) {
    for (const source of ['AsyncIterable', 'ReadableStream'] as const) {
      const id = `pipeFrom/${source}/${entry.name}`;
      it(id, async () => {
        el = await mountTerminal();
        const problems = new Problems();

        await (el as any).pipeFrom(
          source === 'AsyncIterable' ? chunks(entry.script) : byteStream(entry.script),
          'info',
        );
        await settle();

        const want = expectedLines(entry.script);
        checkLines(problems, el, want.map(content => ({ content, type: 'info' as const })));

        expectClean(problems, id);
      });
    }
  }

  it('pipeFrom resolves only once the source is exhausted', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    let finished = false;
    const promise = (el as any).pipeFrom(chunks(['a\n', 'b\n', 'c\n'])).then(() => {
      finished = true;
    });
    problems.check(!finished, 'pipeFrom resolved before it was awaited');
    await promise;
    await settle();

    problems.check(finished, 'pipeFrom never resolved');
    problems.equal(lineTexts(el), ['a', 'b', 'c'], 'piped transcript');

    expectClean(problems, 'pipeFrom/resolution');
  });

  it('a byte stream that splits a multi-byte character mid-chunk still reads', async () => {
    // `pipeFrom` is documented to accept `ReadableStream<Uint8Array>`, and a
    // real process stdout splits wherever the pipe buffer ends — including
    // between the two bytes of a "é".
    el = await mountTerminal();
    const problems = new Problems();

    const bytes = new TextEncoder().encode('café au lait\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 4)); // splits the é
        controller.enqueue(bytes.slice(4));
        controller.close();
      },
    });

    await (el as any).pipeFrom(stream);
    await settle();

    problems.equal(lineTexts(el), ['café au lait'], 'a split multi-byte character');
    expectClean(problems, 'pipeFrom/utf8-split');
  });
});

describe('terminal matrix: streaming interacts with the rest of the API', () => {
  it('clear() drops the live line as well as the transcript', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).appendChunk('one\ntwo');
    (el as any).clear();
    (el as any).appendChunk('three');
    await settle();

    // If the live line survived `clear()`, "three" would grow it into
    // "twothree" — a line the terminal was told to forget.
    problems.equal(lineTexts(el), ['three'], 'transcript after clear() mid-stream');
    expectClean(problems, 'streaming/clear');
  });

  it('max-lines trims a streamed transcript from the oldest end', async () => {
    el = await mountTerminal({ maxLines: 3 });
    const problems = new Problems();

    await (el as any).pipeFrom(chunks(['1\n', '2\n', '3\n', '4\n', '5\n']));
    await settle();

    problems.equal(lineTexts(el), ['3', '4', '5'], 'streamed transcript under max-lines=3');
    expectClean(problems, 'streaming/max-lines');
  });
});
