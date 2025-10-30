import { element, property, render, styles, request, ready, dispose, on, html, css } from 'snice';
import cssContent from './snice-list.css?inline';
import '../skeleton/snice-skeleton.ts';

@element('snice-list')
export class SniceList extends HTMLElement {
  @property({ type: Boolean })
  dividers = false;

  @property({ type: Boolean })
  searchable = false;

  @property()
  search = '';

  @property({ type: Boolean })
  infinite = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  noResults = false;

  @property({ type: Number })
  threshold = 0.5;

  @property({ type: Number })
  skeletonCount = 5;

  private searchTimeout?: number;
  private page = 0;
  private intersectionObserver?: IntersectionObserver;

  @ready()
  init() {
    // Listen for controller attached event
    this.addEventListener('@snice/controller-attached', (() => {
      // Controller is now attached and ready
    }) as EventListener);

    if (this.infinite) {
      // Wait for render to complete before setting up infinite scroll
      requestAnimationFrame(() => {
        this.setupInfiniteScroll();
      });
    }
  }

  @dispose()
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupInfiniteScroll() {
    const sentinel = this.shadowRoot?.querySelector('.list__sentinel');
    if (!sentinel) return;

    const scrollParent = this.getScrollParent();

    // Use IntersectionObserver to detect when sentinel comes into view
    try {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.loading) {
              this.loadMore();
            }
          });
        },
        {
          root: scrollParent,
          rootMargin: '100px',
          threshold: 0.01
        }
      );

      this.intersectionObserver.observe(sentinel);
    } catch (e) {
      // IntersectionObserver not available in test environment
      return;
    }

    // Also listen for wheel events when at bottom
    if (scrollParent) {
      scrollParent.addEventListener('wheel', (e: WheelEvent) => {
        if (this.loading) return;
        if (e.deltaY <= 0) return; // Not scrolling down

        // Check after a small delay to ensure scroll has settled
        requestAnimationFrame(() => {
          const scrollTop = scrollParent.scrollTop;
          const scrollHeight = scrollParent.scrollHeight;
          const clientHeight = scrollParent.clientHeight;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

          // If within 50px of bottom and scrolling down, load more
          if (distanceFromBottom < 50 && !this.loading) {
            this.loadMore();
          }
        });
      }, { passive: true });
    }
  }

  @on('input', { target: '.list__search-input' })
  handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.search = value;

    clearTimeout(this.searchTimeout);
    this.searchTimeout = window.setTimeout(() => {
      this.performSearch(value);
    }, 300);
  }

  @request('@snice/list/search')
  async *performSearch(query: string): any {
    this.loading = true;

    try {
      const params = { query, list: this };
      const response = await (yield params);
      this.loading = false;
      return response;
    } catch (error) {
      console.error('Error searching list:', error);
      this.loading = false;
    }
  }

  @request('@snice/list/load-more')
  async *loadMore(): any {
    if (this.loading) return;

    this.loading = true;

    try {
      const params = { page: ++this.page, list: this };
      const response = await (yield params);
      this.loading = false;

      // Auto-fill viewport on initial load
      requestAnimationFrame(() => {
        const scrollParent = this.getScrollParent();
        if (scrollParent) {
          const hasScroll = scrollParent.scrollHeight > scrollParent.clientHeight;
          const scrollTop = scrollParent.scrollTop;

          // Only auto-load if: no scrollbar yet AND user hasn't scrolled
          if (!hasScroll && scrollTop === 0) {
            const sentinel = this.shadowRoot?.querySelector('.list__sentinel');
            if (sentinel) {
              const rect = sentinel.getBoundingClientRect();
              const parentRect = scrollParent.getBoundingClientRect();
              if (rect.top < parentRect.bottom && !this.loading) {
                this.loadMore();
              }
            }
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Error loading more items:', error);
      this.loading = false;
    }
  }

  private getScrollParent(): HTMLElement | null {
    let scrollParent: HTMLElement | null = this.parentElement;
    while (scrollParent) {
      const overflow = window.getComputedStyle(scrollParent).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        return scrollParent;
      }
      scrollParent = scrollParent.parentElement;
    }
    return null;
  }

  @render()
  render() {
    // Create skeleton elements
    const skeletons = [];
    for (let i = 0; i < this.skeletonCount; i++) {
      skeletons.push(html`<snice-skeleton height="60px" style="margin: 0.5rem 1rem;"></snice-skeleton>`);
    }

    return html/*html*/`
      <div class="list" part="container" role="list">
        <if ${this.searchable}>
          <div class="list__search" part="search">
            <input
              type="text"
              class="list__search-input"
              placeholder="Search..."
              .value="${this.search}"
            />
          </div>
        </if>
        <slot name="before"></slot>
        <if ${!this.noResults}>
          <slot></slot>
        </if>
        <if ${this.noResults}>
          <slot name="no-results">
            <div class="list__no-results" part="no-results">
              <div class="list__no-results-icon">🔍</div>
              <div class="list__no-results-title">No results found</div>
              <div class="list__no-results-message">Try searching for something else</div>
            </div>
          </slot>
        </if>
        <if ${this.loading}>
          <div class="list__loading" part="loading">
            <slot name="loading">
              ${skeletons}
            </slot>
          </div>
        </if>
        <slot name="after"></slot>
        <div class="list__sentinel" part="sentinel"></div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}
