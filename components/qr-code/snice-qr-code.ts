import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { QRCodeErrorCorrectionLevel, QRCodeRenderMode, SniceQRCodeElement } from './snice-qr-code.types';
import qrCodeStyles from './snice-qr-code.css?inline';

// Simplified QR Code generator
// Note: In production, use a library like 'qrcode' for full QR code support
class SimpleQRGenerator {
  private size: number = 21;
  private matrix: boolean[][] = [];

  generate(text: string): boolean[][] {
    // Determine size based on text length
    const length = text.length;
    if (length <= 25) this.size = 21;
    else if (length <= 47) this.size = 25;
    else if (length <= 77) this.size = 29;
    else this.size = 33;

    this.matrix = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    // Add finder patterns (corners)
    this.addFinderPattern(0, 0);
    this.addFinderPattern(this.size - 7, 0);
    this.addFinderPattern(0, this.size - 7);

    // Add timing patterns
    this.addTimingPatterns();

    // Encode data (simplified - just creates a pattern)
    this.encodeData(text);

    return this.matrix;
  }

  private addFinderPattern(row: number, col: number) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const r = row + i;
        const c = col + j;
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) continue;

        if (i === 0 || i === 6 || j === 0 || j === 6) {
          this.matrix[r][c] = true;
        } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
          this.matrix[r][c] = true;
        }
      }
    }
  }

  private addTimingPatterns() {
    for (let i = 8; i < this.size - 8; i++) {
      this.matrix[6][i] = i % 2 === 0;
      this.matrix[i][6] = i % 2 === 0;
    }
  }

  private encodeData(text: string) {
    // Simplified encoding - convert text to binary pattern
    const binary = text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');

    let bitIndex = 0;
    let up = true;

    for (let col = this.size - 1; col > 0; col -= 2) {
      if (col === 6) col--;

      for (let i = 0; i < this.size; i++) {
        const row = up ? this.size - 1 - i : i;

        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;

          if (this.isReserved(row, currentCol)) continue;

          if (bitIndex < binary.length) {
            this.matrix[row][currentCol] = binary[bitIndex] === '1';
            bitIndex++;
          }
        }
      }

      up = !up;
    }
  }

  private isReserved(row: number, col: number): boolean {
    // Check if position is reserved for finder patterns
    if ((row < 9 && col < 9) ||
        (row < 9 && col >= this.size - 8) ||
        (row >= this.size - 8 && col < 9)) {
      return true;
    }

    // Timing patterns
    if (row === 6 || col === 6) {
      return true;
    }

    return false;
  }

  getSize(): number {
    return this.size;
  }
}

@element('snice-qr-code')
export class SniceQRCode extends HTMLElement implements SniceQRCodeElement {
  @property({ type: String })
  value: string = '';

  @property({ type: Number })
  size: number = 200;

  @property({ type: String, attribute: 'error-correction-level' })
  errorCorrectionLevel: QRCodeErrorCorrectionLevel = 'M';

  @property({ type: String, attribute: 'render-mode' })
  renderMode: QRCodeRenderMode = 'svg';

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

  private qrMatrix: boolean[][] = [];
  private qrSize: number = 21;

  @styles()
  styles() {
    return css/*css*/`${qrCodeStyles}`;
  }

  @render()
  render() {
    if (this.value) {
      this.generateQRCode();
    }

    return html`
      <div class="qr-container">
        ${this.renderMode === 'svg' ? this.renderSVG() : this.renderCanvas()}
      </div>
    `;
  }

  private generateQRCode() {
    const generator = new SimpleQRGenerator();
    this.qrMatrix = generator.generate(this.value);
    this.qrSize = generator.getSize();
  }

  private renderSVG() {
    if (!this.qrMatrix.length) return html`<svg></svg>`;

    const cellSize = (this.size - this.margin * 2) / this.qrSize;
    const totalSize = this.size;

    const rects: any[] = [];
    this.qrMatrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          rects.push(html`
            <rect
              x="${this.margin + x * cellSize}"
              y="${this.margin + y * cellSize}"
              width="${cellSize}"
              height="${cellSize}"
              fill="${this.fgColor}" />
          `);
        }
      });
    });

    return html`
      <svg
        width="${totalSize}"
        height="${totalSize}"
        viewBox="0 0 ${totalSize} ${totalSize}"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="${totalSize}" height="${totalSize}" fill="${this.bgColor}" />
        ${rects}
        ${this.includeImage && this.imageUrl ? this.renderImage() : ''}
      </svg>
    `;
  }

  private renderCanvas() {
    if (!this.qrMatrix.length) return html`<canvas></canvas>`;

    setTimeout(() => {
      const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = this.size;
      canvas.height = this.size;

      const cellSize = (this.size - this.margin * 2) / this.qrSize;

      // Background
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, this.size, this.size);

      // QR modules
      ctx.fillStyle = this.fgColor;
      this.qrMatrix.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillRect(
              this.margin + x * cellSize,
              this.margin + y * cellSize,
              cellSize,
              cellSize
            );
          }
        });
      });

      // Image overlay
      if (this.includeImage && this.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const imgSize = this.imageSize;
          const imgX = (this.size - imgSize) / 2;
          const imgY = (this.size - imgSize) / 2;

          ctx.fillStyle = this.bgColor;
          ctx.fillRect(imgX - 4, imgY - 4, imgSize + 8, imgSize + 8);

          ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        };
        img.src = this.imageUrl;
      }
    }, 0);

    return html`<canvas width="${this.size}" height="${this.size}"></canvas>`;
  }

  private renderImage() {
    const imgSize = this.imageSize;
    const imgX = (this.size - imgSize) / 2;
    const imgY = (this.size - imgSize) / 2;

    return html`
      <rect
        x="${imgX - 4}"
        y="${imgY - 4}"
        width="${imgSize + 8}"
        height="${imgSize + 8}"
        fill="${this.bgColor}"
        rx="4" />
      <image
        x="${imgX}"
        y="${imgY}"
        width="${imgSize}"
        height="${imgSize}"
        href="${this.imageUrl}"
        style="border-radius: 4px;" />
    `;
  }

  async toDataURL(type: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png', quality: number = 0.92): Promise<string> {
    if (this.renderMode === 'svg') {
      // Convert SVG to canvas, then to data URL
      const svg = this.shadowRoot?.querySelector('svg');
      if (!svg) return '';

      const canvas = document.createElement('canvas');
      canvas.width = this.size;
      canvas.height = this.size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL(type, quality));
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      });
    } else {
      const canvas = this.shadowRoot?.querySelector('canvas');
      if (!canvas) return '';
      return canvas.toDataURL(type, quality);
    }
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
