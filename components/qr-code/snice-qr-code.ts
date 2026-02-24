import { element, property, render, styles, query, ready, html, css } from 'snice';
import type { QRCodeErrorCorrectionLevel, QRCodeRenderMode, QRCodeDotStyle, SniceQRCodeElement } from './snice-qr-code.types';
import qrCodeStyles from './snice-qr-code.css?inline';
import { QRCode } from './qrcode';

@element('snice-qr-code')
export class SniceQRCode extends HTMLElement implements SniceQRCodeElement {
  @property({ type: String })
  value: string = '';

  @property({ type: Number })
  size: number = 200;

  @property({ type: String, attribute: 'error-correction-level' })
  errorCorrectionLevel: QRCodeErrorCorrectionLevel = 'M';

  @property({ type: String, attribute: 'render-mode' })
  renderMode: QRCodeRenderMode = 'canvas';

  @property({ type: String, attribute: 'dot-style' })
  dotStyle: QRCodeDotStyle = 'square';

  @property({ type: Number })
  margin: number = 4;

  @property({ type: String, attribute: 'fg-color' })
  fgColor: string = '#000000';

  @property({ type: String, attribute: 'bg-color' })
  bgColor: string = '#ffffff';

  @property({ type: Boolean, attribute: 'include-image' })
  includeImage: boolean = false;

  @property({ type: String, attribute: 'image-url' })
  imageUrl: string = '';

  @property({ type: Number, attribute: 'image-size' })
  imageSize: number = 40;

  @property({ type: String, attribute: 'center-text' })
  centerText: string = '';

  @property({ type: Number, attribute: 'center-text-size' })
  centerTextSize: number = 16;

  @property({ type: String, attribute: 'text-fill-color' })
  textFillColor: string = '#000000';

  @property({ type: String, attribute: 'text-outline-color' })
  textOutlineColor: string = '#ffffff';

  @query('.qr-container')
  private container?: HTMLElement;

  @query('canvas')
  private canvas?: HTMLCanvasElement;

  private qrCode: QRCode | null = null;

  @styles()
  styles() {
    return css/*css*/`${qrCodeStyles}`;
  }

  @ready()
  ready() {
    if (this.value) {
      this.generateQRCode();
    }
  }

  @render()
  render() {
    // Trigger QR code generation after render
    if (this.value) {
      requestAnimationFrame(() => {
        this.generateQRCode();
      });
    }

    return html/*html*/`
      <div class="qr-container"></div>
    `;
  }

  private generateQRCode() {
    if (!this.value || !this.container) return;

    // Clear previous QR code
    if (this.qrCode) {
      this.qrCode.clear();
    }

    // Clear container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Map error correction level
    const ecLevel = this.errorCorrectionLevel;
    const correctLevel = QRCode.CorrectLevel[ecLevel];

    // Create QR code using the library
    this.qrCode = new QRCode(this.container, {
      text: this.value,
      width: this.size,
      height: this.size,
      colorDark: this.fgColor,
      colorLight: this.bgColor,
      correctLevel: correctLevel,
      useSVG: this.renderMode === 'svg',
      dotStyle: this.dotStyle,
      margin: this.margin
    } as any);

    // Apply overlays after QR code is rendered
    requestAnimationFrame(() => {
      this.applyOverlays();
    });
  }

  private applyOverlays() {
    const svg = this.container?.querySelector('svg');
    if (svg) {
      this.applySvgOverlays(svg);
      return;
    }

    const canvas = this.container?.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    let ctx;
    try {
      ctx = canvas.getContext('2d');
    } catch (e) {
      return;
    }
    if (!ctx) return;

    // Apply quiet zone margin by re-drawing canvas content inset
    const m = this.margin;
    if (m > 0) {
      const s = this.size;
      const inner = s - m * 2;
      const imgData = ctx.getImageData(0, 0, s, s);
      const off = document.createElement('canvas');
      off.width = s;
      off.height = s;
      off.getContext('2d')!.putImageData(imgData, 0, 0);
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, s, s);
      ctx.drawImage(off, 0, 0, s, s, m, m, inner, inner);
    }

