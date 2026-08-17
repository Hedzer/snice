/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-map feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is transcribed from `docs/ai/components/map.md` and
 * `packages/components/src/map/snice-map.types.ts`.
 *
 * The documented surface:
 *
 *   Summary      "Interactive slippy map using OpenStreetMap tiles with
 *                markers, popups, drag panning, scroll zoom."
 *   Properties   center: MapCenter = { lat: 51.505, lng: -0.09 }   (JS only)
 *                zoom: number = 13
 *                minZoom: number = 1   (attr min-zoom)
 *                maxZoom: number = 18  (attr max-zoom)
 *                markers: MapMarker[] = []                          (JS only)
 *                tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
 *   Methods      setCenter(lat, lng)      "Pan to coordinates"
 *                setZoom(zoom)            "Set zoom (clamped to min/max)"
 *                addMarker(marker)        "Add a marker"
 *                removeMarker(id)         "Remove marker by ID"
 *                fitBounds(markers?)      "Auto-zoom/center to fit markers
 *                                          (defaults to all)"
 *   Events       map-click    { lat, lng }  "(click on map, not marker)"
 *                marker-click { marker }    "(also toggles popup)"
 *                map-move     { center, zoom } "(after drag pan)"
 *                map-zoom     { zoom }      "(zoom level changed)"
 *   Parts        base, tiles, markers, controls
 *
 * ── The tile oracle ────────────────────────────────────────────────────────
 *
 * "slippy map using OpenStreetMap tiles" plus the `{z}/{x}/{y}` template names
 * a public, versioned specification — the OSM slippy-map tilename scheme. The
 * conversion below is written from that specification, not from the component:
 *
 *     n = 2^zoom
 *     x = (lng + 180) / 360 * n
 *     y = (1 - ln(tan(lat) + sec(lat)) / pi) / 2 * n
 *
 * so a tile URL this oracle predicts is a claim about the DOCUMENTED tile
 * service, and a component that emitted different tiles would be pointing its
 * users at the wrong part of the world.
 *
 * Findings raised against this component:
 *
 *   MATRIX-map-1  markers.test.ts — `MapMarker.icon?: string` is a documented
 *                 field that no render path reads; every marker draws the same
 *                 built-in pin.
 *   MATRIX-map-2  fitbounds.test.ts — `fitBounds()` changes the zoom level and
 *                 emits no `map-zoom`, though the doc defines that event as
 *                 "zoom level changed" without qualification.
 */
import { expect } from 'vitest';
import {
  mount, sr, all, wait, removeComponent, SETTLE, Problems, expectClean,
} from '../matrix-kit';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/map/snice-map';
import type { MapMarker, MapCenter } from '../../../packages/components/src/map/snice-map.types';

export { wait, removeComponent, expectClean, Problems, SETTLE, expect };
export type { MapMarker, MapCenter };

// ── The documented tile scheme ──────────────────────────────────────────────

/** OSM slippy-map tilenames: fractional tile coordinates for a lat/lng. */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  };
}

/** The template substitution the documented default `tileUrl` implies. */
export function tileUrlFor(template: string, x: number, y: number, z: number): string {
  return template
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(z));
}

export const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// ── Documented dimensions ───────────────────────────────────────────────────

/** Zoom levels spanning the documented default bounds (min 1 … max 18). */
export const ZOOMS = [1, 3, 8, 13, 18] as const;

/** Tile templates. Every one keeps the three documented placeholders. */
export const TILE_TEMPLATES: Record<string, string> = {
  default: DEFAULT_TILE_URL,
  'no-scheme': '//tiles.example.org/{z}/{x}/{y}.png',
  reordered: 'https://tiles.example.org/tile?x={x}&y={y}&z={z}',
  'path-only': '/local-tiles/{z}/{x}/{y}.webp',
  subdomain: 'https://a.tile.example.org/{z}/{x}/{y}@2x.png',
};

