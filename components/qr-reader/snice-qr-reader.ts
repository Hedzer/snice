import { element, property, render, styles, query, dispatch, ready, dispose, html, css } from 'snice';
import type { CameraMode, QRScanResult, SniceQRReaderElement } from './snice-qr-reader.types';
import readerStyles from './snice-qr-reader.css?inline';
import { QRCodeDecoder } from './qr-decoder';

@element('snice-qr-reader')
export class SniceQRReader extends HTMLElement implements SniceQRReaderElement {
  @property({ type: Boolean, attribute: 'auto-start' })
  autoStart: boolean = false;

  @property({ type: String })
  camera: CameraMode = 'back';

  @property({ type: Boolean, attribute: 'pick-first' })
  pickFirst: boolean = false;

  @property({ type: Boolean, attribute: 'manual-snap' })
  manualSnap: boolean = false;

  @property({ type: Number, attribute: 'scan-speed' })
  scanSpeed: number = 3;

  @property({ type: Boolean, attribute: 'tap-start' })
  tapStart: boolean = false;

  @property({ type: Boolean })
  private scanning: boolean = false;

  @property({ type: String })
  private lastScan: string = '';

  @property({ type: String })
  private errorMessage: string = '';

  @property({ type: Boolean })
  private showSnapshot: boolean = false;

  @query('video')
  private video!: HTMLVideoElement;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private stream: MediaStream | null = null;
  private scanFrame: number | null = null;
  private qrDecoder: QRCodeDecoder | null = null;
  private frameCount: number = 0;
  private isDecoding: boolean = false;

  @styles()
  styles() {
    return css/*css*/`${readerStyles}`;
  }

  @ready()
  async init() {
    // Use main thread decoder (Workers with ES6 modules in Blobs have compatibility issues)
    try {
      this.qrDecoder = new QRCodeDecoder();
      console.log('QR decoder initialized (main thread)');
    } catch (e) {
      console.error('QR decoder initialization failed:', e);
      this.errorMessage = 'Failed to initialize QR decoder';
    }

    if (this.autoStart) {
      await this.start();
    }
  }

  @dispose()
  cleanup() {
    this.stop();
  }

