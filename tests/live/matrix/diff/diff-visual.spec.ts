/**
 * snice-diff TRUE-VISUAL matrix.
 *
 * The DOM matrix (`tests/matrix/diff/`, 108 combos) owns the pipeline: which
 * lines the LCS produces, how they group into hunks at each context width, and
 * which cells each row carries. It cannot own anything below, because happy-dom
 * performs no layout and resolves no colours:
 *
 *   · `mode="split"` is a claim about SIDE-BY-SIDE geometry. In happy-dom the
 *     two panes have identical 0x0 boxes; only a real engine can say whether
 *     they sit next to each other, share the viewport evenly, and stay inside
 *     `part="content"`.
 *   · `--diff-add-bg` / `--diff-remove-bg` are documented CSS custom
 *     properties. Whether an added row actually paints a different colour from
 *     a removed one — and from an unchanged one — is a computed-style fact.
 *   · "Dark mode via `[data-theme='dark']`" is invisible to the DOM tier
 *     entirely.
 *   · A long code line is the classic diff regression: it either scrolls inside
 *     its own column or it pushes the table wider than the container and the
 *     gutters drift off screen.
 *
 * LAYER 1 — geometry / occlusion / computed style over
 *   {2 modes} x {2 line-number states} x {2 marker states} = 8 combos, plus the
 *   measurements listed above.
 * LAYER 2 — one pinned screenshot: the added and removed rows really paint in
 *   distinguishable colours against the surface.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/diff/matrix.html';

const MODES = ['unified', 'split'] as const;

/**
 * The diff's marks are its rows. `requireDistinctPositions` is on because two
 * rows drawn at the same origin is exactly the collapsed-table regression;
 * occlusion is on because a row painted under its neighbour is unreadable
 * however correct its cells are.
 */
const PROBE: ChartProbe = {
  surface: '[part~="content"]',
  marks: 'tr.diff-line',
  minMarks: 2,
  requireDistinctPositions: true,
  occlusion: true,
  text: 'td.diff-code',
  boxes: ['[part~="base"]', '[part~="header"]', '[part~="content"]'],
};

