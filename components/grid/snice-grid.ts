import { element, property, query, watch, dispatch, ready, dispose, render, styles } from 'snice';
import { html, css } from 'snice';
import cssContent from './snice-grid.css?inline';
import type { SniceGridElement, GridLayout, GridLayoutEntry, GridLayoutCompleteDetail, GridDragItemPositionedDetail } from './snice-grid.types';

// ---------------------------------------------------------------------------
// OccupancyGrid
// ---------------------------------------------------------------------------

class OccupancyGrid {
  private cells = new Map<string, HTMLElement>();

  private key(col: number, row: number): string {
    return `${col},${row}`;
  }

  occupy(col: number, row: number, colspan: number, rowspan: number, item: HTMLElement): void {
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        this.cells.set(this.key(c, r), item);
      }
    }
  }

  vacate(col: number, row: number, colspan: number, rowspan: number): void {
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        this.cells.delete(this.key(c, r));
      }
    }
  }

  getOccupant(col: number, row: number): HTMLElement | undefined {
    return this.cells.get(this.key(col, row));
  }

  isOccupied(col: number, row: number, colspan: number, rowspan: number): boolean {
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        if (this.cells.has(this.key(c, r))) return true;
      }
    }
    return false;
  }

  /** Find all unique items occupying cells in the given range */
  getOccupants(col: number, row: number, colspan: number, rowspan: number): Set<HTMLElement> {
    const occupants = new Set<HTMLElement>();
    for (let r = row; r < row + rowspan; r++) {
      for (let c = col; c < col + colspan; c++) {
        const occupant = this.cells.get(this.key(c, r));
        if (occupant) occupants.add(occupant);
      }
    }
    return occupants;
  }

  findNextFree(startCol: number, startRow: number, colspan: number, rowspan: number, maxCols: number): { col: number; row: number } {
    // Scan right-then-down
    for (let r = startRow; r < 10000; r++) {
      const startC = r === startRow ? startCol : 0;
      const endC = maxCols > 0 ? maxCols - colspan + 1 : 10000;
      for (let c = startC; c < endC; c++) {
        if (!this.isOccupied(c, r, colspan, rowspan)) {
          return { col: c, row: r };
        }
      }
    }
    return { col: startCol, row: startRow };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@element('snice-grid')
export class SniceGrid extends HTMLElement implements SniceGridElement {
  @property() gap = '1rem';
  @property({ type: Number, attribute: 'column-width' }) columnWidth = 80;
  @property({ type: Number, attribute: 'row-height' }) rowHeight = 80;
  @property({ type: Number }) columns = 0;
  @property({ type: Number }) rows = 0;
  @property({ type: Boolean, attribute: 'origin-left' }) originLeft = true;
  @property({ type: Boolean, attribute: 'origin-top' }) originTop = true;
  @property({ attribute: 'transition-duration' }) transitionDuration = '0.4s';
  @property({ type: Number }) stagger = 0;
  @property({ type: Boolean }) resize = true;
  @property({ type: Boolean }) draggable = false;
  @property({ type: Number, attribute: 'drag-throttle' }) dragThrottle = 120;

  @query('.grid') private container?: HTMLElement;
  @query('slot') private slotElement?: HTMLSlotElement;
  @query('.grid-drop-placeholder') private dropPlaceholder?: HTMLElement;

  private items: HTMLElement[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private layoutScheduled = false;
  private resolvedPositions = new Map<HTMLElement, { col: number; row: number; colspan: number; rowspan: number }>();

  // Drag state
  private dragItem: HTMLElement | null = null;
  private dragItemCol = 0;
  private dragItemRow = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private dragTime: number = 0;
  private dragTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;
  private pendingLayout: GridLayout | null = null;

  @ready()
  onReady() {
    this.collectItems();
    this.setupResizeObserver();
    if (this.draggable) {
      this.setAttribute('draggable', '');
      this.setupDragListeners();
    }
    this.performLayout();
    setTimeout(() => this.setAttribute('ready', ''), 10);
  }

  @dispose()
  onDispose() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.teardownDragListeners();
  }

  // -- Property watchers ----------------------------------------------------

  @watch('gap')
  onGapChange() {
    this.style.setProperty('--grid-gap', this.gap);
    this.scheduleLayout();
  }

  @watch('transitionDuration')
  onTransitionDurationChange() {
    this.style.setProperty('--grid-transition-duration', this.transitionDuration);
  }

  @watch('columnWidth')
  onColumnWidthChange() {
    this.scheduleLayout();
  }

  @watch('rowHeight')
  onRowHeightChange() {
    this.scheduleLayout();
  }

  @watch('columns')
  onColumnsChange() {
    this.scheduleLayout();
  }

  @watch('rows')
  onRowsChange() {
    this.scheduleLayout();
  }

  @watch('originLeft')
  onOriginLeftChange() {
    this.scheduleLayout();
  }

  @watch('originTop')
  onOriginTopChange() {
    this.scheduleLayout();
  }

  @watch('resize')
  onResizeChange() {
    if (this.resize) {
      this.setupResizeObserver();
    } else {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    }
  }

  @watch('draggable')
  onDraggableChange() {
    if (this.draggable) {
      this.setAttribute('draggable', '');
      this.setupDragListeners();
    } else {
      this.removeAttribute('draggable');
      this.teardownDragListeners();
    }
  }

  // -- Events ---------------------------------------------------------------

  @dispatch('grid-layout-complete', { bubbles: true, composed: true })
  private emitLayoutComplete(): GridLayoutCompleteDetail {
    return { items: [...this.items] };
  }

  @dispatch('grid-drag-item-positioned', { bubbles: true, composed: true })
  private emitDragItemPositioned(item: HTMLElement, col: number, row: number): GridDragItemPositionedDetail {
    return { item, col, row };
  }

  // -- Public API -----------------------------------------------------------

  layout(): void {
    this.performLayout();
  }

  fit(element: HTMLElement, col?: number, row?: number): void {
    if (!this.items.includes(element)) return;

    if (col !== undefined && row !== undefined) {
      element.setAttribute('grid-col', String(col));
      element.setAttribute('grid-row', String(row));
    }

    this.performLayout();
  }

  reloadItems(): void {
    this.collectItems();
    this.scheduleLayout();
  }

  getItemElements(): HTMLElement[] {
    return [...this.items];
  }

  getLayout(): GridLayout {
    const layout: GridLayout = {};
    let order = 0;

    for (const item of this.items) {
      const name = item.getAttribute('name');
      if (!name) continue;

      const resolved = this.resolvedPositions.get(item);
      const entry: GridLayoutEntry = {
        col: resolved ? resolved.col : parseInt(item.getAttribute('grid-col') || '0', 10),
        row: resolved ? resolved.row : parseInt(item.getAttribute('grid-row') || '0', 10),
        colspan: resolved ? resolved.colspan : parseInt(item.getAttribute('grid-colspan') || '1', 10),
        rowspan: resolved ? resolved.rowspan : parseInt(item.getAttribute('grid-rowspan') || '1', 10),
        order: order++,
      };

      if (item.hasAttribute('hidden')) {
        entry.hidden = true;
      }

      layout[name] = entry;
    }
    return layout;
  }

  setLayout(layout: GridLayout): void {
    this.pendingLayout = layout;
    this.applyPendingLayout();
    this.performLayout();
  }

  private applyPendingLayout(): void {
    if (!this.pendingLayout) return;
    const layout = this.pendingLayout;
    const entries = Object.entries(layout).sort((a, b) => a[1].order - b[1].order);

    const namedItems = new Map<string, HTMLElement>();
    const unnamed: HTMLElement[] = [];
    for (const item of this.items) {
      const name = item.getAttribute('name');
      if (name) {
        namedItems.set(name, item);
      } else {
        unnamed.push(item);
      }
    }

    const reordered: HTMLElement[] = [];
    for (const [name, entry] of entries) {
      const item = namedItems.get(name);
      if (!item) continue;
      namedItems.delete(name);

      // Apply grid attributes from layout
      item.setAttribute('grid-col', String(entry.col));
      item.setAttribute('grid-row', String(entry.row));
      if (entry.colspan != null) item.setAttribute('grid-colspan', String(entry.colspan));
      if (entry.rowspan != null) item.setAttribute('grid-rowspan', String(entry.rowspan));

      if (entry.hidden) {
        item.setAttribute('hidden', '');
      } else {
        item.removeAttribute('hidden');
      }

      reordered.push(item);
    }

    for (const item of namedItems.values()) {
      item.removeAttribute('hidden');
      reordered.push(item);
    }

    reordered.push(...unnamed);

    for (const item of reordered) {
      this.appendChild(item);
    }

    this.items = reordered;
  }

  // -- Template & Styles ----------------------------------------------------

  @render()
  template() {
    return html`
      <div class="grid" part="base" role="list">
        <slot @slotchange="${() => this.handleSlotChange()}"></slot>
        <div class="grid-drop-placeholder"></div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  // -- Private helpers ------------------------------------------------------

  private handleSlotChange(): void {
    this.collectItems();
    if (this.pendingLayout) {
      this.applyPendingLayout();
    }
    this.scheduleLayout();
  }

  private collectItems(): void {
    if (!this.slotElement) return;
    this.items = (this.slotElement.assignedElements({ flatten: true }) as HTMLElement[])
      .filter(el => el instanceof HTMLElement);
  }

  private lastObservedWidth = 0;
  private lastObservedHeight = 0;

  private setupResizeObserver(): void {
    if (!this.resize) return;
    if (this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      // Only relayout if the host element size actually changed (not from our own container sizing)
      if (Math.abs(width - this.lastObservedWidth) > 0.5 || Math.abs(height - this.lastObservedHeight) > 0.5) {
        this.lastObservedWidth = width;
        this.lastObservedHeight = height;
        this.scheduleLayout();
      }
    });
    this.resizeObserver.observe(this);
  }

  private scheduleLayout(): void {
    if (this.layoutScheduled) return;
    this.layoutScheduled = true;
    requestAnimationFrame(() => {
      this.layoutScheduled = false;
      // Don't run scheduled layouts during active drag — it would fight with free drag positioning
      if (this.dragItem) return;
      this.performLayout();
    });
  }

  private getGapPixels(): number {
    const gap = this.gap;
    if (gap.endsWith('px')) {
      const val = parseFloat(gap);
      if (!isNaN(val)) return val;
    }
    if (gap.endsWith('rem')) {
      const val = parseFloat(gap);
      if (!isNaN(val)) {
        const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return val * fontSize;
      }
    }
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = gap;
    document.body.appendChild(temp);
    const px = temp.getBoundingClientRect().width;
    temp.remove();
    return px;
  }

  private performLayout(): void {
    const gapPx = this.getGapPixels();
    const maxCols = this.columns;
    const occupancy = new OccupancyGrid();

    // Phase 1: Collect requested positions for all visible items
    interface ItemPlacement {
      item: HTMLElement;
      col: number;
      row: number;
      colspan: number;
      rowspan: number;
    }
    const placements: ItemPlacement[] = [];
    for (const item of this.items) {
      if (item.hasAttribute('hidden')) continue;
      placements.push({
        item,
        col: parseInt(item.getAttribute('grid-col') || '0', 10),
        row: parseInt(item.getAttribute('grid-row') || '0', 10),
        colspan: parseInt(item.getAttribute('grid-colspan') || '1', 10),
        rowspan: parseInt(item.getAttribute('grid-rowspan') || '1', 10),
      });
    }

    // Phase 1b: Sort placements — unmoved items first, moved items last.
    // This ensures static items are in the occupancy grid before moved items
    // are processed, so the moved item triggers proper swap logic.
    const sorted = [...placements].sort((a, b) => {
      const aPrev = this.resolvedPositions.get(a.item);
      const bPrev = this.resolvedPositions.get(b.item);
      const aMoved = aPrev ? (aPrev.col !== a.col || aPrev.row !== a.row ? 1 : 0) : 0;
      const bMoved = bPrev ? (bPrev.col !== b.col || bPrev.row !== b.row ? 1 : 0) : 0;
      return aMoved - bMoved;
    });

    // Phase 2: Place items with swap-first collision resolution
    // Unmoved items placed first, moved items last (so they collide with and swap static items).
    const resolvedMap = new Map<HTMLElement, { col: number; row: number; colspan: number; rowspan: number }>();

    for (const p of sorted) {
      let { col, row } = p;
      const { colspan, rowspan, item } = p;

      // Clamp to column constraint
      if (maxCols > 0 && col + colspan > maxCols) {
        col = Math.max(0, maxCols - colspan);
      }

      if (occupancy.isOccupied(col, row, colspan, rowspan)) {
        // Try swap: displace all occupants in target area, place incoming item,
        // then re-place displaced items at incoming item's previous position (best effort)
        const occupants = occupancy.getOccupants(col, row, colspan, rowspan);
        const prevPos = this.resolvedPositions.get(item);
        const swapCol = prevPos ? prevPos.col : p.col;
        const swapRow = prevPos ? prevPos.row : p.row;
        const samePosition = swapCol === col && swapRow === row;

        let swapped = false;

        if (occupants.size > 0 && !samePosition) {
          // Collect occupant info and vacate all their cells
          const displaced: Array<{ el: HTMLElement; pos: { col: number; row: number; colspan: number; rowspan: number } }> = [];
          for (const occ of occupants) {
            const occPos = resolvedMap.get(occ);
            if (occPos) {
              displaced.push({ el: occ, pos: { ...occPos } });
              occupancy.vacate(occPos.col, occPos.row, occPos.colspan, occPos.rowspan);
            }
          }

          // Can we place the incoming item at the target now?
          if (!occupancy.isOccupied(col, row, colspan, rowspan)) {
            // Place incoming item
            occupancy.occupy(col, row, colspan, rowspan, item);
            resolvedMap.set(item, { col, row, colspan, rowspan });

            // Re-place displaced items: best effort at swap position, fallback push-right-then-down
            for (const d of displaced) {
              const { colspan: dc, rowspan: dr } = d.pos;
              // Try the swap position (incoming item's previous location)
              if (!occupancy.isOccupied(swapCol, swapRow, dc, dr)) {
                occupancy.occupy(swapCol, swapRow, dc, dr, d.el);
                resolvedMap.set(d.el, { ...d.pos, col: swapCol, row: swapRow });
              } else {
                // Push-right-then-down from swap position
                const free = occupancy.findNextFree(swapCol, swapRow, dc, dr, maxCols);
                occupancy.occupy(free.col, free.row, dc, dr, d.el);
                resolvedMap.set(d.el, { ...d.pos, col: free.col, row: free.row });
              }
            }

            swapped = true;
          } else {
            // Can't place — restore all occupants
            for (const d of displaced) {
              occupancy.occupy(d.pos.col, d.pos.row, d.pos.colspan, d.pos.rowspan, d.el);
            }
          }
        }

        if (swapped) continue;

        // Fall back: push-right-then-down
        const free = occupancy.findNextFree(col, row, colspan, rowspan, maxCols);
        col = free.col;
        row = free.row;
      }

      occupancy.occupy(col, row, colspan, rowspan, item);
      resolvedMap.set(item, { col, row, colspan, rowspan });
    }

    // Phase 2b: Sync grid attributes so displaced items don't snap back on next layout
    for (const p of placements) {
      const resolved = resolvedMap.get(p.item);
      if (!resolved) continue;
      if (resolved.col !== p.col || resolved.row !== p.row) {
        p.item.setAttribute('grid-col', String(resolved.col));
        p.item.setAttribute('grid-row', String(resolved.row));
      }
    }

    // Phase 3: Apply positions to DOM
    let maxCol = 0;
    let maxRow = 0;
    let staggerIndex = 0;
    this.resolvedPositions.clear();

    for (const p of placements) {
      const resolved = resolvedMap.get(p.item);
      if (!resolved) continue;

      const { col, row, colspan, rowspan } = resolved;

      let x = col * (this.columnWidth + gapPx);
      let y = row * (this.rowHeight + gapPx);

      const itemWidth = colspan * this.columnWidth + (colspan - 1) * gapPx;
      const itemHeight = rowspan * this.rowHeight + (rowspan - 1) * gapPx;
      p.item.style.width = `${itemWidth}px`;
      p.item.style.height = `${itemHeight}px`;

      if (!this.originLeft) {
        x = this.clientWidth - x - itemWidth;
      }
      if (!this.originTop) {
        y = this.clientHeight - y - itemHeight;
      }

      this.positionItem(p.item, x, y, this.stagger > 0 ? staggerIndex * this.stagger : 0);
      this.resolvedPositions.set(p.item, { col, row, colspan, rowspan });

      if (col + colspan > maxCol) maxCol = col + colspan;
      if (row + rowspan > maxRow) maxRow = row + rowspan;
      staggerIndex++;
    }

    // Compute container size
    if (this.container) {
      const effectiveCols = this.columns > 0 ? this.columns : maxCol;
      const effectiveRows = this.rows > 0 ? this.rows : maxRow;
      const containerWidth = effectiveCols > 0
        ? effectiveCols * this.columnWidth + (effectiveCols - 1) * gapPx
        : 0;
      const containerHeight = effectiveRows > 0
        ? effectiveRows * this.rowHeight + (effectiveRows - 1) * gapPx
        : 0;
      this.container.style.width = containerWidth > 0 ? `${containerWidth}px` : '';
      this.container.style.height = containerHeight > 0 ? `${containerHeight}px` : '';
    }

    this.emitLayoutComplete();
  }

  private positionItem(item: HTMLElement, x: number, y: number, delay: number): void {
    if (delay > 0) {
      item.style.transitionDelay = `${delay}ms`;
    } else {
      item.style.transitionDelay = '';
    }
    item.style.transform = `translate(${x}px, ${y}px)`;
  }

  // -- Drag implementation --------------------------------------------------

  private setupDragListeners(): void {
    this.addEventListener('pointerdown', this.onPointerDown);
  }

  private teardownDragListeners(): void {
    this.removeEventListener('pointerdown', this.onPointerDown);
    if (this.boundPointerMove) {
      document.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      document.removeEventListener('pointerup', this.boundPointerUp);
      this.boundPointerUp = null;
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.draggable) return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const item = this.items.find(el => el === target || el.contains(target));
    if (!item) return;

    e.preventDefault();
    this.dragItemStart(item, e);
  };

  private dragItemStart(item: HTMLElement, e: PointerEvent): void {
    const containerRect = this.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const currentX = itemRect.left - containerRect.left;
    const currentY = itemRect.top - containerRect.top;

    this.dragItem = item;
    this.dragOffsetX = e.clientX - itemRect.left;
    this.dragOffsetY = e.clientY - itemRect.top;

    const gapPx = this.getGapPixels();
    const cellW = this.columnWidth + gapPx;
    const cellH = this.rowHeight + gapPx;
    this.dragItemCol = cellW > 0 ? Math.round(currentX / cellW) : 0;
    this.dragItemRow = cellH > 0 ? Math.round(currentY / cellH) : 0;

    item.classList.add('grid-dragging');
    item.style.transition = 'none';

    // Show placeholder
    this.showPlaceholder(item);

    this.boundPointerMove = (ev: PointerEvent) => this.onPointerMove(ev);
    this.boundPointerUp = (ev: PointerEvent) => this.onPointerUp(ev);
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);

    try { item.setPointerCapture(e.pointerId); } catch (_) { /* synthetic events */ }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragItem) return;

    const containerRect = this.getBoundingClientRect();
    const x = e.clientX - containerRect.left - this.dragOffsetX;
    const y = e.clientY - containerRect.top - this.dragOffsetY;

    this.dragItem.style.transform = `translate(${x}px, ${y}px)`;

    const now = Date.now();
    const isThrottled = this.dragTime && (now - this.dragTime) < this.dragThrottle;

    const doSnap = () => {
      const gapPx = this.getGapPixels();
      const cellW = this.columnWidth + gapPx;
      const cellH = this.rowHeight + gapPx;
      this.dragItemCol = cellW > 0 ? Math.round(x / cellW) : 0;
      this.dragItemRow = cellH > 0 ? Math.round(y / cellH) : 0;
      if (this.dragItemCol < 0) this.dragItemCol = 0;
      if (this.dragItemRow < 0) this.dragItemRow = 0;
      this.positionPlaceholder();
    };

    if (isThrottled) {
      if (this.dragTimeoutId !== null) clearTimeout(this.dragTimeoutId);
      this.dragTimeoutId = setTimeout(doSnap, this.dragThrottle);
    } else {
      doSnap();
      this.dragTime = now;
    }
  }

  private onPointerUp(_e: PointerEvent): void {
    if (!this.dragItem) return;

    const item = this.dragItem;

    if (this.boundPointerMove) {
      document.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      document.removeEventListener('pointerup', this.boundPointerUp);
      this.boundPointerUp = null;
    }
    if (this.dragTimeoutId !== null) {
      clearTimeout(this.dragTimeoutId);
      this.dragTimeoutId = null;
    }

    // Update grid attributes to snapped position
    item.setAttribute('grid-col', String(this.dragItemCol));
    item.setAttribute('grid-row', String(this.dragItemRow));

    item.classList.remove('grid-dragging');
    item.classList.add('grid-positioning');
    item.style.transition = '';

    const col = this.dragItemCol;
    const row = this.dragItemRow;

    const onTransitionEnd = () => {
      item.removeEventListener('transitionend', onTransitionEnd);
      item.classList.remove('grid-positioning');
      this.hidePlaceholder();
      this.emitDragItemPositioned(item, col, row);
    };
    item.addEventListener('transitionend', onTransitionEnd);

    this.dragItem = null;
    this.performLayout();

    // Safety timeout
    setTimeout(() => {
      if (item.classList.contains('grid-positioning')) {
        item.classList.remove('grid-positioning');
        this.hidePlaceholder();
      }
    }, parseFloat(this.transitionDuration) * 1000 + 100);
  }

  private showPlaceholder(item: HTMLElement): void {
    if (!this.dropPlaceholder) return;
    this.dropPlaceholder.style.width = `${item.offsetWidth}px`;
    this.dropPlaceholder.style.height = `${item.offsetHeight}px`;
    this.dropPlaceholder.classList.add('visible');
    this.positionPlaceholder();
  }

  private positionPlaceholder(): void {
    if (!this.dropPlaceholder) return;
    const gapPx = this.getGapPixels();
    const x = this.dragItemCol * (this.columnWidth + gapPx);
    const y = this.dragItemRow * (this.rowHeight + gapPx);
    this.dropPlaceholder.style.transform = `translate(${x}px, ${y}px)`;
  }

  private hidePlaceholder(): void {
    if (!this.dropPlaceholder) return;
    this.dropPlaceholder.classList.remove('visible');
  }
}
