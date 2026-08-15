/**
 * snice-podcast-player matrix — the documented method surface.
 *
 * `docs/ai/components/podcast-player.md` lists six public methods and one
 * accessibility promise that is really a method contract:
 *
 *   play() / pause() / toggle() / seekTo(time) / setPlaybackRate(rate) /
 *   loadEpisode(index), plus "position memory via localStorage".
 *
 * Each is crossed against the boundaries its own documentation names — the
 * `0.5-2` speed range, the index range implied by `episodes`, the seconds
 * domain `0 … duration` a `role="slider"` progress bar advertises — because
 * that is where a method silently does nothing or does the wrong thing.
 *
 * 5 seek points + 5 keyboard steps + 6 rates + 5 indices + 4 skip cases
 * + 3 memory cases = 28 combos.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePlayer, EPISODES, wait, SETTLE,
  progressEl, skipBackButton, skipForwardButton, sr, textOf, expectClean,
  type SnicePodcastPlayerElement,
} from './matrix-utils';

const DURATION = 600;

function press(node: Element | null, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

describe('snice-podcast-player matrix: seekTo', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // "seekTo(time: number) - Seek to time in seconds": the position IS the
  // argument, and the slider must report the same second count.
  for (const target of [0, 1, 42.7, DURATION / 2, DURATION]) {
    it(`seekTo(${target})`, async () => {
      el = await makePlayer({ src: '/a.mp3', duration: DURATION });
      el.seekTo(target);
      await wait(SETTLE);

      const problems: string[] = [];
      if (el.currentTime !== target) problems.push(`currentTime ${el.currentTime} != ${target}`);
      const now = progressEl(el)?.getAttribute('aria-valuenow');
      if (now !== String(Math.floor(target))) {
        problems.push(`aria-valuenow "${now}" != "${Math.floor(target)}"`);
      }
      expectClean(problems, `seekTo(${target})`);
    });
  }
});

describe('snice-podcast-player matrix: progress-bar keyboard', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  /**
   * The progress bar declares `role="slider"` and `tabindex="0"`, which is the
   * component promising the ARIA slider keyboard contract: arrows step, Home
   * goes to the minimum, End to the maximum, and nothing leaves `0 … duration`.
   * The doc's "progress bar supports click seeking" plus "controls are keyboard
   * accessible" is the same promise stated in prose.
   */
  const CASES = [
    { key: 'ArrowRight', from: 100, expect: (t: number) => t > 100 && t <= DURATION },
    { key: 'ArrowLeft', from: 100, expect: (t: number) => t < 100 && t >= 0 },
    { key: 'ArrowLeft', from: 0, expect: (t: number) => t === 0 },
    { key: 'Home', from: 300, expect: (t: number) => t === 0 },
    { key: 'End', from: 0, expect: (t: number) => t === DURATION },
  ];

  for (const testCase of CASES) {
    it(`${testCase.key} from ${testCase.from}s`, async () => {
      el = await makePlayer({ src: '/a.mp3', duration: DURATION, currentTime: testCase.from });
      press(progressEl(el), testCase.key);
      await wait(SETTLE);
      expect(testCase.expect(el.currentTime), `${testCase.key} landed on ${el.currentTime}`).toBe(true);
    });
  }
});

describe('snice-podcast-player matrix: setPlaybackRate range', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // "setPlaybackRate(rate: number) - Set speed (0.5-2)". Inside the range the
  // rate takes; outside it the call is not a documented operation and must
  // leave the player where it was.
  const CASES = [
    { rate: 0.5, accepted: true },
    { rate: 1.25, accepted: true },
    { rate: 2, accepted: true },
    { rate: 0.25, accepted: false },
    { rate: 2.5, accepted: false },
    { rate: 0, accepted: false },
  ];

  for (const testCase of CASES) {
    it(`setPlaybackRate(${testCase.rate}) ${testCase.accepted ? 'applies' : 'is rejected'}`, async () => {
      el = await makePlayer({ src: '/a.mp3', playbackRate: 1 });
      el.setPlaybackRate(testCase.rate);
      await wait(SETTLE);
      expect(el.playbackRate).toBe(testCase.accepted ? testCase.rate : 1);
    });
  }
});

