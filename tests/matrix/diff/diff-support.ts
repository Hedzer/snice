/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-diff feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/diff.md` documents a PIPELINE, not just a shape, which
 * makes this the one component in the family whose oracle looks like the
 * table's: given two texts and a context width, the documented behaviour
 * derives a specific list of lines, a specific grouping of those lines, and a
 * specific table of rows. So this module recomputes all three from the doc and
 * compares them against the rendered tree.
 *
 *   doc: "LCS-based diff computed on oldText/newText/contextLines change"
 *   doc: "Unchanged sections beyond context are collapsed; click to expand"
 *   doc: "Header shows +N/-N stats and unified/split toggle"
 *   doc: `DiffLine { type: 'added'|'removed'|'unchanged', oldLine, newLine, content }`
 *   doc: `diff-computed → { hunks, additions, deletions }`
 *
 * ── The oracle is INDEPENDENT of the component ─────────────────────────────
 *
 * `expectedLines()` below is a plain longest-common-subsequence alignment
 * written from the doc sentence, not lifted from the component. The scenarios
 * in `SCENARIOS` are chosen so their LCS alignment is UNAMBIGUOUS — no pair of
 * distinct alignments has the same LCS length — so "the LCS diff" names exactly
 * one line list and the oracle cannot be accused of encoding one particular
 * implementation's tie-breaking.
 *
 * The one presentation convention the oracle does fix is that a replaced line
 * shows its REMOVED half before its ADDED half. That is not arbitrary: it is
 * the universal convention for a text diff, and the documented split view
 * ("side-by-side") can only pair an old line with its replacement if the two
 * arrive in that order.
 *
 * `.ai/fuzzing.md`: a combo that diverges is a finding, pinned with `it.fails`
 * and a `MATRIX-diff-N` id. Nothing here can weaken an assertion.
 */
import { Problems, expectClean, part, parts, text, wait } from '../matrix-kit';
import { mount, removeComponent } from '../matrix-utils';
import '../../../packages/components/src/diff/snice-diff';
import type { DiffLine, SniceDiffElement } from '../../../packages/components/src/diff/snice-diff.types';

export { Problems, expectClean, part, parts, removeComponent, text, wait };
export type Diff = SniceDiffElement & { shadowRoot: ShadowRoot };
export type { DiffLine };

/** Settle window: the component renders on a microtask plus a queued task. */
export const SETTLE = 20;

// ── Documented dimensions ───────────────────────────────────────────────────

/** `mode: 'unified'|'split' = 'unified'` */
export const MODES = ['unified', 'split'] as const;
/** `contextLines: number = 3` */
export const CONTEXTS = [0, 1, 3, 10] as const;

export type Mode = typeof MODES[number];

export interface DiffVector {
  scenario: ScenarioName;
  mode: Mode;
  lineNumbers: boolean;
  markers: boolean;
  showModeToggle: boolean;
  contextLines: number;
}

export const DEFAULTS: Omit<DiffVector, 'scenario'> = {
  mode: 'unified',
  lineNumbers: true,
  markers: true,
  showModeToggle: true,
  contextLines: 3,
};

export function vectorId(vector: DiffVector): string {
  const flags = [
    vector.lineNumbers ? 'nums' : 'no-nums',
    vector.markers ? 'marks' : 'no-marks',
    vector.showModeToggle ? 'toggle' : 'no-toggle',
  ].join('+');
  return `${vector.scenario}/${vector.mode}/ctx=${vector.contextLines}/${flags}`;
}

// ── Scenarios ───────────────────────────────────────────────────────────────

const NUMBERED = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`);

export interface Scenario { old: string; new: string }

/**
 * Six text pairs, each with exactly one LCS alignment, covering the shapes the
 * doc's pipeline has to distinguish: no change at all, growth, shrinkage, an
 * in-place replacement, two changes far enough apart to leave a collapsible
 * gap between them, and a total rewrite.
 */
