/**
 * Smoke slice of the snice-diff matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/diff/`, 108 combos across rendering, hunk
 * grouping and events) is excluded from the default Vitest include and runs via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and every assertion routes through the matrix's own oracle, so it
 * cannot claim less than the suite it stands in for.
 *
 * The marquee combos: the doc's own basic-usage markup, the unified table with
 * every column on, the split view, the collapsed section, the two events, and
 * the three standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, SCENARIOS, captureDiffEvents, checkRender, click, expectClean,
  expectedHunks, expectedLines, makeDiff, removeComponent, separators, toggleButtons,
  unifiedRows, wait, type Diff,
} from './diff-support';

let el: Diff | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('diff matrix smoke', () => {
  it('the unified table renders every documented column', async () => {
    const vector = { ...DEFAULTS, scenario: 'replace-middle' as const };
    el = await makeDiff(vector);
    const problems = new Problems();
    checkRender(problems, el, vector);
    expectClean(problems, 'smoke/unified');
  });

  it('the split view renders both panes at the same height', async () => {
    const vector = { ...DEFAULTS, scenario: 'replace-middle' as const, mode: 'split' as const };
    el = await makeDiff(vector);
    const problems = new Problems();
    checkRender(problems, el, vector);
    expectClean(problems, 'smoke/split');
  });

  it('turning the gutters and markers off leaves only the code column', async () => {
    const vector = { ...DEFAULTS, scenario: 'append' as const, lineNumbers: false, markers: false };
    el = await makeDiff(vector);
    const problems = new Problems();
    checkRender(problems, el, vector);
    expectClean(problems, 'smoke/bare');
    expect(unifiedRows(el, false, false).every(row => row.cells === 1)).toBe(true);
  });

  it('a section beyond the context width collapses with its own count', async () => {
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3 });
    const hidden = expectedHunks(expectedLines(SCENARIOS['two-far-changes']), 3)
      .filter(hunk => hunk.collapsed).map(hunk => hunk.lines.length);
    expect(separators(el).map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()))
      .toEqual(hidden.map(count => `... ${count} unchanged lines (click to expand)`));
  });

  it('diff-computed announces the stats the header shows', async () => {
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);
    el.contextLines = 2;
    await wait(20);
    const detail = seen[seen.length - 1].detail;
    expect(detail.additions).toBe(1);
    expect(detail.deletions).toBe(1);
    expect(el.shadowRoot.querySelector('.diff-stat-add')!.textContent!.trim()).toBe('+1');
  });

  it('mode-change fires for the header toggle and not for an assignment', async () => {
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);
    click(toggleButtons(el)[1]);
    await wait(30);
    el.mode = 'unified';
    await wait(30);
    expect(seen.filter(event => event.type === 'mode-change').map(event => event.detail.mode))
      .toEqual(['split']);
  });

  // ── Standing findings — see tests/matrix/diff/hunks.test.ts ────────────────

  // MATRIX-diff-1: the collapsed section's click handler schedules no re-render.
  it.fails('MATRIX-diff-1: clicking a collapsed section reveals its lines', async () => {
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3 });
    const before = unifiedRows(el, true, true).length;
    click(separators(el)[0]);
    await wait(30);
    expect(unifiedRows(el, true, true).length).toBeGreaterThan(before);
  });

  // MATRIX-diff-2: an undocumented `> 2 * contextLines` threshold leaves short
  // beyond-context runs open.
  it.fails('MATRIX-diff-2: a two-line gap beyond a one-line context collapses', async () => {
    el = await makeDiff({ scenario: 'append', contextLines: 1 });
    expect(separators(el).length).toBe(1);
  });

  // MATRIX-diff-3: the split view drops collapsed lines with no expander.
  it.fails('MATRIX-diff-3: split mode marks its collapsed sections too', async () => {
    el = await makeDiff({ scenario: 'two-far-changes', contextLines: 3, mode: 'split' });
    expect(separators(el).length).toBeGreaterThan(0);
  });
});
