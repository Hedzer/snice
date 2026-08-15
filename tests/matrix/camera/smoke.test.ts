/**
 * Smoke slice of the snice-camera matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/camera, 66 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file is
 * the standing cost the everyday loop pays, and it lives at `smoke.test.ts`
 * so it stays collected.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's `<snice-camera></snice-camera>`, which owns both parts, the
 *     slot and every default at once;
 *   · `show-controls` off, the switch that regresses into "always visible";
 *   · `capture()`'s documented return shape, the only method with one;
 *   · `switchCamera()`, the toggle;
 *   · camera release on stop, the privacy contract.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCamera, expectCameraMatches, keysOf, videoEl, primeVideo,
  installCaptureStack, restoreCaptureStack, wait, SETTLE,
  type MediaMock, type SniceCameraElement,
} from './matrix-utils';

let media: MediaMock;

describe('snice-camera matrix smoke', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  it('the documented bare markup renders the whole shell', async () => {
    el = await makeCamera({});
    expectCameraMatches(el, {});
    expect(el.isActive()).toBe(false);
    expect(media.requests, 'a bare camera opened the device').toEqual([]);
  });

  it('show-controls off removes the built-in control bar, not the slot', async () => {
    const combo = { showControls: false };
    el = await makeCamera(combo);
    expectCameraMatches(el, combo);
  });

  it('capture() returns the documented CapturedImage', async () => {
    el = await makeCamera({ width: 640, height: 480 });
    await el.start();
    primeVideo(videoEl(el)!, 640, 480);
    await wait(SETTLE);

    const image = await el.capture();
    expect(keysOf(image)).toEqual(['blob', 'dataURL', 'height', 'timestamp', 'width']);
    expect(image.width).toBe(640);
    expect(image.height).toBe(480);
  });

  it('switchCamera() toggles front and back', async () => {
    el = await makeCamera({ facingMode: 'user' });
    await el.switchCamera();
    expect(el.facingMode).toBe('environment');
    await el.switchCamera();
    expect(el.facingMode).toBe('user');
  });

  it('stop() releases every granted track', async () => {
    el = await makeCamera({});
    await el.start();
    await wait(SETTLE);
    el.stop();

    expect(el.getStream()).toBeNull();
    expect(media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live')).toEqual([]);
  });
});
