/**
 * Matrix slice PROGRESS + VOLUME — the seek surface crossed with track
 * duration, and the volume/mute pair crossed with each other.
 *
 * Duration is an axis because every displayed quantity is derived from it: the
 * m:ss labels, the ARIA slider bounds, and the filled width of the progress
 * bar. A single-duration test cannot tell "reads the duration" from "happens to
 * agree at 60 seconds", and the m:ss rollover only exists above a minute.
 *
 * The seek surface carries `role="slider"` and `tabindex="0"`, so it owes the
 * WAI-ARIA slider keyboard contract: arrows adjust the value, Home/End jump to
 * the bounds, and the value never leaves [valuemin, valuemax]. That contract is
 * the oracle for the keyboard combos.
 *
 * Volume: `setVolume(volume)` takes 0-1 (docs), `muted` mutes independently,
 * and both must reach the media element — a volume property the audio never
 * sees is a silent no-op that renders perfectly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cross, cleanup, settle, one, key, record, Problems, expectClean } from './matrix-utils';
import {
  makePlayer, tracksFor, audioOf, installFakeAudio, restoreAudio, checkProgress, formatTime,
} from './player-support';

/** Track i declares duration 60 + 30i, so the three axes are 60s, 90s, 120s. */
const DURATIONS = [60, 90, 120];

const POSITION_COMBOS = cross({
  track: [0, 1, 2],
  at: ['start', 'mid', 'end'] as const,
});

const KEY_COMBOS = cross({
  press: ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'] as const,
  from: ['start', 'mid', 'end'] as const,
});

const VOLUME_COMBOS = cross({
  volume: [0, 0.25, 0.6, 1] as const,
  muted: [false, true] as const,
});

const SEEK_STEP = 5;

describe('music-player matrix: progress', () => {
  beforeEach(() => installFakeAudio());
  afterEach(() => { cleanup(); restoreAudio(); });

  for (const combo of POSITION_COMBOS) {
    const duration = DURATIONS[combo.track];
    const position = combo.at === 'start' ? 0 : combo.at === 'mid' ? duration / 2 : duration;

    it(`${combo.id}: the seek surface reports the position against the duration`, async () => {
      const player = await makePlayer({
        tracks: tracksFor('artist', 3), props: { currentTrackIndex: combo.track },
      });
      const problems = new Problems();

      problems.eq('duration from metadata', player.duration, duration);

      player.seek(position);
      await settle(30);

      problems.eq('position after seek()', player.currentTime, position);
      checkProgress(problems, player, position, duration);
      expectClean(problems, combo.id);
    });
  }

  for (const combo of KEY_COMBOS) {
    it(`${combo.id}: keyboard seeking stays inside the slider's own bounds`, async () => {
      const duration = DURATIONS[1]; // 90s — long enough that ±5s is interior
      const player = await makePlayer({
        tracks: tracksFor('artist', 3), props: { currentTrackIndex: 1 },
      });
      const start = combo.from === 'start' ? 0 : combo.from === 'mid' ? duration / 2 : duration;
      player.seek(start);
      await settle(20);

      const problems = new Problems();
      const step = { ArrowRight: SEEK_STEP, ArrowUp: SEEK_STEP, ArrowLeft: -SEEK_STEP, ArrowDown: -SEEK_STEP }[
        combo.press as 'ArrowRight' | 'ArrowUp' | 'ArrowLeft' | 'ArrowDown'
      ];
      const expected = combo.press === 'Home' ? 0
        : combo.press === 'End' ? duration
          : Math.min(duration, Math.max(0, start + step!));

      key(one(player, '.player-progress'), combo.press);
      await settle(30);

      problems.eq('position after key', player.currentTime, expected);
      checkProgress(problems, player, expected, duration);
      expectClean(problems, combo.id);
    });
  }

  it('with no duration the progress bar is empty and the labels read 0:00', async () => {
    const player = await makePlayer();
    const problems = new Problems();
    // Nothing loaded: duration is 0, so the bar has no fill to compute and the
    // slider's range is degenerate but still well-formed.
    checkProgress(problems, player, 0, 0);
    expectClean(problems, 'no track');
  });

  it('timeupdate from the media element drives the elapsed label', async () => {
    const player = await makePlayer({ tracks: tracksFor('artist', 3) });
    const events = record(player, ['player-time-update']);

    audioOf(player).tick(61.4);
    await settle(30);

    expect(player.currentTime).toBe(61.4);
    expect(events[events.length - 1].detail).toMatchObject({ currentTime: 61.4, duration: 60 });
    expect(formatTime(61.4)).toBe('1:01');
  });
});

describe('music-player matrix: volume', () => {
  beforeEach(() => installFakeAudio());
  afterEach(() => { cleanup(); restoreAudio(); });

  for (const combo of VOLUME_COMBOS) {
    it(`${combo.id}: volume and mute reach the media element`, async () => {
      const player = await makePlayer({
        tracks: tracksFor('artist', 2),
        props: { muted: combo.muted },
      });
      const problems = new Problems();
      const events = record(player, ['player-volume-change']);

      player.setVolume(combo.volume);
      await settle(30);

      problems.eq('volume property', player.volume, combo.volume);
      problems.eq('volume on the media element', audioOf(player).volume, combo.volume);
      problems.eq('player-volume-change fired', events.length, 1);
      if (events.length) problems.eq('event payload', events[0].detail.volume, combo.volume);

      // Documented: raising the volume above zero un-mutes. Setting it to zero
      // is not "unmute", so a muted player stays muted.
      const expectedMuted = combo.muted && combo.volume === 0;
      problems.eq('muted after setVolume', player.muted, expectedMuted);
      problems.eq('muted on the media element', audioOf(player).muted, expectedMuted);

      expectClean(problems, combo.id);
    });
  }

  it('a volume outside 0-1 is rejected', async () => {
    const player = await makePlayer({ tracks: tracksFor('artist', 2) });
    expect(() => player.setVolume(1.5)).toThrow();
    expect(() => player.setVolume(-0.1)).toThrow();
    expect(player.volume).toBe(1);
  });
});
