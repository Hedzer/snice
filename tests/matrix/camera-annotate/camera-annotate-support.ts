/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-camera-annotate feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every assertion in this directory routes through this module so no combo can
 * quietly assert something weaker than `docs/ai/components/camera-annotate.md`
 * plus `snice-camera-annotate.types.ts`:
 *
 *   · PROPERTIES — `mode` ('camera' | 'annotate'), `autoStart` (attr
 *     `auto-start`), `autoRotateColors` (attr `auto-rotate-colors`, default
 *     TRUE) and `showLabelsPanel` (attr `show-labels-panel`, default TRUE).
 *     Two of the four default to true, so turning them off can only be
 *     expressed through the property channel — an absent boolean attribute
 *     cannot mean "false" against a true default.
 *   · CSS PARTS — the doc names exactly four: `base` (outer layout container),
 *     `canvas` (video + drawing surface), `toolbar` (capture/retake, undo,
 *     clear, export) and `sidebar` (color palette + annotation labels).
 *   · METHODS — `capture()` ("Capture frame, switch to annotate mode"),
 *     `exportImage({ includeLabels })`, `exportAnnotations()`,
 *     `importAnnotations(data)` and `clearAnnotations()`. `exportAnnotations`
 *     is the one with a spelled-out return shape (`AnnotationData`: annotations,
 *     strokes, imageWidth, imageHeight), which is what makes the round trip
 *     assertable.
 *   · EVENTS — `capture { dataURL, width, height }`, `annotate { annotation }`,
 *     `annotation-change { annotations }`.
 *   · A11Y — "Color swatches have title attributes", "Annotation toggles have
 *     descriptive titles".
 *
 * ── What is stood in for, and why ───────────────────────────────────────────
 *
 * happy-dom has no capture stack and no image decoder. `media-mock.ts` covers
 * `getUserMedia`, the 2D context and `toDataURL`; the two stand-ins below cover
 * what only this component needs:
 *
 *   · `installImageDecoder()` — `capture()` awaits `new Image().onload` for the
 *     frame it just encoded. happy-dom never fires that event, so without this
 *     the documented `capture()` would hang forever and the matrix would be
 *     measuring the environment instead of the component.
 *   · `stubBox()` / `enablePointerCapture()` — the pointer drawing path reads
 *     `getBoundingClientRect()` (all zeros in happy-dom, which turns every
 *     canvas coordinate into NaN) and calls `setPointerCapture` (absent
 *     entirely). Both are environment gaps, not component behaviour.
 *
 * Anything needing real pixels — that a stroke is actually painted over the
 * captured frame, that the sidebar scrolls independently — belongs to the
 * visual tier at `tests/live/matrix/camera-annotate/`.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import {
  installCaptureStack, restoreCaptureStack, primeVideo,
  type MediaMock, type CanvasMock,
} from '../media-mock';
import '../../../packages/components/src/camera-annotate/snice-camera-annotate';
import type {
  Annotation, AnnotationData, AnnotationStroke, CameraAnnotateMode,
  SniceCameraAnnotateElement,
} from '../../../packages/components/src/camera-annotate/snice-camera-annotate.types';

export { wait, installCaptureStack, restoreCaptureStack, primeVideo };
export type {
  Annotation, AnnotationData, AnnotationStroke, CameraAnnotateMode,
  SniceCameraAnnotateElement, MediaMock, CanvasMock,
};

/** Render settle window: the component renders on a microtask plus a task. */
export const SETTLE = 40;

/** The two documented `mode` values. */
export const MODES: CameraAnnotateMode[] = ['camera', 'annotate'];

/** The four documented CSS parts. */
export const DOC_PARTS = ['base', 'canvas', 'toolbar', 'sidebar'] as const;

/** Frame size every combo captures at, so expectations can name real numbers. */
export const FRAME = { width: 800, height: 600 };

export interface AnnotateCombo {
  mode?: CameraAnnotateMode;
  autoStart?: boolean;
  autoRotateColors?: boolean;
  showLabelsPanel?: boolean;
}

