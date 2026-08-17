/**
 * snice-video-player matrix — the RENDERED SHELL.
 *
 * Four documented properties decide what a player looks like before anything is
 * played:
 *
 *   · `variant: 'default'|'minimal'|'cinema' = 'default'` — answered entirely by
 *     `:host([variant=…])` rules, so the ATTRIBUTE is the whole mechanism;
 *   · `controls: boolean = true` — the control bar and the two parts inside it;
 *   · `poster: string = ''` — the click-to-start overlay;
 *   · `src: string = ''` — whether there is anything to play at all.
 *
 * The matrix is their full cross — 3 x 2 x 2 x 2 = 24 combos — plus the three
 * media flags (`muted`, `loop`, `autoplay`) which the doc says are handed
 * straight to the `<video>`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, POSTER, Problems, SRC, VARIANTS, centrePlay, checkClock, checkControls,
  checkShell, expectClean, makePlayer, posterOverlay, removeComponent, vectorId,
  videoEl, type Player, type PlayerVector,
} from './player-support';

let el: Player | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const COMBOS: PlayerVector[] = [];
for (const variant of VARIANTS) {
  for (const controls of [true, false]) {
    for (const poster of ['', POSTER]) {
      for (const src of [SRC, '']) {
        COMBOS.push({ ...DEFAULTS, variant, controls, poster, src });
      }
    }
  }
}

describe('snice-video-player matrix: shell', () => {
  for (const vector of COMBOS) {
    it(vectorId(vector), async () => {
      el = await makePlayer(vector, { prime: !!vector.src });
      const problems = new Problems();
      checkShell(problems, el, vector);

      // The control bar is documented against `controls` alone; the combos
      // where it is missing despite `controls: true` are pinned as
      // MATRIX-video-player-2 in findings.test.ts, so this slice asserts the
      // bar only where the component has a source to build one for.
      if (vector.src) checkControls(problems, el, vector);

      // doc: `poster: string = ''` — the still frame shown before playback.
      problems.check(!!posterOverlay(el) === !!vector.poster,
        vector.poster ? 'a poster was set and no overlay rendered'
          : 'an overlay rendered with no poster set');

      expectClean(problems, vectorId(vector));
    });
  }
});

describe('snice-video-player matrix: media flags', () => {
  for (const flag of ['muted', 'loop', 'autoplay'] as const) {
    it(`${flag} reaches the <video>`, async () => {
      // The doc lists these three as properties of the PLAYER, and their only
      // possible meaning is the corresponding attribute on the media element
      // it wraps.
      const vector: PlayerVector = { ...DEFAULTS, [flag]: true } as PlayerVector;
      el = await makePlayer(vector);
      const video = videoEl(el)!;
      expect(video.hasAttribute(flag), `<video> is missing ${flag}`).toBe(true);

      removeComponent(el as HTMLElement);
      el = await makePlayer({ ...DEFAULTS });
      expect(videoEl(el)!.hasAttribute(flag), `<video> carries ${flag} without being asked`)
        .toBe(false);
    });
  }

  it('the <video> preloads its metadata and plays inline', async () => {
    // Two attributes the component always writes: `preload="metadata"` is what
    // makes `duration` available before playback (the doc exposes `duration` as
    // a read-only property), and `playsinline` is what stops a phone taking the
    // video fullscreen against the page's wishes.
    el = await makePlayer();
    const video = videoEl(el)!;
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(video.hasAttribute('playsinline')).toBe(true);
  });
});

describe('snice-video-player matrix: first paint', () => {
  it('a player with a source and no poster offers a centre play affordance', async () => {
    // Nothing is playing yet and there is no poster to click, so the only way
    // in is the centre button.
    el = await makePlayer({ poster: '' });
    expect(centrePlay(el), 'no way to start a paused player').not.toBeNull();
  });

  it('a poster covers the centre affordance until it is clicked', async () => {
    // Two click targets on top of each other would be a trap; the poster IS the
    // affordance while it is up.
    el = await makePlayer({ poster: POSTER });
    expect(posterOverlay(el)).not.toBeNull();
    expect(centrePlay(el), 'the centre play button shows through the poster').toBeNull();
  });

  it('the clock reads zero over the loaded duration', async () => {
    el = await makePlayer();
    const problems = new Problems();
    checkClock(problems, el, 0, 120);
    expectClean(problems, 'first paint clock');
  });

  it('a duration past an hour grows an hours field', async () => {
    // The clock is `m:ss` until it needs to be `h:mm:ss`; a two-hour film that
    // read "125:30" would be unreadable.
    el = await makePlayer({}, { duration: 5400 });
    const problems = new Problems();
    checkClock(problems, el, 0, 5400);
    expectClean(problems, 'long clock');
  });

  it('the read-only duration follows the loaded media', async () => {
    // doc: `duration: number;  // read-only`. It is the media's answer, not the
    // page's, and it appears when the metadata does.
    el = await makePlayer({}, { duration: 300 });
    expect(el.duration).toBe(300);
  });
});
