/**
 * snice-music-player matrix — component-specific harness.
 *
 * The shared `../matrix-utils` carries the generic parts (cross(), mount(),
 * Problems/expectClean, record()). This module adds the two things a music
 * player matrix cannot get from a generic helper:
 *
 *   1. A deterministic `Audio` stand-in. The component builds `new Audio()` in
 *      its @ready hook and derives `state`, `duration` and `currentTime` from
 *      that element's events. happy-dom has no media pipeline, so without a
 *      stand-in every playback combo would be asserting nothing. FakeAudio is
 *      not a "mock that returns what the test wants": it implements the media
 *      element contract the component codes against (play/pause/ended/
 *      timeupdate/loadedmetadata + the paused/ended/duration fields), so the
 *      component's own state machine still does all the work.
 *
 *   2. The rendered-shell oracle, derived from docs/ai/components/music-player.md:
 *      which sections exist for a given {showArtwork, showTrackInfo,
 *      showControls, showVolume, showPlaylist, compact} vector, and what the
 *      track info / playlist / transport controls must say for a given track
 *      list and index.
 *
 * Oracle sources (docs/ai/components/music-player.md + snice-music-player.types.ts):
 *   · showArtwork / showTrackInfo / showControls / showVolume / showPlaylist
 *     each show their section; `compact` is a layout variant of the container.
 *   · CSS parts: `base` (outer container), `controls`, `playlist`.
 *   · Track: { id, title, artist?, album?, artwork?, src, duration? } — every
 *     optional field is rendered only when present.
 *   · currentTrackIndex selects the track; getCurrentTrack() is the same choice.
 *   · Time is displayed as m:ss (the player's only time format, used for the
 *     elapsed/duration labels and for playlist row durations).
 */
import { mount, settle, shadow, text, Problems, type MountOptions } from './matrix-utils';
import '../../../packages/components/src/music-player/snice-music-player';
import type { Track } from '../../../packages/components/src/music-player/snice-music-player.types';

export type { Track };

// ── Deterministic media element ─────────────────────────────────────────────

/** src → duration, so `load()` can report metadata the way a real load does. */
const DURATIONS = new Map<string, number>();

export function declareDuration(src: string, seconds: number): void {
  DURATIONS.set(src, seconds);
}

/**
 * The media element the component talks to. Every transition the component
 * listens for is reachable from a test, and nothing transitions on its own.
 */
export class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];

  src = '';
  volume = 1;
  muted = false;
  currentTime = 0;
  duration = 0;
  paused = true;
  ended = false;
  playCalls = 0;
  loadCalls = 0;

  constructor() {
    super();
    FakeAudio.instances.push(this);
  }

  // The component registers its listeners with `{ signal }` (an AbortController
  // it aborts on dispose). Honour that explicitly rather than relying on the
  // DOM implementation under test to support signal-scoped listeners.
  addEventListener(type: string, callback: any, options?: any): void {
    super.addEventListener(type, callback, options);
    const signal: AbortSignal | undefined = options && typeof options === 'object'
      ? options.signal : undefined;
    if (signal) {
      signal.addEventListener('abort', () => {
        super.removeEventListener(type, callback, options);
      }, { once: true });
    }
  }

  load(): void {
    this.loadCalls++;
    this.duration = DURATIONS.get(this.src) ?? 0;
    this.ended = false;
    this.dispatchEvent(new Event('loadedmetadata'));
  }

  async play(): Promise<void> {
    this.playCalls++;
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event('play'));
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  /** Drive a timeupdate the way a playing media element would. */
  tick(seconds: number): void {
    this.currentTime = seconds;
    this.dispatchEvent(new Event('timeupdate'));
  }

  /** Run the current track off its end. */
  finish(): void {
    this.ended = true;
    this.paused = true;
    this.dispatchEvent(new Event('ended'));
  }

  /** A media error (unreachable src, unsupported codec, …). */
  fail(): void {
    this.dispatchEvent(new Event('error'));
  }
}

let originalAudio: any;

/** Install FakeAudio as the page's `Audio`. Call in beforeEach. */
export function installFakeAudio(): void {
  originalAudio = (globalThis as any).Audio;
  (globalThis as any).Audio = FakeAudio;
  FakeAudio.instances = [];
}

/** Restore the real (or previously installed) `Audio`. Call in afterEach. */
export function restoreAudio(): void {
  (globalThis as any).Audio = originalAudio;
  FakeAudio.instances = [];
}

/** The media element a mounted player is driving. */
export function audioOf(player: any): FakeAudio {
  const audio = player.audioElement as FakeAudio | null;
  if (!audio) throw new Error('player has no audio element');
  return audio;
}

// ── Track fixtures ──────────────────────────────────────────────────────────

/**
 * The four documented track shapes. `Track` makes artist, album, artwork and
 * duration optional, and the types file adds trackUrl/artistUrl (a title/artist
 * that becomes a link) — so those are the axes a rendering matrix has to cross,
 * not decorative variations of the same shape.
 */
export const SHAPES = ['minimal', 'artist', 'full', 'linked'] as const;
export type Shape = typeof SHAPES[number];

