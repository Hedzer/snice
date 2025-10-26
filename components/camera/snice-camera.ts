import { element, property, render, styles, dispatch, query, html, css } from 'snice';
import type { CameraFacingMode, CameraResolution, CapturedImage, SniceCameraElement } from './snice-camera.types';
import cameraStyles from './snice-camera.css?inline';

const RESOLUTION_MAP: Record<CameraResolution, { width: number; height: number }> = {
  'qvga': { width: 320, height: 240 },
  'vga': { width: 640, height: 480 },
  'hd': { width: 1280, height: 720 },
  'full-hd': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 }
};

@element('snice-camera')
export class SniceCamera extends HTMLElement implements SniceCameraElement {
  @property({ type: Boolean, attribute: 'auto-start' })
  autoStart: boolean = false;

  @property({ type: String, attribute: 'facing-mode' })
  facingMode: CameraFacingMode = 'user';

  @property({ type: String })
  resolution: CameraResolution = 'hd';

  @property({ type: Boolean })
  mirror: boolean = true;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls: boolean = true;

  @property({ type: String, attribute: 'capture-format' })
  captureFormat: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/jpeg';

  @property({ type: Number, attribute: 'capture-quality' })
  captureQuality: number = 0.92;

  @query('video')
  private video!: HTMLVideoElement;

  private stream: MediaStream | null = null;
  private active: boolean = false;
  private errorMessage: string = '';
  private showFlash: boolean = false;

  @styles()
  styles() {
    return css/*css*/`${cameraStyles}`;
  }

  connectedCallback() {
    ;
    if (this.autoStart) {
      this.start();
    }
  }

  disconnectedCallback() {
    ;
    this.stop();
  }

  @render()
  render() {
    return html`
      <div class="camera-container">
        <video
          class="${this.mirror && this.facingMode === 'user' ? 'mirror' : ''}"
          autoplay
          playsinline>
        </video>

        ${this.active ? html`
          <div class="camera-status active">Recording</div>
        ` : ''}

        ${this.errorMessage ? html`
          <div class="camera-error">${this.errorMessage}</div>
        ` : ''}

        ${!this.active && !this.errorMessage ? html`
          <div class="camera-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15.2c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"/>
            </svg>
            <div>Camera not started</div>
          </div>
        ` : ''}

        ${this.showControls ? this.renderControls() : ''}

        <div class="flash-overlay ${this.showFlash ? 'active' : ''}"></div>
      </div>
    `;
  }

  private renderControls() {
    return html`
      <div class="camera-controls">
        ${this.active ? html`
          <button class="camera-btn" @click=${() => this.switchCamera()} title="Switch camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 7h-1l-1-1h-4L9 7H8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-4 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              <path d="M20 4h-3.17l-.59-.59-.58-.58V2h-7.32v.83l-.58.58L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </button>
          <button class="camera-btn capture" @click=${() => this.capture()} title="Capture photo"></button>
          <button class="camera-btn" @click=${() => this.stop()} title="Stop camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
        ` : html`
          <button class="camera-btn" @click=${() => this.start()} title="Start camera">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        `}
      </div>
    `;
  }

  async start(): Promise<void> {
    try {
      this.errorMessage = '';

      const constraints = this.getConstraints();
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      this.active = true;
      ;

      this.dispatchEvent(new CustomEvent('@snice/camera-start', {
        detail: { camera: this, stream: this.stream },
        bubbles: true
      }));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      this.active = false;
      ;

      this.dispatchEvent(new CustomEvent('@snice/camera-error', {
        detail: { camera: this, error },
        bubbles: true
      }));
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.active = false;
    ;

    this.dispatchEvent(new CustomEvent('@snice/camera-stop', {
      detail: { camera: this },
      bubbles: true
    }));
  }

  async capture(): Promise<CapturedImage> {
    if (!this.video || !this.active) {
      throw new Error('Camera not active');
    }

    // Flash effect
    this.showFlash = true;
    ;
    setTimeout(() => {
      this.showFlash = false;
      ;
    }, 100);

    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Mirror if needed
    if (this.mirror && this.facingMode === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    }

    const dataURL = canvas.toDataURL(this.captureFormat, this.captureQuality);
    const blob = await this.dataURLToBlob(dataURL);

    const image: CapturedImage = {
      dataURL,
      blob,
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now()
    };

    this.dispatchEvent(new CustomEvent('@snice/camera-capture', {
      detail: { camera: this, image },
      bubbles: true
    }));

    return image;
  }

  async switchCamera(): Promise<void> {
    const wasActive = this.active;

    if (wasActive) {
      this.stop();
    }

    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';

    if (wasActive) {
      await this.start();
    }

    this.dispatchEvent(new CustomEvent('@snice/camera-switch', {
      detail: { camera: this, facingMode: this.facingMode },
      bubbles: true
    }));
  }

  isActive(): boolean {
    return this.active;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  async selectDevice(deviceId: string): Promise<void> {
    const wasActive = this.active;

    if (wasActive) {
      this.stop();
    }

    const constraints = this.getConstraints();
    if (constraints.video && typeof constraints.video === 'object') {
      constraints.video.deviceId = { exact: deviceId };
      delete constraints.video.facingMode;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      this.active = true;
      ;
    } catch (error) {
      this.errorMessage = 'Failed to select device';
      ;
      throw error;
    }
  }

  private getConstraints() {
    const res = RESOLUTION_MAP[this.resolution];

    return {
      audio: false,
      video: {
        width: { ideal: res.width },
        height: { ideal: res.height },
        facingMode: this.facingMode
      }
    };
  }

  private async dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-camera': SniceCamera;
  }
}
