import { element, property, render, styles, query, ready, html, css } from 'snice';
import type { QRCodeErrorCorrectionLevel, QRCodeRenderMode, SniceQRCodeElement } from './snice-qr-code.types';
import qrCodeStyles from './snice-qr-code.css?inline';
import { QRCode } from '../../src/lib/qrcode';

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

  @property({ type: String, attribute: 'center-text-color' })
  centerTextColor: string = '#000000';

  @property({ type: String, attribute: 'center-text-bg' })
  centerTextBg: string = '#ffffff';

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

    return html`
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
      useSVG: this.renderMode === 'svg'
    } as any);

    // Apply overlays after QR code is rendered
    requestAnimationFrame(() => {
      this.applyOverlays();
    });
  }

  private applyOverlays() {
    // Find the canvas element created by the library
    const canvas = this.container?.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center image overlay
    if (this.includeImage && this.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const imgSize = this.imageSize;
        const imgX = (this.size - imgSize) / 2;
        const imgY = (this.size - imgSize) / 2;

        // Draw background for image
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(imgX - 4, imgY - 4, imgSize + 8, imgSize + 8);
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);

        // Apply center text after image if both are present
        if (this.centerText) {
          this.drawCenterText(ctx);
        }
      };
      img.src = this.imageUrl;
    } else if (this.centerText) {
      // Center text overlay only
      this.drawCenterText(ctx);
    }
  }

  private drawCenterText(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.centerTextSize}px sans-serif`;
    const textMetrics = ctx.measureText(this.centerText);
    const textWidth = textMetrics.width;
    const textHeight = this.centerTextSize;

    const padding = 8;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;
    const bgX = (this.size - bgWidth) / 2;
    const bgY = (this.size - bgHeight) / 2;

    // Background
    ctx.fillStyle = this.centerTextBg;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

    // Text
    ctx.fillStyle = this.centerTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.centerText, this.size / 2, this.size / 2);
  }

  async toDataURL(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): Promise<string> {
    const canvas = this.container?.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return '';
    return canvas.toDataURL(type, quality);
  }

  async toBlob(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): Promise<Blob> {
    const dataURL = await this.toDataURL(type, quality);
    const response = await fetch(dataURL);
    return response.blob();
  }

  async download(filename: string = 'qr-code.png'): Promise<void> {
    const dataURL = await this.toDataURL();
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
