/**
 * snice-camera-annotate — capture, then draw.
 *
 * The doc's headline sentence is "Camera capture + freehand drawing + labeled
 * annotations", and the two methods that implement it are:
 *
 *   capture(): Promise<void>   — "Capture frame, switch to annotate mode"
 *   capture event              — { dataURL, width, height }
 *   annotate event             — { annotation }
 *   annotation-change event    — { annotations }
 *
 * AXES: the four documented switches crossed against the capture path, then the
 * drawing path crossed against `autoRotateColors` (the switch that decides
 * whether the next stroke takes a new preset colour) and against multi-stroke
 * sequences.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountAnnotator, captureFrame, drawOn, captureEvents, keysOf, annotationItems,
  installCaptureStack, restoreCaptureStack, installImageDecoder, restoreImageDecoder,
  swatches, wait, SETTLE, FRAME, MODES, videoEl, isHidden, drawCanvas, partEl, text,
  type MediaMock,
} from './camera-annotate-support';

let media: MediaMock;

beforeEach(() => {
  media = installCaptureStack({ cameras: 1 }).media;
  installImageDecoder();
});

afterEach(() => {
  document.body.innerHTML = '';
  restoreImageDecoder();
  restoreCaptureStack();
});

describe('snice-camera-annotate matrix: capture()', () => {
  for (const showLabelsPanel of [true, false]) {
    for (const autoRotateColors of [true, false]) {
      const id = `panel=${showLabelsPanel ? 'on' : 'off'}/rotate=${autoRotateColors ? 'on' : 'off'}`;
      it(`${id}: capture() switches to annotate mode`, async () => {
        const el = await mountAnnotator({ showLabelsPanel, autoRotateColors });
        expect(el.mode).toBe('camera');
        await captureFrame(el);
        expect(el.mode).toBe('annotate');
      });

      it(`${id}: capture() emits the documented detail`, async () => {
        const el = await mountAnnotator({ showLabelsPanel, autoRotateColors });
        const events = captureEvents(el, ['capture']);
        await captureFrame(el);

        expect(events).toHaveLength(1);
        expect(keysOf(events[0].detail)).toEqual(['dataURL', 'height', 'width']);
        expect(events[0].detail.width).toBe(FRAME.width);
        expect(events[0].detail.height).toBe(FRAME.height);
        expect(String(events[0].detail.dataURL).startsWith('data:image/')).toBe(true);
      });
    }
  }

  it('the captured frame carries the video frame size, not the CSS box', async () => {
    const el = await mountAnnotator({});
    const video = videoEl(el)!;
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 1920 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 1080 });

    const events = captureEvents(el, ['capture']);
    await el.capture();
    await wait(SETTLE);
    expect(events[0].detail).toMatchObject({ width: 1920, height: 1080 });
  });

  /**
   * FINDING MATRIX-camera-annotate-2 (FIXED).
   *
   * `startCamera()` now stops any prior stream before requesting a new one, so
   * at most one stream is ever live and `stopCamera()` releases it wherever it
   * is reached from (`capture()`, `@dispose`).
   */
  it('MATRIX-camera-annotate-2 (fixed): capture() releases the camera it was previewing', async () => {
    const el = await mountAnnotator({ autoStart: true });
    await captureFrame(el);
    const live = media.streams.flatMap(stream => stream.getTracks())
      .filter(track => track.readyState === 'live');
    expect(live).toEqual([]);
  });

  it('after a capture the drawing surface is the visible one', async () => {
    const el = await mountAnnotator({});
    expect(isHidden(drawCanvas(el)), 'canvas hidden in camera mode').toBe(true);
    expect(isHidden(videoEl(el)), 'video hidden in camera mode').toBe(false);

    await captureFrame(el);
    expect(isHidden(drawCanvas(el)), 'canvas hidden in annotate mode').toBe(false);
    expect(isHidden(videoEl(el)), 'video hidden in annotate mode').toBe(true);
  });

  it('the toolbar offers a retake once a frame has been captured', async () => {
    const el = await mountAnnotator({});
    expect(text(partEl(el, 'toolbar')?.querySelector('button'))).toBe('Capture');
    await captureFrame(el);
    expect(text(partEl(el, 'toolbar')?.querySelector('button'))).toBe('Retake');
  });

  it('capture() twice keeps exactly one frame', async () => {
    const el = await mountAnnotator({});
    const events = captureEvents(el, ['capture']);
    await captureFrame(el);
    await captureFrame(el);
    expect(events).toHaveLength(2);
    expect(el.mode).toBe('annotate');
    // No annotations were made, so the second capture cannot have invented any.
    expect(el.exportAnnotations().annotations).toEqual([]);
  });
});

