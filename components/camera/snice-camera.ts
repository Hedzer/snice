import { element, property, render, styles, query, dispatch, html, css } from 'snice';
import type { CameraFacingMode, CapturedImage, SniceCameraElement, ControlsPosition } from './snice-camera.types';
import cameraStyles from './snice-camera.css?inline';

@element('snice-camera')
export class SniceCamera extends HTMLElement implements SniceCameraElement {
  @property({ type: Boolean, attribute: 'auto-start' })
  autoStart: boolean = true;

  @property({ type: String, attribute: 'facing-mode' })
  facingMode: CameraFacingMode = 'user';

  @property({ type: Boolean })
  mirror: boolean = true;

  @property({ type: String, attribute: 'controls-position' })
  controlsPosition: ControlsPosition = 'auto';

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls: boolean = true;

  @property({ type: Number })
  width: number = 1280;

  @property({ type: Number })
  height: number = 720;

  @property({ type: String, attribute: 'aspect-ratio' })
  aspectRatio: string = 'auto';

  @property({ type: String, attribute: 'object-fit' })
  objectFit: 'contain' | 'cover' = 'cover';

  @query('video')
  private video!: HTMLVideoElement;

  @query('.camera-container')
  private container!: HTMLElement;

  private stream: MediaStream | null = null;
  private active: boolean = false;
  private hasMultipleCameras: boolean = false;

  @styles()
  styles() {
    return css/*css*/`${cameraStyles}`;
  }

  async connectedCallback() {
    ;
    // Check for multiple cameras
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      this.hasMultipleCameras = videoDevices.length > 1;
    } catch (error) {
      this.hasMultipleCameras = false;
    }

    if (this.autoStart) {
      // Small delay to ensure video element is ready
      requestAnimationFrame(() => this.start());
    }
  }

  disconnectedCallback() {
    ;
    this.stop();
  }

  @render()
  render() {
    return html/*html*/`
      <div class="camera-container">
        <video
          class="${this.getVideoClass()}"
          autoplay
          playsinline
          muted>
        </video>
        <if value=${this.showControls}>
          <div class="camera-controls ${this.getControlsPosition()}">
            <if value=${this.hasMultipleCameras}>
              <button class="camera-btn switch" @click=${this.switchCamera}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 2L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H17L15 2H9Z"/>
                  <circle cx="12" cy="13" r="3"/>
                  <path d="M15 7h2v2h-2z"/>
                </svg>
              </button>
            </if>
            <button class="camera-btn capture" @click=${this.capture}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="white" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="6"/>
              </svg>
            </button>
          </div>
        </if>
        <div class="custom-controls">
          <slot name="controls"></slot>
        </div>
      </div>
    `;
  }

  private getVideoClass(): string {
    const classes: string[] = [];

    if (this.mirror && this.facingMode === 'user') {
      classes.push('mirror');
    }

    if (this.objectFit === 'cover') {
      classes.push('cover');
    } else {
      classes.push('contain');
    }

    return classes.join(' ');
  }

  private getControlsPosition(): string {
    if (this.controlsPosition !== 'auto') {
      return this.controlsPosition;
    }

    // Auto-detect orientation
    const isPortrait = window.innerHeight > window.innerWidth;
    return isPortrait ? 'bottom-right' : 'right';
  }

  async start(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: this.width },
          height: { ideal: this.height },
          facingMode: this.facingMode
        } as MediaTrackConstraints
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      this.active = true;
      ;

      this.emitCameraStart();
    } catch (error) {
      console.error('Camera error:', error);
      this.emitCameraError(error);
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

    this.emitCameraStop();
  }

  async capture(): Promise<CapturedImage> {
    if (!this.video || !this.active) {
      throw new Error('Camera not active');
    }

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

    const dataURL = canvas.toDataURL('image/jpeg', 0.92);
    const blob = await (await fetch(dataURL)).blob();

    const image: CapturedImage = {
      dataURL,
      blob,
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now()
    };

    this.emitCameraCapture(image);

    return image;
  }

  async switchCamera(): Promise<void> {
    const wasActive = this.active;
    if (wasActive) this.stop();

    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';

    if (wasActive) await this.start();
  }

  isActive(): boolean {
    return this.active;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  enterFullscreen(): void {
    if (this.container) {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      }
    }
  }

  exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  @dispatch('camera-start', { bubbles: true, composed: true })
  private emitCameraStart() {
    return { stream: this.stream };
  }

  @dispatch('camera-error', { bubbles: true, composed: true })
  private emitCameraError(error: any) {
    return { error };
  }

  @dispatch('camera-stop', { bubbles: true, composed: true })
  private emitCameraStop() {
    return {};
  }

  @dispatch('camera-capture', { bubbles: true, composed: true })
  private emitCameraCapture(image: CapturedImage) {
    return { image };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-camera': SniceCamera;
  }
}
