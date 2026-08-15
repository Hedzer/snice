/**
 * Matrix slice PLAYLIST — the four documented `Track` shapes crossed with
 * playlist length and selected index.
 *
 * The shapes are not decoration: `Track` marks artist, album, artwork and
 * duration optional and the types file adds trackUrl/artistUrl, and every one
 * of those decides whether an element is rendered at all. Crossing them with
 * the selected index is what proves the row-level conditionals are per-row
 * rather than "whatever the first track had".
 *
 * Selection has three documented entry points — `currentTrackIndex`,
 * `currentTrack` (a track ID) and `loadTrack(index)` — and all three must land
 * on the same rendered state, so each combo asserts them against one oracle.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cross, cleanup, settle, all, click, Problems, expectClean } from './matrix-utils';
import {
  makePlayer, tracksFor, SHAPES, installFakeAudio, restoreAudio,
  checkPlaylist, checkTrackInfo, checkArtwork,
} from './player-support';

const COMBOS = cross({
  shape: SHAPES,
  count: [1, 3, 5],
  select: ['first', 'last'] as const,
});

describe('music-player matrix: playlist and track selection', () => {
  beforeEach(() => installFakeAudio());
  afterEach(() => { cleanup(); restoreAudio(); });

  for (const combo of COMBOS) {
    const index = combo.select === 'first' ? 0 : combo.count - 1;

    it(`${combo.id}: the playlist mirrors the track list and marks the current row`, async () => {
      const tracks = tracksFor(combo.shape, combo.count);
      const player = await makePlayer({ tracks, props: { currentTrackIndex: index } });
      const problems = new Problems();

      checkPlaylist(problems, player, tracks, index);
      problems.eq('getCurrentTrack()', player.getCurrentTrack(), tracks[index]);
      problems.eq('currentTrack id', player.currentTrack, tracks[index].id);

      expectClean(problems, combo.id);
    });

    it(`${combo.id}: the info section describes the selected track`, async () => {
      const tracks = tracksFor(combo.shape, combo.count);
      const player = await makePlayer({ tracks, props: { currentTrackIndex: index } });
      const problems = new Problems();

      checkTrackInfo(problems, player, tracks[index]);
      checkArtwork(problems, player, tracks[index]);

      expectClean(problems, combo.id);
    });

    it(`${combo.id}: loadTrack(), currentTrack and a playlist click agree`, async () => {
      const tracks = tracksFor(combo.shape, combo.count);
      const player = await makePlayer({ tracks });
      const problems = new Problems();

      // Entry point 1 — the method.
      await player.loadTrack(index);
      await settle(30);
      problems.eq('loadTrack index', player.currentTrackIndex, index);
      checkPlaylist(problems, player, tracks, index);

      // Entry point 2 — the documented track-ID property. Go somewhere else
      // first so the assignment is a real change.
      await player.loadTrack(0);
      await settle(30);
      player.currentTrack = tracks[index].id;
      await settle(30);
      problems.eq('currentTrack index', player.currentTrackIndex, index);
      checkPlaylist(problems, player, tracks, index);

      // Entry point 3 — clicking the row.
      await player.loadTrack(0);
      await settle(30);
      const rows = all(player, '.player-playlist-item');
      click(rows[index]);
      await settle(30);
      problems.eq('clicked row index', player.currentTrackIndex, index);
      checkPlaylist(problems, player, tracks, index);

      expectClean(problems, combo.id);
    });
  }

  it('an out-of-range index is rejected rather than rendered', async () => {
    const player = await makePlayer({ tracks: tracksFor('full', 3) });
    // `loadTrack` documents an index into `tracks`; anything outside it is an
    // error, not a silently clamped selection.
    await expect(player.loadTrack(3)).rejects.toThrow();
    await expect(player.loadTrack(-1)).rejects.toThrow();
    expect(player.currentTrackIndex).toBe(0);
  });

  it('a shorter track list pulls the selection back into range', async () => {
    const player = await makePlayer({ tracks: tracksFor('full', 5), props: { currentTrackIndex: 4 } });
    const problems = new Problems();
    const shorter = tracksFor('artist', 2);

    player.tracks = shorter;
    await settle(40);

    problems.eq('index after shrink', player.currentTrackIndex, 0);
    checkPlaylist(problems, player, shorter, 0);
    expectClean(problems, 'tracks shrink');
  });
});
