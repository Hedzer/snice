/**
 * Matrix slice LOCATION / URL SAFETY — the § URL Safety contract, rule by rule.
 *
 * The doc states these as requirements, so they are asserted as requirements:
 *
 *   · `mapUrl`/`map-url` is checked by core `isSafeUrl()` before BOTH
 *     `window.open()` and iframe rendering.
 *   · Valid relative references and the default safe protocols (`http:`,
 *     `https:`, `mailto:`, `tel:`) are accepted. Malformed URLs,
 *     control-character obfuscation, and unlisted schemes are rejected.
 *   · Non-string runtime `mapUrl` values fail closed without coercion.
 *   · Exact `''` generates a URL from coordinates first, then the encoded full
 *     address. Whitespace-only authored values are invalid and do not trigger
 *     fallback.
 *   · Successful opens use `'_blank'` with `'noopener'`; the opened page
 *     receives no `window.opener`.
 *
 * Dimensions: 16 url shapes x 2 (open path / embed path) plus the fallback
 * ladder and the non-string cases.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmountAll, part } from '../matrix-utils';
import {
  CENTRAL_PARK, location, attrsOf, propsOf, locationProblems, read,
  isSafeAuthoredUrl, expectedFullAddress, type LocationCombo,
} from './location-support';

const CONTROL_CHAR = 'https://example.com/\u000bevil';
const CONTROL_CHAR_LEADING = 'java\u0009script:alert(1)';

/** Every url shape the doc's acceptance rule distinguishes. */
const URL_SHAPES: Array<[string, string, boolean]> = [
  ['https', 'https://maps.example.com/place/1', true],
  ['http', 'http://maps.example.com/place/1', true],
  ['mailto', 'mailto:maps@example.com', true],
  ['tel', 'tel:+15551234567', true],
  ['relative path', '/maps/place/1', true],
  ['relative document', 'maps/place/1', true],
  ['query only', '?q=central+park', true],
  ['hash only', '#map', true],
  ['javascript scheme', 'javascript:alert(1)', false],
  ['data scheme', 'data:text/html,<script>alert(1)</script>', false],
  ['file scheme', 'file:///etc/passwd', false],
  ['ftp scheme', 'ftp://example.com/map', false],
  ['vbscript scheme', 'vbscript:msgbox(1)', false],
  ['control character', CONTROL_CHAR, false],
  ['control-character obfuscated scheme', CONTROL_CHAR_LEADING, false],
  ['whitespace only', '   ', false],
];

const mountLocation = (c: LocationCombo) =>
  mount<HTMLElement>('snice-location', attrsOf(c), '', propsOf(c));

