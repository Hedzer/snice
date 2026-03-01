import { element, property, render, styles, ready, query, watch, html, css, unsafeHTML } from 'snice';
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
    return `<div>${JSON.stringify(item.data)}</div>`;
  };

  @query('.scroller')
  private scrollerElement!: HTMLElement;

  // Cached values to avoid repeated JSON.parse from attribute getter
  private _cachedItems: VirtualScrollerItem[] = [];
  private _cachedRenderItem: ((item: VirtualScrollerItem, index: number) => string | HTMLElement) | null = null;

  private visibleStart = 0;
  private visibleEnd = 0;
  private _scrollTop = 0;

  // Triggers re-render on scroll
  @property({ type: Number, attribute: false })
  private _scrollTick = 0;

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    // Cache initial values if already set
    if (!this._cachedRenderItem) {
      this._cachedRenderItem = this.renderItem;
    }
    this.updateVisibleRange();
  }

  @watch('items')
  onItemsChange(_old: any, newItems: VirtualScrollerItem[]) {
    this._cachedItems = newItems || [];
  }

  @watch('renderItem')
  onRenderItemChange(_old: any, newFn: any) {
    if (typeof newFn === 'function') {
      this._cachedRenderItem = newFn;
    }
  }

  scrollToIndex(index: number): void {
    if (index < 0 || index >= this._cachedItems.length) return;

    const offset = index * this.itemHeight;
    this._scrollTop = offset;
    this.scrollTop = offset;
    this._scrollTick++;
  }

  scrollToItem(id: string | number): void {
    const index = this._cachedItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.scrollToIndex(index);
    }
  }

  refresh(): void {
    this.updateVisibleRange();
    this._scrollTick++;
  }

  getVisibleRange(): { start: number; end: number } {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  private handleScroll = () => {
    this._scrollTop = this.scrollTop;
    this.updateVisibleRange();
    this._scrollTick++;
  };

  private updateVisibleRange() {
    const containerHeight = this.offsetHeight || 400;
    const scrollTop = this._scrollTop;

    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);

    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(this._cachedItems.length, start + visibleCount + this.bufferSize);
  }

  @render()
  template() {
    this.updateVisibleRange();

    const items = this._cachedItems;
    const renderFn = this._cachedRenderItem;
    const totalHeight = items.length * this.itemHeight;
    const visibleItems = items.slice(this.visibleStart, this.visibleEnd);

    return html/*html*/`
      <div part="base" class="scroller" @scroll=${this.handleScroll}>
        <div class="scroller__spacer" style="height: ${totalHeight}px;"></div>
        <div class="scroller__viewport" style="transform: translateY(${this.visibleStart * this.itemHeight}px);">
          ${visibleItems.map((item, idx) => {
            const actualIndex = this.visibleStart + idx;
            const itemContent = typeof renderFn === 'function'
              ? renderFn(item, actualIndex)
              : `<div>${JSON.stringify(item.data)}</div>`;

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

            return html/*html*/`
              <div
                class="scroller__item"
                style="top: ${idx * this.itemHeight}px; height: ${item.height || this.itemHeight}px;"
                data-index="${actualIndex}"></div>
            `;
          })}
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.addEventListener('scroll', this.handleScroll);
  }

  disconnectedCallback() {
    this.removeEventListener('scroll', this.handleScroll);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-virtual-scroller': SniceVirtualScroller;
  }
}
