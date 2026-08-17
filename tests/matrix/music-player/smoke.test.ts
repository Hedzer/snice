/**
 * Smoke slice of the snice-music-player matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/music-player/`, 316 combos across visibility,
 * transport, playlist and progress/volume) is excluded from the default Vitest
 * include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle (`player-support.ts`), so it cannot claim less than the
 * suite it stands in for.
 *
 * The marquee combos — one per feature family the matrix is built around:
 *   · the whole shell with every documented section on, on a `full` track
 *     (artwork + artist + album + duration), which is the only shape that
 *     exercises every region at once;
 *   · `compact`, the one flag that changes the container rather than its
 *     contents;
 *   · the transport round trip — play, pause, and the two events between them;
 *   · `next()` / `previous()`, where `currentTrackIndex` and the playlist's
 *     active row have to move together;
 *   · the progress slider's ARIA quadruple, the thing a restyle silently
 *     breaks;
 *   · `setVolume` and `toggleShuffle` / `setRepeat`, the three settings with
 *     their own announcements.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, Problems, expectClean, record, sequence, settle } from './matrix-utils';
import {
  audioOf, checkPlaylist, checkProgress, checkShell, checkTrackInfo, checkTransport,
  installFakeAudio, makePlayer, propsFor, restoreAudio, tracksFor, type Vector,
} from './player-support';

const ALL_ON: Vector = {
  artwork: true, trackInfo: true, controls: true, volume: true, playlist: true, compact: false,
};

describe('music-player matrix smoke', () => {
  beforeEach(() => { installFakeAudio(); });
  afterEach(() => { cleanup(); restoreAudio(); });

  it('every documented section renders for a fully populated track', async () => {
    const tracks = tracksFor('full', 3);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    const problems = new Problems();

    checkShell(problems, player, ALL_ON, tracks);
    checkTrackInfo(problems, player, tracks[0]);
    checkPlaylist(problems, player, tracks, 0);
    checkTransport(problems, player, { state: 'stopped', tracks: 3, shuffle: false, repeat: 'off' });

    expectClean(problems, 'smoke/shell');
  });

  it('compact is a modifier on the container, not a different player', async () => {
    const vector: Vector = { ...ALL_ON, compact: true };
    const tracks = tracksFor('full', 2);
    const player = await makePlayer({ props: propsFor(vector), tracks });
    const problems = new Problems();
    checkShell(problems, player, vector, tracks);
    checkPlaylist(problems, player, tracks, 0);
    expectClean(problems, 'smoke/compact');
  });

  it('play and pause move the state and announce themselves', async () => {
    // doc: `player-play → { player, track }`, `player-pause → { player, track }`.
    const tracks = tracksFor('artist', 2);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    const seen = record(player, ['player-play', 'player-pause']);

    await player.play();
    await settle(30);
    expect(player.state).toBe('playing');

    player.pause();
    await settle(30);
    expect(player.state).toBe('paused');
    expect(sequence(seen)).toEqual(['player-play', 'player-pause']);
    expect(seen[0].detail.track.id).toBe(tracks[0].id);

    const problems = new Problems();
    checkTransport(problems, player, { state: 'paused', tracks: 2, shuffle: false, repeat: 'off' });
    expectClean(problems, 'smoke/transport');
  });

  it('next() moves the index, the info and the active playlist row together', async () => {
    // doc: `next()` and `player-track-change → { player, track }`. Three
    // surfaces describe one fact and may not disagree.
    const tracks = tracksFor('full', 3);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    const seen = record(player, ['player-track-change']);

    player.next();
    await settle(30);

    const problems = new Problems();
    problems.eq('currentTrackIndex', player.currentTrackIndex, 1);
    problems.eq('getCurrentTrack()', player.getCurrentTrack()?.id, tracks[1].id);
    checkTrackInfo(problems, player, tracks[1]);
    checkPlaylist(problems, player, tracks, 1);
    problems.eq('announced track', seen.at(-1)?.detail.track.id, tracks[1].id);
    expectClean(problems, 'smoke/next');
  });

  it('previous() restarts the track when it is more than three seconds in', async () => {
    // doc: "previous() → Previous track (restarts if >3s in)".
    const tracks = tracksFor('artist', 3);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    player.currentTrackIndex = 1;
    await settle(30);

    audioOf(player).currentTime = 10;
    audioOf(player).dispatchEvent(new Event('timeupdate'));
    await settle(20);

    player.previous();
    await settle(30);
    expect(player.currentTrackIndex, 'a restart moved to another track').toBe(1);
    expect(audioOf(player).currentTime, 'the track did not restart').toBe(0);
  });

  it('the progress region is an ARIA slider over 0 … duration', async () => {
    const tracks = tracksFor('artist', 1);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    const audio = audioOf(player);
    audio.duration = 60;
    audio.dispatchEvent(new Event('loadedmetadata'));
    audio.currentTime = 15;
    audio.dispatchEvent(new Event('timeupdate'));
    await settle(30);

    const problems = new Problems();
    checkProgress(problems, player, 15, 60);
    expectClean(problems, 'smoke/progress');
  });

  it('the three settings announce their own changes', async () => {
    // doc: `player-volume-change → { player, volume }`,
    // `player-shuffle-change → { player, shuffle }`,
    // `player-repeat-change → { player, repeat }`.
    const tracks = tracksFor('artist', 3);
    const player = await makePlayer({ props: propsFor(ALL_ON), tracks });
    const seen = record(player, [
      'player-volume-change', 'player-shuffle-change', 'player-repeat-change',
    ]);

    player.setVolume(0.4);
    player.toggleShuffle();
    player.setRepeat('all');
    await settle(30);

    expect(sequence(seen))
      .toEqual(['player-volume-change', 'player-shuffle-change', 'player-repeat-change']);
    expect(seen[0].detail.volume).toBeCloseTo(0.4, 5);
    expect(seen[1].detail.shuffle).toBe(true);
    expect(seen[2].detail.repeat).toBe('all');

    const problems = new Problems();
    checkTransport(problems, player, { state: 'stopped', tracks: 3, shuffle: true, repeat: 'all' });
    expectClean(problems, 'smoke/settings');
  });

  it('an empty playlist disables the transport instead of hiding it', async () => {
    // `tracks: Track[] = []` is the documented default, so the empty player is
    // the FIRST thing every page renders.
    const player = await makePlayer({ props: propsFor(ALL_ON) });
    const problems = new Problems();
    checkShell(problems, player, ALL_ON, []);
    checkTransport(problems, player, { state: 'stopped', tracks: 0, shuffle: false, repeat: 'off' });
    expectClean(problems, 'smoke/empty');
  });
});
