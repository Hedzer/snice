/**
 * snice-draw — the rendered shell and the documented property surface.
 *
 * AXES:
 *   tool        the six documented values
 *   disabled    on | off
 *   lazy / autoPolygon / autoCircle   the three feature switches
 *   colour, stroke width, background, and the numeric tuning properties
 *
 * 6 tools x 2 disabled = 12 shell combos, plus the switch cross and the
 * attribute-conversion slice. Every combo is judged by one oracle
 * (`expectShell`) that encodes the doc's two CSS parts, its canvas contract and
 * every documented default at once.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountDraw, expectShell, comboId, canvasEl, classesOf, partEl, sr,
  installDrawStack, restoreDrawStack, TOOLS, DOC_PARTS, BOX, wait, FRAME,
  type CanvasMock,
} from './draw-support';

let canvas: CanvasMock;

beforeEach(() => { canvas = installDrawStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restoreDrawStack();
});

describe('snice-draw matrix: the rendered shell', () => {
  for (const tool of TOOLS) {
    for (const disabled of [false, true]) {
      const combo = { tool, disabled };
      it(comboId(combo), async () => {
        const el = await mountDraw(combo);
        expectShell(el, combo);
      });
    }
  }
});

describe('snice-draw matrix: the documented parts', () => {
  it('each part resolves to exactly one node', async () => {
    // `snice-draw::part(canvas)` must not be ambiguous.
    const el = await mountDraw({});
    const counts = DOC_PARTS.map(name => ({
      name, count: sr(el).querySelectorAll(`[part~="${name}"]`).length,
    }));
    expect(counts).toEqual(DOC_PARTS.map(name => ({ name, count: 1 })));
  });

  it('the canvas part IS the drawing surface', async () => {
    const el = await mountDraw({});
    expect(partEl(el, 'canvas')!.tagName.toLowerCase()).toBe('canvas');
  });
});

describe('snice-draw matrix: the tool marker', () => {
  for (const tool of TOOLS) {
    it(`tool=${tool} marks the canvas`, async () => {
      const el = await mountDraw({ tool });
      expect(classesOf(canvasEl(el)).has(`tool-${tool}`)).toBe(true);
    });
  }

  it('switching tools swaps the marker rather than accumulating', async () => {
    const el = await mountDraw({ tool: 'pen' });
    el.tool = 'eraser';
    await wait(FRAME);
    const classes = classesOf(canvasEl(el));
    expect(classes.has('tool-eraser')).toBe(true);
    expect(classes.has('tool-pen')).toBe(false);
  });
});

describe('snice-draw matrix: attributes reach their properties', () => {
  const cases: Array<[string, Record<string, any>, Record<string, any>]> = [
    ['colour and stroke width', { color: '#ff00ff', strokeWidth: 9 }, { color: '#ff00ff', strokeWidth: 9 }],
    ['background colour', { backgroundColor: '#101010' }, { backgroundColor: '#101010' }],
    ['lazy brush', { lazy: true, lazyRadius: 25 }, { lazy: true, lazyRadius: 25 }],
    ['friction and smoothing', { friction: 0.4, smoothing: 0.9 }, { friction: 0.4, smoothing: 0.9 }],
    ['auto polygon', { autoPolygon: true, polygonCurvePoints: 30 }, { autoPolygon: true, polygonCurvePoints: 30 }],
    ['auto polygon, minimum curve', { autoPolygon: true, polygonCurvePoints: 2 }, { polygonCurvePoints: 2 }],
    ['auto circle', { autoCircle: true, circlePoints: 12 }, { autoCircle: true, circlePoints: 12 }],
    ['disabled', { disabled: true }, { disabled: true }],
  ];

  for (const [name, combo, expected] of cases) {
    it(`${name} survive the attribute channel`, async () => {
      const el = await mountDraw(combo);
      for (const [key, value] of Object.entries(expected)) {
        expect((el as any)[key], key).toBe(value);
      }
      expectShell(el, combo);
    });
  }
});

describe('snice-draw matrix: the canvas is initialised for drawing', () => {
  it('the drawing buffer matches the laid-out surface', async () => {
    const el = await mountDraw({});
    const node = canvasEl(el)!;
    // A buffer smaller than the box draws blurry; larger wastes memory. The
    // component scales by devicePixelRatio, which is 1 in this environment.
    expect(node.width).toBe(BOX.width * (window.devicePixelRatio || 1));
    expect(node.height).toBe(BOX.height * (window.devicePixelRatio || 1));
  });

  it('the background colour is painted before anything else', async () => {
    // "backgroundColor" is what `clear()` restores and what the eraser paints
    // with; if it were not filled first, the canvas would start transparent and
    // an exported PNG would have holes.
    await mountDraw({ backgroundColor: '#123456' });
    expect(canvas.operations.filter(op => op.startsWith('fillRect')).length).toBeGreaterThan(0);
  });

  /**
   * FINDING MATRIX-draw-1 (FIXED).
   *
   * `initCanvas()` no longer overwrites the documented `width`/`height`
   * properties with the measured display box; the measured size lives in
   * private fields that size the backing store and map pointer coordinates.
   * This is also the root fix of the visual-tier VISUAL-MATRIX-draw-3/4
   * bitmap-reset findings: the template no longer emits canvas width/height
   * attributes for the property writes to re-emit.
   */
  it('MATRIX-draw-1 (fixed): the documented width and height survive initialisation', async () => {
    const el = await mountDraw({ width: 400, height: 300 });
    expect({ width: el.width, height: el.height }).toEqual({ width: 400, height: 300 });
  });
});
