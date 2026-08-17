/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-segmented-control TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/segmented-control, `npm run test:matrix`) owns
 * value truth: which option is selected, which segment carries `aria-checked`,
 * the host-disabled vs option-disabled split, and the "assigned before
 * dispatch" event contract. It cannot own the ONE thing this component is
 * named for.
 *
 * "Multi-option switcher with SLIDING INDICATOR" — the indicator is positioned
 * by measuring `offsetWidth`/`offsetLeft` of the selected segment inside a
 * `requestAnimationFrame`. In happy-dom every one of those measurements is
 * zero, so the DOM tier literally cannot tell a correctly placed indicator from
 * one stuck at the origin. That is what this tier exists for.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is `inline-block` and the track a positioned `inline-flex` row;
 *   · every segment has a real box, they run left to right without overlapping,
 *     and all of them sit inside the track;
 *   · THE INDICATOR COVERS THE SELECTED SEGMENT — same left edge, same width —
 *     and is fully transparent when `value` names no option at all;
 *   · the indicator is BEHIND the segments and takes no pointer events, so a
 *     hit-test at a segment's centre finds the segment, never the indicator;
 *   · the selected segment takes the primary ink and the unselected ones the
 *     secondary ink, which is the only cue that survives the indicator being a
 *     plain surface;
 *   · a disabled option is dimmed and refuses the pointer; a disabled CONTROL
 *     dims the whole track and takes no pointer events at all;
 *   · an option icon is a real, painted image to the left of its label.
 *
 * ── Layer 2 (a pinned handful): real screenshots + a real click ────────────
 *   The indicator "animates between selections", which is a claim about two
 *   different measurements over time, and a claim that the destination is the
 *   segment the user pressed. And "the indicator is a different surface from
 *   the track" is a claim only pixels can settle — a component that painted the
 *   indicator in the track's own colour passes every computed-style assertion
 *   while showing the user nothing.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/segmented-control/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Shape = 'plain' | 'first-off' | 'all-off' | 'iconed';
type ValueKind = 'unset' | 'valid' | 'unknown';

interface Option { value: string; label: string; disabled?: boolean; icon?: string }

const SIZES: Size[] = ['small', 'medium', 'large'];
const SHAPES: Shape[] = ['plain', 'first-off', 'all-off', 'iconed'];
const VALUE_KINDS: ValueKind[] = ['unset', 'valid', 'unknown'];

/**
 * The option sets, mirrored from the DOM matrix's own shapes so a combo id
 * means the same thing in both tiers. The icon SOURCE differs — see the
 * fixture — because this tier measures a painted box rather than an attribute.
 */
