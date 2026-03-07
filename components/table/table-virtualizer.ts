/**
 * Row virtualization engine for snice-table.
 * Only renders visible rows + configurable buffer.
 * Uses spacer elements to maintain scroll height.
 */

export interface VirtualizerOptions {
  /** Fixed row height in pixels. Required for virtualization. */
  rowHeight: number;
  /** Buffer size in pixels above and below viewport */
  bufferPx: number;
  /** Total number of rows in the dataset */
  totalRows: number;
  /** Container element that scrolls */
  scrollContainer: HTMLElement;
  /** Callback to render a range of rows */
  renderRange: (startIndex: number, endIndex: number) => DocumentFragment;
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
    this.lastStartIndex = -1; // Force re-render
    this.update();
  }

  /**
   * Force a full re-render of the visible range.
   */
  refresh() {
    this.lastStartIndex = -1;
    this.lastEndIndex = -1;
    this.update();
  }

  /**
   * Calculate visible range and render if changed.
   */
  private update() {
    if (!this.enabled || !this.options.scrollContainer) return;

    const { rowHeight, bufferPx, totalRows, scrollContainer, renderRange } = this.options;
    const scrollTop = scrollContainer.scrollTop;
    const viewportHeight = scrollContainer.clientHeight;

    const totalHeight = totalRows * rowHeight;

    // Calculate visible range with buffer
    const startPx = Math.max(0, scrollTop - bufferPx);
    const endPx = Math.min(totalHeight, scrollTop + viewportHeight + bufferPx);

    const startIndex = Math.floor(startPx / rowHeight);
    const endIndex = Math.min(totalRows, Math.ceil(endPx / rowHeight));

    // Skip if range hasn't changed
    if (startIndex === this.lastStartIndex && endIndex === this.lastEndIndex) return;

    this.lastStartIndex = startIndex;
    this.lastEndIndex = endIndex;

    // Update spacers
    const topHeight = startIndex * rowHeight;
    const bottomHeight = Math.max(0, (totalRows - endIndex) * rowHeight);

    this.topSpacer.style.height = `${topHeight}px`;
    this.bottomSpacer.style.height = `${bottomHeight}px`;

    // Render the visible range
    const fragment = renderRange(startIndex, endIndex);

    // Build the tbody content
    const tbody = this.options.scrollContainer.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
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
    }
  }

  /** Get the currently visible row index range */
  getVisibleRange(): { start: number; end: number } {
    return { start: this.lastStartIndex, end: this.lastEndIndex };
  }

  /** Scroll to bring a specific row into view */
  scrollToRow(index: number) {
    if (!this.options.scrollContainer) return;
    const top = index * this.options.rowHeight;
    this.options.scrollContainer.scrollTop = top;
  }

  /** Get current scroll position */
  getScrollPosition(): { top: number; left: number } {
    const el = this.options.scrollContainer;
    return { top: el?.scrollTop ?? 0, left: el?.scrollLeft ?? 0 };
  }

  isEnabled() {
    return this.enabled;
  }
}
