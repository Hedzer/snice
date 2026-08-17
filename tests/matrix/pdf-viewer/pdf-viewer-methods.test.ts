/**
 * MATRIX slice — snice-pdf-viewer navigation and zoom without a document.
 *
 * Dimensions: entry point (goToPage valid/invalid x2, nextPage, prevPage,
 *   keyboard ArrowRight/ArrowLeft/PageDown/PageUp x4, Ctrl+/- zoom x2,
 *   toolbar zoom buttons x2) — 12 families, x id spelling where relevant.
 *
 * With `totalPages = 0` every page navigation is out of range and must be the
 * documented no-op it is: "Navigate to specific page" can only navigate inside
 * a document, `page-change` fires "when the page changes", and the zoom range
 * caps stepping at 0.25 and 5. The zoom STEP itself (0.25, the documented
 * range's own unit) is asserted through the buttons and keyboard both.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, captureEvents, settle, unmountAll } from '../matrix-utils';
import {
  mountViewer, toolbarButton, readToolbar, expectedToolbar,
  pressKey, expectedZoomAfter, type ViewerCombo,
} from './pdf-viewer-support';
import '../../../packages/components/src/pdf-viewer/snice-pdf-viewer';

const plain = (over: Partial<ViewerCombo> = {}): ViewerCombo => ({
  page: 1, zoom: 1, fit: 'width', channel: 'attr', ...over,
});

describe('pdf-viewer matrix: navigation without a document', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('goToPage ignores pages outside the (empty) document', async () => {
    el = await mountViewer(plain());
    const seen = captureEvents(el, ['page-change']);
    const k = el as any;
    k.goToPage(5); k.goToPage(0); k.goToPage(-1);
    await settle(el, 10);
    expect(k.page).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });

  it('nextPage and prevPage are no-ops without a document', async () => {
    el = await mountViewer(plain());
    const seen = captureEvents(el, ['page-change']);
    const k = el as any;
    k.nextPage(); k.prevPage();
    await settle(el, 10);
    expect(k.page).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });

  for (const key of ['ArrowRight', 'PageDown']) {
    it(`keyboard ${key} does not move past a nonexistent last page`, async () => {
      el = await mountViewer(plain());
      const seen = captureEvents(el, ['page-change']);
      pressKey(el, key);
      await settle(el, 10);
      expect((el as any).page).toBe(1);
      expect(seen.types()).toEqual([]);
      seen.stop();
    });
  }

  for (const key of ['ArrowLeft', 'PageUp']) {
    it(`keyboard ${key} does not move before the first page`, async () => {
      el = await mountViewer(plain());
      pressKey(el, key);
      await settle(el, 10);
      expect((el as any).page).toBe(1);
    });
  }
});

describe('pdf-viewer matrix: zoom stepping within the documented range', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  for (const direction of ['in', 'out'] as const) {
    const from = direction === 'in' ? 1 : 2.5;

    it(`the toolbar ${direction === 'in' ? 'zoom-in' : 'zoom-out'} button steps by the range's unit`, async () => {
      const combo = plain({ zoom: from });
      el = await mountViewer(combo);
      toolbarButton(el, direction === 'in' ? 'zoom-in' : 'zoom-out')!.click();
      await settle(el, 10);
      expect((el as any).zoom).toBe(expectedZoomAfter(from, direction));
      // The toolbar readout follows the step.
      expectShape(readToolbar(el), expectedToolbar({ ...combo, zoom: expectedZoomAfter(from, direction) }), 'zoom step');
    });

    it(`keyboard Ctrl+${direction === 'in' ? '+' : '-'} steps the same unit`, async () => {
      const combo = plain({ zoom: from });
      el = await mountViewer(combo);
      pressKey(el, direction === 'in' ? '+' : '-', { ctrlKey: true });
      await settle(el, 10);
      expect((el as any).zoom).toBe(expectedZoomAfter(from, direction));
    });
  }

  it('zoom-out stops at the range floor and disables the button', async () => {
    el = await mountViewer(plain({ zoom: 0.25 }));
    expect(toolbarButton(el, 'zoom-out')!.disabled).toBe(true);
    pressKey(el, '-', { ctrlKey: true });
    await settle(el, 10);
    expect((el as any).zoom).toBe(0.25);
  });

  it('zoom-in stops at the range ceiling and disables the button', async () => {
    el = await mountViewer(plain({ zoom: 5 }));
    expect(toolbarButton(el, 'zoom-in')!.disabled).toBe(true);
    pressKey(el, '+', { ctrlKey: true });
    await settle(el, 10);
    expect((el as any).zoom).toBe(5);
  });

  it('zoom keys without the Ctrl/Cmd modifier are left to the page', async () => {
    el = await mountViewer(plain({ zoom: 1 }));
    pressKey(el, '+');
    pressKey(el, '-');
    await settle(el, 10);
    expect((el as any).zoom).toBe(1);
  });
});
