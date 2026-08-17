/**
 * snice-music-player TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/music-player/`, 316 combos) owns which section
 * exists for which `show*` vector, what the track info and the playlist say,
 * and which event each transport method emits. It cannot own any of the below,
 * because happy-dom performs no layout, resolves no colours and decodes no
 * audio:
 *
 *   · `compact: boolean = false` has essentially NO DOM effect — one class on
 *     the container — and its whole meaning is that the player gets shorter.
 *   · The five `show*` switches are documented as showing or hiding SECTIONS. A
 *     section that renders at 0x0, or one that overlaps its neighbour, is
 *     invisible to a presence check.
 *   · The playlist is a scroll region. Whether a long list overflows inside its
 *     own box or pushes the page sideways is a browser fact.
 *   · The progress track is scrubbed by comparing a click's `clientX` against
 *     the track's own box — arithmetic that means nothing without layout.
 *   · The artwork is an `<img>`: whether it actually decoded and painted, and
 *     whether it kept its aspect ratio, needs real pixels.
 *
 * LAYER 1 — geometry / occlusion / computed style over the six section vectors
 *   plus `compact`, and the measurements above.
 * LAYER 2 — one pinned screenshot: the artwork really paints the track's own
 *   cover, and the active playlist row really stands out from its neighbours.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/music-player/matrix.html';

/**
 * Six section vectors: everything on, then each documented switch turned off on
 * its own, which is the shape that isolates what each one owns.
 */
const VECTORS = [
  { id: 'all-on', combo: {} },
  { id: 'no-artwork', combo: { artwork: false } },
  { id: 'no-track-info', combo: { trackInfo: false } },
  { id: 'no-volume', combo: { volume: false } },
  { id: 'no-playlist', combo: { playlist: false } },
  { id: 'compact', combo: { compact: true } },
] as const;

/**
 * The player's marks are its transport buttons. `requireDistinctPositions` is
 * on because a control row whose buttons share an origin is exactly the
 * collapse happy-dom cannot see; `occlusion` is on because a button under the
 * artwork is a button nobody can press.
 */
const PROBE: ChartProbe = {
  surface: '[part~="base"]',
  marks: '.player-btn',
  minMarks: 5,
  requireDistinctPositions: true,
  occlusion: true,
  text: '.player-track-title',
  boxes: ['[part~="base"]', '[part~="controls"]'],
};

/** The bounding boxes of the documented regions, or null when absent. */
function regionBoxes(page: Page) {
  return page.evaluate(() => {
    const sr = document.getElementById('subject')!.shadowRoot!;
    const box = (selector: string) => {
      const node = sr.querySelector(selector);
      if (!node) return null;
      const b = node.getBoundingClientRect();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
    };
    return {
      base: box('[part~="base"]'),
      artwork: box('.player-artwork'),
      info: box('.player-track-info'),
      controls: box('[part~="controls"]'),
      volume: box('.player-volume'),
      playlist: box('[part~="playlist"]') ?? box('.player-playlist'),
      host: document.getElementById('subject')!.getBoundingClientRect().height,
    };
  });
}

