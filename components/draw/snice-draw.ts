import { element, property, render, styles, ready, dispose, on, html, css } from 'snice';
import type { DrawTool, Point, DrawStroke, SniceDrawElement } from './snice-draw.types';
import drawStyles from './snice-draw.css?inline';

const ease = (t: number): number => t * (2 - t);

class DrawPoint implements Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(point: Point): DrawPoint {
    this.x = point.x;
    this.y = point.y;
    return this;
  }

  moveByAngle(angle: number, distance: number, friction?: number): DrawPoint {
    const angleRotated = angle + Math.PI / 2;

    if (friction) {
      this.x = this.x + Math.sin(angleRotated) * distance * ease(1 - friction);
      this.y = this.y - Math.cos(angleRotated) * distance * ease(1 - friction);
    } else {
      this.x = this.x + Math.sin(angleRotated) * distance;
      this.y = this.y - Math.cos(angleRotated) * distance;
    }

    return this;
  }

  equalsTo(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  getDifferenceTo(point: Point): DrawPoint {
    return new DrawPoint(this.x - point.x, this.y - point.y);
  }

  getDistanceTo(point: Point): number {
    const diff = this.getDifferenceTo(point);
    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
  }

  getAngleTo(point: Point): number {
    const diff = this.getDifferenceTo(point);
    return Math.atan2(diff.y, diff.x);
  }

  toObject(): Point {
    return { x: this.x, y: this.y };
  }
}

class DrawBrush {
  private _isEnabled: boolean;
  private _hasMoved: boolean;
  radius: number;
  pointer: DrawPoint;
  brush: DrawPoint;
  angle: number;
  distance: number;

  constructor(options: { radius?: number; enabled?: boolean; initialPoint?: Point } = {}) {
    const initialPoint = options.initialPoint || { x: 0, y: 0 };
    this.radius = options.radius || 30;
    this._isEnabled = options.enabled === false ? false : true;
    this.pointer = new DrawPoint(initialPoint.x, initialPoint.y);
    this.brush = new DrawPoint(initialPoint.x, initialPoint.y);
    this.angle = 0;
    this.distance = 0;
    this._hasMoved = false;
  }

  enable(): void {
    this._isEnabled = true;
  }

  disable(): void {
    this._isEnabled = false;
  }

