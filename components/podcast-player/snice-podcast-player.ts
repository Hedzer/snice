import { element, property, render, styles, dispatch, ready, dispose, watch, query, html, css } from 'snice';
import type { PodcastEpisode, PodcastChapter, RSSFeedData, PodcastPlayerState, SnicePodcastPlayerElement } from './snice-podcast-player.types';
import playerStyles from './snice-podcast-player.css?inline';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [0, 5, 10, 15, 30, 45, 60]; // minutes
const STORAGE_KEY_PREFIX = 'snice-podcast-position-';

@element('snice-podcast-player')
export class SnicePodcastPlayer extends HTMLElement implements SnicePodcastPlayerElement {
  @property() src: string = '';

  @property({ attribute: 'from-rss' })
  fromRss: string = '';

  @property() title: string = '';
  @property() show: string = '';
  @property() artwork: string = '';
  @property() description: string = '';

  @property({ type: Number, attribute: 'playback-rate' })
  playbackRate: number = 1;

  @property({ type: Number, attribute: 'skip-forward' })
  skipForward: number = 30;

  @property({ type: Number, attribute: 'skip-back' })
  skipBack: number = 15;

  @property({ type: Number, attribute: 'current-time' })
  currentTime: number = 0;

  @property({ type: Number })
  duration: number = 0;

  @property({ type: Number })
  volume: number = 1;

  @property({ type: Boolean })
  muted: boolean = false;

  @property({ type: Array, attribute: false })
  episodes: PodcastEpisode[] = [];

  @property({ type: Number, attribute: 'current-episode-index' })
  currentEpisodeIndex: number = -1;

  @property({ type: Number, attribute: 'sleep-timer' })
  sleepTimer: number = 0;

  state: PodcastPlayerState = 'stopped';

  private audioElement: HTMLAudioElement | null = null;
  private sleepTimerInterval: number | null = null;
  private sleepTimerRemaining: number = 0;
  private showVolumeSlider: boolean = false;

  @query('.podcast-progress')
  private progressElement?: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${playerStyles}`;
  }

  @ready()
  init() {
    this.audioElement = new Audio();
    this.audioElement.volume = this.volume;
    this.audioElement.muted = this.muted;
    this.audioElement.playbackRate = this.playbackRate;

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.duration = this.audioElement!.duration;
      if (this.state === 'loading') {
        this.state = 'paused';
      }
    });

    this.audioElement.addEventListener('play', () => {
      this.state = 'playing';
      this.emitPlay();
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.audioElement!.ended) {
        this.state = 'paused';
        this.savePosition();
      }
      this.emitPause();
    });

    this.audioElement.addEventListener('ended', () => {
      this.state = 'stopped';
      this.clearSavedPosition();
      this.emitEnded();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.currentTime = this.audioElement!.currentTime;
      this.emitTimeUpdate();
    });

    this.audioElement.addEventListener('error', () => {
      this.state = 'error';
    });

    // Load src if provided directly
    if (this.src) {
      this.loadSrc(this.src);
    }

    // Fetch RSS if provided
    if (this.fromRss) {
      this.fetchRSS(this.fromRss);
    }
  }

  @dispose()
  cleanup() {
    this.savePosition();
    this.clearSleepTimer();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  @watch('src')
  handleSrcChange(_oldVal: string, newVal: string) {
    if (newVal) {
      this.loadSrc(newVal);
    }
  }

  @watch('fromRss')
  handleRssChange(_oldVal: string, newVal: string) {
    if (newVal) {
      this.fetchRSS(newVal);
    }
  }

  @watch('volume')
  handleVolumeChange(_oldVal: number, newVal: number) {
    if (this.audioElement && newVal >= 0 && newVal <= 1) {
      this.audioElement.volume = newVal;
    }
  }

  @watch('muted')
  handleMutedChange(_oldVal: boolean, newVal: boolean) {
    if (this.audioElement) {
      this.audioElement.muted = newVal;
    }
  }

  @watch('playbackRate')
  handlePlaybackRateChange(_oldVal: number, newVal: number) {
    if (this.audioElement && newVal >= 0.5 && newVal <= 2) {
      this.audioElement.playbackRate = newVal;
      this.emitRateChange();
    }
  }

  @render()
  renderPlayer() {
    const currentEpisode = this.getCurrentEpisode();
    const displayTitle = currentEpisode?.title || this.title || 'No episode loaded';
    const displayShow = currentEpisode ? this.show : this.show;
    const displayArtwork = currentEpisode?.artwork || this.artwork;
    const displayDescription = currentEpisode?.description || this.description;
    const chapters = currentEpisode?.chapters || [];
    const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    const isPlaying = this.state === 'playing';
    const hasSource = !!this.src || this.currentEpisodeIndex >= 0;
    const rateIsNotOne = this.playbackRate !== 1;
    const hasSleepTimer = this.sleepTimerRemaining > 0;
    const hasChapters = chapters.length > 0;
    const hasEpisodes = this.episodes.length > 0;
    const showVolSlider = this.showVolumeSlider;
    const isMutedOrZero = this.muted || this.volume === 0;
    const isHighVolume = !this.muted && this.volume > 0.5;

    return html/*html*/`
      <div part="base" class="podcast-container">
        <div part="info" class="podcast-info">
          <div class="podcast-artwork">
            <if ${displayArtwork}>
              <img src="${displayArtwork}" alt="${displayTitle}" />
            </if>
            <if ${!displayArtwork}>
              <div class="podcast-artwork-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
            </if>
          </div>

