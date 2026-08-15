/**
 * Shared oracle for the snice-qr-reader feature-combination matrix.
 *
 * Every assertion in this directory routes through the helpers below so the
 * matrix cannot drift into asserting something weaker than the documented
 * contract in `docs/ai/components/qr-reader.md` plus
 * `snice-qr-reader.types.ts`:
 *
 *   · CSS PARTS — the doc names ten: `base`, `video`, `canvas`, `viewport`,
 *     `controls`, `button-start`, `button-stop`, `button-switch`, `result`,
 *     `error-text`. The first five are the reader's skeleton and exist in
 *     every combo; the rest are STATE-DEPENDENT, and which state each belongs
 *     to is the interesting half of this component's contract.
 *   · MODES — `pickFirst` ("scan until first hit then stop"), `manualSnap`
 *     ("photo snapshot mode") and `tapStart` ("tap viewport to start/stop")
 *     are three independent documented switches over the same reader, so the
 *     matrix crosses them rather than testing them one at a time.
 *   · CAMERA — `camera: 'front'|'back' = 'back'`, and `switchCamera()`
 *     "toggle[s] front/back". A camera request is a `getUserMedia` call whose
 *     `facingMode` follows the property; `stop()` "releases the camera", which
 *     means every granted track is stopped.
 *   · EVENTS — `qr-scan { data, timestamp, reader }`,
 *     `qr-error { error, reader }`, `camera-ready { reader }`,
 *     `camera-error { error, reader }`. A consumer writes `e.detail.data`, so
 *     the KEY SET is asserted, not merely the values.
 *
 * Anything the docs do not specify — the icons, the class names, the exact
 * frame-skipping arithmetic behind `scanSpeed` — is asserted STRUCTURALLY or
 * not at all. Real decoding needs a real frame and belongs to the visual tier.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import {
  installCaptureStack, restoreCaptureStack, primeVideo, type MediaMock,
} from '../media-mock';
import '../../../packages/components/src/qr-reader/snice-qr-reader';
import type { SniceQRReaderElement } from '../../../packages/components/src/qr-reader/snice-qr-reader.types';

export { wait, installCaptureStack, restoreCaptureStack, primeVideo };
export type { SniceQRReaderElement, MediaMock };

/** Settle window: the reader renders on a microtask plus a queued task. */
export const SETTLE = 40;

export interface ReaderCombo {
  autoStart?: boolean;
  camera?: 'front' | 'back';
  pickFirst?: boolean;
  manualSnap?: boolean;
  scanSpeed?: number;
  tapStart?: boolean;
}

/** Stable id for a combo — the string a failing test is named by. */
export function comboId(combo: ReaderCombo): string {
  const flags = (['autoStart', 'pickFirst', 'manualSnap', 'tapStart'] as const)
    .filter(key => combo[key]);
  return `camera=${combo.camera ?? 'back'}`
    + `/speed=${combo.scanSpeed ?? 3}`
    + `/[${flags.join(',') || 'plain'}]`;
}

/**
 * Mount a reader for one combo. Every documented property has an attribute
 * (`auto-start`, `pick-first`, `manual-snap`, `scan-speed`, `tap-start`,
 * `camera`), and the doc's usage examples are all markup, so the matrix mounts
 * through the ATTRIBUTE channel.
 */
export async function makeReader(combo: ReaderCombo = {}): Promise<SniceQRReaderElement> {
  const attrs: Record<string, any> = {};
  if (combo.autoStart) attrs['auto-start'] = true;
  if (combo.camera) attrs.camera = combo.camera;
  if (combo.pickFirst) attrs['pick-first'] = true;
  if (combo.manualSnap) attrs['manual-snap'] = true;
  if (combo.scanSpeed !== undefined) attrs['scan-speed'] = combo.scanSpeed;
  if (combo.tapStart) attrs['tap-start'] = true;

  const el = await createComponent<SniceQRReaderElement>('snice-qr-reader', attrs);
  await wait(SETTLE);
  // A live `<video>` is what every capture path gates on; happy-dom leaves
  // readyState and the frame size at 0 forever.
  const video = sr(el).querySelector('video');
  if (video) primeVideo(video as HTMLVideoElement);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceQRReaderElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-qr-reader rendered no shadow root');
  return root;
}

