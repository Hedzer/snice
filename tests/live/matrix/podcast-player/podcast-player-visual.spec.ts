/**
 * snice-podcast-player TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/podcast-player, 100 combos) owns
 * which control exists, what it announces, and what the aria triple says. It
 * cannot own any of the below, because happy-dom performs no layout: every
 * button, clock and progress bar there reads 0x0, so a control bar that has
 * collapsed, overflowed its host, or buried the play button under the artwork
 * looks identical to a correct one.
 *
 * LAYER 1 — geometry / occlusion / computed style, for
 *   {4 episode sets} x {artwork on/off} x {3 playback positions} = 24 combos,
 * plus the four measurements that are the reason this tier exists for a player
 * rather than a chart: the progress FILL tracks the position, the control bar
 * stays inside its host, the volume slider only takes space once opened, and a
 * long episode title cannot push a control out of the box.
 *
 * LAYER 2 — real screenshots, two pinned combos only. Screenshots are the
 * expensive layer; new feature combinations belong in layer 1.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/podcast-player/matrix.html';

const EPISODE_SETS = ['none', 'flat', 'chaptered', 'overflow'] as const;
const ARTWORKS = [undefined, '/website/assets/logo.svg'];
const POSITIONS = [
  { id: 'start', duration: 3600, currentTime: 0 },
  { id: 'middle', duration: 3600, currentTime: 1800 },
  { id: 'end', duration: 3600, currentTime: 3600 },
];

interface Combo {
  id: string;
  episodes: typeof EPISODE_SETS[number];
  episodeIndex?: number;
  artwork?: string;
  duration: number;
  currentTime: number;
}

function combos(): Combo[] {
  const out: Combo[] = [];
  for (const episodes of EPISODE_SETS) {
    for (const artwork of ARTWORKS) {
      for (const position of POSITIONS) {
        out.push({
          id: `${episodes}/artwork-${artwork ? 'on' : 'off'}/${position.id}`,
          episodes,
          // The chaptered and overflow sets exist to be LOADED; loading is what
          // brings the chapter list and the long title into the layout.
          episodeIndex: episodes === 'chaptered' || episodes === 'overflow' ? 0 : undefined,
          artwork,
          duration: position.duration,
          currentTime: position.currentTime,
        });
      }
    }
  }
  return out;
}

/**
 * The player's marks are its control buttons: every one must have a real box,
 * sit inside the player, and be the thing a click at its own centre reaches.
 * That last check is the one with no DOM equivalent — it is how a play button
 * covered by the progress container, or a volume popover left open over the
 * transport, gets caught.
 */
const PROBE: ChartProbe = {
  surface: '.podcast-container',
  marks: '.podcast-btn',
  // speed, skip-back, play, skip-forward, sleep, volume.
  marks_expected: 6,
  requireDistinctPositions: true,
  occlusion: true,
  text: '.podcast-title',
  boxes: ['.podcast-progress', '.podcast-progress-container', '[part~="info"]', '[part~="controls"]'],
  // The volume slider is an on-demand affordance; nothing has opened it.
  hidden: ['.podcast-volume-slider-container'],
};

test.describe('snice-podcast-player visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const combo of combos()) {
    test(combo.id, async () => {
      await mount(page, combo);
      expect(await collectChartProblems(page, PROBE), combo.id).toEqual([]);
    });
  }
});

