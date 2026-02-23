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

  @query('slot:not([name])')
  private defaultSlot?: HTMLSlotElement;

  @query('.book__flip-pages')
  private flipPagesEl?: HTMLElement;

  @query('.book__left-content')
  private leftContentEl?: HTMLElement;

  @query('.book__page-number--left')
  private leftPageNumEl?: HTMLElement;

  @query('.book__nav-info')
  private navInfoEl?: HTMLElement;

  @query('.book__nav-first')
  private navFirstBtn?: HTMLButtonElement;

  @query('.book__nav-prev')
  private navPrevBtn?: HTMLButtonElement;

  @query('.book__nav-next')
  private navNextBtn?: HTMLButtonElement;

  @query('.book__nav-last')
  private navLastBtn?: HTMLButtonElement;

  @query('.book__click-prev')
  private clickPrevEl?: HTMLElement;

  @query('.book__click-next')
  private clickNextEl?: HTMLElement;

  @query('.book__left-click')
  private leftClickEl?: HTMLElement;

  private pages: Element[] = [];
  private flipping = false;
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
    this.rebuild();
  }

  @dispose()
  cleanup() {}

  @on('slotchange', { target: 'slot:not([name])' })
  handleSlotChange() {
    this.collectPages();
    this.rebuild();
  }

  @watch('currentPage')
  handlePageChange() {
    if (!this.flipping) this.rebuild();
  }

  @watch('mode')
  handleModeChange() {
    this.rebuild();
  }

  @watch('title', 'author', 'coverImage')
  handleCoverChange() {
    this.rebuildLeftPage();
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

  // --- Imperative rebuild ---

  private rebuild() {
    if (!this.flipPagesEl) {
      requestAnimationFrame(() => this.rebuild());
      return;
    }
    this.rebuildPages();
    this.rebuildLeftPage();
    this.rebuildNav();
  }

  private rebuildPages() {
    const container = this.flipPagesEl;
    if (!container) return;

    const isSingle = this.mode === 'single';
    const numSpreads = this.totalSpreads;
    const currentSpread = this.currentSpread;

    let pagesHtml = '';
    for (let i = 0; i < numSpreads; i++) {
      const isFlipped = i < currentSpread;
      let pageClass = 'book__page';
      if (isFlipped) pageClass += ' book__page--flipped';

      const zIdx = isFlipped ? (i + 1) : (numSpreads - i);
      const rightPageNum = isSingle ? (i + 1) : (i * 2 + 2);

      pagesHtml += `<div class="${pageClass}" style="z-index: ${zIdx}" data-page-index="${i}">`;
      pagesHtml += `<div class="book__face book__face--front">`;
      pagesHtml += `<div class="book__face-content" data-content="front-${i}"></div>`;
      pagesHtml += `<span class="book__page-number book__page-number--right">${rightPageNum}</span>`;
      pagesHtml += `</div>`;
      pagesHtml += `<div class="book__face book__face--back"></div>`;
      pagesHtml += `</div>`;
    }

    container.innerHTML = pagesHtml;

    // Project content into nearby spread front faces
    const rangeStart = Math.max(0, currentSpread - 2);
    const rangeEnd = Math.min(numSpreads - 1, currentSpread + 2);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      const contentEl = container.querySelector(`[data-content="front-${i}"]`);
      if (contentEl) {
        const contentIdx = isSingle ? i : (i * 2 + 1);
        if (this.pages[contentIdx]) {
          contentEl.appendChild(this.pages[contentIdx].cloneNode(true));
        }
      }
    }
  }

  private rebuildLeftPage() {
    const leftContent = this.leftContentEl;
    if (!leftContent) return;

    const hasCover = !!(this.coverImage || this.title || this.author);
    const isAtCover = this.currentSpread === 0 && hasCover;

    leftContent.innerHTML = '';

    if (isAtCover) {
      let coverHtml = '<div class="book__cover">';
      if (this.coverImage) {
        coverHtml += `<img class="book__cover-image" src="${this.coverImage}" alt="${this.escapeAttr(this.title || 'Book cover')}" />`;
      }
      if (this.title) {
        coverHtml += `<h2 class="book__cover-title">${this.escapeHtml(this.title)}</h2>`;
      }
      if (this.author) {
        coverHtml += `<p class="book__cover-author">${this.escapeHtml(this.author)}</p>`;
      }
      coverHtml += '</div>';
      leftContent.innerHTML = coverHtml;
    } else if (this.pages[this.currentPage]) {
      leftContent.appendChild(this.pages[this.currentPage].cloneNode(true));
    }

    // Page number
    if (this.leftPageNumEl) {
      this.leftPageNumEl.style.display = isAtCover ? 'none' : '';
      this.leftPageNumEl.textContent = String(this.currentPage + 1);
    }
  }

  private rebuildNav() {
    const canPrev = this.canGoPrev();
    const canNext = this.canGoNext();

    if (this.navFirstBtn) this.navFirstBtn.disabled = !canPrev;
    if (this.navPrevBtn) this.navPrevBtn.disabled = !canPrev;
    if (this.navNextBtn) this.navNextBtn.disabled = !canNext;
    if (this.navLastBtn) this.navLastBtn.disabled = !canNext;

    if (this.navInfoEl) {
      const displayPage = this.currentPage + 1;
      const total = this.totalPages;
      this.navInfoEl.textContent = this.mode === 'single'
        ? `${displayPage} / ${total}`
        : `${displayPage}-${Math.min(this.currentPage + 2, total)} / ${total}`;
    }

    if (this.clickPrevEl) this.clickPrevEl.classList.toggle('book__click-disabled', !canPrev);
    if (this.clickNextEl) this.clickNextEl.classList.toggle('book__click-disabled', !canNext);
    if (this.leftClickEl) this.leftClickEl.classList.toggle('book__click-disabled', !canPrev);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escapeAttr(str: string): string {
    return this.escapeHtml(str).replace(/"/g, '&quot;');
  }

  // --- Flip animation (direct DOM manipulation, no rebuild) ---

  private flipToPage(targetPage: number, direction: PageTurnDirection) {
    if (this.flipping) return;
    if (targetPage < 0 || targetPage >= this.totalPages) return;
    if (targetPage === this.currentPage) return;

    this.flipping = true;
    const targetSpread = Math.floor(targetPage / this.spreadSize);
    const flipIdx = direction === 'forward' ? this.currentSpread : targetSpread;

    this.emitFlipStart({ fromPage: this.currentPage, toPage: targetPage, direction });

    // Content is already in the DOM from the last rebuild().
    // Ensure target spread has content (for large jumps).
    this.projectContentForSpread(targetSpread);

    // Apply animation class and z-index directly — no rebuild, content stays intact
    const pageEl = this.flipPagesEl?.querySelector(`[data-page-index="${flipIdx}"]`) as HTMLElement;
    if (pageEl) {
      pageEl.style.zIndex = String(this.totalSpreads + 1);
      pageEl.classList.add(`book__page--flipping-${direction}`);
    }

    const durationStr = getComputedStyle(this).getPropertyValue('--book-flip-duration').trim() || '0.6s';
    const durationMs = parseFloat(durationStr) * (durationStr.includes('ms') ? 1 : 1000);

    // Update left page at animation midpoint
    if (this.mode !== 'single') {
      setTimeout(() => {
        const leftContent = this.leftContentEl;
        if (leftContent) {
          leftContent.innerHTML = '';
          if (this.pages[targetPage]) {
            leftContent.appendChild(this.pages[targetPage].cloneNode(true));
          }
        }
        if (this.leftPageNumEl) {
          this.leftPageNumEl.textContent = String(targetPage + 1);
        }
      }, durationMs * 0.45);
    }

    // Finalize — single rebuild to reset all state
    setTimeout(() => {
      this.currentPage = targetPage;
      this.flipping = false;
      this.rebuild();
      this.emitPageTurn({ page: targetPage, direction });
      this.emitFlipEnd({ page: targetPage, direction });
    }, durationMs + 50);
  }

  /** Project content into a single spread's face container */
  private projectContentForSpread(spreadIdx: number) {
    const container = this.flipPagesEl;
    if (!container) return;
    const isSingle = this.mode === 'single';
    const contentEl = container.querySelector(`[data-content="front-${spreadIdx}"]`);
    if (contentEl && !contentEl.hasChildNodes()) {
      const contentIdx = isSingle ? spreadIdx : (spreadIdx * 2 + 1);
      if (this.pages[contentIdx]) {
        contentEl.appendChild(this.pages[contentIdx].cloneNode(true));
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

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="book" role="document" aria-label="${this.title || 'Book'}" aria-roledescription="book">
        <div class="book__body">
          <div class="book__left">
            <div class="book__left-content"></div>
            <span class="book__page-number book__page-number--left"></span>
            <div class="book__left-click"
                 @click=${() => this.prevPage()}
                 role="button"
                 aria-label="Previous page"></div>
          </div>
          <div class="book__spine" part="spine"></div>

          <div class="book__flip-area">
            <div class="book__flip-pages"></div>
            <div class="book__click-prev"
                 @click=${() => this.prevPage()}
                 role="button"
                 aria-label="Previous page"></div>
            <div class="book__click-next"
                 @click=${() => this.nextPage()}
                 role="button"
                 aria-label="Next page"></div>
          </div>
        </div>

        <div class="book__nav" part="nav">
          <button class="book__nav-button book__nav-first"
                  @click=${() => this.firstPage()}
                  aria-label="First page">
            <span>&#x21E4;</span>
          </button>
          <button class="book__nav-button book__nav-prev"
                  @click=${() => this.prevPage()}
                  aria-label="Previous page">
            <span>&#x2039;</span>
          </button>
          <span class="book__nav-info"></span>
          <button class="book__nav-button book__nav-next"
                  @click=${() => this.nextPage()}
                  aria-label="Next page">
            <span>&#x203A;</span>
          </button>
          <button class="book__nav-button book__nav-last"
                  @click=${() => this.lastPage()}
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
