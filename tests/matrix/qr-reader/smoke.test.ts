/**
 * Smoke slice of the snice-qr-reader matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/qr-reader, 68 combos) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This file
 * is the standing cost the everyday loop pays, and it lives at
 * `smoke.test.ts` so it stays collected.
 *
 * Marquee combos only — one per documented mode family:
 *   · the idle shell, which owns the whole documented part list at once;
 *   · `camera` → `facingMode`, the mapping every start path depends on;
 *   · `pick-first`, the mode whose entire definition is "then stop";
 *   · the `qr-scan` payload, the event a page is actually written against;
 *   · camera release, the privacy contract.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeReader, expectReaderMatches, captureEvents, keysOf, ALL_EVENTS,
  installCaptureStack, restoreCaptureStack, stubDecoder, isScanning,
  expectedFacingMode, wait, SETTLE,
  type MediaMock, type SniceQRReaderElement,
} from './matrix-utils';

let media: MediaMock;

describe('snice-qr-reader matrix smoke', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { media = installCaptureStack({ cameras: 2 }).media; });
  afterEach(async () => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    await wait(SETTLE);
    restoreCaptureStack();
  });

  it('the idle reader renders the documented part list', async () => {
    el = await makeReader({});
    expectReaderMatches(el, {}, { scanning: false });
    expect(media.requests, 'an idle reader opened the camera').toEqual([]);
  });

  it('camera=front requests the user-facing camera', async () => {
    el = await makeReader({ camera: 'front' });
    stubDecoder(el, null);
    await el.start();
    await wait(SETTLE);
    expect(media.requests[0].video.facingMode).toBe(expectedFacingMode('front'));
  });

  it('pick-first stops on the first hit and releases the camera', async () => {
    el = await makeReader({ pickFirst: true });
    stubDecoder(el, 'ONE-SHOT');
    await el.start();
    await wait(120);

    expect(isScanning(el)).toBe(false);
    expect(media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live')).toEqual([]);
  });

  it('qr-scan carries { data, timestamp, reader }', async () => {
    el = await makeReader({ pickFirst: true });
    stubDecoder(el, 'https://example.com');
    const seen = captureEvents(el, ALL_EVENTS);
    await el.start();
    await wait(120);

    const scans = seen.filter(e => e.type === 'qr-scan');
    expect(scans.length).toBe(1);
    expect(keysOf(scans[0].detail)).toEqual(['data', 'reader', 'timestamp']);
    expect(scans[0].detail.data).toBe('https://example.com');
  });

  it('stop() releases every granted track', async () => {
    el = await makeReader({});
    stubDecoder(el, null);
    await el.start();
    await wait(SETTLE);
    el.stop();

    expect(media.streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live')).toEqual([]);
  });
});
