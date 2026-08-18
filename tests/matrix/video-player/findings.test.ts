/**
 * snice-video-player matrix — the standing findings.
 *
 * Everything here asserts the DOCUMENTED behaviour per `.ai/fuzzing.md`: the
 * assertion stays correct, the component is changed to match it, and the
 * finding is closed as `(fixed)` — both below are.
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
   * MATRIX-video-player-1 (fixed) — the documented `current-time` attribute
   * used to be discarded before the first frame.
   *
   * `docs/ai/components/video-player.md` documents
   * `currentTime: number = 0;  // attr: current-time`, which is a page's only
   * declarative way to open a video part-way through — the "resume where they
   * left off" case the attribute exists for. `@watch('src')` used to run
   * `this.currentTime = 0` on the same attribute pass that set the source,
   * and nothing ever pushed the property to the media element either. The
   * authored position now survives the source pass and is applied to the
   * media element when its metadata loads.
   */
  it('MATRIX-video-player-1 (fixed): current-time="30" opens the video at 30 seconds', async () => {
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
   * MATRIX-video-player-2 (fixed) — the documented multi-format markup used
   * to render a player with no controls.
   *
   * The doc's own second usage example is:
   *
   *     <snice-video-player poster="poster.jpg">
   *       <source src="video.webm" type="video/webm">
   *       <source src="video.mp4" type="video/mp4">
   *     </snice-video-player>
   *
   * and the Slots section documents "(default) — `<source>` elements for
   * multiple formats". The control bar used to be rendered under
   * `this.controls && this.src`, and `src` is empty in exactly this markup.
   * The controls (and the centre play affordance) now render for slotted
   * `<source>` children too; `controls` still defaults to TRUE.
   */
  it('MATRIX-video-player-2 (fixed): the documented <source> markup still renders its controls', async () => {
    el = await makePlayer(
      { ...DEFAULTS, src: '', poster: POSTER },
      { html: '<source src="/media/clip.webm" type="video/webm">'
        + '<source src="/media/clip.mp4" type="video/mp4">',
      prime: false },
    );

    // The sources really are projected — the slot half of the contract works.
    // (Spread first: happy-dom's HTMLCollection.map returns another
    // HTMLCollection whose internal `_namedItems` own-property upsets toEqual.)
    const slot = videoEl(el)!.querySelector('slot') as HTMLSlotElement;
    expect([...slot.assignedElements()].map(node => node.tagName)).toEqual(['SOURCE', 'SOURCE']);

    expect(controlsBar(el), 'the documented multi-format player renders no control bar')
      .not.toBeNull();
    expect(part(el, 'progress'), 'the documented multi-format player exposes no progress part')
      .not.toBeNull();
    // The doc example carries a poster, so the way to start is the poster
    // overlay's play affordance; without one it is the centre play.
    expect(centrePlay(el) ?? el.shadowRoot.querySelector('.video-poster-play'),
      'the documented multi-format player offers no way to start')
      .not.toBeNull();
  });
});
