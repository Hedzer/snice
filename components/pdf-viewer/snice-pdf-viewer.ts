import { element, property, render, styles, dispatch, ready, dispose, watch, query, on, html, css } from 'snice';
import type { PdfFitMode, SnicePdfViewerElement } from './snice-pdf-viewer.types';
import viewerStyles from './snice-pdf-viewer.css?inline';

// @ts-ignore - Vendored pdf.js library (Mozilla Foundation, Apache 2.0)
import { getDocument, GlobalWorkerOptions } from './pdf.min.mjs';

// Set worker source to vendored local copy
GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;

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

  @query('.pdf-viewport') private viewport?: HTMLElement;
  @query('.pdf-canvas-wrapper canvas') private canvas?: HTMLCanvasElement;

  @styles()
  componentStyles() {
    return css`${viewerStyles}`;
  }

  @ready()
  async init() {
    if (this.src) {
      this.loadDocument();
    }
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
    if (this.pdfDoc && this.page >= 1 && this.page <= this.totalPages) {
      this.renderPage();
    }
  }

  @watch('zoom')
  handleZoomChange() {
    if (this.pdfDoc) {
      this.renderPage();
    }
  }

  @watch('fit')
  handleFitChange() {
    if (this.pdfDoc) {
      this.renderPage();
    }
  }

  private async loadDocument(): Promise<void> {
    if (!this.src) return;

    this.loading = true;
    this.error = '';
    this.pdfDoc = null;
    this.totalPages = 0;

    try {
      const loadingTask = getDocument(this.src);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.loading = false;

      if (this.page > this.totalPages) {
        this.page = 1;
      }

      this.emitLoaded();
      this.renderPage();
    } catch (err: any) {
      this.loading = false;
      this.error = err?.message || 'Failed to load PDF';
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

      if (this.viewport && this.fit !== 'page') {
        const containerWidth = this.viewport.clientWidth - 32;
        const containerHeight = this.viewport.clientHeight - 32;

        if (this.fit === 'width') {
          scale = (containerWidth / baseViewport.width) * this.zoom;
        } else if (this.fit === 'height') {
          scale = (containerHeight / baseViewport.height) * this.zoom;
        }
      } else if (this.viewport && this.fit === 'page') {
        const containerWidth = this.viewport.clientWidth - 32;
        const containerHeight = this.viewport.clientHeight - 32;
        const scaleW = containerWidth / baseViewport.width;
        const scaleH = containerHeight / baseViewport.height;
        scale = Math.min(scaleW, scaleH) * this.zoom;
      }

      const viewport = page.getViewport({ scale });

      if (!this.canvas) {
        this.rendering = false;
        return;
      }

      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        this.rendering = false;
        return;
      }

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

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.goToPage(this.page + 1);
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.goToPage(this.page - 1);
    }
  }

  print(): void {
    if (!this.src) return;
    const printWindow = window.open(this.src);
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  }

  download(): void {
    if (!this.src) return;
    const a = document.createElement('a');
    a.href = this.src;
    a.download = this.src.split('/').pop() || 'document.pdf';
    a.click();
  }

  private handlePageInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) {
      this.goToPage(val);
    }
  }

  private handlePageInputKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.handlePageInput(e);
    }
  }

  private zoomIn() {
    this.zoom = Math.min(5, Math.round((this.zoom + 0.25) * 100) / 100);
  }

  private zoomOut() {
    this.zoom = Math.max(0.25, Math.round((this.zoom - 0.25) * 100) / 100);
  }

  private handleFitSelect(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.fit = select.value as PdfFitMode;
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        this.nextPage();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        this.prevPage();
        break;
      case '+':
      case '=':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.zoomIn();
        }
        break;
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.zoomOut();
        }
        break;
    }
  }

  @dispatch('page-change', { bubbles: true, composed: true })
  private emitPageChange() {
    return { page: this.page, totalPages: this.totalPages };
  }

  @dispatch('pdf-loaded', { bubbles: true, composed: true })
  private emitLoaded() {
    return { totalPages: this.totalPages };
  }

  @dispatch('pdf-error', { bubbles: true, composed: true })
  private emitError(error: string) {
    return { error };
  }

  @render()
  renderViewer() {
    return html`
      <div class="pdf-container" tabindex="0">
        <div class="pdf-toolbar">
          <div class="pdf-toolbar-group">
            <button class="pdf-btn" @click=${() => this.prevPage()} ?disabled=${this.page <= 1} title="Previous page">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <input
              class="pdf-page-input"
              type="number"
              min="1"
              max="${this.totalPages}"
              .value=${this.page.toString()}
              @change=${(e: Event) => this.handlePageInput(e)}
              @keydown=${(e: KeyboardEvent) => this.handlePageInputKey(e)}
            />
            <span class="pdf-page-info">/ ${this.totalPages || '-'}</span>
            <button class="pdf-btn" @click=${() => this.nextPage()} ?disabled=${this.page >= this.totalPages} title="Next page">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="pdf-toolbar-separator"></div>

          <div class="pdf-toolbar-group">
            <button class="pdf-btn" @click=${() => this.zoomOut()} ?disabled=${this.zoom <= 0.25} title="Zoom out">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span class="pdf-zoom-info">${Math.round(this.zoom * 100)}%</span>
            <button class="pdf-btn" @click=${() => this.zoomIn()} ?disabled=${this.zoom >= 5} title="Zoom in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>

          <div class="pdf-toolbar-separator"></div>

          <select class="pdf-fit-select" @change=${(e: Event) => this.handleFitSelect(e)} .value=${this.fit}>
            <option value="width">Fit width</option>
            <option value="height">Fit height</option>
            <option value="page">Fit page</option>
          </select>

          <div class="pdf-toolbar-spacer"></div>

          <div class="pdf-toolbar-group">
            <button class="pdf-btn" @click=${() => this.download()} ?disabled=${!this.src} title="Download">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button class="pdf-btn" @click=${() => this.print()} ?disabled=${!this.src} title="Print">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="pdf-viewport">
          <if ${this.loading}>
            <div class="pdf-loading">
              <div class="pdf-loading-spinner"></div>
              <span>Loading PDF...</span>
            </div>
          </if>

          <if ${this.error}>
            <div class="pdf-error">
              <div class="pdf-error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <span>${this.error}</span>
            </div>
          </if>

          <if ${!this.loading && !this.error && !this.src}>
            <div class="pdf-empty">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>No PDF loaded</span>
            </div>
          </if>

          <if ${!this.loading && !this.error && this.pdfDoc}>
            <div class="pdf-canvas-wrapper">
              <canvas></canvas>
            </div>
          </if>
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
