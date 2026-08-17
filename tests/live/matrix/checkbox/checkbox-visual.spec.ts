/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-checkbox TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/checkbox, `npm run test:matrix`) owns the whole
 * form contract: checked/default dirtiness, FormData participation, validity,
 * reset, restoration and the event order. It cannot own VISUAL truth, because
 * happy-dom performs no layout — every box reads 0, nothing is painted, and
 * nothing can occlude anything.
 *
 * What is left over is exactly what a customer sees: a box, a mark inside it, a
 * label beside it, and a hit target big enough to use. `size`, `checked`,
 * `indeterminate`, `disabled`, `invalid` and `loading` are all CSS rules over a
 * native input that is deliberately transparent, so the browser is the only
 * place any of it can be verified.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host, `part="checkbox"` and `part="label"` have real boxes;
 *   · the visual box is SQUARE — a checkbox that stretches with its label is
 *     the classic flex bug, and no DOM assertion can see it;
 *   · the transparent native `part="input"` covers the whole control, so the
 *     documented "click the label or the box" hit target really exists;
 *   · the label sits BESIDE the box — never on top of it — and is vertically
 *     aligned with it;
 *   · `loading` really paints `part="spinner"`, and its absence really paints
 *     none;
 *   · nothing paints over the box or the label (elementFromPoint).
 *
 * ── Axis comparisons: the enum and state dimensions ────────────────────────
 *   Three sizes must really grow; checked, indeterminate and unchecked must be
 *   three DIFFERENT appearances; disabled and invalid must each differ from the
 *   plain control.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A checked box whose tick is painted in the fill colour is a box with no
 *   tick. Only pixels can tell "has a checkmark element" from "shows a
 *   checkmark".
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/checkbox/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Mark = 'unchecked' | 'checked' | 'indeterminate';
type Modifier = 'none' | 'disabled' | 'loading' | 'invalid';

interface Combo {
  id: string;
  size: Size;
  mark: Mark;
  modifier: Modifier;
  required: boolean;
  labelled: boolean;
}

const SIZES: Size[] = ['small', 'medium', 'large'];
const MARKS: Mark[] = ['unchecked', 'checked', 'indeterminate'];
const MODIFIERS: Modifier[] = ['none', 'disabled', 'loading', 'invalid'];

