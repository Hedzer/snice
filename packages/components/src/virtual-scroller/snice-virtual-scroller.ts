import { element, property, render, styles, ready, query, watch, html, css, unsafeHTML, on } from 'snice';
import type { SniceVirtualScrollerElement, VirtualScrollerItem } from './snice-virtual-scroller.types';
import cssContent from './snice-virtual-scroller.css?inline';

@element('snice-virtual-scroller')
export class SniceVirtualScroller extends HTMLElement implements SniceVirtualScrollerElement {
  @property({ type: Array, attribute: false })
  items: VirtualScrollerItem[] = [];

  @property({ type: Number, attribute: 'item-height' })
  itemHeight = 50;

  @property({ type: Number, attribute: 'buffer-size' })
  bufferSize = 5;

  @property({ type: Number, attribute: 'estimated-item-height' })
  estimatedItemHeight = 50;

  @property({ attribute: false })
  renderItem: (item: VirtualScrollerItem, index: number) => string | HTMLElement = (item, index) => {
    // Default renderer escapes data so it cannot inject markup. Callers that
    // need HTML should provide their own renderItem and escape appropriately.
    const el = document.createElement('div');
    el.textContent = typeof item.data === 'string' ? item.data : JSON.stringify(item.data);
    return el;
  };

  @query('.scroller')
  private scrollerElement!: HTMLElement;

  // Cached values to avoid repeated JSON.parse from attribute getter
  private cachedItems: VirtualScrollerItem[] = [];
  private cachedRenderItem: ((item: VirtualScrollerItem, index: number) => string | HTMLElement) | null = null;

  private visibleStart = 0;
  private visibleEnd = 0;
  private cachedScrollTop = 0;

  // Triggers re-render on scroll
  @property({ type: Number, attribute: false })
  private scrollTick = 0;

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    // Cache initial values if already set
    if (!this.cachedRenderItem) {
      this.cachedRenderItem = this.renderItem;
    }
    // The scroll port is :host (`overflow: auto` in the stylesheet); `scroll`
    // does not bubble, so a binding on the shadow `.scroller` alone never
    // hears a user scroll of the host.
    this.addEventListener('scroll', this.handleScroll);
    this.updateVisibleRange();
  }

  @watch('items')
  onItemsChange(old: any, newItems: VirtualScrollerItem[]) {
    this.cachedItems = newItems || [];
  }

  @watch('renderItem')
  onRenderItemChange(old: any, newFn: any) {
    if (typeof newFn === 'function') {
      this.cachedRenderItem = newFn;
    }
  }

  /** The documented per-item height: `item.height` when given, else itemHeight. */
  private itemHeightOf(item: VirtualScrollerItem): number {
    return item.height || this.itemHeight;
  }

  /** Distance from the top of the list to item `index` (prefix sum). */
  private offsetOf(index: number): number {
    let offset = 0;
    for (let i = 0; i < index && i < this.cachedItems.length; i++) {
      offset += this.itemHeightOf(this.cachedItems[i]);
    }
    return offset;
  }

  private totalContentHeight(): number {
    return this.offsetOf(this.cachedItems.length);
  }

  scrollToIndex(index: number): void {
    if (index < 0 || index >= this.cachedItems.length) return;

    const offset = this.offsetOf(index);
    this.cachedScrollTop = offset;
    if (this.scrollerElement) {
      this.scrollerElement.scrollTop = offset;
    }
    // `.scroller` has no overflow of its own, so assigning its scrollTop is a
    // no-op — the host is the element the browser actually scrolls.
    this.scrollTop = offset;
    this.scrollTick++;
  }

  scrollToItem(id: string | number): void {
    const index = this.cachedItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.scrollToIndex(index);
    }
  }

  refresh(): void {
    this.updateVisibleRange();
    this.scrollTick++;
  }

  getVisibleRange(): { start: number; end: number } {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  private handleScroll = () => {
    // Read the port that actually moved: the host by default, or the inner
    // `.scroller` when a consumer has styled it to overflow instead.
    this.cachedScrollTop = this.scrollTop || (this.scrollerElement ? this.scrollerElement.scrollTop : 0);
    this.updateVisibleRange();
    this.scrollTick++;
  };

  @on('keydown', '.scroller')
  handleKeyDown(e: KeyboardEvent) {
    const scroller = this.scrollerElement;
    if (!scroller) return;
    const containerHeight = scroller.clientHeight || 400;
    const totalHeight = this.totalContentHeight();
    let next: number | null = null;
    if (e.key === 'PageDown') {
      next = Math.min(totalHeight, scroller.scrollTop + containerHeight);
    } else if (e.key === 'PageUp') {
      next = Math.max(0, scroller.scrollTop - containerHeight);
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = totalHeight;
    } else if (e.key === 'ArrowDown') {
      next = scroller.scrollTop + this.itemHeight;
    } else if (e.key === 'ArrowUp') {
      next = Math.max(0, scroller.scrollTop - this.itemHeight);
    }
    if (next !== null) {
      e.preventDefault();
      scroller.scrollTop = next;
    }
  }

  private updateVisibleRange() {
    const containerHeight = this.offsetHeight || 400;
    const scrollTop = this.cachedScrollTop;
    const items = this.cachedItems;

    // The first row whose bottom edge passes the top of the port.
    let start = 0;
    let top = 0;
    for (; start < items.length; start++) {
      const bottom = top + this.itemHeightOf(items[start]);
      if (bottom > scrollTop) break;
      top = bottom;
    }

    // Rows through the bottom of the port.
    let end = start;
    let covered = top;
    while (end < items.length && covered < scrollTop + containerHeight) {
      covered += this.itemHeightOf(items[end]);
      end++;
    }

    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(items.length, end + this.bufferSize);
  }

  @render()
  template() {
    this.updateVisibleRange();

    const items = this.cachedItems;
    const renderFn = this.cachedRenderItem;
    const totalHeight = this.totalContentHeight();
    const windowOffset = this.offsetOf(this.visibleStart);
    const visibleItems = items.slice(this.visibleStart, this.visibleEnd);

    return html/*html*/`
      <div part="base" class="scroller" tabindex="0" @scroll=${this.handleScroll}>
        <div class="scroller__spacer" style="height: ${totalHeight}px;"></div>
        <div class="scroller__viewport" style="transform: translateY(${windowOffset}px);">
          ${visibleItems.map((item, idx) => {
            const actualIndex = this.visibleStart + idx;
            const itemTop = this.offsetOf(actualIndex) - windowOffset;
            const itemContent = typeof renderFn === 'function'
              ? renderFn(item, actualIndex)
              : this.renderItem(item, actualIndex);

            if (typeof itemContent === 'string') {
              return html/*html*/`
                <div
                  class="scroller__item"
                  style="top: ${itemTop}px; height: ${this.itemHeightOf(item)}px;"
                  data-index="${actualIndex}">
                  ${unsafeHTML(itemContent)}
                </div>
              `;
            }

            // HTMLElement return — render it as an actual child.
            return html/*html*/`
              <div
                class="scroller__item"
                style="top: ${itemTop}px; height: ${this.itemHeightOf(item)}px;"
                data-index="${actualIndex}">${itemContent as any}</div>
            `;
          })}
        </div>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'snice-virtual-scroller': SniceVirtualScroller;
  }
}