  @render()
  render() {
    return html/*html*/`
      <div class="qr-reader-container">
        <div class="qr-reader-viewport" @click=${this.tapStart ? () => this.handleTap() : null}>
          <video autoplay playsinline muted style="${this.showSnapshot ? 'display: none;' : ''}"></video>
          <canvas style="${this.showSnapshot ? '' : 'display: none;'}"></canvas>

          <if ${!this.scanning && !this.errorMessage}>
            <div class="qr-reader-overlay">
              <div class="qr-reader-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <p>Click start to ${this.manualSnap ? 'open camera' : 'scan QR code'}</p>
              </div>
            </div>
          </if>

          <if ${this.scanning && !this.manualSnap}>
            <div class="qr-reader-corners">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
          </if>

          <if ${this.lastScan}>
            <div class="qr-reader-result">
              <strong>Scanned:</strong> ${this.lastScan}
            </div>
          </if>

          <if ${this.errorMessage}>
            <div class="qr-reader-error">${this.errorMessage}</div>
          </if>
        </div>

        <div class="qr-reader-controls">
          <if ${!this.scanning}>
            <button class="qr-btn start" @click=${() => this.start()} title="${this.manualSnap ? 'Open Camera' : 'Start Scanning'}">
              <if ${this.manualSnap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </if>
              <if ${!this.manualSnap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <!-- Scan brackets -->
                  <path d="M2 7V3h4M22 7V3h-4M2 17v4h4M22 17v4h-4"></path>
                  <!-- QR code pattern -->
                  <rect x="7" y="7" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
                  <rect x="8" y="8" width="2" height="2" fill="currentColor"></rect>
                  <rect x="13" y="7" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
                  <rect x="14" y="8" width="2" height="2" fill="currentColor"></rect>
                  <rect x="7" y="13" width="4" height="4" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
                  <rect x="8" y="14" width="2" height="2" fill="currentColor"></rect>
                  <!-- Pattern dots -->
                  <rect x="13" y="13" width="1.5" height="1.5" fill="currentColor"></rect>
                  <rect x="15.5" y="13" width="1.5" height="1.5" fill="currentColor"></rect>
                  <rect x="13" y="15.5" width="1.5" height="1.5" fill="currentColor"></rect>
                  <rect x="15.5" y="15.5" width="1.5" height="1.5" fill="currentColor"></rect>
                </svg>
              </if>
            </button>
          </if>
          <if ${this.scanning && !this.manualSnap}>
            <button class="qr-btn stop" @click=${() => this.stop()} title="Stop Scanning">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12"></rect>
              </svg>
            </button>
          </if>
          <if ${this.scanning && this.manualSnap}>
            <button class="qr-btn" @click=${() => this.snap()} title="Take Snapshot">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
              </svg>
            </button>
          </if>
          <button class="qr-btn switch" @click=${() => this.switchCamera()} title="Switch Camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 3v6h6M19 21v-6h-6"/>
              <path d="M3 13a8 8 0 0 1 11-7.5M21 11a8 8 0 0 1-11 7.5"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  async start(): Promise<void> {
    try {
      this.errorMessage = '';

      const constraints = {
        video: {
          facingMode: this.camera === 'back' ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      await this.video.play();

      this.scanning = true;
      this.emitCameraReady();
      this.startScanning();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Camera access denied';
      this.emitCameraError(error);
    }
  }

  stop(): void {
    this.scanning = false;
    this.showSnapshot = false;
    this.isDecoding = false;

    if (this.scanFrame !== null) {
      cancelAnimationFrame(this.scanFrame);
      this.scanFrame = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  async scanImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        img.onload = async () => {
          try {
            const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const result = await this.detectQRCode();
            if (result) {
              resolve(result);
            } else {
              reject(new Error('No QR code found in image'));
            }
          } catch (error) {
            reject(error);
          }
        };
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  switchCamera(): void {
    const wasScanning = this.scanning;
    this.stop();
    this.camera = this.camera === 'back' ? 'front' : 'back';

    if (wasScanning) {
      setTimeout(() => this.start(), 100);
    }
  }

  private handleTap(): void {
    if (this.scanning) {
      this.stop();
    } else {
      this.start();
    }
  }

  private startScanning(): void {
    if (!this.scanning) return;

    // Manual snap mode: don't start continuous scanning
    if (this.manualSnap) {
      console.log('Manual snap mode - not starting continuous scan');
      return;
    }

    this.frameCount = 0;
    // pickFirst: scan every frame (max speed) until hit, then stop
    // normal: scan based on scanSpeed continuously
    const framesToSkip = this.pickFirst ? 1 : Math.max(1, 10 - this.scanSpeed);
    console.log('Starting scan loop, pickFirst:', this.pickFirst, 'framesToSkip:', framesToSkip);

    const scan = async () => {
      if (!this.scanning || !this.video.readyState) {
        return;
      }

      this.frameCount++;

      // Scan based on speed throttling
      if (this.frameCount % framesToSkip === 0) {
        // Skip if already decoding (prevent concurrent decodes)
        if (!this.isDecoding) {
          this.isDecoding = true;
          try {
            const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            ctx.drawImage(this.video, 0, 0);

            const result = await this.detectQRCode();

            if (result && result !== this.lastScan) {
              console.log('QR DETECTED:', result, 'pickFirst:', this.pickFirst);
              this.lastScan = result;
              this.emitQRScan({ data: result, timestamp: Date.now() });

              // Stop if pickFirst - shut down camera
              if (this.pickFirst) {
                console.log('pickFirst - stopping scanner');
                this.stop();
                this.isDecoding = false;
                return;
              }
            }
          } catch (error) {
            console.error('Scan error:', error);
          } finally {
            this.isDecoding = false;
          }
        }
      }

      this.scanFrame = requestAnimationFrame(scan);
    };

    scan();
  }

  async snap(): Promise<string | null> {
    console.log('Snap called, video ready:', this.video?.readyState, 'isDecoding:', this.isDecoding);

    if (!this.video || !this.video.readyState) {
      throw new Error('Camera not ready');
    }

    if (this.isDecoding) {
      console.log('Already decoding, skipping snap');
      return null; // Already processing
    }

    this.isDecoding = true;
    console.log('Starting continuous snap capture over 5 seconds');

    try {
      const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      // Capture and show first frame
      ctx.drawImage(this.video, 0, 0);
      this.showSnapshot = true;

      console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);

      // Capture continuously over 5 seconds
      // Try every ~100ms for 5 seconds = ~50 attempts
      const startTime = Date.now();
      const duration = 5000; // 5 seconds
      const interval = 100; // Try every 100ms
      let attempts = 0;

      while (Date.now() - startTime < duration) {
        attempts++;

        // Capture current frame
        ctx.drawImage(this.video, 0, 0);

        const result = await this.detectQRCode();

        if (result) {
          console.log(`QR found on attempt ${attempts} at ${Date.now() - startTime}ms:`, result);
          this.lastScan = result;
          this.emitQRScan({ data: result, timestamp: Date.now() });

          // Hide snapshot after showing success
          setTimeout(() => {
            this.showSnapshot = false;
          }, 1000);

          return result;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      console.log(`No QR code found in ${attempts} attempts over 5 seconds`);

      // Hide snapshot after showing failure
      setTimeout(() => {
        this.showSnapshot = false;
      }, 1000);

      return null;
    } finally {
      this.isDecoding = false;
      console.log('Snap decode finished');
    }
  }

  private async detectQRCode(): Promise<string | null> {
    if (!this.qrDecoder) return null;

    try {
      const result = await this.qrDecoder.decode(this.canvas);
      return result.text;
    } catch (e) {
      return null;
    }
  }

  @dispatch('qr-scan', { bubbles: true, composed: true })
  private emitQRScan(result: QRScanResult) {
    return { reader: this, ...result };
  }

  @dispatch('qr-error', { bubbles: true, composed: true })
  private emitQRError(error: any) {
    return { reader: this, error };
  }

  @dispatch('@snice/camera-ready', { bubbles: true, composed: true })
  private emitCameraReady() {
    return { reader: this };
  }

  @dispatch('camera-error', { bubbles: true, composed: true })
  private emitCameraError(error: any) {
    return { reader: this, error };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-qr-reader': SniceQRReader;
  }
}
