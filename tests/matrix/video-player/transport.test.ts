/**
 * snice-video-player matrix — the TRANSPORT: methods, events, and the readouts
 * that follow them.
 *
 *   doc, methods: `play()` / `pause()` / `toggle()` / `seekTo(time)` /
 *        `setPlaybackRate(rate)` / `requestFullscreen()` / `exitFullscreen()` /
 *        `requestPictureInPicture()`
 *   doc, events: `video-play → { player }`, `video-pause → { player }`,
 *        `video-ended → { player }`,
 *        `video-time-update → { player, currentTime, duration }`,
 *        `video-volume-change → { player, volume, muted }`
 *
 * Every one of those is a round trip through the `<video>` the component wraps,
 * so each test drives the media element the way a browser would and then reads
 * the player's own answer — the event, the property, and the control bar.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, RATES, buffer, button, capturePlayer, checkClock, click,
  endMedia, expectClean, isPlaying, makePlayer, mediaVolume, posterOverlay,
  progressPercent, rateButton, removeComponent, tick, timeLabel, videoEl,
  volumeSlider, wait, type Player,
} from './player-support';

let el: Player | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-video-player matrix: play / pause / toggle', () => {
  it('play() starts the media and announces video-play', async () => {
    el = await makePlayer();
    const seen = capturePlayer(el);
    await el.play();
    await wait(30);

    expect(isPlaying(el)).toBe(true);
    expect(seen.map(e => e.type)).toEqual(['video-play']);
    expect(seen[0].detail.player, 'the detail does not carry the player').toBe(el);
  });

  it('pause() stops the media and announces video-pause', async () => {
    el = await makePlayer();
    await el.play();
    await wait(30);
    const seen = capturePlayer(el);
    el.pause();
    await wait(30);

    expect(isPlaying(el)).toBe(false);
    expect(seen.map(e => e.type)).toEqual(['video-pause']);
    expect(seen[0].detail.player).toBe(el);
  });

  it('toggle() walks the state in both directions', async () => {
    // doc: "toggle() - Toggle play/pause".
    el = await makePlayer();
    const seen = capturePlayer(el);
    el.toggle();
    await wait(30);
    expect(isPlaying(el)).toBe(true);
    el.toggle();
    await wait(30);
    expect(isPlaying(el)).toBe(false);
    expect(seen.map(e => e.type)).toEqual(['video-play', 'video-pause']);
  });

  it('the play button label follows the playback state', async () => {
    // doc, Accessibility: "playback state is exposed to AT". The label is the
    // only place that state is announced.
    el = await makePlayer();
    expect(button(el, 'play')!.getAttribute('aria-label')).toBe('Play');
    await el.play();
    await wait(30);
    expect(button(el, 'play')!.getAttribute('aria-label')).toBe('Pause');
    el.pause();
    await wait(30);
    expect(button(el, 'play')!.getAttribute('aria-label')).toBe('Play');
  });

  it('the play button drives the same transport the methods do', async () => {
    el = await makePlayer();
    const seen = capturePlayer(el);
    click(button(el, 'play'));
    await wait(30);
    expect(isPlaying(el)).toBe(true);
    click(button(el, 'play'));
    await wait(30);
    expect(seen.map(e => e.type)).toEqual(['video-play', 'video-pause']);
  });

  it('clicking the video toggles playback', async () => {
    // The whole picture is a play/pause target, which is what every player
    // does and what the centre affordance implies.
    el = await makePlayer();
    videoEl(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(30);
    expect(isPlaying(el)).toBe(true);
  });

  it('clicking the poster starts playback and takes the poster away', async () => {
    // doc: `poster` is the still shown BEFORE playback, so starting playback
    // is exactly what removes it.
    el = await makePlayer({ poster: '/media/poster.jpg' });
    expect(posterOverlay(el)).not.toBeNull();
    click(posterOverlay(el));
    await wait(30);
    expect(isPlaying(el)).toBe(true);
    expect(posterOverlay(el), 'the poster survived the start of playback').toBeNull();
  });

  it('the media reaching its end announces video-ended', async () => {
    el = await makePlayer();
    await el.play();
    await wait(30);
    const seen = capturePlayer(el);
    await endMedia(el);

    expect(seen.map(e => e.type)).toEqual(['video-ended']);
    expect(seen[0].detail.player).toBe(el);
    expect(button(el, 'play')!.getAttribute('aria-label'),
      'the player still claims to be playing after the media ended').toBe('Play');
  });
});

describe('snice-video-player matrix: the clock', () => {
  for (const position of [0, 5, 30, 61, 119]) {
    it(`video-time-update at ${position}s`, async () => {
      // doc: `video-time-update → { player, currentTime, duration }`, and the
      // clock plus the progress bar are the visible half of the same fact.
      el = await makePlayer();
      const seen = capturePlayer(el);
      await tick(el, position);

      const problems = new Problems();
      problems.equal(seen.map(e => e.type).join(','), 'video-time-update',
        'the dispatched event sequence');
      problems.equal(seen[0]?.detail.currentTime, position, 'detail.currentTime');
      problems.equal(seen[0]?.detail.duration, 120, 'detail.duration');
      problems.equal(seen[0]?.detail.player, el, 'detail.player');
      problems.equal(el.currentTime, position, 'the currentTime property');
      checkClock(problems, el, position, 120);
      expectClean(problems, `tick/${position}`);
    });
  }

  it('seekTo moves the media and the readout together', async () => {
    // doc: "seekTo(time) - Seek to time in seconds".
    el = await makePlayer();
    el.seekTo(45);
    await wait(30);
    expect(videoEl(el)!.currentTime).toBe(45);
    expect(el.currentTime).toBe(45);
    expect(timeLabel(el)).toBe('0:45 / 2:00');
  });

  it('seekTo clamps to the media it has', async () => {
    // A player cannot seek past its own last frame, or before its first.
    el = await makePlayer();
    el.seekTo(1000);
    await wait(20);
    expect(el.currentTime, 'a seek past the end was not clamped').toBe(120);
    el.seekTo(-50);
    await wait(20);
    expect(el.currentTime, 'a seek before the start was not clamped').toBe(0);
  });

  it('the progress bar tracks the fraction played', async () => {
    el = await makePlayer();
    const problems = new Problems();
    for (const [position, percent] of [[0, 0], [30, 25], [60, 50], [120, 100]] as const) {
      await tick(el, position);
      problems.check(Math.abs(progressPercent(el) - percent) < 0.01,
        `at ${position}s the bar is at ${progressPercent(el)}%, expected ${percent}%`);
    }
    expectClean(problems, 'progress');
  });

  it('buffered progress is drawn behind the played progress', async () => {
    // Two bars over the same track: what has been played and what has been
    // downloaded. They are different numbers and must not be confused.
    el = await makePlayer();
    await tick(el, 30);
    await buffer(el, 60);
    const buffered = el.shadowRoot.querySelector('.video-progress-buffered')!.getAttribute('style');
    expect(buffered).toContain('50%');
    expect(progressPercent(el)).toBe(25);
  });
});

describe('snice-video-player matrix: rate and volume', () => {
  for (const rate of RATES) {
    it(`setPlaybackRate(${rate})`, async () => {
      // doc: "setPlaybackRate(rate) - Set playback speed", and
      // `playbackRate: number = 1  // attr: playback-rate`.
      el = await makePlayer();
      el.setPlaybackRate(rate);
      await wait(30);

      const problems = new Problems();
      problems.equal(el.playbackRate, rate, 'the playbackRate property');
      problems.equal((videoEl(el) as any).playbackRate, rate, 'the media element rate');
      problems.equal(rateButton(el)?.textContent?.trim(), `${rate}x`, 'the rate readout');
      expectClean(problems, `rate/${rate}`);
    });
  }

  it('the rate button cycles the documented speeds and comes back around', async () => {
    el = await makePlayer();
    const seen: number[] = [];
    for (let i = 0; i < RATES.length; i++) {
      click(rateButton(el));
      await wait(20);
      seen.push(el.playbackRate);
    }
    // Starting at 1 (the default), the cycle visits every rate exactly once and
    // returns to where it began.
    expect(new Set(seen).size, 'the cycle repeats a rate before finishing')
      .toBe(RATES.length);
    expect(seen.at(-1), 'the cycle does not return to the default').toBe(1);
  });

  it('the media element announcing a volume change is repeated as video-volume-change', async () => {
    // doc: `video-volume-change → { player, volume, muted }`.
    el = await makePlayer();
    const seen = capturePlayer(el);
    await mediaVolume(el, 0.4, false);

    expect(seen.map(e => e.type)).toEqual(['video-volume-change']);
    expect(seen[0].detail.volume).toBeCloseTo(0.4, 5);
    expect(seen[0].detail.muted).toBe(false);
    expect(seen[0].detail.player).toBe(el);
    expect(el.volume).toBeCloseTo(0.4, 5);
  });

  it('the volume slider sets the volume and announces it', async () => {
    el = await makePlayer();
    const seen = capturePlayer(el);
    const slider = volumeSlider(el)!;
    slider.value = '0.25';
    slider.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await wait(30);

    expect(el.volume).toBeCloseTo(0.25, 5);
    expect(seen.some(event => event.type === 'video-volume-change')).toBe(true);
  });

  it('the mute button toggles and restores the previous volume', async () => {
    // Muting is not "set the volume to zero": the level the listener chose has
    // to come back when they unmute.
    el = await makePlayer();
    el.volume = 0.6;
    await wait(20);
    click(button(el, 'volume'));
    await wait(30);
    expect(el.muted, 'the mute button did not mute').toBe(true);

    click(button(el, 'volume'));
    await wait(30);
    expect(el.muted).toBe(false);
    expect(el.volume, 'unmuting did not restore the previous level').toBeCloseTo(0.6, 5);
  });

  it('the mute button label follows the audible state', async () => {
    // doc, Accessibility: "Controls carry ARIA labels".
    el = await makePlayer();
    expect(button(el, 'volume')!.getAttribute('aria-label')).toBe('Mute');
    click(button(el, 'volume'));
    await wait(30);
    expect(button(el, 'volume')!.getAttribute('aria-label')).toBe('Unmute');
  });

  it('a volume of zero reads as muted to the label', async () => {
    // Silence is silence however it was reached; the icon and the label must
    // agree with what the listener hears.
    el = await makePlayer();
    el.volume = 0;
    await wait(30);
    expect(button(el, 'volume')!.getAttribute('aria-label')).toBe('Unmute');
  });

  it('the muted slider reads zero without losing the level behind it', async () => {
    el = await makePlayer();
    el.volume = 0.8;
    await wait(20);
    click(button(el, 'volume'));
    await wait(30);
    expect(volumeSlider(el)!.value).toBe('0');
    expect(el.volume, 'muting threw the volume level away').toBeCloseTo(0.8, 5);
  });

  it('the volume property reaches the media element', async () => {
    // doc: `volume: number = 1;  // 0-1`. The player's volume IS the media's.
    el = await makePlayer();
    el.volume = 0.3;
    await wait(30);
    expect((videoEl(el) as any).volume).toBeCloseTo(0.3, 5);
  });
});

describe('snice-video-player matrix: fullscreen and picture-in-picture', () => {
  it('requestFullscreen asks the container, not the video', async () => {
    // doc: "requestFullscreen() - Enter fullscreen (async)". The CONTAINER is
    // what goes fullscreen, because the controls have to come with it.
    el = await makePlayer();
    const container = el.shadowRoot.querySelector('.video-container') as any;
    const asked: string[] = [];
    container.requestFullscreen = async () => { asked.push('container'); };
    (videoEl(el) as any).requestFullscreen = async () => { asked.push('video'); };

    await el.requestFullscreen();
    expect(asked).toEqual(['container']);
  });

  it('exitFullscreen does nothing when nothing is fullscreen', async () => {
    // doc: "exitFullscreen() - Exit fullscreen (async)". Called on a page that
    // is not fullscreen it must resolve quietly rather than throw.
    el = await makePlayer();
    await expect(el.exitFullscreen()).resolves.toBeUndefined();
  });

  it('requestPictureInPicture asks the video element', async () => {
    // doc: "requestPictureInPicture() - Toggle picture-in-picture (async)".
    el = await makePlayer();
    const asked: string[] = [];
    (videoEl(el) as any).requestPictureInPicture = async () => { asked.push('enter'); };
    await el.requestPictureInPicture();
    expect(asked).toEqual(['enter']);
  });

  it('the fullscreen and picture-in-picture buttons reach their methods', async () => {
    el = await makePlayer();
    const container = el.shadowRoot.querySelector('.video-container') as any;
    const asked: string[] = [];
    container.requestFullscreen = async () => { asked.push('fullscreen'); };
    (videoEl(el) as any).requestPictureInPicture = async () => { asked.push('pip'); };

    click(button(el, 'fullscreen'));
    click(button(el, 'pip'));
    await wait(30);
    expect(asked.sort()).toEqual(['fullscreen', 'pip']);
  });
});

describe('snice-video-player matrix: changing the source', () => {
  it('a new src resets the transport to the beginning', async () => {
    // doc: `src` is the media the player is showing; pointing it at something
    // else cannot leave the previous clip's position and duration on screen.
    el = await makePlayer();
    await tick(el, 60);
    expect(el.currentTime).toBe(60);

    el.src = '/media/other.mp4';
    await wait(30);
    expect(el.currentTime, 'the previous position survived a source change').toBe(0);
    expect(el.duration, 'the previous duration survived a source change').toBe(0);
    expect(timeLabel(el)).toBe('0:00 / 0:00');
  });

  it('the src reaches the media element', async () => {
    el = await makePlayer({ src: '/media/first.mp4' });
    expect(videoEl(el)!.src).toContain('/media/first.mp4');
  });
});

describe('snice-video-player matrix: default vector', () => {
  it('the documented defaults are the documented defaults', async () => {
    // Every default in the doc's property block, on one un-attributed element.
    const el2 = await makePlayer({ ...DEFAULTS, src: '', variant: 'default' }, { prime: false });
    el = el2;
    const problems = new Problems();
    problems.equal(el2.src, '', 'src');
    problems.equal(el2.poster, '', 'poster');
    problems.equal(el2.autoplay, false, 'autoplay');
    problems.equal(el2.muted, false, 'muted');
    problems.equal(el2.loop, false, 'loop');
    problems.equal(el2.controls, true, 'controls');
    problems.equal(el2.playbackRate, 1, 'playbackRate');
    problems.equal(el2.currentTime, 0, 'currentTime');
    problems.equal(el2.volume, 1, 'volume');
    problems.equal(el2.variant, 'default', 'variant');
    expectClean(problems, 'defaults');
  });
});
