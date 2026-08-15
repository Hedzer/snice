/**
 * snice-qr-reader matrix — the camera lifecycle.
 *
 * `docs/ai/components/qr-reader.md` makes four camera promises and one
 * accessibility promise that is really a camera promise:
 *
 *   start()          "Start camera and scanning"
 *   stop()           "Stop scanning and release camera"
 *   switchCamera()   "Toggle front/back camera"
 *   camera           'front' | 'back', default 'back'
 *   a11y             "Camera released on stop/dispose"
 *
 * plus `auto-start` ("Auto-start continuous scanning") and `tap-start` ("tap
 * viewport to start/stop"), which are two more ways of reaching the same two
 * transitions. Every one of them is a `getUserMedia` call or a track being
 * stopped, so this file crosses each documented entry point against each
 * camera value and against the failure path a denied permission produces.
 *
 * 4 facing-mode cases + 2 auto-start + 4 tap-start + 4 release cases
 * + 4 error cases + 2 switch cases = 20 combos.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeReader, expectReaderMatches, expectClean, expectedFacingMode,
  captureEvents, keysOf, ALL_EVENTS, viewport, partEl, textOf,
  installCaptureStack, restoreCaptureStack, stubDecoder, isScanning,
  wait, SETTLE, type MediaMock, type SniceQRReaderElement,
} from './matrix-utils';

let media: MediaMock;

function tap(el: SniceQRReaderElement): void {
  viewport(el)?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('snice-qr-reader matrix: camera selection', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  // `camera: 'front'|'back' = 'back'` is a user-facing word; `facingMode` is
  // the platform word it has to become. Both start entry points are crossed
  // against both values because a default that only works through one of them
  // is a bug nobody notices.
  for (const camera of ['back', 'front'] as const) {
    for (const entry of ['start()', 'auto-start'] as const) {
      it(`${entry} requests facingMode ${expectedFacingMode(camera)} for camera=${camera}`, async () => {
        el = await makeReader({ camera, ...(entry === 'auto-start' ? { autoStart: true } : {}) });
        stubDecoder(el, null);
        if (entry === 'start()') await el.start();
        await wait(SETTLE);

        const problems: string[] = [];
        if (media.requests.length < 1) problems.push('the camera was never requested');
        else {
          const video = media.requests[media.requests.length - 1]?.video;
          if (video?.facingMode !== expectedFacingMode(camera)) {
            problems.push(`facingMode "${video?.facingMode}" != "${expectedFacingMode(camera)}"`);
          }
        }
        expectClean(problems, `${entry}/camera=${camera}`);
      });
    }
  }

  it('a reader without auto-start does not touch the camera', async () => {
    // `autoStart: boolean = false` — the default must not open a permission
    // prompt on a page that merely rendered the element.
    el = await makeReader({});
    await wait(SETTLE);
    expect(media.requests).toEqual([]);
  });

  it('auto-start reaches the scanning state on its own', async () => {
    el = await makeReader({ autoStart: true });
    await wait(SETTLE);
    expect(media.requests.length).toBeGreaterThanOrEqual(1);
  });

  for (const from of ['back', 'front'] as const) {
    it(`switchCamera() toggles ${from} to ${from === 'back' ? 'front' : 'back'}`, async () => {
      el = await makeReader({ camera: from });
      el.switchCamera();
      await wait(SETTLE);
      expect(el.camera).toBe(from === 'back' ? 'front' : 'back');
    });
  }
});

describe('snice-qr-reader matrix: tap to start and stop', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  it('tap-start: a tap on the viewport starts the camera', async () => {
    el = await makeReader({ tapStart: true });
    stubDecoder(el, null);
    tap(el);
    await wait(SETTLE);
    expect(media.requests.length).toBe(1);
    expect(isScanning(el)).toBe(true);
  });

  it('tap-start: a second tap stops it again', async () => {
    // "tap viewport to start/stop" — the same gesture is both halves.
    el = await makeReader({ tapStart: true });
    stubDecoder(el, null);
    tap(el);
    await wait(SETTLE);
    tap(el);
    await wait(SETTLE);
    expect(isScanning(el)).toBe(false);
    expect(media.stoppedTracks().length).toBeGreaterThanOrEqual(1);
  });

  it('without tap-start a tap does nothing', async () => {
    // `tapStart: boolean = false`: the viewport is not an activation surface
    // unless the page asked for one.
    el = await makeReader({});
    tap(el);
    await wait(SETTLE);
    expect(media.requests).toEqual([]);
    expect(isScanning(el)).toBe(false);
  });

  it('tap-start composes with manual-snap', async () => {
    // Two independent switches; turning both on must still start the camera.
    el = await makeReader({ tapStart: true, manualSnap: true });
    stubDecoder(el, null);
    tap(el);
    await wait(SETTLE);
    expect(media.requests.length).toBe(1);
    expect(isScanning(el)).toBe(true);
  });
});

describe('snice-qr-reader matrix: releasing the camera', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => { el = undefined; restoreCaptureStack(); });

  /**
   * "Camera released on stop/dispose" is a privacy contract, not a tidiness
   * one: a track left live keeps the recording indicator on. Every documented
   * way out of the scanning state is crossed against it.
   */
  const EXITS: Array<{ id: string; run: (el: SniceQRReaderElement) => void }> = [
    { id: 'stop()', run: reader => reader.stop() },
    { id: 'dispose (element removed)', run: reader => removeComponent(reader as HTMLElement) },
    { id: 'switchCamera()', run: reader => reader.switchCamera() },
    { id: 'tap (tap-start)', run: reader => tap(reader) },
  ];

  for (const exit of EXITS) {
    it(`${exit.id} releases every granted track`, async () => {
      const reader = await makeReader({ tapStart: true });
      stubDecoder(reader, null);
      await reader.start();
      await wait(SETTLE);
      expect(media.streams.length, 'no stream was granted to release').toBe(1);

      // The streams held BEFORE the exit are the ones that must end. Some
      // exits (switchCamera) are documented to come back on the other camera,
      // so a later stream is expected and is not what this test is about.
      const granted = media.streams.slice();
      exit.run(reader);
      // Long enough to cover a deferred restart, so the reader is quiescent
      // before this test's mocks are torn down.
      await wait(250);

      const live = granted.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live');
      expect(live, `${exit.id} left ${live.length} track(s) live`).toEqual([]);
      reader.stop();
      removeComponent(reader as HTMLElement);
      await wait(SETTLE);
    });
  }
});

