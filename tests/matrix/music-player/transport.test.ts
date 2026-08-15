/**
 * Matrix slice TRANSPORT — play/pause/stop, next/previous, end-of-track
 * handling and the two mode flags that change what "next" means, crossed:
 * {repeat: off|all|one} x {shuffle} x {1 track, 4 tracks}.
 *
 * The mode flags are the point of the cross. `repeat` and `shuffle` both
 * redefine the successor of the current track, `repeat` additionally decides
 * what happens when the last track ends, and a one-track playlist is the edge
 * where "next", "previous" and "wrap" all collapse onto the same row. Testing
 * either flag alone would never exercise those interactions.
 *
 * Documented contract (docs/ai/components/music-player.md):
 *   play/pause/stop, next(), previous() ("restarts if >3s in"), setRepeat(mode),
 *   toggleShuffle(), and the events player-play / player-pause / player-stop /
 *   player-track-change / player-track-ended / player-shuffle-change /
 *   player-repeat-change.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cross, cleanup, settle, record, sequence, Problems, expectClean } from './matrix-utils';
import {
  makePlayer, tracksFor, audioOf, installFakeAudio, restoreAudio, checkTransport,
} from './player-support';

const COMBOS = cross({
  repeat: ['off', 'all', 'one'] as const,
  shuffle: [false, true] as const,
  count: [1, 4] as const,
});

describe('music-player matrix: transport', () => {
  beforeEach(() => installFakeAudio());
  afterEach(() => { cleanup(); restoreAudio(); });

  for (const combo of COMBOS) {
    const setup = async (index = 0) => {
      const tracks = tracksFor('artist', combo.count);
      const player = await makePlayer({ tracks, props: { currentTrackIndex: index } });
      player.setRepeat(combo.repeat);
      if (combo.shuffle) player.toggleShuffle();
      await settle(30);
      return { player, tracks };
    };

    it(`${combo.id}: play → pause → stop walks the documented states`, async () => {
      const { player } = await setup();
      const events = record(player, ['player-play', 'player-pause', 'player-stop']);
      const problems = new Problems();

      await player.play();
      await settle(30);
      problems.eq('state after play()', player.state, 'playing');
      checkTransport(problems, player, {
        state: 'playing', tracks: combo.count, shuffle: combo.shuffle, repeat: combo.repeat,
      });

      player.pause();
      await settle(30);
      problems.eq('state after pause()', player.state, 'paused');

      player.stop();
      await settle(30);
      problems.eq('state after stop()', player.state, 'stopped');
      problems.eq('position after stop()', player.currentTime, 0);
      checkTransport(problems, player, {
        state: 'stopped', tracks: combo.count, shuffle: combo.shuffle, repeat: combo.repeat,
      });

      problems.eq('event order', sequence(events).join(','), 'player-play,player-pause,player-stop');
      expectClean(problems, combo.id);
    });

    it(`${combo.id}: next() advances to a different track (or stays on a single one)`, async () => {
      const { player, tracks } = await setup();
      const events = record(player, ['player-track-change']);
      const problems = new Problems();

      player.next();
      await settle(30);

      if (combo.count === 1) {
        problems.eq('single-track next() index', player.currentTrackIndex, 0);
      } else if (combo.shuffle) {
        // Shuffle only promises "a next track"; with more than one track it
        // must not be the track already playing, and it must be in range.
        problems.ok(player.currentTrackIndex !== 0,
          `shuffled next() stayed on track 0 of ${combo.count}`);
        problems.ok(player.currentTrackIndex > 0 && player.currentTrackIndex < combo.count,
          `shuffled next() produced out-of-range index ${player.currentTrackIndex}`);
      } else {
        problems.eq('sequential next() index', player.currentTrackIndex, 1);
      }

      problems.eq('currentTrack follows the index',
        player.currentTrack, tracks[player.currentTrackIndex].id);
      problems.ok(events.length >= 1, 'next() emitted no player-track-change');
      if (events.length) {
        problems.eq('track-change payload',
          events[events.length - 1].detail.track.id, tracks[player.currentTrackIndex].id);
      }
      expectClean(problems, combo.id);
    });

    it(`${combo.id}: next() from the last track wraps to the first`, async () => {
      const { player } = await setup(combo.count - 1);
      const problems = new Problems();

      // Wrapping is sequential-order behaviour; shuffle picks its own successor.
      player.next();
      await settle(30);
      if (!combo.shuffle) {
        problems.eq('wrapped index', player.currentTrackIndex, 0);
      } else {
        problems.ok(player.currentTrackIndex >= 0 && player.currentTrackIndex < combo.count,
          `shuffled wrap produced out-of-range index ${player.currentTrackIndex}`);
      }
      expectClean(problems, combo.id);
    });

    it(`${combo.id}: previous() restarts the track when more than 3s in`, async () => {
      const { player } = await setup(combo.count - 1);
      const problems = new Problems();
      const events = record(player, ['player-seek', 'player-track-change']);

      audioOf(player).tick(10);
      await settle(20);
      problems.eq('position before previous()', player.currentTime, 10);

      player.previous();
      await settle(30);

      problems.eq('previous() stayed on the same track',
        player.currentTrackIndex, combo.count - 1);
      problems.eq('previous() restarted the track', player.currentTime, 0);
      problems.eq('previous() seeked rather than changed track',
        sequence(events).join(','), 'player-seek');
      expectClean(problems, combo.id);
    });

    it(`${combo.id}: previous() within the first 3s steps back`, async () => {
      const { player } = await setup(combo.count - 1);
      const problems = new Problems();

      audioOf(player).tick(1);
      await settle(20);
      player.previous();
      await settle(30);

      if (combo.count === 1) {
        problems.eq('single-track previous() index', player.currentTrackIndex, 0);
      } else if (!combo.shuffle) {
        problems.eq('sequential previous() index', player.currentTrackIndex, combo.count - 2);
      } else {
        problems.ok(player.currentTrackIndex >= 0 && player.currentTrackIndex < combo.count,
          `shuffled previous() produced out-of-range index ${player.currentTrackIndex}`);
      }
      expectClean(problems, combo.id);
    });

    it(`${combo.id}: the end of the last track obeys the repeat mode`, async () => {
      const { player } = await setup(combo.count - 1);
      const problems = new Problems();
      const events = record(player, ['player-track-ended']);

      audioOf(player).finish();
      await settle(40);

      if (combo.repeat === 'one') {
        problems.eq('repeat=one stays on the track', player.currentTrackIndex, combo.count - 1);
        problems.eq('repeat=one restarts from 0', player.currentTime, 0);
      } else if (combo.repeat === 'all') {
        if (!combo.shuffle) {
          problems.eq('repeat=all wraps to the first track', player.currentTrackIndex, 0);
        } else {
          problems.ok(player.currentTrackIndex >= 0 && player.currentTrackIndex < combo.count,
            `repeat=all + shuffle produced index ${player.currentTrackIndex}`);
        }
      } else {
        // repeat=off on the LAST track: playback is over.
        problems.eq('repeat=off stops at the end', player.state, 'stopped');
        problems.eq('repeat=off rewinds', player.currentTime, 0);
        problems.eq('repeat=off stays on the last track',
          player.currentTrackIndex, combo.count - 1);
      }

      problems.eq('player-track-ended fired once', events.length, 1);
      expectClean(problems, combo.id);
    });
  }

  it('the end of a non-final track advances even with repeat off', async () => {
    const player = await makePlayer({ tracks: tracksFor('artist', 3) });
    audioOf(player).finish();
    await settle(40);
    expect(player.currentTrackIndex).toBe(1);
  });

  it('toggleShuffle and setRepeat announce their new value', async () => {
    const player = await makePlayer({ tracks: tracksFor('artist', 3) });
    const events = record(player, ['player-shuffle-change', 'player-repeat-change']);

    player.toggleShuffle();
    player.setRepeat('all');
    player.toggleShuffle();
    player.setRepeat('one');
    await settle(30);

    expect(events.map(e => [e.type, e.detail.shuffle ?? e.detail.repeat])).toEqual([
      ['player-shuffle-change', true],
      ['player-repeat-change', 'all'],
      ['player-shuffle-change', false],
      ['player-repeat-change', 'one'],
    ]);
  });

  it('an empty player disables transport and refuses to play', async () => {
    const player = await makePlayer();
    const problems = new Problems();
    const events = record(player, ['player-play']);

    await player.play();
    await settle(30);

    problems.eq('state without tracks', player.state, 'stopped');
    problems.eq('player-play suppressed', events.length, 0);
    checkTransport(problems, player, { state: 'stopped', tracks: 0, shuffle: false, repeat: 'off' });
    expectClean(problems, 'no tracks');
  });

  it('a media error moves the player into the error state', async () => {
    const player = await makePlayer({ tracks: tracksFor('artist', 2) });
    const events = record(player, ['player-error']);

    audioOf(player).fail();
    await settle(30);

    expect(player.state).toBe('error');
    expect(events).toHaveLength(1);
  });
});
