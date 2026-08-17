/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-switch TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/switch, `npm run test:matrix`) owns the form
 * contract: dirty checkedness, reset, FormData participation, validity, the
 * `input -> change -> switch-change` order. It cannot own VISUAL truth, because
 * happy-dom performs no layout — every box reads 0 and nothing is painted.
 *
 * For a switch that gap is unusually wide, because the component's headline
 * promises are GEOMETRIC and documented as such:
 *
 *   "State labels: track auto-sizes to the widest label (medium/large; small
 *    hides them); checked thumb travel follows actual track width, so
 *    ::part(track) width overrides stay aligned."
 *
 * Every clause of that sentence is a claim about pixels. A DOM test can only
 * see that two spans exist; it cannot see that the track grew to fit them, that
 * the thumb stops at the far end of a customer-widened track, or that the label
 * is not hiding underneath the thumb.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the track and thumb have real boxes, the thumb is round and stays inside
 *     the track;
 *   · `checked` really parks the thumb at the FAR end of the track and
 *     unchecked really parks it at the near end;
 *   · state labels really hide at `small`, and at medium/large the ACTIVE one
 *     (on when checked, off when unchecked) is really opaque, really inside the
 *     track, and really not underneath the thumb;
 *   · `loading` really paints `part="spinner"`;
 *   · the text label sits beside the track, never on it;
 *   · nothing paints over the track (elementFromPoint).
 *
 * ── Axis comparisons: the documented sizing promises ───────────────────────
 *   Sizes grow; state labels widen the track at medium/large and do NOT widen
 *   it at small; the track fits the WIDEST label; a `::part(track)` width
 *   override still leaves the checked thumb at the far end.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A thumb painted in the track's colour is a switch with no thumb, and an 8px
 *   bold state label is exactly the kind of text that fails contrast silently.
 *   Only pixels can judge either.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/switch/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Modifier = 'none' | 'disabled' | 'loading' | 'invalid';

interface Combo {
  id: string;
  size: Size;
  checked: boolean;
  stateLabels: boolean;
  modifier: Modifier;
}

const SIZES: Size[] = ['small', 'medium', 'large'];
const MODIFIERS: Modifier[] = ['none', 'disabled', 'loading', 'invalid'];
/** Mirrors the fixture's deliberately asymmetric pair. */
const LABEL_ON = 'ENABLED';
const LABEL_OFF = 'OFF';