/**
 * The cross: 3 sizes x 3 mark states x 4 modifiers = 36 combos, with `required`
 * and the label rotated across it.
 *
 * Sized to the component. A checkbox renders one box, one optional mark, one
 * optional spinner and one optional label; the product that matters is (how big)
 * x (what it shows) x (what state it is in), and everything else rides along.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const size of SIZES) {
    for (const mark of MARKS) {
      for (const modifier of MODIFIERS) {
        const required = n % 3 === 0;
        // A label-less checkbox is a real usage (a table's select-all cell), so
        // it is rotated in rather than left untested.
        const labelled = n % 6 !== 5;
        combos.push({
          id: `${size}/${mark}/${modifier}`
            + `/[${labelled ? 'labelled' : 'bare'}${required ? ',required' : ''}]`,
          size, mark, modifier, required, labelled,
        });
        n++;
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo): Record<string, unknown> {
  return {
    size: combo.size,
    checked: combo.mark === 'checked',
    indeterminate: combo.mark === 'indeterminate',
    disabled: combo.modifier === 'disabled',
    loading: combo.modifier === 'loading',
    invalid: combo.modifier === 'invalid',
    required: combo.required,
    label: combo.labelled ? undefined : false,
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1: one evaluate per combo; every violation reported at once. */
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
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display === 'none') say('host computed display is none');
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const box = part('checkbox');
    if (!box) { say('no part="checkbox" rendered'); return problems; }
    const boxRect = rect(box);
    if (boxRect.width <= 0 || boxRect.height <= 0) {
      say(`the visual box renders at ${boxRect.width}x${boxRect.height}`);
      return problems;
    }
    const boxCs = getComputedStyle(box);
    if (boxCs.visibility !== 'visible') say(`visual box visibility "${boxCs.visibility}"`);
    if (Number(boxCs.opacity) <= 0.05) say(`visual box opacity "${boxCs.opacity}"`);

    // ── Square ───────────────────────────────────────────────────────────────
    // A checkbox that stretches to its label's height is the classic flex
    // mistake, and it is invisible to every DOM-only assertion.
    if (Math.abs(boxRect.width - boxRect.height) > 1) {
      say(`the visual box is ${boxRect.width.toFixed(1)}x${boxRect.height.toFixed(1)} — not square`);
    }
    // Big enough to see and to hit.
    if (boxRect.width < 12) say(`the visual box is only ${boxRect.width.toFixed(1)}px across`);

    // ── The native input is the hit target ───────────────────────────────────
    // Documented: labels, Space, and pointer activation all reach a real native
    // input. It is transparent by design, so "it is there" is only checkable as
    // "it covers the control".
    const input = part('input');
    if (!input) {
      say('no part="input" rendered');
    } else {
      const ir = rect(input);
      if (ir.width <= 0 || ir.height <= 0) {
        say(`the native input renders at ${ir.width}x${ir.height} — nothing to click`);
      } else if (ir.left > boxRect.left + EPS || ir.right < boxRect.right - EPS
        || ir.top > boxRect.top + EPS || ir.bottom < boxRect.bottom - EPS) {
        say(`the native input (${ir.width.toFixed(1)}x${ir.height.toFixed(1)}) does not cover`
          + ` the visual box (${boxRect.width.toFixed(1)}x${boxRect.height.toFixed(1)})`);
      }
    }

    // ── loading: the documented spinner ──────────────────────────────────────
    const spinner = part('spinner');
    if (combo.modifier === 'loading') {
      if (!spinner) {
        say('loading checkbox rendered no part="spinner"');
      } else {
        const sb = rect(spinner);
        if (sb.width <= 0 || sb.height <= 0) say(`loading spinner renders at ${sb.width}x${sb.height}`);
        if (getComputedStyle(spinner).display === 'none') say('loading spinner display is none');
      }
    } else if (spinner && rect(spinner).width > 0
      && getComputedStyle(spinner).display !== 'none') {
      say('a checkbox that is not loading still paints a spinner');
    }

    // ── The label sits BESIDE the box ────────────────────────────────────────
    const label = part('label');
    if (combo.labelled) {
      if (!label) {
        say('no part="label" rendered for a labelled checkbox');
      } else {
        const lr = rect(label);
        if (lr.width <= 0 || lr.height <= 0) {
          say(`label renders at ${lr.width}x${lr.height}`);
        } else {
          const lcs = getComputedStyle(label);
          if (parseFloat(lcs.fontSize) < 9) say(`label font-size ${lcs.fontSize}`);
          if (lcs.visibility !== 'visible') say(`label visibility "${lcs.visibility}"`);
          const alpha = lcs.color.startsWith('rgba')
            ? Number(lcs.color.split(',')[3]?.replace(')', '') ?? '1') : 1;
          if (alpha <= 0.05) say(`label text is transparent (${lcs.color})`);

          if (lr.left < boxRect.right - EPS) {
            say(`label starts at x=${lr.left.toFixed(1)}, on top of a box ending at`
              + ` x=${boxRect.right.toFixed(1)}`);
          }
          // Aligned with the box, not floating above or below it.
          const boxMid = boxRect.top + boxRect.height / 2;
          const labelMid = lr.top + lr.height / 2;
          if (Math.abs(boxMid - labelMid) > Math.max(4, lr.height * 0.3)) {
            say(`label centre y=${labelMid.toFixed(1)} is not aligned with the box`
              + ` centre y=${boxMid.toFixed(1)}`);
          }
          // Both inside the host that owns them.
          if (lr.right > hostBox.right + EPS) say('label escapes the host horizontally');
        }
      }
    } else if (label && rect(label).width > 0 && (label.textContent ?? '').trim() !== '') {
      say(`an unlabelled checkbox still paints the text "${(label.textContent ?? '').trim()}"`);
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    const probes: Array<{ what: string; x: number; y: number }> = [
      { what: 'box', x: boxRect.left + boxRect.width / 2, y: boxRect.top + boxRect.height / 2 },
    ];
    if (combo.labelled && label && rect(label).width > 4) {
      const lr = rect(label);
      probes.push({ what: 'label', x: lr.left + lr.width * 0.5, y: lr.top + lr.height / 2 });
    }
    for (const probe of probes) {
      const outer = document.elementFromPoint(probe.x, probe.y);
      if (outer !== host) {
        say(`${probe.what}: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the checkbox`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(probe.x, probe.y) as Element | null;
      if (!hit) { say(`${probe.what}: shadow hit-test found nothing`); continue; }
      // The transparent native input legitimately sits on top of everything —
      // that is what makes the control clickable.
      const acceptable = hit === input || hit === box || box.contains(hit)
        || (label && (hit === label || label.contains(hit)));
      if (!acceptable) {
        say(`${probe.what} is occluded by <${hit.tagName.toLowerCase()}`
          + `${hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('checkbox visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.size).toBe(combo.size);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

async function rowBoxes(count: number): Promise<Array<{
  background: string; borderColor: string; width: number; height: number; opacity: string;
  labelColor: string;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const sr = host.shadowRoot!;
      const box = sr.querySelector('[part~="checkbox"]') as HTMLElement;
      const label = sr.querySelector('[part~="label"]') as HTMLElement | null;
      const cs = getComputedStyle(box);
      const rect = box.getBoundingClientRect();
      out.push({
        background: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        width: rect.width,
        height: rect.height,
        opacity: String(Number(cs.opacity)
          * Number(getComputedStyle(box.parentElement as HTMLElement).opacity)),
        labelColor: label ? getComputedStyle(label).color : '',
      });
    }
    return out;
  }, count);
}

test.describe('checkbox visual matrix: axis comparisons', () => {
  test('the three documented sizes really grow', async () => {
    const row = SIZES.map(size => ({ size }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const boxes = await rowBoxes(count);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].width,
        `size "${SIZES[i]}" (${boxes[i].width.toFixed(1)}px) is not wider than`
        + ` "${SIZES[i - 1]}" (${boxes[i - 1].width.toFixed(1)}px)`)
        .toBeGreaterThan(boxes[i - 1].width);
    }
  });

  test('a checked box fills differently from an empty one', async () => {
    const row = [{}, { checked: true }];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const boxes = await rowBoxes(count);
    expect(`${boxes[1].background}|${boxes[1].borderColor}`,
      'a checked box paints the same chrome as an empty one')
      .not.toBe(`${boxes[0].background}|${boxes[0].borderColor}`);
    // The indeterminate state keeps the empty box's chrome and distinguishes
    // itself by the dash INSIDE it, so it is judged on pixels (marquee) rather
    // than on computed colours here.
  });

  test('disabled really looks different from the enabled twin', async () => {
    for (const state of [{}, { checked: true }]) {
      const row = [{ ...state }, { ...state, disabled: true }];
      const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
      const boxes = await rowBoxes(count);
      const same = boxes[0].background === boxes[1].background
        && boxes[0].borderColor === boxes[1].borderColor
        && boxes[0].opacity === boxes[1].opacity
        && boxes[0].labelColor === boxes[1].labelColor;
      expect(same,
        `a disabled${(state as any).checked ? ' checked' : ''} checkbox is indistinguishable`
        + ` from the enabled one (${boxes[1].background}, ${boxes[1].borderColor},`
        + ` opacity ${boxes[1].opacity})`).toBe(false);
    }
  });

  test('invalid really looks different from the valid twin', async () => {
    const row = [{}, { invalid: true }];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const boxes = await rowBoxes(count);
    expect(`${boxes[1].background}|${boxes[1].borderColor}`,
      'an invalid checkbox is indistinguishable from a valid one')
      .not.toBe(`${boxes[0].background}|${boxes[0].borderColor}`);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('checkbox visual matrix: marquee pixels', () => {
  test('a checked box really paints a mark inside itself', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large', checked: true }));
    const pixels = await capture(
      page, '#subject', 'checkbox-checked-mark',
      `(host) => {
        const box = host.shadowRoot.querySelector('[part~="checkbox"]');
        const b = box.getBoundingClientRect();
        const points = [];
        // A 5x5 lattice across the box: a tick is a thin diagonal, so a single
        // centre probe can miss it entirely.
        for (let i = 1; i <= 5; i++) {
          for (let j = 1; j <= 5; j++) {
            points.push({ x: b.x + (b.width * i) / 6, y: b.y + (b.height * j) / 6 });
          }
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `the checked box painted one flat colour (${[...distinct]}) — there is no mark in it`)
      .toBeGreaterThan(1);
    const sorted = [...pixels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const worst = contrast(sorted[0], sorted[sorted.length - 1]);
    expect(worst, `mark/fill contrast inside the box is ${worst.toFixed(2)}:1`)
      .toBeGreaterThan(2);
  });

  test('unchecked, checked and indeterminate paint three different boxes', async () => {
    const sample = async (combo: Record<string, unknown>, name: string) => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      return capture(
        page, '#subject', name,
        `(host) => {
          const box = host.shadowRoot.querySelector('[part~="checkbox"]');
          const b = box.getBoundingClientRect();
          const points = [];
          for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 5; j++) {
              points.push({ x: b.x + (b.width * i) / 6, y: b.y + (b.height * j) / 6 });
            }
          }
          return points;
        }`,
      );
    };
    const empty = await sample({ size: 'large' }, 'checkbox-mark-unchecked');
    const checked = await sample({ size: 'large', checked: true }, 'checkbox-mark-checked');
    const mixed = await sample({ size: 'large', indeterminate: true }, 'checkbox-mark-indeterminate');
    const asString = (rows: number[][]) => rows.map(p => p.join(',')).join(' ');

    // The three documented states are three things a customer must be able to
    // tell apart at a glance. Computed colours cannot show this — the
    // indeterminate box keeps the empty box's chrome and differs only by the
    // dash painted inside it — so it is asserted on the pixels themselves.
    expect(asString(checked), 'a checked box paints exactly like an empty one')
      .not.toBe(asString(empty));
    expect(asString(mixed), 'an indeterminate box paints exactly like an empty one')
      .not.toBe(asString(empty));
    expect(asString(mixed), 'an indeterminate box paints exactly like a checked one')
      .not.toBe(asString(checked));
    // And it is a mark, not an empty box.
    expect(new Set(mixed.map(p => p.join(','))).size,
      'the indeterminate box painted one flat colour — there is no dash in it')
      .toBeGreaterThan(1);
  });

  test('an unchecked box is visible against the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large' }));
    const [edge, surface] = await capture(
      page, '#stage', 'checkbox-unchecked-edge',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="checkbox"]');
        const b = box.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + 0.5 },
          { x: b.x + b.width / 2, y: b.bottom + 40 },
        ];
      }`,
    );
    expect(sameColor(edge, surface),
      `the box's own edge painted ${edge.join(',')}, identical to the page surface —`
      + ' an empty checkbox nobody can see').toBe(false);
    expect(contrast(edge, surface),
      `box/surface contrast is ${contrast(edge, surface).toFixed(2)}:1`).toBeGreaterThan(1.3);
  });
});