          <div class="podcast-meta">
            <if ${displayShow}>
              <div class="podcast-show">${displayShow}</div>
            </if>
            <div class="podcast-title">${displayTitle}</div>
            <if ${displayDescription}>
              <div class="podcast-description">${displayDescription}</div>
            </if>
          </div>
        </div>

        <div part="controls" class="podcast-controls">
          <div class="podcast-control-buttons">
            <button
              class="podcast-btn podcast-btn-speed ${rateIsNotOne ? 'active' : ''}"
              @click=${() => this.cyclePlaybackRate()}
              title="Playback speed"
            >${this.playbackRate}x</button>

            <button
              class="podcast-btn"
              @click=${() => this.doSkipBack()}
              title="Skip back ${this.skipBack}s"
              ?disabled=${!hasSource}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              <span class="podcast-btn-skip-label">${this.skipBack}</span>
            </button>

            <button
              class="podcast-btn podcast-btn-play"
              @click=${() => this.toggle()}
              title="${isPlaying ? 'Pause' : 'Play'}"
              ?disabled=${!hasSource}
            >
              <if ${isPlaying}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </if>
              <if ${!isPlaying}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </if>
            </button>

            <button
              class="podcast-btn"
              @click=${() => this.doSkipForward()}
              title="Skip forward ${this.skipForward}s"
              ?disabled=${!hasSource}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span class="podcast-btn-skip-label">${this.skipForward}</span>
            </button>

            <button
              class="podcast-btn podcast-btn-sleep ${hasSleepTimer ? 'active' : ''}"
              @click=${() => this.cycleSleepTimer()}
              title="Sleep timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
          </div>

          <div class="podcast-progress-container">
            <span class="podcast-time podcast-time-current">${this.formatTime(this.currentTime)}</span>
            <div class="podcast-progress" @click=${(e: MouseEvent) => this.handleSeek(e)}>
              <div class="podcast-progress-bar" style="width: ${progress}%"></div>
            </div>
            <span class="podcast-time podcast-time-remaining">-${this.formatTime(this.duration - this.currentTime)}</span>
          </div>
        </div>

        <div class="podcast-bottom-bar">
          <div class="podcast-volume">
            <button
              class="podcast-btn"
              @click=${() => this.toggleVolumeSlider()}
              title="Volume"
            >
              <if ${isMutedOrZero}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              </if>
              <if ${isHighVolume}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </if>
              <if ${!isMutedOrZero && !isHighVolume}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </if>
            </button>
            <if ${showVolSlider}>
              <div class="podcast-volume-slider-container">
                <input
                  class="podcast-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${this.volume.toString()}
                  style="--volume-percent: ${this.volume * 100}%"
                  @input=${(e: Event) => this.handleVolumeInput(e)}
                />
              </div>
            </if>
          </div>

          <if ${hasSleepTimer}>
            <div class="podcast-sleep">
              <span class="podcast-sleep-label">Sleep in</span>
              <span class="podcast-sleep-time">${this.formatTime(this.sleepTimerRemaining)}</span>
            </div>
          </if>
        </div>

        <if ${hasChapters}>
          <div class="podcast-chapters">
            <div class="podcast-chapters-header">Chapters</div>
            ${chapters.map((chapter, i) => {
              const isActive = this.isActiveChapter(chapter, chapters, i);
              return html/*html*/`
                <div
                  class="podcast-chapter-item ${isActive ? 'active' : ''}"
                  @click=${() => this.seekTo(chapter.startTime)}
                >
                  <span class="podcast-chapter-time">${this.formatTime(chapter.startTime)}</span>
                  <span class="podcast-chapter-title">${chapter.title}</span>
                </div>
              `;
            })}
          </div>
        </if>

