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

  scrollToIndex(index: number): void {
    if (index < 0 || index >= this.cachedItems.length) return;

    const offset = index * this.itemHeight;
    this.cachedScrollTop = offset;
    if (this.scrollerElement) {
      this.scrollerElement.scrollTop = offset;
    }
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
    if (this.scrollerElement) {
      this.cachedScrollTop = this.scrollerElement.scrollTop;
      this.updateVisibleRange();
      this.scrollTick++;
    }
  };

  @on('keydown', '.scroller')
  handleKeyDown(e: KeyboardEvent) {
    const scroller = this.scrollerElement;
    if (!scroller) return;
    const containerHeight = scroller.clientHeight || 400;
    const totalHeight = this.cachedItems.length * this.itemHeight;
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

    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);

    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(this.cachedItems.length, start + visibleCount + this.bufferSize);
  }

  @render()
  template() {
    this.updateVisibleRange();

    const items = this.cachedItems;
    const renderFn = this.cachedRenderItem;
    const totalHeight = items.length * this.itemHeight;
    const visibleItems = items.slice(this.visibleStart, this.visibleEnd);

    return html/*html*/`
      <div part="base" class="scroller" tabindex="0" @scroll=${this.handleScroll}>
        <div class="scroller__spacer" style="height: ${totalHeight}px;"></div>
        <div class="scroller__viewport" style="transform: translateY(${this.visibleStart * this.itemHeight}px);">
          ${visibleItems.map((item, idx) => {
            const actualIndex = this.visibleStart + idx;
            const itemContent = typeof renderFn === 'function'
              ? renderFn(item, actualIndex)
              : this.renderItem(item, actualIndex);

            if (typeof itemContent === 'string') {
              return html/*html*/`
                <div
                  class="scroller__item"
                  style="top: ${idx * this.itemHeight}px; height: ${item.height || this.itemHeight}px;"
                  data-index="${actualIndex}">
                  ${unsafeHTML(itemContent)}
                </div>
              `;
            }

            // HTMLElement return — render it as an actual child.
            return html/*html*/`
              <div
                class="scroller__item"
                style="top: ${idx * this.itemHeight}px; height: ${item.height || this.itemHeight}px;"
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
