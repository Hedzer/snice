/**
 * Shared oracle for the snice-camera feature-combination matrix.
 *
 * Every assertion in this directory routes through the helpers below so the
 * matrix cannot drift into asserting something weaker than the documented
 * contract in `docs/ai/components/camera.md` plus `snice-camera.types.ts`:
 *
 *   · CSS PARTS — the doc names two: `base` (outer camera container) and
 *     `controls` (built-in control buttons area). `base` exists in every
 *     combo; `controls` is gated by the documented `showControls` switch.
 *   · SLOT — `controls`, "custom controls overlay (full viewport, positioned
 *     absolutely)": the slot exists whether or not the BUILT-IN controls do,
 *     because it is a separate documented extension point.
 *   · ENUMS — `facingMode`, `controlsPosition` (nine documented values),
 *     `aspectRatio` (six) and `objectFit` (two) all have attributes, so every
 *     documented value must survive the attribute→property conversion and
 *     leave a visible trace where the doc says it has one.
 *   · METHODS — `start()`, `stop()`, `capture()`, `switchCamera()`,
 *     `isActive()`, `getStream()`. `capture()` is the one with a spelled-out
 *     return shape — `{ dataURL, blob, width, height, timestamp }` — and the
 *     width/height are the FRAME's, which is what makes it assertable.
 *   · EVENTS — `camera-start { stream }`, `camera-stop` (no detail),
 *     `camera-capture { image }`, `camera-error { error }`.
 *
 * Anything the docs do not specify — the icons, the class names, the exact
 * auto-position heuristic — is asserted STRUCTURALLY or left to the visual
 * tier, where a real engine lays the controls out.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import {
  installCaptureStack, restoreCaptureStack, primeVideo, type MediaMock, type CanvasMock,
} from '../media-mock';
import '../../../packages/components/src/camera/snice-camera';
import type {
  CameraFacingMode, ControlsPosition, SniceCameraElement,
} from '../../../packages/components/src/camera/snice-camera.types';

export { wait, installCaptureStack, restoreCaptureStack, primeVideo };
export type { SniceCameraElement, CameraFacingMode, ControlsPosition, MediaMock, CanvasMock };

/** Settle window: the camera renders on a microtask plus a queued task. */
export const SETTLE = 40;

/** Every documented `ControlsPosition`. */
export const CONTROLS_POSITIONS: ControlsPosition[] = [
  'auto', 'bottom', 'right', 'left', 'top',
  'bottom-left', 'bottom-right', 'top-left', 'top-right',
];

/** Every documented `aspectRatio`. */
export const ASPECT_RATIOS = ['auto', '16:9', '9:16', '4:3', '1:1', '21:9'];

export interface CameraCombo {
  autoStart?: boolean;
  facingMode?: CameraFacingMode;
  mirror?: boolean;
  controlsPosition?: ControlsPosition;
  showControls?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover';
  /** Light-DOM children, for the documented `controls` slot. */
  html?: string;
}

export function comboId(combo: CameraCombo): string {
  return `facing=${combo.facingMode ?? 'user'}`
    + `/controls=${combo.showControls === false ? 'off' : 'on'}`
    + `@${combo.controlsPosition ?? 'auto'}`
    + `/fit=${combo.objectFit ?? 'cover'}`
    + `/ratio=${combo.aspectRatio ?? 'auto'}`
    + `${combo.mirror === false ? '/no-mirror' : ''}`;
}

/**
 * Mount a camera for one combo. Every documented property has an attribute
 * (`auto-start`, `facing-mode`, `mirror`, `controls-position`,
 * `show-controls`, `width`, `height`, `aspect-ratio`, `object-fit`) and the
 * doc's usage is markup, so the matrix mounts through the ATTRIBUTE channel.
 * `showControls` and `mirror` default to TRUE, so turning them off has to
 * cross the property channel — an absent boolean attribute cannot express
 * "false" against a true default.
 */
