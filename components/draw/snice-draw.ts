import { element, property, render, styles, query, html, css } from 'snice';
import type { DrawTool, Point, DrawStroke, SniceDrawElement } from './snice-draw.types';
import drawStyles from './snice-draw.css?inline';

// Lazy brush implementation
class LazyBrush {
  private brushX: number = 0;
  private brushY: number = 0;
  private pointerX: number = 0;
  private pointerY: number = 0;
  private radius: number;

  constructor(radius: number = 30) {
    this.radius = radius;
  }

  update(x: number, y: number): { x: number; y: number; changed: boolean } {
    this.pointerX = x;
    this.pointerY = y;

    const dx = this.pointerX - this.brushX;
    const dy = this.pointerY - this.brushY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.radius) {
      const angle = Math.atan2(dy, dx);
      this.brushX = this.pointerX - Math.cos(angle) * this.radius;
      this.brushY = this.pointerY - Math.sin(angle) * this.radius;
      return { x: this.brushX, y: this.brushY, changed: true };
    }

    return { x: this.brushX, y: this.brushY, changed: false };
  }

  getBrushCoordinates(): { x: number; y: number } {
    return { x: this.brushX, y: this.brushY };
  }

  getPointerCoordinates(): { x: number; y: number } {
    return { x: this.pointerX, y: this.pointerY };
  }

  setRadius(radius: number) {
    this.radius = radius;
  }
}

@element('snice-draw')
export class SniceDraw extends HTMLElement implements SniceDrawElement {
  @property({ type: Number })
  width: number = 800;

  @property({ type: Number })
  height: number = 600;

  @property({ type: String })
  tool: DrawTool = 'pen';

  @property({ type: String })
  color: string = '#000000';

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth: number = 2;

  @property({ type: String, attribute: 'background-color' })
  backgroundColor: string = '#ffffff';

  @property({ type: Boolean })
  lazy: boolean = true;

  @property({ type: Number, attribute: 'lazy-radius' })
  lazyRadius: number = 30;

  @property({ type: Number })
  smoothing: number = 0.5;

  @property({ type: Boolean })
  disabled: boolean = false;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private currentStroke: Point[] = [];
  private strokes: DrawStroke[] = [];
  private undoneStrokes: DrawStroke[] = [];
  private lazyBrush: LazyBrush;
  private lastPoint: Point | null = null;

  constructor() {
    super();
    this.lazyBrush = new LazyBrush(this.lazyRadius);
  }

  @styles()
  styles() {
    return css/*css*/`${drawStyles}`;
  }

  connectedCallback() {
    super.connectedCallback?.();
    setTimeout(() => this.initCanvas(), 0);
  }

  @render()
  render() {
    return html`
      <div class="draw-container">
        <canvas
          class="draw-canvas tool-${this.tool} ${this.disabled ? 'disabled' : ''}"
          width="${this.width}"
          height="${this.height}"
          @pointerdown=${(e: PointerEvent) => this.handlePointerDown(e)}
          @pointermove=${(e: PointerEvent) => this.handlePointerMove(e)}
          @pointerup=${(e: PointerEvent) => this.handlePointerUp(e)}
          @pointerleave=${(e: PointerEvent) => this.handlePointerUp(e)}>
        </canvas>
      </div>
    `;
  }

  private initCanvas() {
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!this.ctx) return;