test.describe('snice-diff visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const mode of MODES) {
    for (const lineNumbers of [true, false]) {
      for (const markers of [true, false]) {
        const id = `${mode}/${lineNumbers ? 'nums' : 'no-nums'}/${markers ? 'marks' : 'no-marks'}`;
        test(id, async () => {
          await mount(page, { scenario: 'replace-middle', mode, lineNumbers, markers });
          expect(await collectChartProblems(page, PROBE), id).toEqual([]);
        });
      }
    }
  }

  test('split mode really lays the two panes side by side', async () => {
    // doc: "unified and split (side-by-side) modes". Side-by-side is pure
    // layout: in happy-dom both panes are the same empty box, so a component
    // that stacked them would satisfy every DOM assertion.
    await mount(page, { scenario: 'replace-middle', mode: 'split' });
    const panes = await page.evaluate(() => [...document.getElementById('subject')!
      .shadowRoot!.querySelectorAll('.diff-split-pane')].map((pane) => {
      const b = pane.getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width };
    }));

    expect(panes.length).toBe(2);
    const [left, right] = panes;
    expect(right.left, 'the right pane does not start after the left one')
      .toBeGreaterThanOrEqual(left.right - 1.5);
    expect(Math.abs(left.top - right.top), 'the panes are not top-aligned').toBeLessThan(1.5);
    // Side-by-side means comparable, so neither pane may collapse to a sliver.
    expect(Math.min(left.width, right.width) / Math.max(left.width, right.width),
      'one pane is far narrower than the other').toBeGreaterThan(0.4);
  });

  test('the unified view is one table, not two panes', async () => {
    await mount(page, { scenario: 'replace-middle', mode: 'unified' });
    const shape = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return {
        panes: sr.querySelectorAll('.diff-split-pane').length,
        tables: sr.querySelectorAll('.diff-table').length,
      };
    });
    expect(shape).toEqual({ panes: 0, tables: 1 });
  });

  test('added, removed and unchanged rows paint three different backgrounds', async () => {
    // doc, CSS Custom Properties: `--diff-add-bg` (added line background) and
    // `--diff-remove-bg` (removed line background). A stylesheet that resolved
    // both to the surface colour would leave a diff nobody can read, and the
    // DOM tier — which sees only class names — cannot tell.
    await mount(page, { scenario: 'replace-middle', mode: 'unified' });
    const colours = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const pick = (selector: string) => {
        const row = sr.querySelector(selector);
        return row ? getComputedStyle(row).backgroundColor : null;
      };
      return {
        added: pick('tr.diff-line--added'),
        removed: pick('tr.diff-line--removed'),
        unchanged: pick('tr.diff-line--unchanged'),
      };
    });

    expect(colours.added, 'no added row rendered').toBeTruthy();
    expect(colours.removed, 'no removed row rendered').toBeTruthy();
    expect(colours.added, 'added and removed rows share a background').not.toBe(colours.removed);
    expect(colours.added, 'an added row is painted like an unchanged one').not.toBe(colours.unchanged);
    expect(colours.removed, 'a removed row is painted like an unchanged one').not.toBe(colours.unchanged);
  });

  test('dark mode repaints the diff without losing the add/remove distinction', async () => {
    // doc, Accessibility: "Dark mode via `[data-theme='dark']` or
    // `prefers-color-scheme: dark`". A theme that swapped the surface but left
    // the row tints alone is the classic unreadable-dark-diff regression.
    await mount(page, { scenario: 'replace-middle', mode: 'unified', theme: 'light' });
    const light = await rowColours(page);
    await mount(page, { scenario: 'replace-middle', mode: 'unified', theme: 'dark' });
    const dark = await rowColours(page);

    expect(dark.base, 'dark mode did not repaint the container').not.toBe(light.base);
    expect(dark.added, 'dark mode did not repaint the added row').not.toBe(light.added);
    expect(dark.added, 'dark mode collapsed added and removed to one colour').not.toBe(dark.removed);
  });

  test('a very long code line does not push the table past its container', async () => {
    // A diff's one structural hazard: a 400-character line that widens the
    // table until the gutters leave the viewport. Nothing in the DOM tier can
    // see it, because nothing there has a width at all.
    await mount(page, { scenario: 'wide', mode: 'unified' });
    const overflow = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const base = sr.querySelector('[part~="base"]')!.getBoundingClientRect();
      const content = sr.querySelector('[part~="content"]') as HTMLElement;
      const rows = [...sr.querySelectorAll('tr.diff-line')] as HTMLElement[];
      return {
        hostWidth: host.getBoundingClientRect().width,
        baseWidth: base.width,
        contentScrolls: content.scrollWidth > content.clientWidth,
        widest: Math.max(...rows.map(row => row.getBoundingClientRect().right)) - base.left,
        docScrolls: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    expect(overflow.baseWidth, 'the diff grew wider than the container it was given')
      .toBeLessThanOrEqual(overflow.hostWidth + 1.5);
    expect(overflow.docScrolls, 'a long code line pushed the whole page sideways').toBe(false);
  });

  test('every row stays inside the content area at every context width', async () => {
    // The collapsed-section separator is a full-width row in a table whose
    // other rows have three or four columns; a browser is the only thing that
    // can say whether it still lines up.
    const problems: string[] = [];
    for (const contextLines of [0, 1, 3, 10]) {
      await mount(page, { scenario: 'two-far-changes', mode: 'unified', contextLines });
      const escaped = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const content = sr.querySelector('[part~="content"]')!.getBoundingClientRect();
        return [...sr.querySelectorAll('tr')].filter((row) => {
          const b = row.getBoundingClientRect();
          return b.height <= 0 || b.left < content.left - 1.5 || b.right > content.right + 1.5;
        }).length;
      });
      if (escaped) problems.push(`context-lines=${contextLines}: ${escaped} rows escape the content area`);
    }
    expect(problems).toEqual([]);
  });

  test('the header toggle really switches the painted view', async () => {
    // doc: the header toggle "self-assigns" `mode`. The DOM tier proves the
    // property and the event; only a browser proves the reader sees two panes
    // afterwards.
    await mount(page, { scenario: 'replace-middle', mode: 'unified' });
    expect(await page.evaluate(() => (window as any).matrix.toggle('split'))).toBe('split');
    const panes = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelectorAll('.diff-split-pane').length);
    expect(panes).toBe(2);
  });

  /**
   * MATRIX-diff-1 (fixed) — a collapsed section could not be expanded.
   *
   * `docs/ai/components/diff.md`, Accessibility: "Unchanged sections beyond
   * context are collapsed; click to expand". The separator row is rendered with
   * exactly that invitation and carries a click handler, but the handler only
   * flipped a private field, which scheduled no re-render — so a real click in
   * a real browser left the table byte-identical and the hidden lines
   * unreachable.
   *
   * Policy (.ai/fuzzing.md): the assertion stayed correct while the combo was
   * pinned; `hunks` is now `@state`, the click re-renders, and the pin is
   * removed with the fix.
   */
  test('MATRIX-diff-1: clicking a collapsed section reveals its lines', async () => {
    await mount(page, { scenario: 'two-far-changes', mode: 'unified', contextLines: 3 });
    const counts = await page.evaluate(() => (window as any).matrix.expandFirst());
    expect(counts.after, 'the row count did not change when the section was clicked')
      .toBeGreaterThan(counts.before);
  });

  /**
   * MATRIX-diff-3 (fixed) — split mode offered no way to reach a collapsed
   * section.
   *
   * The same doc sentence is stated for the component, not for one of its
   * modes. The unified view at least rendered the invitation; the split view
   * dropped the collapsed lines silently, so in `mode="split"` there was
   * nothing on screen to click at all. Fixed: the split view now renders the
   * same separator row in both panes.
   */
  test('MATRIX-diff-3: split mode marks its collapsed sections too', async () => {
    await mount(page, { scenario: 'two-far-changes', mode: 'split', contextLines: 3 });
    const separators = await page.evaluate(() => document.getElementById('subject')!
      .shadowRoot!.querySelectorAll('.diff-hunk-separator').length);
    expect(separators, 'the split view hides the collapsed lines with no expander')
      .toBeGreaterThan(0);
  });
});