export const SCENARIOS = {
  identical: { old: NUMBERED(6).join('\n'), new: NUMBERED(6).join('\n') },
  append: { old: NUMBERED(3).join('\n'), new: [...NUMBERED(3), 'tail one', 'tail two'].join('\n') },
  truncate: { old: NUMBERED(5).join('\n'), new: NUMBERED(3).join('\n') },
  'replace-middle': {
    old: NUMBERED(7).join('\n'),
    new: NUMBERED(7).map((l, i) => (i === 3 ? 'swapped' : l)).join('\n'),
  },
  'two-far-changes': {
    old: NUMBERED(20).join('\n'),
    new: NUMBERED(20).map((l, i) => (i === 1 ? 'early change' : i === 18 ? 'late change' : l)).join('\n'),
  },
  rewrite: { old: 'only the old line', new: 'only the new line' },
} satisfies Record<string, Scenario>;

export type ScenarioName = keyof typeof SCENARIOS;
export const SCENARIO_NAMES = Object.keys(SCENARIOS) as ScenarioName[];

// ── The documented pipeline, recomputed ─────────────────────────────────────

/**
 * doc: "LCS-based diff computed on oldText/newText". The line list a text diff
 * of these two texts has: every line of the longest common subsequence marked
 * `unchanged` and carrying BOTH line numbers, every other old line `removed`
 * with only an `oldLine`, every other new line `added` with only a `newLine`.
 */
export function expectedLines(scenario: Scenario): DiffLine[] {
  const oldLines = scenario.old.split('\n');
  const newLines = scenario.new.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  const lcs: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = oldLines[i] === newLines[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      out.push({ type: 'unchanged', oldLine: i + 1, newLine: j + 1, content: oldLines[i] });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      // Removals precede the additions that replace them — see the header.
      out.push({ type: 'removed', oldLine: i + 1, newLine: null, content: oldLines[i] });
      i++;
    } else {
      out.push({ type: 'added', oldLine: null, newLine: j + 1, content: newLines[j] });
      j++;
    }
  }
  while (i < m) { out.push({ type: 'removed', oldLine: i + 1, newLine: null, content: oldLines[i] }); i++; }
  while (j < n) { out.push({ type: 'added', oldLine: null, newLine: j + 1, content: newLines[j] }); j++; }
  return out;
}

export interface ExpectedHunk { lines: DiffLine[]; collapsed: boolean }

/**
 * doc: "Unchanged sections beyond context are collapsed".
 *
 * A line is IN context when it is within `contextLines` of a changed line;
 * maximal runs of in-context lines are open hunks and maximal runs of the rest
 * are collapsed ones. A diff with no changes at all has no context to be
 * inside, so the whole thing is one collapsed section.
 */
export function expectedHunks(lines: DiffLine[], contextLines: number): ExpectedHunk[] {
  const inContext = new Set<number>();
  lines.forEach((line, index) => {
    if (line.type === 'unchanged') return;
    const from = Math.max(0, index - contextLines);
    const to = Math.min(lines.length - 1, index + contextLines);
    for (let k = from; k <= to; k++) inContext.add(k);
  });

  if (inContext.size === 0) return lines.length ? [{ lines, collapsed: true }] : [];

  const hunks: ExpectedHunk[] = [];
  let run: DiffLine[] = [];
  let runCollapsed = !inContext.has(0);
  for (let index = 0; index < lines.length; index++) {
    const collapsed = !inContext.has(index);
    if (collapsed !== runCollapsed && run.length) {
      hunks.push({ lines: run, collapsed: runCollapsed });
      run = [];
    }
    runCollapsed = collapsed;
    run.push(lines[index]);
  }
  if (run.length) hunks.push({ lines: run, collapsed: runCollapsed });
  return hunks;
}

/**
 * Does the documented grouping of these lines contain a collapsed section
 * SHORTER than twice the context width?
 *
 * The component applies an undocumented threshold — an unchanged run is only
 * collapsed when it is longer than `2 * contextLines`, and a shorter one is
 * merged into the neighbouring open hunk. `docs/ai/components/diff.md` names no
 * threshold at all ("Unchanged sections beyond context are collapsed"), so
 * every combo this predicate answers `true` for is a MATRIX-diff-2 divergence,
 * pinned rather than accommodated.
 *
 * A diff with no changes at all is excluded: the doc and the component agree
 * that the whole file collapses, by a different route.
 */
