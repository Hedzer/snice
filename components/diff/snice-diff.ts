import { element, property, render, styles, dispatch, watch, html, css, unsafeHTML } from 'snice';
import type { DiffMode, DiffLine, DiffHunk, SniceDiffElement } from './snice-diff.types';
import diffStyles from './snice-diff.css?inline';

@element('snice-diff')
export class SniceDiff extends HTMLElement implements SniceDiffElement {
  @property({ attribute: 'old-text' })
  oldText: string = '';

  @property({ attribute: 'new-text' })
  newText: string = '';

  @property() language: string = '';

  @property() mode: DiffMode = 'unified';

  @property({ type: Boolean, attribute: 'line-numbers' })
  lineNumbers: boolean = true;

  @property({ type: Number, attribute: 'context-lines' })
  contextLines: number = 3;

  @property({ type: Boolean })
  markers: boolean = true;

  private hunks: DiffHunk[] = [];
  private additions: number = 0;
  private deletions: number = 0;

  @styles()
  componentStyles() {
    return css/*css*/`${diffStyles}`;
  }

  @watch('oldText')
  handleOldTextChange() {
    this.computeDiff();
  }

  @watch('newText')
  handleNewTextChange() {
    this.computeDiff();
  }

  @watch('contextLines')
  handleContextChange() {
    this.computeDiff();
  }

  @render()
  renderDiff() {
    const isSplit = this.mode === 'split';
    const showLineNums = this.lineNumbers;

    return html/*html*/`
      <div class="diff-container">
        <div class="diff-header">
          <span class="diff-stat-add">+${this.additions}</span>
          <span class="diff-stat-del">-${this.deletions}</span>
          <div class="diff-mode-toggle">
            <button
              class="diff-mode-btn ${!isSplit ? 'active' : ''}"
              @click=${() => { this.mode = 'unified'; }}
            >Unified</button>
            <button
              class="diff-mode-btn ${isSplit ? 'active' : ''}"
              @click=${() => { this.mode = 'split'; }}
            >Split</button>
          </div>
        </div>
        <div class="diff-content">
          <if ${isSplit}>
            ${this.renderSplitView(showLineNums)}
          </if>
          <if ${!isSplit}>
            ${this.renderUnifiedView(showLineNums)}
          </if>
        </div>
      </div>
    `;
  }

  private renderUnifiedView(showLineNums: boolean) {
    // Pre-build all rows to avoid nested .map() in template
    const rows: any[] = [];
    const showMarkers = this.markers;

    for (let hunkIdx = 0; hunkIdx < this.hunks.length; hunkIdx++) {
      const hunk = this.hunks[hunkIdx];
      if (hunk.collapsed) {
        const count = hunk.lines.length;
        rows.push(html/*html*/`
          <tr>
            <td colspan="4" class="diff-hunk-separator" @click=${() => this.toggleHunk(hunkIdx)}>
              ... ${count} unchanged lines (click to expand)
            </td>
          </tr>
        `);
        continue;
      }

      for (const line of hunk.lines) {
        const lineClass = `diff-line diff-line--${line.type}`;
        const marker = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
        const markerClass = line.type === 'added' ? 'diff-gutter--marker diff-gutter--marker-add'
          : line.type === 'removed' ? 'diff-gutter--marker diff-gutter--marker-del'
          : 'diff-gutter--marker';

        const oldNum = line.oldLine !== null ? line.oldLine : '';
        const newNum = line.newLine !== null ? line.newLine : '';
        const content = unsafeHTML(this.escapeHtml(line.content));

        const gutterCells = showLineNums
          ? html`<td class="diff-gutter">${oldNum}</td><td class="diff-gutter">${newNum}</td>`
          : '';
        const markerCell = showMarkers
          ? html`<td class="${markerClass}">${marker}</td>`
          : '';

        rows.push(html/*html*/`
          <tr class="${lineClass}">
            ${gutterCells}
            ${markerCell}
            <td class="diff-code">${content}</td>
          </tr>
        `);
      }
    }

    return html/*html*/`<table class="diff-table">${rows}</table>`;
  }

  private renderSplitView(showLineNums: boolean) {
    const pairs = this.buildSplitPairs();
    const showMarkers = this.markers;

    // Pre-build rows for left (old) and right (new) panes
    const leftRows: any[] = [];
    const rightRows: any[] = [];

    for (const pair of pairs) {
      const old = pair.old;
      const nw = pair.new;

      // Left pane (old)
      const leftClass = old ? `diff-line diff-line--${old.type === 'removed' ? 'removed' : 'unchanged'}` : 'diff-line';
      const leftNum = old?.oldLine != null ? old.oldLine : '';
      const leftContent = old ? unsafeHTML(this.escapeHtml(old.content)) : '';
      const leftMarker = old ? (old.type === 'removed' ? '-' : ' ') : ' ';
      const leftMarkerClass = old?.type === 'removed' ? 'diff-gutter--marker diff-gutter--marker-del' : 'diff-gutter--marker';

      const leftGutter = showLineNums ? html`<td class="diff-gutter">${leftNum}</td>` : '';
      const leftMarkerCell = showMarkers ? html`<td class="${leftMarkerClass}">${leftMarker}</td>` : '';
      leftRows.push(html`<tr class="${leftClass}">${leftGutter}${leftMarkerCell}<td class="diff-code">${leftContent}</td></tr>`);

      // Right pane (new)
      const rightClass = nw ? `diff-line diff-line--${nw.type === 'added' ? 'added' : 'unchanged'}` : 'diff-line';
      const rightNum = nw?.newLine != null ? nw.newLine : '';
      const rightContent = nw ? unsafeHTML(this.escapeHtml(nw.content)) : '';
      const rightMarker = nw ? (nw.type === 'added' ? '+' : ' ') : ' ';
      const rightMarkerClass = nw?.type === 'added' ? 'diff-gutter--marker diff-gutter--marker-add' : 'diff-gutter--marker';

      const rightGutter = showLineNums ? html`<td class="diff-gutter">${rightNum}</td>` : '';
      const rightMarkerCell = showMarkers ? html`<td class="${rightMarkerClass}">${rightMarker}</td>` : '';
      rightRows.push(html`<tr class="${rightClass}">${rightGutter}${rightMarkerCell}<td class="diff-code">${rightContent}</td></tr>`);
    }

    return html/*html*/`
      <div class="diff-split">
        <div class="diff-split-pane">
          <table class="diff-table">${leftRows}</table>
        </div>
        <div class="diff-split-pane">
          <table class="diff-table">${rightRows}</table>
        </div>
      </div>
    `;
  }

