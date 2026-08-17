/**
 * Smoke slice of the snice-map matrix — the everyday-loop tier.
 *
 * `tests/matrix/**` is excluded from the default Vitest include except each
 * directory's `smoke.test.ts` (vitest.config.ts), so this file is the one map
 * matrix file the everyday `vitest run` still collects. The full 248-combo
 * matrix runs only via `npm run test:matrix`.
 *
 * One combo per feature family, chosen so a family that breaks cannot hide:
 *   · structure  — the doc's own Basic Usage markers render every layer;
 *   · tiles      — the OSM tile containing the centre is the one requested;
 *   · zoom       — setZoom clamps, and announces only real changes;
 *   · markers    — marker-click toggles the popup and returns the caller's own
 *                  object; addMarker/removeMarker re-render the layer;
 *   · events     — map-click reports the coordinates under the pointer;
 *   · fitBounds  — the documented default fits every marker;
 *   · findings   — the two marquee regressions, pinned here as well as in the
 *                  matrix tier so a FIX surfaces in the everyday loop at once.
 *
 * Every assertion routes through the matrix's own oracle (map-support.ts), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  MARKER_SETS, TILE_TEMPLATES, combo, comboId, markersOf, makeMap,
  structureProblems, tileProblems, readFacts, popupTextFor,
  latLngToTile, tileUrlFor, collectEvents, markerAt, clickNode, container,
  zoomInButton, expectClean, removeComponent, wait, SETTLE,
} from './map-support';

describe('map matrix smoke', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('structure: the documented Basic Usage markers render every layer', async () => {
    const c = combo();
    const markers = markersOf(c);
    el = await makeMap(c, markers);
    expectClean(structureProblems(el, c, markers), comboId(c));

    const facts = readFacts(el);
    expect(facts.presentParts).toEqual(['base', 'tiles', 'markers', 'controls']);
    expect(facts.markerCount).toBe(2);
    expect(facts.controlLabels).toEqual(['+', '-']);
  });

  it('tiles: the OSM tile containing the centre is the one requested', async () => {
    const c = combo({ center: { lat: 40.7128, lng: -74.006 }, zoom: 13, markers: 'none' });
    el = await makeMap(c);
    expectClean(tileProblems(el, c), comboId(c));

    const tile = latLngToTile(c.center.lat, c.center.lng, c.zoom);
    expect(readFacts(el).tileSrcs).toContain(
      tileUrlFor(TILE_TEMPLATES.default, Math.floor(tile.x), Math.floor(tile.y), c.zoom),
    );
  });

  it('zoom: setZoom clamps to the documented bounds and announces real changes', async () => {
    const c = combo({ minZoom: 3, maxZoom: 16, zoom: 10, markers: 'bare' });
    el = await makeMap(c);
    const seen = collectEvents(el);

    el.setZoom(99);
    await wait(SETTLE);
    expect(el.zoom).toBe(16);

    el.setZoom(-99);
    await wait(SETTLE);
    expect(el.zoom).toBe(3);

    // Already at the floor: a further request changes nothing and says nothing.
    seen.length = 0;
    el.setZoom(-99);
    await wait(SETTLE);
    expect(seen.filter(event => event.type === 'map-zoom')).toHaveLength(0);

    expect(clickNode(zoomInButton(el))).toBe(true);
    await wait(SETTLE);
    expect(el.zoom).toBe(4);
  });

  it('markers: marker-click toggles the popup and returns the caller\'s object', async () => {
    const c = combo();
    const markers = markersOf(c);
    el = await makeMap(c, markers);
    const seen = collectEvents(el);

    expect(clickNode(markerAt(el, 0))).toBe(true);
    await wait(SETTLE);
    expect(seen[0].detail.marker).toBe(markers[0]);
    expect(readFacts(el).popups[0]).toBe(popupTextFor(markers[0]));

    expect(clickNode(markerAt(el, 0))).toBe(true);
    await wait(SETTLE);
    expect(readFacts(el).popups.every(text => text === null)).toBe(true);
  });

  it('markers: addMarker and removeMarker re-render the layer', async () => {
    const c = combo();
    el = await makeMap(c);

    el.addMarker({ id: 'extra', lat: 1, lng: 2, popup: 'Extra' });
    await wait(SETTLE);
    expect(readFacts(el).markerCount).toBe(3);

    el.removeMarker('nyc');
    await wait(SETTLE);
    expect(readFacts(el).markerCount).toBe(2);
    expect(el.markers.some((m: any) => m.id === 'nyc')).toBe(false);
  });

  it('events: map-click reports the coordinates under the pointer', async () => {
    const c = combo({ center: { lat: 48.8566, lng: 2.3522 }, markers: 'none' });
    el = await makeMap(c);
    const seen = collectEvents(el);

    expect(clickNode(container(el))).toBe(true);
    await wait(SETTLE);

    const clicks = seen.filter(event => event.type === 'map-click');
    expect(clicks).toHaveLength(1);
    expect(clicks[0].detail.lat).toBeCloseTo(48.8566, 6);
    expect(clicks[0].detail.lng).toBeCloseTo(2.3522, 6);
  });

  it('fitBounds: the documented default fits every marker', async () => {
    const markers = MARKER_SETS.spread();
    el = await makeMap(combo({ markers: 'spread', zoom: 13 }), markers);

    el.fitBounds();
    await wait(SETTLE);

    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);
    expect(el.center.lat).toBeCloseTo((Math.min(...lats) + Math.max(...lats)) / 2, 9);
    expect(el.center.lng).toBeCloseTo((Math.min(...lngs) + Math.max(...lngs)) / 2, 9);
  });

  // The two marquee regressions, kept at full strength. See
  // matrix/map/markers.test.ts and matrix/map/fitbounds.test.ts.
  it.fails('MATRIX-map-1 a marker renders its authored icon', async () => {
    el = await makeMap(combo({ markers: 'bare' }), [{ id: 'a', lat: 0, lng: 0, icon: '🏛️' }]);
    const withIcon = readFacts(el).markerIconText[0];

    removeComponent(el);
    el = await makeMap(combo({ markers: 'bare' }), [{ id: 'a', lat: 0, lng: 0 }]);
    expect(withIcon).not.toBe(readFacts(el).markerIconText[0]);
  });

  it.fails('MATRIX-map-2 fitBounds emits map-zoom when it changes the level', async () => {
    el = await makeMap(combo({ markers: 'spread', zoom: 13 }), MARKER_SETS.spread());
    const seen = collectEvents(el);

    el.fitBounds();
    await wait(SETTLE);

    expect(el.zoom).not.toBe(13);
    expect(seen.filter(event => event.type === 'map-zoom')).toHaveLength(1);
  });
});
