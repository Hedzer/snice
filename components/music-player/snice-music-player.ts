import { element, property, render, styles, dispatch, ready, dispose, watch, query, html, css } from 'snice';
import type { Track, RepeatMode, PlayerState, SniceMusicPlayerElement } from './snice-music-player.types';
import playerStyles from './snice-music-player.css?inline';

@element('snice-music-player')
export class SniceMusicPlayer extends HTMLElement implements SniceMusicPlayerElement {
  @property({ type: Array })
  tracks: Track[] = [];

  @property({ type: Number, attribute: 'current-track-index' })
  currentTrackIndex: number = 0;

  @property({ type: String, attribute: 'current-track' })
  currentTrack: string = '';

  currentTime: number = 0;
  duration: number = 0;

  @property({ type: Number })
  volume: number = 1;

  @property({ type: Boolean })
  muted: boolean = false;

  @property({ type: Boolean })
  shuffle: boolean = false;

  @property({ type: String })
  repeat: RepeatMode = 'off';

  @property({ type: String })
  state: PlayerState = 'stopped';

  @property({ type: Boolean })
  autoplay: boolean = false;

  @property({ type: Boolean, attribute: 'show-playlist' })
  showPlaylist: boolean = true;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls: boolean = true;

  @property({ type: Boolean, attribute: 'show-volume' })
  showVolume: boolean = true;

  @property({ type: Boolean, attribute: 'show-artwork' })
  showArtwork: boolean = true;

  @property({ type: Boolean, attribute: 'show-track-info' })
  showTrackInfo: boolean = true;

  @property({ type: Boolean })
  compact: boolean = false;

  @property({ type: Boolean, attribute: 'show-volume-slider' })
  private showVolumeSlider: boolean = false;

  private audioElement: HTMLAudioElement | null = null;
  private updateInterval: number | null = null;
  private shuffleHistory: number[] = [];
  private shuffleQueue: number[] = [];

  @query('.player-progress')
  private progressElement?: HTMLElement;

  @query('.player-volume-slider')
  private volumeSlider?: HTMLInputElement;

  @styles()
  componentStyles() {
    return css/*css*/`${playerStyles}`;
  }

