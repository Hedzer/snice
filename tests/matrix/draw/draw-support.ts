/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-draw feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted in this directory comes from `docs/ai/components/draw.md`
 * plus `snice-draw.types.ts`:
 *
 *   · PROPERTIES — `width`/`height`, `tool` (six documented values), `color`,
 *     `strokeWidth` (attr `stroke-width`), `backgroundColor` (attr
 *     `background-color`), `lazy` + `lazyRadius` + `friction` + `smoothing`,
 *     `autoPolygon` + `polygonCurvePoints` ("2-30"), `autoCircle` +
 *     `circlePoints`, and `disabled`.
 *   · METHODS — `clear`, `undo`, `redo`, `toDataURL(type?, quality?)`,
 *     `toBlob`, `download`, `loadImage(url)`, `getStrokes()`, `setStrokes()`.
 *   · DRAWSTROKE — `{ id, tool, color, width, points, timestamp }`, with
 *     `points` of `{ x, y, pressure? }`. This is the type a consumer saves and
 *     reloads, which is what makes `getStrokes`/`setStrokes` assertable.
 *   · EVENTS — `draw-start { draw, point }`, `draw-end { draw, stroke }`,
 *     `draw-clear { draw }`, `draw-undo { draw }`, `draw-redo { draw }`.
 *
 * ── What is stood in for, and why ───────────────────────────────────────────
 *
 * happy-dom has no canvas and no pointer capture, and reports a zero box for
 * every element. `media-mock.ts` supplies the recording 2D context plus
 * `toDataURL`/`toBlob` — reused here unchanged. This module adds only what is
 * specific to a pointer-driven canvas component:
 *
 *   · `installCanvasBox()` — a real display box for every `<canvas>`. The
 *     component measures its canvas to size the drawing buffer and to map
 *     pointer coordinates; with the environment's 0x0 box every coordinate
 *     would divide by zero and the matrix would be measuring happy-dom.
 *   · `installPointerCapture()` — `setPointerCapture` does not exist at all.
 *   · `stroke()` — drives a real `pointerdown → pointermove* → pointerup`
 *     gesture, waiting a frame between moves because the component samples the
 *     pointer from a `requestAnimationFrame` loop, exactly as a real drag does.
 *
 * What stays for the visual tier: that the strokes are actually PAINTED, and
 * where. A recorded `ctx` call list proves the component asked for the right
 * drawing operations; only a real engine proves pixels landed.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import { installCanvasMock, restoreCanvasMock, type CanvasMock } from '../media-mock';
import '../../../packages/components/src/draw/snice-draw';
import type {
  DrawStroke, DrawTool, Point, SniceDrawElement,
} from '../../../packages/components/src/draw/snice-draw.types';

export { wait, type CanvasMock };
export type { DrawStroke, DrawTool, Point, SniceDrawElement };

/** Render settle window: the component renders on a microtask plus a task. */
export const SETTLE = 30;

/** One animation frame, plus slack. The stroke sampler runs on rAF. */
export const FRAME = 24;

/** Every documented `tool`. */
export const TOOLS: DrawTool[] = ['pen', 'eraser', 'line', 'rectangle', 'circle', 'text'];

/** The two documented CSS parts. */
export const DOC_PARTS = ['base', 'canvas'] as const;

/** The box every canvas in this suite is laid out at. */
export const BOX = { width: 800, height: 600 };

// ── Environment stand-ins ───────────────────────────────────────────────────

const patched: Array<[string, PropertyDescriptor | undefined]> = [];

function define(name: string, value: any): void {
  patched.push([name, Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name)]);
  Object.defineProperty(HTMLCanvasElement.prototype, name, {
    configurable: true, writable: true, value,
  });
}

/**
 * Give every `<canvas>` a real display box and working pointer capture.
 *
 * Both are platform facilities happy-dom does not implement, and the component
 * reads both on its very first frame: `initCanvas()` sizes the drawing buffer
 * from `getBoundingClientRect()`, and `handlePointerDown` captures the pointer
 * so a drag that leaves the element still draws.
 */
export function installCanvasBox(width = BOX.width, height = BOX.height): void {
  define('getBoundingClientRect', function () {
    return {
      x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height,
      toJSON() { return this; },
    };
  });
  define('setPointerCapture', () => {});
  define('releasePointerCapture', () => {});
}

export function restoreCanvasBox(): void {
  for (const [name, descriptor] of patched.reverse()) {
    if (descriptor) Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor);
    else delete (HTMLCanvasElement.prototype as any)[name];
  }
  patched.length = 0;
}

let imagePatch: PropertyDescriptor | undefined;
let imageInstalled = false;

