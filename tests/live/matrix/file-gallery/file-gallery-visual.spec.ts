/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-file-gallery TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/file-gallery, `npm run test:matrix`) owns model
 * truth: which files are in `files`, which status class each tile carries,
 * which actions the `allow-*` switches render, what the intake limits admit,
 * and every event on the documented upload channel. It cannot own any of the
 * following, because happy-dom performs no layout and resolves no cascade.
 *
 * ── Layer 1 (every combo): geometry, computed style, occlusion ──────────────
 *   · `view="grid"` really lays several tiles per row at a known width, and
 *     each tile stacks its preview ABOVE its info; `view="list"` really gives
 *     every file a full-width row of its own, with the preview BESIDE the info.
 *     Both are `display: grid` with one class between them, so the DOM tier can
 *     only see the class — the arrangement is a browser fact;
 *   · the three documented parts nest and stack: `gallery` inside `base`, and
 *     `dropzone`, when shown, above the gallery rather than on top of it;
 *   · tiles never overlap and never escape the gallery;
 *   · the documented upload statuses resolve to the theme colours their CSS
 *     names — `uploading` to primary, `completed` to success, `error` to
 *     danger — which is a `var()` chain the DOM tier cannot follow;
 *   · the progress bar's painted width really tracks the reported percentage;
 *   · every action button is a real 2rem target a pointer can actually reach —
 *     a delete button behind its own tile is a delete button nobody can click;
 *   · `disabled` really removes the dropzone as a target.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Three. Status is the gallery's entire feedback vocabulary, and "the border
 *   colour computed to the danger token" is a different claim from "the tile
 *   painted red". Likewise a progress bar is two boxes of the same size until
 *   the pixels say one is filled, and the dropzone's dashed border is the one
 *   affordance telling a user they may drop.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/file-gallery/matrix.html';

type View = 'grid' | 'list';
type Status = 'none' | 'pending' | 'uploading' | 'paused' | 'completed' | 'error';

interface Combo {
  id: string;
  view: View;
  files: number;
  status: Status;
  showDropzone?: boolean;
  showHeader?: boolean;
  showAddButton?: boolean;
  showProgress?: boolean;
  allowPause?: boolean;
  allowDelete?: boolean;
  disabled?: boolean;
}

const VIEWS: View[] = ['grid', 'list'];

function combo(over: Partial<Combo> & { id: string; view: View }): Combo {
  return { files: 3, status: 'pending', ...over };
}

/**
 * 30 combos, sized to the component. The gallery's visual surface has exactly
 * three independent axes — the LAYOUT (`view` × how many tiles), the CHROME
 * (the six show-/allow- switches), and the STATE each tile is resting in — and
 * every one of them is crossed with `view`, because `view` is the only switch
 * that changes the geometry of everything else.
 */
