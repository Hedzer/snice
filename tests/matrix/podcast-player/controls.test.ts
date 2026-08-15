/**
 * snice-podcast-player matrix — the control surface.
 *
 * Three independent documented axes over the same control bar:
 *
 *   · SPEED — `playbackRate: number = 1  // Speed 0.5-2`. The doc calls the
 *     control a "speed" control, so the rate the property carries is the rate
 *     the control announces, across the whole documented range.
 *   · SKIP — `skipForward: number = 30` / `skipBack: number = 15`, both
 *     documented in SECONDS. An icon-only skip button that does not say how far
 *     it skips is not the documented control, so the number is asserted in the
 *     accessible name.
 *   · VOLUME — `volume: number = 1  // Volume 0-1` and `muted: boolean = false`,
 *     documented together as "volume control with mute toggle". Opening the
 *     control must surface the CURRENT volume, not a default.
 *
 * Plus the progress bar's slider triple over the documented `currentTime` /
 * `duration` pair, including the zero-duration state a fresh player is in.
 *
 * 7 rates + 4 skip pairs + 8 volume vectors + 9 progress points = 28 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePlayer, expectPlayerMatches, expectClean, RATES,
  buttons, accessibleName, volumeButton, progressEl, sr, textOf, wait, SETTLE,
  type SnicePodcastPlayerElement,
} from './matrix-utils';

describe('snice-podcast-player matrix: playback speed', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const playbackRate of RATES) {
    it(`rate=${playbackRate}`, async () => {
      const combo = { src: '/audio/episode.mp3', title: 'Ep', playbackRate };
      el = await makePlayer(combo);
      // The property survived the documented `playback-rate` attribute.
      expect(el.playbackRate, 'playback-rate attribute did not reach the property').toBe(playbackRate);
      expectPlayerMatches(el, combo);
    });
  }
});

describe('snice-podcast-player matrix: skip amounts', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  const PAIRS = [
    { skipBack: 15, skipForward: 30 }, // the documented defaults
    { skipBack: 10, skipForward: 45 },
    { skipBack: 5, skipForward: 5 },
    { skipBack: 60, skipForward: 90 },
  ];

  for (const pair of PAIRS) {
    it(`back=${pair.skipBack}/forward=${pair.skipForward}`, async () => {
      const combo = { src: '/audio/episode.mp3', title: 'Ep', ...pair };
      el = await makePlayer(combo);
      expect(el.skipBack).toBe(pair.skipBack);
      expect(el.skipForward).toBe(pair.skipForward);
      expectPlayerMatches(el, combo);
    });
  }
});

describe('snice-podcast-player matrix: volume and mute', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const volume of [0, 0.25, 0.6, 1]) {
    for (const muted of [false, true]) {
      it(`volume=${volume}/muted=${muted}`, async () => {
        const combo = { src: '/audio/episode.mp3', title: 'Ep', volume, muted };
        el = await makePlayer(combo);
        const problems: string[] = [];

        expect(el.volume).toBe(volume);
        expect(el.muted).toBe(muted);

        const button = volumeButton(el);
        if (!button) {
          problems.push('no volume control');
        } else {
          // "Volume control with mute toggle": opening it must show the CURRENT
          // level, which is the only way a user can tell 0.25 from 1.
          button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
          await wait(SETTLE);
          const slider = sr(el).querySelector<HTMLInputElement>('.podcast-volume-slider');
          if (!slider) problems.push('volume control opens no slider');
          else {
            if (slider.type !== 'range') problems.push(`volume slider type "${slider.type}"`);
            if (Number(slider.value) !== volume) {
              problems.push(`volume slider reads ${slider.value}, expected ${volume}`);
            }
            if (Number(slider.min) !== 0 || Number(slider.max) !== 1) {
              problems.push(`volume slider range ${slider.min}..${slider.max}, expected 0..1`);
            }
          }
        }

        expectClean(problems, `volume=${volume}/muted=${muted}`);
      });
    }
  }

  it('the mute toggle is visually distinguishable from full volume', async () => {
    // The doc promises a "mute toggle"; a toggle whose two states paint the
    // same thing is not a toggle. The exact icon is not documented, so this is
    // asserted as "the two states differ", never as a pinned path.
    const loud = await makePlayer({ src: '/a.mp3', volume: 1, muted: false });
    const loudIcon = sr(loud).querySelector('.podcast-volume button')!.innerHTML;
    removeComponent(loud as HTMLElement);

    el = await makePlayer({ src: '/a.mp3', volume: 1, muted: true });
    const mutedIcon = sr(el).querySelector('.podcast-volume button')!.innerHTML;

    expect(mutedIcon).not.toBe(loudIcon);
  });
});

describe('snice-podcast-player matrix: progress slider', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // `duration` 0 is the state a player is in before metadata loads, and it is
  // the one that divides by zero if the progress maths is naive.
  const DURATIONS = [0, 95, 3725];
  const POSITIONS = [0, 0.5, 1];

  for (const duration of DURATIONS) {
    for (const fraction of POSITIONS) {
      const currentTime = Math.round(duration * fraction);
      it(`duration=${duration}/currentTime=${currentTime}`, async () => {
        const combo = { src: '/audio/episode.mp3', title: 'Ep', duration, currentTime };
        el = await makePlayer(combo);
        const problems: string[] = [];

        // The oracle owns role/tabindex/valuemin/valuemax/valuenow.
        expectPlayerMatches(el, combo);

        const progress = progressEl(el)!;
        // aria-valuetext is what a screen reader actually speaks for a slider
        // whose numeric value is a second count; it must not be empty.
        if (!progress.getAttribute('aria-valuetext')) {
          problems.push('progress slider has no aria-valuetext');
        }
        // Both clocks render something; a blank clock is not a clock.
        for (const cls of ['.podcast-time-current', '.podcast-time-remaining']) {
          const node = sr(el).querySelector(cls);
          if (!node) problems.push(`missing ${cls}`);
          else if (!textOf(node)) problems.push(`${cls} is blank`);
        }
        expectClean(problems, `duration=${duration}/currentTime=${currentTime}`);
      });
    }
  }
});

describe('snice-podcast-player matrix: control accessibility', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  it('every control is a real, named button in every source mode', async () => {
    // "Play/pause, skip, and speed controls are keyboard accessible" — for an
    // icon-only control that means a <button> with an accessible name, in every
    // configuration the player can be authored into.
    const problems: string[] = [];
    for (const combo of [
      { src: '/a.mp3' },
      { title: 'Only a title' },
      { src: '/a.mp3', volume: 0, muted: true },
    ]) {
      const player = await makePlayer(combo);
      const controls = buttons(player);
      if (controls.length === 0) problems.push(`${JSON.stringify(combo)}: no controls at all`);
      for (const button of controls) {
        if (button.tagName !== 'BUTTON') problems.push(`${JSON.stringify(combo)}: ${button.tagName} used as a control`);
        if (!accessibleName(button)) problems.push(`${JSON.stringify(combo)}: unnamed control .${button.className}`);
      }
      removeComponent(player as HTMLElement);
    }
    expectClean(problems, 'control accessibility');
  });
});
