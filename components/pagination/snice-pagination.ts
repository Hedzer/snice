import { element, property, on, dispatch, watch, ready, render, styles, html, css } from 'snice';

@element('snice-pagination')
export class SnicePagination extends HTMLElement {
  @property({ type: Number,  })
  current = 1;
  
  @property({ type: Number,  }) 
  total = 1;
  
  @property({ type: Number,  })
  siblings = 1;
  
  @property({ type: Boolean,  })
  showFirst = true;
  
  @property({ type: Boolean,  })
  showLast = true;
  
  @property({ type: Boolean,  })
  showPrev = true;
  
  @property({ type: Boolean,  })
  showNext = true;
  
  @property({  })
  size: 'small' | 'medium' | 'large' = 'medium';
  
  @property({  })
  variant: 'default' | 'rounded' | 'text' = 'default';

  @render()
  render() {
    const pages = this.getPageNumbers();

    return html/*html*/`
      <nav class="pagination" aria-label="Pagination">
        <if ${this.showFirst}>
          <button
            class="pagination-button pagination-first"
            ?disabled="${this.current === 1}"
            aria-label="First page">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M11 12L7 8L11 4M5 4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </if>

        <if ${this.showPrev}>
          <button
            class="pagination-button pagination-prev"
            ?disabled="${this.current === 1}"
            aria-label="Previous page">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </if>

        <div class="pagination-pages">
          ${pages.map(page => {
            const pageClasses = ['pagination-button', 'pagination-page', page === this.current ? 'active' : ''].filter(Boolean).join(' ');
            return html/*html*/`
            <if ${page === '...'}>
              <span class="pagination-ellipsis">...</span>
            </if>
            <if ${page !== '...'}>
              <button
                class="${pageClasses}"
                data-page="${page}"
                aria-label="Page ${page}"
                aria-current="${page === this.current ? 'page' : ''}">
                ${page}
              </button>
            </if>
          `})}
        </div>

        <if ${this.showNext}>
          <button
            class="pagination-button pagination-next"
            ?disabled="${this.current === this.total}"
            aria-label="Next page">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </if>

        <if ${this.showLast}>
          <button
            class="pagination-button pagination-last"
            ?disabled="${this.current === this.total}"
            aria-label="Last page">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M5 12L9 8L5 4M11 4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </if>
      </nav>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`
      :host {
        display: inline-block;
        --pagination-gap: 4px;
        --pagination-button-size: 32px;
        --pagination-button-padding: 8px;
        --pagination-font-size: 14px;
        --pagination-border-radius: 4px;
      }

      :host([size="small"]) {
        --pagination-button-size: 28px;
        --pagination-button-padding: 6px;
        --pagination-font-size: 12px;
      }

      :host([size="large"]) {
        --pagination-button-size: 40px;
        --pagination-button-padding: 10px;
        --pagination-font-size: 16px;
      }

      :host([variant="rounded"]) {
        --pagination-border-radius: 50%;
      }

      .pagination {
        display: flex;
        align-items: center;
        gap: var(--pagination-gap);
      }

      .pagination-pages {
        display: flex;
        align-items: center;
        gap: var(--pagination-gap);
      }

      .pagination-button {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: var(--pagination-button-size);
        height: var(--pagination-button-size);
        padding: 0 var(--pagination-button-padding);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: var(--pagination-border-radius);
        color: #374151;
        font-size: var(--pagination-font-size);
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }

      :host([variant="text"]) .pagination-button {
        background: transparent;
        border: none;
      }

      .pagination-button:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      :host([variant="text"]) .pagination-button:hover:not(:disabled) {
        background: #f3f4f6;
      }

      .pagination-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-button.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }

      .pagination-button.active:hover {
        background: #2563eb;
        border-color: #2563eb;
      }

      .pagination-ellipsis {
        padding: 0 8px;
        color: #6b7280;
        font-size: var(--pagination-font-size);
      }

      svg {
        width: 16px;
        height: 16px;
      }
    `;
  }
  
  private getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalNumbers = this.siblings * 2 + 3;
    const totalBlocks = totalNumbers + 2;
    
    if (this.total <= totalBlocks) {
      // Show all pages
      for (let i = 1; i <= this.total; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(2, this.current - this.siblings);
      const endPage = Math.min(this.total - 1, this.current + this.siblings);
      
      // Always show first page
      pages.push(1);
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < this.total - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(this.total);
    }
    
    return pages;
  }
  
  @on('click')
  handleFirst(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pagination-first')) return;
    if (this.current !== 1) {
      this.changePage(1);
    }
  }

  @on('click')
  handlePrev(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pagination-prev')) return;
    if (this.current > 1) {
      this.changePage(this.current - 1);
    }
  }

  @on('click')
  handleNext(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pagination-next')) return;
    if (this.current < this.total) {
      this.changePage(this.current + 1);
    }
  }

  @on('click')
  handleLast(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.pagination-last')) return;
    if (this.current !== this.total) {
      this.changePage(this.total);
    }
  }

  @on('click')
  handlePageClick(event: Event) {
    const target = event.target as HTMLElement;
    const button = target.closest('.pagination-page') as HTMLButtonElement;
    if (!button) return;
    const pageAttr = button.getAttribute('data-page');
    if (pageAttr) {
      const page = parseInt(pageAttr);
      if (page !== this.current) {
        this.changePage(page);
      }
    }
  }
  
  @dispatch('pagination-change', { bubbles: true, composed: true })
  private changePage(page: number) {
    const oldPage = this.current;
    this.current = page;
    return {
      page: this.current,
      previousPage: oldPage
    };
  }
  
  // Public API
  goToPage(page: number) {
    if (page >= 1 && page <= this.total && page !== this.current) {
      this.changePage(page);
    }
  }
  
  nextPage() {
    if (this.current < this.total) {
      this.changePage(this.current + 1);
    }
  }
  
  previousPage() {
    if (this.current > 1) {
      this.changePage(this.current - 1);
    }
  }
  
  firstPage() {
    if (this.current !== 1) {
      this.changePage(1);
    }
  }
  
  lastPage() {
    if (this.current !== this.total) {
      this.changePage(this.total);
    }
  }
}