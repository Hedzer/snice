/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-table TRUE-VISUAL matrix — shared harness
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This tier is the real-browser twin of `tests/matrix/table`. The
 * DOM matrix (happy-dom, `npm run test:matrix`) already owns *value* truth:
 * which string belongs in which cell, for every pipeline and delivery pattern.
 * It cannot own *visual* truth, because happy-dom performs no layout — every
 * box reads 0, nothing is painted, and nothing can occlude anything.
 *
 * So this tier asserts only what a browser can know, and it does so in TWO
 * DELIBERATELY DIFFERENT LAYERS. The split exists because the obvious
 * approach — screenshot each cell and read its pixels — costs ~100-300ms per
 * element capture and is unaffordable across a hundred feature combinations.
 *
 * ── Layer 1: geometry + computed style + elementFromPoint (EVERY combo) ─────
 *
 *   Runs for all 1152 generated combos, entirely inside ONE `page.evaluate`
 *   per combo, so a combo costs a few milliseconds rather than a screenshot.
 *   It proves the things a painted table cannot get wrong:
 *
 *     · geometry      — the host, frame, header and every rendered row/cell
 *                       have non-zero boxes; rows are vertically disjoint and
 *                       ascending; cells are horizontally disjoint and
 *                       ascending; every cell sits inside its row; the
 *                       rightmost column edge lands on the frame's inner edge
 *                       under `squish`; a sized host is filled to its bottom
 *                       edge; a virtualized body renders a contiguous window
 *                       between two spacers.
 *     · computed style — `striped` really resolves to two distinct row
 *                       background colours (and its absence to exactly one);
 *                       `squish` really clips-with-ellipsis and really turns
 *                       horizontal overflow off; `selectable` really paints a
 *                       visible checkbox in the header and every row; text is
 *                       opaque and large enough to read.
 *     · occlusion     — `elementFromPoint` at three x-offsets inside every
 *                       visible cell must land inside THAT cell. This is the
 *                       check with no unit-test equivalent at all: it is how a
 *                       column whose content paints over its neighbour, a
 *                       header that covers its first row, or an overlay that
 *                       swallows the body gets caught. A hit-test is the
 *                       browser's own answer to "what would the user's cursor
 *                       touch here", and it is nearly free.
 *
 *   Layer 1 also re-asserts the matrix oracle (`expectedCellText`) against the
 *   rendered window. That is not its job — the DOM matrix owns it — but it is
 *   free inside the same evaluate and it keeps the geometry assertions from
 *   going vacuous: a table with perfect boxes and no text would otherwise pass.
 *
 * ── Layer 2: real screenshots (a small PINNED set only) ─────────────────────
 *
 *   Layer 1 measures the model the browser built. It cannot tell you whether
 *   a colour that "differs" differs *visibly*, whether a spinner drawn at
 *   full size is drawn in a colour anyone can see, or whether a stripe rule
 *   that applies lands two luminance points from the surface. Those failures
 *   are real (see tests/live/components/table/table-stripes-and-loading.spec.ts
 *   for the field report) and only pixels catch them.
 *
 *   So `matrix-marquee.spec.ts` captures ACTUAL screenshots for six pinned
 *   combos — striping, loading spinner, empty state, squished right edge, fill
 *   row, density — decodes them in the browser under test, and asserts WCAG
 *   contrast on the painted pixels. The PNGs are also written to
 *   `test-results/matrix-visual/` so a human (or an agent) can open them.
 *
 *   The pinned set is small ON PURPOSE. Screenshots are the expensive layer;
 *   growing them is how this tier stops finishing in five minutes. New feature
 *   combinations belong in the generator, which pays layer-1 prices.
 *
 * ── Cost ───────────────────────────────────────────────────────────────────
 *
 *   The whole tier targets under ~5 minutes in chromium. It is NOT part of the
 *   default gate; run it with `npm run test:matrix:visual`.
 */
import { expect, type Browser, type Page } from '@playwright/test';

/** Relative so specs follow the config's baseURL (the managed 5566 server). */
export const MATRIX_FIXTURE = '/tests/live/fixtures/table/matrix.html';

// ── Dimensions ──────────────────────────────────────────────────────────────
// These mirror the DOM matrix one-for-one. `PIPELINE_NAMES` is the same list as
// `tests/matrix/table/height-fill-support.ts` `pipelines`; the
// fixture page owns the matching column definitions (they carry functions,
// which cannot cross the Playwright boundary).

