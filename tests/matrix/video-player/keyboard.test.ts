/**
 * snice-video-player matrix — the documented KEYBOARD shortcuts.
 *
 * doc, Keyboard Navigation:
 *   · Space/K: Toggle play/pause
 *   · F: Toggle fullscreen
 *   · M: Toggle mute
 *   · ArrowRight/ArrowLeft: Seek forward/backward 5s
 *   · ArrowUp/ArrowDown: Volume up/down 10%
 *
 * Each shortcut is crossed against the state it acts on — the transport in both
 * directions, the clock at both ends of the media, the volume at both rails —
 * because a shortcut that works only from the middle is a shortcut that gets a
 * player stuck.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  Problems, SEEK_STEP, VOLUME_STEP, capturePlayer, expectClean, isPlaying, makePlayer,
  press, removeComponent, tick, videoEl, wait, type Player,
} from './player-support';

let el: Player | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-video-player matrix: transport keys', () => {
  for (const key of [' ', 'k']) {
    it(`"${key === ' ' ? 'Space' : key}" toggles play and pause`, async () => {
      el = await makePlayer();
      const seen = capturePlayer(el);

      await press(el, key);
      expect(isPlaying(el), 'the key did not start playback').toBe(true);
      await press(el, key);
      expect(isPlaying(el), 'the key did not stop playback').toBe(false);
      expect(seen.map(event => event.type)).toEqual(['video-play', 'video-pause']);
    });
  }

  it('"f" asks for fullscreen', async () => {
    el = await makePlayer();
    const container = el.shadowRoot.querySelector('.video-container') as any;
    const asked: string[] = [];
    container.requestFullscreen = async () => { asked.push('fullscreen'); };
    await press(el, 'f');
    expect(asked).toEqual(['fullscreen']);
  });

  it('"m" toggles mute in both directions', async () => {
    el = await makePlayer();
    await press(el, 'm');
    expect(el.muted, '"m" did not mute').toBe(true);
    await press(el, 'm');
    expect(el.muted, '"m" did not unmute').toBe(false);
  });

  it('"m" announces the volume change it makes', async () => {
    // doc: `video-volume-change → { player, volume, muted }`. Muting IS a
    // volume change, however it was triggered.
    el = await makePlayer();
    const seen = capturePlayer(el);
    await press(el, 'm');
    expect(seen.map(event => event.type)).toEqual(['video-volume-change']);
    expect(seen[0].detail.muted).toBe(true);
  });
});

describe('snice-video-player matrix: seek keys', () => {
  it('ArrowRight seeks forward five seconds', async () => {
    el = await makePlayer();
    await tick(el, 30);
    await press(el, 'ArrowRight');
    expect(el.currentTime).toBe(30 + SEEK_STEP);
  });

  it('ArrowLeft seeks backward five seconds', async () => {
    el = await makePlayer();
    await tick(el, 30);
    await press(el, 'ArrowLeft');
    expect(el.currentTime).toBe(30 - SEEK_STEP);
  });

  it('ArrowLeft stops at the beginning', async () => {
    // doc: "Seek forward/backward 5s" — a five-second step from second two
    // lands at zero, not at minus three.
    el = await makePlayer();
    await tick(el, 2);
    await press(el, 'ArrowLeft');
    expect(el.currentTime).toBe(0);
  });

  it('ArrowRight stops at the end', async () => {
    el = await makePlayer();
    await tick(el, 118);
    await press(el, 'ArrowRight');
    expect(el.currentTime).toBe(120);
  });

  it('a seek key moves the media element, not only the readout', async () => {
    // A shortcut that changed the label without moving the video would be a
    // player that lies about where it is.
    el = await makePlayer();
    await tick(el, 40);
    await press(el, 'ArrowRight');
    expect(videoEl(el)!.currentTime).toBe(45);
  });
});

describe('snice-video-player matrix: volume keys', () => {
  it('ArrowUp raises the volume by a tenth', async () => {
    el = await makePlayer();
    el.volume = 0.5;
    await wait(20);
    await press(el, 'ArrowUp');
    expect(el.volume).toBeCloseTo(0.5 + VOLUME_STEP, 5);
  });

  it('ArrowDown lowers the volume by a tenth', async () => {
    el = await makePlayer();
    el.volume = 0.5;
    await wait(20);
    await press(el, 'ArrowDown');
    expect(el.volume).toBeCloseTo(0.5 - VOLUME_STEP, 5);
  });

  it('the volume keys stop at both rails', async () => {
    // doc: `volume: number = 1;  // 0-1`. Ten presses either way must land on
    // the rail and stay there rather than walking past it.
    el = await makePlayer();
    const problems = new Problems();

    for (let i = 0; i < 12; i++) await press(el, 'ArrowUp');
    problems.check(el.volume <= 1, `the volume climbed to ${el.volume}`);
    problems.check(Math.abs(el.volume - 1) < 1e-9, 'the volume did not reach the top rail');

    for (let i = 0; i < 15; i++) await press(el, 'ArrowDown');
    problems.check(el.volume >= 0, `the volume fell to ${el.volume}`);
    problems.check(Math.abs(el.volume) < 1e-9, 'the volume did not reach the bottom rail');

    expectClean(problems, 'volume rails');
  });

  it('the volume keys reach the media element', async () => {
    el = await makePlayer();
    el.volume = 0.5;
    await wait(20);
    await press(el, 'ArrowUp');
    expect((videoEl(el) as any).volume).toBeCloseTo(0.6, 5);
  });
});

describe('snice-video-player matrix: controls="false" silences the shortcuts', () => {
  // `controls: boolean = true` is the switch that says whether this player is
  // driven by its viewer at all; a page that turned the controls off and got
  // keyboard control anyway would have no way to build its own.
  for (const key of [' ', 'k', 'f', 'm', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) {
    it(`"${key === ' ' ? 'Space' : key}" does nothing`, async () => {
      el = await makePlayer({ controls: false });
      await tick(el, 30);
      const before = { playing: isPlaying(el), time: el.currentTime, volume: el.volume, muted: el.muted };
      const seen = capturePlayer(el);
      await press(el, key);

      const problems = new Problems();
      problems.equal(isPlaying(el), before.playing, 'the transport moved');
      problems.equal(el.currentTime, before.time, 'the position moved');
      problems.equal(el.volume, before.volume, 'the volume moved');
      problems.equal(el.muted, before.muted, 'the mute state moved');
      problems.equal(seen.length, 0, 'the key announced something');
      expectClean(problems, `no-controls/${key}`);
    });
  }
});
