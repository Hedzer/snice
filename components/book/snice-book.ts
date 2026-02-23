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

  @query('.book__page--left')
  private leftPageEl?: HTMLElement;

  @query('.book__page--right')
  private rightPageEl?: HTMLElement;

  @query('.book__page--single')
  private singlePageEl?: HTMLElement;

  private pages: Element[] = [];
  private flipping = false;
  private touchStartX = 0;
  private touchStartY = 0;

  get totalPages(): number {
    return this.pages.length;
  }

  @ready()
  init() {
    this.collectPages();
    this.setAttribute('tabindex', '0');
    this.projectPages();
  }

  @dispose()
  cleanup() {
    // Cleanup handled by decorators
  }

  @on('slotchange', { target: 'slot:not([name])' })
  handleSlotChange() {
    this.collectPages();
    this.projectPages();
  }

  @watch('currentPage')
  handlePageChange() {
    queueMicrotask(() => this.projectPages());
  }

  @watch('mode')
  handleModeChange() {
    queueMicrotask(() => this.projectPages());
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
      if (deltaX < 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
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
    // Fallback: read light DOM children directly (needed for JSDOM/test environments)
    this.pages = Array.from(this.children);
  }

  private projectPages() {
    if (this.mode === 'single') {
      this.projectSinglePage();
    } else {
      this.projectSpreadPages();
    }
  }

  private projectSinglePage() {
    const container = this.singlePageEl;
    if (!container) return;

    // Clear existing cloned content
    const contentEl = container.querySelector('.book__page-inner');
    if (contentEl) contentEl.innerHTML = '';

    const hasCover = this.coverImage || this.title || this.author;
    const isAtCover = this.currentPage === 0 && hasCover;

    if (isAtCover) {
      // Cover is rendered in template, no projection needed
      return;
    }

    const page = this.pages[this.currentPage];
    if (page && contentEl) {
      contentEl.appendChild(page.cloneNode(true));
    }
  }

  private projectSpreadPages() {
    const leftContainer = this.leftPageEl;
    const rightContainer = this.rightPageEl;
    if (!leftContainer || !rightContainer) return;

    const leftContent = leftContainer.querySelector('.book__page-inner');
    const rightContent = rightContainer.querySelector('.book__page-inner');

    if (leftContent) leftContent.innerHTML = '';
    if (rightContent) rightContent.innerHTML = '';

    const hasCover = this.coverImage || this.title || this.author;
    const isAtCover = this.currentPage === 0 && hasCover;

    if (!isAtCover) {
      const leftPage = this.pages[this.currentPage];
      if (leftPage && leftContent) {
        leftContent.appendChild(leftPage.cloneNode(true));
      }
    }

    const rightIndex = this.currentPage + 1;
    const rightPage = this.pages[rightIndex];
    if (rightPage && rightContent) {
      rightContent.appendChild(rightPage.cloneNode(true));
    }
  }

  private getPageStep(): number {
    return this.mode === 'spread' ? 2 : 1;
  }

  private canGoNext(): boolean {
    return this.currentPage + this.getPageStep() < this.totalPages;
  }

  private canGoPrev(): boolean {
    return this.currentPage > 0;
  }

  private flipToPage(targetPage: number, direction: PageTurnDirection) {
    if (this.flipping) return;
    if (targetPage < 0 || targetPage >= this.totalPages) return;
    if (targetPage === this.currentPage) return;

    this.flipping = true;
    const fromPage = this.currentPage;

    this.emitFlipStart({ fromPage, toPage: targetPage, direction });

    // Build the flip overlay with front/back faces
    const pagesEl = this.shadowRoot?.querySelector('.book__pages');
    if (!pagesEl) {
      this.currentPage = targetPage;
      this.flipping = false;
      return;
    }

    const flipContainer = document.createElement('div');
    flipContainer.className = `book__flip-container book__flip-container--${direction}`;
    flipContainer.style.setProperty('transform-style', 'preserve-3d');

    // Front face: the page that's visible before the flip
    const frontFace = document.createElement('div');
    frontFace.className = 'book__flip-face book__flip-front';

    // Back face: the page revealed after the flip
    const backFace = document.createElement('div');
    backFace.className = 'book__flip-face book__flip-back';

    // Clone page content into the flip faces
    if (direction === 'forward') {
      // Forward: right page flips over. Front = current right page, back = next left page
      const isSingle = this.mode === 'single';
      const frontPageIdx = isSingle ? fromPage : fromPage + 1;
      const backPageIdx = targetPage;
      if (this.pages[frontPageIdx]) frontFace.appendChild(this.pages[frontPageIdx].cloneNode(true));
      if (this.pages[backPageIdx]) backFace.appendChild(this.pages[backPageIdx].cloneNode(true));
    } else {
      // Backward: left page flips back. Front = current left page, back = target right page
      const frontPageIdx = fromPage;
      const isSingle = this.mode === 'single';
      const backPageIdx = isSingle ? targetPage : targetPage + 1;
      if (this.pages[frontPageIdx]) frontFace.appendChild(this.pages[frontPageIdx].cloneNode(true));
      if (this.pages[backPageIdx]) backFace.appendChild(this.pages[backPageIdx].cloneNode(true));
    }

    flipContainer.appendChild(frontFace);
    flipContainer.appendChild(backFace);

    // Shadow overlay on the page beneath
    const shadow = document.createElement('div');
    shadow.className = `book__flip-shadow book__flip-shadow--${direction}`;

    pagesEl.appendChild(flipContainer);
    pagesEl.appendChild(shadow);

    // Get duration from CSS variable
    const computedStyle = getComputedStyle(this);
    const durationStr = computedStyle.getPropertyValue('--book-flip-duration').trim() || '600ms';
    const durationMs = parseFloat(durationStr);

    // Update page at the halfway point so content beneath updates mid-flip
    const halfwayTimer = setTimeout(() => {
      this.currentPage = targetPage;
      this.emitPageTurn({ page: targetPage, direction });
    }, durationMs * 0.5);

    // Clean up after animation completes
    const cleanupTimer = setTimeout(() => {
      flipContainer.remove();
      shadow.remove();
      this.flipping = false;
      this.emitFlipEnd({ page: this.currentPage, direction });
    }, durationMs + 50);

    // Also clean up if animation ends early
    flipContainer.addEventListener('animationend', () => {
      clearTimeout(halfwayTimer);
      clearTimeout(cleanupTimer);
      if (this.currentPage !== targetPage) {
        this.currentPage = targetPage;
        this.emitPageTurn({ page: targetPage, direction });
      }
      flipContainer.remove();
      shadow.remove();
      this.flipping = false;
      this.emitFlipEnd({ page: this.currentPage, direction });
    }, { once: true });
  }

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

  // --- Public API ---

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    const target = this.mode === 'spread' ? page - (page % 2) : page;
    const direction: PageTurnDirection = target > this.currentPage ? 'forward' : 'backward';
    this.flipToPage(target, direction);
  }

  nextPage(): void {
    if (!this.canGoNext()) return;
    const step = this.getPageStep();
    this.flipToPage(this.currentPage + step, 'forward');
  }

  prevPage(): void {
    if (!this.canGoPrev()) return;
    const step = this.getPageStep();
    const target = Math.max(0, this.currentPage - step);
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

  @render()
  renderContent() {
    const isSingle = this.mode === 'single';
    const canPrev = this.canGoPrev();
    const canNext = this.canGoNext();

    const displayPage = this.currentPage + 1;
    const total = this.totalPages;

    const hasCover = this.coverImage || this.title || this.author;
    const isAtCover = this.currentPage === 0 && hasCover;

    const navInfo = isSingle
      ? `${displayPage} / ${total}`
      : `${displayPage}-${Math.min(this.currentPage + 2, total)} / ${total}`;

    return html/*html*/`
      <div class="book" role="document" aria-label="${this.title || 'Book'}" aria-roledescription="book">
        <div class="book__wrapper">
          <div class="book__body">
            <div class="book__spine" part="spine"></div>
            <div class="book__pages" part="pages">

              <if ${isSingle}>
                <div class="book__page book__page--single">
                  <if ${isAtCover}>
                    <div class="book__cover">
                      <if ${this.coverImage}>
                        <img class="book__cover-image" src="${this.coverImage}" alt="${this.title || 'Book cover'}" />
                      </if>
                      <if ${this.title}>
                        <h2 class="book__cover-title">${this.title}</h2>
                      </if>
                      <if ${this.author}>
                        <p class="book__cover-author">${this.author}</p>
                      </if>
                    </div>
                  </if>
                  <if ${!isAtCover}>
                    <div class="book__page-inner"></div>
                  </if>
                  <if ${!isAtCover}>
                    <span class="book__page-number book__page-number--right">${displayPage}</span>
                  </if>
                </div>
              </if>

              <if ${!isSingle}>
                <div class="book__page book__page--left">
                  <if ${isAtCover}>
                    <div class="book__cover">
                      <if ${this.coverImage}>
                        <img class="book__cover-image" src="${this.coverImage}" alt="${this.title || 'Book cover'}" />
                      </if>
                      <if ${this.title}>
                        <h2 class="book__cover-title">${this.title}</h2>
                      </if>
                      <if ${this.author}>
                        <p class="book__cover-author">${this.author}</p>
                      </if>
                    </div>
                  </if>
                  <if ${!isAtCover}>
                    <div class="book__page-inner"></div>
                    <span class="book__page-number book__page-number--left">${displayPage}</span>
                  </if>
                </div>
                <div class="book__divider"></div>
                <div class="book__page book__page--right">
                  <div class="book__page-inner"></div>
                  <if ${this.currentPage + 1 < total}>
                    <span class="book__page-number book__page-number--right">${this.currentPage + 2}</span>
                  </if>
                </div>
              </if>

              <div class="book__click-zone book__click-zone--prev ${canPrev ? '' : 'book__click-zone--disabled'}"
                   @click=${() => this.prevPage()}
                   aria-label="Previous page"
                   role="button"></div>
              <div class="book__click-zone book__click-zone--next ${canNext ? '' : 'book__click-zone--disabled'}"
                   @click=${() => this.nextPage()}
                   aria-label="Next page"
                   role="button"></div>
            </div>
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