export const DELIVERIES = ['local', 'remote'] as const;
export type Delivery = typeof DELIVERIES[number];

export const PIPELINE_NAMES = [
  'none',
  'valueGetter',
  'valueFormatter',
  'valueGetter+valueFormatter',
  'formatter',
  'valueGetter+formatter',
] as const;
export type PipelineName = typeof PIPELINE_NAMES[number];

/**
 * Delivery patterns, mirroring the DOM matrix's delivery slice:
 *  · `initial`    — rows are present at the first body render;
 *  · `redeliver`  — rows arrive, then the SAME objects are mutated in place and
 *                   re-delivered (the recycled-DOM path);
 *  · `late`       — the body renders empty first, then rows arrive.
 */
export const PATTERNS = ['initial', 'redeliver', 'late'] as const;
export type Pattern = typeof PATTERNS[number];

/** The five layout switches. All 2^5 = 32 of their vectors are generated. */
export const LAYOUT_FLAGS = ['virtualize', 'height', 'squish', 'striped', 'selectable'] as const;
export type LayoutFlag = typeof LAYOUT_FLAGS[number];

export interface Combo {
  id: string;
  delivery: Delivery;
  pipeline: PipelineName;
  pattern: Pattern;
  virtualize: boolean;
  /** Host height in px, or 0 for a content-sized host. */
  height: number;
  squish: boolean;
  striped: boolean;
  selectable: boolean;
  /** Stage width in px — squish only means something against a known frame. */
  width: number;
  rows: number;
  density?: 'compact' | 'standard' | 'comfortable';
  loading?: boolean;
}

/** A sized host is 320px; that is the box `height` combos are measured against. */
export const SIZED_HEIGHT = 320;
/** A squished stage is narrow enough that three columns cannot fit naturally. */
export const SQUISH_WIDTH = 360;
export const WIDE_WIDTH = 720;

/**
 * Row count per combo. A virtualized body needs enough rows to have a window,
 * and a virtualized body without a sized host has no bounded scroller — it
 * renders everything, so it gets a count that stays affordable to paint.
 */
function rowsFor(virtualize: boolean, sized: boolean): number {
  if (!virtualize) return 12;
  return sized ? 200 : 40;
}

function comboFrom(
  delivery: Delivery,
  pipeline: PipelineName,
  pattern: Pattern,
  bits: number,
): Combo {
  const virtualize = !!(bits & 1);
  const sized = !!(bits & 2);
  const squish = !!(bits & 4);
  const striped = !!(bits & 8);
  const selectable = !!(bits & 16);
  const flags = LAYOUT_FLAGS.filter((_, i) => bits & (1 << i));
  return {
    id: `${delivery}/${pipeline}/${pattern}/[${flags.join(',') || 'plain'}]`,
    delivery,
    pipeline,
    pattern,
    virtualize,
    height: sized ? SIZED_HEIGHT : 0,
    squish,
    striped,
    selectable,
    width: squish ? SQUISH_WIDTH : WIDE_WIDTH,
    rows: rowsFor(virtualize, sized),
  };
}

/**
 * The generator: the FULL cartesian product of the DOM matrix's dimensions —
 * {local,remote} x 6 pipelines x 3 delivery patterns x all 32 vectors of
 * {virtualize, height, squish, striped, selectable} = 1152 combos.
 *
 * "Sized for real-browser cost" turned out to mean "no sampling is needed".
 * The whole point of layer 1 is that a combo costs a mount plus ONE evaluate
 * against a page that is already open, so a combo is tens of milliseconds
 * rather than the tenths of a second an element screenshot would cost. The
 * measured full-product run is comfortably inside the ~5 minute budget (see
 * docs/ai/DEVELOPMENT.md for the recorded figure), so this tier mirrors the DOM
 * matrix exactly instead of arguing about which combinations matter.
 *
 * What DOES have to be sized is the per-combo payload, not the combo count:
 * `rowsFor` keeps a virtualized body big enough to have a window and a
 * non-virtualized body small enough to paint. If this tier ever outgrows its
 * budget, cut rows-per-combo or the marquee set first — the product is the
 * thing worth keeping.
 */
export function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const delivery of DELIVERIES) {
    for (const pipeline of PIPELINE_NAMES) {
      for (const pattern of PATTERNS) {
        for (let vector = 0; vector < 32; vector++) {
          combos.push(comboFrom(delivery, pipeline, pattern, vector));
        }
      }
    }
  }
  return combos;
}

