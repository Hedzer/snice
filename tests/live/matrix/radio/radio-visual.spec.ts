/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-radio TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/radio, `npm run test:matrix`) owns the whole
 * form and group contract: group identity, roving tab stop, reset defaults,
 * required validity, the `input -> change -> radio-change` order. It cannot own
 * VISUAL truth, because happy-dom performs no layout — every box reads 0,
 * nothing is painted, and nothing can occlude anything.
 *
 * What is left is what the customer actually sees, and for a radio that is
 * unusually load-bearing: the SELECTED state is a dot drawn with
 * `transform: scale()`, so in a DOM test "checked" and "unchecked" render the
 * very same element with the very same attributes. Only a browser can tell you
 * whether the dot is there. `variant="block"` is likewise pure CSS — the same
 * parts, laid out as a card.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host, `part="radio"` and `part="label"` have real boxes, and the ring
 *     is SQUARE and fully rounded — a radio that stretches with its label is
 *     the classic flex bug, invisible to a DOM assertion;
 *   · `checked` really paints the dot inside the ring, and unchecked really
 *     collapses it to nothing;
 *   · `loading` really swaps the dot for `part="spinner"`;
 *   · the label shares a line with the ring and never sits on top of it;
 *   · `variant="block"` really renders a bordered, padded card that contains
 *     the ring, the label and the description, with the description BELOW the
 *     label and the slotted suffix pushed to the card's far end;
 *   · nothing paints over the ring or the label (elementFromPoint).
 *
 * ── Axis comparisons: the enum and state dimensions ────────────────────────
 *   Three sizes must really grow (ring and dot); a checked block card must
 *   differ from an unchecked one; disabled and invalid must each differ from
 *   the plain control.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A dot painted in the ring's own colour is a radio with no dot. Only pixels
 *   can tell "has a dot element" from "shows a dot".
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/radio/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Variant = 'default' | 'block';
type Modifier = 'none' | 'disabled' | 'loading' | 'invalid';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  checked: boolean;
  modifier: Modifier;
  description: boolean;
  suffix: boolean;
}

const SIZES: Size[] = ['small', 'medium', 'large'];
const VARIANTS: Variant[] = ['default', 'block'];
const MODIFIERS: Modifier[] = ['none', 'disabled', 'loading', 'invalid'];

