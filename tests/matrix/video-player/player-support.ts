/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-video-player feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/video-player.md` plus `snice-video-player.types.ts`
 * describe a player whose whole state machine is driven by ONE `<video>` element
 * inside the shadow root. Every documented method is a call into it, and every
 * documented event is a reaction to one of its own events:
 *
 *   doc, properties: `src`, `poster`, `autoplay`, `muted`, `loop`,
 *        `controls = true`, `playbackRate = 1` (attr `playback-rate`),
 *        `currentTime = 0` (attr `current-time`), `volume = 1`,
 *        `variant: 'default'|'minimal'|'cinema'`, read-only `duration`
 *   doc, methods: `play` / `pause` / `toggle` / `seekTo` / `requestFullscreen` /
 *        `exitFullscreen` / `requestPictureInPicture` / `setPlaybackRate`
 *   doc, events: `video-play`, `video-pause`, `video-ended`,
 *        `video-time-update`, `video-fullscreen-change`, `video-volume-change`
 *   doc, parts: `base`, `video`, `controls`, `progress`
 *   doc, slots: "(default) — `<source>` elements for multiple formats"
 *   doc, keyboard: Space/K toggle, F fullscreen, M mute, ←/→ seek 5s,
 *        ↑/↓ volume 10%
 *
 * ── One environment compensation ───────────────────────────────────────────
 *
 * happy-dom implements no media pipeline: a `<video>` there never loads, never
 * plays, has `duration: NaN` and emits nothing. That is a property of the
 * ENVIRONMENT, so `primePlayback()` gives the shadow `<video>` the media contract the
 * component codes against — `play()`/`pause()` that flip `paused` and emit the
 * events a browser emits, plus a `duration` and a `buffered` range. It is not a
 * mock that answers what a test wants: the component's own state machine still
 * does every bit of the work, exactly as `tests/matrix/media-mock.ts` does for
 * the capture stack.
 *
 * `.ai/fuzzing.md`: expectations come from the doc, never from observed output;
 * a divergence is pinned with `it.fails` and a `MATRIX-video-player-N` id.
 */
import { Problems, expectClean, part, text, wait } from '../matrix-kit';
import { mount, removeComponent } from '../matrix-utils';
import { hasPart } from '../part-exact';
import '../../../packages/components/src/video-player/snice-video-player';
import type {
  SniceVideoPlayerElement, VideoVariant,
} from '../../../packages/components/src/video-player/snice-video-player.types';

export { Problems, expectClean, part, removeComponent, text, wait };
export type Player = SniceVideoPlayerElement & { shadowRoot: ShadowRoot };

/** Settle window: the component renders on a microtask plus a queued task. */
export const SETTLE = 25;

// ── Documented dimensions ───────────────────────────────────────────────────

/** doc: `variant: 'default'|'minimal'|'cinema' = 'default'` */
export const VARIANTS: VideoVariant[] = ['default', 'minimal', 'cinema'];
/** The rates `cyclePlaybackRate` walks, and the range `setPlaybackRate` takes. */
export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/** doc, keyboard: "ArrowRight/ArrowLeft: Seek forward/backward 5s" */
export const SEEK_STEP = 5;
/** doc, keyboard: "ArrowUp/ArrowDown: Volume up/down 10%" */
export const VOLUME_STEP = 0.1;

export const SRC = '/media/clip.mp4';
export const POSTER = '/media/poster.jpg';
export const DURATION = 120;

export interface PlayerVector {
  variant: VideoVariant;
  src: string;
  poster: string;
  controls: boolean;
  muted: boolean;
  loop: boolean;
  autoplay: boolean;
  volume: number;
  playbackRate: number;
}

export const DEFAULTS: PlayerVector = {
  variant: 'default',
  src: SRC,
  poster: '',
  controls: true,
  muted: false,
  loop: false,
  autoplay: false,
  volume: 1,
  playbackRate: 1,
};

export function vectorId(vector: PlayerVector): string {
  const flags = [
    vector.controls ? 'controls' : 'no-controls',
    vector.poster ? 'poster' : 'no-poster',
    vector.src ? 'src' : 'no-src',
    vector.muted ? 'muted' : '',
    vector.loop ? 'loop' : '',
    vector.autoplay ? 'autoplay' : '',
  ].filter(Boolean).join('+');
  return `${vector.variant}/${flags}`;
}

// ── Environment compensation (see the module header) ────────────────────────

/**
 * Give a shadow `<video>` the media-element contract the component codes
 * against: `play()`/`pause()` that flip `paused` and emit `play`/`pause`, a
 * settable `currentTime`, a `duration`, and a `buffered` range.
 */
export function primePlayback(video: HTMLVideoElement, duration = DURATION): void {
  const state = { paused: true, ended: false, currentTime: 0, buffered: 0 };

  Object.defineProperty(video, 'paused', { configurable: true, get: () => state.paused });
  Object.defineProperty(video, 'ended', { configurable: true, get: () => state.ended });
  Object.defineProperty(video, 'duration', { configurable: true, value: duration });
  Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => state.currentTime,
    set: (value: number) => { state.currentTime = value; },
  });
  Object.defineProperty(video, 'buffered', {
    configurable: true,
    get: () => ({ length: state.buffered > 0 ? 1 : 0, end: () => state.buffered }),
  });
  Object.defineProperty(video, 'play', {
    configurable: true,
    value: async () => {
      state.paused = false;
      state.ended = false;
      video.dispatchEvent(new Event('play'));
    },
  });
  Object.defineProperty(video, 'pause', {
    configurable: true,
    value: () => {
      state.paused = true;
      video.dispatchEvent(new Event('pause'));
    },
  });

  (video as any).__state = state;
}

/** The state object `primePlayback` installed, for the event helpers below. */
function stateOf(video: HTMLVideoElement): any {
  const state = (video as any).__state;
  if (!state) throw new Error('the <video> has not been primed for playback');
  return state;
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo.
 *
 * Attributes carry the string and number properties, the way the doc's markup
 * does (`<snice-video-player src="video.mp4" poster="poster.jpg">`). The two
 * booleans that DEFAULT TO TRUE cross the property channel when a combo turns
 * them off, because an absent attribute keeps the default.
 */
export async function makePlayer(
  vector: Partial<PlayerVector> = {},
  options: { html?: string; duration?: number; prime?: boolean } = {},
): Promise<Player> {
  const full = { ...DEFAULTS, ...vector };
  const attrs: Record<string, any> = { variant: full.variant };
  if (full.src) attrs.src = full.src;
  if (full.poster) attrs.poster = full.poster;
  if (full.muted) attrs.muted = true;
  if (full.loop) attrs.loop = true;
  if (full.autoplay) attrs.autoplay = true;
  if (full.playbackRate !== 1) attrs['playback-rate'] = full.playbackRate;
  if (full.volume !== 1) attrs.volume = full.volume;

  const el = await mount<Player>('snice-video-player', attrs, options.html ?? '');
  if (!full.controls) el.controls = false;
  await wait(SETTLE);

  if (options.prime !== false) {
    const video = videoEl(el);
    if (video) {
      primePlayback(video, options.duration ?? DURATION);
      video.dispatchEvent(new Event('loadedmetadata'));
      await wait(SETTLE);
    }
  }
  return el;
}

// ── Reading the rendered tree ───────────────────────────────────────────────

export function videoEl(el: Player): HTMLVideoElement | null {
  return el.shadowRoot.querySelector('video');
}

export function controlsBar(el: Player): HTMLElement | null {
  return part(el, 'controls');
}

export function progressTrack(el: Player): HTMLElement | null {
  return part(el, 'progress');
}

export function posterOverlay(el: Player): HTMLElement | null {
  return el.shadowRoot.querySelector('.video-poster');
}

export function centrePlay(el: Player): HTMLElement | null {
  return el.shadowRoot.querySelector('.video-center-play');
}

export function button(el: Player, name: string): HTMLElement | null {
  return el.shadowRoot.querySelector(`.video-btn-${name}`);
}

export function rateButton(el: Player): HTMLElement | null {
  return el.shadowRoot.querySelector('.video-rate-btn');
}

export function volumeSlider(el: Player): HTMLInputElement | null {
  return el.shadowRoot.querySelector('.video-volume-slider');
}

export function timeLabel(el: Player): string {
  return text(el.shadowRoot.querySelector('.video-time'));
}

/** The `width: N%` the progress bar is drawn to. */
export function progressPercent(el: Player): number {
  const style = el.shadowRoot.querySelector('.video-progress-bar')?.getAttribute('style') ?? '';
  const match = /width:\s*([\d.]+)%/.exec(style);
  return match ? Number(match[1]) : -1;
}

// ── The documented derivations ──────────────────────────────────────────────

/**
 * The player's own clock format: `m:ss`, growing an hours field past an hour.
 * Both the elapsed and the total readouts use it, and it is what makes the
 * `0:30 / 2:00` label a readable sentence rather than two numbers.
 */
export function expectedClock(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * doc: "CSS Parts — `base`: Outer container element; `video`: The `<video>`
 * element; `controls`: Control bar container; `progress`: Progress track
 * element".
 *
 * `base` and `video` are unconditional. `controls` and `progress` belong to the
 * control bar, which the documented `controls` switch governs.
 */
export function checkShell(problems: Problems, el: Player, vector: PlayerVector): void {
  const base = part(el, 'base');
  const video = part(el, 'video');
  if (!problems.check(!!base, 'no element exposes part="base"')) return;
  problems.check(hasPart(base, 'base'), 'part="base" is not an exact token');
  if (!problems.check(!!video, 'no element exposes part="video"')) return;
  problems.equal(video!.tagName, 'VIDEO', 'part="video" is not the <video> element');
  problems.check(base!.contains(video!), 'the <video> is not inside part="base"');

  // The documented property vector must survive the channel the doc's markup
  // uses for it.
  problems.equal(el.variant, vector.variant, 'variant');
  problems.equal(el.src, vector.src, 'src');
  problems.equal(el.poster, vector.poster, 'poster');
  problems.equal(el.controls, vector.controls, 'controls');
  problems.equal(el.muted, vector.muted, 'muted');
  problems.equal(el.loop, vector.loop, 'loop');
  problems.equal(el.autoplay, vector.autoplay, 'autoplay');

  // `variant` is answered by `:host([variant=…])` rules, so the attribute IS
  // the whole mechanism — a variant that never reaches the host is a variant
  // the stylesheet can never see.
  problems.equal(el.getAttribute('variant'), vector.variant,
    'the variant did not reach the attribute the stylesheet selects on');

  // The default slot is the documented multi-format extension point.
  problems.check(!!video!.querySelector('slot'),
    'the <video> renders no default slot for <source> children');
}

/**
 * The control bar, and everything documented to live in it.
 *
 * doc: `controls: boolean = true`; parts `controls` and `progress`; the
 * playback-rate button; the volume slider ("volume: 0-1"); the clock.
 */
export function checkControls(problems: Problems, el: Player, vector: PlayerVector): void {
  const bar = controlsBar(el);
  if (!vector.controls) {
    problems.check(!bar, 'controls="false" still rendered the control bar');
    return;
  }
  if (!problems.check(!!bar, 'the control bar is missing')) return;

  problems.check(!!progressTrack(el), 'no element exposes part="progress"');
  problems.check(!!button(el, 'play'), 'the control bar has no play button');
  problems.check(!!button(el, 'volume'), 'the control bar has no mute button');
  problems.check(!!button(el, 'fullscreen'), 'the control bar has no fullscreen button');
  problems.check(!!button(el, 'pip'), 'the control bar has no picture-in-picture button');
  problems.check(!!rateButton(el), 'the control bar has no playback-rate button');

  const slider = volumeSlider(el);
  if (problems.check(!!slider, 'the control bar has no volume slider')) {
    problems.equal(slider!.getAttribute('type'), 'range', 'the volume control is not a slider');
    problems.equal(slider!.getAttribute('min'), '0', 'the volume slider minimum');
    problems.equal(slider!.getAttribute('max'), '1', 'the volume slider maximum');
    problems.equal(slider!.getAttribute('aria-label'), 'Volume', 'the volume slider label');
  }

  // doc, Accessibility: "Controls carry ARIA labels; current time, duration,
  // and playback state are exposed to AT".
  problems.equal(button(el, 'play')?.getAttribute('aria-label'), 'Play',
    'the play button label while paused');
  problems.equal(rateButton(el)?.getAttribute('aria-label'), 'Playback speed',
    'the rate button label');
  problems.equal(button(el, 'fullscreen')?.getAttribute('aria-label'), 'Fullscreen',
    'the fullscreen button label');
  problems.equal(button(el, 'pip')?.getAttribute('aria-label'), 'Picture-in-Picture',
    'the picture-in-picture button label');
  problems.equal(text(rateButton(el)), `${vector.playbackRate}x`, 'the rate button reading');
}

/** The clock and the progress bar, for a given position. */
export function checkClock(
  problems: Problems,
  el: Player,
  position: number,
  duration: number,
): void {
  problems.equal(timeLabel(el), `${expectedClock(position)} / ${expectedClock(duration)}`,
    'the clock readout');
  const expected = duration > 0 ? (position / duration) * 100 : 0;
  problems.check(Math.abs(progressPercent(el) - expected) < 0.01,
    `the progress bar is at ${progressPercent(el)}%, expected ${expected}%`);
}

// ── Driving the media element ───────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record every documented event, in dispatch order. */
export function capturePlayer(el: Player): Seen[] {
  const seen: Seen[] = [];
  for (const type of [
    'video-play', 'video-pause', 'video-ended', 'video-time-update',
    'video-fullscreen-change', 'video-volume-change',
  ]) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Move the media clock and let the component react, as a browser would. */
export async function tick(el: Player, seconds: number): Promise<void> {
  const video = videoEl(el)!;
  stateOf(video).currentTime = seconds;
  video.dispatchEvent(new Event('timeupdate'));
  await wait(SETTLE);
}

/** End the media, the way a browser does at the last frame. */
export async function endMedia(el: Player): Promise<void> {
  const video = videoEl(el)!;
  const state = stateOf(video);
  state.paused = true;
  state.ended = true;
  video.dispatchEvent(new Event('pause'));
  video.dispatchEvent(new Event('ended'));
  await wait(SETTLE);
}

/** Announce buffered progress, the way a loading browser does. */
export async function buffer(el: Player, seconds: number): Promise<void> {
  const video = videoEl(el)!;
  stateOf(video).buffered = seconds;
  video.dispatchEvent(new Event('progress'));
  await wait(SETTLE);
}

/** The media element's own volume change, the source of `video-volume-change`. */
export async function mediaVolume(el: Player, volume: number, muted: boolean): Promise<void> {
  const video = videoEl(el)!;
  (video as any).volume = volume;
  (video as any).muted = muted;
  video.dispatchEvent(new Event('volumechange'));
  await wait(SETTLE);
}

/** Is the media element playing right now? */
export function isPlaying(el: Player): boolean {
  return !(videoEl(el) as any)?.paused;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

/** A keydown on the host, where the documented shortcuts are listened for. */
export async function press(el: Player, key: string): Promise<void> {
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  await wait(SETTLE);
}
