/**
 * Row virtualization engine for snice-table.
 * Only renders visible rows + configurable buffer.
 * Uses spacer elements to maintain scroll height.
 */

export interface VirtualizerOptions {
  /** Row height in pixels, or a per-logical-row height resolver. */
  rowHeight: number | ((index: number) => number);
  /** Buffer size in pixels above and below viewport */
  bufferPx: number;
  /** Total number of rows in the dataset */
  totalRows: number;
  /** Container element that scrolls */
  scrollContainer: HTMLElement;
  /** Callback to render a range of rows */
  renderRange: (startIndex: number, endIndex: number) => DocumentFragment;
  /**
   * Optional: render pinned-top rows. These live OUTSIDE the windowed range
   * (before the top spacer) so they are always present regardless of scroll
   * position — the same guarantee the non-virtual path provides.
   */
  renderPinnedTop?: () => DocumentFragment;
  /** Optional: render pinned-bottom rows (after the bottom spacer). */
  renderPinnedBottom?: () => DocumentFragment;
  /** Called after the new window has been inserted into tbody. */
  afterRender?: () => void;
}

export class TableVirtualizer {
  private options: VirtualizerOptions;
  private topSpacer: HTMLElement;
  private bottomSpacer: HTMLElement;
  private contentContainer: HTMLElement;
  private scrollHandler: () => void;
  private rafId = 0;
  private lastStartIndex = -1;
  private lastEndIndex = -1;
  private enabled = false;
  private offsets: number[] = [];
  private offsetsTotalRows = -1;