const COMBOS: Combo[] = [
  // ── Layout: how the tiles pack at a known stage width ────────────────────
  ...VIEWS.flatMap(view => [0, 1, 3, 7].map(files =>
    combo({ id: `${view}/${files} files`, view, files, status: files ? 'pending' : 'none' }))),

  // ── Chrome: each documented switch, in both views ─────────────────────────
  ...VIEWS.flatMap(view => [
    combo({ id: `${view}/no dropzone`, view, showDropzone: false }),
    combo({ id: `${view}/no header`, view, showHeader: false }),
    combo({ id: `${view}/add button`, view, showAddButton: true }),
    combo({ id: `${view}/add button, no dropzone`, view, showAddButton: true, showDropzone: false }),
    combo({ id: `${view}/no delete`, view, allowDelete: false }),
    combo({ id: `${view}/disabled`, view, disabled: true }),
  ]),

  // ── State: every documented upload status, in both views ──────────────────
  ...VIEWS.flatMap(view => (['uploading', 'paused', 'completed', 'error'] as Status[]).map(status =>
    combo({ id: `${view}/${status}`, view, files: 2, status }))),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  // Taller than the config default on purpose. Several claims below are
  // hit-tests, and `elementFromPoint` answers `null` for anything below the
  // fold — a seven-file LIST is over a thousand pixels of stacked rows, so a
  // 900px viewport would silently stop checking the last tiles' buttons rather
  // than checking them and finding them reachable.
  page = await browser.newPage({ viewport: { width: 1280, height: 1500 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(0);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const named = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const base = named('base')[0];
    const gallery = named('gallery')[0];
    const dropzone = named('dropzone')[0];
    if (!base) { say('no part="base" painted'); return problems; }
    if (!gallery) { say('no part="gallery" painted'); return problems; }

    const baseBox = rect(base);
    const galleryBox = rect(gallery);
    if (baseBox.width <= 0) { say(`part="base" renders ${baseBox.width}px wide`); return problems; }

    // The parts nest as documented: `base` is the outer container, `gallery`
    // the thumbnails area inside it.
    if (galleryBox.left < baseBox.left - EPS || galleryBox.right > baseBox.right + EPS) {
      say('part="gallery" is wider than part="base"');
    }

    // ── The dropzone: present or absent, and never ON TOP of the gallery ─────
    if (combo.showDropzone === false) {
      if (dropzone) say('show-dropzone="false" but a dropzone is painted');
    } else if (!dropzone) {
      say('no part="dropzone" painted');
    } else {
      const dz = rect(dropzone);
      if (dz.width <= 0 || dz.height <= 0) say(`dropzone renders at ${dz.width}x${dz.height}`);
      if (dz.bottom > galleryBox.top + EPS && galleryBox.height > 0) {
        say(`dropzone (bottom ${round(dz.bottom)}) overlaps the gallery`
          + ` (top ${round(galleryBox.top)}) instead of stacking above it`);
      }
      // "Drag-and-drop upload zone" — the affordance is a dashed boundary; a
      // zone with no border is indistinguishable from empty page.
      const dzStyle = getComputedStyle(dropzone);
      if (dzStyle.borderTopStyle === 'none' || parseFloat(dzStyle.borderTopWidth) <= 0) {
        say('the dropzone paints no border');
      }
      // A disabled gallery must not accept a click on its dropzone.
      const centre = document.elementFromPoint(dz.left + dz.width / 2, dz.top + dz.height / 2);
      const reachable = centre === host;
      if (combo.disabled) {
        if (dzStyle.cursor === 'pointer') say('a disabled dropzone still shows the pointer cursor');
        if (Number(dzStyle.opacity) >= 1) say('a disabled dropzone is painted at full opacity');
      } else if (!reachable) {
        say(`the dropzone centre hit-tests to`
          + ` <${centre?.tagName.toLowerCase() ?? 'nothing'}>, not the gallery`);
      }
    }

    // ── The header ───────────────────────────────────────────────────────────
    const header = sr.querySelector('.gallery-header') as HTMLElement | null;
    if (combo.showHeader === false) {
      if (header) say('show-header="false" but a header is painted');
    } else if (!header) {
      say('no header painted');
    } else if (rect(header).height <= 0 && combo.files > 0) {
      say('the header renders with no height');
    }

    // ── The tiles ────────────────────────────────────────────────────────────
    const tiles = [...sr.querySelectorAll('.gallery-item[data-file-id]')] as HTMLElement[];
    if (tiles.length !== combo.files) {
      say(`${tiles.length} tiles painted, expected ${combo.files}`);
    }

    const boxes: DOMRect[] = [];
    tiles.forEach((tile, i) => {
      const r = rect(tile);
      if (r.width <= 0 || r.height <= 0) { say(`tile ${i} renders at ${r.width}x${r.height}`); return; }
      if (r.left < galleryBox.left - EPS || r.right > galleryBox.right + EPS
        || r.top < galleryBox.top - EPS || r.bottom > galleryBox.bottom + EPS) {
        say(`tile ${i} escapes part="gallery"`);
      }
      boxes.push(r);

      // ── view: the ARRANGEMENT inside a tile, not just its class ────────────
      //
      // Grid tiles are `flex-direction: column` — the preview sits above the
      // info. List tiles are `flex-direction: row` — the preview sits beside
      // it, at a fixed 6rem. This is the whole difference between the views and
      // the DOM tier cannot see any of it.
      const preview = tile.querySelector('.gallery-item-preview') as HTMLElement | null;
      const info = tile.querySelector('.gallery-item-info') as HTMLElement | null;
      if (!preview || !info) { say(`tile ${i} is missing its preview or info region`); return; }
      const p = rect(preview);
      const inf = rect(info);
      if (combo.view === 'grid') {
        if (p.bottom > inf.top + EPS) {
          say(`grid tile ${i} does not stack its preview above its info`
            + ` (preview bottom ${round(p.bottom)}, info top ${round(inf.top)})`);
        }
        // `aspect-ratio: 1` on the preview: a square thumbnail.
        if (Math.abs(p.width - p.height) > 2) {
          say(`grid tile ${i} preview is ${round(p.width)}x${round(p.height)}, not square`);
        }
      } else {
        if (p.right > inf.left + EPS) {
          say(`list tile ${i} does not put its preview beside its info`
            + ` (preview right ${round(p.right)}, info left ${round(inf.left)})`);
        }
        if (r.width < galleryBox.width - EPS) {
          say(`list tile ${i} is ${round(r.width)}px wide in a`
            + ` ${round(galleryBox.width)}px gallery — the list view is not one column`);
        }
      }

      // ── The action buttons are real, reachable targets ─────────────────────
      const actions = [...tile.querySelectorAll('.gallery-item-action')] as HTMLElement[];
      actions.forEach((action) => {
        const a = rect(action);
        const what = action.getAttribute('data-action');
        if (a.width < 20 || a.height < 20) {
          say(`tile ${i} "${what}" action is only ${round(a.width)}x${round(a.height)}`);
        }
        if (a.left < r.left - EPS || a.right > r.right + EPS
          || a.top < r.top - EPS || a.bottom > r.bottom + EPS) {
          say(`tile ${i} "${what}" action escapes its tile`);
        }
        const hit = (sr as any).elementFromPoint(
          a.left + a.width / 2, a.top + a.height / 2) as Element | null;
        if (hit !== action && !action.contains(hit as Node)) {
          say(`tile ${i} "${what}" action is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      });
    });

    // Tiles never overlap. In grid this also proves the auto-fill columns
    // really packed; in list it proves the single column really stacked.
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlaps = a.left < b.right - EPS && b.left < a.right - EPS
          && a.top < b.bottom - EPS && b.top < a.bottom - EPS;
        if (overlaps) say(`tile ${i} and tile ${j} overlap`);
      }
    }

    // ── view, at the gallery level ───────────────────────────────────────────
    if (boxes.length >= 2) {
      const sameRow = boxes.filter(b => Math.abs(b.top - boxes[0].top) < EPS).length;
      if (combo.view === 'grid' && sameRow < 2) {
        say(`grid view put ${sameRow} tile(s) on the first row of an`
          + ` ${round(galleryBox.width)}px gallery — no auto-fill columns formed`);
      }
      if (combo.view === 'list' && sameRow !== 1) {
        say(`list view put ${sameRow} tiles on one row`);
      }
    }

    // ── The add tile ─────────────────────────────────────────────────────────
    const addTiles = [...sr.querySelectorAll('.gallery-item--add-button')] as HTMLElement[];
    if (combo.showAddButton) {
      if (addTiles.length !== 1) say(`${addTiles.length} add tiles, expected 1`);
      else {
        const a = rect(addTiles[0]);
        if (a.width <= 0 || a.height <= 0) say(`the add tile renders at ${a.width}x${a.height}`);
        // "Add files" is an invitation, and the CSS says so with a dashed edge.
        if (getComputedStyle(addTiles[0]).borderTopStyle !== 'dashed') {
          say('the add tile does not paint a dashed border');
        }
      }
    } else if (addTiles.length) {
      say(`${addTiles.length} add tiles painted without show-add-button`);
    }

    // ── STATUS: the documented statuses resolve to the theme's own colours ───
    //
    // The CSS names `--snice-color-primary` / `-success` / `-danger`; those are
    // the same tokens the rest of the system uses for "in flight", "done" and
    // "failed", and a status border that resolves to something else is a
    // status the user reads wrong. Resolved here from the theme rather than
    // hardcoded, so a retuned palette does not fail this suite.
    const tokenColour = (name: string) => {
      const probe = document.createElement('div');
      probe.style.color = `var(${name})`;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const EXPECTED_BORDER: Record<string, string | null> = {
      uploading: '--snice-color-primary',
      completed: '--snice-color-success',
      error: '--snice-color-danger',
      paused: null,   // documented status, no colour of its own
      pending: null,
    };
    const wantToken = EXPECTED_BORDER[combo.status] ?? null;
    if (wantToken && tiles.length) {
      const want = tokenColour(wantToken);
      tiles.forEach((tile, i) => {
        if (!tile.classList.contains(`gallery-item--${combo.status}`)) {
          say(`tile ${i} does not carry the "${combo.status}" status class`);
          return;
        }
        const got = getComputedStyle(tile).borderTopColor;
        if (got !== want) {
          say(`tile ${i} at status "${combo.status}" paints a ${got} border,`
            + ` expected ${wantToken} (${want})`);
        }
      });
    }

    // ── The progress readout ─────────────────────────────────────────────────
    if (combo.status === 'uploading' && combo.showProgress !== false) {
      tiles.forEach((tile, i) => {
        const track = tile.querySelector('.gallery-item-progress') as HTMLElement | null;
        const fill = tile.querySelector('.gallery-item-progress-bar') as HTMLElement | null;
        if (!track || !fill) { say(`tile ${i} paints no progress bar while uploading`); return; }
        const t = rect(track);
        const f = rect(fill);
        if (t.width <= 0 || t.height <= 0) say(`tile ${i} progress track is ${t.width}x${t.height}`);
        if (f.width > t.width + EPS) say(`tile ${i} progress fill overflows its track`);
        // The responder reported 45%; the painted fill must agree within a
        // pixel of the track's own width. A bar that ignores its percentage is
        // the classic "always full" progress bug.
        const percent = Number(tile.querySelector('.gallery-item-progress-text')?.textContent
          ?.replace('%', '').trim() ?? '0');
        const wantWidth = t.width * percent / 100;
        if (Math.abs(f.width - wantWidth) > 2) {
          say(`tile ${i} shows ${percent}% but paints ${round(f.width)}px of a`
            + ` ${round(t.width)}px track (expected ${round(wantWidth)}px)`);
        }
      });
    }

    return problems;
  }, combo as any);
}

test.describe('file-gallery visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.files, `file count for ${combo.id}`).toBe(combo.files);
      if (combo.status !== 'none' && combo.files > 0) {
        expect(new Set(mounted.statuses), `resting status for ${combo.id}`)
          .toEqual(new Set([combo.status]));
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('file-gallery visual matrix: cross-combo geometry', () => {
  test('the grid packs more tiles per row than the list at the same width', async () => {
    const rowCount = async (view: View) => {
      await page.evaluate(v => (window as any).matrix.mount({ view: v, files: 6 }), view);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const tiles = [...sr.querySelectorAll('.gallery-item[data-file-id]')];
        const tops = new Set(tiles.map(t => Math.round(t.getBoundingClientRect().top)));
        return { rows: tops.size, tiles: tiles.length };
      });
    };
    const grid = await rowCount('grid');
    const list = await rowCount('list');
    expect(list.rows, 'the list view did not give each of 6 files its own row').toBe(6);
    expect(grid.rows, `the grid view spread 6 tiles over ${grid.rows} rows —`
      + ' the same as a list').toBeLessThan(list.rows);
  });

  test('deleting a tile through its painted button reflows the rest', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ view: 'grid', files: 4 }));
    const before = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return [...sr.querySelectorAll('.gallery-item[data-file-id]')]
        .map(t => t.getBoundingClientRect().left);
    });
    const after = await page.evaluate(() => (window as any).matrix.act(0, 'delete'));
    expect(after.files, 'the delete button did not remove a file').toBe(3);
    const positions = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return [...sr.querySelectorAll('.gallery-item[data-file-id]')]
        .map(t => t.getBoundingClientRect().left);
    });
    expect(positions.length, 'a tile was removed from the model but not from the layout').toBe(3);
    expect(positions[0], 'the surviving tiles did not shift left into the gap')
      .toBeCloseTo(before[0], 0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('file-gallery visual matrix: marquee pixels', () => {
  test('the upload statuses paint three different tile borders', async () => {
    // Computed style already told us each border resolved to its token. This
    // asks the harder question: did the browser PAINT three distinguishable
    // edges? A 1px border under a rounded corner is exactly the kind of thing
    // that resolves correctly and then paints as nothing.
    const borderPixel = async (status: string) => {
      await page.evaluate(s => (window as any).matrix.mount({
        view: 'list', files: 1, status: s,
      }), status);
      const [pixel] = await capture(
        page, '#stage', `file-gallery-border-${status}`,
        `() => {
          const sr = document.getElementById('subject').shadowRoot;
          const tile = sr.querySelector('.gallery-item[data-file-id]');
          const box = tile.getBoundingClientRect();
          // Mid-height on the left edge: past the corner radius, on the border.
          return [{ x: box.x, y: box.y + box.height / 2 }];
        }`,
      );
      return pixel;
    };
    const uploading = await borderPixel('uploading');
    const completed = await borderPixel('completed');
    const error = await borderPixel('error');
    const painted = { uploading, completed, error };
    for (const [a, b] of [['uploading', 'completed'], ['completed', 'error'], ['uploading', 'error']]) {
      expect(sameColor((painted as any)[a], (painted as any)[b]),
        `"${a}" and "${b}" both painted ${(painted as any)[a].join(',')} —`
        + ' the two statuses are indistinguishable').toBe(false);
    }
  });

  test('the progress bar paints a filled portion against its track', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      view: 'grid', files: 1, status: 'uploading',
    }));
    const [filled, empty] = await capture(
      page, '#stage', 'file-gallery-progress',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const track = sr.querySelector('.gallery-item-progress');
        const fill = sr.querySelector('.gallery-item-progress-bar');
        const t = track.getBoundingClientRect();
        const f = fill.getBoundingClientRect();
        const y = t.y + t.height / 2;
        return [
          { x: f.x + Math.max(2, f.width / 2), y },     // inside the filled run
          { x: t.right - 4, y },                         // past it, on the track
        ];
      }`,
    );
    expect(sameColor(filled, empty),
      `the filled and empty halves of the progress bar both painted`
      + ` ${filled.join(',')}`).toBe(false);
    expect(contrast(filled, empty),
      `filled-vs-track contrast is only ${contrast(filled, empty).toFixed(2)}:1`)
      .toBeGreaterThan(1.3);
  });

  test('the dropzone paints a dashed edge, not a solid one', async () => {
    // "Drag-and-drop upload zone": the dashes ARE the affordance. A dashed
    // border and a solid one have identical computed widths and colours; only
    // a scan along the edge can tell them apart, because a dashed edge
    // alternates ink and ground while a solid one does not.
    await page.evaluate(() => (window as any).matrix.mount({ view: 'grid', files: 0 }));
    const pixels = await capture(
      page, '#stage', 'file-gallery-dropzone',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const dz = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('dropzone'));
        const box = dz.getBoundingClientRect();
        // Step along the top border, one pixel inside it, across a span wide
        // enough to cross several dashes and several gaps.
        const y = box.y + 0.5;
        return Array.from({ length: 24 }, (_, i) => ({ x: box.x + 40 + i * 3, y }));
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `a 72px scan along the dropzone's top edge painted one flat colour`
      + ` (${[...distinct]}) — the border is solid, or absent`).toBeGreaterThan(1);
  });
});
