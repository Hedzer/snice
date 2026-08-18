/**
 * Smoke slice of the snice-draw matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/draw, 87 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file is the standing
 * cost the everyday loop pays.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's bare `<snice-draw>`, which owns both parts and every default;
 *   · a real pointer gesture → one `DrawStroke` plus its two events;
 *   · undo/redo/clear, the history contract;
 *   · setStrokes/getStrokes, the save-and-reload contract;
 *   · `disabled`, the switch that regresses into "still draws";
 *   · MATRIX-draw-1 and MATRIX-draw-2, the two regression guards.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountDraw, expectShell, stroke, captureEvents, keysOf, expectStrokeShape,
  installDrawStack, restoreDrawStack, STROKE_FIXTURES, BOX, wait, SETTLE,
} from './draw-support';

describe('snice-draw matrix smoke', () => {
  beforeEach(() => { installDrawStack(); });
  afterEach(() => {
    document.body.innerHTML = '';
    restoreDrawStack();
  });

  it('the documented bare markup renders the whole shell', async () => {
    const el = await mountDraw({});
    expectShell(el, {});
  });

  it('a gesture becomes one DrawStroke, announced start then end', async () => {
    const el = await mountDraw({ color: '#ff0000', strokeWidth: 5 });
    const events = captureEvents(el);
    await stroke(el, [[100, 100], [220, 160], [340, 120]]);

    const strokes = el.getStrokes();
    expect(strokes).toHaveLength(1);
    expectStrokeShape(strokes, 'smoke');
    expect(strokes[0]).toMatchObject({ tool: 'pen', color: '#ff0000', width: 5 });
    expect(events.map(event => event.type)).toEqual(['draw-start', 'draw-end']);
    expect(keysOf(events[1].detail)).toEqual(['draw', 'stroke']);
  });

  it('undo, redo and clear move the history', async () => {
    const el = await mountDraw({});
    await stroke(el, [[50, 50], [150, 90]]);
    await stroke(el, [[200, 50], [300, 90]]);

    el.undo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(1);
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
    el.clear();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
  });

  it('setStrokes/getStrokes round-trips a saved drawing', async () => {
    const el = await mountDraw({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.many);
    expect(el.toDataURL().startsWith('data:image/png')).toBe(true);
  });

  it('disabled prevents all drawing interaction', async () => {
    const el = await mountDraw({ disabled: true });
    const events = captureEvents(el);
    await stroke(el, [[100, 100], [200, 160]]);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  // MATRIX-draw-1 (fixed): `width`/`height` are documented properties, not
  // read-outs of the layout.
  it('MATRIX-draw-1 (fixed): the documented width and height survive initialisation', async () => {
    const el = await mountDraw({ width: 400, height: 300 });
    expect({ width: el.width, height: el.height }).toEqual({ width: 400, height: 300 });
  });

  // MATRIX-draw-2: `lazy` never reaches the brush that implements it.
  it.fails('MATRIX-draw-2: with lazy on, the brush lags inside its radius', async () => {
    const el = await mountDraw({ lazy: true, lazyRadius: 60 });
    await stroke(el, [[100, 100], [120, 100], [140, 100]]);
    const points = el.getStrokes()[0].points;
    expect(points[points.length - 1].x).toBeLessThan(140);
  });

  it('the drawing buffer matches the laid-out canvas', async () => {
    const el = await mountDraw({});
    const canvas = el.shadowRoot!.querySelector('canvas')!;
    expect({ width: canvas.width, height: canvas.height })
      .toEqual({ width: BOX.width, height: BOX.height });
  });
});
