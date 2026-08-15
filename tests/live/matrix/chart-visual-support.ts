/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared harness for the DATAVIZ visual matrices
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The table's `matrix-harness.ts` is the reference implementation of this tier
 * and stays the reference: read its header for the two-layer design and for why
 * layer 1 is affordable at hundreds of combos while layer 2 is not.
 *
 * This module is the same idea generalised over the SVG chart family — funnel,
 * treemap, sankey, candlestick, network-graph, org-chart, gantt, map, flow,
 * book. Those components share a shape the table does not: a host that owns a
 * viewBox'd `<svg>` (or an absolutely-positioned overlay layer) inside which N
 * marks are laid out by the component's own arithmetic. What a browser can
 * prove about them, and happy-dom cannot, is always the same four things:
 *
 *   · GEOMETRY   — the host, the chart surface and every mark have non-zero
 *                  boxes, and every mark is inside the chart surface. In
 *                  happy-dom every one of those boxes reads 0x0, so the DOM
 *                  matrix cannot tell a laid-out chart from a collapsed one.
 *   · OCCLUSION  — `shadowRoot.elementFromPoint` at a mark's own centre must
 *                  land on that mark (or inside it). This is the check with no
 *                  unit-test equivalent: it is how a mark painted underneath a
 *                  sibling, a tooltip left visible over the canvas, or a label
 *                  layer that swallows every click gets caught.
 *   · STYLE      — marks are actually visible: non-`none` display, non-zero
 *                  opacity, a fill that is not fully transparent; text is big
 *                  enough to read.
 *   · SEPARATION — marks that represent different data do not sit exactly on
 *                  top of each other. A layout bug that stacks every node at
 *                  0,0 produces a perfectly valid DOM and a blank-looking
 *                  chart; only boxes catch it.
 *
 * Each component supplies a fixture page exposing `window.matrix.mount(combo)`
 * (same contract as the table fixture) and a `ChartProbe` describing where its
 * marks live. Everything else is shared, which is what makes ten visual
 * matrices affordable.
 *
 * Layer 2 (real screenshots) stays tiny and per-component; see `pixel-probe.ts`
 * for the capture plumbing, which this module deliberately does not wrap.
 */
import { expect, type Browser, type Page } from '@playwright/test';

/** The element every fixture mounts its subject as. */
export const SUBJECT_ID = 'subject';

export interface ChartProbe {
  /**
   * Shadow-root selector for the chart surface — the `<svg>` or the positioned
   * layer the marks live in. Must have a non-zero box, and every mark must sit
   * inside it.
   */
  surface: string;
  /** Shadow-root selector for the marks: the bars, slices, nodes, rows, cells. */
  marks: string;
  /** Minimum number of marks this combo must render. */
  minMarks?: number;
  /** Exact number of marks this combo must render, when the combo knows it. */
  marks_expected?: number;
  /**
   * Marks must not be pairwise coincident: no two may share the same top-left
   * corner (within a pixel). Off for components that deliberately stack marks
   * (a sankey link crossing a node, a map pin cluster).
   */
  requireDistinctPositions?: boolean;
  /**
   * Hit-test every mark's centre and require the hit to be the mark or a
   * descendant of it. Off for components whose marks are legitimately covered
   * by a full-surface overlay (a crosshair layer, a drag capture plane).
   */
  occlusion?: boolean;
  /** Shadow-root selector for text that must be legible when present. */
  text?: string;
  /** Additional shadow-root selectors that must exist with a non-zero box. */
  boxes?: string[];
  /** Shadow-root selectors that must NOT be visible in this combo. */
  hidden?: string[];
  /** Minimum readable font size in px for `text` nodes. */
  minFontPx?: number;
}

export interface MountResult {
  /** Anything the fixture wants the spec to know; components differ. */
  [key: string]: any;
}

/**
 * One page, reused by every combo in a spec file — the same economy the table
 * harness documents: mounting onto a settled page costs milliseconds where a
 * fresh `goto` costs two orders of magnitude more.
 */
export async function openChartStage(browser: Browser, fixture: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await loadStage(page, fixture);
  (page as any).__fixture = fixture;
  return page;
}

async function loadStage(page: Page, fixture: string): Promise<void> {
  await page.goto(fixture);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
}

/**
 * The Vite dev server can push a full reload at any moment (a component
 * rebuild, a websocket reconnect) and whichever combo is mid-evaluate dies with
 * "Execution context was destroyed". That is the harness's problem, not the
 * component's, so it is absorbed here exactly once. A second failure is real.
 */
export async function mount(page: Page, combo: any): Promise<MountResult> {
  try {
    return await page.evaluate(c => (window as any).matrix.mount(c), combo);
  } catch (error) {
    if (!isStageLost(error)) throw error;
    await loadStage(page, (page as any).__fixture);
    return page.evaluate(c => (window as any).matrix.mount(c), combo);
  }
}

function isStageLost(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Execution context was destroyed|window\.matrix is undefined|Cannot read properties of undefined \(reading 'mount'\)/
    .test(message);
}

/**
 * LAYER 1. Runs entirely inside ONE `page.evaluate` and returns a list of
 * human-readable problems, so a failing combo reports everything wrong with it
 * at once rather than one thing per re-run. Assert `toEqual([])`.
 */
