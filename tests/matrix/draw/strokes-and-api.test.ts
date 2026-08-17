/**
 * snice-draw — drawing, the stroke history, and the export API.
 *
 * AXES:
 *   a real pointer gesture x {pen, eraser} x {lazy off, lazy on}
 *                          x {plain, auto-polygon, auto-circle}
 *   the history methods    clear / undo / redo, over 0, 1 and 3 strokes
 *   the load API           five `setStrokes` fixtures
 *   the export API         `toDataURL` over its documented types, `toBlob`,
 *                          `download`, `loadImage`
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountDraw, stroke, ring, captureEvents, keysOf, expectStrokeShape,
  installDrawStack, restoreDrawStack, installImageDecoder,
  STROKE_FIXTURES, wait, SETTLE, FRAME,
  type CanvasMock, type SniceDrawElement,
} from './draw-support';

let canvas: CanvasMock;

beforeEach(() => { canvas = installDrawStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restoreDrawStack();
});

const LINE: Array<[number, number]> = [[100, 100], [200, 160], [300, 120], [400, 200]];

describe('snice-draw matrix: a pointer gesture becomes a stroke', () => {
  for (const tool of ['pen', 'eraser'] as const) {
    for (const lazy of [false, true]) {
      const id = `tool=${tool}/lazy=${lazy ? 'on' : 'off'}`;

      it(`${id}: one gesture records one stroke`, async () => {
        const el = await mountDraw({ tool, lazy, color: '#ff0000', strokeWidth: 5 });
        const events = captureEvents(el);
        await stroke(el, LINE);

        const strokes = el.getStrokes();
        expect(strokes).toHaveLength(1);
        expectStrokeShape(strokes, id);
        // The stroke remembers the settings it was drawn with, which is what
        // makes a saved drawing reproducible.
        expect(strokes[0].tool).toBe(tool);
        expect(strokes[0].color).toBe('#ff0000');
        expect(strokes[0].width).toBe(5);

        expect(events.map(event => event.type)).toEqual(['draw-start', 'draw-end']);
        expect(keysOf(events[0].detail)).toEqual(['draw', 'point']);
        expect(keysOf(events[1].detail)).toEqual(['draw', 'stroke']);
        expect(events[0].detail.draw).toBe(el);
        expect(events[1].detail.stroke).toEqual(strokes[0]);
      });

      it(`${id}: three gestures record three strokes, in order`, async () => {
        const el = await mountDraw({ tool, lazy });
        await stroke(el, [[50, 50], [120, 90]]);
        await stroke(el, [[200, 50], [280, 90]]);
        await stroke(el, [[350, 50], [420, 90]]);

        const strokes = el.getStrokes();
        expect(strokes).toHaveLength(3);
        expect(new Set(strokes.map(entry => entry.id)).size).toBe(3);
        expect(strokes.map(entry => entry.timestamp))
          .toEqual([...strokes.map(entry => entry.timestamp)].sort((a, b) => a - b));
      });
    }
  }

  it('the draw-start point is where the pointer went down', async () => {
    const el = await mountDraw({});
    const events = captureEvents(el, ['draw-start']);
    await stroke(el, LINE);
    expect(events[0].detail.point).toMatchObject({ x: 100, y: 100 });
  });

  it('with lazy off, the stroke follows the pointer exactly', async () => {
    // `lazy: boolean = false` is the documented default, and an un-lazy brush
    // has no lag to explain a gap between the pointer and the ink.
    const el = await mountDraw({ lazy: false });
    await stroke(el, [[100, 100], [110, 100], [120, 100]]);
    const [first] = el.getStrokes();
    const last = first.points[first.points.length - 1];
    expect({ x: Math.round(last.x), y: Math.round(last.y) }).toEqual({ x: 120, y: 100 });
  });

  /**
   * FINDING MATRIX-draw-2.
   *
   * "Lazy Brush — brush follows cursor within radius for smooth lines. Larger
   * radius = smoother. Reduces jitter/tremor", switched on by `lazy` and tuned
   * by `lazyRadius`. The `DrawBrush` is built once in the element's
   * CONSTRUCTOR, from the field defaults (`enabled: false`, `radius: 60`), and
   * nothing ever reconfigures it: there is no watcher on `lazy` or
   * `lazyRadius`, and neither `enable()` nor `setRadius()` is called anywhere
   * after construction. `lazy` is therefore inert — the brush tracks the
   * pointer exactly whatever the author sets, so the documented smoothing
   * never happens.
   */
  it.fails('MATRIX-draw-2: with lazy on, the brush lags inside its radius', async () => {
    const el = await mountDraw({ lazy: true, lazyRadius: 60 });
    await stroke(el, [[100, 100], [120, 100], [140, 100]]);
    const [first] = el.getStrokes();
    const last = first.points[first.points.length - 1];
    // A 40px gesture inside a 60px radius must not drag the brush all the way
    // to the pointer — that lag IS the feature.
    expect(last.x).toBeLessThan(140);
  });

  it('MATRIX-draw-2 reproduces: lazy on tracks the pointer exactly, like lazy off', async () => {
    const lazyOn = await mountDraw({ lazy: true, lazyRadius: 60 });
    const lazyOff = await mountDraw({ lazy: false });
    await stroke(lazyOn, [[100, 100], [120, 100], [140, 100]]);
    await stroke(lazyOff, [[100, 100], [120, 100], [140, 100]]);

    const lastOf = (el: SniceDrawElement) => {
      const points = el.getStrokes()[0].points;
      const last = points[points.length - 1];
      return { x: Math.round(last.x), y: Math.round(last.y) };
    };
    expect(lastOf(lazyOn)).toEqual({ x: 140, y: 100 });
    expect(lastOf(lazyOn)).toEqual(lastOf(lazyOff));
  });

  it('a long gesture moves the brush whatever lazy says', async () => {
    // The guard that MATRIX-draw-2 is about the SMOOTHING being absent, not
    // about strokes failing to record movement at all.
    for (const lazy of [false, true]) {
      const el = await mountDraw({ lazy, lazyRadius: 60 });
      await stroke(el, [[100, 100], [300, 100], [500, 100]]);
      const [first] = el.getStrokes();
      expect(Math.max(...first.points.map(point => point.x)), `lazy=${lazy}`).toBeGreaterThan(100);
    }
  });

  it('disabled draws nothing at all', async () => {
    // "Disabled state prevents all drawing interaction".
    const el = await mountDraw({ disabled: true });
    const events = captureEvents(el);
    await stroke(el, LINE);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a stroke that never moved is still a stroke', async () => {
    // A tap is a dot; the doc's single-point `points` array is drawn as one.
    const el = await mountDraw({});
    await stroke(el, [[200, 200]]);
    const strokes = el.getStrokes();
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points.length).toBeGreaterThan(0);
  });
});

