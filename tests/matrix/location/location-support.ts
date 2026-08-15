/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-location matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/location.md` is unusually explicit — it carries a
 * "URL Safety" section and an "Activation Contract" section written as rules.
 * Those rules ARE the oracle; nothing here is derived from observed output.
 *
 * Display (§ Properties, § CSS Parts):
 *   · `mode: 'full' | 'compact' | 'coordinates' | 'address'`. The doc's own
 *     example labels `mode="coordinates"` as "Coordinates only", and `address`
 *     names the postal half; `full` and `compact` are the two that show both.
 *     So: name+address show in full/compact/address, coordinates show in
 *     full/compact/coordinates.
 *   · `showIcon` (default true) gates the `icon` part; the `icon` slot overrides
 *     the `icon`/`iconImage` properties.
 *   · `showMap` gates the `map` part — and only a RESOLVED, SAFE url can be
 *     embedded, per the URL Safety section.
 *   · Parts: `base`, `icon`, `content`, `map`.
 *
 * Methods (§ Methods):
 *   · `getData()` -> `LocationData`
 *   · `getCoordinates()` -> `{ latitude, longitude } | null`
 *   · `getFullAddress()` -> `string`
 *   · `openMap()` — "Validates and opens the resolved map URL in an isolated
 *     new tab; does not emit `location-click`"
 *
 * URL safety (§ URL Safety), asserted verbatim:
 *   · `isSafeUrl()` gates both `window.open()` and the iframe.
 *   · Relative references and `http: https: mailto: tel:` are accepted;
 *     malformed URLs, control-character obfuscation, and unlisted schemes are
 *     rejected.
 *   · Non-string runtime values fail closed without coercion.
 *   · EXACT `''` falls back to coordinates first, then the encoded full
 *     address. Whitespace-only authored values are invalid and do NOT fall back.
 *   · A successful open uses `'_blank'` with `'noopener'`.
 *
 * Activation (§ Activation Contract), asserted verbatim:
 *   · `clickable=true` renders the internal base with `role="link"` and
 *     `tabindex="0"`.
 *   · Pointer, Enter, and `element.click()` each emit ONE `location-click`,
 *     then attempt safe navigation.
 *   · Space and unrelated keys do not activate.
 *   · An unsafe/missing destination still emits, but never opens.
 *   · `openMap()` ignores `clickable` and emits nothing.
 *   · `clickable=false` removes the role and tab stop and makes every
 *     activation path inert.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/location/snice-location';
import type {
  LocationData, LocationDisplayMode,
} from '../../../packages/components/src/location/snice-location.types';

export type { LocationData, LocationDisplayMode };

// ── Documented value sets and defaults ──────────────────────────────────────

export const MODES: readonly LocationDisplayMode[] = ['full', 'compact', 'coordinates', 'address'];
export const DEFAULT_MODE: LocationDisplayMode = 'full';
export const DEFAULT_ICON = '📍';

/** Modes that show the postal half — everything but "coordinates only". */
export const SHOWS_ADDRESS: readonly LocationDisplayMode[] = ['full', 'compact', 'address'];
/** Modes that show the coordinate pair. */
export const SHOWS_COORDINATES: readonly LocationDisplayMode[] = ['full', 'compact', 'coordinates'];

/** The documented order `getFullAddress()` composes its parts in. */
export const ADDRESS_FIELDS = ['address', 'city', 'state', 'zipCode', 'country'] as const;

export interface LocationCombo {
  mode: LocationDisplayMode;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number | string;
  longitude: number | string;
  showMap: boolean;
  showIcon: boolean;
  icon: string;
  iconImage: string;
  mapUrl: string;
  clickable: boolean;
}

/** Every documented property at its documented default. */
export const DEFAULTS: LocationCombo = {
  mode: DEFAULT_MODE,
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  latitude: '',
  longitude: '',
  showMap: false,
  showIcon: true,
  icon: DEFAULT_ICON,
  iconImage: '',
  mapUrl: '',
  clickable: false,
};

export const location = (overrides: Partial<LocationCombo> = {}): LocationCombo => ({
  ...DEFAULTS,
  ...overrides,
});

/** A fully-addressed fixture: Central Park, from the doc's own example. */
export const CENTRAL_PARK: Partial<LocationCombo> = {
  name: 'Central Park',
  address: 'Central Park',
  city: 'New York',
  state: 'NY',
  zipCode: '10024',
  country: 'USA',
  latitude: 40.7829,
  longitude: -73.9654,
};

// ── Mounting ────────────────────────────────────────────────────────────────

/** Documented attribute names. `zip-code`, `show-map`, `show-icon`, `icon-image`, `map-url`. */
export function attrsOf(c: LocationCombo): Record<string, any> {
  const attrs: Record<string, any> = { mode: c.mode };
  if (c.name) attrs.name = c.name;
  if (c.address) attrs.address = c.address;
  if (c.city) attrs.city = c.city;
  if (c.state) attrs.state = c.state;
  if (c.country) attrs.country = c.country;
  if (c.zipCode) attrs['zip-code'] = c.zipCode;
  if (c.latitude !== '') attrs.latitude = String(c.latitude);
  if (c.longitude !== '') attrs.longitude = String(c.longitude);
  if (c.showMap) attrs['show-map'] = true;
  if (c.icon !== DEFAULT_ICON) attrs.icon = c.icon;
  if (c.iconImage) attrs['icon-image'] = c.iconImage;
  if (c.mapUrl) attrs['map-url'] = c.mapUrl;
  if (c.clickable) attrs.clickable = true;
  return attrs;
}

/** `showIcon` defaults to TRUE, so its false half must cross the property channel. */
export const propsOf = (c: LocationCombo): Record<string, any> =>
  (c.showIcon ? {} : { showIcon: false });

export const comboId = (c: LocationCombo): string =>
  `${c.mode} name=${!!c.name} address=${!!c.address} coords=${c.latitude !== '' && c.longitude !== ''}`
  + ` icon=${c.showIcon} map=${c.showMap} clickable=${c.clickable}`;

// ── Documented derivations ──────────────────────────────────────────────────

/** The documented composition of `getFullAddress()`. */
export const expectedFullAddress = (c: LocationCombo): string =>
  ADDRESS_FIELDS.map(field => c[field] as string).filter(Boolean).join(', ');

/** The documented result of `getCoordinates()`. */
export function expectedCoordinates(c: LocationCombo): { latitude: number; longitude: number } | null {
  const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(c.latitude);
  const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(c.longitude);
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { latitude: lat, longitude: lng };
}

/**
 * Whether a destination exists at all, per the URL Safety section: an authored
 * `mapUrl` that passes `isSafeUrl`, or — for EXACTLY `''` — a generated one from
 * the coordinates, then from the full address.
 */
export function expectsDestination(c: LocationCombo): boolean {
  if (c.mapUrl === '') return !!expectedCoordinates(c) || expectedFullAddress(c) !== '';
  return isSafeAuthoredUrl(c.mapUrl);
}

/**
 * The documented acceptance rule, restated: control characters reject outright;
 * a relative reference is accepted; an absolute URL is accepted only for the
 * four listed schemes; anything unparseable is rejected.
 */
export function isSafeAuthoredUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;            // fails closed, no coercion
  // "control-character obfuscation … rejected"
  if (value === '' || /[\u0000-\u001f\u007f]/.test(value)) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;                              // whitespace-only is invalid
  try {
    const parsed = new URL(trimmed, 'http://__snice-relative.invalid/');
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
    const isNetworkPath = /^[\\/]{2}/.test(trimmed);
    if (!hasScheme && !isNetworkPath) return true;
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ── Reading ─────────────────────────────────────────────────────────────────

export interface Reading {
  base: HTMLElement | null;
  iconPart: HTMLElement | null;
  content: HTMLElement | null;
  mapPart: HTMLElement | null;
  iframeSrc: string | null;
  role: string | null;
  tabindex: string | null;
  nameText: string | null;
  addressText: string | null;
  coordinatesText: string | null;
  iconText: string;
  iconImageSrc: string | null;
  slotName: string | null;
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  const base = root.querySelector<HTMLElement>('.location');
  const iconPart = root.querySelector<HTMLElement>('.icon');
  const map = part(el, 'map');
  const iframe = map?.querySelector('iframe') ?? null;
  const nameNode = root.querySelector('.name');
  const addressNode = root.querySelector('.address');
  const coordsNode = root.querySelector('.coordinates');
  const iconImage = iconPart?.querySelector('img') ?? null;
  return {
    base,
    iconPart,
    content: root.querySelector<HTMLElement>('.content'),
    mapPart: map,
    iframeSrc: iframe ? iframe.getAttribute('src') : null,
    role: base?.getAttribute('role') ?? null,
    tabindex: base?.getAttribute('tabindex') ?? null,
    nameText: nameNode ? text(nameNode) : null,
    addressText: addressNode ? text(addressNode) : null,
    coordinatesText: coordsNode ? text(coordsNode) : null,
    iconText: text(iconPart),
    iconImageSrc: iconImage ? iconImage.getAttribute('src') : null,
    slotName: iconPart?.querySelector('slot')?.getAttribute('name') ?? null,
  };
}

/** The numeric pair a rendered coordinate line reports, whatever its spelling. */
export function parseCoordinateText(rendered: string | null): { latitude: number; longitude: number } | null {
  if (!rendered) return null;
  const match = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/.exec(rendered);
  return match ? { latitude: Number(match[1]), longitude: Number(match[2]) } : null;
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** Every documented consequence of `c`, as a problem list. */
export function locationProblems(el: HTMLElement, c: LocationCombo): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── Parts ────────────────────────────────────────────────────────────────
  if (!r.base || !part(el, 'base')) say('no [part="base"] container');
  if (!part(el, 'content')) say('no [part="content"] area');

  // ── showIcon gates the icon part ─────────────────────────────────────────
  if (c.showIcon) {
    if (!r.iconPart) say('showIcon is true but no icon region is rendered');
    else if (r.slotName !== 'icon') say('the icon region exposes no `icon` slot for custom content');
  } else if (r.iconPart) {
    say('showIcon is false but an icon region is rendered');
  }

  if (c.showIcon && r.iconPart) {
    if (c.iconImage) {
      // `iconImage` names an image; the doc lists it beside `icon` as the pair
      // the `icon` slot overrides, so it renders as an image source.
      if (r.iconImageSrc !== c.iconImage) say(`iconImage "${c.iconImage}" not rendered (src "${r.iconImageSrc}")`);
    } else if (c.icon && !r.iconText.includes(c.icon) && r.iconImageSrc === null) {
      say(`icon "${c.icon}" is not in the rendered icon region ("${r.iconText}")`);
    }
  }

  // ── mode decides which of the two halves is shown ────────────────────────
  const showsAddress = SHOWS_ADDRESS.includes(c.mode);
  const showsCoordinates = SHOWS_COORDINATES.includes(c.mode);
  const fullAddress = expectedFullAddress(c);
  const coords = expectedCoordinates(c);

  const wantName = showsAddress && c.name !== '';
  if (wantName) {
    if (r.nameText !== c.name) say(`mode "${c.mode}": name "${r.nameText}" != "${c.name}"`);
  } else if (r.nameText !== null) {
    say(`mode "${c.mode}": name "${r.nameText}" rendered when it should not be`);
  }

  const wantAddress = showsAddress && fullAddress !== '';
  if (wantAddress) {
    if (r.addressText !== fullAddress) say(`mode "${c.mode}": address "${r.addressText}" != "${fullAddress}"`);
  } else if (r.addressText !== null) {
    say(`mode "${c.mode}": address "${r.addressText}" rendered when it should not be`);
  }

  const wantCoordinates = showsCoordinates && !!coords;
  if (wantCoordinates) {
    const shown = parseCoordinateText(r.coordinatesText);
    if (!shown) say(`mode "${c.mode}": no coordinate pair rendered ("${r.coordinatesText}")`);
    else if (Math.abs(shown.latitude - coords!.latitude) > 1e-6
      || Math.abs(shown.longitude - coords!.longitude) > 1e-6) {
      say(`mode "${c.mode}": coordinates "${r.coordinatesText}" != ${JSON.stringify(coords)}`);
    }
  } else if (r.coordinatesText !== null) {
    say(`mode "${c.mode}": coordinates "${r.coordinatesText}" rendered when they should not be`);
  }

  // ── showMap gates the map part, and only a safe url may be embedded ──────
  const wantMap = c.showMap && expectsDestination(c);
  if (wantMap && !r.mapPart) say('showMap with a resolvable safe url but no [part="map"]');
  if (!wantMap && r.mapPart) {
    say(`a [part="map"] is rendered though showMap=${c.showMap}`
      + ` and destination=${expectsDestination(c)} (src "${r.iframeSrc}")`);
  }
  if (r.iframeSrc !== null && !isSafeAuthoredUrl(r.iframeSrc)) {
    say(`the embedded map src "${r.iframeSrc}" is not a safe url`);
  }

  // ── Activation contract: role and tab stop ───────────────────────────────
  if (c.clickable) {
    if (r.role !== 'link') say(`clickable=true but the base role is "${r.role}", expected "link"`);
    if (r.tabindex !== '0') say(`clickable=true but tabindex is "${r.tabindex}", expected "0"`);
  } else {
    if (r.role !== null) say(`clickable=false but the base carries role="${r.role}"`);
    if (r.tabindex !== null) say(`clickable=false but the base carries tabindex="${r.tabindex}"`);
  }

  // ── Methods report the same location the card displays ───────────────────
  const data = (el as any).getData() as LocationData;
  const wantData: LocationData = {
    name: c.name, address: c.address, city: c.city, state: c.state,
    country: c.country, zipCode: c.zipCode,
    latitude: typeof c.latitude === 'number' ? c.latitude : parseFloat(c.latitude),
    longitude: typeof c.longitude === 'number' ? c.longitude : parseFloat(c.longitude),
  };
  for (const key of Object.keys(wantData) as Array<keyof LocationData>) {
    const got = data[key];
    const want = wantData[key];
    const same = Object.is(got, want)
      || (typeof got === 'number' && typeof want === 'number' && Number.isNaN(got) && Number.isNaN(want));
    if (!same) say(`getData().${key} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }

  const gotCoords = (el as any).getCoordinates();
  if (JSON.stringify(gotCoords) !== JSON.stringify(coords)) {
    say(`getCoordinates() is ${JSON.stringify(gotCoords)}, expected ${JSON.stringify(coords)}`);
  }

  const gotAddress = (el as any).getFullAddress();
  if (gotAddress !== fullAddress) {
    say(`getFullAddress() is "${gotAddress}", expected "${fullAddress}"`);
  }

  return problems;
}