    // Center image overlay
    if (this.includeImage && this.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const imgSize = this.imageSize;
        const imgX = (this.size - imgSize) / 2;
        const imgY = (this.size - imgSize) / 2;
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        if (this.centerText) {
          this.drawCenterText(ctx);
        }
      };
      img.src = this.imageUrl;
    } else if (this.centerText) {
      this.drawCenterText(ctx);
    }
  }

  private applySvgOverlays(svg: SVGElement) {
    // Get viewBox dimensions to position overlays in SVG coordinate space
    const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) || [];
    const vbSize = vb[2] || 100;
    const center = vbSize / 2;

    // Scale factor: SVG viewBox units per pixel
    const scale = vbSize / this.size;

    // Center image overlay
    if (this.includeImage && this.imageUrl) {
      const imgSize = this.imageSize * scale;
      const imgX = center - imgSize / 2;
      const imgY = center - imgSize / 2;

      // Convert image to data URL for embedding in SVG
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw to temp canvas to get data URL
        const off = document.createElement('canvas');
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        off.getContext('2d')!.drawImage(img, 0, 0);
        const dataUrl = off.toDataURL('image/png');

        const svgImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        svgImg.setAttribute('x', String(imgX));
        svgImg.setAttribute('y', String(imgY));
        svgImg.setAttribute('width', String(imgSize));
        svgImg.setAttribute('height', String(imgSize));
        svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
        svg.appendChild(svgImg);

        if (this.centerText) {
          this.drawSvgCenterText(svg, center, scale);
        }
      };
      img.src = this.imageUrl;
    } else if (this.centerText) {
      this.drawSvgCenterText(svg, center, scale);
    }
  }

  private drawSvgCenterText(svg: SVGElement, center: number, scale: number) {
    const fontSize = this.centerTextSize * scale;
    const strokeWidth = 6 * scale;

    // Outline text
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    outline.setAttribute('x', String(center));
    outline.setAttribute('y', String(center));
    outline.setAttribute('text-anchor', 'middle');
    outline.setAttribute('dominant-baseline', 'central');
    outline.setAttribute('font-size', String(fontSize));
    outline.setAttribute('font-weight', 'bold');
    outline.setAttribute('font-family', 'sans-serif');
    outline.setAttribute('stroke', this.textOutlineColor);
    outline.setAttribute('stroke-width', String(strokeWidth));
    outline.setAttribute('stroke-linejoin', 'round');
    outline.setAttribute('fill', this.textOutlineColor);
    outline.textContent = this.centerText;
    svg.appendChild(outline);

    // Fill text
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fill.setAttribute('x', String(center));
    fill.setAttribute('y', String(center));
    fill.setAttribute('text-anchor', 'middle');
    fill.setAttribute('dominant-baseline', 'central');
    fill.setAttribute('font-size', String(fontSize));
    fill.setAttribute('font-weight', 'bold');
    fill.setAttribute('font-family', 'sans-serif');
    fill.setAttribute('fill', this.textFillColor);
    fill.textContent = this.centerText;
    svg.appendChild(fill);
  }

  private drawCenterText(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.centerTextSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = this.size / 2;
    const y = this.size / 2;

    ctx.strokeStyle = this.textOutlineColor;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(this.centerText, x, y);

    ctx.fillStyle = this.textFillColor;
    ctx.fillText(this.centerText, x, y);
  }

  toSVGString(): string {
    const svg = this.container?.querySelector('svg');
    if (!svg) return '';
    return new XMLSerializer().serializeToString(svg);
  }

  async toDataURL(type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml' = 'image/png', quality: number = 0.92): Promise<string> {
    // SVG export
    if (type === 'image/svg+xml') {
      const svgStr = this.toSVGString();
      if (!svgStr) return '';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    }

    // Canvas export (rasterize SVG if in SVG mode)
    const canvas = this.container?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) return canvas.toDataURL(type, quality);

    // SVG mode but raster export requested — rasterize to canvas
    const svg = this.container?.querySelector('svg');
    if (!svg) return '';
    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    return new Promise<string>((resolve) => {
      img.onload = () => {
        const off = document.createElement('canvas');
        off.width = this.size;
        off.height = this.size;
        off.getContext('2d')!.drawImage(img, 0, 0, this.size, this.size);
        URL.revokeObjectURL(url);
        resolve(off.toDataURL(type, quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }

  async toBlob(type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml' = 'image/png', quality: number = 0.92): Promise<Blob> {
    if (type === 'image/svg+xml') {
      const svgStr = this.toSVGString();
      return new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    }
    const dataURL = await this.toDataURL(type, quality);
    const response = await fetch(dataURL);
    return response.blob();
  }

  async download(filename: string = 'qr-code.png'): Promise<void> {
    const isSvg = filename.endsWith('.svg');
    const dataURL = await this.toDataURL(isSvg ? 'image/svg+xml' : 'image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    a.click();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-qr-code': SniceQRCode;
  }
}
