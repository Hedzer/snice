/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-form-layout TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/form-layout, `npm run test:matrix`) owns
 * structure truth: the class hooks per property value, the two custom
 * properties' values, and that the author's fields stay the author's children
 * in the author's order. Its own header says why that is all it can own: "In
 * happy-dom there is no grid, no gap and no media query" — the columns, the
 * label alignment, the gap scale and the "<640px collapses to one column"
 * rule are asserted here.
 *
 * The fixture's fields are stand-ins that consume the custom properties the
 * layout publishes to `::slotted(*)` (`--snice-form-field-direction`,
 * `--snice-form-label-width`, `--snice-form-label-align`,
 * `--snice-form-label-margin`), because that publishing IS the documented
 * label-position contract — no real snice field reads them yet, so a stand-in
 * that does is the honest instrument.
 *
 * ── Layer 1 (every combo): grid geometry + computed style ───────────────────
 *   · `columns` really produces N equal tracks, row-major, without overlap;
 *   · `gap` really produces the spacing token its class names, and `compact`
 *     really shrinks each gap a step;
 *   · `label-position` really steers the field: top stacks label over control,
 *     left/right publish a row/row-reverse with the label `label-width` wide,
 *     correctly aligned, with a real gutter between label and control;
 *   · `variant="inline"` really flexes: one wrapping row, aligned to the
 *     flex-end baseline the doc's own example relies on;
 *   · a `grid-column: 1 / -1` child really spans the whole grid — the doc's
 *     own spanning recipe.
 *
 * ── Responsive (a real viewport): below 640px the grid collapses to one
 *   column, labels go back on top regardless of setting, and inline stacks —
 *   each judged by resizing the shared page, the only honest way to ask a
 *   media query anything.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The layout itself paints nothing, so its marquee is deliberately minimal:
 *   the two pixel claims that are real are that a GAP is empty surface (not
 *   two fields touching) and that a left label's fill really sits left of its
 *   control's fill.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/form-layout/matrix.html';

type Gap = 'small' | 'medium' | 'large';
type Variant = 'default' | 'compact' | 'inline';
type LabelPosition = 'top' | 'left' | 'right';

/**
 * The gap each documented gap/variant pair names, from the stylesheet's own
 * rules: gap-small/medium/large -> spacing-xs/md/lg; compact shifts each one
 * step down (xs -> 3xs, md -> 2xs, lg -> xs).
 */
const GAP_TOKEN: Record<Exclude<Variant, 'inline'>, Record<Gap, string>> = {
  default: { small: '--snice-spacing-xs', medium: '--snice-spacing-md', large: '--snice-spacing-lg' },
  compact: { small: '--snice-spacing-3xs', medium: '--snice-spacing-2xs', large: '--snice-spacing-xs' },
};
const INLINE_GAP_TOKEN: Record<Gap, string> = {
  small: '--snice-spacing-xs', medium: '--snice-spacing-md', large: '--snice-spacing-lg',
};

interface Combo {
  id: string;
  kind: 'grid' | 'label' | 'inline' | 'span';
  columns: number;
  gap: Gap;
  variant: Variant;
  labelPosition: LabelPosition;
  labelWidth: string;
  fields: number;
  /** grid-column value for the field at that index, per the doc's recipe. */
  spans?: Record<number, string>;
}

