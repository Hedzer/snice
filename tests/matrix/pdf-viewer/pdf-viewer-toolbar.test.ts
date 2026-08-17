/**
 * MATRIX slice — snice-pdf-viewer chrome and toolbar state.
 *
 * Dimensions: fit (3) x zoom (5, spanning the documented 0.25–5 range)
 *             x page (2) x channel (2) = 60 combos, all with no document.
 *
 * Without a `src` the viewer is its chrome, and the docs describe exactly that
 * chrome: the three parts, the focusable container, the titled buttons, the
 * empty state, and the toolbar readouts and boundary disables. `fit` owns the
 * fit select here; its GEOMETRY meaning belongs to the visual tier.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, afterEach } from 'vitest';
import { product, comboId, expectShape, removeComponent } from '../matrix-utils';
import {
  FITS, mountViewer, expectedShell, readShell,
  expectedToolbar, readToolbar, expectedAxes, readAxes, type ViewerCombo,
} from './pdf-viewer-support';
import '../../../packages/components/src/pdf-viewer/snice-pdf-viewer';

const ZOOMS = [0.25, 0.5, 1, 2.5, 5];

const COMBOS: ViewerCombo[] = product({
  fit: FITS,
  zoom: ZOOMS,
  page: [1, 3],
  channel: ['attr', 'prop'] as const,
});

describe('pdf-viewer matrix: chrome shape with no document', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('the unconditional shell is the same for every combo', async () => {
    const combo = COMBOS[0];
    el = await mountViewer(combo);
    expectShape(readShell(el), expectedShell(), 'shell');
  });
});

describe('pdf-viewer matrix: toolbar state', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const combo of COMBOS) {
    const id = comboId({ fit: combo.fit, zoom: combo.zoom, page: combo.page, channel: combo.channel });

    it(`${id}: readouts and boundary disables match the documented state`, async () => {
      // "Navigation buttons are disabled at page boundaries", the zoom range
      // is 0.25–5, download/print act on src (none here), and the readouts
      // mirror page/totalPages/zoom/fit.
      el = await mountViewer(combo);
      expectShape(readToolbar(el), expectedToolbar(combo), id);
    });

    it(`${id}: every axis reaches its property and its attribute channel`, async () => {
      el = await mountViewer(combo);
      expectShape(readAxes(el, combo), expectedAxes(combo), id);
    });
  }
});
