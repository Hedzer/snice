/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Camera / microphone / canvas recorders for the DOM matrix tier
 * ════════════════════════════════════════════════════════════════════════════
 *
 * happy-dom implements none of the capture stack: `navigator.mediaDevices` is
 * undefined, `MediaRecorder` and `AudioContext` do not exist, and
 * `HTMLCanvasElement` has neither `getContext` nor `toDataURL`. That is an
 * ENVIRONMENT limit, not a component defect — a matrix that asserted "start()
 * fails" in this environment would be measuring happy-dom, and one that skipped
 * those combos would test nothing at all.
 *
 * What the media components actually promise is observable one level down. The
 * documented contracts are of the form "start() starts the camera feed",
 * "capture() returns { dataURL, blob, width, height, timestamp }", "stop()
 * releases the camera", "switchCamera() toggles front/back" — every one of
 * which is implemented as a call into the capture stack. This module RECORDS
 * those calls, which is the same substitution `tests/components/qr-reader.test.ts`
 * and `tests/components/cropper.test.ts` already make; deliberately the same
 * shape, so the matrix and the unit suites agree on what "the camera started"
 * means.
 *
 * What deliberately stays OUT of this tier and belongs to the visual one:
 * anything that needs a real decoder or a real frame — actual QR decoding,
 * actual audio levels, actual pixels drawn from a video. A real engine runs
 * those in `tests/live/matrix/`.
 */
import { vi } from 'vitest';

// ── Media devices ───────────────────────────────────────────────────────────

export interface MockTrack {
  kind: string;
  readyState: 'live' | 'ended';
  stop: () => void;
}

export interface MockStream {
  id: string;
  getTracks: () => MockTrack[];
  getVideoTracks: () => MockTrack[];
  getAudioTracks: () => MockTrack[];
}

export interface MediaMock {
  /** Every `getUserMedia` call's constraints, in order. */
  requests: any[];
  /** Every stream handed out, in order. */
  streams: MockStream[];
  getUserMedia: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
  /** Tracks that have been `stop()`ed — the camera-released contract. */
  stoppedTracks: () => MockTrack[];
  /** Make the NEXT getUserMedia reject, as a denied permission would. */
  denyWith: (error: Error) => void;
}

let installedMedia: MediaMock | null = null;
let hadMediaDevices = false;
let originalMediaDevices: any;

function makeStream(id: string, kinds: string[]): MockStream {
  const tracks: MockTrack[] = kinds.map(kind => {
    const track: MockTrack = {
      kind,
      readyState: 'live',
      stop() { track.readyState = 'ended'; },
    };
    return track;
  });
  return {
    id,
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter(t => t.kind === 'video'),
    getAudioTracks: () => tracks.filter(t => t.kind === 'audio'),
  };
}

/**
 * Install a recording `navigator.mediaDevices`.
 *
 * @param options.cameras   how many `videoinput` devices `enumerateDevices`
 *                          reports — the switch-camera affordance is documented
 *                          to depend on there being more than one.
 * @param options.kinds     track kinds each granted stream carries.
 */
export function installMediaDevices(options: { cameras?: number; kinds?: string[] } = {}): MediaMock {
  const kinds = options.kinds ?? ['video'];
  const cameras = options.cameras ?? 2;
  let nextDenial: Error | null = null;
  let counter = 0;

  const mock: MediaMock = {
    requests: [],
    streams: [],
    getUserMedia: vi.fn(async (constraints: any) => {
      mock.requests.push(constraints);
      if (nextDenial) {
        const error = nextDenial;
        nextDenial = null;
        throw error;
      }
      const stream = makeStream(`stream-${++counter}`, kinds);
      mock.streams.push(stream);
      return stream as unknown as MediaStream;
    }),
    enumerateDevices: vi.fn(async () => Array.from({ length: cameras }, (_, i) => ({
      kind: 'videoinput', deviceId: `cam-${i}`, label: `Camera ${i}`, groupId: 'g',
    }))),
    stoppedTracks: () => mock.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'ended'),
    denyWith: (error: Error) => { nextDenial = error; },
  };

  if (!installedMedia) {
    hadMediaDevices = 'mediaDevices' in navigator;
    originalMediaDevices = (navigator as any).mediaDevices;
  }
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value: { getUserMedia: mock.getUserMedia, enumerateDevices: mock.enumerateDevices },
  });
  installedMedia = mock;
  return mock;
}

export function restoreMediaDevices(): void {
  if (!installedMedia) return;
  if (hadMediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true, writable: true, value: originalMediaDevices,
    });
  } else {
    delete (navigator as any).mediaDevices;
  }
  installedMedia = null;
}

// ── Canvas ──────────────────────────────────────────────────────────────────

export interface CanvasMock {
  /** Every 2D operation, in order: `drawImage`, `fillRect`, `stroke`, … */
  operations: string[];
  /** The `type` argument of the last `toDataURL` call. */
  lastDataURLType: string | null;
  reset: () => void;
}

