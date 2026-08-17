/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-divider TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/divider, `npm run test:matrix`) owns
 * structure truth: which parts exist, what the label reads, which attributes
 * reflected. It cannot own visual truth, because happy-dom performs no layout —
 * every box reads 0 and nothing is painted.
 *
 * The divider is a PURELY PRESENTATIONAL component: no data, no interaction, no
 * delivery modes. Per .ai/fuzzing.md its matrix is deliberately MINIMAL — the
 * layer-1 cross below is 24 combos, not the table's 1152 — but it is exactly the
 * tier that matters most for this component, because *every single documented
 * dimension of a divider is a CSS rule*. `variant`, `spacing`, `capped` and
 * `align` produce no DOM difference whatsoever; a browser is the only place they
 * can be verified at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the line has a real box in both orientations, and spans its container;
 *   · `variant` resolves to three DISTINCT paint rules (solid → flat colour,
 *     dashed/dotted → a background-image), and the vertical variants really
 *     switch axis;
 *   · `capped` really rounds the ends, and its absence really does not;
 *   · `spacing` resolves to the documented margins, on the correct axis;
 *   · `align` moves the label: `start` puts the short segment first, `end` last,
 *     `center` keeps the two segments equal;
 *   · the label is never occluded by its own line segments (elementFromPoint),
 *     and the segments never overlap the label's box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A line that "has a background-color" can still be invisible. The marquee
 *   captures decode the PNG inside the browser under test and assert the line's
 *   painted pixels actually differ from the surface behind them, and that a
 *   `color` override paints the colour that was asked for.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/divider/matrix.html';

type Orientation = 'horizontal' | 'vertical';
type Variant = 'solid' | 'dashed' | 'dotted';
type Spacing = 'none' | 'small' | 'medium' | 'large';
type Align = 'start' | 'center' | 'end';

interface Combo {
  id: string;
  orientation: Orientation;
  variant: Variant;
  spacing: Spacing;
  align: Align;
  capped: boolean;
  text: string;
}

/** The documented margins, in px, from snice-divider.css / the docs table. */
const SPACING_PX: Record<Spacing, number> = { none: 0, small: 8, medium: 16, large: 24 };