describe('snice-draw matrix: auto-polygon and auto-circle', () => {
  for (const [name, combo] of [
    ['plain', {}],
    ['auto-polygon', { autoPolygon: true }],
    ['auto-polygon/curve=2', { autoPolygon: true, polygonCurvePoints: 2 }],
    ['auto-polygon/curve=30', { autoPolygon: true, polygonCurvePoints: 30 }],
    ['auto-circle', { autoCircle: true }],
    ['auto-circle/points=12', { autoCircle: true, circlePoints: 12 }],
    ['both', { autoPolygon: true, autoCircle: true }],
  ] as const) {
    it(`${name}: a ring gesture still produces one well-formed stroke`, async () => {
      const el = await mountDraw(combo);
      await stroke(el, ring().slice(0, 8));

      const strokes = el.getStrokes();
      expect(strokes).toHaveLength(1);
      // Post-processing may add or drop points, but it must not invent NaNs or
      // throw the stroke away: the doc says the shape is SMOOTHED, not deleted.
      expectStrokeShape(strokes, name);
      expect(strokes[0].points.length).toBeGreaterThan(0);
    });
  }

  it('auto-circle takes precedence when both are on', async () => {
    // "Auto-circle mode takes precedence" is the documented resolution of the
    // overlap; both switches on must not double-process the stroke.
    const el = await mountDraw({ autoPolygon: true, autoCircle: true });
    await stroke(el, ring().slice(0, 8));
    expect(el.getStrokes()).toHaveLength(1);
  });
});

describe('snice-draw matrix: history', () => {
  async function drawThree(el: SniceDrawElement): Promise<void> {
    await stroke(el, [[50, 50], [150, 90]]);
    await stroke(el, [[200, 50], [300, 90]]);
    await stroke(el, [[350, 50], [450, 90]]);
  }

  it('undo removes the last stroke and announces it', async () => {
    const el = await mountDraw({});
    await drawThree(el);
    const events = captureEvents(el, ['draw-undo']);

    el.undo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
    expect(events.map(event => event.type)).toEqual(['draw-undo']);
    expect(keysOf(events[0].detail)).toEqual(['draw']);
  });

  it('redo puts it back', async () => {
    const el = await mountDraw({});
    await drawThree(el);
    const before = el.getStrokes();

    el.undo();
    await wait(SETTLE);
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(before);
  });

  it('undo three times empties the drawing, and redo three times restores it', async () => {
    const el = await mountDraw({});
    await drawThree(el);
    const before = el.getStrokes();

    for (let i = 0; i < 3; i++) { el.undo(); await wait(SETTLE); }
    expect(el.getStrokes()).toEqual([]);

    for (let i = 0; i < 3; i++) { el.redo(); await wait(SETTLE); }
    expect(el.getStrokes()).toEqual(before);
  });

  it('undo on an empty canvas is a silent no-op', async () => {
    const el = await mountDraw({});
    const events = captureEvents(el);
    el.undo();
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a new stroke discards the redo stack', async () => {
    // Otherwise redo would resurrect a stroke from a branch the user left.
    const el = await mountDraw({});
    await drawThree(el);
    el.undo();
    await wait(SETTLE);
    await stroke(el, [[500, 50], [560, 90]]);

    const events = captureEvents(el, ['draw-redo']);
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(3);
    expect(events).toEqual([]);
  });

  it('clear empties the history and announces it', async () => {
    const el = await mountDraw({});
    await drawThree(el);
    const events = captureEvents(el, ['draw-clear', 'draw-redo']);

    el.clear();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
    expect(events.map(event => event.type)).toEqual(['draw-clear']);
    expect(keysOf(events[0].detail)).toEqual(['draw']);

    // Nothing to redo: clear is not an undo.
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
  });

  it('clear repaints the background rather than leaving a transparent hole', async () => {
    const el = await mountDraw({ backgroundColor: '#abcdef' });
    await drawThree(el);
    canvas.reset();
    el.clear();
    await wait(SETTLE);
    expect(canvas.operations.some(op => op.startsWith('fillRect'))).toBe(true);
  });
});

