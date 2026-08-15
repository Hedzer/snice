/**
 * Smoke slice of the snice-location matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/location/`, excluded from
 * the default Vitest include. This file stays collected and buys the marquee:
 *
 *   · one card per documented `mode`, the property that decides what is shown;
 *   · the three documented getters against a fully-addressed fixture;
 *   · the two url-safety rules with teeth — an unlisted scheme must not open,
 *     and exact `''` must fall back to the coordinates;
 *   · the activation contract's core: clickable renders a link, pointer/Enter/
 *     `click()` each emit once, Space does not, and `openMap()` stays silent.
 *
 * Structural assertions route through the matrix's own `locationProblems`
 * oracle. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmountAll, captureEvents, click, key } from '../matrix-utils';
import {
  MODES, CENTRAL_PARK, location, attrsOf, propsOf, comboId, locationProblems, read,
  expectedFullAddress, expectedCoordinates, type LocationCombo,
} from './location-support';

const SAFE = 'https://maps.example.com/place/1';

const mountLocation = (c: LocationCombo) =>
  mount<HTMLElement>('snice-location', attrsOf(c), '', propsOf(c));

describe('location matrix smoke', () => {
  let opened: any[];

  beforeEach(() => {
    opened = [];
    vi.stubGlobal('open', (url: any) => { opened.push(url); return null; });
  });

  afterEach(() => { vi.unstubAllGlobals(); unmountAll(); });

  for (const mode of MODES) {
    const c = location({ ...CENTRAL_PARK, mode });
    it(comboId(c), async () => {
      const el = await mountLocation(c);
      expect(locationProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('the three getters agree with the authored location', async () => {
    const c = location({ ...CENTRAL_PARK });
    const el = await mountLocation(c);
    expect((el as any).getFullAddress()).toBe(expectedFullAddress(c));
    expect((el as any).getCoordinates()).toEqual(expectedCoordinates(c));
    expect((el as any).getData().name).toBe(CENTRAL_PARK.name);
  });

  it('an unlisted scheme never opens', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: 'javascript:alert(1)', clickable: true });
    const el = await mountLocation(c);
    const recorder = captureEvents(el, ['location-click']);

    click(read(el).base);

    expect(recorder.types(), 'the activation event must still fire').toEqual(['location-click']);
    expect(opened, 'an unsafe destination was opened').toEqual([]);
  });

  it("exact '' falls back to the coordinates", async () => {
    const el = await mountLocation(location({ ...CENTRAL_PARK }));
    (el as any).openMap();
    expect(String(opened[0])).toContain(`${CENTRAL_PARK.latitude},${CENTRAL_PARK.longitude}`);
  });

  it('clickable renders a link and every activation path emits once', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: SAFE, clickable: true });
    const el = await mountLocation(c);
    expect(read(el).role).toBe('link');
    expect(read(el).tabindex).toBe('0');

    const recorder = captureEvents(el, ['location-click']);
    click(read(el).base);
    key(read(el).base, 'Enter');
    el.click();
    key(read(el).base, ' ');

    expect(recorder.types()).toEqual(['location-click', 'location-click', 'location-click']);
    expect(opened).toEqual([SAFE, SAFE, SAFE]);
  });

  it('clickable=false is inert and openMap() stays silent', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: SAFE });
    const el = await mountLocation(c);
    const recorder = captureEvents(el, ['location-click']);

    click(read(el).base);
    el.click();
    (el as any).openMap();

    expect(recorder.types()).toEqual([]);
    expect(opened, 'openMap() ignores clickable and opens anyway').toEqual([SAFE]);
  });
});