export function partEl(el: SniceQRReaderElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function partsPresent(el: SniceQRReaderElement): Set<string> {
  const found = new Set<string>();
  for (const node of sr(el).querySelectorAll('[part]')) {
    for (const name of (node.getAttribute('part') ?? '').split(/\s+/)) {
      if (name) found.add(name);
    }
  }
  return found;
}

export function viewport(el: SniceQRReaderElement): HTMLElement | null {
  return partEl(el, 'viewport');
}

export function textOf(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Whether the reader is currently scanning, read through its rendered state. */
export function isScanning(el: SniceQRReaderElement): boolean {
  return (el as any).scanning === true;
}

/** Replace the decoder with one that answers `text` for every frame. */
export function stubDecoder(el: SniceQRReaderElement, text: string | null): void {
  (el as any).qrDecoder = {
    decode: async () => {
      if (text === null) throw new Error('no QR code');
      return { text };
    },
  };
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** The five parts that make up the reader's skeleton, in every combo. */
export const SKELETON_PARTS = ['base', 'viewport', 'video', 'canvas', 'controls'];

/**
 * The whole-shell oracle. `scanning` is the state axis: the doc's part list
 * distinguishes a "start scanning button" from a "stop scanning button", so
 * which one exists is decided by whether the reader is scanning, and the
 * camera-switch button is documented without a state qualifier and is
 * therefore always reachable.
 */
export function expectReaderMatches(
  el: SniceQRReaderElement,
  combo: ReaderCombo,
  state: { scanning: boolean; error?: string; result?: string } = { scanning: false },
): void {
  const problems: string[] = [];
  const present = partsPresent(el);

  for (const name of SKELETON_PARTS) {
    if (!present.has(name)) problems.push(`missing part="${name}"`);
  }

  // `button-switch` is documented unconditionally: a reader you cannot flip to
  // the other camera is missing half of the documented camera property.
  if (!present.has('button-switch')) problems.push('missing part="button-switch"');

  if (!state.scanning) {
    // Idle: the only transport affordance is "start".
    if (!present.has('button-start')) problems.push('idle reader has no part="button-start"');
    if (present.has('button-stop')) problems.push('idle reader offers part="button-stop"');
  } else if (combo.manualSnap) {
    // "manual-snap, photo snapshot mode": the transport affordance is the
    // shutter, not a continuous-scan stop.
    if (!present.has('button-start')) problems.push('manual-snap reader has no shutter control');
  } else {
    if (!present.has('button-stop')) problems.push('scanning reader has no part="button-stop"');
    if (present.has('button-start')) problems.push('scanning reader still offers part="button-start"');
  }

  // `result` and `error-text` are outputs: they exist exactly when there is
  // something to output.
  const resultEl = partEl(el, 'result');
  if (state.result) {
    if (!resultEl) problems.push(`scanned "${state.result}" but no part="result"`);
    else if (!textOf(resultEl).includes(state.result)) {
      problems.push(`part="result" reads "${textOf(resultEl)}", expected to contain "${state.result}"`);
    }
  } else if (resultEl) {
    problems.push(`nothing scanned but part="result" reads "${textOf(resultEl)}"`);
  }

  const errorEl = partEl(el, 'error-text');
  if (state.error) {
    if (!errorEl) problems.push(`error "${state.error}" but no part="error-text"`);
    else if (!textOf(errorEl).includes(state.error)) {
      problems.push(`part="error-text" reads "${textOf(errorEl)}", expected "${state.error}"`);
    }
  } else if (errorEl) {
    problems.push(`no error but part="error-text" reads "${textOf(errorEl)}"`);
  }

  // Every control is a real, named button — the doc's "built-in control
  // buttons with icon labels".
  for (const button of sr(el).querySelectorAll('button')) {
    const name = button.getAttribute('aria-label') || button.getAttribute('title') || textOf(button);
    if (!name) problems.push(`unnamed control .${(button as HTMLElement).className}`);
  }

  expect(problems, `combo ${comboId(combo)}`).toEqual([]);
}

/** The documented facingMode a camera value maps to. */
export function expectedFacingMode(camera: 'front' | 'back'): string {
  return camera === 'back' ? 'environment' : 'user';
}

/** Assert a collected problem list is empty, naming the combo. */
export function expectClean(problems: string[], id: string): void {
  expect(problems, `combo ${id}`).toEqual([]);
}

/** Record the named events in dispatch order. */
export function captureEvents(el: SniceQRReaderElement, types: string[]): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export const ALL_EVENTS = ['qr-scan', 'qr-error', 'camera-ready', 'camera-error'];

/** Sorted key list of an event detail — the shape a consumer destructures. */
export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}
