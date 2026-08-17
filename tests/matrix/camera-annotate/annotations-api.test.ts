/**
 * snice-camera-annotate — the annotation data API.
 *
 * The doc gives four methods and one data type, and they compose into one
 * contract worth crossing exhaustively:
 *
 *   exportAnnotations(): AnnotationData      — JSON-serializable
 *   importAnnotations(data): void            — load annotation data
 *   clearAnnotations(): void                 — remove all annotations
 *   exportImage({ includeLabels }): string   — export as data URL
 *
 * AXES: 5 data fixtures (empty, single, multiple, hidden, orphan stroke)
 *       x 2 modes x {import, import→export, import→clear, import→re-import}
 *       plus the `includeLabels` switch and the `annotation-change` event.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountAnnotator, expectExportShape, captureEvents, keysOf, annotationItems,
  installCaptureStack, restoreCaptureStack, installImageDecoder, restoreImageDecoder,
  DATA_FIXTURES, MODES, wait, SETTLE, FRAME, captureFrame,
  type AnnotationData,
} from './camera-annotate-support';

const FIXTURE_NAMES = Object.keys(DATA_FIXTURES);

beforeEach(() => {
  installCaptureStack({ cameras: 1 });
  installImageDecoder();
});

afterEach(() => {
  document.body.innerHTML = '';
  restoreImageDecoder();
  restoreCaptureStack();
});

describe('snice-camera-annotate matrix: export shape', () => {
  it('a fresh element exports empty, zero-sized annotation data', async () => {
    const el = await mountAnnotator({});
    expectExportShape(el.exportAnnotations(), DATA_FIXTURES.empty, 'fresh');
  });

  for (const mode of MODES) {
    for (const name of FIXTURE_NAMES) {
      it(`mode=${mode}/${name}: import then export round-trips exactly`, async () => {
        const el = await mountAnnotator({ mode });
        el.importAnnotations(DATA_FIXTURES[name]);
        await wait(SETTLE);
        expectExportShape(el.exportAnnotations(), DATA_FIXTURES[name], `${mode}/${name}`);
      });
    }
  }
});

describe('snice-camera-annotate matrix: import is a replacement, not a merge', () => {
  for (const name of FIXTURE_NAMES) {
    it(`${name} replaces whatever was loaded before it`, async () => {
      // "importAnnotations(data): Load annotation data" — loading a second
      // document must not leave the first one's strokes behind.
      const el = await mountAnnotator({ mode: 'annotate' });
      el.importAnnotations(DATA_FIXTURES.multiple);
      await wait(SETTLE);
      el.importAnnotations(DATA_FIXTURES[name]);
      await wait(SETTLE);
      expectExportShape(el.exportAnnotations(), DATA_FIXTURES[name], `replace-with-${name}`);
    });
  }

  it('imported data is copied, not aliased', async () => {
    // A consumer holds the object it imported; mutating it afterwards must not
    // reach inside the component, or "load annotation data" would be "hand the
    // component your live state".
    const el = await mountAnnotator({ mode: 'annotate' });
    const data: AnnotationData = JSON.parse(JSON.stringify(DATA_FIXTURES.multiple));
    el.importAnnotations(data);
    await wait(SETTLE);

    data.annotations[0].label = 'MUTATED';
    data.strokes[0].points[0].x = 999;
    data.imageWidth = 1;

    const exported = el.exportAnnotations();
    expect(exported.annotations[0].label).toBe('Crack');
    expect(exported.strokes[0].points[0].x).toBe(10);
    expect(exported.imageWidth).toBe(FRAME.width);
  });

  it('exported data is a copy too', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.single);
    await wait(SETTLE);

    const first = el.exportAnnotations();
    first.annotations[0].label = 'MUTATED';
    first.strokes[0].points[0].y = -1;

    const second = el.exportAnnotations();
    expect(second.annotations[0].label).toBe('Crack');
    expect(second.strokes[0].points[0].y).toBe(10);
  });
});

describe('snice-camera-annotate matrix: clearAnnotations', () => {
  for (const name of FIXTURE_NAMES) {
    it(`${name}: clearAnnotations() removes every annotation and stroke`, async () => {
      const el = await mountAnnotator({ mode: 'annotate' });
      el.importAnnotations(DATA_FIXTURES[name]);
      await wait(SETTLE);
      el.clearAnnotations();
      await wait(SETTLE);

      const after = el.exportAnnotations();
      expect(after.annotations, `${name} annotations`).toEqual([]);
      expect(after.strokes, `${name} strokes`).toEqual([]);
      // The frame itself is not an annotation: clearing the drawings must not
      // throw away the captured image's dimensions.
      expect(after.imageWidth, `${name} imageWidth`).toBe(DATA_FIXTURES[name].imageWidth);
      expect(after.imageHeight, `${name} imageHeight`).toBe(DATA_FIXTURES[name].imageHeight);
    });
  }

  it('the sidebar goes back to its empty state after a clear', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.multiple);
    await wait(SETTLE);
    expect(annotationItems(el)).toHaveLength(3);

    el.clearAnnotations();
    await wait(SETTLE);
    expect(annotationItems(el)).toHaveLength(0);
  });
});

describe('snice-camera-annotate matrix: annotation-change', () => {
  for (const name of FIXTURE_NAMES) {
    it(`${name}: import announces the loaded annotations`, async () => {
      const el = await mountAnnotator({ mode: 'annotate' });
      const events = captureEvents(el, ['annotation-change']);
      el.importAnnotations(DATA_FIXTURES[name]);
      await wait(SETTLE);

      expect(events.map(event => event.type)).toEqual(['annotation-change']);
      expect(keysOf(events[0].detail)).toEqual(['annotations']);
      expect(events[0].detail.annotations).toEqual(DATA_FIXTURES[name].annotations);
    });
  }

  it('clear announces an empty annotation list', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.multiple);
    await wait(SETTLE);

    const events = captureEvents(el, ['annotation-change']);
    el.clearAnnotations();
    await wait(SETTLE);
    expect(events).toHaveLength(1);
    expect(events[0].detail.annotations).toEqual([]);
  });

  it('the announced list is a copy the listener cannot write back through', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    const events = captureEvents(el, ['annotation-change']);
    el.importAnnotations(DATA_FIXTURES.single);
    await wait(SETTLE);

    events[0].detail.annotations[0].label = 'MUTATED';
    expect(el.exportAnnotations().annotations[0].label).toBe('Crack');
  });
});

describe('snice-camera-annotate matrix: exportImage', () => {
  for (const includeLabels of [undefined, false, true]) {
    for (const name of ['empty', 'single', 'multiple', 'hidden'] as const) {
      it(`${name}/includeLabels=${String(includeLabels)} returns a data URL`, async () => {
        const el = await mountAnnotator({ mode: 'annotate' });
        el.importAnnotations(DATA_FIXTURES[name]);
        await wait(SETTLE);

        const url = includeLabels === undefined
          ? el.exportImage()
          : el.exportImage({ includeLabels });
        // "exportImage(options?): string — Export as data URL".
        expect(typeof url).toBe('string');
        expect(url.startsWith('data:image/')).toBe(true);
      });
    }
  }

  it('exporting after a capture carries the captured frame', async () => {
    const el = await mountAnnotator({});
    await captureFrame(el);
    expect(el.exportImage().startsWith('data:image/')).toBe(true);
    expect(el.exportImage({ includeLabels: true }).startsWith('data:image/')).toBe(true);
  });
});
