import { element, property, render, styles, ready, dispose, query, dispatch, watch, html, css } from 'snice';
import type { CameraAnnotateMode, Annotation, AnnotationData, AnnotationStroke, SniceCameraAnnotateElement } from './snice-camera-annotate.types';
import componentStyles from './snice-camera-annotate.css?inline';

const PRESET_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
  '#f472b6', '#fb7185', '#e879f9', '#818cf8'
];

@element('snice-camera-annotate')
export class SniceCameraAnnotate extends HTMLElement implements SniceCameraAnnotateElement {
  @property()
  mode: CameraAnnotateMode = 'camera';

  @property({ type: Boolean, attribute: 'auto-rotate-colors' })
  autoRotateColors: boolean = true;

  @property({ type: Boolean, attribute: 'show-labels-panel' })
  showLabelsPanel: boolean = true;

  @query('.ca-video')
  private videoEl?: HTMLVideoElement;

  @query('.ca-draw-canvas')
  private drawCanvas?: HTMLCanvasElement;

  private stream: MediaStream | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private capturedImageData: string = '';
  private capturedImage: HTMLImageElement | null = null;
  private imageWidth: number = 0;
  private imageHeight: number = 0;

  // Drawing state
  private isDrawing: boolean = false;
  private currentPoints: { x: number; y: number }[] = [];
  private strokes: AnnotationStroke[] = [];
  private annotations: Annotation[] = [];
  private activeColor: string = PRESET_COLORS[0];
  private colorIndex: number = 0;
  private strokeWidth: number = 3;

  // Highlight state
  private highlightedAnnotationId: string | null = null;

  @styles()
  componentStyles() {
    return css/*css*/`${componentStyles}`;
  }

  @ready()
  async init() {
    if (this.mode === 'camera') {
      await this.startCamera();
    }
  }

  @dispose()
  cleanup() {
    this.stopCamera();
  }

  @render()
  template() {
    return html`
      <div class="ca-layout">
        <div class="ca-main">
          <div class="ca-canvas-area">
            <video
              class="ca-video mirror ${this.mode === 'annotate' ? 'hidden' : ''}"
              autoplay
              playsinline
              muted>
            </video>
            <canvas
              class="ca-draw-canvas ${this.mode === 'camera' ? 'hidden' : ''}"
              @pointerdown=${this.handlePointerDown}
              @pointermove=${this.handlePointerMove}
              @pointerup=${this.handlePointerUp}>
            </canvas>
          </div>
          ${this.renderToolbar()}
        </div>
        <div class="ca-sidebar ${this.showLabelsPanel ? '' : 'hidden'}">
          ${this.renderSidebar()}
        </div>
      </div>
    `;
  }

  private renderToolbar() {
    const inCamera = this.mode === 'camera';

    return html`
      <div class="ca-toolbar">
        <button class="ca-btn primary" @click=${inCamera ? this.capture : this.retake}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${inCamera
              ? html`<path d="M9 2L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H17L15 2H9Z"/><circle cx="12" cy="13" r="3"/>`
              : html`<path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>`
            }
          </svg>
          ${inCamera ? 'Capture' : 'Retake'}
        </button>

        <if value=${!inCamera}>
          <div class="ca-separator"></div>
          <div class="ca-toolbar-group">
            <button class="ca-btn small" @click=${this.undoStroke} title="Undo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
            <button class="ca-btn small danger" @click=${this.clearAnnotations} title="Clear all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>
          </div>
          <div class="ca-separator"></div>
          <label class="ca-toolbar-group" style="font-size:0.75rem;color:var(--ca-text-secondary);">
            Width:
            <input
              type="number"
              class="ca-stroke-width"
              min="1"
              max="20"
              .value="${String(this.strokeWidth)}"
              @change=${this.handleStrokeWidthChange}
            />
          </label>
          <div class="ca-separator"></div>
          <button class="ca-btn small" @click=${this.handleExportImage} title="Export image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </if>
      </div>
    `;
  }