export async function collectChartProblems(page: Page, probe: ChartProbe): Promise<string[]> {
  return page.evaluate((probe) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    /** Sub-pixel rounding, borders, fractional device pixel ratio. */
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('no subject mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('subject has no shadow root'); return problems; }

    const box = (el: Element) => el.getBoundingClientRect();
    const hostBox = box(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const hostCs = getComputedStyle(host);
    if (hostCs.display === 'none') say('host computed display is none');
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    const surface = sr.querySelector(probe.surface) as Element | null;
    if (!surface) { say(`no chart surface "${probe.surface}"`); return problems; }
    const surfaceBox = box(surface);
    if (surfaceBox.width <= 0 || surfaceBox.height <= 0) {
      say(`surface "${probe.surface}" renders at ${surfaceBox.width}x${surfaceBox.height}`);
      return problems;
    }

    for (const selector of probe.boxes ?? []) {
      const el = sr.querySelector(selector);
      if (!el) { say(`missing required element "${selector}"`); continue; }
      const b = box(el);
      if (b.width <= 0 || b.height <= 0) say(`"${selector}" renders at ${b.width}x${b.height}`);
    }

    for (const selector of probe.hidden ?? []) {
      const el = sr.querySelector(selector) as HTMLElement | null;
      if (!el) continue;
      const cs = getComputedStyle(el);
      const b = box(el);
      const invisible = cs.display === 'none' || cs.visibility === 'hidden'
        || Number(cs.opacity) === 0 || b.width === 0 || b.height === 0;
      if (!invisible) say(`"${selector}" should not be visible in this combo`);
    }

    const marks = [...sr.querySelectorAll(probe.marks)] as Element[];
    if (probe.marks_expected !== undefined && marks.length !== probe.marks_expected) {
      say(`${marks.length} marks "${probe.marks}", expected ${probe.marks_expected}`);
    }
    if (probe.minMarks !== undefined && marks.length < probe.minMarks) {
      say(`${marks.length} marks "${probe.marks}", expected at least ${probe.minMarks}`);
    }
    if (marks.length === 0) return problems;

    const boxes = marks.map(box);

    marks.forEach((mark, i) => {
      const b = boxes[i];
      if (b.width <= 0 || b.height <= 0) {
        say(`mark ${i} renders at ${b.width}x${b.height}`);
        return;
      }
      // Inside the surface it belongs to. A mark laid out past the chart's own
      // edge is a mark the user cannot see, however correct its DOM is.
      if (b.left < surfaceBox.left - EPS || b.right > surfaceBox.right + EPS
        || b.top < surfaceBox.top - EPS || b.bottom > surfaceBox.bottom + EPS) {
        say(`mark ${i} [${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}]`
          + ` escapes the surface [${Math.round(surfaceBox.left)},${Math.round(surfaceBox.top)}`
          + ` ${Math.round(surfaceBox.width)}x${Math.round(surfaceBox.height)}]`);
      }

      const cs = getComputedStyle(mark);
      if (cs.display === 'none') say(`mark ${i} display none`);
      if (cs.visibility === 'hidden') say(`mark ${i} visibility hidden`);
      if (Number(cs.opacity) === 0) say(`mark ${i} opacity 0`);
      // A mark painted in fully transparent ink is a mark that is not there.
      const fill = cs.fill || '';
      if (/rgba\([^)]*,\s*0\s*\)$/.test(fill)) say(`mark ${i} fill "${fill}" is fully transparent`);
    });

    if (probe.requireDistinctPositions) {
      const seen = new Map<string, number>();
      boxes.forEach((b, i) => {
        const key = `${Math.round(b.left)},${Math.round(b.top)}`;
        if (seen.has(key)) say(`marks ${seen.get(key)} and ${i} are coincident at ${key}`);
        else seen.set(key, i);
      });
    }

    if (probe.occlusion) {
      // `shadowRoot.elementFromPoint`, not `document`'s: the document's answer
      // for shadow content is the HOST, which would make this check vacuous.
      const root = sr as unknown as { elementFromPoint(x: number, y: number): Element | null };
      marks.forEach((mark, i) => {
        const b = boxes[i];
        if (b.width <= 0 || b.height <= 0) return;
        const x = b.left + b.width / 2;
        const y = b.top + b.height / 2;
        // Off-viewport marks cannot be hit-tested; that is a scroll position
        // problem, not an occlusion one.
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return;
        const hit = root.elementFromPoint(x, y);
        if (!hit) { say(`mark ${i}: nothing hit-tests at its centre`); return; }
        if (hit !== mark && !mark.contains(hit) && !hit.contains(mark)) {
          say(`mark ${i} is occluded at its centre by <${hit.tagName.toLowerCase()}`
            + `${hit.className && typeof hit.className === 'string' ? ` class="${hit.className}"` : ''}>`);
        }
      });
    }

    if (probe.text) {
      const minFont = probe.minFontPx ?? 8;
      const texts = [...sr.querySelectorAll(probe.text)] as Element[];
      texts.forEach((node, i) => {
        const content = (node.textContent ?? '').trim();
        if (!content) return; // an empty label is a data question, not a paint one
        const cs = getComputedStyle(node);
        if (Number(cs.opacity) === 0) say(`text ${i} ("${content}") is fully transparent`);
        if (cs.visibility === 'hidden') say(`text ${i} ("${content}") is visibility:hidden`);
        const size = parseFloat(cs.fontSize);
        if (Number.isFinite(size) && size < minFont) {
          say(`text ${i} ("${content}") renders at ${cs.fontSize}, below ${minFont}px`);
        }
      });
    }

    return problems;
  }, probe as any);
}

/** Convenience: mount a combo and assert it has no layer-1 problems. */
export async function checkChartCombo(page: Page, combo: any, probe: ChartProbe): Promise<void> {
  await mount(page, combo);
  expect(await collectChartProblems(page, probe), combo.id ?? JSON.stringify(combo)).toEqual([]);
}
