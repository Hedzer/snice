import { element, property, render, styles, ready, query, html, css } from 'snice';
import type { SniceVirtualScrollerElement, VirtualScrollerItem } from './snice-virtual-scroller.types';
import cssContent from './snice-virtual-scroller.css?inline';

@element('snice-virtual-scroller')
export class SniceVirtualScroller extends HTMLElement implements SniceVirtualScrollerElement {
  @property({ type: Array })
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

  private visibleStart = 0;
  private visibleEnd = 0;
  private _scrollTop = 0;

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.updateVisibleRange();
  }

  scrollToIndex(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    const offset = index * this.itemHeight;
    this._scrollTop = offset;

    if (this.scrollerElement) {
      this._scrollTop = offset;
    }
  }

  scrollToItem(id: string | number): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.scrollToIndex(index);
    }
  }

  refresh(): void {
    this.updateVisibleRange();
  }

  getVisibleRange(): { start: number; end: number } {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  private handleScroll = () => {
    this.scrollTop = this.scrollTop;
    this.updateVisibleRange();
  };

  private updateVisibleRange() {
    const containerHeight = this.offsetHeight || 400;
    const scrollTop = this._scrollTop;

    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);

    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(this.items.length, start + visibleCount + this.bufferSize);
  }

  @render()
  template() {
    this.updateVisibleRange();

    const totalHeight = this.items.length * this.itemHeight;
    const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);

    return html/*html*/`
      <div class="scroller" @scroll=${this.handleScroll}>
        <div class="scroller__spacer" style="height: ${totalHeight}px;"></div>
        <div class="scroller__viewport" style="transform: translateY(${this.visibleStart * this.itemHeight}px);">
          ${visibleItems.map((item, idx) => {
            const actualIndex = this.visibleStart + idx;
            const itemContent = typeof this.renderItem === 'function'
              ? this.renderItem(item, actualIndex)
              : `<div>${JSON.stringify(item.data)}</div>`;
            const top = 0;

            if (typeof itemContent === 'string') {
              return html/*html*/`
                <div
                  class="scroller__item"
                  style="top: ${idx * this.itemHeight}px; height: ${item.height || this.itemHeight}px;"
                  data-index="${actualIndex}">
                  ${itemContent}
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
