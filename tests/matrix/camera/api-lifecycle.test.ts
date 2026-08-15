/**
 * snice-camera matrix — the documented method and event surface.
 *
 * `docs/ai/components/camera.md` lists eight methods and four events, and
 * `capture()` is the only one with a spelled-out return shape:
 *
 *   capture(): Promise<CapturedImage>   `{ dataURL, blob, width, height, timestamp }`
 *
 * The width and height are the FRAME's, not the element's, which is what makes
 * that shape assertable at all — and it is the one place a camera silently
 * produces a 0x0 image. The rest of this file crosses `start`/`stop`/
 * `switchCamera`/`isActive`/`getStream` against the documented facing modes and
 * against the failure path a denied permission produces.
 *
 * 4 capture combos + 4 mirror/facing combos + 6 lifecycle cases
 * + 4 switch cases + 6 event cases = 24 combos.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCamera, expectClean, captureEvents, keysOf, ALL_EVENTS, videoEl,
  installCaptureStack, restoreCaptureStack, primeVideo, FACING_MODES,
  wait, SETTLE, type MediaMock, type CanvasMock, type SniceCameraElement,
} from './matrix-utils';

let media: MediaMock;
let canvas: CanvasMock;

async function startedCamera(combo: Parameters<typeof makeCamera>[0] = {}): Promise<SniceCameraElement> {
  const el = await makeCamera(combo);
  await el.start();
  await wait(SETTLE);
  return el;
}

describe('snice-camera matrix: capture()', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => {
    const stack = installCaptureStack({ cameras: 2 });
    media = stack.media; canvas = stack.canvas;
  });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  /**
   * "capture(): Promise<CapturedImage> - Capture frame
   *  (`{ dataURL, blob, width, height, timestamp }`)". The frame sizes below
   * are the ones a real device hands back; the returned image must be the
   * FRAME's size, because an image sized from the element would be whatever
   * CSS happened to do.
   */
  const FRAMES = [
    { width: 1280, height: 720 },
    { width: 640, height: 480 },
    { width: 1920, height: 1080 },
    { width: 720, height: 1280 },
  ];

  for (const frame of FRAMES) {
    it(`capture() of a ${frame.width}x${frame.height} frame`, async () => {
      el = await makeCamera({ width: frame.width, height: frame.height });
      await el.start();
      primeVideo(videoEl(el)!, frame.width, frame.height);
      await wait(SETTLE);

      const before = Date.now();
      const image = await el.capture();

      const problems: string[] = [];
      const wantKeys = ['blob', 'dataURL', 'height', 'timestamp', 'width'];
      if (JSON.stringify(keysOf(image)) !== JSON.stringify(wantKeys)) {
        problems.push(`CapturedImage keys ${JSON.stringify(keysOf(image))} != ${JSON.stringify(wantKeys)}`);
      }
      if (image.width !== frame.width) problems.push(`image.width ${image.width} != ${frame.width}`);
      if (image.height !== frame.height) problems.push(`image.height ${image.height} != ${frame.height}`);
      if (!/^data:/.test(image.dataURL)) problems.push(`dataURL "${image.dataURL.slice(0, 24)}…" is not a data URL`);
      if (!(image.blob instanceof Blob)) problems.push('image.blob is not a Blob');
      if (typeof image.timestamp !== 'number') problems.push(`timestamp is ${typeof image.timestamp}`);
      else if (image.timestamp < before) problems.push('timestamp predates the capture');
      expectClean(problems, `capture ${frame.width}x${frame.height}`);
    });
  }

  it('capture() on an inactive camera is an error, not a blank image', async () => {
    // "isActive(): boolean - Check if running" is the state this depends on; a
    // silently-blank image would be indistinguishable from a dark room.
    el = await makeCamera({});
    expect(el.isActive()).toBe(false);
    await expect(el.capture()).rejects.toThrow();
  });

  /**
   * `mirror: boolean = true` is a documented property whose only observable
   * effect is on the captured frame. The mirrored path is a horizontal flip
   * before the frame is drawn; the un-mirrored one draws it as it came.
   */
  for (const facingMode of FACING_MODES) {
    for (const mirror of [true, false]) {
      it(`capture() with mirror=${mirror} on the ${facingMode} camera`, async () => {
        el = await startedCamera({ facingMode, mirror });
        primeVideo(videoEl(el)!, 640, 480);
        canvas.reset();
        await el.capture();

        const flipped = canvas.operations.some(op => op.startsWith('scale(-1'));
        const drawn = canvas.operations.some(op => op.startsWith('drawImage'));
        expect(drawn, 'no frame was drawn at all').toBe(true);
        if (!mirror) {
          expect(flipped, 'mirror=false still flipped the frame').toBe(false);
        }
        if (mirror && facingMode === 'user') {
          // The selfie camera is the one a mirrored preview exists for.
          expect(flipped, 'mirror=true did not flip the self-facing frame').toBe(true);
        }
      });
    }
  }
});