describe('snice-draw matrix: setStrokes / getStrokes', () => {
  for (const [name, fixture] of Object.entries(STROKE_FIXTURES)) {
    it(`${name}: setStrokes then getStrokes round-trips`, async () => {
      const el = await mountDraw({});
      el.setStrokes(fixture);
      await wait(SETTLE);
      expect(el.getStrokes()).toEqual(fixture);
    });
  }

  it('setStrokes replaces, it does not append', async () => {
    const el = await mountDraw({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    el.setStrokes(STROKE_FIXTURES.single);
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.single);
  });

  it('getStrokes hands back a list the caller cannot push into', async () => {
    // "getStrokes() — Get all strokes": a consumer inspecting the drawing must
    // not be able to grow it by accident.
    const el = await mountDraw({});
    el.setStrokes(STROKE_FIXTURES.single);
    await wait(SETTLE);

    const first = el.getStrokes();
    first.push(STROKE_FIXTURES.many[0]);
    expect(el.getStrokes()).toHaveLength(1);
  });

  it('loaded strokes are undoable like drawn ones', async () => {
    const el = await mountDraw({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    el.undo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
  });

  it('setStrokes before the canvas exists is applied once it does', async () => {
    // The doc's own usage — `draw.setStrokes(strokes)` right after creating the
    // element — must not silently lose the drawing.
    const el = document.createElement('snice-draw') as SniceDrawElement;
    document.body.appendChild(el);
    await (el as any).ready;
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(FRAME * 3);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.many);
  });
});

describe('snice-draw matrix: export', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp'] as const) {
    it(`toDataURL('${type}') returns a data url of that type`, async () => {
      const el = await mountDraw({});
      await stroke(el, LINE);
      const url = el.toDataURL(type);
      expect(url.startsWith(`data:${type}`)).toBe(true);
    });
  }

  it('toDataURL defaults to png', async () => {
    const el = await mountDraw({});
    expect(el.toDataURL().startsWith('data:image/png')).toBe(true);
  });

  it('toBlob resolves a blob of the requested type', async () => {
    const el = await mountDraw({});
    const blob = await el.toBlob('image/jpeg');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('download names the file the caller asked for', async () => {
    const el = await mountDraw({});
    const clicked: Array<{ name: string; href: string }> = [];
    const anchor = document.createElement('a');
    anchor.click = () => { clicked.push({ name: anchor.download, href: anchor.href }); };
    const create = document.createElement.bind(document);
    (document as any).createElement = (tag: string) => (tag === 'a' ? anchor : create(tag));
    try {
      el.download('sketch.png');
    } finally {
      (document as any).createElement = create;
    }

    expect(clicked).toHaveLength(1);
    expect(clicked[0].name).toBe('sketch.png');
    expect(clicked[0].href.startsWith('data:image/png')).toBe(true);
  });

  it('loadImage draws the image onto the canvas', async () => {
    const el = await mountDraw({});
    canvas.reset();
    await el.loadImage('bg.jpg');
    expect(canvas.operations.some(op => op.startsWith('drawImage'))).toBe(true);
  });

  it('loadImage rejects when the image cannot be decoded', async () => {
    // "loadImage(url): Promise<void>" — a promise that silently resolved on a
    // 404 would leave the caller believing the background is there.
    const el = await mountDraw({});
    installImageDecoder({ fail: true });
    await expect(el.loadImage('missing.jpg')).rejects.toThrow();
  });

  it('a drawn stroke survives an export round trip of the history', async () => {
    const el = await mountDraw({ color: '#00ff00', strokeWidth: 7 });
    await stroke(el, LINE);
    const saved = el.getStrokes();

    const other = await mountDraw({});
    other.setStrokes(saved);
    await wait(SETTLE);
    expect(other.getStrokes()).toEqual(saved);
  });
});
