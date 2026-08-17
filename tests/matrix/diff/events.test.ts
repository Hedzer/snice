/**
 * snice-diff matrix — the two documented EVENTS.
 *
 *   · `diff-computed → { hunks: DiffHunk[], additions: number, deletions: number }`,
 *     with "LCS-based diff computed on oldText/newText/contextLines change"
 *     naming exactly which three inputs re-run the pipeline;
 *   · `mode-change → { mode }` — "only when the built-in header toggle changes
 *     `mode`, not for external assignments", which is a contract with a
 *     negative half, and the negative half is the interesting one.
 *
 * The slice crosses the three re-computing inputs against the six scenarios and
 * pins the toggle's behaviour in both directions.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  Problems, SCENARIOS, SCENARIO_NAMES, captureDiffEvents, click, expectClean,
  expectedHunks, expectedLines, expectedStats, makeDiff, removeComponent,
  toggleButtons, wait, type Diff,
} from './diff-support';

let el: Diff | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-diff matrix: diff-computed', () => {
  for (const scenario of SCENARIO_NAMES) {
    it(`${scenario}: the detail carries the documented stats and hunks`, async () => {
      el = await makeDiff({ scenario });
      const seen = captureDiffEvents(el);

      // Re-run the pipeline through the documented trigger `newText`, then read
      // the announcement it produced.
      const lines = expectedLines(SCENARIOS[scenario]);
      el.newText = SCENARIOS[scenario].new;
      // Assigning the same value is not a change; nudge it and put it back so
      // the pipeline really re-runs and announces.
      el.newText = `${SCENARIOS[scenario].new}\nsentinel`;
      el.newText = SCENARIOS[scenario].new;
      await wait(30);

      const computed = seen.filter(event => event.type === 'diff-computed');
      expect(computed.length, 'newText changes did not announce diff-computed')
        .toBeGreaterThanOrEqual(1);

      const last = computed[computed.length - 1].detail;
      const stats = expectedStats(lines);
      const problems = new Problems();
      problems.equal(last.additions, stats.additions, 'detail.additions');
      problems.equal(last.deletions, stats.deletions, 'detail.deletions');
      problems.check(Array.isArray(last.hunks), 'detail.hunks is not an array');

      // doc: `DiffHunk { lines: DiffLine[], collapsed: boolean }`, and the
      // hunks the event announces are the ones the documented grouping makes.
      const expected = expectedHunks(lines, 3);
      problems.equal(last.hunks.length, expected.length, 'detail.hunks length');
      problems.equal(
        last.hunks.map((hunk: any) => `${hunk.lines.length}${hunk.collapsed ? 'c' : 'o'}`).join(','),
        expected.map(hunk => `${hunk.lines.length}${hunk.collapsed ? 'c' : 'o'}`).join(','),
        'detail.hunks shape',
      );
      expectClean(problems, `${scenario}/diff-computed`);
    });
  }

  it('each of the three documented inputs re-runs the pipeline', async () => {
    // doc: "LCS-based diff computed on oldText/newText/contextLines change".
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);

    el.oldText = `${SCENARIOS['replace-middle'].old}\nextra`;
    await wait(20);
    const afterOld = seen.length;

    el.newText = `${SCENARIOS['replace-middle'].new}\nextra`;
    await wait(20);
    const afterNew = seen.length;

    (el as any).contextLines = 1;
    await wait(20);

    expect(afterOld, 'an oldText change announced nothing').toBeGreaterThan(0);
    expect(afterNew, 'a newText change announced nothing').toBeGreaterThan(afterOld);
    expect(seen.length, 'a contextLines change announced nothing').toBeGreaterThan(afterNew);
    expect(seen.every(event => event.type === 'diff-computed')).toBe(true);
  });

  it('the announced stats match the header the reader sees', async () => {
    // The stats live in two places — the event and the header — and the doc
    // gives them one meaning, so they may not disagree.
    for (const scenario of SCENARIO_NAMES) {
      el = await makeDiff({ scenario });
      const seen = captureDiffEvents(el);
      el.contextLines = 2;
      await wait(20);
      const detail = seen[seen.length - 1]?.detail;
      const header = el.shadowRoot.querySelector('[part~="header"]')!;
      expect(header.querySelector('.diff-stat-add')!.textContent!.trim(), scenario)
        .toBe(`+${detail.additions}`);
      expect(header.querySelector('.diff-stat-del')!.textContent!.trim(), scenario)
        .toBe(`-${detail.deletions}`);
      removeComponent(el as HTMLElement);
      el = null;
    }
  });
});

describe('snice-diff matrix: mode-change', () => {
  it('the header toggle switches the view and announces it', async () => {
    // doc: "mode-change → { mode } — only when the built-in header toggle
    // changes `mode`".
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);

    click(toggleButtons(el)[1]);
    await wait(30);
    expect(el.mode).toBe('split');
    expect(el.shadowRoot.querySelectorAll('.diff-split-pane').length).toBe(2);

    click(toggleButtons(el)[0]);
    await wait(30);
    expect(el.mode).toBe('unified');

    expect(seen.filter(event => event.type === 'mode-change').map(event => event.detail.mode))
      .toEqual(['split', 'unified']);
  });

  it('clicking the mode that is already active announces nothing', async () => {
    // The event is documented as announcing a CHANGE; a click that changes
    // nothing has nothing to announce.
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);
    click(toggleButtons(el)[0]);
    await wait(30);
    expect(seen.filter(event => event.type === 'mode-change')).toEqual([]);
    expect(el.mode).toBe('unified');
  });

  it('an external mode assignment switches the view and stays silent', async () => {
    // doc: "not for external assignments". The view must still follow, so this
    // asserts both halves: the render changes, the event does not fire.
    el = await makeDiff({ scenario: 'replace-middle' });
    const seen = captureDiffEvents(el);
    el.mode = 'split';
    await wait(30);
    expect(el.shadowRoot.querySelectorAll('.diff-split-pane').length,
      'an external assignment did not switch the view').toBe(2);
    expect(seen.filter(event => event.type === 'mode-change'),
      'an external assignment announced mode-change').toEqual([]);
  });

  it('the mode attribute in the authored markup wins the first render', async () => {
    // doc's basic usage writes `mode="unified"` in the markup, so the attribute
    // is a first-class channel for the property.
    el = await makeDiff({ scenario: 'replace-middle', mode: 'split' });
    expect(el.getAttribute('mode')).toBe('split');
    expect(el.shadowRoot.querySelectorAll('.diff-split-pane').length).toBe(2);
  });
});
