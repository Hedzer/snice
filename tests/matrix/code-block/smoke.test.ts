/**
 * Smoke slice of the snice-code-block matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/code-block: 96 display combos, 48 header and
 * language combos, the format/highlight/grammar pipeline and its 12 delivery
 * combos) runs via `npm run test:matrix`. This file stays collected by the
 * default loop and pays for one combo per family:
 *
 *   · a slotted, dedented block with all seven documented parts;
 *   · line numbers from a non-default `startLine`, plus `highlightLines` read
 *     in that frame — the two properties whose interaction is easy to break;
 *   · `copyable=false`, the one switch that withdraws chrome;
 *   · `copy()`, the whole clipboard contract in one call;
 *   · `setFormatter` + `format`, the documented gate and event pair;
 *   · the ONE pinned finding, MATRIX-code-block-1.
 *
 * Every structural assertion routes through the matrix's own oracle, so this
 * file cannot drift into something weaker than the suite it stands in for.
 * BUDGET: under ~1s.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { expectClean, mount, removeComponent, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import {
  SNIPPETS, checkCodeBlock, comboId, mountCodeBlock, recordEvents, renderedLines,
  type CodeBlockCombo,
} from './code-block-support';

let el: HTMLElement | null = null;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  vi.restoreAllMocks();
});

describe('code-block matrix smoke', () => {
  it('slotted code arrives dedented, in a block with all seven parts', async () => {
    const combo: CodeBlockCombo = { snippet: 'threeLines', language: 'javascript' };
    el = await mountCodeBlock(combo);
    expectClean(checkCodeBlock(el, combo), comboId(combo));
    expect((el as any).code).toBe(SNIPPETS.threeLines);
  });

  it('line numbers count from start-line, and highlight-lines is read in that frame', async () => {
    const combo: CodeBlockCombo = {
      snippet: 'threeLines', language: 'javascript',
      showLineNumbers: true, startLine: 10, highlightLines: [11],
    };
    el = await mountCodeBlock(combo);
    expectClean(checkCodeBlock(el, combo), comboId(combo));
  });

  it('copyable=false withdraws the copy button', async () => {
    const combo: CodeBlockCombo = { snippet: 'oneLine', copyable: false, filename: 'app.ts' };
    el = await mountCodeBlock(combo);
    expectClean(checkCodeBlock(el, combo), comboId(combo));
  });

  it('copy() writes the code and announces code-copy', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines' });
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    const events = recordEvents(el);

    await (el as any).copy();
    await wait(20);

    expect(writeText).toHaveBeenCalledWith(SNIPPETS.threeLines);
    expect(events.of('code-copy')[0]).toMatchObject({ code: SNIPPETS.threeLines });
    expect(textOf(exactPart(el, 'copy-button'))).toBe('Copied!');
  });

  it('setFormatter runs behind the format gate, in the documented event order', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine', language: 'javascript' });
    (el as any).setFormatter((code: string) => code.replace('const', 'let'));
    const events = recordEvents(el);

    (el as any).format = 'pretty';
    await wait(40);

    expect(events.seen.map(e => e.type)).toEqual([
      'code-before-format', 'code-after-format',
      'code-before-highlight', 'code-after-highlight',
    ]);
    expect(renderedLines(el)).toEqual(['let x = 1;']);
  });

  // MATRIX-code-block-1: `code` is a plain class field with no watcher, so the
  // documented `cb.code = '…'` assignment reaches no render.
  it.fails('MATRIX-code-block-1: assigning the code property renders the code', async () => {
    el = await mount<HTMLElement>('snice-code-block', {});
    (el as any).code = SNIPPETS.oneLine;
    await wait(60);
    expectClean(checkCodeBlock(el, { snippet: 'oneLine' }), 'code-via-property');
  });

  it('MATRIX-code-block-1 reproduces: the property assignment leaves the block empty', async () => {
    el = await mount<HTMLElement>('snice-code-block', {});
    (el as any).code = SNIPPETS.oneLine;
    await wait(60);
    expect(exactPart(el, 'code')!.textContent).toBe('');
  });

  // MATRIX-code-block-2: `showLineNumbers`, `startLine` and `highlightLines`
  // carry no watcher, so a rendered block ignores them.
  it.fails('MATRIX-code-block-2: setting highlightLines after mount re-renders', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines' });
    const before = exactPart(el, 'code')!.innerHTML;
    (el as any).highlightLines = [2];
    await wait(60);
    expect(exactPart(el, 'code')!.innerHTML).not.toBe(before);
  });

  it('MATRIX-code-block-2 reproduces: the rendered code is untouched', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines' });
    const before = exactPart(el, 'code')!.innerHTML;
    (el as any).highlightLines = [2];
    await wait(60);
    expect(exactPart(el, 'code')!.innerHTML).toBe(before);
  });
});
