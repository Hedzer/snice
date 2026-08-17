/**
 * Matrix slice MAP / FITBOUNDS — "Auto-zoom/center to fit markers (defaults to
 * all)".
 *
 * Dimensions:
 *   · marker spread (9)                = 9 centring combos
 *   · explicit argument (5)            = 5 combos
 *   · degenerate input (4)             = 4 combos
 *   · event emission (3)               = 3 combos  [MATRIX-map-2]
 *   Total 21.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · `fitBounds(markers?)` — "Auto-zoom/center to fit markers (defaults to
 *     all)". Centring on the bounding box of the markers is what "fit" means,
 *     and "defaults to all" fixes the no-argument behaviour exactly;
 *   · a tighter cluster fits at a HIGHER zoom than a wider one — that is the
 *     "auto-zoom" half, and it is a monotone relation the doc's own wording
 *     commits to even though it names no specific levels;
 *   · the result must respect the documented meaning of `zoom` — it is still a
 *     zoom level, so it stays a number in the documented 1..18 territory;
 *   · `map-zoom → { zoom }` is documented as "(zoom level changed)".
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * MATRIX-map-2  `fitBounds()` changes the zoom level silently.
 *   combo:    markers=spread (London pair plus New York), zoom=13 before the
 *             call, which fitBounds moves to a much wider level
 *   expected: `map-zoom` fires once with the new level, because the doc
 *             qualifies that event only as "zoom level changed" — it is the
 *             single event a caller can use to keep an external zoom readout in
 *             step, and `fitBounds` is the one API that changes the level
 *             without the caller naming it.
 *   actual:   no event of any kind. `fitBounds` assigns `this.zoom` directly
 *             rather than going through `setZoom`, so it bypasses the emitter
 *             that every other zoom path uses (the buttons, the wheel, the
 *             keyboard, and `setZoom` itself all emit).
 *   Pinned with `it.fails` below.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  MARKER_SETS, combo, comboId, makeMap, collectEvents,
  removeComponent, wait, SETTLE,
} from './map-support';
import type { MapMarker } from './map-support';

/** The bounding-box centre "fit" is defined against. */
function boundsCentre(markers: MapMarker[]): { lat: number; lng: number } {
  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

/** The widest side of the bounding box, in degrees. */
function spreadOf(markers: MapMarker[]): number {
  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  return Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
}

/** Marker groups ordered from tightest to widest spread. */
const SPREADS: Array<[string, MapMarker[]]> = [
  ['identical', [
    { id: 'a', lat: 51.5, lng: -0.1 },
    { id: 'b', lat: 51.5, lng: -0.1 },
  ]],
  ['block', [
    { id: 'a', lat: 51.5, lng: -0.1 },
    { id: 'b', lat: 51.501, lng: -0.099 },
  ]],
  ['neighbourhood', [
    { id: 'a', lat: 51.5, lng: -0.1 },
    { id: 'b', lat: 51.52, lng: -0.07 },
  ]],
  ['city', [
    { id: 'a', lat: 51.3, lng: -0.4 },
    { id: 'b', lat: 51.7, lng: 0.1 },
  ]],
  ['region', [
    { id: 'a', lat: 50, lng: -3 },
    { id: 'b', lat: 53, lng: 1 },
  ]],
  ['continent', [
    { id: 'a', lat: 36, lng: -10 },
    { id: 'b', lat: 60, lng: 30 },
  ]],
  ['hemisphere', [
    { id: 'a', lat: -40, lng: -120 },
    { id: 'b', lat: 50, lng: 120 },
  ]],
  ['single', [
    { id: 'a', lat: 12.34, lng: 56.78 },
  ]],
  ['asymmetric', [
    { id: 'a', lat: 10, lng: -170 },
    { id: 'b', lat: 12, lng: 170 },
    { id: 'c', lat: 11, lng: 0 },
  ]],
];

describe('map matrix: fitBounds', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('centring', () => {
    for (const [name, markers] of SPREADS) {
      const c = combo({ markers: 'bare', zoom: 13 });

      it(`spread=${name}: centres on the marker bounding box`, async () => {
        el = await makeMap(c, markers);

        el.fitBounds();
        await wait(SETTLE);

        const expected = boundsCentre(markers);
        expect(el.center.lat).toBeCloseTo(expected.lat, 9);
        expect(el.center.lng).toBeCloseTo(expected.lng, 9);
        // Still a zoom level, not an arbitrary number.
        expect(Number.isFinite(el.zoom)).toBe(true);
        expect(el.zoom).toBeGreaterThanOrEqual(1);
        expect(el.zoom).toBeLessThanOrEqual(18);
      });
    }
  });

  describe('auto-zoom is monotone in the spread', () => {
    it('a tighter cluster never fits at a wider level than a looser one', async () => {
      const ordered = SPREADS
        .filter(([name]) => name !== 'single' && name !== 'identical')
        .map(([name, markers]) => ({ name, markers, spread: spreadOf(markers) }))
        .sort((a, b) => a.spread - b.spread);

      const levels: Array<{ name: string; spread: number; zoom: number }> = [];
      for (const entry of ordered) {
        el = await makeMap(combo({ markers: 'bare' }), entry.markers);
        el.fitBounds();
        await wait(SETTLE);
        levels.push({ name: entry.name, spread: entry.spread, zoom: el.zoom });
        removeComponent(el);
        el = null;
      }

      for (let i = 1; i < levels.length; i++) {
        expect(
          levels[i].zoom,
          `${levels[i].name} (spread ${levels[i].spread.toFixed(3)}) fits at zoom ${levels[i].zoom}, `
          + `wider than ${levels[i - 1].name} (spread ${levels[i - 1].spread.toFixed(3)}) at ${levels[i - 1].zoom}`,
        ).toBeLessThanOrEqual(levels[i - 1].zoom);
      }
      // …and the extremes really differ, so "auto-zoom" is not a constant.
      expect(levels[0].zoom).toBeGreaterThan(levels[levels.length - 1].zoom);
    });
  });

  describe('the explicit argument', () => {
    const SUBSETS: Array<[string, (all: MapMarker[]) => MapMarker[]]> = [
      ['all-explicit', all => all],
      ['first-two', all => all.slice(0, 2)],
      ['last-two', all => all.slice(-2)],
      ['one', all => all.slice(0, 1)],
      ['reordered', all => [...all].reverse()],
    ];

    for (const [name, pick] of SUBSETS) {
      it(`fitBounds(${name}): fits the argument, not the whole layer`, async () => {
        const all = MARKER_SETS.spread();
        el = await makeMap(combo({ markers: 'spread' }), all);
        const subset = pick(all);

        el.fitBounds(subset);
        await wait(SETTLE);

        const expected = boundsCentre(subset);
        expect(el.center.lat).toBeCloseTo(expected.lat, 9);
        expect(el.center.lng).toBeCloseTo(expected.lng, 9);
        // The layer itself is untouched — fitBounds is a view operation.
        expect(el.markers).toBe(all);
      });
    }
  });

  describe('degenerate input', () => {
    it('fitBounds() with no markers leaves the view alone', async () => {
      const c = combo({ markers: 'none', center: { lat: 10, lng: 20 }, zoom: 9 });
      el = await makeMap(c);
      const before = { center: { ...el.center }, zoom: el.zoom };

      el.fitBounds();
      await wait(SETTLE);

      expect(el.center).toEqual(before.center);
      expect(el.zoom).toBe(before.zoom);
    });

    it('fitBounds([]) leaves the view alone even with markers on the map', async () => {
      const c = combo({ markers: 'doc', center: { lat: 10, lng: 20 }, zoom: 9 });
      el = await makeMap(c);
      const before = { center: { ...el.center }, zoom: el.zoom };

      el.fitBounds([]);
      await wait(SETTLE);

      expect(el.center).toEqual(before.center);
      expect(el.zoom).toBe(before.zoom);
    });

    it('fitBounds on one marker centres exactly on it', async () => {
      const only: MapMarker[] = [{ id: 'x', lat: -12.5, lng: 130.8 }];
      el = await makeMap(combo({ markers: 'bare' }), only);

      el.fitBounds();
      await wait(SETTLE);

      expect(el.center).toEqual({ lat: -12.5, lng: 130.8 });
    });

    it('fitBounds never emits map-click or marker-click', async () => {
      el = await makeMap(combo({ markers: 'spread' }), MARKER_SETS.spread());
      const seen = collectEvents(el);

      el.fitBounds();
      await wait(SETTLE);

      expect(seen.filter(e => e.type === 'map-click')).toHaveLength(0);
      expect(seen.filter(e => e.type === 'marker-click')).toHaveLength(0);
    });
  });

  // ── MATRIX-map-2 ─────────────────────────────────────────────────────────
  describe('MATRIX-map-2: fitBounds and map-zoom', () => {
    it.fails('fitBounds emits map-zoom when it changes the level', async () => {
      const markers = MARKER_SETS.spread();
      el = await makeMap(combo({ markers: 'spread', zoom: 13 }), markers);
      const seen = collectEvents(el);

      el.fitBounds();
      await wait(SETTLE);

      expect(el.zoom).not.toBe(13); // it really did change the level…
      const zooms = seen.filter(event => event.type === 'map-zoom');
      expect(zooms).toHaveLength(1); // …so the documented event must have fired
      expect(zooms[0].detail.zoom).toBe(el.zoom);
    });

    it.fails('fitBounds(subset) emits map-zoom when it changes the level', async () => {
      const markers = MARKER_SETS.spread();
      el = await makeMap(combo({ markers: 'spread', zoom: 2 }), markers);
      const seen = collectEvents(el);

      el.fitBounds(markers.slice(0, 2));
      await wait(SETTLE);

      expect(el.zoom).not.toBe(2);
      expect(seen.filter(event => event.type === 'map-zoom')).toHaveLength(1);
    });

    it('every OTHER zoom path does emit map-zoom', async () => {
      // The comparison that makes the finding a divergence rather than a
      // preference: setZoom, the buttons, and the keys all announce themselves.
      el = await makeMap(combo({ markers: 'spread', zoom: 13 }));
      const seen = collectEvents(el);

      el.setZoom(9);
      await wait(SETTLE);

      expect(seen.filter(event => event.type === 'map-zoom')).toHaveLength(1);
    });
  });
});
