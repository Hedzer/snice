/**
 * Column management for snice-table.
 * Handles: flex width, resize, auto-size, visibility, ordering, pinning, groups.
 */

import type { ColumnDefinition } from './snice-table.types';

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

  /** Fallback content width for a column nobody sized. */
  static readonly DEFAULT_WIDTH = 150;

  /** Initialize column states from column definitions */
  initialize(columns: ColumnDefinition[], tableEl: HTMLElement) {
    this.tableElement = tableEl;
    columns.forEach((col, index) => {
      const existing = this.states.get(col.key);
      const declared = this.parseWidth(col.width);
      this.states.set(col.key, {
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
      });
    });
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
   */
  fitVisibleColumns(availableWidth: number, chromePerColumn = 0): boolean {
    const visible = this.getVisibleColumns();
    // A layoutless (or not-yet-laid-out) frame reports 0. Fitting to that would
    // slam every column to its minimum for a measurement that means nothing.
    if (visible.length === 0 || !(availableWidth > 0)) return false;

    const auto = visible.filter((state) => !state.authored);
    if (auto.length === 0) return false;

    let budget = availableWidth - visible.length * chromePerColumn;
    for (const state of visible) {
      if (state.authored) budget -= state.width;
    }

    const share = Math.floor(budget / auto.length);
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
      const newWidth = Math.max(state.minWidth, Math.min(state.maxWidth, this.resizeStartWidth + delta));
      state.width = newWidth;
      // Remove flex if manually resized
      state.flex = undefined;
      // The user chose this width — the container fit must leave it alone.
      state.authored = true;

      // Apply width to DOM immediately
      const root = this.tableElement?.shadowRoot;
      if (root) {
        const th = root.querySelector(`th[data-key="${columnKey}"]`) as HTMLElement;
        if (th) th.style.width = `${newWidth}px`;
        const tds = root.querySelectorAll(`td[data-key="${columnKey}"]`) as NodeListOf<HTMLElement>;
        tds.forEach(td => td.style.width = `${newWidth}px`);
      }

      // Dispatch resize event
      this.tableElement?.dispatchEvent(new CustomEvent('column-resize', {
        detail: { key: columnKey, width: newWidth },
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
