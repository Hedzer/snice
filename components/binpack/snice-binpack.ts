import { element, property, query, watch, dispatch, ready, dispose, render, styles } from 'snice';
import { html, css } from 'snice';
import cssContent from './snice-binpack.css?inline';
import type { SniceBinpackElement, BinpackLayoutCompleteDetail, BinpackFitCompleteDetail, BinpackDragItemPositionedDetail, BinpackLayout, BinpackLayoutEntry, Rect } from './snice-binpack.types';

// ---------------------------------------------------------------------------
// Rect helpers
// ---------------------------------------------------------------------------

function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function rectOverlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function canFit(space: Rect, item: Rect): boolean {
  // 1px tolerance for sub-pixel rounding errors
  return space.width >= item.width - 1 && space.height >= item.height - 1;
}

/**
 * After placing `placed` inside `space`, return up to 4 remaining sub-rects
 * (top, right, bottom, left strips).
 */
function getMaximalFreeRects(space: Rect, placed: Rect): Rect[] {
  const rects: Rect[] = [];

  // Top strip
  if (placed.y > space.y) {
    rects.push({ x: space.x, y: space.y, width: space.width, height: placed.y - space.y });
  }
  // Bottom strip
  const placedBottom = placed.y + placed.height;
  const spaceBottom = space.y + space.height;
  if (placedBottom < spaceBottom) {
    rects.push({ x: space.x, y: placedBottom, width: space.width, height: spaceBottom - placedBottom });
  }
  // Left strip
  if (placed.x > space.x) {
    rects.push({ x: space.x, y: space.y, width: placed.x - space.x, height: space.height });
  }
  // Right strip
  const placedRight = placed.x + placed.width;
  const spaceRight = space.x + space.width;
  if (placedRight < spaceRight) {
    rects.push({ x: placedRight, y: space.y, width: spaceRight - placedRight, height: space.height });
  }

  return rects;
}

// ---------------------------------------------------------------------------
// Packer
// ---------------------------------------------------------------------------

class Packer {
  spaces: Rect[];
  width: number;
  height: number;
  private horizontal: boolean;

  constructor(width: number, height: number, horizontal: boolean) {
    this.width = width;
    this.height = height;
    this.horizontal = horizontal;
    this.spaces = [{ x: 0, y: 0, width, height }];
  }

  /**
   * Snap item dimensions to the nearest grid multiple.
   * If gridSize is set, round UP to the next (gridSize + gutter) multiple.
   */
  private applyGrid(measurement: number, gridSize: number, gutter: number): number {
    if (!gridSize) return measurement;
    const gridWithGutter = gridSize + gutter;
    const remainder = measurement % gridWithGutter;
    const method = remainder && remainder < 1 ? 'round' : 'ceil';
    return Math[method](measurement / gridWithGutter) * gridWithGutter;
  }

  /**
   * Find first fitting space and return the placement position.
   * If columnWidth/rowHeight are provided, snap item SIZE to grid.
   */
  pack(itemWidth: number, itemHeight: number, columnWidth: number, rowHeight: number, gutter: number): { x: number; y: number } | null {
    // Snap item size to grid multiples
    const w = this.applyGrid(itemWidth, columnWidth, gutter);
    const h = this.applyGrid(itemHeight, rowHeight, gutter);

    // Clamp to packer bounds
    const item: Rect = {
      x: 0, y: 0,
      width: Math.min(w, this.width),
      height: Math.min(h, this.height),
    };

    for (const space of this.spaces) {
      if (canFit(space, item)) {
        item.x = space.x;
        item.y = space.y;
        this.placed(item);
        return { x: space.x, y: space.y };
      }
    }

    return null;
  }

  /**
   * Update free spaces after an item has been placed.
   */
  placed(placed: Rect): void {
    const newSpaces: Rect[] = [];

    for (const space of this.spaces) {
      if (rectOverlaps(space, placed)) {
        const subs = getMaximalFreeRects(space, placed);
        newSpaces.push(...subs);
      } else {
        newSpaces.push(space);
      }
    }

    this.spaces = newSpaces;
    this.mergeSortSpaces();
  }

