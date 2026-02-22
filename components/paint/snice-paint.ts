import { element, property, render, styles, ready, dispose, on, query, dispatch, html, css } from 'snice';
import type { Point, PaintStroke, PaintControl, SnicePaintElement } from './snice-paint.types';
import paintStyles from './snice-paint.css?inline';

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#e2e8f0', '#1e293b'];

@element('snice-paint')
export class SnicePaint extends HTMLElement implements SnicePaintElement {
  @property({ type: String })
  color: string = '#3b82f6';

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth: number = 3;

  @property({ type: Number, attribute: 'min-stroke-width' })
  minStrokeWidth: number = 1;

  @property({ type: Number, attribute: 'max-stroke-width' })
  maxStrokeWidth: number = 20;

  @property({ type: String })
  controls: string = 'colors,size,eraser,undo,redo,clear';

  @property({ type: String, attribute: 'background-color' })
  backgroundColor: string = '#ffffff';

  @property({ type: Boolean })
  disabled: boolean = false;

  private _colors: string[] = DEFAULT_COLORS;
  private _tool: 'pen' | 'eraser' = 'pen';
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private currentStroke: Point[] = [];
  private strokes: PaintStroke[] = [];
  private undoneStrokes: PaintStroke[] = [];
  private lastPoint: Point | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  get colors(): string[] {
    return this._colors;
  }

  set colors(val: string[] | string) {
    if (typeof val === 'string') {
      try {
        this._colors = JSON.parse(val);
      } catch {
        this._colors = DEFAULT_COLORS;
      }
    } else {
      this._colors = val;
    }
  }

  @styles()
  componentStyles() {
    return css/*css*/`${paintStyles}`;
  }

  @ready()
  onReady() {
    // Parse colors attribute
    const colorsAttr = this.getAttribute('colors');
    if (colorsAttr) {
      try {
        this._colors = JSON.parse(colorsAttr);
      } catch { /* keep defaults */ }
    }

    requestAnimationFrame(() => {
      this.initCanvas();
    });
  }

  @dispose()
  onDispose() {
    // cleanup
  }

  private get activeControls(): Set<PaintControl> {
    return new Set(this.controls.split(',').map(s => s.trim()) as PaintControl[]);
  }

  @render()
  renderContent() {
    const ctrls = this.activeControls;
    const hasToolbar = ctrls.size > 0;

    return html`
      <div class="paint-container">
        ${hasToolbar ? html`
          <div class="paint-toolbar">
            ${ctrls.has('colors') ? html`
              <span class="paint-toolbar-label">Color</span>
              <div class="paint-swatches">
                ${this._colors.map(c => html`
                  <span
                    class="paint-swatch ${c === this.color && this._tool === 'pen' ? 'active' : ''}"
                    style="--c:${c}"
                    @click=${() => this.selectColor(c)}
                  ></span>
                `)}
              </div>
              <div class="paint-toolbar-sep"></div>
            ` : ''}
            ${ctrls.has('size') ? html`
              <span class="paint-toolbar-label">Size</span>
              <input
                type="range"
                class="paint-size-slider"
                min="${this.minStrokeWidth}"
                max="${this.maxStrokeWidth}"
                .value="${String(this.strokeWidth)}"
                @input=${(e: Event) => { this.strokeWidth = +(e.target as HTMLInputElement).value; }}
                title="Brush size"
              >
              <div class="paint-toolbar-sep"></div>
            ` : ''}
            ${ctrls.has('eraser') ? html`
              <button
                class="paint-btn ${this._tool === 'eraser' ? 'active' : ''}"
                @click=${() => this.toggleEraser()}
                title="Eraser"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 14h7M3.5 12l8-8 3 3-8 8H3.5v-3z"/></svg>
              </button>
              <div class="paint-toolbar-sep"></div>
            ` : ''}
            ${ctrls.has('undo') ? html`
              <button class="paint-btn" @click=${() => this.undo()} title="Undo">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6L1 9l3 3"/><path d="M1 9h10a4 4 0 000-8H8"/></svg>
              </button>
            ` : ''}
            ${ctrls.has('redo') ? html`
              <button class="paint-btn" @click=${() => this.redo()} title="Redo">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6l3 3-3 3"/><path d="M15 9H5a4 4 0 010-8h3"/></svg>
              </button>
            ` : ''}
            ${ctrls.has('clear') ? html`
              <button class="paint-btn danger" @click=${() => this.clear()} title="Clear canvas">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12"/><path d="M5.3 4V2.7h5.4V4"/><path d="M6 7v5M10 7v5"/><path d="M3.3 4l.7 9.3h8l.7-9.3"/></svg>
              </button>
            ` : ''}
          </div>
        ` : ''}
        <div class="paint-canvas-wrap">
          <canvas class="paint-canvas tool-${this._tool}"></canvas>
        </div>
      </div>
    `;
  }

  private initCanvas() {
    const wrap = this.shadowRoot?.querySelector('.paint-canvas-wrap');
    this.canvas = this.shadowRoot?.querySelector('.paint-canvas') as HTMLCanvasElement | null;
    if (!this.canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!this.ctx) return;

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.redraw();
  }