describe('location matrix: url safety', () => {
  let opened: Array<{ url: any; target: any; features: any }>;

  beforeEach(() => {
    opened = [];
    vi.stubGlobal('open', (url: any, target: any, features: any) => {
      opened.push({ url, target, features });
      return null;
    });
  });

  afterEach(() => { vi.unstubAllGlobals(); unmountAll(); });

  // ── The acceptance rule, on the open path ────────────────────────────────

  for (const [id, mapUrl, safe] of URL_SHAPES) {
    it(`openMap(): ${id} is ${safe ? 'accepted' : 'rejected'}`, async () => {
      // A location with no coordinates and no address, so the ONLY possible
      // destination is the authored `mapUrl` — nothing can be masked by a
      // fallback.
      const c = location({ name: 'Somewhere', mapUrl });
      const el = await mountLocation(c);

      (el as any).openMap();

      expect(isSafeAuthoredUrl(mapUrl), `${id}: the doc's own rule`).toBe(safe);
      if (safe) {
        expect(opened.map(o => o.url), id).toEqual([mapUrl]);
        expect(opened[0].target, 'a successful open must use _blank').toBe('_blank');
        expect(String(opened[0].features), 'a successful open must pass noopener').toContain('noopener');
      } else {
        expect(opened, `${id} opened "${JSON.stringify(opened[0]?.url)}"`).toEqual([]);
      }
    });
  }

  // ── The same rule, on the embed path ─────────────────────────────────────

  for (const [id, mapUrl, safe] of URL_SHAPES) {
    it(`showMap: ${id} is ${safe ? 'embedded' : 'not embedded'}`, async () => {
      const c = location({ name: 'Somewhere', mapUrl, showMap: true });
      const el = await mountLocation(c);

      const map = part(el, 'map');
      if (safe) {
        expect(map, `${id}: no map embedded for a safe url`).not.toBeNull();
        expect(read(el).iframeSrc, id).toBe(mapUrl);
      } else {
        expect(map, `${id}: an unsafe url was embedded ("${read(el).iframeSrc}")`).toBeNull();
      }
      expect(locationProblems(el, c), id).toEqual([]);
    });
  }

  // ── Non-string runtime values fail closed, without coercion ──────────────

  for (const [id, value] of [
    ['number', 123],
    ['null', null],
    ['undefined', undefined],
    ['object', { toString: () => 'https://evil.example.com' }],
    ['array', ['https://evil.example.com']],
    ['boolean', true],
  ] as Array<[string, unknown]>) {
    it(`a ${id} mapUrl fails closed`, async () => {
      const c = location({ name: 'Somewhere' });
      const el = await mountLocation(c);
      (el as any).mapUrl = value;
      await (el as any).rendered;

      (el as any).openMap();

      expect(opened, `a ${id} mapUrl was coerced and opened`).toEqual([]);
    });
  }

  it('an object mapUrl is never stringified into a destination', async () => {
    // "without coercion" is the load-bearing half: a `toString()` that returns a
    // perfectly safe https url must still not become the destination.
    const c = location({ ...CENTRAL_PARK, showMap: true });
    const el = await mountLocation(c);
    (el as any).mapUrl = { toString: () => 'https://evil.example.com' };
    await (el as any).rendered;

    (el as any).openMap();

    expect(opened).toEqual([]);
    expect(read(el).iframeSrc ?? '').not.toContain('evil.example.com');
  });

  // ── The documented fallback ladder ───────────────────────────────────────

  it("exact '' falls back to the coordinates first", async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: '' });
    const el = await mountLocation(c);

    (el as any).openMap();

    expect(opened).toHaveLength(1);
    expect(String(opened[0].url), 'the generated url does not carry the coordinates')
      .toContain(`${CENTRAL_PARK.latitude},${CENTRAL_PARK.longitude}`);
  });

  it("exact '' falls back to the encoded full address when there are no coordinates", async () => {
    const c = location({ ...CENTRAL_PARK, latitude: '', longitude: '', mapUrl: '' });
    const el = await mountLocation(c);

    (el as any).openMap();

    expect(opened).toHaveLength(1);
    expect(String(opened[0].url), 'the address was not encoded into the generated url')
      .toContain(encodeURIComponent(expectedFullAddress(c)));
  });

  it("exact '' with neither coordinates nor address opens nothing", async () => {
    const c = location({ name: 'Nameless', mapUrl: '' });
    const el = await mountLocation(c);

    (el as any).openMap();

    expect(opened).toEqual([]);
  });

  it('a whitespace-only mapUrl is invalid and does NOT fall back', async () => {
    // The doc singles this out: whitespace is not `''`, so the fallback ladder
    // is never reached and the invalid value simply fails.
    const c = location({ ...CENTRAL_PARK, mapUrl: '   ' });
    const el = await mountLocation(c);

    (el as any).openMap();

    expect(opened, 'a whitespace mapUrl fell back to a generated destination').toEqual([]);
  });

  it('a whitespace-only mapUrl embeds nothing either', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: '   ', showMap: true });
    const el = await mountLocation(c);

    expect(part(el, 'map'), `embedded "${read(el).iframeSrc}"`).toBeNull();
  });

  it('an authored safe mapUrl wins over the generated fallback', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: 'https://maps.example.com/custom' });
    const el = await mountLocation(c);

    (el as any).openMap();

    expect(opened.map(o => o.url)).toEqual(['https://maps.example.com/custom']);
  });
});
