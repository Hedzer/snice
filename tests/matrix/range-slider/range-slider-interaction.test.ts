/**
 * Matrix slice RANGE-SLIDER / INTERACTION — the documented ways a user moves an
 * endpoint, and the one event that reports it.
 *
 * Contract (docs/ai/components/range-slider.md):
 *   § Keyboard Navigation
 *     "Arrow keys adjust focused thumb by step"
 *     "Home/End move to min/max bounds"
 *     "Each thumb independently focusable"
 *   § Accessibility
 *     "Track click moves nearest thumb"
 *   § Events
 *     `range-change` -> `{ valueLow, valueHigh, component }`
 *   § Value and form lifecycle
 *     "Each pristine endpoint follows its default; interaction, restore, or
 *      assignment dirties it."
 *
 * ── What "min/max bounds" means for a TWO-handle slider ─────────────────────
 *
 * The doc's own ARIA line resolves it: each thumb exposes
 * `aria-valuemin`/`aria-valuemax`, and because the pair is documented as
 * "ordered", those bounds are the THUMB's, not the scale's — the low thumb
 * ranges over [min, valueHigh] and the high thumb over [valueLow, max]. End on
 * the low thumb therefore lands on the high endpoint; it cannot cross it. This
 * is `range-slider-support.ts`'s reading of the same sentence, and the two
 * files agree on purpose.
 *
 * Dimensions: thumb (2) x key (6) x scale (3) = 36 keyboard combos, plus the
 * inert-when-disabled cross, the track-click nearest-thumb sweep, and the
 * event contract.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, captureEvents, key, settle } from '../matrix-utils';
import {
  range, attrsOf, comboId, rangeProblems, read, normalize, effectiveStep,
  expectedInitial, stubTrackGeometry, type RangeCombo,
} from './range-slider-support';

const mountRange = (c: RangeCombo) => mount<HTMLElement>('snice-range-slider', attrsOf(c));

/** The (min, max, step) shapes whose arithmetic differs under a step move. */
const SCALES: Array<[number, number, number]> = [
  [0, 100, 1],
  [0, 100, 5],
  [-50, 50, 10],
];

type Thumb = 'low' | 'high';
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'] as const;
type Key = typeof KEYS[number];

const thumbNode = (el: HTMLElement, thumb: Thumb) =>
  thumb === 'low' ? read(el).low.node : read(el).high.node;

/**
 * The documented result of one key on one thumb — written from the sentences,
 * not from the component. Decrement and increment are the same step in both
 * axes ("Arrow keys adjust focused thumb by step"), each thumb stopping at its
 * own documented bound.
 */
function afterKey(
  thumb: Thumb, k: Key, start: { low: number; high: number },
  min: number, max: number, step: number,
): { low: number; high: number } {
  const size = effectiveStep(step);
  const down = k === 'ArrowLeft' || k === 'ArrowDown';
  const up = k === 'ArrowRight' || k === 'ArrowUp';

  if (thumb === 'low') {
    if (down) return { ...start, low: Math.max(min, normalize(start.low - size, min, max, step)) };
    if (up) return { ...start, low: Math.min(start.high, normalize(start.low + size, min, max, step)) };
    if (k === 'Home') return { ...start, low: min };
    return { ...start, low: start.high };            // End: the low thumb's own max
  }
  if (down) return { ...start, high: Math.max(start.low, normalize(start.high - size, min, max, step)) };
  if (up) return { ...start, high: Math.min(max, normalize(start.high + size, min, max, step)) };
  if (k === 'Home') return { ...start, high: start.low }; // Home: the high thumb's own min
  return { ...start, high: max };
}