/**
 * Three crosses, sized to a layout component:
 *   GRID   — columns (1..4) x gap (3) x variant (default, compact) = 24.
 *   LABEL  — labelPosition (3) x labelWidth (2) x columns (1, 2) = 12.
 *   INLINE — {3 fields on one row, 6 fields that must wrap} x 2 gaps = 4.
 *   SPAN   — the doc's grid-column recipe, at the middle and at the top = 2.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const columns of [1, 2, 3, 4]) {
    for (const gap of ['small', 'medium', 'large'] as Gap[]) {
      for (const variant of ['default', 'compact'] as Variant[]) {
        combos.push({
          id: `grid/columns=${columns}/${variant}/${gap}`,
          kind: 'grid', columns, gap, variant,
          labelPosition: 'top', labelWidth: '8rem', fields: 6,
        });
      }
    }
  }
  for (const labelPosition of ['top', 'left', 'right'] as LabelPosition[]) {
    for (const labelWidth of ['8rem', '12rem']) {
      for (const columns of [1, 2]) {
        combos.push({
          id: `label/${labelPosition}/width=${labelWidth}/columns=${columns}`,
          kind: 'label', columns, gap: 'medium', variant: 'default',
          labelPosition, labelWidth, fields: 2,
        });
      }
    }
  }
  for (const [fields, gap] of [[3, 'medium'], [6, 'medium'], [6, 'large'], [3, 'small']] as Array<[number, Gap]>) {
    combos.push({
      id: `inline/fields=${fields}/${gap}`,
      kind: 'inline', columns: 2, gap, variant: 'inline',
      labelPosition: 'top', labelWidth: '8rem', fields,
    });
  }
  combos.push({
    id: 'span/columns=2/at-index-2', kind: 'span', columns: 2, gap: 'medium',
    variant: 'default', labelPosition: 'top', labelWidth: '8rem', fields: 6,
    spans: { 2: '1 / -1' },
  });
  combos.push({
    id: 'span/columns=3/at-index-0', kind: 'span', columns: 3, gap: 'medium',
    variant: 'default', labelPosition: 'top', labelWidth: '8rem', fields: 5,
    spans: { 0: '1 / -1' },
  });
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((data) => {
    const combo = data.combo;
    const GAP_TOKEN = data.GAP_TOKEN;
    const INLINE_GAP_TOKEN = data.INLINE_GAP_TOKEN;
    const problems: string[] = [];
    const say = (message: string) => problems.push(message);
    const EPS = 1;
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!base) { say('no [part="base"] layout container'); return problems; }
    const baseCs = getComputedStyle(base);
    const baseBox = base.getBoundingClientRect();
    const fields = [...host.children] as HTMLElement[];
    if (fields.length !== combo.fields) {
      say(`${fields.length} fields mounted, expected ${combo.fields}`);
      return problems;
    }
    const boxes = fields.map(field => field.getBoundingClientRect());

    // ── Every field is inside the layout and none overlap ──────────────────
    for (const [i, box] of boxes.entries()) {
      if (box.width <= 0 || box.height <= 0) {
        say(`field ${i} renders at ${box.width}x${box.height}`);
      }
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS) {
        say(`field ${i} overflows the layout horizontally`);
      }
    }
    for (let i = 1; i < boxes.length; i++) {
      const a = boxes[i - 1];
      const b = boxes[i];
      const intersects = b.left < a.right - EPS && a.left < b.right - EPS
        && b.top < a.bottom - EPS && a.top < b.bottom - EPS;
      if (intersects) say(`field ${i} overlaps field ${i - 1}`);
    }

    // ── The gap scale, as the engine resolves it ───────────────────────────
    if (baseCs.columnGap !== baseCs.rowGap) {
      say(`column gap "${baseCs.columnGap}" != row gap "${baseCs.rowGap}"`);
    }
    // The inline variant carries its OWN gap rules (`.form-layout--inline
    // .form-layout--gap-{small,medium,large}` -> spacing-xs/md/lg,
    // snice-form-layout.css), so it is indexed with the combo's gap like the
    // grid variants — interpolating the whole record object would stringify
    // to "var([object Object])" and resolve to the probe's fallback 1px.
    const expectedGap = matrix.lengthPx(
      `var(${combo.variant === 'inline' ? INLINE_GAP_TOKEN[combo.gap] : GAP_TOKEN[combo.variant][combo.gap]})`);
    const actualGap = parseFloat(baseCs.columnGap) || 0;
    if (Math.abs(actualGap - expectedGap) > EPS) {
      say(`${combo.variant}/${combo.gap} gap is ${actualGap}px, the documented token is ${expectedGap}px`);
    }

    // ── INLINE: one wrapping flex row, bottom-aligned ──────────────────────
    if (combo.kind === 'inline') {
      if (baseCs.display !== 'flex') say(`variant="inline" displays "${baseCs.display}", expected flex`);
      if (baseCs.flexWrap !== 'wrap') say(`variant="inline" wraps "${baseCs.flexWrap}", expected wrap`);
      if (baseCs.alignItems !== 'flex-end') {
        say(`variant="inline" aligns "${baseCs.alignItems}", expected flex-end`);
      }
      const tops = [...new Set(boxes.map(box => Math.round(box.top)))];
      // 3 fields fit the 660px stage (3x120px + gaps); 6 (6x120px + gaps) do
      // not — that is what flex-wrap is for.
      if (combo.fields <= 3 && tops.length !== 1) {
        say(`${combo.fields} inline fields spread over ${tops.length} rows — they fit`);
      }
      if (combo.fields > 3 && tops.length < 2) {
        say(`${combo.fields} inline fields all stayed on one row — nothing wrapped`);
      }
      return problems;
    }

    // ── GRID: N equal tracks, row-major ────────────────────────────────────
    if (baseCs.display !== 'grid') say(`the layout displays "${baseCs.display}", expected grid`);
    const tracks = baseCs.gridTemplateColumns.split(' ').filter(Boolean);
    if (tracks.length !== combo.columns) {
      say(`grid-template-columns has ${tracks.length} tracks, expected ${combo.columns}`);
    }
    const spanned = new Set(Object.keys(combo.spans ?? {}).map(Number));
    const normalBoxes = boxes.filter((_, i) => !spanned.has(i));
    const columnLefts = [...new Set(normalBoxes.map(box => Math.round(box.left)))].sort((a, b) => a - b);
    const expectColumns = Math.min(combo.columns, normalBoxes.length);
    if (columnLefts.length !== expectColumns) {
      say(`the fields occupy ${columnLefts.length} distinct columns, expected ${expectColumns}`);
    }
    const widths = normalBoxes.map(box => box.width);
    if (Math.max(...widths) - Math.min(...widths) > EPS) {
      say(`equal 1fr tracks produced field widths ${Math.min(...widths).toFixed(1)}`
        + `…${Math.max(...widths).toFixed(1)}px`);
    }
    // Row-major: within a row, the authored order runs left to right, and
    // rows only ever go DOWN the page.
    for (let i = 1; i < normalBoxes.length; i++) {
      const a = normalBoxes[i - 1];
      const b = normalBoxes[i];
      const sameRow = Math.abs(a.top - b.top) <= EPS;
      if (sameRow && b.left <= a.left) say(`field order broke: field ${i} is not right of field ${i - 1}`);
      if (!sameRow && b.top < a.top - EPS) say(`field order broke: field ${i} is above field ${i - 1}`);
    }

    // ── The doc's spanning recipe ──────────────────────────────────────────
    for (const [index, span] of Object.entries(combo.spans ?? {})) {
      const box = boxes[Number(index)];
      const others = boxes.filter((_, i) => !spanned.has(i));
      if (Math.abs(box.width - baseBox.width) > EPS + 2) {
        say(`the spanning field is ${box.width.toFixed(1)}px wide in a ${baseBox.width.toFixed(1)}px grid`
          + ' — grid-column: 1 / -1 did not span');
      }
      if (others.some(other => other.top < box.bottom - EPS && other.bottom > box.top + EPS
        && !(other.right <= box.left + EPS || other.left >= box.right - EPS))) {
        say('another field shares a row with the spanning field');
      }
    }

    // ── Label position: the published custom properties, consumed ─────────
    for (const [i, field] of fields.entries()) {
      const label = field.querySelector('.label') as HTMLElement | null;
      const control = field.querySelector('.control') as HTMLElement | null;
      if (!label || !control) { say(`field ${i} lost its label/control stand-in`); continue; }
      const fieldCs = getComputedStyle(field);
      const labelCs = getComputedStyle(label);
      const labelBox = label.getBoundingClientRect();
      const controlBox = control.getBoundingClientRect();

      if (combo.labelPosition === 'top') {
        if (fieldCs.flexDirection !== 'column') {
          say(`label-position="top" publishes direction "${fieldCs.flexDirection}", expected column`);
        }
        if (labelBox.bottom > controlBox.top + EPS) {
          say(`field ${i}'s label is not above its control`);
        }
        if (Math.abs(labelBox.width - boxes[i].width) > EPS + 2) {
          say(`field ${i}'s top label is ${labelBox.width.toFixed(1)}px wide in a`
            + ` ${boxes[i].width.toFixed(1)}px field — label-width should be auto`);
        }
        if (labelCs.textAlign !== 'left') say(`a top label aligns "${labelCs.textAlign}", expected left`);
      } else {
        const rowLike = combo.labelPosition === 'left' ? ['row'] : ['row-reverse'];
        if (!rowLike.includes(fieldCs.flexDirection)) {
          say(`label-position="${combo.labelPosition}" publishes direction "${fieldCs.flexDirection}"`
            + `, expected ${rowLike[0]}`);
        }
        const expectedWidth = matrix.lengthPx(combo.labelWidth);
        if (Math.abs(labelBox.width - expectedWidth) > EPS) {
          say(`field ${i}'s label is ${labelBox.width.toFixed(1)}px wide, expected the`
            + ` label-width ${combo.labelWidth} (${expectedWidth}px)`);
        }
        if (combo.labelPosition === 'left') {
          if (labelBox.right > controlBox.left - 1) {
            say(`field ${i}'s label touches or crosses its control from the left`);
          }
          if (labelCs.textAlign !== 'right') {
            say(`a left label aligns "${labelCs.textAlign}", expected right (toward its control)`);
          }
        } else {
          if (controlBox.right > labelBox.left + 1) {
            say(`field ${i}'s control touches or crosses its label from the left`);
          }
          if (labelCs.textAlign !== 'left') {
            say(`a right label aligns "${labelCs.textAlign}", expected left (toward its control)`);
          }
        }
      }
    }

    return problems;
  }, { combo, GAP_TOKEN, INLINE_GAP_TOKEN } as any);
}

const combos = generateCombos();

test.describe('form-layout visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// A layout paints nothing of its own, so this is deliberately the smallest
// marquee in the tier: the two claims that are pixels and not boxes.

test.describe('form-layout visual matrix: marquee pixels', () => {
  test('the gap between two fields is really empty surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      kind: 'grid', columns: 2, gap: 'medium', variant: 'default',
      labelPosition: 'top', fields: 6,
    }));
    const [gap, fill] = await capture(
      page, '#subject', 'form-layout-gap',
      `(host) => {
        const [a, b] = [...host.children].map(f => f.getBoundingClientRect());
        const y = a.top + a.height / 2;
        return [
          { x: (a.right + b.left) / 2, y },
          { x: a.left + a.width / 2, y },
        ];
      }`,
    );
    // The page surface is the theme's own token; a gap that painted anything
    // (or two fields touching) would read the field fill instead.
    const surface = await page.evaluate(() => (window as any).matrix.token('--snice-color-surface'));
    const [sr, sg, sb] = surface.match(/\d+/g)!.map(Number);
    expect(sameColor(gap as RGB, [sr, sg, sb]),
      `the gap painted rgb(${gap.join(',')}) instead of the surface rgb(${sr},${sg},${sb})`).toBe(true);
    expect(sameColor(gap as RGB, fill as RGB),
      `the gap and the field fill both painted rgb(${gap.join(',')})`).toBe(false);
  });

  test('labels-left really puts a label fill left of a control fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      kind: 'label', columns: 1, gap: 'medium', variant: 'default',
      labelPosition: 'left', labelWidth: '8rem', fields: 2,
    }));
    const [labelFill, controlFill] = await capture(
      page, '#subject', 'form-layout-labels-left',
      `(host) => {
        const field = host.children[0];
        const label = field.querySelector('.label').getBoundingClientRect();
        const control = field.querySelector('.control').getBoundingClientRect();
        return [
          { x: label.left + label.width / 2, y: label.top + label.height / 2 },
          { x: control.left + control.width / 2, y: control.top + control.height / 2 },
        ];
      }`,
    );
    // The stand-ins paint flat colours: the label's dark blue and the
    // control's near-white. Both landing on the page surface would mean the
    // custom properties published nothing that paints.
    expect(sameColor(labelFill as RGB, controlFill as RGB),
      `label and control both painted rgb(${labelFill.join(',')})`).toBe(false);
  });
});

// ── The responsive rule, judged by really resizing the viewport ─────────────
//
// "Responsive: collapses to single column on mobile (<640px)" and the
// stylesheet's "labels go on top on mobile regardless of setting" can only be
// asked of a real viewport, so these tests resize the SHARED page and put it
// back. They run last for that reason.

test.describe('form-layout visual matrix: the <640px collapse', () => {
  test.beforeEach(async () => {
    await page.setViewportSize({ width: 600, height: 900 });
  });
  test.afterEach(async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('a 3-column grid collapses to one column', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      kind: 'grid', columns: 3, gap: 'medium', variant: 'default',
      labelPosition: 'top', fields: 6,
    }));
    const verdict = await page.evaluate(() => {
      const base = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="base"]') as HTMLElement;
      const boxes = [...document.getElementById('subject')!.children]
        .map(f => f.getBoundingClientRect());
      return {
        columns: new Set(boxes.map(b => Math.round(b.left))).size,
        width: Math.round(boxes[0].width),
        baseWidth: Math.round(base.getBoundingClientRect().width),
      };
    });
    expect(verdict.columns, `${verdict.columns} columns at 600px, documented 1`).toBe(1);
    expect(Math.abs(verdict.width - verdict.baseWidth)).toBeLessThanOrEqual(2);
  });

  test('labels-left goes back on top on mobile', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      kind: 'label', columns: 1, gap: 'medium', variant: 'default',
      labelPosition: 'left', labelWidth: '8rem', fields: 2,
    }));
    const verdict = await page.evaluate(() => {
      const field = document.getElementById('subject')!.children[0] as HTMLElement;
      const label = field.querySelector('.label')!.getBoundingClientRect();
      const control = field.querySelector('.control')!.getBoundingClientRect();
      return {
        direction: getComputedStyle(field).flexDirection,
        labelAbove: label.bottom <= control.top + 1,
        labelWidth: Math.round(label.width),
      };
    });
    expect(verdict.direction, `direction stayed "${verdict.direction}" on mobile`).toBe('column');
    expect(verdict.labelAbove).toBe(true);
    // "label-width: auto" again on mobile — the 8rem column is gone.
    const fieldWidth = await page.evaluate(() =>
      Math.round((document.getElementById('subject')!.children[0] as HTMLElement)
        .getBoundingClientRect().width));
    expect(Math.abs(verdict.labelWidth - fieldWidth)).toBeLessThanOrEqual(2);
  });

  test('inline stacks instead of wrapping', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      kind: 'inline', columns: 2, gap: 'medium', variant: 'inline',
      labelPosition: 'top', fields: 3,
    }));
    const verdict = await page.evaluate(() => {
      const base = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="base"]') as HTMLElement;
      const boxes = [...document.getElementById('subject')!.children]
        .map(f => f.getBoundingClientRect());
      return {
        direction: getComputedStyle(base).flexDirection,
        align: getComputedStyle(base).alignItems,
        columns: new Set(boxes.map(b => Math.round(b.left))).size,
      };
    });
    expect(verdict.direction, `inline direction "${verdict.direction}" on mobile`).toBe('column');
    expect(verdict.align, `inline align "${verdict.align}" on mobile`).toBe('stretch');
    expect(verdict.columns).toBe(1);
  });
});
