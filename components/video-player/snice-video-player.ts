import { element, property, render, styles, dispatch, ready, dispose, watch, query, on, html, css } from 'snice';
import type { VideoVariant, SniceVideoPlayerElement } from './snice-video-player.types';
import playerStyles from './snice-video-player.css?inline';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SEEK_STEP = 5;
const VOLUME_STEP = 0.1;
const CONTROLS_HIDE_DELAY = 3000;

@element('snice-video-player')
export class SniceVideoPlayer extends HTMLElement implements SniceVideoPlayerElement {
  @property() src: string = '';
  @property() poster: string = '';
  @property({ type: Boolean }) autoplay: boolean = false;
  @property({ type: Boolean }) muted: boolean = false;
  @property({ type: Boolean }) loop: boolean = false;
  @property({ type: Boolean }) controls: boolean = true;
  @property({ type: Number, attribute: 'playback-rate' }) playbackRate: number = 1;
  @property({ type: Number, attribute: 'current-time' }) currentTime: number = 0;
  @property({ type: Number }) volume: number = 1;
  @property() variant: VideoVariant = 'default';

  duration: number = 0;

  private playing: boolean = false;
  private loading: boolean = false;
  private showPoster: boolean = true;
  private controlsVisible: boolean = false;
  private controlsTimer: number | null = null;
  private bufferedPercent: number = 0;
  private previousVolume: number = 1;
  private isSeeking: boolean = false;