const SHAPE_OPTIONS: Record<Shape, Option[]> = {
  plain: [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ],
  'first-off': [
    { value: 'day', label: 'Day', disabled: true },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ],
  'all-off': [
    { value: 'day', label: 'Day', disabled: true },
    { value: 'week', label: 'Week', disabled: true },
  ],
  iconed: [
    { value: 'day', label: 'Day', icon: 'icon' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month', icon: 'icon' },
  ],
};

interface Combo {
  id: string;
  size: Size;
  shape: Shape;
  valueKind: ValueKind;
  disabled: boolean;
  /** The `value` the page author assigns, before the component's own rules. */
  value: string;
  /** The value the DOCS say the control settles on. */
  expectedValue: string;
  /** The index of the segment the indicator must cover, or -1 for none. */
  selectedIndex: number;
  options: Option[];
}

/**
 * "First non-disabled option selected if no value set" — the documented
 * auto-selection rule, and the only place the component writes its own value.
 * An `unknown` value is NOT unset, so it survives verbatim and selects nothing.
 */
function settledValue(kind: ValueKind, options: Option[]): string {
  if (kind === 'unknown') return 'nope';
  if (kind === 'valid') return options[options.length - 1].value;
  return options.find(option => !option.disabled)?.value ?? '';
}

/**
 * The cross: size (3) x option shape (4) x initial value (3) x host disabled
 * (2) = 72 combos.
 *
 * The axes are not independent, which is why they are crossed rather than
 * sampled: a size changes the box the indicator has to match, the shape decides
 * WHICH segment the auto-selection rule lands on (and `all-off` leaves nothing
 * to select at all), an unknown value leaves the indicator with nothing to
 * cover, and a disabled host has to dim the whole track without moving it.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const shape of SHAPES) {
      for (const valueKind of VALUE_KINDS) {
        for (const disabled of [false, true]) {
          const options = SHAPE_OPTIONS[shape];
          const expectedValue = settledValue(valueKind, options);
          combos.push({
            id: `${size}/${shape}/${valueKind}/${disabled ? 'disabled' : 'enabled'}`,
            size,
            shape,
            valueKind,
            disabled,
            value: valueKind === 'unset' ? '' : settledValue(valueKind, options),
            expectedValue,
            selectedIndex: options.findIndex(option => option.value === expectedValue),
            options,
          });
        }
      }
    }
  }
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
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const token = (name: string) => (window as any).matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'inline-block') {
      say(`host computed display "${hostCs.display}", expected "inline-block"`);
    }

    const track = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!track) { say('no part="base" rendered'); return problems; }
    const trackBox = rect(track);
    const trackCs = getComputedStyle(track);
    if (trackBox.width <= 0 || trackBox.height <= 0) {
      say(`track renders at ${trackBox.width}x${trackBox.height}`);
      return problems;
    }
    if (trackCs.display !== 'inline-flex') {
      say(`track display "${trackCs.display}", expected "inline-flex"`);
    }
    // The indicator is absolutely positioned; without a positioned track it
    // would escape to the viewport.
    if (trackCs.position !== 'relative') {
      say(`track position "${trackCs.position}", expected "relative"`);
    }
    if (track.getAttribute('role') !== 'radiogroup') {
      say(`track role "${track.getAttribute('role')}", expected "radiogroup"`);
    }

    // ── A disabled CONTROL dims the whole track and refuses the pointer ─────
    if (combo.disabled) {
      if (Number(trackCs.opacity) >= 1) {
        say(`a disabled control painted the track at full opacity ${trackCs.opacity}`);
      }
      if (trackCs.pointerEvents !== 'none') {
        say(`a disabled control still takes pointer events ("${trackCs.pointerEvents}")`);
      }
    } else if (Number(trackCs.opacity) !== 1) {
      say(`an enabled control dimmed its track to opacity ${trackCs.opacity}`);
    }

    // ── The segments: a real row, left to right, inside the track ───────────
    const segments = [...sr.querySelectorAll('[part~="segment"]')] as HTMLElement[];
    if (segments.length !== combo.options.length) {
      say(`${segments.length} segments rendered, expected ${combo.options.length}`);
      return problems;
    }

    const primary = token('--snice-color-text');
    const secondary = token('--snice-color-text-secondary');
    let previousRight = -Infinity;
    const boxes: DOMRect[] = [];

    for (const [index, segment] of segments.entries()) {
      const option = combo.options[index];
      const box = rect(segment);
      boxes.push(box);
      if (box.width <= 0 || box.height <= 0) {
        say(`segment ${index} (${option.label}) renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.left < previousRight - EPS) {
        say(`segment ${index} (left ${box.left.toFixed(1)}) overlaps segment ${index - 1}`
          + ` (right ${previousRight.toFixed(1)})`);
      }
      previousRight = box.right;
      if (box.left < trackBox.left - EPS || box.right > trackBox.right + EPS) {
        say(`segment ${index} (${box.left.toFixed(0)}…${box.right.toFixed(0)}) escapes the track`
          + ` (${trackBox.left.toFixed(0)}…${trackBox.right.toFixed(0)})`);
      }

      const cs = getComputedStyle(segment);
      // The selected segment's ink is the only selection cue that does not
      // depend on the indicator having been positioned correctly.
      const isSelected = index === combo.selectedIndex;
      const wanted = isSelected ? primary : secondary;
      if (cs.color !== wanted) {
        say(`segment ${index} (${isSelected ? 'selected' : 'unselected'}) ink "${cs.color}",`
          + ` expected "${wanted}"`);
      }

      // A disabled OPTION is dimmed and shows the "no" cursor, whatever the
      // control's own state is.
      if (option.disabled) {
        if (Number(cs.opacity) >= 1) {
          say(`disabled option ${index} painted at full opacity ${cs.opacity}`);
        }
        if (cs.cursor !== 'not-allowed') {
          say(`disabled option ${index} cursor "${cs.cursor}", expected "not-allowed"`);
        }
      } else if (!combo.disabled && cs.cursor !== 'pointer') {
        say(`enabled option ${index} cursor "${cs.cursor}", expected "pointer"`);
      }

      // An icon is a real, painted image left of its own label.
      const image = segment.querySelector('img') as HTMLImageElement | null;
      const label = segment.querySelector('.segmented-control__label') as HTMLElement | null;
      if (option.icon) {
        if (!image) { say(`option ${index} declares an icon but painted no image`); }
        else {
          const imageBox = rect(image);
          if (imageBox.width <= 0 || imageBox.height <= 0) {
            say(`option ${index} icon renders at ${imageBox.width}x${imageBox.height}`);
          }
          if (!image.complete || image.naturalWidth === 0) {
            say(`option ${index} icon never decoded (naturalWidth ${image.naturalWidth})`);
          }
          if (label && imageBox.right > rect(label).left + EPS) {
            say(`option ${index} icon is not left of its label`);
          }
        }
      } else if (image) {
        say(`option ${index} declares no icon but painted an image`);
      }
    }

    // ── The sliding indicator ───────────────────────────────────────────────
    const indicator = sr.querySelector('[part~="indicator"]') as HTMLElement | null;
    if (!indicator) { say('no part="indicator" rendered'); return problems; }
    const indicatorCs = getComputedStyle(indicator);
    if (indicatorCs.position !== 'absolute') {
      say(`indicator position "${indicatorCs.position}", expected "absolute"`);
    }
    // The indicator sits UNDER the segments; if it swallowed clicks the
    // control would be unusable however correct its geometry was.
    if (indicatorCs.pointerEvents !== 'none') {
      say(`indicator takes pointer events ("${indicatorCs.pointerEvents}")`);
    }

    if (combo.selectedIndex < 0) {
      // Nothing to point at. The documented answer is an invisible indicator,
      // not one parked over an arbitrary segment.
      if (Number(indicatorCs.opacity) !== 0) {
        say(`no option is selected but the indicator is visible (opacity ${indicatorCs.opacity})`);
      }
    } else {
      if (Number(indicatorCs.opacity) !== 1) {
        say(`option ${combo.selectedIndex} is selected but the indicator is at`
          + ` opacity ${indicatorCs.opacity}`);
      }
      const indicatorBox = rect(indicator);
      const target = boxes[combo.selectedIndex];
      if (Math.abs(indicatorBox.left - target.left) > 2) {
        say(`indicator left ${indicatorBox.left.toFixed(1)} does not sit on the selected`
          + ` segment's left ${target.left.toFixed(1)}`);
      }
      if (Math.abs(indicatorBox.width - target.width) > 2) {
        say(`indicator width ${indicatorBox.width.toFixed(1)} does not match the selected`
          + ` segment's width ${target.width.toFixed(1)}`);
      }
      if (indicatorBox.height <= 0) {
        say(`indicator renders at height ${indicatorBox.height}`);
      }
      if (indicatorBox.left < trackBox.left - EPS || indicatorBox.right > trackBox.right + EPS) {
        say(`indicator (${indicatorBox.left.toFixed(0)}…${indicatorBox.right.toFixed(0)})`
          + ` escapes the track (${trackBox.left.toFixed(0)}…${trackBox.right.toFixed(0)})`);
      }

      // ── Occlusion: the indicator must not cover the segment it marks ─────
      const target2 = boxes[combo.selectedIndex];
      const x = target2.left + target2.width / 2;
      const y = target2.top + target2.height / 2;
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (combo.disabled) {
        // A disabled control takes no pointer events at all; the hit must land
        // on nothing inside the shadow tree, which is the documented effect.
        if (hit && (hit === segments[combo.selectedIndex]
          || segments[combo.selectedIndex].contains(hit as Node))) {
          say('a disabled control still hit-tests to its own segment');
        }
      } else {
        const segment = segments[combo.selectedIndex];
        if (hit !== segment && !segment.contains(hit as Node)) {
          say(`the selected segment is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('segmented-control visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      // The documented auto-selection rule, confirmed before anything is
      // measured — an indicator over the wrong segment and an indicator over
      // the right segment of a wrongly-selected control look identical.
      expect(mounted.value, `settled value for ${combo.id}`).toBe(combo.expectedValue);
      expect(mounted.reflectedSize).toBe(combo.size === 'medium' ? null : combo.size);
      expect(mounted.reflectedDisabled).toBe(combo.disabled);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * "Sliding indicator animates BETWEEN selections" is a claim about two
 * measurements over time, so no single combo can make it.
 */
test.describe('segmented-control visual matrix: the indicator really moves', () => {
  test('selecting a later segment moves the indicator onto it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'plain', size: 'large', value: '', disabled: false,
    }));
    const before = await page.evaluate(() => (window as any).matrix.indicatorBox());
    expect(before?.opacity).toBe('1');

    const result = await page.evaluate(() => (window as any).matrix.clickSegment(2));
    expect(result.clicked).toBe(true);
    expect(result.value).toBe('month');
    expect(result.events).toEqual([
      { value: 'month', previousValue: 'day', option: 'month', isControl: true },
    ]);

    const after = await page.evaluate(() => (window as any).matrix.indicatorBox());
    expect(after!.x, 'the indicator did not slide right').toBeGreaterThan(before!.x + 1);

    // …and it landed ON the third segment, not merely somewhere else.
    const target = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const segments = [...host.shadowRoot!.querySelectorAll('[part~="segment"]')];
      const box = segments[2].getBoundingClientRect();
      return { x: box.x, width: box.width };
    });
    expect(Math.abs(after!.x - target.x), 'indicator left vs segment left').toBeLessThanOrEqual(2);
    expect(Math.abs(after!.width - target.width), 'indicator width vs segment width')
      .toBeLessThanOrEqual(2);
  });

  test('a disabled control cannot be switched by a real click', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'plain', size: 'medium', value: '', disabled: true,
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickSegment(2));
    expect(result.events, 'a disabled control dispatched value-change').toEqual([]);
    expect(result.value, 'a disabled control changed its value').toBe('day');
  });

  test('a disabled OPTION cannot be selected while its neighbours can', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'first-off', size: 'medium', value: '', disabled: false,
    }));
    const blocked = await page.evaluate(() => (window as any).matrix.clickSegment(0));
    expect(blocked.events, 'a disabled option dispatched value-change').toEqual([]);
    expect(blocked.value).toBe('week');

    const allowed = await page.evaluate(() => (window as any).matrix.clickSegment(2));
    expect(allowed.events).toEqual([
      { value: 'month', previousValue: 'week', option: 'month', isControl: true },
    ]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because an indicator that "has a background-colour" and an indicator
// the user can SEE against the track are different claims.

test.describe('segmented-control visual matrix: marquee pixels', () => {
  test('the indicator paints a surface distinct from the track it slides in', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'plain', size: 'large', value: 'day', disabled: false,
    }));
    // One pixel inside the indicator, well away from any glyph, and one in the
    // track's own padding beside the last segment. A component that painted the
    // indicator in the track colour reads identical at both.
    const [onIndicator, onTrack] = await capture(
      page, '#subject', 'segmented-control-indicator',
      `(host) => {
        const sr = host.shadowRoot;
        const indicator = sr.querySelector('[part~="indicator"]');
        const track = sr.querySelector('[part~="base"]');
        const i = indicator.getBoundingClientRect();
        const t = track.getBoundingClientRect();
        return [
          { x: i.x + 3, y: i.y + 3 },
          { x: t.right - 1.4, y: t.y + t.height / 2 },
        ];
      }`,
    );
    expect(sameColor(onIndicator as RGB, onTrack as RGB),
      `indicator painted ${onIndicator.join(',')} on a track painting ${onTrack.join(',')}`)
      .toBe(false);
  });

  test('the selected label and an unselected label paint different ink', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      shape: 'plain', size: 'large', value: 'day', disabled: false,
    }));
    // Probe a run of points across each label's own line and keep the darkest
    // pixel of each: a single sample can land between glyphs and read the
    // surface rather than the ink.
    const pixels = await capture(
      page, '#subject', 'segmented-control-ink',
      `(host) => {
        const labels = [...host.shadowRoot.querySelectorAll('.segmented-control__label')];
        const points = [];
        for (const label of [labels[0], labels[2]]) {
          const b = label.getBoundingClientRect();
          for (let i = 1; i <= 10; i++) {
            points.push({ x: b.x + (b.width * i) / 12, y: b.y + b.height / 2 });
          }
        }
        return points;
      }`,
    );
    const darkest = (samples: RGB[]) =>
      samples.reduce((best, p) => (p[0] + p[1] + p[2] < best[0] + best[1] + best[2] ? p : best));
    const selected = darkest(pixels.slice(0, 10) as RGB[]);
    const unselected = darkest(pixels.slice(10) as RGB[]);
    expect(sameColor(selected, unselected),
      `selected ink ${selected.join(',')} equals unselected ink ${unselected.join(',')}`)
      .toBe(false);
  });
});
