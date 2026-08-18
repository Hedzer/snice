/**
 * snice-camera-annotate — the rendered shell, across every documented switch.
 *
 * AXES (the component's whole documented property surface):
 *   mode              camera | annotate
 *   showLabelsPanel   on | off
 *   autoRotateColors  on | off
 *   autoStart         on | off
 *
 * 2 x 2 x 2 x 2 = 16 shell combos, plus the palette/label sub-matrices below.
 * Each shell combo is judged by one oracle (`expectShellMatches`) that encodes
 * the doc's four CSS parts, its canvas-area contents, its toolbar contract and
 * its two accessibility promises at once.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountAnnotator, expectShellMatches, comboId, MODES, DOC_PARTS,
  installCaptureStack, restoreCaptureStack, installImageDecoder, restoreImageDecoder,
  swatches, annotationItems, partEl, text, isHidden, DATA_FIXTURES, sr,
  type MediaMock, type SniceCameraAnnotateElement,
} from './camera-annotate-support';

let media: MediaMock;

beforeEach(() => {
  media = installCaptureStack({ cameras: 1, kinds: ['video'] }).media;
  installImageDecoder();
});

afterEach(() => {
  document.body.innerHTML = '';
  restoreImageDecoder();
  restoreCaptureStack();
});

describe('snice-camera-annotate matrix: the rendered shell', () => {
  for (const mode of MODES) {
    for (const showLabelsPanel of [true, false]) {
      for (const autoRotateColors of [true, false]) {
        for (const autoStart of [false, true]) {
          const combo = { mode, showLabelsPanel, autoRotateColors, autoStart };
          it(comboId(combo), async () => {
            const el = await mountAnnotator(combo);
            expectShellMatches(el, combo);
          });
        }
      }
    }
  }
});

describe('snice-camera-annotate matrix: the documented parts are addressable', () => {
  for (const mode of MODES) {
    it(`mode=${mode} exposes exactly the four documented parts`, async () => {
      const el = await mountAnnotator({ mode });
      // The doc's CSS Parts section is a public API: a styling consumer writes
      // `snice-camera-annotate::part(toolbar)`. Every named part must resolve,
      // and each to exactly one node — two nodes carrying the same part name
      // make `::part()` ambiguous.
      const counts = DOC_PARTS.map(name => ({
        name,
        count: sr(el).querySelectorAll(`[part~="${name}"]`).length,
      }));
      expect(counts, `mode=${mode}`).toEqual(DOC_PARTS.map(name => ({ name, count: 1 })));
    });
  }
});

describe('snice-camera-annotate matrix: the labels panel', () => {
  // "show-labels-panel" is the only switch that removes a whole documented
  // part's content from view, so it gets its own slice across both modes.
  for (const mode of MODES) {
    for (const showLabelsPanel of [true, false]) {
      it(`mode=${mode}/panel=${showLabelsPanel ? 'on' : 'off'} keeps the sidebar part addressable`, async () => {
        const el = await mountAnnotator({ mode, showLabelsPanel });
        const sidebar = partEl(el, 'sidebar');
        // The part itself always exists — the doc documents it unconditionally,
        // and a consumer's `::part(sidebar)` rule must not depend on a runtime
        // switch — but it is only SHOWN when the panel is on.
        expect(sidebar, 'part="sidebar"').toBeTruthy();
        expect(isHidden(sidebar)).toBe(!showLabelsPanel);
      });
    }
  }

  it('the empty sidebar tells the user how to create an annotation', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    expect(annotationItems(el)).toHaveLength(0);
    expect(text(partEl(el, 'sidebar'))).toContain('Draw on the image');
  });

  it('every imported annotation gets a row with a titled visibility toggle', async () => {
    // "Annotation toggles have descriptive titles" — the doc's accessibility
    // promise, asserted over the fixture with the most rows.
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.multiple);
    await new Promise(resolve => setTimeout(resolve, 40));

    const rows = annotationItems(el);
    expect(rows).toHaveLength(DATA_FIXTURES.multiple.annotations.length);
    const titles = rows.map(row => [...row.querySelectorAll('button')]
      .map(button => button.getAttribute('title')));
    expect(titles).toEqual(rows.map(() => ['Hide', 'Delete']));
  });

  it('a hidden annotation offers to show it again', async () => {
    const el = await mountAnnotator({ mode: 'annotate' });
    el.importAnnotations(DATA_FIXTURES.hidden);
    await new Promise(resolve => setTimeout(resolve, 40));

    const titles = annotationItems(el)
      .map(row => row.querySelector('button')?.getAttribute('title'));
    expect(titles).toEqual(['Hide', 'Show']);
  });
});

describe('snice-camera-annotate matrix: the color palette', () => {
  for (const mode of MODES) {
    for (const autoRotateColors of [true, false]) {
      it(`mode=${mode}/rotate=${autoRotateColors ? 'on' : 'off'} paints a titled swatch per preset`, async () => {
        const el = await mountAnnotator({ mode, autoRotateColors });
        const palette = swatches(el);
        expect(palette.length).toBeGreaterThan(0);
        // "Color swatches have title attributes" — every one, not most.
        expect(palette.filter(swatch => !swatch.getAttribute('title'))).toEqual([]);
        // Exactly one swatch is the active one at any time.
        expect(palette.filter(swatch => swatch.classList.contains('active'))).toHaveLength(1);
      });
    }
  }

  it('the auto-rotate switch reflects the documented property', async () => {
    const on = await mountAnnotator({ mode: 'annotate', autoRotateColors: true });
    const off = await mountAnnotator({ mode: 'annotate', autoRotateColors: false });
    const box = (el: SniceCameraAnnotateElement) =>
      sr(el).querySelector<HTMLInputElement>('.ca-auto-rotate input[type="checkbox"]');
    expect(box(on)?.checked, 'auto-rotate-colors on').toBe(true);
    expect(box(off)?.checked, 'auto-rotate-colors off').toBe(false);
  });
});

describe('snice-camera-annotate matrix: auto-start', () => {
  /**
   * FINDING MATRIX-camera-annotate-1 (FIXED).
   *
   * `autoStart: boolean = false` is documented as opt-in, and `.ai/gotchas.md`
   * states the house rule it exists for: "Never auto-request camera permission
   * on page load". Mounting the documented bare markup
   * (`<snice-camera-annotate></snice-camera-annotate>`) nevertheless calls
   * FIXED: the `mode` watcher is change-only (`{ immediate: false }`), so the
   * initial value no longer starts anything; the single auto-start path is the
   * opt-in `auto-start` handled in `@ready`.
   */
  it(
    'MATRIX-camera-annotate-1 (fixed): without auto-start nothing touches the camera',
    async () => {
      await mountAnnotator({});
      expect(media.requests).toEqual([]);
    },
  );

  it(
    'MATRIX-camera-annotate-1 (fixed): auto-start opens the camera exactly once, on mount',
    async () => {
      await mountAnnotator({ autoStart: true });
      expect(media.requests).toHaveLength(1);
    },
  );

  it('every request the component does make asks for video only', async () => {
    // Whatever triggers it, the constraints are a documented promise of a
    // camera component: no microphone, front-facing preview.
    await mountAnnotator({ autoStart: true });
    for (const request of media.requests) {
      expect(request.audio).toBe(false);
      expect(request.video.facingMode).toBe('user');
    }
  });

  it('auto-start in annotate mode does not open the camera', async () => {
    // There is no live preview to feed in annotate mode; opening the device
    // would light the user's camera indicator for a frame nobody sees.
    await mountAnnotator({ mode: 'annotate', autoStart: true });
    expect(media.requests).toEqual([]);
  });
});