  @query('.video-container') private container?: HTMLElement;
  @query('video') private videoEl?: HTMLVideoElement;
  @query('.video-progress-container') private progressContainer?: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${playerStyles}`;
  }

  @ready()
  init() {
    this.showPoster = !!this.poster && !this.autoplay;
  }

  @dispose()
  cleanup() {
    this.clearControlsTimer();
    if (this.videoEl) {
      this.videoEl.pause();
    }
  }

  @watch('src')
  handleSrcChange() {
    this.showPoster = !!this.poster;
    this.playing = false;
    this.currentTime = 0;
    this.duration = 0;
    this.loading = false;
    this.bufferedPercent = 0;
  }

  @watch('volume')
  handleVolumeChange(_oldVal: number, newVal: number) {
    if (this.videoEl && newVal >= 0 && newVal <= 1) {
      this.videoEl.volume = newVal;
    }
  }

  @watch('muted')
  handleMutedChange(_oldVal: boolean, newVal: boolean) {
    if (this.videoEl) {
      this.videoEl.muted = newVal;
    }
  }

  @watch('playbackRate')
  handlePlaybackRateChange(_oldVal: number, newVal: number) {
    if (this.videoEl) {
      this.videoEl.playbackRate = newVal;
    }
  }

  @watch('loop')
  handleLoopChange(_oldVal: boolean, newVal: boolean) {
    if (this.videoEl) {
      this.videoEl.loop = newVal;
    }
  }

  // --- Video event handlers via template bindings ---

  private handleVideoLoadedMetadata() {
    if (!this.videoEl) return;
    this.duration = this.videoEl.duration;
    this.loading = false;
  }

  private handleVideoPlay() {
    this.playing = true;
    this.loading = false;
    this.showPoster = false;
    this.emitPlay();
    this.startControlsTimer();
  }

  private handleVideoPause() {
    if (!this.videoEl?.ended) {
      this.playing = false;
      this.emitPause();
    }
    this.clearControlsTimer();
    this.controlsVisible = true;
  }

  private handleVideoEnded() {
    this.playing = false;
    this.controlsVisible = true;
    this.emitEnded();
  }

  private handleVideoTimeUpdate() {
    if (!this.videoEl || this.isSeeking) return;
    this.currentTime = this.videoEl.currentTime;
    this.emitTimeUpdate();
  }

  private handleVideoProgress() {
    if (!this.videoEl || this.videoEl.buffered.length === 0) return;
    const end = this.videoEl.buffered.end(this.videoEl.buffered.length - 1);
    this.bufferedPercent = this.duration > 0 ? (end / this.duration) * 100 : 0;
  }

  private handleVideoWaiting() {
    this.loading = true;
  }

  private handleVideoCanPlay() {
    this.loading = false;
  }

  private handleVideoVolumeChange() {
    if (!this.videoEl) return;
    this.volume = this.videoEl.volume;
    this.muted = this.videoEl.muted;
    this.emitVolumeChange();
  }

  // --- User interaction handlers ---

  private handleVideoClick() {
    this.toggle();
  }

  private handleVideoDblClick() {
    this.toggleFullscreen();
  }

  private handlePosterClick() {
    this.showPoster = false;
    this.play();
  }

  private handleProgressClick(e: MouseEvent) {
    if (!this.progressContainer || this.duration === 0) return;
    const rect = this.progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.seekTo(percent * this.duration);
  }

  private handleProgressMouseDown(e: MouseEvent) {
    this.isSeeking = true;
    this.handleProgressClick(e);

    const handleMove = (ev: MouseEvent) => {
      if (!this.progressContainer || this.duration === 0) return;
      const rect = this.progressContainer.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      this.currentTime = percent * this.duration;
    };

    const handleUp = () => {
      this.isSeeking = false;
      if (this.videoEl) {
        this.videoEl.currentTime = this.currentTime;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }

  private handleVolumeSlider(e: Event) {
    const input = e.target as HTMLInputElement;
    const vol = parseFloat(input.value);
    this.volume = vol;
    if (vol > 0 && this.muted) {
      this.muted = false;
    }
    this.emitVolumeChange();
  }

  private toggleMute() {
    if (this.muted) {
      this.muted = false;
      this.volume = this.previousVolume || 1;
    } else {
      this.previousVolume = this.volume;
      this.muted = true;
    }
    this.emitVolumeChange();
  }

  private cyclePlaybackRate() {
    const currentIdx = PLAYBACK_RATES.indexOf(this.playbackRate);
    const nextIdx = (currentIdx + 1) % PLAYBACK_RATES.length;
    this.setPlaybackRate(PLAYBACK_RATES[nextIdx]);
  }

  private handleContainerMouseMove() {
    this.controlsVisible = true;
    this.startControlsTimer();
  }

  private handleContainerMouseLeave() {
    if (this.playing) {
      this.controlsVisible = false;
    }
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (!this.controls) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.toggle();
        break;
      case 'f':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        this.toggleMute();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.seekTo(Math.min(this.duration, this.currentTime + SEEK_STEP));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.seekTo(Math.max(0, this.currentTime - SEEK_STEP));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.volume = Math.min(1, this.volume + VOLUME_STEP);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.volume = Math.max(0, this.volume - VOLUME_STEP);
        break;
    }
  }

  // --- Controls timer ---

  private startControlsTimer() {
    this.clearControlsTimer();
    if (this.playing) {
      this.controlsTimer = window.setTimeout(() => {
        this.controlsVisible = false;
      }, CONTROLS_HIDE_DELAY);
    }
  }

  private clearControlsTimer() {
    if (this.controlsTimer !== null) {
      clearTimeout(this.controlsTimer);
      this.controlsTimer = null;
    }
  }

  // --- Public methods ---

  async play(): Promise<void> {
    if (!this.videoEl) return;
    this.showPoster = false;
    try {
      await this.videoEl.play();
    } catch {
      // Autoplay may be blocked
    }
  }

  pause(): void {
    if (!this.videoEl) return;
    this.videoEl.pause();
  }

  toggle(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(time: number): void {
    if (!this.videoEl) return;
    const clamped = Math.max(0, Math.min(this.duration || 0, time));
    this.videoEl.currentTime = clamped;
    this.currentTime = clamped;
  }

  async requestFullscreen(): Promise<void> {
    if (!this.container) return;
    try {
      await this.container.requestFullscreen();
    } catch {
      // Fullscreen may not be available
    }
  }

  async exitFullscreen(): Promise<void> {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // May not be in fullscreen
    }
  }

  async requestPictureInPicture(): Promise<void> {
    if (!this.videoEl) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this.videoEl.requestPictureInPicture();
      }
    } catch {
      // PiP may not be available
    }
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  private async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await this.exitFullscreen();
    } else {
      await this.requestFullscreen();
    }
  }

  private handleFullscreenChange() {
    this.emitFullscreenChange();
  }

  // --- Helpers ---

  private formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // --- Dispatch events ---

  @dispatch('video-play', { bubbles: true, composed: true })
  private emitPlay() {
    return { player: this };
  }

  @dispatch('video-pause', { bubbles: true, composed: true })
  private emitPause() {
    return { player: this };
  }

  @dispatch('video-ended', { bubbles: true, composed: true })
  private emitEnded() {
    return { player: this };
  }

  @dispatch('video-time-update', { bubbles: true, composed: true })
  private emitTimeUpdate() {
    return { player: this, currentTime: this.currentTime, duration: this.duration };
  }

  @dispatch('video-fullscreen-change', { bubbles: true, composed: true })
  private emitFullscreenChange() {
    return { player: this, fullscreen: !!document.fullscreenElement };
  }

  @dispatch('video-volume-change', { bubbles: true, composed: true })
  private emitVolumeChange() {
    return { player: this, volume: this.volume, muted: this.muted };
  }

  // --- Render ---

  @render()
  renderPlayer() {
    const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    const isPlaying = this.playing;
    const containerClass = [
      'video-container',
      !isPlaying ? 'paused' : '',
      this.controlsVisible ? 'controls-visible' : '',
    ].filter(Boolean).join(' ');

    const isMutedOrZero = this.muted || this.volume === 0;

    return html`
      <div
        part="base"
        class="${containerClass}"
        tabindex="0"
        @mousemove=${() => this.handleContainerMouseMove()}
        @mouseleave=${() => this.handleContainerMouseLeave()}
        @fullscreenchange=${() => this.handleFullscreenChange()}
      >
        <video
          part="video"
          .src=${this.src}
          ?autoplay=${this.autoplay}
          ?muted=${this.muted}
          ?loop=${this.loop}
          playsinline
          preload="metadata"
          @loadedmetadata=${() => this.handleVideoLoadedMetadata()}
          @play=${() => this.handleVideoPlay()}
          @pause=${() => this.handleVideoPause()}
          @ended=${() => this.handleVideoEnded()}
          @timeupdate=${() => this.handleVideoTimeUpdate()}
          @progress=${() => this.handleVideoProgress()}
          @waiting=${() => this.handleVideoWaiting()}
          @canplay=${() => this.handleVideoCanPlay()}
          @volumechange=${() => this.handleVideoVolumeChange()}
          @click=${() => this.handleVideoClick()}
          @dblclick=${() => this.handleVideoDblClick()}
        >
          <slot></slot>
        </video>

