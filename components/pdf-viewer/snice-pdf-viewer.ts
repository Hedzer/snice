import { element, property, render, styles, dispatch, ready, dispose, watch, query, on, html, css } from 'snice';
import type { PdfFitMode, SnicePdfViewerElement } from './snice-pdf-viewer.types';
import viewerStyles from './snice-pdf-viewer.css?inline';

// @ts-ignore - Vendored pdf.js library (Mozilla Foundation, Apache 2.0)
import { getDocument, GlobalWorkerOptions } from './pdf.min.mjs';

// Resolve worker source relative to the script that loaded this component
{
  const cs = document.currentScript as HTMLScriptElement | null;
  const scriptSrc = cs?.src
    || (document.querySelectorAll('script[src*="pdf-viewer"]') as NodeListOf<HTMLScriptElement>)[0]?.src
    || '';
  if (scriptSrc) {
    GlobalWorkerOptions.workerSrc = scriptSrc.replace(/[^/]+$/, 'pdf.worker.min.mjs');
  }
}

@element('snice-pdf-viewer')
export class SnicePdfViewer extends HTMLElement implements SnicePdfViewerElement {
  @property() src: string = '';
  @property({ type: Number }) page: number = 1;
  @property({ type: Number }) zoom: number = 1;
  @property() fit: PdfFitMode = 'width';

  totalPages: number = 0;

  private pdfDoc: any = null;
  private loading: boolean = false;
  private error: string = '';
  private rendering: boolean = false;
  private listenersAttached = false;

  @query('.pdf-viewport') private viewportEl?: HTMLElement;
  @query('.pdf-canvas-wrapper canvas') private canvas?: HTMLCanvasElement;
  @query('.pdf-loading') private loadingEl?: HTMLElement;
  @query('.pdf-error') private errorEl?: HTMLElement;
  @query('.pdf-error-msg') private errorMsgEl?: HTMLElement;
  @query('.pdf-empty') private emptyEl?: HTMLElement;
  @query('.pdf-canvas-wrapper') private canvasWrapperEl?: HTMLElement;
  @query('.pdf-page-input') private pageInputEl?: HTMLInputElement;
  @query('.pdf-page-total') private pageTotalEl?: HTMLElement;
  @query('.pdf-zoom-info') private zoomInfoEl?: HTMLElement;
  @query('.pdf-btn-prev') private btnPrev?: HTMLButtonElement;
  @query('.pdf-btn-next') private btnNext?: HTMLButtonElement;
  @query('.pdf-btn-zoom-out') private btnZoomOut?: HTMLButtonElement;
  @query('.pdf-btn-zoom-in') private btnZoomIn?: HTMLButtonElement;
  @query('.pdf-btn-download') private btnDownload?: HTMLButtonElement;
  @query('.pdf-btn-print') private btnPrint?: HTMLButtonElement;
  @query('.pdf-fit-select') private fitSelectEl?: HTMLSelectElement;

  @styles()
  componentStyles() {
    return css`${viewerStyles}`;
  }

  @ready()
  init() {
    this.attachListeners();
    this.updateView();
    if (this.src) this.loadDocument();
  }

  @dispose()
  cleanup() {
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
  }

  @watch('src')
  handleSrcChange() {
    this.loadDocument();
  }

  @watch('page')
  handlePageChange() {
    this.updateToolbar();
    if (this.pdfDoc && this.page >= 1 && this.page <= this.totalPages) {
      this.renderPage();
    }
  }

  @watch('zoom')
  handleZoomChange() {
    this.updateToolbar();
    if (this.pdfDoc) this.renderPage();
  }

  @watch('fit')
  handleFitChange() {
    if (this.fitSelectEl) this.fitSelectEl.value = this.fit;
    if (this.pdfDoc) this.renderPage();
  }

  private async loadDocument(): Promise<void> {
    if (!this.src) return;

    this.loading = true;
    this.error = '';
    this.pdfDoc = null;
    this.totalPages = 0;
    this.updateView();

    try {
      const loadingTask = getDocument(this.src);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.loading = false;

      if (this.page > this.totalPages) this.page = 1;

      this.updateView();
      this.emitLoaded();
      this.renderPage();
    } catch (err: any) {
      this.loading = false;
      this.error = err?.message || 'Failed to load PDF';
      this.updateView();
      this.emitError(this.error);
    }
  }

