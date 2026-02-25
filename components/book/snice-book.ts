import { element, property, query, watch, dispatch, ready, on, render, styles, html, css } from 'snice';
import cssContent from './snice-book.css?inline';
import type { SniceBookElement, PageTurnDirection, PageTurnDetail, PageFlipStartDetail } from './snice-book.types';

@element('snice-book-page')
export class SniceBookPage extends HTMLElement {
  @render()
  renderContent() {
    return html`<slot></slot>`;
  }

  @styles()
  componentStyles() {
    return css`:host { display: none; }`;
  }
}

@element('snice-book')
export class SniceBook extends HTMLElement implements SniceBookElement {
  @property({ type: Number, attribute: 'current-page' })
  currentPage = 0;

  @property({ attribute: 'cover-image' })
  coverImage = '';

  @property()
  title = '';

  @property()
  author = '';

  @query('.book')
  private $book!: HTMLElement;

  private pages: Element[] = [];
  private radioName = `book_${Math.random().toString(36).slice(2, 8)}`;

  get totalPages(): number {
    return this.pages.length;
  }

  @ready()
  init() {
    this.collectPages();
    this.buildPages();
    this.setAttribute('tabindex', '0');
  }

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.collectPages();
    this.buildPages();
  }

  @watch('currentPage')
  onPageChange() {
    this.syncRadio();
  }

  @watch('coverImage')
  onCoverChange() {
    if (!this.$book) return;
    const img = this.$book.querySelector('.book__page--1 img') as HTMLImageElement;
    if (img) img.src = this.coverImage;
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); this.nextPage(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prevPage(); }
  }

  private collectPages() {
    this.pages = Array.from(this.querySelectorAll(':scope > snice-book-page'));
  }

  /**
   * Exact CodePen DOM structure:
   *
   *   <label for="page-1" class="book__page book__page--1">   ← left: cover image
   *   <label for="page-2" class="book__page book__page--4">   ← right: last page content
   *   <input type="radio" name="page" id="page-1"/>           ← resets (closes)
   *   <input type="radio" name="page" id="page-2"/>           ← opens page
   *   <label class="book__page book__page--2">                ← flippable page
   *     <div class="book__page-front">...</div>
   *     <div class="book__page-back">...</div>
   *   </label>
   *
   * CSS: input:checked + .book__page { transform: rotateY(-180deg) }
   */
  private buildPages() {
    if (!this.$book) return;

    const n = this.pages.length;
    if (n === 0) { this.$book.innerHTML = ''; return; }

    const resetId = `${this.radioName}_0`;
    const lastId = `${this.radioName}_${n}`;

    let h = '';

    // Left label: cover image, click resets (closes all)
    h += `<label for="${resetId}" class="book__page book__page--1">`;
    if (this.coverImage) {
      h += `<img src="${this.esc(this.coverImage)}" alt="${this.esc(this.title || '')}">`;
    }
    h += `</label>`;

    // Right label: last page content, click opens last page
    h += `<label for="${lastId}" class="book__page book__page--4">`;
    h += `<div class="page__content" data-slot="last"></div>`;
    h += `</label>`;

    // Reset radio (no adjacent flippable label — unchecks everything)
    h += `<input type="radio" name="${this.radioName}" id="${resetId}">`;

    // For each page: radio + adjacent flippable label (CSS + combinator)
    for (let i = 0; i < n; i++) {
      const radioId = `${this.radioName}_${i + 1}`;
      h += `<input type="radio" name="${this.radioName}" id="${radioId}" data-page="${i}">`;
      h += `<label class="book__page book__page--2">`;
      h += `<div class="book__page-front"><div class="page__content" data-slot="front-${i}"></div></div>`;
      h += `<div class="book__page-back"><div class="page__content" data-slot="back-${i}"></div></div>`;
      h += `</label>`;
    }

    this.$book.innerHTML = h;

    // Project slotted content into page containers
    for (let i = 0; i < n; i++) {
      const page = this.pages[i];
      const front = page.querySelector('[slot="front"]') || page.children[0];
      const back = page.querySelector('[slot="back"]');
      const frontEl = this.$book.querySelector(`[data-slot="front-${i}"]`);
      const backEl = this.$book.querySelector(`[data-slot="back-${i}"]`);
      if (frontEl && front) frontEl.appendChild(front.cloneNode(true));
      if (backEl && back) backEl.appendChild(back.cloneNode(true));
    }

    // Right side: front of last page
    const lastSlot = this.$book.querySelector('[data-slot="last"]');
    if (lastSlot && n > 0) {
      const lastPage = this.pages[n - 1];
      const lastFront = lastPage.querySelector('[slot="front"]') || lastPage.children[0];
      if (lastFront) lastSlot.appendChild(lastFront.cloneNode(true));
    }

    // Radio change listeners for page-turn events
    this.$book.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const idx = (radio as HTMLInputElement).dataset.page;
        const old = this.currentPage;
        const newPage = idx !== undefined ? Number(idx) + 1 : 0;
        if (old !== newPage) {
          const direction: PageTurnDirection = newPage > old ? 'forward' : 'backward';
          this.emitPageFlipStart({ fromPage: old, toPage: newPage, direction });
          this.currentPage = newPage;
          this.emitPageTurn({ page: newPage, direction });
          const duration = parseFloat(getComputedStyle(this).getPropertyValue('--book-flip-duration') || '0.6') * 1000;
          setTimeout(() => this.emitPageFlipEnd({ page: newPage, direction }), duration);
        }
      });
    });

    this.syncRadio();
  }

  private syncRadio() {
    if (!this.$book) return;
    const id = this.currentPage === 0
      ? `${this.radioName}_0`
      : `${this.radioName}_${this.currentPage}`;
    const radio = this.$book.querySelector(`#${id}`) as HTMLInputElement;
    if (radio) radio.checked = true;
  }

  goToPage(page: number): void {
    const old = this.currentPage;
    const newPage = Math.max(0, Math.min(page, this.totalPages));
    if (old !== newPage) {
      const direction: PageTurnDirection = newPage > old ? 'forward' : 'backward';
      this.emitPageFlipStart({ fromPage: old, toPage: newPage, direction });
      this.currentPage = newPage;
      this.emitPageTurn({ page: newPage, direction });
      const duration = parseFloat(getComputedStyle(this).getPropertyValue('--book-flip-duration') || '0.6') * 1000;
      setTimeout(() => this.emitPageFlipEnd({ page: newPage, direction }), duration);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    if (this.currentPage > 0) this.goToPage(this.currentPage - 1);
  }

  firstPage(): void {
    this.goToPage(0);
  }

  lastPage(): void {
    this.goToPage(this.totalPages);
  }

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  @dispatch('page-turn', { bubbles: true, composed: true })
  private emitPageTurn(detail?: PageTurnDetail): PageTurnDetail {
    return detail!;
  }

  @dispatch('page-flip-start', { bubbles: true, composed: true })
  private emitPageFlipStart(detail?: PageFlipStartDetail): PageFlipStartDetail {
    return detail!;
  }

  @dispatch('page-flip-end', { bubbles: true, composed: true })
  private emitPageFlipEnd(detail?: PageTurnDetail): PageTurnDetail {
    return detail!;
  }

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="cover">
        <div class="book"></div>
      </div>
      <div hidden><slot></slot></div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