export function comboId(combo: AnnotateCombo): string {
  return `mode=${combo.mode ?? 'camera'}`
    + `/panel=${combo.showLabelsPanel === false ? 'off' : 'on'}`
    + `/rotate=${combo.autoRotateColors === false ? 'off' : 'on'}`
    + `/autostart=${combo.autoStart ? 'on' : 'off'}`;
}

// ── Environment stand-ins ───────────────────────────────────────────────────

let imagePatched: PropertyDescriptor | undefined;
let imageInstalled = false;

/**
 * Make `new Image()` resolve its `onload` as a real decoder would.
 *
 * `capture()` is documented to capture a frame and switch to annotate mode; its
 * implementation encodes the frame and then awaits the decoded `Image`. Without
 * a decoder that promise never settles.
 */
export function installImageDecoder(): void {
  if (imageInstalled) return;
  imagePatched = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLImageElement) { return this.getAttribute('src') ?? ''; },
    set(this: HTMLImageElement & { onload?: (() => void) | null }, value: string) {
      this.setAttribute('src', value);
      Object.defineProperty(this, 'naturalWidth', { configurable: true, value: FRAME.width });
      Object.defineProperty(this, 'naturalHeight', { configurable: true, value: FRAME.height });
      queueMicrotask(() => this.onload?.());
    },
  });
  imageInstalled = true;
}

export function restoreImageDecoder(): void {
  if (!imageInstalled) return;
  if (imagePatched) Object.defineProperty(HTMLImageElement.prototype, 'src', imagePatched);
  else delete (HTMLImageElement.prototype as any).src;
  imageInstalled = false;
}

/** Give a shadow node a known box. happy-dom reports 0x0 for everything. */
export function stubBox(node: Element | null, width: number, height: number): void {
  if (!node) return;
  (node as any).getBoundingClientRect = () => ({
    x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height,
    toJSON() { return this; },
  });
}

