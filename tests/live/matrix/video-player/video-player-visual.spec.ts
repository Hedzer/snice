/**
 * snice-video-player TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/video-player/`, 71 combos) owns the transport:
 * which method moves which state, which event carries which detail, what the
 * clock reads and where the progress bar is drawn. It cannot own any of the
 * below, because happy-dom has no media pipeline and performs no layout:
 *
 *   · `variant: 'default'|'minimal'|'cinema'` has NO DOM effect at all — the
 *     three differ only in `:host([variant=…])` rules, so a component that
 *     shipped one look three times would pass the whole DOM tier.
 *   · The control bar is an ABSOLUTE overlay on top of the picture. Whether it
 *     really sits over the video, whether every button is really clickable
 *     through the video underneath, and whether the bar spans the player are
 *     all hit-test and geometry questions.
 *   · The progress track is scrubbed by comparing a click's `clientX` against
 *     the track's own box. With every box reading zero that arithmetic is
 *     meaningless; here it is a real pointer landing on a real pixel.
 *   · The controls fade after three seconds of playback and come back on
 *     movement — an opacity transition, invisible to the DOM.
 *
 * LAYER 1 — geometry / occlusion / computed style over
 *   {3 variants} x {2 poster states} = 6 combos, plus the measurements above.
 * LAYER 2 — one pinned screenshot: the player really paints video frames, and
 *   the controls really paint legibly on top of them.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/video-player/matrix.html';

const VARIANTS = ['default', 'minimal', 'cinema'] as const;
const POSTER = '/tests/live/fixtures/video-player/matrix.html';

/**
 * The player's marks are its control buttons. `requireDistinctPositions` is on
 * because a control bar whose buttons all sit at one origin is exactly the
 * collapse happy-dom cannot see; `occlusion` is on because a button painted
 * under the video is a button nobody can press.
 */
function probeFor(variant: typeof VARIANTS[number]): ChartProbe {
  return {
    surface: '[part~="base"]',
    marks: variant === 'minimal'
      // `:host([variant="minimal"])` hides the rate and picture-in-picture
      // buttons by design, so this variant's marks are the controls it keeps.
      ? '.video-btn-play, .video-btn-volume, .video-btn-fullscreen'
      : '.video-btn',
    minMarks: 3,
    requireDistinctPositions: true,
    occlusion: true,
    hidden: variant === 'minimal' ? ['.video-rate-btn', '.video-btn-pip'] : [],
    boxes: ['[part~="base"]', '[part~="video"]', '[part~="controls"]', '[part~="progress"]'],
  };
}

