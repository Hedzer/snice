/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-paint feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted in this directory comes from `docs/ai/components/paint.md`
 * plus `snice-paint.types.ts`:
 *
 *   · PROPERTIES — `color`, `strokeWidth` / `minStrokeWidth` / `maxStrokeWidth`,
 *     `controls` (a comma list over the six documented `PaintControl` values),
 *     `backgroundColor`, `colorSelects` ("extra color picker dots"),
 *     `disabled`, and the `colors` getter/setter with its documented default
 *     palette of eight.
 *   · CSS PARTS — `base`, `toolbar`, `canvas-wrap`, `canvas`.
 *   · SLOTS — `toolbar-start`, `colors`, `size`, `tools`, `toolbar-end`.
 *   · METHODS — `undo`, `redo`, `clear`, `toDataURL`, `toBlob`, `download`,
 *     `getStrokes` ("Get copy of all strokes"), `setStrokes`.
 *   · EVENTS — `paint-start { point }`, `paint-end { stroke }`, `paint-clear
 *     {}`, `paint-undo {}`, `paint-redo {}`, `color-select { color, index }`.
 *   · A11Y — "Toolbar buttons have title attributes for tooltips", "Disabled
 *     state prevents all drawing interaction".
 *
 * ── What is stood in for, and why ───────────────────────────────────────────
 *
 * The same two environment gaps the draw matrix documents: happy-dom has no
 * canvas (covered by the shared `media-mock` recorder context) and reports a
 * zero box for everything, while the component measures its canvas wrapper to
 * size the drawing buffer and to map pointer coordinates. `installPaintStack()`
 * closes exactly those gaps and nothing else.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import { installCanvasMock, restoreCanvasMock, type CanvasMock } from '../media-mock';
import { exactPart, exactParts } from '../part-exact';
import '../../../packages/components/src/paint/snice-paint';
import type {
  PaintControl, PaintStroke, Point, SnicePaintElement,
} from '../../../packages/components/src/paint/snice-paint.types';

export { wait, type CanvasMock };
export type { PaintControl, PaintStroke, Point, SnicePaintElement };

/** Render settle window. */
export const SETTLE = 30;

/** One animation frame, plus slack: `initCanvas` runs on rAF. */
export const FRAME = 24;

/** Every documented `PaintControl`, in the documented default order. */
export const CONTROLS: PaintControl[] = ['colors', 'size', 'eraser', 'undo', 'redo', 'clear'];

/** The documented default palette. */
export const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#e2e8f0', '#1e293b',
];

/** The four documented CSS parts. */
export const DOC_PARTS = ['base', 'toolbar', 'canvas-wrap', 'canvas'] as const;

/** The five documented slots. */
export const DOC_SLOTS = ['toolbar-start', 'colors', 'size', 'tools', 'toolbar-end'] as const;

/** The box every canvas wrapper in this suite is laid out at. */
export const BOX = { width: 600, height: 400 };

/** The accessible name each control button carries (its documented title). */
export const CONTROL_TITLES: Record<PaintControl, string | null> = {
  colors: null,   // swatches are not buttons
  size: null,     // the size control is a range input
  eraser: 'Eraser',
  undo: 'Undo',
  redo: 'Redo',
  clear: 'Clear canvas',
};

// ── Environment stand-ins ───────────────────────────────────────────────────

const patched: Array<[any, string, PropertyDescriptor | undefined]> = [];

function define(target: any, name: string, value: any): void {
  patched.push([target, name, Object.getOwnPropertyDescriptor(target, name)]);
  Object.defineProperty(target, name, { configurable: true, writable: true, value });
}

/**
 * Give the canvas and its wrapper a real display box, and working pointer
 * capture. `initCanvas()` sizes the drawing buffer from the WRAPPER's box and
 * `getPointerPosition()` maps client coordinates through the CANVAS's, so both
 * have to be real or every coordinate divides by zero.
 */
export function installPaintBox(width = BOX.width, height = BOX.height): void {
  const rect = () => ({
    x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height,
    toJSON() { return this; },
  });
  define(HTMLCanvasElement.prototype, 'getBoundingClientRect', rect);
  define(HTMLDivElement.prototype, 'getBoundingClientRect', rect);
  define(HTMLCanvasElement.prototype, 'setPointerCapture', () => {});
  define(HTMLCanvasElement.prototype, 'releasePointerCapture', () => {});
}

export function restorePaintBox(): void {
  for (const [target, name, descriptor] of patched.reverse()) {
    if (descriptor) Object.defineProperty(target, name, descriptor);
    else delete target[name];
  }
  patched.length = 0;
}

export function installPaintStack(): CanvasMock {
  installPaintBox();
  return installCanvasMock();
}

