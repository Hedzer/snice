/**
 * Matrix slice MAP / MARKERS — `addMarker`, `removeMarker`, the popup toggle,
 * and the documented `MapMarker.icon` field.
 *
 * Dimensions:
 *   · marker set (10 populated) x popup index (2)  = 20 popup combos
 *   · addMarker (6) / removeMarker (7)             = 13 mutation combos
 *   · icon shapes (4)                              =  4 combos  [MATRIX-map-1]
 *   Total 37.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · `marker-click → { marker: MapMarker } (also toggles popup)` — the caller's
 *     own object comes back, and the popup opens on the first click and closes
 *     on the second;
 *   · `addMarker(marker)` "Add a marker" / `removeMarker(id)` "Remove marker by
 *     ID" — both re-render the marker layer;
 *   · `MapMarker.popup?: string` is the popup content; `label?: string` is the
 *     only other text the doc gives a marker, and the doc's own example pairs
 *     them on one marker;
 *   · `MapMarker.icon?: string` — a documented per-marker field.
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * MATRIX-map-1  `MapMarker.icon` is accepted and ignored.
 *   combo:    markers=icons (one emoji icon, one URL icon), zoom=13
 *   expected: a marker with `icon` renders that icon instead of — or inside —
 *             the default pin, so two markers with different `icon` values do
 *             not draw identically.
 *   actual:   every marker renders the same hard-coded inline `<svg>` pin. No
 *             render path reads `icon`, so the field is inert: an emoji icon,
 *             an image URL and no icon at all produce byte-identical markup.
 *   Pinned with `it.fails` below.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  MARKER_SET_NAMES, MARKER_SETS, combo, comboId, markersOf, makeMap,
  readFacts, popupTextFor, collectEvents, markerAt, clickNode, structureProblems,
  expectClean, removeComponent, wait, SETTLE,
} from './map-support';
import type { MapMarker } from './map-support';

const POPULATED = MARKER_SET_NAMES.filter(name => name !== 'none');

describe('map matrix: markers', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('marker-click toggles the popup', () => {
    for (const set of POPULATED) {
      for (const index of [0, 1]) {
        const c = combo({ markers: set });
        const id = `${comboId(c)}/click-index=${index}`;

        it(`${id}: opens then closes, and hands back the caller's marker`, async () => {
          const markers = markersOf(c);
          if (index >= markers.length) return;
          el = await makeMap(c, markers);
          const seen = collectEvents(el);

          // First click: the documented toggle opens.
          expect(clickNode(markerAt(el, index))).toBe(true);
          await wait(SETTLE);

          const clicks = seen.filter(event => event.type === 'marker-click');
          expect(clicks).toHaveLength(1);
          expect(clicks[0].detail.marker).toBe(markers[index]);
          // A marker click is explicitly NOT a map click.
          expect(seen.filter(event => event.type === 'map-click')).toHaveLength(0);

          const expectedText = popupTextFor(markers[index]);
          const opened = readFacts(el).popups;
          expect(opened[index]).toBe(expectedText);
          // No other marker's popup may open.
          expect(opened.filter((text, i) => i !== index && text !== null)).toEqual([]);

          // Second click: the same toggle closes.
          expect(clickNode(markerAt(el, index))).toBe(true);
          await wait(SETTLE);
          expect(readFacts(el).popups.every(text => text === null)).toBe(true);
          expect(seen.filter(event => event.type === 'marker-click')).toHaveLength(2);
        });
      }
    }
  });

  describe('addMarker', () => {
    for (const set of ['none', 'bare', 'doc', 'many', 'coincident', 'extremes'] as const) {
      const c = combo({ markers: set });

      it(`${comboId(c)}: appends one marker to the layer`, async () => {
        const markers = markersOf(c);
        el = await makeMap(c, markers);
        expect(readFacts(el).markerCount).toBe(markers.length);

        const added: MapMarker = { id: 'added', lat: 12.34, lng: 56.78, popup: 'Added' };
        el.addMarker(added);
        await wait(SETTLE);

        expect(el.markers).toHaveLength(markers.length + 1);
        expect(el.markers[el.markers.length - 1]).toBe(added);
        expect(readFacts(el).markerCount).toBe(markers.length + 1);
        expectClean(structureProblems(el, c, el.markers), comboId(c));
      });
    }
  });

  describe('removeMarker', () => {
    const CASES: Array<[string, string, number]> = [
      // [marker set, id to remove, expected remaining]
      ['doc', 'nyc', 1],
      ['doc', 'bos', 1],
      ['doc', 'missing', 2],
      ['bare', 'solo', 0],
      ['many', 'm0', 11],
      ['many', 'm11', 11],
      ['coincident', 'c1', 1],
    ];

    for (const [set, id, remaining] of CASES) {
      it(`markers=${set}/removeMarker("${id}"): leaves ${remaining}`, async () => {
        const c = combo({ markers: set as any });
        const markers = markersOf(c);
        el = await makeMap(c, markers);

        el.removeMarker(id);
        await wait(SETTLE);

        expect(el.markers).toHaveLength(remaining);
        expect(el.markers.some((m: MapMarker) => m.id === id)).toBe(false);
        expect(readFacts(el).markerCount).toBe(remaining);
        // Removal never disturbs the surviving markers' identity.
        for (const survivor of el.markers) {
          expect(markers).toContain(survivor);
        }
      });
    }
  });

  // ── MATRIX-map-1 ─────────────────────────────────────────────────────────
  describe('MATRIX-map-1: MapMarker.icon', () => {
    const ICON_CASES: Array<[string, MapMarker[]]> = [
      ['emoji', [{ id: 'a', lat: 0, lng: 0, icon: '🏛️' }]],
      ['url', [{ id: 'a', lat: 0, lng: 0, icon: 'https://example.org/pin.svg' }]],
      ['data-uri', [{ id: 'a', lat: 0, lng: 0, icon: 'data:image/svg+xml,%3Csvg/%3E' }]],
      ['class-name', [{ id: 'a', lat: 0, lng: 0, icon: 'fa-solid fa-star' }]],
    ];

    for (const [shape, markers] of ICON_CASES) {
      it.fails(`icon=${shape}: the marker renders its authored icon`, async () => {
        const c = combo({ markers: 'bare' });
        el = await makeMap(c, markers);
        const withIcon = readFacts(el).markerIconText[0];

        removeComponent(el);
        el = await makeMap(c, [{ id: 'a', lat: 0, lng: 0 }]);
        const withoutIcon = readFacts(el).markerIconText[0];

        expect(withIcon, `icon "${markers[0].icon}" renders the same as no icon`)
          .not.toBe(withoutIcon);
      });
    }

    it('every marker currently draws the same built-in pin', async () => {
      // The observable half of the same finding, stated positively so the file
      // records what IS true today without weakening the claim above.
      const c = combo({ markers: 'icons' });
      el = await makeMap(c, MARKER_SETS.icons());
      const drawn = readFacts(el).markerIconText;
      expect(drawn).toHaveLength(2);
      expect(drawn[0]).toBe(drawn[1]);
      expect(drawn[0]).toContain('<svg');
    });
  });
});