  @on('pointerdown', { target: '.paint-canvas' })
  private handlePointerDown(e: PointerEvent) {
    if (this.disabled) return;
    e.preventDefault();

    const point = this.getPointerPosition(e);
    this.isDrawing = true;
    this.currentStroke = [point];
    this.lastPoint = point;
    this.undoneStrokes = [];

    (e.target as HTMLCanvasElement)?.setPointerCapture(e.pointerId);
    this.emitPaintStart(point);
  }

  @on('pointermove', { target: '.paint-canvas' })
  private handlePointerMove(e: PointerEvent) {
    if (!this.isDrawing || this.disabled) return;
    e.preventDefault();

    const point = this.getPointerPosition(e);
    this.currentStroke.push(point);

    this.drawLiveStroke();
    this.lastPoint = point;
  }

  @on('pointerup', { target: '.paint-canvas' })
  private handlePointerUp(e: PointerEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();

    this.isDrawing = false;

    if (this.currentStroke.length > 0) {
      const stroke: PaintStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tool: this._tool,
        color: this.color,
        width: this.strokeWidth,
        points: [...this.currentStroke],
        timestamp: Date.now()
      };

      this.strokes.push(stroke);
      this.currentStroke = [];
      this.redraw();
      this.emitPaintEnd(stroke);
    }

    (e.target as HTMLCanvasElement)?.releasePointerCapture(e.pointerId);
  }

  private getPointerPosition(e: PointerEvent): Point {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvasWidth / rect.width),
      y: (e.clientY - rect.top) * (this.canvasHeight / rect.height)
    };
  }

  private midPointBtw(p1: Point, p2: Point): Point {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  }

  private drawLiveStroke() {
    if (!this.ctx) return;

    // Clear and redraw everything
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.strokes.forEach(s => this.drawStroke(s));

    // Draw current stroke
    if (this.currentStroke.length > 1) {
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = this._tool === 'eraser' ? this.backgroundColor : this.color;
      this.ctx.lineWidth = this.strokeWidth * 2;

      let p1 = this.currentStroke[0];
      let p2 = this.currentStroke[1];

      this.ctx.moveTo(p2.x, p2.y);
      this.ctx.beginPath();

      for (let i = 1; i < this.currentStroke.length; i++) {
        const midPoint = this.midPointBtw(p1, p2);
        this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = this.currentStroke[i];
        p2 = this.currentStroke[i + 1];
      }

      this.ctx.lineTo(p1.x, p1.y);
      this.ctx.stroke();
    }
  }

  private redraw() {
    if (!this.ctx) return;

    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.strokes.forEach(s => this.drawStroke(s));
  }

  private drawStroke(stroke: PaintStroke) {
    if (!this.ctx || stroke.points.length === 0) return;

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = stroke.tool === 'eraser' ? this.backgroundColor : stroke.color;
    this.ctx.lineWidth = stroke.width * 2;

    if (stroke.points.length === 1) {
      this.ctx.beginPath();
      this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }

    let p1 = stroke.points[0];
    let p2 = stroke.points[1];

    this.ctx.moveTo(p2.x, p2.y);
    this.ctx.beginPath();

    for (let i = 1; i < stroke.points.length; i++) {
      const midPoint = this.midPointBtw(p1, p2);
      this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = stroke.points[i];
      p2 = stroke.points[i + 1];
    }

    this.ctx.lineTo(p1.x, p1.y);
    this.ctx.stroke();
  }

  private selectColor(c: string) {
    this.color = c;
    this._tool = 'pen';
  }

  private toggleEraser() {
    this._tool = this._tool === 'eraser' ? 'pen' : 'eraser';
  }

  undo(): void {
    if (this.strokes.length === 0) return;
    const stroke = this.strokes.pop();
    if (stroke) {
      this.undoneStrokes.push(stroke);
      this.redraw();
      this.emitPaintUndo();
    }
  }

  redo(): void {
    if (this.undoneStrokes.length === 0) return;
    const stroke = this.undoneStrokes.pop();
    if (stroke) {
      this.strokes.push(stroke);
      this.drawStroke(stroke);
      this.emitPaintRedo();
    }
  }

  clear(): void {
    if (!this.ctx) return;
    this.strokes = [];
    this.undoneStrokes = [];
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.emitPaintClear();
  }

  toDataURL(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL(type, quality);
  }

  async toBlob(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): Promise<Blob> {
    if (!this.canvas) throw new Error('Canvas not initialized');
    return new Promise((resolve, reject) => {
      this.canvas?.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        type,
        quality
      );
    });
  }

  download(filename: string = `painting-${Date.now()}.png`): void {
    const dataURL = this.toDataURL();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    a.click();
  }

  getStrokes(): PaintStroke[] {
    return [...this.strokes];
  }

  setStrokes(strokes: PaintStroke[]): void {
    this.strokes = [...strokes];
    this.undoneStrokes = [];
    this.redraw();
  }

  @dispatch('paint-start', { bubbles: true, composed: true })
  private emitPaintStart(point: Point) {
    return { point };
  }

  @dispatch('paint-end', { bubbles: true, composed: true })
  private emitPaintEnd(stroke: PaintStroke) {
    return { stroke };
  }

  @dispatch('paint-clear', { bubbles: true, composed: true })
  private emitPaintClear() {
    return {};
  }

  @dispatch('paint-undo', { bubbles: true, composed: true })
  private emitPaintUndo() {
    return {};
  }

  @dispatch('paint-redo', { bubbles: true, composed: true })
  private emitPaintRedo() {
    return {};
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-paint': SnicePaint;
  }
}
