/**
 * snice-diff matrix — HUNK GROUPING across the documented context width.
 *
 * doc: `contextLines: number = 3` (attr `context-lines`), and
 * doc: "Unchanged sections beyond context are collapsed; click to expand".
 *
 * Together those two sentences are a complete rule: a line within
 * `contextLines` of a change stays open, everything else collapses into a
 * clickable section. This slice crosses all six text scenarios against four
 * context widths (0, 1, 3 — the default — and 10, wide enough to swallow the
 * whole file) in both modes: 6 x 4 x 2 = 48 combos.
 *
 * `expectedHunks` in `diff-support.ts` is that rule, written from the doc. The
 * component adds an undocumented threshold on top of it — a gap is only
 * collapsed when it is longer than `2 * contextLines` — so the combos where the
 * two disagree are pinned as MATRIX-diff-2 rather than accommodated. Which
 * combos those are is DERIVED (`hasShortGap`), not hand-listed, so the pinned
 * set cannot silently grow.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  CONTEXTS, DEFAULTS, MODES, Problems, SCENARIOS, SCENARIO_NAMES, checkRender,
  click, expectClean, expectedHunks, expectedLines, hasShortGap, makeDiff,
  removeComponent, separators, unifiedRows, vectorId, wait,
  type Diff, type DiffVector,
} from './diff-support';

let el: Diff | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const COMBOS: DiffVector[] = [];
for (const scenario of SCENARIO_NAMES) {
  for (const contextLines of CONTEXTS) {
    for (const mode of MODES) {
      COMBOS.push({ ...DEFAULTS, scenario, contextLines, mode });
    }
  }
}

describe('snice-diff matrix: context width', () => {
  for (const vector of COMBOS) {
    const lines = expectedLines(SCENARIOS[vector.scenario]);
    const diverges = hasShortGap(lines, vector.contextLines);
    const id = vectorId(vector);

    // MATRIX-diff-2 (see the pinned test at the bottom of this file): a gap
    // that is beyond context but no longer than `2 * contextLines` is left
    // open instead of collapsed. The assertion below stays the documented one.
    const run = diverges ? it.fails : it;
    run(diverges ? `MATRIX-diff-2: ${id}` : id, async () => {
      el = await makeDiff(vector);
      const problems = new Problems();
      checkRender(problems, el, vector);
      expectClean(problems, id);
    });
  }
});

describe('snice-diff matrix: collapsed sections', () => {
  it('a file with no changes at all collapses into one section', async () => {
    // Every line is "beyond context" when there is no change to be near.
    el = await makeDiff({ scenario: 'identical' });
    const rows = unifiedRows(el, true, true);
    expect(rows.map(row => row.kind)).toEqual(['separator']);
    expect(rows[0].content.replace(/\s+/g, ' ').trim())
      .toBe('... 6 unchanged lines (click to expand)');
  });

  it('a wide enough context leaves nothing collapsed', async () => {
    // `contextLines: 10` reaches across the whole 20-line scenario, so no
    // unchanged line is beyond context and no section may collapse.
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 10 });
    expect(separators(el).length).toBe(0);
    const lines = expectedLines(SCENARIOS['two-far-changes']);
    expect(unifiedRows(el, true, true).length).toBe(lines.length);
  });

  it('the collapsed section counts exactly the lines it hides', async () => {
    // doc: the separator is what stands in for the hidden lines, so its count
    // has to be the number of lines the reader is not being shown.
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3 });
    const hunks = expectedHunks(expectedLines(SCENARIOS['two-far-changes']), 3);
    const hidden = hunks.filter(hunk => hunk.collapsed).map(hunk => hunk.lines.length);
    expect(separators(el).map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()))
      .toEqual(hidden.map(count => `... ${count} unchanged lines (click to expand)`));
  });

  it('narrowing the context re-groups the same diff', async () => {
    // doc: "LCS-based diff computed on oldText/newText/contextLines change".
    // `contextLines` is one of the three inputs that RE-RUN the pipeline, so a
    // change to it must reshape the rendered table without touching the texts.
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 10 });
    expect(separators(el).length, 'a 10-line context collapsed something').toBe(0);
    (el as any).contextLines = 3;
    await wait(30);
    expect(separators(el).length, 'narrowing the context collapsed nothing').toBe(1);
  });
});

// ── Findings ────────────────────────────────────────────────────────────────

describe('snice-diff matrix: findings', () => {
  /**
   * MATRIX-diff-1 — a collapsed section cannot be expanded.
   *
   * `docs/ai/components/diff.md`, Accessibility: "Unchanged sections beyond
   * context are collapsed; click to expand". The separator row is rendered with
   * exactly that label and carries a click handler, and the handler flips the
   * hunk's `collapsed` flag — but the hunk list is a plain private field rather
   * than a rendered input, so the flip schedules no re-render. Every click on
   * every collapsed section in every combo leaves the table byte-identical, and
   * the hidden lines are unreachable for the life of the element.
   */
  it.fails('MATRIX-diff-1: clicking a collapsed section reveals its lines', async () => {
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3 });
    const before = unifiedRows(el, true, true).length;
    const hidden = expectedHunks(expectedLines(SCENARIOS['two-far-changes']), 3)
      .filter(hunk => hunk.collapsed)
      .reduce((total, hunk) => total + hunk.lines.length, 0);

    click(separators(el)[0]);
    await wait(30);

    expect(unifiedRows(el, true, true).length,
      'the collapsed section did not expand when it was clicked')
      .toBe(before - 1 + hidden);
  });

  /**
   * MATRIX-diff-2 — a short section beyond context is not collapsed.
   *
   * doc: "Unchanged sections beyond context are collapsed". The component
   * collapses a run only when it is longer than `2 * contextLines`; a run that
   * is beyond context but no longer than that is merged into the neighbouring
   * open hunk instead. The threshold appears nowhere in the documentation, and
   * it means the same file renders a different number of lines depending on a
   * rule the reader has no way to know about.
   *
   * The combos it affects are pinned above by `hasShortGap`; this test states
   * the rule itself on the smallest case.
   */
  it.fails('MATRIX-diff-2: a two-line gap beyond a one-line context collapses', async () => {
    // `append`: three unchanged lines then two additions. With
    // `context-lines="1"` only the last unchanged line is context, so the two
    // before it are beyond it and the doc says they collapse.
    el = await makeDiff({ scenario: 'append', contextLines: 1 });
    expect(separators(el).length,
      'a beyond-context run of two lines was left open').toBe(1);
  });

  /**
   * MATRIX-diff-3 — split mode offers no way to reach a collapsed section.
   *
   * doc: "Unchanged sections beyond context are collapsed; click to expand",
   * stated for the component and not for one of its two modes. The unified view
   * renders a separator row carrying that invitation; the split view drops the
   * collapsed lines silently and renders nothing in their place, so in
   * `mode="split"` the hidden lines have no affordance at all — not even the
   * inert one MATRIX-diff-1 describes.
   */
  it.fails('MATRIX-diff-3: split mode marks its collapsed sections too', async () => {
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3, mode: 'split' });
    expect(separators(el).length,
      'the split view hides the collapsed lines with no expander at all')
      .toBeGreaterThan(0);
  });
});