export function restorePaintStack(): void {
  restoreCanvasMock();
  restorePaintBox();
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface PaintCombo {
  color?: string;
  strokeWidth?: number;
  minStrokeWidth?: number;
  maxStrokeWidth?: number;
  controls?: string;
  backgroundColor?: string;
  colorSelects?: number;
  disabled?: boolean;
  colors?: string[];
  /** Light-DOM children, for the five documented slots. */
  html?: string;
}

export function comboId(combo: PaintCombo): string {
  return `controls=[${combo.controls ?? CONTROLS.join(',')}]`
    + `/color=${combo.color ?? '#3b82f6'}`
    + `/width=${combo.strokeWidth ?? 3}`
    + `${combo.colorSelects ? `/selects=${combo.colorSelects}` : ''}`
    + `${combo.disabled ? '/disabled' : ''}`;
}

const ATTRIBUTES: Record<string, string> = {
  strokeWidth: 'stroke-width',
  minStrokeWidth: 'min-stroke-width',
  maxStrokeWidth: 'max-stroke-width',
  backgroundColor: 'background-color',
  colorSelects: 'color-selects',
};

/**
 * Mount one combo. Attributes go on before connection, because the component
 * reads its `colors` attribute and its slotted toolbar content during the first
 * render — a post-connect write would measure a different first paint.
 */
export async function mountPaint(combo: PaintCombo = {}): Promise<SnicePaintElement> {
  const el = document.createElement('snice-paint') as SnicePaintElement;
  for (const [key, value] of Object.entries(combo)) {
    if (value === undefined || key === 'html' || key === 'colors') continue;
    const name = ATTRIBUTES[key] ?? key;
    if (typeof value === 'boolean') { if (value) el.setAttribute(name, ''); continue; }
    el.setAttribute(name, String(value));
  }
  if (combo.colors) el.setAttribute('colors', JSON.stringify(combo.colors));
  if (combo.html) el.innerHTML = combo.html;
  document.body.appendChild(el);
  await (el as any).ready;
  await wait(FRAME * 2);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SnicePaintElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-paint rendered no shadow root');
  return root;
}

/**
 * The element exposing a part token — read EXACTLY.
 *
 * `[part~="canvas"]` is the correct CSS, but happy-dom's `~=` also matches the
 * hyphenated neighbour `part="canvas-wrap"`, and snice-paint documents both
 * names. `part-exact.ts` exists for precisely this environment defect; using it
 * here keeps the oracle counting the nodes the component actually rendered.
 */
export function partEl(el: SnicePaintElement, name: string): HTMLElement | null {
  return exactPart<HTMLElement>(el as HTMLElement, name);
}

/** Every element exposing a part token, read exactly. */
export function partEls(el: SnicePaintElement, name: string): HTMLElement[] {
  return exactParts<HTMLElement>(el as HTMLElement, name);
}

export function canvasEl(el: SnicePaintElement): HTMLCanvasElement | null {
  return sr(el).querySelector('canvas');
}

export function swatches(el: SnicePaintElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.paint-swatch')];
}

export function colorInputs(el: SnicePaintElement): HTMLInputElement[] {
  return [...sr(el).querySelectorAll<HTMLInputElement>('.paint-swatch-select')];
}

export function sizeSlider(el: SnicePaintElement): HTMLInputElement | null {
  return sr(el).querySelector<HTMLInputElement>('.paint-size-slider');
}

export function toolButtons(el: SnicePaintElement): HTMLButtonElement[] {
  return [...sr(el).querySelectorAll('button.paint-btn')];
}

/** The title of every toolbar button, in DOM order. */
export function buttonTitles(el: SnicePaintElement): string[] {
  return toolButtons(el).map(button => button.getAttribute('title') ?? '');
}

export function slot(el: SnicePaintElement, name: string): HTMLSlotElement | null {
  return sr(el).querySelector<HTMLSlotElement>(`slot[name="${name}"]`);
}

export function classesOf(node: Element | null): Set<string> {
  return new Set((node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
}

// ── Interaction ─────────────────────────────────────────────────────────────

function pointerEvent(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 1, clientX: x, clientY: y,
    bubbles: true, composed: true, cancelable: true,
  });
}

/**
 * Paint one stroke. Unlike the draw component, snice-paint samples the pointer
 * event directly, so no frame wait is needed between moves.
 */
export async function paintStroke(
  el: SnicePaintElement,
  points: Array<[number, number]> = [[100, 100], [200, 160], [300, 120]],
): Promise<void> {
  const canvas = canvasEl(el);
  if (!canvas) throw new Error('snice-paint rendered no canvas');
  canvas.dispatchEvent(pointerEvent('pointerdown', points[0][0], points[0][1]));
  for (const [x, y] of points.slice(1)) {
    canvas.dispatchEvent(pointerEvent('pointermove', x, y));
  }
  const last = points[points.length - 1];
  canvas.dispatchEvent(pointerEvent('pointerup', last[0], last[1]));
  await wait(SETTLE);
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Click a toolbar button by its documented title. */
export function pressControl(el: SnicePaintElement, title: string): boolean {
  const button = toolButtons(el).find(candidate => candidate.getAttribute('title') === title);
  if (!button) return false;
  click(button);
  return true;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

export function makeStroke(over: Partial<PaintStroke> = {}): PaintStroke {
  return {
    id: 'stroke-1',
    tool: 'pen',
    color: '#3b82f6',
    width: 3,
    points: [{ x: 10, y: 10 }, { x: 40, y: 60 }, { x: 90, y: 20 }],
    timestamp: 1700000000000,
    ...over,
  };
}

export const STROKE_FIXTURES: Record<string, PaintStroke[]> = {
  empty: [],
  single: [makeStroke()],
  many: [
    makeStroke({ id: 's1', color: '#ef4444' }),
    makeStroke({ id: 's2', color: '#10b981', tool: 'eraser', width: 12 }),
    makeStroke({ id: 's3', color: '#1e293b', width: 1 }),
  ],
  dot: [makeStroke({ id: 'dot', points: [{ x: 50, y: 50 }] })],
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

/** The set of controls a `controls` string asks for. */
export function requested(combo: PaintCombo): Set<PaintControl> {
  const list = (combo.controls ?? CONTROLS.join(','))
    .split(',').map(entry => entry.trim()).filter(Boolean);
  return new Set(list as PaintControl[]);
}

/**
 * The whole-shell oracle: the documented parts, the documented slots, the
 * requested controls and every documented default, judged at once.
 */
export function expectShell(el: SnicePaintElement, combo: PaintCombo): void {
  const problems = new Problems();
  const want = requested(combo);

  // ── Parts ───────────────────────────────────────────────────────────────
  for (const name of ['base', 'canvas-wrap', 'canvas'] as const) {
    problems.check(!!partEl(el, name), `missing part="${name}"`);
  }
  // The toolbar exists whenever any control was asked for.
  problems.equal(!!partEl(el, 'toolbar'), want.size > 0 || !!combo.html, 'part="toolbar" present');

  // ── The drawing surface names itself ────────────────────────────────────
  const canvas = canvasEl(el);
  problems.check(!!canvas, 'no <canvas>');
  if (canvas) {
    problems.equal(canvas.getAttribute('role'), 'img', 'canvas role');
    problems.check(!!canvas.getAttribute('aria-label'), 'canvas has no aria-label');
  }

  // ── Controls ────────────────────────────────────────────────────────────
  // "colors" and "size" are not buttons; the other four are, and each is
  // documented to carry a title for its tooltip.
  const expectedTitles = (['eraser', 'undo', 'redo', 'clear'] as const)
    .filter(name => want.has(name))
    .map(name => CONTROL_TITLES[name]!);
  problems.equal(buttonTitles(el), expectedTitles, 'toolbar button titles');
  problems.equal(swatches(el).length > 0, want.has('colors'), 'colour swatches present');
  problems.equal(!!sizeSlider(el), want.has('size'), 'size slider present');

  // ── Slots ───────────────────────────────────────────────────────────────
  // All five are documented extension points; they only exist when there is a
  // toolbar to extend.
  if (want.size > 0 || combo.html) {
    for (const name of DOC_SLOTS) {
      problems.check(!!slot(el, name), `missing <slot name="${name}">`);
    }
  }

  // ── Properties survived their documented channel ────────────────────────
  const expectations: Array<[string, unknown, unknown]> = [
    ['color', el.color, combo.color ?? '#3b82f6'],
    ['strokeWidth', el.strokeWidth, combo.strokeWidth ?? 3],
    ['minStrokeWidth', el.minStrokeWidth, combo.minStrokeWidth ?? 1],
    ['maxStrokeWidth', el.maxStrokeWidth, combo.maxStrokeWidth ?? 20],
    ['controls', el.controls, combo.controls ?? CONTROLS.join(',')],
    ['backgroundColor', el.backgroundColor, combo.backgroundColor ?? '#ffffff'],
    ['colorSelects', el.colorSelects, combo.colorSelects ?? 0],
    ['disabled', el.disabled, !!combo.disabled],
    ['colors', el.colors, combo.colors ?? DEFAULT_COLORS],
  ];
  for (const [name, actual, expected] of expectations) {
    problems.equal(actual, expected, name);
  }

  expectClean(problems, comboId(combo));
}

/** `getStrokes()` returns `PaintStroke[]`; assert the documented shape. */
export function expectStrokeShape(strokes: PaintStroke[], id: string): void {
  const problems = new Problems();
  strokes.forEach((entry, index) => {
    problems.equal(Object.keys(entry).sort(),
      ['color', 'id', 'points', 'timestamp', 'tool', 'width'], `stroke ${index} keys`);
    problems.check(entry.tool === 'pen' || entry.tool === 'eraser',
      `stroke ${index} tool "${entry.tool}"`);
    problems.check(Array.isArray(entry.points) && entry.points.length > 0,
      `stroke ${index} has no points`);
    for (const point of entry.points ?? []) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        problems.list.push(`stroke ${index} has a non-finite point ${JSON.stringify(point)}`);
        break;
      }
    }
  });
  expectClean(problems, id);
}

export const ALL_EVENTS = [
  'paint-start', 'paint-end', 'paint-clear', 'paint-undo', 'paint-redo', 'color-select',
];

export function captureEvents(
  el: SnicePaintElement,
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
