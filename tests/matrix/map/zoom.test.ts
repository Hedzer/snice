/**
 * Matrix slice MAP / ZOOM — `setZoom`, the documented clamp, and the zoom
 * controls.
 *
 * Dimensions:
 *   · bounds (5) x requested zoom (9)  = 45 clamp combos
 *   · control button (2) x bounds (4)  =  8 control combos
 *   · keyboard zoom (4)                =  4 combos
 *   Total 57.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · `setZoom(zoom)` — "Set zoom (clamped to min/max)", so ANY argument, in or
 *     out of bounds, integral or not, lands inside [minZoom, maxZoom];
 *   · `minZoom = 1` / `maxZoom = 18` are the documented defaults and are
 *     configurable through the `min-zoom` / `max-zoom` attributes;
 *   · `map-zoom → { zoom }` fires when the "zoom level changed" — and therefore
 *     must NOT fire when a clamped request leaves the level where it was;
 *   · "controls — Zoom controls container": the two buttons step the level, and
 *     stop at the bounds rather than running past them.
 *
 * it.fails policy: nothing pinned; all 57 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, makeMap, clampZoom, collectEvents, structureProblems, markersOf,
  zoomInButton, zoomOutButton, clickNode, pressKey,
  expectClean, removeComponent, wait, SETTLE,
} from './map-support';

/** Bound pairs: the documented default, a narrow band, and the degenerate one. */
const BOUNDS: Array<[number, number]> = [
  [1, 18],
  [3, 16],
  [10, 12],
  [5, 5],
  [1, 2],
];

/** Requested levels: inside, on, and well outside every band above. */
const REQUESTS = [-5, 0, 1, 5, 10, 12, 18, 25, 7.5];

describe('map matrix: zoom', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('setZoom clamps to the documented bounds', () => {
    for (const [minZoom, maxZoom] of BOUNDS) {
      for (const request of REQUESTS) {
        // The start level is itself inside the band, so a clamp that "worked"
        // by refusing to move at all cannot pass by accident.
        const start = clampZoom(13, minZoom, maxZoom);
        const c = combo({ minZoom, maxZoom, zoom: start, markers: 'bare' });
        const id = `${comboId(c)}/setZoom(${request})`;

        it(`${id}: lands at ${clampZoom(request, minZoom, maxZoom)}`, async () => {
          el = await makeMap(c);
          expect(el.zoom).toBe(start);
          const seen = collectEvents(el);

          el.setZoom(request);
          await wait(SETTLE);

          const expected = clampZoom(request, minZoom, maxZoom);
          expect(el.zoom).toBe(expected);

          // "map-zoom → { zoom } (zoom level changed)" — only on a real change.
          const zooms = seen.filter(event => event.type === 'map-zoom');
          if (expected === start) {
            expect(zooms, `map-zoom fired without a level change`).toHaveLength(0);
          } else {
            expect(zooms).toHaveLength(1);
            expect(zooms[0].detail.zoom).toBe(expected);
          }
        });
      }
    }
  });

  describe('zoom controls', () => {
    for (const [minZoom, maxZoom] of BOUNDS.slice(0, 4)) {
      for (const direction of ['in', 'out'] as const) {
        // Start pinned AT the bound the button pushes against, so the combo
        // tests the stop, and one step in from it, so it tests the step.
        const start = direction === 'in' ? maxZoom : minZoom;
        const c = combo({ minZoom, maxZoom, zoom: start, markers: 'bare' });
        const id = `${comboId(c)}/click=${direction}`;

        it(`${id}: stops at the bound, then steps away from it`, async () => {
          el = await makeMap(c);
          const seen = collectEvents(el);
          const button = direction === 'in' ? zoomInButton(el) : zoomOutButton(el);

          // At the bound: pressing further changes nothing and emits nothing.
          expect(clickNode(button)).toBe(true);
          await wait(SETTLE);
          expect(el.zoom).toBe(start);
          expect(seen.filter(event => event.type === 'map-zoom')).toHaveLength(0);

          if (minZoom === maxZoom) return; // no room to step in either direction

          // One step in from the bound: pressing back toward it moves one level.
          const inward = direction === 'in' ? maxZoom - 1 : minZoom + 1;
          el.setZoom(inward);
          await wait(SETTLE);
          seen.length = 0;

          expect(clickNode(direction === 'in' ? zoomInButton(el) : zoomOutButton(el))).toBe(true);
          await wait(SETTLE);

          expect(el.zoom).toBe(start);
          const zooms = seen.filter(event => event.type === 'map-zoom');
          expect(zooms).toHaveLength(1);
          expect(zooms[0].detail.zoom).toBe(start);
        });
      }
    }
  });

  describe('keyboard zoom', () => {
    for (const [key, delta] of [['+', 1], ['=', 1], ['-', -1], ['_', -1]] as const) {
      it(`"${key}" steps the zoom by ${delta}`, async () => {
        const c = combo({ zoom: 10, markers: 'bare' });
        el = await makeMap(c);
        const seen = collectEvents(el);

        expect(pressKey(el, key)).toBe(true);
        await wait(SETTLE);

        expect(el.zoom).toBe(10 + delta);
        const zooms = seen.filter(event => event.type === 'map-zoom');
        expect(zooms).toHaveLength(1);
        expect(zooms[0].detail.zoom).toBe(10 + delta);
      });
    }
  });

  describe('the render follows the level', () => {
    it('a zoom change re-renders the map without disturbing its layers', async () => {
      const c = combo({ zoom: 13 });
      const markers = markersOf(c);
      el = await makeMap(c, markers);

      el.setZoom(5);
      await wait(SETTLE);

      expect(el.zoom).toBe(5);
      expectClean(structureProblems(el, combo({ zoom: 5 }), markers), comboId(c));
    });
  });
});