/** `loadImage(url)` awaits a decoded `Image`; happy-dom never decodes one. */
export function installImageDecoder(options: { fail?: boolean } = {}): void {
  if (imageInstalled) restoreImageDecoder();
  imagePatch = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLImageElement) { return this.getAttribute('src') ?? ''; },
    set(this: any, value: string) {
      this.setAttribute('src', value);
      queueMicrotask(() => (options.fail ? this.onerror?.(new Event('error')) : this.onload?.()));
    },
  });
  imageInstalled = true;
}

export function restoreImageDecoder(): void {
  if (!imageInstalled) return;
  if (imagePatch) Object.defineProperty(HTMLImageElement.prototype, 'src', imagePatch);
  else delete (HTMLImageElement.prototype as any).src;
  imageInstalled = false;
}

export function installDrawStack(): CanvasMock {
  installCanvasBox();
  installImageDecoder();
  return installCanvasMock();
}

export function restoreDrawStack(): void {
  restoreImageDecoder();
  restoreCanvasMock();
  restoreCanvasBox();
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface DrawCombo {
  width?: number;
  height?: number;
  tool?: DrawTool;
  color?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  lazy?: boolean;
  lazyRadius?: number;
  friction?: number;
  smoothing?: number;
  autoPolygon?: boolean;
  polygonCurvePoints?: number;
  autoCircle?: boolean;
  circlePoints?: number;
  disabled?: boolean;
}

export function comboId(combo: DrawCombo): string {
  const flags = (['lazy', 'autoPolygon', 'autoCircle', 'disabled'] as const)
    .filter(name => combo[name]);
  return `tool=${combo.tool ?? 'pen'}`
    + `/width=${combo.strokeWidth ?? 2}`
    + `/color=${combo.color ?? '#000000'}`
    + `/[${flags.join(',') || 'plain'}]`;
}

const ATTRIBUTES: Record<string, string> = {
  strokeWidth: 'stroke-width',
  backgroundColor: 'background-color',
  lazyRadius: 'lazy-radius',
  autoPolygon: 'auto-polygon',
  polygonCurvePoints: 'polygon-curve-points',
  autoCircle: 'auto-circle',
  circlePoints: 'circle-points',
};

/**
 * Mount one combo through the ATTRIBUTE channel — the doc's usage is markup
 * (`<snice-draw width="800" tool="pen" stroke-width="2">`) — and then let the
 * first animation frame initialise the canvas, because nothing the component
 * promises works before that.
 */
export async function mountDraw(combo: DrawCombo = {}): Promise<SniceDrawElement> {
  const el = document.createElement('snice-draw') as SniceDrawElement;
  for (const [key, value] of Object.entries(combo)) {
    if (value === undefined) continue;
    const name = ATTRIBUTES[key] ?? key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
    if (typeof value === 'boolean') { if (value) el.setAttribute(name, ''); continue; }
    el.setAttribute(name, String(value));
  }
  document.body.appendChild(el);
  await (el as any).ready;
  await wait(FRAME * 2);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceDrawElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-draw rendered no shadow root');
  return root;
}

export function partEl(el: SniceDrawElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function canvasEl(el: SniceDrawElement): HTMLCanvasElement | null {
  return sr(el).querySelector('canvas');
}

export function classesOf(node: Element | null): Set<string> {
  return new Set((node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
}

// ── Interaction ─────────────────────────────────────────────────────────────

function pointerEvent(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 1, clientX: x, clientY: y, pressure: 0.5,
    bubbles: true, composed: true, cancelable: true,
  });
}

/**
 * Draw one stroke. The component samples the pointer from its own rAF loop, so
 * each move waits a frame — that is what a real drag looks like to it, and a
 * burst of synchronous moves would sample only the last one.
 */
export async function stroke(
  el: SniceDrawElement,
  points: Array<[number, number]>,
): Promise<void> {
  const canvas = canvasEl(el);
  if (!canvas) throw new Error('snice-draw rendered no canvas');
  canvas.dispatchEvent(pointerEvent('pointerdown', points[0][0], points[0][1]));
  await wait(FRAME);
  for (const [x, y] of points.slice(1)) {
    canvas.dispatchEvent(pointerEvent('pointermove', x, y));
    await wait(FRAME);
  }
  const last = points[points.length - 1];
  canvas.dispatchEvent(pointerEvent('pointerup', last[0], last[1]));
  await wait(SETTLE);
}

/** A long, obviously non-degenerate gesture: enough points to close a shape. */
export function ring(cx = 400, cy = 300, r = 120, steps = 24): Array<[number, number]> {
  return Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as [number, number];
  });
}

// ── Fixtures ────────────────────────────────────────────────────────────────

export function makeStroke(over: Partial<DrawStroke> = {}): DrawStroke {
  return {
    id: 'stroke-1',
    tool: 'pen',
    color: '#ff0000',
    width: 4,
    points: [{ x: 10, y: 10 }, { x: 40, y: 60 }, { x: 90, y: 20 }],
    timestamp: 1700000000000,
    ...over,
  };
}