let installedCanvas: CanvasMock | null = null;
const canvasDescriptors: Array<[string, PropertyDescriptor | undefined]> = [];

/**
 * Give `HTMLCanvasElement` a recording 2D context plus `toDataURL` / `toBlob`.
 *
 * The context answers every call a drawing component makes and remembers the
 * ORDER, because order is the contract for several documented behaviours: a
 * background fill has to precede the strokes, an eraser is a stroke with a
 * different composite operation, and a cleared canvas is a fill with no strokes
 * after it.
 */
export function installCanvasMock(): CanvasMock {
  const mock: CanvasMock = {
    operations: [],
    lastDataURLType: null,
    reset() { mock.operations.length = 0; mock.lastDataURLType = null; },
  };

  const record = (name: string) => (...args: any[]) => {
    mock.operations.push(args.length ? `${name}(${args.map(shortArg).join(',')})` : name);
  };

  function makeContext(): any {
    const context: any = {
      canvas: null,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      strokeStyle: '#000000',
      fillStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      shadowBlur: 0,
      shadowColor: 'transparent',
      imageSmoothingEnabled: true,
    };
    for (const name of [
      'save', 'restore', 'scale', 'rotate', 'translate', 'transform', 'setTransform',
      'resetTransform', 'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'closePath',
      'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'arcTo', 'ellipse',
      'rect', 'fill', 'stroke', 'clip', 'drawImage', 'fillText', 'strokeText', 'setLineDash',
    ]) {
      context[name] = record(name);
    }
    context.measureText = (text: string) => ({ width: text.length * 6 });
    context.getImageData = (_x: number, _y: number, w: number, h: number) => ({
      width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    });
    context.putImageData = record('putImageData');
    context.createLinearGradient = () => ({ addColorStop() {} });
    context.createRadialGradient = () => ({ addColorStop() {} });
    context.createPattern = () => null;
    return context;
  }

  const contexts = new WeakMap<HTMLCanvasElement, any>();

  const define = (name: string, value: any) => {
    canvasDescriptors.push([name, Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name)]);
    Object.defineProperty(HTMLCanvasElement.prototype, name, {
      configurable: true, writable: true, value,
    });
  };

  define('getContext', function (this: HTMLCanvasElement, kind: string) {
    if (kind !== '2d') return null;
    let context = contexts.get(this);
    if (!context) {
      context = makeContext();
      context.canvas = this;
      contexts.set(this, context);
    }
    return context;
  });
  define('toDataURL', function (this: HTMLCanvasElement, type = 'image/png') {
    mock.lastDataURLType = type;
    return `data:${type};base64,MOCK`;
  });
  define('toBlob', function (this: HTMLCanvasElement, callback: BlobCallback, type = 'image/png') {
    callback(new Blob(['mock'], { type }));
  });

  installedCanvas = mock;
  return mock;
}

export function restoreCanvasMock(): void {
  if (!installedCanvas) return;
  for (const [name, descriptor] of canvasDescriptors.reverse()) {
    if (descriptor) Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor);
    else delete (HTMLCanvasElement.prototype as any)[name];
  }
  canvasDescriptors.length = 0;
  installedCanvas = null;
}

function shortArg(value: any): string {
  if (typeof value === 'number') return String(Math.round(value * 100) / 100);
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.tagName?.toLowerCase() ?? 'obj';
  return String(value);
}

// ── MediaRecorder ───────────────────────────────────────────────────────────

export interface RecorderMock {
  /** Every constructed recorder, in order. */
  instances: any[];
  /** The `mimeType` each recorder was asked for. */
  mimeTypes: () => string[];
  /** The `audioBitsPerSecond` each recorder was asked for. */
  bitrates: () => Array<number | undefined>;
  /** Feed a data chunk to the newest recorder, as a real one does periodically. */
  emitData: (bytes?: number) => void;
  /** The newest recorder. */
  latest: () => any;
}

let hadRecorder = false;
let originalRecorder: any;
let installedRecorder: RecorderMock | null = null;

/**
 * A `MediaRecorder` stand-in that follows the real state machine —
 * `inactive → recording → paused → recording → inactive` — and fires
 * `dataavailable` / `stop` the way the real one does. The components document
 * `getState()` in exactly those three words, so the state machine is the part
 * that has to be faithful; the bytes do not.
 */