test.describe('snice-music-player visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const { id, combo } of VECTORS) {
    // MATRIX-music-player-1 (documented in full at the bottom of this
    // describe): the compact container lays its playlist outside its own box.
    // The assertion below stays the correct one and the combo is pinned.
    test(id === 'compact' ? `MATRIX-music-player-1: ${id}` : id, async () => {
      if (id === 'compact') test.fail();
      await mount(page, combo);
      expect(await collectChartProblems(page, PROBE), id).toEqual([]);

      // Every section that rendered must have a real box and stay inside the
      // container. A section laid out past the player's own edge is a section
      // nobody sees, however correct its DOM is.
      const boxes = await regionBoxes(page);
      const problems: string[] = [];
      for (const [name, box] of Object.entries(boxes)) {
        if (name === 'base' || name === 'host' || box === null || typeof box === 'number') continue;
        const region = box as { width: number; height: number; left: number; right: number; top: number; bottom: number };
        if (region.width <= 0 || region.height <= 0) {
          problems.push(`${name} renders at ${region.width}x${region.height}`);
          continue;
        }
        const base = boxes.base as any;
        if (region.left < base.left - 1.5 || region.right > base.right + 1.5
          || region.top < base.top - 1.5 || region.bottom > base.bottom + 1.5) {
          problems.push(`${name} escapes part="base"`);
        }
      }
      expect(problems, id).toEqual([]);
    });
  }

  test('each show* switch really removes the height its section held', async () => {
    // The five switches are documented as showing SECTIONS. In happy-dom a
    // removed section and a collapsed one look identical — both are simply
    // absent from a querySelector — so only a height says the space came back.
    await mount(page, {});
    const full = (await regionBoxes(page)).host;

    // `trackInfo` is deliberately not in this list: the artwork sits on the
    // same row and sets its height, so removing the text beside it does not
    // shorten the player. The DOM tier already owns its presence.
    const problems: string[] = [];
    for (const flag of ['artwork', 'volume', 'playlist'] as const) {
      await mount(page, { [flag]: false });
      const reduced = (await regionBoxes(page)).host;
      if (!(reduced < full)) {
        problems.push(`turning ${flag} off left the player at ${reduced}px (was ${full}px)`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('compact really makes the player shorter', async () => {
    // `compact: boolean = false` is one class on the container and nothing
    // else; the entire feature is a layout consequence.
    await mount(page, { compact: false });
    const roomy = (await regionBoxes(page)).host;
    await mount(page, { compact: true });
    const tight = (await regionBoxes(page)).host;

    expect(tight, 'compact did not make the player shorter').toBeLessThan(roomy);
    expect(tight, 'compact collapsed the player entirely').toBeGreaterThan(0);
  });

  test('the sections stack without overlapping each other', async () => {
    // Artwork, track info, controls and playlist are four regions of one
    // column. Two of them sharing a band is the classic overlap regression, and
    // it produces a perfectly valid DOM.
    await mount(page, {});
    const boxes = await regionBoxes(page) as any;
    const stacked = ['info', 'controls', 'playlist']
      .map(name => ({ name, box: boxes[name] }))
      .filter(entry => entry.box);

    const problems: string[] = [];
    for (let i = 1; i < stacked.length; i++) {
      const above = stacked[i - 1];
      const below = stacked[i];
      if (below.box.top < above.box.bottom - 1.5) {
        problems.push(`${below.name} overlaps ${above.name}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('a real click on the play button really starts the audio', async () => {
    // End to end through the browser's own hit testing and its own audio
    // pipeline, on a real decodable WAV — the one place the transport runs for
    // real.
    await mount(page, {});
    const after = await page.evaluate(() => (window as any).matrix.clickControl('play-pause'));
    expect(after!.state, 'clicking play did not start the player').toBe('playing');
  });

  test('a real click on a playlist row selects that track', async () => {
    // The row is a hit target laid out inside a scroll region; whether the
    // pointer reaches it is a browser question.
    await mount(page, {});
    const after = await page.evaluate(() => (window as any).matrix.clickRow(2));
    expect(after!.index, 'clicking the third row did not select the third track').toBe(2);
  });

  test('the playlist keeps its rows inside the player', async () => {
    // A playlist is a list of hit targets. Wherever it puts them, they have to
    // stay inside the player's own box and stack in order — a row that spilled
    // past the container would be unclickable while its DOM stayed perfect, and
    // the page itself must never grow a sideways scrollbar because of it.
    await mount(page, {});
    const measured = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]')!.getBoundingClientRect();
      const rows = [...sr.querySelectorAll('.player-playlist-item')] as HTMLElement[];
      return {
        rows: rows.length,
        escaped: rows.filter((row) => {
          const b = row.getBoundingClientRect();
          return b.width <= 0 || b.height <= 0
            || b.left < base.left - 1.5 || b.right > base.right + 1.5
            || b.top < base.top - 1.5 || b.bottom > base.bottom + 1.5;
        }).length,
        ascending: rows.every((row, i) => i === 0
          || row.getBoundingClientRect().top
            >= rows[i - 1].getBoundingClientRect().bottom - 1.5),
        pageScrollsSideways:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    expect(measured.rows).toBe(3);
    expect(measured.escaped, 'a playlist row is laid out outside the player').toBe(0);
    expect(measured.ascending, 'the playlist rows do not stack in order').toBe(true);
    expect(measured.pageScrollsSideways, 'the player pushed the page sideways').toBe(false);
  });

  test('scrubbing the progress track seeks to the fraction that was clicked', async () => {
    // The seek arithmetic maps `clientX` onto the track's own box — the entire
    // feature, and meaningless without layout.
    await mount(page, { play: true });
    const problems: string[] = [];
    for (const fraction of [0.25, 0.5, 0.75]) {
      const seeked = await page.evaluate(f => (window as any).matrix.scrub(f), fraction);
      const duration = Number(seeked!.audioDuration);
      if (!Number.isFinite(duration) || duration <= 0) {
        problems.push(`the fixture track reported a duration of ${seeked!.audioDuration}`);
        continue;
      }
      const landed = Number(seeked!.audioTime) / duration;
      if (Math.abs(landed - fraction) > 0.05) {
        problems.push(`a click at ${fraction} of the track seeked to ${landed.toFixed(3)}`);
      }
      // The ARIA readout is the same fact, floored to whole seconds, so it must
      // agree with the media element to within one second.
      if (Math.abs(Number(seeked!.valuenow) - Number(seeked!.audioTime)) > 1) {
        problems.push(`aria-valuenow="${seeked!.valuenow}" disagrees with the media`
          + ` at ${Number(seeked!.audioTime).toFixed(3)}s`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the artwork keeps its square aspect inside the player', async () => {
    // `artwork?: string` is an image URL, and an `<img>` that stretched to the
    // container's shape would misrepresent every cover it is given.
    await mount(page, {});
    const measured = await page.evaluate(() => {
      const img = document.getElementById('subject')!
        .shadowRoot!.querySelector('.player-artwork img') as HTMLImageElement | null;
      if (!img) return null;
      const b = img.getBoundingClientRect();
      return { width: b.width, height: b.height, complete: img.complete, natural: img.naturalWidth };
    });
    expect(measured, 'no artwork image rendered').not.toBeNull();
    expect(measured!.complete && measured!.natural > 0, 'the artwork never decoded').toBe(true);
    expect(Math.abs(measured!.width - measured!.height), 'the artwork is not square')
      .toBeLessThan(2);
  });

  /**
   * MATRIX-music-player-1 — `compact` lays the playlist outside the player.
   *
   * `docs/ai/components/music-player.md` documents `compact: boolean = false`
   * and `showPlaylist: boolean = true` as independent switches, with no note
   * that one excludes the other. `.player-container--compact` turns the
   * container into a horizontal flex row so the artwork, the track info and the
   * transport sit on one line — and the playlist, still rendered because its
   * own switch defaults to true, becomes a fourth flex item on that same line.
   * It does not fit: it starts past the container's right edge and, with the
   * container at `overflow: visible`, is painted over whatever the page put
   * beside the player.
   *
   * A page that writes `<snice-music-player compact>` — the documented way to
   * ask for the small player — gets a playlist hanging off the side of it.
   * `show-playlist="false"` is the workaround, but nothing documents that it
   * is required.
   *
   * Policy (.ai/fuzzing.md): the assertion stays correct and the combo is
   * pinned, so the day the layout is fixed this suite fails and the finding can
   * be closed.
   */
  test('MATRIX-music-player-1: a compact player keeps its playlist inside itself', async () => {
    test.fail();
    await mount(page, { compact: true });
    const escape = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]')!.getBoundingClientRect();
      const list = (sr.querySelector('[part~="playlist"]')
        ?? sr.querySelector('.player-playlist'))!.getBoundingClientRect();
      return { overhang: Math.round(list.right - base.right), baseRight: Math.round(base.right) };
    });
    expect(escape.overhang,
      `the playlist hangs ${escape.overhang}px past the compact player's right edge`)
      .toBeLessThanOrEqual(2);
  });

  test('the active playlist row is painted differently from its neighbours', async () => {
    // "the row for currentTrackIndex marked active" is a class in the DOM tier
    // and a colour here; a modifier that resolved to the same background would
    // leave the listener unable to see which track is playing.
    await mount(page, {});
    await page.evaluate(() => (window as any).matrix.clickRow(1));
    const colours = await page.evaluate(() => {
      const rows = [...document.getElementById('subject')!
        .shadowRoot!.querySelectorAll('.player-playlist-item')] as HTMLElement[];
      return rows.map(row => ({
        active: row.classList.contains('active'),
        background: getComputedStyle(row).backgroundColor,
        colour: getComputedStyle(row).color,
      }));
    });

    const active = colours.find(row => row.active);
    const inactive = colours.find(row => !row.active);
    expect(active, 'no row is marked active').toBeTruthy();
    expect(active!.background === inactive!.background && active!.colour === inactive!.colour,
      'the active row is painted exactly like an inactive one').toBe(false);
  });
});

// ── LAYER 2: real pixels, one pinned combo ──────────────────────────────────

test.describe('snice-music-player visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the artwork paints the current track\'s own cover, and it changes with the track', async () => {
    // The three fixture covers are three flat colours, so one probe in the
    // middle of the artwork says both that an image painted at all and that it
    // is the RIGHT one — the regression where the artwork never follows the
    // track is invisible to every DOM assertion that only checks for an <img>.
    const ARTWORK = `(host) => { const b = host.shadowRoot.querySelector('.player-artwork img')
      .getBoundingClientRect();
      return [{ x: b.left + b.width / 2, y: b.top + b.height / 2 }]; }`;

    await mount(page, {});
    const [first] = await capture(page, '#subject', 'music-artwork-track-1', ARTWORK);

    await page.evaluate(() => (window as any).matrix.clickRow(1));
    const [second] = await capture(page, '#subject', 'music-artwork-track-2', ARTWORK);

    // Track 1's cover is blue, track 2's is green: neither may be the surface
    // colour, and they may not be the same pixel.
    expect(first[2], 'the first cover did not paint as its own blue').toBeGreaterThan(first[0]);
    expect(second[1], 'the second cover did not paint as its own green').toBeGreaterThan(second[0]);
    expect(sameColor(first, second), 'the artwork did not follow the track change').toBe(false);
  });

  test('the track title is readable against the surface it sits on', async () => {
    // The title is the one string a music player must always be able to show.
    // A theme that put it two luminance points from its background would still
    // render perfect DOM.
    // A single probe can land between two letters AND between two lines of the
    // glyph band, so the title is SAMPLED as a grid across its width and
    // height and judged by its darkest (or lightest) point against the surface
    // beside it. The row fractions sweep the ascent-to-descent range: where a
    // glyph band sits inside its line box differs per engine font, and a single
    // fixed fraction reads only gaps in one of them.
    const TITLE = `(host) => {
      const sr = host.shadowRoot;
      const title = sr.querySelector('.player-track-title').getBoundingClientRect();
      const base = sr.querySelector('[part~="base"]').getBoundingClientRect();
      const points = [];
      for (const fy of [0.25, 0.4, 0.55, 0.7, 0.85]) {
        for (let i = 0; i < 24; i++) {
          points.push({ x: title.left + 1 + (title.width - 2) * (i / 23),
                        y: title.top + title.height * fy });
        }
      }
      points.push({ x: base.right - 6, y: title.top + title.height / 2 });
      return points;
    }`;

    await mount(page, {});
    const probes = await capture(page, '#subject', 'music-track-title', TITLE);
    const surface = probes[probes.length - 1];
    const best = Math.max(...probes.slice(0, -1).map(point => contrast(point, surface)));
    expect(best, 'the track title has almost no contrast against the panel behind it')
      .toBeGreaterThan(3);
  });
});