  @ready()
  init() {
    this.audioElement = new Audio();
    this.audioElement.volume = this.volume;
    this.audioElement.muted = this.muted;

    // Set up audio event listeners
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.duration = this.audioElement!.duration;
      this.state = this.state === 'loading' ? 'paused' : this.state;
    });

    this.audioElement.addEventListener('play', () => {
      this.state = 'playing';
      this.startUpdateInterval();
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.audioElement!.ended) {
        this.state = 'paused';
      }
      this.stopUpdateInterval();
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audioElement.addEventListener('error', () => {
      this.state = 'error';
      this.emitError(new Error('Failed to load track'));
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.currentTime = this.audioElement!.currentTime;
    });

    // Load first track if available
    if (this.tracks.length > 0) {
      this.loadTrack(this.currentTrackIndex);
    }
  }

  @dispose()
  cleanup() {
    this.stop();
    this.stopUpdateInterval();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  @watch('tracks')
  handleTracksChange() {
    if (this.tracks.length > 0 && this.currentTrackIndex >= this.tracks.length) {
      this.currentTrackIndex = 0;
    }

    // Reset shuffle queue when tracks change
    if (this.shuffle) {
      this.shuffleQueue = [];
    }

    if (this.tracks.length > 0 && this.audioElement && !this.audioElement.src) {
      this.loadTrack(this.currentTrackIndex);
    }
  }

  @watch('currentTrack')
  handleCurrentTrackChange(oldVal: string, newVal: string) {
    if (!newVal || newVal === oldVal) return;

    // Find track by ID and load it
    const index = this.tracks.findIndex(t => t.id === newVal);
    if (index >= 0 && index !== this.currentTrackIndex) {
      this.loadTrack(index);
    }
  }

  @watch('volume')
  handleVolumeChange(oldVal: number, newVal: number) {
    if (this.audioElement && newVal >= 0 && newVal <= 1) {
      this.audioElement.volume = newVal;
    }

    // Update volume slider fill
    if (this.volumeSlider) {
      this.volumeSlider.style.setProperty('--volume-percent', `${newVal * 100}%`);
    }
  }

  @watch('muted')
  handleMutedChange(oldVal: boolean, newVal: boolean) {
    if (this.audioElement) {
      this.audioElement.muted = newVal;
    }
  }

  @render()
  renderPlayer() {
    const currentTrack = this.getCurrentTrack();
    const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

    return html/*html*/`
      <div class="player-container ${this.compact ? 'player-container--compact' : ''}">
        <if ${this.showArtwork || this.showTrackInfo}>
          <div class="player-info">
            <if ${this.showArtwork}>
              <div class="player-artwork">
                <if ${currentTrack?.artwork}>
                  <img src="${currentTrack?.artwork}" alt="${currentTrack?.title || 'Track artwork'}" />
                </if>
                <if ${!currentTrack?.artwork}>
                  <div class="player-artwork-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                </if>
              </div>
            </if>

            <if ${this.showTrackInfo}>
              <div class="player-track-info">
                <div class="player-track-title">${currentTrack?.title || 'No track loaded'}</div>
                <if ${currentTrack?.artist}>
                  <div class="player-track-artist">${currentTrack?.artist}</div>
                </if>
                <if ${currentTrack?.album}>
                  <div class="player-track-album">${currentTrack?.album}</div>
                </if>
              </div>
            </if>
          </div>
        </if>

        <if ${this.showControls}>
          <div class="player-controls">
            <div class="player-control-buttons">
              <button
                class="player-btn player-btn-shuffle ${this.shuffle ? 'active' : ''}"
                @click=${() => this.toggleShuffle()}
                title="Shuffle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                </svg>
              </button>

              <button
                class="player-btn player-btn-prev"
                @click=${() => this.previous()}
                title="Previous"
                ?disabled=${this.tracks.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                class="player-btn player-btn-play-pause ${this.state === 'playing' ? 'playing' : ''}"
                @click=${() => this.state === 'playing' ? this.pause() : this.play()}
                title="${this.state === 'playing' ? 'Pause' : 'Play'}"
                ?disabled=${this.tracks.length === 0}
              >
                <if ${this.state === 'playing'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </if>
                <if ${this.state !== 'playing'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </if>
              </button>

              <button
                class="player-btn player-btn-next"
                @click=${() => this.next()}
                title="Next"
                ?disabled=${this.tracks.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/>
                </svg>
              </button>

              <button
                class="player-btn player-btn-repeat ${this.repeat !== 'off' ? 'active' : ''}"
                @click=${() => this.cycleRepeat()}
                title="Repeat ${this.repeat}"
              >
                <if ${this.repeat === 'one'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 1l4 4-4 4"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <path d="M7 23l-4-4 4-4"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    <text x="12" y="15" font-size="8" text-anchor="middle" fill="currentColor">1</text>
                  </svg>
                </if>
                <if ${this.repeat !== 'one'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 1l4 4-4 4"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <path d="M7 23l-4-4 4-4"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </if>
              </button>
            </div>

            <div class="player-progress-container">
              <span class="player-time player-time-current">${this.formatTime(this.currentTime)}</span>
              <div class="player-progress" @click=${(e: MouseEvent) => this.handleSeek(e)}>
                <div class="player-progress-bar" style="width: ${progress}%"></div>
              </div>
              <span class="player-time player-time-duration">${this.formatTime(this.duration)}</span>
              <if ${this.showVolume}>
                <div class="player-volume">
            <button
              class="player-btn player-btn-volume"
              @click=${() => this.toggleVolumeSlider()}
              title="Volume"
            >
              <if ${this.muted || this.volume === 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              </if>
              <if ${!this.muted && this.volume > 0.5}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </if>
              <if ${!this.muted && this.volume > 0 && this.volume <= 0.5}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </if>
            </button>
            <if ${this.showVolumeSlider}>
              <div class="player-volume-slider-container">
                <input
                  class="player-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${this.volume.toString()}
                  style="--volume-percent: ${this.volume * 100}%"
                  @input=${(e: Event) => this.handleVolumeSlider(e)}
                />
              </div>
            </if>
                </div>
              </if>
            </div>
          </div>
        </if>

        <if ${this.showPlaylist && this.tracks.length > 0}>
          <div class="player-playlist">
            <div class="player-playlist-header">Playlist</div>
            <div class="player-playlist-items">
              ${this.tracks.map((track, index) => html/*html*/`
                <div
                  class="player-playlist-item ${index === this.currentTrackIndex ? 'active' : ''}"
                  @click=${() => this.loadTrack(index)}
                  key=${track.id}
                >
                  <div class="player-playlist-item-number">${index + 1}</div>
                  <if ${track.artwork}>
                    <img class="player-playlist-item-artwork" src="${track.artwork}" alt="${track.title}" />
                  </if>
                  <div class="player-playlist-item-info">
                    <div class="player-playlist-item-title">${track.title}</div>
                    <if ${track.artist}>
                      <div class="player-playlist-item-artist">${track.artist}</div>
                    </if>
                  </div>
                  <if ${track.duration}>
                    <div class="player-playlist-item-duration">${this.formatTime(track.duration || 0)}</div>
                  </if>
                </div>
              `)}
            </div>
          </div>
        </if>
      </div>
    `;
  }

  async play(): Promise<void> {
    if (!this.audioElement || this.tracks.length === 0) {
      return;
    }

    try {
      await this.audioElement.play();
      this.emitPlay();
    } catch (error) {
      this.state = 'error';
      this.emitError(error as Error);
    }
  }

  pause(): void {
    if (!this.audioElement) {
      return;
    }

    this.audioElement.pause();
    this.emitPause();
  }

  stop(): void {
    if (!this.audioElement) {
      return;
    }

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.currentTime = 0;
    this.state = 'stopped';
    this.emitStop();
  }

  next(): void {
    if (this.tracks.length === 0) {
      return;
    }

    let nextIndex: number;

    if (this.shuffle) {
      nextIndex = this.getNextShuffleIndex();
    } else {
      nextIndex = this.currentTrackIndex + 1;
      if (nextIndex >= this.tracks.length) {
        nextIndex = 0;
      }
    }

    this.loadTrack(nextIndex);
    if (this.state === 'playing') {
      this.play();
    }
  }

  previous(): void {
    if (this.tracks.length === 0) {
      return;
    }

    // If we're more than 3 seconds into the track, restart it
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIndex: number;

    if (this.shuffle && this.shuffleHistory.length > 0) {
      prevIndex = this.shuffleHistory.pop()!;
    } else {
      prevIndex = this.currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.tracks.length - 1;
      }
    }

    this.loadTrack(prevIndex);
    if (this.state === 'playing') {
      this.play();
    }
  }

  seek(time: number): void {
    if (!this.audioElement) {
      return;
    }

    this.audioElement.currentTime = time;
    this.currentTime = time;
    this.emitSeek(time);
  }

  setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }

    this.volume = volume;
    if (this.volume > 0 && this.muted) {
      this.muted = false;
    }
    this.emitVolumeChange(volume);
  }

  toggleShuffle(): void {
    this.shuffle = !this.shuffle;
    if (!this.shuffle) {
      this.shuffleHistory = [];
      this.shuffleQueue = [];
    } else {
      this.initializeShuffleQueue();
    }
    this.emitShuffleChange(this.shuffle);
  }

  setRepeat(mode: RepeatMode): void {
    this.repeat = mode;
    this.emitRepeatChange(mode);
  }

  async loadTrack(index: number): Promise<void> {
    if (index < 0 || index >= this.tracks.length) {
      throw new Error('Invalid track index');
    }

    const wasPlaying = this.state === 'playing';

    this.state = 'loading';
    this.currentTrackIndex = index;
    const track = this.tracks[index];
    this.currentTrack = track.id;

    if (this.audioElement) {
      this.audioElement.src = track.src;
      this.audioElement.load();
      this.currentTime = 0;

      if (wasPlaying || this.autoplay) {
        await this.play();
      }
    }

    this.emitTrackChange(track);
  }

  getCurrentTrack(): Track | null {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
      return this.tracks[this.currentTrackIndex];
    }
    return null;
  }

  private toggleMute(): void {
    this.muted = !this.muted;
  }

  private toggleVolumeSlider(): void {
    this.showVolumeSlider = !this.showVolumeSlider;
  }

  private cycleRepeat(): void {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(this.repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setRepeat(modes[nextIndex]);
  }

  private handleSeek(e: MouseEvent): void {
    if (!this.progressElement || this.duration === 0) {
      return;
    }

    const rect = this.progressElement.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * this.duration;

    this.seek(seekTime);
  }

  private handleVolumeSlider(e: Event): void {
    const input = e.target as HTMLInputElement;
    const volume = parseFloat(input.value);

    // Update visual immediately
    input.style.setProperty('--volume-percent', `${volume * 100}%`);

    this.setVolume(volume);
  }

  private handleTrackEnded(): void {
    if (this.repeat === 'one') {
      this.seek(0);
      this.play();
    } else if (this.repeat === 'all' || this.currentTrackIndex < this.tracks.length - 1) {
      this.next();
      this.play();
    } else {
      this.state = 'stopped';
      this.currentTime = 0;
    }

    this.emitTrackEnded();
  }

  private getNextShuffleIndex(): number {
    if (this.tracks.length === 1) {
      return 0;
    }

    // If queue is empty, create new shuffled queue excluding current track
    if (this.shuffleQueue.length === 0) {
      this.initializeShuffleQueue();
    }

    // Pop next track from queue
    this.shuffleHistory.push(this.currentTrackIndex);
    return this.shuffleQueue.shift()!;
  }

  private initializeShuffleQueue(): void {
    // Create array of all indices except current track
    const indices: number[] = [];
    for (let i = 0; i < this.tracks.length; i++) {
      if (i !== this.currentTrackIndex) {
        indices.push(i);
      }
    }

    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    this.shuffleQueue = indices;
  }

  private startUpdateInterval(): void {
    this.updateInterval = window.setInterval(() => {
      // Progress is updated via timeupdate event
    }, 100);
  }

  private stopUpdateInterval(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === Infinity) {
      return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  @dispatch('@snice/player-play', { bubbles: true, composed: true })
  private emitPlay() {
    return { player: this, track: this.getCurrentTrack() };
  }

  @dispatch('@snice/player-pause', { bubbles: true, composed: true })
  private emitPause() {
    return { player: this, track: this.getCurrentTrack() };
  }

  @dispatch('@snice/player-stop', { bubbles: true, composed: true })
  private emitStop() {
    return { player: this };
  }

  @dispatch('@snice/player-track-change', { bubbles: true, composed: true })
  private emitTrackChange(track: Track) {
    return { player: this, track };
  }

  @dispatch('@snice/player-track-ended', { bubbles: true, composed: true })
  private emitTrackEnded() {
    return { player: this, track: this.getCurrentTrack() };
  }

  @dispatch('@snice/player-seek', { bubbles: true, composed: true })
  private emitSeek(time: number) {
    return { player: this, time };
  }

  @dispatch('@snice/player-volume-change', { bubbles: true, composed: true })
  private emitVolumeChange(volume: number) {
    return { player: this, volume };
  }

  @dispatch('@snice/player-shuffle-change', { bubbles: true, composed: true })
  private emitShuffleChange(shuffle: boolean) {
    return { player: this, shuffle };
  }

  @dispatch('@snice/player-repeat-change', { bubbles: true, composed: true })
  private emitRepeatChange(repeat: RepeatMode) {
    return { player: this, repeat };
  }

  @dispatch('@snice/player-error', { bubbles: true, composed: true })
  private emitError(error: Error) {
    return { player: this, error };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-music-player': SniceMusicPlayer;
  }
}
