/**
 * Column management for snice-table.
 * Handles: flex width, resize, auto-size, visibility, ordering, pinning, groups.
 */

import type { ColumnDefinition, ColumnFit } from './snice-table.types';

/** Padding + border a cell spends before any content fits inside it. */
export function horizontalCellChrome(cell: HTMLElement): number {
  const style = getComputedStyle(cell);
  const px = (value: string) => Number.parseFloat(value) || 0;
  return px(style.paddingLeft) + px(style.paddingRight)
    + px(style.borderLeftWidth) + px(style.borderRightWidth);
}

export interface ColumnState {
  key: string;
  width: number;          // Computed pixel width
  flex?: number;          // Flex ratio (shares remaining space)
  minWidth: number;       // Minimum width in px
  maxWidth: number;       // Maximum width in px (Infinity = no limit)
  visible: boolean;
  pinned: 'left' | 'right' | false;
  order: number;          // Display order
  resizable: boolean;
  reorderable: boolean;
  hideable: boolean;
  pinnable: boolean;
  /**
   * Someone chose this width on purpose — the column definition declared one,
   * the user dragged the edge, or auto-size measured the content. Only columns
   * that never did participate in `fitVisibleColumns`, so a deliberate width is
   * never quietly overwritten by the container's arithmetic.
   */
  authored: boolean;
}

export interface ColumnGroup {
  label: string;
  children: string[];     // Column keys
  headerClass?: string;
}

export class TableColumnManager {
  private states: Map<string, ColumnState> = new Map();
  private groups: ColumnGroup[] = [];
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private resizingKey: string | null = null;
  private resizeOverlay: HTMLElement | null = null;
  private tableElement: HTMLElement | null = null;
  private fitMode: ColumnFit = 'scroll';
  /**
   * The content budget the last `squish` fit shared out. A drag-resize needs it
   * to know how much width the columns beside the dragged one have to give up
   * (or take back) for the total to stay on the frame.
   */
  private squishBudget: number | null = null;

  /** Fallback content width for a column nobody sized. */
  static readonly DEFAULT_WIDTH = 150;

  /**
   * The floor `squish` relaxes `minWidth` down to. Not zero: a column narrower
   * than this shows no glyph at all, only its ellipsis, and stops being a
   * column the reader can identify. A frame too narrow even for this is past
   * what the mode can honour — see `fitVisibleColumns`.
   */
  static readonly SQUISH_MIN_WIDTH = 24;

  /**
   * Which fitting policy `fitVisibleColumns` (and a drag-resize) follows.
   * Owned by the table's `columnFit` property; see the `ColumnFit` docs.
   */
  setFitMode(mode: ColumnFit) {
    if (mode === this.fitMode) return;
    this.fitMode = mode;
    // The budget belongs to the squish fit that recorded it.
    if (mode !== 'squish') this.squishBudget = null;
  }

  getFitMode(): ColumnFit {
    return this.fitMode;
  }

  /**
   * Routine resync, run on every render: make sure a state exists for each
   * declared column and refresh the flags that are pure declaration (min/max,
   * resizable, reorderable, hideable, pinnable, flex).
   *
   * Deliberately PRESERVES the interaction-owned members of an existing state —
   * width, visible, pinned, order — because renderBody() calls this on every
   * paint, and re-applying the declaration here would undo a drag-resize, a
   * hidden column or a user reorder on the very next render. Re-applying the
   * declaration is applyConfiguration()'s job, and only a `columns` assignment
   * calls that.
   */
  initialize(columns: ColumnDefinition[], tableEl: HTMLElement) {
    this.tableElement = tableEl;
    columns.forEach((col, index) => {
      const existing = this.states.get(col.key);
      this.states.set(col.key, this.buildState(col, index, existing));
    });
  }