describe('snice-camera matrix: start / stop / isActive / getStream', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  it('a fresh camera is inactive and holds no stream', async () => {
    // `autoStart: boolean = false` — rendering the element must not open a
    // permission prompt.
    el = await makeCamera({});
    expect(el.isActive()).toBe(false);
    expect(el.getStream()).toBeNull();
    expect(media.requests).toEqual([]);
  });

  for (const facingMode of FACING_MODES) {
    it(`start() requests the ${facingMode} camera and reports it active`, async () => {
      el = await startedCamera({ facingMode, width: 1280, height: 720 });

      const problems: string[] = [];
      if (media.requests.length !== 1) problems.push(`${media.requests.length} getUserMedia calls, expected 1`);
      else {
        const request = media.requests[0];
        if (request.video?.facingMode !== facingMode) {
          problems.push(`facingMode "${request.video?.facingMode}" != "${facingMode}"`);
        }
        // "width: number = 1280 / height: number = 720" are the requested
        // resolution, so they have to reach the constraints.
        if (request.video?.width?.ideal !== 1280) problems.push(`width constraint ${JSON.stringify(request.video?.width)}`);
        if (request.video?.height?.ideal !== 720) problems.push(`height constraint ${JSON.stringify(request.video?.height)}`);
        // "Live camera feed", not a recording: audio is not requested.
        if (request.audio !== false) problems.push(`audio constraint ${JSON.stringify(request.audio)}`);
      }
      if (!el.isActive()) problems.push('isActive() is false after start()');
      if (!el.getStream()) problems.push('getStream() is null after start()');
      expectClean(problems, `start/${facingMode}`);
    });
  }

  it('auto-start opens the camera without a start() call', async () => {
    el = await makeCamera({ autoStart: true });
    await wait(120);
    expect(media.requests.length).toBeGreaterThanOrEqual(1);
  });

  it('stop() releases the camera and clears the stream', async () => {
    // "stop(): void - Stop camera" plus the accessibility note that the camera
    // is released: a live track keeps the recording indicator on.
    el = await startedCamera({});
    el.stop();
    await wait(SETTLE);

    expect(el.isActive()).toBe(false);
    expect(el.getStream()).toBeNull();
    expect(media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live')).toEqual([]);
  });

  it('removing the element releases the camera', async () => {
    const camera = await startedCamera({});
    removeComponent(camera as HTMLElement);
    await wait(SETTLE);
    expect(media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live')).toEqual([]);
  });
});

describe('snice-camera matrix: switchCamera()', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  // "switchCamera(): Promise<void> - Toggle front/back". Both directions, and
  // both starting states, because a toggle that only works while running is
  // not a toggle.
  for (const facingMode of FACING_MODES) {
    for (const running of [false, true]) {
      it(`switchCamera() from ${facingMode} while ${running ? 'running' : 'stopped'}`, async () => {
        el = running ? await startedCamera({ facingMode }) : await makeCamera({ facingMode });
        const before = media.streams.slice();
        await el.switchCamera();
        await wait(SETTLE);

        const problems: string[] = [];
        const expected = facingMode === 'user' ? 'environment' : 'user';
        if (el.facingMode !== expected) problems.push(`facingMode "${el.facingMode}" != "${expected}"`);
        if (running) {
          // A camera that was running comes back on the other lens, and the
          // previous lens is released.
          if (!el.isActive()) problems.push('a running camera did not come back after the switch');
          const stale = before.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live');
          if (stale.length) problems.push(`${stale.length} track(s) of the previous camera are still live`);
          const last = media.requests[media.requests.length - 1];
          if (last?.video?.facingMode !== expected) {
            problems.push(`the restart requested "${last?.video?.facingMode}", expected "${expected}"`);
          }
        } else if (media.requests.length) {
          problems.push('switching a stopped camera opened one');
        }
        expectClean(problems, `switch/${facingMode}/${running ? 'running' : 'stopped'}`);
      });
    }
  }
});

