import { element, property, query, watch, dispatch, ready, dispose, on, render, styles, html, css } from 'snice';
import cssContent from './snice-book.css?inline';
import type { SniceBookElement, BookMode, PageTurnDirection, PageTurnDetail, PageFlipStartDetail, PageFlipEndDetail } from './snice-book.types';

@element('snice-book')
export class SniceBook extends HTMLElement implements SniceBookElement {
  @property({ type: Number, attribute: 'current-page' })
  currentPage = 0;

  @property({ attribute: 'mode' })
  mode: BookMode = 'spread';

  @property({ attribute: 'cover-image' })
  coverImage = '';

  @property()
  title = '';

  @property()
  author = '';

  @property({ type: Number })
  private renderVersion = 0;

  @query('slot:not([name])')
  private defaultSlot?: HTMLSlotElement;

  private pages: Element[] = [];
  private flipping = false;
  private flippingIndex = -1;
  private flippingDirection: PageTurnDirection | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  get totalPages(): number {
    return this.pages.length;
  }

  private get spreadSize(): number {
    return this.mode === 'single' ? 1 : 2;
  }

  private get currentSpread(): number {
    return Math.floor(this.currentPage / this.spreadSize);
  }

  private get totalSpreads(): number {
    return Math.ceil(this.totalPages / this.spreadSize);
  }

  @ready()
  init() {
    this.collectPages();
    this.setAttribute('tabindex', '0');
    queueMicrotask(() => this.projectContent());
  }

  @dispose()
  cleanup() {}

  @on('slotchange', { target: 'slot:not([name])' })
  handleSlotChange() {
    this.collectPages();
    this.renderVersion++;
    queueMicrotask(() => this.projectContent());
  }

  @watch('currentPage')
  handlePageChange() {
    queueMicrotask(() => this.projectContent());
  }

  @watch('mode')
  handleModeChange() {
    this.renderVersion++;
    queueMicrotask(() => this.projectContent());
  }