/** Marker sets, named by the documented field each one exercises. */
export const MARKER_SETS = {
  none: (): MapMarker[] => [],

  /** The doc's own Basic Usage array, verbatim. */
  doc: (): MapMarker[] => [
    { id: 'nyc', lat: 40.7128, lng: -74.006, label: 'NYC', popup: 'New York City' },
    { id: 'bos', lat: 42.3601, lng: -71.0589, popup: 'Boston' },
  ],

  /** One marker, only the required fields. */
  bare: (): MapMarker[] => [
    { id: 'solo', lat: 51.505, lng: -0.09 },
  ],

  /** `label` present, `popup` absent — the documented fallback pairing. */
  'label-only': (): MapMarker[] => [
    { id: 'l1', lat: 48.8566, lng: 2.3522, label: 'Paris' },
    { id: 'l2', lat: 52.52, lng: 13.405, label: 'Berlin' },
  ],

  /** `popup` present, `label` absent. */
  'popup-only': (): MapMarker[] => [
    { id: 'p1', lat: 35.6762, lng: 139.6503, popup: 'Tokyo' },
  ],

  /** `icon` present — the documented field MATRIX-map-1 is about. */
  icons: (): MapMarker[] => [
    { id: 'i1', lat: 41.9028, lng: 12.4964, icon: '🏛️', label: 'Rome' },
    { id: 'i2', lat: 55.7558, lng: 37.6173, icon: 'https://example.org/pin.svg', popup: 'Moscow' },
  ],

  /** Coordinates at the documented edges of the Mercator projection. */
  extremes: (): MapMarker[] => [
    { id: 'ne', lat: 85, lng: 180, popup: 'NE corner' },
    { id: 'sw', lat: -85, lng: -180, popup: 'SW corner' },
    { id: 'null-island', lat: 0, lng: 0, popup: 'Null Island' },
  ],

  /** Many markers, to keep the marker layer honest at scale. */
  many: (): MapMarker[] => Array.from({ length: 12 }, (_, i) => ({
    id: `m${i}`,
    lat: 50 + i * 0.5,
    lng: -5 + i * 0.75,
    popup: `Marker ${i}`,
  })),

  /** Two markers at the SAME coordinates — the layer must still render both. */
  coincident: (): MapMarker[] => [
    { id: 'c1', lat: 51.505, lng: -0.09, popup: 'First' },
    { id: 'c2', lat: 51.505, lng: -0.09, popup: 'Second' },
  ],

  /** A tight cluster and one far outlier — the fitBounds spread cases. */
  spread: (): MapMarker[] => [
    { id: 's1', lat: 51.5, lng: -0.1, popup: 'A' },
    { id: 's2', lat: 51.51, lng: -0.09, popup: 'B' },
    { id: 's3', lat: 40.7, lng: -74.0, popup: 'C' },
  ],
} satisfies Record<string, () => MapMarker[]>;

export type MarkerSetName = keyof typeof MARKER_SETS;
export const MARKER_SET_NAMES = Object.keys(MARKER_SETS) as MarkerSetName[];

// ── Combos ──────────────────────────────────────────────────────────────────

export interface MapCombo {
  markers: MarkerSetName;
  zoom: number;
  template: keyof typeof TILE_TEMPLATES;
  center: MapCenter;
  minZoom: number;
  maxZoom: number;
}

/** The documented defaults. */
export const DEFAULT_CENTER: MapCenter = { lat: 51.505, lng: -0.09 };

export function combo(overrides: Partial<MapCombo> = {}): MapCombo {
  return {
    markers: 'doc',
    zoom: 13,
    template: 'default',
    center: DEFAULT_CENTER,
    minZoom: 1,
    maxZoom: 18,
    ...overrides,
  };
}

export function comboId(c: MapCombo): string {
  return `markers=${c.markers}/zoom=${c.zoom}/tiles=${c.template}`
    + `/center=${c.center.lat},${c.center.lng}/bounds=${c.minZoom}-${c.maxZoom}`;
}