        <if ${hasEpisodes}>
          <div class="podcast-episodes">
            <div class="podcast-episodes-header">Episodes</div>
            <div class="podcast-episode-list">
              ${this.episodes.map((episode, index) => {
                const isActive = index === this.currentEpisodeIndex;
                const isEpPlaying = isActive && isPlaying;
                return html/*html*/`
                  <div
                    class="podcast-episode-item ${isActive ? 'active' : ''}"
                    @click=${() => this.loadEpisode(index)}
                  >
                    <if ${episode.artwork}>
                      <img class="podcast-episode-artwork" src="${episode.artwork}" alt="${episode.title}" />
                    </if>
                    <div class="podcast-episode-info">
                      <div class="podcast-episode-title">${episode.title}</div>
                      <if ${episode.pubDate}>
                        <div class="podcast-episode-date">${episode.pubDate}</div>
                      </if>
                    </div>
                    <if ${isEpPlaying}>
                      <div class="podcast-episode-playing-icon">
                        <span></span><span></span><span></span>
                      </div>
                    </if>
                    <if ${!isEpPlaying && episode.duration}>
                      <div class="podcast-episode-duration">${this.formatTime(episode.duration || 0)}</div>
                    </if>
                  </div>
                `;
              })}
            </div>
          </div>
        </if>
      </div>
    `;
  }

  // --- Public Methods ---

  async play(): Promise<void> {
    if (!this.audioElement || !this.audioElement.src) return;
    try {
      await this.audioElement.play();
    } catch {
      this.state = 'error';
    }
  }

  pause(): void {
    if (!this.audioElement) return;
    this.audioElement.pause();
  }

  toggle(): void {
    if (this.state === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  doSkipForward(): void {
    if (!this.audioElement) return;
    this.seekTo(Math.min(this.currentTime + this.skipForward, this.duration));
  }

  doSkipBack(): void {
    if (!this.audioElement) return;
    this.seekTo(Math.max(this.currentTime - this.skipBack, 0));
  }

  seekTo(time: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = time;
    this.currentTime = time;
  }

  setPlaybackRate(rate: number): void {
    if (rate < 0.5 || rate > 2) return;
    this.playbackRate = rate;
  }

  loadEpisode(index: number): void {
    if (index < 0 || index >= this.episodes.length) return;

    // Save position of current episode before switching
    this.savePosition();

    const episode = this.episodes[index];
    this.currentEpisodeIndex = index;
    this.title = episode.title;
    if (episode.artwork) this.artwork = episode.artwork;
    if (episode.description) this.description = episode.description;

    this.loadSrc(episode.src);
    this.emitEpisodeChange(episode, index);

    // Restore saved position for this episode
    const saved = this.getSavedPosition(episode.src);
    if (saved > 0) {
      // Wait for metadata to load before seeking
      const onLoaded = () => {
        this.seekTo(saved);
        this.audioElement?.removeEventListener('loadedmetadata', onLoaded);
      };
      this.audioElement?.addEventListener('loadedmetadata', onLoaded);
    }
  }

  // --- Private Methods ---

  private loadSrc(src: string): void {
    if (!this.audioElement) return;
    this.state = 'loading';
    this.audioElement.src = src;
    this.audioElement.load();
    this.currentTime = 0;
    this.duration = 0;
  }

  private async fetchRSS(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const feed = this.parseRSS(text);

      if (feed.title && !this.show) this.show = feed.title;
      if (feed.artwork && !this.artwork) this.artwork = feed.artwork;
      if (feed.description && !this.description) this.description = feed.description;

      this.episodes = feed.episodes;
      this.emitFeedLoaded(feed);
    } catch {
      this.state = 'error';
    }
  }

  private parseRSS(xml: string): RSSFeedData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const channel = doc.querySelector('channel');

    const title = channel?.querySelector('title')?.textContent || '';
    const description = channel?.querySelector('description')?.textContent || '';

    // Try itunes:image first, then regular image
    const itunesImage = channel?.querySelector('image[href]')?.getAttribute('href')
      || channel?.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'image')?.[0]?.getAttribute('href');
    const regularImage = channel?.querySelector('image > url')?.textContent;
    const artwork = itunesImage || regularImage || '';

    const items = channel?.querySelectorAll('item') || [];
    const episodes: PodcastEpisode[] = [];

    items.forEach(item => {
      const epTitle = item.querySelector('title')?.textContent || '';
      const enclosure = item.querySelector('enclosure');
      const src = enclosure?.getAttribute('url') || '';
      if (!src) return;

      const epDescription = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';

      // Parse itunes:duration
      const itunesDuration = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'duration')?.[0]?.textContent;
      const duration = itunesDuration ? this.parseDuration(itunesDuration) : undefined;

      // Episode artwork
      const epImage = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'image')?.[0]?.getAttribute('href') || '';

      episodes.push({
        title: epTitle,
        src,
        artwork: epImage || artwork,
        description: epDescription,
        pubDate: pubDate ? this.formatDate(pubDate) : undefined,
        duration,
      });
    });

    return { title, artwork, description, episodes };
  }

  private parseDuration(duration: string): number {
    // Handle HH:MM:SS, MM:SS, or plain seconds
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  private cyclePlaybackRate(): void {
    const idx = PLAYBACK_RATES.indexOf(this.playbackRate);
    const nextIdx = (idx + 1) % PLAYBACK_RATES.length;
    this.setPlaybackRate(PLAYBACK_RATES[nextIdx]);
  }

  private cycleSleepTimer(): void {
    const currentMinutes = Math.ceil(this.sleepTimerRemaining / 60);
    const idx = SLEEP_OPTIONS.findIndex(opt => opt >= currentMinutes);
    const nextIdx = (idx + 1) % SLEEP_OPTIONS.length;
    const minutes = SLEEP_OPTIONS[nextIdx];

    this.clearSleepTimer();

    if (minutes > 0) {
      this.sleepTimerRemaining = minutes * 60;
      this.sleepTimerInterval = window.setInterval(() => {
        this.sleepTimerRemaining--;
        if (this.sleepTimerRemaining <= 0) {
          this.pause();
          this.clearSleepTimer();
        }
      }, 1000);
    }
  }

  private clearSleepTimer(): void {
    if (this.sleepTimerInterval !== null) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerRemaining = 0;
  }

  private handleSeek(e: MouseEvent): void {
    if (!this.progressElement || this.duration === 0) return;
    const rect = this.progressElement.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.seekTo(percent * this.duration);
  }

  private handleVolumeInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const vol = parseFloat(input.value);
    input.style.setProperty('--volume-percent', `${vol * 100}%`);
    this.volume = vol;
    if (vol > 0 && this.muted) this.muted = false;
  }

  private toggleVolumeSlider(): void {
    this.showVolumeSlider = !this.showVolumeSlider;
  }

  private getCurrentEpisode(): PodcastEpisode | null {
    if (this.currentEpisodeIndex >= 0 && this.currentEpisodeIndex < this.episodes.length) {
      return this.episodes[this.currentEpisodeIndex];
    }
    return null;
  }

  private isActiveChapter(chapter: PodcastChapter, chapters: PodcastChapter[], index: number): boolean {
    const nextChapter = chapters[index + 1];
    const endTime = chapter.endTime || (nextChapter ? nextChapter.startTime : this.duration);
    return this.currentTime >= chapter.startTime && this.currentTime < endTime;
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // --- localStorage position memory ---

  private getStorageKey(src?: string): string {
    return STORAGE_KEY_PREFIX + (src || this.audioElement?.src || '');
  }

  private savePosition(): void {
    if (!this.audioElement?.src || this.currentTime < 5) return;
    try {
      localStorage.setItem(this.getStorageKey(), String(this.currentTime));
    } catch { /* storage full or unavailable */ }
  }

  private getSavedPosition(src: string): number {
    try {
      const saved = localStorage.getItem(this.getStorageKey(src));
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  }

  private clearSavedPosition(): void {
    try {
      localStorage.removeItem(this.getStorageKey());
    } catch { /* ignore */ }
  }

  // --- Events ---

  @dispatch('podcast-play', { bubbles: true, composed: true })
  private emitPlay() {
    return { player: this, episode: this.getCurrentEpisode() };
  }

  @dispatch('podcast-pause', { bubbles: true, composed: true })
  private emitPause() {
    return { player: this, episode: this.getCurrentEpisode() };
  }

  @dispatch('podcast-ended', { bubbles: true, composed: true })
  private emitEnded() {
    return { player: this, episode: this.getCurrentEpisode() };
  }

  @dispatch('podcast-time-update', { bubbles: true, composed: true })
  private emitTimeUpdate() {
    return { player: this, currentTime: this.currentTime, duration: this.duration };
  }

  @dispatch('podcast-rate-change', { bubbles: true, composed: true })
  private emitRateChange() {
    return { player: this, rate: this.playbackRate };
  }

  @dispatch('podcast-episode-change', { bubbles: true, composed: true })
  private emitEpisodeChange(episode: PodcastEpisode, index: number) {
    return { player: this, episode, index };
  }

  @dispatch('podcast-feed-loaded', { bubbles: true, composed: true })
  private emitFeedLoaded(feed: RSSFeedData) {
    return { player: this, feed };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-podcast-player': SnicePodcastPlayer;
  }
}
