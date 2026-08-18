/**
 * Smoke slice of the snice-camera-annotate matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/camera-annotate, 109 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file is
 * the standing cost the everyday loop pays, and it lives at `smoke.test.ts` so
 * it stays collected.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's bare `<snice-camera-annotate>`, which owns all four parts and
 *     every default at once;
 *   · `show-labels-panel` off, the switch that regresses into "always visible";
 *   · `capture()`'s mode switch and its documented event detail;
 *   · a freehand stroke → one annotation, the data model in one line;
 *   · the export/import round trip, the save/load contract;
 *   · MATRIX-camera-annotate-1, the camera-on-mount regression guard.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountAnnotator, expectShellMatches, captureFrame, drawOn, captureEvents, keysOf,
  installCaptureStack, restoreCaptureStack, installImageDecoder, restoreImageDecoder,
  annotationItems, partEl, isHidden, DATA_FIXTURES, wait, SETTLE, FRAME,
  type MediaMock,
} from './camera-annotate-support';

let media: MediaMock;

describe('snice-camera-annotate matrix smoke', () => {
  beforeEach(() => {
    media = installCaptureStack({ cameras: 1 }).media;
    installImageDecoder();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    restoreImageDecoder();
    restoreCaptureStack();
  });

  it('the documented bare markup renders the whole shell', async () => {
    const el = await mountAnnotator({});
    expectShellMatches(el, {});
  });

  it('show-labels-panel off hides the sidebar, keeping the part addressable', async () => {
    const combo = { showLabelsPanel: false };
    const el = await mountAnnotator(combo);
    expectShellMatches(el, combo);
    expect(isHidden(partEl(el, 'sidebar'))).toBe(true);
  });

  it('capture() switches to annotate mode and announces the frame', async () => {
    const el = await mountAnnotator({});
    const events = captureEvents(el, ['capture']);
    await captureFrame(el);

    expect(el.mode).toBe('annotate');
    expect(keysOf(events[0].detail)).toEqual(['dataURL', 'height', 'width']);
    expect(events[0].detail).toMatchObject({ width: FRAME.width, height: FRAME.height });
  });

  it('a freehand stroke becomes one labelled-able annotation', async () => {
    const el = await mountAnnotator({});
    await captureFrame(el);
    const events = captureEvents(el, ['annotate', 'annotation-change']);
    await drawOn(el);

    expect(events.map(event => event.type)).toEqual(['annotate', 'annotation-change']);
    const data = el.exportAnnotations();
    expect(data.annotations).toHaveLength(1);
    expect(data.annotations[0].strokeId).toBe(data.strokes[0].id);
    expect(annotationItems(el)).toHaveLength(1);
  });

  it('exportAnnotations/importAnnotations round-trips saved work', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.multiple);
    await wait(SETTLE);
    expect(el.exportAnnotations()).toEqual(DATA_FIXTURES.multiple);

    el.clearAnnotations();
    await wait(SETTLE);
    expect(el.exportAnnotations().annotations).toEqual([]);
  });

  // MATRIX-camera-annotate-1 (fixed): the bare element does not open the camera.
  it('MATRIX-camera-annotate-1 (fixed): a bare element does not request the camera', async () => {
    await mountAnnotator({});
    expect(media.requests).toEqual([]);
  });
});