/** Pointer capture is part of the platform happy-dom does not implement. */
export function enablePointerCapture(node: Element | null): void {
  if (!node) return;
  (node as any).setPointerCapture = () => {};
  (node as any).releasePointerCapture = () => {};
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo. `mode` and `auto-start` cross the ATTRIBUTE channel (the
 * doc's usage is markup); `autoRotateColors` and `showLabelsPanel` default to
 * true, so switching them OFF crosses the property channel.
 */
export async function mountAnnotator(combo: AnnotateCombo = {}): Promise<SniceCameraAnnotateElement> {
  const el = document.createElement('snice-camera-annotate') as SniceCameraAnnotateElement;
  if (combo.mode) el.setAttribute('mode', combo.mode);
  if (combo.autoStart) el.setAttribute('auto-start', '');
  document.body.appendChild(el);
  await (el as any).ready;
  if (combo.autoRotateColors === false) el.autoRotateColors = false;
  if (combo.showLabelsPanel === false) el.showLabelsPanel = false;
  await wait(SETTLE);

  const video = videoEl(el);
  if (video) primeVideo(video, FRAME.width, FRAME.height);
  const canvas = drawCanvas(el);
  stubBox(canvas, FRAME.width, FRAME.height);
  enablePointerCapture(canvas);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceCameraAnnotateElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-camera-annotate rendered no shadow root');
  return root;
}

export function partEl(el: SniceCameraAnnotateElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function videoEl(el: SniceCameraAnnotateElement): HTMLVideoElement | null {
  return sr(el).querySelector('video');
}

export function drawCanvas(el: SniceCameraAnnotateElement): HTMLCanvasElement | null {
  return sr(el).querySelector('canvas.ca-draw-canvas');
}

export function swatches(el: SniceCameraAnnotateElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.ca-color-swatch')];
}

export function annotationItems(el: SniceCameraAnnotateElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.ca-annotation-item')];
}

export function buttons(el: SniceCameraAnnotateElement): HTMLButtonElement[] {
  return [...sr(el).querySelectorAll('button')];
}

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** A node is "shown" unless it carries the component's own hidden marker. */
export function isHidden(node: Element | null): boolean {
  return !node || node.classList.contains('hidden');
}

// ── Interaction ─────────────────────────────────────────────────────────────

function pointer(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 1, clientX: x, clientY: y,
    bubbles: true, composed: true, cancelable: true,
  });
}

/**
 * Draw one freehand stroke over the annotate canvas. Three points, because the
 * component discards a gesture shorter than two — a tap is not a stroke.
 */
export async function drawOn(
  el: SniceCameraAnnotateElement,
  points: Array<[number, number]> = [[10, 10], [40, 40], [80, 20]],
): Promise<void> {
  const canvas = drawCanvas(el);
  if (!canvas) throw new Error('no annotate canvas to draw on');
  stubBox(canvas, FRAME.width, FRAME.height);
  enablePointerCapture(canvas);
  canvas.dispatchEvent(pointer('pointerdown', points[0][0], points[0][1]));
  for (const [x, y] of points.slice(1)) {
    canvas.dispatchEvent(pointer('pointermove', x, y));
  }
  const last = points[points.length - 1];
  canvas.dispatchEvent(pointer('pointerup', last[0], last[1]));
  await wait(SETTLE);
}

/** Capture a frame the documented way, then let the mode switch settle. */
export async function captureFrame(el: SniceCameraAnnotateElement): Promise<void> {
  const video = videoEl(el);
  if (video) primeVideo(video, FRAME.width, FRAME.height);
  await el.capture();
  await wait(SETTLE);
  const canvas = drawCanvas(el);
  stubBox(canvas, FRAME.width, FRAME.height);
  enablePointerCapture(canvas);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

export function makeStroke(id: string, color: string, width = 3): AnnotationStroke {
  return {
    id,
    color,
    width,
    points: [{ x: 10, y: 10 }, { x: 20, y: 30 }, { x: 40, y: 15 }],
    timestamp: 1700000000000,
  };
}

export function makeAnnotation(id: string, strokeId: string, over: Partial<Annotation> = {}): Annotation {
  return {
    id,
    strokeId,
    label: '',
    color: '#f87171',
    visible: true,
    timestamp: 1700000000000,
    ...over,
  };
}

/** Named `AnnotationData` fixtures, one per interesting import shape. */
export const DATA_FIXTURES: Record<string, AnnotationData> = {
  empty: { annotations: [], strokes: [], imageWidth: 0, imageHeight: 0 },
  single: {
    annotations: [makeAnnotation('a1', 's1', { label: 'Crack' })],
    strokes: [makeStroke('s1', '#f87171')],
    imageWidth: FRAME.width,
    imageHeight: FRAME.height,
  },
  multiple: {
    annotations: [
      makeAnnotation('a1', 's1', { label: 'Crack', color: '#f87171' }),
      makeAnnotation('a2', 's2', { label: 'Dent', color: '#60a5fa' }),
      makeAnnotation('a3', 's3', { label: '', color: '#34d399' }),
    ],
    strokes: [
      makeStroke('s1', '#f87171'),
      makeStroke('s2', '#60a5fa', 6),
      makeStroke('s3', '#34d399', 1),
    ],
    imageWidth: FRAME.width,
    imageHeight: FRAME.height,
  },
  hidden: {
    annotations: [
      makeAnnotation('a1', 's1', { label: 'Shown' }),
      makeAnnotation('a2', 's2', { label: 'Hidden', visible: false }),
    ],
    strokes: [makeStroke('s1', '#f87171'), makeStroke('s2', '#60a5fa')],
    imageWidth: FRAME.width,
    imageHeight: FRAME.height,
  },
  /** A stroke with no annotation pointing at it — importable, still exportable. */
  orphanStroke: {
    annotations: [],
    strokes: [makeStroke('s9', '#a78bfa')],
    imageWidth: 320,
    imageHeight: 240,
  },
};

// ── Oracles ─────────────────────────────────────────────────────────────────

/** Collected violations, asserted at once so a combo tells its whole story. */
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

/**
 * The whole-shell oracle: every documented structural promise of one combo.
 */
export function expectShellMatches(el: SniceCameraAnnotateElement, combo: AnnotateCombo): void {
  const problems = new Problems();
  const mode = combo.mode ?? 'camera';
  const panel = combo.showLabelsPanel !== false;

  // ── The four documented parts ───────────────────────────────────────────
  for (const name of DOC_PARTS) {
    problems.check(!!partEl(el, name), `missing part="${name}"`);
  }

  // ── The canvas area holds both surfaces the doc names ───────────────────
  // "canvas - Canvas area (video + drawing surface)".
  const video = videoEl(el);
  problems.check(!!video, 'no <video> in the canvas area');
  problems.check(!!drawCanvas(el), 'no drawing <canvas> in the canvas area');
  if (video) {
    // A preview that is not autoplay/muted/playsinline cannot show a live feed
    // without a user gesture in any browser.
    problems.check(video.hasAttribute('autoplay'), 'preview is not autoplay');
    problems.check(video.hasAttribute('playsinline'), 'preview is not playsinline');
    problems.check(video.hasAttribute('muted'), 'preview is not muted');
  }

  // ── Properties survived their documented channel ────────────────────────
  problems.equal(el.mode, mode, 'mode');
  problems.equal(el.autoRotateColors, combo.autoRotateColors !== false, 'autoRotateColors');
  problems.equal(el.showLabelsPanel, panel, 'showLabelsPanel');

  // ── `showLabelsPanel` actually shows or hides the labels panel ──────────
  const sidebar = partEl(el, 'sidebar');
  problems.equal(isHidden(sidebar), !panel, `sidebar hidden with showLabelsPanel=${panel}`);

  // ── The toolbar's primary action follows the mode ───────────────────────
  // "toolbar - Toolbar (capture/retake, undo, clear, export)".
  const toolbar = partEl(el, 'toolbar');
  const primary = toolbar?.querySelector('button');
  problems.equal(text(primary), mode === 'camera' ? 'Capture' : 'Retake', 'primary toolbar action');

  // The annotation tools only make sense once there is a frame to annotate.
  const toolbarText = text(toolbar);
  problems.equal(toolbarText.includes('Export'), mode === 'annotate', `Export offered in ${mode} mode`);

  // ── The palette, and its documented titles ──────────────────────────────
  // "Color swatches have title attributes".
  const palette = swatches(el);
  problems.check(palette.length > 0, 'no color swatches in the sidebar');
  for (const swatch of palette) {
    if (!swatch.getAttribute('title')) problems.list.push('color swatch without a title');
  }

  // ── Every control announces itself ──────────────────────────────────────
  for (const button of buttons(el)) {
    const name = button.getAttribute('aria-label') || button.getAttribute('title') || text(button);
    if (!name) problems.list.push(`unnamed control .${button.className}`);
  }

  expectClean(problems, comboId(combo));
}

/**
 * `exportAnnotations()` is documented to be JSON-serializable annotation data.
 * Assert the exact shape rather than "some object": a consumer saves this and
 * feeds it back to `importAnnotations`.
 */
export function expectExportShape(data: AnnotationData, expected: AnnotationData, id: string): void {
  const problems = new Problems();
  problems.equal(Object.keys(data ?? {}).sort(),
    ['annotations', 'imageHeight', 'imageWidth', 'strokes'], 'AnnotationData keys');
  problems.equal(data.annotations, expected.annotations, 'annotations');
  problems.equal(data.strokes, expected.strokes, 'strokes');
  problems.equal(data.imageWidth, expected.imageWidth, 'imageWidth');
  problems.equal(data.imageHeight, expected.imageHeight, 'imageHeight');
  // "Export annotation data (JSON-serializable)".
  problems.check(JSON.stringify(data) === JSON.stringify(JSON.parse(JSON.stringify(data))),
    'exported data does not survive a JSON round trip');
  expectClean(problems, id);
}

/** Record the named events in dispatch order. */
export function captureEvents(
  el: SniceCameraAnnotateElement,
  types: string[] = ['capture', 'annotate', 'annotation-change'],
): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** Sorted key list of an event detail — the shape a consumer destructures. */
export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}
