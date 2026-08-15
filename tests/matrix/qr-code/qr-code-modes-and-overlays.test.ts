/**
 * MATRIX slice — snice-qr-code render modes, exports, and centre overlays.
 *
 * Dimensions:
 *   render mode (2) x value (present, empty)            =  4 combos
 *   live render-mode switching                          =  2 combos
 *   centre text (size x colours x mode)                 =  8 combos
 *   the export surface (toSVGString/toDataURL/toBlob)   =  4 combos
 *   dot-style in SVG mode (findings)                    =  2 combos
 *                                                        ── 20 combos
 *
 * The documented rules (docs/ai/components/qr-code.md):
 *   · `renderMode: 'canvas'|'svg'` — which element the symbol is painted into;
 *   · `toSVGString()` — "SVG markup string (sync, only when renderMode='svg')";
 *   · `toDataURL(type?)` / `toBlob(type?)` — "Export as data URL / Blob";
 *   · `centerText`, `centerTextSize`, `textFillColor`, `textOutlineColor` — the
 *     centre text overlay, drawn as an outline pass under a fill pass so the
 *     text stays legible on top of the modules;
 *   · `dotStyle: 'square'|'rounded'|'dots'` — the module shape, listed with no
 *     restriction to one render mode.
 *
 * Canvas-mode PIXELS are the visual tier's business: happy-dom has no 2D
 * context, so nothing is painted here whatever the component does. What this
 * slice asserts about canvas mode is only what is real in a DOM: which element
 * is mounted, and that `toSVGString()` is scoped the way the docs scope it.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, unmountAll, finding, wait } from '../matrix-utils';
import {
  RENDER_MODES, SHORT, mountQr, svgOf, canvasOf, container, viewBoxSize,
  overlayTexts, expectedRenderMode, readRenderMode, type RenderMode,
} from './qr-code-support';
import '../../../packages/components/src/qr-code/snice-qr-code';

describe('qr-code matrix: render mode', () => {
  afterEach(() => unmountAll());

  for (const mode of RENDER_MODES) {
    it(`${mode}: mounts the documented element and scopes toSVGString()`, async () => {
      const el = await mountQr({ value: SHORT, 'render-mode': mode });
      expectShape(readRenderMode(el), expectedRenderMode(mode as RenderMode), mode);
      expect(container(el), `${mode}: no part="base"`).not.toBeNull();
    });

    it(`${mode}: an empty value renders no symbol at all`, async () => {
      const el = await mountQr({ 'render-mode': mode });
      expect(container(el), `${mode}: no part="base"`).not.toBeNull();
      expect(svgOf(el), `${mode}: an empty value produced an <svg>`).toBeNull();
      expect(canvasOf(el), `${mode}: an empty value produced a <canvas>`).toBeNull();
      expect(el.toSVGString(), `${mode}: an empty value produced SVG markup`).toBe('');
    });
  }

  it('switching render-mode replaces the symbol rather than stacking one on the other', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg' });
    expect(svgOf(el)).not.toBeNull();

    el.renderMode = 'canvas';
    await wait(60);
    expectShape(readRenderMode(el), expectedRenderMode('canvas'), 'svg -> canvas');

    el.renderMode = 'svg';
    await wait(60);
    expectShape(readRenderMode(el), expectedRenderMode('svg'), 'canvas -> svg');
  });

  it('changing the value regenerates the symbol in place', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg', margin: 0 });
    const before = viewBoxSize(svgOf(el));

    el.value = 'https://example.com/a/much/longer/payload/than/the/first/one?q=1234567890';
    await wait(60);
    const after = viewBoxSize(svgOf(el));

    expect(document.querySelectorAll('snice-qr-code'), 'more than one element mounted')
      .toHaveLength(1);
    expect(el.shadowRoot!.querySelectorAll('svg'), 'the old symbol was left behind')
      .toHaveLength(1);
    expect(after, `a longer payload produced the same symbol size (${before})`)
      .toBeGreaterThan(before!);
  });
});

describe('qr-code matrix: the centre text overlay', () => {
  afterEach(() => unmountAll());

  const CASES = [
    { id: 'default-colours/16', size: 16, fill: '#000000', outline: '#ffffff' },
    { id: 'default-colours/32', size: 32, fill: '#000000', outline: '#ffffff' },
    { id: 'custom-colours/16', size: 16, fill: '#1d4ed8', outline: '#fef3c7' },
    { id: 'custom-colours/32', size: 32, fill: '#1d4ed8', outline: '#fef3c7' },
  ];

  for (const testCase of CASES) {
    for (const symbolSize of [200, 320]) {
      const id = `${testCase.id}/size:${symbolSize}`;
      it(`${id}: an outline pass under a fill pass, both reading the centre text`, async () => {
        const el = await mountQr({
          value: SHORT,
          'render-mode': 'svg',
          size: symbolSize,
          'error-correction-level': 'H',
          'center-text': 'SCAN',
          'center-text-size': testCase.size,
          'text-fill-color': testCase.fill,
          'text-outline-color': testCase.outline,
        });

        const svg = svgOf(el);
        const texts = overlayTexts(svg);
        expect(texts, `${id}: expected an outline pass and a fill pass`).toHaveLength(2);

        const [outline, fill] = texts;
        expect(outline.textContent, `${id}: outline text`).toBe('SCAN');
        expect(fill.textContent, `${id}: fill text`).toBe('SCAN');
        expect(outline.getAttribute('stroke'), `${id}: outline stroke`).toBe(testCase.outline);
        expect(fill.getAttribute('fill'), `${id}: fill colour`).toBe(testCase.fill);
        expect(fill.getAttribute('stroke'), `${id}: the fill pass must not stroke`).toBeNull();

        // The overlay lives in the symbol's own coordinate space, so the
        // documented pixel size is scaled by viewBox units per pixel.
        const box = viewBoxSize(svg)!;
        const scale = box / symbolSize;
        for (const text of texts) {
          expect(Number(text.getAttribute('font-size')), `${id}: font-size`)
            .toBeCloseTo(testCase.size * scale, 4);
          expect(Number(text.getAttribute('x')), `${id}: x`).toBeCloseTo(box / 2, 4);
          expect(Number(text.getAttribute('y')), `${id}: y`).toBeCloseTo(box / 2, 4);
          expect(text.getAttribute('text-anchor'), `${id}: anchor`).toBe('middle');
        }
      });
    }
  }

  it('no centre text renders no overlay', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg' });
    expect(overlayTexts(svgOf(el))).toHaveLength(0);
  });
});

describe('qr-code matrix: the export surface', () => {
  afterEach(() => unmountAll());

  it('toSVGString() returns the symbol that is on screen', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg', 'fg-color': '#2196f3' });
    const markup = el.toSVGString();
    expect(markup.startsWith('<svg')).toBe(true);
    expect(markup).toContain('#2196f3');
    expect(markup).toContain('viewBox');
  });

  it('toDataURL("image/svg+xml") is a data URL carrying that markup', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg' });
    const url = await el.toDataURL('image/svg+xml');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(url.split(',')[1])).toContain('<svg');
  });

  it('toBlob("image/svg+xml") is a blob of that markup', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'svg' });
    const blob = await el.toBlob('image/svg+xml');
    expect(blob.type).toContain('image/svg+xml');
    expect(blob.size, 'an empty blob').toBeGreaterThan(0);
  });

  it('canvas mode has no SVG to hand back', async () => {
    const el = await mountQr({ value: SHORT, 'render-mode': 'canvas' });
    expect(el.toSVGString()).toBe('');
    expect(await el.toDataURL('image/svg+xml')).toBe('');
  });
});

describe('qr-code matrix: dot-style must reach the module shape in every render mode', () => {
  afterEach(() => unmountAll());

  // `dotStyle` is documented as a property of the component, alongside
  // `renderMode` and with no restriction to one of its values — the docs' own
  // example pairs `dot-style="rounded"` with nothing else. In SVG mode the
  // symbol is drawn from one square template rect that no dot style ever
  // touches, so `rounded` and `dots` render markup identical to `square`.
  for (const dotStyle of ['rounded', 'dots'] as const) {
    it.fails(
      finding('MATRIX-qr-code-1',
        `svg/dot-style:${dotStyle}: the SVG renderer ignores dot-style — its symbol`
        + ' is byte-for-byte the square one'),
      async () => {
        const square = await mountQr({
          value: SHORT, 'render-mode': 'svg', 'dot-style': 'square',
        });
        const styled = await mountQr({
          value: SHORT, 'render-mode': 'svg', 'dot-style': dotStyle,
        });
        expect(styled.toSVGString(), `dot-style="${dotStyle}" drew square modules`)
          .not.toBe(square.toSVGString());
      },
    );
  }
});
