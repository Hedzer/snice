/**
 * Smoke slice of the snice-podcast-player matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/podcast-player, 100 combos) is
 * excluded from the default Vitest include and runs via `npm run test:matrix`.
 * This file is the standing cost the everyday loop pays, and it lives at
 * `smoke.test.ts` so it stays collected.
 *
 * Marquee combos only — one per feature family the matrix is built around:
 *   · the doc's basic-usage markup, which owns the three CSS parts and the
 *     whole control bar at once;
 *   · a loaded episode, because `loadEpisode` is where episode metadata takes
 *     over from the element's own properties and where the chapter list
 *     appears;
 *   · the progress slider's aria triple, the one thing a restyle silently
 *     breaks;
 *   · `setPlaybackRate` at its documented boundary, the cheapest guard on the
 *     0.5–2 range;
 *   · position memory, the only feature with a side effect outside the DOM.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePlayer, expectPlayerMatches, EPISODES,
  progressEl, captureEvents, wait, SETTLE,
  type SnicePodcastPlayerElement,
} from './matrix-utils';

describe('snice-podcast-player matrix smoke', () => {
  let el: SnicePodcastPlayerElement | undefined;

  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; localStorage.clear(); });

  it('the documented basic-usage markup renders the whole shell', async () => {
    const combo = {
      src: '/audio/episode.mp3',
      title: 'Episode 1',
      show: 'My Podcast',
    };
    el = await makePlayer(combo);
    expectPlayerMatches(el, combo);
  });

  it('a loaded episode owns the metadata and brings its chapters', async () => {
    const combo = { episodes: EPISODES, currentEpisodeIndex: 2, title: 'Fallback' };
    el = await makePlayer(combo);
    expectPlayerMatches(el, combo);
  });

  it('the progress bar is a slider over 0 … duration', async () => {
    el = await makePlayer({ src: '/a.mp3', duration: 3600, currentTime: 900 });
    const progress = progressEl(el)!;
    expect(progress.getAttribute('role')).toBe('slider');
    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('3600');
    expect(progress.getAttribute('aria-valuenow')).toBe('900');
  });

  it('setPlaybackRate honours the documented 0.5–2 range', async () => {
    el = await makePlayer({ src: '/a.mp3' });
    const seen = captureEvents(el, ['podcast-rate-change']);
    el.setPlaybackRate(2);
    el.setPlaybackRate(3);
    await wait(SETTLE);
    expect(el.playbackRate).toBe(2);
    expect(seen.map(e => e.detail.rate)).toEqual([2]);
  });

  it('remembers the position of a torn-down episode', async () => {
    el = await makePlayer({ src: '/audio/smoke.mp3', duration: 600 });
    el.seekTo(120);
    removeComponent(el as HTMLElement);
    el = undefined;

    expect(localStorage.length).toBe(1);
    expect(Number(localStorage.getItem(localStorage.key(0)!))).toBe(120);
  });
});
