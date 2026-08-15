/**
 * Matrix slice VISIBILITY — the full 2^5 product of the documented section
 * switches {showArtwork, showTrackInfo, showControls, showVolume, showPlaylist}
 * crossed with `compact`, i.e. all 64 vectors, each asserted against the
 * documented shell (docs/ai/components/music-player.md).
 *
 * Why the full product rather than a sample: these five flags are *nested*
 * (`showVolume` lives inside the controls block, artwork and track info share
 * one wrapper, the playlist needs tracks), so the interesting failures are
 * exactly the interactions — a wrapper that survives both its children being
 * off, a volume control that appears with the controls hidden. A per-flag
 * sample cannot see any of them.
 *
 * The property channel is used here; `channel.test.ts` covers the attribute
 * channel for the same flags.
 */
import { describe, it, beforeEach, afterEach } from 'vitest';
import { cross, cleanup, Problems, expectClean } from './matrix-utils';
import {
  makePlayer, tracksFor, propsFor, installFakeAudio, restoreAudio,
  checkShell, checkArtwork, checkTrackInfo, checkPlaylist,
  type Vector,
} from './player-support';

const BOOLS = [true, false] as const;

const VECTORS = cross({
  artwork: BOOLS,
  trackInfo: BOOLS,
  controls: BOOLS,
  volume: BOOLS,
  playlist: BOOLS,
  compact: BOOLS,
});

describe('music-player matrix: section visibility', () => {
  beforeEach(() => installFakeAudio());
  afterEach(() => { cleanup(); restoreAudio(); });

  for (const vector of VECTORS) {
    const v = vector as unknown as Vector;

    it(`${vector.id}: renders exactly the enabled sections`, async () => {
      const tracks = tracksFor('full', 3);
      const player = await makePlayer({ tracks, props: propsFor(v) });
      const problems = new Problems();

      checkShell(problems, player, v, tracks);
      if (v.artwork) checkArtwork(problems, player, tracks[0]);
      if (v.trackInfo) checkTrackInfo(problems, player, tracks[0]);
      if (v.playlist) checkPlaylist(problems, player, tracks, 0);

      expectClean(problems, vector.id);
    });

    it(`${vector.id}: an empty track list still renders the enabled chrome`, async () => {
      const player = await makePlayer({ props: propsFor(v) });
      const problems = new Problems();

      // With no tracks the playlist section is empty of rows and therefore not
      // rendered at all, but every other enabled section still exists — a
      // player with nothing loaded is a documented state ("No track loaded").
      checkShell(problems, player, v, []);
      if (v.artwork) checkArtwork(problems, player, null);
      if (v.trackInfo) checkTrackInfo(problems, player, null);

      expectClean(problems, vector.id);
    });
  }
});