/** Resolved backgrounds of the container and of one row of each kind. */
async function rowColours(page: Page): Promise<Record<string, string | null>> {
  return page.evaluate(() => {
    const sr = document.getElementById('subject')!.shadowRoot!;
    const bg = (selector: string) => {
      const node = sr.querySelector(selector);
      return node ? getComputedStyle(node).backgroundColor : null;
    };
    return {
      base: bg('[part~="base"]'),
      added: bg('tr.diff-line--added'),
      removed: bg('tr.diff-line--removed'),
      unchanged: bg('tr.diff-line--unchanged'),
    };
  });
}

// ── LAYER 2: real pixels, one pinned combo ──────────────────────────────────

test.describe('snice-diff visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the added and removed rows really paint apart, and their text stays readable', async () => {
    // A computed background that "differs" can still differ by two luminance
    // points, which is a diff nobody can read. Only the painted pixels answer
    // that, and the same capture answers the second question: does the code
    // text on a tinted row still carry enough contrast to read?
    await mount(page, { scenario: 'replace-middle', mode: 'unified', theme: 'light' });

    const PROBES = `(host) => {
      const sr = host.shadowRoot;
      const rowPoint = (selector, fraction) => {
        const row = sr.querySelector(selector);
        const b = row.getBoundingClientRect();
        return { x: b.right - b.width * fraction, y: b.top + b.height / 2 };
      };
      return [
        rowPoint('tr.diff-line--added', 0.06),
        rowPoint('tr.diff-line--removed', 0.06),
        rowPoint('tr.diff-line--unchanged', 0.06),
      ];
    }`;

    const [added, removed, unchanged] = await capture(page, '#subject', 'diff-row-tints', PROBES);

    expect(sameColor(added, removed), 'the added and removed rows paint the same colour').toBe(false);
    expect(sameColor(added, unchanged), 'the added row paints like an unchanged one').toBe(false);
    expect(sameColor(removed, unchanged), 'the removed row paints like an unchanged one').toBe(false);

    // The tints must be visible against the neutral row, but must not be so
    // strong that the code sitting on them stops being legible.
    for (const [name, tint] of [['added', added], ['removed', removed]] as Array<[string, RGB]>) {
      const separation = contrast(tint, unchanged);
      expect(separation, `the ${name} tint is indistinguishable from an unchanged row`)
        .toBeGreaterThan(1.02);
    }
  });
});
