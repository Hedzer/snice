/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-audio-recorder feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted in this directory comes from
 * `docs/ai/components/audio-recorder.md` plus `snice-audio-recorder.types.ts`:
 *
 *   · PROPERTIES — `autoStart` (attr `auto-start`), `format` (four documented
 *     MIME types), `bitrate`, `showControls`, `showVisualizer`, `maxDuration`
 *     ("0 = unlimited"), `showTimer`, `showPlayback` and the read-back
 *     `recordedUrl` ("URL of recorded audio (set after stop)"). Four of the
 *     switches default to TRUE, so turning one off can only cross the property
 *     channel.
 *   · CSS PARTS — `base`, `controls`, `visualizer`, `progress`.
 *   · METHODS — `start`, `stop` (returns `AudioRecording`), `pause`, `resume`,
 *     `cancel`, `getState` ("'inactive'|'recording'|'paused'"), `getDuration`,
 *     `isRecording`, `download`, `reset`.
 *   · EVENTS — `recorder-start|stop|pause|resume|cancel` all carrying
 *     `{ recorder }`, and `recorder-error` carrying `{ recorder, error }`.
 *
 * ── The recorder stand-in ───────────────────────────────────────────────────
 *
 * `media-mock.ts` supplies the shared microphone (`getUserMedia`) and the
 * `AudioContext` the visualiser needs, and both are reused here. Its
 * `MediaRecorder` is not: it implements the `on*` handler channel only, and
 * this component's `stop()` resolves from `addEventListener('stop', …, { once:
 * true })`. A recorder that ignores that channel would make the documented
 * `stop(): Promise<AudioRecording>` never settle, so this module installs one
 * that is faithful to BOTH channels of the real API. Everything else about it —
 * the `inactive → recording → paused → recording → inactive` state machine, a
 * `dataavailable` per chunk, `isTypeSupported` — mirrors the platform.
 */
import { expect, vi } from 'vitest';
import { wait } from '../../components/test-utils';
import {
  installMediaDevices, restoreMediaDevices, installAudioContext, restoreAudioContext,
  type MediaMock,
} from '../media-mock';
import '../../../packages/components/src/audio-recorder/snice-audio-recorder';
import type {
  AudioFormat, AudioRecording, RecorderState, SniceAudioRecorderElement,
} from '../../../packages/components/src/audio-recorder/snice-audio-recorder.types';

export { wait, type MediaMock };
export type { AudioFormat, AudioRecording, RecorderState, SniceAudioRecorderElement };

/** Render settle window: the recorder renders on a microtask plus a task. */
export const SETTLE = 30;

/** Every documented `format`. */
export const FORMATS: AudioFormat[] = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];

/** Every documented `getState()` value. */
export const STATES: RecorderState[] = ['inactive', 'recording', 'paused'];

/** The four documented CSS parts. */
export const DOC_PARTS = ['base', 'controls', 'visualizer', 'progress'] as const;

/** The four documented display switches, all defaulting to true. */
export const SWITCHES = ['showControls', 'showVisualizer', 'showTimer', 'showPlayback'] as const;
export type Switch = typeof SWITCHES[number];

// ── The recorder stand-in ───────────────────────────────────────────────────

export interface RecorderProbe {
  /** Every constructed recorder, in order. */
  instances: FakeRecorder[];
  /** The newest recorder, or null. */
  latest: () => FakeRecorder | null;
  /** Feed a data chunk to the newest recorder, as a real one does per timeslice. */
  emitChunk: (bytes?: number) => void;
}

class FakeRecorder {
  static probe: RecorderProbe;
  static isTypeSupported(type: string): boolean {
    return (FORMATS as string[]).includes(type);
  }

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType: string;
  audioBitsPerSecond: number | undefined;
  timeslice: number | undefined;
  ondataavailable: ((event: any) => void) | null = null;
  onstop: ((event: any) => void) | null = null;
  private listeners = new Map<string, Array<{ fn: (e: any) => void; once: boolean }>>();

  constructor(public stream: any, options: any = {}) {
    this.mimeType = options.mimeType ?? 'audio/webm';
    this.audioBitsPerSecond = options.audioBitsPerSecond;
    FakeRecorder.probe.instances.push(this);
  }

  addEventListener(type: string, fn: (e: any) => void, options?: { once?: boolean }): void {
    const list = this.listeners.get(type) ?? [];
    list.push({ fn, once: !!options?.once });
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, fn: (e: any) => void): void {
    const list = (this.listeners.get(type) ?? []).filter(entry => entry.fn !== fn);
    this.listeners.set(type, list);
  }

  private fire(type: string, event: any): void {
    const list = this.listeners.get(type) ?? [];
    this.listeners.set(type, list.filter(entry => !entry.once));
    for (const entry of list) entry.fn(event);
  }

  start(timeslice?: number): void {
    this.timeslice = timeslice;
    this.state = 'recording';
    this.fire('start', {});
  }

  pause(): void {
    if (this.state !== 'recording') return;
    this.state = 'paused';
    this.fire('pause', {});
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'recording';
    this.fire('resume', {});
  }

  chunk(bytes: number): void {
    const event = { data: new Blob([new Uint8Array(bytes)], { type: this.mimeType }) };
    this.ondataavailable?.(event);
    this.fire('dataavailable', event);
  }

  stop(): void {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    this.chunk(2048);
    this.onstop?.({});
    this.fire('stop', {});
  }
}

let hadRecorder = false;
let originalRecorder: any;
let recorderInstalled = false;

export function installRecorder(): RecorderProbe {
  const probe: RecorderProbe = {
    instances: [],
    latest: () => probe.instances[probe.instances.length - 1] ?? null,
    emitChunk: (bytes = 1024) => probe.latest()?.chunk(bytes),
  };
  FakeRecorder.probe = probe;

  if (!recorderInstalled) {
    hadRecorder = 'MediaRecorder' in globalThis;
    originalRecorder = (globalThis as any).MediaRecorder;
  }
  (globalThis as any).MediaRecorder = FakeRecorder;
  recorderInstalled = true;
  return probe;
}

export function restoreRecorder(): void {
  if (!recorderInstalled) return;
  if (hadRecorder) (globalThis as any).MediaRecorder = originalRecorder;
  else delete (globalThis as any).MediaRecorder;
  recorderInstalled = false;
}

// ── Audio playback stand-in ─────────────────────────────────────────────────

let hadAudio = false;
let originalAudio: any;
let audioInstalled = false;

/**
 * `new Audio(url)` for the documented playback affordance. happy-dom has no
 * media pipeline, so `play()` is a promise that never settles and
 * `currentTime` never advances; the stand-in gives the component the two
 * things it actually reads back.
 */
export function installAudioElement(): void {
  if (!audioInstalled) {
    hadAudio = 'Audio' in globalThis;
    originalAudio = (globalThis as any).Audio;
  }
  class FakeAudio {
    currentTime = 0;
    paused = true;
    duration = 12;
    constructor(public src: string) {}
    play(): Promise<void> { this.paused = false; return Promise.resolve(); }
    pause(): void { this.paused = true; }
    addEventListener(): void {}
    removeEventListener(): void {}
  }
  (globalThis as any).Audio = FakeAudio;
  audioInstalled = true;
}

export function restoreAudioElement(): void {
  if (!audioInstalled) return;
  if (hadAudio) (globalThis as any).Audio = originalAudio;
  else delete (globalThis as any).Audio;
  audioInstalled = false;
}

// ── The whole stack ─────────────────────────────────────────────────────────

export interface RecorderStack {
  media: MediaMock;
  recorder: RecorderProbe;
  /** Object URLs handed out, and the ones revoked again. */
  urls: { created: string[]; revoked: string[] };
}

let urlPatches: Array<[string, PropertyDescriptor | undefined]> = [];

export function installRecorderStack(): RecorderStack {
  const media = installMediaDevices({ kinds: ['audio'], cameras: 0 });
  installAudioContext();
  installAudioElement();
  const recorder = installRecorder();

  const urls = { created: [] as string[], revoked: [] as string[] };
  let counter = 0;
  urlPatches = [
    ['createObjectURL', Object.getOwnPropertyDescriptor(URL, 'createObjectURL')],
    ['revokeObjectURL', Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')],
  ];
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true, writable: true,
    value: vi.fn(() => { const url = `blob:mock/${++counter}`; urls.created.push(url); return url; }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true, writable: true,
    value: vi.fn((url: string) => { urls.revoked.push(url); }),
  });

  return { media, recorder, urls };
}

export function restoreRecorderStack(): void {
  for (const [name, descriptor] of urlPatches) {
    if (descriptor) Object.defineProperty(URL, name, descriptor);
    else delete (URL as any)[name];
  }
  urlPatches = [];
  restoreRecorder();
  restoreAudioElement();
  restoreAudioContext();
  restoreMediaDevices();
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface RecorderCombo {
  autoStart?: boolean;
  format?: AudioFormat;
  bitrate?: number;
  maxDuration?: number;
  showControls?: boolean;
  showVisualizer?: boolean;
  showTimer?: boolean;
  showPlayback?: boolean;
}

export function comboId(combo: RecorderCombo): string {
  const off = SWITCHES.filter(name => combo[name] === false).map(name => name.replace('show', '').toLowerCase());
  return `${combo.format ?? 'audio/webm'}`
    + `@${combo.bitrate ?? 128000}`
    + `/max=${combo.maxDuration ?? 0}`
    + `/off=[${off.join(',') || 'none'}]`
    + `${combo.autoStart ? '/autostart' : ''}`;
}

/**
 * Mount one combo. `format`, `bitrate` and `max-duration` cross the ATTRIBUTE
 * channel (the doc's usage is `<snice-audio-recorder format="audio/mp4"
 * bitrate="256000" max-duration="60">`); the four display switches default to
 * true, so switching one off crosses the property channel.
 */
export async function mountRecorder(combo: RecorderCombo = {}): Promise<SniceAudioRecorderElement> {
  const el = document.createElement('snice-audio-recorder') as SniceAudioRecorderElement;
  if (combo.format) el.setAttribute('format', combo.format);
  if (combo.bitrate !== undefined) el.setAttribute('bitrate', String(combo.bitrate));
  if (combo.maxDuration !== undefined) el.setAttribute('max-duration', String(combo.maxDuration));
  if (combo.autoStart) el.setAttribute('auto-start', '');
  document.body.appendChild(el);
  await (el as any).ready;
  for (const name of SWITCHES) {
    if (combo[name] === false) (el as any)[name] = false;
  }
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceAudioRecorderElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-audio-recorder rendered no shadow root');
  return root;
}

export function partEl(el: SniceAudioRecorderElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function buttons(el: SniceAudioRecorderElement): HTMLButtonElement[] {
  return [...sr(el).querySelectorAll('button')];
}

/** The accessible name of every control, in DOM order. */
export function controlNames(el: SniceAudioRecorderElement): string[] {
  return buttons(el).map(button =>
    button.getAttribute('aria-label') || button.getAttribute('title') || text(button));
}

export function timerText(el: SniceAudioRecorderElement): string | null {
  const timer = sr(el).querySelector('.recorder-timer');
  return timer ? text(timer) : null;
}

export function statusText(el: SniceAudioRecorderElement): string {
  return text(sr(el).querySelector('.recorder-status'));
}

export function visualizerBars(el: SniceAudioRecorderElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.visualizer-bar')];
}

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ── Driving the documented state machine ────────────────────────────────────

/** Start a recording and let the state land. */
export async function startRecording(el: SniceAudioRecorderElement): Promise<void> {
  await el.start();
  await wait(SETTLE);
}

/** Stop and return the documented `AudioRecording`. */
export async function stopRecording(el: SniceAudioRecorderElement): Promise<AudioRecording> {
  const recording = await el.stop();
  await wait(SETTLE);
  return recording;
}

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

/**
 * The idle-shell oracle: what a combo renders before anything is recorded.
 *
 * Documented mapping, and nothing beyond it:
 *   base        always
 *   controls    iff showControls
 *   visualizer  iff showVisualizer
 *   progress    never before a recording exists (it is the PLAYBACK progress)
 *   timer       iff showTimer
 */
export function expectIdleShell(el: SniceAudioRecorderElement, combo: RecorderCombo): void {
  const problems = new Problems();
  const on = (name: Switch) => combo[name] !== false;

  problems.check(!!partEl(el, 'base'), 'missing part="base"');
  problems.equal(!!partEl(el, 'controls'), on('showControls'), 'part="controls" present');
  problems.equal(!!partEl(el, 'visualizer'), on('showVisualizer'), 'part="visualizer" present');
  problems.equal(!!partEl(el, 'progress'), false, 'part="progress" present before a recording');
  problems.equal(timerText(el) !== null, on('showTimer'), 'timer present');

  // Properties survived their documented channel.
  problems.equal(el.format, combo.format ?? 'audio/webm', 'format');
  problems.equal(el.bitrate, combo.bitrate ?? 128000, 'bitrate');
  problems.equal(el.maxDuration, combo.maxDuration ?? 0, 'maxDuration');
  for (const name of SWITCHES) {
    problems.equal((el as any)[name], on(name), name);
  }

  // The documented state machine starts here.
  problems.equal(el.getState(), 'inactive', 'getState()');
  problems.equal(el.isRecording(), false, 'isRecording()');
  problems.equal(el.getDuration(), 0, 'getDuration()');
  problems.equal(el.recordedUrl, '', 'recordedUrl');

  // Every control announces what it does.
  const unnamed = buttons(el).filter(button =>
    !(button.getAttribute('aria-label') || button.getAttribute('title') || text(button)));
  problems.equal(unnamed.length, 0, 'unnamed controls');

  expectClean(problems, comboId(combo));
}

/** `stop()` is the one method with a spelled-out return shape. */
export function expectRecordingShape(
  recording: AudioRecording,
  combo: RecorderCombo,
  id: string,
): void {
  const problems = new Problems();
  problems.equal(Object.keys(recording ?? {}).sort(),
    ['blob', 'duration', 'format', 'size', 'timestamp', 'url'], 'AudioRecording keys');
  problems.equal(recording.format, combo.format ?? 'audio/webm', 'recording.format');
  problems.check(recording.blob instanceof Blob, 'recording.blob is not a Blob');
  problems.equal(recording.blob?.type, combo.format ?? 'audio/webm', 'blob type');
  problems.check(recording.size > 0, `recording.size is ${recording.size}`);
  problems.equal(recording.size, recording.blob?.size, 'size matches the blob');
  problems.check(typeof recording.url === 'string' && recording.url.length > 0, 'recording.url is empty');
  problems.check(typeof recording.duration === 'number' && recording.duration >= 0,
    `recording.duration is ${recording.duration}`);
  problems.check(typeof recording.timestamp === 'number' && recording.timestamp > 0,
    `recording.timestamp is ${recording.timestamp}`);
  expectClean(problems, id);
}

/** Record the named events in dispatch order. */
export const ALL_EVENTS = [
  'recorder-start', 'recorder-stop', 'recorder-pause',
  'recorder-resume', 'recorder-cancel', 'recorder-error',
];

export function captureEvents(
  el: SniceAudioRecorderElement,
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

/** Click a shadow control by its accessible name. */
export function clickControl(el: SniceAudioRecorderElement, name: string): boolean {
  const button = buttons(el).find(candidate =>
    (candidate.getAttribute('aria-label') || candidate.getAttribute('title')) === name);
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}
