/**
 * snice-code-block matrix — the FINDINGS, both FIXED.
 *
 * Per `.ai/fuzzing.md`: a combo that diverges from the documentation keeps its
 * CORRECT assertion and is marked `it.fails` with a finding id, paired with a
 * "reproduces" test asserting what the component actually does. Both findings
 * here have been fixed in the source: the pins are unwrapped into plain
 * assertions (marked `(fixed)`) and the reproduces pairs — which asserted the
 * broken output — were removed with them.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, mount, removeComponent, wait } from '../matrix-common';
import {
  SNIPPETS, checkCodeBlock, renderedLineNumbers, renderedLines, highlightedIndices,
} from './code-block-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * Mount through the PROPERTY channel only — the second documented way to give
 * a code block its code:
 *
 *     import 'snice/components/code-block/snice-code-block';
 *     cb.code = 'const x = 1;';
 *
 * (docs/ai/components/code-block.md, "Basic Usage")
 */
async function mountViaProperty(code: string, props: Record<string, any> = {}) {
  const block = await mount<HTMLElement>('snice-code-block', props);
  (block as any).code = code;
  await wait(60);
  return block;
}

/** A block whose code arrives as slotted text, at every documented default. */
async function mountCodeBlockSlotted(code: string) {
  const indented = code.split('\n').map(line => (line ? `      ${line}` : line)).join('\n');
  const block = await mount<HTMLElement>('snice-code-block', {}, { html: `\n${indented}\n    ` });
  await wait(40);
  return block;
}

describe('code-block matrix: defects', () => {
  // ── MATRIX-code-block-1 (fixed) ────────────────────────────────────────
  //
  // `code` is documented as a PROPERTY ("code: string = ''; // Set via slot
  // or property") and the Basic Usage block assigns it directly:
  //
  //     cb.code = 'const x = 1;';
  //
  // Formerly nothing was displayed: `code` was a plain class field, so the
  // assignment reached no render. Fixed — `code` is now a reactive property
  // whose watcher re-runs `highlight()`, so the assignment renders.
  it('MATRIX-code-block-1 (fixed): assigning the code property renders the code', async () => {
    const combo = { snippet: 'oneLine' as const };
    el = await mountViaProperty(SNIPPETS.oneLine);
    expectClean(checkCodeBlock(el, combo), 'code-via-property');
  });

  it('MATRIX-code-block-1 (fixed): calling highlight() by hand renders too', async () => {
    el = await mountViaProperty(SNIPPETS.threeLines);
    await (el as any).highlight();
    await wait(30);
    expect(renderedLines(el)).toEqual(SNIPPETS.threeLines.split('\n'));
  });

  // ── MATRIX-code-block-2 (fixed) ────────────────────────────────────────
  //
  // `showLineNumbers`, `startLine` and `highlightLines` are documented as
  // ordinary properties with defaults, exactly like `filename`, `copyable`,
  // `language`, `grammar`, `fetchMode` and `format`, which all carry watchers.
  // These three formerly did not, so a rendered block ignored them. Fixed —
  // all three now reach the rendered block. `startLine` is asserted through
  // the gutter it numbers: with no gutter and no highlights there is
  // legitimately nothing on screen for it to change.
  it('MATRIX-code-block-2 (fixed): setting showLineNumbers after mount shows the gutter', async () => {
    el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
    expect(renderedLineNumbers(el)).toEqual([]);
    (el as any).showLineNumbers = true;
    await wait(60);
    expect(renderedLineNumbers(el)).toEqual([1, 2, 3]);
  });

  it('MATRIX-code-block-2 (fixed): setting startLine after mount renumbers the gutter', async () => {
    el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
    (el as any).showLineNumbers = true;
    await wait(60);
    (el as any).startLine = 10;
    await wait(60);
    expect(renderedLineNumbers(el)).toEqual([10, 11, 12]);
  });

  it('MATRIX-code-block-2 (fixed): setting highlightLines after mount highlights that line', async () => {
    el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
    expect(highlightedIndices(el)).toEqual([]);
    (el as any).highlightLines = [2];
    await wait(60);
    expect(highlightedIndices(el)).toEqual([1]);
  });

  it('MATRIX-code-block-1 does NOT affect the slot channel', async () => {
    // The counterpart: the same code arriving as slotted text renders, which
    // is why the rest of this matrix mounts through the slot.
    el = await mount<HTMLElement>('snice-code-block', {}, { html: `\n  ${SNIPPETS.oneLine}\n` });
    await wait(40);
    expect(renderedLines(el)).toEqual([SNIPPETS.oneLine]);
  });
});