  /**
   * Remove spaces fully contained within larger ones, then sort.
   */
  mergeSortSpaces(): void {
    // Remove contained spaces
    this.spaces = this.spaces.filter((space, i, arr) => {
      for (let j = 0; j < arr.length; j++) {
        if (i !== j && rectContains(arr[j], space)) {
          return false;
        }
      }
      return true;
    });

    // Sort: vertical = downward-left-to-right, horizontal = rightward-top-to-bottom
    if (this.horizontal) {
      this.spaces.sort((a, b) => a.x - b.x || a.y - b.y);
    } else {
      this.spaces.sort((a, b) => a.y - b.y || a.x - b.x);
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@element('snice-binpack')
export class SniceBinpack extends HTMLElement implements SniceBinpackElement {
  @property() gap = '1rem';
  @property({ type: Number, attribute: 'column-width' }) columnWidth = 0;
  @property({ type: Number, attribute: 'row-height' }) rowHeight = 0;
  @property({ type: Boolean }) horizontal = false;
  @property({ type: Boolean, attribute: 'origin-left' }) originLeft = true;
  @property({ type: Boolean, attribute: 'origin-top' }) originTop = true;
  @property({ attribute: 'transition-duration' }) transitionDuration = '0.4s';
  @property({ type: Number }) stagger = 0;
  @property({ type: Boolean }) resize = true;
  @property({ type: Boolean }) draggable = false;
  @property({ type: Number, attribute: 'drag-throttle' }) dragThrottle = 120;

  @query('.binpack') private container?: HTMLElement;
  @query('slot') private slotElement?: HTMLSlotElement;
  @query('.binpack-drop-placeholder') private dropPlaceholder?: HTMLElement;

  private items: HTMLElement[] = [];
  private stampedElements = new Set<HTMLElement>();
  private resizeObserver: ResizeObserver | null = null;
  private itemResizeObserver: ResizeObserver | null = null;
  private layoutScheduled = false;

  // Drag state
  private dragItemCount = 0;
  private shiftTargets: { x: number; y: number }[] = [];
  private shiftTargetKeys: string[] = [];
  private dragItem: HTMLElement | null = null;
  private dragItemRect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private dragTime: number = 0;
  private dragTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: ((e: PointerEvent) => void) | null = null;

  @ready()
  onReady() {
    this.collectItems();
    this.setupResizeObserver();
    if (this.draggable) {
      this.setAttribute('draggable', '');
      this.setupDragListeners();
    }
    this.layout();
    setTimeout(() => this.setAttribute('ready', ''), 10);
  }

  @dispose()
  onDispose() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.itemResizeObserver?.disconnect();
    this.itemResizeObserver = null;
    this.teardownDragListeners();
  }

  // -- Property watchers ----------------------------------------------------

  @watch('gap')
  onGapChange() {
    this.style.setProperty('--binpack-gap', this.gap);
    this.scheduleLayout();
  }

  @watch('transitionDuration')
  onTransitionDurationChange() {
    this.style.setProperty('--binpack-transition-duration', this.transitionDuration);
  }

  @watch('columnWidth')
  onColumnWidthChange() {
    this.scheduleLayout();
  }

  @watch('rowHeight')
  onRowHeightChange() {
    this.scheduleLayout();
  }

  @watch('horizontal')
  onHorizontalChange() {
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

  @dispatch('binpack-layout-complete', { bubbles: true, composed: true })
  private emitLayoutComplete(): BinpackLayoutCompleteDetail {
    return { items: [...this.items] };
  }

  @dispatch('binpack-fit-complete', { bubbles: true, composed: true })
  private emitFitComplete(item: HTMLElement, x: number, y: number): BinpackFitCompleteDetail {
    return { item, x, y };
  }

  @dispatch('binpack-drag-item-positioned', { bubbles: true, composed: true })
  private emitDragItemPositioned(item: HTMLElement, x: number, y: number): BinpackDragItemPositionedDetail {
    return { item, x, y };
  }

  // -- Public API -----------------------------------------------------------

  layout(): void {
    this.performLayout();
  }

  fit(element: HTMLElement, x?: number, y?: number): void {
    if (!this.items.includes(element)) return;

    if (x !== undefined && y !== undefined) {
      this.positionItem(element, x, y, 0);
    }

    // Re-layout remaining items around the fitted one
    this.performLayout(element);

    const rect = element.getBoundingClientRect();
    const containerRect = this.getBoundingClientRect();
    const finalX = rect.left - containerRect.left;
    const finalY = rect.top - containerRect.top;
    this.emitFitComplete(element, finalX, finalY);
  }

  reloadItems(): void {
    this.collectItems();
    this.observeItems();
    this.scheduleLayout();
  }

  stamp(elements: HTMLElement | HTMLElement[]): void {
    const els = Array.isArray(elements) ? elements : [elements];
    els.forEach(el => this.stampedElements.add(el));
    this.scheduleLayout();
  }

  unstamp(elements: HTMLElement | HTMLElement[]): void {
    const els = Array.isArray(elements) ? elements : [elements];
    els.forEach(el => this.stampedElements.delete(el));
    this.scheduleLayout();
  }

  getItemElements(): HTMLElement[] {
    return [...this.items];
  }

  getLayout(): BinpackLayout {
    const layout: BinpackLayout = {};
    const gapPx = this.getGapPixels();
    const hasGrid = this.columnWidth > 0 || this.rowHeight > 0;

    let order = 0;
    for (const item of this.items) {
      const name = item.getAttribute('name');
      if (!name) continue;

      const entry: BinpackLayoutEntry = { order: order++ };

      if (item.hasAttribute('hidden')) {
        entry.hidden = true;
      }

      if (hasGrid && !entry.hidden) {
        const match = item.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          if (this.columnWidth > 0) {
            entry.col = Math.round(x / (this.columnWidth + gapPx));
          }
          if (this.rowHeight > 0) {
            entry.row = Math.round(y / (this.rowHeight + gapPx));
          }
        }
      }

      layout[name] = entry;
    }
    return layout;
  }

  setLayout(layout: BinpackLayout): void {
    // Build ordered list of named items from the layout
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

    // Reorder items: layout-ordered named items first, then unnamed in original order
    const reordered: HTMLElement[] = [];
    for (const [name, entry] of entries) {
      const item = namedItems.get(name);
      if (!item) continue;
      namedItems.delete(name);

      // Apply hidden state
      if (entry.hidden) {
        item.setAttribute('hidden', '');
      } else {
        item.removeAttribute('hidden');
      }

      reordered.push(item);
    }

    // Remaining named items not in layout (new items added after save)
    for (const item of namedItems.values()) {
      item.removeAttribute('hidden');
      reordered.push(item);
    }

    // Unnamed items at the end
    reordered.push(...unnamed);

    // Reorder DOM to match
    for (const item of reordered) {
      this.appendChild(item);
    }

    this.items = reordered;
    this.performLayout();
  }

  // -- Template & Styles ----------------------------------------------------

  @render()
  template() {
    return html`
      <div class="binpack" part="base" role="list">
        <slot @slotchange="${() => this.handleSlotChange()}"></slot>
        <div class="binpack-drop-placeholder"></div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }

  // -- Private helpers ------------------------------------------------------

  private handleSlotChange(): void {
    this.collectItems();
    this.observeItems();
    this.scheduleLayout();
  }

  private collectItems(): void {
    if (!this.slotElement) return;
    this.items = (this.slotElement.assignedElements({ flatten: true }) as HTMLElement[])
      .filter(el => el instanceof HTMLElement);
  }

  private setupResizeObserver(): void {
    if (!this.resize) return;
    if (this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleLayout();
    });
    this.resizeObserver.observe(this);

    this.observeItems();
  }

  private observeItems(): void {
    this.itemResizeObserver?.disconnect();
    this.itemResizeObserver = new ResizeObserver(() => {
      this.scheduleLayout();
    });
    for (const item of this.items) {
      this.itemResizeObserver.observe(item);
    }
  }

  private scheduleLayout(): void {
    if (this.layoutScheduled) return;
    this.layoutScheduled = true;
    requestAnimationFrame(() => {
      this.layoutScheduled = false;
      this.performLayout();
    });
  }

  private getGapPixels(): number {
    // Parse gap string to pixels
    const gap = this.gap;
    // Fast path for common values
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
    // Fallback: measure via DOM
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = gap;
    document.body.appendChild(temp);
    const px = temp.getBoundingClientRect().width;
    temp.remove();
    return px;
  }

  private performLayout(fittedElement?: HTMLElement): void {
    const containerWidth = this.clientWidth;
    const containerHeight = this.clientHeight;
    const gapPx = this.getGapPixels();

    // Packer dimensions include one extra gutter so edge items fit.
    // Vertical: constrained by container width, infinite height.
    // Horizontal: constrained by container height, infinite width.
    const packWidth = this.horizontal ? 100000 : containerWidth + gapPx;
    const packHeight = this.horizontal ? containerHeight + gapPx : 100000;

    const packer = new Packer(packWidth, packHeight, this.horizontal);

    // Mark stamped elements as occupied in the packer
    for (const stamped of this.stampedElements) {
      let stampRect: Rect;
      if (stamped === this.dragItem) {
        // Use the computed drop position, not the cursor position
        stampRect = {
          x: this.dragItemRect.x,
          y: this.dragItemRect.y,
          width: this.dragItemRect.width + gapPx,
          height: this.dragItemRect.height + gapPx,
        };
      } else {
        const rect = stamped.getBoundingClientRect();
        const containerRect = this.getBoundingClientRect();
        stampRect = {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width + gapPx,
          height: rect.height + gapPx,
        };
      }
      packer.placed(stampRect);
    }

    // If a fitted element is specified, mark it as placed first
    if (fittedElement) {
      const rect = fittedElement.getBoundingClientRect();
      const containerRect = this.getBoundingClientRect();
      const fitRect: Rect = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width + gapPx,
        height: rect.height + gapPx,
      };
      packer.placed(fitRect);
    }

    let maxExtent = 0;
    let staggerIndex = 0;

    for (const item of this.items) {
      if (this.stampedElements.has(item)) continue;
      if (item === fittedElement) continue;
      if (item.hasAttribute('hidden')) continue;

      const itemWidth = item.offsetWidth + gapPx;
      const itemHeight = item.offsetHeight + gapPx;

      const position = packer.pack(itemWidth, itemHeight, this.columnWidth, this.rowHeight, gapPx);

      if (position) {
        let x = position.x;
        let y = position.y;

        // Handle origin direction
        if (!this.originLeft) {
          x = containerWidth - x - item.offsetWidth;
        }
        if (!this.originTop) {
          y = containerHeight - y - item.offsetHeight;
        }

        this.positionItem(item, x, y, this.stagger > 0 ? staggerIndex * this.stagger : 0);

        const extent = this.horizontal
          ? position.x + itemWidth
          : position.y + itemHeight;
        if (extent > maxExtent) maxExtent = extent;

        staggerIndex++;
      }
    }

    // Set container size, subtracting trailing gutter
    const containerSize = Math.max(0, maxExtent - gapPx);
    if (this.container) {
      if (this.horizontal) {
        this.container.style.width = `${containerSize}px`;
        this.container.style.height = '';
      } else {
        this.container.style.height = `${containerSize}px`;
        this.container.style.width = '';
      }
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
    // Only handle primary button
    if (e.button !== 0) return;

    // Find the direct child item that was clicked
    const target = e.target as HTMLElement;
    const item = this.items.find(el =>
      el === target || el.contains(target)
    );
    if (!item || this.stampedElements.has(item)) return;

    e.preventDefault();
    this.dragItemStart(item, e);
  };

  private dragItemStart(item: HTMLElement, e: PointerEvent): void {
    const containerRect = this.getBoundingClientRect();

    // Get the item's current position from its transform
    const itemRect = item.getBoundingClientRect();
    const currentX = itemRect.left - containerRect.left;
    const currentY = itemRect.top - containerRect.top;

    this.dragItem = item;
    this.dragItemRect = {
      x: currentX,
      y: currentY,
      width: item.offsetWidth,
      height: item.offsetHeight,
    };
    this.dragStartX = currentX;
    this.dragStartY = currentY;
    this.dragOffsetX = e.clientX - itemRect.left;
    this.dragOffsetY = e.clientY - itemRect.top;

    // Stamp the dragged item so layout flows around it
    this.stamp(item);
    this.dragItemCount++;

    // Add dragging class
    item.classList.add('binpack-dragging');
    item.style.transition = 'none';

    // Show placeholder
    this.showPlaceholder(item);

    // Compute shift targets
    this.updateShiftTargets();

    // Bind move/up to document
    this.boundPointerMove = (ev: PointerEvent) => this.onPointerMove(ev);
    this.boundPointerUp = (ev: PointerEvent) => this.onPointerUp(ev);
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);

    // Capture pointer for reliable tracking
    try { item.setPointerCapture(e.pointerId); } catch (_) { /* synthetic events */ }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragItem) return;

    const containerRect = this.getBoundingClientRect();
    const x = e.clientX - containerRect.left - this.dragOffsetX;
    const y = e.clientY - containerRect.top - this.dragOffsetY;

    // Move the dragged item directly (no transition)
    this.dragItem.style.transform = `translate(${x}px, ${y}px)`;

    // Throttled layout update
    const now = Date.now();
    const isThrottled = this.dragTime && (now - this.dragTime) < this.dragThrottle;

    const doShift = () => {
      this.shiftToNearest(x, y);
      this.positionPlaceholder();
      this.performLayout();
    };

    if (isThrottled) {
      if (this.dragTimeoutId !== null) clearTimeout(this.dragTimeoutId);
      this.dragTimeoutId = setTimeout(doShift, this.dragThrottle);
    } else {
      doShift();
      this.dragTime = now;
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragItem) return;

    const item = this.dragItem;

    // Clean up listeners
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

    // Add positioning class, remove dragging
    item.classList.remove('binpack-dragging');
    item.classList.add('binpack-positioning');
    item.style.transition = '';

    // Animate to final position
    const finalX = this.dragItemRect.x;
    const finalY = this.dragItemRect.y;

    const onTransitionEnd = () => {
      item.removeEventListener('transitionend', onTransitionEnd);
      item.classList.remove('binpack-positioning');
      this.hidePlaceholder();
      this.emitDragItemPositioned(item, finalX, finalY);
    };
    item.addEventListener('transitionend', onTransitionEnd);

    // Move to final position (will animate because we removed transition: none)
    item.style.transform = `translate(${finalX}px, ${finalY}px)`;

    // Final layout
    this.dragItemCount = Math.max(0, this.dragItemCount - 1);
    this.unstamp(item);
    this.dragItem = null;

    // Sort items by visual position
    this.sortItemsByPosition();
    this.performLayout();

    // Safety: if no transition fires (same position), clean up after timeout
    setTimeout(() => {
      if (item.classList.contains('binpack-positioning')) {
        item.classList.remove('binpack-positioning');
        this.hidePlaceholder();
      }
    }, parseFloat(this.transitionDuration) * 1000 + 100);
  }

  private updateShiftTargets(): void {
    if (!this.dragItem) return;

    const gapPx = this.getGapPixels();
    const containerWidth = this.clientWidth;
    const containerHeight = this.clientHeight;
    const packWidth = this.horizontal ? 100000 : containerWidth + gapPx;
    const packHeight = this.horizontal ? containerHeight + gapPx : 100000;

    const shiftPacker = new Packer(packWidth, packHeight, this.horizontal);

    // Pack stamped elements (except the dragged item, which is stamped but should be excluded)
    for (const stamped of this.stampedElements) {
      if (stamped === this.dragItem) continue;
      const rect = stamped.getBoundingClientRect();
      const containerRect = this.getBoundingClientRect();
      const stampRect: Rect = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width + gapPx,
        height: rect.height + gapPx,
      };
      shiftPacker.placed(stampRect);
    }

    this.shiftTargetKeys = [];
    this.shiftTargets = [];

    const isHoriz = this.horizontal;
    const measure = isHoriz ? 'height' : 'width';
    const segment = isHoriz
      ? (this.rowHeight ? this.rowHeight + gapPx : 0)
      : (this.columnWidth ? this.columnWidth + gapPx : 0);

    const dropItemMeasure = isHoriz ? this.dragItemRect.height + gapPx : this.dragItemRect.width + gapPx;
    let boundsSize: number;

    if (segment) {
      const segmentSpan = Math.ceil(dropItemMeasure / segment);
      const segs = Math.floor((shiftPacker[measure] + gapPx) / segment);
      boundsSize = (segs - segmentSpan) * segment;
      for (let i = 0; i < segs; i++) {
        const ix = isHoriz ? 0 : i * segment;
        const iy = isHoriz ? i * segment : 0;
        this.addShiftTarget(ix, iy, boundsSize, isHoriz);
      }
    } else {
      boundsSize = (shiftPacker[measure] + gapPx) - dropItemMeasure;
      this.addShiftTarget(0, 0, boundsSize, isHoriz);
    }

    // Pack each non-dragged, non-stamped, non-hidden item and add targets at corners
    for (const item of this.items) {
      if (this.stampedElements.has(item)) continue;
      if (item === this.dragItem) continue;
      if (item.hasAttribute('hidden')) continue;

      const itemW = item.offsetWidth + gapPx;
      const itemH = item.offsetHeight + gapPx;
      const pos = shiftPacker.pack(itemW, itemH, this.columnWidth, this.rowHeight, gapPx);

      if (pos) {
        // Top-left corner
        this.addShiftTarget(pos.x, pos.y, boundsSize, isHoriz);
        // Bottom-left (vertical) or top-right (horizontal)
        const cx = isHoriz ? pos.x + itemW : pos.x;
        const cy = isHoriz ? pos.y : pos.y + itemH;
        this.addShiftTarget(cx, cy, boundsSize, isHoriz);

        if (segment) {
          const itemMeasure = isHoriz ? itemH : itemW;
          const segSpan = Math.round(itemMeasure / segment);
          for (let i = 1; i < segSpan; i++) {
            const sx = isHoriz ? cx : pos.x + segment * i;
            const sy = isHoriz ? pos.y + segment * i : cy;
            this.addShiftTarget(sx, sy, boundsSize, isHoriz);
          }
        }
      }
    }
  }

  private addShiftTarget(x: number, y: number, boundsSize: number, isHoriz: boolean): void {
    const check = isHoriz ? y : x;
    if (check !== 0 && check > boundsSize) return;
    const key = `${x},${y}`;
    if (this.shiftTargetKeys.includes(key)) return;
    this.shiftTargetKeys.push(key);
    this.shiftTargets.push({ x, y });
  }

  private shiftToNearest(x: number, y: number): void {
    let minDist = Infinity;
    let nearest = this.shiftTargets[0];
    for (const target of this.shiftTargets) {
      const dx = target.x - x;
      const dy = target.y - y;
      const dist = dx * dx + dy * dy; // skip sqrt, just compare
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }
    if (nearest) {
      this.dragItemRect.x = nearest.x;
      this.dragItemRect.y = nearest.y;
    }
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
    this.dropPlaceholder.style.transform = `translate(${this.dragItemRect.x}px, ${this.dragItemRect.y}px)`;
  }

  private hidePlaceholder(): void {
    if (!this.dropPlaceholder) return;
    this.dropPlaceholder.classList.remove('visible');
  }

  private sortItemsByPosition(): void {
    const getPos = (el: HTMLElement) => {
      const match = el.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (!match) return { x: 0, y: 0 };
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    };

    if (this.horizontal) {
      this.items.sort((a, b) => {
        const pa = getPos(a);
        const pb = getPos(b);
        return pa.x - pb.x || pa.y - pb.y;
      });
    } else {
      this.items.sort((a, b) => {
        const pa = getPos(a);
        const pb = getPos(b);
        return pa.y - pb.y || pa.x - pb.x;
      });
    }
  }
}