describe('snice-camera-annotate matrix: freehand drawing', () => {
  for (const autoRotateColors of [true, false]) {
    const id = `rotate=${autoRotateColors ? 'on' : 'off'}`;

    it(`${id}: a stroke creates one annotation and announces it`, async () => {
      const el = await mountAnnotator({ autoRotateColors });
      await captureFrame(el);
      const events = captureEvents(el, ['annotate', 'annotation-change']);

      await drawOn(el);

      expect(events.map(event => event.type)).toEqual(['annotate', 'annotation-change']);
      expect(keysOf(events[0].detail)).toEqual(['annotation']);
      const annotation = events[0].detail.annotation;
      expect(keysOf(annotation)).toEqual(['color', 'id', 'label', 'strokeId', 'timestamp', 'visible']);
      expect(annotation.label).toBe('');
      expect(annotation.visible).toBe(true);

      const data = el.exportAnnotations();
      expect(data.annotations).toHaveLength(1);
      expect(data.strokes).toHaveLength(1);
      // The annotation names the stroke it labels — that pairing is the whole
      // data model.
      expect(data.annotations[0].strokeId).toBe(data.strokes[0].id);
      expect(data.strokes[0].color).toBe(annotation.color);
    });

    it(`${id}: three strokes make three annotations`, async () => {
      const el = await mountAnnotator({ autoRotateColors });
      await captureFrame(el);
      await drawOn(el, [[10, 10], [30, 30], [50, 10]]);
      await drawOn(el, [[60, 60], [80, 80], [100, 60]]);
      await drawOn(el, [[110, 10], [130, 30], [150, 10]]);

      const data = el.exportAnnotations();
      expect(data.annotations).toHaveLength(3);
      expect(data.strokes).toHaveLength(3);
      expect(new Set(data.annotations.map(a => a.id)).size).toBe(3);
      expect(new Set(data.strokes.map(s => s.id)).size).toBe(3);
    });

    /**
     * FINDING MATRIX-camera-annotate-3 (the `rotate=off` half only).
     *
     * "sidebar - Sidebar (color palette + annotation labels)": an annotation
     * the user just drew has to appear in the panel that labels annotations —
     * otherwise it can never be labelled, hidden or deleted, and three of the
     * doc's own affordances are unreachable.
     *
     * `handlePointerUp` PUSHES into the `annotations` array rather than
     * assigning a new one, so the identity dirty-check sees no change and no
     * render is scheduled. With `autoRotateColors` on, the colour rotation
     * assigns `activeColor` immediately afterwards and that unrelated write is
     * what repaints the list; switch the rotation off and the panel never
     * updates.
     */
    const declare = autoRotateColors ? it : it.fails;
    declare(`${autoRotateColors ? '' : 'MATRIX-camera-annotate-3: '}${id}: the sidebar lists every annotation that exists`, async () => {
      const el = await mountAnnotator({ autoRotateColors });
      await captureFrame(el);
      await drawOn(el);
      expect(annotationItems(el)).toHaveLength(el.exportAnnotations().annotations.length);
    });
  }

  it('a tap is not a stroke', async () => {
    // One point is not a freehand drawing; a component that turned every
    // stray click into a labelled annotation would be unusable.
    const el = await mountAnnotator({});
    await captureFrame(el);
    const events = captureEvents(el, ['annotate', 'annotation-change']);
    await drawOn(el, [[20, 20]]);

    expect(events).toEqual([]);
    expect(el.exportAnnotations().annotations).toEqual([]);
  });

  it('auto-rotate-colors on gives the next stroke a different colour', async () => {
    const el = await mountAnnotator({ autoRotateColors: true });
    await captureFrame(el);
    await drawOn(el, [[10, 10], [30, 30], [50, 10]]);
    await drawOn(el, [[60, 60], [80, 80], [100, 60]]);

    const [first, second] = el.exportAnnotations().annotations;
    expect(second.color).not.toBe(first.color);
  });

  it('auto-rotate-colors off keeps the selected colour', async () => {
    const el = await mountAnnotator({ autoRotateColors: false });
    await captureFrame(el);
    await drawOn(el, [[10, 10], [30, 30], [50, 10]]);
    await drawOn(el, [[60, 60], [80, 80], [100, 60]]);

    const [first, second] = el.exportAnnotations().annotations;
    expect(second.color).toBe(first.color);
  });

  it('picking a swatch decides the next stroke colour', async () => {
    const el = await mountAnnotator({ autoRotateColors: false });
    await captureFrame(el);

    const swatch = swatches(el)[5];
    const chosen = swatch.getAttribute('title')!;
    swatch.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);

    await drawOn(el);
    expect(el.exportAnnotations().annotations[0].color).toBe(chosen);
  });

  it('drawing is inert until there is a frame to draw on', async () => {
    // In camera mode the drawing surface is not the live layer, and the
    // pointer handlers say so themselves.
    const el = await mountAnnotator({ mode: 'camera' });
    const events = captureEvents(el, ['annotate', 'annotation-change']);
    await drawOn(el);
    expect(events).toEqual([]);
    expect(el.exportAnnotations().annotations).toEqual([]);
  });

  for (const mode of MODES) {
    it(`mode=${mode}: drawn annotations survive an export/import round trip`, async () => {
      const el = await mountAnnotator({ mode });
      await captureFrame(el);
      await drawOn(el, [[10, 10], [30, 30], [50, 10]]);
      await drawOn(el, [[60, 60], [80, 80], [100, 60]]);

      const saved = el.exportAnnotations();
      const reloaded = await mountAnnotator({ mode: 'annotate' });
      reloaded.importAnnotations(saved);
      await wait(SETTLE);

      expect(reloaded.exportAnnotations()).toEqual(saved);
    });
  }
});

describe('snice-camera-annotate matrix: disposal', () => {
  // The privacy contract every camera component owes: nothing keeps the device
  // open once the element is gone. Same root cause as the capture-path leak —
  // see MATRIX-camera-annotate-2 (FIXED).
  it('MATRIX-camera-annotate-2 (fixed): a removed element leaves no camera running', async () => {
    const el = await mountAnnotator({ autoStart: true });
    (el as HTMLElement).remove();
    await wait(SETTLE);

    const live = media.streams.flatMap(stream => stream.getTracks())
      .filter(track => track.readyState === 'live');
    expect(live).toEqual([]);
  });

  it('a removed element that only ever had one stream is fully released', async () => {
    // The single-stream path — no orphan, so disposal is complete. This is the
    // guard that MATRIX-camera-annotate-2 is about orphaned streams and not
    // about `@dispose` failing to run.
    const el = await mountAnnotator({ mode: 'annotate' });
    el.mode = 'camera';
    await wait(SETTLE);
    expect(media.streams).toHaveLength(1);

    (el as HTMLElement).remove();
    await wait(SETTLE);
    expect(media.streams[0].getTracks().every(track => track.readyState === 'ended')).toBe(true);
  });
});
