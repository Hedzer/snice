import { element, property, render, styles, dispatch, ready, dispose, queryAll, query, html, css } from 'snice';
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

  @property({ type: Boolean, attribute: 'show-playback' })
  showPlayback: boolean = true;

  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  @property()
  private state: RecorderState = 'inactive';

  private startTime: number = 0;
  private pausedTime: number = 0;
  private duration: number = 0;
  private timerInterval: number | null = null;

  @property()
  private errorMessage: string = '';

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private visualizerData: Uint8Array | null = null;
  private animationFrame: number | null = null;

  @property({ type: String })
  recordedUrl: string = '';

  @property({ type: Boolean })
  private isPlaying: boolean = false;

  @property({ type: Number })
  private playbackTime: number = 0;

  private audioElement: HTMLAudioElement | null = null;
  private playbackInterval: number | null = null;

  @query('.recorder-timer')
  private timerElement?: HTMLElement;

  @styles()
  styles() {
    return css/*css*/`${recorderStyles}`;
  }

  @ready()
  init() {
    if (this.autoStart) {
      this.start();
    }
  }

  @dispose()
  cleanup() {
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

  @render()
  render() {
    const showingPlayback = this.showPlayback && this.recordedUrl;

    return html/*html*/`
      <div class="recorder-container">
        <if ${showingPlayback}>
          <div class="recorder-status">
            <div class="recorder-state inactive">
              <div class="recorder-state-icon" style="background: var(--snice-color-primary, rgb(37 99 235));"></div>
              <span>Playback</span>
            </div>
          </div>

          <div class="recorder-timer">${this.formatTime(this.playbackTime)}</div>

          <div class="playback-progress" @click=${(e: MouseEvent) => this.handleSeek(e)}>
            <div class="playback-progress-fill" style="width: ${this.duration > 0 ? (this.playbackTime / this.duration) * 100 : 0}%"></div>
          </div>

          <div class="recorder-controls">
            <button class="recorder-btn ${this.isPlaying ? 'pause' : 'play'}" @click=${() => this.handleTogglePlayback()} title="${this.isPlaying ? 'Pause' : 'Play'}">
              <if ${this.isPlaying}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </if>
              <if ${!this.isPlaying}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </if>
            </button>
            <if ${this.showControls}>
              <button class="recorder-btn record" @click=${() => this.reset()} title="Record Again">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
              </button>
            </if>
          </div>
        </if>

        <if ${!showingPlayback}>
          <div class="recorder-status">
            <div class="recorder-state ${this.state}">
              <div class="recorder-state-icon"></div>
              <span>${this.getStateLabel()}</span>
            </div>
          </div>

          <if ${this.showTimer}>
            <div class="recorder-timer">${this.formatTime(this.duration)}</div>
          </if>

          <if ${this.showVisualizer}>
            ${this.renderVisualizer()}
          </if>

          <if ${this.showControls}>
            ${this.renderControls()}
          </if>

          <if ${this.errorMessage}>
            <div class="recorder-error">${this.errorMessage}</div>
          </if>
        </if>
      </div>
    `;
  }

  private renderVisualizer() {
    const bars = Array.from({ length: 32 }, (_, i) => {
      const height = this.getVisualizerHeight(i);
      return html/*html*/`<div class="visualizer-bar" style="height: ${height}px;"></div>`;
    });

    return html/*html*/`<div class="recorder-visualizer">${bars}</div>`;
  }

  private renderControls() {
    if (this.state === 'inactive') {
      return html/*html*/`
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
      return html/*html*/`
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
      return html/*html*/`
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
    return 4;
  }

  async start(): Promise<void> {
    try {
      this.errorMessage = '';
      this.audioChunks = [];
      this.recordedUrl = '';

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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

      // Request data every 1 second to ensure ondataavailable fires
      this.mediaRecorder.start(1000);
      this.state = 'recording';
      this.startTime = Date.now();
      this.startTimer();

      // Setup visualizer AFTER state is set to 'recording'
      if (this.showVisualizer) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;
        this.visualizerData = new Uint8Array(this.analyser.frequencyBinCount);
        this.updateVisualizer();
      }

      this.emitRecorderStart();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      this.emitRecorderError(error);
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
        this.cleanupMedia(); // Clean up AFTER recording completes
        resolve(recording);
      };

      this.mediaRecorder!.addEventListener('stop', resolveWithRecording, { once: true });
      this.mediaRecorder!.stop();
      this.stopTimer();
      this.state = 'inactive';
    });
  }

  pause(): void {
    if (this.mediaRecorder && this.state === 'recording') {
      this.mediaRecorder.pause();
      this.pausedTime = Date.now();
      this.state = 'paused';
      this.stopTimer();

      this.emitRecorderPause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.state === 'paused') {
      this.mediaRecorder.resume();
      const pauseDuration = (Date.now() - this.pausedTime) / 1000;
      this.startTime += pauseDuration * 1000;
      this.state = 'recording';
      this.startTimer();

      this.emitRecorderResume();
    }
  }

  cancel(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    this.audioChunks = [];
    this.stopTimer();
    this.cleanupMedia();
    this.state = 'inactive';
    this.duration = 0;

    this.emitRecorderCancel();
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

  reset(): void {
    this.stopPlayback();
    this.recordedUrl = '';
    this.audioChunks = [];
    this.duration = 0;
    this.playbackTime = 0;
    this.state = 'inactive';
  }

  handleTogglePlayback(): void {
    if (!this.recordedUrl) return;

    if (!this.audioElement) {
      this.audioElement = new Audio(this.recordedUrl);
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.playbackTime = 0;
        if (this.playbackInterval) {
          clearInterval(this.playbackInterval);
          this.playbackInterval = null;
        }
      });
    }

    if (this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
      if (this.playbackInterval) {
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    } else {
      this.audioElement.play();
      this.isPlaying = true;
      this.playbackInterval = window.setInterval(() => {
        if (this.audioElement) {
          this.playbackTime = this.audioElement.currentTime;
        }
      }, 100);
    }
  }

  private stopPlayback(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.isPlaying = false;
    this.playbackTime = 0;
  }

  handleSeek(e: MouseEvent): void {
    if (!this.audioElement || this.duration === 0) return;

    const progressBar = e.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * this.duration;

    this.audioElement.currentTime = seekTime;
    this.playbackTime = seekTime;
  }

  private handleRecordingComplete(): void {
    this.emitRecorderStop();
  }

  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      this.duration = (Date.now() - this.startTime) / 1000;

      // Update timer display directly
      if (this.timerElement) {
        this.timerElement.textContent = this.formatTime(this.duration);
      }

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

    this.analyser.getByteFrequencyData(this.visualizerData as Uint8Array<ArrayBuffer>);

    const bars = this.shadowRoot?.querySelectorAll<HTMLElement>('.visualizer-bar');
    if (bars && bars.length > 0) {
      // Focus on lower half of frequencies where speech is
      const maxIndex = Math.floor(this.visualizerData!.length / 2);

      bars.forEach((bar, i) => {
        // Map bars to lower frequencies only
        const start = Math.floor((i / 32) * maxIndex);
        const end = Math.floor(((i + 1) / 32) * maxIndex);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += this.visualizerData![j];
        }
        const avg = sum / (end - start);
        const boosted = Math.min(255, avg * 2);
        const height = 4 + (boosted / 255) * 60;
        bar.style.height = `${height}px`;
      });
    }

    this.animationFrame = requestAnimationFrame(() => this.updateVisualizer());
  }

  private cleanupMedia(): void {
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

  @dispatch('@snice/recorder-start', { bubbles: true, composed: true })
  private emitRecorderStart() {
    return { recorder: this };
  }

  @dispatch('@snice/recorder-error', { bubbles: true, composed: true })
  private emitRecorderError(error: any) {
    return { recorder: this, error };
  }

  @dispatch('@snice/recorder-pause', { bubbles: true, composed: true })
  private emitRecorderPause() {
    return { recorder: this };
  }

  @dispatch('@snice/recorder-resume', { bubbles: true, composed: true })
  private emitRecorderResume() {
    return { recorder: this };
  }

  @dispatch('@snice/recorder-cancel', { bubbles: true, composed: true })
  private emitRecorderCancel() {
    return { recorder: this };
  }

  @dispatch('@snice/recorder-stop', { bubbles: true, composed: true })
  private emitRecorderStop() {
    return { recorder: this };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-audio-recorder': SniceAudioRecorder;
  }
}