export function installMediaRecorder(options: { supported?: string[] } = {}): RecorderMock {
  const supported = options.supported ?? ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
  const mock: RecorderMock = {
    instances: [],
    mimeTypes: () => mock.instances.map(r => r.mimeType),
    bitrates: () => mock.instances.map(r => r.audioBitsPerSecond),
    emitData: (bytes = 1024) => {
      const recorder = mock.latest();
      if (!recorder) return;
      recorder.ondataavailable?.({ data: new Blob([new Uint8Array(bytes)], { type: recorder.mimeType }) });
    },
    latest: () => mock.instances[mock.instances.length - 1] ?? null,
  };

  class MockMediaRecorder {
    static isTypeSupported(type: string): boolean { return supported.includes(type); }

    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    mimeType: string;
    audioBitsPerSecond: number | undefined;
    ondataavailable: ((event: any) => void) | null = null;
    onstop: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onpause: ((event: any) => void) | null = null;
    onresume: ((event: any) => void) | null = null;
    onstart: ((event: any) => void) | null = null;

    constructor(public stream: any, options: any = {}) {
      this.mimeType = options.mimeType ?? 'audio/webm';
      this.audioBitsPerSecond = options.audioBitsPerSecond;
      mock.instances.push(this);
    }

    start(): void { this.state = 'recording'; this.onstart?.({}); }
    pause(): void { if (this.state === 'recording') { this.state = 'paused'; this.onpause?.({}); } }
    resume(): void { if (this.state === 'paused') { this.state = 'recording'; this.onresume?.({}); } }
    stop(): void {
      if (this.state === 'inactive') return;
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob([new Uint8Array(2048)], { type: this.mimeType }) });
      this.onstop?.({});
    }
    addEventListener(): void { /* the components use the on* handlers */ }
    removeEventListener(): void { /* ditto */ }
  }

  if (!installedRecorder) {
    hadRecorder = 'MediaRecorder' in globalThis;
    originalRecorder = (globalThis as any).MediaRecorder;
  }
  (globalThis as any).MediaRecorder = MockMediaRecorder;
  installedRecorder = mock;
  return mock;
}

export function restoreMediaRecorder(): void {
  if (!installedRecorder) return;
  if (hadRecorder) (globalThis as any).MediaRecorder = originalRecorder;
  else delete (globalThis as any).MediaRecorder;
  installedRecorder = null;
}

// ── Web Audio ───────────────────────────────────────────────────────────────

let hadAudioContext = false;
let originalAudioContext: any;
let audioInstalled = false;

/**
 * A minimal `AudioContext` for the visualiser path. The documented promise is
 * only that a visualiser EXISTS and can be turned off (`show-visualizer`), so
 * the analyser returns a fixed spectrum: enough for the component to render
 * bars, and nothing a test should assert numbers about.
 */
export function installAudioContext(): void {
  if (!audioInstalled) {
    hadAudioContext = 'AudioContext' in globalThis;
    originalAudioContext = (globalThis as any).AudioContext;
  }
  class MockAnalyser {
    fftSize = 2048;
    frequencyBinCount = 64;
    smoothingTimeConstant = 0.8;
    minDecibels = -100;
    maxDecibels = -30;
    connect(): void {}
    disconnect(): void {}
    getByteFrequencyData(array: Uint8Array): void {
      for (let i = 0; i < array.length; i++) array[i] = 128;
    }
    getByteTimeDomainData(array: Uint8Array): void {
      for (let i = 0; i < array.length; i++) array[i] = 128;
    }
  }
  class MockAudioContext {
    state = 'running';
    sampleRate = 48000;
    destination = {};
    createAnalyser(): MockAnalyser { return new MockAnalyser(); }
    createMediaStreamSource(): { connect(): void; disconnect(): void } {
      return { connect() {}, disconnect() {} };
    }
    createGain(): any { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
    close(): Promise<void> { this.state = 'closed'; return Promise.resolve(); }
    resume(): Promise<void> { this.state = 'running'; return Promise.resolve(); }
    suspend(): Promise<void> { this.state = 'suspended'; return Promise.resolve(); }
  }
  (globalThis as any).AudioContext = MockAudioContext;
  (globalThis as any).webkitAudioContext = MockAudioContext;
  audioInstalled = true;
}

export function restoreAudioContext(): void {
  if (!audioInstalled) return;
  if (hadAudioContext) (globalThis as any).AudioContext = originalAudioContext;
  else delete (globalThis as any).AudioContext;
  delete (globalThis as any).webkitAudioContext;
  audioInstalled = false;
}

// ── Video element readiness ─────────────────────────────────────────────────

/**
 * Make a `<video>` behave like one with a live stream: a non-zero
 * `readyState` and real frame dimensions. Components gate their capture paths
 * on exactly those two, and happy-dom leaves both at 0 forever.
 */
export function primeVideo(video: HTMLVideoElement, width = 640, height = 480): void {
  Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: height });
  if (typeof (video as any).play !== 'function' || !(video as any).__primed) {
    Object.defineProperty(video, 'play', {
      configurable: true, writable: true, value: async () => undefined,
    });
    (video as any).__primed = true;
  }
}

/** Install every media stand-in this tier needs, and return the recorders. */
export function installCaptureStack(options: {
  cameras?: number; kinds?: string[]; supported?: string[];
} = {}): { media: MediaMock; canvas: CanvasMock; recorder: RecorderMock } {
  const media = installMediaDevices(options);
  const canvas = installCanvasMock();
  const recorder = installMediaRecorder(options);
  installAudioContext();
  return { media, canvas, recorder };
}

/** Undo `installCaptureStack`. Call from `afterEach`. */
export function restoreCaptureStack(): void {
  restoreAudioContext();
  restoreMediaRecorder();
  restoreCanvasMock();
  restoreMediaDevices();
}
