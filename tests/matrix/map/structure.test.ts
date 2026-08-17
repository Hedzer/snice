/**
 * Matrix slice MAP / STRUCTURE — every marker set crossed with every zoom level.
 *
 * Dimensions: markers (11) x zoom (5) = 55 combos.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · all four CSS parts — base, tiles, markers, controls — exist for every
 *     combo, markers or no markers, and the other three nest inside `base`;
 *   · "markers — Markers layer container" holds exactly one marker per
 *     `MapMarker`, at every zoom, including coincident coordinates and the
 *     Mercator extremes;
 *   · "controls — Zoom controls container" is a zoom-in and a zoom-out button;
 *   · a slippy map always paints tiles.
 *
 * it.fails policy: nothing pinned. This component's findings (MATRIX-map-1,
 * MATRIX-map-2) are in markers.test.ts and fitbounds.test.ts.
 */
import { describe, it, afterEach } from 'vitest';
import {
  MARKER_SET_NAMES, ZOOMS, combo, comboId, markersOf, makeMap,
  structureProblems, expectClean, removeComponent,
} from './map-support';

describe('map matrix: structure', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const markers of MARKER_SET_NAMES) {
    for (const zoom of ZOOMS) {
      const c = combo({ markers, zoom });

      it(`${comboId(c)}: renders the documented map layers`, async () => {
        const set = markersOf(c);
        el = await makeMap(c, set);
        expectClean(structureProblems(el, c, set), comboId(c));
      });
    }
  }
});