  isEnabled(): boolean {
    return this._isEnabled;
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  getRadius(): number {
    return this.radius;
  }

  getBrushCoordinates(): Point {
    return this.brush.toObject();
  }

  getPointerCoordinates(): Point {
    return this.pointer.toObject();
  }

  getBrush(): DrawPoint {
    return this.brush;
  }

  getPointer(): DrawPoint {
    return this.pointer;
  }

  getAngle(): number {
    return this.angle;
  }

  getDistance(): number {
    return this.distance;
  }

  brushHasMoved(): boolean {
    return this._hasMoved;
  }

  update(newPointerPoint: Point, options: { both?: boolean; friction?: number } = {}): boolean {
    this._hasMoved = false;
    if (this.pointer.equalsTo(newPointerPoint) && !options.both && !options.friction) {
      return false;
    }

    this.pointer.update(newPointerPoint);

    if (options.both) {
      this._hasMoved = true;
      this.brush.update(newPointerPoint);
      return true;
    }

    if (this._isEnabled) {
      this.distance = this.pointer.getDistanceTo(this.brush);
      this.angle = this.pointer.getAngleTo(this.brush);

      const isOutside = Math.round((this.distance - this.radius) * 10) / 10 > 0;
      const friction =
        options.friction && options.friction < 1 && options.friction > 0
          ? options.friction
          : undefined;

      if (isOutside) {
        this.brush.moveByAngle(this.angle, this.distance - this.radius, friction);
        this._hasMoved = true;
      }
    } else {
      this.distance = 0;
      this.angle = 0;
      this.brush.update(newPointerPoint);
      this._hasMoved = true;
    }

    return true;
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
  lazy: boolean = false;

  @property({ type: Number, attribute: 'lazy-radius' })
  lazyRadius: number = 60;

  @property({ type: Number })
  friction: number = 0.1;

  @property({ type: Number })
  smoothing: number = 0.5;

  @property({ type: Boolean })
  disabled: boolean = false;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private isPressing: boolean = false;
  private currentStroke: Point[] = [];
  private strokes: DrawStroke[] = [];
  private undoneStrokes: DrawStroke[] = [];
  private drawBrush: DrawBrush;
  private lastPoint: Point | null = null;
  private rafId: number | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {
    super();
    this.drawBrush = new DrawBrush({
      radius: this.lazyRadius,
      enabled: this.lazy
    });
  }

  @styles()
  styles() {
    return css/*css*/`${drawStyles}`;
  }

  @ready()
  onReady() {
    requestAnimationFrame(() => {
      this.initCanvas();
      this.startLoop();
    });
  }

  @dispose()
  onDispose() {
    this.stopLoop();
  }

  @render()
  render() {
    return html`
      <div class="draw-container">
        <canvas
          width="${this.width}"
          height="${this.height}"
          class="draw-canvas tool-${this.tool} ${this.disabled ? 'disabled' : ''}">
        </canvas>
      </div>
    `;
  }

  private initCanvas() {
    this.canvas = this.shadowRoot?.querySelector('canvas') || null;

    if (!this.canvas) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // Set canvas buffer size (accounting for DPI)
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    // Set display size
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!this.ctx) return;

    // Scale canvas drawing to match DPI
    this.ctx.scale(dpr, dpr);

    // Enable anti-aliasing for smooth lines
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Set background
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Redraw existing strokes
    this.redraw();
  }

  @on('pointerdown', { target: 'canvas' })
  private handlePointerDown(e: PointerEvent) {
    if (this.disabled) return;

    e.preventDefault();

    const point = this.getPointerPosition(e);
    this.mouseX = point.x;
    this.mouseY = point.y;

    // Update brush to pointer position immediately
    this.drawBrush.update(point, { both: true });

    this.isPressing = true;

    this.canvas?.setPointerCapture(e.pointerId);

    this.dispatchEvent(new CustomEvent('@snice/draw-start', {
      detail: { draw: this, point },
      bubbles: true
    }));
  }

  @on('pointermove', { target: 'canvas' })
  private handlePointerMove(e: PointerEvent) {
    if (this.disabled) return;

    e.preventDefault();

    const point = this.getPointerPosition(e);
    this.mouseX = point.x;
    this.mouseY = point.y;
  }

  @on('pointerup', { target: 'canvas' })
  private handlePointerUp(e: PointerEvent) {
    if (!this.isPressing) return;

    e.preventDefault();
    this.isPressing = false;
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

    this.canvas?.releasePointerCapture(e.pointerId);
  }

  private getPointerPosition(e: PointerEvent): Point {
    if (!this.canvas) return { x: 0, y: 0, pressure: 0 };

    const rect = this.canvas.getBoundingClientRect();

    // Map from screen coordinates to logical canvas coordinates
    const x = (e.clientX - rect.left) * (this.width / rect.width);
    const y = (e.clientY - rect.top) * (this.height / rect.height);

    return {
      x,
      y,
      pressure: e.pressure
    };
  }

  private startLoop() {
    const loop = () => {
      this.updateLazyBrush();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private midPointBtw(p1: Point, p2: Point): Point {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  }

  private updateLazyBrush() {
    if (!this.ctx) return;

    const hasChanged = this.drawBrush.update(
      { x: this.mouseX, y: this.mouseY },
      { friction: this.isDrawing ? this.friction : 1 }
    );
    const isDisabled = !this.drawBrush.isEnabled();
    const hasMoved = this.drawBrush.brushHasMoved();

    // Start drawing if pressing and not yet drawing
    if (this.isPressing && !this.isDrawing) {
      this.isDrawing = true;
      this.currentStroke = [];
      this.undoneStrokes = [];
      this.currentStroke.push(this.drawBrush.getBrushCoordinates());
    }

    if (this.isDrawing) {
      // Clear canvas and fill background
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Redraw all completed strokes
      this.strokes.forEach(stroke => {
        this.drawStroke(stroke);
      });

      // Add current point
      this.currentStroke.push(this.drawBrush.getBrushCoordinates());

      // Draw current stroke with smoothing
      if (this.currentStroke.length > 1) {
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.tool === 'eraser' ? this.backgroundColor : this.color;
        this.ctx.lineWidth = this.strokeWidth * 2;

        let p1 = this.currentStroke[0];
        let p2 = this.currentStroke[1];

        this.ctx.moveTo(p2.x, p2.y);
        this.ctx.beginPath();

        for (let i = 1, len = this.currentStroke.length; i < len; i++) {
          const midPoint = this.midPointBtw(p1, p2);
          this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
          p1 = this.currentStroke[i];
          p2 = this.currentStroke[i + 1];
        }

        // Draw last line as straight line while waiting for next point
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
      }
    }
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

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = stroke.tool === 'eraser' ? this.backgroundColor : stroke.color;
    this.ctx.lineWidth = stroke.width * 2;

    if (stroke.points.length === 1) {
      // Single point - just draw a dot
      this.ctx.beginPath();
      this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width, 0, Math.PI * 2);
      this.ctx.fill();
      return;
    }

    let p1 = stroke.points[0];
    let p2 = stroke.points[1];

    this.ctx.moveTo(p2.x, p2.y);
    this.ctx.beginPath();

    for (let i = 1, len = stroke.points.length; i < len; i++) {
      const midPoint = this.midPointBtw(p1, p2);
      this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = stroke.points[i];
      p2 = stroke.points[i + 1];
    }

    this.ctx.lineTo(p1.x, p1.y);
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