  @watch('renderVersion')
  handleRenderVersionChange() {
    queueMicrotask(() => this.projectContent());
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        this.nextPage();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        this.prevPage();
        break;
      case 'Home':
        e.preventDefault();
        this.firstPage();
        break;
      case 'End':
        e.preventDefault();
        this.lastPage();
        break;
    }
  }

  @on('touchstart')
  handleTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  @on('touchend')
  handleTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    const deltaY = e.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      deltaX < 0 ? this.nextPage() : this.prevPage();
    }
  }

  private collectPages() {
    if (this.defaultSlot) {
      const assigned = this.defaultSlot.assignedElements();
      if (assigned.length > 0) {
        this.pages = assigned;
        return;
      }
    }
    this.pages = Array.from(this.children);
  }

  private canGoNext(): boolean {
    return this.currentPage + this.spreadSize < this.totalPages;
  }

  private canGoPrev(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Project slotted content into flip page face elements and left static page.
   */
  private projectContent() {
    if (!this.shadowRoot) return;
    const isSingle = this.mode === 'single';
    const currentSpread = this.currentSpread;
    const numSpreads = this.totalSpreads;

    // Project left static page content (spread mode only)
    if (!isSingle) {
      const leftContent = this.shadowRoot.querySelector('[data-left-content]');
      if (leftContent) {
        leftContent.innerHTML = '';
        const hasCover = !!(this.coverImage || this.title || this.author);
        const isAtCover = currentSpread === 0 && hasCover;
        if (!isAtCover && this.pages[this.currentPage]) {
          leftContent.appendChild(this.pages[this.currentPage].cloneNode(true));
        }
      }
    }

    // Project content into flip page front faces (nearby spreads only)
    const rangeStart = Math.max(0, currentSpread - 2);
    const rangeEnd = Math.min(numSpreads - 1, currentSpread + 2);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      const container = this.shadowRoot.querySelector(`[data-content="front-${i}"]`);
      if (container) {
        container.innerHTML = '';
        const contentIdx = isSingle ? i : (i * 2 + 1);
        if (this.pages[contentIdx]) {
          container.appendChild(this.pages[contentIdx].cloneNode(true));
        }
      }
    }
  }

  private flipToPage(targetPage: number, direction: PageTurnDirection) {
    if (this.flipping) return;
    if (targetPage < 0 || targetPage >= this.totalPages) return;
    if (targetPage === this.currentPage) return;

    this.flipping = true;
    const fromPage = this.currentPage;
    const targetSpread = Math.floor(targetPage / this.spreadSize);

    this.emitFlipStart({ fromPage, toPage: targetPage, direction });

    // Set flipping state to trigger animation class in template
    this.flippingIndex = direction === 'forward' ? this.currentSpread : targetSpread;
    this.flippingDirection = direction;
    this.renderVersion++;

    // Project content for target spread BEFORE animation reveals it
    requestAnimationFrame(() => {
      this.projectContentForSpread(targetSpread);
      // Also ensure current spread content is present
      this.projectContentForSpread(this.currentSpread);
    });

    // Get flip duration from CSS
    const durationStr = getComputedStyle(this).getPropertyValue('--book-flip-duration').trim() || '0.6s';
    const durationMs = parseFloat(durationStr) * (durationStr.includes('ms') ? 1 : 1000);

    // Update left page at animation midpoint
    if (this.mode !== 'single') {
      setTimeout(() => {
        const leftContent = this.shadowRoot?.querySelector('[data-left-content]');
        if (leftContent) {
          leftContent.innerHTML = '';
          if (this.pages[targetPage]) {
            leftContent.appendChild(this.pages[targetPage].cloneNode(true));
          }
        }
      }, durationMs * 0.45);
    }

    // Finalize after animation
    setTimeout(() => {
      this.flippingIndex = -1;
      this.flippingDirection = null;
      this.currentPage = targetPage;
      this.flipping = false;
      this.renderVersion++;
      this.emitPageTurn({ page: targetPage, direction });
      this.emitFlipEnd({ page: targetPage, direction });
    }, durationMs + 50);
  }

  /** Project content into a single spread's face container */
  private projectContentForSpread(spreadIdx: number) {
    if (!this.shadowRoot) return;
    const isSingle = this.mode === 'single';
    const container = this.shadowRoot.querySelector(`[data-content="front-${spreadIdx}"]`);
    if (container) {
      container.innerHTML = '';
      const contentIdx = isSingle ? spreadIdx : (spreadIdx * 2 + 1);
      if (this.pages[contentIdx]) {
        container.appendChild(this.pages[contentIdx].cloneNode(true));
      }
    }
  }

  // --- Public API ---

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    const target = this.mode === 'spread' ? page - (page % 2) : page;
    const direction: PageTurnDirection = target > this.currentPage ? 'forward' : 'backward';
    this.flipToPage(target, direction);
  }

  nextPage(): void {
    if (!this.canGoNext()) return;
    this.flipToPage(this.currentPage + this.spreadSize, 'forward');
  }

  prevPage(): void {
    if (!this.canGoPrev()) return;
    const target = Math.max(0, this.currentPage - this.spreadSize);
    this.flipToPage(target, 'backward');
  }

  firstPage(): void {
    if (this.currentPage === 0) return;
    this.flipToPage(0, 'backward');
  }

  lastPage(): void {
    const lastIndex = this.mode === 'spread'
      ? Math.max(0, this.totalPages - 2 + (this.totalPages % 2))
      : this.totalPages - 1;
    if (this.currentPage === lastIndex) return;
    this.flipToPage(lastIndex, 'forward');
  }

  // --- Events ---

  @dispatch('page-turn', { bubbles: true, composed: true })
  private emitPageTurn(detail?: PageTurnDetail): PageTurnDetail {
    return detail!;
  }

  @dispatch('page-flip-start', { bubbles: true, composed: true })
  private emitFlipStart(detail?: PageFlipStartDetail): PageFlipStartDetail {
    return detail!;
  }

  @dispatch('page-flip-end', { bubbles: true, composed: true })
  private emitFlipEnd(detail?: PageFlipEndDetail): PageFlipEndDetail {
    return detail!;
  }

  @render()
  renderContent() {
    const isSingle = this.mode === 'single';
    const notSingle = !isSingle;
    const canPrev = this.canGoPrev();
    const canNext = this.canGoNext();
    const total = this.totalPages;
    const displayPage = this.currentPage + 1;
    const _v = this.renderVersion;

    const hasCover = !!(this.coverImage || this.title || this.author);
    const isAtCover = this.currentSpread === 0 && hasCover;
    const notAtCover = !isAtCover;
    const hasCoverImage = !!this.coverImage;
    const hasTitle = !!this.title;
    const hasAuthor = !!this.author;
    const hasPages = total > 0;

    const navInfo = isSingle
      ? `${displayPage} / ${total}`
      : `${displayPage}-${Math.min(this.currentPage + 2, total)} / ${total}`;

    const prevDisabled = canPrev ? '' : 'book__click-disabled';
    const nextDisabled = canNext ? '' : 'book__click-disabled';
    const showRightPageNum = this.currentPage + 1 < total;

    // Pre-build flip page templates to avoid nested .map() issue
    const flipPages: any[] = [];
    const numSpreads = this.totalSpreads;
    const currentSpread = this.currentSpread;

    for (let i = 0; i < numSpreads; i++) {
      const isFlipped = i < currentSpread;
      const isFlippingFwd = i === this.flippingIndex && this.flippingDirection === 'forward';
      const isFlippingBwd = i === this.flippingIndex && this.flippingDirection === 'backward';

      let pageClass = 'book__page';
      if (isFlippingFwd) {
        pageClass += ' book__page--flipping-forward';
      } else if (isFlippingBwd) {
        pageClass += ' book__page--flipping-backward';
      } else if (isFlipped) {
        pageClass += ' book__page--flipped';
      }

      // Z-index: flipping page highest, flipped ascending, unflipped descending
      let zIdx: number;
      if (isFlippingFwd || isFlippingBwd) {
        zIdx = numSpreads + 1;
      } else if (isFlipped) {
        zIdx = i + 1;
      } else {
        zIdx = numSpreads - i;
      }

      const rightPageNum = isSingle ? (i + 1) : (i * 2 + 2);

      flipPages.push(html/*html*/`
        <div class="${pageClass}" style="z-index: ${zIdx}" data-page-index="${i}">
          <div class="book__face book__face--front">
            <div class="book__face-content" data-content="front-${i}"></div>
            <span class="book__page-number book__page-number--right">${rightPageNum}</span>
          </div>
          <div class="book__face book__face--back"></div>
        </div>
      `);
    }

    return html/*html*/`
      <div class="book" role="document" aria-label="${this.title || 'Book'}" aria-roledescription="book">
        <div class="book__body">
          <if ${notSingle}>
            <div class="book__left">
              <div class="book__left-content">
                <if ${isAtCover}>
                  <div class="book__cover">
                    <if ${hasCoverImage}>
                      <img class="book__cover-image" src="${this.coverImage}" alt="${this.title || 'Book cover'}" />
                    </if>
                    <if ${hasTitle}>
                      <h2 class="book__cover-title">${this.title}</h2>
                    </if>
                    <if ${hasAuthor}>
                      <p class="book__cover-author">${this.author}</p>
                    </if>
                  </div>
                </if>
                <if ${notAtCover}>
                  <div data-left-content></div>
                </if>
              </div>
              <if ${notAtCover}>
                <span class="book__page-number book__page-number--left">${displayPage}</span>
              </if>
              <div class="book__left-click ${prevDisabled}"
                   @click=${() => this.prevPage()}
                   role="button"
                   aria-label="Previous page"></div>
            </div>
            <div class="book__spine" part="spine"></div>
          </if>

          <div class="book__flip-area">
            <if ${hasPages}>
              ${flipPages}
            </if>
            <div class="book__click-prev ${prevDisabled}"
                 @click=${() => this.prevPage()}
                 role="button"
                 aria-label="Previous page"></div>
            <div class="book__click-next ${nextDisabled}"
                 @click=${() => this.nextPage()}
                 role="button"
                 aria-label="Next page"></div>
          </div>
        </div>

        <div class="book__nav" part="nav">
          <button class="book__nav-button"
                  @click=${() => this.firstPage()}
                  ?disabled=${!canPrev}
                  aria-label="First page">
            <span>&#x21E4;</span>
          </button>
          <button class="book__nav-button"
                  @click=${() => this.prevPage()}
                  ?disabled=${!canPrev}
                  aria-label="Previous page">
            <span>&#x2039;</span>
          </button>
          <span class="book__nav-info">${navInfo}</span>
          <button class="book__nav-button"
                  @click=${() => this.nextPage()}
                  ?disabled=${!canNext}
                  aria-label="Next page">
            <span>&#x203A;</span>
          </button>
          <button class="book__nav-button"
                  @click=${() => this.lastPage()}
                  ?disabled=${!canNext}
                  aria-label="Last page">
            <span>&#x21E5;</span>
          </button>
        </div>

        <div hidden>
          <slot></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