describe('snice-camera matrix: events', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  it('camera-start carries the stream', async () => {
    el = await makeCamera({});
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await wait(SETTLE);

    const started = seen.filter(e => e.type === 'camera-start');
    expect(started.length).toBe(1);
    expect(keysOf(started[0].detail)).toEqual(['stream']);
    expect(started[0].detail.stream).toBe(el.getStream());
  });

  it('camera-stop fires with no detail of its own', async () => {
    // The doc writes `camera-stop -> (no detail)`.
    el = await startedCamera({});
    const seen = captureEvents(el, ALL_EVENTS);
    el.stop();
    await wait(SETTLE);

    const stopped = seen.filter(e => e.type === 'camera-stop');
    expect(stopped.length).toBe(1);
    expect(keysOf(stopped[0].detail)).toEqual([]);
  });

  it('camera-capture carries the captured image', async () => {
    el = await startedCamera({});
    primeVideo(videoEl(el)!, 640, 480);
    const seen = captureEvents(el, ALL_EVENTS);
    const image = await el.capture();
    await wait(SETTLE);

    const captured = seen.filter(e => e.type === 'camera-capture');
    expect(captured.length).toBe(1);
    expect(keysOf(captured[0].detail)).toEqual(['image']);
    expect(captured[0].detail.image).toBe(image);
  });

  for (const denial of [
    { id: 'permission denied', error: new Error('Permission denied') },
    { id: 'no device', error: new Error('Requested device not found') },
  ]) {
    it(`camera-error carries the ${denial.id} error`, async () => {
      el = await makeCamera({});
      const seen = captureEvents(el, ALL_EVENTS);
      media.denyWith(denial.error);
      await el.start();
      await wait(SETTLE);

      const problems: string[] = [];
      const errors = seen.filter(e => e.type === 'camera-error');
      if (errors.length !== 1) problems.push(`${errors.length} camera-error events, expected 1`);
      else {
        if (JSON.stringify(keysOf(errors[0].detail)) !== JSON.stringify(['error'])) {
          problems.push(`detail keys ${JSON.stringify(keysOf(errors[0].detail))} != ["error"]`);
        }
        if (errors[0].detail.error !== denial.error) problems.push('detail.error is not the thrown error');
      }
      if (seen.some(e => e.type === 'camera-start')) problems.push('camera-start fired although the camera never opened');
      if (el.isActive()) problems.push('isActive() is true after a failed start');
      expectClean(problems, denial.id);
    });
  }

  it('every event crosses the shadow boundary', async () => {
    // The doc's usage is a page-level listener, so the events must be composed
    // and bubbling or the page never sees them.
    el = await makeCamera({});
    const atDocument: string[] = [];
    const handler = (e: Event) => atDocument.push(e.type);
    for (const type of ALL_EVENTS) document.addEventListener(type, handler);

    await el.start();
    el.stop();
    await wait(SETTLE);

    for (const type of ALL_EVENTS) document.removeEventListener(type, handler);
    expect(atDocument).toContain('camera-start');
    expect(atDocument).toContain('camera-stop');
  });
});
