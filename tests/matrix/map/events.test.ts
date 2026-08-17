/**
 * Matrix slice MAP / EVENTS + METHODS — `map-click`, `map-move`, and the
 * documented `setCenter` / keyboard panning.
 *
 * Dimensions:
 *   · map-click centre (7) x zoom (2)   = 14 combos
 *   · setCenter (6)                     =  6 combos
 *   · drag pan (4)                      =  4 combos
 *   · keyboard pan (4)                  =  4 combos
 *   · event plumbing (4)                =  4 combos
 *   Total 32.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · `map-click → { lat, lng } (click on map, not marker)` — the coordinates
 *     under the pointer. A click at the container's own centre is therefore the
 *     current `center`, which is the one point whose answer does not depend on
 *     a layout the DOM tier has not got;
 *   · `map-move → { center: MapCenter, zoom } (after drag pan)`;
 *   · `setCenter(lat, lng)` — "Pan to coordinates";
 *   · all four events are declared `bubbles: true, composed: true` by the
 *     component's own dispatch contract, so they must be observable from a
 *     listener outside the element.
 *
 * it.fails policy: nothing pinned; all 32 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, makeMap, collectEvents, container, clickNode, markerAt,
  pressKey, dragPan, removeComponent, wait, SETTLE,
} from './map-support';
import type { MapCenter } from './map-support';

const CENTRES: Array<[string, MapCenter]> = [
  ['london', { lat: 51.505, lng: -0.09 }],
  ['nyc', { lat: 40.7128, lng: -74.006 }],
  ['null-island', { lat: 0, lng: 0 }],
  ['sydney', { lat: -33.8688, lng: 151.2093 }],
  ['dateline', { lat: 0, lng: 179.5 }],
  ['far-north', { lat: 78, lng: 15 }],
  ['far-south', { lat: -78, lng: -15 }],
];

describe('map matrix: events', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('map-click reports the coordinates under the pointer', () => {
    for (const [name, center] of CENTRES) {
      for (const zoom of [3, 13]) {
        const c = combo({ center, zoom, markers: 'none' });
        const id = `centre=${name}/zoom=${zoom}`;

        it(`${id}: a click at the container centre reports the map centre`, async () => {
          el = await makeMap(c);
          const seen = collectEvents(el);

          expect(clickNode(container(el))).toBe(true);
          await wait(SETTLE);

          const clicks = seen.filter(event => event.type === 'map-click');
          expect(clicks).toHaveLength(1);
          // Mercator round-trips through a transcendental pair, so the
          // comparison is to floating-point tolerance, not bit equality.
          expect(clicks[0].detail.lat).toBeCloseTo(center.lat, 6);
          expect(clicks[0].detail.lng).toBeCloseTo(center.lng, 6);
        });
      }
    }
  });

  describe('setCenter', () => {
    for (const [name, center] of CENTRES.slice(0, 6)) {
      it(`setCenter(${name}): pans to the coordinates`, async () => {
        const c = combo({ markers: 'bare' });
        el = await makeMap(c);
        const seen = collectEvents(el);

        el.setCenter(center.lat, center.lng);
        await wait(SETTLE);

        expect(el.center).toEqual(center);
        // "map-move → { center, zoom }" carries the level it moved at.
        const moves = seen.filter(event => event.type === 'map-move');
        expect(moves.length).toBeGreaterThan(0);
        expect(moves[moves.length - 1].detail.center).toEqual(center);
        expect(moves[moves.length - 1].detail.zoom).toBe(el.zoom);
      });
    }
  });

  describe('drag pan', () => {
    const DRAGS: Array<[string, number, number]> = [
      ['east', -120, 0],
      ['west', 120, 0],
      ['north', 0, 90],
      ['south', 0, -90],
    ];

    for (const [name, dx, dy] of DRAGS) {
      it(`drag ${name}: emits map-move with the new centre`, async () => {
        const c = combo({ center: { lat: 40, lng: 10 }, zoom: 8, markers: 'none' });
        el = await makeMap(c);
        const before = { ...el.center };
        const seen = collectEvents(el);

        expect(await dragPan(el, dx, dy)).toBe(true);

        // "map-move → { center: MapCenter, zoom } (after drag pan)"
        const moves = seen.filter(event => event.type === 'map-move');
        expect(moves).toHaveLength(1);
        expect(moves[0].detail.zoom).toBe(8);
        expect(moves[0].detail.center).toEqual(el.center);

        // The centre really moved, and in the direction the gesture implies.
        // Dragging is grab-and-pull: the map follows the pointer, so the view
        // travels the OPPOSITE way. Pulling the map leftwards (negative dx)
        // brings land from the east into view, raising the centre longitude;
        // pulling it downwards (positive dy) brings land from the north into
        // view, raising the centre latitude.
        if (dx !== 0) {
          expect(el.center.lng).not.toBe(before.lng);
          expect(el.center.lng > before.lng).toBe(dx < 0);
        }
        if (dy !== 0) {
          expect(el.center.lat).not.toBe(before.lat);
          expect(el.center.lat > before.lat).toBe(dy > 0);
        }
      });
    }
  });

  describe('keyboard pan', () => {
    const KEYS: Array<[string, 'lat' | 'lng', 1 | -1]> = [
      ['ArrowLeft', 'lng', -1],
      ['ArrowRight', 'lng', 1],
      ['ArrowUp', 'lat', 1],
      ['ArrowDown', 'lat', -1],
    ];

    for (const [key, axis, direction] of KEYS) {
      it(`${key}: pans ${axis} ${direction > 0 ? 'up' : 'down'}`, async () => {
        const c = combo({ center: { lat: 40, lng: 10 }, zoom: 8, markers: 'none' });
        el = await makeMap(c);
        const before = { ...el.center };
        const seen = collectEvents(el);

        expect(pressKey(el, key)).toBe(true);
        await wait(SETTLE);

        const moved = el.center[axis] - before[axis];
        expect(Math.sign(moved)).toBe(direction);
        // The other axis stays put.
        const other = axis === 'lat' ? 'lng' : 'lat';
        expect(el.center[other]).toBe(before[other]);

        const moves = seen.filter(event => event.type === 'map-move');
        expect(moves).toHaveLength(1);
        expect(moves[0].detail.center).toEqual(el.center);
      });
    }
  });

  describe('event plumbing', () => {
    it('map-click bubbles and is composed', async () => {
      el = await makeMap(combo({ markers: 'none' }));
      const outside: any[] = [];
      document.addEventListener('map-click', event => outside.push(event));

      clickNode(container(el));
      await wait(SETTLE);

      expect(outside.length).toBeGreaterThan(0);
      expect(outside[0].bubbles).toBe(true);
      expect(outside[0].composed).toBe(true);
    });

    it('marker-click bubbles and is composed', async () => {
      el = await makeMap(combo({ markers: 'doc' }));
      const outside: any[] = [];
      document.addEventListener('marker-click', event => outside.push(event));

      clickNode(markerAt(el, 0));
      await wait(SETTLE);

      expect(outside.length).toBeGreaterThan(0);
      expect(outside[0].bubbles).toBe(true);
      expect(outside[0].composed).toBe(true);
    });

    it('clicking a marker does not also fire map-click', async () => {
      el = await makeMap(combo({ markers: 'doc' }));
      const seen = collectEvents(el);

      clickNode(markerAt(el, 0));
      await wait(SETTLE);

      expect(seen.filter(event => event.type === 'marker-click')).toHaveLength(1);
      expect(seen.filter(event => event.type === 'map-click')).toHaveLength(0);
    });

    it('a map click closes any open popup', async () => {
      el = await makeMap(combo({ markers: 'doc' }));
      clickNode(markerAt(el, 0));
      await wait(SETTLE);

      clickNode(container(el));
      await wait(SETTLE);

      const popups = el.shadowRoot.querySelectorAll('.map-popup');
      expect(popups).toHaveLength(0);
    });
  });
});