/**
 * The cross: orientation x variant x text (12) doubled by `capped`, with
 * `spacing` and `align` rotated across it — 24 combos. Sized to a component
 * whose render function has one branch; the point of this tier is that all four
 * style-only dimensions get a real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
    for (const variant of ['solid', 'dashed', 'dotted'] as Variant[]) {
      for (const text of ['', 'SECTION']) {
        for (const capped of [false, true]) {
          const spacing = (['none', 'small', 'medium', 'large'] as Spacing[])[n % 4];
          const align = (['start', 'center', 'end'] as Align[])[n % 3];
          combos.push({
            id: `${orientation}/${variant}/${text ? 'labelled' : 'bare'}`
              + `/[spacing:${spacing},align:${align}${capped ? ',capped' : ''}]`,
            orientation, variant, spacing, align, capped, text,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    // ── The documented display switch ────────────────────────────────────────
    //
    // A vertical divider is `inline-block` so it can sit between two inline
    // items. The documented layout for it, though, is a flex row (docs/
    // components/divider.md "Vertical Orientation"), and CSS BLOCKIFIES every
    // flex item: `inline-block` computes to `block` for a flex child, by spec.
    // So the expectation is read against the parent's formatting context —
    // measuring the same rule, in the box model the browser actually built.
    const parentDisplay = host.parentElement
      ? getComputedStyle(host.parentElement).display : 'block';
    const blockified = /flex|grid/.test(parentDisplay);
    const wantDisplay = combo.orientation === 'vertical' && !blockified
      ? 'inline-block' : 'block';
    if (hostCs.display !== wantDisplay) {
      say(`${combo.orientation} host computed display "${hostCs.display}", expected "${wantDisplay}"`
        + ` (parent display "${parentDisplay}")`);
    }

    // ── spacing: the documented margin, on the documented axis ───────────────
    const spacingPx = { none: 0, small: 8, medium: 16, large: 24 }[combo.spacing];
    const margins = combo.orientation === 'vertical'
      ? { along: [hostCs.marginLeft, hostCs.marginRight], across: [hostCs.marginTop, hostCs.marginBottom] }
      : { along: [hostCs.marginTop, hostCs.marginBottom], across: [hostCs.marginLeft, hostCs.marginRight] };
    for (const value of margins.along) {
      if (Math.abs(parseFloat(value) - spacingPx) > 0.5) {
        say(`spacing="${combo.spacing}" gave margin ${value}, expected ${spacingPx}px`);
      }
    }
    for (const value of margins.across) {
      if (parseFloat(value) !== 0) {
        say(`spacing="${combo.spacing}" leaked ${value} onto the cross axis`);
      }
    }

    const lines = partsNamed('line');
    const labels = partsNamed('text');
    if (lines.length === 0) { say('no part="line" rendered'); return problems; }

    // ── Every line segment has a real, visible box ───────────────────────────
    for (const [i, line] of lines.entries()) {
      const b = rect(line);
      if (b.width <= 0 || b.height <= 0) {
        say(`line ${i} renders at ${b.width}x${b.height}`);
        continue;
      }
      const cs = getComputedStyle(line);
      if (cs.visibility !== 'visible') say(`line ${i} visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`line ${i} opacity "${cs.opacity}"`);

      // A horizontal rule must be wide and thin; a vertical one tall and thin.
      if (combo.orientation === 'horizontal') {
        if (b.height > 4) say(`horizontal line ${i} is ${b.height}px thick`);
        if (b.width < 8) say(`horizontal line ${i} is only ${b.width}px long`);
      } else {
        if (b.width > 4) say(`vertical line ${i} is ${b.width}px thick`);
        if (b.height < 8) say(`vertical line ${i} is only ${b.height}px long`);
      }

      // ── capped: the documented rounded end ────────────────────────────────
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      if (combo.capped && radius <= 0) say(`capped line ${i} has border-radius ${cs.borderTopLeftRadius}`);
      if (!combo.capped && radius > 0) say(`uncapped line ${i} has border-radius ${cs.borderTopLeftRadius}`);

      // ── variant: three distinct paint rules ───────────────────────────────
      const image = cs.backgroundImage;
      if (combo.variant === 'solid') {
        if (image !== 'none') say(`solid line ${i} paints a background-image (${image})`);
        if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
          say(`solid line ${i} has a transparent background-color`);
        }
      } else {
        if (image === 'none') {
          say(`${combo.variant} line ${i} paints no background-image — it is a solid rule`);
        }
        if (combo.variant === 'dashed' && !image.includes('linear-gradient')) {
          say(`dashed line ${i} background-image is "${image}", expected a linear-gradient`);
        }
        if (combo.variant === 'dotted' && !image.includes('radial-gradient')) {
          say(`dotted line ${i} background-image is "${image}", expected a radial-gradient`);
        }
        // The vertical dashed rule must run DOWN the line, not across it.
        // `to bottom` is the initial direction, and every engine serializes it
        // by omission — so the observable claim is the absence of a horizontal
        // direction, not the presence of the word "bottom".
        if (combo.variant === 'dashed' && combo.orientation === 'vertical'
          && /to right|to left|90deg|270deg/.test(image)) {
          say(`vertical dashed line ${i} still gradients across the rule (${image})`);
        }
        if (combo.variant === 'dashed' && combo.orientation === 'horizontal'
          && !/to right|to left|90deg|270deg/.test(image)) {
          say(`horizontal dashed line ${i} gradients down the rule (${image})`);
        }
      }
    }

    // ── The label: geometry, ordering, and occlusion ─────────────────────────
    if (combo.text && combo.orientation === 'horizontal') {
      if (labels.length !== 1) { say(`${labels.length} labels, expected 1`); return problems; }
      const label = labels[0];
      const labelBox = rect(label);
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`label renders at ${labelBox.width}x${labelBox.height}`);
        return problems;
      }
      const labelCs = getComputedStyle(label);
      if (parseFloat(labelCs.fontSize) < 9) say(`label font-size ${labelCs.fontSize}`);
      if (labelCs.visibility !== 'visible') say(`label visibility "${labelCs.visibility}"`);

      if (lines.length !== 2) {
        say(`labelled divider has ${lines.length} line segments, expected 2`);
      } else {
        const before = rect(lines[0]);
        const after = rect(lines[1]);
        // The segments must sit either side of the label with no overlap: an
        // overlap is a line painting THROUGH the text, which is exactly the
        // failure a DOM test cannot see.
        if (before.right > labelBox.left + EPS) {
          say(`leading segment (right ${before.right.toFixed(1)}) runs into the label`
            + ` (left ${labelBox.left.toFixed(1)})`);
        }
        if (after.left < labelBox.right - EPS) {
          say(`trailing segment (left ${after.left.toFixed(1)}) runs into the label`
            + ` (right ${labelBox.right.toFixed(1)})`);
        }
        if (before.width <= 0 || after.width <= 0) {
          say(`a label segment collapsed (${before.width.toFixed(1)} / ${after.width.toFixed(1)})`);
        }

        // ── align: where the label sits ─────────────────────────────────────
        // Documented: `start` puts the label near the start, `end` near the end,
        // `center` between two equal segments.
        const ratio = before.width / (before.width + after.width);
        if (combo.align === 'center' && Math.abs(ratio - 0.5) > 0.08) {
          say(`align="center" split the segments ${before.width.toFixed(0)}/${after.width.toFixed(0)}`);
        }
        if (combo.align === 'start' && ratio > 0.35) {
          say(`align="start" left the leading segment at ${(ratio * 100).toFixed(0)}% of the rule`);
        }
        if (combo.align === 'end' && ratio < 0.65) {
          say(`align="end" left the leading segment at ${(ratio * 100).toFixed(0)}% of the rule`);
        }
      }

      // ── Occlusion: nothing may paint over the label ──────────────────────
      const y = labelBox.top + labelBox.height / 2;
      for (const fraction of [0.25, 0.5, 0.75]) {
        const x = labelBox.left + labelBox.width * fraction;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`label @${Math.round(fraction * 100)}%: page hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the divider`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== label && !label.contains(hit as Node)) {
          say(`label @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    // ── The rule spans its container ────────────────────────────────────────
    if (combo.orientation === 'horizontal') {
      const spanned = lines.reduce((sum, l) => sum + rect(l).width, 0)
        + (labels[0] ? rect(labels[0]).width : 0);
      if (spanned < hostBox.width - 40) {
        say(`the rule covers ${spanned.toFixed(0)}px of a ${hostBox.width.toFixed(0)}px host`);
      }
    } else if (rect(lines[0]).height < hostBox.height - EPS) {
      say(`vertical rule is ${rect(lines[0]).height.toFixed(0)}px in a`
        + ` ${hostBox.height.toFixed(0)}px host — it does not fill its parent`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

/**
 * The findings this tier pinned, as a predicate over the combo.
 *
 * VISUAL-MATRIX-divider-3 — the documented default `spacing: 'medium'` produces NO
 * margin at all. Every margin this component has lives under
 * `:host([spacing="…"])`, and an untouched default reflects no attribute
 * (docs/ai/properties.md), so `<snice-divider></snice-divider>` — the docs' own
 * first example — renders flush against its neighbours while the property
 * reads `'medium'`. Only an explicitly written `spacing="medium"` produces the
 * documented "Vertical margin". Per .ai/fuzzing.md the assertion is NOT
 * weakened and the component is NOT changed: the affected combos are declared
 * `test.fail()`, so the suite goes red the day it is fixed.
 */
