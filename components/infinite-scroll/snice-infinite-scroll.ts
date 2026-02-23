import { element, property, render, styles, ready, dispose, html, css } from 'snice';
import type { InfiniteScrollDirection, SniceInfiniteScrollElement } from './snice-infinite-scroll.types';
import cssContent from './snice-infinite-scroll.css?inline';

@element('snice-infinite-scroll')
export class SniceInfiniteScroll extends HTMLElement implements SniceInfiniteScrollElement {
  @property({ type: Number })
  threshold = 200;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean, attribute: 'has-more' })
  hasMore = true;

  @property()
  direction: InfiniteScrollDirection = 'down';

  private _observer: IntersectionObserver | null = null;
  private _sentinel: HTMLElement | null = null;

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this._setupObserver();
  }

  private _setupObserver() {
    this._cleanupObserver();

    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && this.hasMore && !this.loading) {
            this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
          }
        }
      },
      {
        root: this,
        rootMargin: `${this.threshold}px`,
      }
    );

    this._sentinel = this.shadowRoot?.querySelector('.infinite-scroll__sentinel') ?? null;
    if (this._sentinel) {
      this._observer.observe(this._sentinel);
    }
  }

  private _cleanupObserver() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  @render()
  template() {
    const isDown = this.direction === 'down';

    const sentinel = html/*html*/`<div class="infinite-scroll__sentinel"></div>`;

    const loader = html/*html*/`
      <if ${this.loading}>
        <div class="infinite-scroll__loader">
          <div class="infinite-scroll__spinner"></div>
          <span>Loading...</span>
        </div>
      </if>
    `;

    if (isDown) {
      return html/*html*/`
        <slot></slot>
        ${loader}
        ${sentinel}
      `;
    }

    return html/*html*/`
      ${sentinel}
      ${loader}
      <slot></slot>
    `;
  }

  @dispose()
  teardown() {
    this._cleanupObserver();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-infinite-scroll': SniceInfiniteScroll;
  }
}