  /**
   * A `columns` assignment (or setColumns()) delivered a NEW CONFIGURATION.
   *
   * The declaration is the source of truth here: painted order, `pinned`,
   * `width` and visibility all come from the array just assigned, and states for
   * columns the new array no longer declares are DROPPED. Without this the first
   * configuration the table ever saw won permanently — a re-ordered array kept
   * the original order, a newly declared pin or width was ignored, and a column
   * hidden through setColumnVisible() could never be brought back
   * (MATRIX-columns-2/3/4/6).
   *
   * The cost is that the assignment also discards user interaction state (a
   * drag-resize, a manual reorder, a hidden column) for the columns it
   * re-declares. That is the intended reading of the contract, and it applies to
   * EVERY assignment: `columns` declares `hasChanged: () => true`, so handing
   * back the array the table already holds — after mutating it, or unchanged —
   * re-applies the declaration exactly like a fresh array would. Mutating the
   * published definitions is therefore NOT an escape hatch; the only way to keep
   * user column state is to not assign `columns` at all and drive the change
   * through the column APIs instead (setColumnVisible / moveColumn / pinColumn /
   * unpinColumn), which mutate the state map in place. Renders triggered by this
   * go through the table's coalescing queue, so re-applying costs no extra paint.
   */
  applyConfiguration(columns: ColumnDefinition[], tableEl: HTMLElement) {
    this.tableElement = tableEl;
    const next: Map<string, ColumnState> = new Map();
    columns.forEach((col, index) => {
      next.set(col.key, this.buildState(col, index));
    });
    this.states = next;
  }

  /**
   * One place that turns a column definition into a state. `existing` supplies
   * the interaction-owned members on the resync path; omitting it yields the
   * pure declared state applyConfiguration() wants.
   */
  private buildState(
    col: ColumnDefinition,
    index: number,
    existing?: ColumnState,
  ): ColumnState {
    const declared = this.parseWidth(col.width);
    return {
      key: col.key,
      width: existing?.width ?? declared ?? TableColumnManager.DEFAULT_WIDTH,
      flex: (col as any).flex,
      minWidth: (col as any).minWidth ?? 50,
      maxWidth: (col as any).maxWidth ?? Infinity,
      visible: existing?.visible ?? true,
      pinned: existing?.pinned ?? ((col as any).pinned || false),
      order: existing?.order ?? index,
      resizable: (col as any).resizable !== false,
      reorderable: (col as any).reorderable !== false,
      hideable: (col as any).hideable !== false,
      pinnable: (col as any).pinnable !== false,
      authored: existing?.authored ?? declared !== undefined,
    };
  }

  private parseWidth(width?: string): number | undefined {
    if (!width) return undefined;
    const num = parseInt(width, 10);
    return isNaN(num) ? undefined : num;
  }

