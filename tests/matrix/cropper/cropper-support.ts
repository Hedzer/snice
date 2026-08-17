/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-cropper feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is transcribed from `docs/ai/components/cropper.md`
 * and `packages/components/src/cropper/snice-cropper.types.ts`.
 *
 * The documented surface:
 *
 *   Summary      "Image cropping with draggable/resizable crop area, rotation,
 *                zoom, aspect ratio lock, and rule-of-thirds grid."
 *   Properties   src: string = ''
 *                aspectRatio: number = 0   (aspect-ratio; 0 = free, 1 = square,
 *                                           1.777 = 16:9)
 *                minWidth: number = 20     (min-width)
 *                minHeight: number = 20    (min-height)
 *                outputType: 'png'|'jpeg'|'webp' = 'png'  (output-type)
 *   Methods      crop(): Promise<Blob | null>  "Produce cropped image blob"
 *                rotate(degrees)  "Rotate image (cumulative)"
 *                zoom(level)      "Set zoom level (0.1 to 10)"
 *                reset()          "Reset rotation, zoom, and crop area"
 *   Events       crop-change   { rect: { x, y, width, height } }
 *                              "Crop area moved/resized"
 *                crop-complete { blob: Blob | null }
 *                              "After crop() produces output"
 *   Parts        base, image-container, crop-area
 *   A11y         "Drag to reposition, 8 handles to resize"
 *                "Rule-of-thirds grid overlay"
 *                "Dark mask indicates crop region"
 *                "Aspect ratio enforced on resize when set"
 *
 * ── What this tier can and cannot judge ────────────────────────────────────
 *
 * A cropper is a geometry component: every number it produces comes from the
 * measured box of its container and its image. happy-dom measures every box as
 * 0 and never loads an image, so the crop rectangle here is always the
 * degenerate one and `crop()` cannot run at all — the environment has no
 * `canvas.getContext`. That is a limit of the environment, not a finding, and
 * this file says so wherever it declines to assert.
 *
 * What DOES belong here is everything that is arithmetic or structure rather
 * than layout: the parts, the eight handles, the crop region's a11y contract,
 * the documented `zoom` clamp, the cumulative `rotate`, `reset`, and the shape
 * and emission of `crop-change`. Everything geometric — the initial centred
 * rect, the aspect-ratio lock, the rule-of-thirds overlay, the dark mask,
 * `crop()` itself and `crop-complete` — is asserted in the visual tier
 * (tests/live/matrix/cropper/cropper-visual.spec.ts).
 *
 * No findings: every claim in this directory passes.
 */
import { expect } from 'vitest';
import {
  mount, sr, all, wait, removeComponent, SETTLE, Problems, expectClean,
} from '../matrix-kit';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/cropper/snice-cropper';
import type {
  CropperOutputType, CropRect,
} from '../../../packages/components/src/cropper/snice-cropper.types';

export { wait, removeComponent, expectClean, Problems, SETTLE, expect };
export type { CropperOutputType, CropRect };

// ── Documented dimensions ───────────────────────────────────────────────────

/** The three documented output types. */
export const OUTPUT_TYPES: readonly CropperOutputType[] = ['png', 'jpeg', 'webp'];

/** Aspect ratios, including the three the doc names by example. */
export const ASPECT_RATIOS = [0, 1, 1.777, 0.5, 2.35] as const;

export const SOURCES: Record<string, string> = {
  none: '',
  relative: '/photo.jpg',
  absolute: 'https://example.org/photo.png',
  'data-uri': 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  query: '/photo.jpg?v=2&size=large',
};

/** The eight handles the accessibility section names. */
export const HANDLES = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'] as const;

// ── Combos ──────────────────────────────────────────────────────────────────

export interface CropperCombo {
  src: keyof typeof SOURCES;
  aspectRatio: number;
  minWidth: number;
  minHeight: number;
  outputType: CropperOutputType;
}

export function combo(overrides: Partial<CropperCombo> = {}): CropperCombo {
  return {
    src: 'relative',
    aspectRatio: 0,
    minWidth: 20,
    minHeight: 20,
    outputType: 'png',
    ...overrides,
  };
}

export function comboId(c: CropperCombo): string {
  return `src=${c.src}/aspect=${c.aspectRatio}/min=${c.minWidth}x${c.minHeight}/out=${c.outputType}`;
}

/**
 * Mount one combo. Every documented property has an attribute form and the doc
 * writes them all as attributes on `<snice-cropper>`, so all of them cross the
 * attribute channel and their converters with them.
 */
export async function makeCropper(c: CropperCombo): Promise<HTMLElement> {
  const attrs: Record<string, string | number> = {
    'aspect-ratio': c.aspectRatio,
    'min-width': c.minWidth,
    'min-height': c.minHeight,
    'output-type': c.outputType,
  };
  if (SOURCES[c.src]) attrs.src = SOURCES[c.src];
  const el = await mount<HTMLElement>('snice-cropper', attrs);
  await wait(SETTLE);
  return el;
}

// ── Reading the render ──────────────────────────────────────────────────────

export const DOCUMENTED_PARTS = ['base', 'image-container', 'crop-area'] as const;