test.describe('snice-podcast-player visual matrix (layer 1: measured geometry)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const fraction of [0, 0.25, 0.5, 1]) {
    test(`the progress fill paints ${fraction * 100}% of the track`, async () => {
      // `currentTime` / `duration` are documented in seconds; the bar is the
      // only place their RATIO becomes visible, and a DOM test cannot see a
      // width. A fill stuck at 0 or 100% is the classic regression here.
      const duration = 400;
      await mount(page, {
        id: `fill-${fraction}`, episodes: 'none',
        duration, currentTime: duration * fraction,
      });
      const ratio = await page.evaluate(() => (window as any).matrix.progressRatio());
      expect(ratio).not.toBeNull();
      expect(Math.abs(ratio - fraction), `fill ratio ${ratio}, expected ${fraction}`).toBeLessThan(0.02);
    });
  }

  test('the control bar stays inside the player', async () => {
    await mount(page, { id: 'fit', episodes: 'none', duration: 3600, currentTime: 0 });
    const overflow = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const container = sr.querySelector('.podcast-container')!.getBoundingClientRect();
      const escaped: string[] = [];
      for (const node of sr.querySelectorAll('.podcast-btn, .podcast-progress, .podcast-time')) {
        const box = node.getBoundingClientRect();
        if (box.left < container.left - 1 || box.right > container.right + 1) {
          escaped.push(`${(node as HTMLElement).className}: ${Math.round(box.left)}..${Math.round(box.right)}`
            + ` outside ${Math.round(container.left)}..${Math.round(container.right)}`);
        }
      }
      return escaped;
    });
    expect(overflow).toEqual([]);
  });

  test('a runaway episode title cannot push a control out of the box', async () => {
    // The `overflow` episode set is one long unbreakable word. If the title is
    // laid out without a wrap or clip rule it widens the info row, and every
    // control below it goes with it.
    await mount(page, {
      id: 'overflow', episodes: 'overflow', episodeIndex: 0,
      duration: 5400, currentTime: 0,
    });
    const escaped = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const hostBox = host.getBoundingClientRect();
      const sr = host.shadowRoot!;
      const out: string[] = [];
      for (const node of sr.querySelectorAll('.podcast-btn, .podcast-title')) {
        const box = node.getBoundingClientRect();
        if (box.right > hostBox.right + 1 || box.left < hostBox.left - 1) {
          out.push(`${(node as HTMLElement).className} escapes the host`);
        }
      }
      return out;
    });
    expect(escaped).toEqual([]);
  });

  test('the volume slider takes no space until the control is opened', async () => {
    await mount(page, { id: 'volume', episodes: 'none', duration: 600, currentTime: 0 });

    const before = await page.evaluate(() => {
      const node = document.getElementById('subject')!.shadowRoot!
        .querySelector('.podcast-volume-slider-container');
      return node ? node.getBoundingClientRect().width : 0;
    });
    expect(before).toBe(0);

    expect(await page.evaluate(() => (window as any).matrix.openVolume())).toBe(true);

    const after = await page.evaluate(() => {
      const node = document.getElementById('subject')!.shadowRoot!
        .querySelector('.podcast-volume-slider-container') as HTMLElement;
      if (!node) return null;
      const box = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      return { width: box.width, height: box.height, display: cs.display, opacity: Number(cs.opacity) };
    });
    expect(after).not.toBeNull();
    expect(after!.width).toBeGreaterThan(0);
    expect(after!.height).toBeGreaterThan(0);
    expect(after!.display).not.toBe('none');
    expect(after!.opacity).toBeGreaterThan(0);
  });

  test('episode rows are stacked, not piled on top of each other', async () => {
    // A list whose rows all land at the same y is a perfectly valid DOM and an
    // unreadable list. Only boxes catch it.
    await mount(page, { id: 'rows', episodes: 'flat', duration: 1800, currentTime: 0 });
    const tops = await page.evaluate(() => [...document.getElementById('subject')!.shadowRoot!
      .querySelectorAll('.podcast-episode-item')].map(n => Math.round(n.getBoundingClientRect().top)));
    expect(tops.length).toBe(3);
    expect(new Set(tops).size, `rows overlap at ${JSON.stringify(tops)}`).toBe(3);
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);
  });

  test('chapters are laid out below the transport, in order', async () => {
    await mount(page, {
      id: 'chapters', episodes: 'chaptered', episodeIndex: 0,
      duration: 3600, currentTime: 0,
    });
    const geometry = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const controls = sr.querySelector('[part~="controls"]')!.getBoundingClientRect();
      const rows = [...sr.querySelectorAll('.podcast-chapter-item')]
        .map(n => n.getBoundingClientRect());
      return { controlsBottom: controls.bottom, rows: rows.map(r => ({ top: r.top, height: r.height })) };
    });
    expect(geometry.rows.length).toBe(3);
    for (const row of geometry.rows) {
      expect(row.height).toBeGreaterThan(0);
      expect(row.top).toBeGreaterThanOrEqual(geometry.controlsBottom - 1);
    }
    expect(geometry.rows[0].top).toBeLessThan(geometry.rows[1].top);
    expect(geometry.rows[1].top).toBeLessThan(geometry.rows[2].top);
  });
});

// ── LAYER 2: real pixels, two pinned combos ─────────────────────────────────

test.describe('snice-podcast-player visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the played portion of the progress bar is painted differently from the rest', async () => {
    // A progress bar whose fill is the same colour as its track communicates
    // nothing, and no DOM assertion can tell the two apart.
    await mount(page, { id: 'px-progress', episodes: 'none', duration: 400, currentTime: 200 });
    const probe = `(host) => { const track = host.shadowRoot.querySelector('.podcast-progress');
      const b = track.getBoundingClientRect();
      return [{ x: b.left + b.width * 0.25, y: b.top + b.height / 2 },
              { x: b.left + b.width * 0.85, y: b.top + b.height / 2 }]; }`;
    const [played, unplayed] = await capture(page, '#subject', 'podcast-progress-half', probe);
    expect(sameColor(played, unplayed), 'played and unplayed track paint identically').toBe(false);
  });

  test('the episode title is readable against the player surface', async () => {
    await mount(page, { id: 'px-title', episodes: 'none', duration: 3600, currentTime: 0 });
    const probe = `(host) => { const t = host.shadowRoot.querySelector('.podcast-title');
      const b = t.getBoundingClientRect();
      return [{ x: b.left + 4, y: b.top + b.height / 2 },
              { x: b.left + 4, y: b.bottom + 8 }]; }`;
    const [ink, ground] = await capture(page, '#subject', 'podcast-title-contrast', probe);
    // Antialiased glyph edges rarely hit full ink, so this is a floor on "can a
    // human read it", not a WCAG certification of the text colour.
    expect(contrast(ink, ground)).toBeGreaterThan(1.6);
  });
});
