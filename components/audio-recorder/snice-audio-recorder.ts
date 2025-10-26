import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { AudioFormat, RecorderState, AudioRecording, SniceAudioRecorderElement } from './snice-audio-recorder.types';
import recorderStyles from './snice-audio-recorder.css?inline';

@element('snice-audio-recorder')
export class SniceAudioRecorder extends HTMLElement implements SniceAudioRecorderElement {
  @property({ type: Boolean, attribute: 'auto-start' })
  autoStart: boolean = false;

  @property({ type: String })
  format: AudioFormat = 'audio/webm';

  @property({ type: Number })
  bitrate: number = 128000;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls: boolean = true;

  @property({ type: Boolean, attribute: 'show-visualizer' })
  showVisualizer: boolean = true;

  @property({ type: Number, attribute: 'max-duration' })
  maxDuration: number = 0; // 0 = unlimited

  @property({ type: Boolean, attribute: 'show-timer' })
  showTimer: boolean = true;

  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private state: RecorderState = 'inactive';
  private startTime: number = 0;
  private pausedTime: number = 0;
  private duration: number = 0;
  private timerInterval: number | null = null;
  private errorMessage: string = '';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private visualizerData: Uint8Array | null = null;
  private animationFrame: number | null = null;
  private recordedUrl: string = '';

  @styles()
  styles() {
    return css/*css*/`${recorderStyles}`;
  }

  connectedCallback() {
    ;
    if (this.autoStart) {
      this.start();
    }
  }

  disconnectedCallback() {
    ;
    this.cleanup();
  }

  @render()
  render() {
    return html`
      <div class="recorder-container">
        <div class="recorder-status">
          <div class="recorder-state ${this.state}">
            <div class="recorder-state-icon"></div>
            <span>${this.getStateLabel()}</span>
          </div>
        </div>

        ${this.showTimer ? html`
          <div class="recorder-timer">${this.formatTime(this.duration)}</div>
        ` : ''}

        ${this.showVisualizer ? this.renderVisualizer() : ''}

        ${this.showControls ? this.renderControls() : ''}

        ${this.errorMessage ? html`
          <div class="recorder-error">${this.errorMessage}</div>
        ` : ''}

        ${this.recordedUrl ? html`
          <div class="recorder-playback">
            <audio src="${this.recordedUrl}" controls></audio>
          </div>
        ` : ''}

        <div class="recorder-info">
          <span>Format: ${this.format.split('/')[1].toUpperCase()}</span>
          <span>Bitrate: ${this.bitrate / 1000}kbps</span>
        </div>
      </div>
    `;
  }

  private renderVisualizer() {
    const bars = Array.from({ length: 32 }, (_, i) => {
      const height = this.getVisualizerHeight(i);
      return html`<div class="visualizer-bar" style="height: ${height}px;"></div>`;
    });

    return html`<div class="recorder-visualizer">${bars}</div>`;
  }

  private renderControls() {
    if (this.state === 'inactive') {
      return html`
        <div class="recorder-controls">
          <button class="recorder-btn record" @click=${() => this.start()} title="Start Recording">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>
        </div>
      `;
    }

    if (this.state === 'recording') {
      return html`
        <div class="recorder-controls">
          <button class="recorder-btn cancel" @click=${() => this.cancel()} title="Cancel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button class="recorder-btn pause" @click=${() => this.pause()} title="Pause">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          <button class="recorder-btn stop" @click=${() => this.stop()} title="Stop">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
          </button>
        </div>
      `;
    }

    if (this.state === 'paused') {
      return html`
        <div class="recorder-controls">
          <button class="recorder-btn cancel" @click=${() => this.cancel()} title="Cancel">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button class="recorder-btn record" @click=${() => this.resume()} title="Resume">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button class="recorder-btn stop" @click=${() => this.stop()} title="Stop">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
          </button>
        </div>
      `;
    }

    return '';
  }