describe('range-slider matrix: interaction', () => {
  afterEach(() => unmountAll());

  // ── Keyboard: every documented key, on both thumbs, on three scales ───────

  for (const point of product({ scale: SCALES, thumb: ['low', 'high'] as Thumb[], k: KEYS })) {
    const [min, max, step] = point.scale;
    const thumb = point.thumb as Thumb;
    const k = point.k as Key;
    // Endpoints parked off both bounds, so every key has somewhere to go.
    const c = range({
      min, max, step,
      defaultValueLow: min + (max - min) * 0.3,
      defaultValueHigh: min + (max - min) * 0.7,
    });
    const id = `${k} on the ${thumb} thumb of [${min}..${max}/${step}]`;

    it(id, async () => {
      const el = await mountRange(c);
      const start = expectedInitial(c);
      const want = afterKey(thumb, k, start, min, max, step);

      key(thumbNode(el, thumb), k);
      await settle(el);

      expect((el as any).valueLow, `${id}: low`).toBe(want.low);
      expect((el as any).valueHigh, `${id}: high`).toBe(want.high);
      expect(rangeProblems(el, c, want), id).toEqual([]);
    });
  }

  it('an unrelated key moves nothing', async () => {
    const c = range({ defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);

    for (const k of ['a', 'Enter', ' ', 'PageUp', 'Escape']) {
      key(read(el).low.node, k);
      key(read(el).high.node, k);
    }
    await settle(el);

    expect(rangeProblems(el, c, { low: 20, high: 80 })).toEqual([]);
  });

  // ── "Each thumb independently focusable" ─────────────────────────────────

  it('both thumbs are their own tab stops', async () => {
    const el = await mountRange(range({ defaultValueLow: 20, defaultValueHigh: 80 }));
    const r = read(el);
    expect(r.low.tabIndex, 'the low thumb is not a tab stop').toBe('0');
    expect(r.high.tabIndex, 'the high thumb is not a tab stop').toBe('0');
    expect(r.low.node, 'the two thumbs are the same node').not.toBe(r.high.node);
  });

  // ── Disabled: every documented key is inert ──────────────────────────────

  for (const point of product({ thumb: ['low', 'high'] as Thumb[], k: KEYS })) {
    const thumb = point.thumb as Thumb;
    const k = point.k as Key;
    it(`disabled: ${k} on the ${thumb} thumb changes nothing`, async () => {
      const c = range({ disabled: true, defaultValueLow: 30, defaultValueHigh: 70 });
      const el = await mountRange(c);
      const events = captureEvents(el, ['range-change']);

      key(thumbNode(el, thumb), k);
      await settle(el);

      expect(rangeProblems(el, c, { low: 30, high: 70 }), `${k}/${thumb}`).toEqual([]);
      expect(events.events, 'a disabled slider emitted range-change').toEqual([]);
    });
  }

  // ── "Track click moves nearest thumb" ────────────────────────────────────
  //
  // Driven with `mousedown`, which is the half of a click this component binds
  // and the half a real click always delivers first. The track has no geometry
  // in a DOM-only environment, so the fixture supplies a ruler
  // (`stubTrackGeometry`); WHERE the track really sits is the visual tier's
  // question, and the CHOICE of thumb is this one's.

  const TRACK = { left: 0, width: 200, top: 0, height: 20 };
  const clickTrackAt = (el: HTMLElement, fraction: number) => {
    read(el).track?.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, composed: true, cancelable: true,
      clientX: TRACK.left + TRACK.width * fraction,
      clientY: TRACK.top + TRACK.height / 2,
    }));
  };

  for (const point of product({
    fraction: [0, 0.1, 0.35, 0.5, 0.65, 0.9, 1],
    scale: [SCALES[0], SCALES[1]],
  })) {
    const [min, max, step] = point.scale;
    const fraction = point.fraction as number;
    const id = `a track press at ${(fraction * 100).toFixed(0)}% of [${min}..${max}/${step}]`
      + ' moves the nearer thumb';

    it(id, async () => {
      const c = range({ min, max, step, defaultValueLow: 40, defaultValueHigh: 60 });
      const el = await mountRange(c);
      stubTrackGeometry(el, TRACK);
      const start = expectedInitial(c);

      clickTrackAt(el, fraction);
      await settle(el);

      // The documented rule, restated: the pressed value, and whichever
      // endpoint it is nearer to — ties going to the low thumb, because a tie
      // is not "nearer".
      const pressed = normalize(min + fraction * (max - min), min, max, step);
      const want = Math.abs(pressed - start.low) <= Math.abs(pressed - start.high)
        ? { low: Math.min(pressed, start.high), high: start.high }
        : { low: start.low, high: Math.max(pressed, start.low) };

      expect((el as any).valueLow, `${id}: low`).toBe(want.low);
      expect((el as any).valueHigh, `${id}: high`).toBe(want.high);
      expect(rangeProblems(el, c, want), id).toEqual([]);
    });
  }

  it('a disabled slider ignores a track press', async () => {
    const c = range({ disabled: true, defaultValueLow: 40, defaultValueHigh: 60 });
    const el = await mountRange(c);
    stubTrackGeometry(el, TRACK);

    clickTrackAt(el, 0.9);
    await settle(el);

    expect(rangeProblems(el, c, { low: 40, high: 60 })).toEqual([]);
  });

  // ── The documented event ─────────────────────────────────────────────────

  it('range-change carries both endpoints and the component', async () => {
    const c = range({ step: 5, defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);
    const events = captureEvents(el, ['range-change']);

    key(read(el).low.node, 'ArrowRight');
    await settle(el);

    expect(events.types(), 'one adjustment, one event').toEqual(['range-change']);
    expect(events.events[0].detail).toEqual({
      valueLow: 25, valueHigh: 80, component: el,
    });
  });

  it('every documented key that moves an endpoint reports it exactly once', async () => {
    const c = range({ step: 5, defaultValueLow: 30, defaultValueHigh: 70 });
    const el = await mountRange(c);
    const events = captureEvents(el, ['range-change']);

    for (const k of KEYS) key(read(el).low.node, k);
    await settle(el);

    expect(events.types().length, 'one event per documented key').toBe(KEYS.length);
    for (const event of events.events) {
      expect(Object.keys(event.detail).sort()).toEqual(['component', 'valueHigh', 'valueLow']);
    }
  });

  it('a key that changes nothing at a bound still reports the endpoint it holds', async () => {
    // Home on a low thumb already at min: the documented detail is the state,
    // not a delta, so the event describes where the endpoints are.
    const c = range({ defaultValueLow: 0, defaultValueHigh: 100 });
    const el = await mountRange(c);
    const events = captureEvents(el, ['range-change']);

    key(read(el).low.node, 'Home');
    await settle(el);

    expect(events.events.map(e => ({ low: e.detail.valueLow, high: e.detail.valueHigh })))
      .toEqual([{ low: 0, high: 100 }]);
  });

  // ── "interaction … dirties it" ───────────────────────────────────────────

  it('a keyboard adjustment dirties the endpoint against a later default change', async () => {
    const c = range({ defaultValueLow: 20, defaultValueHigh: 80 });
    const el = await mountRange(c);

    key(read(el).low.node, 'ArrowRight');
    await settle(el);
    expect((el as any).valueLow, 'the arrow key did not move the low endpoint').toBe(21);

    // A pristine endpoint follows its default; a dirty one does not.
    el.setAttribute('value-low', '5');
    el.setAttribute('value-high', '95');
    await settle(el);

    expect((el as any).valueLow, 'the dirtied low endpoint followed a new default').toBe(21);
    expect((el as any).valueHigh, 'the pristine high endpoint ignored its new default').toBe(95);
  });

  it('the endpoints stay ordered however hard the keys push them together', async () => {
    const c = range({ min: 0, max: 10, step: 1, defaultValueLow: 4, defaultValueHigh: 6 });
    const el = await mountRange(c);

    for (let i = 0; i < 12; i++) key(read(el).low.node, 'ArrowRight');
    for (let i = 0; i < 12; i++) key(read(el).high.node, 'ArrowLeft');
    await settle(el);

    const low = (el as any).valueLow as number;
    const high = (el as any).valueHigh as number;
    expect(low, `the endpoints crossed: ${low} > ${high}`).toBeLessThanOrEqual(high);
    expect(rangeProblems(el, c, { low, high }), comboId(c)).toEqual([]);
  });
});