export function trackFor(shape: Shape, index: number): Track {
  const n = index + 1;
  const src = `mem://track-${shape}-${n}.mp3`;
  declareDuration(src, 60 + index * 30);
  const base: Track = { id: `t${n}`, title: `Title ${n}`, src };
  switch (shape) {
    case 'minimal':
      return base;
    case 'artist':
      return { ...base, artist: `Artist ${n}`, duration: 60 + index * 30 };
    case 'full':
      return {
        ...base,
        artist: `Artist ${n}`,
        album: `Album ${n}`,
        artwork: `mem://art-${n}.png`,
        duration: 60 + index * 30,
      };
    case 'linked':
      return {
        ...base,
        artist: `Artist ${n}`,
        trackUrl: `https://example.test/track/${n}`,
        artistUrl: `https://example.test/artist/${n}`,
        duration: 60 + index * 30,
      };
  }
}

export function tracksFor(shape: Shape, count: number): Track[] {
  return Array.from({ length: count }, (_, i) => trackFor(shape, i));
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface PlayerOptions extends MountOptions {
  tracks?: Track[];
}

export async function makePlayer(options: PlayerOptions = {}): Promise<any> {
  const { tracks, props, ...rest } = options;
  const player = await mount<any>('snice-music-player', { ...rest, props });
  if (tracks) {
    player.tracks = tracks;
    await settle(30);
  }
  return player;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** The player's one time format: whole minutes, zero-padded whole seconds. */
export function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds === Infinity) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export interface Vector {
  artwork: boolean;
  trackInfo: boolean;
  controls: boolean;
  volume: boolean;
  playlist: boolean;
  compact: boolean;
}

export function propsFor(vector: Vector): Record<string, any> {
  return {
    showArtwork: vector.artwork,
    showTrackInfo: vector.trackInfo,
    showControls: vector.controls,
    showVolume: vector.volume,
    showPlaylist: vector.playlist,
    compact: vector.compact,
  };
}

const q = (player: any, selector: string) => shadow(player).querySelector(selector);
const qa = (player: any, selector: string) => [...shadow(player).querySelectorAll(selector)];

/**
 * Section presence for a feature vector. Each rule is one documented sentence:
 * a `show*` flag shows its section, and the info wrapper exists only when at
 * least one of the two things it wraps does.
 */
export function checkShell(problems: Problems, player: any, vector: Vector, tracks: Track[]): void {
  const base = q(player, '[part~="base"]');
  problems.ok(!!base, 'no [part="base"] container');
  if (base) {
    problems.eq('base has the compact modifier',
      base.classList.contains('player-container--compact'), vector.compact);
  }

  problems.eq('.player-info present', !!q(player, '.player-info'),
    vector.artwork || vector.trackInfo);
  problems.eq('.player-artwork present', !!q(player, '.player-artwork'), vector.artwork);
  problems.eq('.player-track-info present', !!q(player, '.player-track-info'), vector.trackInfo);

  problems.eq('[part="controls"] present', !!q(player, '[part~="controls"]'), vector.controls);
  // The volume control lives inside the controls block, so showVolume can only
  // produce anything while the controls themselves are shown.
  problems.eq('.player-volume present', !!q(player, '.player-volume'),
    vector.controls && vector.volume);

  // The playlist section is a list of tracks: with no tracks there is no list.
  problems.eq('[part="playlist"] present', !!q(player, '[part~="playlist"]'),
    vector.playlist && tracks.length > 0);
}

/** Artwork: the track's image when it has one, the placeholder when it does not. */
export function checkArtwork(problems: Problems, player: any, track: Track | null): void {
  const img = q(player, '.player-artwork img');
  const placeholder = q(player, '.player-artwork-placeholder');
  const hasArtwork = !!track?.artwork;
  problems.eq('artwork <img> present', !!img, hasArtwork);
  problems.eq('artwork placeholder present', !!placeholder, !hasArtwork);
  if (hasArtwork && img) {
    problems.eq('artwork src', img.getAttribute('src'), track!.artwork);
    problems.eq('artwork alt', img.getAttribute('alt'), track!.title);
  }
}

/**
 * Track info: title (a link when trackUrl is set), artist only when the track
 * has one (a link when artistUrl is set), album only when the track has one.
 * With no track loaded the title falls back to "No track loaded".
 */
export function checkTrackInfo(problems: Problems, player: any, track: Track | null): void {
  const title = q(player, '.player-track-title');
  problems.ok(!!title, 'no .player-track-title');
  if (title) {
    problems.eq('title text', text(title), track?.title || 'No track loaded');
    const linked = !!track?.trackUrl;
    problems.eq('title is an <a>', title.tagName.toLowerCase() === 'a', linked);
    if (linked) problems.eq('title href', title.getAttribute('href'), track!.trackUrl);
  }

  const artist = q(player, '.player-track-artist');
  problems.eq('.player-track-artist present', !!artist, !!track?.artist);
  if (artist && track?.artist) {
    problems.eq('artist text', text(artist), track.artist);
    const linked = !!track.artistUrl;
    problems.eq('artist is an <a>', artist.tagName.toLowerCase() === 'a', linked);
    if (linked) problems.eq('artist href', artist.getAttribute('href'), track.artistUrl);
  }

  const album = q(player, '.player-track-album');
  problems.eq('.player-track-album present', !!album, !!track?.album);
  if (album && track?.album) problems.eq('album text', text(album), track.album);
}

/**
 * The playlist: one row per track in track order, the row for
 * currentTrackIndex marked active, 1-based numbering, and each optional field
 * present only when the track carries it.
 */
export function checkPlaylist(
  problems: Problems, player: any, tracks: Track[], currentIndex: number,
): void {
  const items = qa(player, '.player-playlist-item');
  problems.eq('playlist row count', items.length, tracks.length);
  if (items.length !== tracks.length) return;

  items.forEach((item, i) => {
    const track = tracks[i];
    problems.eq(`row ${i} active`, item.classList.contains('active'), i === currentIndex);
    problems.eq(`row ${i} number`,
      text(item.querySelector('.player-playlist-item-number')), String(i + 1));
    problems.eq(`row ${i} title`,
      text(item.querySelector('.player-playlist-item-title')), track.title);

    const artist = item.querySelector('.player-playlist-item-artist');
    problems.eq(`row ${i} artist present`, !!artist, !!track.artist);
    if (artist && track.artist) problems.eq(`row ${i} artist`, text(artist), track.artist);

    const artwork = item.querySelector('.player-playlist-item-artwork');
    problems.eq(`row ${i} artwork present`, !!artwork, !!track.artwork);

    const duration = item.querySelector('.player-playlist-item-duration');
    problems.eq(`row ${i} duration present`, !!duration, !!track.duration);
    if (duration && track.duration) {
      problems.eq(`row ${i} duration`, text(duration), formatTime(track.duration));
    }
  });
}

/**
 * Transport controls: the play/pause button reflects `state`, transport is
 * disabled with an empty track list, and shuffle/repeat show their own state.
 */
export function checkTransport(
  problems: Problems, player: any,
  expect_: { state: string; tracks: number; shuffle: boolean; repeat: string },
): void {
  const playPause = q(player, '.player-btn-play-pause') as HTMLButtonElement | null;
  problems.ok(!!playPause, 'no play/pause button');
  if (playPause) {
    const playing = expect_.state === 'playing';
    problems.eq('play/pause label', playPause.getAttribute('aria-label'), playing ? 'Pause' : 'Play');
    problems.eq('play/pause title', playPause.getAttribute('title'), playing ? 'Pause' : 'Play');
    problems.eq('play/pause playing class', playPause.classList.contains('playing'), playing);
    problems.eq('play/pause disabled', playPause.hasAttribute('disabled'), expect_.tracks === 0);
  }

  for (const cls of ['.player-btn-prev', '.player-btn-next']) {
    const button = q(player, cls) as HTMLButtonElement | null;
    problems.ok(!!button, `no ${cls} button`);
    if (button) {
      problems.eq(`${cls} disabled`, button.hasAttribute('disabled'), expect_.tracks === 0);
    }
  }

  const shuffle = q(player, '.player-btn-shuffle');
  problems.ok(!!shuffle, 'no shuffle button');
  if (shuffle) problems.eq('shuffle active', shuffle.classList.contains('active'), expect_.shuffle);

  const repeat = q(player, '.player-btn-repeat');
  problems.ok(!!repeat, 'no repeat button');
  if (repeat) {
    problems.eq('repeat active', repeat.classList.contains('active'), expect_.repeat !== 'off');
    problems.eq('repeat label', repeat.getAttribute('aria-label'), `Repeat ${expect_.repeat}`);
  }
}

/**
 * The progress region: an ARIA slider whose bounds and value are the track
 * position, plus the two m:ss labels either side of it.
 */
export function checkProgress(
  problems: Problems, player: any, currentTime: number, duration: number,
): void {
  problems.eq('elapsed label', text(q(player, '.player-time-current')), formatTime(currentTime));
  problems.eq('duration label', text(q(player, '.player-time-duration')), formatTime(duration));

  const slider = q(player, '.player-progress');
  problems.ok(!!slider, 'no .player-progress');
  if (!slider) return;
  problems.eq('progress role', slider.getAttribute('role'), 'slider');
  problems.eq('progress min', slider.getAttribute('aria-valuemin'), '0');
  problems.eq('progress max', slider.getAttribute('aria-valuemax'), String(Math.floor(duration)));
  problems.eq('progress now', slider.getAttribute('aria-valuenow'), String(Math.floor(currentTime)));
  problems.eq('progress text', slider.getAttribute('aria-valuetext'),
    `${formatTime(currentTime)} of ${formatTime(duration)}`);

  const bar = slider.querySelector('.player-progress-bar') as HTMLElement | null;
  problems.ok(!!bar, 'no .player-progress-bar');
  if (bar) {
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    problems.eq('progress bar width', bar.style.width, `${percent}%`);
  }
}

export { shadow, text };