export async function makeCamera(combo: CameraCombo = {}): Promise<SniceCameraElement> {
  const attrs: Record<string, any> = {};
  if (combo.autoStart) attrs['auto-start'] = true;
  if (combo.facingMode) attrs['facing-mode'] = combo.facingMode;
  if (combo.controlsPosition) attrs['controls-position'] = combo.controlsPosition;
  if (combo.width !== undefined) attrs.width = combo.width;
  if (combo.height !== undefined) attrs.height = combo.height;
  if (combo.aspectRatio) attrs['aspect-ratio'] = combo.aspectRatio;
  if (combo.objectFit) attrs['object-fit'] = combo.objectFit;
  if (combo.showControls === false) attrs['show-controls'] = false;
  if (combo.mirror === false) attrs.mirror = false;

  const el = document.createElement('snice-camera') as SniceCameraElement;
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  if (combo.html) el.innerHTML = combo.html;
  document.body.appendChild(el);
  await (el as any).ready;
  if (combo.showControls === false) el.showControls = false;
  if (combo.mirror === false) el.mirror = false;
  await wait(SETTLE);

  const video = sr(el).querySelector('video');
  if (video) primeVideo(video as HTMLVideoElement, combo.width ?? 1280, combo.height ?? 720);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceCameraElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-camera rendered no shadow root');
  return root;
}

export function partEl(el: SniceCameraElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function videoEl(el: SniceCameraElement): HTMLVideoElement | null {
  return sr(el).querySelector('video');
}

export function controlSlot(el: SniceCameraElement): HTMLSlotElement | null {
  return sr(el).querySelector('slot[name="controls"]');
}

export function buttons(el: SniceCameraElement): HTMLButtonElement[] {
  return [...sr(el).querySelectorAll('button')] as HTMLButtonElement[];
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** The documented facingMode values, unchanged: the doc uses the platform's. */
export const FACING_MODES: CameraFacingMode[] = ['user', 'environment'];

/**
 * The whole-shell oracle. Reports every violation at once so one run tells the
 * whole story about a combo.
 */
export function expectCameraMatches(el: SniceCameraElement, combo: CameraCombo): void {
  const problems: string[] = [];

  // ── Parts ───────────────────────────────────────────────────────────────
  if (!partEl(el, 'base')) problems.push('missing part="base"');

  const showControls = combo.showControls !== false;
  const controls = partEl(el, 'controls');
  if (showControls && !controls) problems.push('show-controls on but no part="controls"');
  if (!showControls && controls) problems.push('show-controls off but part="controls" rendered');

  // ── The live preview ────────────────────────────────────────────────────
  const video = videoEl(el);
  if (!video) {
    problems.push('no <video> preview');
  } else {
    // A preview that is not autoplaying, or that is not muted, cannot start
    // without a user gesture in any browser — the component is documented as
    // a "live camera feed", so both are part of being one.
    if (!video.hasAttribute('autoplay')) problems.push('preview is not autoplay');
    if (!video.hasAttribute('playsinline')) problems.push('preview is not playsinline');
    if (!video.hasAttribute('muted')) problems.push('preview is not muted');
  }

  // ── The documented slot ─────────────────────────────────────────────────
  // "controls - Custom controls overlay": an extension point that disappears
  // when the BUILT-IN controls are turned off would make `show-controls` and
  // a custom overlay mutually exclusive, which the doc does not say.
  if (!controlSlot(el)) problems.push('missing <slot name="controls">');

  // ── Properties survived their documented attributes ─────────────────────
  const expectations: Array<[string, unknown, unknown]> = [
    ['facingMode', el.facingMode, combo.facingMode ?? 'user'],
    ['controlsPosition', el.controlsPosition, combo.controlsPosition ?? 'auto'],
    ['showControls', el.showControls, showControls],
    ['mirror', el.mirror, combo.mirror !== false],
    ['width', el.width, combo.width ?? 1280],
    ['height', el.height, combo.height ?? 720],
    ['aspectRatio', el.aspectRatio, combo.aspectRatio ?? 'auto'],
    ['objectFit', (el as any).objectFit, combo.objectFit ?? 'cover'],
  ];
  for (const [name, actual, expected] of expectations) {
    if (actual !== expected) problems.push(`${name} ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
  }

  // ── Every built-in control announces what it does ───────────────────────
  // "Keyboard navigation for controls" — an icon-only button with no name is
  // announced as "button" and is not navigable in any useful sense.
  for (const button of buttons(el)) {
    const name = button.getAttribute('aria-label') || button.getAttribute('title')
      || (button.textContent ?? '').trim();
    if (!name) problems.push(`unnamed control .${button.className}`);
  }

  expect(problems, `combo ${comboId(combo)}`).toEqual([]);
}

/** Assert a collected problem list is empty, naming the combo. */
export function expectClean(problems: string[], id: string): void {
  expect(problems, `combo ${id}`).toEqual([]);
}

/** Record the named events in dispatch order. */
export function captureEvents(el: SniceCameraElement, types: string[]): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export const ALL_EVENTS = ['camera-start', 'camera-stop', 'camera-capture', 'camera-error'];

/** Sorted key list of an event detail — the shape a consumer destructures. */
export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}
