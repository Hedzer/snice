/**
 * Matrix slice MAP / TILES — the documented `tileUrl` template and the
 * OpenStreetMap tile scheme it names.
 *
 * Dimensions:
 *   · template (5) x zoom (5)         = 25 combos
 *   · centre (7) x zoom (3)           = 21 combos
 *   · re-templating transitions (4)   =  4 combos
 *   Total 50.
 *
 * Documented contract (docs/ai/components/map.md):
 *   · `tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'` — three
 *     placeholders, and a custom template must be honoured the same way;
 *   · "Interactive slippy map using OpenStreetMap tiles" — which fixes the tile
 *     numbering to the published OSM slippy-map tilename scheme, so the tile
 *     containing the current `center` at the current `zoom` is a fact this
 *     oracle can compute independently (see map-support.ts) rather than read
 *     off the component;
 *   · every rendered tile carries the CURRENT `zoom` as its z, and x/y within
 *     [0, 2^z) — a tile outside that range does not exist on the service.
 *
 * it.fails policy: nothing pinned; all 50 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  TILE_TEMPLATES, ZOOMS, combo, comboId, makeMap, tileProblems, readFacts,
  latLngToTile, tileUrlFor, expectClean, removeComponent, wait, SETTLE,
} from './map-support';
import type { MapCenter } from './map-support';

const TEMPLATE_NAMES = Object.keys(TILE_TEMPLATES) as Array<keyof typeof TILE_TEMPLATES>;

/** Centres spanning the projection: prime meridian, dateline, both poles. */
const CENTRES: Array<[string, MapCenter]> = [
  ['london', { lat: 51.505, lng: -0.09 }],
  ['nyc', { lat: 40.7128, lng: -74.006 }],
  ['null-island', { lat: 0, lng: 0 }],
  ['dateline-east', { lat: 0, lng: 179.9 }],
  ['dateline-west', { lat: 0, lng: -179.9 }],
  ['far-north', { lat: 84, lng: 20 }],
  ['far-south', { lat: -84, lng: -20 }],
];

describe('map matrix: tiles', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('templates', () => {
    for (const template of TEMPLATE_NAMES) {
      for (const zoom of ZOOMS) {
        const c = combo({ template, zoom });

        it(`${comboId(c)}: every tile substitutes the template`, async () => {
          el = await makeMap(c);
          expectClean(tileProblems(el, c), comboId(c));
        });
      }
    }
  });

  describe('centres', () => {
    for (const [name, center] of CENTRES) {
      for (const zoom of [3, 8, 13]) {
        const c = combo({ center, zoom, markers: 'none' });
        const id = `centre=${name}/zoom=${zoom}`;

        it(`${id}: the tile containing the centre is rendered`, async () => {
          el = await makeMap(c);
          expectClean(tileProblems(el, c), id);

          const tile = latLngToTile(center.lat, center.lng, zoom);
          const expected = tileUrlFor(
            TILE_TEMPLATES.default, Math.floor(tile.x), Math.floor(tile.y), zoom,
          );
          expect(readFacts(el).tileSrcs).toContain(expected);
        });
      }
    }
  });

  describe('re-templating', () => {
    const TRANSITIONS: Array<[keyof typeof TILE_TEMPLATES, keyof typeof TILE_TEMPLATES]> = [
      ['default', 'reordered'],
      ['reordered', 'default'],
      ['default', 'path-only'],
      ['subdomain', 'no-scheme'],
    ];

    for (const [from, to] of TRANSITIONS) {
      const id = `tiles=${from}->${to}`;

      it(`${id}: assigning tileUrl re-points every tile`, async () => {
        const c = combo({ template: from });
        el = await makeMap(c);
        expectClean(tileProblems(el, c), id);

        el.tileUrl = TILE_TEMPLATES[to];
        await wait(SETTLE);

        expectClean(tileProblems(el, combo({ template: to })), id);
        // Nothing from the previous host may survive the change.
        const stale = readFacts(el).tileSrcs
          .filter(src => src.startsWith(TILE_TEMPLATES[from].split('{')[0]) && from !== to);
        expect(stale, `stale ${from} tiles after switching to ${to}`).toEqual([]);
      });
    }
  });
});
