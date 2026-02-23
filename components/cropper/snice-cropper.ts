import { element, property, query, dispatch, ready, render, styles, watch, html, css as cssTag } from 'snice';
import cssContent from './snice-cropper.css?inline';
import type { CropperOutputType, CropRect, SniceCropperElement } from './snice-cropper.types';

@element('snice-cropper')
export class SniceCropper extends HTMLElement implements SniceCropperElement {
  @property()
  src = '';

  @property({ type: Number, attribute: 'aspect-ratio' })
  aspectRatio = 0;

  @property({ type: Number, attribute: 'min-width' })
  minWidth = 20;

  @property({ type: Number, attribute: 'min-height' })
  minHeight = 20;

  @property({ attribute: 'output-type' })
  outputType: CropperOutputType = 'png';

  @query('.cropper')
  private container!: HTMLElement;

  @query('img')
  private img!: HTMLImageElement;

  @query('.crop-area')
  private cropAreaEl!: HTMLElement;

  private cropRect: CropRect = { x: 0, y: 0, width: 0, height: 0 };
  private rotation = 0;
  private zoomLevel = 1;
  private dragging: string | null = null;
  private dragStart = { x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 };

  @dispatch('crop-change', { bubbles: true, composed: true })
  private emitCropChange() {
    return { rect: { ...this.cropRect } };
  }

  @dispatch('crop-complete', { bubbles: true, composed: true })
  private emitCropComplete(blob: Blob | null) {
    return { blob };
  }

  @ready()
  init() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  @watch('src')
  onSrcChange() {
    this.rotation = 0;
    this.zoomLevel = 1;
    // Reset crop after image loads
    if (this.img) {
      this.img.onload = () => this.initCropArea();
    }
  }

  private initCropArea() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const padding = 20;
    let w = rect.width - padding * 2;
    let h = rect.height - padding * 2;

    if (this.aspectRatio > 0) {
      if (w / h > this.aspectRatio) {
        w = h * this.aspectRatio;
      } else {
        h = w / this.aspectRatio;
      }
    }

    this.cropRect = {
      x: (rect.width - w) / 2,
      y: (rect.height - h) / 2,
      width: w,
      height: h,
    };
    this.updateCropArea();
  }

  private updateCropArea() {
    if (!this.cropAreaEl) return;
    this.cropAreaEl.style.left = `${this.cropRect.x}px`;
    this.cropAreaEl.style.top = `${this.cropRect.y}px`;
    this.cropAreaEl.style.width = `${this.cropRect.width}px`;
    this.cropAreaEl.style.height = `${this.cropRect.height}px`;
  }

  private onCropAreaMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    this.dragging = target.classList.contains('crop-area') ? 'move' : target.dataset.handle || null;
    this.dragStart = {
      x: e.clientX,
      y: e.clientY,
      cropX: this.cropRect.x,
      cropY: this.cropRect.y,
      cropW: this.cropRect.width,
      cropH: this.cropRect.height,
    };
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging || !this.container) return;
    const bounds = this.container.getBoundingClientRect();
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;

    if (this.dragging === 'move') {
      this.cropRect.x = Math.max(0, Math.min(bounds.width - this.cropRect.width, this.dragStart.cropX + dx));
      this.cropRect.y = Math.max(0, Math.min(bounds.height - this.cropRect.height, this.dragStart.cropY + dy));
    } else {
      this.resizeCrop(this.dragging, dx, dy, bounds);
    }

    this.updateCropArea();
    this.emitCropChange();
  };

  private onMouseUp = () => {
    this.dragging = null;
  };

  private resizeCrop(handle: string, dx: number, dy: number, bounds: DOMRect) {
    let { x, y, width, height } = { x: this.dragStart.cropX, y: this.dragStart.cropY, width: this.dragStart.cropW, height: this.dragStart.cropH };

    if (handle.includes('e')) width = Math.max(this.minWidth, width + dx);
    if (handle.includes('w')) { width = Math.max(this.minWidth, width - dx); x = this.dragStart.cropX + this.dragStart.cropW - width; }
    if (handle.includes('s')) height = Math.max(this.minHeight, height + dy);
    if (handle.includes('n')) { height = Math.max(this.minHeight, height - dy); y = this.dragStart.cropY + this.dragStart.cropH - height; }

    if (this.aspectRatio > 0) {
      if (handle.includes('e') || handle.includes('w')) {
        height = width / this.aspectRatio;
      } else {
        width = height * this.aspectRatio;
      }
    }

    // Clamp to container
    x = Math.max(0, x);
    y = Math.max(0, y);
    width = Math.min(width, bounds.width - x);
    height = Math.min(height, bounds.height - y);

    this.cropRect = { x, y, width, height };
  }

  async crop(): Promise<Blob | null> {
    if (!this.img || !this.container) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const containerRect = this.container.getBoundingClientRect();
    const imgRect = this.img.getBoundingClientRect();

    const scaleX = this.img.naturalWidth / imgRect.width;
    const scaleY = this.img.naturalHeight / imgRect.height;

    const sourceX = (this.cropRect.x - (imgRect.left - containerRect.left)) * scaleX;
    const sourceY = (this.cropRect.y - (imgRect.top - containerRect.top)) * scaleY;
    const sourceW = this.cropRect.width * scaleX;
    const sourceH = this.cropRect.height * scaleY;

    canvas.width = sourceW;
    canvas.height = sourceH;

    ctx.save();
    if (this.rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    ctx.drawImage(this.img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
    ctx.restore();

    const mimeType = `image/${this.outputType}`;
    return new Promise((resolve) => canvas.toBlob((blob) => {
      this.emitCropComplete(blob);
      resolve(blob);
    }, mimeType));
  }

  rotate(degrees: number) {
    this.rotation = (this.rotation + degrees) % 360;
    if (this.img) {
      this.img.style.transform = `scale(${this.zoomLevel}) rotate(${this.rotation}deg)`;
    }
  }

  reset() {
    this.rotation = 0;
    this.zoomLevel = 1;
    if (this.img) {
      this.img.style.transform = '';
    }
    this.initCropArea();
  }

  zoom(level: number) {
    this.zoomLevel = Math.max(0.1, Math.min(10, level));
    if (this.img) {
      this.img.style.transform = `scale(${this.zoomLevel}) rotate(${this.rotation}deg)`;
    }
  }

  @render()
  template() {
    return html`
      <div class="cropper">
        <div class="image-container">
          <img src="${this.src}" alt="Image to crop" @load=${() => this.initCropArea()} />
        </div>
        <div class="crop-area"
             @mousedown=${this.onCropAreaMouseDown}>
          <span class="handle handle-nw" data-handle="nw" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-ne" data-handle="ne" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-sw" data-handle="sw" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-se" data-handle="se" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-n" data-handle="n" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-s" data-handle="s" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-w" data-handle="w" @mousedown=${this.onCropAreaMouseDown}></span>
          <span class="handle handle-e" data-handle="e" @mousedown=${this.onCropAreaMouseDown}></span>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