    // Set background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Redraw existing strokes
    this.redraw();
  }

  private handlePointerDown(e: PointerEvent) {
    if (this.disabled) return;

    e.preventDefault();
    this.isDrawing = true;
    this.currentStroke = [];
    this.undoneStrokes = []; // Clear redo stack

    const point = this.getPointerPosition(e);
    this.lazyBrush.update(point.x, point.y);

    const brushPos = this.lazyBrush.getBrushCoordinates();
    this.lastPoint = { x: brushPos.x, y: brushPos.y };
    this.currentStroke.push(this.lastPoint);

    this.canvas.setPointerCapture(e.pointerId);

    this.dispatchEvent(new CustomEvent('@snice/draw-start', {
      detail: { draw: this, point },
      bubbles: true
    }));
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.isDrawing || this.disabled) return;

    e.preventDefault();

    const point = this.getPointerPosition(e);

    if (this.lazy) {
      const { x, y, changed } = this.lazyBrush.update(point.x, point.y);
      if (changed) {
        this.drawLine({ x, y });
        this.currentStroke.push({ x, y });
        this.lastPoint = { x, y };
      }
    } else {
      this.drawLine(point);
      this.currentStroke.push(point);
      this.lastPoint = point;
    }
  }

  private handlePointerUp(e: PointerEvent) {
    if (!this.isDrawing) return;

    e.preventDefault();
    this.isDrawing = false;

    if (this.currentStroke.length > 0) {
      const stroke: DrawStroke = {
        tool: this.tool,
        color: this.color,
        width: this.strokeWidth,
        points: [...this.currentStroke],
        timestamp: Date.now()
      };

      this.strokes.push(stroke);
      this.currentStroke = [];

      this.dispatchEvent(new CustomEvent('@snice/draw-end', {
        detail: { draw: this, stroke },
        bubbles: true
      }));
    }

    this.canvas.releasePointerCapture(e.pointerId);
  }

  private getPointerPosition(e: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure
    };
  }

  private drawLine(point: Point) {
    if (!this.ctx || !this.lastPoint) return;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);

    if (this.smoothing > 0 && this.currentStroke.length > 2) {
      // Quadratic curve for smoothing
      const cp = this.currentStroke[this.currentStroke.length - 2];
      const cpx = (this.lastPoint.x + point.x) / 2;
      const cpy = (this.lastPoint.y + point.y) / 2;
      this.ctx.quadraticCurveTo(this.lastPoint.x, this.lastPoint.y, cpx, cpy);
    } else {
      this.ctx.lineTo(point.x, point.y);
    }

    this.ctx.strokeStyle = this.tool === 'eraser' ? this.backgroundColor : this.color;
    this.ctx.lineWidth = this.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  private redraw() {
    if (!this.ctx) return;

    // Clear and set background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Redraw all strokes
    this.strokes.forEach(stroke => {
      this.drawStroke(stroke);
    });
  }

  private drawStroke(stroke: DrawStroke) {
    if (!this.ctx || stroke.points.length === 0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];

      if (this.smoothing > 0 && i > 1) {
        const prev = stroke.points[i - 1];
        const cpx = (prev.x + point.x) / 2;
        const cpy = (prev.y + point.y) / 2;
        this.ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }

    this.ctx.strokeStyle = stroke.tool === 'eraser' ? this.backgroundColor : stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  clear(): void {
    if (!this.ctx) return;

    this.strokes = [];
    this.undoneStrokes = [];
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.dispatchEvent(new CustomEvent('@snice/draw-clear', {
      detail: { draw: this },
      bubbles: true
    }));
  }

  undo(): void {
    if (this.strokes.length === 0) return;

    const stroke = this.strokes.pop();
    if (stroke) {
      this.undoneStrokes.push(stroke);
      this.redraw();

      this.dispatchEvent(new CustomEvent('@snice/draw-undo', {
        detail: { draw: this },
        bubbles: true
      }));
    }
  }

  redo(): void {
    if (this.undoneStrokes.length === 0) return;

    const stroke = this.undoneStrokes.pop();
    if (stroke) {
      this.strokes.push(stroke);
      this.drawStroke(stroke);

      this.dispatchEvent(new CustomEvent('@snice/draw-redo', {
        detail: { draw: this },
        bubbles: true
      }));
    }
  }

  toDataURL(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL(type, quality);
  }

  async toBlob(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): Promise<Blob> {
    if (!this.canvas) throw new Error('Canvas not initialized');

    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        type,
        quality
      );
    });
  }

  download(filename: string = `drawing-${Date.now()}.png`): void {
    const dataURL = this.toDataURL();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    a.click();
  }

  async loadImage(url: string): Promise<void> {
    if (!this.ctx) throw new Error('Canvas not initialized');

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.ctx!.drawImage(img, 0, 0, this.width, this.height);
        resolve();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  getStrokes(): DrawStroke[] {
    return [...this.strokes];
  }

  setStrokes(strokes: DrawStroke[]): void {
    this.strokes = [...strokes];
    this.undoneStrokes = [];
    this.redraw();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-draw': SniceDraw;
  }
}