test.describe('snice-video-player visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const variant of VARIANTS) {
    for (const poster of ['', POSTER]) {
      const id = `${variant}/${poster ? 'poster' : 'no-poster'}`;
      test(id, async () => {
        await mount(page, { variant, poster });
        expect(await collectChartProblems(page, probeFor(variant)), id).toEqual([]);
      });
    }
  }

  test('the control bar really overlays the bottom of the picture', async () => {
    // doc, parts: `controls` — "Control bar container". A bar laid out BELOW
    // the video instead of over it would satisfy every DOM assertion and change
    // the whole component.
    await mount(page, { variant: 'default' });
    const boxes = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const box = (selector: string) => {
        const b = sr.querySelector(selector)!.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
      };
      return { base: box('[part~="base"]'), video: box('video'), bar: box('[part~="controls"]') };
    });

    expect(boxes.bar.height, 'the control bar has no height').toBeGreaterThan(0);
    expect(boxes.bar.bottom, 'the control bar hangs below the player')
      .toBeLessThanOrEqual(boxes.base.bottom + 1.5);
    expect(boxes.bar.top, 'the control bar is not over the picture')
      .toBeLessThan(boxes.video.bottom);
    expect(boxes.bar.width / boxes.base.width, 'the control bar does not span the player')
      .toBeGreaterThan(0.9);
  });

  test('every control is clickable through the video underneath it', async () => {
    // The bar sits on top of a `<video>` that also handles clicks (click to
    // toggle). If the video won the hit test, every button would be inert while
    // looking perfectly fine.
    await mount(page, { variant: 'default' });
    const blocked = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot! as any;
      const buttons = [...sr.querySelectorAll('.video-btn')] as HTMLElement[];
      return buttons.filter((btn) => {
        const b = btn.getBoundingClientRect();
        const hit = sr.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return hit !== btn && !btn.contains(hit);
      }).map(btn => btn.className);
    });
    expect(blocked).toEqual([]);
  });

  test('a real click on the play button really pauses the media', async () => {
    // End to end through the browser's own hit testing and its own media
    // pipeline — the one place the transport is exercised for real.
    await mount(page, { variant: 'default' });
    const paused = await page.evaluate(() => (window as any).matrix.clickControl('play'));
    expect(paused!.paused, 'clicking the play button did not pause the media').toBe(true);
  });

  test('scrubbing the progress track seeks to the fraction that was clicked', async () => {
    // `handleProgressClick` maps `clientX` onto the track's own box. That
    // arithmetic is the entire scrub feature and it is meaningless without
    // layout: in happy-dom the track is 0 wide and every click lands at 0%.
    await mount(page, { variant: 'default' });
    const problems: string[] = [];
    for (const fraction of [0.25, 0.5, 0.75]) {
      const seeked = await page.evaluate(f => (window as any).matrix.scrub(f), fraction);
      if (!seeked || !Number.isFinite(seeked.duration) || seeked.duration <= 0) {
        problems.push(`the fixture clip reported a duration of ${seeked?.duration}`);
        continue;
      }
      const landed = seeked.currentTime / seeked.duration;
      if (Math.abs(landed - fraction) > 0.02) {
        problems.push(`a click at ${fraction} of the track seeked to ${landed.toFixed(3)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the three variants really look different', async () => {
    // `variant: 'default'|'minimal'|'cinema' = 'default'`. Every difference
    // lives in `:host([variant=…])` rules — the rate and picture-in-picture
    // buttons disappear under `minimal`, the container grows a shadow and a
    // taller bar under `cinema`. In happy-dom all three are the same string.
    const measured: Record<string, any> = {};
    for (const variant of VARIANTS) {
      await mount(page, { variant });
      measured[variant] = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const container = sr.querySelector('.video-container') as HTMLElement;
        const bar = sr.querySelector('[part~="controls"]') as HTMLElement;
        const visible = (selector: string) => {
          const node = sr.querySelector(selector) as HTMLElement | null;
          if (!node) return false;
          const cs = getComputedStyle(node);
          return cs.display !== 'none' && cs.visibility !== 'visible' ? false
            : node.getBoundingClientRect().width > 0;
        };
        return {
          shadow: getComputedStyle(container).boxShadow,
          barHeight: bar.getBoundingClientRect().height,
          rate: visible('.video-rate-btn'),
          pip: visible('.video-btn-pip'),
        };
      });
    }

    expect(measured.minimal.rate, 'the minimal variant still shows the rate button').toBe(false);
    expect(measured.minimal.pip, 'the minimal variant still shows the PiP button').toBe(false);
    expect(measured.default.rate, 'the default variant hides the rate button').toBe(true);
    expect(measured.cinema.shadow, 'the cinema variant paints no shadow').not.toBe('none');
    expect(measured.cinema.shadow, 'cinema and default paint the same shadow')
      .not.toBe(measured.default.shadow);
  });

  test('the controls fade out while playing and come back on movement', async () => {
    // `CONTROLS_HIDE_DELAY = 3000` plus a CSS transition: a player that never
    // got out of the way of its own picture, or one whose bar never came back,
    // is a defect nothing in the DOM tier can observe. The clip is looped so it
    // is still PLAYING three seconds in — the bar is documented to come back
    // when the media ends, and that is a different behaviour from this one.
    await mount(page, { variant: 'default', loop: true });
    const shown = await page.evaluate(() => {
      const bar = document.getElementById('subject')!
        .shadowRoot!.querySelector('[part~="controls"]') as HTMLElement;
      return Number(getComputedStyle(bar).opacity);
    });
    expect(shown, 'the control bar is not visible while the pointer is on the player')
      .toBeGreaterThan(0.5);

    const faded = await page.evaluate(() => (window as any).matrix.idle(3600));
    expect(faded, 'the control bar never fades while the video plays').toBeLessThan(shown);

    await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelector('.video-container')!
      .dispatchEvent(new MouseEvent('mousemove', { bubbles: true })));
    const back = await page.evaluate(async () => {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const bar = document.getElementById('subject')!
        .shadowRoot!.querySelector('[part~="controls"]') as HTMLElement;
      return Number(getComputedStyle(bar).opacity);
    });
    expect(back, 'the control bar does not come back when the pointer moves')
      .toBeGreaterThan(faded!);
  });

  test('the poster overlay covers the picture until it is clicked', async () => {
    // `poster` is the still shown before playback; it has to be ON TOP of the
    // video or it is not a cover at all.
    await mount(page, { variant: 'default', poster: POSTER, play: false });
    const covered = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot! as any;
      const poster = sr.querySelector('.video-poster') as HTMLElement | null;
      if (!poster) return null;
      const b = poster.getBoundingClientRect();
      const video = sr.querySelector('video').getBoundingClientRect();
      // Probe the UPPER quarter: the control bar is its own absolute overlay
      // across the bottom, and a hit there would be measuring the bar's
      // stacking order rather than the poster's.
      const hit = sr.elementFromPoint(b.left + b.width / 2, b.top + b.height * 0.25);
      return {
        spansVideo: Math.abs(b.width - video.width) < 2 && Math.abs(b.height - video.height) < 2,
        onTop: poster === hit || poster.contains(hit),
      };
    });
    expect(covered, 'the poster overlay did not render').not.toBeNull();
    expect(covered!.spansVideo, 'the poster does not cover the whole picture').toBe(true);
    expect(covered!.onTop, 'the video paints over its own poster').toBe(true);
  });

  test('the player keeps its picture inside its own box', async () => {
    // A `<video>` that overflowed its container would spill over whatever the
    // page put next to it, and no DOM assertion could tell.
    const problems: string[] = [];
    for (const variant of VARIANTS) {
      await mount(page, { variant });
      const escaped = await page.evaluate(() => {
        const host = document.getElementById('subject')!;
        const hostBox = host.getBoundingClientRect();
        const video = host.shadowRoot!.querySelector('video')!.getBoundingClientRect();
        return video.left < hostBox.left - 1.5 || video.right > hostBox.right + 1.5
          || video.top < hostBox.top - 1.5 || video.bottom > hostBox.bottom + 1.5;
      });
      if (escaped) problems.push(`${variant}: the picture escapes the host box`);
    }
    expect(problems).toEqual([]);
  });
});

// ── LAYER 2: real pixels, one pinned combo ──────────────────────────────────

test.describe('snice-video-player visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the player paints real frames, and the controls stay legible over them', async () => {
    // The synthetic clip is red on the left and green on the right, so two
    // probes prove both that frames arrived and that they arrived the right way
    // round. The third probe is the control bar's own gradient, which is what
    // keeps white icons readable over a bright frame — a real regression that
    // only pixels catch.
    await mount(page, { variant: 'default' });

    const PROBES = `(host) => {
      const sr = host.shadowRoot;
      const video = sr.querySelector('video').getBoundingClientRect();
      const bar = sr.querySelector('[part~="controls"]').getBoundingClientRect();
      return [
        { x: video.left + video.width * 0.12, y: video.top + video.height * 0.3 },
        { x: video.left + video.width * 0.88, y: video.top + video.height * 0.3 },
        { x: bar.left + bar.width * 0.5, y: bar.bottom - bar.height * 0.25 },
      ];
    }`;

    const [left, right, overBar] = await capture(page, '#subject', 'video-frames-and-controls', PROBES);

    expect(sameColor(left, right), 'the picture is one flat colour, so no frame arrived').toBe(false);
    expect(left[0], 'the left of the picture is not the red side of the frame')
      .toBeGreaterThan(left[1]);
    expect(right[1], 'the right of the picture is not the green side of the frame')
      .toBeGreaterThan(right[0]);

    // The control bar's gradient darkens whatever is behind it, so white
    // controls keep their contrast. `--snice-video-controls-color` is
    // documented as `rgb(255 255 255)`.
    expect(contrast([255, 255, 255], overBar),
      'the control bar does not darken the frame enough for white controls to read')
      .toBeGreaterThan(3);
  });
});