export function hasShortGap(lines: DiffLine[], contextLines: number): boolean {
  if (!lines.some(line => line.type !== 'unchanged')) return false;
  return expectedHunks(lines, contextLines)
    .some(hunk => hunk.collapsed && hunk.lines.length <= 2 * contextLines);
}

/** doc: `diff-computed → { additions, deletions }`. */
export function expectedStats(lines: DiffLine[]): { additions: number; deletions: number } {
  return {
    additions: lines.filter(line => line.type === 'added').length,
    deletions: lines.filter(line => line.type === 'removed').length,
  };
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo through the documented ATTRIBUTE channel — `old-text`,
 * `new-text`, `mode`, `line-numbers`, `context-lines`, `show-mode-toggle`,
 * `markers` — which is the form the doc's own basic-usage markup uses. Boolean
 * properties that default to `true` are pushed through the property channel
 * when the combo turns them OFF, because an absent attribute keeps the default.
 */
export async function makeDiff(vector: Partial<DiffVector> & { scenario: ScenarioName }): Promise<Diff> {
  const full: DiffVector = { ...DEFAULTS, ...vector };
  const scenario = SCENARIOS[full.scenario];
  const el = await mount<Diff>('snice-diff', {
    'old-text': scenario.old,
    'new-text': scenario.new,
    mode: full.mode,
    'context-lines': full.contextLines,
  });
  el.lineNumbers = full.lineNumbers;
  el.markers = full.markers;
  el.showModeToggle = full.showModeToggle;
  (el as any).contextLines = full.contextLines;
  await wait(SETTLE);
  return el;
}

// ── Reading the rendered tree ───────────────────────────────────────────────

export interface RenderedRow {
  /** `unchanged` / `added` / `removed`, or `separator` for a collapsed section. */
  kind: 'unchanged' | 'added' | 'removed' | 'separator' | 'blank';
  oldNum: string;
  newNum: string;
  marker: string;
  content: string;
  cells: number;
}

function readRow(row: HTMLTableRowElement, lineNumbers: boolean, markers: boolean): RenderedRow {
  // happy-dom does not implement `HTMLTableRowElement.cells` as an iterable
  // collection, so the cells are read the way any other child list is.
  const cells = [...row.querySelectorAll('td')] as HTMLTableCellElement[];
  if (row.querySelector('.diff-hunk-separator') || cells[0]?.classList.contains('diff-hunk-separator')) {
    return { kind: 'separator', oldNum: '', newNum: '', marker: '', content: text(row), cells: cells.length };
  }
  const classes = row.className;
  const kind = classes.includes('diff-line--added') ? 'added'
    : classes.includes('diff-line--removed') ? 'removed'
    : classes.includes('diff-line--unchanged') ? 'unchanged'
    : 'blank';

  const gutters = cells.filter(cell => cell.classList.contains('diff-gutter'));
  const marker = cells.find(cell => cell.classList.contains('diff-gutter--marker'));
  const code = cells.find(cell => cell.classList.contains('diff-code'));
  return {
    kind,
    oldNum: lineNumbers ? (gutters[0]?.textContent ?? '').trim() : '',
    newNum: lineNumbers ? (gutters[1]?.textContent ?? '').trim() : '',
    marker: markers ? (marker?.textContent ?? '') : '',
    content: code?.textContent ?? '',
    cells: cells.length,
  };
}

/** Every row of the unified table, in order. */
export function unifiedRows(el: Diff, lineNumbers: boolean, markers: boolean): RenderedRow[] {
  const table = el.shadowRoot.querySelector('.diff-content .diff-table');
  if (!table) return [];
  return [...table.querySelectorAll('tr')].map(row => readRow(row as HTMLTableRowElement, lineNumbers, markers));
}

/**
 * The two side-by-side panes, each as a row list.
 *
 * A split pane carries ONE gutter column, and which line number it holds
 * depends on the side: the left pane numbers old lines, the right pane new
 * ones. `readRow` puts a lone gutter in `oldNum`, so the right pane's rows are
 * re-labelled here rather than in the generic reader.
 */
export function splitPanes(el: Diff, lineNumbers: boolean, markers: boolean): RenderedRow[][] {
  return [...el.shadowRoot.querySelectorAll('.diff-split-pane .diff-table')]
    .map((table, pane) => [...table.querySelectorAll('tr')]
      .map((row) => {
        const read = readRow(row as HTMLTableRowElement, lineNumbers, markers);
        return pane === 0 ? read : { ...read, oldNum: '', newNum: read.oldNum };
      }));
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * doc: "CSS Parts — `base`: Outer diff container; `header`: Header with stats
 * and mode toggle buttons; `content`: Diff content area with diff table(s)".
 * All three are unconditional, so every combo must expose all three.
 */
export function checkShell(problems: Problems, el: Diff, vector: DiffVector): void {
  for (const name of ['base', 'header', 'content']) {
    problems.check(!!part(el, name), `no element exposes part="${name}"`);
  }
  const base = part(el, 'base');
  const header = part(el, 'header');
  const content = part(el, 'content');
  if (base && header) problems.check(base.contains(header), 'part="header" is not inside part="base"');
  if (base && content) problems.check(base.contains(content), 'part="content" is not inside part="base"');
}

/**
 * doc: "Header shows +N/-N stats and unified/split toggle", and
 * "showModeToggle … 'false' hides the built-in Unified/Split toggle".
 */
export function checkHeader(problems: Problems, el: Diff, vector: DiffVector): void {
  const header = part(el, 'header');
  if (!problems.check(!!header, 'no part="header"')) return;

  const stats = expectedStats(expectedLines(SCENARIOS[vector.scenario]));
  problems.equal(text(header!.querySelector('.diff-stat-add')), `+${stats.additions}`, 'additions stat');
  problems.equal(text(header!.querySelector('.diff-stat-del')), `-${stats.deletions}`, 'deletions stat');

  const buttons = [...header!.querySelectorAll('.diff-mode-btn')] as HTMLElement[];
  if (!vector.showModeToggle) {
    problems.equal(buttons.length, 0, 'show-mode-toggle="false" still rendered the toggle');
    return;
  }
  if (!problems.equal(buttons.length, 2, 'the header does not render two toggle buttons')) return;
  problems.equal(buttons.map(b => text(b)).join('/'), 'Unified/Split', 'toggle button labels');

  const active = buttons.filter(b => b.classList.contains('active'));
  if (!problems.equal(active.length, 1, 'the toggle does not mark exactly one active mode')) return;
  problems.equal(text(active[0]).toLowerCase(), vector.mode, 'the active toggle button');
}

/**
 * The UNIFIED table, row for row, against the documented pipeline.
 *
 * doc: `lineNumbers` ("attr: line-numbers"), `markers` ("Show +/- markers
 * column"), and the collapsed-section separator the doc describes as
 * "click to expand".
 */
export function checkUnified(problems: Problems, el: Diff, vector: DiffVector): void {
  const lines = expectedLines(SCENARIOS[vector.scenario]);
  const hunks = expectedHunks(lines, vector.contextLines);

  const expected: RenderedRow[] = [];
  for (const hunk of hunks) {
    if (hunk.collapsed) {
      expected.push({
        kind: 'separator', oldNum: '', newNum: '', marker: '',
        content: `... ${hunk.lines.length} unchanged lines (click to expand)`,
        cells: 1,
      });
      continue;
    }
    for (const line of hunk.lines) {
      expected.push({
        kind: line.type,
        oldNum: vector.lineNumbers ? (line.oldLine === null ? '' : String(line.oldLine)) : '',
        newNum: vector.lineNumbers ? (line.newLine === null ? '' : String(line.newLine)) : '',
        marker: vector.markers ? (line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ') : '',
        content: line.content,
        cells: 1 + (vector.lineNumbers ? 2 : 0) + (vector.markers ? 1 : 0),
      });
    }
  }

  const actual = unifiedRows(el, vector.lineNumbers, vector.markers);
  if (!problems.equal(actual.length, expected.length, 'unified row count')) return;

  actual.forEach((row, index) => {
    const want = expected[index];
    if (want.kind === 'separator') {
      problems.equal(row.kind, 'separator', `row ${index} kind`);
      problems.equal(row.content.replace(/\s+/g, ' ').trim(), want.content, `row ${index} separator text`);
      return;
    }
    problems.equal(row.kind, want.kind, `row ${index} kind`);
    problems.equal(row.oldNum, want.oldNum, `row ${index} old line number`);
    problems.equal(row.newNum, want.newNum, `row ${index} new line number`);
    problems.equal(row.marker, want.marker, `row ${index} marker`);
    problems.equal(row.content, want.content, `row ${index} content`);
    problems.equal(row.cells, want.cells, `row ${index} cell count`);
  });
}

/**
 * The SPLIT view: "split (side-by-side) mode".
 *
 * Side-by-side means two panes of the SAME height, the left one carrying every
 * old-side line (unchanged and removed) with its old line number, and the right
 * one every new-side line (unchanged and added) with its new line number. The
 * stats in the header are the same stats, so the removed rows on the left must
 * total `deletions` and the added rows on the right `additions`.
 */
export function checkSplit(problems: Problems, el: Diff, vector: DiffVector): void {
  const lines = expectedLines(SCENARIOS[vector.scenario]);
  const hunks = expectedHunks(lines, vector.contextLines);
  const visible = hunks.filter(hunk => !hunk.collapsed).flatMap(hunk => hunk.lines);
  const stats = expectedStats(visible);

  const panes = splitPanes(el, vector.lineNumbers, vector.markers);
  if (!problems.equal(panes.length, 2, 'split mode does not render two panes')) return;
  const [left, right] = panes;
  problems.equal(left.length, right.length, 'the two panes are not the same height');

  problems.equal(left.filter(row => row.kind === 'removed').length, stats.deletions,
    'removed rows in the left pane');
  problems.equal(right.filter(row => row.kind === 'added').length, stats.additions,
    'added rows in the right pane');

  // The line-number assertions only apply when the combo asked for line
  // numbers; `lineNumbers: false` is documented to remove the gutter entirely.
  if (!vector.lineNumbers) return;

  // Old-side numbers ascend, and every one of them is a real old line number.
  const leftNums = left.map(row => row.oldNum).filter(Boolean).map(Number);
  problems.equal(leftNums.join(','), [...leftNums].sort((a, b) => a - b).join(','),
    'the left pane numbers its old lines out of order');
  const rightNums = right.map(row => row.newNum).filter(Boolean).map(Number);
  problems.equal(rightNums.join(','), [...rightNums].sort((a, b) => a - b).join(','),
    'the right pane numbers its new lines out of order');

  // Every visible old line appears on the left, every visible new line on the right.
  problems.equal(leftNums.join(','),
    visible.filter(line => line.oldLine !== null).map(line => line.oldLine).join(','),
    'the left pane does not show every old-side line');
  problems.equal(rightNums.join(','),
    visible.filter(line => line.newLine !== null).map(line => line.newLine).join(','),
    'the right pane does not show every new-side line');
}

/** The whole documented render, for whichever mode the combo names. */
export function checkRender(problems: Problems, el: Diff, vector: DiffVector): void {
  checkShell(problems, el, vector);
  checkHeader(problems, el, vector);
  if (vector.mode === 'split') checkSplit(problems, el, vector);
  else checkUnified(problems, el, vector);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

export function captureDiffEvents(el: Diff): Seen[] {
  const seen: Seen[] = [];
  for (const type of ['diff-computed', 'mode-change']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** The header's Unified / Split buttons, in that order. */
export function toggleButtons(el: Diff): HTMLElement[] {
  return [...(part(el, 'header')?.querySelectorAll('.diff-mode-btn') ?? [])] as HTMLElement[];
}

/** The collapsed-section rows the doc invites the reader to click. */
export function separators(el: Diff): HTMLElement[] {
  return [...el.shadowRoot.querySelectorAll('.diff-hunk-separator')] as HTMLElement[];
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}
