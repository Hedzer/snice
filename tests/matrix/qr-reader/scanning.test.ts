/**
 * snice-qr-reader matrix — decoding, and the modes that change what a decode
 * MEANS.
 *
 * The documented decode surface:
 *
 *   qr-scan          { data, timestamp, reader }
 *   pickFirst        "scan until first hit then stop"
 *   scanSpeed        1-10, "ignored when pick-first"
 *   manualSnap       "photo snapshot mode"
 *   snap()           "Take snapshot, returns QR data string or null"
 *   scanImage(file)  "Scan QR code from image file"
 *
 * A real decode needs a real frame, which is what the visual tier is for. What
 * this tier owns is everything AROUND the decoder: that a hit is announced with
 * the documented payload, that `pickFirst` really does stop, that a plain
 * reader really does not, that `scanSpeed` is accepted across its whole
 * documented range and is genuinely irrelevant under `pickFirst`, and that the
 * result surfaces in the `result` part.
 *
 * 10 scanSpeed combos + 4 pickFirst combos + 5 snap/scanImage cases
 * + 3 payload cases = 22 combos.
 */
import { describe, it, expect, afterEach, beforeEach, beforeAll, afterAll } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeReader, expectClean, captureEvents, keysOf, ALL_EVENTS, partEl, textOf,
  installCaptureStack, restoreCaptureStack, stubDecoder, isScanning,
  wait, SETTLE, type MediaMock, type SniceQRReaderElement,
} from './matrix-utils';

let media: MediaMock;

/** Let the requestAnimationFrame scan loop run a few frames. */
async function scanFrames(ms = 120): Promise<void> {
  await wait(ms);
}

/** Every `new Image()` the component made while this file's tracker is on. */
const constructedImages: HTMLImageElement[] = [];
const NativeImage = globalThis.Image;

beforeAll(() => {
  (globalThis as any).Image = class TrackedImage extends NativeImage {
    constructor(...args: any[]) {
      super(...(args as []));
      constructedImages.push(this as unknown as HTMLImageElement);
    }
  };
});

afterAll(() => { (globalThis as any).Image = NativeImage; });

describe('snice-qr-reader matrix: scanSpeed range', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(async () => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    await wait(SETTLE);
    restoreCaptureStack();
  });

  /**
   * `scanSpeed: number = 3  // attr: scan-speed, 1-10 (ignored when
   * pick-first)`. The whole documented range must be accepted through the
   * attribute and must still produce a scanning reader — and, per the doc's
   * own parenthetical, must make no difference at all under `pickFirst`.
   */
  for (const scanSpeed of [1, 3, 5, 8, 10]) {
    for (const pickFirst of [false, true]) {
      it(`scan-speed=${scanSpeed}${pickFirst ? ' with pick-first' : ''}`, async () => {
        el = await makeReader({ scanSpeed, pickFirst });
        // A decoder that never finds anything keeps the reader scanning under
        // both modes, so the two are compared in the same state.
        stubDecoder(el, null);
        await el.start();
        await scanFrames();

        const problems: string[] = [];
        if (el.scanSpeed !== scanSpeed) problems.push(`scanSpeed ${el.scanSpeed} != ${scanSpeed}`);
        if (el.pickFirst !== pickFirst) problems.push(`pickFirst ${el.pickFirst} != ${pickFirst}`);
        if (!isScanning(el)) problems.push('the reader is not scanning');
        expectClean(problems, `speed=${scanSpeed}/pickFirst=${pickFirst}`);
      });
    }
  }
});

describe('snice-qr-reader matrix: pick-first', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(async () => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    await wait(SETTLE);
    restoreCaptureStack();
  });

  it('pick-first stops scanning on the first hit', async () => {
    // "pick-first, scan until first hit then stop" — and "stop" is the
    // documented stop(), which also releases the camera.
    el = await makeReader({ pickFirst: true });
    stubDecoder(el, 'https://example.com/first');
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await scanFrames();

    const problems: string[] = [];
    const scans = seen.filter(e => e.type === 'qr-scan');
    if (scans.length !== 1) problems.push(`${scans.length} qr-scan events, expected exactly 1`);
    if (isScanning(el)) problems.push('still scanning after the first hit');
    const live = media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live');
    if (live.length) problems.push(`${live.length} camera track(s) still live after pick-first stopped`);
    expectClean(problems, 'pick-first');
  });

  it('a plain reader keeps scanning after a hit', async () => {
    // Without `pick-first` the doc's mode is "continuous scanning": the camera
    // stays open and the reader stays live.
    el = await makeReader({});
    stubDecoder(el, 'https://example.com/continuous');
    await el.start();
    await scanFrames();

    expect(isScanning(el), 'a continuous reader stopped itself').toBe(true);
    const live = media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live');
    expect(live.length).toBe(1);
  });

  it('a repeated code is announced once, not once per frame', async () => {
    // A camera pointed at one sticker decodes the same string sixty times a
    // second. Announcing each one would make `qr-scan` unusable as a "the user
    // scanned something" signal.
    el = await makeReader({ scanSpeed: 10 });
    stubDecoder(el, 'SAME');
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await scanFrames(200);

    expect(seen.filter(e => e.type === 'qr-scan').length).toBe(1);
  });

  it('the decoded value surfaces in the result part', async () => {
    el = await makeReader({});
    stubDecoder(el, 'SHOWN-TO-THE-USER');
    await el.start();
    await scanFrames();

    const result = partEl(el, 'result');
    expect(result, 'no part="result" after a successful scan').not.toBeNull();
    expect(textOf(result)).toContain('SHOWN-TO-THE-USER');
  });
});

