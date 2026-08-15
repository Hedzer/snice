/**
 * Matrix slice LOCATION / DISPLAY — `mode` crossed against the data it selects
 * between, plus the icon and map regions.
 *
 * Dimensions (docs/ai/components/location.md § Properties, § CSS Parts):
 *   mode (4) x name (2) x postal address (2) x coordinates (2) x showIcon (2)
 *   = 64 combos, plus the icon-source cases and the map-region cases.
 *
 * Every case is judged by `locationProblems`, which also re-checks the three
 * documented getters against the same fixture — the card and its API must
 * report the same location.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, part } from '../matrix-utils';
import {
  MODES, CENTRAL_PARK, location, attrsOf, propsOf, comboId, locationProblems,
  read, expectedFullAddress, expectedCoordinates, DEFAULT_ICON,
  type LocationCombo,
} from './location-support';

const mountLocation = (c: LocationCombo, html = '') =>
  mount<HTMLElement>('snice-location', attrsOf(c), html, propsOf(c));

describe('location matrix: display', () => {
  afterEach(() => unmountAll());

  // ── mode x data ──────────────────────────────────────────────────────────

  for (const point of product({
    mode: MODES,
    name: [false, true],
    postal: [false, true],
    coords: [false, true],
    showIcon: [true, false],
  })) {
    const c = location({
      mode: point.mode,
      showIcon: point.showIcon,
      name: point.name ? CENTRAL_PARK.name! : '',
      address: point.postal ? CENTRAL_PARK.address! : '',
      city: point.postal ? CENTRAL_PARK.city! : '',
      state: point.postal ? CENTRAL_PARK.state! : '',
      zipCode: point.postal ? CENTRAL_PARK.zipCode! : '',
      country: point.postal ? CENTRAL_PARK.country! : '',
      latitude: point.coords ? CENTRAL_PARK.latitude! : '',
      longitude: point.coords ? CENTRAL_PARK.longitude! : '',
    });

    it(comboId(c), async () => {
      const el = await mountLocation(c);
      expect(locationProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── getFullAddress() composes exactly the non-empty parts, in order ──────

  const addressShapes: Array<[string, Partial<LocationCombo>]> = [
    ['address only', { address: '123 Main St' }],
    ['city only', { city: 'New York' }],
    ['address + city', { address: '123 Main St', city: 'New York' }],
    ['no zip', { address: '123 Main St', city: 'New York', state: 'NY', country: 'USA' }],
    ['every part', CENTRAL_PARK],
    ['nothing', {}],
  ];

  for (const [id, shape] of addressShapes) {
    it(`getFullAddress(): ${id}`, async () => {
      const c = location({ ...shape, latitude: '', longitude: '' });
      const el = await mountLocation(c);
      expect((el as any).getFullAddress(), id).toBe(expectedFullAddress(c));
      expect(locationProblems(el, c), id).toEqual([]);
    });
  }

  // ── getCoordinates() ─────────────────────────────────────────────────────

  const coordinateShapes: Array<[string, Partial<LocationCombo>]> = [
    ['numeric pair', { latitude: 40.7829, longitude: -73.9654 }],
    ['string pair', { latitude: '40.7829', longitude: '-73.9654' }],
    ['zeroes are coordinates', { latitude: 0, longitude: 0 }],
    ['latitude only', { latitude: 40.7829, longitude: '' }],
    ['longitude only', { latitude: '', longitude: -73.9654 }],
    ['neither', {}],
    ['unparseable', { latitude: 'north', longitude: 'west' }],
  ];

  for (const [id, shape] of coordinateShapes) {
    it(`getCoordinates(): ${id}`, async () => {
      const c = location({ ...shape, mode: 'coordinates' });
      const el = await mountLocation(c);
      expect((el as any).getCoordinates(), id).toEqual(expectedCoordinates(c));
      expect(locationProblems(el, c), id).toEqual([]);
    });
  }

  // ── The icon region ──────────────────────────────────────────────────────

  it('the default icon is the documented pin', async () => {
    const c = location({ ...CENTRAL_PARK });
    const el = await mountLocation(c);
    expect(read(el).iconText).toContain(DEFAULT_ICON);
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('a custom icon replaces the default', async () => {
    const c = location({ ...CENTRAL_PARK, icon: '🏛' });
    const el = await mountLocation(c);
    expect(read(el).iconText).toContain('🏛');
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('iconImage renders an image source', async () => {
    const c = location({ ...CENTRAL_PARK, iconImage: '/icons/park.png' });
    const el = await mountLocation(c);
    expect(read(el).iconImageSrc).toBe('/icons/park.png');
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('the icon slot overrides the icon properties', async () => {
    // Documented under § Slots: "icon - Custom icon content (overrides
    // `icon`/`iconImage` properties)". The slot must therefore exist and carry
    // the author's node, whatever the properties say.
    const c = location({ ...CENTRAL_PARK, icon: '🏛', iconImage: '/icons/park.png' });
    const el = await mountLocation(c, '<span slot="icon" id="custom">business</span>');
    const slot = read(el).iconPart!.querySelector('slot')!;
    const assigned = (slot as HTMLSlotElement).assignedElements?.() ?? [];
    expect(assigned.map(n => n.id), 'the authored icon node was not projected').toEqual(['custom']);
  });

  it('showIcon=false removes the icon region entirely', async () => {
    const c = location({ ...CENTRAL_PARK, showIcon: false });
    const el = await mountLocation(c);
    expect(read(el).iconPart).toBeNull();
    expect(part(el, 'icon')).toBeNull();
    expect(locationProblems(el, c)).toEqual([]);
  });

  // ── The map region ───────────────────────────────────────────────────────

  it('showMap embeds a map for a coordinate pair', async () => {
    const c = location({ ...CENTRAL_PARK, showMap: true });
    const el = await mountLocation(c);
    expect(part(el, 'map'), 'no [part="map"] though coordinates resolve').not.toBeNull();
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('showMap embeds a map for an address with no coordinates', async () => {
    const c = location({ ...CENTRAL_PARK, latitude: '', longitude: '', showMap: true });
    const el = await mountLocation(c);
    expect(part(el, 'map')).not.toBeNull();
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('showMap with nothing to point at embeds nothing', async () => {
    const c = location({ showMap: true });
    const el = await mountLocation(c);
    expect(part(el, 'map'), 'a map was embedded for an empty location').toBeNull();
    expect(locationProblems(el, c)).toEqual([]);
  });

  it('showMap=false never embeds a map', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: 'https://maps.example.com/1' });
    const el = await mountLocation(c);
    expect(part(el, 'map')).toBeNull();
    expect(locationProblems(el, c)).toEqual([]);
  });
});