export function markersOf(c: MapCombo): MapMarker[] {
  return MARKER_SETS[c.markers]();
}

/**
 * Mount one combo. `zoom`, `min-zoom`, `max-zoom` and `tile-url` cross the
 * ATTRIBUTE channel (the doc writes them as attributes on `<snice-map>`);
 * `center` and `markers` are documented "JS only" and cross the property one.
 */
export async function makeMap(c: MapCombo, markers = markersOf(c)): Promise<HTMLElement> {
  const el = await mount<HTMLElement>('snice-map', {
    'zoom': c.zoom,
    'min-zoom': c.minZoom,
    'max-zoom': c.maxZoom,
    'tile-url': TILE_TEMPLATES[c.template],
  }, {
    center: c.center,
    markers,
  });
  await wait(SETTLE);
  return el;
}

// ── Reading the render ──────────────────────────────────────────────────────

export const DOCUMENTED_PARTS = ['base', 'tiles', 'markers', 'controls'] as const;

const CLASS = {
  tile: '.map-tile',
  tileImg: '.map-tile img',
  marker: '.map-marker',
  pin: '.map-marker-pin',
  popup: '.map-popup',
  controlButton: '.map-control-btn',
};

export interface MapFacts {
  presentParts: string[];
  tileSrcs: string[];
  markerCount: number;
  /** Popup text per marker index, or null where no popup is open. */
  popups: Array<string | null>;
  /** Whatever each marker renders as its icon, for MATRIX-map-1. */
  markerIconText: string[];
  controlLabels: string[];
}

export function readFacts(el: HTMLElement): MapFacts {
  const markers = all<HTMLElement>(el, CLASS.marker);
  return {
    presentParts: DOCUMENTED_PARTS.filter(name => exactPart(el, name) !== null),
    tileSrcs: all<HTMLImageElement>(el, CLASS.tileImg).map(img => img.getAttribute('src') ?? ''),
    markerCount: markers.length,
    popups: markers.map(marker => {
      const popup = marker.querySelector(CLASS.popup);
      return popup ? (popup.textContent ?? '').trim() : null;
    }),
    markerIconText: markers.map(marker => (marker.querySelector(CLASS.pin)?.innerHTML ?? '').trim()),
    controlLabels: all<HTMLElement>(el, CLASS.controlButton).map(b => (b.textContent ?? '').trim()),
  };
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** Parts, tile layer, marker layer and zoom controls. */
export function structureProblems(el: HTMLElement, c: MapCombo, markers: MapMarker[]): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  for (const name of DOCUMENTED_PARTS) {
    problems.check(facts.presentParts.includes(name), `documented part "${name}" is missing`);
  }

  // "base — Outer map container" holds the other three layers.
  const base = exactPart(el, 'base');
  for (const name of ['tiles', 'markers', 'controls'] as const) {
    const node = exactPart(el, name);
    if (base && node) problems.check(base.contains(node), `\`${name}\` is not inside \`base\``);
  }

  // "markers — Markers layer container": one marker per MapMarker.
  problems.equal(facts.markerCount, markers.length, 'one marker per MapMarker');

  // "controls — Zoom controls container": a zoom in and a zoom out.
  problems.equal(facts.controlLabels, ['+', '-'], 'zoom controls');

  // "tiles — Tile layer container": a slippy map always paints tiles.
  problems.check(facts.tileSrcs.length > 0, 'no tiles rendered in the tile layer');

  return problems;
}