  /** Get ordered, visible columns */
  getVisibleColumns(): ColumnState[] {
    return Array.from(this.states.values())
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);
  }

  /** Get all column states */
  getAllStates(): ColumnState[] {
    return Array.from(this.states.values()).sort((a, b) => a.order - b.order);
  }

  /** Get columns pinned to left */
  getPinnedLeft(): ColumnState[] {
    return this.getVisibleColumns().filter(s => s.pinned === 'left');
  }

  /** Get columns pinned to right */
  getPinnedRight(): ColumnState[] {
    return this.getVisibleColumns().filter(s => s.pinned === 'right');
  }

  /** Get unpinned columns */
  getUnpinned(): ColumnState[] {
    return this.getVisibleColumns().filter(s => !s.pinned);
  }

  /** Compute flex widths based on available space */
  computeFlexWidths(availableWidth: number): Map<string, number> {
    const visible = this.getVisibleColumns();
    const widths = new Map<string, number>();

    // First pass: allocate fixed-width columns
    let fixedTotal = 0;
    const flexCols: ColumnState[] = [];

    for (const col of visible) {
      if (col.flex && col.flex > 0) {
        flexCols.push(col);
      } else {
        fixedTotal += col.width;
        widths.set(col.key, col.width);
      }
    }

    // Second pass: distribute remaining space to flex columns
    const remaining = Math.max(0, availableWidth - fixedTotal);
    const totalFlex = flexCols.reduce((sum, c) => sum + (c.flex || 1), 0);

    for (const col of flexCols) {
      const flexShare = ((col.flex || 1) / totalFlex) * remaining;
      const clamped = Math.max(col.minWidth, Math.min(col.maxWidth, flexShare));
      widths.set(col.key, clamped);
    }

    return widths;
  }

  /**
   * Fit the columns nobody sized into `availableWidth` (the frame's content
   * box), reserving `chromePerColumn` for each column's own padding + border.
   *
   * A column width is a CONTENT width — the rendered column is that plus its
   * chrome — so the budget has to come off the top or the fitted table lands a
   * few pixels wider than the frame it was fitted to.
   *
   * Declared and user-chosen widths are spent first and never rewritten: a
   * table that asked for `width: '80'` keeps 80 whatever the frame does. What
   * is left is split evenly and clamped to each column's [minWidth, maxWidth],
   * so a frame too narrow for the minimums overflows into the frame's own
   * scroller instead of collapsing the columns to nothing.
   *
   * Returns whether any width actually moved, so callers can skip a repaint.
   *
   * Under `column-fit="squish"` the frame stops being a suggestion: see
   * `squishVisibleColumns`.
   */
  fitVisibleColumns(availableWidth: number, chromePerColumn = 0): boolean {
    const visible = this.getVisibleColumns();
    // A layoutless (or not-yet-laid-out) frame reports 0. Fitting to that would
    // slam every column to its minimum for a measurement that means nothing.
    if (visible.length === 0 || !(availableWidth > 0)) return false;

    const budget = availableWidth - visible.length * chromePerColumn;

    if (this.fitMode === 'squish') {
      this.squishBudget = budget;
      return this.squishVisibleColumns(visible, budget);
    }

    const auto = visible.filter((state) => !state.authored);
    if (auto.length === 0) return false;

    let remaining = budget;
    for (const state of visible) {
      if (state.authored) remaining -= state.width;
    }

    const share = Math.floor(remaining / auto.length);
    let changed = false;
    for (const state of auto) {
      const next = Math.max(state.minWidth, Math.min(state.maxWidth, share));
      if (next !== state.width) {
        state.width = next;
        changed = true;
      }
    }
    return changed;
  }

  /**
   * The `squish` policy: the columns add up to the frame, whatever that costs.
   *
   * `minWidth` is a readability preference, and this mode has already decided
   * the frame outranks it, so the only floor left is SQUISH_MIN_WIDTH. Two
   * cases:
   *
   *  - There is an unsized column left to absorb the difference, and the
   *    authored widths still leave room for it. Those are honoured exactly (a
   *    column that asked for 80, or that the user dragged to 80, keeps 80) and
   *    the rest is split evenly between the unsized ones.
   *
   *  - Every column is authored, or the authored widths alone already overflow
   *    the frame. There is nothing left to give, so `scroll`'s escape hatch
   *    (overflow into the frame's scroller) is exactly what this mode exists to
   *    prevent: every column is scaled by the same factor instead. Scaling is a
   *    fixed point — the second pass computes a factor of 1 — so this settles
   *    on the first render rather than creeping on every repaint.
   *
   * Either way the remainder from integer division is handed back to the widest
   * columns that are free to take it, so the widths sum to the budget EXACTLY
   * and the rightmost column edge lands on the frame's inner edge instead of a
   * few pixels short of it.
   */
  private squishVisibleColumns(visible: ColumnState[], budget: number): boolean {
    const floor = TableColumnManager.SQUISH_MIN_WIDTH;
    const auto = visible.filter((state) => !state.authored);
    // What the frame has left once the authored widths are paid for.
    const spare = budget - visible.reduce(
      (spent, state) => spent + (state.authored ? state.width : 0), 0,
    );

    const next = new Map<string, number>();
    if (auto.length > 0 && spare >= auto.length * floor) {
      const share = Math.floor(spare / auto.length);
      for (const state of visible) {
        next.set(state.key, state.authored
          ? state.width
          : Math.max(floor, Math.min(state.maxWidth, share)));
      }
    } else {
      const current = visible.reduce((sum, state) => sum + state.width, 0) || 1;
      const scale = budget / current;
      for (const state of visible) {
        next.set(state.key, Math.max(floor, Math.floor(state.width * scale)));
      }
    }

    // Hand the leftover pixels to the widest column that is free to grow: it
    // absorbs a few pixels without reading as a different column, and a
    // narrower one might be sitting on its floor or its maxWidth.
    let slack = budget - Array.from(next.values()).reduce((sum, w) => sum + w, 0);
    if (slack > 0) {
      const takers = visible
        .filter((state) => (next.get(state.key) ?? 0) < state.maxWidth)
        .sort((a, b) => (next.get(b.key) ?? 0) - (next.get(a.key) ?? 0));
      for (const state of takers) {
        if (slack <= 0) break;
        const room = Math.min(slack, state.maxWidth - (next.get(state.key) ?? 0));
        next.set(state.key, (next.get(state.key) ?? 0) + room);
        slack -= room;
      }
    }

    let changed = false;
    for (const state of visible) {
      const width = next.get(state.key)!;
      if (width !== state.width) {
        state.width = width;
        changed = true;
      }
    }
    return changed;
  }

  /**
   * A drag-resize under `squish` moved one column; the others pay for it.
   *
   * The dragged column is the anchor — it keeps the width the pointer asked
   * for, capped so the remaining columns can still sit on their floor — and the
   * rest are scaled to fill exactly what is left of the frame. Without this a
   * drag would simply push the trailing column out of a frame that is not
   * allowed to scroll.
   */
  private rebalanceSquish(anchorKey: string) {
    const budget = this.squishBudget;
    const anchor = this.states.get(anchorKey);
    if (budget === null || !anchor) return;

    const others = this.getVisibleColumns().filter((state) => state.key !== anchorKey);
    if (others.length === 0) return;

    const floor = TableColumnManager.SQUISH_MIN_WIDTH;
    anchor.width = Math.max(floor, Math.min(anchor.width, budget - others.length * floor));

    const remaining = budget - anchor.width;
    const current = others.reduce((sum, state) => sum + state.width, 0) || 1;
    const scale = remaining / current;
    for (const state of others) {
      state.width = Math.max(floor, Math.floor(state.width * scale));
    }

    let slack = remaining - others.reduce((sum, state) => sum + state.width, 0);
    for (const state of [...others].sort((a, b) => b.width - a.width)) {
      if (slack <= 0) break;
      const room = Math.min(slack, state.maxWidth - state.width);
      state.width += room;
      slack -= room;
    }
  }

  /** Push the current widths onto the painted header and body cells. */
  private writeWidths(keys: string[]) {
    const root = this.tableElement?.shadowRoot;
    if (!root) return;
    for (const key of keys) {
      const width = this.states.get(key)?.width;
      if (width === undefined) continue;
      const th = root.querySelector(`th[data-key="${key}"]`) as HTMLElement | null;
      if (th) th.style.width = `${width}px`;
      const tds = root.querySelectorAll(`td[data-key="${key}"]`) as NodeListOf<HTMLElement>;
      tds.forEach((td) => { td.style.width = `${width}px`; });
    }
  }

  /** Apply computed widths to <col> or <th> elements */
  applyWidths(headerRow: HTMLElement, widths: Map<string, number>) {
    const ths = headerRow.querySelectorAll('th[data-key]') as NodeListOf<HTMLElement>;
    ths.forEach(th => {
      const key = th.getAttribute('data-key');
      if (key && widths.has(key)) {
        th.style.width = `${widths.get(key)}px`;
      }
    });
  }

  // ── Resize ──

  /** Start column resize. Call from mousedown on resize handle. */
  startResize(columnKey: string, startX: number) {
    const state = this.states.get(columnKey);
    if (!state || !state.resizable) return;

    this.resizingKey = columnKey;
    this.resizeStartX = startX;
    this.resizeStartWidth = state.width;

    // Create overlay to capture mouse events
    this.resizeOverlay = document.createElement('div');
    this.resizeOverlay.style.cssText = 'position:fixed;inset:0;z-index:99999;cursor:col-resize;';
    document.body.appendChild(this.resizeOverlay);

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      const delta = e.clientX - this.resizeStartX;
      // Squish relaxes minWidth for the fit, so it has to relax it for the drag
      // too — otherwise a column the fit already squished below its minimum
      // would jump back up to it the moment its edge was touched.
      const squish = this.fitMode === 'squish';
      const min = squish ? TableColumnManager.SQUISH_MIN_WIDTH : state.minWidth;
      state.width = Math.max(min, Math.min(state.maxWidth, this.resizeStartWidth + delta));
      // Remove flex if manually resized
      state.flex = undefined;
      // The user chose this width — the container fit must leave it alone.
      state.authored = true;

      // Squish cannot let the drag push the table past the frame: the columns
      // beside this one give up (or take back) the difference.
      if (squish) this.rebalanceSquish(columnKey);
      this.writeWidths(squish
        ? this.getVisibleColumns().map((column) => column.key)
        : [columnKey]);

      // Dispatch resize event
      this.tableElement?.dispatchEvent(new CustomEvent('column-resize', {
        detail: { key: columnKey, width: state.width },
        bubbles: true, composed: true
      }));
    };

    const onUp = () => {
      this.resizingKey = null;
      this.resizeOverlay?.remove();
      this.resizeOverlay = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      this.tableElement?.dispatchEvent(new CustomEvent('column-resize-end', {
        detail: { key: columnKey, width: state.width },
        bubbles: true, composed: true
      }));
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /** Auto-size a column to fit its content */
  autoSizeColumn(columnKey: string, tbody: HTMLElement) {
    this.autoSizeColumns([columnKey], tbody);
  }

  /** Auto-size all columns */
  autoSizeAll(tbody: HTMLElement) {
    this.autoSizeColumns(Array.from(this.states.keys()), tbody);
  }

  /** Slack added to a measured content width so the last glyph never sits on
   *  the clip edge (and a sortable header keeps room for its chevron). */
  private static readonly AUTO_SIZE_SLACK = 4;

  /**
   * Measure the columns' content and give each the width it actually needs.
   *
   * A table cell's `scrollWidth` is NOT its content width: for content that
   * fits, it reports the padding box — the width the column already has. The
   * previous implementation took that maximum and added 16px, so every
   * "auto-size" pass could only GROW the column, by a chrome's worth each
   * time, until the table outgrew its own frame. Once it did, the right-pinned
   * column (`position: sticky`) parked over the columns beside it, and the
   * columns behind it read as deleted.
   *
   * The width a column NEEDS is a layout question, so ask layout: drop the
   * table into content-driven sizing (`table-layout: auto` at `max-content`)
   * with the measured columns' imposed widths removed, and read back the width
   * each header settles at. `max-content` also means no wrapping, so a long
   * cell reports its full single-line extent even though the painted column
   * ellipsises it. Everything is restored in the same task, before paint.
   */
  private autoSizeColumns(columnKeys: string[], tbody: HTMLElement) {
    const root = this.tableElement?.shadowRoot ?? null;
    const tableEl = (root?.querySelector('table')
      ?? tbody.closest('table')) as HTMLElement | null;
    const targets = columnKeys
      .map((key) => this.states.get(key))
      .filter((state): state is ColumnState => !!state);
    if (!tableEl || targets.length === 0) return;

    const restore: Array<() => void> = [];
    const push = (el: HTMLElement, property: 'width' | 'tableLayout') => {
      const previous = el.style[property];
      restore.push(() => { el.style[property] = previous; });
    };

    push(tableEl, 'tableLayout');
    push(tableEl, 'width');
    tableEl.style.tableLayout = 'auto';
    tableEl.style.width = 'max-content';

    const headers = new Map<string, HTMLElement>();
    for (const state of targets) {
      const header = root?.querySelector(`th[data-key="${state.key}"]`) as HTMLElement | null;
      if (!header) continue;
      headers.set(state.key, header);
      // An imposed width is still a preferred width under auto layout, so it
      // has to come off before the column can report what it wants.
      push(header, 'width');
      header.style.width = 'auto';
      for (const cell of Array.from(
        tbody.querySelectorAll(`td[data-key="${state.key}"]`),
      ) as HTMLElement[]) {
        push(cell, 'width');
        cell.style.width = 'auto';
      }
    }

    const widths = new Map<string, number>();
    for (const [key, header] of headers) {
      widths.set(key, header.getBoundingClientRect().width - horizontalCellChrome(header));
    }

    for (const undo of restore) undo();

    for (const state of targets) {
      const content = widths.get(state.key) ?? 0;
      // Nothing measurable — a layoutless DOM, or a column with no rendered
      // header. Leave the width alone rather than slamming it to the minimum.
      if (content <= 0) continue;
      state.width = Math.max(
        state.minWidth,
        Math.min(state.maxWidth, Math.ceil(content) + TableColumnManager.AUTO_SIZE_SLACK),
      );
      state.flex = undefined;
      state.authored = true;
    }
  }

  // ── Visibility ──

  setColumnVisible(key: string, visible: boolean) {
    const state = this.states.get(key);
    if (state && state.hideable) {
      state.visible = visible;
    }
  }

  showAllColumns() {
    for (const state of this.states.values()) {
      state.visible = true;
    }
  }

  hideAllColumns() {
    for (const state of this.states.values()) {
      if (state.hideable) state.visible = false;
    }
  }

  getVisibilityModel(): Record<string, boolean> {
    const model: Record<string, boolean> = {};
    for (const [key, state] of this.states) {
      model[key] = state.visible;
    }
    return model;
  }

  // ── Ordering ──

  moveColumn(key: string, toIndex: number) {
    const state = this.states.get(key);
    if (!state || !state.reorderable || state.pinned) return;

    const ordered = this.getVisibleColumns();
    const fromIndex = ordered.findIndex(s => s.key === key);
    if (fromIndex === -1 || fromIndex === toIndex) return;

    // Recompute order values
    ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, state);
    ordered.forEach((s, i) => { s.order = i; });
  }

  // ── Pinning ──

  pinColumn(key: string, side: 'left' | 'right') {
    const state = this.states.get(key);
    if (state && state.pinnable) {
      state.pinned = side;
    }
  }

  unpinColumn(key: string) {
    const state = this.states.get(key);
    if (state) {
      state.pinned = false;
    }
  }

  // ── Groups ──

  setColumnGroups(groups: ColumnGroup[]) {
    this.groups = groups;
  }

  getColumnGroups(): ColumnGroup[] {
    return this.groups;
  }

  /** Render group headers in the same order as the painted columns. Reordering
   * can split one declared group into multiple visual runs; repeating its
   * label for each run keeps every colspan aligned with the columns below. */
  renderGroupHeaders(columnKeys = this.getVisibleColumns().map((column) => column.key)): string {
    if (this.groups.length === 0) return '';

    const groupForKey = new Map<string, ColumnGroup>();
    for (const group of this.groups) {
      for (const key of group.children) groupForKey.set(key, group);
    }

    const runs: { group: ColumnGroup | null; span: number }[] = [];
    for (const key of columnKeys) {
      if (!this.states.get(key)?.visible) continue;
      const group = groupForKey.get(key) ?? null;
      const current = runs[runs.length - 1];
      if (current && current.group === group) current.span++;
      else runs.push({ group, span: 1 });
    }

    return runs.map(({ group, span }) => {
      if (!group) {
        return `<th colspan="${span}" class="column-group-header column-group-header--ungrouped" aria-hidden="true"></th>`;
      }
      return `<th colspan="${span}" class="column-group-header ${group.headerClass || ''}">${group.label}</th>`;
    }).join('');
  }

  isResizing(): boolean {
    return this.resizingKey !== null;
  }

  getState(key: string): ColumnState | undefined {
    return this.states.get(key);
  }

  /** Get sticky left offset for pinned-left columns */
  getPinnedLeftOffsets(): Map<string, number> {
    const offsets = new Map<string, number>();
    let left = 0;
    for (const col of this.getPinnedLeft()) {
      offsets.set(col.key, left);
      left += col.width;
    }
    return offsets;
  }

  /** Get sticky right offset for pinned-right columns */
  getPinnedRightOffsets(): Map<string, number> {
    const offsets = new Map<string, number>();
    const pinned = this.getPinnedRight();
    let right = 0;
    for (let i = pinned.length - 1; i >= 0; i--) {
      offsets.set(pinned[i].key, right);
      right += pinned[i].width;
    }
    return offsets;
  }
}
