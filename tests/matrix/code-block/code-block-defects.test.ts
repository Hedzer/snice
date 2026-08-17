/**
 * snice-code-block matrix — the pinned FINDINGS.
 *
 * Per `.ai/fuzzing.md`: a combo that diverges from the documentation keeps its
 * CORRECT assertion and is marked `it.fails` with a finding id. Each finding
 * here is paired with a "reproduces" test asserting what the component
 * actually does, so the finding cannot be closed by accident — fixing the
 * component turns the `it.fails` green and the reproduction red at the same
 * time, and both have to be dealt with together.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, mount, removeComponent, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import {
  SNIPPETS, checkCodeBlock, renderedLineNumbers, renderedLines,
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

/** Everything about the rendered code a display property could change. */
function snapshot(block: HTMLElement) {
  return {
    html: exactPart(block, 'code')!.innerHTML,
    lines: renderedLines(block),
    numbers: renderedLineNumbers(block),
  };
}

describe('code-block matrix: defects', () => {
  // ── MATRIX-code-block-1 ────────────────────────────────────────────────
  //
  // `code` is documented as a PROPERTY ("code: string = ''; // Set via slot or
  // property") and the Basic Usage block assigns it directly:
  //
  //     cb.code = 'const x = 1;';
  //
  // Expected: the block displays `const x = 1;`.
  // Actual:   nothing is displayed. `code` is a plain class field, not a
  //           `@property`, and no `@watch` observes it, so the assignment
  //           reaches no render. The slot path works because `@ready` and the
  //           `slotchange` handler both call `highlight()` themselves.
  //
  // Minimal repro (no matrix harness involved):
  //   const cb = document.createElement('snice-code-block');
  //   document.body.append(cb); await cb.ready;
  //   cb.code = 'const x = 1;';        // -> part="code" stays empty
  it.fails('MATRIX-code-block-1: assigning the code property renders the code', async () => {
    const combo = { snippet: 'oneLine' as const };
    el = await mountViaProperty(SNIPPETS.oneLine);
    expectClean(checkCodeBlock(el, combo), 'code-via-property');
  });

  it('MATRIX-code-block-1 reproduces: the property assignment leaves the block empty', async () => {
    el = await mountViaProperty(SNIPPETS.oneLine);
    // The property itself took the value…
    expect((el as any).code).toBe(SNIPPETS.oneLine);
    // …and nothing was rendered from it.
    expect(exactPart(el, 'code')!.textContent).toBe('');
    expect(renderedLines(el)).toEqual(['']);
  });

  it('MATRIX-code-block-1: calling highlight() by hand is the documented workaround', async () => {
    el = await mountViaProperty(SNIPPETS.threeLines);
    await (el as any).highlight();
    await wait(30);
    expect(renderedLines(el)).toEqual(SNIPPETS.threeLines.split('\n'));
  });

  // ── MATRIX-code-block-2 ────────────────────────────────────────────────
  //
  // `showLineNumbers`, `startLine` and `highlightLines` are documented as
  // ordinary properties with defaults. `filename`, `copyable`, `language`,
  // `grammar`, `fetchMode` and `format` all carry watchers and update a
  // rendered block; these three do not, so a block that is already showing
  // code ignores them until something else happens to re-run `highlight()`.
  //
  // Expected: setting `showLineNumbers = true` on a rendered block shows the
  //           gutter, exactly as mounting with `show-line-numbers` does.
  // Actual:   the rendered code is untouched.
  //
  // `highlightLines` is the sharpest case, because the docs mark it "JS-only;
  // no attribute" — the property channel is the ONLY way to set it, and after
  // the first render that channel does nothing.
  for (const [name, value] of [
    ['showLineNumbers', true],
    ['startLine', 10],
    ['highlightLines', [2]],
  ] as Array<[string, any]>) {
    it.fails(`MATRIX-code-block-2: setting ${name} after mount re-renders`, async () => {
      el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
      const before = snapshot(el);
      (el as any)[name] = value;
      await wait(60);
      expect(snapshot(el), `${name} did not reach the rendered block`).not.toEqual(before);
    });
  }

  it('MATRIX-code-block-2 reproduces: the three display properties are inert after mount', async () => {
    el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
    const before = snapshot(el);

    (el as any).showLineNumbers = true;
    (el as any).startLine = 10;
    (el as any).highlightLines = [2];
    await wait(60);

    expect(snapshot(el)).toEqual(before);
    // The properties themselves took their values — only the render is stale.
    expect((el as any).showLineNumbers).toBe(true);
    expect((el as any).startLine).toBe(10);
    expect((el as any).highlightLines).toEqual([2]);
  });

  it('MATRIX-code-block-2: a manual highlight() applies them, which is the workaround', async () => {
    el = await mountCodeBlockSlotted(SNIPPETS.threeLines);
    (el as any).showLineNumbers = true;
    (el as any).startLine = 10;
    await (el as any).highlight();
    await wait(30);
    expect(renderedLineNumbers(el)).toEqual([10, 11, 12]);
  });

  it('MATRIX-code-block-1 does NOT affect the slot channel', async () => {
    // The counterpart: the same code arriving as slotted text renders, which
    // is why the rest of this matrix mounts through the slot.
    el = await mount<HTMLElement>('snice-code-block', {}, { html: `\n  ${SNIPPETS.oneLine}\n` });
    await wait(40);
    expect(renderedLines(el)).toEqual([SNIPPETS.oneLine]);
  });
});
