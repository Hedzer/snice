/**
 * snice-video-player matrix — the standing findings.
 *
 * Everything here asserts the DOCUMENTED behaviour and is pinned with
 * `it.fails` per `.ai/fuzzing.md`: the assertion stays correct, the component is
 * not changed, and the day it is fixed this file fails and the finding closes.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, POSTER, SRC, centrePlay, controlsBar, makePlayer, part, primePlayback,
  removeComponent, timeLabel, videoEl, wait, type Player,
} from './player-support';

let el: Player | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-video-player matrix: findings', () => {
  /**
   * MATRIX-video-player-1 — the documented `current-time` attribute is
   * discarded before the first frame.
   *
   * `docs/ai/components/video-player.md` documents
   * `currentTime: number = 0;  // attr: current-time`, which is a page's only
   * declarative way to open a video part-way through — the "resume where they
   * left off" case the attribute exists for. It never survives: `@watch('src')`
   * runs `this.currentTime = 0` whenever the source is assigned, and the source
   * is assigned during the same attribute pass, so the authored position is
   * overwritten before anything renders. Nothing ever pushes the property to
   * the media element either, so even an assignment that survived would not
   * seek.
   *
   * `seekTo()` is unaffected and is the only working way in — but that requires
   * script, which is exactly what the attribute was documented to avoid.
   */
  it.fails('MATRIX-video-player-1: current-time="30" opens the video at 30 seconds', async () => {
    el = await makePlayer({}, { prime: false });
    removeComponent(el as HTMLElement);

    // Author the documented pair, in the documented markup order.
    const authored = document.createElement('snice-video-player') as any;
    authored.setAttribute('src', SRC);
    authored.setAttribute('current-time', '30');
    document.body.appendChild(authored);
    await authored.ready;
    await wait(30);
    el = authored as Player;

    const video = videoEl(el)!;
    primePlayback(video);
    video.dispatchEvent(new Event('loadedmetadata'));
    await wait(30);

    expect(el.currentTime, 'the authored current-time was discarded').toBe(30);
    expect(videoEl(el)!.currentTime, 'the media element never seeked to it').toBe(30);
    expect(timeLabel(el), 'the clock does not show the authored position').toBe('0:30 / 2:00');
  });

  /**
   * MATRIX-video-player-2 — the documented multi-format markup renders a player
   * with no controls.
   *
   * The doc's own second usage example is:
   *
   *     <snice-video-player poster="poster.jpg">
   *       <source src="video.webm" type="video/webm">
   *       <source src="video.mp4" type="video/mp4">
   *     </snice-video-player>
   *
   * and the Slots section documents "(default) — `<source>` elements for
   * multiple formats". The `<source>` children are projected correctly, but the
   * control bar is rendered under `this.controls && this.src`, and `src` is
   * empty in exactly this markup — so the documented multi-format player has no
   * control bar, no `part="controls"`, no `part="progress"` and not even the
   * centre play affordance. Once the poster is clicked there is no way to
   * pause, seek, or change the volume.
   *
   * `controls` is documented as defaulting to TRUE with no caveat about `src`.
   */
  it.fails('MATRIX-video-player-2: the documented <source> markup still renders its controls', async () => {
    el = await makePlayer(
      { ...DEFAULTS, src: '', poster: POSTER },
      { html: '<source src="/media/clip.webm" type="video/webm">'
        + '<source src="/media/clip.mp4" type="video/mp4">',
      prime: false },
    );

    // The sources really are projected — the slot half of the contract works.
    const slot = videoEl(el)!.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedElements().map(node => node.tagName)).toEqual(['SOURCE', 'SOURCE']);

    expect(controlsBar(el), 'the documented multi-format player renders no control bar')
      .not.toBeNull();
    expect(part(el, 'progress'), 'the documented multi-format player exposes no progress part')
      .not.toBeNull();
    expect(centrePlay(el), 'the documented multi-format player offers no way to start')
      .not.toBeNull();
  });
});