/**
 * The cross: 2 variants x 3 sizes x {unchecked, checked} x 4 modifiers = 48
 * combos, with the documented `description` and the `suffix` slot rotated
 * through the block ones (both are block-only — see MATRIX-radio-1 in the DOM
 * matrix, which records that the default variant renders no suffix slot).
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const checked of [false, true]) {
        for (const modifier of MODIFIERS) {
          const block = variant === 'block';
          const description = block && n % 2 === 0;
          const suffix = block && n % 3 === 0;
          combos.push({
            id: `${variant}/${size}/${checked ? 'checked' : 'unchecked'}/${modifier}`
              + `/[${[description && 'description', suffix && 'suffix']
                .filter(Boolean).join(',') || 'plain'}]`,
            variant, size, checked, modifier, description, suffix,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo): Record<string, unknown> {
  return {
    variant: combo.variant,
    size: combo.size,
    checked: combo.checked,
    disabled: combo.modifier === 'disabled',
    loading: combo.modifier === 'loading',
    invalid: combo.modifier === 'invalid',
    description: combo.description,
    suffix: combo.suffix,
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
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const ring = part('radio');
    if (!ring) { say('no part="radio" rendered'); return problems; }
    const ringBox = rect(ring);
    if (ringBox.width <= 0 || ringBox.height <= 0) {
      say(`the ring renders at ${ringBox.width}x${ringBox.height}`);
      return problems;
    }
    const ringCs = getComputedStyle(ring);
    if (ringCs.visibility !== 'visible') say(`ring visibility "${ringCs.visibility}"`);

    // ── The ring is a circle ─────────────────────────────────────────────────
    if (Math.abs(ringBox.width - ringBox.height) > 1) {
      say(`the ring is ${ringBox.width.toFixed(1)}x${ringBox.height.toFixed(1)} — not square`);
    }
    if (parseFloat(ringCs.borderTopLeftRadius) < ringBox.height / 2 - 1
      && !ringCs.borderTopLeftRadius.includes('%')) {
      say(`ring border-radius ${ringCs.borderTopLeftRadius} on a ${ringBox.height.toFixed(1)}px box`);
    }
    if (ringBox.width < 12) say(`the ring is only ${ringBox.width.toFixed(1)}px across`);

    // ── The dot: the entire selected state ───────────────────────────────────
    const dot = part('dot');
    const spinner = part('spinner');
    if (combo.modifier === 'loading') {
      if (!spinner) {
        say('a loading radio rendered no part="spinner"');
      } else {
        const sb = rect(spinner);
        if (sb.width <= 0 || sb.height <= 0) say(`the spinner renders at ${sb.width}x${sb.height}`);
      }
    } else {
      if (!dot) {
        say('no part="dot" rendered');
      } else {
        const db = rect(dot);
        if (combo.checked) {
          if (db.width < 3 || db.height < 3) {
            say(`a checked radio's dot renders at ${db.width.toFixed(1)}x${db.height.toFixed(1)}`
              + ' — the selection is invisible');
          }
          if (db.left < ringBox.left - EPS || db.right > ringBox.right + EPS
            || db.top < ringBox.top - EPS || db.bottom > ringBox.bottom + EPS) {
            say('the dot escapes its ring');
          }
          const dcs = getComputedStyle(dot);
          if (Number(dcs.opacity) <= 0.05) say(`the dot's opacity is "${dcs.opacity}"`);
        } else if (db.width > 2 || db.height > 2) {
          say(`an unchecked radio still paints a ${db.width.toFixed(1)}x${db.height.toFixed(1)} dot`);
        }
      }
      if (spinner && rect(spinner).width > 0
        && getComputedStyle(spinner).display !== 'none') {
        say('a radio that is not loading still paints a spinner');
      }
    }

    // ── The label shares a line with the ring ────────────────────────────────
    const label = part('label');
    if (!label) {
      say('no part="label" rendered');
    } else {
      const lr = rect(label);
      if (lr.width <= 0 || lr.height <= 0) {
        say(`label renders at ${lr.width}x${lr.height}`);
      } else {
        const lcs = getComputedStyle(label);
        if (parseFloat(lcs.fontSize) < 9) say(`label font-size ${lcs.fontSize}`);
        if (lcs.visibility !== 'visible') say(`label visibility "${lcs.visibility}"`);
        if (lr.left < ringBox.right - EPS) {
          say(`label starts at x=${lr.left.toFixed(1)}, on top of a ring ending at`
            + ` x=${ringBox.right.toFixed(1)}`);
        }
        // Same line: the two boxes must overlap vertically. Exact centring is a
        // design choice; sharing a line is a legibility requirement.
        //
        // It applies to a single-line control only. A block card with a
        // description stacks label-over-description and centres the COLUMN on
        // the ring, so its label legitimately sits above the ring's middle —
        // that case is covered by the description ordering check instead.
        if (!(combo.variant === 'block' && combo.description)) {
          const overlap = Math.min(lr.bottom, ringBox.bottom) - Math.max(lr.top, ringBox.top);
          if (overlap < Math.min(lr.height, ringBox.height) * 0.5) {
            say(`the label (${lr.top.toFixed(1)}..${lr.bottom.toFixed(1)}) barely shares a line`
              + ` with the ring (${ringBox.top.toFixed(1)}..${ringBox.bottom.toFixed(1)})`);
          }
        }
      }
    }

    // ── variant="block": the documented card ─────────────────────────────────
    const content = part('content');
    if (combo.variant === 'block') {
      if (!content) {
        say('a block radio rendered no part="content"');
      } else {
        const wrapper = content.parentElement as HTMLElement;
        const wcs = getComputedStyle(wrapper);
        const wb = rect(wrapper);
        if (parseFloat(wcs.borderTopWidth) <= 0) {
          say(`the block card has no border (${wcs.borderTopWidth})`);
        }
        if (parseFloat(wcs.paddingTop) <= 0 || parseFloat(wcs.paddingLeft) <= 0) {
          say(`the block card has no padding (${wcs.paddingTop} / ${wcs.paddingLeft})`);
        }
        // A card is full-width by definition; a 520px stage makes that checkable.
        if (wb.width < hostBox.width - EPS) {
          say(`the block card is ${wb.width.toFixed(1)}px inside a`
            + ` ${hostBox.width.toFixed(1)}px host — it does not fill it`);
        }
        // Everything it owns must be inside it.
        for (const [name, el] of [['ring', ring], ['content', content]] as const) {
          const b = rect(el);
          if (b.left < wb.left - EPS || b.right > wb.right + EPS
            || b.top < wb.top - EPS || b.bottom > wb.bottom + EPS) {
            say(`the ${name} escapes the block card`);
          }
        }
      }

      const description = part('description');
      if (combo.description) {
        if (!description) {
          say('a block radio with a description rendered no part="description"');
        } else {
          const db = rect(description);
          const lr = label ? rect(label) : null;
          if (db.width <= 0 || db.height <= 0) {
            say(`description renders at ${db.width}x${db.height}`);
          } else if (lr && db.top < lr.bottom - EPS) {
            say(`the description (top ${db.top.toFixed(1)}) is not below the label`
              + ` (bottom ${lr.bottom.toFixed(1)})`);
          }
          if (description && parseFloat(getComputedStyle(description).fontSize)
            > parseFloat(getComputedStyle(label!).fontSize)) {
            say('the description is set larger than the label it explains');
          }
        }
      } else if (description && rect(description).height > 0) {
        say('a radio with no description still paints one');
      }

      // The slotted suffix is pushed to the far end of the card.
      const suffix = host.querySelector('[slot="suffix"]') as HTMLElement | null;
      if (combo.suffix) {
        if (!suffix) {
          say('the slotted suffix did not survive mounting');
        } else {
          const sb = rect(suffix);
          const wrapperBox = content ? rect(content.parentElement as HTMLElement) : hostBox;
          if (sb.width <= 0 || sb.height <= 0) {
            say(`the suffix renders at ${sb.width}x${sb.height} — the slot dropped it`);
          } else {
            const gap = wrapperBox.right - sb.right;
            const padding = parseFloat(getComputedStyle(
              content!.parentElement as HTMLElement).paddingRight);
            if (gap > padding + 2) {
              say(`the suffix stops ${gap.toFixed(1)}px short of the card's inner right edge`
                + ` (padding ${padding}px) — it was not pushed to the end`);
            }
            const contentBox = content ? rect(content) : null;
            if (contentBox && sb.left < contentBox.right - EPS) {
              say('the suffix overlaps the label/description column');
            }
          }
        }
      }
    } else if (content && rect(content).height > 0) {
      say('a default-variant radio rendered the block content column');
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    const input = part('input');
    const probes: Array<{ what: string; x: number; y: number }> = [
      { what: 'ring', x: ringBox.left + ringBox.width / 2, y: ringBox.top + ringBox.height / 2 },
    ];
    if (label && rect(label).width > 4) {
      const lr = rect(label);
      probes.push({ what: 'label', x: lr.left + lr.width * 0.5, y: lr.top + lr.height / 2 });
    }
    for (const probe of probes) {
      const outer = document.elementFromPoint(probe.x, probe.y);
      if (outer !== host) {
        say(`${probe.what}: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the radio`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(probe.x, probe.y) as Element | null;
      if (!hit) { say(`${probe.what}: shadow hit-test found nothing`); continue; }
      const acceptable = hit === input || hit === ring || ring.contains(hit)
        || (label && (hit === label || label.contains(hit)))
        || hit.tagName === 'LABEL';
      if (!acceptable) {
        say(`${probe.what} is occluded by <${hit.tagName.toLowerCase()}`
          + `${hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('radio visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(mounted.checked).toBe(combo.checked);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

async function rowRings(count: number): Promise<Array<{
  ringWidth: number; dotWidth: number; background: string; borderColor: string;
  cardBackground: string; cardBorder: string; opacity: string;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const sr = host.shadowRoot!;
      const ring = sr.querySelector('[part~="radio"]') as HTMLElement;
      const dot = sr.querySelector('[part~="dot"]') as HTMLElement | null;
      const card = ring.parentElement as HTMLElement;
      const cs = getComputedStyle(ring);
      const ccs = getComputedStyle(card);
      out.push({
        ringWidth: ring.getBoundingClientRect().width,
        dotWidth: dot ? dot.getBoundingClientRect().width : 0,
        background: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        cardBackground: ccs.backgroundColor,
        cardBorder: ccs.borderTopColor,
        opacity: ccs.opacity,
      });
    }
    return out;
  }, count);
}

test.describe('radio visual matrix: axis comparisons', () => {
  test('the three documented sizes really grow the ring and the dot', async () => {
    const row = SIZES.map(size => ({ size, checked: true }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const rings = await rowRings(count);
    for (let i = 1; i < rings.length; i++) {
      expect(rings[i].ringWidth,
        `ring size "${SIZES[i]}" (${rings[i].ringWidth.toFixed(1)}px) is not wider than`
        + ` "${SIZES[i - 1]}" (${rings[i - 1].ringWidth.toFixed(1)}px)`)
        .toBeGreaterThan(rings[i - 1].ringWidth);
      expect(rings[i].dotWidth,
        `dot size "${SIZES[i]}" (${rings[i].dotWidth.toFixed(1)}px) is not wider than`
        + ` "${SIZES[i - 1]}" (${rings[i - 1].dotWidth.toFixed(1)}px)`)
        .toBeGreaterThan(rings[i - 1].dotWidth);
    }
  });

  test('a selected block card really looks selected', async () => {
    const row = [
      { variant: 'block', name: 'axis-block-a' },
      { variant: 'block', name: 'axis-block-b', checked: true },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const rings = await rowRings(count);
    expect(`${rings[1].cardBackground}|${rings[1].cardBorder}`,
      'a selected block card paints exactly like an unselected one')
      .not.toBe(`${rings[0].cardBackground}|${rings[0].cardBorder}`);
  });

  test('disabled really looks different from the enabled twin', async () => {
    for (const state of [{}, { checked: true }]) {
      const row = [
        { ...state, name: 'axis-on' },
        { ...state, name: 'axis-off', disabled: true },
      ];
      const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
      const rings = await rowRings(count);
      const same = rings[0].background === rings[1].background
        && rings[0].borderColor === rings[1].borderColor
        && rings[0].opacity === rings[1].opacity;
      expect(same,
        `a disabled${(state as any).checked ? ' selected' : ''} radio is indistinguishable`
        + ` from the enabled one (${rings[1].background}, ${rings[1].borderColor},`
        + ` opacity ${rings[1].opacity})`).toBe(false);
    }
  });

  test('invalid really looks different from the valid twin', async () => {
    const row = [
      { name: 'axis-valid' },
      { name: 'axis-invalid', invalid: true },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const rings = await rowRings(count);
    expect(`${rings[1].background}|${rings[1].borderColor}`,
      'an invalid radio is indistinguishable from a valid one')
      .not.toBe(`${rings[0].background}|${rings[0].borderColor}`);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('radio visual matrix: marquee pixels', () => {
  const ringProbe = `(host) => {
    const ring = host.shadowRoot.querySelector('[part~="radio"]');
    const b = ring.getBoundingClientRect();
    const points = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 5; j++) {
        points.push({ x: b.x + (b.width * i) / 6, y: b.y + (b.height * j) / 6 });
      }
    }
    return points;
  }`;

  test('a selected radio really paints a dot, and an unselected one really does not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large' }));
    const empty = await capture(page, '#subject', 'radio-unselected', ringProbe);
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large', checked: true }));
    const selected = await capture(page, '#subject', 'radio-selected', ringProbe);
    // The gap probe: a point inside the ring but outside the dot, at 45° —
    // the ring's interior background, deliberately clear of BOTH edges (the
    // 5x5 grid's corner lands on the ring's own 2px arc at radius 13.2 of 14,
    // where the pixel is an antialias blend of ring and background, and
    // whether that blend equals the dot's blue is per-engine luck).
    const [dot, gap] = await capture(
      page, '#subject', 'radio-dot-vs-interior',
      `(host) => {
        const ring = host.shadowRoot.querySelector('[part~="radio"]');
        const b = ring.getBoundingClientRect();
        const g = b.width / 2 * 0.61 / Math.SQRT2;
        return [
          { x: b.x + b.width / 2, y: b.y + b.height / 2 },
          { x: b.x + b.width / 2 + g, y: b.y + b.height / 2 - g },
        ];
      }`,
    );

    const asString = (rows: number[][]) => rows.map(p => p.join(',')).join(' ');
    expect(asString(selected), 'a selected radio paints exactly like an unselected one')
      .not.toBe(asString(empty));

    // The dot is the WHOLE selected state, so it has to be visible against the
    // ring's own interior, not merely present.
    expect(sameColor(dot, gap),
      `the ring's centre painted ${dot.join(',')}, the same as its interior`)
      .toBe(false);
    expect(contrast(dot, gap),
      `dot/ring-interior contrast is ${contrast(dot, gap).toFixed(2)}:1`)
      .toBeGreaterThan(1.6);
  });

  test('the ring itself is visible against the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large' }));
    const [edge, surface] = await capture(
      page, '#stage', 'radio-ring-edge',
      `() => {
        const host = document.getElementById('subject');
        const ring = host.shadowRoot.querySelector('[part~="radio"]');
        const b = ring.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + 1 },
          { x: b.x + b.width / 2, y: b.bottom + 60 },
        ];
      }`,
    );
    expect(sameColor(edge, surface),
      `the ring's own edge painted ${edge.join(',')}, identical to the page surface`).toBe(false);
    expect(contrast(edge, surface),
      `ring/surface contrast is ${contrast(edge, surface).toFixed(2)}:1`).toBeGreaterThan(1.3);
  });

  test('a block card is a card — its fill differs from the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'block', size: 'large', checked: true, description: true, suffix: true,
    }));
    const [card, surface] = await capture(
      page, '#stage', 'radio-block-card',
      `() => {
        const host = document.getElementById('subject');
        const ring = host.shadowRoot.querySelector('[part~="radio"]');
        const wrapper = ring.parentElement;
        const b = wrapper.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + 0.5 },
          { x: b.x + b.width / 2, y: b.bottom + 60 },
        ];
      }`,
    );
    expect(sameColor(card, surface),
      `the card's border painted ${card.join(',')}, identical to the page surface —`
      + ' a card with no visible edge').toBe(false);
  });
});