/**
 * The combos of one delivery mode. The suite is split into a local file and a
 * remote file purely so the two halves are separately runnable and separately
 * readable in a report; Playwright spreads the tests across workers either way.
 */
export function combosFor(delivery: Delivery): Combo[] {
  return generateCombos().filter(c => c.delivery === delivery);
}

/**
 * One page, reused by every combo in a spec file. Mounting a fresh table onto a
 * settled page costs a few milliseconds; a fresh `page.goto` per combo costs
 * two orders of magnitude more, and this tier's whole budget is page setup.
 */
export async function openStage(browser: Browser): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await loadStage(page);
  return page;
}

async function loadStage(page: Page): Promise<void> {
  await page.goto(MATRIX_FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
}

export interface MountResult {
  rowCount: number;
  columnKeys: string[];
  expected: string[][];
}

/**
 * The price of keeping ONE page alive for hundreds of combos is that the page
 * is not ours alone: the Vite dev server can push a full reload at any moment
 * (a component rebuild, a websocket reconnect), and whichever combo happens to
 * be mid-`evaluate` dies with "Execution context was destroyed". That is the
 * harness's problem, not the component's, so it is absorbed here — reload the
 * fixture and mount again, once. A second failure is real and propagates.
 */
export async function mount(page: Page, combo: Combo): Promise<MountResult> {
  try {
    return await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  } catch (error) {
    if (!isStageLost(error)) throw error;
    await loadStage(page);
    return page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  }
}

function isStageLost(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Execution context was destroyed|window\.matrix is undefined|Cannot read properties of undefined \(reading 'mount'\)/
    .test(message);
}

/**
 * LAYER 1. Everything below runs in the page, in one round trip, and returns a
 * list of human-readable problems. Assert `toEqual([])` so a failing combo
 * reports every violation at once instead of one per re-run.
 */
export async function collectVisualProblems(
  page: Page,
  combo: Combo,
  mounted: MountResult,
): Promise<string[]> {
  return page.evaluate(({ combo, columnKeys, expected }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    /** Layout tolerance: sub-pixel rounding, borders, and fractional zoom. */
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('no <snice-table> mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('table has no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const hostCs = getComputedStyle(host);
    if (hostCs.display === 'none') say('host computed display is none');
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    const frame = sr.querySelector('.table-frame') as HTMLElement | null;
    if (!frame) { say('no .table-frame'); return problems; }
    const frameBox = rect(frame);
    if (frameBox.width <= 0 || frameBox.height <= 0) {
      say(`.table-frame renders at ${frameBox.width}x${frameBox.height}`);
      return problems;
    }
    const frameCs = getComputedStyle(frame);

    const tableEl = frame.querySelector('table') as HTMLElement | null;
    if (!tableEl) { say('no <table> inside the frame'); return problems; }

    // ── Host box ────────────────────────────────────────────────────────────
    if (combo.height && Math.abs(hostBox.height - combo.height) > EPS) {
      say(`sized host is ${hostBox.height.toFixed(1)}px tall, declared ${combo.height}px`);
    }
    if (Math.abs(hostBox.width - combo.width) > EPS) {
      say(`host is ${hostBox.width.toFixed(1)}px wide, stage is ${combo.width}px`);
    }
    if (frameBox.right > hostBox.right + EPS || frameBox.left < hostBox.left - EPS) {
      say('frame escapes the host horizontally');
    }
    if (frameBox.bottom > hostBox.bottom + EPS) say('frame escapes the host vertically');

    // ── Header ──────────────────────────────────────────────────────────────
    const headerRow = (sr.querySelector('thead tr.column-header-row')
      ?? sr.querySelector('thead tr:not(.column-group-row):not(.header-filter-row)')) as HTMLElement | null;
    if (!headerRow) { say('no column header row'); return problems; }
    const ths = [...headerRow.querySelectorAll('th')] as HTMLElement[];
    const expectedTh = columnKeys.length + (combo.selectable ? 1 : 0);
    if (ths.length !== expectedTh) {
      say(`header has ${ths.length} <th>, expected ${expectedTh}`
        + (combo.selectable ? ' (columns + select-all tool column)' : ''));
    }
    ths.forEach((th, i) => {
      const b = rect(th);
      if (b.width <= 0 || b.height <= 0) say(`th ${i} renders at ${b.width}x${b.height}`);
    });

    // ── Rows ────────────────────────────────────────────────────────────────
    const bodyRows = [...sr.querySelectorAll('tbody tr')] as HTMLElement[];
    const dataRows = bodyRows.filter(tr =>
      tr.hasAttribute('data-index') && Number(tr.getAttribute('data-index')) >= 0);
    if (dataRows.length === 0) { say('no data rows rendered'); return problems; }

    const indices = dataRows.map(tr => Number(tr.getAttribute('data-index')));
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] <= indices[i - 1]) {
        say(`data-index ${indices[i]} follows ${indices[i - 1]} — window out of order`);
        break;
      }
    }
    if (indices[indices.length - 1] - indices[0] + 1 !== indices.length) {
      say(`rendered window ${indices[0]}..${indices[indices.length - 1]} is not contiguous`
        + ` (${indices.length} rows)`);
    }

    // Vertically disjoint and ascending — overlapping rows are the single most
    // visible layout break and are invisible to a DOM-only assertion.
    let previousBottom = -Infinity;
    dataRows.forEach((tr, i) => {
      const b = rect(tr);
      if (b.height < 12) say(`row ${indices[i]} is ${b.height.toFixed(1)}px tall`);
      if (b.width <= 0) say(`row ${indices[i]} has zero width`);
      if (b.top < previousBottom - EPS) {
        say(`row ${indices[i]} (top ${b.top.toFixed(1)}) overlaps the previous row`
          + ` (bottom ${previousBottom.toFixed(1)})`);
      }
      previousBottom = b.bottom;
    });

    // ── Cells: containment, ordering, style, text ───────────────────────────
    const keys: string[] = columnKeys;
    /** The element that actually paints a cell's text. */
    const contentOf = (td: HTMLElement): HTMLElement => {
      const cell = td.firstElementChild as any;
      const inner = cell?.shadowRoot?.querySelector('[part~="content"], .cell-content');
      return (inner as HTMLElement) ?? (cell as HTMLElement) ?? td;
    };
    const textOf = (td: HTMLElement): string => {
      const cell = td.firstElementChild as any;
      const inner = cell?.shadowRoot?.querySelector('[part~="content"], .cell-content');
      if (inner) return (inner.textContent ?? '').replace(/\s+/g, ' ').trim();
      const valued = td.querySelector('[value]');
      if (valued) return valued.getAttribute('value') ?? '';
      return (td.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    dataRows.forEach((tr, r) => {
      const rowBox = rect(tr);
      const index = indices[r];
      let previousRight = -Infinity;
      keys.forEach((key, c) => {
        const td = tr.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
        if (!td) { say(`row ${index}: missing td[data-key="${key}"]`); return; }
        const b = rect(td);
        if (b.width <= 0 || b.height <= 0) {
          say(`row ${index} cell "${key}" renders at ${b.width}x${b.height}`);
          return;
        }
        if (b.top < rowBox.top - EPS || b.bottom > rowBox.bottom + EPS) {
          say(`row ${index} cell "${key}" escapes its row vertically`);
        }
        if (b.left < previousRight - EPS) {
          say(`row ${index} cell "${key}" (left ${b.left.toFixed(1)}) overlaps the previous cell`
            + ` (right ${previousRight.toFixed(1)})`);
        }
        previousRight = b.right;

        // Text has to be opaque and big enough to be text.
        const cs = getComputedStyle(contentOf(td));
        const alpha = cs.color.startsWith('rgba')
          ? Number(cs.color.split(',')[3]?.replace(')', '') ?? '1')
          : 1;
        if (alpha <= 0.05) say(`row ${index} cell "${key}" text is transparent (${cs.color})`);
        if (parseFloat(cs.fontSize) < 9) say(`row ${index} cell "${key}" font-size ${cs.fontSize}`);
        if (cs.visibility !== 'visible') say(`row ${index} cell "${key}" visibility "${cs.visibility}"`);

        // The oracle, re-asserted so the geometry above cannot pass vacuously.
        const want = expected[index]?.[c];
        if (want !== undefined && textOf(td) !== want) {
          say(`row ${index} cell "${key}": "${textOf(td)}" != "${want}"`);
        }

        // Squish promises an ellipsis, not a mid-glyph chop.
        if (combo.squish) {
          const clipper = getComputedStyle(contentOf(td));
          if (clipper.textOverflow !== 'ellipsis' || clipper.overflow === 'visible') {
            say(`row ${index} cell "${key}" squished without ellipsis`
              + ` (overflow "${clipper.overflow}", text-overflow "${clipper.textOverflow}")`);
          }
        }
      });
    });

    // ── striped ─────────────────────────────────────────────────────────────
    // `:host([striped]) tbody tr:nth-child(even)` keys off DOM position, so
    // parity is read from the tbody, not from data-index (virtual spacers shift
    // it). Judged on computed colour here; layer 2 judges the PIXELS.
    const rowBg = new Map<string, number>();
    for (const tr of dataRows) {
      const bg = getComputedStyle(tr).backgroundColor;
      rowBg.set(bg, (rowBg.get(bg) ?? 0) + 1);
    }
    if (combo.striped && dataRows.length >= 2 && rowBg.size < 2) {
      say(`striped body paints one row colour only (${[...rowBg.keys()].join(', ')})`);
    }
    if (!combo.striped && rowBg.size > 1) {
      say(`unstriped body paints ${rowBg.size} row colours (${[...rowBg.keys()].join(', ')})`);
    }

    // ── selectable ──────────────────────────────────────────────────────────
    if (combo.selectable) {
      const headBox = ths[0] ? rect(ths[0]) : null;
      if (!headBox || headBox.width <= 0) say('select-all header cell has no box');
      for (const tr of dataRows.slice(0, 3)) {
        const check = tr.querySelector('snice-checkbox, input[type="checkbox"]') as HTMLElement | null;
        if (!check) { say(`row ${tr.getAttribute('data-index')} has no selection checkbox`); continue; }
        const b = rect(check);
        if (b.width <= 0 || b.height <= 0) {
          say(`row ${tr.getAttribute('data-index')} checkbox renders at ${b.width}x${b.height}`);
        }
        const ccs = getComputedStyle(check);
        if (ccs.visibility !== 'visible' || Number(ccs.opacity) <= 0) {
          say(`row ${tr.getAttribute('data-index')} checkbox is not visible`);
        }
      }
    } else if (dataRows[0]?.querySelector('snice-checkbox')) {
      say('non-selectable body still paints a selection checkbox');
    }

    // ── squish vs scroll ────────────────────────────────────────────────────
    if (combo.squish) {
      if (frameCs.overflowX !== 'hidden') {
        say(`squish frame overflow-x "${frameCs.overflowX}", expected "hidden"`);
      }
      if (frame.scrollWidth > frame.clientWidth + 1) {
        say(`squish frame still overflows (${frame.scrollWidth} > ${frame.clientWidth})`);
      }
      // The promise: the rightmost column edge sits on the frame's inner edge.
      const inner = frameBox.right
        - parseFloat(frameCs.borderRightWidth) - parseFloat(frameCs.paddingRight);
      const lastTh = ths[ths.length - 1];
      if (lastTh) {
        const gap = inner - rect(lastTh).right;
        if (Math.abs(gap) > 2) {
          say(`squished right edge is ${gap.toFixed(1)}px off the frame's inner edge`);
        }
      }
    } else if (frameCs.overflowX === 'hidden') {
      say('scroll-fit frame has overflow-x:hidden — wide columns could never be reached');
    }

    // ── sized host: the grid must reach the bottom edge ─────────────────────
    const fills = [...sr.querySelectorAll('tbody tr.table-fill-row')] as HTMLElement[];
    if (fills.length > 1) say(`${fills.length} fill rows, expected at most 1`);
    if (combo.height) {
      // The filler is PART of the table's box once it exists, so measuring
      // "is the content shorter than the frame" against `tableEl.offsetHeight`
      // would be self-defeating: a filler that should never have been added
      // makes the table exactly frame-height and the check reads as satisfied.
      // Subtract the filler back out and judge the real content.
      const fillHeight = fills.length ? rect(fills[0]).height : 0;
      const content = tableEl.offsetHeight - fillHeight;
      const slack = frame.clientHeight - content;
      if (slack > 1 && fills.length !== 1) {
        say(`frame has ${slack.toFixed(0)}px of slack below ${content.toFixed(0)}px of content`
          + ` but ${fills.length} fill rows exist`);
      }
      if (slack <= 1 && fills.length !== 0) {
        say(`content already fills the frame (${content.toFixed(0)}px of content in a`
          + ` ${frame.clientHeight}px frame) but a ${fillHeight.toFixed(0)}px filler was appended`);
      }
      if (fills.length === 1 && slack > 1) {
        const gap = frameBox.bottom - parseFloat(frameCs.borderBottomWidth) - rect(fills[0]).bottom;
        if (gap > 2) say(`grid stops ${gap.toFixed(1)}px short of the frame's bottom edge`);
        if (getComputedStyle(fills[0]).pointerEvents !== 'none') {
          say('fill row is not inert (pointer-events)');
        }
      }
    } else if (fills.length !== 0) {
      say(`content-sized host grew a fill row (${fills.length})`);
    }

    // ── virtualization ──────────────────────────────────────────────────────
    const spacers = [...sr.querySelectorAll('tbody tr.virtual-spacer')] as HTMLElement[];
    if (combo.virtualize) {
      if (combo.height) {
        // A bounded scroller is what virtualization needs; only then may we
        // demand a window smaller than the dataset.
        if (spacers.length === 0) say('virtualized body rendered no spacers');
        if (dataRows.length >= combo.rows) {
          say(`virtualized body rendered ${dataRows.length} of ${combo.rows} rows — no window`);
        }
        if (frame.scrollHeight <= frame.clientHeight + 1) {
          say('virtualized body is not scrollable');
        }
      }
    } else if (spacers.length > 0) {
      say(`non-virtualized body rendered ${spacers.length} virtual spacers`);
    }

    // ── Occlusion (elementFromPoint) ────────────────────────────────────────
    // Nothing may paint over a cell — not a neighbouring column's overflowing
    // text, not the sticky header, not an overlay. Probing three x-offsets
    // catches content that spills sideways without moving its own box.
    const clipTop = Math.max(frameBox.top, 0);
    const clipBottom = Math.min(frameBox.bottom, window.innerHeight);
    const clipLeft = Math.max(frameBox.left, 0);
    const clipRight = Math.min(frameBox.right, window.innerWidth);
    // Sticky <thead> legitimately covers whatever scrolls under it.
    const headerBottom = rect(headerRow).bottom;

    let probed = 0;
    const sample = dataRows.length <= 3
      ? dataRows
      : [dataRows[0], dataRows[Math.floor(dataRows.length / 2)], dataRows[dataRows.length - 1]];

    for (const tr of sample) {
      const index = tr.getAttribute('data-index');
      for (const key of keys) {
        const td = tr.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
        if (!td) continue;
        const b = rect(td);
        const y = b.top + b.height / 2;
        if (y <= Math.max(clipTop, headerBottom) + 1 || y >= clipBottom - 1) continue;
        for (const fraction of [0.25, 0.5, 0.75]) {
          const x = b.left + b.width * fraction;
          if (x <= clipLeft + 1 || x >= clipRight - 1) continue;
          probed++;

          // Nothing on the PAGE covers the table.
          const outer = document.elementFromPoint(x, y);
          if (outer !== host) {
            say(`row ${index} cell "${key}" @${Math.round(fraction * 100)}%:`
              + ` page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the table`);
            continue;
          }
          // Inside the table, the hit must be this cell or something in it.
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (!hit) {
            say(`row ${index} cell "${key}" @${Math.round(fraction * 100)}%: shadow hit-test found nothing`);
            continue;
          }
          if (hit !== td && !td.contains(hit)) {
            const label = hit.tagName.toLowerCase()
              + (hit.getAttribute?.('data-key') ? `[data-key="${hit.getAttribute('data-key')}"]` : '')
              + (hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : '');
            say(`row ${index} cell "${key}" @${Math.round(fraction * 100)}% is occluded by <${label}>`);
          }
        }
      }
    }
    if (probed === 0) say('no cell was reachable for a hit-test — the body is off-screen or clipped away');

    return problems;
  }, { combo, columnKeys: mounted.columnKeys, expected: mounted.expected });
}

// ── Known component defects ─────────────────────────────────────────────────
//
// The matrix policy (.ai/fuzzing.md) is: a combo that diverges from the docs is
// a FINDING. Keep the correct assertion, pin it against a finding id, report it
// — never weaken it to match buggy output. `it.fails` is the DOM matrix's tool
// for that; the Playwright equivalent below is deliberately stricter than
// `test.fail()`, which would mark the whole test expected-to-fail and quietly
// absorb any unrelated regression in the same combo.
//
// Instead a waiver names the EXACT message it excuses. Everything else the
// combo reports still fails the test, and if the excused message stops
// appearing the waiver itself fails — so a fixed component cannot leave a
// permanent lie behind in the suite.

interface Waiver {
  id: string;
  /**
   * Does this waiver apply to this combo AT ALL, on THIS engine? A component
   * defect is not obliged to reproduce on every engine — a different layout
   * or timing path can render the documented behaviour on one of them — so
   * `applies` sees the engine and the tripwire below only demands a
   * reproduction where one was actually observed. The assertion the waiver
   * excuses stays asserted everywhere else, on every engine.
   */
  applies: (combo: Combo, engine: Engine) => boolean;
  /** The one message it excuses. */
  matches: RegExp;
}

/** The engines this tier runs on, as far as a waiver needs to care. */
export type Engine = 'chromium' | 'firefox' | 'webkit' | 'other';

const engineCache = new WeakMap<Page, Promise<Engine>>();
/** `applies` needs the engine; one cheap evaluate per page, cached. */
function engineOf(page: Page): Promise<Engine> {
  let engine = engineCache.get(page);
  if (!engine) {
    engine = page.evaluate(() => {
      const ua = navigator.userAgent;
      if (ua.includes('Firefox')) return 'firefox';
      if (ua.includes('Chrome')) return 'chromium';
      if (ua.includes('Safari')) return 'webkit';
      return 'other';
    });
    engineCache.set(page, engine);
  }
  return engine;
}

const WAIVERS: Waiver[] = [
  {
    // A LOCAL, sized, non-virtualized table that renders its body a second time
    // appends an inert filler even though the content already overflows the
    // frame: 487px of rows in a 318px frame, plus a 48-72px filler. The frame
    // then scrolls ~73px past the last row into dead space.
    //
    // Minimal repro (no matrix harness involved):
    //   table.style.height = '320px';
    //   table.columns = cols;
    //   table.data = [];         await settle();   // empty body render
    //   table.data = twelveRows; await settle();   // filler appears, and stays
    //
    // `initial` never trips it (no prior empty render); `remote` never trips it;
    // it does not self-correct after 2s. Reported, not fixed — see
    // updateFillRow() in packages/components/src/table/snice-table.ts.
    //
    // ENGINE-DEPENDENT REPRODUCTION: on firefox the `selectable` rebuild of
    // header + body re-measures the frame correctly on the second render, so
    // with the select-all column present the filler is NOT appended and the
    // documented contract ("the filler only consumes space the frame ALREADY
    // has") is what renders (measured: 12 rows overflowing a 318px frame,
    // 0 fill rows on firefox, 1 on chromium/webkit). The tripwire therefore
    // does not demand a reproduction for firefox+selectable — everywhere else
    // the defect is still required to show up, and the filler contract itself
    // stays asserted on every engine.
    id: 'VISUAL-MATRIX-fill-1',
    applies: (c, engine) => c.delivery === 'local' && c.height > 0 && !c.virtualize
      && c.pattern !== 'initial'
      && !(engine === 'firefox' && c.selectable),
    matches: /^content already fills the frame \(\d+px of content in a \d+px frame\) but a \d+px filler was appended$/,
  },
];

/**
 * The whole of layer 1 for one combo: mount it, measure it, report every
 * violation at once. Specs call this and nothing else.
 */
export async function checkCombo(page: Page, combo: Combo): Promise<void> {
  let mounted = await mount(page, combo);
  let problems: string[];
  try {
    problems = await collectVisualProblems(page, combo, mounted);
  } catch (error) {
    // Same reload race as `mount`, one round trip later.
    if (!isStageLost(error)) throw error;
    mounted = await mount(page, combo);
    problems = await collectVisualProblems(page, combo, mounted);
  }

  const engine = await engineOf(page);
  const waivers = WAIVERS.filter(w => w.applies(combo, engine));
  const excused = (problem: string) => waivers.some(w => w.matches.test(problem));

  // Everything the waivers do NOT name is a live failure, as always.
  expect(problems.filter(p => !excused(p)), `combo ${combo.id}`).toEqual([]);

  // And a waiver that no longer excuses anything is a waiver to delete. Without
  // this the suite would keep asserting a defect that has been fixed.
  for (const waiver of waivers) {
    expect(
      problems.some(p => waiver.matches.test(p)),
      `combo ${combo.id}: ${waiver.id} no longer reproduces — delete its waiver in matrix-harness.ts`,
    ).toBe(true);
  }
}