/** Named stroke lists, one per interesting `setStrokes` shape. */
export const STROKE_FIXTURES: Record<string, DrawStroke[]> = {
  empty: [],
  single: [makeStroke()],
  many: [
    makeStroke({ id: 's1', color: '#ff0000', tool: 'pen' }),
    makeStroke({ id: 's2', color: '#00ff00', tool: 'eraser', width: 12 }),
    makeStroke({ id: 's3', color: '#0000ff', tool: 'rectangle', width: 1 }),
  ],
  dot: [makeStroke({ id: 'dot', points: [{ x: 50, y: 50 }] })],
  degenerate: [makeStroke({ id: 'none', points: [] })],
};

// ── Oracles ─────────────────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];

  check(ok: boolean, message: string): boolean {
    if (!ok) this.list.push(message);
    return ok;
  }

  equal(actual: unknown, expected: unknown, what: string): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, id: string): void {
  expect(problems.list, `combo ${id}`).toEqual([]);
}

/** The shell oracle: the two documented parts and the property round trip. */
export function expectShell(el: SniceDrawElement, combo: DrawCombo): void {
  const problems = new Problems();

  for (const name of DOC_PARTS) {
    problems.check(!!partEl(el, name), `missing part="${name}"`);
  }

  const canvas = canvasEl(el);
  problems.check(!!canvas, 'no <canvas>');
  if (canvas) {
    // "canvas - Drawing canvas element": the drawing surface IS the part, and
    // it has to name itself for assistive technology.
    problems.equal(canvas.getAttribute('role'), 'img', 'canvas role');
    problems.check(!!canvas.getAttribute('aria-label'), 'canvas has no aria-label');
    // The active tool is on the element, so a cursor can follow it.
    problems.check(classesOf(canvas).has(`tool-${combo.tool ?? 'pen'}`),
      `canvas is missing tool-${combo.tool ?? 'pen'}`);
    problems.equal(classesOf(canvas).has('disabled'), !!combo.disabled, 'disabled class');
  }

  const expectations: Array<[string, unknown, unknown]> = [
    ['tool', el.tool, combo.tool ?? 'pen'],
    ['color', el.color, combo.color ?? '#000000'],
    ['strokeWidth', el.strokeWidth, combo.strokeWidth ?? 2],
    ['backgroundColor', el.backgroundColor, combo.backgroundColor ?? '#ffffff'],
    ['lazy', el.lazy, !!combo.lazy],
    ['lazyRadius', el.lazyRadius, combo.lazyRadius ?? 60],
    ['friction', el.friction, combo.friction ?? 0.1],
    ['smoothing', el.smoothing, combo.smoothing ?? 0.5],
    ['autoPolygon', el.autoPolygon, !!combo.autoPolygon],
    ['polygonCurvePoints', el.polygonCurvePoints, combo.polygonCurvePoints ?? 10],
    ['autoCircle', el.autoCircle, !!combo.autoCircle],
    ['circlePoints', el.circlePoints, combo.circlePoints ?? 50],
    ['disabled', el.disabled, !!combo.disabled],
  ];
  for (const [name, actual, expected] of expectations) {
    problems.equal(actual, expected, name);
  }

  expectClean(problems, comboId(combo));
}

/** `getStrokes()` returns `DrawStroke[]`; assert the documented shape. */
export function expectStrokeShape(strokes: DrawStroke[], id: string): void {
  const problems = new Problems();
  strokes.forEach((entry, index) => {
    problems.equal(Object.keys(entry).sort(),
      ['color', 'id', 'points', 'timestamp', 'tool', 'width'], `stroke ${index} keys`);
    problems.check(typeof entry.id === 'string' && entry.id.length > 0, `stroke ${index} has no id`);
    problems.check(TOOLS.includes(entry.tool), `stroke ${index} tool "${entry.tool}"`);
    problems.check(Array.isArray(entry.points), `stroke ${index} points is not an array`);
    problems.check(typeof entry.timestamp === 'number' && entry.timestamp > 0,
      `stroke ${index} timestamp ${entry.timestamp}`);
    for (const point of entry.points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        problems.list.push(`stroke ${index} has a non-finite point ${JSON.stringify(point)}`);
        break;
      }
    }
  });
  expectClean(problems, id);
}

/** Record the named events in dispatch order. */
export const ALL_EVENTS = ['draw-start', 'draw-end', 'draw-clear', 'draw-undo', 'draw-redo'];

export function captureEvents(
  el: SniceDrawElement,
  types: string[] = ALL_EVENTS,
): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}

/** Every recorded 2D operation whose name matches, in order. */
export function opsMatching(canvas: CanvasMock, name: string): string[] {
  return canvas.operations.filter(op => op.startsWith(name));
}