  private getStateLabel(): string {
    switch (this.state) {
      case 'recording': return 'Recording';
      case 'paused': return 'Paused';
      default: return 'Ready';
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private getVisualizerHeight(index: number): number {
    if (!this.visualizerData || this.state !== 'recording') {
      return 4;
    }

    const value = this.visualizerData[index * 4] || 0;
    return 4 + (value / 255) * 60;
  }

  async start(): Promise<void> {
    try {
      this.errorMessage = '';
      this.audioChunks = [];
      this.recordedUrl = '';

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup visualizer
      if (this.showVisualizer) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);
        this.analyser.fftSize = 256;
        this.visualizerData = new Uint8Array(this.analyser.frequencyBinCount);
        this.updateVisualizer();
      }

      const options: MediaRecorderOptions = {
        mimeType: this.format,
        audioBitsPerSecond: this.bitrate
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingComplete();
      };

      this.mediaRecorder.start();
      this.state = 'recording';
      this.startTime = Date.now();
      this.startTimer();

      this.dispatchEvent(new CustomEvent('@snice/recorder-start', {
        detail: { recorder: this },
        bubbles: true
      }));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      this.dispatchEvent(new CustomEvent('@snice/recorder-error', {
        detail: { recorder: this, error },
        bubbles: true
      }));
    }
  }

  async stop(): Promise<AudioRecording> {
    if (!this.mediaRecorder || this.state === 'inactive') {
      throw new Error('No active recording');
    }

    return new Promise((resolve) => {
      const resolveWithRecording = () => {
        const blob = new Blob(this.audioChunks, { type: this.format });
        const url = URL.createObjectURL(blob);

        const recording: AudioRecording = {
          blob,
          url,
          duration: this.duration,
          size: blob.size,
          format: this.format,
          timestamp: Date.now()
        };

        this.recordedUrl = url;
        resolve(recording);
      };

      this.mediaRecorder!.addEventListener('stop', resolveWithRecording, { once: true });
      this.mediaRecorder!.stop();
      this.stopTimer();
      this.cleanup();
      this.state = 'inactive';
    });
  }

  pause(): void {
    if (this.mediaRecorder && this.state === 'recording') {
      this.mediaRecorder.pause();
      this.pausedTime = Date.now();
      this.state = 'paused';
      this.stopTimer();

      this.dispatchEvent(new CustomEvent('@snice/recorder-pause', {
        detail: { recorder: this },
        bubbles: true
      }));
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.state === 'paused') {
      this.mediaRecorder.resume();
      const pauseDuration = (Date.now() - this.pausedTime) / 1000;
      this.startTime += pauseDuration * 1000;
      this.state = 'recording';
      this.startTimer();

      this.dispatchEvent(new CustomEvent('@snice/recorder-resume', {
        detail: { recorder: this },
        bubbles: true
      }));
    }
  }

  cancel(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    this.audioChunks = [];
    this.stopTimer();
    this.cleanup();
    this.state = 'inactive';
    this.duration = 0;

    this.dispatchEvent(new CustomEvent('@snice/recorder-cancel', {
      detail: { recorder: this },
      bubbles: true
    }));
  }

  getState(): RecorderState {
    return this.state;
  }

  getDuration(): number {
    return this.duration;
  }

  isRecording(): boolean {
    return this.state === 'recording';
  }

  download(filename: string = `recording-${Date.now()}.webm`): void {
    if (!this.recordedUrl) {
      throw new Error('No recording available');
    }

    const a = document.createElement('a');
    a.href = this.recordedUrl;
    a.download = filename;
    a.click();
  }

  private handleRecordingComplete(): void {
    this.dispatchEvent(new CustomEvent('@snice/recorder-stop', {
      detail: { recorder: this },
      bubbles: true
    }));
  }

  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      this.duration = (Date.now() - this.startTime) / 1000;

      if (this.maxDuration > 0 && this.duration >= this.maxDuration) {
        this.stop();
      }
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateVisualizer(): void {
    if (!this.analyser || !this.visualizerData || this.state !== 'recording') {
      return;
    }

    this.analyser.getByteFrequencyData(this.visualizerData);

    this.animationFrame = requestAnimationFrame(() => this.updateVisualizer());
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.analyser = null;
    this.visualizerData = null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-audio-recorder': SniceAudioRecorder;
  }
}
