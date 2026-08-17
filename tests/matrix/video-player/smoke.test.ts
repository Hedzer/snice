/**
 * Smoke slice of the snice-video-player matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/video-player/`, 71 combos across the shell,
 * the transport, and the documented keyboard shortcuts) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle, so it cannot claim less than the suite it stands in for.
 *
 * The marquee combos: the doc's basic-usage markup, the transport round trip,
 * the clock and progress bar, the volume round trip, one keyboard shortcut of
 * each kind, and the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, POSTER, Problems, SRC, button, capturePlayer, centrePlay, checkClock,
  checkControls, checkShell, controlsBar, expectClean, isPlaying, makePlayer, part,
  posterOverlay, press, primePlayback, removeComponent, tick, timeLabel, videoEl,
  wait, type Player, type PlayerVector,
} from './player-support';

let el: Player | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('video-player matrix smoke', () => {
  it('the documented basic-usage markup renders the whole shell', async () => {
    const vector: PlayerVector = { ...DEFAULTS, poster: POSTER };
    el = await makePlayer(vector);
    const problems = new Problems();
    checkShell(problems, el, vector);
    checkControls(problems, el, vector);
    expectClean(problems, 'smoke/shell');
    expect(posterOverlay(el), 'the authored poster rendered no overlay').not.toBeNull();
  });

  it('controls="false" removes the control bar and its parts', async () => {
    const vector: PlayerVector = { ...DEFAULTS, controls: false };
    el = await makePlayer(vector);
    const problems = new Problems();
    checkShell(problems, el, vector);
    checkControls(problems, el, vector);
    expectClean(problems, 'smoke/no-controls');
    expect(part(el, 'progress')).toBeNull();
  });

  it('play, pause and the events between them', async () => {
    el = await makePlayer();
    const seen = capturePlayer(el);
    await el.play();
    await wait(30);
    expect(isPlaying(el)).toBe(true);
    expect(button(el, 'play')!.getAttribute('aria-label')).toBe('Pause');
    el.pause();
    await wait(30);
    expect(seen.map(event => event.type)).toEqual(['video-play', 'video-pause']);
  });

  it('the clock and the progress bar follow the media', async () => {
    el = await makePlayer();
    const seen = capturePlayer(el);
    await tick(el, 30);
    const problems = new Problems();
    checkClock(problems, el, 30, 120);
    expectClean(problems, 'smoke/clock');
    expect(seen[0].detail).toMatchObject({ currentTime: 30, duration: 120 });
  });

  it('seekTo moves the media and clamps at the end', async () => {
    el = await makePlayer();
    el.seekTo(45);
    await wait(20);
    expect(timeLabel(el)).toBe('0:45 / 2:00');
    el.seekTo(1000);
    await wait(20);
    expect(el.currentTime).toBe(120);
  });

  it('the mute button round-trips the listener\'s own level', async () => {
    el = await makePlayer();
    el.volume = 0.6;
    await wait(20);
    button(el, 'volume')!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(30);
    expect(el.muted).toBe(true);
    button(el, 'volume')!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(30);
    expect(el.volume).toBeCloseTo(0.6, 5);
  });

  it('the documented keyboard shortcuts reach the transport, the clock and the volume', async () => {
    el = await makePlayer();
    await press(el, ' ');
    expect(isPlaying(el), 'Space did not toggle playback').toBe(true);
    await tick(el, 30);
    await press(el, 'ArrowRight');
    expect(el.currentTime, 'ArrowRight did not seek five seconds').toBe(35);
    await press(el, 'ArrowDown');
    expect(el.volume, 'ArrowDown did not lower the volume a tenth').toBeCloseTo(0.9, 5);
    await press(el, 'm');
    expect(el.muted, '"m" did not mute').toBe(true);
  });

  // ── Standing findings — see tests/matrix/video-player/findings.test.ts ─────

  // MATRIX-video-player-1: `@watch('src')` zeroes `currentTime` during the same
  // attribute pass that set it, so the documented `current-time` never lands.
  it.fails('MATRIX-video-player-1: current-time="30" opens the video at 30 seconds', async () => {
    const authored = document.createElement('snice-video-player') as any;
    authored.setAttribute('src', SRC);
    authored.setAttribute('current-time', '30');
    document.body.appendChild(authored);
    await authored.ready;
    await wait(30);
    el = authored as Player;

    primePlayback(videoEl(el)!);
    videoEl(el)!.dispatchEvent(new Event('loadedmetadata'));
    await wait(30);
    expect(el.currentTime).toBe(30);
  });

  // MATRIX-video-player-2: the control bar is gated on `src`, so the documented
  // `<source>` markup renders an uncontrollable player.
  it.fails('MATRIX-video-player-2: the documented <source> markup still renders its controls', async () => {
    el = await makePlayer(
      { ...DEFAULTS, src: '', poster: POSTER },
      { html: '<source src="/media/clip.mp4" type="video/mp4">', prime: false },
    );
    expect(controlsBar(el)).not.toBeNull();
    expect(centrePlay(el)).not.toBeNull();
  });
});