export interface CropperFacts {
  presentParts: string[];
  imageSrc: string | null;
  imageAlt: string | null;
  imageTransform: string;
  /** `data-handle` of every resize handle, in render order. */
  handles: string[];
  cropRole: string | null;
  cropTabIndex: string | null;
  cropAriaLabel: string | null;
  cropStyle: string;
}

export function readFacts(el: HTMLElement): CropperFacts {
  const root = sr(el);
  const img = root.querySelector('img');
  const cropArea = root.querySelector<HTMLElement>('.crop-area');

  return {
    presentParts: DOCUMENTED_PARTS.filter(name => exactPart(el, name) !== null),
    imageSrc: img?.getAttribute('src') ?? null,
    imageAlt: img?.getAttribute('alt') ?? null,
    imageTransform: (img as HTMLElement | null)?.style?.transform ?? '',
    handles: all<HTMLElement>(el, '.handle').map(handle => handle.dataset.handle ?? ''),
    cropRole: cropArea?.getAttribute('role') ?? null,
    cropTabIndex: cropArea?.getAttribute('tabindex') ?? null,
    cropAriaLabel: cropArea?.getAttribute('aria-label') ?? null,
    cropStyle: cropArea?.getAttribute('style') ?? '',
  };
}

// ── Documented expectations ─────────────────────────────────────────────────

/** "zoom(level) - Set zoom level (0.1 to 10)". */
export function clampZoom(level: number): number {
  return Math.max(0.1, Math.min(10, level));
}

/** "rotate(degrees) - Rotate image (cumulative)". */
export function accumulateRotation(current: number, degrees: number): number {
  return (current + degrees) % 360;
}

/** The mime type `outputType` names. */
export function mimeFor(outputType: CropperOutputType): string {
  return `image/${outputType}`;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** Parts, the image, the eight handles, and the crop region's a11y contract. */
export function structureProblems(el: HTMLElement, c: CropperCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  // "CSS Parts: base, image-container, crop-area"
  for (const name of DOCUMENTED_PARTS) {
    problems.check(facts.presentParts.includes(name), `documented part "${name}" is missing`);
  }
  const base = exactPart(el, 'base');
  for (const name of ['image-container', 'crop-area'] as const) {
    const node = exactPart(el, name);
    if (base && node) problems.check(base.contains(node), `\`${name}\` is not inside \`base\``);
  }

  // "src: string — Image URL", shown in the image display area.
  problems.equal(facts.imageSrc, SOURCES[c.src], 'the image src');
  problems.check(!!facts.imageAlt, 'the crop image has no alt text');

  // "Drag to reposition, 8 handles to resize" — the eight compass points.
  problems.equal(
    facts.handles.slice().sort(), [...HANDLES].slice().sort(),
    'the eight resize handles',
  );

  // A crop region that arrow keys move has to be focusable and named.
  problems.equal(facts.cropRole, 'region', 'crop-area role');
  problems.equal(facts.cropTabIndex, '0', 'crop-area tabindex');
  problems.check(!!facts.cropAriaLabel, 'crop-area has no accessible name');

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface SeenEvent { type: string; detail: any }

export function collectEvents(el: HTMLElement, types: string[] = [
  'crop-change', 'crop-complete',
]): SeenEvent[] {
  const seen: SeenEvent[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function cropArea(el: HTMLElement): HTMLElement | null {
  return sr(el).querySelector('.crop-area');
}

export function handleElement(el: HTMLElement, name: string): HTMLElement | null {
  return sr(el).querySelector(`.handle[data-handle="${name}"]`);
}

/** A documented arrow-key nudge on the crop region. */
export function pressKey(el: HTMLElement, key: string, shiftKey = false): boolean {
  const area = cropArea(el);
  if (!area) return false;
  area.dispatchEvent(new KeyboardEvent('keydown', {
    key, shiftKey, bubbles: true, composed: true, cancelable: true,
  }));
  return true;
}

/** A drag on the crop area or one of its handles. */
export async function drag(
  el: HTMLElement, target: HTMLElement | null, dx: number, dy: number,
): Promise<boolean> {
  if (!target) return false;
  target.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0,
  }));
  document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: dx, clientY: dy }));
  await wait(SETTLE);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: dx, clientY: dy }));
  await wait(SETTLE);
  return true;
}

/** `crop-change -> { rect: { x, y, width, height } }` — the documented shape. */
export function cropChangeProblems(seen: SeenEvent[], atLeast = 1): Problems {
  const problems = new Problems();
  const changes = seen.filter(event => event.type === 'crop-change');
  if (!problems.check(changes.length >= atLeast,
    `crop-change fired ${changes.length} times, expected at least ${atLeast}`)) {
    return problems;
  }
  for (const [index, change] of changes.entries()) {
    const rect = change.detail?.rect;
    if (!problems.check(!!rect, `crop-change ${index} carries no rect`)) continue;
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      problems.check(
        typeof rect[key] === 'number' && Number.isFinite(rect[key]),
        `crop-change ${index} rect.${key} is not a finite number: ${rect[key]}`,
      );
    }
  }
  return problems;
}

/** The transform the component writes for a given zoom and rotation. */
export function expectedTransform(zoomLevel: number, rotation: number): string {
  return `scale(${zoomLevel}) rotate(${rotation}deg)`;
}