function pinnedFindings(combo: Combo): string[] {
  return combo.spacing === 'medium' ? ['VISUAL-MATRIX-divider-3'] : [];
}

test.describe('divider visual matrix: layer 1', () => {
  for (const combo of combos) {
    const findings = pinnedFindings(combo);
    const title = findings.length ? `${findings.join(' ')} ${combo.id}` : combo.id;
    test(title, async () => {
      if (findings.length) test.fail();
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.orientation).toBe(combo.orientation);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('divider visual matrix: the spacing scale', () => {
  // The finding above is about the DEFAULT, not about the scale: an explicitly
  // written spacing must still produce its documented margin, on the documented
  // axis. This is the check that keeps VISUAL-MATRIX-divider-3 honest — if the whole
  // scale were broken, pinning the default alone would hide it.
  for (const spacing of ['none', 'small', 'large'] as Spacing[]) {
    test(`spacing="${spacing}" applies ${SPACING_PX[spacing]}px of vertical margin`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        orientation: 'horizontal', variant: 'solid', spacing, align: 'center',
        capped: false, text: '',
      } as any);
      const margins = await page.evaluate(() => {
        const cs = getComputedStyle(document.getElementById('subject')!);
        return [cs.marginTop, cs.marginBottom, cs.marginLeft, cs.marginRight];
      });
      expect(parseFloat(margins[0])).toBeCloseTo(SPACING_PX[spacing], 1);
      expect(parseFloat(margins[1])).toBeCloseTo(SPACING_PX[spacing], 1);
      expect(parseFloat(margins[2])).toBe(0);
      expect(parseFloat(margins[3])).toBe(0);
    });
  }

  // VISUAL-MATRIX-divider-3 at its most direct: the documented default, alone.
  test('VISUAL-MATRIX-divider-3: a default divider carries its documented medium margin', async () => {
    test.fail();
    await page.evaluate(() => (window as any).matrix.mount({}));
    const margin = await page.evaluate(() =>
      getComputedStyle(document.getElementById('subject')!).marginTop);
    expect(parseFloat(margin)).toBeCloseTo(SPACING_PX.medium, 1);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// three exist because "the line has a background-color" and "the line is
// visible" are different claims, and only pixels can tell them apart.

test.describe('divider visual matrix: marquee pixels', () => {
  test('a solid rule paints pixels that differ from the surface behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'horizontal', variant: 'solid', spacing: 'medium', capped: false, text: '',
    }));
    // Probe the middle of the rule, and a point two rows below it (the page
    // surface). A rule that "renders" but paints the surface colour is invisible.
    //
    // The capture is of the STAGE, not of `#subject`: a horizontal rule's own
    // box is one pixel tall, so a screenshot of the element contains no surface
    // to compare against and both probes would clamp onto the same row.
    const [line, surface] = await capture(
      page, '#stage', 'divider-solid',
      // The rule is a HAIRLINE: `y + height / 2` on a 1px box rounds to the row
      // BELOW it. The probe takes the line's own top edge, which is the only
      // row the rule occupies, and the surface six rows further down.
      `() => {
        const box = document.getElementById('subject').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y },
          { x: box.x + box.width / 2, y: box.y + box.height + 6 },
        ];
      }`,
    );
    expect(sameColor(line, surface),
      `rule painted ${line.join(',')}, identical to the surface`).toBe(false);
    // A separator nobody can see is not a separator. 1.2:1 is a deliberately
    // low bar — a hairline is meant to be subtle — but "subtle" is not "absent".
    expect(contrast(line, surface),
      `rule contrast against the surface is ${contrast(line, surface).toFixed(2)}:1`)
      .toBeGreaterThan(1.15);
  });

  test('color paints the colour that was asked for', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'horizontal', variant: 'solid', spacing: 'none',
      capped: false, text: '', color: 'rgb(220, 38, 38)',
    }));
    const [line] = await capture(
      page, '#subject', 'divider-color',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );
    // Anti-aliasing on a 1px rule can blend the edge, so the assertion is that
    // the painted pixel is unmistakably RED — dominant channel and hue — rather
    // than an exact triple.
    const [r, g, b] = line as RGB;
    expect(r > g + 40 && r > b + 40,
      `color="rgb(220,38,38)" painted rgb(${r},${g},${b})`).toBe(true);
  });

  test('a labelled rule paints its label text, not a line through it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      orientation: 'horizontal', variant: 'solid', spacing: 'medium',
      align: 'center', capped: false, text: 'OR',
    }));
    // Walk the label's mid-height row every 2px. If the rule painted through
    // the label, every step reads the rule's colour and the row is flat; if
    // no text painted, the row is flat white; real text leaves ink between
    // background gaps. Three lone probes at fixed fractions cannot make that
    // distinction deterministically — whether one lands on a glyph stroke is
    // font-metric luck (the glyphs sit at different x offsets per engine),
    // and the row itself is ink-bearing in every engine.
    const pixels = await capture(
      page, '#subject', 'divider-label',
      `(host) => {
        const label = host.shadowRoot.querySelector('[part~="text"]');
        const box = label.getBoundingClientRect();
        const points = [];
        for (let x = 1; x < box.width; x += 2) {
          points.push({ x: box.x + x, y: box.y + box.height / 2 });
        }
        return points;
      }`,
    );
    expect(pixels.length, 'the label box is too small to walk').toBeGreaterThan(4);
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `label's mid row painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
    const ink = pixels.filter(([r, g, b]) => r < 250 || g < 250 || b < 250);
    expect(ink.length, 'no ink on the label row — the text did not paint').toBeGreaterThan(0);
    expect(ink.length, 'the label row is solid ink — a rule painted through the text')
      .toBeLessThan(pixels.length);
  });
});