  constructor() {
    this.topSpacer = document.createElement('tr');
    this.topSpacer.className = 'virtual-spacer virtual-spacer--top';
    this.topSpacer.style.display = 'table-row';

    this.bottomSpacer = document.createElement('tr');
    this.bottomSpacer.className = 'virtual-spacer virtual-spacer--bottom';
    this.bottomSpacer.style.display = 'table-row';

    this.contentContainer = document.createElement('tbody');
    this.options = {} as VirtualizerOptions;

    this.scrollHandler = () => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.update());
    };
  }

  attach(options: VirtualizerOptions) {
    this.options = options;
    this.enabled = true;
    this.lastStartIndex = -1;
    this.lastEndIndex = -1;
    this.invalidateOffsets();
    this.options.scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });
    this.update();
  }

  detach() {
    this.enabled = false;
    this.options.scrollContainer?.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.scrollHandler);
    cancelAnimationFrame(this.rafId);
  }

  setTotalRows(total: number) {
    this.options.totalRows = total;
    this.invalidateOffsets();
    this.lastStartIndex = -1; // Force re-render
    this.update();
  }

  /**
   * Force a full re-render of the visible range.
   */
  refresh() {
    this.invalidateOffsets();
    this.lastStartIndex = -1;
    this.lastEndIndex = -1;
    this.update();
  }

  /**
   * Calculate visible range and render if changed.
   */
  private update() {
    if (!this.enabled || !this.options.scrollContainer) return;

    const { bufferPx, totalRows, scrollContainer, renderRange } = this.options;
    const scrollTop = scrollContainer.scrollTop;
    const offsets = this.buildOffsets(totalRows);
    const minimumViewport = totalRows > 0 ? Math.max(1, offsets[1] - offsets[0]) : 1;
    // Layoutless DOMs report a zero-height viewport; treating one row as the
    // minimum keeps range math valid and mirrors the smallest useful browser
    // viewport.
    const viewportHeight = Math.max(minimumViewport, scrollContainer.clientHeight);

    const totalHeight = offsets[totalRows] || 0;

    // Filtering, pagination, or collapsing a group can shrink the flattened
    // model while the container is scrolled near the old end. Clamp before
    // deriving indices so startIndex never sits beyond totalRows and blanks the
    // body. Reflect the clamp to the element as well so its next scroll event
    // observes the same state.
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    const effectiveScrollTop = Math.min(Math.max(0, scrollTop), maxScrollTop);
    if (scrollTop !== effectiveScrollTop) scrollContainer.scrollTop = effectiveScrollTop;

    // Calculate visible range with buffer
    const startPx = Math.max(0, effectiveScrollTop - bufferPx);
    const endPx = Math.min(totalHeight, effectiveScrollTop + viewportHeight + bufferPx);

    const startIndex = this.findRowAtOffset(offsets, startPx);
    const endIndex = Math.min(totalRows, this.findFirstOffsetAtOrAfter(offsets, endPx));

    // Skip if range hasn't changed
    if (startIndex === this.lastStartIndex && endIndex === this.lastEndIndex) return;

    this.lastStartIndex = startIndex;
    this.lastEndIndex = endIndex;

    // Update spacers
    const topHeight = offsets[startIndex] || 0;
    const bottomHeight = Math.max(0, totalHeight - (offsets[endIndex] || totalHeight));

    this.topSpacer.style.height = `${topHeight}px`;
    this.bottomSpacer.style.height = `${bottomHeight}px`;

    // Render the visible range
    const fragment = renderRange(startIndex, endIndex);

    // Build the tbody content
    const tbody = this.options.scrollContainer.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
      // Pinned-top rows render outside (above) the windowed range so they are
      // always present. Rebuilt every window recompute since tbody is wiped.
      const pinnedTop = this.options.renderPinnedTop?.();
      if (pinnedTop) tbody.appendChild(pinnedTop);
      if (topHeight > 0) {
        const topTd = document.createElement('td');
        topTd.colSpan = 999;
        topTd.style.height = `${topHeight}px`;
        topTd.style.padding = '0';
        topTd.style.border = 'none';
        this.topSpacer.innerHTML = '';
        this.topSpacer.appendChild(topTd);
        tbody.appendChild(this.topSpacer);
      }
      tbody.appendChild(fragment);
      if (bottomHeight > 0) {
        const bottomTd = document.createElement('td');
        bottomTd.colSpan = 999;
        bottomTd.style.height = `${bottomHeight}px`;
        bottomTd.style.padding = '0';
        bottomTd.style.border = 'none';
        this.bottomSpacer.innerHTML = '';
        this.bottomSpacer.appendChild(bottomTd);
        tbody.appendChild(this.bottomSpacer);
      }
      // Pinned-bottom rows render outside (below) the windowed range.
      const pinnedBottom = this.options.renderPinnedBottom?.();
      if (pinnedBottom) tbody.appendChild(pinnedBottom);
      this.options.afterRender?.();
    }
  }

  /** Get the currently visible row index range */
  getVisibleRange(): { start: number; end: number } {
    return { start: this.lastStartIndex, end: this.lastEndIndex };
  }

  /** Scroll to bring a specific row into view */
  scrollToRow(index: number) {
    if (!this.options.scrollContainer) return;
    const top = this.offsetForIndex(index);
    this.options.scrollContainer.scrollTop = top;
  }

  /**
   * Scroll a logical row index into view AND synchronously render its range.
   * Unlike `scrollToRow`, this does not rely on a scroll event (a programmatic
   * scrollTop assignment does not fire one) — it forces the window recompute
   * immediately so the row is in the DOM by the time the caller focuses it.
   */
  scrollToIndex(index: number) {
    if (!this.options.scrollContainer) return;
    this.options.scrollContainer.scrollTop = this.offsetForIndex(index);
    this.refresh();
  }

  /** Get current scroll position */
  getScrollPosition(): { top: number; left: number } {
    const el = this.options.scrollContainer;
    return { top: el?.scrollTop ?? 0, left: el?.scrollLeft ?? 0 };
  }

  isEnabled() {
    return this.enabled;
  }

  private heightForIndex(index: number): number {
    const configured = typeof this.options.rowHeight === 'function'
      ? this.options.rowHeight(index)
      : this.options.rowHeight;
    return Number.isFinite(configured) && configured > 0 ? configured : 1;
  }

  private buildOffsets(totalRows: number): number[] {
    if (this.offsetsTotalRows === totalRows && this.offsets.length === totalRows + 1) {
      return this.offsets;
    }
    this.offsets = new Array(totalRows + 1);
    this.offsets[0] = 0;
    for (let index = 0; index < totalRows; index++) {
      this.offsets[index + 1] = this.offsets[index] + this.heightForIndex(index);
    }
    this.offsetsTotalRows = totalRows;
    return this.offsets;
  }

  private invalidateOffsets() {
    this.offsets = [];
    this.offsetsTotalRows = -1;
  }

  private offsetForIndex(index: number): number {
    const clamped = Math.max(0, Math.min(index, this.options.totalRows));
    return this.buildOffsets(this.options.totalRows)[clamped] || 0;
  }

  /** Index of the logical row containing the offset. */
  private findRowAtOffset(offsets: number[], offset: number): number {
    const totalRows = offsets.length - 1;
    if (totalRows <= 0) return 0;
    let low = 0;
    let high = totalRows;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (offsets[mid + 1] <= offset) low = mid + 1;
      else high = mid;
    }
    return Math.min(totalRows, low);
  }

  /** First prefix offset at or after the requested pixel. */
  private findFirstOffsetAtOrAfter(offsets: number[], offset: number): number {
    let low = 0;
    let high = offsets.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (offsets[mid] < offset) low = mid + 1;
      else high = mid;
    }
    return low;
  }
}
