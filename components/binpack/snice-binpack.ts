import { element, property, query, watch, dispatch, ready, dispose, render, styles } from 'snice';
import { html, css } from 'snice';
import cssContent from './snice-binpack.css?inline';
import type { SniceBinpackElement, BinpackLayoutCompleteDetail, BinpackFitCompleteDetail, Rect } from './snice-binpack.types';

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

  @query('.binpack') private container?: HTMLElement;
  @query('slot') private slotElement?: HTMLSlotElement;

  private items: HTMLElement[] = [];
  private stampedElements = new Set<HTMLElement>();
  private resizeObserver: ResizeObserver | null = null;
  private itemResizeObserver: ResizeObserver | null = null;
  private layoutScheduled = false;

  @ready()
  onReady() {
    this.collectItems();
    this.setupResizeObserver();
    this.layout();
    setTimeout(() => this.setAttribute('ready', ''), 10);
  }

  @dispose()
  onDispose() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.itemResizeObserver?.disconnect();
    this.itemResizeObserver = null;
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

  // -- Events ---------------------------------------------------------------

  @dispatch('binpack-layout-complete', { bubbles: true, composed: true })
  private emitLayoutComplete(): BinpackLayoutCompleteDetail {
    return { items: [...this.items] };
  }

  @dispatch('binpack-fit-complete', { bubbles: true, composed: true })
  private emitFitComplete(item: HTMLElement, x: number, y: number): BinpackFitCompleteDetail {
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

  // -- Template & Styles ----------------------------------------------------

  @render()
  template() {
    return html`
      <div class="binpack" part="base" role="list">
        <slot @slotchange="${() => this.handleSlotChange()}"></slot>
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
      const rect = stamped.getBoundingClientRect();
      const containerRect = this.getBoundingClientRect();
      const stampRect: Rect = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width + gapPx,
        height: rect.height + gapPx,
      };
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
}