/**
 * The cross: 3 sizes x {off, on} x {plain, state-labelled} x 4 modifiers = 48
 * combos. Sized to the component: a switch is a track, a thumb, two optional
 * in-track labels and one optional spinner, and the product that matters is
 * (how big) x (which way it points) x (does it carry text) x (what state).
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const checked of [false, true]) {
      for (const stateLabels of [false, true]) {
        for (const modifier of MODIFIERS) {
          combos.push({
            id: `${size}/${checked ? 'on' : 'off'}`
              + `/${stateLabels ? 'state-labels' : 'plain'}/${modifier}`,
            size, checked, stateLabels, modifier,
          });
        }
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo): Record<string, unknown> {
  return {
    size: combo.size,
    checked: combo.checked,
    stateLabels: combo.stateLabels,
    disabled: combo.modifier === 'disabled',
    loading: combo.modifier === 'loading',
    invalid: combo.modifier === 'invalid',
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

    const track = part('track');
    const thumb = part('thumb');
    if (!track) { say('no part="track" rendered'); return problems; }
    if (!thumb) { say('no part="thumb" rendered'); return problems; }

    const trackBox = rect(track);
    const thumbBox = rect(thumb);
    if (trackBox.width <= 0 || trackBox.height <= 0) {
      say(`the track renders at ${trackBox.width}x${trackBox.height}`);
      return problems;
    }
    if (thumbBox.width <= 0 || thumbBox.height <= 0) {
      say(`the thumb renders at ${thumbBox.width}x${thumbBox.height}`);
      return problems;
    }

    const trackCs = getComputedStyle(track);
    if (trackCs.visibility !== 'visible') say(`track visibility "${trackCs.visibility}"`);
    if (trackBox.width <= trackBox.height) {
      say(`the track is ${trackBox.width.toFixed(1)}x${trackBox.height.toFixed(1)}`
        + ' — a switch track has to be wider than it is tall');
    }

    // ── The thumb: round, inside the track ───────────────────────────────────
    if (Math.abs(thumbBox.width - thumbBox.height) > 1) {
      say(`the thumb is ${thumbBox.width.toFixed(1)}x${thumbBox.height.toFixed(1)} — not round`);
    }
    if (thumbBox.left < trackBox.left - EPS || thumbBox.right > trackBox.right + EPS
      || thumbBox.top < trackBox.top - EPS || thumbBox.bottom > trackBox.bottom + EPS) {
      say(`the thumb (${thumbBox.left.toFixed(1)}..${thumbBox.right.toFixed(1)}) escapes the`
        + ` track (${trackBox.left.toFixed(1)}..${trackBox.right.toFixed(1)})`);
    }

    // ── Travel: the documented resting places ────────────────────────────────
    // "checked thumb travel follows actual track width" — so the thumb rests at
    // the far end, with the same inset it has at the near end.
    const nearGap = thumbBox.left - trackBox.left;
    const farGap = trackBox.right - thumbBox.right;
    if (combo.checked) {
      if (farGap > nearGap + 1) {
        say(`a checked switch left the thumb ${farGap.toFixed(1)}px short of the far end`
          + ` while sitting ${nearGap.toFixed(1)}px from the near one`);
      }
    } else if (nearGap > farGap + 1) {
      say(`an unchecked switch left the thumb ${nearGap.toFixed(1)}px from the near end`
        + ` while sitting ${farGap.toFixed(1)}px from the far one`);
    }
    // And the two states must not be the same place, or the switch says nothing.
    if (Math.abs(nearGap - farGap) < 2 && trackBox.width - thumbBox.width > 6) {
      say(`the thumb sits mid-track (${nearGap.toFixed(1)} / ${farGap.toFixed(1)}) —`
        + ' on and off look the same');
    }

    // ── State labels ─────────────────────────────────────────────────────────
    const labelOn = part('label-on');
    const labelOff = part('label-off');
    if (combo.stateLabels) {
      if (!labelOn || !labelOff) {
        say('state labels were set but part="label-on"/"label-off" were not rendered');
      } else if (combo.size === 'small') {
        // Documented: small hides them.
        for (const [name, el] of [['label-on', labelOn], ['label-off', labelOff]] as const) {
          const cs = getComputedStyle(el);
          const b = rect(el);
          if (cs.display !== 'none' && b.width > 0 && Number(cs.opacity) > 0.05) {
            say(`size="small" still paints ${name} at ${b.width.toFixed(1)}px wide`);
          }
        }
      } else {
        const active = combo.checked ? labelOn : labelOff;
        const inactive = combo.checked ? labelOff : labelOn;
        const activeName = combo.checked ? 'label-on' : 'label-off';
        const activeCs = getComputedStyle(active);
        const activeBox = rect(active);

        if (Number(activeCs.opacity) < 0.99) {
          say(`the active ${activeName} is at opacity ${activeCs.opacity}`);
        }
        if (activeBox.width <= 0 || activeBox.height <= 0) {
          say(`the active ${activeName} renders at ${activeBox.width}x${activeBox.height}`);
        } else {
          if (activeBox.left < trackBox.left - EPS || activeBox.right > trackBox.right + EPS) {
            say(`the active ${activeName} escapes the track`);
          }
          // The documented reason the track auto-sizes at all: no label may end
          // up under the thumb.
          const overlap = Math.min(activeBox.right, thumbBox.right)
            - Math.max(activeBox.left, thumbBox.left);
          if (overlap > EPS) {
            say(`the active ${activeName} is ${overlap.toFixed(1)}px underneath the thumb`);
          }
        }
        if (Number(getComputedStyle(inactive).opacity) > 0.05) {
          say(`the inactive state label is visible at opacity`
            + ` ${getComputedStyle(inactive).opacity}`);
        }
      }
    } else if (labelOn && rect(labelOn).width > 0
      && Number(getComputedStyle(labelOn).opacity) > 0.05) {
      say('a switch with no state labels still paints one');
    }

    // ── loading: the documented spinner ──────────────────────────────────────
    const spinner = part('spinner');
    if (combo.modifier === 'loading') {
      if (!spinner) {
        say('a loading switch rendered no part="spinner"');
      } else if (rect(spinner).width <= 0) {
        say('the loading spinner renders at zero width');
      }
    } else if (spinner && rect(spinner).width > 0
      && getComputedStyle(spinner).display !== 'none') {
      say('a switch that is not loading still paints a spinner');
    }

    // ── The text label sits beside the track ─────────────────────────────────
    const label = part('label');
    if (label) {
      const lr = rect(label);
      if (lr.width > 0) {
        if (lr.left < trackBox.right - EPS) {
          say(`the text label starts at x=${lr.left.toFixed(1)}, on top of a track ending`
            + ` at x=${trackBox.right.toFixed(1)}`);
        }
        const overlap = Math.min(lr.bottom, trackBox.bottom) - Math.max(lr.top, trackBox.top);
        if (overlap < Math.min(lr.height, trackBox.height) * 0.5) {
          say('the text label does not share a line with the track');
        }
      }
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    const input = part('input');
    for (const fraction of [0.2, 0.5, 0.8]) {
      const x = trackBox.left + trackBox.width * fraction;
      const y = trackBox.top + trackBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`track @${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the switch`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (!hit) { say(`track @${Math.round(fraction * 100)}%: shadow hit-test found nothing`); continue; }
      const acceptable = hit === input || hit === track || track.contains(hit)
        || hit.tagName === 'LABEL';
      if (!acceptable) {
        say(`track @${Math.round(fraction * 100)}% is occluded by <${hit.tagName.toLowerCase()}`
          + `${hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('switch visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.size).toBe(combo.size);
      expect(mounted.checked).toBe(combo.checked);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * One mounted switch, measured. The fixture mounts a single subject at a fixed
 * stage origin, so a value measured after one mount is directly comparable with
 * a value measured after the next — every mount lands in the same place under
 * the same layout.
 */