  private async renderPage(): Promise<void> {
    if (!this.pdfDoc || this.rendering) return;
    if (this.page < 1 || this.page > this.totalPages) return;

    this.rendering = true;

    try {
      const page = await this.pdfDoc.getPage(this.page);
      const baseViewport = page.getViewport({ scale: 1 });

      let scale = this.zoom;

      if (this.viewportEl && this.fit !== 'page') {
        const containerWidth = this.viewportEl.clientWidth - 32;
        const containerHeight = this.viewportEl.clientHeight - 32;
        if (this.fit === 'width') {
          scale = (containerWidth / baseViewport.width) * this.zoom;
        } else if (this.fit === 'height') {
          scale = (containerHeight / baseViewport.height) * this.zoom;
        }
      } else if (this.viewportEl && this.fit === 'page') {
        const containerWidth = this.viewportEl.clientWidth - 32;
        const containerHeight = this.viewportEl.clientHeight - 32;
        scale = Math.min(containerWidth / baseViewport.width, containerHeight / baseViewport.height) * this.zoom;
      }

      const viewport = page.getViewport({ scale });

      if (!this.canvas) { this.rendering = false; return; }
      const ctx = this.canvas.getContext('2d');
      if (!ctx) { this.rendering = false; return; }

      this.canvas.width = viewport.width;
      this.canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      this.rendering = false;
    } catch {
      this.rendering = false;
    }
  }

  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.page = pageNum;
      this.emitPageChange();
    }
  }

  nextPage(): void { if (this.page < this.totalPages) this.goToPage(this.page + 1); }
  prevPage(): void { if (this.page > 1) this.goToPage(this.page - 1); }

  print(): void {
    if (!this.src) return;
    const printWindow = window.open(this.src);
    if (printWindow) printWindow.addEventListener('load', () => printWindow.print());
  }

  download(): void {
    if (!this.src) return;
    const a = document.createElement('a');
    a.href = this.src;
    a.download = this.src.split('/').pop() || 'document.pdf';
    a.click();
  }

  private zoomIn() { this.zoom = Math.min(5, Math.round((this.zoom + 0.25) * 100) / 100); }
  private zoomOut() { this.zoom = Math.max(0.25, Math.round((this.zoom - 0.25) * 100) / 100); }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); this.nextPage(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); this.prevPage(); break;
      case '+': case '=': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.zoomIn(); } break;
      case '-': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.zoomOut(); } break;
    }
  }

  // ── DOM Updates ──

  private updateView() {
    this.loadingEl?.classList.remove('is-visible');
    this.errorEl?.classList.remove('is-visible');
    this.emptyEl?.classList.remove('is-visible');
    this.canvasWrapperEl?.classList.remove('is-visible');

    if (this.loading) {
      this.loadingEl?.classList.add('is-visible');
    } else if (this.error) {
      this.errorEl?.classList.add('is-visible');
      if (this.errorMsgEl) this.errorMsgEl.textContent = this.error;
    } else if (!this.src || !this.pdfDoc) {
      this.emptyEl?.classList.add('is-visible');
    } else {
      this.canvasWrapperEl?.classList.add('is-visible');
    }

    this.updateToolbar();
  }

  private updateToolbar() {
    if (this.pageInputEl) {
      this.pageInputEl.value = String(this.page);
      this.pageInputEl.max = String(this.totalPages);
    }
    if (this.pageTotalEl) this.pageTotalEl.textContent = `/ ${this.totalPages || '-'}`;
    if (this.zoomInfoEl) this.zoomInfoEl.textContent = `${Math.round(this.zoom * 100)}%`;
    if (this.btnPrev) this.btnPrev.disabled = this.page <= 1;
    if (this.btnNext) this.btnNext.disabled = this.page >= this.totalPages;
    if (this.btnZoomOut) this.btnZoomOut.disabled = this.zoom <= 0.25;
    if (this.btnZoomIn) this.btnZoomIn.disabled = this.zoom >= 5;
    if (this.btnDownload) this.btnDownload.disabled = !this.src;
    if (this.btnPrint) this.btnPrint.disabled = !this.src;
  }

  private attachListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    this.btnPrev?.addEventListener('click', () => this.prevPage());
    this.btnNext?.addEventListener('click', () => this.nextPage());
    this.btnZoomOut?.addEventListener('click', () => this.zoomOut());
    this.btnZoomIn?.addEventListener('click', () => this.zoomIn());
    this.btnDownload?.addEventListener('click', () => this.download());
    this.btnPrint?.addEventListener('click', () => this.print());

    this.pageInputEl?.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val)) this.goToPage(val);
    });
    this.pageInputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        if (!isNaN(val)) this.goToPage(val);
      }
    });

    this.fitSelectEl?.addEventListener('change', (e) => {
      this.fit = (e.target as HTMLSelectElement).value as PdfFitMode;
    });
  }

  // ── Events ──

  @dispatch('page-change', { bubbles: true, composed: true })
  private emitPageChange() { return { page: this.page, totalPages: this.totalPages }; }

  @dispatch('pdf-loaded', { bubbles: true, composed: true })
  private emitLoaded() { return { totalPages: this.totalPages }; }

  @dispatch('pdf-error', { bubbles: true, composed: true })
  private emitError(error: string) { return { error }; }

  // ── Shell Render ──

  @render({ once: true })
  renderViewer() {
    return html`
      <div class="pdf-container" tabindex="0">
        <div class="pdf-toolbar">
          <div class="pdf-toolbar-group">
            <button class="pdf-btn pdf-btn-prev" title="Previous page">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <input class="pdf-page-input" type="number" min="1" />
            <span class="pdf-page-total">/ -</span>
            <button class="pdf-btn pdf-btn-next" title="Next page">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="pdf-toolbar-separator"></div>
          <div class="pdf-toolbar-group">
            <button class="pdf-btn pdf-btn-zoom-out" title="Zoom out">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <span class="pdf-zoom-info">100%</span>
            <button class="pdf-btn pdf-btn-zoom-in" title="Zoom in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>
          <div class="pdf-toolbar-separator"></div>
          <select class="pdf-fit-select">
            <option value="width">Fit width</option>
            <option value="height">Fit height</option>
            <option value="page">Fit page</option>
          </select>
          <div class="pdf-toolbar-spacer"></div>
          <div class="pdf-toolbar-group">
            <button class="pdf-btn pdf-btn-download" title="Download">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="pdf-btn pdf-btn-print" title="Print">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
          </div>
        </div>
        <div class="pdf-viewport">
          <div class="pdf-loading">
            <div class="pdf-loading-spinner"></div>
            <span>Loading PDF...</span>
          </div>
          <div class="pdf-error">
            <div class="pdf-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <span class="pdf-error-msg"></span>
          </div>
          <div class="pdf-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>No PDF loaded</span>
          </div>
          <div class="pdf-canvas-wrapper">
            <canvas></canvas>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-pdf-viewer': SnicePdfViewer;
  }
}