describe('snice-podcast-player matrix: loadEpisode index range', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // "loadEpisode(index: number) - Load and switch to episode by index" over a
  // three-entry list: every in-range index switches, every out-of-range one is
  // a no-op rather than a crash or a phantom selection.
  const CASES = [
    { index: 0, valid: true },
    { index: 1, valid: true },
    { index: 2, valid: true },
    { index: -1, valid: false },
    { index: 3, valid: false },
  ];

  for (const testCase of CASES) {
    it(`loadEpisode(${testCase.index})`, async () => {
      el = await makePlayer({ episodes: EPISODES, title: 'Untouched' });
      el.loadEpisode(testCase.index);
      await wait(SETTLE);

      const problems: string[] = [];
      if (testCase.valid) {
        const episode = EPISODES[testCase.index];
        if (el.currentEpisodeIndex !== testCase.index) {
          problems.push(`currentEpisodeIndex ${el.currentEpisodeIndex} != ${testCase.index}`);
        }
        if (el.title !== episode.title) problems.push(`title "${el.title}" != "${episode.title}"`);
        const shown = textOf(sr(el).querySelector('.podcast-title'));
        if (shown !== episode.title) problems.push(`rendered title "${shown}" != "${episode.title}"`);
      } else {
        if (el.currentEpisodeIndex !== -1) {
          problems.push(`out-of-range index selected episode ${el.currentEpisodeIndex}`);
        }
        if (el.title !== 'Untouched') problems.push(`out-of-range index changed title to "${el.title}"`);
      }
      expectClean(problems, `loadEpisode(${testCase.index})`);
    });
  }
});

describe('snice-podcast-player matrix: skip controls', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  /**
   * `skipForward` / `skipBack` are documented in SECONDS, and the position they
   * move stays inside the `0 … duration` domain the slider advertises. The four
   * cases are the two ordinary moves and the two boundaries where a naive
   * implementation walks off the end of the episode.
   */
  const CASES = [
    { id: 'back from mid', from: 300, direction: 'back' as const, expected: 300 - 15 },
    { id: 'back clamps at zero', from: 5, direction: 'back' as const, expected: 0 },
    { id: 'forward from mid', from: 300, direction: 'forward' as const, expected: 330 },
    { id: 'forward clamps at duration', from: DURATION - 5, direction: 'forward' as const, expected: DURATION },
  ];

  for (const testCase of CASES) {
    it(testCase.id, async () => {
      el = await makePlayer({ src: '/a.mp3', duration: DURATION, currentTime: testCase.from });
      const button = testCase.direction === 'back' ? skipBackButton(el) : skipForwardButton(el);
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(SETTLE);
      expect(el.currentTime).toBe(testCase.expected);
    });
  }
});

describe('snice-podcast-player matrix: position memory', () => {
  let el: SnicePodcastPlayerElement | undefined;

  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; localStorage.clear(); });

  // happy-dom's Storage is not a plain object, so `Object.keys` sees its
  // internals rather than its entries; the indexed accessor is the portable
  // enumeration and is what a browser would give too.
  const keys = () => {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('podcast')) out.push(key);
    }
    return out;
  };

  it('remembers a position once there is one worth remembering', async () => {
    // "Position memory via localStorage". A player torn down mid-episode must
    // leave the position behind for the next mount.
    el = await makePlayer({ src: '/audio/remembered.mp3', duration: DURATION });
    el.seekTo(240);
    removeComponent(el as HTMLElement);
    el = undefined;

    const saved = keys();
    expect(saved.length, 'no position was written to localStorage').toBe(1);
    expect(Number(localStorage.getItem(saved[0]))).toBe(240);
  });

  it('keeps each source under its own key', async () => {
    // Two episodes must not overwrite one another's position, or "position
    // memory" would mean "one global bookmark".
    const first = await makePlayer({ src: '/audio/one.mp3', duration: DURATION });
    first.seekTo(100);
    removeComponent(first as HTMLElement);

    const second = await makePlayer({ src: '/audio/two.mp3', duration: DURATION });
    second.seekTo(200);
    removeComponent(second as HTMLElement);

    const values = keys().map(k => Number(localStorage.getItem(k))).sort((a, b) => a - b);
    expect(values).toEqual([100, 200]);
  });

  it('does not bookmark a position nobody would want restored', async () => {
    // Restoring a two-second offset is worse than starting over, so a position
    // that has barely moved is not memory-worthy.
    el = await makePlayer({ src: '/audio/barely.mp3', duration: DURATION });
    el.seekTo(2);
    removeComponent(el as HTMLElement);
    el = undefined;

    expect(keys()).toEqual([]);
  });
});
