import { element, property, query, dispatch, ready, dispose, render, styles, watch, html, css as cssTag } from 'snice';
import cssContent from './snice-signature.css?inline';
import type { SniceSignatureElement } from './snice-signature.types';

@element('snice-signature')
export class SniceSignature extends HTMLElement implements SniceSignatureElement {
  @property({ attribute: 'stroke-color' })
  strokeColor = 'rgb(23 23 23)';

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth = 2;

  @property({ attribute: 'background-color' })
  backgroundColor = '';

  @property({ type: Boolean })
  readonly = false;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private hasStrokes = false;
  private points: Array<{ x: number; y: number }> = [];
  private resizeObserver: ResizeObserver | null = null;

  @dispatch('signature-change', { bubbles: true, composed: true })
  private emitSignatureChange() {
    return { empty: !this.hasStrokes };
  }

  @dispatch('signature-clear', { bubbles: true, composed: true })
  private emitSignatureClear() {
    return undefined;
  }

  @ready()
  init() {
    this.setupCanvas();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
  }

  @dispose()
  cleanup() {
    this.resizeObserver?.disconnect();
  }

  @watch('backgroundColor')
  onBgChange() {
    if (this.canvas) {
      const pad = this.canvas.closest('.signature-pad') as HTMLElement;
      if (pad) {
        pad.style.setProperty('--signature-bg', this.backgroundColor || '');
      }
    }
  }

  private setupCanvas() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.handleResize();
  }

  private handleResize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private getPosition(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private startStroke(e: MouseEvent | TouchEvent) {
    if (this.readonly) return;
    e.preventDefault();
    this.drawing = true;
    const point = e instanceof MouseEvent ? this.getPosition(e) : this.getPosition(e.touches[0]);
    this.points = [point];
    if (this.ctx) {
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.lineWidth = this.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    }
  }

  private moveStroke(e: MouseEvent | TouchEvent) {
    if (!this.drawing || this.readonly) return;
    e.preventDefault();
    const point = e instanceof MouseEvent ? this.getPosition(e) : this.getPosition(e.touches[0]);
    this.points.push(point);

    if (this.ctx && this.points.length >= 3) {
      const len = this.points.length;
      const p0 = this.points[len - 3];
      const p1 = this.points[len - 2];
      const p2 = this.points[len - 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      this.ctx.beginPath();
      this.ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      this.ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      this.ctx.stroke();
    }
  }

  private endStroke(e: MouseEvent | TouchEvent) {
    if (!this.drawing) return;
    e.preventDefault();
    this.drawing = false;
    if (this.points.length > 0) {
      this.hasStrokes = true;
      this.emitSignatureChange();
    }
    this.points = [];
  }

  clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasStrokes = false;
    this.emitSignatureClear();
  }

  toDataURL(type = 'image/png'): string {
    return this.canvas?.toDataURL(type) ?? '';
  }

  async toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.canvas) return resolve(null);
      this.canvas.toBlob((blob) => resolve(blob));
    });
  }

  isEmpty(): boolean {
    return !this.hasStrokes;
  }

  @render()
  template() {
    return html`
      <div class="signature-pad">
        <canvas height="200"
          @mousedown=${this.startStroke}
          @mousemove=${this.moveStroke}
          @mouseup=${this.endStroke}
          @mouseleave=${this.endStroke}
          @touchstart=${this.startStroke}
          @touchmove=${this.moveStroke}
          @touchend=${this.endStroke}
          @touchcancel=${this.endStroke}></canvas>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