        <if ${this.showPoster && this.poster}>
          <div
            class="video-poster"
            style="background-image: url('${this.poster}')"
            @click=${() => this.handlePosterClick()}
          >
            <div class="video-poster-play">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </if>

        <if ${this.loading}>
          <div class="video-loading">
            <div class="video-loading-spinner"></div>
          </div>
        </if>

        <if ${!isPlaying && !this.showPoster && this.src}>
          <div class="video-center-play">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </if>

        <if ${this.controls && this.src}>
          <div part="controls" class="video-controls">
            <div
              class="video-progress-container"
              @click=${(e: MouseEvent) => this.handleProgressClick(e)}
              @mousedown=${(e: MouseEvent) => this.handleProgressMouseDown(e)}
            >
              <div part="progress" class="video-progress-track">
                <div class="video-progress-buffered" style="width: ${this.bufferedPercent}%"></div>
                <div class="video-progress-bar" style="width: ${progress}%"></div>
              </div>
            </div>

            <div class="video-controls-row">
              <div class="video-controls-left">
                <button class="video-btn video-btn-play" @click=${() => this.toggle()} title="${isPlaying ? 'Pause' : 'Play'}">
                  <if ${isPlaying}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </if>
                  <if ${!isPlaying}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </if>
                </button>

                <div class="video-volume">
                  <button class="video-btn video-btn-volume" @click=${() => this.toggleMute()} title="${isMutedOrZero ? 'Unmute' : 'Mute'}">
                    <if ${isMutedOrZero}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    </if>
                    <if ${!isMutedOrZero && this.volume > 0.5}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                    </if>
                    <if ${!isMutedOrZero && this.volume > 0 && this.volume <= 0.5}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                    </if>
                  </button>
                  <input
                    class="video-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    .value=${this.muted ? '0' : this.volume.toString()}
                    @input=${(e: Event) => this.handleVolumeSlider(e)}
                  />
                </div>

                <span class="video-time">${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}</span>
              </div>

              <div class="video-controls-right">
                <button class="video-btn video-rate-btn" @click=${() => this.cyclePlaybackRate()} title="Playback speed">
                  ${this.playbackRate}x
                </button>

                <button class="video-btn video-btn-pip" @click=${() => this.requestPictureInPicture()} title="Picture-in-Picture">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" opacity="0.5"/>
                  </svg>
                </button>

                <button class="video-btn video-btn-fullscreen" @click=${() => this.toggleFullscreen()} title="Fullscreen">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </if>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-video-player': SniceVideoPlayer;
  }
}
