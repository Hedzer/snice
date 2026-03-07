/**
 * Column management for snice-table.
 * Handles: flex width, resize, auto-size, visibility, ordering, pinning, groups.
 */

import type { ColumnDefinition } from './snice-table.types';

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

  /** Initialize column states from column definitions */
  initialize(columns: ColumnDefinition[], tableEl: HTMLElement) {
    this.tableElement = tableEl;
    columns.forEach((col, index) => {
      const existing = this.states.get(col.key);
      this.states.set(col.key, {
        key: col.key,
        width: existing?.width ?? this.parseWidth(col.width) ?? 150,
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
    const state = this.states.get(columnKey);
    if (!state) return;

    // Measure header
    const th = this.tableElement?.shadowRoot?.querySelector(`th[data-key="${columnKey}"]`) as HTMLElement;
    let maxWidth = th ? th.scrollWidth : 0;

    // Measure body cells
    const cells = tbody.querySelectorAll(`td[data-key="${columnKey}"]`) as NodeListOf<HTMLElement>;
    cells.forEach(cell => {
      maxWidth = Math.max(maxWidth, cell.scrollWidth);
    });

    state.width = Math.max(state.minWidth, Math.min(state.maxWidth, maxWidth + 16)); // 16px padding
    state.flex = undefined;
  }

  /** Auto-size all columns */
  autoSizeAll(tbody: HTMLElement) {
    for (const key of this.states.keys()) {
      this.autoSizeColumn(key, tbody);
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

  /** Render group header row HTML */
  renderGroupHeaders(): string {
    if (this.groups.length === 0) return '';

    return this.groups.map(group => {
      const span = group.children.filter(key => this.states.get(key)?.visible).length;
      if (span === 0) return '';
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