  private renderSidebar() {
    return html`
      <div class="ca-sidebar-header">
        <span class="ca-sidebar-title">Annotations</span>
        <div class="ca-toolbar-group">
          <button class="ca-icon-btn" @click=${this.toggleAllAnnotations} title="Toggle all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="ca-color-section">
        <div class="ca-color-palette">
          ${PRESET_COLORS.map(color => html`
            <div
              class="ca-color-swatch ${this.activeColor === color ? 'active' : ''}"
              style="background-color: ${color}"
              @click=${() => this.selectColor(color)}
              title="${color}">
            </div>
          `)}
        </div>
        <label class="ca-auto-rotate">
          <input
            type="checkbox"
            ?checked=${this.autoRotateColors}
            @change=${this.handleAutoRotateChange}
          />
          Auto Rotate Colors
        </label>
      </div>

      <div class="ca-annotation-list">
        ${this.annotations.length === 0
          ? html`<div class="ca-empty-state">Draw on the image to create annotations</div>`
          : this.annotations.map(ann => this.renderAnnotationItem(ann))
        }
      </div>
    `;
  }

  private renderAnnotationItem(ann: Annotation) {
    const isHighlighted = this.highlightedAnnotationId === ann.id;
    return html`
      <div
        class="ca-annotation-item ${isHighlighted ? 'highlighted' : ''}"
        @mouseenter=${() => this.highlightAnnotation(ann.id)}
        @mouseleave=${() => this.unhighlightAnnotation()}>
        <div class="ca-annotation-color" style="background-color: ${ann.color}"></div>
        <div class="ca-annotation-label">
          <input
            type="text"
            placeholder="Add label..."
            .value="${ann.label}"
            @input=${(e: Event) => this.updateAnnotationLabel(ann.id, (e.target as HTMLInputElement).value)}
          />
        </div>
        <div class="ca-annotation-actions">
          <button
            class="ca-icon-btn ${ann.visible ? '' : 'hidden-state'}"
            @click=${() => this.toggleAnnotationVisibility(ann.id)}
            title="${ann.visible ? 'Hide' : 'Show'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${ann.visible
                ? html`<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
                : html`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
              }
            </svg>
          </button>
          <button
            class="ca-icon-btn"
            @click=${() => this.deleteAnnotation(ann.id)}
            title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // --- Camera ---

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this.videoEl.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  // --- Capture ---

  async capture(): Promise<void> {
    if (!this.videoEl) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.videoEl.videoWidth || 640;
    tempCanvas.height = this.videoEl.videoHeight || 480;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Mirror for user-facing camera
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(this.videoEl, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);

    this.capturedImageData = tempCanvas.toDataURL('image/jpeg', 0.92);
    this.imageWidth = tempCanvas.width;
    this.imageHeight = tempCanvas.height;

    // Load as image for drawing
    this.capturedImage = new Image();
    this.capturedImage.src = this.capturedImageData;
    await new Promise<void>(resolve => {
      this.capturedImage!.onload = () => resolve();
    });

    this.stopCamera();
    this.mode = 'annotate';

    // Init canvas after mode switch renders it
    requestAnimationFrame(() => {
      this.initDrawCanvas();
      this.emitCapture();
    });
  }

  private retake(): void {
    this.strokes = [];
    this.annotations = [];
    this.capturedImageData = '';
    this.capturedImage = null;
    this.highlightedAnnotationId = null;
    this.colorIndex = 0;
    this.activeColor = PRESET_COLORS[0];
    this.mode = 'camera';
    requestAnimationFrame(() => this.startCamera());
  }

  // --- Drawing ---

  private initDrawCanvas(): void {
    const canvas = this.drawCanvas;
    if (!canvas || !this.capturedImage) return;

    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    this.ctx = canvas.getContext('2d');
    this.redrawCanvas();
  }

  private getCanvasPoint(e: PointerEvent): { x: number; y: number } {
    const canvas = this.drawCanvas;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.mode !== 'annotate') return;
    e.preventDefault();
    this.isDrawing = true;
    this.currentPoints = [this.getCanvasPoint(e)];
    this.drawCanvas?.setPointerCapture(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    const point = this.getCanvasPoint(e);
    this.currentPoints.push(point);
    this.redrawCanvas();
    this.drawCurrentStroke();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    this.isDrawing = false;
    this.drawCanvas?.releasePointerCapture(e.pointerId);

    if (this.currentPoints.length < 2) {
      this.currentPoints = [];
      return;
    }

    const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const stroke: AnnotationStroke = {
      id: strokeId,
      color: this.activeColor,
      width: this.strokeWidth,
      points: [...this.currentPoints],
      timestamp: Date.now()
    };
    this.strokes.push(stroke);

    const annotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strokeId,
      label: '',
      color: this.activeColor,
      visible: true,
      timestamp: Date.now()
    };
    this.annotations.push(annotation);

    this.currentPoints = [];

    // Auto rotate color
    if (this.autoRotateColors) {
      this.colorIndex = (this.colorIndex + 1) % PRESET_COLORS.length;
      this.activeColor = PRESET_COLORS[this.colorIndex];
    }

    this.redrawCanvas();
    this.emitAnnotate(annotation);
    this.emitAnnotationChange();
  }

  private drawCurrentStroke(): void {
    if (!this.ctx || this.currentPoints.length < 2) return;

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.activeColor;
    this.ctx.lineWidth = this.strokeWidth * 2;

    this.ctx.beginPath();
    this.ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);

    for (let i = 1; i < this.currentPoints.length; i++) {
      const prev = this.currentPoints[i - 1];
      const curr = this.currentPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    const last = this.currentPoints[this.currentPoints.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();
  }

  private redrawCanvas(): void {
    if (!this.ctx || !this.capturedImage) return;

    this.ctx.clearRect(0, 0, this.imageWidth, this.imageHeight);
    this.ctx.drawImage(this.capturedImage, 0, 0, this.imageWidth, this.imageHeight);

    for (const stroke of this.strokes) {
      const ann = this.annotations.find(a => a.strokeId === stroke.id);
      if (ann && !ann.visible) continue;

      this.ctx.save();

      // Apply highlight/dim effect
      if (this.highlightedAnnotationId !== null) {
        const isHighlighted = ann && ann.id === this.highlightedAnnotationId;
        if (!isHighlighted) {
          this.ctx.globalAlpha = 0.2;
          this.ctx.filter = 'grayscale(1)';
        }
      }

      this.drawStroke(stroke);
      this.ctx.restore();
    }
  }

  private drawStroke(stroke: AnnotationStroke): void {
    if (!this.ctx || stroke.points.length === 0) return;

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width * 2;

    if (stroke.points.length === 1) {
      this.ctx.beginPath();
      this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width, 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.color;
      this.ctx.fill();
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    const last = stroke.points[stroke.points.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();
  }

  // --- Annotation management ---

  private selectColor(color: string): void {
    this.activeColor = color;
    this.colorIndex = PRESET_COLORS.indexOf(color);
  }

  private handleAutoRotateChange(e: Event): void {
    this.autoRotateColors = (e.target as HTMLInputElement).checked;
  }

  private handleStrokeWidthChange(e: Event): void {
    this.strokeWidth = Math.max(1, Math.min(20, parseInt((e.target as HTMLInputElement).value) || 3));
  }

  private updateAnnotationLabel(id: string, label: string): void {
    const ann = this.annotations.find(a => a.id === id);
    if (ann) {
      ann.label = label;
      this.emitAnnotationChange();
    }
  }

  private toggleAnnotationVisibility(id: string): void {
    const ann = this.annotations.find(a => a.id === id);
    if (ann) {
      ann.visible = !ann.visible;
      this.redrawCanvas();
      this.emitAnnotationChange();
    }
  }

  private toggleAllAnnotations(): void {
    const allVisible = this.annotations.every(a => a.visible);
    this.annotations.forEach(a => a.visible = !allVisible);
    this.redrawCanvas();
    this.emitAnnotationChange();
  }

  private deleteAnnotation(id: string): void {
    const ann = this.annotations.find(a => a.id === id);
    if (!ann) return;

    this.strokes = this.strokes.filter(s => s.id !== ann.strokeId);
    this.annotations = this.annotations.filter(a => a.id !== id);
    this.redrawCanvas();
    this.emitAnnotationChange();
  }

  private highlightAnnotation(id: string): void {
    this.highlightedAnnotationId = id;
    this.redrawCanvas();
  }

  private unhighlightAnnotation(): void {
    this.highlightedAnnotationId = null;
    this.redrawCanvas();
  }

  private undoStroke(): void {
    if (this.strokes.length === 0) return;
    const lastStroke = this.strokes.pop()!;
    this.annotations = this.annotations.filter(a => a.strokeId !== lastStroke.id);
    this.redrawCanvas();
    this.emitAnnotationChange();
  }

  private handleExportImage(): void {
    const dataURL = this.exportImage();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `annotated-${Date.now()}.png`;
    a.click();
  }

  // --- Public API ---

  exportImage(options?: { includeLabels?: boolean }): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    const ctx = canvas.getContext('2d')!;

    // Draw base image
    if (this.capturedImage) {
      ctx.drawImage(this.capturedImage, 0, 0, this.imageWidth, this.imageHeight);
    }

    // Draw visible strokes
    for (const stroke of this.strokes) {
      const ann = this.annotations.find(a => a.strokeId === stroke.id);
      if (ann && !ann.visible) continue;
      this.drawStrokeOnCtx(ctx, stroke);
    }

    // Optionally draw labels
    if (options?.includeLabels) {
      for (const ann of this.annotations) {
        if (!ann.visible || !ann.label) continue;
        const stroke = this.strokes.find(s => s.id === ann.strokeId);
        if (!stroke || stroke.points.length === 0) continue;

        // Position label near stroke center
        let cx = 0, cy = 0;
        for (const p of stroke.points) { cx += p.x; cy += p.y; }
        cx /= stroke.points.length;
        cy /= stroke.points.length;

        ctx.font = `${Math.max(14, this.imageWidth / 60)}px sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeText(ann.label, cx, cy - 10);
        ctx.fillText(ann.label, cx, cy - 10);
      }
    }

    return canvas.toDataURL('image/png');
  }

  private drawStrokeOnCtx(ctx: CanvasRenderingContext2D, stroke: AnnotationStroke): void {
    if (stroke.points.length === 0) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * 2;

    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  exportAnnotations(): AnnotationData {
    return {
      annotations: this.annotations.map(a => ({ ...a })),
      strokes: this.strokes.map(s => ({
        ...s,
        points: s.points.map(p => ({ ...p }))
      })),
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight
    };
  }

  importAnnotations(data: AnnotationData): void {
    this.annotations = data.annotations.map(a => ({ ...a }));
    this.strokes = data.strokes.map(s => ({
      ...s,
      points: s.points.map(p => ({ ...p }))
    }));
    this.imageWidth = data.imageWidth;
    this.imageHeight = data.imageHeight;
    this.redrawCanvas();
    this.emitAnnotationChange();
  }

  clearAnnotations(): void {
    this.strokes = [];
    this.annotations = [];
    this.highlightedAnnotationId = null;
    this.colorIndex = 0;
    this.activeColor = PRESET_COLORS[0];
    this.redrawCanvas();
    this.emitAnnotationChange();
  }

  @watch('mode')
  handleModeChange() {
    if (this.mode === 'annotate' && this.capturedImage) {
      requestAnimationFrame(() => this.initDrawCanvas());
    }
  }

  // --- Events ---

  @dispatch('capture', { bubbles: true, composed: true })
  private emitCapture() {
    return {
      dataURL: this.capturedImageData,
      width: this.imageWidth,
      height: this.imageHeight
    };
  }

  @dispatch('annotate', { bubbles: true, composed: true })
  private emitAnnotate(annotation: Annotation) {
    return { annotation };
  }

  @dispatch('annotation-change', { bubbles: true, composed: true })
  private emitAnnotationChange() {
    return { annotations: this.annotations.map(a => ({ ...a })) };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-camera-annotate': SniceCameraAnnotate;
  }
}