describe('snice-qr-reader matrix: camera errors', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  /**
   * `camera-error → { error, reader }` and the `error-text` part are the two
   * halves of the documented failure surface: the page is told
   * programmatically, and the user is told on screen. Both must happen for
   * every reason a camera can refuse.
   */
  const DENIALS = [
    { id: 'permission denied', error: new Error('Permission denied') },
    { id: 'no device', error: new Error('Requested device not found') },
  ];

  for (const denial of DENIALS) {
    for (const camera of ['back', 'front'] as const) {
      it(`${denial.id} on camera=${camera}`, async () => {
        el = await makeReader({ camera });
        const seen = captureEvents(el, ALL_EVENTS);
        media.denyWith(denial.error);
        await el.start();
        await wait(SETTLE);

        const problems: string[] = [];
        const errors = seen.filter(e => e.type === 'camera-error');
        if (errors.length !== 1) problems.push(`${errors.length} camera-error events, expected 1`);
        else {
          if (JSON.stringify(keysOf(errors[0].detail)) !== JSON.stringify(['error', 'reader'])) {
            problems.push(`detail keys ${JSON.stringify(keysOf(errors[0].detail))} != ["error","reader"]`);
          }
          if (errors[0].detail.error !== denial.error) problems.push('detail.error is not the thrown error');
          if (errors[0].detail.reader !== el) problems.push('detail.reader is not the reader');
        }
        if (seen.some(e => e.type === 'camera-ready')) {
          problems.push('camera-ready fired although the camera never opened');
        }
        // The user-visible half.
        const errorEl = partEl(el, 'error-text');
        if (!errorEl) problems.push('no part="error-text" for a failed camera');
        else if (!textOf(errorEl).includes(denial.error.message)) {
          problems.push(`error-text "${textOf(errorEl)}" omits "${denial.error.message}"`);
        }
        if (isScanning(el)) problems.push('the reader thinks it is scanning after a denial');

        expectClean(problems, `${denial.id}/${camera}`);
      });
    }
  }

  it('a successful start announces camera-ready with the reader', async () => {
    el = await makeReader({});
    stubDecoder(el, null);
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await wait(SETTLE);

    const ready = seen.filter(e => e.type === 'camera-ready');
    expect(ready.length).toBe(1);
    expect(keysOf(ready[0].detail)).toEqual(['reader']);
    expect(ready[0].detail.reader).toBe(el);
    expectReaderMatches(el, {}, { scanning: true });
  });

  it('a retry after a denial clears the error', async () => {
    // The error is state, not a permanent verdict: granting permission and
    // pressing start again must leave the reader in the ordinary scanning
    // shell, with no stale `error-text` over the viewport.
    el = await makeReader({});
    stubDecoder(el, null);
    media.denyWith(new Error('Permission denied'));
    await el.start();
    await wait(SETTLE);
    expect(partEl(el, 'error-text')).not.toBeNull();

    await el.start();
    await wait(SETTLE);
    expectReaderMatches(el, {}, { scanning: true });
  });
});