/** Every tile URL is the documented template, fully substituted and in range. */
export function tileProblems(el: HTMLElement, c: MapCombo): Problems {
  const problems = new Problems();
  const template = TILE_TEMPLATES[c.template];
  const srcs = readFacts(el).tileSrcs;
  if (!problems.check(srcs.length > 0, 'no tiles rendered')) return problems;

  const n = 2 ** c.zoom;
  const pattern = new RegExp(
    '^' + template
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace('\\{z\\}', '(\\d+)')
      .replace('\\{x\\}', '(\\d+)')
      .replace('\\{y\\}', '(\\d+)') + '$',
  );
  const order = ['{z}', '{x}', '{y}']
    .map(token => ({ token, at: template.indexOf(token) }))
    .sort((a, b) => a.at - b.at)
    .map(entry => entry.token);

  const seen = new Set<string>();
  for (const src of srcs) {
    if (/\{[xyz]\}/.test(src)) {
      problems.say(`tile src "${src}" still contains an unsubstituted placeholder`);
      continue;
    }
    const match = pattern.exec(src);
    if (!match) {
      problems.say(`tile src "${src}" does not match the template "${template}"`);
      continue;
    }
    const values: Record<string, number> = {};
    order.forEach((token, index) => { values[token] = Number(match[index + 1]); });

    problems.equal(values['{z}'], c.zoom, `tile z for "${src}"`);
    if (!(values['{x}'] >= 0 && values['{x}'] < n)) {
      problems.say(`tile x ${values['{x}']} out of range [0, ${n}) at zoom ${c.zoom}`);
    }
    if (!(values['{y}'] >= 0 && values['{y}'] < n)) {
      problems.say(`tile y ${values['{y}']} out of range [0, ${n}) at zoom ${c.zoom}`);
    }
    // NOT asserted: uniqueness. A slippy map wraps horizontally, so at low
    // zoom — where the whole world is narrower than the viewport — the same
    // tile legitimately paints in more than one column. That repetition is the
    // documented "slippy map" behaviour, not a duplicate render.
    seen.add(src);
  }
  problems.check(seen.size > 0, 'no distinct tiles rendered');

  // The tile the centre falls in must be one of them — otherwise the map is
  // showing somewhere the caller did not ask for.
  const centre = latLngToTile(c.center.lat, c.center.lng, c.zoom);
  const expected = tileUrlFor(template, Math.floor(centre.x), Math.floor(centre.y), c.zoom);
  problems.check(
    srcs.includes(expected),
    `the tile containing center ${c.center.lat},${c.center.lng} ("${expected}") was not rendered`,
  );

  return problems;
}

/**
 * Popups. "marker-click → { marker } (also toggles popup)", and the popup shows
 * the marker's `popup` text — falling back to its `label` when only that is set,
 * since the doc gives `label` no other rendered role.
 */
export function popupTextFor(marker: MapMarker): string | null {
  const content = marker.popup || marker.label || '';
  return content === '' ? null : content;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface SeenEvent { type: string; detail: any }

export function collectEvents(el: HTMLElement, types: string[] = [
  'map-click', 'marker-click', 'map-move', 'map-zoom',
]): SeenEvent[] {
  const seen: SeenEvent[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function markerAt(el: HTMLElement, index: number): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.marker)[index] ?? null;
}

export function zoomInButton(el: HTMLElement): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.controlButton)[0] ?? null;
}

export function zoomOutButton(el: HTMLElement): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.controlButton)[1] ?? null;
}

export function container(el: HTMLElement): HTMLElement | null {
  return sr(el).querySelector('.map-container');
}

export function clickNode(node: Element | null): boolean {
  if (!node) return false;
  node.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}

/** Keydown on the map container — the documented pan/zoom keys. */
export function pressKey(el: HTMLElement, key: string): boolean {
  const node = container(el);
  if (!node) return false;
  node.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  return true;
}

/** A drag pan across the container, which the doc ties to `map-move`. */
export async function dragPan(el: HTMLElement, dx: number, dy: number): Promise<boolean> {
  const node = container(el);
  if (!node) return false;
  node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, clientX: 0, clientY: 0 }));
  node.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, composed: true, clientX: dx, clientY: dy }));
  await wait(SETTLE);
  node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, clientX: dx, clientY: dy }));
  await wait(SETTLE);
  return true;
}

/** The documented clamp: "Set zoom (clamped to min/max)". */
export function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}
