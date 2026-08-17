/**
 * Smoke slice of the snice-paint matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/paint, 82 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file is the standing
 * cost the everyday loop pays.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's bare `<snice-paint>`, which owns all four parts, all five
 *     slots, the default palette and every default control;
 *   · a `controls` subset, the switch that regresses into "always visible";
 *   · a gesture → one `PaintStroke` plus its two events;
 *   · undo/redo/clear driven from the toolbar;
 *   · `disabled`, the documented "prevents all drawing interaction";
 *   · MATRIX-paint-1, the palette regression guard.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPaint, expectShell, paintStroke, pressControl, captureEvents, keysOf,
  expectStrokeShape, swatches, buttonTitles, sizeSlider, installPaintStack,
  restorePaintStack, DEFAULT_COLORS, STROKE_FIXTURES, wait, SETTLE,
} from './paint-support';

describe('snice-paint matrix smoke', () => {
  beforeEach(() => { installPaintStack(); });
  afterEach(() => {
    document.body.innerHTML = '';
    restorePaintStack();
  });

  it('the documented bare markup renders the whole shell', async () => {
    const el = await mountPaint({});
    expectShell(el, {});
    expect(swatches(el)).toHaveLength(DEFAULT_COLORS.length);
    expect(buttonTitles(el)).toEqual(['Eraser', 'Undo', 'Redo', 'Clear canvas']);
  });

  it('a controls subset renders only what it asked for', async () => {
    const combo = { controls: 'undo,clear' };
    const el = await mountPaint(combo);
    expectShell(el, combo);
    expect(swatches(el)).toEqual([]);
    expect(sizeSlider(el)).toBeNull();
    expect(buttonTitles(el)).toEqual(['Undo', 'Clear canvas']);
  });

  it('a gesture becomes one PaintStroke, announced start then end', async () => {
    const el = await mountPaint({ color: '#ef4444', strokeWidth: 7 });
    const events = captureEvents(el);
    await paintStroke(el, [[100, 100], [200, 160], [300, 120]]);

    const strokes = el.getStrokes();
    expect(strokes).toHaveLength(1);
    expectStrokeShape(strokes, 'smoke');
    expect(strokes[0]).toMatchObject({ tool: 'pen', color: '#ef4444', width: 7 });
    expect(events.map(event => event.type)).toEqual(['paint-start', 'paint-end']);
    expect(keysOf(events[1].detail)).toEqual(['stroke']);
  });

  it('the toolbar drives undo, redo and clear', async () => {
    const el = await mountPaint({});
    await paintStroke(el, [[10, 10], [60, 40]]);
    await paintStroke(el, [[80, 10], [130, 40]]);

    pressControl(el, 'Undo');
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(1);
    pressControl(el, 'Redo');
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
    pressControl(el, 'Clear canvas');
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
  });

  it('setStrokes/getStrokes round-trips a saved drawing', async () => {
    const el = await mountPaint({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.many);
    expect(el.toDataURL().startsWith('data:image/png')).toBe(true);
  });

  it('disabled prevents all drawing interaction', async () => {
    const el = await mountPaint({ disabled: true });
    const events = captureEvents(el);
    await paintStroke(el);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  // MATRIX-paint-1: assigning `colors` never repaints the palette. The guard
  // lives here so the everyday loop notices the day it changes.
  it.fails('MATRIX-paint-1: a custom palette renders its own swatches', async () => {
    const el = await mountPaint({ colors: ['#ff0000', '#00ff00', '#0000ff'] });
    expect(swatches(el)).toHaveLength(3);
  });
});
