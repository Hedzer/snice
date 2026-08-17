/**
 * snice-paint — painting, the history, and the export API.
 *
 * AXES:
 *   a pointer gesture x {pen, eraser} x {enabled, disabled}
 *   the history       undo / redo / clear over 0, 1 and 3 strokes
 *   the load API      four `setStrokes` fixtures
 *   the export API    `toDataURL` over its documented types, `toBlob`,
 *                     `download`
 *   the events        `paint-start`, `paint-end`, `paint-clear`, `paint-undo`,
 *                     `paint-redo`, and their documented details
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPaint, paintStroke, pressControl, captureEvents, keysOf, expectStrokeShape,
  installPaintStack, restorePaintStack, STROKE_FIXTURES, canvasEl, classesOf,
  wait, SETTLE, type CanvasMock, type SnicePaintElement,
} from './paint-support';

let canvas: CanvasMock;

beforeEach(() => { canvas = installPaintStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restorePaintStack();
});

const LINE: Array<[number, number]> = [[100, 100], [200, 160], [300, 120]];

describe('snice-paint matrix: a gesture becomes a stroke', () => {
  for (const tool of ['pen', 'eraser'] as const) {
    it(`tool=${tool}: one gesture records one stroke and announces it`, async () => {
      const el = await mountPaint({ color: '#ef4444', strokeWidth: 7 });
      if (tool === 'eraser') {
        pressControl(el, 'Eraser');
        await wait(SETTLE);
      }
      const events = captureEvents(el);
      await paintStroke(el, LINE);

      const strokes = el.getStrokes();
      expect(strokes).toHaveLength(1);
      expectStrokeShape(strokes, tool);
      expect(strokes[0].tool).toBe(tool);
      expect(strokes[0].width).toBe(7);
      // A stroke remembers the colour it was painted with, whatever the tool.
      expect(strokes[0].color).toBe('#ef4444');

      expect(events.map(event => event.type)).toEqual(['paint-start', 'paint-end']);
      expect(keysOf(events[0].detail)).toEqual(['point']);
      expect(keysOf(events[1].detail)).toEqual(['stroke']);
      expect(events[1].detail.stroke).toEqual(strokes[0]);
    });
  }

  it('the paint-start point is where the pointer went down', async () => {
    const el = await mountPaint({});
    const events = captureEvents(el, ['paint-start']);
    await paintStroke(el, LINE);
    expect(events[0].detail.point).toEqual({ x: 100, y: 100 });
  });

  it('every sampled point is inside the drawing surface', async () => {
    const el = await mountPaint({});
    await paintStroke(el, LINE);
    for (const point of el.getStrokes()[0].points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('three gestures record three strokes in order', async () => {
    const el = await mountPaint({});
    await paintStroke(el, [[10, 10], [60, 40]]);
    await paintStroke(el, [[80, 10], [130, 40]]);
    await paintStroke(el, [[150, 10], [200, 40]]);

    const strokes = el.getStrokes();
    expect(strokes).toHaveLength(3);
    expect(new Set(strokes.map(entry => entry.id)).size).toBe(3);
  });

  it('disabled prevents all drawing interaction', async () => {
    // The doc's own words, under Accessibility.
    const el = await mountPaint({ disabled: true });
    const events = captureEvents(el);
    await paintStroke(el, LINE);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a tap paints a dot', async () => {
    const el = await mountPaint({});
    await paintStroke(el, [[200, 200]]);
    const strokes = el.getStrokes();
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points).toEqual([{ x: 200, y: 200 }]);
  });

  it('the eraser toggles back to the pen', async () => {
    const el = await mountPaint({});
    pressControl(el, 'Eraser');
    await wait(SETTLE);
    expect(classesOf(canvasEl(el)).has('tool-eraser')).toBe(true);

    pressControl(el, 'Eraser');
    await wait(SETTLE);
    expect(classesOf(canvasEl(el)).has('tool-pen')).toBe(true);
  });
});

describe('snice-paint matrix: history', () => {
  async function paintThree(el: SnicePaintElement): Promise<void> {
    await paintStroke(el, [[10, 10], [60, 40]]);
    await paintStroke(el, [[80, 10], [130, 40]]);
    await paintStroke(el, [[150, 10], [200, 40]]);
  }

  it('undo removes the last stroke and announces it', async () => {
    const el = await mountPaint({});
    await paintThree(el);
    const events = captureEvents(el, ['paint-undo']);

    el.undo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
    expect(events.map(event => event.type)).toEqual(['paint-undo']);
    expect(events[0].detail).toEqual({});
  });

  it('redo puts it back', async () => {
    const el = await mountPaint({});
    await paintThree(el);
    const before = el.getStrokes();
    el.undo();
    await wait(SETTLE);
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(before);
  });

  it('undo to empty and redo back to full', async () => {
    const el = await mountPaint({});
    await paintThree(el);
    const before = el.getStrokes();

    for (let i = 0; i < 3; i++) { el.undo(); await wait(SETTLE); }
    expect(el.getStrokes()).toEqual([]);
    for (let i = 0; i < 3; i++) { el.redo(); await wait(SETTLE); }
    expect(el.getStrokes()).toEqual(before);
  });

  it('undo and redo on an empty canvas are silent no-ops', async () => {
    const el = await mountPaint({});
    const events = captureEvents(el);
    el.undo();
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a new stroke discards the redo stack', async () => {
    const el = await mountPaint({});
    await paintThree(el);
    el.undo();
    await wait(SETTLE);
    await paintStroke(el, [[220, 10], [280, 40]]);

    const events = captureEvents(el, ['paint-redo']);
    el.redo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(3);
    expect(events).toEqual([]);
  });

  it('clear empties the history and announces it', async () => {
    const el = await mountPaint({});
    await paintThree(el);
    const events = captureEvents(el, ['paint-clear']);

    el.clear();
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
    expect(events.map(event => event.type)).toEqual(['paint-clear']);
    expect(events[0].detail).toEqual({});
  });

  it('the toolbar buttons drive the same history the methods do', async () => {
    const el = await mountPaint({});
    await paintThree(el);

    expect(pressControl(el, 'Undo')).toBe(true);
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);

    expect(pressControl(el, 'Redo')).toBe(true);
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(3);

    expect(pressControl(el, 'Clear canvas')).toBe(true);
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual([]);
  });

  it('clear repaints the background rather than leaving a hole', async () => {
    const el = await mountPaint({ backgroundColor: '#abcdef' });
    await paintThree(el);
    canvas.reset();
    el.clear();
    await wait(SETTLE);
    expect(canvas.operations.some(op => op.startsWith('fillRect'))).toBe(true);
  });
});

describe('snice-paint matrix: setStrokes / getStrokes', () => {
  for (const [name, fixture] of Object.entries(STROKE_FIXTURES)) {
    it(`${name}: setStrokes then getStrokes round-trips`, async () => {
      const el = await mountPaint({});
      el.setStrokes(fixture);
      await wait(SETTLE);
      expect(el.getStrokes()).toEqual(fixture);
    });
  }

  it('setStrokes replaces rather than appends', async () => {
    const el = await mountPaint({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    el.setStrokes(STROKE_FIXTURES.single);
    await wait(SETTLE);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.single);
  });

  it('getStrokes hands back a copy of the list', async () => {
    // "getStrokes() — Get copy of all strokes".
    const el = await mountPaint({});
    el.setStrokes(STROKE_FIXTURES.single);
    await wait(SETTLE);

    const first = el.getStrokes();
    first.push(STROKE_FIXTURES.many[0]);
    expect(el.getStrokes()).toHaveLength(1);
  });

  it('loaded strokes join the undo history', async () => {
    const el = await mountPaint({});
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE);
    el.undo();
    await wait(SETTLE);
    expect(el.getStrokes()).toHaveLength(2);
  });

  it('setStrokes before the canvas exists is applied once it does', async () => {
    // The doc's own usage — `paint.setStrokes(strokes)` right after creating
    // the element — must not silently lose the drawing.
    const el = document.createElement('snice-paint') as SnicePaintElement;
    document.body.appendChild(el);
    await (el as any).ready;
    el.setStrokes(STROKE_FIXTURES.many);
    await wait(SETTLE * 3);
    expect(el.getStrokes()).toEqual(STROKE_FIXTURES.many);
  });

  it('a painted drawing survives a save and reload', async () => {
    const el = await mountPaint({ color: '#10b981', strokeWidth: 5 });
    await paintStroke(el, LINE);
    const saved = el.getStrokes();

    const other = await mountPaint({});
    other.setStrokes(saved);
    await wait(SETTLE);
    expect(other.getStrokes()).toEqual(saved);
  });
});

describe('snice-paint matrix: export', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp'] as const) {
    it(`toDataURL('${type}') returns a data url of that type`, async () => {
      const el = await mountPaint({});
      await paintStroke(el, LINE);
      expect(el.toDataURL(type).startsWith(`data:${type}`)).toBe(true);
    });
  }

  it('toDataURL defaults to png', async () => {
    const el = await mountPaint({});
    expect(el.toDataURL().startsWith('data:image/png')).toBe(true);
  });

  it('toBlob resolves a blob of the requested type', async () => {
    const el = await mountPaint({});
    const blob = await el.toBlob('image/jpeg');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('download names the file the caller asked for', async () => {
    const el = await mountPaint({});
    const clicked: Array<{ name: string; href: string }> = [];
    const anchor = document.createElement('a');
    anchor.click = () => { clicked.push({ name: anchor.download, href: anchor.href }); };
    const create = document.createElement.bind(document);
    (document as any).createElement = (tag: string) => (tag === 'a' ? anchor : create(tag));
    try {
      el.download('artwork.png');
    } finally {
      (document as any).createElement = create;
    }

    expect(clicked).toHaveLength(1);
    expect(clicked[0].name).toBe('artwork.png');
    expect(clicked[0].href.startsWith('data:image/png')).toBe(true);
  });
});