async function measure(combo: Record<string, unknown>): Promise<{
  trackWidth: number; trackHeight: number; thumbWidth: number;
  nearGap: number; farGap: number; trackBackground: string; thumbBackground: string;
  opacity: string; sizerWidth: number;
}> {
  await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  return page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const track = sr.querySelector('[part~="track"]') as HTMLElement;
    const thumb = sr.querySelector('[part~="thumb"]') as HTMLElement;
    const sizer = sr.querySelector('.switch-track-sizer') as HTMLElement | null;
    const tb = track.getBoundingClientRect();
    const hb = thumb.getBoundingClientRect();
    return {
      trackWidth: tb.width,
      trackHeight: tb.height,
      thumbWidth: hb.width,
      nearGap: hb.left - tb.left,
      farGap: tb.right - hb.right,
      trackBackground: getComputedStyle(track).backgroundColor,
      thumbBackground: getComputedStyle(thumb).backgroundColor,
      opacity: getComputedStyle(track.parentElement as HTMLElement).opacity,
      sizerWidth: sizer ? sizer.getBoundingClientRect().width : 0,
    };
  });
}

test.describe('switch visual matrix: the documented sizing promises', () => {
  test('the three documented sizes really grow', async () => {
    const measured = [];
    for (const size of SIZES) measured.push(await measure({ size }));
    for (let i = 1; i < measured.length; i++) {
      expect(measured[i].trackWidth,
        `size "${SIZES[i]}" track (${measured[i].trackWidth.toFixed(1)}px) is not wider than`
        + ` "${SIZES[i - 1]}" (${measured[i - 1].trackWidth.toFixed(1)}px)`)
        .toBeGreaterThan(measured[i - 1].trackWidth);
      expect(measured[i].trackHeight,
        `size "${SIZES[i]}" track is not taller than "${SIZES[i - 1]}"`)
        .toBeGreaterThan(measured[i - 1].trackHeight);
    }
  });

  test('state labels widen the track at medium and large', async () => {
    for (const size of ['medium', 'large'] as Size[]) {
      const plain = await measure({ size });
      const labelled = await measure({ size, stateLabels: true });
      expect(labelled.trackWidth,
        `size "${size}": a state-labelled track (${labelled.trackWidth.toFixed(1)}px) is no wider`
        + ` than a plain one (${plain.trackWidth.toFixed(1)}px) — the labels cannot fit`)
        .toBeGreaterThan(plain.trackWidth);
    }
  });

  test('state labels do NOT widen the track at small — the documented exception', async () => {
    const plain = await measure({ size: 'small' });
    const labelled = await measure({ size: 'small', stateLabels: true });
    expect(labelled.trackWidth,
      `size="small" grew from ${plain.trackWidth.toFixed(1)}px to`
      + ` ${labelled.trackWidth.toFixed(1)}px for labels it never paints`)
      .toBeCloseTo(plain.trackWidth, 1);
  });

  test('the track fits the WIDEST label, in both states', async () => {
    // The fixture's pair is deliberately asymmetric: 'ENABLED' vs 'OFF'. A
    // track sized to the label it happens to be showing would be narrower in
    // the OFF state; the documented promise is that it is not.
    const off = await measure({ size: 'medium', stateLabels: true });
    const on = await measure({ size: 'medium', stateLabels: true, checked: true });
    expect(off.trackWidth,
      `the track is ${off.trackWidth.toFixed(1)}px showing "${LABEL_OFF}" but`
      + ` ${on.trackWidth.toFixed(1)}px showing "${LABEL_ON}" — it resizes as it toggles`)
      .toBeCloseTo(on.trackWidth, 1);

    // And it really is the wide label that set the width.
    const widest = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const spans = [...host.shadowRoot!.querySelectorAll('.switch-track-sizer > span')];
      return Math.max(...spans.map(s => s.getBoundingClientRect().width));
    });
    expect(on.trackWidth,
      `the track (${on.trackWidth.toFixed(1)}px) is narrower than its widest label`
      + ` (${widest.toFixed(1)}px) plus the thumb (${on.thumbWidth.toFixed(1)}px)`)
      .toBeGreaterThan(widest + on.thumbWidth);
  });

  test('a ::part(track) width override still parks the checked thumb at the far end', async () => {
    // The documented promise in full: "checked thumb travel follows actual track
    // width, so ::part(track) width overrides stay aligned." The fixture owns
    // the override as real customer CSS (`::part(track) { width: 120px }`).
    const plain = await measure({ size: 'medium', checked: true });
    const wide = await measure({ size: 'medium', checked: true, partOverride: true });
    expect(wide.trackWidth,
      'the ::part(track) override did not reach the track').toBeGreaterThan(plain.trackWidth);
    expect(wide.farGap,
      `on a ${wide.trackWidth.toFixed(1)}px overridden track the checked thumb stopped`
      + ` ${wide.farGap.toFixed(1)}px short of the far end (near gap`
      + ` ${wide.nearGap.toFixed(1)}px) — travel did not follow the width`)
      .toBeLessThanOrEqual(wide.nearGap + 1);
  });

  test('on and off really paint different tracks', async () => {
    const off = await measure({ size: 'medium' });
    const on = await measure({ size: 'medium', checked: true });
    expect(on.trackBackground, 'a checked track paints exactly like an unchecked one')
      .not.toBe(off.trackBackground);
  });

  test('disabled and invalid each really look different from the plain control', async () => {
    const plain = await measure({ size: 'medium' });
    const disabled = await measure({ size: 'medium', disabled: true });
    const invalid = await measure({ size: 'medium', invalid: true });
    expect(`${disabled.trackBackground}|${disabled.opacity}`,
      'a disabled switch is indistinguishable from an enabled one')
      .not.toBe(`${plain.trackBackground}|${plain.opacity}`);
    expect(`${invalid.trackBackground}|${invalid.opacity}`,
      'an invalid switch is indistinguishable from a valid one')
      .not.toBe(`${plain.trackBackground}|${plain.opacity}`);
  });

  test('toggling a live switch moves the thumb across the track', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large' }));
    const before = await page.evaluate(() => {
      const t = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="thumb"]') as HTMLElement;
      return t.getBoundingClientRect().left;
    });
    const checked = await page.evaluate(() => (window as any).matrix.setChecked(true));
    expect(checked).toBe(true);
    const after = await page.evaluate(() => {
      const t = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="thumb"]') as HTMLElement;
      return t.getBoundingClientRect().left;
    });
    expect(after,
      `the thumb sat at x=${before.toFixed(1)} and stayed at x=${after.toFixed(1)}`
      + ' after the switch was turned on').toBeGreaterThan(before + 4);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('switch visual matrix: marquee pixels', () => {
  test('the thumb is visible against the track it sits on, in both states', async () => {
    for (const checked of [false, true]) {
      await page.evaluate(c => (window as any).matrix.mount(c), { size: 'large', checked } as any);
      const [thumbPixel, trackPixel] = await capture(
        page, '#subject', `switch-thumb-${checked ? 'on' : 'off'}`,
        `(host) => {
          const sr = host.shadowRoot;
          const track = sr.querySelector('[part~="track"]');
          const thumb = sr.querySelector('[part~="thumb"]');
          const tb = track.getBoundingClientRect();
          const hb = thumb.getBoundingClientRect();
          // The thumb's middle, and a point on the track on the OTHER side of it.
          const away = hb.x < tb.x + tb.width / 2 ? tb.right - 3 : tb.x + 3;
          return [
            { x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 },
            { x: away, y: tb.y + tb.height / 2 },
          ];
        }`,
      );
      expect(sameColor(thumbPixel, trackPixel),
        `${checked ? 'checked' : 'unchecked'}: the thumb painted ${thumbPixel.join(',')},`
        + ' identical to the track behind it').toBe(false);
      expect(contrast(thumbPixel, trackPixel),
        `${checked ? 'checked' : 'unchecked'}: thumb/track contrast is`
        + ` ${contrast(thumbPixel, trackPixel).toFixed(2)}:1`).toBeGreaterThan(1.5);
    }
  });

  test('a state label is readable on the track it is printed on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', stateLabels: true, checked: true,
    }));
    const pixels = await capture(
      page, '#subject', 'switch-state-label',
      `(host) => {
        const label = host.shadowRoot.querySelector('[part~="label-on"]');
        const b = label.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: b.x + (b.width * i) / 13, y: b.y + b.height / 2 });
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `the state label's box painted one flat colour (${[...distinct]}) — no text is there`)
      .toBeGreaterThan(1);
    const sorted = [...pixels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const worst = contrast(sorted[0], sorted[sorted.length - 1]);
    // The live bar: a UI label has to be distinguishable from what it is
    // printed on at all. Anti-aliasing on 9px glyphs blends the extremes, so
    // the painted-pixel figure is a floor, not the token pair's true ratio.
    expect(worst, `state-label/track pixel contrast is ${worst.toFixed(2)}:1`)
      .toBeGreaterThan(3);

    /**
     * FINDING VISUAL-MATRIX-switch-1.
     *
     * The exact token pair the component chose for the in-track state label —
     * `--snice-color-text-inverse` on `--snice-color-primary` — resolves to
     * 4.35:1, below the 4.5:1 WCAG AA bar for text this size. The stylesheet
     * states the intent in its own words ("the tiny bold text needs every bit
     * of the token pair's contrast (AA for small text)"), and 9px bold
     * uppercase is unambiguously small text, so the rendered result misses the
     * target the component set for itself.
     *
     * Asserted at full strength as a FINDING: the shortfall must still
     * reproduce. Re-token the pair and this fails until it is deleted.
     */
    const tokens = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const label = sr.querySelector('[part~="label-on"]') as HTMLElement;
      const track = sr.querySelector('[part~="track"]') as HTMLElement;
      const parse = (value: string) =>
        value.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number];
      return {
        text: parse(getComputedStyle(label).color),
        track: parse(getComputedStyle(track).backgroundColor),
      };
    });
    const tokenContrast = contrast(tokens.text, tokens.track);
    expect(tokenContrast,
      `VISUAL-MATRIX-switch-1 no longer reproduces: the state-label token pair now measures`
      + ` ${tokenContrast.toFixed(2)}:1 — delete this finding block`)
      .toBeLessThan(4.5);
  });

  test('an on switch and an off switch paint different tracks', async () => {
    const sample = async (checked: boolean) => {
      await page.evaluate(c => (window as any).matrix.mount(c), { size: 'large', checked } as any);
      return capture(
        page, '#subject', `switch-track-${checked ? 'on' : 'off'}`,
        `(host) => {
          const track = host.shadowRoot.querySelector('[part~="track"]');
          const b = track.getBoundingClientRect();
          // Sample the end the thumb is NOT resting on, plus the middle.
          return [
            { x: b.x + b.width * 0.5, y: b.y + b.height / 2 },
            { x: b.x + 2, y: b.y + b.height / 2 },
            { x: b.right - 2, y: b.y + b.height / 2 },
          ];
        }`,
      );
    };
    const off = await sample(false);
    const on = await sample(true);
    expect(on.map(p => p.join(',')).join(' '),
      'the on and off tracks paint the same pixels — the state is invisible')
      .not.toBe(off.map(p => p.join(',')).join(' '));
  });
});