describe('snice-qr-reader matrix: qr-scan payload', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(async () => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    await wait(SETTLE);
    restoreCaptureStack();
  });

  // `qr-scan → { data: string, timestamp: number, reader }`. A consumer writes
  // `e.detail.data`, so the key set is part of the contract.
  for (const payload of ['https://example.com', 'WIFI:S:net;T:WPA;P:pw;;', '12345']) {
    it(`payload ${JSON.stringify(payload)}`, async () => {
      el = await makeReader({ pickFirst: true });
      stubDecoder(el, payload);
      const seen = captureEvents(el, ALL_EVENTS);
      const before = Date.now();
      await el.start();
      await scanFrames();

      const problems: string[] = [];
      const scans = seen.filter(e => e.type === 'qr-scan');
      if (scans.length !== 1) problems.push(`${scans.length} qr-scan events, expected 1`);
      else {
        const detail = scans[0].detail;
        if (JSON.stringify(keysOf(detail)) !== JSON.stringify(['data', 'reader', 'timestamp'])) {
          problems.push(`detail keys ${JSON.stringify(keysOf(detail))} != ["data","reader","timestamp"]`);
        }
        if (detail.data !== payload) problems.push(`detail.data ${JSON.stringify(detail.data)} != ${JSON.stringify(payload)}`);
        if (typeof detail.timestamp !== 'number') problems.push(`detail.timestamp is ${typeof detail.timestamp}`);
        else if (detail.timestamp < before) problems.push('detail.timestamp predates the scan');
        if (detail.reader !== el) problems.push('detail.reader is not the reader');
      }
      expectClean(problems, `payload ${payload}`);
    });
  }
});

describe('snice-qr-reader matrix: manual snapshot mode', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(async () => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    await wait(SETTLE);
    restoreCaptureStack();
  });

  it('manual-snap does not scan continuously', async () => {
    // "manual-snap, photo snapshot mode": the camera is open but nothing is
    // decoded until the shutter is used, which is the whole point of the mode.
    el = await makeReader({ manualSnap: true });
    stubDecoder(el, 'WOULD-HAVE-BEEN-FOUND');
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await scanFrames(200);

    expect(seen.filter(e => e.type === 'qr-scan')).toEqual([]);
  });

  it('snap() returns the decoded string and announces it', async () => {
    // "snap() - Take snapshot, returns QR data string or null (async)".
    el = await makeReader({ manualSnap: true });
    stubDecoder(el, 'SNAPPED');
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await wait(SETTLE);

    const result = await el.snap();
    expect(result).toBe('SNAPPED');
    const scans = seen.filter(e => e.type === 'qr-scan');
    expect(scans.length).toBe(1);
    expect(scans[0].detail.data).toBe('SNAPPED');
  });

  it('snap() before the camera is ready is an error, not a silent null', async () => {
    // A null would be indistinguishable from "there was no code in frame".
    el = await makeReader({ manualSnap: true });
    const video = (el as HTMLElement).shadowRoot!.querySelector('video')!;
    Object.defineProperty(video, 'readyState', { configurable: true, value: 0 });
    await expect(el.snap()).rejects.toThrow();
  });

  it('scanImage() resolves with the code found in the file', async () => {
    // "scanImage(file: File) - Scan QR code from image file (async)".
    el = await makeReader({});
    stubDecoder(el, 'FROM-FILE');
    const file = new File(['fake-png-bytes'], 'code.png', { type: 'image/png' });
    // happy-dom's FileReader and Image both settle asynchronously, and the
    // component chains onload handlers across the two. The outcome is captured
    // the moment the promise exists, so nothing is ever transiently unhandled.
    const settled = outcomeOf(el.scanImage(file));
    await settleImageLoad(el);
    expect(await settled).toEqual({ ok: true, value: 'FROM-FILE' });
  });

  it('scanImage() rejects when the file holds no code', async () => {
    el = await makeReader({});
    stubDecoder(el, null);
    const file = new File(['fake-png-bytes'], 'blank.png', { type: 'image/png' });
    const settled = outcomeOf(el.scanImage(file));
    await settleImageLoad(el);
    const outcome = await settled;
    expect(outcome.ok, 'scanImage resolved for a file with no code').toBe(false);
    expect(String((outcome as any).error)).toMatch(/no qr code/i);
  });
});

/** Capture a promise's outcome immediately, so it is never left unhandled. */
function outcomeOf<T>(promise: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  return promise.then(
    value => ({ ok: true as const, value }),
    error => ({ ok: false as const, error }),
  );
}

/**
 * happy-dom never fires `Image.onload`, because it decodes nothing. Firing it
 * by hand is the same substitution the rest of this tier makes: the
 * component's chain is `FileReader.onload → Image.onload → decode`, and only
 * the middle link is missing from the environment.
 *
 * `constructedImages` is filled by the tracking `Image` installed for this
 * file only (see the top-level `beforeAll`/`afterAll`), so the helper can
 * reach the image `scanImage` is waiting on without the component having to
 * expose it.
 */
async function settleImageLoad(_el: SniceQRReaderElement): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt++) {
    await wait(5);
    const pending = constructedImages.filter(image => image.onload && !(image as any).__fired);
    if (!pending.length) continue;
    for (const image of pending) {
      (image as any).__fired = true;
      Object.defineProperty(image, 'width', { configurable: true, value: 200 });
      Object.defineProperty(image, 'height', { configurable: true, value: 200 });
      image.onload?.(new Event('load'));
    }
    await wait(20);
    return;
  }
}