  private buildSplitPairs(): { old: DiffLine | null; new: DiffLine | null }[] {
    const pairs: { old: DiffLine | null; new: DiffLine | null }[] = [];
    const allLines = this.hunks.flatMap(h => h.collapsed ? [] : h.lines);

    let i = 0;
    while (i < allLines.length) {
      const line = allLines[i];

      if (line.type === 'unchanged') {
        pairs.push({ old: line, new: line });
        i++;
      } else if (line.type === 'removed') {
        // Collect consecutive removed lines and pair with following added lines
        const removed: DiffLine[] = [];
        while (i < allLines.length && allLines[i].type === 'removed') {
          removed.push(allLines[i]);
          i++;
        }
        const added: DiffLine[] = [];
        while (i < allLines.length && allLines[i].type === 'added') {
          added.push(allLines[i]);
          i++;
        }
        const maxLen = Math.max(removed.length, added.length);
        for (let j = 0; j < maxLen; j++) {
          pairs.push({
            old: j < removed.length ? removed[j] : null,
            new: j < added.length ? added[j] : null,
          });
        }
      } else if (line.type === 'added') {
        pairs.push({ old: null, new: line });
        i++;
      }
    }

    return pairs;
  }

  private computeDiff(): void {
    const oldLines = this.oldText.split('\n');
    const newLines = this.newText.split('\n');

    // Simple LCS-based diff
    const diffLines = this.myersDiff(oldLines, newLines);

    // Count additions/deletions
    this.additions = diffLines.filter(l => l.type === 'added').length;
    this.deletions = diffLines.filter(l => l.type === 'removed').length;

    // Group into hunks with context
    this.hunks = this.groupIntoHunks(diffLines);

    this.emitDiffComputed();
  }

  private myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    // Build simple LCS-based diff
    const m = oldLines.length;
    const n = newLines.length;

    // Create LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find diff
    const result: DiffLine[] = [];
    let i = m;
    let j = n;
    const stack: DiffLine[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        stack.push({ type: 'unchanged', oldLine: i, newLine: j, content: oldLines[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        stack.push({ type: 'added', oldLine: null, newLine: j, content: newLines[j - 1] });
        j--;
      } else {
        stack.push({ type: 'removed', oldLine: i, newLine: null, content: oldLines[i - 1] });
        i--;
      }
    }

    // Reverse since we built it backwards
    while (stack.length > 0) {
      result.push(stack.pop()!);
    }

    return result;
  }

  private groupIntoHunks(lines: DiffLine[]): DiffHunk[] {
    const ctx = this.contextLines;
    const hunks: DiffHunk[] = [];

    // Find changed line indices
    const changedIndices = new Set<number>();
    lines.forEach((line, i) => {
      if (line.type !== 'unchanged') {
        for (let k = Math.max(0, i - ctx); k <= Math.min(lines.length - 1, i + ctx); k++) {
          changedIndices.add(k);
        }
      }
    });

    // If no changes, return single collapsed hunk
    if (changedIndices.size === 0 && lines.length > 0) {
      return [{ lines, collapsed: true }];
    }

    let currentHunk: DiffLine[] = [];
    let currentCollapsed: DiffLine[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (changedIndices.has(i)) {
        // Flush collapsed section
        if (currentCollapsed.length > 0) {
          if (currentCollapsed.length > 2 * ctx) {
            hunks.push({ lines: currentCollapsed, collapsed: true });
          } else {
            currentHunk.push(...currentCollapsed);
          }
          currentCollapsed = [];
        }
        currentHunk.push(lines[i]);
      } else {
        if (currentHunk.length > 0) {
          hunks.push({ lines: currentHunk, collapsed: false });
          currentHunk = [];
        }
        currentCollapsed.push(lines[i]);
      }
    }

    // Flush remaining
    if (currentHunk.length > 0) {
      hunks.push({ lines: currentHunk, collapsed: false });
    }
    if (currentCollapsed.length > 0) {
      hunks.push({ lines: currentCollapsed, collapsed: true });
    }

    return hunks;
  }

  private toggleHunk(index: number): void {
    if (index >= 0 && index < this.hunks.length) {
      this.hunks[index].collapsed = !this.hunks[index].collapsed;
      // Force re-render
      this.hunks = [...this.hunks];
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  @dispatch('diff-computed', { bubbles: true, composed: true })
  private emitDiffComputed() {
    return { hunks: this.hunks, additions: this.additions, deletions: this.deletions };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-diff': SniceDiff;
  }
}
